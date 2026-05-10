# Email setup — hand-off note (2026-05-10)

This note captures the manual steps that **only Sami** can complete to
finish the email pipeline. Everything else (code, tables, webhooks,
deployments) is already live.

## ✅ Already done in this session

- AMOS `send-email` — rebrand + NL + EN templates, deployed (`v7+`)
- AMOS `notify-issue-reported` — bug-fixed (template→type, anon-key auth)
- AMOS `resend-webhook` — new function for delivery-event tracking
- AMOS `email_send_log` + `email_suppressions` tables created
- AMOS DB trigger `product-issues-to-support` re-pointed at the correct
  edge function (was wired to `test-inclufy` — root cause of yesterday's
  "no email arrives when reporting an issue")
- Finance `send-email` — NL + EN templates, deployed (`v7+`)
- All 5 AMOS Auth templates pasted in dashboard (Sami did this)
- All 4 Finance Auth templates pasted in dashboard (Sami did this)
- `EMAIL_PLAYBOOK.md` written for the team

## ⏳ Outstanding manual steps (≤ 15 min)

### 1. Finance SMTP password (1 min)
- Go to: https://supabase.com/dashboard/project/nruqfegrngpzoigflexn/auth/smtp
- Paste your **Resend API key** in the *Password* field
  (same key as AMOS uses — `re_…`)
- Click **Save changes**

### 2. Cloudflare DNS — DMARC + SPF (3 min)
On `inclufy.com` zone → DNS → Records:

| Type | Name | Content | Proxy |
|---|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:support@inclufy.com; pct=100; aspf=r; adkim=r` | DNS only |
| TXT | `@` | `v=spf1 include:_spf.resend.com -all` | DNS only |

⚠️ **SPF gotcha:** if there is already a TXT record on `@` starting with
`v=spf1` (likely — for Zoho or your existing mail), edit *that one* and
add `include:_spf.resend.com` before `-all`. Two SPF records on the same
domain is a hard fail.

### 3. Resend webhook configuration (3 min)
The receiver edge function is live; you only need to point Resend at it.

- Go to: https://resend.com/webhooks → **Add endpoint**
- Endpoint URL: `https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/resend-webhook`
- Events to subscribe to:
  - `email.delivered`
  - `email.bounced`
  - `email.complained`
  - `email.opened` *(optional, opt-in to engagement tracking)*
  - `email.clicked` *(optional)*
- After saving, Resend shows a **signing secret** like `whsec_…`. Copy it.
- Then in your terminal:
  ```bash
  cd "/Users/samiloukile/Dropbox/Inclufy Marketing/Inclufy Marketing-main"
  supabase secrets set RESEND_WEBHOOK_SECRET=whsec_THE_VALUE \
    --project-ref mpxkugfqzmxydxnlxqoj
  ```
  Without this secret the webhook returns 401 and bounces are not tracked.
- Verify by sending a test email through `send-email`, then waiting 30s
  and querying:
  ```sql
  select * from public.email_send_log
  where sent_at > now() - interval '5 minutes'
  order by sent_at desc;
  ```
  `status` should transition `sent` → `delivered` automatically.

### 4. Mobile deep-links (deferred, ~2h)
Not blocking production. When you're ready:
- Apple Developer Portal: enable **Associated Domains** for the AMOS app
  identifier, add `applinks:marketing.inclufy.com`.
- Web: deploy `.well-known/apple-app-site-association` with the AppID.
- iOS: add `Associated Domains` capability to the Expo config.
- Same for Android with `assetlinks.json`.
- In `send-email`, optionally rewrite CTA URLs to include
  `?openInApp=1` and have a tiny edge function detect the User-Agent and
  302 to `inclufy-go://...` for iOS/Android.

Skip for now — the browser fallback already works fine.

---

## Smoke-tests to run after step 1–3

```bash
# 1. Finance can send mail (fully transactional)
curl -sS -X POST "https://nruqfegrngpzoigflexn.supabase.co/functions/v1/send-email" \
  -H "Content-Type: application/json" \
  -d '{"to":"YOUR_EMAIL","type":"welcome","locale":"en","data":{"name":"Sami"}}'

# 2. Auth flows (after Finance SMTP password)
# Trigger: sign up a new test account in the Finance app — you should
# receive a green-themed "confirm your email" mail at the test address.

# 3. End-to-end issue → email
# In AMOS, report a test issue from the AI Copilot. A pink-themed mail
# should arrive at support@inclufy.com within ~10 seconds.

# 4. Webhook is wired (after step 3 above)
# 30 seconds after the test send, query email_send_log — status should
# be 'delivered' (not just 'sent').
```

---

## When something goes wrong

See `EMAIL_PLAYBOOK.md` → "Incident response". Most issues fall into
three buckets, all diagnosable from `email_send_log`:

- `status='suppressed'` → user is on suppression list (intended)
- `status='failed'` → Resend or domain config issue (check `status_detail`)
- `status='sent'` but never `delivered` → webhook misconfigured

Resend dashboard is the second source of truth — every send ID we get
back is searchable there with full delivery history.
