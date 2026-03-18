'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import type { Campaign } from '@/types';

const supabase = createClient();

export function useCampaigns(statusFilter?: string) {
  return useQuery({
    queryKey: ['campaigns', statusFilter],
    queryFn: async () => {
      let q = supabase.from('campaigns').select('*').order('created_at', { ascending: false });
      if (statusFilter && statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Campaign[];
    },
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Campaign;
    },
    enabled: !!id,
  });
}

export function useCampaignCosts(campaignId: string) {
  return useQuery({
    queryKey: ['campaign-costs', campaignId],
    queryFn: async () => {
      const { data } = await supabase.from('campaign_costs').select('*').eq('campaign_id', campaignId).order('date', { ascending: false });
      return data || [];
    },
    enabled: !!campaignId,
  });
}

export function useCampaignRevenue(campaignId: string) {
  return useQuery({
    queryKey: ['campaign-revenue', campaignId],
    queryFn: async () => {
      const { data } = await supabase.from('campaign_revenue').select('*').eq('campaign_id', campaignId).order('date', { ascending: false });
      return data || [];
    },
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: Partial<Campaign>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('campaigns').insert({ ...campaign, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}

export function useCampaignStats() {
  return useQuery({
    queryKey: ['campaign-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('campaigns').select('status, budget_amount, spent_amount');
      const campaigns = data || [];
      return {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length,
        totalBudget: campaigns.reduce((s, c) => s + (c.budget_amount || 0), 0),
        totalSpent: campaigns.reduce((s, c) => s + (c.spent_amount || 0), 0),
      };
    },
  });
}
