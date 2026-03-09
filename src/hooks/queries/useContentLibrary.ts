import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

export function useContentLibrary(params?: ContentListParams) {
  return useQuery<ContentItem[]>({
    queryKey: ['content-library', params],
    queryFn: () => api.get('/content-library/', { params }).then(r => r.data),
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useRecentContent(limit = 6) {
  return useQuery<ContentItem[]>({
    queryKey: ['content-library', 'recent', limit],
    queryFn: () => api.get(`/content-library/?limit=${limit}`).then(r => r.data),
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useSaveContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Partial<ContentItem>) =>
      api.post('/content-library/', item).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content-library'] }),
  });
}

export function useUpdateContentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/content-library/${id}`, { status }).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['content-library'] }),
  });
}
