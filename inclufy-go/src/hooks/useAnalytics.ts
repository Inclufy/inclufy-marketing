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

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: async () => {
      const response = await api.get('/analytics/dashboard');
      return response.data as DashboardStats;
    },
    staleTime: 120_000,
  });
}

export function useAnalyticsOverview() {
  return useQuery<AnalyticsOverview>({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => {
      const response = await api.get('/analytics/overview');
      return response.data as AnalyticsOverview;
    },
    staleTime: 120_000,
  });
}
