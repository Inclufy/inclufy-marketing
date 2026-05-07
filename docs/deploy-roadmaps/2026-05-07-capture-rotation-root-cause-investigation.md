# Capture Rotation — Root Cause Investigation

**Datum:** 2026-05-07
**Status:** OPEN — wacht op user-feedback over reproductie-pad (camera vs library) + screenshot misrotated post
**Vorige fixes:** 3 commits (`6545b2b`, `b167d7d`, `3aa3644`) — issue blijft incidenteel terugkomen.

---

## 1. Symptoom (gerapporteerd)

Op iPhone (iOS 17+, Build 216) worden sommige foto's na capture/upload **gespiegeld of gedraaid** weergegeven in PostReview. Niet 100% van de keren — soms wel, soms niet, zonder duidelijk patroon.

---

## 2. Code-paden

Twee inputs leiden naar `normalizeImageOrientation()`:

```
                  ┌─ Camera capture ──┐
                  │  expo-camera       │
                  │  takePictureAsync  │  ──┐
                  │  exif: true        │    │
                  │  skipProcessing:   │    │
                  │    false (iOS)     │    │
                  └────────────────────┘    │
                                            ▼
                                        normalizeImageOrientation(uri, exif)
                                            │  - ImageManipulator.manipulateAsync
                                            │  - resize:1920 (forces JPEG re-encode)
                                            │  - compress:0.85
                                            │  - returns clean URI
                                            ▼
  ┌─ Library upload ────┐                processCapture / processFreeCapture
  │ expo-image-picker   │                    │
  │ launchImageLibrary  │                    ▼
  │ Async, exif: true   │ ──────────────► Upload to Supabase Storage → AI gen → PostReview
  └─────────────────────┘
```

**Bestaande aanname (per code comment line 56-65):**
> "iOS auto-applies EXIF orientation when reading source image. Plus expo-camera with skipProcessing:false bakes orientation into pixels. Both layers normalise. Adding our own switch caused DOUBLE rotation."

→ Huidige fix: trust both layers, doe alleen resize-only re-encode om EXIF flag te strippen.

---

## 3. Hypothesen voor de overgebleven incidenten

### Hypothese A: Library-upload met geforceerde EXIF Orientation = 1 (no-op)

`expo-image-picker` met `exif: true` returns een asset met `exif.Orientation` field. Op iOS retourneert het PNG-formaat soms Orientation=1 (normal) terwijl de pixels eigenlijk gedraaid zijn (omgekeerd geplaatst tijdens save).

**Bewijs nodig:** check `exif.Orientation` value in de Sentry breadcrumb voor een misrotated case.

### Hypothese B: HEIC-fotos van iPhone die intern naar JPEG worden geconverteerd

iPhone slaat foto's standaard op als HEIC (Apple's container). Bij library upload wordt HEIC vaak geconverteerd naar JPEG door `expo-image-picker`. Tijdens die conversie kan de orientation flag verloren gaan OF dubbel geapplied.

**Indicator:** issue treedt vaker op met foto's gemaakt VÓÓR capture session (bestaande HEIC's in library) dan met live-camera-shots.

**Bewijs nodig:** vraag user welk pad (camera of library) de meeste issues geeft.

### Hypothese C: Screenshots / app-rendered images (geen EXIF)

Een PNG-screenshot heeft geen EXIF-block. ImageManipulator's `resize` operatie zal geen orientation-correctie toepassen omdat er niets te corrigeren is. Maar als de screenshot is gemaakt in landscape-mode op een iPhone die in portrait wordt gehouden, kan de pixel-oriëntatie afwijken van wat de gebruiker verwacht.

**Indicator:** issue treedt op bij screenshots, niet bij gewone foto's.

### Hypothese D: PostReview re-rotation cache

Lijn 781-795 in `PostReviewScreen.tsx` toont eigen rotate-handler die `localMediaUri` als source gebruikt. Bug-fix `3aa3644` zegt: "rotate/flip use localMediaUri as primary source" — als die source stale is na een eerdere rotate, wordt de oriëntatie nogmaals toegepast.

**Indicator:** issue treedt op NA een handmatige rotate-actie in PostReview, niet bij eerste view.

### Hypothese E: Multi-photo upload — eerste foto correct, extra's niet

In `LiveCaptureScreen.tsx:622-625` wordt de eerste foto via `normalizeImageOrientation` gehaald, maar bij multi-photo upload worden de "extra" foto's mogelijk niet door dezelfde normalization gehaald.

**Bewijs nodig:** check de extra-photos handling code (line 624+).

### Hypothese F: Server-side AI-generation re-saves zonder EXIF-strip

Wanneer de AI-prompt de afbeelding krijgt, wordt deze opnieuw gefetched + soms opnieuw geüpload (voor logging/diagnostiek). Als die re-upload-stap geen JPEG-re-encode doet, kan stale EXIF terugkeren.

**Indicator:** preview ziet er goed uit in PostReview, maar gepubliceerde post is gedraaid.

---

## 4. Voor user — vragen om te beantwoorden

Om hypotheses te elimineren:

1. **Welke input?** Treedt rotation op bij:
   - Camera-capture (live foto maken in AMOS)
   - Library-upload (foto uit photo roll kiezen)
   - Beide
2. **Foto-formaat?** Zijn de getroffen foto's:
   - HEIC (standaard iPhone)
   - JPEG (als je hebt geconverteerd via Settings)
   - Screenshot (PNG)
3. **Wanneer?** Bij:
   - Eerste view in PostReview
   - Na handmatige rotate-actie in PostReview
   - Pas in de gepubliceerde post (PostReview was OK)
4. **Multi-photo?** Trad het op bij:
   - Single foto
   - Multi-foto upload
5. **Screenshot van getroffen post**: vergelijk wat AMOS toont vs wat na publish op de social platform staat.

---

## 5. Diagnostische tools die we al hebben

### Sentry breadcrumb (line 79-91)

Logt:
- `source_uri` (input)
- `result_uri` (na manipulation)
- `exif_orientation` (raw EXIF flag value)
- `exif_keys` (welke EXIF tags aanwezig)

→ Werkt alleen als Sentry productie-ready is. Per `2026-05-07-sentry-production-setup.md` is dat vrijdag-werk.

### Console logging

`console.warn('[normalizeImageOrientation] failed for', uri, err)` — alleen op error path.

→ Voldoende voor lokale dev. Niet zichtbaar in TestFlight prod.

---

## 6. Voorgestelde acties (na user-input)

### Stap 1 — Sentry deploy (vrijdag)

Zonder Sentry hebben we geen prod-zichtbaarheid op de exact gefaalde rotation case. Eerst Sentry werkend krijgen → wachten op 1-2 echte cases.

### Stap 2 — User-input vragen

Antwoorden op vragen 1-5 hierboven. Als user zegt "altijd library, altijd HEIC, altijd 1ste view" → Hypothese B is waarschijnlijk.

### Stap 3 — Per-hypothese fix

| Hypothese | Voorgestelde fix |
|---|---|
| A: Library EXIF=1 maar pixels gedraaid | Detect mismatch via image-bounds check, force re-encode |
| B: HEIC conversion verliest EXIF | Use `assetsLibrary` API direct ipv `expo-image-picker`, behoud HEIC + decoder |
| C: Screenshots PNG-only | Add JPEG-re-encode pre-step bij `mimeType === 'image/png'` |
| D: PostReview rotation stale | Verify `localMediaUri` clear pattern (al gedaan in 3aa3644) — extra logging |
| E: Multi-photo extras | Apply normalizeImageOrientation per asset in multi-photo loop |
| F: AI re-upload | Skip re-upload — pass storage URL ipv raw bytes naar AI |

### Stap 4 — Add comprehensive E2E test

Maak een test-suite met 6 inputs:
- Live camera (portrait + landscape)
- Library JPEG
- Library HEIC
- Library PNG screenshot
- Multi-photo upload (3 photos)
- Already-rotated photo (manually rotated in iOS Photos before upload)

Run door normalizeImageOrientation → assert pixel-orientation matches expected.

---

## 7. Niet-doen

- **Niet meer code toevoegen vóór user-input + screenshot.** We hebben al 3 fixes gedaan; verdere blind code-changes verhogen het risico op double-rotate of nieuwe edge cases.
- **Niet voor Sentry-deploy debugging in productie proberen** — geen ruwe data zonder Sentry.

---

## 8. Wat we nu wel kunnen doen (zonder user-input)

- ✅ Sentry productie-setup vrijdag voltooien (los project)
- ✅ Multi-photo extras-loop reviewen (Hypothese E)
- ✅ Test-suite skeleton schrijven voor alle 6 input-types

Eerste 2 zijn parallel mogelijk met andere taken. Test-suite vereist een paar uur isolated dev.

---

## 9. Open beslismomenten

1. **Wachten op user input vs proactief fixen?** — Aanbeveling: wachten. Risico van blind fixen weegt zwaarder dan tijdverlies.
2. **Roll-back naar Build 215 als rotation-issue blijft?** — Geen optie; Build 216 heeft andere kritieke fixes.
3. **Externe library proberen?** — `react-native-image-resizer` is alternatief; minder maintained dan expo-image-manipulator.

---

*Update dit doc na user-input. Linkt naar Sentry-doc voor productie-monitoring + naar PostReview rotation comments voor context.*
