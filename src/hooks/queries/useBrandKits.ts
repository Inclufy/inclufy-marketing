import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface BrandKit {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  font_family?: string;
  logo_url?: string;
  tagline?: string;
  is_default: boolean;
  created_at: string;
}

export function useBrandKits() {
  return useQuery<BrandKit[]>({
    queryKey: ['brand-kits'],
    queryFn: () => api.get('/brand-memory/kits').then(r => r.data),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCreateBrandKit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (kit: Partial<BrandKit>) =>
      api.post('/brand-memory/kits', kit).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brand-kits'] }),
  });
}
