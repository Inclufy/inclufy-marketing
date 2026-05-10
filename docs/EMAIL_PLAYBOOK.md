# Inclufy Email Playbook

This playbook documents the transactional email pipeline for the Inclufy
ecosystem (AMOS Marketing + AI Finance). It covers architecture, day-to-day
operations, and incident response.

**Last reviewed:** 2026-05-10

---

## Architecture

```
┌──────────────────┐        ┌──────────────────────┐
│ AMOS app / web   │        │ Finance app / web    │
│ Supabase Auth    │        │ Supabase Auth        │
│ Edge functions   │        │ Edge functions       │
└────────┬─────────┘        └──────────┬───────────┘
         │                              │
         │  POST /functions/v1/send-email
         ▼                              ▼
┌──────────────────┐        ┌──────────────────────┐
│ AMOS send-email  │        │ Finance send-email   │
│ NL/EN templates  │        │ NL/EN templates      │
│ pink gradient    │        │ green gradient       │
└────────┬─────────┘        └──────────┬───────────┘
         │ checks email_suppressions    │
         │ writes email_send_log        │
         ▼                              ▼
        ┌──────────────────────────────────┐
        │       Resend API (re_…)          │
        └────────────────┬─────────────────┘
                         │
                         ▼  delivered / bounced / complained
              ┌──────────────────────┐
              │  resend-webhook      │  (AMOS only, signed via Svix)
              │  updates send_log    │
              │  upserts suppressions│
              └──────────────────────┘
```

### Two send-email functions, one Resend account

Both projects share the same Resend API key (sender domain `inclufy.com`)
but render their own branded templates:

| Project | Edge function | Brand color | Templates |
|---|---|---|---|
| AMOS Marketing | `mpxkugfqzmxydxnlxqoj/send-email` | Magenta `#ED1D96` → purple `#9952E0` | `publish_success`, `publish_failed`, `oauth_token_expired`, `issue_reported`, `welcome` |
| AI Finance | `nruqfegrngpzoigflexn/send-email` | Green `#19B46B` → teal `#14B8A5` | `payment_reminder`, `invoice_overdue`, `invoice_paid`, `invoice_sent`, `approval_needed`, `statement_ready`, `compliance_alert`, `welcome` |

Both expose the same wire format:

```http
POST /functions/v1/send-email
Content-Type: application/json

{
  "to": "user@example.com",        // or array
  "type": "welcome",
  "locale": "nl",                   // or "en"
  "data": { ... }                   // type-specific payload
}
```

`verify_jwt = false` for both — they are server-to-server helpers and
authenticate via the body alone (no PII leakage risk).

---

## How to add a new template

1. Open the relevant `send-email/index.ts`.
2. Add the new value to `EmailType` union and to `renderTemplateNL` AND
   `renderTemplateEN`. Both languages must always exist — if EN copy isn't
   final, copy the NL string. **Never** silently fall back to NL on EN
   requests; users in `locale=en` should see English even if rough.
3. Each renderer returns `{ subject, html, text }`. The `htmlWrapper`
   helper handles header, footer, and CTA — only fill in `body`, `title`,
   `preheader`, and `ctaUrl/ctaLabel`.
4. Smoke-test:
   ```bash
   curl -sS -X POST "https://<ref>.supabase.co/functions/v1/send-email" \
     -H "Content-Type: application/json" \
     -d '{"to":"support@inclufy.com","type":"YOUR_NEW_TYPE","locale":"en","data":{...}}'
   ```
5. Deploy: `supabase functions deploy send-email --project-ref <ref> --no-verify-jwt`.
6. Verify the row in `email_send_log` (status=`sent`, your `email_type`).

---

## Auth-trigger emails (Supabase Auth)

These do **not** route through `send-email` — Supabase Auth sends them
directly via SMTP (configured per project to use Resend). Templates live
in `supabase/auth-email-templates/` for AMOS. Finance templates were
pasted into the dashboard but should be mirrored to source-control under
`Inclufy Finance/inclufy-finance/supabase/auth-email-templates/` if not
already.

| Type | Branded? | Source |
|---|---|---|
| Confirm sign-up | ✅ | `auth-email-templates/confirm_signup.html` |
| Magic link | ✅ | `auth-email-templates/magic_link.html` |
| Reset password | ✅ | `auth-email-templates/reset_password.html` |
| Email change | ✅ | `auth-email-templates/email_change.html` |

To update: edit the HTML file, paste it into Supabase Dashboard → Auth →
Email Templates, click Save. There is no CLI export for this in v2 (yet).

---

## Deliverability — DNS + monitoring

### DNS records for `inclufy.com` (Cloudflare)

| Type | Name | Value | Status |
|---|---|---|---|
| TXT | `@` (SPF) | `v=spf1 include:_spf.resend.com -all` (or merge with existing) | required |
| CNAME | `resend._domainkey` | provided by Resend | required (DKIM) |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:support@inclufy.com; pct=100; aspf=r; adkim=r` | required |
| MX | `@` | mijndomein.nl smtp servers | for inbox |

If SPF already includes other providers (Zoho etc.), edit that record and
add `include:_spf.resend.com` before `-all` rather than creating a second
TXT record (multiple SPF records is a hard fail).

### Resend webhook (already deployed)

`resend-webhook` (AMOS only — Finance reuses the AMOS webhook because both
projects share the Resend account) listens for events and updates the DB.

Configure in Resend dashboard:
- URL: `https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/resend-webhook`
- Events: `email.delivered`, `email.bounced`, `email.complained`,
  `email.opened`, `email.clicked`
- Copy the signing secret into Supabase secrets:
  `supabase secrets set RESEND_WEBHOOK_SECRET=whsec_… --project-ref mpxkugfqzmxydxnlxqoj`

The webhook verifies Svix signatures and rejects unsigned requests with
401, so configuring `RESEND_WEBHOOK_SECRET` is mandatory before live use.

### Suppression list

`public.email_suppressions` is auto-populated on hard bounce or complaint.
`send-email` checks it before every send and skips suppressed addresses.

To manually unsuppress an address:

```sql
delete from public.email_suppressions where email = 'user@example.com';
```

To manually suppress (for known-bad addresses):

```sql
insert into public.email_suppressions (email, reason)
values ('spammer@example.com', 'manual')
on conflict (email) do nothing;
```

---

## Incident response

### Symptom: emails not arriving

1. Check Resend dashboard for the message — Resend logs every send and its
   delivery status. If it's there with status `delivered`, the issue is
   client-side (spam folder, mail rules).
2. Check `email_send_log`:
   ```sql
   select * from public.email_send_log
   where recipient = 'user@example.com'
   order by sent_at desc limit 10;
   ```
   - `status = 'suppressed'` → user is on the suppression list
   - `status = 'failed'` → look at `status_detail` for Resend's error
   - `status = 'sent'` but no `delivered_at` → webhook never fired (check
     `RESEND_WEBHOOK_SECRET` and the Resend webhook config)
3. Check Supabase function logs:
   ```bash
   supabase functions logs send-email --project-ref <ref> --tail
   ```
4. If Resend itself is down, mail will queue in the function and fail.
   The user gets a 500 — log entry has `status='failed'`.

### Symptom: too many bounces

Bounces > 5% will get the sender domain throttled by mailbox providers.
Run:
```sql
select email_type, count(*) filter (where status='bounced') as bounces,
       count(*) as total,
       round(100.0 * count(*) filter (where status='bounced') / count(*), 1) as bounce_pct
from public.email_send_log
where sent_at > now() - interval '7 days'
group by email_type;
```

If a single template has high bounces, the recipient list quality is
likely the cause. For trigger-based templates (e.g. `oauth_token_expired`),
check whether you're firing on empty addresses.

### Symptom: complaint rate climbing

Complaints (spam reports) above 0.1% are dangerous. Likely causes:
1. Sending welcome emails to people who didn't really sign up (account
   creation abuse).
2. Sending too frequently to one user.
3. Marketing content disguised as transactional.

Check:
```sql
select recipient, count(*) from public.email_send_log
where sent_at > now() - interval '24 hours'
group by recipient having count(*) > 10
order by count(*) desc;
```

If a single recipient is getting >10 mails/day, add per-user throttling
in the calling code (we deliberately did not add a global rate-limit in
`send-email` because it would make legitimate batch jobs harder).

---

## What's intentionally NOT in this pipeline

- **Marketing campaigns / drip sequences** — use Resend's broadcast UI or
  a separate ESP (Customer.io, Loops). Transactional ≠ marketing; they
  have different deliverability profiles and unsubscribe requirements.
- **Per-user notification preferences** — opt-out only via
  `email_suppressions`. If you need per-type opt-out, add a
  `email_preferences` table and check it alongside `isSuppressed`.
- **Rate-limiting per user** — caller's responsibility, see "complaint
  rate climbing" above.
- **iOS Universal Links / Android App Links** — CTAs in emails open in
  the browser. To open the app instead requires an Apple Developer Portal
  config + AASA/assetlinks.json on `marketing.inclufy.com`. Tracked
  separately, not blocking production.

---

## Files & references

- AMOS `send-email`: [supabase/functions/send-email/index.ts](../supabase/functions/send-email/index.ts)
- Finance `send-email`: `Inclufy Finance/inclufy-finance/supabase/functions/send-email/index.ts`
- AMOS `resend-webhook`: [supabase/functions/resend-webhook/index.ts](../supabase/functions/resend-webhook/index.ts)
- AMOS `notify-issue-reported`: [supabase/functions/notify-issue-reported/index.ts](../supabase/functions/notify-issue-reported/index.ts)
- DB tables: [supabase/migrations/20260510140000_email_log_and_suppressions.sql](../supabase/migrations/20260510140000_email_log_and_suppressions.sql)
- Issue webhook: [supabase/migrations/20260510120000_email_on_product_issue.sql](../supabase/migrations/20260510120000_email_on_product_issue.sql)
- Auth templates: [supabase/auth-email-templates/](../supabase/auth-email-templates/)
- Brand book colors: see `reference_brandbook_colors` memory entry
