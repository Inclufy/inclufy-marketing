-- ──────────────────────────────────────────────────────────────────────────
-- Per-user AI-call quotas (Sprint-3 item #17)
--
-- Same pattern as push_send_log (2026-05-15 #6) — every AI edge function
-- (event-studio-ai, agent-ads, agent-counterfactual, sales-chat,
-- ai-ad-variants, ai-brand-voice-analyzer, ai-connection-helper,
-- orchestrator + 2 more) consults this log BEFORE invoking the upstream
-- provider (OpenAI / Anthropic / Gemini) and returns HTTP 429 +
-- Retry-After when the per-user cap is hit.
--
-- Limits default (configurable per edge function via env var):
--   MAX_AI_CALLS_PER_HOUR_PER_USER  = 100
--   MAX_AI_CALLS_PER_DAY_PER_USER   = 1000
--
-- Scope decision (Sami, 2026-05-15): Optie A = per-user only.
-- organization_id IS still recorded in the row so a future migration to
-- Optie B/C (per-org caps) doesn't need a schema change — only a
-- middleware change.
--
-- Risks this defuses:
--   1. Infinite loop in mobile app (user spam-clicks "regenerate")
--      → ~5-20 EUR per incident in OpenAI tokens
--   2. Bot / scripted abuse with valid session
--      → 100-1000 EUR per incident
--   3. Cost overrun on the "AI providers" budget line
--   4. SOC2 / DPA audit question "how do you limit tenant resource
--      consumption?" — answer: this table + middleware
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists public.ai_call_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  organization_id uuid,                  -- nullable; set when known, no FK to allow soft-delete
  function_name   text not null,         -- 'event-studio-ai' | 'sales-chat' | ...
  provider        text,                  -- 'openai' | 'anthropic' | 'gemini' | null when blocked pre-call
  model           text,                  -- 'gpt-4o-mini' | 'claude-haiku-4-5' | ...
  input_tokens    int,
  output_tokens   int,
  status          text not null default 'sent'
                    check (status in ('sent', 'failed', 'rate_limited', 'no_credits')),
  status_detail   text,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

-- Most common query: "how many calls did user_id make in the last hour?"
create index if not exists ai_call_log_user_created_idx
  on public.ai_call_log (user_id, created_at desc);

-- Daily quota lookup uses the same index — Postgres uses a btree
-- range-scan on created_at.

-- Forensic queries: find rate-limited or failed calls
create index if not exists ai_call_log_status_recent_idx
  on public.ai_call_log (status, created_at desc)
  where status in ('rate_limited', 'failed');

-- Per-function trend analysis ("which fn is most expensive?")
create index if not exists ai_call_log_function_created_idx
  on public.ai_call_log (function_name, created_at desc);

-- Per-org rollup (for future Optie B/C migration without schema change)
create index if not exists ai_call_log_org_created_idx
  on public.ai_call_log (organization_id, created_at desc)
  where organization_id is not null;

-- ─── RLS — service role writes; org admins read ───────────────────────
alter table public.ai_call_log enable row level security;

drop policy if exists ai_call_log_admin_read on public.ai_call_log;
create policy ai_call_log_admin_read
  on public.ai_call_log
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );

comment on table public.ai_call_log is
  'Per-call log of AI provider invocations (OpenAI / Anthropic / Gemini) per user/function. Consulted by every AI edge function for per-user rate-limit windows. Audit log for cost forensics + SOC2 evidence of tenant resource limits.';

-- ─── Rate-limit summary view (1h + 24h windows per user) ──────────────
create or replace view public.v_ai_call_rate_summary as
  select
    user_id,
    count(*) filter (where created_at > now() - interval '1 hour'  and status = 'sent')          as sent_1h,
    count(*) filter (where created_at > now() - interval '24 hours' and status = 'sent')         as sent_24h,
    count(*) filter (where created_at > now() - interval '1 hour'  and status = 'rate_limited')  as rate_limited_1h,
    count(*) filter (where created_at > now() - interval '24 hours' and status = 'rate_limited') as rate_limited_24h,
    count(*) filter (where created_at > now() - interval '1 hour'  and status = 'failed')        as failed_1h,
    sum(input_tokens)  filter (where created_at > now() - interval '24 hours' and status = 'sent') as input_tokens_24h,
    sum(output_tokens) filter (where created_at > now() - interval '24 hours' and status = 'sent') as output_tokens_24h,
    max(created_at)                                                                                as last_call_at
  from public.ai_call_log
  where created_at > now() - interval '24 hours'
  group by user_id;

revoke all on public.v_ai_call_rate_summary from anon, authenticated;

comment on view public.v_ai_call_rate_summary is
  'Sprint-3 #17 — per-user AI call counts + token usage over 1h/24h windows. Use for cost monitoring + abuse detection.';

-- ─── Per-function cost rollup (90-day) ────────────────────────────────
create or replace view public.v_ai_call_cost_by_function as
  select
    function_name,
    provider,
    model,
    count(*) filter (where status = 'sent')           as calls,
    count(*) filter (where status = 'rate_limited')   as rate_limited,
    sum(input_tokens)  filter (where status = 'sent') as input_tokens_total,
    sum(output_tokens) filter (where status = 'sent') as output_tokens_total,
    count(distinct user_id) filter (where status = 'sent') as unique_users,
    max(created_at)                                    as last_call_at
  from public.ai_call_log
  where created_at > now() - interval '90 days'
  group by function_name, provider, model
  order by calls desc;

revoke all on public.v_ai_call_cost_by_function from anon, authenticated;

comment on view public.v_ai_call_cost_by_function is
  'Sprint-3 #17 — which AI function is consuming the most calls/tokens. Pair with provider pricing to estimate cost-per-fn for budgeting.';
