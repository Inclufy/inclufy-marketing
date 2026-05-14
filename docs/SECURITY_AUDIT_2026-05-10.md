# Security Audit — AMOS Marketing + Inclufy AI Finance
Date: 2026-05-10 (run 2026-05-14, day before paying-customer go-live)
Scope: Edge functions, migrations, RLS policies, JWT handling, PII logging
Mode: read-only scan, no fixes applied

---

## Tally

| Sev | AMOS | Finance | Total |
|---|---:|---:|---:|
| P0 (cross-tenant / auth-bypass / exploitable now) | 1 | 1 | 2 |
| P1 (intra-tenant sensitive / DoS / abuse-prone) | 3 | 2 | 5 |
| P2 (defense-in-depth / hygiene) | 4 | 3 | 7 |
| Info (verified-OK, noted for completeness) | 6 | 4 | 10 |

---

## P0 — exploitable today

### P0-1 — `send-push` accepts UNAUTHENTICATED requests and fans out arbitrary push notifications to any user
**Files**
- `/Users/samiloukile/Dropbox/Inclufy Marketing/Inclufy Marketing-main/supabase/functions/send-push/index.ts:132-208`
- `/Users/samiloukile/Dropbox/Inclufy Finance/inclufy-finance/supabase/functions/send-push/index.ts:132-208` (Finance variant, identical issue)
- Config: `supabase/config.toml:60` (AMOS `verify_jwt = false`) and Finance `config.toml:91`

**Evidence (AMOS, send-push/index.ts:132-145)**
```ts
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);

  let body: PushBody;
  try { body = await req.json(); }
  catch { return jsonResponse({ error: 'Invalid JSON' }, 400); }

  const userIds = Array.isArray(body.user_ids) ? body.user_ids.filter(Boolean) : [];
  if (userIds.length === 0) return jsonResponse({ error: 'user_ids required' }, 400);
```
No `Authorization` header check, no shared-secret check, no signature verification. `verify_jwt = false` in config.toml. Anyone on the internet can POST to `https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/send-push` with `{user_ids:[<known UUID>], title:"...", body:"..."}` and trigger push notifications to that user's iPhone / Android.

**Why exploitable**
- AMOS user_ids leak through many channels (deep-link URLs, public org pages, `go_posts.user_id` exposure via approval-flow notifications).
- An attacker who guesses or scrapes a single user_id can spam, phish ("Tap to confirm — your account is locked"), or panic the user.
- The "server-to-server" comment is aspirational — nothing enforces it.

**Risk for tomorrow's demo** Real. A spammer running a script could push a notification while the customer is watching the demo, which would be embarrassing at minimum and a GDPR data-processing incident (sending notifications to identified users without legal basis).

**Fix (do not ship without this)**
- Require a shared `X-Internal-Secret` header that matches an env var, OR set `verify_jwt = true` and pass `Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}` from each caller (trigger + scheduled-publisher + publish-social).
- Mirror the `publish-social` body.user_id-vs-JWT assertion pattern.

---

### P0-2 — Finance `send-push` shares same flaw (Finance project)
Same code path, same `verify_jwt = false` (Finance `supabase/config.toml:91`). Finance `notifications` trigger (Finance migration `20260510160000_user_devices_push.sql:58-76`) POSTs to it with service-role auth, but the function itself never checks that the caller actually has it. Internet-exposed. Same fix.

---

## P1 — sensitive intra-tenant / abuse risk

### P1-1 — AMOS `send-email` accepts arbitrary recipient + type without auth
`/Users/samiloukile/Dropbox/Inclufy Marketing/Inclufy Marketing-main/supabase/functions/send-email/index.ts:441-549`
`verify_jwt = false` (config.toml:35). Anyone can POST `{to:"anyone@anywhere.com", type:"welcome", data:{name:"..."}}` and use the Inclufy DKIM-signed domain to send templated branded mail. Free phishing-as-a-service. Mitigated only by RESEND_API_KEY quota.

**Fix** add a shared `X-Internal-Secret` header check (the same env var send-push gets).

### P1-2 — AMOS `submit-post-for-approval` does not verify the post author is in the caller's org
`supabase/functions/submit-post-for-approval/index.ts:60-83`
Checks `post.user_id === user.id` (good — only the author can submit) but resolves "the org" via `organization_members` for the **caller**, not the post. If a user is in two orgs and the post was created while in org-A, submitting it routes the approval-notification to org-B admins. Information leak across orgs.

**Fix** join `organization_members` on `post.user_id` and take the membership where the post was authored, OR require an explicit `organization_id` in the request body.

### P1-3 — AMOS `process-post-approval` lacks org-FK on the post itself
`supabase/functions/process-post-approval/index.ts:82-101`
Same root cause: `go_posts` has no `organization_id` column. The check "caller shares an org with the author AND is admin/owner there" is correct, but means **any admin/owner of any org the author belongs to** can approve. Author in 2 orgs → either org's admin can approve. Possibly acceptable, but document.

### P1-4 — Finance `chat-reply` stores visitor email in `landing_chat_sessions` via service-role; rate-limit is per-process in-memory
`supabase/functions/chat-reply/index.ts:284-339, 50-62`
Edge functions are stateless and scale horizontally → in-memory rate limit is per-instance, easily bypassed. Combined with `verify_jwt = false`, an attacker can spam create thousands of sessions and inflate the `landing_chat_sessions` table + trigger Slack/email floods (`notifyEmail` calls Resend on high-intent sources).

**Fix** move rate-limit to a `landing_chat_rate_limit` table keyed by `ip_hash` + minute-bucket (same pattern as `demo_request_rate_limit` already in AMOS).

### P1-5 — Finance `landing-inquiries` admin email fans out unauthenticated body content
`supabase/functions/landing-inquiries/index.ts:177-234`
Same shape as P1-4 — in-memory rate limit, anon writes, and the Resend email at line 227 quotes user-supplied `category`, `source`, `contactEmail`. Already HTML-escapes message but not other fields. Low-impact XSS in admin inbox HTML.

---

## P2 — defense-in-depth

### P2-1 — Verbose error returns leak DB schema details
`submit-post-for-approval/index.ts:100`, `register-push-token/index.ts:102`, etc. — each returns `error.message` from Supabase directly in 500 responses. Includes table names, FK names. Strip detail in prod.

### P2-2 — AMOS `oauth-callback` logs OAuth tokens (prefix only, but still)
`/Users/samiloukile/Dropbox/Inclufy Marketing/Inclufy Marketing-main/supabase/functions/publish-social/index.ts:530`
```ts
console.log(`[Instagram] Using API base: ${IG_API_BASE} (token prefix=${accessToken.slice(0, 4)})`);
```
4-char prefix is harmless cryptographically, but reviewer-rule "no token material in logs" still flags it. Same for `oauth-callback/index.ts:733` which logs `tokenData.user_id`.

### P2-3 — `send-email` logs recipient lists at INFO level
`send-email/index.ts:537` `console.log('[send-email] sent type=${type} to=${recipients.join(',')} ...)` — full email addresses in production logs. GDPR Art. 30 record-of-processing consideration, not strictly a leak, but reduces logs-retention compliance flexibility.

### P2-4 — AMOS `notify-issue-reported` falls back from anon-key to service-role key for the internal call
`notify-issue-reported/index.ts:128` — when `SUPABASE_ANON_KEY` is unset it uses `SUPABASE_SERVICE_ROLE_KEY` as the Authorization header on an internal call. Service-role over an HTTP boundary is acceptable for sibling functions but should be a deliberate config, not a fallback.

### P2-5 — AMOS legacy long-lived service-role JWT embedded in trigger (verified acceptable)
`supabase/migrations/20260510120000_email_on_product_issue.sql:50`
Decoded payload: `{"iss":"supabase","ref":"mpxkugfqzmxydxnlxqoj","role":"service_role","iat":1766476901(=2025-12-23),"exp":2082052901(=2035-12-21)}`
**Confirmed legacy long-lived JWT**, not the short-lived rotation key. Acceptable per the architecture decision documented in the migration header (sb_secret_* keys are not JWT format and would be rejected by the gateway).

### P2-6 — Finance trigger uses `current_setting('app.settings.service_role_key', …)` instead of hardcoded JWT (good)
`Finance/supabase/migrations/20260510160000_user_devices_push.sql:74` — uses `current_setting` so no secret in SQL. Better than AMOS pattern, but only works if `app.settings.service_role_key` is actually set in the Postgres `ALTER DATABASE ... SET` (verify in dashboard).

### P2-7 — AMOS `org_admin_user_ids` SECURITY DEFINER without `revoke from public`
`supabase/migrations/20260510170000_post_approval_gate.sql:101-112`
Function is `SECURITY DEFINER stable`. No explicit `REVOKE EXECUTE ... FROM public` after creation. Anyone with `authenticated` role can call `select * from org_admin_user_ids('<any-org-uuid>')` and enumerate every admin's user_id. Not P0 (user_ids alone don't grant access), but combined with P0-1 send-push becomes the perfect oracle to target push-spam.

---

## Info — verified OK / not in scope

- **AMOS tables created today have RLS enabled**: `user_devices` (own-row), `email_send_log` (admin-read), `email_suppressions` (admin-read). All `ENABLE ROW LEVEL SECURITY` + at least one policy. Confirmed at migrations `20260510140000_email_log_and_suppressions.sql:64-91` and `20260510160000_user_devices_push.sql:38-57`.
- **Finance `user_devices` RLS** equivalent. `landing_chat_sessions` + `landing_chat_messages` admin-only SELECT, service-role bypass for INSERT — confirmed `20260505160000_landing_chat.sql:94-138`.
- **New `go_posts` approval columns (`submitted_by_user_id`, `approved_by_user_id`, `rejection_reason`, etc.)** inherit the existing `go_posts_select_own` policy (`schema_baseline.sql:225-227`) — author-only SELECT. **UX note**: admins viewing the in-review queue from a non-admin client cannot SELECT other users' posts; the `submit-post-for-approval` and `process-post-approval` functions use service-role bypass so the server flow works, but anyone building an admin Review UI via the client SDK will need a new RLS policy. Not a leak; flagged for product follow-up.
- **`requires_post_approval` column on `organizations`** inherits existing org RLS — fine.
- **`publish-social` body.user_id-vs-JWT assertion** confirmed at `publish-social/index.ts:1497-1530` (commit f7b54b4 pattern intact).
- **`gdpr-account-delete` + `gdpr-export`** correctly require `verify_jwt = true`, use anon-key client for `getUser()` then service-role for the actual delete — correct pattern.
- **Anon JWT in mobile/web bundle** (`src/services/supabase.ts:6`, `mobile/src/lib/supabase.ts:35`) is the anon role JWT (decoded `role:"anon"`), correct for client embedding.
- **`oauth-callback` `verify_jwt = false`** correct (browser redirect, no Authorization header possible).
- **`resend-webhook` `verify_jwt = false`** correct (Svix signature verification in `resend-webhook/index.ts:60-96` before any work).
- **`product-issue-lifecycle` `verify_jwt = false`** acceptable — webhook delivers payload, function only reads-and-sends-email, no user-facing writes outside `product_issues` itself (which is RLS-protected).
- **`whatsapp-webhook` `verify_jwt = false`** correct (Meta-signed request, sig check at start of function).

---

## Go / No-Go for tomorrow's live demo

**No-go without fixing P0-1 and P0-2 (the two `send-push` functions).** The other findings are tolerable for a single-customer pilot under a written limited-liability agreement, but two internet-exposed unauthenticated push-notification fan-out endpoints on production projects backing a paying GDPR-regulated customer is a clear go-live blocker. The exploit is trivial (one curl), the blast radius is "any user whose UUID is guessable", and the failure-mode in front of a customer is brand-damaging in addition to being a data-processing issue. Fix is ~15 lines of code: require `X-Internal-Secret: ${SHARED_SECRET}` header (or service-role bearer + body.user_id assertion), set the env var, set `verify_jwt = true` in config.toml, redeploy both functions.

P1-1 (`send-email` open relay) is a strong second-priority — same fix shape, ~10 lines. Recommend doing both before the demo.

The other P1/P2 findings (org-FK on go_posts, in-memory rate limits, log hygiene) are real but not exploitable on a one-customer-one-day timeline. Schedule for next sprint.

## Functions/migrations to reject deploying until fixed

| Item | Project | Reason |
|---|---|---|
| `supabase/functions/send-push/index.ts` | AMOS | P0-1 |
| `supabase/functions/send-push/index.ts` | Finance | P0-2 |
| `supabase/functions/send-email/index.ts` | AMOS | P1-1 (recommend) |

Migrations are clean — all tables created today have RLS + sensible policies. No schema rejections.

---

## Recommended follow-ups (not blockers)

- Write a regression test that POSTs unauthenticated to `send-push` and asserts 401.
- Audit `org_admin_user_ids` SECURITY DEFINER for missing `revoke from public`.
- Convert in-memory rate-limit in `chat-reply` and `landing-inquiries` to DB-backed table.
- Reduce log-level for recipient lists in `send-email` and `oauth-callback`.
- Document the "admin viewing in-review posts" RLS gap and add a policy if a client-side review screen is built.
