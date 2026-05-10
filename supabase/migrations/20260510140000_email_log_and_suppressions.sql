-- ──────────────────────────────────────────────────────────────────────────
-- email_send_log + email_suppressions
--
-- Purpose: deliverability monitoring + bounce-suppression for transactional
-- email sent via the send-email edge function.
--
-- Tables:
--   public.email_send_log
--     One row per Resend send attempt. resend_id is the message-id Resend
--     returns; status starts at 'sent' and is updated by the resend-webhook
--     function as Resend posts events (delivered / bounced / complained /
--     opened / clicked).
--
--   public.email_suppressions
--     Hard-bounce + complaint addresses. Checked by send-email before each
--     send; matches are skipped (with a log entry of status='suppressed').
--     Once an address lands here it stays — manual unsuppress is intentional.
--
-- Both tables live in `public` so RLS applies. Service role bypasses RLS
-- as usual; only admins should ever read these directly.
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists public.email_send_log (
  id              uuid primary key default gen_random_uuid(),
  resend_id       text unique,                    -- nullable until Resend returns
  recipient       text not null,
  email_type      text not null,                  -- e.g. 'welcome', 'issue_reported'
  locale          text default 'nl',
  subject         text,
  status          text not null default 'sent',   -- sent | delivered | bounced | complained | suppressed | failed
  status_detail   text,                            -- Resend's bounce reason / error code
  sent_at         timestamptz not null default now(),
  delivered_at    timestamptz,
  bounced_at      timestamptz,
  complained_at   timestamptz,
  opened_at       timestamptz,
  clicked_at      timestamptz,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists email_send_log_recipient_idx
  on public.email_send_log (recipient);
create index if not exists email_send_log_email_type_idx
  on public.email_send_log (email_type);
create index if not exists email_send_log_sent_at_idx
  on public.email_send_log (sent_at desc);
create index if not exists email_send_log_status_idx
  on public.email_send_log (status)
  where status in ('bounced', 'complained', 'failed');

create table if not exists public.email_suppressions (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  reason        text not null,                    -- 'hard_bounce' | 'complaint' | 'manual'
  source_event  jsonb,                            -- raw Resend event for forensics
  suppressed_at timestamptz not null default now()
);

create index if not exists email_suppressions_email_idx
  on public.email_suppressions (lower(email));

-- RLS: service-role only by default; admins can read.
alter table public.email_send_log enable row level security;
alter table public.email_suppressions enable row level security;

drop policy if exists email_send_log_admin_read on public.email_send_log;
create policy email_send_log_admin_read
  on public.email_send_log
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );

drop policy if exists email_suppressions_admin_read on public.email_suppressions;
create policy email_suppressions_admin_read
  on public.email_suppressions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );

comment on table public.email_send_log is
  'Audit log of every send-email transaction. Updated by resend-webhook on delivered/bounced/complained events.';
comment on table public.email_suppressions is
  'Addresses that should never receive mail (hard-bounce or spam-complaint). send-email checks this list before every send.';
