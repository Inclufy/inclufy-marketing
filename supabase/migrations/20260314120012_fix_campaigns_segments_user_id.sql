-- Fix pre-existing Lovable tables: campaigns + segments
-- These tables have organization_id but no user_id column.
-- The demo agent and setup pages need user_id for RLS-scoped data.

-- ═══════════════════════════════════════════════════════════════════
-- 1. CAMPAIGNS — add user_id
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- RLS policies for user_id access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'campaigns_user_select') THEN
    CREATE POLICY campaigns_user_select ON public.campaigns FOR SELECT
      USING (user_id = auth.uid() OR user_id IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'campaigns_user_insert') THEN
    CREATE POLICY campaigns_user_insert ON public.campaigns FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'campaigns_user_update') THEN
    CREATE POLICY campaigns_user_update ON public.campaigns FOR UPDATE
      USING (user_id = auth.uid() OR user_id IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'campaigns_user_delete') THEN
    CREATE POLICY campaigns_user_delete ON public.campaigns FOR DELETE
      USING (user_id = auth.uid() OR user_id IS NULL);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- 2. SEGMENTS — add user_id + rules + estimated_size + is_dynamic
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS estimated_size INTEGER DEFAULT 0;
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS is_dynamic BOOLEAN DEFAULT true;

-- RLS policies for user_id access
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'segments_user_select') THEN
    CREATE POLICY segments_user_select ON public.segments FOR SELECT
      USING (user_id = auth.uid() OR user_id IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'segments_user_insert') THEN
    CREATE POLICY segments_user_insert ON public.segments FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'segments_user_update') THEN
    CREATE POLICY segments_user_update ON public.segments FOR UPDATE
      USING (user_id = auth.uid() OR user_id IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'segments_user_delete') THEN
    CREATE POLICY segments_user_delete ON public.segments FOR DELETE
      USING (user_id = auth.uid() OR user_id IS NULL);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- 3. Fix recommendations.impact_estimate → change from TEXT to JSONB
-- ═══════════════════════════════════════════════════════════════════
DO $$ BEGIN
  -- Only alter if column is TEXT (not already JSONB)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'recommendations'
      AND column_name = 'impact_estimate' AND data_type = 'text'
  ) THEN
    -- Drop existing DEFAULT first (it's TEXT and can't auto-cast to JSONB)
    ALTER TABLE public.recommendations ALTER COLUMN impact_estimate DROP DEFAULT;
    -- Now change column type
    ALTER TABLE public.recommendations ALTER COLUMN impact_estimate TYPE JSONB USING
      CASE WHEN impact_estimate IS NOT NULL AND impact_estimate != ''
        THEN impact_estimate::jsonb
        ELSE '{}'::jsonb
      END;
    -- Set new JSONB default
    ALTER TABLE public.recommendations ALTER COLUMN impact_estimate SET DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- 4. Ensure autonomous_decisions does NOT require decision_type
-- ═══════════════════════════════════════════════════════════════════
-- Add decision_type if it doesn't exist (some pre-existing tables have it)
ALTER TABLE public.autonomous_decisions ADD COLUMN IF NOT EXISTS decision_type TEXT DEFAULT '';

-- ═══════════════════════════════════════════════════════════════════
-- 5. content_items — ensure 'content' is JSONB (not TEXT)
-- ═══════════════════════════════════════════════════════════════════
-- The pre-existing Lovable table already has content as JSONB — just ensure it exists
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}'::jsonb;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
