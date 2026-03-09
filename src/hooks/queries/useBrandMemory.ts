import { useQuery } from '@tanstack/react-query';
import { brandMemoryService, type BrandMemoryRow } from '@/services/brand/brand-memory.service';

/**
 * React Query hook to fetch the active Brand Memory profile.
 * Used by content generation hooks (useAI) to inject brand context
 * into every AI-generated piece of content.
 *
 * Data flow:  Onboarding / BrandMemory page  →  Supabase (brand_memory)
 *             useBrandMemory()  →  useAI()  →  backend /api/content/*
 */
export function useBrandMemory() {
  return useQuery<BrandMemoryRow | null>({
    queryKey: ['brand-memory', 'active'],
    queryFn: async () => {
      try {
        return await brandMemoryService.getOrCreateActive();
      } catch {
        // Not authenticated or table missing — return null so generators
        // can still work with a generic fallback context.
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // brand data rarely changes — 5 min cache
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Extracts only the fields relevant for AI content generation prompts.
 * Keeps the payload small and focused.
 */
export function toBrandContext(bm: BrandMemoryRow | null | undefined) {
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

export type BrandContext = ReturnType<typeof toBrandContext>;
