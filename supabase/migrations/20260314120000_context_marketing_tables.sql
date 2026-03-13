-- Migration: Create all missing context-marketing tables
-- These tables support: business-context, product-context, competitive-context,
-- audience-context, analytics, reporting, pattern-recognition, insights, context-governance

-- ============================================================
-- Helper: update_updated_at_column trigger function (idempotent)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. BUSINESS CONTEXT TABLES
-- ============================================================

-- 1a. organization_entities
CREATE TABLE IF NOT EXISTS public.organization_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.organization_entities(id) ON DELETE SET NULL,
  entity_name TEXT NOT NULL DEFAULT '',
  entity_type TEXT NOT NULL DEFAULT 'department',
  legal_name TEXT DEFAULT '',
  legal_structure TEXT DEFAULT '',
  jurisdiction TEXT DEFAULT '',
  description TEXT DEFAULT '',
  employee_count INTEGER DEFAULT 0,
  annual_revenue NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.organization_entities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own organization_entities" ON public.organization_entities;
CREATE POLICY "Users manage own organization_entities" ON public.organization_entities FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_organization_entities_user ON public.organization_entities(user_id);
DROP TRIGGER IF EXISTS update_organization_entities_updated_at ON public.organization_entities;
CREATE TRIGGER update_organization_entities_updated_at
  BEFORE UPDATE ON public.organization_entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1b. strategic_objectives
CREATE TABLE IF NOT EXISTS public.strategic_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_entity_id UUID REFERENCES public.organization_entities(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  objective_type TEXT NOT NULL DEFAULT 'operational',
  priority INTEGER DEFAULT 0,
  time_horizon TEXT DEFAULT '1year',
  target_date TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  success_metrics JSONB DEFAULT '[]'::jsonb,
  target_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  owner_name TEXT DEFAULT '',
  owner_role TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.strategic_objectives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own strategic_objectives" ON public.strategic_objectives;
CREATE POLICY "Users manage own strategic_objectives" ON public.strategic_objectives FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_strategic_objectives_user ON public.strategic_objectives(user_id);
DROP TRIGGER IF EXISTS update_strategic_objectives_updated_at ON public.strategic_objectives;
CREATE TRIGGER update_strategic_objectives_updated_at
  BEFORE UPDATE ON public.strategic_objectives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1c. operating_model
CREATE TABLE IF NOT EXISTS public.operating_model (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_model_type TEXT NOT NULL DEFAULT 'b2b',
  revenue_model TEXT NOT NULL DEFAULT 'subscription',
  target_market TEXT DEFAULT '',
  value_proposition TEXT DEFAULT '',
  key_activities JSONB DEFAULT '[]'::jsonb,
  key_resources JSONB DEFAULT '[]'::jsonb,
  key_partnerships JSONB DEFAULT '[]'::jsonb,
  cost_structure JSONB DEFAULT '{}'::jsonb,
  revenue_streams JSONB DEFAULT '[]'::jsonb,
  maturity_stage TEXT DEFAULT 'growth',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.operating_model ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own operating_model" ON public.operating_model;
CREATE POLICY "Users manage own operating_model" ON public.operating_model FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_operating_model_user ON public.operating_model(user_id);
DROP TRIGGER IF EXISTS update_operating_model_updated_at ON public.operating_model;
CREATE TRIGGER update_operating_model_updated_at
  BEFORE UPDATE ON public.operating_model
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1d. governance_framework
CREATE TABLE IF NOT EXISTS public.governance_framework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision_framework TEXT DEFAULT '',
  approval_levels JSONB DEFAULT '[]'::jsonb,
  risk_tolerance TEXT DEFAULT 'moderate',
  compliance_requirements JSONB DEFAULT '[]'::jsonb,
  key_policies JSONB DEFAULT '[]'::jsonb,
  governance_bodies JSONB DEFAULT '[]'::jsonb,
  reporting_structure JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.governance_framework ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own governance_framework" ON public.governance_framework;
CREATE POLICY "Users manage own governance_framework" ON public.governance_framework FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_governance_framework_user ON public.governance_framework(user_id);
DROP TRIGGER IF EXISTS update_governance_framework_updated_at ON public.governance_framework;
CREATE TRIGGER update_governance_framework_updated_at
  BEFORE UPDATE ON public.governance_framework
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 1e. context_completeness
CREATE TABLE IF NOT EXISTS public.context_completeness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL DEFAULT 'overall',
  completeness_score NUMERIC DEFAULT 0,
  missing_elements JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.context_completeness ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own context_completeness" ON public.context_completeness;
CREATE POLICY "Users manage own context_completeness" ON public.context_completeness FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_context_completeness_user ON public.context_completeness(user_id);

-- ============================================================
-- 2. PRODUCT CONTEXT TABLES
-- ============================================================

-- 2a. products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL DEFAULT '',
  product_code TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'concept',
  product_type TEXT NOT NULL DEFAULT 'software',
  description TEXT DEFAULT '',
  launch_date TEXT DEFAULT '',
  sunset_date TEXT DEFAULT '',
  target_audience JSONB DEFAULT '[]'::jsonb,
  key_features JSONB DEFAULT '[]'::jsonb,
  differentiators JSONB DEFAULT '[]'::jsonb,
  constraints JSONB DEFAULT '[]'::jsonb,
  dependencies JSONB DEFAULT '[]'::jsonb,
  pricing_model JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own products" ON public.products;
CREATE POLICY "Users manage own products" ON public.products FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_products_user ON public.products(user_id);
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2b. product_relationships
CREATE TABLE IF NOT EXISTS public.product_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  related_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'integrates_with',
  description TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.product_relationships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own product_relationships" ON public.product_relationships;
CREATE POLICY "Users manage own product_relationships" ON public.product_relationships FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_product_relationships_user ON public.product_relationships(user_id);
CREATE INDEX IF NOT EXISTS idx_product_relationships_product ON public.product_relationships(product_id);

-- 2c. product_roadmap
CREATE TABLE IF NOT EXISTS public.product_roadmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL DEFAULT '',
  feature_description TEXT DEFAULT '',
  quarter TEXT NOT NULL DEFAULT 'Q1',
  year INTEGER NOT NULL DEFAULT 2026,
  confidence_level NUMERIC DEFAULT 0,
  public_commitment BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'planned',
  target_release TEXT DEFAULT '',
  dependencies JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.product_roadmap ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own product_roadmap" ON public.product_roadmap;
CREATE POLICY "Users manage own product_roadmap" ON public.product_roadmap FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_product_roadmap_user ON public.product_roadmap(user_id);
CREATE INDEX IF NOT EXISTS idx_product_roadmap_product ON public.product_roadmap(product_id);
DROP TRIGGER IF EXISTS update_product_roadmap_updated_at ON public.product_roadmap;
CREATE TRIGGER update_product_roadmap_updated_at
  BEFORE UPDATE ON public.product_roadmap
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. COMPETITIVE CONTEXT TABLES
-- ============================================================

-- 3a. competitors
CREATE TABLE IF NOT EXISTS public.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL DEFAULT '',
  website_url TEXT DEFAULT '',
  company_type TEXT NOT NULL DEFAULT 'direct',
  market_share NUMERIC DEFAULT 0,
  estimated_revenue NUMERIC DEFAULT 0,
  employee_count INTEGER DEFAULT 0,
  founding_year INTEGER DEFAULT 0,
  headquarters_location TEXT DEFAULT '',
  key_products JSONB DEFAULT '[]'::jsonb,
  target_segments JSONB DEFAULT '[]'::jsonb,
  pricing_strategy TEXT DEFAULT '',
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  opportunities JSONB DEFAULT '[]'::jsonb,
  threats JSONB DEFAULT '[]'::jsonb,
  last_analyzed TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own competitors" ON public.competitors;
CREATE POLICY "Users manage own competitors" ON public.competitors FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_competitors_user ON public.competitors(user_id);
DROP TRIGGER IF EXISTS update_competitors_updated_at ON public.competitors;
CREATE TRIGGER update_competitors_updated_at
  BEFORE UPDATE ON public.competitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3b. competitive_features
CREATE TABLE IF NOT EXISTS public.competitive_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL DEFAULT '',
  feature_category TEXT DEFAULT '',
  our_capability TEXT DEFAULT '',
  our_score NUMERIC DEFAULT 0,
  our_status TEXT DEFAULT 'available',
  competitor_capabilities JSONB DEFAULT '{}'::jsonb,
  importance_weight NUMERIC DEFAULT 3,
  comparison_notes TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.competitive_features ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own competitive_features" ON public.competitive_features;
CREATE POLICY "Users manage own competitive_features" ON public.competitive_features FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_competitive_features_user ON public.competitive_features(user_id);
DROP TRIGGER IF EXISTS update_competitive_features_updated_at ON public.competitive_features;
CREATE TRIGGER update_competitive_features_updated_at
  BEFORE UPDATE ON public.competitive_features
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3c. competitive_analysis
CREATE TABLE IF NOT EXISTS public.competitive_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'swot',
  analysis_data JSONB DEFAULT '{}'::jsonb,
  insights JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.competitive_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own competitive_analysis" ON public.competitive_analysis;
CREATE POLICY "Users manage own competitive_analysis" ON public.competitive_analysis FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_competitive_analysis_user ON public.competitive_analysis(user_id);
DROP TRIGGER IF EXISTS update_competitive_analysis_updated_at ON public.competitive_analysis;
CREATE TRIGGER update_competitive_analysis_updated_at
  BEFORE UPDATE ON public.competitive_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3d. competitive_alerts
CREATE TABLE IF NOT EXISTS public.competitive_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES public.competitors(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL DEFAULT 'news',
  alert_data JSONB DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL DEFAULT 'medium',
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.competitive_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own competitive_alerts" ON public.competitive_alerts;
CREATE POLICY "Users manage own competitive_alerts" ON public.competitive_alerts FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_competitive_alerts_user ON public.competitive_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_competitive_alerts_competitor ON public.competitive_alerts(competitor_id);

-- ============================================================
-- 4. AUDIENCE CONTEXT TABLES
-- ============================================================

-- 4a. personas
CREATE TABLE IF NOT EXISTS public.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled Persona',
  demographics JSONB DEFAULT '{}'::jsonb,
  psychographics JSONB DEFAULT '{}'::jsonb,
  behavioral JSONB DEFAULT '{}'::jsonb,
  journey_stages JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own personas" ON public.personas;
CREATE POLICY "Users manage own personas" ON public.personas FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_personas_user ON public.personas(user_id);
DROP TRIGGER IF EXISTS update_personas_updated_at ON public.personas;
CREATE TRIGGER update_personas_updated_at
  BEFORE UPDATE ON public.personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4b. segments
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
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own segments" ON public.segments;
CREATE POLICY "Users manage own segments" ON public.segments FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_segments_user ON public.segments(user_id);
DROP TRIGGER IF EXISTS update_segments_updated_at ON public.segments;
CREATE TRIGGER update_segments_updated_at
  BEFORE UPDATE ON public.segments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. ANALYTICS TABLES
-- ============================================================

-- 5a. metrics_definitions
CREATE TABLE IF NOT EXISTS public.metrics_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL DEFAULT '',
  metric_type TEXT NOT NULL DEFAULT 'performance',
  calculation_type TEXT NOT NULL DEFAULT 'sum',
  calculation_formula TEXT DEFAULT '',
  data_source TEXT NOT NULL DEFAULT 'internal',
  source_config JSONB DEFAULT '{}'::jsonb,
  display_format TEXT NOT NULL DEFAULT 'number',
  decimal_places INTEGER DEFAULT 0,
  target_value NUMERIC,
  benchmark_value NUMERIC,
  threshold_critical NUMERIC,
  threshold_warning NUMERIC,
  update_frequency TEXT DEFAULT 'daily',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.metrics_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own metrics_definitions" ON public.metrics_definitions;
CREATE POLICY "Users manage own metrics_definitions" ON public.metrics_definitions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_metrics_definitions_user ON public.metrics_definitions(user_id);
DROP TRIGGER IF EXISTS update_metrics_definitions_updated_at ON public.metrics_definitions;
CREATE TRIGGER update_metrics_definitions_updated_at
  BEFORE UPDATE ON public.metrics_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5b. metrics_data
CREATE TABLE IF NOT EXISTS public.metrics_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_definition_id UUID REFERENCES public.metrics_definitions(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  dimensions JSONB DEFAULT '{}'::jsonb,
  context_type TEXT DEFAULT '',
  context_id TEXT DEFAULT '',
  data_quality_score NUMERIC DEFAULT 100,
  is_projected BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.metrics_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own metrics_data" ON public.metrics_data;
CREATE POLICY "Users manage own metrics_data" ON public.metrics_data FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_metrics_data_user ON public.metrics_data(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_data_metric ON public.metrics_data(metric_definition_id);
CREATE INDEX IF NOT EXISTS idx_metrics_data_timestamp ON public.metrics_data(timestamp);

-- 5c. analytics_dashboards
CREATE TABLE IF NOT EXISTS public.analytics_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_name TEXT NOT NULL DEFAULT '',
  dashboard_type TEXT NOT NULL DEFAULT 'custom',
  description TEXT DEFAULT '',
  layout_type TEXT NOT NULL DEFAULT 'responsive',
  layout_config JSONB DEFAULT '{}'::jsonb,
  is_public BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  shared_with TEXT[] DEFAULT '{}',
  auto_refresh BOOLEAN DEFAULT false,
  refresh_interval_seconds INTEGER DEFAULT 300,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  favorite_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.analytics_dashboards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own analytics_dashboards" ON public.analytics_dashboards;
CREATE POLICY "Users manage own analytics_dashboards" ON public.analytics_dashboards FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_analytics_dashboards_user ON public.analytics_dashboards(user_id);
DROP TRIGGER IF EXISTS update_analytics_dashboards_updated_at ON public.analytics_dashboards;
CREATE TRIGGER update_analytics_dashboards_updated_at
  BEFORE UPDATE ON public.analytics_dashboards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5d. dashboard_widgets
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_id UUID NOT NULL REFERENCES public.analytics_dashboards(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL DEFAULT 'metric_card',
  widget_title TEXT NOT NULL DEFAULT '',
  metrics TEXT[] DEFAULT '{}',
  dimensions TEXT[] DEFAULT '{}',
  filters JSONB DEFAULT '[]'::jsonb,
  time_range TEXT DEFAULT '30d',
  comparison_period TEXT DEFAULT '',
  visualization_config JSONB DEFAULT '{}'::jsonb,
  position JSONB DEFAULT '{"x":0,"y":0,"w":4,"h":3}'::jsonb,
  is_interactive BOOLEAN DEFAULT true,
  drill_down_config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own dashboard_widgets" ON public.dashboard_widgets;
CREATE POLICY "Users manage own dashboard_widgets" ON public.dashboard_widgets FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user ON public.dashboard_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard ON public.dashboard_widgets(dashboard_id);
DROP TRIGGER IF EXISTS update_dashboard_widgets_updated_at ON public.dashboard_widgets;
CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON public.dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5e. attribution_results
CREATE TABLE IF NOT EXISTS public.attribution_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attribution_model_id UUID REFERENCES public.attribution_models(id) ON DELETE SET NULL,
  conversion_type TEXT DEFAULT 'purchase',
  conversion_value NUMERIC DEFAULT 0,
  touchpoints JSONB DEFAULT '[]'::jsonb,
  channel_credits JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.attribution_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own attribution_results" ON public.attribution_results;
CREATE POLICY "Users manage own attribution_results" ON public.attribution_results FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_attribution_results_user ON public.attribution_results(user_id);

-- 5f. predictive_models
CREATE TABLE IF NOT EXISTS public.predictive_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL DEFAULT '',
  model_type TEXT NOT NULL DEFAULT 'revenue_forecast',
  algorithm TEXT DEFAULT 'auto',
  features JSONB DEFAULT '[]'::jsonb,
  hyperparameters JSONB DEFAULT '{}'::jsonb,
  training_data_start TEXT DEFAULT '',
  training_data_end TEXT DEFAULT '',
  training_status TEXT NOT NULL DEFAULT 'pending',
  accuracy_score NUMERIC,
  precision_score NUMERIC,
  recall_score NUMERIC,
  f1_score NUMERIC,
  last_prediction_at TIMESTAMPTZ,
  prediction_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.predictive_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own predictive_models" ON public.predictive_models;
CREATE POLICY "Users manage own predictive_models" ON public.predictive_models FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_predictive_models_user ON public.predictive_models(user_id);
DROP TRIGGER IF EXISTS update_predictive_models_updated_at ON public.predictive_models;
CREATE TRIGGER update_predictive_models_updated_at
  BEFORE UPDATE ON public.predictive_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5g. predictions
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  predictive_model_id UUID REFERENCES public.predictive_models(id) ON DELETE SET NULL,
  prediction_type TEXT DEFAULT '',
  prediction_value JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC DEFAULT 0,
  prediction_date TEXT DEFAULT '',
  input_features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own predictions" ON public.predictions;
CREATE POLICY "Users manage own predictions" ON public.predictions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_predictions_user ON public.predictions(user_id);

-- 5h. analytics_goals
CREATE TABLE IF NOT EXISTS public.analytics_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_name TEXT NOT NULL DEFAULT '',
  goal_type TEXT NOT NULL DEFAULT 'revenue',
  metric_id UUID REFERENCES public.metrics_definitions(id) ON DELETE SET NULL,
  target_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  progress_percentage NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_started',
  owner_id TEXT DEFAULT '',
  team_members TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.analytics_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own analytics_goals" ON public.analytics_goals;
CREATE POLICY "Users manage own analytics_goals" ON public.analytics_goals FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_analytics_goals_user ON public.analytics_goals(user_id);
DROP TRIGGER IF EXISTS update_analytics_goals_updated_at ON public.analytics_goals;
CREATE TRIGGER update_analytics_goals_updated_at
  BEFORE UPDATE ON public.analytics_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5i. experiments
CREATE TABLE IF NOT EXISTS public.experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_name TEXT NOT NULL DEFAULT '',
  hypothesis TEXT DEFAULT '',
  experiment_type TEXT NOT NULL DEFAULT 'ab_test',
  control_variant JSONB DEFAULT '{}'::jsonb,
  test_variants JSONB DEFAULT '[]'::jsonb,
  traffic_allocation JSONB DEFAULT '{}'::jsonb,
  primary_metric_id TEXT DEFAULT '',
  secondary_metrics TEXT[] DEFAULT '{}',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  winner_variant TEXT DEFAULT '',
  confidence_level NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own experiments" ON public.experiments;
CREATE POLICY "Users manage own experiments" ON public.experiments FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_experiments_user ON public.experiments(user_id);
DROP TRIGGER IF EXISTS update_experiments_updated_at ON public.experiments;
CREATE TRIGGER update_experiments_updated_at
  BEFORE UPDATE ON public.experiments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5j. experiment_results
CREATE TABLE IF NOT EXISTS public.experiment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL DEFAULT '',
  conversions INTEGER DEFAULT 0,
  visitors INTEGER DEFAULT 0,
  conversion_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.experiment_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own experiment_results" ON public.experiment_results;
CREATE POLICY "Users manage own experiment_results" ON public.experiment_results FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_experiment_results_user ON public.experiment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_experiment_results_experiment ON public.experiment_results(experiment_id);

-- 5k. data_quality_scores
CREATE TABLE IF NOT EXISTS public.data_quality_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL DEFAULT '',
  entity_type TEXT DEFAULT '',
  entity_id TEXT DEFAULT '',
  completeness_score NUMERIC DEFAULT 0,
  accuracy_score NUMERIC DEFAULT 0,
  consistency_score NUMERIC DEFAULT 0,
  timeliness_score NUMERIC DEFAULT 0,
  overall_score NUMERIC DEFAULT 0,
  issues_found INTEGER DEFAULT 0,
  issues_resolved INTEGER DEFAULT 0,
  critical_issues INTEGER DEFAULT 0,
  evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  next_evaluation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.data_quality_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own data_quality_scores" ON public.data_quality_scores;
CREATE POLICY "Users manage own data_quality_scores" ON public.data_quality_scores FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_data_quality_scores_user ON public.data_quality_scores(user_id);

-- ============================================================
-- 6. REPORTING TABLES
-- ============================================================

-- 6a. report_templates
CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL DEFAULT '',
  template_type TEXT NOT NULL DEFAULT 'custom',
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
DROP POLICY IF EXISTS "Users manage own report_templates" ON public.report_templates;
CREATE POLICY "Users manage own report_templates" ON public.report_templates FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_report_templates_user ON public.report_templates(user_id);
DROP TRIGGER IF EXISTS update_report_templates_updated_at ON public.report_templates;
CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6b. generated_reports
CREATE TABLE IF NOT EXISTS public.generated_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
  report_name TEXT NOT NULL DEFAULT '',
  report_type TEXT NOT NULL DEFAULT 'custom',
  period_start TEXT DEFAULT '',
  period_end TEXT DEFAULT '',
  comparison_period_start TEXT DEFAULT '',
  comparison_period_end TEXT DEFAULT '',
  report_data JSONB DEFAULT '{}'::jsonb,
  executive_summary TEXT DEFAULT '',
  key_findings JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  recipients TEXT[] DEFAULT '{}',
  external_recipients TEXT[] DEFAULT '{}',
  file_url TEXT DEFAULT '',
  file_format TEXT DEFAULT 'pdf',
  file_size_bytes INTEGER DEFAULT 0,
  generation_status TEXT NOT NULL DEFAULT 'pending',
  generated_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own generated_reports" ON public.generated_reports;
CREATE POLICY "Users manage own generated_reports" ON public.generated_reports FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_generated_reports_user ON public.generated_reports(user_id);

-- 6c. data_quality_rules
CREATE TABLE IF NOT EXISTS public.data_quality_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL DEFAULT '',
  rule_type TEXT NOT NULL DEFAULT 'completeness',
  target_table TEXT DEFAULT '',
  target_column TEXT DEFAULT '',
  rule_expression TEXT DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'medium',
  auto_fix BOOLEAN DEFAULT false,
  fix_action JSONB DEFAULT '{}'::jsonb,
  alert_on_violation BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.data_quality_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own data_quality_rules" ON public.data_quality_rules;
CREATE POLICY "Users manage own data_quality_rules" ON public.data_quality_rules FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_data_quality_rules_user ON public.data_quality_rules(user_id);
DROP TRIGGER IF EXISTS update_data_quality_rules_updated_at ON public.data_quality_rules;
CREATE TRIGGER update_data_quality_rules_updated_at
  BEFORE UPDATE ON public.data_quality_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6d. scheduled_reports
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_template_id UUID REFERENCES public.report_templates(id) ON DELETE SET NULL,
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
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own scheduled_reports" ON public.scheduled_reports;
CREATE POLICY "Users manage own scheduled_reports" ON public.scheduled_reports FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_user ON public.scheduled_reports(user_id);
DROP TRIGGER IF EXISTS update_scheduled_reports_updated_at ON public.scheduled_reports;
CREATE TRIGGER update_scheduled_reports_updated_at
  BEFORE UPDATE ON public.scheduled_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6e. team_members
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  role TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own team_members" ON public.team_members;
CREATE POLICY "Users manage own team_members" ON public.team_members FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
DROP TRIGGER IF EXISTS update_team_members_updated_at ON public.team_members;
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6f. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id TEXT DEFAULT '',
  notification_type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL DEFAULT '',
  message TEXT DEFAULT '',
  entity_type TEXT DEFAULT '',
  entity_id TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notifications" ON public.notifications;
CREATE POLICY "Users manage own notifications" ON public.notifications FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ============================================================
-- 7. PATTERN RECOGNITION & INSIGHTS TABLES
-- ============================================================

-- 7a. pattern_definitions
CREATE TABLE IF NOT EXISTS public.pattern_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_name TEXT NOT NULL DEFAULT '',
  pattern_type TEXT NOT NULL DEFAULT 'behavioral',
  domain TEXT NOT NULL DEFAULT 'cross_domain',
  detection_rules JSONB DEFAULT '{}'::jsonb,
  threshold_config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pattern_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own pattern_definitions" ON public.pattern_definitions;
CREATE POLICY "Users manage own pattern_definitions" ON public.pattern_definitions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_pattern_definitions_user ON public.pattern_definitions(user_id);
DROP TRIGGER IF EXISTS update_pattern_definitions_updated_at ON public.pattern_definitions;
CREATE TRIGGER update_pattern_definitions_updated_at
  BEFORE UPDATE ON public.pattern_definitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7b. pattern_detection_runs
CREATE TABLE IF NOT EXISTS public.pattern_detection_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_type TEXT NOT NULL DEFAULT 'manual',
  domains_analyzed TEXT[] DEFAULT '{}',
  patterns_detected INTEGER DEFAULT 0,
  insights_generated INTEGER DEFAULT 0,
  anomalies_found INTEGER DEFAULT 0,
  processing_time_ms INTEGER DEFAULT 0,
  data_points_analyzed INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running',
  error_details JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
ALTER TABLE public.pattern_detection_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own pattern_detection_runs" ON public.pattern_detection_runs;
CREATE POLICY "Users manage own pattern_detection_runs" ON public.pattern_detection_runs FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_pattern_detection_runs_user ON public.pattern_detection_runs(user_id);

-- 7c. detected_patterns
CREATE TABLE IF NOT EXISTS public.detected_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_definition_id UUID REFERENCES public.pattern_definitions(id) ON DELETE SET NULL,
  pattern_type TEXT NOT NULL DEFAULT '',
  pattern_category TEXT DEFAULT '',
  domain TEXT NOT NULL DEFAULT '',
  pattern_name TEXT NOT NULL DEFAULT '',
  pattern_description TEXT DEFAULT '',
  confidence_score NUMERIC DEFAULT 0,
  impact_level TEXT DEFAULT 'medium',
  data_points JSONB DEFAULT '[]'::jsonb,
  time_range JSONB DEFAULT '{}'::jsonb,
  affected_entities JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  first_detected TIMESTAMPTZ DEFAULT NOW(),
  last_observed TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.detected_patterns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own detected_patterns" ON public.detected_patterns;
CREATE POLICY "Users manage own detected_patterns" ON public.detected_patterns FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_detected_patterns_user ON public.detected_patterns(user_id);

-- 7d. pattern_correlations
CREATE TABLE IF NOT EXISTS public.pattern_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_a_id UUID REFERENCES public.detected_patterns(id) ON DELETE CASCADE,
  pattern_b_id UUID REFERENCES public.detected_patterns(id) ON DELETE CASCADE,
  correlation_type TEXT NOT NULL DEFAULT 'temporal',
  correlation_strength NUMERIC DEFAULT 0,
  confidence_level NUMERIC DEFAULT 0,
  analysis_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pattern_correlations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own pattern_correlations" ON public.pattern_correlations;
CREATE POLICY "Users manage own pattern_correlations" ON public.pattern_correlations FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_pattern_correlations_user ON public.pattern_correlations(user_id);

-- 7e. insights
CREATE TABLE IF NOT EXISTS public.insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL DEFAULT 'recommendation',
  insight_category TEXT DEFAULT '',
  category TEXT DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  key_finding TEXT DEFAULT '',
  impact_score NUMERIC DEFAULT 0,
  urgency TEXT DEFAULT 'medium',
  confidence_level NUMERIC DEFAULT 0,
  supporting_patterns TEXT[] DEFAULT '{}',
  data_sources JSONB DEFAULT '[]'::jsonb,
  evidence JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'new',
  reviewed_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own insights" ON public.insights;
CREATE POLICY "Users manage own insights" ON public.insights FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_insights_user ON public.insights(user_id);
DROP TRIGGER IF EXISTS update_insights_updated_at ON public.insights;
CREATE TRIGGER update_insights_updated_at
  BEFORE UPDATE ON public.insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7f. insight_recommendations
CREATE TABLE IF NOT EXISTS public.insight_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_id UUID NOT NULL REFERENCES public.insights(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL DEFAULT 'action',
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  expected_impact TEXT DEFAULT '',
  implementation_effort TEXT DEFAULT 'medium',
  action_steps JSONB DEFAULT '[]'::jsonb,
  resources_required JSONB DEFAULT '[]'::jsonb,
  timeline TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'proposed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.insight_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own insight_recommendations" ON public.insight_recommendations;
CREATE POLICY "Users manage own insight_recommendations" ON public.insight_recommendations FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_insight_recommendations_user ON public.insight_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_insight_recommendations_insight ON public.insight_recommendations(insight_id);
DROP TRIGGER IF EXISTS update_insight_recommendations_updated_at ON public.insight_recommendations;
CREATE TRIGGER update_insight_recommendations_updated_at
  BEFORE UPDATE ON public.insight_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7g. content_predictions
CREATE TABLE IF NOT EXISTS public.content_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL DEFAULT 'blog',
  content_topic TEXT DEFAULT '',
  target_audience TEXT DEFAULT '',
  predicted_engagement NUMERIC DEFAULT 0,
  predicted_conversion NUMERIC DEFAULT 0,
  predicted_reach INTEGER DEFAULT 0,
  confidence_scores JSONB DEFAULT '{}'::jsonb,
  positive_factors JSONB DEFAULT '[]'::jsonb,
  negative_factors JSONB DEFAULT '[]'::jsonb,
  optimization_suggestions JSONB DEFAULT '[]'::jsonb,
  context_factors JSONB DEFAULT '{}'::jsonb,
  patterns_applied TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.content_predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own content_predictions" ON public.content_predictions;
CREATE POLICY "Users manage own content_predictions" ON public.content_predictions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_content_predictions_user ON public.content_predictions(user_id);

-- 7h. insight_impact_tracking
CREATE TABLE IF NOT EXISTS public.insight_impact_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_id UUID NOT NULL REFERENCES public.insights(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL DEFAULT '',
  baseline_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  target_value NUMERIC,
  improvement_percentage NUMERIC DEFAULT 0,
  confidence_in_attribution NUMERIC DEFAULT 80,
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.insight_impact_tracking ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own insight_impact_tracking" ON public.insight_impact_tracking;
CREATE POLICY "Users manage own insight_impact_tracking" ON public.insight_impact_tracking FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_insight_impact_tracking_user ON public.insight_impact_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_insight_impact_tracking_insight ON public.insight_impact_tracking(insight_id);

-- ============================================================
-- 8. CONTEXT GOVERNANCE TABLES
-- ============================================================

-- 8a. context_assumptions
CREATE TABLE IF NOT EXISTS public.context_assumptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assumption_type TEXT NOT NULL DEFAULT 'data_gap',
  domain TEXT DEFAULT '',
  assumption_text TEXT NOT NULL DEFAULT '',
  confidence_level INTEGER DEFAULT 3,
  validation_status TEXT NOT NULL DEFAULT 'unverified',
  context JSONB DEFAULT '{}'::jsonb,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.context_assumptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own context_assumptions" ON public.context_assumptions;
CREATE POLICY "Users manage own context_assumptions" ON public.context_assumptions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_context_assumptions_user ON public.context_assumptions(user_id);

-- 8b. validation_rules
CREATE TABLE IF NOT EXISTS public.validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL DEFAULT '',
  rule_type TEXT NOT NULL DEFAULT 'required',
  domain TEXT DEFAULT '',
  validation_logic JSONB DEFAULT '{}'::jsonb,
  error_message TEXT DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'warning',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.validation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own validation_rules" ON public.validation_rules;
CREATE POLICY "Users manage own validation_rules" ON public.validation_rules FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_validation_rules_user ON public.validation_rules(user_id);

-- ============================================================
-- 9. GRANT PERMISSIONS + REFRESH POSTGREST SCHEMA CACHE
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
