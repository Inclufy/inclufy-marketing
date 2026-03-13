import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SocialAccount {
  id: string;
  platform: string;
  platform_account_id: string;
  account_name: string | null;
  profile_image_url: string | null;
  status: string;
  connected_at: string;
}

export function useSocialAccounts() {
  return useQuery<SocialAccount[]>({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('connected_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SocialAccount[];
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useConnectSocial() {
  return useMutation({
    mutationFn: async (platform: string) => {
      // OAuth flows require a backend — return a placeholder URL
      // In production, this would call a Supabase Edge Function
      return { authorization_url: `/auth/social/${platform}` };
    },
  });
}

export function useDisconnectSocial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('id', accountId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-accounts'] }),
  });
}

export function useRefreshSocialToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('social_accounts')
        .update({ status: 'connected', connected_at: new Date().toISOString() })
        .eq('id', accountId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['social-accounts'] }),
  });
}
