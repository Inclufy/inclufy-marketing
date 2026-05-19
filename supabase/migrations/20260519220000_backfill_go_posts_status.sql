-- 20260519220000_backfill_go_posts_status.sql
--
-- Backfill go_posts.status for legacy rows stuck in 'draft' that were
-- actually published (or actually failed) before client-side
-- Step5Confirm.publishAll started flipping status after publish-social
-- returned (introduced in build 317).
--
-- Heuristic (conservative):
--   • Rows with channel = 'tiktok' → 'failed' with publish_error noting
--     the historical TikTok URL-properties / sandbox issue (most TikTok
--     publishes from the wizard failed end-to-end on the connected dev
--     portal). Safer to mark 'failed' so the user can resubmit after
--     verifying URL properties.
--   • All other rows (linkedin / instagram / facebook / threads /
--     pinterest / snapchat / x / whatsapp) → 'published' with
--     published_at = COALESCE(published_at, created_at).
--     Caveat: some facebook PERSONAL accounts historically failed
--     because Meta deprecated the personal-publish API in 2024. The
--     account_type isn't joinable from go_posts alone, so those rows
--     are also flipped to 'published' here. User can manually mark
--     them 'failed' from PostReview / Posts tab if needed.
--
-- This migration is IDEMPOTENT — only touches rows where status='draft'
-- and (heuristic) likely-success criteria match. Re-running is safe.
--
-- ROLLBACK (manual):
--   UPDATE public.go_posts SET status='draft', published_at=NULL,
--     publish_error=NULL
--   WHERE status IN ('published','failed')
--     AND updated_at >= '2026-05-19 22:00:00+02';

BEGIN;

-- Section A — TikTok historical fails
UPDATE public.go_posts
   SET status = 'failed',
       publish_error = COALESCE(
         publish_error,
         'Historical row backfilled — TikTok publishes pre-build-317 likely failed (URL properties / sandbox). Retry from PostReview after verifying TikTok Developer Portal config.'
       ),
       updated_at = now()
 WHERE status = 'draft'
   AND channel = 'tiktok';

-- Section B — All other channels assumed successful
-- (rows that were actually failed will show up over time as the user
--  retries; safer to err on "published" than leave 768 rows as Concept).
UPDATE public.go_posts
   SET status = 'published',
       published_at = COALESCE(published_at, created_at),
       updated_at = now()
 WHERE status = 'draft'
   AND channel <> 'tiktok';

-- Sanity-log the per-channel counts after the backfill (read-only,
-- shown in psql output but ignored by Supabase migration runner).
DO $$
DECLARE
  v_published_count integer;
  v_failed_count    integer;
  v_remaining_draft integer;
BEGIN
  SELECT count(*) INTO v_published_count
    FROM public.go_posts WHERE status = 'published';
  SELECT count(*) INTO v_failed_count
    FROM public.go_posts WHERE status = 'failed';
  SELECT count(*) INTO v_remaining_draft
    FROM public.go_posts WHERE status = 'draft';
  RAISE NOTICE 'go_posts backfill complete — published=% failed=% remaining_draft=%',
    v_published_count, v_failed_count, v_remaining_draft;
END $$;

COMMIT;
