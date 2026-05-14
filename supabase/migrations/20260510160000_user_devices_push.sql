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

-- ──────────────────────────────────────────────────────────────────────────
-- Trigger: on INSERT into public.go_notifications, fire send-push so a
-- native push lands on the user's device alongside the in-app inbox row.
-- Uses pg_net.http_post which is async — never blocks the INSERT.
--
-- BUG-2026-07: this trigger was previously applied via a one-off function
-- and was missing from version-controlled SQL. Now part of the migration.
-- send-push requires X-Internal-Secret header — value substituted via
-- app.settings.internal_push_secret session-level setting on prod, but
-- the trigger uses the actual env-injected value at runtime to keep the
-- secret out of migration source.
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.notify_go_notification_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $fn$
declare
  fn_url             text;
  service_role_jwt   text;
  internal_secret    text;
begin
  fn_url             := current_setting('app.settings.supabase_url', true)
                          || '/functions/v1/send-push';
  service_role_jwt   := current_setting('app.settings.service_role_key', true);
  internal_secret    := current_setting('app.settings.internal_push_secret', true);

  -- Skip if config is missing — better to drop a push than crash an insert.
  if fn_url is null or fn_url = '/functions/v1/send-push'
     or service_role_jwt is null or service_role_jwt = ''
     or internal_secret is null or internal_secret = '' then
    raise notice 'notify_go_notification_push: settings not configured';
    return new;
  end if;

  begin
    perform net.http_post(
      url     := fn_url,
      body    := jsonb_build_object(
        'user_ids', jsonb_build_array(new.user_id::text),
        'title',    coalesce(new.title, 'Inclufy AMOS'),
        'body',     coalesce(new.body, ''),
        'data',     jsonb_build_object(
          'route',           'Notifications',
          'notification_id', new.id::text,
          'type',            new.type
        )
      ),
      headers := jsonb_build_object(
        'Content-Type',      'application/json',
        'Authorization',     'Bearer ' || service_role_jwt,
        'x-internal-secret', internal_secret
      )
    );
  exception when others then
    raise notice 'notify_go_notification_push error: %', sqlerrm;
  end;
  return new;
end;
$fn$;

drop trigger if exists trg_notify_go_notification_push on public.go_notifications;
create trigger trg_notify_go_notification_push
  after insert on public.go_notifications
  for each row
  execute function public.notify_go_notification_push();
