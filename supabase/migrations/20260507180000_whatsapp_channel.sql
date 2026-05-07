-- =============================================================================
-- Add 'whatsapp' as a valid channel value across constrained tables.
--
-- Build 213 (commit 401fdb6) extended the default LiveCapture channel set to
-- include 'whatsapp' so PostReview shows all 4 platform tabs. The TypeScript
-- Channel union has had 'whatsapp' for a while, but the DB CHECK constraints
-- were never updated → INSERT fails with `go_posts_channel_check`.
--
-- This migration is idempotent: it drops the existing constraint (if any) and
-- re-creates it with the expanded channel set.
-- =============================================================================

-- 1. go_posts.channel
ALTER TABLE public.go_posts
  DROP CONSTRAINT IF EXISTS go_posts_channel_check;

ALTER TABLE public.go_posts
  ADD CONSTRAINT go_posts_channel_check
  CHECK (channel IN ('linkedin', 'instagram', 'x', 'facebook', 'tiktok', 'whatsapp'));

-- 2. content_proposals.channel (same legacy 5-channel CHECK)
ALTER TABLE public.content_proposals
  DROP CONSTRAINT IF EXISTS content_proposals_channel_check;

ALTER TABLE public.content_proposals
  ADD CONSTRAINT content_proposals_channel_check
  CHECK (channel IN ('linkedin', 'instagram', 'x', 'facebook', 'tiktok', 'whatsapp'));

-- 3. automations.channel — already allows 'email' as 6th option, so we re-affirm
--    with the wider set including 'whatsapp'. Was: linkedin/instagram/x/facebook/tiktok/email.
ALTER TABLE public.automations
  DROP CONSTRAINT IF EXISTS automations_channel_check;

ALTER TABLE public.automations
  ADD CONSTRAINT automations_channel_check
  CHECK (channel IS NULL OR channel IN ('linkedin', 'instagram', 'x', 'facebook', 'tiktok', 'whatsapp', 'email'));
