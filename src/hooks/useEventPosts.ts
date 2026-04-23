import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import api from '../services/api';
import type { EventPost, PostUpdate, PostStatus, Channel } from '../types';

export function useEventPosts(eventId: string | undefined) {
  return useQuery<EventPost[]>({
    queryKey: ['event-posts', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('go_posts')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EventPost[];
    },
    enabled: !!eventId,
    staleTime: 30_000,
  });
}

export function useCapturePosts(captureId: string | undefined) {
  return useQuery<EventPost[]>({
    queryKey: ['event-posts', 'capture', captureId],
    queryFn: async () => {
      if (!captureId) return [];

      const { data, error } = await supabase
        .from('go_posts')
        .select('*')
        .eq('capture_id', captureId)
        .order('channel');

      if (error) throw error;
      return (data || []) as EventPost[];
    },
    enabled: !!captureId,
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: PostUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('go_posts')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return data as EventPost;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['event-posts', data.event_id] });
      qc.invalidateQueries({ queryKey: ['event-posts', 'capture', data.capture_id] });
    },
  });
}

export function usePublishPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      // Fetch the post to get channel, text, image, user_id
      const { data: post, error: fetchErr } = await supabase
        .from('go_posts')
        .select('*')
        .eq('id', postId)
        .single();
      if (fetchErr || !post) throw new Error('Post niet gevonden');

      // Check if user has a social account for this channel
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      // Normalize channel to lowercase (DB stores 'linkedin', post might have 'LinkedIn')
      const normalizedChannel = post.channel?.toLowerCase();

      const { data: socialAccount, error: socialErr } = await supabase
        .from('social_accounts')
        .select('id, platform, account_type, account_name, platform_account_id, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .ilike('platform', normalizedChannel)
        .limit(1)
        .maybeSingle();

      if (socialErr) throw socialErr;

      // If no active account found, try without status filter (account might be connected but not 'active')
      let finalAccount = socialAccount;
      if (!finalAccount || (finalAccount.status !== 'active' && finalAccount.status !== 'connected')) {
        const { data: anyAccount } = await supabase
          .from('social_accounts')
          .select('id, platform, account_type, account_name, platform_account_id, status')
          .eq('user_id', user.id)
          .ilike('platform', normalizedChannel)
          .limit(1)
          .maybeSingle();
        if (anyAccount) finalAccount = anyAccount;
      }

      if (!finalAccount) {
        // No account for this channel — mark as approved, throw connect error
        console.error(`[Publish] No social account found for user=${user.id}, channel=${normalizedChannel}`);
        await supabase
          .from('go_posts')
          .update({ status: 'approved' })
          .eq('id', postId);
        throw Object.assign(
          new Error('SOCIAL_NOT_CONNECTED'),
          { data: post, status: 'approved' }
        );
      }

      // Manual account — mark as published (user copies text manually)
      if (finalAccount.account_type === 'manual') {
        const { data: updated, error: updateErr } = await supabase
          .from('go_posts')
          .update({
            status: 'published' as PostStatus,
            published_at: new Date().toISOString(),
          })
          .eq('id', postId)
          .select('*')
          .single();
        if (updateErr) throw updateErr;
        return { ...updated, _actuallyPublished: true, manual: true };
      }

      // OAuth account — call publish-social edge function
      const postText = post.text_content + (post.hashtags?.length > 0 ? '\n\n' + post.hashtags.join(' ') : '');
      // Get selected account ID from engagement metadata (set by PostReviewScreen doPublish)
      const selectedAccountId = (post.engagement as any)?.published_account?.id || finalAccount.id;
      // Include extra images for multi-image posts (LinkedIn, Facebook carousel)
      const extraImages: string[] = (post.engagement as any)?.extra_images || [];
      const { data: result, error: pubErr } = await supabase.functions.invoke('publish-social', {
        body: {
          post_id: postId,
          user_id: user.id,
          channel: post.channel,
          text: postText,
          image_url: post.branded_image_url || undefined,
          extra_image_urls: extraImages.length > 0 ? extraImages : undefined,
          account_id: selectedAccountId,
        },
      });

      if (pubErr) {
        // Edge function returned an error — try to get the detailed message
        console.error('[publish-social] edge function error:', pubErr, 'result:', result);
        const rawCtxBody = (pubErr as any)?.context?.body;
        const ctxBody = typeof rawCtxBody === 'string' ? rawCtxBody : JSON.stringify(rawCtxBody);
        const errorMsg = ctxBody
          || (typeof pubErr === 'object' && 'message' in pubErr ? (pubErr as any).message : null)
          || String(pubErr);
        const finalMsg = errorMsg || 'Publicatie mislukt — edge function fout';
        // Persist error so it's visible in the DB for debugging (previously lost on throw path)
        await supabase
          .from('go_posts')
          .update({ publish_error: finalMsg })
          .eq('id', postId);
        throw new Error(finalMsg);
      }

      // Edge function succeeded but returned { error: ... } in the body
      if (result && !result.success && result.error) {
        console.error('[publish-social] result error:', result);
        await supabase
          .from('go_posts')
          .update({ publish_error: result.error })
          .eq('id', postId);
        throw new Error(result.error);
      }

      if (result?.success) {
        await supabase
          .from('go_posts')
          .update({
            status: 'published' as PostStatus,
            published_at: new Date().toISOString(),
            publish_error: null,
            published_post_id: (result as any).postId ?? null,
          })
          .eq('id', postId);
        return { ...result, _actuallyPublished: true };
      } else {
        // Store the error on the post for debugging
        const errorMessage = result?.error || 'Publicatie mislukt';
        await supabase
          .from('go_posts')
          .update({ publish_error: errorMessage })
          .eq('id', postId);
        throw new Error(errorMessage);
      }
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['event-posts'] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-posts'] });
    },
  });
}

export function useBatchPublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postIds: string[]) => {
      let anyPublished = false;
      let anyQueued = false;

      const results = await Promise.allSettled(
        postIds.map(async (id) => {
          try {
            const res = await api.post(`/event-posts/${id}/publish`);
            anyPublished = true;
            return res;
          } catch {
            // Mark as approved (queued) instead of published
            const { data, error } = await supabase
              .from('go_posts')
              .update({ status: 'approved' })
              .eq('id', id)
              .select('*')
              .single();
            if (error) throw error;
            anyQueued = true;
            return data;
          }
        }),
      );

      return { results, anyPublished, anyQueued };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-posts'] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('go_posts')
        .delete()
        .eq('id', postId);
      if (error) throw error;
      return postId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-posts'] });
    },
  });
}

/**
 * Create event_posts rows after AI generation completes.
 */
export function useCreatePosts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      posts: Array<Omit<EventPost, 'id' | 'user_id' | 'created_at' | 'updated_at'>>,
    ) => {
      const { data: { user } = {} as any } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const rows = posts.map((p) => ({ ...p, user_id: user.id }));

      const { data, error } = await supabase
        .from('go_posts')
        .insert(rows)
        .select('*');

      if (error) throw error;
      return (data || []) as EventPost[];
    },
    onSuccess: (data) => {
      if (data.length > 0) {
        qc.invalidateQueries({ queryKey: ['event-posts', data[0].event_id] });
        qc.invalidateQueries({ queryKey: ['event-posts', 'capture', data[0].capture_id] });
      }
    },
  });
}

export function useAllPosts(filters?: { status?: PostStatus; channel?: Channel }) {
  return useQuery<EventPost[]>({
    queryKey: ['event-posts', 'all', filters?.status, filters?.channel],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('go_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.channel) query = query.eq('channel', filters.channel);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as EventPost[];
    },
    staleTime: 30_000,
  });
}

export function useDuplicatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sourcePost: EventPost) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { id, created_at, updated_at, published_at, scheduled_at, publish_error, ...rest } = sourcePost;
      const { data, error } = await supabase
        .from('go_posts')
        .insert({ ...rest, user_id: user.id, status: 'draft' as PostStatus, published_at: null, scheduled_at: null, publish_error: null })
        .select('*')
        .single();
      if (error) throw error;
      return data as EventPost;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-posts'] });
    },
  });
}
