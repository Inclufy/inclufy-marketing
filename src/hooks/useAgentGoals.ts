// src/hooks/useAgentGoals.ts
// Goal Mode (Tier-2) — TanStack Query hooks over public.agent_goals and
// public.agent_goal_runs. Mirrors the data-fetch pattern used in
// AgentDetailScreen / useMarketingStrategy.
//
// Backed by:
//   - public.agent_goals          (org-scoped quarterly goals)
//   - public.agent_goal_runs      (one row per daily evaluation)
//   - edge fn: orchestrator        (POST /run_goals — admin/owner or service role)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

export type GoalMetric =
  | 'event_attendees'
  | 'revenue_eur'
  | 'posts_published'
  | 'roas'
  | 'followers';

export type GoalTargetKind = 'absolute' | 'delta_pct' | 'delta_abs';

export type GoalStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'met'
  | 'missed'
  | 'archived';

export type GoalAutonomy = 'conservative' | 'balanced' | 'aggressive';

export type GoalAgentKind = 'ads' | 'content' | 'social' | 'analytics' | 'lead';

export interface AgentGoal {
  id: string;
  organization_id: string;
  created_by_user: string | null;
  title: string;
  metric: GoalMetric;
  target_value: number;
  target_kind: GoalTargetKind;
  baseline_value: number | null;
  period_start: string; // DATE (YYYY-MM-DD)
  period_end: string;   // DATE (YYYY-MM-DD)
  budget_eur: number;
  spent_eur: number;
  current_value: number | null;
  last_evaluated_at: string | null;
  status: GoalStatus;
  autonomy_level: GoalAutonomy;
  agent_kinds: GoalAgentKind[];
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AgentGoalRun {
  id: string;
  goal_id: string;
  evaluated_at: string;
  current_value: number | null;
  gap_to_target: number | null;
  actions_dispatched: Array<{
    tool?: string;
    run_id?: string;
    budget_eur?: number;
  }>;
  parent_run_id: string | null;
}

export interface CreateGoalInput {
  organization_id: string;
  title: string;
  metric: GoalMetric;
  target_value: number;
  target_kind: GoalTargetKind;
  period_start: string;
  period_end: string;
  budget_eur: number;
  autonomy_level: GoalAutonomy;
  agent_kinds: GoalAgentKind[];
  config?: Record<string, unknown>;
}

// ─── Queries ────────────────────────────────────────────────────────────────

/**
 * Single active goal for an org. Partial unique index
 * `(organization_id, metric) WHERE status='active'` guarantees zero or one
 * row per metric, but Goal Mode v1 ships single-active-goal UX so we just
 * `.limit(1)` and pick the first.
 */
export function useActiveGoal(orgId: string | null | undefined) {
  return useQuery<AgentGoal | null>({
    queryKey: ['agent-goals', 'active', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('agent_goals')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        console.warn('[useActiveGoal] error:', error.message);
        return null;
      }
      return (data as AgentGoal | null) ?? null;
    },
    staleTime: 60_000,
  });
}

/**
 * All goals for an org, optionally filtered by status, ordered by recency.
 */
export function useAllGoals(
  orgId: string | null | undefined,
  statusFilter?: GoalStatus | GoalStatus[],
) {
  return useQuery<AgentGoal[]>({
    queryKey: ['agent-goals', 'list', orgId, statusFilter],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase
        .from('agent_goals')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (statusFilter) {
        if (Array.isArray(statusFilter)) {
          q = q.in('status', statusFilter);
        } else {
          q = q.eq('status', statusFilter);
        }
      }
      const { data, error } = await q;
      if (error) {
        console.warn('[useAllGoals] error:', error.message);
        return [];
      }
      return (data as AgentGoal[] | null) ?? [];
    },
    staleTime: 60_000,
  });
}

/**
 * Single goal by id.
 */
export function useGoal(goalId: string | null | undefined) {
  return useQuery<AgentGoal | null>({
    queryKey: ['agent-goals', 'detail', goalId],
    enabled: !!goalId,
    queryFn: async () => {
      if (!goalId) return null;
      const { data, error } = await supabase
        .from('agent_goals')
        .select('*')
        .eq('id', goalId)
        .maybeSingle();
      if (error) {
        console.warn('[useGoal] error:', error.message);
        return null;
      }
      return (data as AgentGoal | null) ?? null;
    },
    staleTime: 30_000,
  });
}

/**
 * Daily evaluation history for a goal. Newest first.
 */
export function useGoalRuns(goalId: string | null | undefined, limit = 30) {
  return useQuery<AgentGoalRun[]>({
    queryKey: ['agent-goals', 'runs', goalId, limit],
    enabled: !!goalId,
    queryFn: async () => {
      if (!goalId) return [];
      const { data, error } = await supabase
        .from('agent_goal_runs')
        .select('*')
        .eq('goal_id', goalId)
        .order('evaluated_at', { ascending: false })
        .limit(limit);
      if (error) {
        console.warn('[useGoalRuns] error:', error.message);
        return [];
      }
      return (data as AgentGoalRun[] | null) ?? [];
    },
    staleTime: 30_000,
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

/**
 * Insert a new agent_goal row with status='draft'. Activation is a separate
 * step (transition trigger logs the flip).
 */
export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('agent_goals')
        .insert({
          organization_id: input.organization_id,
          created_by_user: user.id,
          title: input.title,
          metric: input.metric,
          target_value: input.target_value,
          target_kind: input.target_kind,
          period_start: input.period_start,
          period_end: input.period_end,
          budget_eur: input.budget_eur,
          autonomy_level: input.autonomy_level,
          agent_kinds: input.agent_kinds,
          config: input.config ?? {},
          status: 'draft',
        })
        .select('*')
        .single();
      if (error) throw error;
      return data as AgentGoal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-goals'] });
    },
  });
}

/**
 * Status transition. Trigger on agent_goals enforces allowed flips
 * (draft→active, active→{paused,met,missed}, etc). UI just sends the
 * new status and surfaces the error if the trigger rejects it.
 */
export function useTransitionGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ goalId, newStatus }: { goalId: string; newStatus: GoalStatus }) => {
      const { data, error } = await supabase
        .from('agent_goals')
        .update({ status: newStatus })
        .eq('id', goalId)
        .select('*')
        .single();
      if (error) throw error;
      return data as AgentGoal;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-goals'] });
    },
  });
}

/**
 * Manually trigger the daily orchestrator sweep for goals. Admin/owner only —
 * caller must hide the button for members. We pass the user JWT; the edge
 * function does its own role check.
 */
export function useRunGoalsNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params?: { goalId?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const supabaseUrl = (supabase as unknown as { supabaseUrl: string }).supabaseUrl;
      const supabaseKey = (supabase as unknown as { supabaseKey: string }).supabaseKey;
      const res = await fetch(`${supabaseUrl}/functions/v1/orchestrator/run_goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseKey,
        },
        body: JSON.stringify(params?.goalId ? { goal_id: params.goalId } : {}),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (body && (body.error as string | undefined)) ?? `run_goals failed (${res.status})`,
        );
      }
      return body as { evaluated?: number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent-goals'] });
    },
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Check whether the current user has admin/owner role in an org. Used by
 * GoalDetail to gate Pause / Archive / Run-Now buttons.
 */
export function useOrgRole(orgId: string | null | undefined) {
  return useQuery<'owner' | 'admin' | 'member' | null>({
    queryKey: ['agent-goals', 'org-role', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.warn('[useOrgRole] error:', error.message);
        return null;
      }
      const role = data?.role as string | undefined;
      if (role === 'owner' || role === 'admin' || role === 'member') return role;
      return null;
    },
    staleTime: 5 * 60_000,
  });
}
