-- ============================================================================
-- agent-goal-mode-daily — pg_cron job that wakes the orchestrator every day
-- to evaluate every active agent_goals row and dispatch corrective actions.
--
-- Companion to: supabase/migrations/20260509073000_agent_goals.sql
-- Design doc:   docs/GOAL_MODE_DESIGN.md (section 5)
--
-- Schedule: 04:00 UTC daily. Per design §5, picked because:
--   "(a) after the `demo-rate-limit-cleanup` 03:00 job, (b) before EU business
--    hours so morning approvals are fresh in the user's queue, (c) ad
--    reporting APIs have yesterday's numbers settled."
--
-- Pattern follows 20260424010000_scheduled_publisher.sql (vault.decrypted_secrets
-- + net.http_post) and 20260502150000_demo_rate_limit_cleanup_cron.sql
-- (idempotent unschedule + DO $$ ... $$ wrapper).
-- ============================================================================

-- ─── 1. Ensure pg_cron + pg_net are enabled ────────────────────────────────
-- Both are allowed on Supabase. Enable via Dashboard → Database → Extensions
-- if these CREATE EXTENSION calls fail on a self-hosted setup without superuser.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ─── 2. Vault secrets (set out-of-band, NOT committed) ─────────────────────
-- The job reads two vault secrets, identical to the scheduled-publisher job:
--
--   SELECT vault.create_secret('https://YOUR-PROJECT.supabase.co', 'supabase_url');
--   SELECT vault.create_secret('YOUR_SERVICE_ROLE_KEY',           'supabase_service_role_key');
--
-- If either secret is missing, net.http_post fails silently and the
-- orchestrator simply isn't woken — safe default.

-- ─── 3. Idempotent (re-)schedule ───────────────────────────────────────────
-- Wrapped in DO $$ ... $$ so re-running the migration after a job-name change
-- or rollback does not error with "job already exists".
DO $$
BEGIN
  -- Unschedule any prior version of this job
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'agent-goal-mode-daily') THEN
    PERFORM cron.unschedule('agent-goal-mode-daily');
  END IF;

  -- Schedule the new job at 04:00 UTC daily
  PERFORM cron.schedule(
    'agent-goal-mode-daily',
    '0 4 * * *',  -- every day at 04:00 UTC
    $cron$
    SELECT net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url') || '/functions/v1/orchestrator/run_goals',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_service_role_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
    $cron$
  );
END $$;

-- ─── 4. Verification (run manually after apply) ────────────────────────────
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'agent-goal-mode-daily';
-- Expected: 1 row, schedule '0 4 * * *', active=true.
--
-- Recent runs:
-- SELECT * FROM cron.job_run_details WHERE jobname = 'agent-goal-mode-daily' ORDER BY start_time DESC LIMIT 10;
