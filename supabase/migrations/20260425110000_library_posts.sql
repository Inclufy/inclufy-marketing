-- Content Library: pre-designed product posts (LinkedIn/IG/FB visuals)
-- imported in bulk per product (Academy, Finance, Ignite, ProjeXtPal, Hub, Connect, AMOS)
-- and scheduled/published via existing publish-social edge function.
-- Safe to re-run.

-- ══════════════════════════════════════════════════════════════════
-- 1. library_imports — audit trail for each ZIP import
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.library_imports (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id    UUID        REFERENCES public.go_products(id) ON DELETE SET NULL,
  zip_path      TEXT        NOT NULL,                    -- storage path of uploaded zip
  campaign      TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending',  -- pending | processing | completed | failed
  posts_created INT         NOT NULL DEFAULT 0,
  error         TEXT,
  manifest      JSONB,                                    -- raw manifest.json for reference
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_library_imports_user
  ON public.library_imports(user_id, started_at DESC);

-- ══════════════════════════════════════════════════════════════════
-- 2. library_posts — individual social posts ready to schedule/publish
-- ══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.library_posts (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  import_id       UUID        REFERENCES public.library_imports(id) ON DELETE SET NULL,
  product_id      UUID        REFERENCES public.go_products(id) ON DELETE SET NULL,

  -- identification
  external_id     TEXT,                                  -- id from manifest (e.g. 'academy-01')
  campaign        TEXT,                                  -- e.g. '2026-Q2-launch'
  post_type       TEXT        NOT NULL DEFAULT 'single' CHECK (post_type IN ('single','carousel','video')),

  -- content per language: {nl: {image_url, caption, hashtags[], cta}, en: {...}, fr: {...}}
  translations    JSONB       NOT NULL DEFAULT '{}'::JSONB,

  -- targeting
  channels        TEXT[]      NOT NULL DEFAULT '{}',     -- linkedin | instagram | facebook | x | tiktok | whatsapp
  primary_language TEXT       NOT NULL DEFAULT 'nl',

  -- branding overlay config: {logo: bool, watermark: 'bottom-right'|'none', brand_color: '#xxxxxx'}
  overlay_config  JSONB       NOT NULL DEFAULT '{}'::JSONB,

  -- scheduling
  scheduled_for   TIMESTAMPTZ,
  status          TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','publishing','published','failed','archived')),
  published_at    TIMESTAMPTZ,

  -- per-channel publish results: {linkedin: {post_id, url, error}, instagram: {...}}
  publish_results JSONB       NOT NULL DEFAULT '{}'::JSONB,

  -- ordering / metadata
  sort_order      INT         NOT NULL DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_library_posts_user_product
  ON public.library_posts(user_id, product_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_library_posts_scheduled
  ON public.library_posts(status, scheduled_for)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_library_posts_campaign
  ON public.library_posts(user_id, campaign);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_library_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_library_posts_updated_at ON public.library_posts;
CREATE TRIGGER trg_library_posts_updated_at
  BEFORE UPDATE ON public.library_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_library_posts_updated_at();

-- ══════════════════════════════════════════════════════════════════
-- 3. Row-Level Security
-- ══════════════════════════════════════════════════════════════════
ALTER TABLE public.library_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_posts   ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lib_imports_select_own') THEN
    CREATE POLICY lib_imports_select_own ON public.library_imports
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lib_imports_insert_own') THEN
    CREATE POLICY lib_imports_insert_own ON public.library_imports
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lib_imports_update_own') THEN
    CREATE POLICY lib_imports_update_own ON public.library_imports
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lib_imports_delete_own') THEN
    CREATE POLICY lib_imports_delete_own ON public.library_imports
      FOR DELETE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lib_posts_select_own') THEN
    CREATE POLICY lib_posts_select_own ON public.library_posts
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lib_posts_insert_own') THEN
    CREATE POLICY lib_posts_insert_own ON public.library_posts
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lib_posts_update_own') THEN
    CREATE POLICY lib_posts_update_own ON public.library_posts
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lib_posts_delete_own') THEN
    CREATE POLICY lib_posts_delete_own ON public.library_posts
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;

-- ══════════════════════════════════════════════════════════════════
-- 4. Storage buckets
-- ══════════════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('library-imports', 'library-imports', false, 104857600, ARRAY['application/zip','application/x-zip-compressed']::text[]),
  ('library-posts',   'library-posts',   true,  10485760,  ARRAY['image/png','image/jpeg','image/webp','video/mp4']::text[])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: each user can only access their own folder
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lib_imports_storage_own') THEN
    CREATE POLICY lib_imports_storage_own ON storage.objects
      FOR ALL TO authenticated
      USING (bucket_id = 'library-imports' AND (storage.foldername(name))[1] = auth.uid()::text)
      WITH CHECK (bucket_id = 'library-imports' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lib_posts_storage_own_write') THEN
    CREATE POLICY lib_posts_storage_own_write ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'library-posts' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lib_posts_storage_own_update') THEN
    CREATE POLICY lib_posts_storage_own_update ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'library-posts' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lib_posts_storage_own_delete') THEN
    CREATE POLICY lib_posts_storage_own_delete ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'library-posts' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  -- library-posts bucket is public-read so social platforms can fetch image URLs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'lib_posts_storage_public_read') THEN
    CREATE POLICY lib_posts_storage_public_read ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'library-posts');
  END IF;
END$$;
