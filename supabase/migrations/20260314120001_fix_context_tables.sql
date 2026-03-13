-- Fix migration: Create missing tables, add user_id where missing, apply RLS + GRANTs
-- The previous migration (20260314120000) was rolled back due to validation_rules missing user_id

-- ============================================================
-- 1. CREATE TABLES THAT DON'T EXIST YET
-- ============================================================

-- segments (was never created because transaction rolled back)
CREATE TABLE IF NOT EXISTS public.segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Segment',
  description TEXT DEFAULT '',
  rules JSONB DEFAULT '[]'::jsonb,
  estimated_size INTEGER DEFAULT 0,
  is_dynamic BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- scheduled_reports (was never created because transaction rolled back)
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_template_id UUID,
  report_name TEXT NOT NULL DEFAULT '',
  schedule_frequency TEXT NOT NULL DEFAULT 'monthly',
  schedule_day INTEGER,
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

-- ============================================================
-- 2. ADD user_id TO TABLES THAT ARE MISSING IT
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'validation_rules', 'team_members',
    'organization_entities', 'strategic_objectives', 'operating_model',
    'governance_framework', 'context_completeness',
    'products', 'product_relationships', 'product_roadmap',
    'competitors', 'competitive_features', 'competitive_analysis', 'competitive_alerts',
    'personas',
    'metrics_definitions', 'metrics_data', 'analytics_dashboards', 'dashboard_widgets',
    'attribution_results', 'predictive_models', 'predictions',
    'analytics_goals', 'experiments', 'experiment_results', 'data_quality_scores',
    'report_templates', 'generated_reports', 'data_quality_rules',
    'notifications',
    'pattern_definitions', 'pattern_detection_runs', 'detected_patterns',
    'pattern_correlations', 'insights', 'insight_recommendations',
    'content_predictions', 'insight_impact_tracking',
    'context_assumptions'
  ] LOOP
    BEGIN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE',
        tbl
      );
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not add user_id to %: %', tbl, SQLERRM;
    END;

    BEGIN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()',
        tbl
      );
    EXCEPTION WHEN others THEN NULL;
    END;

    BEGIN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()',
        tbl
      );
    EXCEPTION WHEN others THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- 3. ENABLE RLS + CREATE POLICIES FOR ALL TABLES
-- ============================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'organization_entities', 'strategic_objectives', 'operating_model',
    'governance_framework', 'context_completeness',
    'products', 'product_relationships', 'product_roadmap',
    'competitors', 'competitive_features', 'competitive_analysis', 'competitive_alerts',
    'personas', 'segments',
    'metrics_definitions', 'metrics_data', 'analytics_dashboards', 'dashboard_widgets',
    'attribution_results', 'predictive_models', 'predictions',
    'analytics_goals', 'experiments', 'experiment_results', 'data_quality_scores',
    'report_templates', 'generated_reports', 'data_quality_rules',
    'scheduled_reports', 'team_members', 'notifications',
    'pattern_definitions', 'pattern_detection_runs', 'detected_patterns',
    'pattern_correlations', 'insights', 'insight_recommendations',
    'content_predictions', 'insight_impact_tracking',
    'context_assumptions', 'validation_rules'
  ] LOOP
    BEGIN
      -- Enable RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not enable RLS on %: %', tbl, SQLERRM;
    END;

    BEGIN
      -- Drop ALL existing policies to avoid recursion issues
      EXECUTE format('DROP POLICY IF EXISTS "Users manage own %1$s" ON public.%1$I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable read access for all users" ON public.%1$I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.%1$I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.%1$I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.%1$I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "team_members_policy" ON public.%1$I', tbl);
      -- Drop any policies with common Lovable naming conventions
      EXECUTE format('DROP POLICY IF EXISTS "Users can view own %1$s" ON public.%1$I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Users can create own %1$s" ON public.%1$I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Users can update own %1$s" ON public.%1$I', tbl);
      EXECUTE format('DROP POLICY IF EXISTS "Users can delete own %1$s" ON public.%1$I', tbl);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not drop policies on %: %', tbl, SQLERRM;
    END;

    BEGIN
      -- Create simple user-scoped policy
      EXECUTE format(
        'CREATE POLICY "Users manage own %1$s" ON public.%1$I FOR ALL
          USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
        tbl
      );
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not create policy on %: %', tbl, SQLERRM;
    END;

    -- Create index on user_id
    BEGIN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS idx_%1$s_user ON public.%1$I(user_id)',
        tbl
      );
    EXCEPTION WHEN others THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================
-- 4. GRANT PERMISSIONS + REFRESH POSTGREST
-- ============================================================

NOTIFY pgrst, 'reload schema';

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'organization_entities', 'strategic_objectives', 'operating_model',
    'governance_framework', 'context_completeness',
    'products', 'product_relationships', 'product_roadmap',
    'competitors', 'competitive_features', 'competitive_analysis', 'competitive_alerts',
    'personas', 'segments',
    'metrics_definitions', 'metrics_data', 'analytics_dashboards', 'dashboard_widgets',
    'attribution_results', 'predictive_models', 'predictions',
    'analytics_goals', 'experiments', 'experiment_results', 'data_quality_scores',
    'report_templates', 'generated_reports', 'data_quality_rules',
    'scheduled_reports', 'team_members', 'notifications',
    'pattern_definitions', 'pattern_detection_runs', 'detected_patterns',
    'pattern_correlations', 'insights', 'insight_recommendations',
    'content_predictions', 'insight_impact_tracking',
    'context_assumptions', 'validation_rules'
  ] LOOP
    BEGIN
      EXECUTE format('GRANT ALL ON public.%I TO authenticated', tbl);
      EXECUTE format('GRANT SELECT ON public.%I TO anon', tbl);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not grant on %: %', tbl, SQLERRM;
    END;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
