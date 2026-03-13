import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as BrandKit[];
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCreateBrandKit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kit: Partial<BrandKit>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('brand_kits')
        .insert({ ...kit, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as BrandKit;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['brand-kits'] }),
  });
}
