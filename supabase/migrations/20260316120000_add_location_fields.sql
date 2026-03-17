-- ─── Add location/region fields for geo-tagging scans and contacts ──────────

-- go_event_scans: session-level location per scan
ALTER TABLE go_event_scans
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS province text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS continent text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS location_source text NOT NULL DEFAULT 'gps';
  -- location_source: 'gps' | 'event' | 'manual'

-- go_contacts: location on contact level
ALTER TABLE go_contacts
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS province text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS country text NOT NULL DEFAULT '';
