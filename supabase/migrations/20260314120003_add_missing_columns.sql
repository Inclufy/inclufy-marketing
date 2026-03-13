-- Migration: Add missing columns to content_items, contacts, campaigns
-- These columns are referenced by frontend hooks but were not in the original table definitions.

-- ─── content_items: add user_id, tags, metadata ────────────────────────────
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.content_items ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ─── contacts: add user_id (parallel to organization_id) ──────────────────
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ─── campaigns: add type, budget, scheduling, content, settings columns ────
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'general';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS budget_amount DECIMAL(10,2);
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS audience_filters JSONB DEFAULT '{}';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS content JSONB DEFAULT '{}';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS spent_amount DECIMAL(10,2) DEFAULT 0;

-- ─── scoring_models: add last_trained (referenced by lead-scoring service) ─
ALTER TABLE public.scoring_models ADD COLUMN IF NOT EXISTS last_trained TIMESTAMPTZ DEFAULT NOW();

-- ─── RLS policies for new user_id columns ─────────────────────────────────
-- content_items: allow users to manage their own content
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'content_items_user_select') THEN
    CREATE POLICY content_items_user_select ON public.content_items FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'content_items_user_insert') THEN
    CREATE POLICY content_items_user_insert ON public.content_items FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'content_items_user_update') THEN
    CREATE POLICY content_items_user_update ON public.content_items FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);
  END IF;
END $$;

-- contacts: allow users to see contacts (via user_id or if user_id is null)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contacts_user_select') THEN
    CREATE POLICY contacts_user_select ON public.contacts FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'contacts_user_insert') THEN
    CREATE POLICY contacts_user_insert ON public.contacts FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
