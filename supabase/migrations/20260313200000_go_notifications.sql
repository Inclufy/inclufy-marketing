-- ─────────────────────────────────────────────────────────────────
-- go_notifications: in-app notification feed for Inclufy GO
-- Used for: team invites, post status updates, system messages
-- Inserted by Edge Functions via service role (bypasses RLS).
-- Read/updated only by the owning user.
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS go_notifications (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification type
  -- team_invite | system | post_published | event_update | ai_suggestion
  type        text        NOT NULL DEFAULT 'system',

  title       text        NOT NULL,
  body        text,

  -- Flexible payload: event_id, member_id, role, invited_by, etc.
  data        jsonb       DEFAULT '{}'::jsonb,

  read        boolean     DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- Efficient lookup: user's unread + recent notifications
CREATE INDEX IF NOT EXISTS idx_go_notif_user_unread
  ON go_notifications (user_id, read, created_at DESC);

-- ─── Row Level Security ─────────────────────────────────────────
ALTER TABLE go_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "go_notif_select_own"
  ON go_notifications FOR SELECT
  USING (user_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "go_notif_update_own"
  ON go_notifications FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Note: INSERT is performed by Edge Functions using the service role key,
-- which bypasses RLS entirely. No authenticated INSERT policy is needed.

-- ─── Realtime ───────────────────────────────────────────────────
-- Allows NotificationsScreen to receive live updates via Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE go_notifications;
