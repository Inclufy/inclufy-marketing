-- Allow captures and posts without an event (for product, inspiration, behind_scenes captures)
ALTER TABLE public.go_captures ALTER COLUMN event_id DROP NOT NULL;
ALTER TABLE public.go_posts ALTER COLUMN event_id DROP NOT NULL;
