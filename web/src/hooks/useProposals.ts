'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import type { ContentProposal, ProposalStatus } from '@/types';

export function useProposals(statusFilter?: ProposalStatus) {
  return useQuery({
    queryKey: ['proposals', statusFilter],
    queryFn: async () => {
      const supabase = createClient();
      let q = supabase.from('go_content_proposals').select('*').order('created_at', { ascending: false });
      if (statusFilter) q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as ContentProposal[];
    },
  });
}

export function useProposalStats() {
  return useQuery({
    queryKey: ['proposal-stats'],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from('go_content_proposals').select('status');
      const proposals = data || [];
      return {
        total: proposals.length,
        pending: proposals.filter(p => p.status === 'pending').length,
        approved: proposals.filter(p => p.status === 'approved').length,
        rejected: proposals.filter(p => p.status === 'rejected').length,
        published: proposals.filter(p => p.status === 'published').length,
      };
    },
  });
}

export function useApproveProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from('go_content_proposals').update({ status: 'approved' }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals'] }),
  });
}

export function useRejectProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from('go_content_proposals').update({ status: 'rejected', rejection_reason: reason }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals'] }),
  });
}

export function useUpdateProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContentProposal> & { id: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from('go_content_proposals').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals'] }),
  });
}
