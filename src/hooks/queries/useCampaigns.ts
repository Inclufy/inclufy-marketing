import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('campaigns')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (params?.status) query = query.eq('status', params.status);
      if (params?.type) query = query.eq('type', params.type);
      if (params?.limit) query = query.limit(params.limit);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Campaign[];
    },
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useCampaign(id: string | undefined) {
  return useQuery<Campaign>({
    queryKey: ['campaigns', id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', id!)
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data as Campaign;
    },
    enabled: !!id,
  });
}

export function useLaunchCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('campaigns')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Campaign;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });
}
