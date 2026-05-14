# GDPR / AVG Compliance Audit — Inclufy Production Apps

**Date:** 2026-05-14
**Scope:** AMOS Marketing (`mpxkugfqzmxydxnlxqoj`) + Inclufy AI Finance (`nruqfegrngpzoigflexn`)
**Trigger:** EU customer onboarding 2026-05-15
**Mode:** Read-only

---

## Section Scores

| § | Section                          | AMOS | Finance |
|---|----------------------------------|------|---------|
| 1 | Right to erasure (Art. 17)       | OK   | GAP     |
| 2 | Right of access (Art. 15)        | OK   | GAP     |
| 3 | Data minimization                | PARTIAL | PARTIAL |
| 4 | Consent + lawful basis           | PARTIAL | PARTIAL |
| 5 | DPA / sub-processor list         | GAP  | GAP     |
| 6 | Data residency                   | PARTIAL | PARTIAL |
| 7 | Logging hygiene                  | PARTIAL | PARTIAL |
| 8 | Breach-notification readiness    | GAP  | GAP     |

Legend: OK = compliant, PARTIAL = partial, GAP = gap.

---

## §1 Right to erasure (Art. 17)

**AMOS:** `supabase/functions/gdpr-account-delete/index.ts` deployed. 3-tier model:
- Tier 1 hard-delete: `oauth_tokens`, `social_accounts`, `agent_run_messages/runs/goals`, `ai_explanation_cache`, `demo_request_rate_limit`, `followed_organizers`, `notifications`.
- Tier 2 preserved (org content, Art. 17(3)(e) legitimate-interest derogation, 23 tables listed).
- Tier 3 anonymize `profiles` row + `auth.users` ban_duration ~100y + 30-day grace + best-effort `audit_logs` insert.

**Finance:** No `gdpr-account-delete`, no `right-to-erasure`, no `delete-account` function. `accountant-export` exists (different purpose — exports bookkeeping). **P0 GDPR gap** for paying EU customer, but per spec NOT a demo blocker since no erasure request is pending.

## §2 Right of access (Art. 15)

**AMOS:** `supabase/functions/gdpr-export/index.ts` returns JSON of `auth.users` + `profiles` + `organization_memberships` + 29 user-scoped tables; OAuth tokens redacted (`[REDACTED]`). Audit-log best-effort.

**Finance:** No `gdpr-export` / `data-export` / `download-my-data` function. P1 for first-customer onboarding.

## §3 Data minimization

**AMOS PII surfaces:** `profiles` (email, full_name), `auth.users`, `oauth_tokens`, `social_accounts`, `notifications`, `agent_run_messages` (free-text AI messages — can contain anything user typed). JSONB catch-all columns confirmed in: `audit_logs.details`, `notifications.metadata`, `email_log` payloads. No structural review of JSONB contents performed. IP addresses captured in `demo_request_rate_limit` migration (`x-forwarded-for`) — narrow, rate-limit purpose only.

**Finance PII surfaces:** `customers` (incl. IBAN — migration `20260305000000_add_customers_iban.sql`), `invoices` (customer_email, counterparty), `bank_transactions` (counterparty_name, IBAN), payroll integration tables (`payroll_*`, salaris data from Loket/Nmbrs), `landing_inquiries`. `approvals_reviews` table stores `ip_address` + `user_agent` + `performed_by_email` + JSONB `metadata` — lawful basis (audit trail / contract) likely defensible but must be documented. `landing_chat` migration also has JSONB.

Both: no inventory document mapping each PII column → retention period → lawful basis.

## §4 Consent + lawful basis

**AMOS:** `AIConsentModal.tsx` + `useAIConsent.ts` + `ai-consent.service.ts` — explicit consent for AI features only (granular). Toggle visible in `SettingsScreen.tsx`. No cookie banner (native mobile app — not required). Privacy policy URL set in `app.json`. No `consent_log` / `consents` table found in migrations — current consent state stored but historical changes not audit-logged.

**Finance:** `src/components/CookieConsent.tsx` exists but is **localStorage-only** (`cookie-consent: all|essential`). No server-side `consents` table, no IP/UA/timestamp record, not auditable. ePrivacy/AVG requires demonstrable consent — a localStorage flag the user can wipe is not demonstrable. `Footer.tsx` links to `/privacy`. No documented lawful-basis register for processing activities.

## §5 DPA / sub-processor list

No `dpa.pdf`, `subprocessor_list.md`, `processing_agreement.md`, or equivalent in `docs/` of either repo. Only archived AMOS web copy at `_archive/web/public/privacy-policy.html`. **Gap in both** before signing with paying EU customer.

**Confirmed sub-processors (derived from code):**

| Sub-processor | Purpose | Used by | EU? |
|---|---|---|---|
| Supabase (AWS eu-west-1, Ireland) | DB, auth, edge functions, storage | Both | Yes |
| Resend | Transactional email (`api.resend.com`) | Both | EU sending region per DNS (`feedback-smtp.eu-west-1.amazonses.com`) |
| OpenAI | LLM (`api.openai.com`) | Both (ai-connection-helper, kvk-filing-agent, extract-kvk-data, etc.) | US — requires DPA + SCCs |
| Anthropic | LLM (referenced) | Both (AI orchestration) | US — requires DPA + SCCs |
| Google Gemini | LLM fallback | Finance (extract-kvk-data) | US — requires DPA + SCCs |
| Meta (FB/IG/Threads) | Social publish | AMOS only | US — Meta DPA |
| LinkedIn | Social publish | AMOS only | US — LinkedIn DPA |
| TikTok | Social publish | AMOS only | Non-EU — TikTok DPA |
| Pinterest | Social publish | AMOS only | US — Pinterest DPA |
| Mollie | PSP | Finance only | EU (NL) |
| Stripe | PSP | Finance only | US/IE — Stripe DPA |
| Tink (PSD2 AIS/PIS) | Bank data | Finance only | EU |
| Cloudflare | Worker + edge (media-proxy) | AMOS | EU/global edge |
| Sentry | Error tracking | Both | **DEFAULT US** — region not pinned in `sentry.ts` |
| Apple iCloud | Off-site backup | Backup script | EU if account region NL |
| WhatsApp / Meta Cloud API | WhatsApp messaging | Both (whatsapp-*) | US |
| KvK API | Company data | Finance | EU (NL) |
| Creditsafe | Credit checks | Finance | EU |
| Loket, Nmbrs | Payroll | Finance | EU (NL) |
| Gmail/Outlook/IMAP/Dropbox/GDrive/OneDrive | Invoice scanning | Finance | mixed — user-OAuth, processor depends on user choice |
| Mailgun/AWS SES (Resend underlying) | SMTP infra | Both | EU region selected |

## §6 Data residency

- Supabase projects: eu-west-1 (Ireland) — EU.
- iCloud backups: Apple EU servers when account region is NL — EU.
- Resend: EU sending region confirmed in DNS (`feedback-smtp.eu-west-1.amazonses.com`).
- **Sentry: NOT EU-pinned.** `src/lib/sentry.ts` (AMOS) and `src/lib/sentry.ts` + `mobile/src/lib/sentry.ts` (Finance) initialise without `tunnel` or `region` override → defaults to Sentry US org. Crash payloads can contain breadcrumbs with URLs, user IDs, sometimes free-text. **P0 to fix** for EU residency — must either move to a Sentry EU org or pin via `region: 'eu'` once an EU DSN is provisioned.
- OpenAI/Anthropic/Gemini/Stripe/Meta/LinkedIn/TikTok/Pinterest: US — require SCCs + DPA. None of these contracts are tracked in this repo.

## §7 Logging hygiene — top offenders

1. `supabase/functions/oauth-callback/index.ts` (AMOS) — multiple `console.log('LinkedIn token exchange ...')`, `console.log('[Threads] tokenData.user_id:', threadsUserId)`, `console.log('Got long-lived token')`. User-IDs and token-exchange context end up in Supabase function logs.
2. `supabase/functions/send-email/index.ts` (both) — `console.log('[send-email] sent type=… to=<recipient> resend_id=…')`. Recipient email logged in plaintext to function logs. Defensible (operational), but counts as PII processing and should be retention-limited.
3. `supabase/functions/publish-social/index.ts` (AMOS) — `console.log(`[Instagram] ... token prefix=${accessToken.slice(0,4)}`)`. Token prefix only; low risk but still token material.
4. `supabase/functions/send-payment-reminders/index.ts` (Finance) — `console.log(`Email sent for invoice ${invoice.invoice_number}:`, emailResult)`. Invoice numbers + recipient implicit.
5. `supabase/functions/gmail-scan-invoices/index.ts` (Finance) — `console.log("Refreshing Gmail access token...")`. No token printed, but inventory of which user scanned which Gmail is in logs.
6. `supabase/functions/send-notification-email/index.ts` (Finance) — logs filename of attached document.

Supabase function logs are retained ~7 days by default but not under a documented retention policy in either repo.

## §8 Breach notification

No incident-response runbook in either repo (`docs/` reviewed — only `PRODUCTION_BACKUP_RUNBOOK.md` in AMOS, nothing in Finance). Sentry initialised but DSN is placeholder in `.env.example` (Finance) and source-maps disabled (`SENTRY_DISABLE_AUTO_UPLOAD: true`) in both EAS production profiles per the production-readiness audit. No UptimeRobot / external uptime monitor confirmed. Under GDPR Art. 33 a breach must be reported to AP (Autoriteit Persoonsgegevens) within 72h — no playbook today.

---

## Top 5 P0 gaps (must fix before sustained EU customer use)

1. **Finance Art. 17 deletion endpoint missing.** Mirror AMOS `gdpr-account-delete` for Finance tables (customers, invoices, bank_transactions, payroll, approvals_reviews) with tier-2 preservation for legally-retained financial records (Dutch fiscal law requires 7-year retention — must be cited in the preservation notice). Effort: 4h.
2. **Finance Art. 15 export endpoint missing.** Mirror AMOS `gdpr-export`. Effort: 2h.
3. **Sub-processor list + DPA not in repo.** Customer will ask on day 1. Use the table in §5 above as the seed. Effort: 2h.
4. **Sentry region not EU-pinned.** Provision EU-region Sentry org/DSN, set `region: 'eu'`, remove placeholder DSN from Finance. Effort: 1h.
5. **No consent audit trail.** Finance `CookieConsent` is localStorage-only — add a `consents` table storing (user_id|anon_session, scope, granted_at, ip, user_agent, version_of_policy). AMOS AI consent toggle stored in app but not audit-logged. Effort: 4h.

## Go/no-go for tomorrow's demo (2026-05-15)

**GO** for a single supervised demo to one EU customer, conditional on the salesperson disclosing in the meeting that (a) the Finance Art. 17 + Art. 15 endpoints are scheduled for the week of 2026-05-15 (mirror of the already-live AMOS pattern, ~6h effort), (b) the DPA + sub-processor list will be delivered before contract signature, and (c) Sentry crash telemetry is being moved to an EU region. Do NOT proceed to broad onboarding, multi-customer rollout, or contract signature until the five P0 items above are closed — particularly Finance erasure/export and the DPA, which any informed EU buyer/DPO will ask for. Demo-mode use does not require erasure to be in place (no data subject has yet made a request) but signed-customer use does the moment they have data in the system.

---

*Read-only audit. No data was modified, exported, or transmitted.*
