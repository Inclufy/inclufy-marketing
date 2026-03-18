import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { supabase } from '../services/supabase';

export interface DashboardStats {
  total_campaigns: number;
  active_campaigns: number;
  total_contacts: number;
  total_revenue: number;
}

export interface AnalyticsOverview {
  campaigns: {
    total: number;
    by_status: Record<string, number>;
    by_type: Record<string, number>;
    total_budget: number;
  };
  contacts: {
    total: number;
    timeline: Array<{ date: string; count: number }>;
  };
  email: {
    total_sent: number;
    total_opened: number;
    total_clicked: number;
    open_rate: number;
    click_rate: number;
  };
  events: {
    total: number;
    upcoming: number;
  };
}

const EMPTY_STATS: DashboardStats = { total_campaigns: 0, active_campaigns: 0, total_contacts: 0, total_revenue: 0 };

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      // Try API first
      try {
        const response = await api.get('/analytics/dashboard');
        const d = response.data as DashboardStats;
        if (d && (d.total_campaigns > 0 || d.total_contacts > 0 || d.total_revenue > 0)) {
          return d;
        }
      } catch {}

      // Supabase fallback — query tables directly
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return EMPTY_STATS;

        const [
          campaignsRes,
          activeCampaignsRes,
          contactsRes,
          revenueRes,
        ] = await Promise.all([
          // Total campaigns
          supabase
            .from('campaigns')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          // Active campaigns
          supabase
            .from('campaigns')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'active'),
          // Total contacts
          supabase
            .from('contacts')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id),
          // Total revenue from campaign_revenue
          supabase
            .from('campaign_revenue')
            .select('amount')
            .eq('user_id', user.id),
        ]);

        const totalRevenue = (revenueRes.data || []).reduce(
          (sum: number, r: any) => sum + Number(r.amount || 0),
          0,
        );

        return {
          total_campaigns: campaignsRes.count ?? 0,
          active_campaigns: activeCampaignsRes.count ?? 0,
          total_contacts: contactsRes.count ?? 0,
          total_revenue: totalRevenue,
        };
      } catch {
        return EMPTY_STATS;
      }
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export function useAnalyticsOverview() {
  return useQuery<AnalyticsOverview>({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      // Try API first
      try {
        const response = await api.get('/analytics/overview');
        return response.data as AnalyticsOverview;
      } catch {}

      // Supabase fallback
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const [campaignsRes, contactsRes, eventsRes] = await Promise.all([
          supabase.from('campaigns').select('*').eq('user_id', user.id),
          supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('events').select('id, status').eq('user_id', user.id),
        ]);

        const campaigns = campaignsRes.data || [];
        const byStatus: Record<string, number> = {};
        const byType: Record<string, number> = {};
        let totalBudget = 0;

        for (const c of campaigns) {
          byStatus[c.status] = (byStatus[c.status] || 0) + 1;
          byType[c.type] = (byType[c.type] || 0) + 1;
          totalBudget += Number(c.budget_amount || 0);
        }

        const events = eventsRes.data || [];
        const upcomingCount = events.filter((e: any) => e.status === 'upcoming' || e.status === 'active').length;

        return {
          campaigns: {
            total: campaigns.length,
            by_status: byStatus,
            by_type: byType,
            total_budget: totalBudget,
          },
          contacts: {
            total: contactsRes.count ?? 0,
            timeline: [],
          },
          email: {
            total_sent: 0,
            total_opened: 0,
            total_clicked: 0,
            open_rate: 0,
            click_rate: 0,
          },
          events: {
            total: events.length,
            upcoming: upcomingCount,
          },
        } as AnalyticsOverview;
      } catch {
        return {
          campaigns: { total: 0, by_status: {}, by_type: {}, total_budget: 0 },
          contacts: { total: 0, timeline: [] },
          email: { total_sent: 0, total_opened: 0, total_clicked: 0, open_rate: 0, click_rate: 0 },
          events: { total: 0, upcoming: 0 },
        } as AnalyticsOverview;
      }
    },
    staleTime: 120_000,
    retry: 0,
  });
}
