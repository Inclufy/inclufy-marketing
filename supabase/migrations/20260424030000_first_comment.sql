-- First-comment auto-post support for AMOS
-- Adds two columns to go_posts:
--   first_comment         TEXT    — the comment text to post right after publishing
--   first_comment_posted_at TIMESTAMPTZ — set by publish-social once the comment succeeds

ALTER TABLE public.go_posts
  ADD COLUMN IF NOT EXISTS first_comment TEXT;

ALTER TABLE public.go_posts
  ADD COLUMN IF NOT EXISTS first_comment_posted_at TIMESTAMPTZ;
