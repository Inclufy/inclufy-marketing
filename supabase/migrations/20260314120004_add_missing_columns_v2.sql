-- Migration: Add missing columns to journeys, ai_agents, and other tables
-- Round 2 — fixes 400 errors from frontend queries

-- ─── journeys: add user_id, description, type, entry_rules, exit_rules, settings, enrollment_count
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'automation';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS steps JSONB DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS triggers JSONB DEFAULT '[]';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS entry_rules JSONB DEFAULT '{}';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS exit_rules JSONB DEFAULT '{}';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0;

-- ─── ai_agents: set default for agent_type to prevent NOT NULL violations
-- (The column already exists but may be NOT NULL without default)
ALTER TABLE public.ai_agents ALTER COLUMN agent_type SET DEFAULT 'general';

-- ─── RLS policies for journeys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'journeys_user_select') THEN
    CREATE POLICY journeys_user_select ON public.journeys FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'journeys_user_insert') THEN
    CREATE POLICY journeys_user_insert ON public.journeys FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'journeys_user_update') THEN
    CREATE POLICY journeys_user_update ON public.journeys FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'journeys_user_delete') THEN
    CREATE POLICY journeys_user_delete ON public.journeys FOR DELETE USING (user_id = auth.uid() OR user_id IS NULL);
  END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
