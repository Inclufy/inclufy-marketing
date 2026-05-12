-- =============================================================================
-- product_issue_lifecycle trigger — calls the edge function on INSERT/UPDATE
-- =============================================================================
-- Replaces the Dashboard-only "Database Webhook" with an idempotent, version-
-- controlled SQL trigger that produces the same effect: every INSERT or UPDATE
-- on public.product_issues fires an HTTP POST to the product-issue-lifecycle
-- edge function with a Supabase-webhook-compatible payload.
--
-- Why a SQL trigger instead of the Dashboard Webhook:
--   - Version-controlled in git (this migration), survives project re-import
--   - Idempotent (DROP TRIGGER IF EXISTS) — re-run safely
--   - No manual UI step needed across environments
--
-- Auth: the edge function has verify_jwt = false (set in supabase/config.toml),
-- so the trigger doesn't need to embed a service-role key in the call. This
-- avoids any secret-in-SQL-source-code risk. The edge function relies on
-- SUPABASE_SERVICE_ROLE_KEY (auto-injected) for its own reporter-email lookup.
--
-- Idempotency: DROP TRIGGER + REPLACE FUNCTION → safe to re-run on migrate.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_product_issue_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  -- Project URL constant — only thing that differs between AMOS and Finance
  -- copies of this migration. AMOS: mpxkugfqzmxydxnlxqoj
  webhook_url TEXT := 'https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/product-issue-lifecycle';
  payload      JSONB;
BEGIN
  -- Build Supabase-webhook-compatible payload so the edge function can use
  -- the same {type, table, schema, record, old_record} shape regardless of
  -- whether the call came from a Dashboard Webhook or this SQL trigger.
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW),
    'old_record', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END
  );

  -- Fire-and-forget HTTP POST. pg_net.http_post() returns immediately with a
  -- request_id; the actual call happens out-of-band. Even if the edge
  -- function is slow / down, this trigger does NOT block the original
  -- INSERT/UPDATE transaction.
  PERFORM net.http_post(
    url     := webhook_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body    := payload,
    timeout_milliseconds := 5000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never let a notification failure kill an actual issue write. Log via
  -- pg_notify so it shows up in the Supabase Realtime channel + DB logs.
  PERFORM pg_notify(
    'product_issue_notify_error',
    jsonb_build_object(
      'sqlstate', SQLSTATE,
      'message', SQLERRM,
      'op', TG_OP,
      'id', NEW.id
    )::TEXT
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_product_issue_lifecycle_notify ON public.product_issues;
CREATE TRIGGER trg_product_issue_lifecycle_notify
AFTER INSERT OR UPDATE ON public.product_issues
FOR EACH ROW
EXECUTE FUNCTION public.notify_product_issue_change();

COMMENT ON FUNCTION public.notify_product_issue_change() IS
  'Fires HTTP POST to product-issue-lifecycle edge function for every INSERT/UPDATE on product_issues. See supabase/functions/product-issue-lifecycle/ for the receiving logic. Exception-safe — failures are logged via pg_notify but never block the original write.';
