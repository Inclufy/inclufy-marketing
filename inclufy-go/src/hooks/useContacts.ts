import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

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
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const response = await api.get('/contacts', { params });
      return (response.data?.contacts || response.data || []) as Contact[];
    },
    staleTime: 60_000,
  });
}

export function useContactStats() {
  return useQuery({
    queryKey: ['contacts', 'stats'],
    queryFn: async () => {
      const response = await api.get('/contacts/stats/overview');
      return response.data;
    },
    staleTime: 120_000,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contact: Partial<Contact>) => {
      const response = await api.post('/contacts', contact);
      return response.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
