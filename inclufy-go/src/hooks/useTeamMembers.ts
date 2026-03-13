import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

// ─── Types ──────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  event_id: string;
  user_id: string;
  invited_by: string;
  role: 'owner' | 'editor' | 'contributor' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  invited_at: string;
  accepted_at: string | null;
  email?: string;
}

// ─── Hooks ──────────────────────────────────────────────────

/** List team members for an event — direct Supabase query */
export function useTeamMembers(eventId: string | undefined) {
  return useQuery<TeamMember[]>({
    queryKey: ['team-members', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const { data, error } = await supabase
        .from('go_event_members')
        .select('*')
        .eq('event_id', eventId)
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TeamMember[];
    },
    enabled: !!eventId,
    staleTime: 30_000,
  });
}

/** Invite a user to an event team by email — via Edge Function (needs admin email lookup) */
export function useInviteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, email, role }: { eventId: string; email: string; role?: string }) => {
      const { data, error } = await supabase.functions.invoke('team-invite', {
        body: { event_id: eventId, email, role: role || 'contributor' },
      });

      if (error) throw new Error(error.message || 'Uitnodiging mislukt');
      if (data?.error) throw new Error(data.error);

      return data?.member as TeamMember;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['team-members', variables.eventId] });
    },
  });
}

/** Update a team member (role, accept/decline) — direct Supabase */
export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      memberId,
      role,
      status,
    }: {
      eventId: string;
      memberId: string;
      role?: string;
      status?: string;
    }) => {
      const patch: Record<string, unknown> = {};
      if (role) patch.role = role;
      if (status) {
        patch.status = status;
        if (status === 'accepted') patch.accepted_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('go_event_members')
        .update(patch)
        .eq('id', memberId)
        .select('*')
        .single();

      if (error) throw error;
      return data as TeamMember;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['team-members', variables.eventId] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

/** Remove a team member — direct Supabase */
export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, memberId }: { eventId: string; memberId: string }) => {
      const { error } = await supabase
        .from('go_event_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['team-members', variables.eventId] });
    },
  });
}

/** Get pending invitations for the current user across all events */
export function usePendingInvitations() {
  return useQuery<TeamMember[]>({
    queryKey: ['team-invitations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('go_event_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TeamMember[];
    },
    staleTime: 30_000,
  });
}
