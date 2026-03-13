import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { subscribed: false, plan: null, status: 'inactive' };

      // Check profiles table for plan info
      const { data } = await supabase
        .from('profiles')
        .select('plan, subscription_status')
        .eq('id', user.id)
        .maybeSingle();

      return {
        subscribed: !!data?.plan && data.plan !== 'free',
        plan: (data as any)?.plan || 'enterprise',
        status: (data as any)?.subscription_status || 'active',
      };
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useCreatePortalSession() {
  return useMutation({
    mutationFn: async (returnUrl?: string) => {
      // Stripe portal sessions require a backend Edge Function
      return { url: returnUrl || '/app/settings/billing' };
    },
  });
}
