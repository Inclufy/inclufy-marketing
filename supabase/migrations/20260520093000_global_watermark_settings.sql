-- ─────────────────────────────────────────────────────────────────────────
-- Global watermark settings — superadmin-configurable AMOS watermark
-- image + opacity, applied to all free-tier publishes server-side.
--
-- Why: the inlined polygonal-A logo and the (forced 100%) opacity were
-- hardcoded in the edge function. To rebrand or tone down the watermark
-- we had to redeploy. Now sami@inclufy.com can change the asset + opacity
-- via Settings → Developer Tools → Watermark Admin, no deploy needed.
--
-- Pattern: `app_settings` is a generic key→value bag for global config.
-- The watermark row is the first consumer. Future global settings (e.g.
-- maintenance banner copy, feature flags) live here too.
--
-- RLS: anyone authenticated reads (edge function + mobile preview);
-- only superadmin (email match) writes.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated user. The edge function calls with the user JWT
-- and needs to load the global watermark config on every bake.
DROP POLICY IF EXISTS "Anyone authenticated can read app_settings" ON public.app_settings;
CREATE POLICY "Anyone authenticated can read app_settings"
  ON public.app_settings FOR SELECT TO authenticated
  USING (true);

-- Write: only superadmin (email-matched). Mirrors src/utils/superadmin.ts
-- and the SUPERADMIN_EMAILS Supabase secret.
DROP POLICY IF EXISTS "Only superadmin can insert app_settings" ON public.app_settings;
CREATE POLICY "Only superadmin can insert app_settings"
  ON public.app_settings FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() ->> 'email') = 'sami@inclufy.com');

DROP POLICY IF EXISTS "Only superadmin can update app_settings" ON public.app_settings;
CREATE POLICY "Only superadmin can update app_settings"
  ON public.app_settings FOR UPDATE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'sami@inclufy.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'sami@inclufy.com');

DROP POLICY IF EXISTS "Only superadmin can delete app_settings" ON public.app_settings;
CREATE POLICY "Only superadmin can delete app_settings"
  ON public.app_settings FOR DELETE TO authenticated
  USING ((auth.jwt() ->> 'email') = 'sami@inclufy.com');

-- Seed the watermark row. image_url=null → edge function falls back to
-- the inlined polygonal-A PNG. opacity=1.0 → 100% (matches v6 default).
INSERT INTO public.app_settings (key, value)
VALUES ('watermark', '{"image_url": null, "opacity": 1.0}'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.app_settings IS
  'Global key→value config. Read by any auth user, write by superadmin only. Keys: watermark={image_url, opacity}.';

-- ─── Storage RLS: media/global/watermark/* ────────────────────────────
-- Superadmin can upload/delete watermark images. Reads are via signed URL
-- (the edge function signs at bake time), so we leave SELECT open to all.

DROP POLICY IF EXISTS "Superadmin can write global watermark assets" ON storage.objects;
CREATE POLICY "Superadmin can write global watermark assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'global'
    AND (storage.foldername(name))[2] = 'watermark'
    AND (auth.jwt() ->> 'email') = 'sami@inclufy.com'
  );

DROP POLICY IF EXISTS "Superadmin can update global watermark assets" ON storage.objects;
CREATE POLICY "Superadmin can update global watermark assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'global'
    AND (storage.foldername(name))[2] = 'watermark'
    AND (auth.jwt() ->> 'email') = 'sami@inclufy.com'
  );

DROP POLICY IF EXISTS "Superadmin can delete global watermark assets" ON storage.objects;
CREATE POLICY "Superadmin can delete global watermark assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = 'global'
    AND (storage.foldername(name))[2] = 'watermark'
    AND (auth.jwt() ->> 'email') = 'sami@inclufy.com'
  );
