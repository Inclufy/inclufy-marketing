'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';

export type AgentKind =
  | 'content'
  | 'social'
  | 'ads'
  | 'analytics'
  | 'lead'
  | 'orchestrator';

export type AgentRunStatus =
  | 'queued'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'blocked';

export interface AgentRun {
  id: string;
  organization_id: string;
  agent_id: string;
  parent_run_id: string | null;
  goal: string;
  trigger: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  tool_calls: Array<Record<string, unknown>>;
  status: AgentRunStatus;
  requires_approval: boolean;
  approved_by_user: string | null;
  approved_at: string | null;
  error_message: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  related_post_id: string | null;
  related_campaign_id: string | null;
  related_event_id: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  agent: { kind: AgentKind; name: string } | null;
}

export interface AgentRunMessage {
  id: string;
  run_id: string;
  role: 'system' | 'user' | 'assistant' | 'tool' | 'agent';
  from_agent: string | null;
  to_agent: string | null;
  content: string;
  payload: Record<string, unknown>;
  created_at: string;
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export function useAgentRun(runId: string) {
  return useQuery({
    queryKey: ['agent_run', runId],
    queryFn: async (): Promise<AgentRun | null> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('agent_runs')
        .select(
          `
          id, organization_id, agent_id, parent_run_id, goal, trigger,
          input, output, tool_calls, status, requires_approval,
          approved_by_user, approved_at, error_message,
          prompt_tokens, completion_tokens, cost_usd,
          related_post_id, related_campaign_id, related_event_id,
          started_at, finished_at, created_at,
          agent:agents (kind, name)
        `
        )
        .eq('id', runId)
        .single();
      if (error) throw error;
      if (!data) return null;
      const raw = data as unknown as Record<string, unknown>;
      const rawAgent = raw.agent as
        | { kind: AgentKind; name: string }
        | Array<{ kind: AgentKind; name: string }>
        | null;
      const agent = Array.isArray(rawAgent)
        ? rawAgent[0] ?? null
        : rawAgent ?? null;
      return {
        ...(raw as unknown as AgentRun),
        agent,
        input: (raw.input as Record<string, unknown>) ?? {},
        output: (raw.output as Record<string, unknown>) ?? {},
        tool_calls: Array.isArray(raw.tool_calls)
          ? (raw.tool_calls as Array<Record<string, unknown>>)
          : [],
      };
    },
    enabled: !!runId,
  });
}

export function useAgentRunMessages(runId: string) {
  return useQuery({
    queryKey: ['agent_run_messages', runId],
    queryFn: async (): Promise<AgentRunMessage[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('agent_run_messages')
        .select(
          'id, run_id, role, from_agent, to_agent, content, payload, created_at'
        )
        .eq('run_id', runId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as AgentRunMessage[];
    },
    enabled: !!runId,
  });
}

export interface ApproveRunResponse {
  ok?: boolean;
  error?: string;
  [key: string]: unknown;
}

export function useApproveRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      run_id,
    }: {
      run_id: string;
    }): Promise<ApproveRunResponse> => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error('Not signed in');
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/orchestrator/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ run_id }),
        }
      );
      const body = (await res.json()) as ApproveRunResponse;
      if (!res.ok) throw new Error(body?.error ?? 'Approval failed');
      return body;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['agent_run', variables.run_id] });
      qc.invalidateQueries({
        queryKey: ['agent_run_messages', variables.run_id],
      });
    },
  });
}
