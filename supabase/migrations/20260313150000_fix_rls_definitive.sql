-- ============================================================
-- Definitive RLS Fix — drops ALL policies on go_ tables and
-- recreates them with bulletproof, non-recursive versions.
-- ============================================================

-- ─── Step 1: Ensure helper function exists (SECURITY DEFINER) ──────────────
-- Runs as postgres, bypasses RLS on go_event_members.
-- auth.uid() still works here because it reads the request JWT.

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

GRANT EXECUTE ON FUNCTION public.is_event_team_member(UUID) TO authenticated;

-- ─── Step 2: Drop ALL existing policies on go_ tables dynamically ──────────
-- This guarantees no stale / duplicate / conflicting policies remain.

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE tablename IN ('go_captures', 'go_events', 'go_posts')
      AND schemaname = 'public'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      pol.policyname, pol.tablename
    );
  END LOOP;
END $$;

-- ─── Step 3: go_events ────────────────────────────────────────────────────
-- Owner: full CRUD (simple, no subquery — no recursion possible)
CREATE POLICY go_events_owner ON public.go_events
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Team members: read-only (SECURITY DEFINER avoids recursion)
CREATE POLICY go_events_team_view ON public.go_events
  FOR SELECT
  USING (public.is_event_team_member(id));

-- ─── Step 4: go_captures ──────────────────────────────────────────────────
-- Owner: full CRUD — always uses simple uid check, never causes recursion
CREATE POLICY go_captures_owner ON public.go_captures
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Team members: view only (SECURITY DEFINER)
CREATE POLICY go_captures_team_view ON public.go_captures
  FOR SELECT
  USING (public.is_event_team_member(event_id));

-- Team members: insert only (SECURITY DEFINER)
CREATE POLICY go_captures_team_insert ON public.go_captures
  FOR INSERT
  WITH CHECK (public.is_event_team_member(event_id));

-- ─── Step 5: go_posts ─────────────────────────────────────────────────────
-- Owner: full CRUD — simple uid check
CREATE POLICY go_posts_owner ON public.go_posts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Team members: view only (SECURITY DEFINER)
CREATE POLICY go_posts_team_view ON public.go_posts
  FOR SELECT
  USING (public.is_event_team_member(event_id));

-- Team members: insert only (SECURITY DEFINER)
CREATE POLICY go_posts_team_insert ON public.go_posts
  FOR INSERT
  WITH CHECK (public.is_event_team_member(event_id));
