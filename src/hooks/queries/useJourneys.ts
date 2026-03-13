import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Journey {
  id: string;
  name: string;
  description: string | null;
  status: string;
  nodes: any[];
  edges: any[];
  entry_rules: Record<string, any> | null;
  exit_rules: Record<string, any> | null;
  settings: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  enrollment_count?: number;
}

export function useJourneys(status?: string) {
  return useQuery<Journey[]>({
    queryKey: ['journeys', status],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('journeys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Journey[];
    },
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useJourney(id: string | undefined) {
  return useQuery<Journey>({
    queryKey: ['journeys', id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journeys')
        .select('*')
        .eq('id', id!)
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data as Journey;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateJourney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (journeyData: {
      name: string;
      description?: string;
      nodes?: any[];
      edges?: any[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journeys')
        .insert({
          ...journeyData,
          user_id: user.id,
          status: 'draft',
          nodes: journeyData.nodes || [],
          edges: journeyData.edges || [],
        })
        .select()
        .single();
      if (error) throw error;
      return data as Journey;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journeys'] }),
  });
}

export function useUpdateJourney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: updated, error } = await supabase
        .from('journeys')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return updated as Journey;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journeys'] }),
  });
}

export function useActivateJourney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journeys')
        .update({ status: 'active', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Journey;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journeys'] }),
  });
}

export function usePauseJourney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('journeys')
        .update({ status: 'paused', updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Journey;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journeys'] }),
  });
}

export function useEnrollContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ journeyId, contactIds }: { journeyId: string; contactIds: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update enrollment count on the journey
      const { data: journey } = await supabase
        .from('journeys')
        .select('enrollment_count')
        .eq('id', journeyId)
        .eq('user_id', user.id)
        .single();

      const currentCount = (journey as any)?.enrollment_count || 0;

      const { data, error } = await supabase
        .from('journeys')
        .update({
          enrollment_count: currentCount + contactIds.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', journeyId)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data as Journey;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['journeys'] }),
  });
}
