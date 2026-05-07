import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import type { Channel } from '../types';

export interface ChannelConfig {
  active: boolean;
  posts_per_week: number;
  budget_pct: number;
}

export type PersonaTone = 'formal' | 'casual' | 'inspirational';

export interface Persona {
  id: string;
  name: string;
  role: string;
  pain_points: string[];
  tone: PersonaTone;
  channels: Channel[];
}

export interface MarketingStrategy {
  id: string;
  user_id: string;
  // Goals
  goals: string[];
  primary_goal: string;
  // Channels
  channels: Record<string, ChannelConfig>;
  // Budget
  monthly_budget: number;
  budget_allocation: Record<string, number>;
  // Content
  content_mix: Record<string, number>;
  posts_per_week: number;
  // Events
  events_per_quarter: number;
  event_budget_pct: number;
  // Timing
  peak_months: string[];
  posting_days: string[];
  posting_times: Record<string, string>;
  // Autonomy
  autonomy_level: 'conservative' | 'balanced' | 'aggressive';
  auto_publish: boolean;
  require_approval: boolean;
  // Personas (target audience profiles for channel-fit alignment)
  personas: Persona[];
  // Status
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useMarketingStrategy() {
  return useQuery<MarketingStrategy | null>({
    queryKey: ['marketing-strategy'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('go_marketing_strategy')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) { console.warn('[useMarketingStrategy] error:', error.message); return null; }
      return data as MarketingStrategy | null;
    },
    staleTime: 60_000,
  });
}

export function useUpdateMarketingStrategy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<MarketingStrategy>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('go_marketing_strategy')
        .upsert(
          { ...updates, user_id: user.id, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data as MarketingStrategy;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketing-strategy'] }),
  });
}
