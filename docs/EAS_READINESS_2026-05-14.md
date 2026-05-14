# AMOS EAS Build Readiness — 2026-05-14 evening

Read-only audit. No builds triggered.

## 1. EAS config sanity

| Pillar | Status | Evidence |
|---|---|---|
| `eas.json` profiles | OK | `production` profile valid. `autoIncrement: true`. iOS Release config, Android `app-bundle`. Only env var is the `_COMMENT_SENTRY` doc string — no required vars referenced outside EAS Env Vars. Sentry auto-upload now enabled by default; the `SENTRY_DISABLE_AUTO_UPLOAD` flag is gone. If `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` are NOT yet set in the EAS Project Env Vars, the build still succeeds but the Sentry upload step will warn — verify in EAS dashboard. |
| `app.json` manifest | OK with one caveat | `name=AMOS`, `slug=inclufy-go`, `version=1.0.2`, `projectId=1e7b33cf...`. `expo-notifications` plugin entry present with icon `./assets/icon.png` + color `#A855F7` (matches memory). `privacyPolicyUrl` + `supportUrl` correctly nested under `expo.extra` — but **these are not standard Apple metadata fields**; ASC dashboard fields are independent. The audit memo from this morning notes Apple wants them in App Store Connect, not the manifest. Verify in ASC. |
| `ios.buildNumber` monotonicity | OK | HEAD = `273`. Last committed value was `265` (commit `0e28ad9`, bumped from `211→265`). 273 > 265 > most recent TestFlight build (271, commit `a2e76ea`). Safe. |
| `android.versionCode` | OK | HEAD = `100`. Last committed value was `3` (commit `ba5c2b0` bumped `4→100` to clear a Play Internal Test track conflict at vc=7). 100 is safely above the Play track. No bump needed for this build. `autoIncrement: true` in EAS will further bump it for THIS build. |

## 2. Build prerequisites

| Check | Status | Evidence |
|---|---|---|
| `npm install` | OK | `npm ls expo-notifications` resolves to `55.0.20` (matches package.json range `~55.0.20`). Lockfile contains the entry. No peer-dep drift surfaced. |
| `expo-doctor` (per morning audit) | WARN | 16/18 pass (improved from 15/18 after the app.json fix). Remaining: non-CNG prebuild + 19 out-of-date packages (patch). Non-blocking for EAS — does not fail the build. |
| iOS provisioning | UNCONFIRMED from repo | `ascAppId=6760412100`, `appleTeamId=3238TB3BMF`, `appleId=s.loukile@eprocure.eu` all set in `eas.json`. **The user instructions say `ascAppId=6759970089` for AMOS — `eas.json` has `6760412100`. This is a discrepancy worth checking before submit.** Cert/profile validity must be verified via `eas credentials` (not run here). |
| Android keystore + service account | WARN | `eas.json` `submit.production` has NO `android` block. Auto-submit to Play Store will be skipped (manual upload required). Documented in morning audit as acceptable, but means we are NOT pushing Play tonight even if iOS goes. |
| TypeScript | OK | `npx tsc --noEmit` returned no errors (per morning audit run, no source files changed for `.ts` since). |

## 3. Build-time risks introduced today

- **`expo-notifications` plugin**: present in `app.json` with icon + purple `#A855F7` color. Plugin entry is correct. `usePushNotifications.ts` uses `await import('expo-notifications')` so the web bundle skips the native module. iOS bundling will include it (intended).
- **`usePushNotifications` wiring**: `App.tsx:18` imports, `App.tsx:65` calls inside `AppInner`. Safe: bails on `Platform.OS === 'web'`, bails when no session, idempotent per-user. Errors are caught and logged, not thrown.
- **New i18n keys** (`postApproval` namespace, 22 keys): present in all three locale files (`nl.ts`, `en.ts`, `fr.ts` — 1 match each via `grep -c`). No `t('postApproval.X')` calls will hit a missing-key fallback at runtime in any of the three locales. Not validated: whether all 22 keys are referenced (unused-key noise only, not a build failure).
- **Edge functions** (`notify-issue-reported`, `submit-post-for-approval`, `process-post-approval`): all present in `supabase/functions/`. Referenced from `src/hooks/useNotifications.ts` and `src/hooks/usePostApproval.ts` only via `supabase.functions.invoke(...)` — they are NOT bundled into the mobile binary. Safe.
- **`PostReviewScreen.tsx` = 3928 lines**: large file, but it was already present and edited (not new). No new native deps introduced by today's changes.
- **`StepConnect.tsx` FB scope**: confirmed `ads_management` added to BOTH facebook and instagram scope arrays in `src/components/wizard/StepConnect.tsx`. Meta App Review for this scope is still pending (per `boost-post` edge function — dry-run gated on `META_ADS_API_LIVE`). Asking for an unapproved scope at OAuth time will show users a "this app has not been approved" Meta consent screen — not fatal, but UX-noisy and a credibility risk in a demo.

## 4. Submit pipeline

- iOS auto-submit: `eas build ... --auto-submit` will hit ASC app `6760412100` (verify this matches the real AMOS ASC record — memory says `6759970089`).
- App Store Connect metadata (Privacy Policy URL, Support URL) must be set in the ASC dashboard. The `extra.privacyPolicyUrl`/`extra.supportUrl` in `app.json` are NOT read by Apple — they're free-form `extra:` fields.
- Android: no submit config → manual `.aab` upload to Play Console if needed.

## Top 3 risks of pushing tonight

1. **App Review trips on `ads_management` scope** — adding it today without the Meta App Review approval landed means the FB/IG OAuth flow will show an "unapproved scope" warning. App Review reviewers regularly click through Connect flows; this can lead to a "guideline 5.0 — Legal" or "2.5.4 — incomplete OAuth flow" rejection. Risk grade: medium.
2. **`PostReviewScreen` is freshly edited (3928 lines) + new approval hook** — any runtime crash in the 3-way CTA path that Sami did not exercise locally will land in production. With Sentry source-maps possibly unconfigured (depending on EAS Env Vars state), the stack will be minified and undebuggable. Risk grade: medium.
3. **`ascAppId` mismatch** — `eas.json` has `6760412100`, project memory says `6759970089`. If the wrong ID is used, the submit step will fail OR (worse) upload to the wrong app record. Risk grade: low-medium, but easy to verify in 2 minutes.

## Recommended action

**WAIT until morning.** Reasons:
- The new push/approval UI has not been exercised end-to-end on a real device. A late-night TestFlight push with 3928-line screen edits + new edge-function-dependent hook is the kind of build that surfaces a crash at 09:30 the next day.
- Tomorrow's demo can run on the **existing TestFlight build (271)** — Sami already has a working binary on his device. The new approval/push UX is value-add, not demo-critical (confirm with Sami).
- The `ascAppId` discrepancy + Sentry Env Var state should be verified in daylight, not in a tired evening push.
- If push IS needed tomorrow: have Sami run `eas build --platform ios --profile production --auto-submit --non-interactive` himself in the morning after he's done a 5-min local smoke test of PostReviewScreen + NotificationsScreen in the simulator. That way he owns the binary.

If, after re-reading this, you decide the new push/approval UX is genuinely required for tomorrow's demo: push tonight but DO NOT auto-submit. Build only (`--no-wait` off so you can review the log), inspect TestFlight processing, then manually promote in the morning.

Skip the new build entirely if Sami confirms he is demoing existing features only.
