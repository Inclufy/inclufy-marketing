-- ──────────────────────────────────────────────────────────────────────────
-- user_devices — Expo push token registration
--
-- Stores one row per user/device combination. The mobile app calls
-- register-push-token edge function on every cold-start (and after the
-- user grants notification permission), which upserts here.
--
-- Why per-device, not per-user: a single user can be logged in on multiple
-- physical devices (phone + tablet + simulator). When a notification
-- fires, send-push fans out to every active device of the user.
--
-- Tokens go stale (user logs out, uninstalls, OS rotates token). The
-- send-push function checks Expo's response — if it returns
-- DeviceNotRegistered, we mark the row inactive but never delete (audit).
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists public.user_devices (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  platform        text check (platform in ('ios', 'android', 'web')),
  device_name     text,
  app_version     text,
  is_active       boolean not null default true,
  last_seen_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  -- One token can only belong to one user. If a user logs in on a device
  -- previously bound to someone else, we re-bind via on conflict update.
  unique (expo_push_token)
);

create index if not exists user_devices_user_active_idx
  on public.user_devices (user_id) where is_active = true;

create index if not exists user_devices_token_idx
  on public.user_devices (expo_push_token);

alter table public.user_devices enable row level security;

-- Users can only read/write their own devices. Service role bypasses RLS
-- for the send-push edge function.
drop policy if exists user_devices_own_select on public.user_devices;
create policy user_devices_own_select on public.user_devices
  for select to authenticated using (user_id = auth.uid());

drop policy if exists user_devices_own_insert on public.user_devices;
create policy user_devices_own_insert on public.user_devices
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists user_devices_own_update on public.user_devices;
create policy user_devices_own_update on public.user_devices
  for update to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists user_devices_own_delete on public.user_devices;
create policy user_devices_own_delete on public.user_devices
  for delete to authenticated using (user_id = auth.uid());

comment on table public.user_devices is
  'Expo push tokens per (user, device). send-push fans out to active rows.';
