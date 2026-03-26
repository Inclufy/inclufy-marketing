import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { supabase } from '../services/supabase';
import { resolveOrganizationId } from '../utils/resolveOrganizationId';

export interface Campaign {
  id: string;
  organization_id: string;
  user_id?: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'multi-channel';
  description: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget_amount: number | null;
  spent_amount?: number | null;
  audience_filters: Record<string, unknown>;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Extended fields for wizard
  goal?: string | null;
  target_leads?: number | null;
  target_revenue?: number | null;
  channels?: string[] | null;
}

export interface CampaignCost {
  id: string;
  campaign_id: string;
  user_id: string;
  category: 'ads' | 'events' | 'tools' | 'personnel' | 'travel' | 'content' | 'other';
  description: string | null;
  amount: number;
  date: string;
  created_at: string;
}

export interface CampaignRevenue {
  id: string;
  campaign_id: string;
  user_id: string;
  source: 'lead_conversion' | 'direct_sale' | 'event_ticket' | 'subscription' | 'referral' | 'other';
  description: string | null;
  amount: number;
  date: string;
  created_at: string;
}

// ─── Campaign Hooks ──────────────────────────────────────────────────

export function useCampaigns(status?: string) {
  return useQuery<Campaign[]>({
    queryKey: ['campaigns', status],
    queryFn: async () => {
      // Try API first, fallback to Supabase direct
      try {
        const params: Record<string, string> = {};
        if (status) params.status = status;
        const response = await api.get('/campaigns', { params });
        const list = (response.data?.campaigns || response.data || []) as Campaign[];
        if (list.length > 0) return list;
      } catch {}

      // Supabase fallback
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        let query = supabase
          .from('campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (status) query = query.eq('status', status);
        const { data } = await query;
        return (data || []) as Campaign[];
      } catch {
        return [];
      }
    },
    staleTime: 60_000,
    retry: 0,
  });
}

export function useCampaign(campaignId: string | undefined) {
  return useQuery<Campaign | null>({
    queryKey: ['campaigns', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      // Try API first
      try {
        const response = await api.get(`/campaigns/${campaignId}`);
        const campaign = (response.data?.campaign || response.data) as Campaign;
        if (campaign?.id) return campaign;
      } catch {}

      // Supabase fallback
      try {
        const { data } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .maybeSingle();
        return data as Campaign | null;
      } catch {
        return null;
      }
    },
    enabled: !!campaignId,
    retry: 0,
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<Campaign>) => {
      // Try API first
      try {
        const response = await api.patch(`/campaigns/${id}`, patch);
        return response.data;
      } catch {}
      // Supabase fallback
      const { data, error } = await supabase
        .from('campaigns')
        .update(patch)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export interface CampaignCreateInput {
  name: string;
  type: 'email' | 'sms' | 'push' | 'multi-channel';
  description?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  budget_amount?: number | null;
  audience_filters?: Record<string, unknown>;
  content?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  // Extended wizard fields
  goal?: string | null;
  target_leads?: number | null;
  target_revenue?: number | null;
  channels?: string[] | null;
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CampaignCreateInput) => {
      // Try API first
      try {
        const response = await api.post('/campaigns', input);
        if (response.data?.id || response.data?.campaign) return response.data;
      } catch {}

      // Supabase fallback
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const orgId = await resolveOrganizationId();

      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          name: input.name,
          type: input.type,
          description: input.description || '',
          status: 'draft',
          start_date: input.starts_at || null,
          end_date: input.ends_at || null,
          budget_amount: input.budget_amount || 0,
          audience_filters: input.audience_filters || {},
          content: input.content || {},
          settings: {
            ...(input.settings || {}),
            goal: input.goal,
            target_leads: input.target_leads,
            target_revenue: input.target_revenue,
            channels: input.channels,
          },
          user_id: user.id,
          organization_id: orgId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useCampaignMetrics(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['campaign-metrics', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      try {
        const response = await api.get(`/analytics/campaigns/${campaignId}`);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!campaignId,
    staleTime: 120_000,
  });
}

// ─── Campaign Costs ──────────────────────────────────────────────────

export function useCampaignCosts(campaignId: string | undefined) {
  return useQuery<CampaignCost[]>({
    queryKey: ['campaign-costs', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from('campaign_costs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data || []) as CampaignCost[];
    },
    enabled: !!campaignId,
  });
}

export function useAddCampaignCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      campaign_id: string;
      category: CampaignCost['category'];
      description?: string;
      amount: number;
      date?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('campaign_costs')
        .insert({
          campaign_id: input.campaign_id,
          user_id: user.id,
          category: input.category,
          description: input.description || null,
          amount: input.amount,
          date: input.date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['campaign-costs', vars.campaign_id] });
      qc.invalidateQueries({ queryKey: ['campaign-roi', vars.campaign_id] });
    },
  });
}

export function useDeleteCampaignCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, campaign_id }: { id: string; campaign_id: string }) => {
      const { error } = await supabase.from('campaign_costs').delete().eq('id', id);
      if (error) throw error;
      return campaign_id;
    },
    onSuccess: (campaign_id) => {
      qc.invalidateQueries({ queryKey: ['campaign-costs', campaign_id] });
      qc.invalidateQueries({ queryKey: ['campaign-roi', campaign_id] });
    },
  });
}

// ─── Campaign Revenue ────────────────────────────────────────────────

export function useCampaignRevenue(campaignId: string | undefined) {
  return useQuery<CampaignRevenue[]>({
    queryKey: ['campaign-revenue', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from('campaign_revenue')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date', { ascending: false });
      if (error) throw error;
      return (data || []) as CampaignRevenue[];
    },
    enabled: !!campaignId,
  });
}

export function useAddCampaignRevenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      campaign_id: string;
      source: CampaignRevenue['source'];
      description?: string;
      amount: number;
      date?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('campaign_revenue')
        .insert({
          campaign_id: input.campaign_id,
          user_id: user.id,
          source: input.source,
          description: input.description || null,
          amount: input.amount,
          date: input.date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['campaign-revenue', vars.campaign_id] });
      qc.invalidateQueries({ queryKey: ['campaign-roi', vars.campaign_id] });
    },
  });
}

export function useDeleteCampaignRevenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, campaign_id }: { id: string; campaign_id: string }) => {
      const { error } = await supabase.from('campaign_revenue').delete().eq('id', id);
      if (error) throw error;
      return campaign_id;
    },
    onSuccess: (campaign_id) => {
      qc.invalidateQueries({ queryKey: ['campaign-revenue', campaign_id] });
      qc.invalidateQueries({ queryKey: ['campaign-roi', campaign_id] });
    },
  });
}

// ─── Campaign ROI ────────────────────────────────────────────────────

export function useCampaignROI(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['campaign-roi', campaignId],
    queryFn: async () => {
      if (!campaignId) return { totalCosts: 0, totalRevenue: 0, roi: 0 };

      const [costsRes, revenueRes] = await Promise.all([
        supabase.from('campaign_costs').select('amount').eq('campaign_id', campaignId),
        supabase.from('campaign_revenue').select('amount').eq('campaign_id', campaignId),
      ]);

      const totalCosts = (costsRes.data || []).reduce((sum, r) => sum + Number(r.amount), 0);
      const totalRevenue = (revenueRes.data || []).reduce((sum, r) => sum + Number(r.amount), 0);
      const roi = totalCosts > 0 ? ((totalRevenue - totalCosts) / totalCosts) * 100 : 0;

      return { totalCosts, totalRevenue, roi };
    },
    enabled: !!campaignId,
  });
}

// ─── Connected Social Channels (for campaign channel linking) ────────

export function useConnectedChannels() {
  return useQuery({
    queryKey: ['connected-channels'],
    queryFn: async () => {
      const { data } = await supabase
        .from('social_accounts')
        .select('id, platform, account_name, status, profile_image_url')
        .eq('status', 'active');
      return (data || []) as Array<{
        id: string;
        platform: string;
        account_name: string | null;
        status: string;
        profile_image_url: string | null;
      }>;
    },
    staleTime: 60_000,
  });
}
