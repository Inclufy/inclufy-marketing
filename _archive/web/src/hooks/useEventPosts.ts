'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import type { EventPost, PostStatus, PostUpdate, Channel } from '@/types';

export function useAllPosts(filters?: { status?: PostStatus; channel?: Channel }) {
  return useQuery<EventPost[]>({
    queryKey: ['event-posts', 'all', filters?.status, filters?.channel],
    queryFn: async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let q = supabase
        .from('go_posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.channel) q = q.eq('channel', filters.channel);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as EventPost[];
    },
    staleTime: 30_000,
  });
}

export function useEventPost(id: string | null) {
  return useQuery<EventPost | null>({
    queryKey: ['event-post', id],
    queryFn: async () => {
      if (!id) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('go_posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as EventPost | null;
    },
    enabled: !!id,
  });
}

export function useUpdatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string } & PostUpdate) => {
      const supabase = createClient();
      const { id, ...patch } = params;
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
      qc.invalidateQueries({ queryKey: ['event-posts'] });
      qc.invalidateQueries({ queryKey: ['event-post', data.id] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('go_posts').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event-posts'] }),
  });
}

export function useDuplicatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (source: EventPost) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const { id, created_at, updated_at, published_at, scheduled_at, publish_error, ...rest } = source;
      const { data, error } = await supabase
        .from('go_posts')
        .insert({
          ...rest,
          user_id: user.id,
          status: 'draft' as PostStatus,
          published_at: null,
          scheduled_at: null,
          publish_error: null,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as EventPost;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event-posts'] }),
  });
}

export function usePublishPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const supabase = createClient();
      const { data: post, error: fetchErr } = await supabase
        .from('go_posts')
        .select('*')
        .eq('id', postId)
        .single();
      if (fetchErr || !post) throw new Error('Post niet gevonden');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');

      const normalizedChannel = String(post.channel ?? '').toLowerCase();

      const { data: socialAccount } = await supabase
        .from('social_accounts')
        .select('id, platform, account_type, account_name, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .ilike('platform', normalizedChannel)
        .limit(1)
        .maybeSingle();

      let finalAccount = socialAccount;
      if (!finalAccount) {
        const { data: anyAcc } = await supabase
          .from('social_accounts')
          .select('id, platform, account_type, account_name, status')
          .eq('user_id', user.id)
          .ilike('platform', normalizedChannel)
          .limit(1)
          .maybeSingle();
        if (anyAcc) finalAccount = anyAcc;
      }

      if (!finalAccount) {
        await supabase.from('go_posts').update({ status: 'approved' }).eq('id', postId);
        throw new Error(
          `SOCIAL_NOT_CONNECTED: koppel eerst ${normalizedChannel} via /integrations`,
        );
      }

      if (finalAccount.account_type === 'manual') {
        const { data: updated, error: updErr } = await supabase
          .from('go_posts')
          .update({ status: 'published', published_at: new Date().toISOString() })
          .eq('id', postId)
          .select('*')
          .single();
        if (updErr) throw updErr;
        return { post: updated as EventPost, manual: true };
      }

      let postText =
        (post.text_content ?? '') +
        (post.hashtags?.length > 0 ? '\n\n' + post.hashtags.join(' ') : '');

      const postAny = post as any;
      if (postAny.whatsapp_cta_enabled && postAny.whatsapp_cta_phone) {
        const phone = String(postAny.whatsapp_cta_phone).replace(/^\+/, '').replace(/\D/g, '');
        const msg = encodeURIComponent(postAny.whatsapp_cta_message || 'Hi, ik zag je post');
        postText += `\n\n💬 Chat met ons: https://wa.me/${phone}?text=${msg}`;
      }

      const selectedAccountId = (post.engagement as any)?.published_account?.id || finalAccount.id;
      const extraImages: string[] = (post.engagement as any)?.extra_images || [];

      const { data: result, error: pubErr } = await supabase.functions.invoke('publish-social', {
        body: {
          post_id: postId,
          user_id: user.id,
          channel: post.channel,
          text: postText,
          image_url: post.branded_image_url || undefined,
          video_url: postAny.video_url ?? undefined,
          media_type: postAny.media_type ?? 'photo',
          extra_image_urls: extraImages.length > 0 ? extraImages : undefined,
          account_id: selectedAccountId,
          ig_format: postAny.ig_format ?? 'feed',
        },
      });

      if (pubErr) {
        let detail = pubErr.message;
        const ctx = (pubErr as any).context;
        if (ctx?.text) {
          try {
            const raw = await ctx.text();
            try {
              const parsed = JSON.parse(raw);
              detail = parsed.error || parsed.details || raw;
            } catch {
              detail = raw;
            }
          } catch {/* keep wrapper message */}
        }
        await supabase.from('go_posts').update({ publish_error: detail }).eq('id', postId);
        throw new Error(detail);
      }

      if (result && !result.success && result.error) {
        await supabase.from('go_posts').update({ publish_error: result.error }).eq('id', postId);
        throw new Error(result.error);
      }

      if (result?.success) {
        const { data: updated } = await supabase
          .from('go_posts')
          .update({
            status: 'published',
            published_at: new Date().toISOString(),
            publish_error: null,
            published_post_id: result.postId ?? null,
          })
          .eq('id', postId)
          .select('*')
          .single();
        return { post: updated as EventPost, manual: false, url: result.url, postId: result.postId };
      }

      const errorMsg = result?.error || 'Publicatie mislukt';
      await supabase.from('go_posts').update({ publish_error: errorMsg }).eq('id', postId);
      throw new Error(errorMsg);
    },
    onSuccess: (_r, postId) => {
      qc.invalidateQueries({ queryKey: ['event-posts'] });
      qc.invalidateQueries({ queryKey: ['event-post', postId] });
    },
  });
}

export function useFetchEngagement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');
      const { data, error } = await supabase.functions.invoke('fetch-post-engagement', {
        body: { post_id: postId, user_id: user.id },
      });
      if (error) throw error;
      return data as {
        success: boolean;
        engagement?: { likes: number; comments: number; shares: number; fetched_at: string };
        error?: string;
      };
    },
    onSuccess: (_r, postId) => {
      qc.invalidateQueries({ queryKey: ['event-posts'] });
      qc.invalidateQueries({ queryKey: ['event-post', postId] });
    },
  });
}

export async function uploadPostMedia(file: File, mediaType: 'photo' | 'video'): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Niet ingelogd');

  const ext = file.name.split('.').pop()?.toLowerCase() || (mediaType === 'video' ? 'mp4' : 'jpg');
  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `content/${user.id}/${safeName}`;

  const { error } = await supabase.storage.from('media').upload(path, file, {
    contentType: file.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
    upsert: false,
  });
  if (error) throw error;

  const { data: signed } = await supabase.storage.from('media').createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signed?.signedUrl) return signed.signedUrl;

  const { data: publicData } = supabase.storage.from('media').getPublicUrl(path);
  return publicData.publicUrl;
}

export function useRewriteCaption() {
  return useMutation({
    mutationFn: async (params: {
      text: string;
      channel: Channel;
      tone?: 'casual' | 'formal' | 'inspirational';
    }) => {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke('event-studio-ai', {
        body: {
          action: 'rewrite-post',
          text: params.text,
          channel: params.channel,
          tone: params.tone ?? 'casual',
        },
      });
      if (error) throw error;
      const result = data as { rewritten?: string; text?: string; error?: string };
      if (result.error) throw new Error(result.error);
      return result.rewritten ?? result.text ?? params.text;
    },
  });
}
