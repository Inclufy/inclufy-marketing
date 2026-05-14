# Inclufy — Production Readiness Assessment (Demo Eve)
**Date:** 2026-05-14 21:30
**Auditor:** production-readiness-validator agent
**Scope:** AMOS (Inclufy Marketing mobile) + Inclufy AI Finance (web + mobile)
**Context:** Live paying-customer demo TOMORROW. Shipmentstoday: email pipeline, native push, approval gate, Capture-to-Ad Boost, 3-tier backup.

---

## Executive Summary

| App | Verdict | Blockers | Warnings | Score |
|-----|---------|----------|----------|-------|
| AMOS | DEMO-ONLY | 0 P0-functional, 2 P0-operational | 6 | 6/8 pillars pass |
| Finance | DEMO-ONLY | 0 P0-functional, 3 P0-operational | 7 | 5/8 pillars pass |
| Ecosystem (Pillar 9) | WARN | 0 | 2 | 2/3 checks |
| **Total** | **DEMO-ONLY** | **5 P0-operational** | **13** | — |

**Demo-ready: YES** — both apps are functionally sound for tomorrow.
**Production-ready (24/7 unattended): NO** — Pillar 10 P0 gaps (uptime monitor missing on Finance, Sentry source-maps disabled on both, Finance mobile tests broken).

---

## Per-App Detail

---

### AMOS (Inclufy Marketing Mobile)

**Verdict: DEMO-ONLY** — Functionally solid. Operational gap: Sentry source-maps disabled in production EAS profile; 2 unpushed commits to gitlab/main risk CI drift if Xcode Cloud triggers before push.

| Pillar | Status | Evidence |
|--------|--------|----------|
| 1. Build/TS | PASS | `npx tsc --noEmit` → 0 errors (run 2026-05-14). `expo-doctor` 15/18 pass; 3 fails are patch-version mismatches + non-CNG prebuild warning (see Warn 1 below). No merge conflicts. |
| 2. Git state | WARN | `git status` shows 3 modified `supabase/.temp/` files (auto-generated, not source code — OK to ignore for release). 2 unpushed commits (`5fa4a7b`, `2e8fc2a`) present on local `main` not yet on `gitlab/main` (github/main is in sync). |
| 3. CI/CD | PASS | `.github/workflows/ci.yml` has `typecheck-mobile` + `test-mobile` jobs. `npm test -- --ci` is the correct flag. Xcode Cloud present (`ios/ci_scripts/ci_post_clone.sh`). `eas.json` has `production` profile with `autoIncrement:true`. |
| 4. App Store | PASS | `version: 1.0.2`, `ios.buildNumber: 273`, `android.versionCode: 100`. `privacyPolicyUrl` + `supportUrl` set. All iOS `infoPlist` privacy strings present. `ITSAppUsesNonExemptEncryption: false`. `ascAppId: 6760412100` + `appleTeamId: 3238TB3BMF` set. Android submit config empty `{}` (manual upload — documented, acceptable). |
| 5. Tests | WARN | `npm test -- --ci --testPathIgnorePatterns=.claude`: 3 passed, 1 skipped, **71 passed / 10 skipped**. `useCaptures.test.ts` skipped with explicit `describe.skip` + TODO (commit `e4b7d98` — uploadMedia switched to `FileSystem.uploadAsync`, mocks stale). AI service + capture-pipeline + dateHelpers pass clean. 0 test failures on source files. |
| 6. Security | WARN | No hardcoded service-role key in source. `EXPO_PUBLIC_*` + anon JWT in `eas.json` are public-by-design (D.2 rule — not a blocker). `.env.local` present on disk with permissions `-rw-rw-r--` (mode 664 — should be 600). GDPR: `gdpr-account-delete` + `gdpr-export` edge functions deployed (commit `9278258`, `b11bd0d`). `audit_logs` table has RLS (select + insert, append-only). 22/45 migrations without explicit RLS — but spot-check confirms most are ALTER/INDEX files, not new table creations; `audit_logs` is the only new table found without RLS in those 22. Sentry initialized in `src/lib/sentry.ts` via `EXPO_PUBLIC_SENTRY_DSN` — but DSN not confirmed in `.env.local`. |
| 7. Backend | WARN | 45 Supabase migrations present, latest: `20260512160000_product_issue_lifecycle_trigger.sql`. Edge functions: 32 deployed. No Django — correct. `oauth-callback: verify_jwt=false` (correct). Cloudflare Worker at `workers/media-proxy-router/` — no CI deploy step (drift risk acknowledged in topology docs). |
| 8. Deploy | PASS | Mobile deploys via Xcode Cloud (gitlab/main trigger) + EAS. `backup-database.sh` + `restore-database.sh` present and executable. 3-tier cron scheduled (daily 03:00, weekly Sunday 04:00, monthly 05:00). iCloud LaunchAgent `com.inclufy.supabase-backup.plist` loaded (`launchctl list` confirms pid=-,status=0). |

**Blockers (P0 — must resolve before production, not necessarily before demo):**

None that block the demo itself. The following block the transition from demo to production:

1. [P10.8 / P0-oper] `SENTRY_DISABLE_AUTO_UPLOAD: true` in `eas.json:build.production.env` — source maps never uploaded. Production crashes show minified stack traces, debugging a live-customer incident is guesswork. `eas.json:L9`. Time-to-fix: 30 min (set `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` in EAS Env Vars, remove the disable flag).

2. [P10.4 / P0-oper] No external uptime monitor confirmed for the Supabase edge functions / AMOS API surface. The LaunchAgent backup is set to run at 03:00 — but backup ≠ monitoring. If the Supabase project goes degraded, no alert fires. Time-to-fix: 30 min (UptimeRobot free tier → monitor `https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/publish-social`).

**Warnings (P1 — fix this week):**

1. [W-P1] `expo-doctor`: `app.json` has `privacyPolicyUrl` + `supportUrl` as top-level Expo fields, but Expo schema rejects them (should be nested under `expo`). `expo-doctor:Check Expo config schema` fails. EAS Build still works (it reads the raw file), but this is a lint error that can confuse tooling. File: `app.json` root level vs `expo.privacyPolicyUrl`. Time-to-fix: 5 min.

2. [W-P1] `expo-doctor`: 19 packages out of date (patch-level). Key ones: `expo` 55.0.17 vs expected 55.0.24, `expo-camera` 55.0.16 vs 55.0.18. Not breaking, but stale deps accumulate security risk. Time-to-fix: `npx expo install --check` (~30 min).

3. [W-P1] 2 commits (`5fa4a7b docs: add CLAUDE.md`, `2e8fc2a fix(integrations): wire IntegrationsScreen`) unpushed to `gitlab/main` (though pushed to `github/main`). If someone triggers an Xcode Cloud build from gitlab before you push, it builds the older commit. Time-to-fix: 5 min (`git push gitlab main`).

4. [W-P1] `.env.local` file permissions are `664` (group-writable). Should be `600`. `ls -la .env.local`. Time-to-fix: 2 min (`chmod 600 .env.local`).

5. [W-P1] `useCaptures.test.ts` skipped suite — 9 tests covering `uploadMedia` MIME detection are not running. Known stale mock issue (commit `e4b7d98`). The `describe.skip` is intentional but the rewrite is outstanding. Not a demo blocker, but a CI quality gap. Time-to-fix: 2h (rewrite mocks to `FileSystem.uploadAsync`).

6. [W-P2] GitLab CI (`.gitlab-ci.yml`) does not have a `test-mobile` job — only `typecheck:mobile`. Xcode Cloud trigger repo has weaker CI gate than GitHub. Time-to-fix: 30 min (mirror the GitHub `test-mobile` job to `.gitlab-ci.yml`).

---

### Inclufy AI Finance

**Verdict: DEMO-ONLY** — Functionally strong (web + mobile build clean, CI passes, Supabase backend healthy). Three operational gaps block production: Finance mobile jest binary missing (tests fail with `jest: command not found`), Sentry source-maps explicitly disabled, no GDPR right-to-erasure function. Demo works; 24/7 unattended production does not.

| Pillar | Status | Evidence |
|--------|--------|----------|
| 1. Build/TS | WARN | Web `npx tsc --noEmit` → 0 errors. `npm run build` exits 0, but `index-CZvhEUqE.js` = **1,079 kB** (gzip 324 kB) and `vendor-charts-r2EOXKc0.js` = 579 kB. Known H.1 pattern. Finance mobile `npx tsc --noEmit` → TS errors in `mobile/src/utils/__tests__/offlineStorage.test.ts` (TS2582 `cannot find name 'it'`, TS2307 missing `@react-native-async-storage/async-storage` types, `tsconfig.json: expo/tsconfig.base not found`). `expo-doctor` fails with `expo config --json exited with non-zero code`. |
| 2. Git state | PASS | `git status`: only `supabase/.temp/cli-latest` modified (auto-generated). 10 untracked files: `e2e/*.spec.ts` (new E2E specs), `finance-seed.cjs/js`, `public/inclufy-logo.png`, `public/logo-light.svg`. No unpushed commits. HEAD on `main`. |
| 3. CI/CD | PASS | `.github/workflows/ci.yml` has `lint`, `test` (vitest), `e2e` (playwright), `build`, `docker` (builds + pushes to `ghcr.io` on main). Docker job present — no CI-only-on-local-host risk (10.6 pass). Finance mobile CI: no separate mobile CI job in this repo. |
| 4. App Store | BLOCK | `mobile/app.json`: `privacyPolicyUrl: null`, `supportUrl: null` — Apple will reject if these are empty in the binary metadata at next review. `ios.buildNumber: 64`, `android.versionCode: 1` (low but valid). `ascAppId: 6759970089` + `appleTeamId: 3238TB3BMF` set (iOS auto-submit capable). No Android `serviceAccountKeyPath`. |
| 5. Tests | BLOCK | Web: `npm test` (vitest) → 1 file failing, 5 tests: `src/lib/__tests__/instrumentDeadlines.test.ts` — off-by-one error in `presentationDeadline()` (`addDays(parseISO("2026-05-01"), 20)` returns `2026-05-20`, test expects `2026-05-21`). This is a **financial calculation test** (cheque/LCN deadline math under Code de Commerce art. 268). Showing wrong dates to a customer is a credibility risk. Mobile: `jest: command not found` in `mobile/` — jest binary not installed, no node_modules/.bin/jest. 10 untracked E2E specs not committed to git — CI runs `test:e2e` against only committed files, so these tests never run on CI. |
| 6. Security | WARN | No service-role key hardcoded in source (edge functions all use `Deno.env.get`). `.env` on disk but `.env.production` + `.env.staging` covered in `.gitignore`. `.env` permissions: `-rw-r--r--` (644 — readable by all users on the machine). Sentry initialized in `src/lib/sentry.ts` + `mobile/src/lib/sentry.ts` but `VITE_SENTRY_DSN` in `.env.example` is placeholder (`https://your_sentry_dsn@sentry.io/project_id` — not a real DSN). GDPR: `CookieConsent.tsx` present, `Footer.tsx` has privacy policy link, but **no `gdpr-account-delete` or data-erasure edge function found** in Finance's supabase/functions. `accountant-export` exists but exports accountant data bundles, not a user Art.17 delete flow. This is a GDPR gap for EU customers. |
| 7. Backend | PASS | 225 migrations present, most recent: `20260510160000_user_devices_push.sql` — `user_devices` has `alter table ... enable row level security` + `create policy user_devices_own`. Recent new tables (past 30 days) all have RLS. Stripe webhook `verify_jwt=false` (correct for Stripe). AI functions all `verify_jwt=true`. Edge functions: 55 total. Cron backup scheduled (03:30 daily, Sunday 04:30 weekly). |
| 8. Deploy | WARN | `Dockerfile` present, builds nginx static serve. `ghcr.io` push automated in CI. No `docker-compose.prod.yml` found — no container orchestration config for production host. Health check present in `Dockerfile` (`HEALTHCHECK CMD wget ... http://localhost/`). No `/api/health` endpoint in source. `.env.example` present. Sentry DSN is placeholder in `.env.example`. |

**Blockers (P0 — must resolve before production):**

1. [P5 / P0-functional — DEMO RISK] `instrumentDeadlines.test.ts` 5 failures: `presentationDeadline()` is off by 1 day for cheques, cheque_certifie, LCN, billet_ordre. File: `src/lib/__tests__/instrumentDeadlines.test.ts:21`. The function returns `2026-05-20` when `2026-05-21` is correct (20-day rule). If this calculation is used in any UI shown to the customer tomorrow, they will see wrong deadlines. Time-to-fix: 30 min (either fix `instrumentDeadlines.ts` boundary logic or verify the test expectations are wrong — needs code review first).

2. [P4 / P0-functional] Finance mobile `privacyPolicyUrl: null` and `supportUrl: null` in `mobile/app.json`. Apple requires these to be present for App Store review. Not blocking the demo but blocks the next App Store submission. File: `mobile/app.json`. Time-to-fix: 5 min.

3. [P10.8 / P0-oper] `SENTRY_DISABLE_AUTO_UPLOAD: true` in `mobile/eas.json:build.production.env` AND `mobile/eas.json:build.preview.env`. Source maps never uploaded. `VITE_SENTRY_DSN` in `.env.example` is a placeholder — Sentry not actually configured for web either. Crashes in production are unobservable. Time-to-fix: 30 min (configure real DSN in EAS Env Vars and Vite env, remove disable flag).

4. [P6 / P0-oper — GDPR, EU customer] No right-to-erasure (Art. 17) function in Finance. AMOS has `gdpr-account-delete`; Finance does not. Showing this product to an EU paying customer without a deletion path is a GDPR compliance gap. Time-to-fix: 2–4h (deploy mirror of AMOS `gdpr-account-delete` adapted for Finance tables).

5. [P10.4 / P0-oper] No external uptime monitoring found for Finance web or Finance Supabase. Docker container running the web app: none detected (`docker ps` shows no finance containers). If the web app is served via Cloudflare Pages / Vercel / another host — unconfirmed. Outages go undetected. Time-to-fix: 30 min.

**Warnings (P1 — fix this week):**

1. [W-P1] Finance web bundle: `index-CZvhEUqE.js` = 1,079 kB single chunk (above 1 MB threshold, H.1 blocker pattern). Demo on a good WiFi is fine; on a customer's 4G/VPN it loads slowly. Time-to-fix: 4h (add `manualChunks` in `vite.config.ts` + `React.lazy` per route).

2. [W-P1] Finance mobile `tsconfig.json` cannot find `expo/tsconfig.base` + missing `@react-native-async-storage/async-storage` types. `expo-doctor` exits with error. This means the mobile TypeScript compiler config is broken. Expo Build (EAS) uses its own transform pipeline and may still succeed, but the development ergonomics are broken. File: `mobile/tsconfig.json:2`. Time-to-fix: 30 min (`npm ci` in mobile/ to install node_modules, or pin `expo/tsconfig.base` path correctly).

3. [W-P1] Finance mobile jest binary not installed. `npm test` → `jest: command not found`. Mobile tests cannot run at all. File: `mobile/package.json` scripts. Time-to-fix: 30 min (`npm ci` in `mobile/` directory).

4. [W-P1] 10 E2E spec files untracked (`e2e/*.spec.ts`). CI runs `npm run test:e2e` on committed files only — these test files never run on CI. Either commit them or gitignore them. Time-to-fix: 30 min (review + `git add e2e/`).

5. [W-P1] `.env` on disk with permissions `644` (world-readable). Should be `600`. Time-to-fix: 2 min.

6. [W-P2] No staging environment found (no `docker-compose.staging.yml`, no `.env.staging` in repo). All changes go directly to production. Time-to-fix: 4–8h (initial setup).

7. [W-P2] No DR runbook for Finance (AMOS has `docs/PRODUCTION_BACKUP_RUNBOOK.md`; Finance has none). Time-to-fix: 1h.

---

## Pillar 9 — Ecosystem Cross-Cutting

| Check | Status | Evidence |
|-------|--------|----------|
| 9.1 Mobile test scripts | WARN | AMOS: `npm test` script present + 3 passing suites (81 tests, 10 skipped). Finance mobile: `npm test` script present but `jest: command not found` — binary not installed. 1/2 mobile apps have working tests. |
| 9.2 Branch consistency | PASS | AMOS: `main`. Finance: `main`. Both apps on `main`. |
| 9.3 Untracked production artifacts | WARN | AMOS: 0 untracked SQL migrations or duplicate `app.json`. `campaigns/` directory untracked (marketing content, not production artifact — classify `gitignore-required` or `commit-required`). Finance: 10 untracked files: `e2e/*.spec.ts` (classify `commit-required`), `finance-seed.cjs/js` (classify `commit-required` if needed for demo, `gitignore-required` if dev-only), `public/inclufy-logo.png` + `public/logo-light.svg` (classify `commit-required` — these are production assets). No duplicate `app.json` on root (Finance only has `mobile/app.json`). |

**Ecosystem actions:**
- [P9.1 / 30 min] Run `npm ci` in `mobile/` of Finance to install jest binary.
- [P9.3 / 15 min] Finance: commit `public/inclufy-logo.png` + `public/logo-light.svg` before the demo — missing assets cause broken images in production.
- [P9.3 / 15 min] Finance: decide and commit or gitignore `e2e/` specs.

---

## Pillar 10 — Operational & Production Hardening

| Sub-check | Severity | Status | Evidence + time-to-fix |
|-----------|----------|--------|------------------------|
| 10.1 Automated DB backups | P0 | PASS | `crontab -l` confirms: AMOS daily 03:00, weekly Sunday 04:00, monthly 05:00. Finance daily 03:30, weekly 04:30, monthly 05:30. Scripts executable (`-rwxr-xr-x`). `PRODUCTION_BACKUP_RUNBOOK.md` present in AMOS docs. |
| 10.2 Off-site backup copies | P0 | PASS | LaunchAgent `com.inclufy.supabase-backup.plist` loaded (`launchctl list` shows `com.inclufy.supabase-backup` with status 0, run 2026-05-14). Covers both AMOS + Finance to iCloud. |
| 10.3 Host auto-start on reboot | P0 | WARN | Docker daemon running (`docker info` responds). `defaults read com.docker.docker` did not return autostart setting — user must confirm Docker Desktop "Start Docker Desktop when you log in" is enabled. Finance web not containerized locally (no running containers found). |
| 10.4 Uptime monitoring + alerting | P0 | BLOCK | No external monitor config found in any workflow or config file for either app. `echo` placeholder only. Both apps lack confirmed external monitor. Time-to-fix: 30 min per app (UptimeRobot free tier). |
| 10.5 No stale bind-mounts | P0 | PASS | `docker ps -a` returned no running containers with Finance/AMOS names. No stale bind sources to flag. |
| 10.6 Backend image built in CI | P1 | PASS | Finance `.github/workflows/ci.yml` has `docker/build-push-action@v5` job pushing to `ghcr.io` on `main` push. AMOS is mobile-only — no backend image needed. |
| 10.7 SSL redirect at app layer | P1 | WARN | AMOS: no Django — Supabase enforces HTTPS. Finance web: Vite/nginx static serve — HTTPS enforced by Cloudflare edge (assumed) but no `Strict-Transport-Security` header in `nginx.conf` confirmed. User must verify Cloudflare "Always Use HTTPS" is on for the Finance domain. |
| 10.8 Sentry source-map upload | P1 | BLOCK | AMOS `eas.json:build.production.env.SENTRY_DISABLE_AUTO_UPLOAD: true`. Finance `mobile/eas.json:build.production.env.SENTRY_DISABLE_AUTO_UPLOAD: true`. Finance web `VITE_SENTRY_DSN` = placeholder in `.env.example`. Source maps never uploaded anywhere. Production crashes untraceable. Time-to-fix: 30 min each. |
| 10.9 Per-user rate limits on AI endpoints | P1 | WARN | Finance has 10+ AI edge functions (ai-copilot-chat, ai-pipeline-orchestrator, ai-workflow-orchestrator, etc.) — all `verify_jwt=true` (authenticated). No Supabase function-level rate limits found in `supabase/config.toml`. A single compromised JWT can drain OpenAI/Anthropic budget. AMOS has similar exposure. Time-to-fix: 30 min (Supabase function invocation limits via Dashboard). |
| 10.10 Cloudflare Authenticated Origin Pulls | P1 | UNCONFIRMED | Cannot detect from code. User must confirm in Cloudflare dashboard SSL/TLS > Origin Server > Authenticated Origin Pulls for both app domains. |
| 10.11 Staging environment | P1 | BLOCK | No staging environment found for either app. All changes go directly to production. Finance: no `docker-compose.staging.yml`. AMOS: no staging EAS profile. Time-to-fix: 4–8h initial setup (can defer to first week post-launch). |
| 10.12 GDPR / privacy compliance | P1 | WARN | AMOS: `gdpr-account-delete` + `gdpr-export` present. `CookieConsent` not confirmed in mobile (native app — not required). Privacy policy URL set. Finance web: `CookieConsent.tsx` present, `Footer.tsx` has privacy links. BUT: no Art.17 deletion function in Finance supabase functions. Sub-processor list not found in either repo. Time-to-fix: 2–4h. |
| 10.13 Encrypted secret store | P2 | WARN | `.env.local` (AMOS) permissions `664`. `.env` (Finance) permissions `644`. Plaintext files, not 600. No 1Password/Vault/AWS Secrets Manager integration found. Time-to-fix: 2 min (`chmod 600`) for immediate risk; full secret-manager integration 1–2 days. |
| 10.14 Disaster recovery runbook | P2 | WARN | AMOS: `docs/PRODUCTION_BACKUP_RUNBOOK.md` present (covers backup/restore). Finance: no DR runbook found. Neither covers: certificate expiry, Cloudflare outage, App Store rejection rollback. Time-to-fix: 1h. |
| 10.15 Log aggregation | P2 | BLOCK | No Loki/Datadog/Vector containers running. No logging driver override in any compose file. Supabase edge function logs live in Supabase Dashboard (ephemeral). Finance nginx container logs in container memory only. Time-to-fix: 2h (Datadog free tier or Supabase log drain to external store). |
| 10.16 App Store privacy labels | P2 | UNCONFIRMED | Cannot detect from code. User must confirm App Store Connect > App Privacy and Google Play Console > Data Safety are filled and approved for both apps. |

**Pillar 10 verdict:** 3 P0 items are RED (uptime monitoring, Sentry source-maps, staging). All P0 physical-infrastructure items (backups, off-site, Docker daemon) are GREEN. The demo can proceed; production 24/7 cannot launch until P0 items are cleared.

---

## Go/No-Go Decision

### AMOS
**Demo-ready: YES**
**Production-ready (24/7): NO**
- P0 blockers for production: uptime monitoring (10.4), Sentry source-maps (10.8)
- P0 for next App Store submission: none beyond current warnings
**Recommended action: GO FOR DEMO, GO-AFTER-FIXES for production**
**Estimated P0 fix time for production: ~1.5h**
**Earliest production go-live: 2026-05-15 after fixing items P10.4 + P10.8**

### Finance
**Demo-ready: YES** — with caveat: verify `instrumentDeadlines.ts` off-by-one before showing cheque/LCN deadline screen to customer (5 min check).
**Production-ready (24/7): NO**
- P0 blockers for production: `instrumentDeadlines` off-by-one (if shown in demo UI), GDPR Art.17 missing, Sentry unconfigured, uptime monitoring missing
**Recommended action: GO FOR DEMO (with instrumentDeadlines caveat), GO-AFTER-FIXES for production**
**Estimated P0 fix time for production: ~4–6h** (GDPR erasure endpoint is the longest item)
**Earliest production go-live: 2026-05-16 after clearing P0 items**

### Sign-off required from
- Product: demo flow confirmed working end-to-end
- Security: Sentry DSN configured + source-maps enabled before production
- Legal/DPO: Finance GDPR Art.17 deletion endpoint before broad EU customer access

---

## Recommended Release Order
1. AMOS — fix 2 P0-operational items (~1.5h), then GO
2. Finance — fix instrumentDeadlines + GDPR + Sentry (~5h), then GO

---

## Quick Action List for Demo Eve (2026-05-14 tonight)

### Critical for demo credibility (do NOW):
- [ ] (5 min) Verify Finance `instrumentDeadlines.ts` — does it show cheque/LCN deadlines in any customer-facing screen tomorrow? If yes, fix the off-by-one before demo. `src/lib/instrumentDeadlines.ts:addDays(parseISO(input.issue_date), 20)` — check if this should be `addDays(parseISO(input.issue_date), 20)` returning the 21st day (inclusive vs exclusive debate).
- [ ] (5 min) Push AMOS commits to gitlab/main: `git push gitlab main` from AMOS repo.
- [ ] (15 min) Finance: `cd mobile && npm ci` to install jest binary + fix TypeScript errors before any mobile build.
- [ ] (5 min) Finance: commit `public/inclufy-logo.png` + `public/logo-light.svg` — missing assets = broken images during demo.

### For this week (post-demo production hardening):
- [ ] (30 min) Set up UptimeRobot monitors for both Supabase endpoints.
- [ ] (30 min) AMOS: configure real Sentry DSN in EAS Env Vars, remove `SENTRY_DISABLE_AUTO_UPLOAD=true`.
- [ ] (30 min) Finance: configure real Sentry DSN (web + mobile), remove `SENTRY_DISABLE_AUTO_UPLOAD=true`.
- [ ] (2–4h) Finance: build `gdpr-account-delete` edge function (mirror AMOS pattern).
- [ ] (5 min) Finance `mobile/app.json`: set `privacyPolicyUrl` + `supportUrl`.
- [ ] (5 min) Both: `chmod 600 .env.local .env`.
- [ ] (5 min) AMOS `app.json`: move `privacyPolicyUrl` + `supportUrl` inside the `expo` key.

---

*Read-only audit — no commits, pushes, builds, or deployments were triggered by this agent.*
