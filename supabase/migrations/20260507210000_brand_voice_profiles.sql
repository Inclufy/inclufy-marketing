-- ════════════════════════════════════════════════════════════════════
-- Brand Voice Profiles + Wizard tracking
-- Enables AI-driven brand voice analysis from connected social accounts
-- ════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.brand_voice_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES public.social_accounts(id) ON DELETE CASCADE,

  -- Computed voice attributes
  tone TEXT,                          -- 'professional-warm' | 'casual' | 'authoritative' | 'playful' | etc.
  avg_post_length INT,                -- characters
  common_hashtags TEXT[] DEFAULT '{}',
  post_structure TEXT,                -- 'story-then-cta' | 'question-then-list' | 'data-then-takeaway' | etc.
  emoji_usage TEXT,                   -- 'none' | 'minimal' | 'moderate' | 'heavy'
  voice_descriptors TEXT[] DEFAULT '{}', -- ['mensgericht', 'data-gedreven', 'empathisch'] etc.
  primary_language TEXT,              -- 'nl' | 'en' | 'fr' | 'mixed'

  -- Sample-set metadata
  posts_analyzed INT DEFAULT 0,
  date_range_start TIMESTAMPTZ,
  date_range_end TIMESTAMPTZ,

  -- Raw AI output for re-analysis
  raw_analysis JSONB,

  -- Lifecycle
  status TEXT DEFAULT 'active',       -- 'active' | 'stale' | 'failed'
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One profile per (user, social_account) pair
  UNIQUE(user_id, social_account_id)
);

CREATE INDEX IF NOT EXISTS brand_voice_profiles_user_idx ON public.brand_voice_profiles(user_id);
CREATE INDEX IF NOT EXISTS brand_voice_profiles_account_idx ON public.brand_voice_profiles(social_account_id);

ALTER TABLE public.brand_voice_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_brand_voice_select" ON public.brand_voice_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_own_brand_voice_insert" ON public.brand_voice_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_brand_voice_update" ON public.brand_voice_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_brand_voice_delete" ON public.brand_voice_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════
-- Wizard tracking on qr_profiles
-- ════════════════════════════════════════════════════════════════════
ALTER TABLE public.qr_profiles
  ADD COLUMN IF NOT EXISTS wizard_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wizard_skipped_steps TEXT[] DEFAULT '{}';

-- ════════════════════════════════════════════════════════════════════
-- AI cache for static explanations (scope-explain, prerequisite-explain)
-- Avoids re-calling LLM for the same explanation across users
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.ai_explanation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,        -- e.g. 'scope-explain:facebook:pages_manage_posts:nl'
  explanation TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'nl',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '180 days')
);

CREATE INDEX IF NOT EXISTS ai_explanation_cache_key_idx ON public.ai_explanation_cache(cache_key);

-- Cache table is read-by-all (no PII), write only via service role
ALTER TABLE public.ai_explanation_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_explanation_read_all" ON public.ai_explanation_cache FOR SELECT USING (true);
