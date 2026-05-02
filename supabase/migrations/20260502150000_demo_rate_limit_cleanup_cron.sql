-- ============================================================================
-- Daily cleanup of stale demo_request_rate_limit rows
-- (Marketing follow-up to 20260502140000_demo_rate_limit_oauth_lockdown.sql)
-- ============================================================================
-- Why: the rate-limit table accumulates one row per IP indefinitely. Rows
--      whose window_start is older than 24 hours are no longer relevant
--      (the window is 1 hour) and can safely be deleted.
--
-- Pattern follows 20260424010000_scheduled_publisher.sql:
--   - CREATE EXTENSION IF NOT EXISTS pg_cron
--   - Idempotent unschedule of any prior version of the job
--   - cron.schedule(...) with a fixed job name
-- ============================================================================

-- ─── 1. Ensure pg_cron is enabled ────────────────────────────────────────
-- Allowed on Supabase. Enable via Dashboard → Database → Extensions if the
-- CREATE EXTENSION below fails on a self-hosted setup without superuser.
CREATE EXTENSION IF NOT EXISTS pg_cron;


-- ─── 2. Idempotent (re-)schedule ────────────────────────────────────────
-- Wrapped in DO $$ ... $$ so re-running the migration after a job-name change
-- or rollback does not error with "job already exists".
DO $$
BEGIN
  -- Unschedule any prior version of this job
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'demo-rate-limit-cleanup') THEN
    PERFORM cron.unschedule('demo-rate-limit-cleanup');
  END IF;

  -- Schedule daily cleanup at 03:00 UTC
  PERFORM cron.schedule(
    'demo-rate-limit-cleanup',
    '0 3 * * *',  -- every day at 03:00 UTC
    $cron$
    DELETE FROM public.demo_request_rate_limit
     WHERE window_start < NOW() - INTERVAL '24 hours';
    $cron$
  );
END $$;


-- ─── 3. Verification (run manually after apply) ─────────────────────────
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'demo-rate-limit-cleanup';
-- Expected: 1 row, schedule '0 3 * * *', active=true.
--
-- To inspect recent runs:
-- SELECT * FROM cron.job_run_details WHERE jobname = 'demo-rate-limit-cleanup' ORDER BY start_time DESC LIMIT 10;
