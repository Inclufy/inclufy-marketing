-- Migration: WhatsApp CTA toggle for posts
-- Adds columns to go_posts for WhatsApp CTA configuration
-- Also adds default WhatsApp settings to go_organization

-- ── go_posts: WhatsApp CTA columns ──────────────────────────────
ALTER TABLE public.go_posts
  ADD COLUMN IF NOT EXISTS whatsapp_cta_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.go_posts
  ADD COLUMN IF NOT EXISTS whatsapp_cta_phone TEXT;      -- E164 format: +31612345678

ALTER TABLE public.go_posts
  ADD COLUMN IF NOT EXISTS whatsapp_cta_message TEXT;    -- default prefill, e.g. "Hi, ik zag je post"

-- ── go_organization: Default WhatsApp CTA settings ──────────────
ALTER TABLE public.go_organization
  ADD COLUMN IF NOT EXISTS default_whatsapp_cta_phone TEXT;     -- E164 format for user-level default

ALTER TABLE public.go_organization
  ADD COLUMN IF NOT EXISTS default_whatsapp_cta_message TEXT;   -- user-level default message
