-- ============================================================
-- Inclufy GO: Team Collaboration
-- Allows multiple team members to collaborate on the same event
-- ============================================================

-- Event team members: tracks who has access to which event
CREATE TABLE IF NOT EXISTS public.go_event_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.go_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role
  role TEXT DEFAULT 'contributor'
    CHECK (role IN ('owner', 'editor', 'contributor', 'viewer')),

  -- Status
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),

  -- Timestamps
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,

  -- One membership per user per event
  UNIQUE(event_id, user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_go_event_members_user ON public.go_event_members(user_id, status);
CREATE INDEX IF NOT EXISTS idx_go_event_members_event ON public.go_event_members(event_id);

-- ============================================================
-- Auto-Tagging: store AI-detected tags on captures
-- ============================================================
ALTER TABLE public.go_captures
  ADD COLUMN IF NOT EXISTS ai_tags JSONB DEFAULT '[]'::jsonb;
-- ai_tags format: [{"type": "person", "label": "Speaker", "confidence": 0.95}, ...]

-- ============================================================
-- Audience Targeting: store audience suggestion on posts
-- ============================================================
ALTER TABLE public.go_posts
  ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '{}'::jsonb;
-- target_audience format: {"primary": "Marketing Managers", "secondary": "C-Suite", "reasoning": "..."}

-- ============================================================
-- Row Level Security for go_event_members
-- ============================================================
ALTER TABLE public.go_event_members ENABLE ROW LEVEL SECURITY;

-- Members can see their own memberships
CREATE POLICY go_event_members_select ON public.go_event_members
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = invited_by);

-- Only event owner can invite
CREATE POLICY go_event_members_insert ON public.go_event_members
  FOR INSERT WITH CHECK (auth.uid() = invited_by);

-- Members can update their own status (accept/decline)
CREATE POLICY go_event_members_update ON public.go_event_members
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = invited_by);

-- Only inviter can remove
CREATE POLICY go_event_members_delete ON public.go_event_members
  FOR DELETE USING (auth.uid() = invited_by);

-- ============================================================
-- Update GO Events RLS: allow team members to view events
-- ============================================================
DROP POLICY IF EXISTS go_events_select ON public.go_events;
CREATE POLICY go_events_select ON public.go_events
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.go_event_members m
      WHERE m.event_id = go_events.id
        AND m.user_id = auth.uid()
        AND m.status = 'accepted'
    )
  );

-- Update GO Captures RLS: team members can view captures
DROP POLICY IF EXISTS go_captures_select ON public.go_captures;
CREATE POLICY go_captures_select ON public.go_captures
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.go_event_members m
      WHERE m.event_id = go_captures.event_id
        AND m.user_id = auth.uid()
        AND m.status = 'accepted'
    )
  );

-- Team members with contributor+ role can add captures
DROP POLICY IF EXISTS go_captures_insert ON public.go_captures;
CREATE POLICY go_captures_insert ON public.go_captures
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.go_event_members m
      WHERE m.event_id = go_captures.event_id
        AND m.user_id = auth.uid()
        AND m.status = 'accepted'
        AND m.role IN ('owner', 'editor', 'contributor')
    )
  );

-- Update GO Posts RLS: team members can view posts
DROP POLICY IF EXISTS go_posts_select ON public.go_posts;
CREATE POLICY go_posts_select ON public.go_posts
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.go_event_members m
      WHERE m.event_id = go_posts.event_id
        AND m.user_id = auth.uid()
        AND m.status = 'accepted'
    )
  );
