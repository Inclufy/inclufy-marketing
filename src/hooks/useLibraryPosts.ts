import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import type { LibraryPost, LibraryImport, Channel } from '../types';

// ─── Query: list library posts (optionally filter by product/campaign) ───

export function useLibraryPosts(opts?: {
  productId?: string | null;
  campaign?: string | null;
  status?: LibraryPost['status'];
}) {
  return useQuery<LibraryPost[]>({
    queryKey: ['library-posts', opts ?? {}],
    queryFn: async () => {
      let q = supabase
        .from('library_posts')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (opts?.productId) q = q.eq('product_id', opts.productId);
      if (opts?.campaign) q = q.eq('campaign', opts.campaign);
      if (opts?.status) q = q.eq('status', opts.status);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as LibraryPost[];
    },
    staleTime: 30_000,
  });
}

export function useLibraryPost(postId: string | undefined) {
  return useQuery<LibraryPost | null>({
    queryKey: ['library-post', postId],
    queryFn: async () => {
      if (!postId) return null;
      const { data, error } = await supabase
        .from('library_posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();
      if (error) throw error;
      return (data as LibraryPost) ?? null;
    },
    enabled: !!postId,
  });
}

// ─── Query: list imports (for status / history) ──────────────────────────

export function useLibraryImports(limit = 20) {
  return useQuery<LibraryImport[]>({
    queryKey: ['library-imports', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('library_imports')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as LibraryImport[];
    },
    staleTime: 10_000,
  });
}

// ─── Mutation: upload ZIP + trigger import edge function ─────────────────

export interface ImportLibraryParams {
  /** Local URI to the .zip file (from expo-document-picker) */
  fileUri: string;
  /** Original filename (used as part of storage key) */
  fileName: string;
  /** Optional product to associate posts with */
  productId?: string | null;
  /** Optional campaign label override (manifest.campaign wins if present) */
  campaign?: string | null;
  /** Progress callback 0..1 for upload phase */
  onUploadProgress?: (pct: number) => void;
}

export function useImportLibraryZip() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: ImportLibraryParams) => {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) throw new Error('not authenticated');
      const userId = userData.user.id;

      // 1. Read file as ArrayBuffer (supports both file:// and http:// URIs via fetch)
      const resp = await fetch(params.fileUri);
      if (!resp.ok) throw new Error(`failed to read file: ${resp.status}`);
      const ab = await resp.arrayBuffer();
      params.onUploadProgress?.(0.1);

      // 2. Upload to library-imports/<userId>/<timestamp>-<filename>
      const ts = Date.now();
      const safeName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const zipPath = `${userId}/${ts}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from('library-imports')
        .upload(zipPath, ab, {
          contentType: 'application/zip',
          upsert: false,
        });
      if (upErr) throw new Error(`upload failed: ${upErr.message}`);
      params.onUploadProgress?.(0.7);

      // 3. Invoke edge function
      const { data, error: fnErr } = await supabase.functions.invoke('import-library-zip', {
        body: {
          zipPath,
          productId: params.productId ?? null,
          campaign: params.campaign ?? null,
        },
      });
      if (fnErr) throw new Error(`import failed: ${fnErr.message}`);
      if (!data?.ok) throw new Error(data?.error ?? 'import failed');
      params.onUploadProgress?.(1);

      return data as { ok: true; importId: string; postsCreated: number; campaign: string | null };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-posts'] });
      qc.invalidateQueries({ queryKey: ['library-imports'] });
    },
  });
}

// ─── Mutation: schedule a post (set scheduled_for + status) ──────────────

export function useScheduleLibraryPost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      postId: string;
      scheduledFor: string | null; // ISO; null = unschedule (back to draft)
      channels?: Channel[];        // override channels if needed
    }) => {
      const update: Record<string, unknown> = {
        scheduled_for: params.scheduledFor,
        status: params.scheduledFor ? 'scheduled' : 'draft',
      };
      if (params.channels) update.channels = params.channels;

      const { data, error } = await supabase
        .from('library_posts')
        .update(update)
        .eq('id', params.postId)
        .select()
        .single();
      if (error) throw error;
      return data as LibraryPost;
    },
    onSuccess: (post) => {
      qc.invalidateQueries({ queryKey: ['library-posts'] });
      qc.invalidateQueries({ queryKey: ['library-post', post.id] });
    },
  });
}

// ─── Mutation: publish-now (call existing publish-social edge fn) ────────

export function usePublishLibraryPost() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      postId: string;
      language: 'nl' | 'en' | 'fr';
      channels?: Channel[]; // default = post.channels
    }) => {
      // 1. Mark publishing
      const { data: post, error: getErr } = await supabase
        .from('library_posts')
        .select('*')
        .eq('id', params.postId)
        .single();
      if (getErr || !post) throw new Error('post not found');

      const lp = post as LibraryPost;
      const tr = lp.translations[params.language];
      if (!tr) throw new Error(`no translation for language ${params.language}`);

      const channels = params.channels ?? lp.channels;

      await supabase
        .from('library_posts')
        .update({ status: 'publishing' })
        .eq('id', params.postId);

      // 2. Invoke publish-social per channel
      const results: Record<string, { post_id?: string; url?: string; error?: string }> = {};

      for (const ch of channels) {
        const { data: pubData, error: pubErr } = await supabase.functions.invoke('publish-social', {
          body: {
            channel: ch,
            text: [tr.caption, tr.hashtags.join(' ')].filter(Boolean).join('\n\n'),
            imageUrl: tr.image_url,
            // existing publish-social signature; library_post_id is informational
            library_post_id: params.postId,
          },
        });
        if (pubErr) {
          results[ch] = { error: pubErr.message };
        } else if (pubData?.success === false) {
          results[ch] = { error: pubData.error ?? 'unknown' };
        } else {
          results[ch] = { post_id: pubData?.postId, url: pubData?.url };
        }
      }

      // 3. Update final status
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

// ─── Mutation: delete a post ─────────────────────────────────────────────

export function useDeleteLibraryPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('library_posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['library-posts'] });
    },
  });
}
