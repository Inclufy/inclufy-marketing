-- ─── Event Attendees / Registration table ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.go_event_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.go_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Registrant info (may not be a user)
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  job_title TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'registered'
    CHECK (status IN ('registered', 'confirmed', 'attended', 'cancelled', 'no_show')),
  ticket_type TEXT NOT NULL DEFAULT 'general'
    CHECK (ticket_type IN ('general', 'vip', 'speaker', 'sponsor', 'staff', 'press')),
  -- Source of registration
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'qr_scan', 'form', 'import', 'invitation')),
  -- Timestamps
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  attended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_go_event_attendees_event
  ON public.go_event_attendees (event_id, status);
CREATE INDEX IF NOT EXISTS idx_go_event_attendees_email
  ON public.go_event_attendees (event_id, email);

-- Unique constraint: one registration per email per event
CREATE UNIQUE INDEX IF NOT EXISTS idx_go_event_attendees_unique_email
  ON public.go_event_attendees (event_id, email) WHERE email != '';

-- RLS
ALTER TABLE public.go_event_attendees ENABLE ROW LEVEL SECURITY;

-- Event owner can manage attendees (via go_events.user_id)
CREATE POLICY "Event owner can view attendees"
  ON public.go_event_attendees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.go_events e
      WHERE e.id = go_event_attendees.event_id
      AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Event owner can insert attendees"
  ON public.go_event_attendees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.go_events e
      WHERE e.id = go_event_attendees.event_id
      AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Event owner can update attendees"
  ON public.go_event_attendees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.go_events e
      WHERE e.id = go_event_attendees.event_id
      AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "Event owner can delete attendees"
  ON public.go_event_attendees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.go_events e
      WHERE e.id = go_event_attendees.event_id
      AND e.user_id = auth.uid()
    )
  );

-- ─── Add event publishing fields to go_events ───────────────────────────────

ALTER TABLE public.go_events
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS published_url TEXT,
  ADD COLUMN IF NOT EXISTS registration_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS max_attendees INTEGER,
  ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMPTZ;

-- ─── Add notification preferences to go_events ──────────────────────────────

ALTER TABLE public.go_events
  ADD COLUMN IF NOT EXISTS calendar_synced BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER[] DEFAULT '{60,1440}';
  -- Default reminders: 1 hour (60 min) and 1 day (1440 min) before
