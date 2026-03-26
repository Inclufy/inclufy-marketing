'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import type { Automation } from '@/types';

export function useAutomations() {
  return useQuery({
    queryKey: ['automations'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('go_automations').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Automation[];
    },
  });
}

export function useToggleAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase.from('go_automations').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useAutomationStats() {
  return useQuery({
    queryKey: ['automation-stats'],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase.from('go_automations').select('is_active, stats');
      const automations = data || [];
      const totalRuns = automations.reduce((s, a) => s + ((a.stats as any)?.runs || 0), 0);
      const totalSuccesses = automations.reduce((s, a) => s + ((a.stats as any)?.successes || 0), 0);
      return {
        total: automations.length,
        active: automations.filter(a => a.is_active).length,
        totalRuns,
        successRate: totalRuns > 0 ? Math.round((totalSuccesses / totalRuns) * 100) : 0,
      };
    },
  });
}
