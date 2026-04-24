-- WhatsApp Business Cloud API infrastructure
-- Tables: whatsapp_config, whatsapp_templates, whatsapp_recipients, whatsapp_sends
-- RLS: each user only sees their own rows
-- Safe to re-run: all DDL uses IF NOT EXISTS / DO $$ guards

-- ══════════════════════════════════════════════════════════════════
-- 1. whatsapp_config — WABA credentials per user
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  waba_id             TEXT        NOT NULL,                    -- Meta WABA ID
  phone_number_id     TEXT        NOT NULL,                    -- Meta phone_number_id for sending
  display_phone_number TEXT,                                   -- +31 6 1234 5678 (for display)
  business_name       TEXT,
  access_token        TEXT        NOT NULL,                    -- WABA permanent access token (encrypted later)
  status              TEXT        NOT NULL DEFAULT 'active',   -- 'active' | 'expired' | 'disabled'
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, phone_number_id)
);

-- ══════════════════════════════════════════════════════════════════
-- 2. whatsapp_templates — pre-approved Meta message templates
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  waba_config_id   UUID        NOT NULL REFERENCES public.whatsapp_config(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,            -- template name as approved by Meta
  language         TEXT        NOT NULL DEFAULT 'nl',
  category         TEXT        NOT NULL,            -- MARKETING | UTILITY | AUTHENTICATION
  status           TEXT        NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  body_text        TEXT,                            -- the template body with {{1}}, {{2}} vars
  header_type      TEXT,                            -- NONE | TEXT | IMAGE | VIDEO | DOCUMENT
  components       JSONB,                           -- full Meta template JSON for reference
  meta_template_id TEXT,                            -- Meta's template ID after approval
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(waba_config_id, name, language)
);

-- ══════════════════════════════════════════════════════════════════
-- 3. whatsapp_recipients — opted-in phone numbers
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.whatsapp_recipients (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  waba_config_id UUID        NOT NULL REFERENCES public.whatsapp_config(id) ON DELETE CASCADE,
  phone_e164     TEXT        NOT NULL,       -- +31612345678
  display_name   TEXT,
  opt_in_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  opt_out_at     TIMESTAMPTZ,
  source         TEXT,                       -- website_form | csv_import | manual
  tags           TEXT[],
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, phone_e164)
);

-- ══════════════════════════════════════════════════════════════════
-- 4. whatsapp_sends — audit log + delivery tracking
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.whatsapp_sends (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id          UUID        REFERENCES public.go_posts(id) ON DELETE SET NULL,
  recipient_id     UUID        REFERENCES public.whatsapp_recipients(id) ON DELETE SET NULL,
  template_id      UUID        REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
  phone_e164       TEXT        NOT NULL,
  meta_message_id  TEXT,                     -- wamid.XXXX returned by Meta
  status           TEXT        NOT NULL,     -- sent | delivered | read | failed
  error            TEXT,
  cost_usd         NUMERIC(10,5),            -- tracked per Meta pricing
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════
-- 5. Row-Level Security
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.whatsapp_config     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sends      ENABLE ROW LEVEL SECURITY;

-- whatsapp_config
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_config' AND policyname = 'wa_config_own'
  ) THEN
    CREATE POLICY wa_config_own ON public.whatsapp_config
      FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- whatsapp_templates — owned via waba_config_id → user_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_templates' AND policyname = 'wa_templates_own'
  ) THEN
    CREATE POLICY wa_templates_own ON public.whatsapp_templates
      FOR ALL TO authenticated
      USING (
        waba_config_id IN (
          SELECT id FROM public.whatsapp_config WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        waba_config_id IN (
          SELECT id FROM public.whatsapp_config WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- whatsapp_recipients
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_recipients' AND policyname = 'wa_recipients_own'
  ) THEN
    CREATE POLICY wa_recipients_own ON public.whatsapp_recipients
      FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- whatsapp_sends
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'whatsapp_sends' AND policyname = 'wa_sends_own'
  ) THEN
    CREATE POLICY wa_sends_own ON public.whatsapp_sends
      FOR ALL TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════
-- 6. Indexes
-- ══════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_waba_config_user      ON public.whatsapp_config(user_id);
CREATE INDEX IF NOT EXISTS idx_waba_templates_config ON public.whatsapp_templates(waba_config_id);
CREATE INDEX IF NOT EXISTS idx_waba_recipients_user  ON public.whatsapp_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_waba_sends_post       ON public.whatsapp_sends(post_id);
CREATE INDEX IF NOT EXISTS idx_waba_sends_message_id ON public.whatsapp_sends(meta_message_id);
