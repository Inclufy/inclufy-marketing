-- Create scheduled_posts table
CREATE TABLE public.scheduled_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  image_base64 TEXT NOT NULL,
  caption TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for efficient querying of pending posts
CREATE INDEX idx_scheduled_posts_pending ON public.scheduled_posts (scheduled_at) WHERE status = 'pending';

-- Enable RLS but allow public access for this demo (no auth)
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (can be restricted later with auth)
CREATE POLICY "Allow all operations on scheduled_posts" 
ON public.scheduled_posts 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Enable pg_cron and pg_net extensions for scheduled execution
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;