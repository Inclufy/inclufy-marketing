// Supabase Edge Function: Orchestrator
//
// Single dispatch entry point for the AMOS Multi-Agent System.
// Receives a goal, looks up the registered agents for the org, asks OpenAI
// (tool-calling) which agent(s) should run, dispatches to the agent edge
// functions, persists the trace into agent_runs + agent_run_messages, and gates
// any spend/publish action behind requires_approval=true.
//
// Companion to: MultiAgentScreen.tsx (UI), agent-ads (first real backend),
// supabase/migrations/20260509060000_multi_agent_system.sql (schema).
//
// Routes:
//   POST /orchestrator/dispatch   { organization_id, goal, input?, agent_kind? }
//   POST /orchestrator/approve    { run_id }
//   GET  /orchestrator/runs?organization_id=...&limit=20
//
// Auth: requires JWT. RLS is enforced via the user-scoped supabase client for
// reads; writes use the service-role client only after we've verified the
// caller is an org member.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENAI_API_KEY      = Deno.env.get('OPENAI_API_KEY') ?? '';
const SUPABASE_URL        = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY   = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function jsonResp(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function errResp(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return jsonResp({ error: message, ...extra }, status);
}

// ─── Tool catalog exposed to OpenAI ───────────────────────────────────────
// Each tool here corresponds to one agent edge function. The orchestrator
// never executes business logic itself — it routes to these.
const AGENT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'dispatch_ads_agent',
      description:
        'Promote a post or draft a paid campaign brief on LinkedIn / Google / Meta. ' +
        'Writes to campaign_costs and reads social_accounts. REQUIRES APPROVAL before any spend.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['boost_post', 'draft_campaign', 'pace_budget', 'report_roas'],
            description: 'Which ads sub-action to run.',
          },
          post_id: { type: 'string', description: 'go_posts.id when boosting an existing post.' },
          campaign_id: { type: 'string', description: 'campaigns.id when working on a campaign.' },
          channel: {
            type: 'string',
            enum: ['linkedin', 'google', 'meta', 'tiktok'],
          },
          budget_eur: { type: 'number', description: 'Total budget proposal in EUR.' },
          audience: { type: 'object', description: 'Targeting parameters per channel.' },
          notes: { type: 'string' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'dispatch_content_agent',
      description: 'Generate marketing copy / captions / ad copy. Wraps event-studio-ai.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['generate_post', 'generate_ad_copy', 'rewrite'] },
          context: { type: 'object' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'dispatch_social_agent',
      description: 'Schedule or publish posts via publish-social. REQUIRES APPROVAL for live publishing.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['schedule', 'publish_now', 'reply'] },
          post_id: { type: 'string' },
          channel: { type: 'string' },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'dispatch_analytics_agent',
      description: 'Compute KPIs and detect anomalies. Read-only — never requires approval.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['weekly_report', 'detect_anomalies', 'campaign_roas'] },
          window_days: { type: 'number', default: 7 },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'dispatch_lead_agent',
      description: 'Score, enrich, and nurture leads. Requires approval before any outbound send.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['score', 'nurture_sequence', 'sync_crm'] },
          lead_id: { type: 'string' },
        },
        required: ['action'],
      },
    },
  },
];

// Map tool name → (agent kind, edge function path, requires_approval default)
const TOOL_TO_AGENT: Record<string, { kind: string; fn: string; requiresApproval: boolean }> = {
  dispatch_ads_agent:       { kind: 'ads',       fn: 'agent-ads',       requiresApproval: true  },
  dispatch_content_agent:   { kind: 'content',   fn: 'event-studio-ai', requiresApproval: false },
  dispatch_social_agent:    { kind: 'social',    fn: 'publish-social',  requiresApproval: true  },
  dispatch_analytics_agent: { kind: 'analytics', fn: 'agent-analytics', requiresApproval: false },
  dispatch_lead_agent:      { kind: 'lead',      fn: 'agent-lead',      requiresApproval: true  },
};

interface DispatchInput {
  organization_id: string;
  goal: string;
  input?: Record<string, unknown>;
  agent_kind?: string;        // Optional: skip planner, dispatch directly
}

// ─── Helpers ───────────────────────────────────────────────────────────────
async function getUserClient(req: Request): Promise<{ user: any; client: SupabaseClient } | null> {
  const auth = req.headers.get('Authorization');
  if (!auth) return null;
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  return { user, client };
}

function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function assertOrgMember(svc: SupabaseClient, orgId: string, userId: string): Promise<boolean> {
  const { data, error } = await svc
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}

async function callOpenAI(messages: object[], tools: object[], model = 'gpt-4o-mini') {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model,
      messages,
      tools,
      tool_choice: 'auto',
      max_tokens: 1500,
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  return await res.json();
}

// ─── Action: dispatch ──────────────────────────────────────────────────────
async function handleDispatch(req: Request) {
  const ctx = await getUserClient(req);
  if (!ctx) return errResp('Unauthorized', 401);
  const body = (await req.json()) as DispatchInput;
  if (!body.organization_id || !body.goal) {
    return errResp('organization_id and goal are required');
  }

  const svc = serviceClient();
  const isMember = await assertOrgMember(svc, body.organization_id, ctx.user.id);
  if (!isMember) return errResp('Not a member of this organization', 403);

  // Look up registered agents for this org.
  const { data: agents, error: agentsErr } = await svc
    .from('agents')
    .select('id, kind, status, config')
    .eq('organization_id', body.organization_id);
  if (agentsErr) return errResp(`Failed to load agents: ${agentsErr.message}`, 500);
  if (!agents?.length) return errResp('No agents registered for this organization', 404);

  const agentByKind = Object.fromEntries(agents.map(a => [a.kind, a]));

  // ── Direct dispatch path (agent_kind provided, skip planner) ──
  let plannedToolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
  if (body.agent_kind) {
    const toolName = Object.entries(TOOL_TO_AGENT).find(([, v]) => v.kind === body.agent_kind)?.[0];
    if (!toolName) return errResp(`Unknown agent_kind: ${body.agent_kind}`);
    plannedToolCalls = [{ name: toolName, args: body.input ?? {} }];
  } else {
    // ── Planner path: ask OpenAI which agent(s) to run ──
    const planMessages = [
      {
        role: 'system',
        content:
          'You are the AMOS orchestrator. Given a marketing goal, select the right agent tool(s) ' +
          'to execute. Prefer one tool when sufficient. Never invent post_id / campaign_id; only ' +
          'use IDs explicitly present in the input. If the user wants paid promotion, use ' +
          'dispatch_ads_agent. Output tool calls only.',
      },
      {
        role: 'user',
        content: `Goal: ${body.goal}\nInput: ${JSON.stringify(body.input ?? {})}`,
      },
    ];
    const plan = await callOpenAI(planMessages, AGENT_TOOLS);
    const calls = plan.choices?.[0]?.message?.tool_calls ?? [];
    plannedToolCalls = calls.map((c: any) => ({
      name: c.function.name,
      args: (() => { try { return JSON.parse(c.function.arguments); } catch { return {}; } })(),
    }));
  }

  if (!plannedToolCalls.length) {
    return errResp('Planner produced no tool calls', 422, { goal: body.goal });
  }

  // Create one parent run for the orchestrator + child runs per tool call.
  const orchestratorAgent = agentByKind['orchestrator'];
  const { data: parentRun, error: parentErr } = await svc
    .from('agent_runs')
    .insert({
      organization_id: body.organization_id,
      agent_id: orchestratorAgent?.id ?? agents[0].id,
      initiated_by_user: ctx.user.id,
      trigger: 'manual',
      goal: body.goal,
      input: body.input ?? {},
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (parentErr) return errResp(`Failed to create parent run: ${parentErr.message}`, 500);

  const childRuns: Array<{ id: string; tool: string; status: string }> = [];

  for (const call of plannedToolCalls) {
    const route = TOOL_TO_AGENT[call.name];
    if (!route) continue;
    const childAgent = agentByKind[route.kind];
    if (!childAgent) {
      childRuns.push({ id: '-', tool: call.name, status: 'skipped_no_agent' });
      continue;
    }

    // ── Kill switch + daily caps (Tier-1 #3) ──
    // agents.config: { paused, daily_token_cap, daily_spend_cap_eur }
    const cfg = (childAgent.config ?? {}) as Record<string, unknown>;
    if (cfg.paused === true) {
      const { data: r } = await svc.from('agent_runs').insert({
        organization_id: body.organization_id,
        agent_id: childAgent.id,
        parent_run_id: parentRun.id,
        initiated_by_user: ctx.user.id,
        trigger: 'agent_chain',
        goal: call.name,
        input: call.args,
        status: 'blocked',
        error_message: `Agent ${route.kind} is paused by config.`,
        finished_at: new Date().toISOString(),
      }).select('id').single();
      childRuns.push({ id: r?.id ?? '-', tool: call.name, status: 'blocked_paused' });
      continue;
    }
    // Compare today's tokens / spend on this agent against caps.
    const tokenCap = typeof cfg.daily_token_cap === 'number' ? cfg.daily_token_cap : null;
    const spendCap = typeof cfg.daily_spend_cap_eur === 'number' ? cfg.daily_spend_cap_eur : null;
    if (tokenCap != null || spendCap != null) {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const { data: usage } = await svc
        .from('agent_runs')
        .select('prompt_tokens, completion_tokens, cost_usd')
        .eq('agent_id', childAgent.id)
        .gte('created_at', todayStart.toISOString());
      const tokensToday = (usage ?? []).reduce(
        (s: number, x: any) => s + (x.prompt_tokens ?? 0) + (x.completion_tokens ?? 0), 0,
      );
      // cost_usd ≈ EUR for cap-preview purposes (orchestrator stays simple;
      // exact paid spend is tracked in campaign_costs separately).
      const spendUsdToday = (usage ?? []).reduce(
        (s: number, x: any) => s + Number(x.cost_usd ?? 0), 0,
      );
      const overTokens = tokenCap != null && tokensToday >= tokenCap;
      const overSpend  = spendCap != null && spendUsdToday >= spendCap;
      if (overTokens || overSpend) {
        const { data: r } = await svc.from('agent_runs').insert({
          organization_id: body.organization_id,
          agent_id: childAgent.id,
          parent_run_id: parentRun.id,
          initiated_by_user: ctx.user.id,
          trigger: 'agent_chain',
          goal: call.name,
          input: call.args,
          status: 'blocked',
          error_message: overTokens
            ? `Daily token cap reached (${tokensToday}/${tokenCap}).`
            : `Daily spend cap reached (${spendUsdToday.toFixed(2)}/${spendCap} EUR).`,
          finished_at: new Date().toISOString(),
        }).select('id').single();
        childRuns.push({ id: r?.id ?? '-', tool: call.name, status: 'blocked_cap' });
        continue;
      }
    }

    // 'coming' agents short-circuit to blocked status — visible in UI.
    if (childAgent.status === 'coming' || childAgent.status === 'disabled') {
      const { data: r } = await svc.from('agent_runs').insert({
        organization_id: body.organization_id,
        agent_id: childAgent.id,
        parent_run_id: parentRun.id,
        initiated_by_user: ctx.user.id,
        trigger: 'agent_chain',
        goal: `${call.name}`,
        input: call.args,
        status: 'blocked',
        error_message: `Agent ${route.kind} is not yet active (status=${childAgent.status}).`,
        finished_at: new Date().toISOString(),
      }).select('id').single();
      childRuns.push({ id: r?.id ?? '-', tool: call.name, status: 'blocked' });
      continue;
    }

    // Real dispatch — create awaiting_approval if the route requires it,
    // otherwise queued for synchronous execution.
    const initialStatus = route.requiresApproval ? 'awaiting_approval' : 'queued';
    const { data: r } = await svc.from('agent_runs').insert({
      organization_id: body.organization_id,
      agent_id: childAgent.id,
      parent_run_id: parentRun.id,
      initiated_by_user: ctx.user.id,
      trigger: 'agent_chain',
      goal: call.name,
      input: call.args,
      status: initialStatus,
      requires_approval: route.requiresApproval,
    }).select('id').single();
    childRuns.push({ id: r?.id ?? '-', tool: call.name, status: initialStatus });
  }

  // Mark parent as awaiting if any child is awaiting; otherwise running.
  const anyAwait = childRuns.some(c => c.status === 'awaiting_approval');
  await svc.from('agent_runs').update({
    status: anyAwait ? 'awaiting_approval' : 'completed',
    output: { child_runs: childRuns },
    finished_at: anyAwait ? null : new Date().toISOString(),
    requires_approval: anyAwait,
  }).eq('id', parentRun.id);

  return jsonResp({
    parent_run_id: parentRun.id,
    children: childRuns,
    requires_approval: anyAwait,
  });
}

// ─── Action: approve ───────────────────────────────────────────────────────
async function handleApprove(req: Request) {
  const ctx = await getUserClient(req);
  if (!ctx) return errResp('Unauthorized', 401);
  const { run_id } = (await req.json()) as { run_id?: string };
  if (!run_id) return errResp('run_id is required');

  const svc = serviceClient();
  const { data: run, error } = await svc
    .from('agent_runs')
    .select('id, organization_id, status, requires_approval, agent_id, input, goal')
    .eq('id', run_id)
    .maybeSingle();
  if (error || !run) return errResp('Run not found', 404);
  if (!run.requires_approval) return errResp('Run does not require approval');

  const isMember = await assertOrgMember(svc, run.organization_id, ctx.user.id);
  if (!isMember) return errResp('Not a member of this organization', 403);

  await svc.from('agent_runs').update({
    status: 'queued',
    approved_by_user: ctx.user.id,
    approved_at: new Date().toISOString(),
  }).eq('id', run_id);

  // The actual edge-function dispatch happens asynchronously by a worker
  // (or by a follow-up cron). For Phase 1 we leave it queued — the agent-ads
  // function can be invoked client-side or by scheduled-publisher.
  return jsonResp({ run_id, status: 'queued' });
}

// ─── Action: list runs ─────────────────────────────────────────────────────
async function handleListRuns(req: Request) {
  const ctx = await getUserClient(req);
  if (!ctx) return errResp('Unauthorized', 401);
  const url = new URL(req.url);
  const orgId = url.searchParams.get('organization_id');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20', 10), 100);
  if (!orgId) return errResp('organization_id is required');

  // Use the user-scoped client so RLS filters automatically.
  const { data, error } = await ctx.client
    .from('agent_runs')
    .select('id, agent_id, parent_run_id, goal, status, requires_approval, created_at, finished_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return errResp(error.message, 500);
  return jsonResp({ runs: data ?? [] });
}

// ─── Router ────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/orchestrator/, '') || '/';

  try {
    if (req.method === 'POST' && path === '/dispatch') return await handleDispatch(req);
    if (req.method === 'POST' && path === '/approve')  return await handleApprove(req);
    if (req.method === 'GET'  && path === '/runs')     return await handleListRuns(req);
    return errResp(`Unknown route: ${req.method} ${path}`, 404);
  } catch (e) {
    return errResp(e instanceof Error ? e.message : 'Internal error', 500);
  }
});
