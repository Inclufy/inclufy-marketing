import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import type { BrandKit, BrandContext } from '../types';

interface BrandMemoryRow {
  id: string;
  brand_name: string;
  tagline: string;
  mission: string;
  brand_description: string;
  tone_attributes: Array<{ attribute: string; description: string }>;
  messaging_dos: string;
  messaging_donts: string;
  preferred_vocabulary: string[];
  banned_phrases: string[];
  usps: string[];
  brand_values: string[];
  audiences: string[];
  industries: string[];
  primary_color: string;
  secondary_color: string;
}

export function toBrandContext(bm: BrandMemoryRow | null | undefined): BrandContext | undefined {
  if (!bm || !bm.brand_name) return undefined;
  return {
    brand_name: bm.brand_name,
    tagline: bm.tagline || undefined,
    mission: bm.mission || undefined,
    brand_description: bm.brand_description || undefined,
    tone_attributes: bm.tone_attributes?.length ? bm.tone_attributes : undefined,
    messaging_dos: bm.messaging_dos || undefined,
    messaging_donts: bm.messaging_donts || undefined,
    preferred_vocabulary: bm.preferred_vocabulary?.length ? bm.preferred_vocabulary : undefined,
    banned_phrases: bm.banned_phrases?.length ? bm.banned_phrases : undefined,
    usps: bm.usps?.length ? bm.usps : undefined,
    brand_values: bm.brand_values?.length ? bm.brand_values : undefined,
    audiences: bm.audiences?.length ? bm.audiences : undefined,
    industries: bm.industries?.length ? bm.industries : undefined,
    primary_color: bm.primary_color || undefined,
    secondary_color: bm.secondary_color || undefined,
  };
}

export function useBrandMemory() {
  return useQuery<BrandMemoryRow | null>({
    queryKey: ['brand-memory', 'active'],
    queryFn: async () => {
      const { data: { user } = {} as any } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('brand_memory')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as BrandMemoryRow | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useBrandKits() {
  return useQuery<BrandKit[]>({
    queryKey: ['brand-kits'],
    queryFn: async () => {
      const { data: { user } = {} as any } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return (data as BrandKit[]) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Brand Kit Mutations ────────────────────────────────────────────

export type BrandKitInput = {
  name: string;
  primary_color: string;
  secondary_color: string;
  font_family?: string;
  logo_url?: string | null;
  tagline?: string | null;
  is_default?: boolean;
};

export function useCreateBrandKit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: BrandKitInput) => {
      const { data: { user } = {} as any } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // If setting as default, unset others first
      if (input.is_default) {
        await supabase
          .from('brand_kits')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('brand_kits')
        .insert({
          ...input,
          user_id: user.id,
          font_family: input.font_family || 'system-ui',
        })
        .select()
        .single();

      if (error) throw error;
      return data as BrandKit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-kits'] });
    },
  });
}

export function useUpdateBrandKit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<BrandKitInput> & { id: string }) => {
      const { data: { user } = {} as any } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // If setting as default, unset others first
      if (input.is_default) {
        await supabase
          .from('brand_kits')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('brand_kits')
        .update(input)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as BrandKit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-kits'] });
    },
  });
}

export function useDeleteBrandKit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } = {} as any } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('brand_kits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-kits'] });
    },
  });
}

export function useSetDefaultBrandKit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (kitId: string) => {
      const { data: { user } = {} as any } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Unset all defaults
      await supabase
        .from('brand_kits')
        .update({ is_default: false })
        .eq('user_id', user.id);

      // Set chosen kit as default
      const { error } = await supabase
        .from('brand_kits')
        .update({ is_default: true })
        .eq('id', kitId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-kits'] });
    },
  });
}
