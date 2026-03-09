import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  starts_at?: string;
  ends_at?: string;
  budget_amount?: number;
  audience_filters?: Record<string, any>;
  content?: Record<string, any>;
  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface CampaignListParams {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}

export function useCampaigns(params?: CampaignListParams) {
  return useQuery<Campaign[]>({
    queryKey: ['campaigns', params],
    queryFn: () => api.get('/campaigns/', { params }).then(r => r.data),
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useCampaign(id: string | undefined) {
  return useQuery<Campaign>({
    queryKey: ['campaigns', id],
    queryFn: () => api.get(`/campaigns/${id}`).then(r => r.data),
    enabled: !!id,
  });
}

export function useLaunchCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/launch`).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}
