-- ──────────────────────────────────────────────────────────────────────────
-- DO NOT APPLY YET — pending mobile app code change.
--
-- Adds a `read_at timestamptz` column to public.go_notifications so we can
-- re-enable the v_push_engagement_by_type analytics view that was deferred
-- on 2026-05-15 (see commit 9693d14).
--
-- Pre-conditions before this migration ships:
--   1. AMOS mobile app's NotificationCenter mark-as-read action must be
--      patched to write `read_at = now()` alongside `read = true`. Without
--      that the column stays NULL on every new row and the analytics view
--      shows zero open-rate forever.
--   2. Backfill strategy decided for historical read=true rows where we
--      have no precise read timestamp. Options:
--        a) Leave NULL — accept "unknown open time" for pre-migration data.
--        b) Use updated_at if that column exists.
--        c) Use created_at + interval '1 hour' as a pessimistic estimate.
--      Recommendation: (a). Analytics view's 24h window will simply skip
--      old rows.
--   3. Coordinate release with the EAS build that contains the mobile app
--      patch — apply migration AFTER the app is in TestFlight, BEFORE it
--      goes to production App Store.
--
-- This file lives in supabase/migrations/_pending/ so `supabase db push`
-- and the CI migrations-apply-check job do NOT pick it up automatically.
-- When ready, move it to supabase/migrations/ and remove this banner.
-- ──────────────────────────────────────────────────────────────────────────

alter table public.go_notifications
  add column if not exists read_at timestamptz;

create index if not exists go_notifications_read_at_idx
  on public.go_notifications (user_id, read_at desc)
  where read = true;

comment on column public.go_notifications.read_at is
  'Timestamp the user marked this notification as read. Written by mobile NotificationCenter action. NULL for rows created before this column existed.';

-- Re-add v_push_engagement_by_type view (was dropped in commit 9693d14)
create or replace view public.v_push_engagement_by_type as
  with sends as (
    select
      psl.user_id,
      psl.sent_at,
      (psl.metadata->>'type') as push_type,
      (psl.metadata->>'notification_id') as notification_id
    from public.push_send_log psl
    where psl.status = 'sent'
      and psl.sent_at > now() - interval '30 days'
  ),
  reads as (
    select
      gn.user_id,
      gn.id      as notification_id,
      gn.type    as gn_type,
      gn.read_at
    from public.go_notifications gn
    where gn.read = true
      and gn.read_at is not null
      and gn.read_at > now() - interval '31 days'
  ),
  joined as (
    select
      coalesce(s.push_type, r.gn_type) as type,
      s.user_id,
      s.sent_at,
      r.read_at,
      case when r.read_at is not null
                and r.read_at between s.sent_at and s.sent_at + interval '24 hours'
           then 1 else 0
      end as opened_within_24h
    from sends s
    left join reads r on r.notification_id::text = s.notification_id
  )
  select
    type,
    count(*)                       as sends,
    sum(opened_within_24h)         as opens_within_24h,
    round(100.0 * sum(opened_within_24h) / nullif(count(*), 0), 1) as open_rate_pct
  from joined
  where type is not null
  group by type
  order by sends desc;

revoke all on public.v_push_engagement_by_type from anon, authenticated;

comment on view public.v_push_engagement_by_type is
  'Sprint-3 #18 — per push notification type: sends, opens within 24h, open-rate %. Requires go_notifications.read_at populated by mobile app NotificationCenter mark-as-read action.';
