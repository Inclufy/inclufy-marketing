import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ContentItem {
  id: string;
  title: string;
  type: string;
  content?: string;
  status?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface ContentListParams {
  type?: string;
  limit?: number;
  offset?: number;
}

async function fetchContentLibrary(params?: ContentListParams): Promise<ContentItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('content_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (params?.type) {
    query = query.eq('type', params.type);
  }
  if (params?.limit) {
    query = query.limit(params.limit);
  }
  if (params?.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ContentItem[];
}

export function useContentLibrary(params?: ContentListParams) {
  return useQuery<ContentItem[]>({
    queryKey: ['content-library', params],
    queryFn: () => fetchContentLibrary(params),
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useRecentContent(limit = 6) {
  return useQuery<ContentItem[]>({
    queryKey: ['content-library', 'recent', limit],
    queryFn: () => fetchContentLibrary({ limit }),
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useSaveContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<ContentItem>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('content_items')
        .insert({ ...item, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as ContentItem;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content-library'] }),
  });
}

export function useUpdateContentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('content_items')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data as ContentItem;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content-library'] }),
  });
}
