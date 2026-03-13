import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  total_campaigns: number;
  active_campaigns: number;
  total_contacts: number;
  total_events: number;
  revenue: number;
  mrr: number;
}

export interface AnalyticsOverview {
  campaigns_by_status: Record<string, number>;
  campaigns_by_type: Record<string, number>;
  contacts_timeline: { date: string; count: number }[];
  events_timeline: { date: string; count: number }[];
  content_stats: { type: string; count: number }[];
  revenue_metrics: {
    mrr: number;
    arr: number;
    growth_rate: number;
    churn_rate: number;
    ltv: number;
    cac: number;
  };
}

export function useAnalyticsDashboard() {
  return useQuery<DashboardStats>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { total_campaigns: 0, active_campaigns: 0, total_contacts: 0, total_events: 0, revenue: 0, mrr: 0 };

      const [campaignsRes, contactsRes] = await Promise.all([
        supabase.from('campaigns').select('id, status', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('contacts').select('id', { count: 'exact' }).eq('user_id', user.id),
      ]);

      const campaigns = campaignsRes.data || [];
      const activeCampaigns = campaigns.filter((c: any) => c.status === 'active').length;

      return {
        total_campaigns: campaignsRes.count || 0,
        active_campaigns: activeCampaigns,
        total_contacts: contactsRes.count || 0,
        total_events: 0,
        revenue: 0,
        mrr: 0,
      };
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useAnalyticsOverview() {
  return useQuery<AnalyticsOverview>({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return {
        campaigns_by_status: {},
        campaigns_by_type: {},
        contacts_timeline: [],
        events_timeline: [],
        content_stats: [],
        revenue_metrics: { mrr: 0, arr: 0, growth_rate: 0, churn_rate: 0, ltv: 0, cac: 0 },
      };

      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('status, type')
        .eq('user_id', user.id);

      const byStatus: Record<string, number> = {};
      const byType: Record<string, number> = {};
      for (const c of (campaigns || [])) {
        byStatus[c.status] = (byStatus[c.status] || 0) + 1;
        byType[c.type] = (byType[c.type] || 0) + 1;
      }

      return {
        campaigns_by_status: byStatus,
        campaigns_by_type: byType,
        contacts_timeline: [],
        events_timeline: [],
        content_stats: [],
        revenue_metrics: { mrr: 0, arr: 0, growth_rate: 0, churn_rate: 0, ltv: 0, cac: 0 },
      };
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCampaignAnalytics(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['analytics', 'campaign', campaignId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId!)
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!campaignId,
    staleTime: 2 * 60_000,
  });
}
