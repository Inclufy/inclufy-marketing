import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import type { BrandContext } from '../types';

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
      const { data: { user } } = await supabase.auth.getUser();
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
  return useQuery({
    queryKey: ['brand-kits'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
