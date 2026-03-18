'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import type { Event } from '@/types';

const supabase = createClient();

export function useEvents(statusFilter?: string) {
  return useQuery({
    queryKey: ['events', statusFilter],
    queryFn: async () => {
      let q = supabase.from('go_events').select('*').order('event_date', { ascending: false });
      if (statusFilter && statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as Event[];
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('go_events').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Event;
    },
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: Partial<Event>) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase.from('go_events').insert({ ...event, user_id: user!.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Event> & { id: string }) => {
      const { error } = await supabase.from('go_events').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('go_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
}

export function useEventStats() {
  return useQuery({
    queryKey: ['event-stats'],
    queryFn: async () => {
      const { data } = await supabase.from('go_events').select('status');
      const events = data || [];
      return {
        total: events.length,
        upcoming: events.filter(e => e.status === 'upcoming').length,
        active: events.filter(e => e.status === 'active').length,
        completed: events.filter(e => e.status === 'completed').length,
      };
    },
  });
}
