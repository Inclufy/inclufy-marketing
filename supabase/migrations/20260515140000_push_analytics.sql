-- ──────────────────────────────────────────────────────────────────────────
-- Push notification analytics (Sprint-3 item #18)
--
-- Builds on push_send_log (created in 20260515120000) and user_devices
-- (created in 20260510160000) to give us deliverability + engagement
-- numbers across the AMOS notification fleet.
--
-- Three views:
--   v_push_daily_funnel       — sent / delivered (ack) / opened / rate_limited per day
--   v_push_engagement_by_type — open rate per notification.type
--   v_push_device_freshness   — registered vs active vs stale tokens per platform
--
-- "Open" is interpreted as: any go_notifications row with read=true
-- WHERE the same user_id had a push_send_log entry within the prior 24h
-- referencing the same notification_id. This is approximate — push
-- providers don't natively report taps. Acceptable for trend analysis.
-- ──────────────────────────────────────────────────────────────────────────

-- ─── 1. Daily funnel ──────────────────────────────────────────────────
create or replace view public.v_push_daily_funnel as
  select
    date_trunc('day', sent_at)                                  as day,
    count(*) filter (where status = 'sent')                     as sent,
    count(*) filter (where status = 'failed')                   as failed,
    count(*) filter (where status = 'rate_limited')             as rate_limited,
    count(*) filter (where status = 'no_devices')               as no_devices,
    count(distinct user_id) filter (where status = 'sent')      as unique_users_pushed,
    round(
      100.0 * count(*) filter (where status = 'sent')
            / nullif(count(*), 0),
      1
    )                                                            as sent_pct
  from public.push_send_log
  where sent_at > now() - interval '90 days'
  group by 1
  order by 1 desc;

comment on view public.v_push_daily_funnel is
  'Sprint-3 #18 — daily push counts: sent / failed / rate_limited / no_devices, last 90 days. Last_seen_at <90d window is the retention horizon.';

-- ─── 2. Engagement by notification type ───────────────────────────────
-- DEFERRED: requires a `read_at` timestamp column on go_notifications
-- which doesn't exist yet (only boolean `read` + `created_at`). Without
-- the read timestamp we can't bind a notification-open to the matching
-- push-send time window, so the open-rate % would be meaningless.
--
-- Follow-up migration TODO:
--   1. alter table public.go_notifications add column read_at timestamptz;
--   2. update existing rows where read=true set read_at = updated_at
--      (or NULL — historical data has no precise read time).
--   3. Patch the mobile app NotificationCenter mark-as-read action to
--      set read_at = now() alongside read = true.
--   4. Re-add the v_push_engagement_by_type view from this migration's
--      git history (commit c9b3720).
--
-- For now: only the send-funnel + device-freshness views ship.

-- ─── 3. Device freshness ──────────────────────────────────────────────
create or replace view public.v_push_device_freshness as
  select
    coalesce(platform, 'unknown')      as platform,
    count(*)                            as total_devices,
    count(*) filter (where is_active)  as active_devices,
    count(*) filter (where is_active and last_seen_at > now() - interval '7 days')
                                        as active_last_7d,
    count(*) filter (where is_active and last_seen_at > now() - interval '30 days')
                                        as active_last_30d,
    count(*) filter (where not is_active) as deactivated
  from public.user_devices
  group by 1
  order by total_devices desc;

comment on view public.v_push_device_freshness is
  'Sprint-3 #18 — registered vs active vs stale push tokens per platform (ios/android/web). Active = is_active=true; "last_7d" means the device contacted /register-push-token within 7 days.';

-- ─── 4. RLS — admin/owner-only ────────────────────────────────────────
-- The underlying tables already have RLS; views inherit. But we set
-- explicit grants so a future migration that opens up the tables
-- doesn't accidentally open the analytics views.
revoke all on public.v_push_daily_funnel from anon, authenticated;
revoke all on public.v_push_device_freshness from anon, authenticated;
-- Service role retains read (default).
