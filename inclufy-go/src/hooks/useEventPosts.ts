import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import api from '../services/api';
import type { EventPost, PostUpdate } from '../types';

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
      const response = await api.post(`/event-posts/${postId}/publish`);
      return response.data;
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
      const results = await Promise.allSettled(
        postIds.map((id) => api.post(`/event-posts/${id}/publish`)),
      );
      return results;
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
      const { data: { user } } = await supabase.auth.getUser();
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
