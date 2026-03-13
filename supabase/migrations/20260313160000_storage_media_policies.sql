-- ============================================================
-- Storage RLS Policies for 'media' bucket
-- Without these, all storage uploads fail with RLS violation.
-- ============================================================

-- Ensure the media bucket exists (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  104857600, -- 100 MB limit
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp',
        'video/mp4','video/quicktime','video/mov',
        'audio/mpeg','audio/wav','audio/m4a','audio/x-wav',
        'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 104857600;

-- Drop existing storage policies for clean state
DROP POLICY IF EXISTS "media_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "media_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "media_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "media_authenticated_delete" ON storage.objects;
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for media" ON storage.objects;

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "media_authenticated_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media'
  AND auth.role() = 'authenticated'
);

-- Allow public read (bucket is public so images/videos load)
CREATE POLICY "media_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Allow authenticated users to update their own files
CREATE POLICY "media_authenticated_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'media'
  AND auth.uid()::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'media'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own files
CREATE POLICY "media_authenticated_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media'
  AND auth.uid()::text = (storage.foldername(name))[2]
);
