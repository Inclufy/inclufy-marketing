-- ──────────────────────────────────────────────────────────────────────────
-- Post approval-gate
--
-- Adds an optional admin-approval workflow before a go_posts row can move
-- from `in_review` → `approved` (and thus become publishable). Designed to
-- coexist with the existing flow — orgs that don't set
-- `requires_post_approval = true` keep working exactly as before.
--
-- State machine (only when requires_post_approval=true and submitter is
-- not an admin/owner):
--
--   draft ─[submit-post-for-approval]→ in_review
--                                         │
--               ┌─────────────────────────┴─────────────────────────┐
--   [process-post-approval: approve]                  [reject]
--               │                                       │
--               ▼                                       ▼
--           approved ─[publish-social]→ published     draft (with rejection_reason)
--
-- For solo orgs / admins, draft → approved happens directly via the
-- existing PostReviewScreen flow — no approval needed.
-- ──────────────────────────────────────────────────────────────────────────

-- 1. Org-level feature flag (default off — existing orgs unaffected)
alter table public.organizations
  add column if not exists requires_post_approval boolean not null default false;

comment on column public.organizations.requires_post_approval is
  'When true, posts created by non-admin members must be approved by an admin/owner before publish. Default false for backwards compatibility.';

-- 2. Approval audit columns on go_posts (all nullable)
alter table public.go_posts
  add column if not exists submitted_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists submitted_at         timestamptz,
  add column if not exists approved_by_user_id  uuid references auth.users(id) on delete set null,
  add column if not exists approved_at          timestamptz,
  add column if not exists rejected_by_user_id  uuid references auth.users(id) on delete set null,
  add column if not exists rejected_at          timestamptz,
  add column if not exists rejection_reason     text;

-- go_posts has no organization_id (per-user data model). Index on the
-- submission timestamp + user_id keeps the admin inbox query fast.
create index if not exists go_posts_in_review_idx
  on public.go_posts (submitted_at desc, user_id)
  where status = 'in_review';

-- 3. Extend go_notifications.type to allow 'post_approval_needed' and
--    'post_approval_decided'. Find the existing CHECK constraint
--    dynamically (name varies — same trick as 20260508240000).
do $$
declare
  constraint_name text;
begin
  select con.conname into constraint_name
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'go_notifications'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%type%';

  if constraint_name is not null then
    execute format('alter table public.go_notifications drop constraint %I', constraint_name);
  end if;
end $$;

alter table public.go_notifications
  add constraint go_notifications_type_check
  check (type in (
    'team_invite', 'ai_suggestion', 'post_published', 'event_update',
    'boost_candidate', 'boost_completed', 'boost_failed',
    'post_approval_needed', 'post_approval_decided',
    'system'
  ));

-- 4. View: pending approval queue. Edge fns derive the org by joining
--    organization_members on the author's user_id (go_posts has no
--    organization_id column — AMOS is per-user with multi-tenancy bolted
--    on later).
create or replace view public.v_pending_post_approvals as
  select
    p.id                  as post_id,
    p.user_id             as author_user_id,
    p.submitted_by_user_id,
    p.submitted_at,
    p.channel,
    p.text_content,
    p.branded_image_url,
    p.event_id,
    p.created_at
  from public.go_posts p
  where p.status = 'in_review'
  order by p.submitted_at desc nulls last;

comment on view public.v_pending_post_approvals is
  'Pending approval queue. Admins/owners read via RLS on go_posts.';

-- 5. Helper: list of admin/owner user_ids for a given org. Used by edge
--    functions to fan out approval requests as notifications.
create or replace function public.org_admin_user_ids(org_id uuid)
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select om.user_id
  from public.organization_members om
  where om.organization_id = org_id
    and om.role in ('owner', 'admin');
$$;
