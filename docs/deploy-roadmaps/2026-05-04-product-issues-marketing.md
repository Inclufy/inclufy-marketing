# Deploy Roadmap — Product Issues (Marketing/AMOS web + mobile)

**Datum**: 2026-05-04
**Repo**: `InclufyMarketing`
**Branch**: `main`
**Type**: Supabase migration + 1 nieuwe edge function + Next.js Copilot UI + AMOS mobile shake-to-report
**Owner agent**: `issue-triage-validator` (`~/.claude/agents/issue-triage-validator.md`)
**Reference implementation**: ProjeXtPal `a1085d99` + Finance `c3b601f` (2026-05-04)

---

## Wat wordt uitgerold

### Backend (Supabase)
- **Migration** `20260504170000_product_issues.sql`
  - `product_issues` table — module_context (campaigns/library/studio/whatsapp/analytics/personas/etc.), category, severity, priority, classification, status, environment (jsonb), error_trace, attachments, reproduction_log, triage metadata
  - `product_issue_comments` table — chat thread for agent + human triage
  - **RLS via `organization_members`**: SELECT/INSERT org-members, UPDATE org-admins/owners, service-role full access
  - Indexes on org/status/created, category/priority, source, module
- **Edge function** `product-issues/index.ts` (identiek aan Finance):
  ```
  POST /product-issues/                          user create
  POST /product-issues/{id}/triage               agent posts result
  POST /product-issues/{id}/comment              thread
  POST /product-issues/auto/ci                   CI auto-POST (X-Inclufy-CI-Token)
  ```

### Web frontend (Next.js)
- **Helper** `web/src/lib/copilotIssues.ts` — createIssue/listRecentIssues/addComment + module-detection map (`/campaigns`, `/library`, `/events`, `/personas`, `/analytics`, …) + auto-environment capture
- **Component** `web/src/components/copilot/IssuesTab.tsx` — list/form modes, paste-screenshot, file-upload (≤5 MB), sonner toasts
- **Modified** `web/src/app/(app)/copilot/page.tsx` — 2-tab structuur (Chat + Issues)

### AMOS mobile (Expo + React Navigation)
- **Hook** `src/hooks/useShakeToReport.ts` — accelerometer 10 Hz, ≥2 spikes >1.8 g binnen 700 ms, 2 s cooldown
- **Service** `src/services/issuesService.ts` — supabase auth + edge function POST + module-detection per route
- **Component** `src/components/ShakeReportSheet.tsx` — bottom-sheet form met MaterialCommunityIcons + screenshot picker
- **Modified** `App.tsx` (AppInner) — global shake-detector + sheet, gated on session+biometric+sheet-closed

### Commits in scope
- Web: `9e1afc1` — feat(product-issues): Marketing-port Phase 2c
- Mobile: `f259761` — feat(amos-mobile-shake): hands-free issue reporting

---

## Pre-deploy gates

| Gate | Command | Pass-criterium |
|---|---|---|
| 1. Deno type-check | `deno check supabase/functions/product-issues/index.ts` | exit 0 |
| 2. Web TypeScript | `cd web && npx tsc --noEmit` | enkel pre-existing fouten in `integrations/page.tsx` + `sentry.ts` (niet-gerelateerd) |
| 3. Mobile TypeScript | `npx tsc --noEmit` | exit 0 |
| 4. Migration syntax | `supabase db lint --schema public` (best-effort, of psql dry-run) | geen syntax errors |
| 5. Data-leak-hunter | `~/.claude/agents/data-leak-hunter.md` op gewijzigde files | 0 P0, RLS aanwezig |

## Pre-deploy code-checks

```bash
cd /Users/samiloukile/InclufyMarketing

deno check supabase/functions/product-issues/index.ts

cd web && npx tsc --noEmit; cd ..

npx tsc --noEmit
```

---

## Deploy stappen

### A. Supabase backend (productie)

```bash
cd /Users/samiloukile/InclufyMarketing

# 1. Set CI-token env (eenmalig)
supabase secrets set PRODUCT_ISSUES_CI_TOKEN=$(openssl rand -hex 32) \
  --project-ref mpxkugfqzmxydxnlxqoj

# 2. Apply migratie naar prod
supabase db push --project-ref mpxkugfqzmxydxnlxqoj

# 3. Deploy edge function
supabase functions deploy product-issues --project-ref mpxkugfqzmxydxnlxqoj
```

### B. Web frontend (Vercel of GitLab CI)

Marketing web wordt deployed via de GitLab CI of Vercel — push naar `main` is voldoende voor auto-deploy. Geen extra actie nodig: commit `9e1afc1` is al op GitHub `main`.

```bash
# Sync naar GitLab (= productie-trigger)
git push gitlab main
```

### C. AMOS mobile (TestFlight + Android)

```bash
cd /Users/samiloukile/InclufyMarketing

# iOS production naar TestFlight (auto-submit)
eas build --platform ios --profile production --auto-submit --non-interactive

# Android AAB voor Play Store
eas build --platform android --profile production --non-interactive
```

Build duurt 15-30 min. Auto-submit-step duurt nog 5-10 min Apple-side processing.

---

## Post-deploy smoke-test

### 1. Supabase migratie geslaagd
```bash
PGPASSWORD=$(supabase projects api-keys --project-ref mpxkugfqzmxydxnlxqoj --output json | jq -r '.[] | select(.name=="service_role") | .api_key') \
  psql "postgres://postgres@db.mpxkugfqzmxydxnlxqoj.supabase.co:5432/postgres" \
  -c "SELECT count(*) FROM product_issues; SELECT count(*) FROM product_issue_comments;"
```
**Verwacht**: beide 0, en query slaagt zonder relation-not-found.

### 2. Edge function bereikbaar
```bash
curl -sS -X POST https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/product-issues \
  -H "Authorization: Bearer $TEST_USER_JWT" \
  -H "Content-Type: application/json" \
  -d '{"organization_id":"<UUID>","title":"Prod smoke 2026-05-04","category":"other"}' | jq .
```
**Verwacht**: 201 Created met issue-id.

### 3. Web Copilot Issues tab
- Open https://app.amos.inclufy.com/copilot
- Klik tab **Issues** → leeg-state met "Probleem melden" knop verschijnt
- Klik **Probleem melden** → form opent, module_context = `copilot`
- Submit test-issue → success-toast + verschijnt in lijst

### 4. AMOS mobile (TestFlight)
- Install nieuwste TestFlight build
- Login + ga naar willekeurig scherm
- **Schud telefoon** krachtig 2× binnen ~700 ms
- Bottom-sheet met "Probleem melden" verschijnt
- Vul titel + verstuur → "Probleem gemeld" alert
- Verifieer in Supabase admin dat issue is aangemaakt met `capture_method='auto_mobile_shake'` en `module_context` = huidige route

---

## Rollback

| Scenario | Actie |
|---|---|
| Migratie faalt | `DROP TABLE public.product_issue_comments, public.product_issues CASCADE;` (additieve tabellen, geen data-loss elders) |
| Edge function 500 | `supabase functions deploy product-issues --project-ref mpxkugfqzmxydxnlxqoj` met vorige commit checked out |
| Web Copilot tab broken | Revert `9e1afc1`, push naar GitLab → auto-redeploy |
| Mobile shake fires te vaak | Bump `threshold` van 1.8 → 2.2 in `useShakeToReport.ts`, nieuwe EAS build |
| Agent triage corrupt | `UPDATE product_issues SET agent_triage_result='{}', triaged_by=NULL, triaged_at=NULL WHERE id IN (...)` |

Migratie is **additief** — geen impact op bestaande tables of flows.

---

## 5-tool rolloutstatus

| Phase | Tool | Backend | Web UI | Mobile |
|---|---|---|---|---|
| 2a | ProjeXtPal | ✅ | ✅ | ✅ |
| 2b | Finance | ✅ | ✅ | ✅ |
| **2c** | **Marketing/AMOS** | **deze deploy** | **deze deploy** | **deze deploy** |
| 2d | IQ Helix (FastAPI) | pending | pending | n/a |
| 2e | Ignite (Spring Boot) | pending | pending | pending |

---

## Sign-off

- [ ] Supabase migration applied (`supabase db push`)
- [ ] Edge function deployed (`supabase functions deploy`)
- [ ] Web smoke-test 201 Created
- [ ] AMOS iOS build submitted to TestFlight
- [ ] AMOS Android AAB built
- [ ] Mobile shake-to-report werkt (handmatig getest op TestFlight)

---

## Phase 3 — Website production-readiness (NIEUW, 2026-05-04)

**Owner agent**: `website-landingpage-curator` (`~/.claude/agents/website-landingpage-curator.md`) — geïntroduceerd 2026-05-04.

**Trigger**: screenshot van `marketing.inclufy.com/pricing` toonde currency-mismatch ($ op NL pagina) + hardcoded dark-mode + sub-brand drift.

### Scope van deze phase

| # | Item | Status | Files |
|---|---|---|---|
| 1 | Light-mode infrastructuur (CSS-vars `:root` + `.dark`) | ✅ | `web/src/app/globals.css` |
| 2 | ThemeProvider (dependency-free, localStorage + system-pref) | ✅ | `web/src/components/theme/ThemeProvider.tsx` |
| 3 | ThemeToggle UI (Licht / Donker / Systeem radiogroup) | ✅ | `web/src/components/theme/ThemeToggle.tsx` |
| 4 | No-flash inline script in `<head>` | ✅ | `web/src/app/layout.tsx` |
| 5 | Sidebar refactor naar design-tokens + toggle in footer | ✅ | `web/src/components/layout/Sidebar.tsx` |
| 6 | Sales chatbot widget (floating, contextual, NL-first) | ✅ | `web/src/components/sales/SalesChatWidget.tsx` |
| 7 | API route voor chatbot (Anthropic Claude Haiku, edge runtime) | ✅ | `web/src/app/api/sales-chat/route.ts` |
| 8 | Mount widget global in layout | ✅ | `web/src/app/layout.tsx` |
| 9 | Pricing-page refactor ($→€, design-tokens) | ⏳ wacht gitlab-sync | `web/src/app/pricing/page.tsx` (op `gitlab/main`) |
| 10 | Currency-formatter per locale (NL=€, MA=MAD, UAE=AED) | ⏳ wacht stap 9 | n.t.b. |
| 11 | Pricing-tier validatie tegen `docs/PRICING_BUNDLES.md` | ⏳ doc pending | n.v.t. |

### Dependencies

- **Lokale repo is 37 commits behind `gitlab/main`** — eerst `git fetch gitlab && git rebase gitlab/main` voor stap 9-11.
- Sales-chatbot vereist `ANTHROPIC_API_KEY` in productie-env (Vercel/GitLab CI). Zonder key valt widget gracefully terug op contact-CTA.
- Light-mode werkt zelfstandig zonder rebase.

### Pre-deploy gates (extra)

| Gate | Command | Pass-criterium |
|---|---|---|
| 6. Web TS na light-mode + chatbot | `cd web && npx tsc --noEmit` | enkel pre-existing `integrations/page.tsx` error |
| 7. Visual regressie | dev-server + `preview_screenshot` op `/`, `/dashboard`, `/pricing` in beide modes | geen kapotte contrasten |
| 8. Chatbot smoke | `curl -X POST /api/sales-chat -d '{"messages":[{"role":"user","content":"prijzen?"}]}'` | 200 + reply non-empty |
| 9. Audit-rapport gegenereerd | `website-landingpage-curator` op live URLs | rapport in `docs/website-audits/` |

### Deploy stappen

```bash
cd "/Users/samiloukile/Dropbox/Inclufy Marketing/Inclufy Marketing-main"

# 1. Sync lokaal met productie
git fetch gitlab
git cherry -v gitlab/main  # check welke "ahead" commits duplicaat zijn
git rebase gitlab/main      # of: nieuwe branch + merge

# 2. Stage + commit light-mode + chatbot
git add web/src/app/globals.css \
        web/src/app/layout.tsx \
        web/src/app/providers.tsx \
        web/src/components/theme/ \
        web/src/components/sales/ \
        web/src/components/layout/Sidebar.tsx \
        web/src/app/api/sales-chat/

git commit -m "feat(web): light-mode + sales chatbot

- Add light/dark/system theme with no-flash script + localStorage
- Add ThemeToggle in sidebar footer
- Add SalesChatWidget (floating bottom-right) with contextual prompts
- Add /api/sales-chat edge route using Claude Haiku
- Refactor Sidebar to design-tokens
- Wire ThemeProvider in providers.tsx"

# 3. Push naar productie
git push gitlab main
git push origin main

# 4. Set Anthropic key in Vercel/GitLab
vercel env add ANTHROPIC_API_KEY production
# or: in GitLab CI/CD → Settings → Variables
```

### Post-deploy smoke (extra)

1. **Light-mode toggle**: open https://marketing.inclufy.com/dashboard → klik thema-knop in sidebar → 3 modi werken zonder FOUC.
2. **Sales chatbot**: open homepage → klik chat-bubble rechtsonder → vraag "wat kost het?" → reply binnen 3s.
3. **Audit-run**: laat `website-landingpage-curator` agent draaien op `/`, `/pricing`, `/contact` → check rapport in `docs/website-audits/2026-05-04-marketing-prod.md`.

### Rollback (extra)

| Scenario | Actie |
|---|---|
| Light-mode breekt prod-styling | Revert `globals.css` `.dark` block + Sidebar token-changes; toggle blijft werken maar enkel licht |
| Chatbot 500 errors | API-route loggen naar Sentry; zonder API-key valt widget terug op contact-CTA — geen blocker |
| FOUC op eerste paint | Verifieer dat `noFlashScript` in `<head>` blijft, niet in `<body>` |
| Visual contrast issues | Kleurvars in `.dark` block bijstellen — pure CSS-only fix, geen code-deploy nodig |

### Sign-off Phase 3

- [x] Light-mode CSS + Provider + Toggle gebouwd
- [x] No-flash script in layout
- [x] Sidebar gerefactord naar tokens
- [x] Sales chatbot widget + API route
- [x] TypeScript schoon (enkel pre-existing fout)
- [ ] Local rebase op gitlab/main uitgevoerd
- [ ] Pricing-page refactor ($→€) na rebase
- [ ] `ANTHROPIC_API_KEY` in productie env
- [ ] `website-landingpage-curator` audit-rapport gegenereerd
- [ ] Visuele smoke-tests in beide modes
- [ ] Push naar `gitlab/main`
