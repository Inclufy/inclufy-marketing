# AMOS / Inclufy Marketing (mobile) — CLAUDE.md

**This file is the canonical context for any AI agent working in this repo.** Read it before publish-social / edge-function / capture work.

---

## 1. What this repo is

**AMOS** — the Inclufy Marketing **mobile app** (iOS + Android, Expo + React Native). Counterpart to the marketing-web SPA. Both share one Supabase backend.

- **Path on MacBook**: `~/Dropbox/Inclufy Marketing/Inclufy Marketing-main/` (yes, Dropbox-synced — historical)
- **Stack**: Expo SDK + React Native + Supabase JS client + Sentry
- **App identity**: `com.inclufy.amos` (or similar — see `app.json`)

---

## 2. ⚠️ Naming — read once, internalize

The product is called **"Inclufy Marketing"**. The mobile brand is **"AMOS"**. They refer to the same product, different names depending on context.

| Brand | Role | Repo | Path (MacBook) |
|---|---|---|---|
| **AMOS** *(this repo)* | Marketing mobile (iOS/Android) | `Inclufy/inclufy-marketing-mobile` | `~/Dropbox/Inclufy Marketing/Inclufy Marketing-main/` |
| **Marketing web** | Marketing web SPA | `Inclufy/inclufy-marketing-web` | `~/Projects/inclufy-marketing-web/` |

Common pitfalls:
- "AMOS is marketing **mobile**" — never call AMOS Finance, never call AMOS the web app.
- AMOS and marketing-web share ONE Supabase (`mpxkugfqzmxydxnlxqoj`), but live in TWO repos.
- Finance is a SEPARATE product (`Inclufy/inclufy-finance`, project `nruqfegrngpzoigflexn`) — don't conflate.

---

## 3. Shared Supabase project

- **Project ID**: `mpxkugfqzmxydxnlxqoj`
- **URL**: `https://mpxkugfqzmxydxnlxqoj.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/mpxkugfqzmxydxnlxqoj
- This repo OWNS the schema migrations (`supabase/migrations/`) and edge functions (`supabase/functions/`).
- Marketing-web is a CONSUMER of this Supabase — it doesn't define its own backend.

---

## 4. Edge functions

See `supabase/config.toml` for all functions + `verify_jwt` setting. Key ones:

| Function | verify_jwt | Purpose |
|---|---|---|
| `oauth-callback` | false | LinkedIn / Meta / TikTok / Pinterest OAuth landing |
| `publish-social` | true | This app's mobile client posts to social channels |
| `submit-post-for-approval` | true | Approval workflow author endpoint |
| `process-post-approval` | true | Admin/owner approves/rejects |
| `register-push-token` | true | Cold-start push token registration |
| `send-push` | false | Server-to-server push fan-out |
| `send-email` | false | Server-to-server Resend wrapper |
| `product-issues` | true | Issue submission |
| `product-issue-lifecycle` | false | DB trigger → Resend emails |
| `gdpr-export`, `gdpr-account-delete` | true | GDPR Art. 15 + 17 |
| `resend-webhook` | false | Resend delivery events |

---

## 5. Email + notifications

- Email backend: **Resend** (verified `inclufy.com` domain, EU region).
- Resend API key: named `AMOS` (token prefix `re_9NSdR6GJ...`). Stored as Supabase secret `RESEND_API_KEY`.
- Brand secrets: `APP_NAME=Inclufy Marketing`, `APP_BASE_URL=https://www.inclufy.com`.
- Admins / superadmins: `ADMIN_EMAILS` + `SUPERADMIN_EMAILS` (both `sami@inclufy.com`).
- Old `notify-issue-reported` Database Webhook was **deleted on 2026-05-12** — `product-issue-lifecycle` is now the sole notification path.

---

## 6. Sibling apps in Inclufy ecosystem

| Brand | Product | Repo | Supabase |
|---|---|---|---|
| **Marketing web** | Web SPA | `Inclufy/inclufy-marketing-web` | `mpxkugfqzmxydxnlxqoj` (shared with this repo) |
| **Inclufy Finance** | AI ERP | `Inclufy/inclufy-finance` | `nruqfegrngpzoigflexn` |
| **ProjeXtPal** | Project management | `Inclufy/projextpal` | n/a (own Postgres on Mac Studio) |

---

## 7. Mobile build + deploy

- EAS Build: `eas.json` defines `development`, `preview`, `production` profiles.
- App config: `app.json` (Expo).
- Sentry plugin: `@sentry/react-native` configured in `app.json`.
- Push: APNS (iOS) + FCM (Android) configured.
- iOS deploy: TestFlight via `eas submit -p ios --profile production`.
- Android deploy: Google Play via `eas submit -p android --profile production`.

Use the `mobile-deploy-engineer` agent for actual builds.

---

## 8. Sentry

- SDK: `@sentry/react-native ~7.11.0`.
- Init: `src/lib/sentry.ts` (called from app entry).
- DSN env: `EXPO_PUBLIC_SENTRY_DSN` (build-time, baked into bundle via EAS Build secrets or `eas.json` env).
- Source maps uploaded via `@sentry/react-native` Expo plugin.

---

## 9. Key features in this repo

- LiveCaptureScreen — event capture flow with AI generation
- PostReviewScreen — multi-channel preview before publish
- EventScannerScreen — QR / OCR event extraction
- HomeScreen / OpportunityFeedScreen / AnalyticsScreen
- AgentDetail / AgentRunDetail / MultiAgentScreen / AgentActivityTile
- CounterfactualNudge — agent suggests alternatives
- VoiceCommandSheet — voice control
- BoostFlowScreen — capture-to-ad flow
- IntegrationsScreen (fixed 2026-05-12 commit `2e8fc2a` — now reads live `useConnectedChannels()`)
- DemoEnvironmentScreen — explicit user-invoked seeder (MedFlow/BuildRight/CloudNexus — intentional, not mock data)
- FollowedOrganizersScreen — curated real orgs (ROC, KVK, Web Summit, GITEX, Slush)

---

## 10. Code patterns

- Real data via dedicated hooks: `useCaptures`, `useLibraryPosts`, `useEvents`, `useCampaigns`, `useContentProposals`, `useMarketingStrategy`, `useConnectedChannels`, `useAnalytics`
- Edge function calls via `supabase.functions.invoke()` with user JWT
- Avoid `useState([{...}])` mock seeds — every data-bearing screen should start from `[]` and load via hook
- `ChannelPreview` + `MockCard` are visual rendering primitives — "mock" describes the rendering style, NOT mock data

---

## 11. Agents available for this repo

- `amos-operational-tester` — end-to-end audit of capture → AI generation → PostReview → publish + Multi-Agent system. Reads-only on production code, writes findings to `product_issues` table via SQL seed file.
- `mobile-deploy-engineer` — App Store / Play Store releases
- `production-readiness-validator` — pre-release 10-pillar audit
- `data-leak-hunter` — RLS / cross-tenant check

---

## 12. Recent cleanup (2026-05-12)

- 1 P0 mock-data fix: `IntegrationsScreen.tsx` (`2e8fc2a`) — was hardcoded "0 connected", now reads OAuth state from `social_accounts` via `useConnectedChannels()`.
- Audit doc: `/tmp/amos-mock-data-audit-2026-05-12.md`
- The codebase is otherwise clean — no Sarah Johnson / Lorem ipsum stock data. All major screens wire to Supabase.

---

## 13. Old `notify-issue-reported` webhook — DO NOT recreate

The old Database Webhook `product-issues-to-support` (calling `notify-issue-reported`) was **manually deleted on 2026-05-12** because it caused duplicate emails alongside the new `product-issue-lifecycle` SQL trigger.

If you see duplicate magenta "AMOS by Inclufy" emails appearing again, it means someone re-created this webhook. Delete it again via Supabase dashboard → Integrations → Database Webhooks.

The `product-issue-lifecycle` SQL trigger (in `supabase/migrations/20260512160000_*`) provides the FULL lifecycle (INSERT + UPDATE), which is strictly more than what `notify-issue-reported` did.
