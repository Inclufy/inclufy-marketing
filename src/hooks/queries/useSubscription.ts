import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface SubscriptionStatus {
  subscribed: boolean;
  plan: string | null;
  status: string;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
}

export function useSubscription() {
  return useQuery<SubscriptionStatus>({
    queryKey: ['subscription', 'status'],
    queryFn: () => api.get('/payments/status').then(r => r.data),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCreatePortalSession() {
  return useMutation({
    mutationFn: (returnUrl?: string) =>
      api.post('/payments/customer-portal', { return_url: returnUrl }).then(r => r.data),
  });
}
