import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export interface Contact {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  city: string | null;
  tags: string[];
  attributes: Record<string, unknown>;
  source: string | null;
  email_consent: boolean;
  created_at: string;
}

export function useContacts(search?: string) {
  return useQuery<Contact[]>({
    queryKey: ['contacts', search],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return [];

      let query = supabase
        .from('go_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) {
        console.warn('useContacts error:', error.message);
        return [];
      }
      // Map go_contacts columns to Contact interface
      return (data || []).map((row: any) => ({
        id: row.id,
        email: row.email ?? null,
        phone: row.phone ?? null,
        first_name: row.name?.split(' ')[0] ?? null,
        last_name: row.name?.split(' ').slice(1).join(' ') ?? null,
        country: row.country ?? null,
        city: row.city ?? null,
        tags: Array.isArray(row.tags) ? row.tags : [],
        attributes: typeof row.attributes === 'object' && row.attributes ? row.attributes : {},
        source: row.source ?? null,
        email_consent: row.email_consent ?? false,
        created_at: row.created_at ?? '',
      })) as Contact[];
    },
    staleTime: 60_000,
  });
}

export function useContactStats() {
  return useQuery({
    queryKey: ['contacts', 'stats'],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return { total: 0, this_month: 0, with_email: 0 };

      const { count: total } = await supabase
        .from('go_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: this_month } = await supabase
        .from('go_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      const { count: with_email } = await supabase
        .from('go_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('email', 'is', null);

      return { total: total ?? 0, this_month: this_month ?? 0, with_email: with_email ?? 0 };
    },
    staleTime: 120_000,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: Partial<Contact> & { company?: string; title?: string; event_id?: string }) => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) throw new Error('Niet ingelogd');

      // Build full name from first_name + last_name
      const nameParts = [contact.first_name, contact.last_name].filter(Boolean);
      const name = nameParts.length > 0 ? nameParts.join(' ') : null;

      const row: Record<string, any> = {
        user_id: user.id,
        name: name || contact.email || 'Onbekend',
        email: contact.email || null,
        phone: contact.phone || null,
        company: (contact as any).company || null,
        source: contact.source || 'card_scan',
        tags: Array.isArray(contact.tags) ? contact.tags : ['card-scan'],
        attributes: {
          ...(typeof contact.attributes === 'object' ? contact.attributes : {}),
          title: (contact as any).title || undefined,
          captured_via: 'card_scan',
        },
      };

      if ((contact as any).event_id) row.event_id = (contact as any).event_id;

      const { data, error } = await supabase
        .from('go_contacts')
        .upsert(row, { onConflict: 'user_id,email', ignoreDuplicates: false })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
