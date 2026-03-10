import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export function useCreateCapture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CaptureInsert) => {
      const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const ext = mediaType === 'photo' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'wav';
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `events/${user.id}/${eventId}/${fileName}`;

  // Read file as blob
  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from('media')
    .upload(storagePath, blob, {
      contentType: blob.type || `${mediaType === 'photo' ? 'image' : mediaType}/${ext}`,
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('media')
    .getPublicUrl(storagePath);

  return { url: urlData.publicUrl, path: storagePath };
}
