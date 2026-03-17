-- Fix RLS policies for tables that are missing them
-- This fixes: profiles, followed_organizers, and other user-facing tables

-- ═══════════════════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- FOLLOWED_ORGANIZERS
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS followed_organizers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "followed_organizers_select_own" ON followed_organizers FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "followed_organizers_insert_own" ON followed_organizers FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "followed_organizers_update_own" ON followed_organizers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "followed_organizers_delete_own" ON followed_organizers FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- SOCIAL_ACCOUNTS
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS social_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "social_accounts_select_own" ON social_accounts FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "social_accounts_insert_own" ON social_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "social_accounts_update_own" ON social_accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "social_accounts_delete_own" ON social_accounts FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- CAMPAIGN_COSTS
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS campaign_costs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "campaign_costs_select_own" ON campaign_costs FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "campaign_costs_insert_own" ON campaign_costs FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "campaign_costs_delete_own" ON campaign_costs FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ═══════════════════════════════════════════════════════════════════════
-- CAMPAIGN_REVENUE
-- ═══════════════════════════════════════════════════════════════════════
ALTER TABLE IF EXISTS campaign_revenue ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "campaign_revenue_select_own" ON campaign_revenue FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "campaign_revenue_insert_own" ON campaign_revenue FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "campaign_revenue_delete_own" ON campaign_revenue FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
