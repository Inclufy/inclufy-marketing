import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import api from '../services/api';

// ─── Types ──────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  event_id: string;
  user_id: string;
  invited_by: string;
  role: 'owner' | 'editor' | 'contributor' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  invited_at: string;
  accepted_at: string | null;
  // Joined from users (email lookup)
  email?: string;
}

// ─── Hooks ──────────────────────────────────────────────────────────

/** List team members for an event */
export function useTeamMembers(eventId: string | undefined) {
  return useQuery<TeamMember[]>({
    queryKey: ['team-members', eventId],
    queryFn: async () => {
      if (!eventId) return [];

      const response = await api.get(`/events/${eventId}/team`);
      return (response.data?.members || []) as TeamMember[];
    },
    enabled: !!eventId,
    staleTime: 30_000,
  });
}

/** Invite a user to an event team by email */
export function useInviteTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, email, role }: { eventId: string; email: string; role?: string }) => {
      const response = await api.post(`/events/${eventId}/team`, {
        email,
        role: role || 'contributor',
      });
      return response.data as TeamMember;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['team-members', variables.eventId] });
    },
  });
}

/** Update a team member (role, accept/decline) */
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
      const response = await api.put(`/events/${eventId}/team/${memberId}`, {
        role,
        status,
      });
      return response.data as TeamMember;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['team-members', variables.eventId] });
      qc.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

/** Remove a team member */
export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, memberId }: { eventId: string; memberId: string }) => {
      await api.delete(`/events/${eventId}/team/${memberId}`);
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
