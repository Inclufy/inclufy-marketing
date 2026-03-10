-- ============================================================
-- Inclufy GO: Event Studio Tables
-- Prefixed with go_ to avoid conflict with CRM events table
-- ============================================================

-- 1. GO Events - Marketing event profiles for the Inclufy GO app
CREATE TABLE IF NOT EXISTS public.go_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event details
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  event_date DATE NOT NULL,
  event_start_time TIME,
  event_end_time TIME,

  -- Marketing configuration
  channels TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  default_tags TEXT[] DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',

  -- Brand linkage
  brand_kit_id UUID REFERENCES public.brand_kits(id) ON DELETE SET NULL,

  -- Status
  status TEXT DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'active', 'completed', 'archived')),

  -- Metadata
  cover_image_url TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GO Captures - Photos/video/audio captured at events
CREATE TABLE IF NOT EXISTS public.go_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.go_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Media
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video', 'audio', 'quote')),
  media_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  thumbnail_url TEXT,

  -- Context
  tags TEXT[] DEFAULT '{}',
  note TEXT DEFAULT '',

  -- AI processing
  ai_status TEXT DEFAULT 'pending'
    CHECK (ai_status IN ('pending', 'processing', 'completed', 'error')),
  ai_description TEXT,

  -- Audio/video specific
  duration_seconds INTEGER,
  transcript TEXT,

  -- Timestamps
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GO Posts - Generated posts per channel per capture
CREATE TABLE IF NOT EXISTS public.go_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capture_id UUID NOT NULL REFERENCES public.go_captures(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.go_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Channel
  channel TEXT NOT NULL CHECK (channel IN ('linkedin', 'instagram', 'x', 'facebook')),

  -- Content
  text_content TEXT NOT NULL DEFAULT '',
  hashtags TEXT[] DEFAULT '{}',

  -- Branded image
  branded_image_url TEXT,
  image_format TEXT DEFAULT 'square'
    CHECK (image_format IN ('square', 'story', 'landscape')),

  -- Publishing
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'failed', 'in_review')),
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  publish_error TEXT,
  external_post_id TEXT,

  -- Engagement
  engagement JSONB DEFAULT '{"likes":0,"comments":0,"shares":0}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_go_events_user_status ON public.go_events(user_id, status);
CREATE INDEX IF NOT EXISTS idx_go_captures_event ON public.go_captures(event_id, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_go_posts_event ON public.go_posts(event_id, channel, status);
CREATE INDEX IF NOT EXISTS idx_go_posts_capture ON public.go_posts(capture_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.go_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.go_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.go_posts ENABLE ROW LEVEL SECURITY;

-- GO Events: users can only access their own events
CREATE POLICY go_events_select ON public.go_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY go_events_insert ON public.go_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY go_events_update ON public.go_events FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY go_events_delete ON public.go_events FOR DELETE USING (auth.uid() = user_id);

-- GO Captures: users can only access their own captures
CREATE POLICY go_captures_select ON public.go_captures FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY go_captures_insert ON public.go_captures FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY go_captures_update ON public.go_captures FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY go_captures_delete ON public.go_captures FOR DELETE USING (auth.uid() = user_id);

-- GO Posts: users can only access their own posts
CREATE POLICY go_posts_select ON public.go_posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY go_posts_insert ON public.go_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY go_posts_update ON public.go_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY go_posts_delete ON public.go_posts FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Updated_at trigger (reuse if exists, create if not)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER go_events_updated_at
  BEFORE UPDATE ON public.go_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER go_posts_updated_at
  BEFORE UPDATE ON public.go_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Storage bucket for media uploads
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;
