'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import { adaptForChannel } from '@/lib/channelAdapter';
import type { LibraryPost, LibraryPostStatus, LibraryLanguage, Channel } from '@/types';

// ─── List ─────────────────────────────────────────────────────────────

export function useLibraryPosts(opts?: {
  campaign?: string | null;
  status?: LibraryPostStatus;
}) {
  return useQuery<LibraryPost[]>({
    queryKey: ['library-posts', opts ?? {}],
    queryFn: async () => {
      const supabase = createClient();
      let q = supabase.from('library_posts').select('*').order('sort_order', { ascending: true });
      if (opts?.campaign) q = q.eq('campaign', opts.campaign);
      if (opts?.status) q = q.eq('status', opts.status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as LibraryPost[];
    },
  });
}

export function useLibraryPost(id: string | null) {
  return useQuery<LibraryPost | null>({
    queryKey: ['library-post', id],
    queryFn: async () => {
      if (!id) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('library_posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as LibraryPost | null;
    },
    enabled: !!id,
  });
}

// ─── Schedule ─────────────────────────────────────────────────────────

export function useScheduleLibraryPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { postId: string; scheduledFor: string | null }) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('library_posts')
        .update({
          scheduled_for: params.scheduledFor,
          status: params.scheduledFor ? 'scheduled' : 'draft',
        })
        .eq('id', params.postId);
      if (error) throw error;
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['library-posts'] });
      qc.invalidateQueries({ queryKey: ['library-post', vars.postId] });
    },
  });
}

// ─── Publish (per channel via publish-social edge function) ────────────

export function usePublishLibraryPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      postId: string;
      language: LibraryLanguage;
      channels?: Channel[];
    }) => {
      const supabase = createClient();
      const { data: post, error: getErr } = await supabase
        .from('library_posts')
        .select('*')
        .eq('id', params.postId)
        .single();
      if (getErr || !post) throw new Error('Post not found');
      const lp = post as LibraryPost;
      const tr = lp.translations[params.language];
      if (!tr) throw new Error(`No translation for language ${params.language}`);

      const channels = params.channels ?? lp.channels;

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error('Not authenticated');
      const userId = userData.user.id;

      // Derive product key for LinkedIn page routing
      const productKey = (lp.external_id ?? lp.campaign ?? '').toLowerCase();

      await supabase.from('library_posts').update({ status: 'publishing' }).eq('id', params.postId);

      const results: Record<string, { post_id?: string; url?: string; error?: string }> = {};
      for (const ch of channels) {
        // Channel-fit adaptation per platform
        const adapted = adaptForChannel(ch, tr.caption ?? '', tr.hashtags ?? []);
        const text = [adapted.caption, adapted.hashtags.join(' ')].filter(Boolean).join('\n\n');

        const { data: pubData, error: pubErr } = await supabase.functions.invoke('publish-social', {
          body: {
            channel: ch,
            text,
            post_id: params.postId,
            user_id: userId,
            image_url: tr.image_url,
            library_post_id: params.postId,
            product_key: productKey || undefined,
          },
        });

        if (pubErr) {
          // FunctionsHttpError swallows the body — read pubErr.context (Response) for the real reason
          let detail = pubErr.message;
          const ctx = (pubErr as any).context;
          if (ctx && typeof ctx.text === 'function') {
            try {
              const raw = await ctx.text();
              try {
                const parsed = JSON.parse(raw);
                detail = parsed.error || parsed.details || raw || pubErr.message;
              } catch {
                detail = raw || pubErr.message;
              }
            } catch {/* keep wrapper message */}
          }
          results[ch] = { error: detail };
        } else if (pubData?.success === false) {
          results[ch] = { error: pubData.error ?? 'unknown' };
        } else {
          results[ch] = { post_id: pubData?.postId, url: pubData?.url };
        }
      }

      const anyError = Object.values(results).some((r) => r.error);
      await supabase
        .from('library_posts')
        .update({
          status: anyError ? 'failed' : 'published',
          published_at: anyError ? null : new Date().toISOString(),
          publish_results: results,
        })
        .eq('id', params.postId);

      return { ok: !anyError, results };
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: ['library-posts'] });
      qc.invalidateQueries({ queryKey: ['library-post', vars.postId] });
    },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────

export function useDeleteLibraryPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('library_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['library-posts'] }),
  });
}
