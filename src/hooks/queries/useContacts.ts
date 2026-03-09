import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
    queryFn: () => api.get('/contacts/', { params }).then(r => r.data),
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useContact(id: string | undefined) {
  return useQuery<Contact>({
    queryKey: ['contacts', id],
    queryFn: () => api.get(`/contacts/${id}`).then(r => r.data),
    enabled: !!id,
  });
}
