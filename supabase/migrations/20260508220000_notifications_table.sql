-- Notifications table — fixes BUG-NEW-04
--
-- ad-performance-monitor cron and other agents try to insert into
-- public.notifications but the table was never created. Without this
-- migration the boost_candidate flow (top-performer detected → user
-- gets push notification → tap opens BoostFlow) is silently broken.
--
-- Schema matches the AppNotification interface used by useNotifications
-- hook and NotificationsScreen — type, title, message, related_post_id,
-- action_url, priority, read, data jsonb.

BEGIN;

CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID,

  -- Type drives icon/color in NotificationsScreen TYPE_CONFIG
  type            TEXT NOT NULL CHECK (type IN (
    'team_invite',
    'ai_suggestion',
    'post_published',
    'event_update',
    'boost_candidate',  -- top-performer post → suggest Boost
    'boost_completed',  -- ad campaign duration ended
    'boost_failed',     -- Meta Marketing API rejection
    'system'
  )),

  title           TEXT NOT NULL,
  message         TEXT NOT NULL,

  -- Optional links to source rows
  related_post_id UUID,
  related_event_id UUID,
  related_campaign_id UUID,

  -- Deep-link target (web route OR mobile screen+params encoded)
  action_url      TEXT,

  -- Visual priority
  priority        TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),

  -- Read state
  read            BOOLEAN NOT NULL DEFAULT false,
  read_at         TIMESTAMPTZ,

  -- Free-form payload for invites (role, inviter, etc.) and route data
  data            JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_post
  ON public.notifications(related_post_id) WHERE related_post_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_campaign
  ON public.notifications(related_campaign_id) WHERE related_campaign_id IS NOT NULL;

-- ─── RLS ──────────────────────────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_owner ON public.notifications;
CREATE POLICY notifications_owner ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Service role (for cron + edge fn inserts) can do anything
DROP POLICY IF EXISTS notifications_service ON public.notifications;
CREATE POLICY notifications_service ON public.notifications
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Trigger: keep updated_at in sync
CREATE OR REPLACE FUNCTION public.set_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.read = true AND OLD.read = false THEN
    NEW.read_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notifications_updated ON public.notifications;
CREATE TRIGGER trg_notifications_updated
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_notification_updated_at();

COMMIT;
