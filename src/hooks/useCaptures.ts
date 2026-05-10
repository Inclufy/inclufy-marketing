import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// `expo-file-system` (SDK 54+) deprecated `getInfoAsync` and `uploadAsync`
// on the top-level export — they now live under `/legacy`. Importing from
// the legacy submodule keeps the old API working without runtime
// deprecation errors. Future migration: rewrite to the new File/Directory
// classes from `expo-file-system`.
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../services/supabase';
import type { EventCapture, CaptureInsert } from '../types';

export function useCaptures(eventId: string | undefined) {
  return useQuery<EventCapture[]>({
    queryKey: ['captures', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('go_captures')
        .select('*')
        .eq('event_id', eventId)
        .order('captured_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EventCapture[];
    },
    enabled: !!eventId,
    staleTime: 30_000,
  });
}

export function useDeleteCapture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      captureId,
      storagePath,
      eventId,
    }: {
      captureId: string;
      storagePath?: string | null;
      eventId: string;
    }) => {
      // 1. Delete all posts for this capture first
      await supabase.from('go_posts').delete().eq('capture_id', captureId);

      // 2. Delete storage file (non-fatal)
      if (storagePath) {
        try {
          await supabase.storage.from('media').remove([storagePath]);
        } catch { /* ignore storage errors */ }
      }

      // 3. Delete the capture record
      const { error } = await supabase
        .from('go_captures')
        .delete()
        .eq('id', captureId);

      if (error) throw error;
    },
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: ['captures', eventId] });
      qc.invalidateQueries({ queryKey: ['event-posts', eventId] });
    },
  });
}

export function useCreateCapture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CaptureInsert) => {
      const { data: { user } = {} as any } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('go_captures')
        .insert({ ...input, user_id: user.id })
        .select('*')
        .single();

      if (error) throw error;
      return data as EventCapture;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['captures', data.event_id] });
    },
  });
}

/**
 * Upload a media file to Supabase Storage and return the public URL + path.
 */
export async function uploadMedia(
  uri: string,
  eventId: string,
  mediaType: 'photo' | 'video' | 'audio',
): Promise<{ url: string; path: string }> {
  const { data: { user } = {} as any } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Detect the real file extension from the URI (iOS records audio as .m4a, not .wav)
  const uriExt = uri.split('?')[0].split('.').pop()?.toLowerCase() || '';
  let ext: string;
  let contentType: string;
  if (mediaType === 'photo') {
    ext = 'jpg';
    contentType = 'image/jpeg';
  } else if (mediaType === 'video') {
    ext = uriExt === 'mov' ? 'mov' : 'mp4';
    contentType = ext === 'mov' ? 'video/quicktime' : 'video/mp4';
  } else {
    // Audio: iOS records as .m4a (MIME audio/x-m4a which Supabase rejects).
    // Always normalise to audio/mp4 which is the correct RFC MIME type for M4A.
    ext = ['m4a', 'aac', 'wav', 'mp3'].includes(uriExt) ? uriExt : 'm4a';
    const audioMime: Record<string, string> = {
      m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', mp3: 'audio/mpeg',
    };
    contentType = audioMime[ext] ?? 'audio/mp4';
  }

  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = eventId
    ? `events/${user.id}/${eventId}/${fileName}`
    : `content/${user.id}/${fileName}`;

  // ─── Upload via FileSystem.uploadAsync (BINARY_CONTENT) ────────────────
  // The previous `fetch(uri).blob()` path silently produced 0-byte uploads
  // for ViewShot-captured URIs on iOS (a known React Native issue with
  // file:// URI's that come from native modules). Result: branded images
  // ended up in storage as 0-byte placeholders, causing every PULL_FROM_URL
  // platform (TikTok, Pinterest, IG, Threads) to fail with
  // photo_pull_failed / "Unable to reach URL" / "Media not available".
  //
  // FileSystem.uploadAsync streams the file directly as the HTTP body
  // without ever loading the bytes into JS memory, which both fixes the
  // 0-byte issue and is significantly faster for larger files.
  const supabaseUrl = (supabase as any).supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const session = await supabase.auth.getSession();
  const accessToken = session.data.session?.access_token;
  if (!accessToken) {
    throw new Error('Not authenticated — geen access token om naar storage te uploaden.');
  }

  // Sanity-check that the local file actually exists and is non-empty before
  // wasting an HTTP roundtrip on a phantom file.
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists || (fileInfo.size ?? 0) === 0) {
    throw new Error(`Lokaal bestand bestaat niet of is leeg (${uri})`);
  }

  const uploadRes = await FileSystem.uploadAsync(
    `${supabaseUrl}/storage/v1/object/media/${storagePath}`,
    uri,
    {
      httpMethod: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
        'Content-Type': contentType,
        'x-upsert': 'false',
      },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    },
  );

  if (uploadRes.status < 200 || uploadRes.status >= 300) {
    console.error('[uploadMedia] Storage upload failed', uploadRes.status, uploadRes.body);
    throw new Error(`Storage upload faalde (${uploadRes.status}): ${uploadRes.body?.slice(0, 200)}`);
  }
  console.log(`[uploadMedia] uploaded ${fileInfo.size} bytes → ${storagePath}`);

  // Prefer a long-lived signed URL (works for both public and private buckets).
  // Fall back to the always-available public URL if signing fails.
  const { data: signData } = await supabase.storage
    .from('media')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

  if (signData?.signedUrl) {
    return { url: signData.signedUrl, path: storagePath };
  }

  const { data: urlData } = supabase.storage
    .from('media')
    .getPublicUrl(storagePath);

  return { url: urlData.publicUrl, path: storagePath };
}
