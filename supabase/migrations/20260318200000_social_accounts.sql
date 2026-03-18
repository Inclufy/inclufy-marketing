-- Social Accounts & OAuth Tokens
-- Required for social media platform connections (LinkedIn, Instagram, Facebook, TikTok)

-- ═══════════════════════════════════════════════════════
-- 1. Social Accounts (connected platforms)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Platform info
  platform TEXT NOT NULL,                    -- linkedin, facebook, instagram, tiktok, x
  platform_account_id TEXT NOT NULL,
  account_name TEXT,
  profile_image_url TEXT,
  account_type TEXT DEFAULT 'personal',      -- personal, page, business, manual
  status TEXT DEFAULT 'active',              -- active, inactive, expired

  -- Optional org link
  organization_id UUID,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, platform, platform_account_id)
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own social accounts" ON public.social_accounts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════
-- 2. OAuth Tokens (encrypted token storage)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  social_account_id UUID NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Tokens are only accessible via edge functions (service role), not directly by users
-- But we add a read policy so users can check token existence
CREATE POLICY "Users read own tokens" ON public.oauth_tokens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.social_accounts sa
      WHERE sa.id = social_account_id AND sa.user_id = auth.uid()
    )
  );

-- Service role has full access by default (bypasses RLS)

-- Indexes
CREATE INDEX idx_social_accounts_user ON public.social_accounts(user_id);
CREATE INDEX idx_social_accounts_platform ON public.social_accounts(user_id, platform);
CREATE INDEX idx_oauth_tokens_account ON public.oauth_tokens(social_account_id);
