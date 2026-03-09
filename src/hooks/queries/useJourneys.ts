import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Journey {
  id: string;
  name: string;
  description: string | null;
  status: string;
  nodes: any[];
  edges: any[];
  entry_rules: Record<string, any> | null;
  exit_rules: Record<string, any> | null;
  settings: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  enrollment_count?: number;
}

export function useJourneys(status?: string) {
  const params = status ? `?status=${status}` : '';
  return useQuery<Journey[]>({
    queryKey: ['journeys', status],
    queryFn: () =>
      api.get(`/journeys/${params}`).then(r => r.data.journeys || []),
    staleTime: 2 * 60_000,
    retry: 1,
  });
}

export function useJourney(id: string | undefined) {
  return useQuery<Journey>({
    queryKey: ['journeys', id],
    queryFn: () => api.get(`/journeys/${id}`).then(r => r.data),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateJourney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      nodes?: any[];
      edges?: any[];
    }) => api.post('/journeys/', data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}

export function useUpdateJourney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      api.put(`/journeys/${id}`, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}

export function useActivateJourney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/journeys/${id}/activate`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}

export function usePauseJourney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/journeys/${id}/pause`).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}

export function useEnrollContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ journeyId, contactIds }: { journeyId: string; contactIds: string[] }) =>
      api.post(`/journeys/${journeyId}/enroll`, { contact_ids: contactIds }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journeys'] });
    },
  });
}
