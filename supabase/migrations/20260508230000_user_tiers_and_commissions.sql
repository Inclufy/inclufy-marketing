-- User tiers + ad commissions schema
--
-- Bridges marketing.inclufy.com Stripe billing with AMOS feature gates.
-- The marketing site's Stripe webhook handler updates profiles.tier on
-- checkout.session.completed / invoice.payment_failed / subscription.deleted.
-- AMOS code reads profiles.tier to gate Boost / multi-channel ads features.

BEGIN;

-- ─── profiles.tier + stripe linkage ───────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'pro', 'promote', 'ads', 'enterprise'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS tier_renewal_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS commission_pct NUMERIC(4,2) NOT NULL DEFAULT 0
    CHECK (commission_pct >= 0 AND commission_pct <= 100);

CREATE INDEX IF NOT EXISTS idx_profiles_tier ON public.profiles(tier);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer
  ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- ─── ad_commissions: daily commission rollup per campaign ────────────
-- Populated by ad-performance-monitor cron when commission_pct > 0.
-- Aggregated weekly/monthly for Stripe usage-based billing on marketing site.
CREATE TABLE IF NOT EXISTS public.ad_commissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id     UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  date            DATE NOT NULL,

  -- Source numbers for transparency
  spend_cents     INTEGER NOT NULL DEFAULT 0,
  commission_pct  NUMERIC(4,2) NOT NULL,
  commission_cents INTEGER NOT NULL DEFAULT 0,

  -- Billing state — set when invoiced via Stripe usage record
  billed          BOOLEAN NOT NULL DEFAULT false,
  billed_at       TIMESTAMPTZ,
  stripe_usage_record_id TEXT,

  raw_payload     JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (campaign_id, date)
);

CREATE INDEX IF NOT EXISTS idx_commissions_user_unbilled
  ON public.ad_commissions(user_id, billed, date)
  WHERE billed = false;

ALTER TABLE public.ad_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS commissions_owner_read ON public.ad_commissions;
CREATE POLICY commissions_owner_read ON public.ad_commissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS commissions_service_all ON public.ad_commissions;
CREATE POLICY commissions_service_all ON public.ad_commissions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ─── Tier feature flags helper view ──────────────────────────────────
-- Centralizes which tier unlocks which feature so client + server agree.
-- Updated whenever pricing changes — bump tier_features migration.
CREATE OR REPLACE VIEW public.tier_features AS
SELECT
  tier,
  -- Capture-to-Ad features
  (tier IN ('promote', 'ads', 'enterprise')) AS can_boost_meta,
  (tier IN ('ads', 'enterprise'))            AS can_boost_multi_channel,
  (tier IN ('enterprise'))                   AS can_white_label,
  -- Limits
  CASE tier
    WHEN 'free'       THEN 5
    WHEN 'pro'        THEN -1  -- unlimited
    WHEN 'promote'    THEN -1
    WHEN 'ads'        THEN -1
    WHEN 'enterprise' THEN -1
  END AS posts_per_month_limit,
  CASE tier
    WHEN 'free'       THEN 1
    WHEN 'pro'        THEN 6
    WHEN 'promote'    THEN 6
    WHEN 'ads'        THEN 8
    WHEN 'enterprise' THEN 8
  END AS platforms_count,
  CASE tier
    WHEN 'free'       THEN 0
    WHEN 'pro'        THEN 0
    WHEN 'promote'    THEN 1
    WHEN 'ads'        THEN 5
    WHEN 'enterprise' THEN -1  -- unlimited
  END AS boosts_included_per_month
FROM (VALUES ('free'), ('pro'), ('promote'), ('ads'), ('enterprise')) AS t(tier);

-- ─── Bootstrap: set Sami's account to enterprise tier ─────────────────
-- So the developer can test all features end-to-end without buying via Stripe.
-- Use email match because user_id varies per environment.
UPDATE public.profiles
SET tier = 'enterprise', commission_pct = 0
WHERE email IN ('sami@inclufy.com', 'sami.loukile@inclufy.com', 's.loukile@eprocure.com')
  AND tier = 'free';

COMMIT;
