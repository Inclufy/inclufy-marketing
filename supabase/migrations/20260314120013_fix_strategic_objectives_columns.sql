-- Migration: Add missing columns to strategic_objectives
-- The table may have been created before the context_marketing_tables migration
-- which includes current_value, target_value, owner_name, owner_role.
-- CREATE TABLE IF NOT EXISTS would not add these to a pre-existing table.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'strategic_objectives' AND column_name = 'current_value'
  ) THEN
    ALTER TABLE public.strategic_objectives ADD COLUMN current_value NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'strategic_objectives' AND column_name = 'target_value'
  ) THEN
    ALTER TABLE public.strategic_objectives ADD COLUMN target_value NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'strategic_objectives' AND column_name = 'owner_name'
  ) THEN
    ALTER TABLE public.strategic_objectives ADD COLUMN owner_name TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'strategic_objectives' AND column_name = 'owner_role'
  ) THEN
    ALTER TABLE public.strategic_objectives ADD COLUMN owner_role TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'strategic_objectives' AND column_name = 'priority'
  ) THEN
    ALTER TABLE public.strategic_objectives ADD COLUMN priority INTEGER DEFAULT 0;
  END IF;
END $$;

-- Also fix attribution_models: add model_type if only type exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'attribution_models' AND column_name = 'model_type'
  ) THEN
    ALTER TABLE public.attribution_models ADD COLUMN model_type TEXT NOT NULL DEFAULT 'last_touch';
  END IF;
END $$;

-- Fix media_assets: drop team_id FK if it references teams (user_id is not a team)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'media_assets' AND constraint_name = 'media_assets_team_id_fkey'
  ) THEN
    ALTER TABLE public.media_assets DROP CONSTRAINT media_assets_team_id_fkey;
  END IF;
  -- Make team_id and uploaded_by nullable if they exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'media_assets' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.media_assets ALTER COLUMN team_id DROP NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'media_assets' AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE public.media_assets ALTER COLUMN uploaded_by DROP NOT NULL;
  END IF;
END $$;

-- Fix content_items: ensure team_id is nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_items' AND column_name = 'team_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.content_items ALTER COLUMN team_id DROP NOT NULL;
  END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
