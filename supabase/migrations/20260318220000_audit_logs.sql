-- Audit logs table: records user-initiated actions across the app.
-- Each row is immutable once written (no UPDATE/DELETE for non-admins via RLS).

create table if not exists public.audit_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  action        text not null,           -- e.g. 'create', 'update', 'delete', 'publish'
  resource_type text not null,           -- e.g. 'post', 'campaign', 'contact'
  resource_id   text,                    -- optional: the id of the affected record
  details       jsonb,                   -- optional: arbitrary extra context
  created_at    timestamptz not null default now()
);

-- Index for fast per-user log queries
create index if not exists audit_logs_user_id_idx
  on public.audit_logs (user_id, created_at desc);

-- Index for filtering by resource
create index if not exists audit_logs_resource_idx
  on public.audit_logs (resource_type, resource_id);

-- RLS: users can only read their own logs; only the service role can delete rows.
alter table public.audit_logs enable row level security;

create policy "Users can view their own audit logs"
  on public.audit_logs
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own audit logs"
  on public.audit_logs
  for insert
  with check (auth.uid() = user_id);

-- No UPDATE or DELETE policies — audit records are append-only for regular users.
