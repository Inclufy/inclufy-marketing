-- Social Media OAuth Integration: social_accounts and oauth_tokens tables
-- Fully idempotent: safe to run multiple times

-- ===================================================================
-- Table 1: social_accounts -- Connected social media accounts
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_account_id TEXT NOT NULL,
  account_name TEXT,
  profile_image_url TEXT,
  status TEXT DEFAULT 'active',
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, platform, platform_account_id)
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_org
  ON social_accounts(organization_id);

CREATE INDEX IF NOT EXISTS idx_social_accounts_user
  ON social_accounts(user_id);

-- RLS
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read social accounts in their org" ON social_accounts;
CREATE POLICY "Users can read social accounts in their org"
  ON social_accounts FOR SELECT
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert social accounts in their org" ON social_accounts;
CREATE POLICY "Users can insert social accounts in their org"
  ON social_accounts FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update social accounts in their org" ON social_accounts;
CREATE POLICY "Users can update social accounts in their org"
  ON social_accounts FOR UPDATE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete social accounts in their org" ON social_accounts;
CREATE POLICY "Users can delete social accounts in their org"
  ON social_accounts FOR DELETE
  USING (
    organization_id IN (
      SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS update_social_accounts_updated_at ON social_accounts;
CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ===================================================================
-- Table 2: oauth_tokens -- Encrypted OAuth tokens for social accounts
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  token_type TEXT DEFAULT 'Bearer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(social_account_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_tokens_social_account
  ON oauth_tokens(social_account_id);

-- RLS
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read oauth tokens for their org accounts" ON oauth_tokens;
CREATE POLICY "Users can read oauth tokens for their org accounts"
  ON oauth_tokens FOR SELECT
  USING (
    social_account_id IN (
      SELECT sa.id FROM social_accounts sa
      WHERE sa.organization_id IN (
        SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert oauth tokens for their org accounts" ON oauth_tokens;
CREATE POLICY "Users can insert oauth tokens for their org accounts"
  ON oauth_tokens FOR INSERT
  WITH CHECK (
    social_account_id IN (
      SELECT sa.id FROM social_accounts sa
      WHERE sa.organization_id IN (
        SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can update oauth tokens for their org accounts" ON oauth_tokens;
CREATE POLICY "Users can update oauth tokens for their org accounts"
  ON oauth_tokens FOR UPDATE
  USING (
    social_account_id IN (
      SELECT sa.id FROM social_accounts sa
      WHERE sa.organization_id IN (
        SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    social_account_id IN (
      SELECT sa.id FROM social_accounts sa
      WHERE sa.organization_id IN (
        SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete oauth tokens for their org accounts" ON oauth_tokens;
CREATE POLICY "Users can delete oauth tokens for their org accounts"
  ON oauth_tokens FOR DELETE
  USING (
    social_account_id IN (
      SELECT sa.id FROM social_accounts sa
      WHERE sa.organization_id IN (
        SELECT om.organization_id FROM organization_members om WHERE om.user_id = auth.uid()
      )
    )
  );

DROP TRIGGER IF EXISTS update_oauth_tokens_updated_at ON oauth_tokens;
CREATE TRIGGER update_oauth_tokens_updated_at
  BEFORE UPDATE ON oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
