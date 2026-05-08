-- Extend go_notifications.type CHECK to allow Capture-to-Ad notification types
--
-- BUG-NEW-09 (post-tester finding): useNotifications hook + NotificationsScreen
-- read from `go_notifications`, not from the new `public.notifications` table
-- created in 20260508220000. To make boost_candidate/boost_completed/
-- boost_failed alerts visible in the mobile app, ad-performance-monitor
-- cron now writes to `go_notifications`. This migration extends the type
-- CHECK constraint there to allow the 3 new types.
--
-- The standalone `public.notifications` table from 20260508220000 remains
-- as a future-proof structure (it has richer per-row columns for
-- related_post_id / action_url / priority that go_notifications lacks).
-- Both tables coexist for now; we'll consolidate in a later sprint.

BEGIN;

-- Find and drop existing type CHECK constraint (name varies — find it first)
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'go_notifications'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%type%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.go_notifications DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

-- Re-add with extended type list. NOTE: if go_notifications had no CHECK
-- on `type` originally, the DROP above is a no-op and we just ADD a new one.
-- Either way, after this migration the constraint allows boost_* types.
ALTER TABLE public.go_notifications
  ADD CONSTRAINT go_notifications_type_check
  CHECK (type IN (
    'team_invite',
    'system',
    'ai_suggestion',
    'post_published',
    'event_update',
    'boost_candidate',  -- top-performer post → suggest Boost
    'boost_completed',  -- ad campaign duration ended
    'boost_failed'      -- Meta Marketing API rejection
  ));

COMMIT;
