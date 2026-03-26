import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════

export interface ActionConfig {
  type: 'send_email' | 'post_social' | 'notify_team' | 'pause_campaign' | 'generate_report';
  template?: string;
  channel?: string;
  action?: string;
  content_template?: string;
  message?: string;
  criteria?: string;
  report_type?: string;
}

export interface Automation {
  id: string;
  user_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  trigger_type: string;
  trigger_config: Record<string, any>;
  actions: ActionConfig[];
  channel: string | null;
  is_active: boolean;
  autopilot_mode: 'manual' | 'assisted' | 'autopilot';
  cooldown_minutes: number;
  max_runs_per_day: number;
  total_runs: number;
  last_run_at: string | null;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  user_id: string;
  automation_id: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  trigger_data: Record<string, any>;
  actions_executed: any[];
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  created_at: string;
  // Joined
  automation?: Pick<Automation, 'name' | 'icon' | 'color'>;
}

// ═══════════════════════════════════════════════════════
// Hooks — Automations
// ═══════════════════════════════════════════════════════

export function useAutomations() {
  return useQuery<Automation[]>({
    queryKey: ['automations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('go_automations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (error) {
        console.warn('[useAutomations] error:', error.message);
        return [];
      }
      return (data ?? []) as Automation[];
    },
    staleTime: 30_000,
  });
}

export function useCreateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (automation: Partial<Automation>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('go_automations')
        .insert({ ...automation, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Automation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useUpdateAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Automation> & { id: string }) => {
      const { data, error } = await supabase
        .from('go_automations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Automation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useDeleteAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('go_automations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

export function useToggleAutomation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('go_automations')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Automation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

/** Seed default automations for current user (calls DB function) */
export function useSeedAutomations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.rpc('seed_default_automations', {
        p_user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['automations'] }),
  });
}

// ═══════════════════════════════════════════════════════
// Hooks — Automation Logs
// ═══════════════════════════════════════════════════════

export function useAutomationLogs(automationId?: string) {
  return useQuery<AutomationLog[]>({
    queryKey: ['automation-logs', automationId ?? 'all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('go_automation_logs')
        .select('*, automation:go_automations(name, icon, color)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (automationId) {
        query = query.eq('automation_id', automationId);
      }

      const { data, error } = await query;
      if (error) {
        console.warn('[useAutomationLogs] error:', error.message);
        return [];
      }
      return (data ?? []) as AutomationLog[];
    },
    staleTime: 15_000,
  });
}

export function useCreateAutomationLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (log: Partial<AutomationLog>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('go_automation_logs')
        .insert({ ...log, user_id: user.id })
        .select()
        .single();
      if (error) throw error;

      // Update automation stats
      if (log.automation_id) {
        const rpcResult = await supabase.rpc('update_automation_stats', {
          p_automation_id: log.automation_id,
        });
        if (rpcResult.error) {
          // Fallback: manual update if RPC doesn't exist yet
          await supabase
            .from('go_automations')
            .update({
              total_runs: (data as any)?.total_runs ?? 0,
              last_run_at: new Date().toISOString(),
            })
            .eq('id', log.automation_id!);
        }
      }

      return data as AutomationLog;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['automation-logs'] });
      qc.invalidateQueries({ queryKey: ['automations'] });
    },
  });
}

// ═══════════════════════════════════════════════════════
// Hooks — Automation Stats (aggregated)
// ═══════════════════════════════════════════════════════

export interface AutomationStats {
  activeCount: number;
  totalRuns: number;
  successRate: number;
  timeSavedHours: number;
}

export function useAutomationStats() {
  return useQuery<AutomationStats>({
    queryKey: ['automation-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { activeCount: 0, totalRuns: 0, successRate: 0, timeSavedHours: 0 };

      const { data: automations } = await supabase
        .from('go_automations')
        .select('is_active, total_runs, success_rate')
        .eq('user_id', user.id);

      if (!automations || automations.length === 0) {
        return { activeCount: 0, totalRuns: 0, successRate: 0, timeSavedHours: 0 };
      }

      const activeCount = automations.filter((a: any) => a.is_active).length;
      const totalRuns = automations.reduce((sum: number, a: any) => sum + (a.total_runs || 0), 0);
      const avgSuccessRate = automations.length > 0
        ? automations.reduce((sum: number, a: any) => sum + (a.success_rate || 0), 0) / automations.length
        : 0;
      // Estimate: each automated run saves ~3 minutes of manual work
      const timeSavedHours = Math.round((totalRuns * 3 / 60) * 10) / 10;

      return {
        activeCount,
        totalRuns,
        successRate: Math.round(avgSuccessRate),
        timeSavedHours,
      };
    },
    staleTime: 30_000,
  });
}
