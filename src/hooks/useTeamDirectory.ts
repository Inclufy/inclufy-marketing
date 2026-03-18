import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export interface TeamDirectoryMember {
  id: string;
  user_id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  linkedin_url: string | null;
  bio: string;
  expertise: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export function useTeamDirectory() {
  return useQuery<TeamDirectoryMember[]>({
    queryKey: ['team-directory'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('go_team_directory')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });
      if (error) { console.warn('[useTeamDirectory] error:', error.message); return []; }
      return (data ?? []) as TeamDirectoryMember[];
    },
    staleTime: 60_000,
  });
}

export function useAddTeamDirectoryMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (member: Partial<TeamDirectoryMember>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('go_team_directory')
        .insert({ ...member, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as TeamDirectoryMember;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-directory'] }),
  });
}

export function useUpdateTeamDirectoryMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TeamDirectoryMember> & { id: string }) => {
      const { data, error } = await supabase
        .from('go_team_directory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as TeamDirectoryMember;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-directory'] }),
  });
}

export function useRemoveTeamDirectoryMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('go_team_directory').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team-directory'] }),
  });
}
