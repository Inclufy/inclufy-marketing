-- ============================================================================
-- Marketing follow-up — demo_requests rate-limit + oauth_tokens lockdown
-- (data-leak-hunter follow-up, 2026-05-02)
-- ============================================================================
-- Item A: anonymous INSERT on demo_requests is allowed (public form).
--         This adds a BEFORE INSERT trigger limiting non-service-role inserts
--         to 5 per IP per hour. Anon-insert policy is left intact.
--
-- Item B: oauth_tokens currently exposes access_token / refresh_token to
--         authenticated clients via RLS. Lock SELECT on the base table to
--         service-role only and expose a safe metadata view to authenticated
--         users for existence / expiry checks.
--
-- NOTE: cleanup of stale demo_request_rate_limit rows is OUT OF SCOPE here.
--       A daily pg_cron job should DELETE rows where window_start < NOW() - '1 day'.
-- ============================================================================


-- ─── Item A: rate-limiting demo_requests ───────────────────────────────────

-- IP-tracking table
CREATE TABLE IF NOT EXISTS public.demo_request_rate_limit (
  ip            TEXT PRIMARY KEY,
  count         INT NOT NULL DEFAULT 1,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.demo_request_rate_limit IS
  'Tracks demo_requests INSERT attempts per IP. 5 inserts/IP/hour. '
  'Stale rows (window_start < NOW() - INTERVAL ''1 day'') should be purged '
  'by a daily pg_cron job — out of scope for this migration.';

CREATE INDEX IF NOT EXISTS idx_demo_request_rate_limit_window_start
  ON public.demo_request_rate_limit(window_start);

ALTER TABLE public.demo_request_rate_limit ENABLE ROW LEVEL SECURITY;

-- Service-role-only RLS (no anon/authenticated read or write)
DROP POLICY IF EXISTS demo_request_rate_limit_service_all
  ON public.demo_request_rate_limit;
CREATE POLICY demo_request_rate_limit_service_all
  ON public.demo_request_rate_limit
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);


-- Helper: enforce rate limit + upsert counter for a given IP
CREATE OR REPLACE FUNCTION public.check_demo_rate_limit(_ip TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _existing public.demo_request_rate_limit%ROWTYPE;
BEGIN
  SELECT * INTO _existing
    FROM public.demo_request_rate_limit
   WHERE ip = _ip
     FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.demo_request_rate_limit (ip, count, window_start)
    VALUES (_ip, 1, NOW());
    RETURN;
  END IF;

  -- Window expired → reset to 1
  IF _existing.window_start < NOW() - INTERVAL '1 hour' THEN
    UPDATE public.demo_request_rate_limit
       SET count = 1,
           window_start = NOW()
     WHERE ip = _ip;
    RETURN;
  END IF;

  -- Inside window → enforce limit
  IF _existing.count >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded for demo request'
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE public.demo_request_rate_limit
     SET count = count + 1
   WHERE ip = _ip;
END;
$$;

REVOKE ALL ON FUNCTION public.check_demo_rate_limit(TEXT) FROM PUBLIC;


-- BEFORE INSERT trigger on demo_requests
CREATE OR REPLACE FUNCTION public.tg_demo_request_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ip TEXT;
BEGIN
  -- Service-role bypass (admin imports etc.)
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Resolve client IP from PostgREST request headers, with fallbacks.
  -- x-real-ip / x-forwarded-for are set by the Supabase edge proxy.
  BEGIN
    _ip := COALESCE(
      current_setting('request.headers', true)::jsonb->>'x-real-ip',
      split_part(
        current_setting('request.headers', true)::jsonb->>'x-forwarded-for',
        ',', 1
      ),
      current_setting('request.jwt.claim.ip', true)
    );
  EXCEPTION WHEN OTHERS THEN
    _ip := NULL;
  END;

  IF _ip IS NULL OR _ip = '' THEN
    _ip := 'unknown';
  END IF;

  PERFORM public.check_demo_rate_limit(_ip);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS demo_requests_rate_limit ON public.demo_requests;
CREATE TRIGGER demo_requests_rate_limit
  BEFORE INSERT ON public.demo_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_demo_request_rate_limit();


-- ─── Item B: oauth_tokens lockdown ─────────────────────────────────────────

-- Drop the existing user-readable SELECT policy.
DROP POLICY IF EXISTS "Users read own tokens" ON public.oauth_tokens;

-- Service-role retains full access (edge functions).
-- (Service role already bypasses RLS by default in Supabase, but we add an
--  explicit ALL policy so intent is documented and SQL grants are aligned.)
DROP POLICY IF EXISTS oauth_tokens_service_role_all ON public.oauth_tokens;
CREATE POLICY oauth_tokens_service_role_all
  ON public.oauth_tokens
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Safe metadata view: NO access_token / refresh_token.
-- Authenticated users can use this to check token existence / expiry only.
-- NOTE: the underlying oauth_tokens table has columns:
--   id, social_account_id, platform, access_token, refresh_token,
--   expires_at, created_at, updated_at
-- (no user_id / scope columns yet — view scoped to ownership via social_accounts)
CREATE OR REPLACE VIEW public.oauth_tokens_safe AS
  SELECT
    t.id,
    t.social_account_id,
    sa.user_id,
    t.platform,
    t.expires_at,
    t.created_at,
    t.updated_at
  FROM public.oauth_tokens t
  JOIN public.social_accounts sa ON sa.id = t.social_account_id
  WHERE sa.user_id = auth.uid();

COMMENT ON VIEW public.oauth_tokens_safe IS
  'Safe read-only metadata view of oauth_tokens. Excludes access_token / '
  'refresh_token. Owner-scoped via social_accounts.user_id = auth.uid(). '
  'Use this from client code instead of oauth_tokens.';

REVOKE ALL ON public.oauth_tokens_safe FROM PUBLIC;
GRANT SELECT ON public.oauth_tokens_safe TO authenticated;


-- Reload PostgREST schema cache so the new view + dropped policy are visible.
NOTIFY pgrst, 'reload schema';
