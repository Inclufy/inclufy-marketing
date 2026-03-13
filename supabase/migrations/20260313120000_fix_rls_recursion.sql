-- ============================================================
-- Fix: RLS Infinite Recursion (error 42P17)
-- Replace inline EXISTS subqueries in policies with a
-- SECURITY DEFINER helper function to break the recursion.
-- ============================================================

-- ─── Helper Function ─────────────────────────────────────────────────────────
-- Runs with SECURITY DEFINER so it bypasses RLS when checking membership.
-- This prevents the circular: go_captures policy → go_event_members →
-- go_events policy → go_event_members chain.

CREATE OR REPLACE FUNCTION public.is_event_team_member(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.go_event_members
    WHERE event_id = p_event_id
      AND user_id = auth.uid()
      AND status = 'accepted'
  );
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.is_event_team_member(UUID) TO authenticated;

-- ─── Fix go_captures Policies ─────────────────────────────────────────────────

DROP POLICY IF EXISTS go_captures_select ON public.go_captures;
CREATE POLICY go_captures_select ON public.go_captures
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_event_team_member(event_id)
  );

DROP POLICY IF EXISTS go_captures_insert ON public.go_captures;
CREATE POLICY go_captures_insert ON public.go_captures
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR public.is_event_team_member(event_id)
  );

DROP POLICY IF EXISTS go_captures_update ON public.go_captures;
CREATE POLICY go_captures_update ON public.go_captures
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.is_event_team_member(event_id)
  );

DROP POLICY IF EXISTS go_captures_delete ON public.go_captures;
CREATE POLICY go_captures_delete ON public.go_captures
  FOR DELETE USING (auth.uid() = user_id);

-- ─── Fix go_events Policies ───────────────────────────────────────────────────

DROP POLICY IF EXISTS go_events_select ON public.go_events;
CREATE POLICY go_events_select ON public.go_events
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_event_team_member(id)
  );

-- ─── Fix go_posts Policies ────────────────────────────────────────────────────

DROP POLICY IF EXISTS go_posts_select ON public.go_posts;
CREATE POLICY go_posts_select ON public.go_posts
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.is_event_team_member(event_id)
  );

DROP POLICY IF EXISTS go_posts_insert ON public.go_posts;
CREATE POLICY go_posts_insert ON public.go_posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR public.is_event_team_member(event_id)
  );
