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
import {
  checkAiQuota,
  logAiCall,
  rateLimitResponse,
} from '../_shared/ai-rate-limit.ts';

const OPENAI_API_KEY      = Deno.env.get('OPENAI_API_KEY') ?? '';
const SUPABASE_URL        = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY   = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const FN_NAME = 'orchestrator';

/** Per-request AI logging context. Null when running service-role (cron). */
interface AiCtx {
  supa: SupabaseClient;
  userId: string;
  organizationId: string | null;
}

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

async function callOpenAI(ctx: AiCtx | null, messages: object[], tools: object[], model = 'gpt-4o-mini') {
  try {
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
    const data = await res.json();
    if (ctx) {
      await logAiCall(ctx.supa, {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        functionName: FN_NAME,
        provider: 'openai',
        model,
        inputTokens: data.usage?.prompt_tokens ?? null,
        outputTokens: data.usage?.completion_tokens ?? null,
        status: 'sent',
      });
    }
    return data;
  } catch (err) {
    if (ctx) {
      await logAiCall(ctx.supa, {
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        functionName: FN_NAME,
        provider: 'openai',
        model,
        status: 'failed',
        statusDetail: (err as Error).message?.slice(0, 500),
      });
    }
    throw err;
  }
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

  // ─── AI rate-limit (Sprint-3 #17): per-user cap on planner LLM calls ──
  const quota = await checkAiQuota(svc, { userId: ctx.user.id, functionName: FN_NAME });
  if (!quota.ok) return rateLimitResponse(quota);
  const aiCtx: AiCtx = { supa: svc, userId: ctx.user.id, organizationId: body.organization_id };

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
    const plan = await callOpenAI(aiCtx, planMessages, AGENT_TOOLS);
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

// ─── Goal Mode helpers (Tier-2) ────────────────────────────────────────────
// Detects whether the inbound request is the cron worker (using the service-
// role key as Bearer) so /run_goals can short-circuit org-membership checks.
// We compare the raw token to SUPABASE_SERVICE_KEY rather than decoding the
// JWT — Deno doesn't ship a JWT verifier and the env var is the source of
// truth anyway.
function isServiceRoleRequest(req: Request): boolean {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token || !SUPABASE_SERVICE_KEY) return false;
  return token === SUPABASE_SERVICE_KEY;
}

interface GoalRow {
  id: string;
  organization_id: string;
  metric: string;
  target_value: number;
  target_kind: string;
  baseline_value: number | null;
  current_value: number | null;
  period_start: string;
  period_end: string;
  budget_eur: number;
  spent_eur: number;
  status: string;
  agent_kinds: string[] | null;
  config: Record<string, unknown> | null;
}

// READ-ONLY metric calculation. Never writes outside agent_runs /
// agent_goal_runs / agent_goals. Returns null if the metric is unknown or
// the underlying query errors out.
async function computeMetric(svc: SupabaseClient, goal: GoalRow): Promise<number | null> {
  const start = goal.period_start;            // DATE — inclusive
  const end   = goal.period_end;              // DATE — inclusive
  // Add one day so timestamptz columns up to 23:59:59 of `end` are included.
  const endExclusive = new Date(end);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  const endTs = endExclusive.toISOString();
  const startTs = new Date(start + 'T00:00:00.000Z').toISOString();

  switch (goal.metric) {
    case 'event_attendees': {
      const { count, error } = await svc
        .from('go_event_attendees')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', goal.organization_id)
        .gte('created_at', startTs)
        .lt('created_at', endTs);
      if (error) return null;
      return count ?? 0;
    }
    case 'revenue_eur': {
      const { data, error } = await svc
        .from('campaign_revenue')
        .select('amount')
        .eq('organization_id', goal.organization_id)
        .gte('date', start)
        .lte('date', end);
      if (error) return null;
      return (data ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
    }
    case 'posts_published': {
      const { count, error } = await svc
        .from('go_posts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', goal.organization_id)
        .not('published_at', 'is', null)
        .gte('published_at', startTs)
        .lt('published_at', endTs);
      if (error) return null;
      return count ?? 0;
    }
    case 'roas': {
      const [{ data: rev, error: revErr }, { data: cost, error: costErr }] = await Promise.all([
        svc.from('campaign_revenue')
          .select('amount')
          .eq('organization_id', goal.organization_id)
          .gte('date', start).lte('date', end),
        svc.from('campaign_costs')
          .select('amount')
          .eq('organization_id', goal.organization_id)
          .gte('date', start).lte('date', end),
      ]);
      if (revErr || costErr) return null;
      const totalRev  = (rev  ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
      const totalCost = (cost ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
      // SQL NULLIF equivalent — divide-by-zero yields null, not Infinity / NaN.
      if (totalCost === 0) return null;
      return totalRev / totalCost;
    }
    case 'followers': {
      const { data, error } = await svc
        .from('social_accounts')
        .select('metrics_json')
        .eq('organization_id', goal.organization_id);
      if (error) return null;
      let total = 0;
      for (const row of data ?? []) {
        const m = (row as any).metrics_json ?? {};
        const f = Number(m.followers ?? m.follower_count ?? 0);
        if (!Number.isNaN(f)) total += f;
      }
      return total;
    }
    default:
      // metric='leads' is gated behind a future go_leads table (design §8 risk #1).
      return null;
  }
}

function computeGap(goal: GoalRow, current: number | null): number {
  const cur = current ?? 0;
  const baseline = Number(goal.baseline_value ?? 0);
  const target   = Number(goal.target_value);
  switch (goal.target_kind) {
    case 'absolute':  return target - cur;
    case 'delta_abs': return (baseline + target) - cur;
    case 'delta_pct': return (baseline * (1 + target / 100)) - cur;
    default:          return target - cur;
  }
}

// Reuses the same kill-switch / daily-cap / status-blocked logic as
// handleDispatch(), but accepts an optional budget cap so /run_goals can
// clamp every dispatched tool_args.budget_eur down to budget_cap_eur before
// the row is written. Returns the inserted child run row + the clamped
// budget actually committed (0 if the dispatch was blocked).
async function dispatchChildForGoal(
  svc: SupabaseClient,
  args: {
    organizationId: string;
    parentRunId: string;
    initiatedByUser: string | null;
    toolName: string;
    toolArgs: Record<string, unknown>;
    childAgent: { id: string; status: string; config?: Record<string, unknown> | null };
    route: { kind: string; fn: string; requiresApproval: boolean };
    budgetCapEur: number;
  },
): Promise<{ row: { id: string; status: string }; committedBudget: number }> {
  // Clamp budget_eur to the cap (Tier-2 hard constraint).
  const rawBudget = typeof args.toolArgs.budget_eur === 'number'
    ? Number(args.toolArgs.budget_eur)
    : null;
  const clamped = rawBudget == null
    ? null
    : Math.max(0, Math.min(rawBudget, args.budgetCapEur));
  const finalArgs: Record<string, unknown> = clamped == null
    ? args.toolArgs
    : { ...args.toolArgs, budget_eur: clamped };

  const cfg = (args.childAgent.config ?? {}) as Record<string, unknown>;

  // Kill switch.
  if (cfg.paused === true) {
    const { data: r } = await svc.from('agent_runs').insert({
      organization_id: args.organizationId,
      agent_id: args.childAgent.id,
      parent_run_id: args.parentRunId,
      initiated_by_user: args.initiatedByUser,
      trigger: 'agent_chain',
      goal: args.toolName,
      input: finalArgs,
      status: 'blocked',
      error_message: `Agent ${args.route.kind} is paused by config.`,
      finished_at: new Date().toISOString(),
    }).select('id').single();
    return { row: { id: r?.id ?? '-', status: 'blocked_paused' }, committedBudget: 0 };
  }

  // Daily caps.
  const tokenCap = typeof cfg.daily_token_cap === 'number' ? cfg.daily_token_cap : null;
  const spendCap = typeof cfg.daily_spend_cap_eur === 'number' ? cfg.daily_spend_cap_eur : null;
  if (tokenCap != null || spendCap != null) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const { data: usage } = await svc
      .from('agent_runs')
      .select('prompt_tokens, completion_tokens, cost_usd')
      .eq('agent_id', args.childAgent.id)
      .gte('created_at', todayStart.toISOString());
    const tokensToday = (usage ?? []).reduce(
      (s: number, x: any) => s + (x.prompt_tokens ?? 0) + (x.completion_tokens ?? 0), 0,
    );
    const spendUsdToday = (usage ?? []).reduce(
      (s: number, x: any) => s + Number(x.cost_usd ?? 0), 0,
    );
    const overTokens = tokenCap != null && tokensToday >= tokenCap;
    const overSpend  = spendCap != null && spendUsdToday >= spendCap;
    if (overTokens || overSpend) {
      const { data: r } = await svc.from('agent_runs').insert({
        organization_id: args.organizationId,
        agent_id: args.childAgent.id,
        parent_run_id: args.parentRunId,
        initiated_by_user: args.initiatedByUser,
        trigger: 'agent_chain',
        goal: args.toolName,
        input: finalArgs,
        status: 'blocked',
        error_message: overTokens
          ? `Daily token cap reached (${tokensToday}/${tokenCap}).`
          : `Daily spend cap reached (${spendUsdToday.toFixed(2)}/${spendCap} EUR).`,
        finished_at: new Date().toISOString(),
      }).select('id').single();
      return { row: { id: r?.id ?? '-', status: 'blocked_cap' }, committedBudget: 0 };
    }
  }

  // 'coming' / 'disabled' agents.
  if (args.childAgent.status === 'coming' || args.childAgent.status === 'disabled') {
    const { data: r } = await svc.from('agent_runs').insert({
      organization_id: args.organizationId,
      agent_id: args.childAgent.id,
      parent_run_id: args.parentRunId,
      initiated_by_user: args.initiatedByUser,
      trigger: 'agent_chain',
      goal: args.toolName,
      input: finalArgs,
      status: 'blocked',
      error_message: `Agent ${args.route.kind} is not yet active (status=${args.childAgent.status}).`,
      finished_at: new Date().toISOString(),
    }).select('id').single();
    return { row: { id: r?.id ?? '-', status: 'blocked' }, committedBudget: 0 };
  }

  // Real dispatch — create awaiting_approval if route requires it,
  // otherwise queued. requires_approval defaults stay unchanged (design §7).
  const initialStatus = args.route.requiresApproval ? 'awaiting_approval' : 'queued';
  const { data: r } = await svc.from('agent_runs').insert({
    organization_id: args.organizationId,
    agent_id: args.childAgent.id,
    parent_run_id: args.parentRunId,
    initiated_by_user: args.initiatedByUser,
    trigger: 'agent_chain',
    goal: args.toolName,
    input: finalArgs,
    status: initialStatus,
    requires_approval: args.route.requiresApproval,
  }).select('id').single();
  // Spend budget is "committed" the moment we write the row — even
  // awaiting_approval rows count, because the user only needs to click once.
  const committed = clamped ?? 0;
  return { row: { id: r?.id ?? '-', status: initialStatus }, committedBudget: committed };
}

// ─── Action: run goals (cron / admin-triggered) ────────────────────────────
async function handleRunGoals(req: Request) {
  const url = new URL(req.url);
  const orgIdParam = url.searchParams.get('organization_id');
  let body: { goal_id?: string; dry_run?: boolean } = {};
  try {
    if (req.headers.get('content-length') !== '0') body = await req.json();
  } catch { /* empty body is fine */ }

  const svc = serviceClient();

  // ── 1. Auth: service-role short-circuit OR admin/owner of resolved org ──
  const isService = isServiceRoleRequest(req);
  let callerUserId: string | null = null;
  let allowedOrgIds: string[] | null = null; // null = all orgs (service-role)

  if (isService) {
    if (orgIdParam) allowedOrgIds = [orgIdParam];
  } else {
    const ctx = await getUserClient(req);
    if (!ctx) return errResp('Unauthorized', 401);
    callerUserId = ctx.user.id;

    // Find orgs where the caller is admin/owner.
    const { data: memberships, error: memErr } = await svc
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', ctx.user.id)
      .in('role', ['admin', 'owner']);
    if (memErr) return errResp(`Failed to load memberships: ${memErr.message}`, 500);
    const adminOrgIds = (memberships ?? []).map(m => m.organization_id);
    if (!adminOrgIds.length) return errResp('Admin/owner role required', 403);

    // Find orgs that actually have at least one goal.
    const { data: goalOrgs, error: gErr } = await svc
      .from('agent_goals')
      .select('organization_id')
      .in('organization_id', adminOrgIds);
    if (gErr) return errResp(`Failed to load goal orgs: ${gErr.message}`, 500);
    const uniqueGoalOrgs = Array.from(new Set((goalOrgs ?? []).map(r => r.organization_id)));

    if (orgIdParam) {
      if (!adminOrgIds.includes(orgIdParam)) return errResp('Not admin/owner of that organization', 403);
      allowedOrgIds = [orgIdParam];
    } else if (uniqueGoalOrgs.length === 1) {
      allowedOrgIds = [uniqueGoalOrgs[0]];
    } else if (uniqueGoalOrgs.length === 0) {
      return jsonResp({ evaluated: 0, met: 0, missed: 0, paused: 0, awaiting_approval: 0 });
    } else {
      return errResp('organization_id query param required (multiple goal-bearing orgs)', 400);
    }

    // ─── AI rate-limit (Sprint-3 #17): per-user cap on goal-planner LLM ──
    // Cron / service-role invocations bypass the cap (no user to bill).
    const quota = await checkAiQuota(svc, { userId: callerUserId, functionName: FN_NAME });
    if (!quota.ok) return rateLimitResponse(quota);
  }

  // ── 2. Advisory lock + load active goals ──
  // Best-effort: rpc('pg_advisory_xact_lock', ...) — if the helper RPC isn't
  // installed in this project, silently fall through. The 12h re-eval filter
  // below is still our primary idempotency gate.
  // TODO: confirm a `pg_advisory_xact_lock(bigint)` SQL function is exposed
  // via PostgREST; if not, wire this through a wrapper RPC migration.
  try {
    await svc.rpc('pg_advisory_xact_lock', { key: hash32('run_goals') });
  } catch { /* best-effort */ }

  const today = new Date().toISOString().slice(0, 10);
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

  let q = svc
    .from('agent_goals')
    .select('id, organization_id, metric, target_value, target_kind, baseline_value, current_value, period_start, period_end, budget_eur, spent_eur, status, agent_kinds, config, last_evaluated_at')
    .eq('status', 'active')
    .lte('period_start', today)
    .gte('period_end', today)
    .or(`last_evaluated_at.is.null,last_evaluated_at.lt.${twelveHoursAgo}`);
  if (allowedOrgIds) q = q.in('organization_id', allowedOrgIds);
  if (body.goal_id) q = q.eq('id', body.goal_id);

  const { data: goalsRaw, error: goalsErr } = await q;
  if (goalsErr) return errResp(`Failed to load goals: ${goalsErr.message}`, 500);
  const goals = (goalsRaw ?? []) as GoalRow[];

  // Tally for the response.
  let metCount = 0, missedCount = 0, pausedCount = 0, awaitingApproval = 0;

  // Pre-load agents per org once (batch).
  const orgIdsForRun = Array.from(new Set(goals.map(g => g.organization_id)));
  const { data: allAgents } = orgIdsForRun.length
    ? await svc.from('agents').select('id, organization_id, kind, status, config').in('organization_id', orgIdsForRun)
    : { data: [] as any[] };
  const agentsByOrg: Record<string, Record<string, any>> = {};
  for (const a of (allAgents ?? [])) {
    (agentsByOrg[a.organization_id] ??= {})[a.kind] = a;
  }

  for (const goal of goals) {
    const current = await computeMetric(svc, goal);
    const gap = computeGap(goal, current);

    // ── 5. Status transitions before any dispatch ──
    if (gap <= 0) {
      if (!body.dry_run) {
        await svc.from('agent_goals').update({
          status: 'met',
          current_value: current,
          last_evaluated_at: new Date().toISOString(),
        }).eq('id', goal.id);
        await svc.from('agent_goal_runs').insert({
          goal_id: goal.id,
          evaluated_at: new Date().toISOString(),
          current_value: current,
          gap_to_target: gap,
          actions_dispatched: [],
          parent_run_id: null,
        });
      }
      metCount++;
      continue;
    }
    if (today > goal.period_end) {
      if (!body.dry_run) {
        await svc.from('agent_goals').update({
          status: 'missed',
          current_value: current,
          last_evaluated_at: new Date().toISOString(),
        }).eq('id', goal.id);
        await svc.from('agent_goal_runs').insert({
          goal_id: goal.id,
          evaluated_at: new Date().toISOString(),
          current_value: current,
          gap_to_target: gap,
          actions_dispatched: [],
          parent_run_id: null,
        });
      }
      missedCount++;
      continue;
    }

    // ── 6. Budget cap ──
    const remainingBudget = Number(goal.budget_eur) - Number(goal.spent_eur);
    const periodEndDate = new Date(goal.period_end + 'T00:00:00.000Z');
    const todayDate     = new Date(today + 'T00:00:00.000Z');
    const daysRemaining = Math.max(
      1,
      Math.ceil((periodEndDate.getTime() - todayDate.getTime()) / 86_400_000) + 1,
    );
    const dailyAllowance = remainingBudget / daysRemaining;
    const budgetCapEur = Math.max(0, Math.min(remainingBudget, dailyAllowance));

    // ── 7. Auto-pause guard: 3 consecutive empty runs while gap > 0 ──
    const { data: lastRuns } = await svc
      .from('agent_goal_runs')
      .select('actions_dispatched, gap_to_target')
      .eq('goal_id', goal.id)
      .order('evaluated_at', { ascending: false })
      .limit(3);
    const last3 = lastRuns ?? [];
    const allEmpty =
      last3.length === 3 &&
      last3.every((r: any) => {
        const acts = Array.isArray(r.actions_dispatched) ? r.actions_dispatched : [];
        return acts.length === 0 && Number(r.gap_to_target ?? 0) > 0;
      });
    if (allEmpty) {
      if (!body.dry_run) {
        await svc.from('agent_goals').update({
          status: 'paused',
          current_value: current,
          last_evaluated_at: new Date().toISOString(),
        }).eq('id', goal.id);
        await svc.from('agent_goal_runs').insert({
          goal_id: goal.id,
          evaluated_at: new Date().toISOString(),
          current_value: current,
          gap_to_target: gap,
          actions_dispatched: [],
          parent_run_id: null,
        });
      }
      pausedCount++;
      continue;
    }

    // ── 8. Goal-aware planner ──
    const allowedKinds = (goal.agent_kinds ?? []).filter(Boolean);
    const allowedTools = AGENT_TOOLS.filter(t =>
      allowedKinds.length === 0 ||
      allowedKinds.includes(TOOL_TO_AGENT[(t as any).function.name]?.kind),
    );

    const plannerMessages = [
      {
        role: 'system',
        content:
          'You are the AMOS Goal Mode planner. Pick the agent tool(s) that move the metric ' +
          `closest to target. metric=${goal.metric}, gap=${gap}, ` +
          `budget_cap_eur=${budgetCapEur.toFixed(2)}, agent_kinds_allowed=${JSON.stringify(allowedKinds)}. ` +
          'Never propose budget_eur greater than budget_cap_eur. Output tool calls only.',
      },
      {
        role: 'user',
        content:
          `Goal: close the gap on metric "${goal.metric}". ` +
          `Current value: ${current}. Target gap: ${gap}. ` +
          `Period: ${goal.period_start} → ${goal.period_end}. ` +
          `Remaining budget: €${remainingBudget.toFixed(2)} (daily cap €${budgetCapEur.toFixed(2)}).`,
      },
    ];

    // AI logging context: only when a user initiated the run (skip cron/service).
    const goalAiCtx: AiCtx | null = callerUserId
      ? { supa: svc, userId: callerUserId, organizationId: goal.organization_id }
      : null;

    let plannedToolCalls: Array<{ name: string; args: Record<string, unknown> }> = [];
    if (allowedTools.length === 0) {
      plannedToolCalls = [];
    } else {
      try {
        const plan = await callOpenAI(goalAiCtx, plannerMessages, allowedTools);
        const calls = plan.choices?.[0]?.message?.tool_calls ?? [];
        plannedToolCalls = calls
          .map((c: any) => ({
            name: c.function?.name,
            args: (() => { try { return JSON.parse(c.function.arguments); } catch { return {}; } })(),
          }))
          .filter((c: any) => {
            const route = TOOL_TO_AGENT[c.name];
            if (!route) return false;
            if (allowedKinds.length && !allowedKinds.includes(route.kind)) return false;
            return true;
          });
      } catch (_e) {
        plannedToolCalls = [];
      }
    }

    if (body.dry_run) {
      // No writes; just count what would happen.
      continue;
    }

    // ── 9. Parent agent_runs row ──
    const orchestratorAgent = agentsByOrg[goal.organization_id]?.['orchestrator'];
    // If no orchestrator agent registered, fall back to ANY agent in the org
    // (matches handleDispatch behavior). Skip the goal if the org has no
    // agents at all.
    const fallbackAgent = orchestratorAgent ?? Object.values(agentsByOrg[goal.organization_id] ?? {})[0];
    if (!fallbackAgent) {
      // Mark eval timestamp so we don't hammer this goal next sweep.
      await svc.from('agent_goals').update({
        current_value: current,
        last_evaluated_at: new Date().toISOString(),
      }).eq('id', goal.id);
      continue;
    }

    const { data: parentRun, error: parentErr } = await svc
      .from('agent_runs')
      .insert({
        organization_id: goal.organization_id,
        agent_id: fallbackAgent.id,
        initiated_by_user: callerUserId,
        trigger: 'cron',
        goal: `goal-mode/${goal.id}`,
        input: { goal_id: goal.id, metric: goal.metric, gap, budget_cap_eur: budgetCapEur },
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (parentErr || !parentRun) continue;

    // ── 10. Dispatch each tool call via shared helper (with budget clamp) ──
    const actionsDispatched: Array<{ tool: string; run_id: string; budget_eur: number; status: string }> = [];
    let totalCommitted = 0;
    let goalAwaitingApproval = false;

    for (const call of plannedToolCalls) {
      const route = TOOL_TO_AGENT[call.name];
      if (!route) continue;
      const childAgent = agentsByOrg[goal.organization_id]?.[route.kind];
      if (!childAgent) {
        actionsDispatched.push({ tool: call.name, run_id: '-', budget_eur: 0, status: 'skipped_no_agent' });
        continue;
      }
      const result = await dispatchChildForGoal(svc, {
        organizationId: goal.organization_id,
        parentRunId: parentRun.id,
        initiatedByUser: callerUserId,
        toolName: call.name,
        toolArgs: call.args,
        childAgent,
        route,
        budgetCapEur,
      });
      actionsDispatched.push({
        tool: call.name,
        run_id: result.row.id,
        budget_eur: result.committedBudget,
        status: result.row.status,
      });
      totalCommitted += result.committedBudget;
      if (result.row.status === 'awaiting_approval') goalAwaitingApproval = true;
    }

    if (goalAwaitingApproval) awaitingApproval++;

    // Mark parent run.
    await svc.from('agent_runs').update({
      status: goalAwaitingApproval ? 'awaiting_approval' : 'completed',
      output: { actions_dispatched: actionsDispatched },
      finished_at: goalAwaitingApproval ? null : new Date().toISOString(),
      requires_approval: goalAwaitingApproval,
    }).eq('id', parentRun.id);

    // ── 11. agent_goal_runs row ──
    await svc.from('agent_goal_runs').insert({
      goal_id: goal.id,
      evaluated_at: new Date().toISOString(),
      current_value: current,
      gap_to_target: gap,
      actions_dispatched: actionsDispatched,
      parent_run_id: parentRun.id,
    });

    // ── 12. Update goal: current_value, eval timestamp, committed spend ──
    await svc.from('agent_goals').update({
      current_value: current,
      last_evaluated_at: new Date().toISOString(),
      spent_eur: Number(goal.spent_eur) + totalCommitted,
    }).eq('id', goal.id);
  }

  return jsonResp({
    evaluated: goals.length,
    met: metCount,
    missed: missedCount,
    paused: pausedCount,
    awaiting_approval: awaitingApproval,
  });
}

// Cheap deterministic 32-bit hash for advisory-lock keys (mirrors PG's
// hashtext just well enough — final lock granularity isn't security-critical).
function hash32(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h;
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
    if (req.method === 'POST' && path === '/dispatch')  return await handleDispatch(req);
    if (req.method === 'POST' && path === '/approve')   return await handleApprove(req);
    if (req.method === 'POST' && path === '/run_goals') return await handleRunGoals(req);
    if (req.method === 'GET'  && path === '/runs')      return await handleListRuns(req);
    return errResp(`Unknown route: ${req.method} ${path}`, 404);
  } catch (e) {
    return errResp(e instanceof Error ? e.message : 'Internal error', 500);
  }
});
