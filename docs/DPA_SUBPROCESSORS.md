# Inclufy — Data Processing Agreement & Sub-processor List

**Effective:** 2026-05-14
**Controller:** the Customer (the organisation purchasing Inclufy services)
**Processor:** Inclufy B.V., the Netherlands
**Document version:** v1.0 (stub for first-customer onboarding)

> ⚠️ This document is a working draft prepared for first-customer
> onboarding conversations. A signed DPA exhibit will accompany the
> commercial contract. Items marked **[ ]** are pending operational
> readiness and disclosed up-front.

---

## 1. Scope

This DPA covers personal data processed by Inclufy on behalf of the
Customer when the Customer uses any of the following Inclufy products:

| Product | Supabase project ref | Region |
|---|---|---|
| AMOS (Marketing) | `mpxkugfqzmxydxnlxqoj` | aws-eu-west-1 (Ireland) |
| Inclufy AI Finance | `nruqfegrngpzoigflexn` | aws-eu-west-1 (Ireland) |

Marketing website (`inclufy.com`, `marketing.inclufy.com`) processes only
anonymous traffic and the Customer's submitted contact details. Edge
functions reside in the same region as the parent project.

---

## 2. Categories of personal data processed

### Marketing (AMOS)
- User identifiers (Supabase auth uuid, email)
- Display names, avatar URLs
- OAuth access/refresh tokens for connected social platforms
  (Facebook, Instagram, LinkedIn, TikTok, Pinterest, Threads, X)
- Content captures (photos, videos, audio, text) uploaded by the user
- Post drafts, scheduled posts, publication status
- Push-notification tokens per device
- Optional ad-campaign telemetry (impressions, clicks, spend)

### Finance
- Customer identifiers + names of the Customer's own counterparties
  (invoices, suppliers, employees in salaris flows)
- Invoice line items + amounts
- Bank transactions (counterparty IBAN, description, amount, date)
- Payroll bookings (gross/net salaries, social security premies)
- Compliance documents (BTW aangifte, jaarrekening drafts)
- Audit logs (who-did-what-when)

### Public marketing site
- Contact-form submissions (name, email, company, message)
- Cookie-consent preferences (functional only — no advertising cookies)

---

## 3. Sub-processors

**EU-resident sub-processors** (no SCCs / cross-border transfer required):

| Sub-processor | Purpose | Location | Notes |
|---|---|---|---|
| Supabase Inc. | Hosted Postgres + Auth + Storage + Edge Functions | aws-eu-west-1 (Ireland) | Standard Supabase DPA on file |
| Resend Inc. | Transactional email delivery | aws-eu-west-1 (relay via Amazon SES Ireland) | DPA on file |
| Mollie B.V. | Payment processing (Stripe alternative for NL customers) | Amsterdam, NL | Standard Mollie DPA |
| Tink (Visa Europe) | Open banking / PSD2 — bank-transaction sync (Finance only) | Stockholm, SE | EBA-passported |
| KvK API | Dutch Chamber of Commerce lookup (KvK numbers, addresses) | The Hague, NL | Public-record API, no PII storage |
| Creditsafe Nederland B.V. | Credit-risk scoring (Finance only) | Rotterdam, NL | Standard Creditsafe DPA |
| Loket.nl / NMBRS | Payroll sync (Finance only — optional, customer-elected) | Hoofddorp / Utrecht, NL | DPA per-customer integration |
| Apple Inc. (iCloud Drive) | Off-site backup storage (only when Customer's Inclufy admin enables it) | Apple EU region per user account | Standard Apple iCloud terms |
| Cloudflare Inc. | DNS + DDoS protection for `*.inclufy.com` | EU + global edge | Cloudflare DPA |

**US-resident sub-processors** (Standard Contractual Clauses ("EU SCCs")
or adequacy decision required; documented in our master sub-processor
register):

| Sub-processor | Purpose | Transfer mechanism |
|---|---|---|
| OpenAI L.L.C. | LLM inference (post-generation, classification, copilot) | EU SCCs + OpenAI DPA |
| Anthropic PBC | LLM inference (copilot fallback, longer-context tasks) | EU SCCs + Anthropic DPA |
| Google LLC (Gemini API) | LLM inference (image-aware tasks) | EU SCCs + Google Cloud DPA |
| Sentry (Functional Software Inc.) | Error/crash monitoring | EU SCCs — **migration to EU region scheduled, see §7** |
| Stripe Inc. | Payment processing (for non-NL EU customers) | EU SCCs + Stripe DPA |
| Meta Platforms Inc. (Facebook / Instagram / Threads / WhatsApp) | Social publishing (only when Customer connects their account; we hold OAuth tokens) | Customer's own consent + EU SCCs in Meta DPA |
| LinkedIn (Microsoft Corp.) | Social publishing — same model as Meta | EU SCCs in Microsoft DPA |
| Pinterest Inc. | Social publishing — same model as Meta | EU SCCs in Pinterest DPA |

**Non-EU, non-US sub-processors:**

| Sub-processor | Purpose | Transfer mechanism |
|---|---|---|
| TikTok Pte. Ltd. (Singapore / ByteDance) | Social publishing (only when Customer connects their account) | Customer's own consent + DPA on file |

**Customer-elected integrations** (OAuth — Customer remains controller
of the source account; Inclufy only holds the access token):

- Gmail, Outlook (Microsoft 365), any IMAP host, Dropbox, Google Drive,
  OneDrive — invoked only via explicit Customer click.

---

## 4. Data subject rights

### Article 17 — Right to erasure
- **AMOS**: implemented in edge function `gdpr-account-delete` —
  cascade-deletes the user from `auth.users`, `profiles`, `go_events`,
  `go_captures`, `go_posts`, `social_accounts`, `oauth_tokens`,
  `user_devices`, `go_notifications`, `email_send_log`,
  `email_suppressions`. RTO: real-time.
- **Finance**: 🟡 **scheduled to land within 1 week of contract
  signature.** Source: this audit pass (2026-05-14). Will mirror the AMOS
  pattern across `auth.users`, `profiles`, `invoices` (anonymise rather
  than delete — financial-record retention legal requirement, 7 jaar),
  `bank_transactions`, `bookings`, `payroll`. Anonymisation pattern
  preserves the audit trail without identifying the data subject.

### Article 15 — Right of access (data portability)
- **AMOS**: implemented in `gdpr-export` — returns JSON + storage
  archive URL within minutes.
- **Finance**: 🟡 **same week as Art. 17** — will reuse the
  accountant-export bookkeeping format and add a personal-PII layer.

### Article 16 — Right to rectification
- All user-editable fields (name, email, billing address) are
  self-service in the app.

### Article 21 — Right to object
- Processing for service delivery is contractual (Art. 6(1)(b)) — not
  objectable. Marketing communications are opt-in only; opt-out via
  one-click unsubscribe in any email + the per-user `email_suppressions`
  table.

---

## 5. Security measures (Art. 32)

| Measure | Status |
|---|---|
| Encryption in transit | TLS 1.2+ enforced by Supabase Pooler + Edge gateway |
| Encryption at rest | Supabase Postgres (AWS RDS-class), Storage (S3 SSE), iCloud Drive (Apple-managed AES) |
| RLS (row-level security) | Enabled on all user-data tables; reviewed in `docs/SECURITY_AUDIT_2026-05-10.md` |
| Service-role secrets | Stored as encrypted Supabase project secrets, never in source |
| Internal endpoint auth | X-Internal-Secret header on all `verify_jwt=false` server-to-server endpoints (added 2026-05-14) |
| Backups | Daily 03:00, weekly Sunday, monthly 1st-of-month; verified integrity drill weekly; off-site copy in iCloud EU |
| Access control | MFA enforced on admin accounts; 7-day Supabase auto-backups + 30-day project audit log |
| Vulnerability scanning | `npm audit` + Supabase managed updates; no SCA tool yet (Snyk / Dependabot in roadmap) |
| Personnel | Inclufy founder is the only operational handler today; staff onboarding contract template includes confidentiality |

---

## 6. Sub-processor change notification

Inclufy will notify the Customer in writing (email to the Customer's
contracted contact) at least **14 days** before engaging a new
sub-processor that has access to Customer personal data. The Customer
may object; Inclufy and Customer will negotiate in good faith. If no
resolution within 30 days, the Customer may terminate the affected
service component.

---

## 7. Pending operational items disclosed at signing

The following gaps are tracked and time-boxed. The Customer accepts
service on the understanding that each closes per the timeline.

| Item | Target | Owner |
|---|---|---|
| Finance Art. 17 erasure endpoint | T+7 days from signature | Inclufy engineering |
| Finance Art. 15 export endpoint | T+7 days from signature | Inclufy engineering |
| Sentry migration to EU (Frankfurt) region | T+14 days | Inclufy engineering |
| SOC 2 Type II attestation | Roadmap H2 2026 | external auditor (TBD) |
| ISO 27001 certification | Roadmap H2 2026 | external auditor (TBD) |
| Dedicated breach-response runbook | T+30 days | Inclufy engineering |
| Cookie-consent: server-side audit trail (replacing localStorage-only) | T+30 days | Inclufy engineering |
| External uptime monitoring + alerting | T+7 days | UptimeRobot EU free tier |

---

## 8. Breach notification

In the event of a personal-data breach affecting Customer data, Inclufy
will notify the Customer's contracted contact **within 24 hours of
discovery** and provide the categories of data affected, approximate
number of affected data subjects, likely consequences, and measures
taken to address the breach. Inclufy will assist the Customer in
notifying the supervisory authority (AP for NL customers) within the
72-hour deadline if required.

---

## 9. Audit rights

The Customer may audit Inclufy's compliance with this DPA once per
calendar year, with 30-day notice. Inclufy will provide evidence
including:
- Sub-processor list (this document)
- Access-control reports (Supabase admin log export)
- Backup verification log (`~/backups/.../backup.log`)
- Most recent third-party penetration-test report (Inclufy commits to
  one within 6 months of first paying customer signature)

---

## 10. Term & termination

Effective from contract signature. On termination, Inclufy will:
- Cease processing within 24 hours
- Export all Customer data via the Art. 15 endpoint
- Delete all Customer data within 30 days, with written confirmation,
  EXCEPT data Inclufy is legally required to retain (financial records
  per Dutch fiscal law — 7 years; anonymised)

---

## Annex A — Contact

| Role | Contact |
|---|---|
| Inclufy Data Protection contact | `support@inclufy.com` |
| Customer DPO contact | TBD per Customer |
| Supervisory authority | Autoriteit Persoonsgegevens (AP), The Hague, NL |
