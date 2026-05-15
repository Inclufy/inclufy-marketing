-- ──────────────────────────────────────────────────────────────────────────
-- consent_log — server-side GDPR consent audit trail (Sprint-2 item #7)
--
-- Replaces the localStorage-only pattern that the GDPR audit flagged as
-- not-defensible-for-regulator. Each consent action (user ticks the
-- terms-of-service box on signup, accepts AI processing in the mobile
-- modal, dismisses a cookie banner, etc.) inserts a row here, giving us
-- an immutable per-event audit log we can produce on demand.
--
-- Design:
--   - user_id NULLABLE: cookie/marketing consent on a public landing
--     happens before auth. The session ID is used as anonymous handle
--     (anonymous_id column) and back-filled with user_id at signup.
--   - document_version: snapshot of the terms/privacy URL hash or
--     semver. Without it, "user accepted terms 2026-05-15" is useless
--     when the terms text changes a year later.
--   - ip_address: TRUNCATED to /24 (IPv4) or /48 (IPv6) for GDPR data
--     minimization — sufficient for geo + abuse detection, not enough
--     to identify a household.
--   - immutable: no UPDATE / DELETE allowed by RLS. Withdrawal of
--     consent creates a NEW row with accepted=false, doesn't mutate
--     the prior row.
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists public.consent_log (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  anonymous_id      text,                   -- frontend-generated UUID for pre-auth consent
  consent_type      text not null
                      check (consent_type in (
                        'terms_of_service',
                        'privacy_policy',
                        'cookies_functional',
                        'cookies_analytics',
                        'cookies_marketing',
                        'ai_processing',
                        'marketing_emails',
                        'dpa_acceptance'
                      )),
  accepted          boolean not null,
  document_version  text,                    -- e.g. 'tos-v2.1' or '2026-05-15'
  locale            text default 'nl',
  source            text                     -- 'web-signup' | 'amos-ios' | 'amos-android' | 'cookie-banner' | 'in-app'
                      check (source ~ '^[a-z0-9-]{1,40}$'),
  ip_address        inet,                    -- already truncated by edge function
  user_agent        text,
  metadata          jsonb default '{}'::jsonb,
  accepted_at       timestamptz not null default now()
);

-- Indexes for common query patterns
create index if not exists consent_log_user_idx
  on public.consent_log (user_id, consent_type, accepted_at desc)
  where user_id is not null;

create index if not exists consent_log_anon_idx
  on public.consent_log (anonymous_id, consent_type, accepted_at desc)
  where anonymous_id is not null;

create index if not exists consent_log_type_recent_idx
  on public.consent_log (consent_type, accepted_at desc);

-- ─── RLS — immutable log ───────────────────────────────────────────
alter table public.consent_log enable row level security;

-- Service role inserts (via edge function); no direct INSERT from
-- authenticated users (they go through the function so the function
-- can truncate IP, validate document_version, etc.).
drop policy if exists consent_log_no_direct_insert on public.consent_log;
create policy consent_log_no_direct_insert
  on public.consent_log
  for insert
  to authenticated
  with check (false);  -- always deny direct INSERT from end users

-- Users can SELECT their own consent history (GDPR Art. 15 sub-right).
drop policy if exists consent_log_read_own on public.consent_log;
create policy consent_log_read_own
  on public.consent_log
  for select
  to authenticated
  using (user_id = auth.uid());

-- Admins/owners can read all rows in their org's user-base for audit.
drop policy if exists consent_log_admin_read on public.consent_log;
create policy consent_log_admin_read
  on public.consent_log
  for select
  to authenticated
  using (
    exists (
      select 1 from public.organization_members om
      where om.user_id = auth.uid()
        and om.role in ('owner', 'admin')
    )
  );

-- NO update + NO delete policies → table is append-only by design.
-- A withdrawal of consent inserts a NEW row with accepted=false.

comment on table public.consent_log is
  'Append-only GDPR consent audit log. One row per consent event (acceptance or withdrawal). user_id nullable for pre-auth (anonymous_id) consent, back-filled by edge function at signup. IP truncated to /24 for data minimization.';
