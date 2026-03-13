-- Marketing OS Tables: Complete backend for all marketing intelligence features
-- Run in Supabase SQL Editor or via `npx supabase db push`
-- Fully idempotent: safe to run multiple times

-- ═══════════════════════════════════════════════════════════════════
-- AUTONOMOUS MARKETING
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.autonomous_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'campaign_optimization',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  confidence NUMERIC DEFAULT 0,
  estimated_impact JSONB DEFAULT '{}'::jsonb,
  risk_level TEXT DEFAULT 'low',
  cost_estimate NUMERIC DEFAULT 0,
  requires_approval BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending',
  decision_data JSONB DEFAULT '{}'::jsonb,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE autonomous_decisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own autonomous_decisions" ON autonomous_decisions;
CREATE POLICY "Users manage own autonomous_decisions" ON autonomous_decisions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.autonomous_campaign_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  objective TEXT DEFAULT '',
  budget_total NUMERIC DEFAULT 0,
  budget_spent NUMERIC DEFAULT 0,
  days_remaining INTEGER DEFAULT 0,
  roi NUMERIC DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ai_managed BOOLEAN DEFAULT true,
  performance_score NUMERIC DEFAULT 0,
  performance_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE autonomous_campaign_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own autonomous_campaign_status" ON autonomous_campaign_status;
CREATE POLICY "Users manage own autonomous_campaign_status" ON autonomous_campaign_status FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- INTEGRATION HUB (extends existing integrations table)
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.data_flow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID,
  platform TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT 'inbound',
  data_type TEXT NOT NULL DEFAULT '',
  record_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'success',
  duration_ms INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE data_flow_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own data_flow_events" ON data_flow_events;
CREATE POLICY "Users manage own data_flow_events" ON data_flow_events FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'social',
  status TEXT NOT NULL DEFAULT 'disconnected',
  connected_at TIMESTAMPTZ,
  last_sync TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'realtime',
  data_flowing BOOLEAN DEFAULT false,
  account_name TEXT DEFAULT '',
  account_id TEXT DEFAULT '',
  permissions TEXT[] DEFAULT '{}',
  health_score NUMERIC DEFAULT 0,
  error_message TEXT,
  records_synced INTEGER DEFAULT 0,
  failed_syncs INTEGER DEFAULT 0,
  data_volume_mb NUMERIC DEFAULT 0,
  features TEXT[] DEFAULT '{}',
  icon TEXT DEFAULT '',
  color TEXT DEFAULT '#000000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own integration_configs" ON integration_configs;
CREATE POLICY "Users manage own integration_configs" ON integration_configs FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- PUBLICATION ENGINE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.publishable_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  media_urls TEXT[] DEFAULT '{}',
  content_type TEXT NOT NULL DEFAULT 'post',
  channels TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  auto_scheduled BOOLEAN DEFAULT false,
  optimal_time_reason TEXT DEFAULT '',
  campaign_id TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  performance JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE publishable_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own publishable_content" ON publishable_content;
CREATE POLICY "Users manage own publishable_content" ON publishable_content FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.channel_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT '',
  connected BOOLEAN DEFAULT false,
  account_name TEXT DEFAULT '',
  followers INTEGER DEFAULT 0,
  avg_engagement NUMERIC DEFAULT 0,
  posts_this_month INTEGER DEFAULT 0,
  best_time TEXT DEFAULT '',
  health_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE channel_health ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own channel_health" ON channel_health;
CREATE POLICY "Users manage own channel_health" ON channel_health FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- LEAD SCORING
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.scored_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  company TEXT DEFAULT '',
  title TEXT DEFAULT '',
  composite_score NUMERIC DEFAULT 0,
  score_breakdown JSONB DEFAULT '{}'::jsonb,
  stage TEXT NOT NULL DEFAULT 'visitor',
  conversion_probability NUMERIC DEFAULT 0,
  predicted_value NUMERIC DEFAULT 0,
  predicted_close_date TEXT DEFAULT '',
  hot_signals TEXT[] DEFAULT '{}',
  cold_signals TEXT[] DEFAULT '{}',
  last_activity TEXT DEFAULT '',
  activity_count_30d INTEGER DEFAULT 0,
  source TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  score_history JSONB DEFAULT '[]'::jsonb,
  next_best_action JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scored_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own scored_leads" ON scored_leads;
CREATE POLICY "Users manage own scored_leads" ON scored_leads FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'behavioral',
  description TEXT NOT NULL DEFAULT '',
  condition JSONB DEFAULT '{}'::jsonb,
  points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  triggers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scoring_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own scoring_rules" ON scoring_rules;
CREATE POLICY "Users manage own scoring_rules" ON scoring_rules FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.scoring_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default Model',
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  accuracy NUMERIC DEFAULT 0,
  total_leads_scored INTEGER DEFAULT 0,
  last_trained TIMESTAMPTZ,
  category_weights JSONB DEFAULT '{}'::jsonb,
  threshold_mql INTEGER DEFAULT 40,
  threshold_sql INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scoring_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own scoring_models" ON scoring_models;
CREATE POLICY "Users manage own scoring_models" ON scoring_models FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- MULTI-AGENT SYSTEM
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'social',
  status TEXT NOT NULL DEFAULT 'idle',
  description TEXT NOT NULL DEFAULT '',
  capabilities TEXT[] DEFAULT '{}',
  current_task TEXT DEFAULT '',
  tasks_completed_today INTEGER DEFAULT 0,
  tasks_in_queue INTEGER DEFAULT 0,
  success_rate NUMERIC DEFAULT 0,
  efficiency_score NUMERIC DEFAULT 0,
  last_action TEXT DEFAULT '',
  last_action_at TIMESTAMPTZ,
  uptime_hours NUMERIC DEFAULT 0,
  decisions_made INTEGER DEFAULT 0,
  revenue_impact NUMERIC DEFAULT 0,
  learning_progress NUMERIC DEFAULT 0,
  model_version TEXT DEFAULT '1.0',
  performance_trend JSONB DEFAULT '[]'::jsonb,
  avatar_color TEXT DEFAULT '#000000',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own ai_agents" ON ai_agents;
CREATE POLICY "Users manage own ai_agents" ON ai_agents FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_agent TEXT NOT NULL DEFAULT '',
  to_agent TEXT NOT NULL DEFAULT '',
  message_type TEXT NOT NULL DEFAULT 'info',
  content TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own agent_messages" ON agent_messages;
CREATE POLICY "Users manage own agent_messages" ON agent_messages FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL DEFAULT 'social',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'queued',
  priority TEXT NOT NULL DEFAULT 'medium',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB DEFAULT '{}'::jsonb,
  dependencies TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own agent_tasks" ON agent_tasks;
CREATE POLICY "Users manage own agent_tasks" ON agent_tasks FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- ATTRIBUTION
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.attribution_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'last_touch',
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT false,
  accuracy_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE attribution_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own attribution_models" ON attribution_models;
CREATE POLICY "Users manage own attribution_models" ON attribution_models FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.channel_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL DEFAULT 'last_touch',
  channel TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  color TEXT DEFAULT '#000000',
  attributed_conversions NUMERIC DEFAULT 0,
  attributed_revenue NUMERIC DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  roi NUMERIC DEFAULT 0,
  percentage_share NUMERIC DEFAULT 0,
  avg_position_in_journey NUMERIC DEFAULT 0,
  total_touchpoints INTEGER DEFAULT 0,
  confidence NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE channel_attributions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own channel_attributions" ON channel_attributions;
CREATE POLICY "Users manage own channel_attributions" ON channel_attributions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.journey_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  touchpoints JSONB DEFAULT '[]'::jsonb,
  conversion_type TEXT NOT NULL DEFAULT 'purchase',
  conversion_value NUMERIC DEFAULT 0,
  total_duration_days INTEGER DEFAULT 0,
  touchpoint_count INTEGER DEFAULT 0,
  frequency INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE journey_paths ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own journey_paths" ON journey_paths;
CREATE POLICY "Users manage own journey_paths" ON journey_paths FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- OPPORTUNITY INTELLIGENCE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'trend',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  source TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'new',
  confidence NUMERIC DEFAULT 0,
  estimated_impact JSONB DEFAULT '{}'::jsonb,
  estimated_reach INTEGER DEFAULT 0,
  trend_velocity NUMERIC DEFAULT 0,
  relevance_score NUMERIC DEFAULT 0,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  suggested_actions TEXT[] DEFAULT '{}',
  related_keywords TEXT[] DEFAULT '{}',
  data_sources TEXT[] DEFAULT '{}',
  campaign_suggestion JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own opportunities" ON opportunities;
CREATE POLICY "Users manage own opportunities" ON opportunities FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.trend_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL DEFAULT '',
  volume INTEGER DEFAULT 0,
  growth_rate NUMERIC DEFAULT 0,
  peak_date TEXT DEFAULT '',
  related_topics TEXT[] DEFAULT '{}',
  sentiment NUMERIC DEFAULT 0,
  regions TEXT[] DEFAULT '{}',
  trend_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE trend_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own trend_data" ON trend_data;
CREATE POLICY "Users manage own trend_data" ON trend_data FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- OPPORTUNITY FEED
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'lead_signal',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  urgency TEXT NOT NULL DEFAULT 'this_week',
  confidence NUMERIC DEFAULT 0,
  estimated_value NUMERIC DEFAULT 0,
  source TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT false,
  is_actioned BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  suggested_action TEXT DEFAULT '',
  related_entities JSONB DEFAULT '[]'::jsonb,
  impact_metrics JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE feed_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own feed_items" ON feed_items;
CREATE POLICY "Users manage own feed_items" ON feed_items FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- NETWORKING ENGINE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.captured_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  company TEXT DEFAULT '',
  title TEXT DEFAULT '',
  linkedin_url TEXT DEFAULT '',
  capture_method TEXT NOT NULL DEFAULT 'manual',
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  event_id TEXT DEFAULT '',
  event_name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'captured',
  enrichment JSONB DEFAULT '{}'::jsonb,
  ai_insights JSONB DEFAULT '{}'::jsonb,
  follow_up JSONB DEFAULT '{}'::jsonb,
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE captured_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own captured_contacts" ON captured_contacts;
CREATE POLICY "Users manage own captured_contacts" ON captured_contacts FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  scans INTEGER DEFAULT 0,
  leads_captured INTEGER DEFAULT 0,
  event_id TEXT DEFAULT '',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own qr_codes" ON qr_codes;
CREATE POLICY "Users manage own qr_codes" ON qr_codes FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- EVENT INTELLIGENCE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.discovered_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'conference',
  description TEXT NOT NULL DEFAULT '',
  location TEXT DEFAULT '',
  city TEXT DEFAULT '',
  country TEXT DEFAULT '',
  date_start TEXT DEFAULT '',
  date_end TEXT DEFAULT '',
  website TEXT DEFAULT '',
  expected_attendees INTEGER DEFAULT 0,
  target_audience_match NUMERIC DEFAULT 0,
  estimated_roi JSONB DEFAULT '{}'::jsonb,
  estimated_leads INTEGER DEFAULT 0,
  networking_value TEXT DEFAULT 'medium',
  cost NUMERIC DEFAULT 0,
  speakers JSONB DEFAULT '[]'::jsonb,
  topics TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'discovered',
  priority_score NUMERIC DEFAULT 0,
  ai_recommendation TEXT DEFAULT '',
  competitors_attending TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE discovered_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own discovered_events" ON discovered_events;
CREATE POLICY "Users manage own discovered_events" ON discovered_events FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- CAMPAIGN TRIGGERING
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.campaign_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'trend_detected',
  description TEXT NOT NULL DEFAULT '',
  condition JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  actions TEXT[] DEFAULT '{}',
  channels TEXT[] DEFAULT '{}',
  budget_limit NUMERIC DEFAULT 0,
  confidence_threshold NUMERIC DEFAULT 0.7,
  requires_approval BOOLEAN DEFAULT true,
  times_triggered INTEGER DEFAULT 0,
  last_triggered TIMESTAMPTZ,
  performance JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaign_triggers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own campaign_triggers" ON campaign_triggers;
CREATE POLICY "Users manage own campaign_triggers" ON campaign_triggers FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.triggered_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES campaign_triggers(id) ON DELETE SET NULL,
  trigger_name TEXT NOT NULL DEFAULT '',
  campaign_name TEXT NOT NULL DEFAULT '',
  signal TEXT NOT NULL DEFAULT '',
  channels TEXT[] DEFAULT '{}',
  budget_allocated NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  launched_at TIMESTAMPTZ,
  performance JSONB DEFAULT '{}'::jsonb,
  ai_reasoning TEXT DEFAULT '',
  content_generated JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE triggered_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own triggered_campaigns" ON triggered_campaigns;
CREATE POLICY "Users manage own triggered_campaigns" ON triggered_campaigns FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- LEAD INTELLIGENCE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.lead_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT DEFAULT '',
  company TEXT DEFAULT '',
  title TEXT DEFAULT '',
  intent_level TEXT NOT NULL DEFAULT 'medium',
  intent_score NUMERIC DEFAULT 0,
  buying_stage TEXT DEFAULT 'awareness',
  signals JSONB DEFAULT '[]'::jsonb,
  website_behavior JSONB DEFAULT '{}'::jsonb,
  social_activity JSONB DEFAULT '{}'::jsonb,
  engagement_timeline JSONB DEFAULT '[]'::jsonb,
  predicted_actions JSONB DEFAULT '[]'::jsonb,
  company_intel JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lead_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own lead_profiles" ON lead_profiles;
CREATE POLICY "Users manage own lead_profiles" ON lead_profiles FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.intent_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES lead_profiles(id) ON DELETE CASCADE,
  lead_name TEXT DEFAULT '',
  company TEXT DEFAULT '',
  type TEXT NOT NULL DEFAULT 'page_view',
  description TEXT NOT NULL DEFAULT '',
  strength NUMERIC DEFAULT 0,
  page_url TEXT DEFAULT '',
  duration_seconds INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE intent_signals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own intent_signals" ON intent_signals;
CREATE POLICY "Users manage own intent_signals" ON intent_signals FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- REVENUE ENGINE
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.revenue_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL DEFAULT 'campaign',
  entity_id TEXT DEFAULT '',
  predicted_value NUMERIC DEFAULT 0,
  confidence NUMERIC DEFAULT 0,
  time_horizon TEXT DEFAULT '30d',
  factors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE revenue_predictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own revenue_predictions" ON revenue_predictions;
CREATE POLICY "Users manage own revenue_predictions" ON revenue_predictions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.revenue_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  opportunity_type TEXT NOT NULL DEFAULT 'upsell',
  estimated_value NUMERIC DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium',
  effort_required TEXT DEFAULT 'medium',
  time_to_value TEXT DEFAULT '30 days',
  success_probability NUMERIC DEFAULT 0,
  impact JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'identified',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE revenue_opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own revenue_opportunities" ON revenue_opportunities;
CREATE POLICY "Users manage own revenue_opportunities" ON revenue_opportunities FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.customer_ltv (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  segment_name TEXT NOT NULL DEFAULT '',
  avg_ltv NUMERIC DEFAULT 0,
  predicted_ltv NUMERIC DEFAULT 0,
  churn_probability NUMERIC DEFAULT 0,
  expansion_potential NUMERIC DEFAULT 0,
  customer_count INTEGER DEFAULT 0,
  key_characteristics TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE customer_ltv ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own customer_ltv" ON customer_ltv;
CREATE POLICY "Users manage own customer_ltv" ON customer_ltv FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- STRATEGIC PLANNING
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.strategic_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL DEFAULT '',
  plan_type TEXT NOT NULL DEFAULT 'annual',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  goals JSONB DEFAULT '[]'::jsonb,
  strategies JSONB DEFAULT '[]'::jsonb,
  phases JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '{}'::jsonb,
  resources JSONB DEFAULT '{}'::jsonb,
  total_budget NUMERIC DEFAULT 0,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE strategic_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own strategic_plans" ON strategic_plans;
CREATE POLICY "Users manage own strategic_plans" ON strategic_plans FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- RECOMMENDATIONS
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'optimization',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  rationale TEXT DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  confidence_score NUMERIC DEFAULT 0,
  impact_estimate TEXT DEFAULT '',
  implementation_effort TEXT DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  action_items JSONB DEFAULT '[]'::jsonb,
  dependencies TEXT[] DEFAULT '{}',
  data_sources TEXT[] DEFAULT '{}',
  implemented_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  dismissal_reason TEXT DEFAULT '',
  results JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own recommendations" ON recommendations;
CREATE POLICY "Users manage own recommendations" ON recommendations FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- CONTENT FACTORY
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.autonomous_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL DEFAULT 'blog_post',
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  preview TEXT DEFAULT '',
  full_content TEXT DEFAULT '',
  trigger_type TEXT DEFAULT '',
  trigger_data JSONB DEFAULT '{}'::jsonb,
  quality_score NUMERIC DEFAULT 0,
  performance_prediction JSONB DEFAULT '{}'::jsonb,
  brand_alignment NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE autonomous_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own autonomous_content" ON autonomous_content;
CREATE POLICY "Users manage own autonomous_content" ON autonomous_content FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- CONTENT GENERATION
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL DEFAULT 'blog_post',
  title TEXT NOT NULL DEFAULT '',
  content TEXT DEFAULT '',
  prompt TEXT DEFAULT '',
  brand_voice_id TEXT DEFAULT '',
  performance_prediction JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  metadata JSONB DEFAULT '{}'::jsonb,
  versions JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own generated_content" ON generated_content;
CREATE POLICY "Users manage own generated_content" ON generated_content FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.brand_voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  tone_attributes JSONB DEFAULT '[]'::jsonb,
  vocabulary TEXT[] DEFAULT '{}',
  examples JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brand_voices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own brand_voices" ON brand_voices;
CREATE POLICY "Users manage own brand_voices" ON brand_voices FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.content_templates_ai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  content_type TEXT NOT NULL DEFAULT 'blog_post',
  category TEXT DEFAULT '',
  prompt_template TEXT DEFAULT '',
  structure JSONB DEFAULT '{}'::jsonb,
  variables TEXT[] DEFAULT '{}',
  use_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE content_templates_ai ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own content_templates_ai" ON content_templates_ai;
CREATE POLICY "Users manage own content_templates_ai" ON content_templates_ai FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- AUTOMATION
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  automation_type TEXT NOT NULL DEFAULT 'workflow',
  status TEXT NOT NULL DEFAULT 'draft',
  trigger_type TEXT DEFAULT '',
  trigger_conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  is_template BOOLEAN DEFAULT false,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own automation_rules" ON automation_rules;
CREATE POLICY "Users manage own automation_rules" ON automation_rules FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
  contact_id TEXT DEFAULT '',
  action_type TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'success',
  details JSONB DEFAULT '{}'::jsonb,
  error_message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own automation_logs" ON automation_logs;
CREATE POLICY "Users manage own automation_logs" ON automation_logs FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.automation_templates_ai (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT '',
  automation_type TEXT NOT NULL DEFAULT 'workflow',
  config JSONB DEFAULT '{}'::jsonb,
  preview_image TEXT DEFAULT '',
  use_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE automation_templates_ai ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own automation_templates_ai" ON automation_templates_ai;
CREATE POLICY "Users manage own automation_templates_ai" ON automation_templates_ai FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════
-- UPDATE TRIGGERS (reuse existing function)
-- ═══════════════════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'autonomous_decisions', 'autonomous_campaign_status',
    'integration_configs', 'publishable_content', 'channel_health',
    'scored_leads', 'scoring_rules', 'scoring_models',
    'ai_agents', 'attribution_models', 'channel_attributions',
    'opportunities', 'trend_data', 'feed_items',
    'captured_contacts', 'qr_codes', 'discovered_events',
    'campaign_triggers', 'triggered_campaigns',
    'lead_profiles', 'revenue_predictions', 'revenue_opportunities',
    'customer_ltv', 'strategic_plans', 'recommendations',
    'autonomous_content', 'generated_content', 'brand_voices',
    'content_templates_ai', 'automation_rules', 'automation_templates_ai'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS update_%1$s_updated_at ON %1$s;
       CREATE TRIGGER update_%1$s_updated_at
         BEFORE UPDATE ON %1$s
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl
    );
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_autonomous_decisions_user ON autonomous_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_autonomous_campaign_status_user ON autonomous_campaign_status(user_id);
CREATE INDEX IF NOT EXISTS idx_data_flow_events_user ON data_flow_events(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_configs_user ON integration_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_publishable_content_user ON publishable_content(user_id, status);
CREATE INDEX IF NOT EXISTS idx_channel_health_user ON channel_health(user_id);
CREATE INDEX IF NOT EXISTS idx_scored_leads_user ON scored_leads(user_id, composite_score DESC);
CREATE INDEX IF NOT EXISTS idx_scoring_rules_user ON scoring_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_scoring_models_user ON scoring_models(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_user ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_user ON agent_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_user ON agent_tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_attribution_models_user ON attribution_models(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_attributions_user ON channel_attributions(user_id, model_type);
CREATE INDEX IF NOT EXISTS idx_journey_paths_user ON journey_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_user ON opportunities(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trend_data_user ON trend_data(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_items_user ON feed_items(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_captured_contacts_user ON captured_contacts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_user ON qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_discovered_events_user ON discovered_events(user_id, status);
CREATE INDEX IF NOT EXISTS idx_campaign_triggers_user ON campaign_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_triggered_campaigns_user ON triggered_campaigns(user_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_profiles_user ON lead_profiles(user_id, intent_score DESC);
CREATE INDEX IF NOT EXISTS idx_intent_signals_user ON intent_signals(user_id);
CREATE INDEX IF NOT EXISTS idx_intent_signals_lead ON intent_signals(lead_id);
CREATE INDEX IF NOT EXISTS idx_revenue_predictions_user ON revenue_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_opportunities_user ON revenue_opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_ltv_user ON customer_ltv(user_id);
CREATE INDEX IF NOT EXISTS idx_strategic_plans_user ON strategic_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON recommendations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_autonomous_content_user ON autonomous_content(user_id, status);
CREATE INDEX IF NOT EXISTS idx_generated_content_user ON generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_voices_user ON brand_voices(user_id);
CREATE INDEX IF NOT EXISTS idx_content_templates_ai_user ON content_templates_ai(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_user ON automation_rules(user_id, status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_automation ON automation_logs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_templates_ai_user ON automation_templates_ai(user_id);
