-- Migration: Fix content_items.team_id NOT NULL constraint
-- The team_id column was added outside of tracked migrations and has a NOT NULL constraint
-- that prevents demo seeding. Drop the constraint since no code ever provides team_id.

ALTER TABLE public.content_items ALTER COLUMN team_id DROP NOT NULL;

-- Also create tables needed for demo agent that may not exist yet

-- recommendations table (AI Aanbevelingen on Dashboard + Autonomous Marketing)
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'optimization',
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  rationale TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium',
  confidence_score NUMERIC DEFAULT 0,
  impact_estimate JSONB DEFAULT '{}'::jsonb,
  implementation_effort TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  action_items TEXT[] DEFAULT '{}',
  dependencies TEXT[] DEFAULT '{}',
  data_sources TEXT[] DEFAULT '{}',
  results JSONB DEFAULT '{}'::jsonb,
  implemented_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissal_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own recommendations" ON public.recommendations;
CREATE POLICY "Users manage own recommendations" ON public.recommendations FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- revenue_predictions table (Revenue Engine)
CREATE TABLE IF NOT EXISTS public.revenue_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT DEFAULT 'channel',
  entity_id TEXT DEFAULT '',
  predicted_value NUMERIC DEFAULT 0,
  confidence NUMERIC DEFAULT 0,
  time_horizon INTEGER DEFAULT 30,
  factors TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.revenue_predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own revenue_predictions" ON public.revenue_predictions;
CREATE POLICY "Users manage own revenue_predictions" ON public.revenue_predictions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- revenue_opportunities table
CREATE TABLE IF NOT EXISTS public.revenue_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  opportunity_type TEXT DEFAULT 'upsell',
  estimated_value NUMERIC DEFAULT 0,
  priority TEXT DEFAULT 'medium',
  effort_required TEXT DEFAULT 'medium',
  time_to_value INTEGER DEFAULT 30,
  success_probability NUMERIC DEFAULT 0,
  impact TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'identified',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.revenue_opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own revenue_opportunities" ON public.revenue_opportunities;
CREATE POLICY "Users manage own revenue_opportunities" ON public.revenue_opportunities FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- customer_ltv table
CREATE TABLE IF NOT EXISTS public.customer_ltv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT,
  segment_name TEXT DEFAULT '',
  avg_ltv NUMERIC DEFAULT 0,
  predicted_ltv NUMERIC DEFAULT 0,
  churn_probability NUMERIC DEFAULT 0,
  expansion_potential NUMERIC DEFAULT 0,
  customer_count INTEGER DEFAULT 0,
  key_characteristics TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.customer_ltv ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own customer_ltv" ON public.customer_ltv;
CREATE POLICY "Users manage own customer_ltv" ON public.customer_ltv FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- social_accounts table
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT '',
  account_name TEXT DEFAULT '',
  status TEXT DEFAULT 'disconnected',
  connected_at TIMESTAMPTZ,
  followers INTEGER DEFAULT 0,
  profile_url TEXT DEFAULT '',
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own social_accounts" ON public.social_accounts;
CREATE POLICY "Users manage own social_accounts" ON public.social_accounts FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- strategic_plans table
CREATE TABLE IF NOT EXISTS public.strategic_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'draft',
  goals JSONB DEFAULT '[]'::jsonb,
  channels TEXT[] DEFAULT '{}',
  budget_total NUMERIC DEFAULT 0,
  timeline JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.strategic_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own strategic_plans" ON public.strategic_plans;
CREATE POLICY "Users manage own strategic_plans" ON public.strategic_plans FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- journeys table
CREATE TABLE IF NOT EXISTS public.journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'draft',
  trigger_type TEXT DEFAULT '',
  trigger_config JSONB DEFAULT '{}'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  enrollment_count INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own journeys" ON public.journeys;
CREATE POLICY "Users manage own journeys" ON public.journeys FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- media_assets table
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL DEFAULT '',
  file_path TEXT DEFAULT '',
  file_size BIGINT DEFAULT 0,
  mime_type TEXT DEFAULT '',
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own media_assets" ON public.media_assets;
CREATE POLICY "Users manage own media_assets" ON public.media_assets FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
