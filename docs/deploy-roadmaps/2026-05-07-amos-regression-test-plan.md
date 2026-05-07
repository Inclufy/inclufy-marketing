# AMOS Regression Test Plan — Pre-Deploy Validation

**Datum:** 2026-05-07
**Auteur:** AI agent voor Sami Loukile
**Doel:** Lijst van baseline tests die VOOR elke productie-deploy moeten slagen, zodat regressies (zoals "Draaien werkt maar 1×" na commit 401fdb6) automatisch worden gevangen vóór ze TestFlight bereiken.
**Status:** Concept — implementatie ná go-live (week 2)
**Gerelateerde docs:** `2026-05-07-video-capture-vlogger-roadmap.md`

---

## 1. Waarom dit nu nog niet bestaat

Vandaag (2026-05-07) is gebleken dat 11 commits werden gepusht zonder regression-checks. Drie problemen werden pas in TestFlight ontdekt:

1. **Build 212 faalde** — Sentry source-map auto-upload zonder credentials → verholpen via UI env-var
2. **Build 213 (channelRules.ts dependency)** — untracked import brak fresh-clone CI build
3. **Draaien werkt maar 1× na 401fdb6** — race tussen localMediaUri en captureImageUrl invalidatie

Stuk voor stuk **regressies** die door automated tests gevangen hadden kunnen worden. We hebben er geen — daarom zit er nu een dag aan rework + 11 build-pogingen in.

---

## 2. Test-piramide

```
                    ┌─────────────────────┐
                    │   E2E (Maestro)     │  ← 20 critical paths
                    │   ~5 min per run    │
                    │  CI gate vóór deploy│
                    └─────────────────────┘
                  ┌─────────────────────────┐
                  │  Integration tests      │  ← Edge functions, DB
                  │  Jest + Supabase mock   │
                  │  ~2 min per run         │
                  └─────────────────────────┘
              ┌─────────────────────────────────┐
              │  Unit tests (existing)          │  ← Hooks, utilities
              │  Jest                           │
              │  Currently: ~10 tests, expand to 50+ │
              └─────────────────────────────────┘
```

**Prioriteit voor go-live:** alleen de top E2E-laag. Unit + Integration komen later.

---

## 3. E2E Test Suite — 20 critical paths

Elk = één Maestro `.yaml` flow. Loopt op iOS Simulator via GitHub Actions bij elke push naar main. Build wordt geblokkeerd als 1 faalt.

### 3.1 Auth & Settings (3 tests)

| # | Test | Wat valideert |
|---|---|---|
| 1 | Login met `sami@inclufy.com` | Auth-flow werkt, profiel laadt |
| 2 | Settings → Social Media → 5 connecties zichtbaar | OAuth-rijen renderen correct |
| 3 | Disconnect Facebook → confirmation → row weg | Disconnect-flow werkt |

### 3.2 Capture flow (5 tests)

| # | Test | Wat valideert |
|---|---|---|
| 4 | Tap + → photo mode → maak foto met rear camera → preview verschijnt rechtop | **Capture rotation** (Bug 4 + 7-mei regressie) |
| 5 | Tap + → photo mode → kies foto uit library (landscape) → preview rechtop | EXIF library-import |
| 6 | Tap + → photo mode → kies foto (portrait) → preview rechtop | Portrait EXIF |
| 7 | Tap + → video mode → record 5 sec → preview speelt af | **Bug 8 video preview** |
| 8 | Tap + → video mode → record 5 sec + thumbnail-knop → thumbnail dialog | Video thumbnail UX |

### 3.3 PostReview (5 tests)

| # | Test | Wat valideert |
|---|---|---|
| 9 | Capture foto → 4 channel-tabs zichtbaar (LinkedIn / Instagram / Facebook / WhatsApp) | **Bug 3 channels-tabs** |
| 10 | LinkedIn tab → image visible in mock-card | Bug 5 (LI preview) |
| 11 | Instagram tab → image visible | Bug 6 (IG preview) |
| 12 | Tap "Draaien" 4× → preview komt terug naar origineel | **Draaien herhaaldelijk werkt** (vandaag's bug) |
| 13 | Tap "Spiegelen" 2× → preview komt terug naar origineel | Flip herhaaldelijk |

### 3.4 Publish flow (4 tests)

| # | Test | Wat valideert |
|---|---|---|
| 14 | Tap Publiceer LinkedIn → picker met 2 accounts (personal + company) verschijnt | **Bug 1 LinkedIn picker** |
| 15 | Tap Publiceer Instagram → picker zonder "voeg account toe" lege staat | **Bug 2 IG empty state** |
| 16 | Multi-select 2 accounts in picker → "Publiceer naar 2 accounts" knop | **E4 multi-select** |
| 17 | Met expired token → publish error → "verbind opnieuw" Alert | **E3 token expiry** |

### 3.5 Library flow (3 tests)

| # | Test | Wat valideert |
|---|---|---|
| 18 | Library tab → tap design → tap Publiceer → succes Alert | **librarypostdetail (vandaag's bug)** |
| 19 | Library upload ZIP → import succes → designs verschijnen | Library import |
| 20 | Library design → switch language → vertaling werkt | i18n |

---

## 4. Maestro setup — concrete starters

### 4.1 Install + repo structure

```
ios/
android/
maestro/
  flows/
    01-auth-login.yaml
    02-settings-social-media.yaml
    ...
    20-library-language-switch.yaml
  README.md
.github/workflows/
  e2e-maestro.yml
```

### 4.2 Voorbeeld flow — `12-rotate-repeated.yaml`

```yaml
appId: com.inclufy.go
name: Rotate works repeatedly (regression test for Draaien-1× bug)
---
- launchApp
- tapOn:
    text: "Sign in"
- inputText: "sami@inclufy.com"
- tapOn: "Wachtwoord"
- inputText: "${SAMI_TEST_PASSWORD}"
- tapOn: "Inloggen"
- waitForAnimationToEnd
- tapOn:
    id: "tab-add"   # the + button
- tapOn:
    text: "Foto"
- tapOn:
    id: "library-button"
- tapOn:
    text: "Test photo upright"  # pre-loaded test photo
- assertVisible:
    text: "Review Posts"
- tapOn: "LinkedIn"
- assertVisible:
    id: "preview-image"
- tapOn:
    text: "Draaien"
- assertVisible:
    id: "preview-image"
- tapOn:
    text: "Draaien"
- assertVisible:
    id: "preview-image"
- tapOn:
    text: "Draaien"
- assertVisible:
    id: "preview-image"
- tapOn:
    text: "Draaien"
- assertVisible:
    id: "preview-image"
# After 4× rotate, image should be back to original orientation
- takeScreenshot: rotate-result-after-4x
```

### 4.3 GitHub Actions workflow — `e2e-maestro.yml`

```yaml
name: E2E Maestro
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  e2e:
    runs-on: macos-14
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: ruby/setup-ruby@v1
        with: { ruby-version: 3.2 }
      - name: Install dependencies
        run: |
          npm ci
          cd ios && pod install
      - name: Start iOS simulator
        run: |
          xcrun simctl boot "iPhone 15 Pro" || true
      - name: Build for simulator
        run: |
          npx expo run:ios --no-bundler --device "iPhone 15 Pro"
      - name: Install Maestro
        run: |
          curl -Ls "https://get.maestro.mobile.dev" | bash
          echo "$HOME/.maestro/bin" >> $GITHUB_PATH
      - name: Run Maestro tests
        env:
          SAMI_TEST_PASSWORD: ${{ secrets.SAMI_TEST_PASSWORD }}
        run: |
          maestro test maestro/flows/
      - name: Upload screenshots on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: maestro-screenshots
          path: ~/.maestro/tests/**
```

---

## 5. Test data — wat moet bestaan

### 5.1 Test-Supabase project (apart van productie)

- `mpxkugfqzmxydxnlxqoj-test.supabase.co` — gespiegeld schema, geen prod data
- Seed users: `sami-test@inclufy.com`, `vlogger-test@inclufy.com`
- Pre-loaded social_accounts (mocked OAuth tokens)
- Pre-loaded library_posts en go_captures voor library flow tests

### 5.2 Test photo/video assets

- `test-fixtures/portrait-1080x1920.jpg` — EXIF=1, portrait
- `test-fixtures/portrait-iphone-exif6.jpg` — landscape pixels + EXIF=6, should display portrait
- `test-fixtures/landscape-1920x1080.jpg` — landscape upright
- `test-fixtures/video-5sec-1080p.mp4` — 5 sec test video

Geüpload als pre-installed assets via simulator-bundle.

---

## 6. Implementatie sprint

### Week 1 (post-launch)

| Dag | Taak | Tijd |
|---|---|---|
| 1 | Maestro CLI install + 1e flow (login) als sanity-check | 2u |
| 2 | Test Supabase project setup + seed scripts | 4u |
| 3-4 | Test fixtures (4 photos + 1 video) | 2u |
| 5 | GitHub Actions workflow + secrets setup | 4u |

### Week 2

| Dag | Taak | Tijd |
|---|---|---|
| 1-2 | Flows 1-10 schrijven + test op simulator | 1d |
| 3-4 | Flows 11-20 schrijven | 1d |
| 5 | CI tuning — flake fixes, timeout adjusts | 4u |

**Totaal:** ~10 dev-dagen voor stabiele suite van 20 flows.

---

## 7. Definition of Done — testpipeline live

- [ ] Maestro suite van 20 flows draait op GitHub Actions
- [ ] Alle 20 flows passeren op `main` branch
- [ ] PR's naar `main` worden geblokkeerd als 1+ flow faalt
- [ ] Sami + team kunnen lokaal `maestro test` draaien op laptop
- [ ] Screenshots opgeslagen bij failures voor debug
- [ ] Test-Supabase project bevat consistente seed-data
- [ ] README in `maestro/` legt uit hoe nieuwe flows toe te voegen

---

## 8. Maintenance — proces voor nieuwe features

**Regel:** elke nieuwe feature die naar productie gaat **moet** een Maestro-flow hebben die de happy-path test.

PR-template krijgt nieuwe checkbox:
```
- [ ] Maestro flow added/updated for changes in this PR
```

PR review-checklist:
1. Code-changes gereviewed
2. Maestro flow added (zie bovenstaande)
3. CI green inclusief E2E

---

## 9. ROI inschatting

**Vandaag's regression-cost:**
- 4 builds gefaald (210, 211, 212, 213) voor het eindelijk werkte
- ~1 uur per failed build (commit + 15-20 min wachten + diagnose)
- Totaal: ~4 uur Sami-tijd + 4 uur AI-debug-tijd
- Plus opportunity-cost: smoke-test pas 's avonds, demo-video opname uitgesteld

**Bij regression-suite live:**
- Push → CI runt 5 min → groen of fail-met-screenshot
- Failures gevangen vóór TestFlight upload
- Geen "ik heb 11 commits gepusht zonder te weten of build 213 werkt"
- **Geschatte besparing**: 50% van debug-tijd op iedere PR. Bij 5 PR/week × 1u/PR = 2.5u/week (~10u/maand) + minder app-store-rollback-stress.

→ **Investering 10 dev-dagen, payoff ~10 dev-uren/maand binnen 6 weken.**

---

## 10. Risk + alternatieven

### Maestro-specifieke risico's

| Risico | Mitigatie |
|---|---|
| Maestro flake op simulator (timing, fade-animations) | `waitForAnimationToEnd` ipv harde sleep; retry-logic in flow |
| iOS 26.4 compatibility | Meet vóór go-live op test-branch |
| GitHub Actions macOS runner kost (~$0.08/min) | Beperk runs: alleen op `main` push + grote PRs, niet op elke commit |

### Alternatieven (overwogen, niet gekozen)

- **Detox** — krachtiger maar complex om op te zetten. Maestro is YAML-based en sneller te leren.
- **EAS Build + e2e** — Expo aanvaardt nu native E2E maar vereist EAS subscription.
- **Playwright** — alleen web; AMOS is mobile-first. Skip.
- **Manual QA** — wat we nu hebben. Niet schaalbaar.

---

## 11. Aanbeveling

**Voor go-live (zondag):**
- ❌ Geen automated tests vóór launch — te kort
- ✅ Wel: handmatige smoke-test van alle 20 flows door Sami in TestFlight

**Week 1 na launch:**
- 🚀 Start sprint A — Maestro setup + eerste 5 flows (auth + capture)
- Loop daarna door tot alle 20 dekking hebben

**Maintenance forever:**
- Elk nieuw feature-PR voegt 1 Maestro-flow toe
- Reviewer checkt: heeft PR een test? Zo nee → request changes

---

## 12. Volgende stap

Na go-live, week 1:
1. Maandagochtend — review deze doc met team
2. Beslis: 1 dev fulltime op Maestro voor 2 weken, OF 2 dev partial
3. Start met `maestro/flows/01-auth-login.yaml` als sanity-check
4. Iterate

Daarna heb je iets dat **WEET dat het werkt** vóór elke deploy. Geen "Ik hoop dat build 217 het doet."

---

*Dit doc is een levend regression-plan. Update na elke nieuwe feature, na elke regression-incident, en wanneer testdekking groeit.*
