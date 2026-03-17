/**
 * Attendee management hooks for event registration & sign-up.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AttendeeStatus = 'registered' | 'confirmed' | 'attended' | 'cancelled' | 'no_show';
export type TicketType = 'general' | 'vip' | 'speaker' | 'sponsor' | 'staff' | 'press';
export type AttendeeSource = 'manual' | 'qr_scan' | 'form' | 'import' | 'invitation';

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string | null;
  name: string;
  email: string;
  company: string;
  phone: string;
  job_title: string;
  notes: string;
  status: AttendeeStatus;
  ticket_type: TicketType;
  source: AttendeeSource;
  registered_at: string;
  confirmed_at: string | null;
  attended_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AttendeeInsert = {
  event_id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  job_title?: string;
  notes?: string;
  status?: AttendeeStatus;
  ticket_type?: TicketType;
  source?: AttendeeSource;
};

export interface AttendeeStats {
  total: number;
  registered: number;
  confirmed: number;
  attended: number;
  cancelled: number;
  noShow: number;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

/**
 * Fetch all attendees for an event.
 */
export function useEventAttendees(eventId: string | undefined) {
  return useQuery<EventAttendee[]>({
    queryKey: ['event-attendees', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await supabase
        .from('go_event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false });

      if (error) throw error;
      return (data || []) as EventAttendee[];
    },
    enabled: !!eventId,
    staleTime: 30_000,
  });
}

/**
 * Get attendee statistics for an event.
 */
export function useAttendeeStats(eventId: string | undefined) {
  const { data: attendees = [] } = useEventAttendees(eventId);

  const stats: AttendeeStats = {
    total: attendees.length,
    registered: attendees.filter(a => a.status === 'registered').length,
    confirmed: attendees.filter(a => a.status === 'confirmed').length,
    attended: attendees.filter(a => a.status === 'attended').length,
    cancelled: attendees.filter(a => a.status === 'cancelled').length,
    noShow: attendees.filter(a => a.status === 'no_show').length,
  };

  return stats;
}

/**
 * Add a new attendee to an event.
 */
export function useAddAttendee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AttendeeInsert) => {
      const { data, error } = await supabase
        .from('go_event_attendees')
        .insert({
          event_id: input.event_id,
          name: input.name,
          email: input.email || '',
          company: input.company || '',
          phone: input.phone || '',
          job_title: input.job_title || '',
          notes: input.notes || '',
          status: input.status || 'registered',
          ticket_type: input.ticket_type || 'general',
          source: input.source || 'manual',
        })
        .select()
        .single();

      if (error) throw error;
      return data as EventAttendee;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['event-attendees', data.event_id] });
    },
  });
}

/**
 * Update attendee status or details.
 */
export function useUpdateAttendee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      eventId,
      ...patch
    }: Partial<EventAttendee> & { id: string; eventId: string }) => {
      const updateData: Record<string, any> = { ...patch };
      delete updateData.eventId;

      // Auto-set timestamps based on status changes
      if (patch.status === 'confirmed' && !patch.confirmed_at) {
        updateData.confirmed_at = new Date().toISOString();
      }
      if (patch.status === 'attended' && !patch.attended_at) {
        updateData.attended_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('go_event_attendees')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as EventAttendee;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['event-attendees', variables.eventId] });
    },
  });
}

/**
 * Remove an attendee from an event.
 */
export function useRemoveAttendee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase
        .from('go_event_attendees')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['event-attendees', variables.eventId] });
    },
  });
}

/**
 * Bulk import attendees (from CSV/list).
 */
export function useBulkAddAttendees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      eventId,
      attendees,
    }: {
      eventId: string;
      attendees: Array<{ name: string; email?: string; company?: string; ticket_type?: TicketType }>;
    }) => {
      const rows = attendees.map(a => ({
        event_id: eventId,
        name: a.name,
        email: a.email || '',
        company: a.company || '',
        ticket_type: a.ticket_type || 'general',
        source: 'import' as AttendeeSource,
      }));

      const { data, error } = await supabase
        .from('go_event_attendees')
        .upsert(rows, { onConflict: 'event_id,email', ignoreDuplicates: true })
        .select();

      if (error) throw error;
      return (data || []) as EventAttendee[];
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['event-attendees', variables.eventId] });
    },
  });
}
