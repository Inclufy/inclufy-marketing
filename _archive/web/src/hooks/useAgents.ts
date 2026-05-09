'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export type AgentKind = 'content' | 'social' | 'ads' | 'analytics' | 'lead';
export type AgentStatus = 'active' | 'beta' | 'coming' | 'paused' | 'disabled';

export interface AgentConfig {
  paused?: boolean;
  daily_token_cap?: number | null;
  daily_spend_cap_eur?: number | null;
  [key: string]: unknown;
}

export interface AgentRow {
  id: string;
  organization_id: string;
  kind: AgentKind;
  name: string;
  description: string;
  status: AgentStatus;
  config: AgentConfig;
  capabilities: string[];
  created_at?: string;
  updated_at?: string;
}

export type AgentRunStatus =
  | 'queued'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'blocked';

export interface AgentRunRow {
  id: string;
  agent_id: string;
  parent_run_id: string | null;
  goal: string;
  status: AgentRunStatus;
  requires_approval: boolean;
  created_at: string;
  finished_at: string | null;
}

// Resolve the active organization id for the current user.
// Web app stores tenant in `go_organization` (per existing useSocialAccounts pattern),
// falls back to user.id when no row exists yet (RLS will scope rows correctly anyway).
async function resolveOrgId(): Promise<string | null> {
  const supabase = createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return null;
  const userId = userData.user.id;
  try {
    const { data: goOrg } = await supabase
      .from('go_organization')
      .select('organization_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (goOrg?.organization_id) return goOrg.organization_id as string;
  } catch {}
  return userId;
}

export function useAgents() {
  return useQuery<AgentRow[]>({
    queryKey: ['agents'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('agents')
        .select('id, organization_id, kind, name, description, status, config, capabilities, created_at, updated_at')
        .order('kind', { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        ...row,
        config: (row.config as AgentConfig) ?? {},
        capabilities: Array.isArray(row.capabilities) ? row.capabilities : [],
      })) as AgentRow[];
    },
  });
}

export function useAgent(kind: string) {
  return useQuery<AgentRow | null>({
    queryKey: ['agent', kind],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('agents')
        .select('id, organization_id, kind, name, description, status, config, capabilities, created_at, updated_at')
        .eq('kind', kind)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const row = data as any;
      return {
        ...row,
        config: (row.config as AgentConfig) ?? {},
        capabilities: Array.isArray(row.capabilities) ? row.capabilities : [],
      } as AgentRow;
    },
    enabled: !!kind,
  });
}

export function useAgentRuns(agentId: string, limit = 20) {
  return useQuery<AgentRunRow[]>({
    queryKey: ['agent-runs', agentId, limit],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('agent_runs')
        .select('id, agent_id, parent_run_id, goal, status, requires_approval, created_at, finished_at')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as AgentRunRow[];
    },
    enabled: !!agentId,
  });
}

export interface UpdateAgentConfigInput {
  agentId: string;
  kind: string;
  paused: boolean;
  daily_token_cap: number | null;
  daily_spend_cap_eur: number | null;
  baseConfig?: AgentConfig;
}

export function useUpdateAgentConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateAgentConfigInput) => {
      const supabase = createClient();
      const newConfig: AgentConfig = {
        ...(input.baseConfig ?? {}),
        paused: input.paused,
        daily_token_cap: input.daily_token_cap,
        daily_spend_cap_eur: input.daily_spend_cap_eur,
      };
      const { data, error } = await supabase
        .from('agents')
        .update({ config: newConfig })
        .eq('id', input.agentId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['agent', vars.kind] });
      qc.invalidateQueries({ queryKey: ['agents'] });
    },
  });
}

export interface DispatchAgentInput {
  organization_id: string;
  goal: string;
  agent_kind: string;
  input?: Record<string, unknown>;
}

export function useDispatchAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: DispatchAgentInput) => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Niet ingelogd');

      const res = await fetch(`${SUPABASE_URL}/functions/v1/orchestrator/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          organization_id: params.organization_id,
          goal: params.goal,
          agent_kind: params.agent_kind,
          input: params.input ?? {},
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error ?? 'Dispatch mislukt');
      return body;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['agent', vars.agent_kind] });
      qc.invalidateQueries({ queryKey: ['agent-runs'] });
    },
  });
}

// Public helper so pages can resolve the org id (e.g. for dispatch).
export function useOrganizationId() {
  return useQuery<string | null>({
    queryKey: ['organization-id'],
    queryFn: resolveOrgId,
    staleTime: 60_000,
  });
}
