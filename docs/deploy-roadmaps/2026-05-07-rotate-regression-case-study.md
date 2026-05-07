# Case Study: De "Draaien"-functie liet TWEE regressies door op één dag

**Datum:** 2026-05-07
**Auteur:** AI agent voor Sami Loukile
**Doel:** Concreet voorbeeld voor de Maestro-test-author (week 1) — laat zien welk soort tests de bestaande [regression test plan](./2026-05-07-amos-regression-test-plan.md) nu nog mist, met de exacte bugs van vandaag als bewijsmateriaal.
**Companion van:** [2026-05-07-amos-regression-test-plan.md](./2026-05-07-amos-regression-test-plan.md)

---

## TL;DR voor de Maestro-author

Het bestaande test plan heeft één rotate-test (`12-rotate-repeated.yaml`: tap Draaien 4× → terug bij origineel). Dat had **één** van de twee bugs van vandaag gevangen. De andere bug was orthogonaal en vereist een **fundamenteel andere test-as**. Lees deze case study voordat je je flows schrijft, zodat je weet welke test-assen je moet dekken voor élke media-mutatie-feature (rotate, flip, crop, filter).

---

## 1. Tijdlijn — wat er fout ging

| Tijd | Build | Bug-symptoom | Commit |
|---|---|---|---|
| 16:30 | 215 | Foto staat op zijn kant na capture, "Draaien" knop nodig om recht te krijgen | — |
| ~17:00 | 216 | Fix attempt: bake EXIF in camera + add own EXIF rotation switch | [`6545b2b`](https://github.com/.../commits/6545b2b) |
| 18:30 | 216 (post-test) | Foto's nu **dubbel/triple geroteerd** — sideways i.p.v. recht | — |
| 20:30 | 217 | "Draaien" werkt maar **1×**, daarna no-op | — |
| 20:30 | 217 (commit) | Fix #1: rotate/flip lezen `localMediaUri` als primary source | [`3aa3644`](https://github.com/.../commits/3aa3644) |
| 20:46 | 218 | Fix #2: verwijder eigen EXIF switch — trust de lib | [`b167d7d`](https://github.com/.../commits/b167d7d) |

Twee onafhankelijke regressies, beide veroorzaakt door eerdere fix-attempts in dezelfde feature, beide pas zichtbaar in TestFlight, beide fix-baar maar tijdrovend om te diagnosticeren.

---

## 2. Bug A — Triple rotation (capture)

### Symptoom
Portretfoto van de stad-skyline arriveerde 90° gekanteld in PostReview. User moest "Draaien" tappen om de foto rechtop te krijgen — onaanvaardbaar voor go-live.

### Wat ging fout
Drie rotatie-lagen stapelden:

1. **iOS expo-camera `skipProcessing: false`** — bakte EXIF orientation in de pixels vóór return van URI.
2. **expo-image-manipulator op iOS** — past automatisch EXIF orientation toe wanneer het de source image leest. Zag de al-gebakken pixels + residual EXIF flag, roteerde nogmaals.
3. **Eigen EXIF switch** — een handmatige `case 6: rotate 90` die op top kwam.

Net effect: portrait (EXIF=6) ging door drie rotaties → ~270° = sideways.

### Fix (commit b167d7d)
Verwijder de eigen switch volledig. `expo-image-manipulator` met alleen `resize` — dat forceert JPEG re-encode → strip EXIF orientation flag → schone pixels. **Trust the lib.**

### Hoe de Maestro-author dit zou hebben gevangen

**Bestaande test 4** (`Tap + → photo mode → maak foto met rear camera → preview verschijnt rechtop`) zou dit hebben gevangen — ALS het op echte device-foto's met EXIF metadata getest werd.

**Cruciaal:** simulator-camera maakt foto's zonder EXIF orientation flag. Een Maestro-flow op de simulator zou groen blijven terwijl een echte iPhone rood zou zijn. **Test fixture vereist:** pre-recorded portretfoto met EXIF=6 in de simulator-photo-library, dan tap + → photo mode → kies-uit-library → assert preview rechtop.

**Zie:** [test plan §5.2](./2026-05-07-amos-regression-test-plan.md#52-test-photovideo-assets) — `portrait-iphone-exif6.jpg` is al gepland. Echter géén variant met **camera-capture-met-EXIF** — dat moet de author erbij verzinnen, of de simulator-camera vervangen door een mock die EXIF-laden teruggeeft.

---

## 3. Bug B — "Draaien werkt maar 1×"

### Symptoom
Eerste tap op Draaien → foto roteert 90°. Tweede tap → niets. Derde, vierde tap → niets. Alleen na page reload werkte Draaien weer 1×.

### Wat ging fout — de async race
1. 1ste rotate: `manipulateAsync` returnt nieuwe URI, geüpload naar Supabase, `captureImageUrl` query invalidated.
2. **`captureImageUrl` refetch is async** — kicks off, blokkeert niet.
3. `localMediaUri` set naar result.uri → preview toont local rotated file (dat ziet er goed uit).
4. User tapt Draaien direct daarna → refetch is nog niet klaar → `captureImageUrl` is nog de **stale** pre-rotation signed URL.
5. `handleRotateImage` las `sourceUrl = captureImageUrl ?? imageUrl` → operatie op pre-rotation image → result is identiek aan eerste rotate.
6. Net effect: rotate werkt visueel maar 1×, repeated taps zijn no-op.

### Fix (commit 3aa3644)
Change source priority: `localMediaUri ?? captureImageUrl ?? imageUrl`. Het zojuist-geroteerde local bestand is altijd de meest recente pixel state, beschikbaar zonder te wachten op cloud refetch.

### Hoe de Maestro-author dit zou hebben gevangen

Bestaande test 12 (`tap Draaien 4× → terug bij origineel`) **vangt dit** mits hij de 4 taps **snel achter elkaar** doet (binnen ~500ms van elkaar). Als de flow pauzeert tussen taps voor screenshots of `waitForAnimationToEnd`, kan de async refetch wél compleet zijn → bug niet reproduceerbaar.

**Maestro implementatie-detail:**
```yaml
- tapOn: "Draaien"
- tapOn: "Draaien"   # <-- géén waitForAnimationToEnd hiertussen
- tapOn: "Draaien"
- tapOn: "Draaien"
- assertVisible:
    id: "preview-image"
- takeScreenshot: rotate-result-after-4x
```

**Niet** dit:
```yaml
- tapOn: "Draaien"
- waitForAnimationToEnd   # <-- maakt de race onzichtbaar
- tapOn: "Draaien"
```

---

## 4. Generieke patronen — voor élke media-mutatie-feature

Beide bugs hadden tegen-elkaar-aangrenzende root causes maar onafhankelijke triggers. Daaruit volgen 4 test-assen die de Maestro-author moet bedenken voor **alle** media-mutatie-features (rotate, flip, crop, filter, brightness, etc.):

### As 1 — Single op vs herhaald
- **Test:** doe de operatie 1×, dan 4× snel achter elkaar.
- **Vangt:** async-state-races (zoals Bug B).
- **Voor rotate:** elke 4 rotates → terug bij origineel. Voor flip: elke 2 flips. Voor crop: 4× cropping moet pixel-coordinates resetten.

### As 2 — Combinaties
- **Test:** rotate, dan flip, dan rotate (gemengd).
- **Vangt:** state-machine bugs waar één operatie de input van de volgende corrumpeert.
- **Wordt nu nergens getest.** Voeg toe aan `13-flip-repeated.yaml` als variant.

### As 3 — Bron-variëteit
- **Test:** dezelfde mutatie op (a) camera-capture, (b) library-upload, (c) re-opened post.
- **Vangt:** EXIF-handling-verschillen (zoals Bug A) + signed-URL-staleness (zoals Bug B) die per source-type verschillend zijn.
- **Test fixtures vereist:** photos met EXIF=1 (normaal), EXIF=6 (portrait), EXIF=3 (rotated 180), EXIF=8 (rotated -90). En 1 video.

### As 4 — Timing / latentie
- **Test:** mutatie + onmiddellijk publish (zonder te wachten op refetch).
- **Vangt:** publish-wint-van-mutatie races. Vandaag niet getriggerd, maar zelfde async pattern als Bug B → potentieel.
- **Maestro:** geen `waitForAnimationToEnd` tussen rotate en publish-tap.

---

## 5. Wat de bestaande test plan **mist** voor rotate/flip

Concrete delta vs [test plan §3.3](./2026-05-07-amos-regression-test-plan.md#33-postreview-5-tests):

| Bestaande test | Wat het wel dekt | Wat het mist |
|---|---|---|
| Test 12 — Draaien 4× | Bug B (mits geen wait tussen taps) | Bug A (geen EXIF-fixture variant); As 2 (geen flip+rotate combo); As 3 (alleen 1 source-type) |
| Test 13 — Spiegelen 2× | Identiek aan Test 12 | Identiek lacunes |

**Voorgestelde toevoegingen** (5 extra flows, ~30 min werk per flow):

| Nieuwe test | Variant | Vangt |
|---|---|---|
| `12a-rotate-after-camera-capture-exif6.yaml` | Camera-capture met portrait fixture EXIF=6 | Bug A |
| `12b-rotate-then-flip-then-rotate.yaml` | Combinatie van mutaties | As 2 |
| `12c-rotate-on-library-upload.yaml` | Library-upload bron i.p.v. camera | As 3 |
| `12d-rotate-then-immediate-publish.yaml` | Geen wait tussen rotate en publish | As 4 (potential future bug) |
| `12e-rotate-on-edit-existing-post.yaml` | Open existing scheduled post → rotate | As 3 (re-opened) |

Daarmee gaat de rotate-coverage van 1 flow naar 6 flows, met alle 4 assen gedekt.

---

## 6. Sentry breadcrumbs — als test "te laat" is

Beide commits voegden Sentry breadcrumbs toe. Voor de Maestro-author belangrijk om te weten:

**Wat Sentry nu logt** (bij volgende rotate-bug-report):
- Raw EXIF object van de bron-image
- Source URI prefix (geredacteerd voor privacy)
- Result URI prefix
- Welke source de handler gebruikte (`localMediaUri` / `captureImageUrl` / `imageUrl`)

**Wat dat betekent voor jou:** als een Maestro-flow groen is maar een gebruiker rapporteert toch een rotate-issue, ga eerst naar Sentry en check de breadcrumbs voordat je de Maestro-flow aanpast. Je kan namelijk een test schrijven die de bug niet trigt (timing, fixture, simulator vs device), terwijl Sentry de exacte productie-staat heeft.

**Convention voor de Maestro-author:** elke nieuwe Maestro-flow voor een mutatie-feature **moet** een Sentry breadcrumb-naam noemen waar productie-tegenhanger te vinden is. Voorbeeld in flow header:
```yaml
# Sentry breadcrumb category: 'media.rotate'
# If this test passes but production fails, check Sentry first.
```

---

## 7. Definition of Done — case study verwerkt in test plan

- [ ] [test plan §3.3](./2026-05-07-amos-regression-test-plan.md#33-postreview-5-tests) uitgebreid met 5 extra flows uit §5 hierboven.
- [ ] [test plan §5.2](./2026-05-07-amos-regression-test-plan.md#52-test-photovideo-assets) uitgebreid met 4 EXIF-varianten (1, 3, 6, 8).
- [ ] PR-template krijgt regel: "Bevat deze PR een mutatie-feature? Zo ja, dekt nieuwe Maestro-flow alle 4 test-assen (single/herhaald, combinatie, bron-variant, timing)?"
- [ ] Sentry breadcrumb conventie gedocumenteerd in `maestro/README.md`.

---

## 8. Lessons voor toekomstige fix-attempts

Twee fix-stappen achter elkaar in dezelfde feature liep mis vandaag:

1. **6545b2b** voegde EXIF-correctie toe → **introduceerde** Bug A (triple rotation).
2. **401fdb6** vervangde state-clear door state-set → **introduceerde** Bug B (rotate 1×).
3. **3aa3644** + **b167d7d** waren herstelfixes voor de twee regressies.

**Lesson 1 — "trust the lib"**: voordat je je eigen orientation/state/lifecycle logic toevoegt, lees de docs van de underlying lib en check of die het al doet. `expo-image-manipulator` documenteerde dit niet expliciet — alleen empirisch op iOS-device gevonden. Bij twijfel: minimal change + log + test op echt device.

**Lesson 2 — async state invalidation is onzichtbaar in code review**: de Bug B regressie had een 1-line change (`setLocalMediaUri(null)` → `setLocalMediaUri(result.uri)`). Niemand zou in code review zien dat dit een race triggert. **Alleen E2E test op real-time UI vangt dit.** Versterkt de noodzaak van Maestro op CI gate.

**Lesson 3 — TestFlight is geen test environment**: 4 builds (212–216) gefaald voordat we erachter kwamen. Investering in Maestro is niet "later als we tijd hebben" — het is "elk uur dat we het uitstellen kost meer dan het opzetten kost".

---

*Dit is een levend case-study document. Voeg toe wanneer je vergelijkbare regressies tegenkomt in andere features (crop, filter, audio-trim, video-clip), zodat de patterns groeien en de test plan automatisch up-to-date blijft.*
