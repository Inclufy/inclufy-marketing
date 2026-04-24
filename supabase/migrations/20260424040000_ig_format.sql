-- Migration: add ig_format to go_posts
-- Which IG format to publish as: 'feed' (default), 'story', or 'reel'
ALTER TABLE public.go_posts
  ADD COLUMN IF NOT EXISTS ig_format TEXT DEFAULT 'feed';
