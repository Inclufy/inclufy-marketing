-- Followed Event Organizers table
-- Users can follow organizers (like ROC, Innovaly, ICT Tribe, Startup Almere)
-- to automatically discover their events in Event Intelligence

CREATE TABLE IF NOT EXISTS public.followed_organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organizer_name TEXT NOT NULL,
  organizer_website TEXT,
  organizer_logo_url TEXT,
  category TEXT DEFAULT 'general', -- tech, marketing, startup, education, networking, etc.
  is_favorite BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, organizer_name)
);

-- Add scan_layer column to discovered_events for hierarchical filtering
ALTER TABLE public.discovered_events ADD COLUMN IF NOT EXISTS scan_layer TEXT;
ALTER TABLE public.discovered_events ADD COLUMN IF NOT EXISTS organizer_id UUID REFERENCES public.followed_organizers(id) ON DELETE SET NULL;

-- RLS for followed_organizers
ALTER TABLE public.followed_organizers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own followed organizers"
  ON public.followed_organizers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own followed organizers"
  ON public.followed_organizers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own followed organizers"
  ON public.followed_organizers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own followed organizers"
  ON public.followed_organizers FOR DELETE
  USING (auth.uid() = user_id);

-- Seed some popular organizers as suggestions
-- (These won't be auto-followed, just available as suggestions)
