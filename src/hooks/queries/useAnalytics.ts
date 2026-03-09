import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
    queryFn: () => api.get('/analytics/dashboard').then(r => r.data),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useAnalyticsOverview() {
  return useQuery<AnalyticsOverview>({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCampaignAnalytics(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['analytics', 'campaign', campaignId],
    queryFn: () => api.get(`/analytics/campaign/${campaignId}`).then(r => r.data),
    enabled: !!campaignId,
    staleTime: 2 * 60_000,
  });
}
