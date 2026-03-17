import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

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
      try {
        const response = await api.get('/analytics/dashboard');
        return response.data as DashboardStats;
      } catch {
        return EMPTY_STATS;
      }
    },
    staleTime: 120_000,
    retry: 0,
  });
}

export function useAnalyticsOverview() {
  return useQuery<AnalyticsOverview>({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      try {
        const response = await api.get('/analytics/overview');
        return response.data as AnalyticsOverview;
      } catch {
        return { campaigns: { total: 0, by_status: {}, by_type: {}, total_budget: 0 }, contacts: { total: 0, timeline: [] }, email: { total_sent: 0, total_opened: 0, total_clicked: 0, open_rate: 0, click_rate: 0 }, events: { total: 0, upcoming: 0 } } as AnalyticsOverview;
      }
    },
    staleTime: 120_000,
    retry: 0,
  });
}
