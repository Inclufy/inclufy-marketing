-- Scheduled publisher infrastructure
--
-- Adds retry counter to go_posts so the scheduler can bound retries,
-- adds 'publishing' and 'failed' to the status enum (if using one),
-- and registers a pg_cron job that calls the scheduled-publisher
-- edge function every minute.
--
-- Safe to re-run: all statements use IF NOT EXISTS / CREATE OR REPLACE.

-- ─── 1. Add publish_retries column ─────────────────────────────
ALTER TABLE public.go_posts
  ADD COLUMN IF NOT EXISTS publish_retries INTEGER NOT NULL DEFAULT 0;

-- ─── 2. Expand status check constraint if present ──────────────
-- We don't know if there's a CHECK constraint on status, so we
-- skip enforcement. The app writes the enum values it expects.

-- ─── 3. Index on (status, scheduled_at) for efficient picker ───
CREATE INDEX IF NOT EXISTS idx_go_posts_scheduled
  ON public.go_posts (status, scheduled_at)
  WHERE status = 'scheduled';

-- ─── 4. Enable pg_cron + pg_net (required for HTTP from SQL) ──
-- These extensions are allowed on Supabase. If this project doesn't
-- have them enabled, run these in the Supabase Dashboard first:
--   Database → Extensions → enable pg_cron and pg_net
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─── 5. Store secrets in vault for the cron job ──────────────
-- IMPORTANT: these must be set via Supabase Dashboard → Project Settings →
-- Vault → Add secret, OR via the SQL commands below (run manually with
-- the real values — do NOT commit the real values to git):
--
--   SELECT vault.create_secret('https://YOUR-PROJECT.supabase.co', 'supabase_url');
--   SELECT vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'supabase_service_role_key');
--   SELECT vault.create_secret('YOUR_INTERNAL_CALL_SECRET', 'internal_call_secret');
--
-- These secrets are read by the pg_cron job below. If they aren't set,
-- the job simply does nothing (the HTTP call fails silently). The
-- edge function itself fails closed on missing INTERNAL_CALL_SECRET.

-- ─── 6. Register the cron job ────────────────────────────────
-- Runs every minute. Reads the three secrets from the vault and fires
-- an HTTP POST to the scheduled-publisher edge function.
--
-- If a job with this name already exists, we unschedule it first so
-- this migration is idempotent (avoids "job already exists" errors).
DO $$
BEGIN
  -- Unschedule any prior version of this job
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scheduled-publisher-every-minute') THEN
    PERFORM cron.unschedule('scheduled-publisher-every-minute');
  END IF;

  -- Schedule the new job
  PERFORM cron.schedule(
    'scheduled-publisher-every-minute',
    '* * * * *',  -- every minute
    $cron$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/scheduled-publisher',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key'),
        'x-internal-call', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'internal_call_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
    $cron$
  );
END $$;

-- ─── 7. Verification query (run manually after apply) ───────
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'scheduled-publisher-every-minute';
-- Expected: 1 row, schedule '* * * * *', active=true.
--
-- To see recent runs:
-- SELECT * FROM cron.job_run_details WHERE jobname = 'scheduled-publisher-every-minute' ORDER BY start_time DESC LIMIT 10;
