-- =============================================================================
-- Security Fixes Migration - Inclufy Marketing
-- Fixes: RLS disabled, Security Definer views, search_path, permissive policies
-- =============================================================================

-- =============================================
-- 1. ERRORS: Enable RLS on all unprotected tables
-- =============================================

ALTER TABLE IF EXISTS public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.autonomous_content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.autonomous_learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.autonomous_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.founder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.journey_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.revenue_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_ecosystem ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.market_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.regulatory_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blueprint_vision ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.buyer_journey_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.geographic_markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.localization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.market_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.economic_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quantum_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reality_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.consciousness_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.memetic_viruses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.industry_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.timeline_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.extraction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blueprint_budget_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blueprint_endgame ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ad_setups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.auto_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.test_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blueprint_status_quo ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.growth_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blueprint_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blueprint_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blueprint_threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.blueprint_activity_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. ERRORS: Fix Security Definer View
-- =============================================

DROP VIEW IF EXISTS public.blueprint_import_status;
CREATE VIEW public.blueprint_import_status AS
SELECT
  gb.id,
  gb.company_name,
  gb.status,
  gb.created_at,
  gb.updated_at
FROM public.growth_blueprints gb;

-- =============================================
-- 3. RLS policies for users table
-- =============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_select_own') THEN
    CREATE POLICY users_select_own ON public.users FOR SELECT TO authenticated USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_update_own') THEN
    CREATE POLICY users_update_own ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Organization members
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_members' AND policyname = 'org_members_select_auth') THEN
    -- NOTE: Restricting to user_id = auth.uid() (users only see their own membership rows).
    -- A broader "all members of same org" subquery would cause RLS recursion on this table.
    CREATE POLICY org_members_select_auth ON public.organization_members FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- User organizations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_organizations' AND policyname = 'user_orgs_select_own') THEN
    CREATE POLICY user_orgs_select_own ON public.user_organizations FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
END $$;

-- API keys - authenticated can read their own org's keys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'api_keys_select_auth') THEN
    CREATE POLICY api_keys_select_auth ON public.api_keys FOR SELECT TO authenticated USING (
      organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- =============================================
-- 4. Authenticated read policies for all newly RLS-enabled tables
-- =============================================

DO $$
DECLARE
  tbl_name text;
  policy_name text;
BEGIN
  FOR tbl_name IN SELECT unnest(ARRAY[
    'company_profiles', 'founder_profiles', 'industries', 'market_segments',
    'regulatory_requirements', 'geographic_markets', 'localization_rules',
    'market_trends', 'economic_indicators', 'industry_benchmarks',
    'product_ecosystem', 'roadmap_items', 'buyer_journey_stages',
    'ai_models', 'templates', 'billing_subscriptions', 'journey_enrollments',
    'events', 'revenue_events', 'ai_conversations', 'ad_setups',
    'auto_campaigns', 'extraction_logs', 'growth_blueprints',
    'blueprint_recommendations', 'blueprint_opportunities', 'blueprint_threats',
    'blueprint_activity_log', 'blueprint_vision', 'blueprint_budget_capacity',
    'blueprint_endgame', 'blueprint_status_quo',
    'autonomous_content_metrics', 'autonomous_learnings',
    'system_health_metrics', 'autonomous_audit_log'
  ])
  LOOP
    policy_name := tbl_name || '_select_auth';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl_name AND policyname = policy_name) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
        policy_name, tbl_name
      );
    END IF;
  END LOOP;
END $$;

-- Deny-all policies for test/experimental tables
DO $$
DECLARE
  tbl_name text;
  policy_name text;
BEGIN
  FOR tbl_name IN SELECT unnest(ARRAY[
    'test_table', 'quantum_states', 'reality_modifications',
    'consciousness_states', 'memetic_viruses', 'timeline_branches'
  ])
  LOOP
    policy_name := tbl_name || '_deny_all';
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = tbl_name AND policyname = policy_name) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (false)',
        policy_name, tbl_name
      );
    END IF;
  END LOOP;
END $$;

-- =============================================
-- 5. WARNINGS: Fix function search_path
-- =============================================

DO $$
DECLARE
  func_name text;
BEGIN
  FOR func_name IN SELECT unnest(ARRAY[
    'set_updated_at', 'auto_import_blueprint', 'update_updated_at_column',
    'calculate_risk_score', 'migrate_existing_blueprints', 'update_strategy_fitness',
    'calculate_context_completeness', 'check_system_health',
    'create_default_autonomy_settings', 'handle_new_user',
    'user_can_access_blueprint', 'calculate_blueprint_progress',
    'get_blueprint_summary', 'update_updated_at', 'get_opportunity_stats',
    'get_threat_stats', 'calculate_campaign_rates',
    'update_generated_content_updated_at', 'create_default_agents',
    'update_workflow_updated_at', 'create_content_version',
    'update_journey_updated_at', 'get_public_url', 'reset_daily_counters'
  ])
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%I() SET search_path = public', func_name);
    EXCEPTION WHEN undefined_function THEN
      -- Function may have parameters, try without parens specification
      NULL;
    END;
  END LOOP;
END $$;

-- =============================================
-- 6. WARNINGS: Tighten overly permissive RLS policies
-- =============================================

-- admin_settings: restrict to users with admin role
DROP POLICY IF EXISTS admin_settings_insert ON public.admin_settings;
DROP POLICY IF EXISTS admin_settings_update ON public.admin_settings;

CREATE POLICY admin_settings_insert ON public.admin_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY admin_settings_update ON public.admin_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- demo_requests: keep anon insert (public form), tighten update to admins
DROP POLICY IF EXISTS demo_requests_update ON public.demo_requests;
CREATE POLICY demo_requests_update ON public.demo_requests
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- invoices: restrict to org members
DROP POLICY IF EXISTS invoices_insert ON public.invoices;
DROP POLICY IF EXISTS invoices_update ON public.invoices;

CREATE POLICY invoices_insert ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = invoices.organization_id
    )
  );

CREATE POLICY invoices_update ON public.invoices
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = invoices.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = invoices.organization_id
    )
  );

-- subscriptions: restrict to org members
DROP POLICY IF EXISTS subscriptions_insert ON public.subscriptions;
DROP POLICY IF EXISTS subscriptions_update ON public.subscriptions;

CREATE POLICY subscriptions_insert ON public.subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = subscriptions.organization_id
    )
  );

CREATE POLICY subscriptions_update ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = subscriptions.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = subscriptions.organization_id
    )
  );

-- trainings: restrict insert/update to authenticated, delete to admins
DROP POLICY IF EXISTS trainings_delete ON public.trainings;
DROP POLICY IF EXISTS trainings_insert ON public.trainings;
DROP POLICY IF EXISTS trainings_update ON public.trainings;

CREATE POLICY trainings_insert ON public.trainings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY trainings_update ON public.trainings
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY trainings_delete ON public.trainings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );
