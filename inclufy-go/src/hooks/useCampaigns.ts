import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

export interface Campaign {
  id: string;
  organization_id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'multi-channel';
  description: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget_amount: number | null;
  audience_filters: Record<string, unknown>;
  content: Record<string, unknown>;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useCampaigns(status?: string) {
  return useQuery<Campaign[]>({
    queryKey: ['campaigns', status],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (status) params.status = status;
      const response = await api.get('/campaigns', { params });
      return (response.data?.campaigns || response.data || []) as Campaign[];
    },
    staleTime: 60_000,
  });
}

export function useCampaign(campaignId: string | undefined) {
  return useQuery<Campaign | null>({
    queryKey: ['campaigns', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const response = await api.get(`/campaigns/${campaignId}`);
      return (response.data?.campaign || response.data) as Campaign;
    },
    enabled: !!campaignId,
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<Campaign>) => {
      const response = await api.patch(`/campaigns/${id}`, patch);
      return response.data;
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
      const response = await api.get(`/analytics/campaigns/${campaignId}`);
      return response.data;
    },
    enabled: !!campaignId,
    staleTime: 120_000,
  });
}
