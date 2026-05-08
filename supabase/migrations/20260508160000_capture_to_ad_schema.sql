-- Capture-to-Ad schema — Phase 1 foundation
--
-- Implements roadmap §4.3 "Boost this post" data model. Splits the ad
-- workflow into 3 tables so each lifecycle stage is queryable + RLS-safe:
--
--   ad_campaigns       — top-level: links organic post → ad campaign
--   campaign_creatives — AI-generated variants (1-N per campaign)
--   campaign_metrics   — daily performance rollups per channel
--
-- Note: this migration creates the schema only. Wiring to Meta Marketing
-- API / TikTok Marketing API / etc. comes in separate edge functions
-- (boost-post, ad-performance-monitor) so we can ship UI + AI variants
-- before external API approvals are granted.

BEGIN;

-- ─── ad_campaigns ────────────────────────────────────────────────────
-- Each row = one boost attempt of one organic post on one channel.
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID,
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source: organic post that triggered this boost
  source_post_id    UUID REFERENCES public.go_posts(id) ON DELETE SET NULL,
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE SET NULL,

  -- Channel (where the ad runs)
  channel           TEXT NOT NULL CHECK (channel IN (
    'meta',         -- Facebook + Instagram via Meta Marketing API
    'tiktok',       -- TikTok Marketing API
    'linkedin',     -- LinkedIn Sponsored Content (LMDP)
    'pinterest',    -- Pinterest Ads (promoted pins)
    'snapchat',     -- Snapchat Marketing API
    'google'        -- Google Ads (search/display)
  )),

  -- Lifecycle status
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',                -- user prepared via wizard
    'pending_creative',     -- waiting for AI variants
    'pending_approval',     -- pushed to platform, in review
    'active',               -- live + serving impressions
    'paused',               -- user paused
    'completed',            -- duration ended
    'rejected',             -- platform rejected
    'failed'                -- API error
  )),

  -- Budget
  budget_cents      INTEGER NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'EUR',
  duration_days     INTEGER NOT NULL DEFAULT 3 CHECK (duration_days BETWEEN 1 AND 90),
  daily_budget_cents INTEGER GENERATED ALWAYS AS (budget_cents / GREATEST(duration_days, 1)) STORED,

  -- Audience config (lookalike, demographics, interests)
  audience_config   JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Examples:
  --   { "type": "lookalike", "source": "page_followers", "country": "NL", "size": "1%" }
  --   { "type": "interest", "interests": ["sustainability", "ESG"], "age": [25, 55] }

  -- Objective (Meta uses these terms; map to other platforms internally)
  objective         TEXT NOT NULL DEFAULT 'POST_ENGAGEMENT' CHECK (objective IN (
    'POST_ENGAGEMENT', 'REACH', 'TRAFFIC', 'VIDEO_VIEWS', 'LEAD_GENERATION', 'CONVERSIONS'
  )),

  -- External IDs (filled after platform-API push)
  external_campaign_id TEXT,
  external_ad_set_id   TEXT,
  external_ad_id       TEXT,
  external_metadata    JSONB DEFAULT '{}'::jsonb,

  -- Performance summary (denormalized from metrics for quick lists)
  total_impressions BIGINT NOT NULL DEFAULT 0,
  total_clicks      INTEGER NOT NULL DEFAULT 0,
  total_spent_cents INTEGER NOT NULL DEFAULT 0,
  total_conversions INTEGER NOT NULL DEFAULT 0,

  -- Lifecycle timestamps
  approved_at       TIMESTAMPTZ,
  started_at        TIMESTAMPTZ,
  ended_at          TIMESTAMPTZ,

  -- Audit
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_campaigns_user ON public.ad_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_org ON public.ad_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_post ON public.ad_campaigns(source_post_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_channel_status ON public.ad_campaigns(channel, status);

-- ─── campaign_creatives ──────────────────────────────────────────────
-- AI-generated variants per campaign. Multiple variants = A/B test.
CREATE TABLE IF NOT EXISTS public.campaign_creatives (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Variant content
  variant_label   TEXT NOT NULL,                          -- 'A', 'B', 'C', ...
  headline        TEXT,                                    -- short hook (Meta: 40 chars)
  primary_text    TEXT NOT NULL,                           -- main copy
  description     TEXT,                                    -- subline (Meta: 30 chars)
  call_to_action  TEXT DEFAULT 'LEARN_MORE' CHECK (call_to_action IN (
    'LEARN_MORE', 'SHOP_NOW', 'BOOK_NOW', 'SIGN_UP', 'GET_QUOTE', 'CONTACT_US',
    'DOWNLOAD', 'SUBSCRIBE', 'WATCH_MORE', 'LISTEN_NOW', 'INSTALL_APP'
  )),

  -- Media (one of)
  image_url       TEXT,
  video_url       TEXT,
  carousel_items  JSONB,                                   -- [{ image, headline, link }]

  -- Targeting hints from AI
  ai_rationale    TEXT,                                    -- why AI generated this variant
  ai_target_emotion TEXT,                                  -- 'urgency', 'aspiration', 'social_proof'

  -- A/B performance
  is_winner       BOOLEAN DEFAULT false,
  impressions     BIGINT NOT NULL DEFAULT 0,
  clicks          INTEGER NOT NULL DEFAULT 0,
  spent_cents     INTEGER NOT NULL DEFAULT 0,

  -- External ID after platform-push
  external_creative_id TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creatives_campaign ON public.campaign_creatives(campaign_id);

-- ─── campaign_metrics ───────────────────────────────────────────────
-- Daily snapshot per campaign per channel. Populated by ad-performance-monitor cron.
CREATE TABLE IF NOT EXISTS public.campaign_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  date            DATE NOT NULL,

  impressions     BIGINT NOT NULL DEFAULT 0,
  reach           BIGINT NOT NULL DEFAULT 0,
  clicks          INTEGER NOT NULL DEFAULT 0,
  spent_cents     INTEGER NOT NULL DEFAULT 0,
  ctr             NUMERIC(6,4) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN clicks::numeric / impressions ELSE 0 END
  ) STORED,
  cpc_cents       INTEGER GENERATED ALWAYS AS (
    CASE WHEN clicks > 0 THEN spent_cents / clicks ELSE 0 END
  ) STORED,
  cpm_cents       INTEGER GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN (spent_cents * 1000) / impressions ELSE 0 END
  ) STORED,

  conversions     INTEGER NOT NULL DEFAULT 0,
  conversion_value_cents INTEGER NOT NULL DEFAULT 0,

  raw_payload     JSONB,                                   -- raw response from platform API

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, date)
);

CREATE INDEX IF NOT EXISTS idx_metrics_campaign_date ON public.campaign_metrics(campaign_id, date DESC);

-- ─── RLS policies ─────────────────────────────────────────────────────
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ad_campaigns_owner ON public.ad_campaigns;
CREATE POLICY ad_campaigns_owner ON public.ad_campaigns
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS campaign_creatives_via_campaign ON public.campaign_creatives;
CREATE POLICY campaign_creatives_via_campaign ON public.campaign_creatives
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ad_campaigns c
            WHERE c.id = campaign_id AND c.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.ad_campaigns c
            WHERE c.id = campaign_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS campaign_metrics_via_campaign ON public.campaign_metrics;
CREATE POLICY campaign_metrics_via_campaign ON public.campaign_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ad_campaigns c
            WHERE c.id = campaign_id AND c.user_id = auth.uid())
  );

-- Service role can write metrics (cron job)
DROP POLICY IF EXISTS campaign_metrics_service_write ON public.campaign_metrics;
CREATE POLICY campaign_metrics_service_write ON public.campaign_metrics
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ─── Updated-at triggers ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ad_campaigns_updated ON public.ad_campaigns;
CREATE TRIGGER trg_ad_campaigns_updated BEFORE UPDATE ON public.ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();

DROP TRIGGER IF EXISTS trg_campaign_creatives_updated ON public.campaign_creatives;
CREATE TRIGGER trg_campaign_creatives_updated BEFORE UPDATE ON public.campaign_creatives
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_column();

COMMIT;
