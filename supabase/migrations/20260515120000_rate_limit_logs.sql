-- ──────────────────────────────────────────────────────────────────────────
-- Per-user rate-limit logs (Sprint-2 item #6)
--
-- Defense in depth against:
--   1. Email-spam abuse — one user (or a bug) hammering send-email and
--      eating Resend quota / triggering Resend deliverability sanctions.
--   2. Push-spam abuse — same shape for send-push. The X-Internal-Secret
--      gate (commit 7071817) closes the unauthenticated-relay attack
--      surface, but a logged-in user with a valid session can still
--      drive a bot loop and rack up cost / notifications.
--
-- Strategy:
--   email_send_log already exists from 2026-05-10 and captures every
--     send keyed on `recipient`. Reuse it — add an index for fast
--     "count emails to <recipient> in last hour" lookups.
--   push_send_log is NEW — there was no per-(user, time) log for push
--     before today. Tracks every send-push event with the target user_id
--     so we can count + cap per user per window.
--
-- Limits default (configurable via env vars on the edge function):
--   MAX_EMAILS_PER_HOUR_PER_USER = 20
--   MAX_PUSHES_PER_HOUR_PER_USER = 100
--
-- Both edge functions consult these tables BEFORE invoking the upstream
-- provider, and return HTTP 429 with Retry-After header when capped.
-- 429 responses are also recorded with status='rate_limited' so abuse
-- analytics can detect the pattern.
-- ──────────────────────────────────────────────────────────────────────────

-- ─── 1. Index for fast "recent emails per recipient" ──────────────────
-- email_send_log already exists from 20260510140000_email_log_and_suppressions.
-- Adding an index that the rate-limit count query can sargable-scan.
create index if not exists email_send_log_recipient_sent_idx
  on public.email_send_log (recipient, sent_at desc);

-- ─── 2. Allow the new 'rate_limited' status value ─────────────────────
-- email_send_log.status is a free-form text today; this is just docs.
comment on column public.email_send_log.status is
  'sent | delivered | bounced | complained | failed | suppressed | rate_limited';

-- ─── 3. push_send_log — new table for per-user push tracking ──────────
create table if not exists public.push_send_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  expo_push_id  text,         -- Expo ticket id, null when push was rate-limited
  title         text,
  body          text,
  status        text not null default 'sent'
                check (status in ('sent', 'failed', 'rate_limited', 'no_devices')),
  status_detail text,
  metadata      jsonb default '{}'::jsonb,
  sent_at       timestamptz not null default now()
);

create index if not exists push_send_log_user_sent_idx
  on public.push_send_log (user_id, sent_at desc);

create index if not exists push_send_log_status_recent_idx
  on public.push_send_log (status, sent_at desc)
  where status in ('rate_limited', 'failed');

-- ─── 4. RLS — service-role writes; admins of the recipient's org read ─
alter table public.push_send_log enable row level security;

drop policy if exists push_send_log_admin_read on public.push_send_log;
create policy push_send_log_admin_read
  on public.push_send_log
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );

comment on table public.push_send_log is
  'Per-send log of native push notifications, keyed on the recipient user_id. Consulted by send-push for per-user rate-limit windows. Audit log for abuse forensics.';

-- ─── 5. Helper view — rate-limit-summary per user, last hour ──────────
create or replace view public.v_push_rate_summary_1h as
  select
    user_id,
    count(*) filter (where status = 'sent')          as sent_1h,
    count(*) filter (where status = 'rate_limited')  as rate_limited_1h,
    count(*) filter (where status = 'failed')        as failed_1h,
    max(sent_at)                                     as last_send_at
  from public.push_send_log
  where sent_at > now() - interval '1 hour'
  group by user_id;

comment on view public.v_push_rate_summary_1h is
  'Quick-glance per-user push send rates over the trailing hour. Useful in the breach response runbook §6 Scenario D (push spam regression).';
