-- Fix pre-existing tables: add user_id column and RLS policies
-- These tables were created by a previous migration without user_id

-- Helper: add user_id to tables that don't have it
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'autonomous_decisions',
    'ai_agents',
    'attribution_models',
    'opportunities',
    'revenue_predictions',
    'revenue_opportunities',
    'strategic_plans',
    'autonomous_content'
  ] LOOP
    -- Add user_id column if missing
    BEGIN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE',
        tbl
      );
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not add user_id to %: %', tbl, SQLERRM;
    END;

    -- Add created_at if missing
    BEGIN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()',
        tbl
      );
    EXCEPTION WHEN others THEN NULL;
    END;

    -- Add updated_at if missing
    BEGIN
      EXECUTE format(
        'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()',
        tbl
      );
    EXCEPTION WHEN others THEN NULL;
    END;

    -- Enable RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    -- Drop and recreate policy
    EXECUTE format(
      'DROP POLICY IF EXISTS "Users manage own %1$s" ON public.%1$I',
      tbl
    );
    EXECUTE format(
      'CREATE POLICY "Users manage own %1$s" ON public.%1$I FOR ALL
        USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
      tbl
    );

    -- Create index on user_id
    BEGIN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS idx_%1$s_user ON public.%1$I(user_id)',
        tbl
      );
    EXCEPTION WHEN others THEN NULL;
    END;

    -- Add update trigger
    BEGIN
      EXECUTE format(
        'DROP TRIGGER IF EXISTS update_%1$s_updated_at ON public.%1$I;
         CREATE TRIGGER update_%1$s_updated_at
           BEFORE UPDATE ON public.%1$I
           FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
        tbl
      );
    EXCEPTION WHEN others THEN NULL;
    END;
  END LOOP;
END $$;

-- Also add any missing columns to pre-existing tables

-- autonomous_decisions: ensure all columns
ALTER TABLE public.autonomous_decisions ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'campaign_optimization';
ALTER TABLE public.autonomous_decisions ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.autonomous_decisions ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.autonomous_decisions ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE public.autonomous_decisions ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0;
ALTER TABLE public.autonomous_decisions ADD COLUMN IF NOT EXISTS estimated_impact JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.autonomous_decisions ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'low';
ALTER TABLE public.autonomous_decisions ADD COLUMN IF NOT EXISTS cost_estimate NUMERIC DEFAULT 0;
ALTER TABLE public.autonomous_decisions ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT true;
ALTER TABLE public.autonomous_decisions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.autonomous_decisions ADD COLUMN IF NOT EXISTS decision_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.autonomous_decisions ADD COLUMN IF NOT EXISTS executed_at TIMESTAMPTZ;

-- ai_agents: ensure all columns
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'social';
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS capabilities TEXT[] DEFAULT '{}';
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS current_task TEXT DEFAULT '';
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS tasks_completed_today INTEGER DEFAULT 0;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS tasks_in_queue INTEGER DEFAULT 0;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS success_rate NUMERIC DEFAULT 0;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS efficiency_score NUMERIC DEFAULT 0;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS last_action TEXT DEFAULT '';
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS last_action_at TIMESTAMPTZ;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS uptime_hours NUMERIC DEFAULT 0;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS decisions_made INTEGER DEFAULT 0;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS revenue_impact NUMERIC DEFAULT 0;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS learning_progress NUMERIC DEFAULT 0;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS model_version TEXT DEFAULT '1.0';
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS performance_trend JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT '#000000';

-- attribution_models: ensure all columns
ALTER TABLE public.attribution_models ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.attribution_models ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'last_touch';
ALTER TABLE public.attribution_models ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.attribution_models ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
ALTER TABLE public.attribution_models ADD COLUMN IF NOT EXISTS accuracy_score NUMERIC DEFAULT 0;

-- opportunities: ensure all columns
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'trend';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS source TEXT DEFAULT '';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS estimated_impact JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS estimated_reach INTEGER DEFAULT 0;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS trend_velocity NUMERIC DEFAULT 0;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS relevance_score NUMERIC DEFAULT 0;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS suggested_actions TEXT[] DEFAULT '{}';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS related_keywords TEXT[] DEFAULT '{}';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS data_sources TEXT[] DEFAULT '{}';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS campaign_suggestion JSONB DEFAULT '{}'::jsonb;

-- revenue_predictions: ensure all columns
ALTER TABLE public.revenue_predictions ADD COLUMN IF NOT EXISTS entity_type TEXT NOT NULL DEFAULT 'campaign';
ALTER TABLE public.revenue_predictions ADD COLUMN IF NOT EXISTS entity_id TEXT DEFAULT '';
ALTER TABLE public.revenue_predictions ADD COLUMN IF NOT EXISTS predicted_value NUMERIC DEFAULT 0;
ALTER TABLE public.revenue_predictions ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0;
ALTER TABLE public.revenue_predictions ADD COLUMN IF NOT EXISTS time_horizon TEXT DEFAULT '30d';
ALTER TABLE public.revenue_predictions ADD COLUMN IF NOT EXISTS factors JSONB DEFAULT '[]'::jsonb;

-- revenue_opportunities: ensure all columns
ALTER TABLE public.revenue_opportunities ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.revenue_opportunities ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.revenue_opportunities ADD COLUMN IF NOT EXISTS opportunity_type TEXT NOT NULL DEFAULT 'upsell';
ALTER TABLE public.revenue_opportunities ADD COLUMN IF NOT EXISTS estimated_value NUMERIC DEFAULT 0;
ALTER TABLE public.revenue_opportunities ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';
ALTER TABLE public.revenue_opportunities ADD COLUMN IF NOT EXISTS effort_required TEXT DEFAULT 'medium';
ALTER TABLE public.revenue_opportunities ADD COLUMN IF NOT EXISTS time_to_value TEXT DEFAULT '30 days';
ALTER TABLE public.revenue_opportunities ADD COLUMN IF NOT EXISTS success_probability NUMERIC DEFAULT 0;
ALTER TABLE public.revenue_opportunities ADD COLUMN IF NOT EXISTS impact JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.revenue_opportunities ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'identified';

-- strategic_plans: ensure all columns
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS plan_name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS plan_type TEXT NOT NULL DEFAULT 'annual';
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS strategies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS phases JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS total_budget NUMERIC DEFAULT 0;
ALTER TABLE public.strategic_plans ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- autonomous_content: ensure all columns
ALTER TABLE public.autonomous_content ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'blog_post';
ALTER TABLE public.autonomous_content ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
ALTER TABLE public.autonomous_content ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE public.autonomous_content ADD COLUMN IF NOT EXISTS preview TEXT DEFAULT '';
ALTER TABLE public.autonomous_content ADD COLUMN IF NOT EXISTS full_content TEXT DEFAULT '';
ALTER TABLE public.autonomous_content ADD COLUMN IF NOT EXISTS trigger_type TEXT DEFAULT '';
ALTER TABLE public.autonomous_content ADD COLUMN IF NOT EXISTS trigger_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.autonomous_content ADD COLUMN IF NOT EXISTS quality_score NUMERIC DEFAULT 0;
ALTER TABLE public.autonomous_content ADD COLUMN IF NOT EXISTS performance_prediction JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.autonomous_content ADD COLUMN IF NOT EXISTS brand_alignment NUMERIC DEFAULT 0;
ALTER TABLE public.autonomous_content ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE public.autonomous_content ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE public.autonomous_content ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{}'::jsonb;

-- Also apply RLS + policies for the generated_content table (may have been created in first migration)
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own generated_content" ON generated_content;
CREATE POLICY "Users manage own generated_content" ON generated_content FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
