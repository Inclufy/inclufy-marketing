/**
 * User tier feature gate helper — web (Next.js).
 *
 * Mirror of mobile src/utils/userTier.ts. Same tier hierarchy, same
 * feature gates, same staleTime cache so client + server agree on
 * what a tier unlocks.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

export type Tier = 'free' | 'pro' | 'promote' | 'ads' | 'enterprise';

const TIER_ORDER: Record<Tier, number> = {
  free: 0,
  pro: 1,
  promote: 2,
  ads: 3,
  enterprise: 4,
};

export function tierAtLeast(userTier: Tier | null | undefined, required: Tier): boolean {
  if (!userTier) return false;
  return TIER_ORDER[userTier] >= TIER_ORDER[required];
}

export function canBoostMeta(tier: Tier | null | undefined): boolean {
  return tierAtLeast(tier, 'promote');
}

export function canBoostMultiChannel(tier: Tier | null | undefined): boolean {
  return tierAtLeast(tier, 'ads');
}

export function canWhiteLabel(tier: Tier | null | undefined): boolean {
  return tierAtLeast(tier, 'enterprise');
}

export function platformsLimit(tier: Tier | null | undefined): number {
  switch (tier) {
    case 'free': return 1;
    case 'pro': case 'promote': return 6;
    case 'ads': case 'enterprise': return 8;
    default: return 1;
  }
}

export function boostsIncludedPerMonth(tier: Tier | null | undefined): number {
  switch (tier) {
    case 'promote': return 1;
    case 'ads': return 5;
    case 'enterprise': return -1;
    default: return 0;
  }
}

// ─── React hook ─────────────────────────────────────────────────────

interface UseUserTierResult {
  tier: Tier;
  loading: boolean;
  commissionPct: number;
  refetch: () => void;
}

export function useUserTier(): UseUserTierResult {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['user-tier'],
    queryFn: async (): Promise<{ tier: Tier; commission_pct: number }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { tier: 'free', commission_pct: 0 };
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier, commission_pct')
        .eq('id', user.id)
        .maybeSingle();
      return {
        tier: (profile?.tier ?? 'free') as Tier,
        commission_pct: profile?.commission_pct ?? 0,
      };
    },
    staleTime: 60_000,
  });

  return {
    tier: data?.tier ?? 'free',
    commissionPct: data?.commission_pct ?? 0,
    loading: isLoading,
    refetch,
  };
}
