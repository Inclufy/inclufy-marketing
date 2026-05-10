-- ──────────────────────────────────────────────────────────────────────────
-- Email notification on new product_issue
--
-- INSERTS into public.product_issues fire a Supabase Database Webhook to the
-- notify-issue-reported edge function, which in turn calls send-email and
-- delivers a templated mail to support@inclufy.com.
--
-- This migration is the source-of-truth for the webhook trigger
-- ("product-issues-to-support"). The Supabase Dashboard UI also creates
-- triggers via supabase_functions.http_request, but the UI version was wired
-- to the wrong target (test-inclufy) on 2026-05-10 and silently dropped
-- every issue notification — see commit message for incident detail.
--
-- Recreating the trigger via SQL keeps it idempotent and version-controlled.
--
-- Pipeline:
--   INSERT product_issues
--     → trigger product-issues-to-support
--       → POST /functions/v1/notify-issue-reported  (webhook payload shape)
--         → POST /functions/v1/send-email           ({to,type:'issue_reported',data})
--           → Resend → support@inclufy.com
-- ──────────────────────────────────────────────────────────────────────────

-- Drop legacy/superseded trigger from earlier draft of this migration.
drop trigger if exists trg_notify_product_issue_email on public.product_issues;
drop function if exists public.notify_product_issue_email();

-- Drop the existing webhook trigger (UI-created or previous run) so we can
-- recreate it idempotently with the correct target URL.
drop trigger if exists "product-issues-to-support" on public.product_issues;

-- supabase_functions.http_request is the helper Supabase's Database Webhook
-- UI uses internally. We invoke it directly so the trigger is reproducible
-- without UI state. Signature:
--   supabase_functions.http_request(url, method, headers_jsonb, body_jsonb, timeout_ms)
--
-- Auth: the legacy service-role JWT is hardcoded in headers because
--   (a) supabase_functions.http_request expects a string-typed headers arg
--       baked into the trigger definition, and
--   (b) Supabase's new sb_secret_* keys are NOT JWT format and the Functions
--       gateway rejects them with INVALID_JWT_FORMAT — only the legacy JWT
--       passes verify_jwt=true gates.
-- If the JWT ever rotates, recreate this trigger with the new value.
create trigger "product-issues-to-support"
  after insert on public.product_issues
  for each row
  execute function supabase_functions.http_request(
    'https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/notify-issue-reported',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1weGt1Z2Zxem14eWR4bmx4cW9qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ3NjkwMSwiZXhwIjoyMDgyMDUyOTAxfQ.gVkz-16WMgZXTAxv2jGF2OU-hXmMWMZgpUJn_cif1gQ"}',
    '{}',
    '5000'
  );
