-- ============================================================================
-- scan_reports: stores results from the scan-monitor Edge Function.
-- Written by both the twice-daily pg_cron job and on-demand app triggers.
-- ============================================================================

-- ─── 1. Table ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.scan_reports (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL    DEFAULT now(),
  source       text        NOT NULL    DEFAULT 'cron',  -- 'cron' | 'manual-edge' | 'manual-app'
  total_checks integer     NOT NULL    DEFAULT 0,
  passed       integer     NOT NULL    DEFAULT 0,
  failed       integer     NOT NULL    DEFAULT 0,
  results      jsonb       NOT NULL    DEFAULT '[]'::jsonb,
  summary      text
);

-- Keep only the 100 most recent reports to avoid unbounded growth
CREATE INDEX IF NOT EXISTS scan_reports_created_at_idx ON public.scan_reports (created_at DESC);

-- ─── 2. RLS ──────────────────────────────────────────────────────────────────
-- Authenticated users can read reports (for the in-app manual screen).
-- Only service role can insert (Edge Function uses service role key).

ALTER TABLE public.scan_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scan_reports: authenticated read" ON public.scan_reports;
CREATE POLICY "scan_reports: authenticated read"
  ON public.scan_reports
  FOR SELECT
  TO authenticated
  USING (true);

-- ─── 3. Auto-prune old reports ───────────────────────────────────────────────
-- Deletes rows beyond the 100 most recent after each insert.

CREATE OR REPLACE FUNCTION public.prune_scan_reports()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM public.scan_reports
  WHERE id NOT IN (
    SELECT id FROM public.scan_reports
    ORDER BY created_at DESC
    LIMIT 100
  );
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_prune_scan_reports ON public.scan_reports;
CREATE TRIGGER trg_prune_scan_reports
  AFTER INSERT ON public.scan_reports
  FOR EACH STATEMENT EXECUTE FUNCTION public.prune_scan_reports();

-- ─── 4. Cron schedule (twice daily via pg_cron) ──────────────────────────────
-- Calls the scan-monitor Edge Function at 07:00 and 19:00 UTC every day.
-- Pattern follows 20260502150000_demo_rate_limit_cleanup_cron.sql.

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  v_url  text := current_setting('app.supabase_url',  true);
  v_key  text := current_setting('app.internal_call_secret', true);
BEGIN
  -- Remove any prior versions of these jobs
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scan-monitor-morning') THEN
    PERFORM cron.unschedule('scan-monitor-morning');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'scan-monitor-evening') THEN
    PERFORM cron.unschedule('scan-monitor-evening');
  END IF;

  -- Morning run: 07:00 UTC
  PERFORM cron.schedule(
    'scan-monitor-morning',
    '0 7 * * *',
    format(
      $sql$
      SELECT net.http_post(
        url     := %L || '/functions/v1/scan-monitor',
        headers := jsonb_build_object(
          'Content-Type',    'application/json',
          'x-internal-call', %L
        ),
        body    := '{}'::jsonb
      );
      $sql$,
      v_url, v_key
    )
  );

  -- Evening run: 19:00 UTC
  PERFORM cron.schedule(
    'scan-monitor-evening',
    '0 19 * * *',
    format(
      $sql$
      SELECT net.http_post(
        url     := %L || '/functions/v1/scan-monitor',
        headers := jsonb_build_object(
          'Content-Type',    'application/json',
          'x-internal-call', %L
        ),
        body    := '{}'::jsonb
      );
      $sql$,
      v_url, v_key
    )
  );
END $$;

-- ─── 5. Verification (run manually after apply) ──────────────────────────────
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE 'scan-monitor-%';
-- Expected: 2 rows, schedules '0 7 * * *' and '0 19 * * *', active=true.
--
-- To inspect recent run history:
-- SELECT * FROM cron.job_run_details WHERE jobname LIKE 'scan-monitor-%' ORDER BY start_time DESC LIMIT 10;
--
-- To inspect scan reports:
-- SELECT source, passed, failed, summary, created_at FROM scan_reports ORDER BY created_at DESC LIMIT 10;
