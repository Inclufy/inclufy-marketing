# Sentry Production Setup — AMOS Mobile

**Datum:** 2026-05-07
**Doel:** Crash reports + breadcrumbs werken in productie met **un-minified stack traces** zodat issues echt debugbaar zijn.
**Huidige status:** Sentry SDK is wel geïnstalleerd (`@sentry/react-native ~7.11.0`), maar source-map upload is **uitgeschakeld** via Xcode Cloud env var `SENTRY_DISABLE_AUTO_UPLOAD=true` (ingesteld 2026-05-07 om Build 211 te unblocken).

Resultaat nu: crash reports komen binnen, maar stack traces zien er zo uit:
```
TypeError: undefined is not an object (anonymous function@http://192.168.0...:54324)
  at <anonymous>:1:23
  at <anonymous>:42:7
```
→ Onbruikbaar voor debugging.

Met setup hieronder zien ze er zo uit:
```
TypeError: undefined is not an object
  at PostReviewScreen.handleRotateImage (src/screens/PostReviewScreen.tsx:783)
  at TouchableOpacity.onPress (src/screens/PostReviewScreen.tsx:1968)
  at processCapture (src/screens/LiveCaptureScreen.tsx:329)
```
→ Direct te traceren naar code.

---

## ⏱ Tijdsinvestering

- **Setup**: 20 minuten (jij)
- **Volgende build na setup**: source maps uploaden automatisch
- **Eerste echte crash zien**: ~24u na productie release

---

## Stap 1 — Sentry account / project aanmaken (5 min)

### Optie 1A: Bestaande Inclufy Sentry organisatie

Als je al een Sentry-account hebt voor Inclufy:

1. Login op https://sentry.io
2. Switch naar Inclufy organisatie (top-left dropdown)
3. **+ Create Project** (sidebar links)
4. Platform: **React Native**
5. Project Name: `amos-mobile`
6. Team: Default of nieuwe
7. **Create Project**

Noteer:
- **DSN** (lijkt op `https://abc123@o0123456.ingest.sentry.io/789`)
- **Organization slug** (bijv. `inclufy`)
- **Project slug** (`amos-mobile`)

### Optie 1B: Geen account — nieuw maken

1. https://sentry.io/signup/ → met `sami@inclufy.com`
2. Plan: **Developer (Free)** — gratis tier dekt 5K errors/maand, voldoende voor go-live
3. Eerste project: stap 4-7 hierboven
4. Alternatief plan: **Team ($26/mo)** als je >5K errors verwacht of meerdere apps

→ Voor go-live week 1: gratis tier is genoeg.

---

## Stap 2 — Auth Token aanmaken (3 min)

Voor source-map upload tijdens build heeft Xcode Cloud een token nodig.

1. Sentry → Settings (sidebar) → **Auth Tokens**
2. Klik **Create New Token**
3. Naam: `AMOS Xcode Cloud Build`
4. Scopes (minimaal vereist):
   - ✅ `project:releases` (upload source maps + create releases)
   - ✅ `org:read` (verify org access)
5. **Save**
6. **KOPIEER DE TOKEN NU** — je ziet 'm maar 1× (begint met `sntrys_...` of `sntryu_...`)

**⚠️ Token = secret.** Niet in git committen. Niet delen.

---

## Stap 3 — Xcode Cloud Shared Environment Variables (5 min)

App Store Connect → Apps → InclufyGO → **Xcode Cloud** → **Settings** → **Shared Environment Variables**

**Voeg toe (3 nieuwe variabelen):**

| Naam | Waarde | Redacted? |
|---|---|---|
| `SENTRY_AUTH_TOKEN` | `[plak je token uit stap 2]` | ✅ **Ja, Redacted** |
| `SENTRY_ORG` | `[je org-slug, bijv. inclufy]` | ❌ Nee |
| `SENTRY_PROJECT` | `amos-mobile` | ❌ Nee |

**Wijzig (bestaande):**

| Naam | Oude waarde | Nieuwe waarde |
|---|---|---|
| `SENTRY_DISABLE_AUTO_UPLOAD` | `true` | **Verwijder** of zet op `false` |
| `SENTRY_ALLOW_FAILURE` | `true` | Laat staan als safety net |

→ `SENTRY_ALLOW_FAILURE=true` houden zorgt dat als sentry-cli ooit weer faalt, de build NIET breekt. Belt-and-suspenders.

---

## Stap 4 — DSN runtime config (5 min)

De Sentry SDK in de app heeft een DSN nodig om errors naar Sentry te sturen tijdens runtime.

### 4a. Voor lokale dev / EAS Build

Voeg toe aan `.env.local` (lokaal, niet in git):
```
EXPO_PUBLIC_SENTRY_DSN=https://abc123@o0123456.ingest.sentry.io/789
```

Voeg toe aan EAS secrets (voor cloud builds via EAS):
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://abc123@o0123456.ingest.sentry.io/789"
```

### 4b. Voor Xcode Cloud

Add to Xcode Cloud Shared Env Variables (zelfde scherm als stap 3):

| Naam | Waarde |
|---|---|
| `EXPO_PUBLIC_SENTRY_DSN` | `https://abc123@o0123456.ingest.sentry.io/789` |

**Niet redacted** — DSN is in alle gevallen client-side zichtbaar (bundled in JS), geen secret.

### 4c. Verifieer dat ci_post_clone.sh DSN propageert

Open `ios/ci_scripts/ci_post_clone.sh`. Het schrijft `.env.local` voor de build:

```bash
cat > .env.local << 'ENVEOF'
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
ENVEOF
```

→ Voeg toe (zal ik doen in commit hieronder):
```bash
EXPO_PUBLIC_SENTRY_DSN=$EXPO_PUBLIC_SENTRY_DSN
```

---

## Stap 5 — sentry.properties opzetten (2 min)

Het bestaande `ios/sentry.properties` is leeg. Update met defaults:

→ Ik prep een commit hieronder met deze update.

---

## Stap 6 — Trigger build + verifieer (10 min)

1. Push een commit (of doe een leeg commit:
   ```bash
   cd /Users/samiloukile/InclufyMarketing
   git commit --allow-empty -m "chore(ci): trigger build for Sentry source-map verification"
   git push github main
   git push gitlab main
   ```
2. Xcode Cloud start build (~15-20 min)
3. Tijdens build: monitor logs voor "sentry-cli releases new" en "sentry-cli sourcemaps upload"
4. Na build success: Sentry → AMOS Mobile project → **Releases** tab → er moet een nieuwe release verschijnen met de commit-hash
5. Click release → **Source Maps** tab → moet ~10-50 .js.map files tonen

→ Als alles werkt: **Sentry productie-monitoring is live**.

---

## Stap 7 — Test crash reporting (5 min)

Trigger een test-error in TestFlight om te valideren:

```ts
// Add temporary in any screen for 1 build:
import * as Sentry from '@sentry/react-native';

<Button title="Test Sentry" onPress={() => {
  Sentry.captureException(new Error('AMOS sentry test error 2026-05-07'));
}} />
```

Tap in TestFlight → wacht 1 min → Sentry → **Issues** tab → "AMOS sentry test error 2026-05-07" moet verschijnen met **un-minified stack trace**.

Verwijder de test-button na verificatie.

---

## Stap 8 — Breadcrumbs verifiëren

Mijn capture-rotation fix (commit `b167d7d`) voegt al breadcrumbs toe via:

```ts
Sentry.addBreadcrumb({
  category: 'image-orientation',
  level: 'info',
  message: 'normalizeImageOrientation completed',
  data: { source_uri, result_uri, exif_orientation, exif_keys },
});
```

Na Sentry-setup: bij elke capture wordt een breadcrumb gelogd. Als ooit een crash gebeurt rondom image-rotation, zie je in Sentry de laatste 100 breadcrumbs vóór de crash → veel makkelijker te diagnosticeren.

**Add more breadcrumbs (post-launch sprint)**:
- `category: 'social-publish'` — bij elke publish-attempt (channel + account_id)
- `category: 'oauth'` — bij elke OAuth flow start/complete/error
- `category: 'navigation'` — bij elke navigatie (`react-navigation` integration)

---

## Wat ik NU vast pre-stage in code

### File 1: `ios/sentry.properties`
→ Voeg defaults toe zodat `sentry-cli` org/project leest uit file ipv env-var fallback. Veiliger want in repo.

### File 2: `ios/ci_scripts/ci_post_clone.sh`
→ Voeg `EXPO_PUBLIC_SENTRY_DSN` toe aan `.env.local` schrijf-blok zodat Expo bundler 'm vindt.

### File 3: `App.tsx`
→ Verifieer `initSentry()` wordt eerste-thing aangeroepen vóór navigation render.

---

## Final checklist (vóór "live monitoring" claim)

- [ ] Sentry project `amos-mobile` aangemaakt
- [ ] DSN gekopieerd
- [ ] Auth token gemaakt + `SENTRY_AUTH_TOKEN` in Xcode Cloud env vars
- [ ] `SENTRY_ORG` + `SENTRY_PROJECT` in Xcode Cloud env vars
- [ ] `EXPO_PUBLIC_SENTRY_DSN` in Xcode Cloud env vars
- [ ] `SENTRY_DISABLE_AUTO_UPLOAD` verwijderd of `false`
- [ ] `SENTRY_ALLOW_FAILURE=true` blijft (safety)
- [ ] Sentry-properties pre-staging commit (ik doe)
- [ ] Trigger build → source maps geüpload (verify in Sentry Releases tab)
- [ ] Test crash → un-minified stack trace zichtbaar
- [ ] Test crashes weer verwijderd

---

## Wat is er ALS je dit niet doet (Optie B: minimal)

Crashes komen wel binnen in Sentry maar:
- Stack traces zijn minified (numerieke addressen)
- Geen source-map matching
- Debug = veel handwerk

→ **Acceptabel voor go-live week 1**, niet aanbevolen voor productie-stable v1.0.

---

## Mijn aanbeveling

**Doe Sentry setup volledig vrijdag of zaterdag** — niet vandaag. Reden: deze setup is ~20 min werk maar vereist dat je een Sentry-account opent + project aanmaakt. Niet doen na 21:00 wanneer je al moe bent.

Vandaag heb ik dit voorbereid:
- Deze setup-doc (paste-ready stappen)
- `sentry.properties` pre-stage commit (volgt direct hieronder)
- ci_post_clone.sh DSN propagation (volgt direct hieronder)

Vrijdag: jij doet stap 1-7, in 20 min ben je live met production-grade monitoring.

---

*Update dit document met DSN/auth-token na setup zodat het volgende team-member zonder vragen weet hoe het werkt.*
