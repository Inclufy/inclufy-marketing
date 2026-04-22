-- Baseline migration to bring untracked tables into version control.
-- Safe to run against existing prod DB; all statements are idempotent.
-- Sources: src/types/index.ts, src/screens/EventSetupScreen.tsx,
--          src/screens/LiveCaptureScreen.tsx, src/hooks/useCaptures.ts,
--          src/hooks/useEventPosts.ts, src/screens/ContentCreatorScreen.tsx
--
-- IMPORTANT: Compare this against the live prod schema (pg_tables, information_schema.columns)
-- before wiring into CI. Columns already present will be silently skipped by
-- ADD COLUMN IF NOT EXISTS; the CREATE TABLE statements are also guarded by IF NOT EXISTS.
-- Run `supabase db diff` against prod to spot any real divergence.

-- ─────────────────────────────────────────────────────────────────────────────
-- go_events
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.go_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL,
  name            TEXT        NOT NULL,
  description     TEXT        NOT NULL DEFAULT '',
  location        TEXT        NOT NULL DEFAULT '',
  event_date      DATE        NOT NULL,
  event_start_time TEXT,                                -- HH:MM string; nullable
  event_end_time   TEXT,                                -- HH:MM string; nullable
  channels        TEXT[]      NOT NULL DEFAULT '{}',   -- e.g. ['linkedin','instagram']
  hashtags        TEXT[]      NOT NULL DEFAULT '{}',
  default_tags    TEXT[]      NOT NULL DEFAULT '{}',
  goals           TEXT[]      NOT NULL DEFAULT '{}',
  brand_kit_id    UUID,
  status          TEXT        NOT NULL DEFAULT 'upcoming'
                    CHECK (status IN ('upcoming', 'active', 'completed', 'archived')),
  cover_image_url TEXT,
  settings        JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safety additions for columns that may already exist in prod
ALTER TABLE public.go_events ADD COLUMN IF NOT EXISTS event_start_time TEXT;
ALTER TABLE public.go_events ADD COLUMN IF NOT EXISTS event_end_time   TEXT;
ALTER TABLE public.go_events ADD COLUMN IF NOT EXISTS cover_image_url  TEXT;
ALTER TABLE public.go_events ADD COLUMN IF NOT EXISTS brand_kit_id     UUID;
ALTER TABLE public.go_events ADD COLUMN IF NOT EXISTS goals            TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.go_events ADD COLUMN IF NOT EXISTS settings         JSONB  NOT NULL DEFAULT '{}';
ALTER TABLE public.go_events ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS go_events_user_id_idx ON public.go_events (user_id);

ALTER TABLE public.go_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'go_events' AND policyname = 'go_events_select_own'
  ) THEN
    CREATE POLICY go_events_select_own ON public.go_events
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'go_events' AND policyname = 'go_events_insert_own'
  ) THEN
    CREATE POLICY go_events_insert_own ON public.go_events
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'go_events' AND policyname = 'go_events_update_own'
  ) THEN
    CREATE POLICY go_events_update_own ON public.go_events
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'go_events' AND policyname = 'go_events_delete_own'
  ) THEN
    CREATE POLICY go_events_delete_own ON public.go_events
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- go_captures
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.go_captures (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID,                               -- nullable: free captures have no event
  user_id          UUID        NOT NULL,
  media_type       TEXT        NOT NULL
                     CHECK (media_type IN ('photo', 'video', 'audio', 'quote')),
  media_url        TEXT        NOT NULL DEFAULT '',
  storage_path     TEXT        NOT NULL DEFAULT '',
  thumbnail_url    TEXT,
  tags             TEXT[]      NOT NULL DEFAULT '{}',
  note             TEXT        NOT NULL DEFAULT '',
  ai_status        TEXT        NOT NULL DEFAULT 'pending'
                     CHECK (ai_status IN ('pending', 'processing', 'completed', 'error')),
  ai_description   TEXT,
  ai_tags          JSONB,                              -- [{label, confidence}] from auto-tagger
  duration_seconds INTEGER,
  transcript       TEXT,
  captured_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safety additions
ALTER TABLE public.go_captures ADD COLUMN IF NOT EXISTS event_id         UUID;
ALTER TABLE public.go_captures ADD COLUMN IF NOT EXISTS thumbnail_url    TEXT;
ALTER TABLE public.go_captures ADD COLUMN IF NOT EXISTS ai_description   TEXT;
ALTER TABLE public.go_captures ADD COLUMN IF NOT EXISTS ai_tags          JSONB;
ALTER TABLE public.go_captures ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE public.go_captures ADD COLUMN IF NOT EXISTS transcript       TEXT;

CREATE INDEX IF NOT EXISTS go_captures_user_id_idx   ON public.go_captures (user_id);
CREATE INDEX IF NOT EXISTS go_captures_event_id_idx  ON public.go_captures (event_id);

ALTER TABLE public.go_captures ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'go_captures' AND policyname = 'go_captures_select_own'
  ) THEN
    CREATE POLICY go_captures_select_own ON public.go_captures
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'go_captures' AND policyname = 'go_captures_insert_own'
  ) THEN
    CREATE POLICY go_captures_insert_own ON public.go_captures
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'go_captures' AND policyname = 'go_captures_update_own'
  ) THEN
    CREATE POLICY go_captures_update_own ON public.go_captures
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'go_captures' AND policyname = 'go_captures_delete_own'
  ) THEN
    CREATE POLICY go_captures_delete_own ON public.go_captures
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- go_posts
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.go_posts (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  capture_id         UUID        NOT NULL,
  event_id           UUID,                              -- nullable (free captures)
  user_id            UUID        NOT NULL,
  channel            TEXT        NOT NULL
                       CHECK (channel IN ('linkedin', 'instagram', 'x', 'facebook', 'tiktok')),
  text_content       TEXT        NOT NULL DEFAULT '',
  hashtags           TEXT[]      NOT NULL DEFAULT '{}',
  branded_image_url  TEXT,
  image_format       TEXT        NOT NULL DEFAULT 'landscape'
                       CHECK (image_format IN ('square', 'story', 'landscape')),
  status             TEXT        NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'failed', 'in_review')),
  published_at       TIMESTAMPTZ,
  scheduled_at       TIMESTAMPTZ,
  publish_error      TEXT,
  published_post_id  TEXT,                              -- platform-assigned post ID after publish
  engagement         JSONB       NOT NULL DEFAULT '{"likes":0,"comments":0,"shares":0}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safety additions (covers columns that already exist in the 225+ row prod table)
ALTER TABLE public.go_posts ADD COLUMN IF NOT EXISTS event_id          UUID;
ALTER TABLE public.go_posts ADD COLUMN IF NOT EXISTS branded_image_url TEXT;
ALTER TABLE public.go_posts ADD COLUMN IF NOT EXISTS published_at      TIMESTAMPTZ;
ALTER TABLE public.go_posts ADD COLUMN IF NOT EXISTS scheduled_at      TIMESTAMPTZ;
ALTER TABLE public.go_posts ADD COLUMN IF NOT EXISTS publish_error     TEXT;
ALTER TABLE public.go_posts ADD COLUMN IF NOT EXISTS published_post_id TEXT;
ALTER TABLE public.go_posts ADD COLUMN IF NOT EXISTS engagement        JSONB NOT NULL DEFAULT '{"likes":0,"comments":0,"shares":0}';
ALTER TABLE public.go_posts ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS go_posts_user_id_idx    ON public.go_posts (user_id);
CREATE INDEX IF NOT EXISTS go_posts_capture_id_idx ON public.go_posts (capture_id);
CREATE INDEX IF NOT EXISTS go_posts_event_id_idx   ON public.go_posts (event_id);

ALTER TABLE public.go_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'go_posts' AND policyname = 'go_posts_select_own'
  ) THEN
    CREATE POLICY go_posts_select_own ON public.go_posts
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'go_posts' AND policyname = 'go_posts_insert_own'
  ) THEN
    CREATE POLICY go_posts_insert_own ON public.go_posts
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'go_posts' AND policyname = 'go_posts_update_own'
  ) THEN
    CREATE POLICY go_posts_update_own ON public.go_posts
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'go_posts' AND policyname = 'go_posts_delete_own'
  ) THEN
    CREATE POLICY go_posts_delete_own ON public.go_posts
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- content_posts
-- Inferred from: src/screens/LiveCaptureScreen.tsx (quote drafts) and
--                src/screens/ContentCreatorScreen.tsx (AI content drafts + publish)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.content_posts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL,
  content_type TEXT        NOT NULL DEFAULT '',   -- captureCategory: 'product','behind_scenes','inspiration', etc.
  platform     TEXT        NOT NULL DEFAULT '',   -- 'linkedin','facebook','x' or comma-separated list
  content      TEXT        NOT NULL DEFAULT '',   -- the generated/edited post text
  hashtags     TEXT[]      NOT NULL DEFAULT '{}',
  tone         TEXT        NOT NULL DEFAULT 'professional',
  status       TEXT        NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'published', 'scheduled')),
  media_urls   TEXT[]      NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safety additions
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT '';
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS tone         TEXT NOT NULL DEFAULT 'professional';
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS media_urls   TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS content_posts_user_id_idx ON public.content_posts (user_id);

ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'content_posts' AND policyname = 'content_posts_select_own'
  ) THEN
    CREATE POLICY content_posts_select_own ON public.content_posts
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'content_posts' AND policyname = 'content_posts_insert_own'
  ) THEN
    CREATE POLICY content_posts_insert_own ON public.content_posts
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'content_posts' AND policyname = 'content_posts_update_own'
  ) THEN
    CREATE POLICY content_posts_update_own ON public.content_posts
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'content_posts' AND policyname = 'content_posts_delete_own'
  ) THEN
    CREATE POLICY content_posts_delete_own ON public.content_posts
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
