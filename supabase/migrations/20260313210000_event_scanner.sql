-- ─── Event Scanner: attendee QR/NFC scanning at events ───────────────────────

-- go_event_scans: records every QR/NFC scan at an event
CREATE TABLE IF NOT EXISTS go_event_scans (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid        NOT NULL,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL DEFAULT '',
  email       text        NOT NULL DEFAULT '',
  company     text        NOT NULL DEFAULT '',
  phone       text        NOT NULL DEFAULT '',
  raw_data    text        NOT NULL DEFAULT '',
  scanned_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_go_event_scans_event
  ON go_event_scans (event_id, scanned_at DESC);

ALTER TABLE go_event_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "go_event_scans_select_own"
  ON go_event_scans FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "go_event_scans_insert_own"
  ON go_event_scans FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- go_contacts: de-duped contact database
CREATE TABLE IF NOT EXISTS go_contacts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL DEFAULT '',
  email       text        NOT NULL DEFAULT '',
  company     text        NOT NULL DEFAULT '',
  phone       text        NOT NULL DEFAULT '',
  source      text        NOT NULL DEFAULT 'manual',  -- 'event_scan' | 'qr' | 'nfc' | 'card' | 'manual'
  event_id    uuid,
  notes       text        NOT NULL DEFAULT '',
  tags        text[]      NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);

CREATE INDEX IF NOT EXISTS idx_go_contacts_user
  ON go_contacts (user_id, created_at DESC);

ALTER TABLE go_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "go_contacts_select_own"
  ON go_contacts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "go_contacts_insert_own"
  ON go_contacts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "go_contacts_update_own"
  ON go_contacts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
