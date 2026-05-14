# Hardcoded Values & Mock Data Scan — Pre-Demo (2026-05-10)

**Scope:** AMOS (`Inclufy Marketing-main`) + Finance (`inclufy-finance`)
**Excluded:** `node_modules/`, `_archive/`, `build/`, `dist/`, `.expo/`, `e2e/`, `__tests__/`, `*.test.ts`, `*.spec.ts`, `tests/`, `docs/`, `*.md`, migrations (legacy JWTs OK there).
**Mode:** Read-only research. Nothing was modified.

---

## Summary by severity

| Severity | Count | Notes |
| --- | --- | --- |
| **P0** (demo-blocker, credential leak) | **0** | No live secrets in source. Anon JWTs found are intended-public. |
| **P1** (visible fake data / broken-in-prod paths) | **7** | Admin pages with hardcoded customers, prod fallback to localhost, missing-env demo signature. |
| **P2** (cosmetic placeholders, sandbox URLs) | **4** | Pinterest sandbox default, TikTok SELF_ONLY default, founder name in placeholders. |

**Verdict:** Safe to demo tomorrow on the **mobile AMOS app** and the **Finance customer-facing pages** (Boekhouding, Verkoop, Inkoop, Subsidies — all dev-gated). **Do NOT open Finance Admin** (`/admin/invoices`, `/admin/subscriptions`) or **OrganisatieSettings → users dropdown** during the demo — they show fully fake Dutch customer names. If AMOS shows the AI Copilot / Content Creator / Opportunity Feed / Event Intelligence screens, verify `EXPO_PUBLIC_API_URL` is set in the production build; otherwise those screens will silently try `http://localhost:8000/api`.

---

## Top offenders (worst 10)

| # | Severity | File:line | Offending value | Risk |
| - | --- | --- | --- | --- |
| 1 | P1 | `inclufy-finance/src/pages/admin/InvoicesPage.tsx:26-35` | `demoInvoices = [{customer: "Bakkerij Van Dijk", amount: 588, ...}, ...]` (8 fake customers) | Admin `/admin/invoices` route renders fake Dutch SMB names + amounts as if real. No `isDev` gate. |
| 2 | P1 | `inclufy-finance/src/pages/admin/SubscriptionsPage.tsx:26-35` | `demoSubscriptions = [{organization: "Bakkerij Van Dijk", plan, mrr, ...}, ...]` (8 fake tenants) | Admin `/admin/subscriptions` shows fake MRR table. Looks like real customer data to a viewer. |
| 3 | P1 | `inclufy-finance/src/pages/OrganisatieSettings.tsx:599-606` | `// In production, fetch from users table` then returns `[Jan Jansen, Pieter Peters, Maria Maas, Tom Techniek]` with `@example.com` | Manager dropdown in production renders 4 fake users with `@example.com` emails. |
| 4 | P1 | `inclufy-finance/src/pages/Boekhouding.tsx:1469-1474` | `RECURRING_ITEMS_ALL` — hardcoded recurring entries (rent €2500, software €450 etc.) | Bookkeeping "Recurring transactions" tab always shows the same 4 hardcoded items regardless of tenant. |
| 5 | P1 | `inclufy-finance/src/pages/MITAanvraag.tsx:184` | `Handtekening: Sami Loukile, bestuurder` in generated PDF/memo text | Subsidy application PDF always signs as the founder; appears in any tenant's exported MIT memo. |
| 6 | P1 | `Inclufy Marketing-main/src/services/api.ts:4` | `process.env.EXPO_PUBLIC_API_URL \|\| 'http://localhost:8000/api'` | If env var not baked into release build, ContentCreator/Copilot/Opportunity/EventIntelligence screens timeout against localhost. |
| 7 | P1 | `Inclufy Marketing-main/supabase/functions/run-migration/index.ts:1-3,9` | `// DELETE THIS FUNCTION AFTER USE` — no auth check, runs raw SQL via `SUPABASE_DB_URL`, dynamic `sql.unsafe()` | Temporary admin migration endpoint still deployed. Default verify_jwt=true gates it behind anon JWT (public), so anyone can call it and trigger schema/policy ops. Should be deleted. |
| 8 | P2 | `inclufy-finance/src/components/governance/BeleidsdocumentenTab.tsx:214` | `placeholder="Sami Loukile"` (no `Bijv:` prefix — looks like prefilled value) | Tenant could submit governance doc with founder's name still attached if they don't notice. |
| 9 | P2 | `Inclufy Marketing-main/supabase/functions/publish-social/index.ts:33` and `oauth-callback/index.ts:632` | `PINTEREST_API_BASE = '…/api-sandbox.pinterest.com/v5'` default | If `PINTEREST_API_BASE` secret is not set in production, all Pinterest posts hit sandbox (no public URL). Already documented in code as expected until Pinterest review. |
| 10 | P2 | `Inclufy Marketing-main/supabase/functions/publish-social/index.ts:25` | `TIKTOK_PRIVACY_LEVEL = 'SELF_ONLY'` default | TikTok posts default to private/self-only unless `TIKTOK_PRIVACY_LEVEL=PUBLIC_TO_EVERYONE` is set. Confirm secret is set before TikTok demo. |

---

## P0 — Hardcoded credentials

**No P0 findings.** Detailed checks:

- All `SUPABASE_SERVICE_ROLE_KEY` references in both repos use `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` — never inline.
- No `sk_live_*`, `sk_test_*`, `re_*`, `AKIA*`, `xoxb-*`, `ghp_*`, `EAA*` patterns found in source.
- Anon JWTs found in 3 locations (intended-public, OK):
  - `Inclufy Marketing-main/src/services/supabase.ts:6` — AMOS anon key (`mpxkugfqzmxydxnlxqoj` project)
  - `Inclufy Marketing-main/src/components/CounterfactualNudge.tsx:31` — duplicate of the same anon key
  - `inclufy-finance/mobile/src/lib/supabase.ts:35` — Finance mobile anon key (`nruqfegrngpzoigflexn` project) used as env-fallback
- No hardcoded passwords or `postgres://user:pass@…` connection strings outside `.env*` files.
- Console logs reference token-exchange events by label only — no secret values are printed.

---

## P1 — Mock/fake data that could leak into demo

| File:line | Pattern | Demo risk |
| --- | --- | --- |
| `inclufy-finance/src/pages/admin/InvoicesPage.tsx:26-35` | `demoInvoices` array, 8 fake Dutch SMBs | Hardcoded Bakkerij/Bouwbedrijf/IT Solutions etc. shown on `/admin/invoices` |
| `inclufy-finance/src/pages/admin/SubscriptionsPage.tsx:26-35` | `demoSubscriptions` array, 8 fake tenants | Shown on `/admin/subscriptions` as if real MRR data |
| `inclufy-finance/src/pages/OrganisatieSettings.tsx:599-606` | Comment `// In production, fetch from users table` + 4 hardcoded users with `@example.com` | Manager dropdown shows fake users |
| `inclufy-finance/src/pages/Boekhouding.tsx:1469-1474` | `RECURRING_ITEMS_ALL` constant — depreciation €1500/€350, office rent €2500, software €450 | Same 4 entries shown to every tenant's bookkeeping tab |
| `inclufy-finance/src/pages/MITAanvraag.tsx:184` | `Handtekening: Sami Loukile, bestuurder` baked into memo template | Any tenant exporting the MIT memo gets founder's signature |
| `Inclufy Marketing-main/src/services/api.ts:4` | `process.env.EXPO_PUBLIC_API_URL \|\| 'http://localhost:8000/api'` | Used by `OpportunityFeedScreen`, `EventIntelligenceScreen`, `ContentCreatorScreen`, `CopilotScreen`, `useCampaigns`, `useEventPosts`, `useAnalytics`. Confirm prod env baked. |
| `Inclufy Marketing-main/supabase/functions/run-migration/index.ts` | Temp endpoint, comment "DELETE THIS FUNCTION AFTER USE", no in-handler auth | Anyone with anon key can POST and execute predefined ALTER/CREATE statements via `SUPABASE_DB_URL`. |

### Dev-gated demo data (safe, but worth knowing)

These are correctly behind `import.meta.env.DEV`, so they won't appear in the deployed production build:

- `inclufy-finance/src/pages/Inkoop.tsx:278-279` — `getDemoContracts()` for purchase contracts
- `inclufy-finance/src/pages/Verkoop.tsx:351-354,364-365` — `getDemoQuotes()` + `getDemoContracts()` for sales pipeline
- `inclufy-finance/src/pages/SubsidiesInvestments.tsx:192,216` — `getDemoInvestments()` for capex/opex list

Verify the demo is run against a production build (not `pnpm dev`) so DEV mode is off. If the demo uses the local dev server, these demo entries WILL show.

---

## P1 — Test/debug endpoints

| File | Risk |
| --- | --- |
| `Inclufy Marketing-main/supabase/functions/run-migration/index.ts` | Temporary admin migration runner. Should be removed from deployed functions. |
| `inclufy-finance/supabase/functions/send-test-email/index.ts` | `send-test-email` — sends fixed-body test email via Resend. Safer (just emails the requester) but still: confirm it's not linked from any user-facing button by accident before demo. |

No `_debug-*`, `temp-*` or `seed-*` edge functions found in either repo.

No `console.log` of actual token/secret values found. References that mention "token" log only labels or prefix slices (e.g. `accessToken.slice(0, 4)` in `publish-social/index.ts:530`).

No usage of `__DEV__` for unsafe code paths in AMOS.

---

## P2 — Placeholder copy & test infra

| File:line | Pattern | Risk |
| --- | --- | --- |
| `Inclufy Marketing-main/src/screens/IntegrationsScreen.tsx:364,403` | `"Coming soon"` / `"Binnenkort"` badges | Intentional — flags un-wired integrations. Likely fine for demo but be ready to explain. |
| `inclufy-finance/src/components/governance/BeleidsdocumentenTab.tsx:214` | `placeholder="Sami Loukile"` | Looks prefilled, not "e.g.". |
| `inclufy-finance/src/components/AcceptRiskDialog.tsx:167` | `placeholder="Bijv: Sami Loukile"` | OK — prefixed "Bijv:". |
| `inclufy-finance/src/pages/Commercieel.tsx:260` | Body text `finance@ / sami@ / info@ inclufy.com` | Visible explainer text — fine, just be aware. |
| `inclufy-finance/src/components/ForwardFlowSetup.tsx:131` | Test payload `From: "leverancier@example.com"` | Used inside a "test connection" wizard payload — by design, only shown when user runs the test. |

The Finance i18n landing-content has a `// TODO: NDA-cleared translations needed for testimonials` (line 1127) — testimonial quotes stay in NL across all locales. Not a hardcoded-data issue but worth knowing if you demo in EN/FR.

---

## P2 — Sandbox / staging URLs

| File:line | Value | Risk |
| --- | --- | --- |
| `Inclufy Marketing-main/supabase/functions/publish-social/index.ts:33` | `PINTEREST_API_BASE` default `api-sandbox.pinterest.com/v5` | If secret not set, Pinterest posts go to sandbox. Pinterest is in "Trial access" mode by Inclufy's own comment — expected. |
| `Inclufy Marketing-main/supabase/functions/oauth-callback/index.ts:632` | Same `PINTEREST_API_BASE` default | Same. |
| `Inclufy Marketing-main/supabase/functions/publish-social/index.ts:25` | `TIKTOK_PRIVACY_LEVEL` default `SELF_ONLY` | Without secret, TikTok posts go private. Confirm before TikTok demo. |
| `inclufy-finance/supabase/functions/creditsafe-check/index.ts:9-10` | Both `SANDBOX` and `PRODUCTION` URLs defined; per-org `environment` column controls which is used. | Correctly switched at runtime; verify the demo org has `environment='production'` in `integration_api_keys`. |

---

## Things explicitly checked and clean

- AMOS `App.tsx`, `index.ts`, `app.json`, `eas.json` — no hardcoded secrets.
- AMOS i18n locale files — no obvious copy mismatches between NL/EN.
- Finance `prisma/`, `workers/`, `scripts/` — no hardcoded credentials.
- AMOS workers (`workers/media-proxy-router/`) and Finance workers (`workers/imap-scan-worker/`) — no hardcoded secrets.
- No `Lorem ipsum`, `[TBD]`, `John Doe`, `Test User`, or `Test Company` strings in the user-visible paths.
- Hardcoded IBANs in `inclufy-finance/src/components/invoice/BatchPayDialog.tsx:239-240` are CJIB (`NL56INGB0705005100`) and Belastingdienst (`NL86INGB0002445588`) — official NL government accounts, legitimate.
- Brazilian/protonmail `127.0.0.1` references in `inclufy-finance/src/components/EmailScanWizard.tsx:72-73` are ProtonMail Bridge configuration (intentional).

---

## Pre-demo action list (if any)

In priority order. None are strictly required for the demo to "work" but each removes a sharp edge:

1. **AMOS:** Verify `EXPO_PUBLIC_API_URL` is set in the EAS production profile (or accept that Copilot / ContentCreator / OpportunityFeed / EventIntelligence will fail). Same for `PINTEREST_API_BASE` and `TIKTOK_PRIVACY_LEVEL` if those channels will be demoed live.
2. **AMOS:** Delete or auth-gate the `run-migration` edge function from the deployed project (not in repo — directly via `supabase functions delete run-migration`).
3. **Finance:** Avoid navigating to `/admin/invoices`, `/admin/subscriptions`, or the Manager dropdown in `OrganisatieSettings`, OR pre-pop the demo tenant with a few real rows so the hardcoded arrays aren't the only thing visible.
4. **Finance:** Update `Boekhouding.tsx:1469-1474` `RECURRING_ITEMS_ALL` to read from `supabase` or hide the tab for tenants with no contracts.
5. **Finance:** Make `MITAanvraag.tsx:184` signature line use the tenant's directorName from `governance` settings instead of a hardcoded "Sami Loukile".

---

_Scan run: 2026-05-10. Read-only — no files modified._
