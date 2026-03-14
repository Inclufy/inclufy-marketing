-- Fix autonomous_decisions FK constraint (user_id may reference public.users instead of auth.users)
-- Also ensure report tables exist with RLS

-- 1. Drop old FK constraint on autonomous_decisions (may reference wrong table)
DO $$ BEGIN
  -- Try common constraint names
  ALTER TABLE public.autonomous_decisions DROP CONSTRAINT IF EXISTS autonomous_decisions_user_id_fkey;
  ALTER TABLE public.autonomous_decisions DROP CONSTRAINT IF EXISTS fk_autonomous_decisions_user_id;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'No FK constraint to drop on autonomous_decisions: %', SQLERRM;
END $$;

-- Re-add FK pointing to auth.users
DO $$ BEGIN
  ALTER TABLE public.autonomous_decisions
    ADD CONSTRAINT autonomous_decisions_user_id_auth_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'FK constraint already exists on autonomous_decisions.user_id → auth.users';
WHEN others THEN
  RAISE NOTICE 'Could not add FK on autonomous_decisions: %', SQLERRM;
END $$;

-- 2. Ensure report_templates table exists
CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name TEXT DEFAULT '',
  template_type TEXT DEFAULT 'custom',
  description TEXT DEFAULT '',
  sections JSONB DEFAULT '[]'::jsonb,
  data_sources JSONB DEFAULT '[]'::jsonb,
  branding_config JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  category TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own report_templates') THEN
    CREATE POLICY "Users manage own report_templates" ON public.report_templates FOR ALL
      USING (user_id = auth.uid() OR is_public = true) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 3. Ensure generated_reports table exists
CREATE TABLE IF NOT EXISTS public.generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
  report_name TEXT DEFAULT '',
  report_type TEXT DEFAULT '',
  period_start TEXT DEFAULT '',
  period_end TEXT DEFAULT '',
  comparison_period_start TEXT,
  comparison_period_end TEXT,
  report_data JSONB DEFAULT '{}'::jsonb,
  executive_summary TEXT DEFAULT '',
  key_findings JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  recipients TEXT[] DEFAULT '{}',
  external_recipients TEXT[] DEFAULT '{}',
  file_url TEXT,
  file_format TEXT DEFAULT 'pdf',
  file_size_bytes INTEGER DEFAULT 0,
  generation_status TEXT DEFAULT 'pending',
  generated_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own generated_reports') THEN
    CREATE POLICY "Users manage own generated_reports" ON public.generated_reports FOR ALL
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 4. Ensure scheduled_reports table exists
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
  report_name TEXT DEFAULT '',
  schedule_frequency TEXT DEFAULT 'monthly',
  schedule_day INTEGER DEFAULT 1,
  schedule_time TEXT DEFAULT '09:00',
  recipients TEXT[] DEFAULT '{}',
  external_emails TEXT[] DEFAULT '{}',
  output_format TEXT DEFAULT 'pdf',
  is_active BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMPTZ,
  next_scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own scheduled_reports') THEN
    CREATE POLICY "Users manage own scheduled_reports" ON public.scheduled_reports FOR ALL
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- 5. Fix strategic_plans columns that may be wrong (extras-seeder uses 'name' but DB may use 'plan_name')
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '';
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS channels TEXT[] DEFAULT '{}';
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS budget_total NUMERIC DEFAULT 0;
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '{}'::jsonb;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
