import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  tags?: string[];
  created_at: string;
}

interface ContactListParams {
  search?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

export function useContacts(params?: ContactListParams) {
  return useQuery<{ contacts: Contact[]; total: number }>({
    queryKey: ['contacts', params],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { contacts: [], total: 0 };

      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (params?.search) {
        query = query.or(`email.ilike.%${params.search}%,first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%`);
      }
      if (params?.tag) {
        query = query.contains('tags', [params.tag]);
      }
      if (params?.limit) query = query.limit(params.limit);
      if (params?.offset) query = query.range(params.offset, params.offset + (params.limit || 50) - 1);

      const { data, error, count } = await query;
      if (error) throw error;
      return { contacts: (data || []) as Contact[], total: count || 0 };
    },
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useContact(id: string | undefined) {
  return useQuery<Contact>({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id!)
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data as Contact;
    },
    enabled: !!id,
  });
}
