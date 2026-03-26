'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string;
  notes: string | null;
  created_at: string;
}

export function useContacts(search?: string) {
  return useQuery({
    queryKey: ['contacts', search],
    queryFn: async () => {
      const supabase = createClient();
      let q = supabase.from('contacts').select('*').order('created_at', { ascending: false });
      if (search?.trim()) {
        const s = search.replace(/[%_]/g, '\\$&');
        q = q.or(`name.ilike.%${s}%,email.ilike.%${s}%,company.ilike.%${s}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data as Contact[];
    },
  });
}

export function useContactStats() {
  return useQuery({
    queryKey: ['contact-stats'],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from('contacts').select('email, company, created_at');
      const contacts = data || [];
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return {
        total: contacts.length,
        thisMonth: contacts.filter(c => c.created_at >= thisMonthStart).length,
        withEmail: contacts.filter(c => c.email).length,
        withCompany: contacts.filter(c => c.company).length,
      };
    },
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: Partial<Contact>) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('contacts').insert({ ...contact, user_id: user.id }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact-stats'] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact-stats'] });
    },
  });
}
