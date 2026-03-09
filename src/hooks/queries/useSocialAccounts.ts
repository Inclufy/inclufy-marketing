import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
    queryFn: () =>
      api.get('/social-auth/accounts').then(r => r.data.accounts || []),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useConnectSocial() {
  return useMutation({
    mutationFn: async (platform: string) => {
      const response = await api.get(`/social-auth/connect/${platform}`);
      return response.data as { authorization_url: string };
    },
  });
}

export function useDisconnectSocial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      api.delete(`/social-auth/accounts/${accountId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    },
  });
}

export function useRefreshSocialToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) =>
      api.post(`/social-auth/refresh/${accountId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
    },
  });
}
