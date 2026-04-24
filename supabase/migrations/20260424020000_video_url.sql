-- Migration: add video_url and media_type to go_posts
-- Enables video publishing to LinkedIn and Facebook from AMOS.
-- media_type values: 'photo' | 'video' | 'audio'
-- When media_type = 'video', video_url holds the Supabase Storage public URL of the video.
-- branded_image_url continues to hold the image URL for photo posts (unchanged behavior).

ALTER TABLE public.go_posts
  ADD COLUMN IF NOT EXISTS video_url TEXT;

ALTER TABLE public.go_posts
  ADD COLUMN IF NOT EXISTS media_type TEXT;
