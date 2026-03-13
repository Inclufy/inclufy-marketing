-- Migration: Create 5 missing admin tables
-- Tables: admin_settings, subscriptions, demo_requests, trainings, invoices

-- ═══════════════════════════════════════════════════════════
-- 1. admin_settings — single-row platform settings (JSONB cols)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  general JSONB DEFAULT '{
    "site_name": "Inclufy Marketing",
    "default_language": "nl",
    "max_upload_size_mb": 10,
    "support_email": "support@inclufy.com",
    "maintenance_mode": false
  }'::jsonb,
  security JSONB DEFAULT '{
    "require_2fa": false,
    "session_timeout_minutes": 60,
    "max_login_attempts": 5,
    "password_min_length": 8,
    "allowed_domains": ""
  }'::jsonb,
  email JSONB DEFAULT '{
    "smtp_host": "",
    "smtp_port": "587",
    "smtp_from": "noreply@inclufy.com",
    "email_provider": "resend"
  }'::jsonb,
  features JSONB DEFAULT '{
    "ai_copilot_enabled": true,
    "trial_days": 14,
    "max_campaigns_free": 3,
    "max_contacts_free": 500,
    "allow_registrations": true,
    "demo_mode": false
  }'::jsonb,
  billing JSONB DEFAULT '{
    "currency": "EUR",
    "tax_rate": 21,
    "stripe_configured": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "admin_settings_select" ON public.admin_settings
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update (admin check in app layer)
CREATE POLICY "admin_settings_insert" ON public.admin_settings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "admin_settings_update" ON public.admin_settings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Insert default row
INSERT INTO public.admin_settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 2. subscriptions — organization subscription plans
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  amount NUMERIC(10,2) DEFAULT 0,
  interval TEXT DEFAULT 'month',
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select" ON public.subscriptions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "subscriptions_insert" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "subscriptions_update" ON public.subscriptions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 3. demo_requests — inbound demo requests from prospects
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.demo_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT,
  company TEXT,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "demo_requests_select" ON public.demo_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "demo_requests_insert" ON public.demo_requests
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "demo_requests_update" ON public.demo_requests
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Also allow anonymous inserts (public demo request form)
CREATE POLICY "demo_requests_anon_insert" ON public.demo_requests
  FOR INSERT TO anon WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- 4. trainings — training sessions & webinars
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.trainings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'workshop',
  status TEXT DEFAULT 'scheduled',
  participants INTEGER DEFAULT 0,
  max_participants INTEGER DEFAULT 50,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  instructor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trainings_select" ON public.trainings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "trainings_insert" ON public.trainings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "trainings_update" ON public.trainings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "trainings_delete" ON public.trainings
  FOR DELETE TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════════
-- 5. invoices — billing invoices
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  line_items JSONB DEFAULT '[]'::jsonb,
  stripe_invoice_id TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "invoices_insert" ON public.invoices
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "invoices_update" ON public.invoices
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- Auto-update updated_at triggers
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['admin_settings', 'subscriptions', 'demo_requests', 'trainings', 'invoices']
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_update_%s ON public.%I; CREATE TRIGGER trg_update_%s BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END;
$$;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
