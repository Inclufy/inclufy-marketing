# Video Capture for Vloggers — Audit + Roadmap

**Datum:** 2026-05-07
**Auteur:** AI agent voor Sami Loukile (Inclufy / AMOS)
**Scope:** AMOS (Inclufy Marketing) iOS app
**Status:** Concept — voor go-live niet kritisch; post-launch sprint-werk
**Gerelateerde docs:** `docs/META_APP_REVIEW_SUBMISSION.md`, `docs/META_DEMO_VIDEO_SCRIPT.md`

---

## 1. Executive Summary

AMOS heeft op dit moment **basale video-capture** functionaliteit (60-sec opname → upload → playback in PostReview), maar **mist de essentiële vlogger-features** zoals trim, multi-take, voice-over, ondertitels, en automatische platform-specifieke aanpassing.

Voor go-live (zondag) is dat **OK** — single-shot < 60 sec werkt. Voor een serieus vlogger-publiek hebben we **3-4 weken sprint** nodig om de gaten te dichten. Dit document is de roadmap.

**TL;DR:**

| Niveau | Wat werkt | Wat ontbreekt | Tijd nodig |
|---|---|---|---|
| **MVP** (huidig) | Record 60 sec, upload, preview | Trim, multi-take, edit | Ready |
| **Vlogger-ready (V1)** | + trim, thumbnail, voice-over, captions | Background music, transitions | 2-3 weken |
| **Creator suite (V2)** | + scheduling, A/B, multi-cam | — | 4-6 weken extra |

---

## 2. Current State Audit

### 2.1 Capture flow

| Layer | File | Wat doet het | Status |
|---|---|---|---|
| UI | `src/components/CameraCapture.tsx:148` | `cameraRef.current.recordAsync({ maxDuration: 60 })` | ✅ Werkt |
| Mode-selector | `src/screens/LiveCaptureScreen.tsx:112` | Tab voor 'video' mode | ✅ Werkt |
| Mic permission | `CameraCapture.tsx:101` | iOS-vraag voor mic toegang vóór recording | ✅ Werkt |
| Recording UI | `CameraCapture.tsx:229-234` | Rode REC-badge tijdens opname | ✅ Werkt |
| Upload | `useCaptures.ts:104` | `contentType = mp4 / quicktime` op Supabase Storage | ✅ Werkt |
| DB row | `LiveCaptureScreen.tsx:313` | `go_captures.media_type='video'`, `media_url`/`storage_path` | ✅ Werkt |

**Beperkingen:**
- ⚠️ **Hard cap 60 sec** in `recordAsync({ maxDuration: 60 })` — vloggers willen 5-15 min
- ❌ Geen client-side transcoding — iOS levert `.mov` (HEVC), upload als-is
- ❌ Geen progress-indicator bij upload (large files = stille hang)
- ❌ Geen retry-bij-failure tijdens upload

### 2.2 Playback flow

| Layer | File | Wat doet het | Status |
|---|---|---|---|
| Player | `PostReviewScreen.tsx:24,54-72` | `expo-video` `<VideoView>` met `useVideoPlayer` hook | ✅ Werkt (vandaag gefixt — Bug 8) |
| Main preview | `PostReviewScreen.tsx:1602-1624` | VideoPreview voor `isVideo` met thumbnail-knop | ✅ Werkt |
| Platform mock cards | `PostReviewScreen.tsx:2892-2898` | LinkedIn/IG/FB mock-cards renderen `<VideoView>` | ✅ Werkt (vandaag gefixt) |
| Loading state | `PostReviewScreen.tsx:2906-2907` | Activity-indicator bij signed URL fetch | ✅ Werkt |

**Beperkingen:**
- ❌ Geen video-timeline (geen scrubbing in de preview)
- ❌ Geen volume-controls (alleen native controls)
- ❌ Geen poster/thumbnail keuze — eerste frame default

### 2.3 Publish flow

| Layer | File | Wat doet het | Status |
|---|---|---|---|
| Edge function | `publish-social/index.ts:175` | `contentType = video/mp4` |
| FB story | `publish-social/index.ts:367` | `storyBody.video_url = videoUrl` | ✅ Werkt |
| IG REELS | `publish-social/index.ts:425` | `media_type: 'REELS'` op Graph API | ✅ Werkt |
| LinkedIn video | nergens | LinkedIn video posting requires LMDP + multi-part upload | ❌ Niet geïmplementeerd |
| YouTube/TikTok | nergens | TikTok werkt manual; YouTube niet ondersteund | ❌ Niet geïmplementeerd |

### 2.4 Editing capabilities (volledig ontbrekend)

- ❌ Trim (knip begin/eind)
- ❌ Split (cut in midden)
- ❌ Voice-over (narratie over video)
- ❌ Background music
- ❌ Captions / subtitles
- ❌ Thumbnail-keuze
- ❌ Filters / kleurcorrectie
- ❌ Intro/outro (logo-bumper)
- ❌ Multi-clip merging

### 2.5 Bekende issues (open in product_issues)

| ID | Issue | Status |
|---|---|---|
| Bug 8 | Video black screen — `expo-av` niet geïmporteerd | ✅ Resolved (commit 401fdb6, expo-video added) |
| (Niet gerapporteerd) | 60 sec max — beperkt voor vloggers | Open |
| (Niet gerapporteerd) | Geen thumbnail picker — alleen "Voeg thumbnail toe" knop | Open |
| (Niet gerapporteerd) | Recording crasht bij phone-orientation tijdens opname | Onbevestigd |

---

## 3. Vlogger Requirements (target user)

### 3.1 Persona — "Solo Content Creator"

- **Use case**: dagelijkse vlog, product-review, behind-the-scenes, talking-head
- **Devices**: iPhone (front + rear camera), occasionally external mic
- **Outputs**: Instagram Reels (9:16, ≤90s), TikTok (9:16, ≤180s), YouTube Shorts (9:16, ≤60s), LinkedIn (16:9, ≤600s), Facebook (16:9, ≤240s)
- **Skill**: low-medium — wil GEEN Premiere Pro, wel snel resultaat
- **Time**: 5-10 min per video van capture naar publish

### 3.2 Must-have features (V1 / vlogger-ready)

1. **Recording > 60 sec** — minimaal 5 min, idealiter 15 min
2. **Trim** — knip de eerste 2 sec (camera-aan-stutter) en laatste 2 sec (afsluit-tap)
3. **Multi-take** — neem 3 versies, kies de beste, gooi de rest weg
4. **Voice-over** — neem audio op terwijl de video al opgenomen is
5. **Auto-captions** (NL/EN) — Whisper API → SRT-overlay
6. **Thumbnail-frame picker** — scrub naar de juiste frame, gebruik als cover
7. **Per-platform format export** — 9:16 voor IG/TikTok, 16:9 voor LinkedIn (auto-crop center)
8. **Compression** — 1080p H.264 max 25MB voor mobile-friendly upload
9. **Sentry-friendly upload** — progress + retry on failure

### 3.3 Nice-to-have (V2 / creator suite)

10. Background music library (royalty-free)
11. Sound effects + transitions (whoosh, cuts)
12. Logo intro/outro bumper (Inclufy brand)
13. Multi-cam (front + rear cuts)
14. Scheduling per platform met optimal-time
15. A/B variant exports (kort/lang version)
16. Color presets (warm, cinematic, neutral)
17. Speed-ramping (slow-mo, time-lapse)
18. Green-screen / virtual background

---

## 4. Gap Analysis

| Requirement | Huidig | Gap | Prio |
|---|---|---|---|
| Recording > 60s | 60s max | Verwijder of bump `maxDuration` | P0 (1 line) |
| Trim begin/eind | Niets | Nieuwe TrimScreen + ffmpeg-like lib | P0 |
| Multi-take | Niets | UI voor "Re-record" + take-list | P1 |
| Voice-over | Niets | Aparte audio-track recorder + mixer | P2 |
| Auto-captions | Niets | Whisper edge function + SRT overlay | P1 |
| Thumbnail picker | "Add thumbnail" image upload | Frame extraction op moment X | P0 |
| Format export | 1 video, no transform | ffmpeg lib voor crop/scale + per-platform export | P1 |
| Compression | Raw .mov upload | iOS native AVAssetExportSession via lib | P0 |
| Upload progress | Geen | Supabase Storage progress + retry | P0 |

**P0 = blocker voor vlogger-V1, P1 = belangrijke V1-feature, P2 = V2**

---

## 5. Proposed Architecture

### 5.1 Lib stack

| Doel | Aanbevolen lib | Waarom |
|---|---|---|
| Recording | `expo-camera` v55+ | Al in gebruik. Bump `maxDuration`. Native, stabiel. |
| Playback | `expo-video` v55+ | Al in gebruik. Stable iOS support. |
| Trim + transform | `react-native-video-processing` of `expo-av` (deprecated maar werkt) of **`@shopify/react-native-video-trim`** | Trim native via AVFoundation. Geen ffmpeg-bundled (= grotere binary). |
| Compression | iOS `AVAssetExportSession` via `react-native-video-processing` | Native, geen ffmpeg-overhead |
| Captions | OpenAI Whisper edge function → SRT | Cloud-side; AMOS heeft al edge functions |
| Thumbnail | `expo-video-thumbnails` | Officiële Expo lib voor frame extraction |
| Voice-over | `expo-av` Audio.Recording + custom mixer | Audio-track recorder + later combineren |

→ **Geen ffmpeg-bundled** in app. Native APIs zijn snel genoeg en houden binary klein (App Store size limit).

### 5.2 Data model uitbreiding

`go_captures` tabel:

```sql
ALTER TABLE public.go_captures ADD COLUMN IF NOT EXISTS video_duration_sec INTEGER;
ALTER TABLE public.go_captures ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;
ALTER TABLE public.go_captures ADD COLUMN IF NOT EXISTS video_thumbnail_frame_ms INTEGER;
ALTER TABLE public.go_captures ADD COLUMN IF NOT EXISTS video_trim_start_ms INTEGER DEFAULT 0;
ALTER TABLE public.go_captures ADD COLUMN IF NOT EXISTS video_trim_end_ms INTEGER;
ALTER TABLE public.go_captures ADD COLUMN IF NOT EXISTS captions_srt_url TEXT;
ALTER TABLE public.go_captures ADD COLUMN IF NOT EXISTS audio_voiceover_url TEXT;
```

Nieuwe tabel `go_video_takes`:

```sql
CREATE TABLE IF NOT EXISTS public.go_video_takes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capture_id UUID NOT NULL REFERENCES public.go_captures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  take_number INTEGER NOT NULL,
  media_url TEXT NOT NULL,
  duration_sec INTEGER,
  is_chosen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 Screen flow voor vlogger

```
LiveCaptureScreen (mode='video')
  │
  ├─ tap REC → record up to 5 min
  ├─ stop → preview, choices: [Re-record] [Trim & continue] [Cancel]
  │
  ├─ TrimScreen
  │    timeline-scrubber + start/end handles
  │    [Generate captions] toggle
  │    [Choose thumbnail frame] selector
  │
  ├─ VoiceOverScreen (optional)
  │    re-play video silent + record audio overlay
  │
  └─ PostReview (existing — no changes)
       per-platform mock-cards already render <VideoView>
       publish-social handles per-platform formats
```

### 5.4 Per-platform aspect ratio handling

| Platform | Optimale ratio | Max length | Max size | AMOS strategie |
|---|---|---|---|---|
| LinkedIn (feed) | 16:9 (1920×1080) | 10 min | 5 GB | Pass-through original of crop center |
| LinkedIn (vertical post) | 1:1 (1080×1080) | 10 min | 5 GB | Center-crop + pad |
| Instagram Reel | 9:16 (1080×1920) | 90 sec | 100 MB | Center-crop + force trim ≤90s |
| Instagram Feed | 1:1 of 4:5 | 60 sec | 100 MB | Same |
| TikTok | 9:16 (1080×1920) | 180 sec | 287 MB | Trim ≤180s + crop |
| YouTube Shorts | 9:16 (1080×1920) | 60 sec | 256 MB | Trim ≤60s + crop |
| Facebook (feed) | 16:9 of 1:1 | 240 min | 10 GB | Pass-through |

**Implementatie**: één bron-video uploaded; bij publish per-platform on-the-fly transformatie via edge function (`process-video-export`) die ffmpeg in een Supabase Edge Function draait, OR client-side per platform. **Native client-side is sneller en goedkoper** voor MVP.

---

## 6. Phase 1 — MVP go-live (vandaag, geen extra dev werk)

**Wat werkt nu (build 217+):**
- Record 60 sec
- Upload als mp4
- Preview in PostReview met `<VideoView>` (vandaag gefixt)
- Publish naar IG REEL + FB Story

**Geschikt voor:**
- Single-shot vlogs ≤60s
- Quick behind-the-scenes
- Event recap clips

**Niet geschikt voor:**
- Talking-head vlogs > 1 min
- Tutorial / how-to (te kort)
- Polished content (geen edit)

**Wat te zeggen tegen vroege users:**
> "AMOS Marketing video v1 — record up to 60 seconds, post to Instagram & Facebook automatically. Editing tools coming in v2 (eind mei)."

---

## 7. Phase 2 — Vlogger-ready V1 (sprint van 2-3 weken)

### Sprint goals
1. Recording tot 5 min
2. Trim screen
3. Thumbnail picker
4. Auto-captions (NL/EN)
5. Per-platform format adaptation
6. Upload progress + retry

### Dev breakdown

| Taak | Tijd | Lib/dep |
|---|---|---|
| Bump `maxDuration` 60 → 300 + UI-warning bij file size | 1u | bestaand |
| Install `react-native-video-processing` + iOS link | 2u | nieuw |
| TrimScreen UI (timeline + scrubber) | 1d | nieuw |
| `react-native-slider` voor scrubber | 1u | nieuw |
| Trim-action via `RNVideoProcessing.trim(uri, startMs, endMs)` | 4u | bestaand |
| `expo-video-thumbnails` → frame extraction | 2u | nieuw |
| Thumbnail picker UI | 4u | nieuw |
| Whisper edge function (transcribe video → SRT) | 1d | OpenAI API + Supabase Edge |
| Caption-overlay UI (toggle SRT in/uit) | 4u | bestaand `<VideoView>` met overlay |
| Per-platform export (`exportForChannel(uri, ratio, maxLen)`) | 1d | RNVP crop+trim |
| Upload progress + retry in `useCaptures.ts` | 1d | Supabase Storage progress events |
| TestFlight beta + feedback round | 3d | — |

**Totaal:** ~15 dev-dagen (3 weken bij 1 dev, 1.5 weken bij 2 dev)

### Risk
- `react-native-video-processing` heeft beperkte iOS 26.4 testdekking — eerst PoC op een test-branch
- Whisper edge function = OpenAI kosten (~$0.006/min audio) — bij 1000 vlogs/maand = ~€60/mnd OpenAI
- Per-platform export tijd: 30 sec - 2 min per platform op iPhone — overweeg backgrounding

---

## 8. Phase 3 — Creator suite V2 (4-6 weken extra)

| Feature | Tijd | Lib |
|---|---|---|
| Voice-over recording + mix | 5d | `expo-av` Audio.Recording + `RNVP.merge` |
| Background music library (10 royalty-free tracks) | 3d | static asset bundle + UI picker |
| Logo intro/outro bumper | 2d | RNVP concat |
| Multi-cam cuts (front+rear) | 5d | aparte feature, complex |
| Scheduling met optimal-time | 3d | Supabase Postgres cron + edge func |
| A/B variant exports | 3d | UI voor 2 versie-output |
| Color presets | 4d | Filter via Metal / iOS Core Image |
| Speed-ramping | 3d | RNVP speed-change action |
| Green-screen | onbekend | mogelijk niet binnen mobiel-app — skip voor B2B |

**Totaal V2:** ~5-6 weken bij 1 dev. Plus ongoing maintenance op de wijde lib-stack.

---

## 9. Cost / time estimate

### Dev-uren (excl. design + QA)

| Phase | Dev-uren | Calendar weken (1 dev) | Calendar weken (2 dev) |
|---|---|---|---|
| MVP (= nu) | 0 | klaar | klaar |
| V1 (vlogger-ready) | ~120u | 3 | 1.5 |
| V2 (creator suite) | ~200u | 5 | 2.5 |

### Externe kosten (op maand-basis bij 1000 actieve vloggers)

| Item | Maandkosten |
|---|---|
| Whisper API (auto-captions) | €60 |
| Supabase Storage (extra video volume, ~5 GB/user/maand × 1000 × 5GB = 5TB) | €130 |
| Supabase Bandwidth (downloads naar IG/TikTok via API) | €80 |
| **Totaal** | **~€270/maand** |

→ Bij €15-30/maand pricing per vlogger: 18-20 betalende vloggers = break-even.

---

## 10. Risico's + mitigaties

| Risico | Kans | Impact | Mitigatie |
|---|---|---|---|
| `react-native-video-processing` werkt niet stabiel op iOS 26 | Medium | Hoog | PoC op test-branch eerst; fallback `expo-av` Audio.Recording + custom AVFoundation bridge |
| Whisper kosten exploderen bij gratis-tier abuse | Medium | Medium | Rate-limit per user (10 min/dag gratis, daarna paid plan) |
| iPhone storage vol bij multi-take | Hoog | Medium | Auto-delete unused takes na 24u, warning bij <500MB beschikbaar |
| Apple App Review weigert door video-rechten | Laag | Hoog | Privacy-policy update + Mic + Camera permission strings clarifying purpose |
| Vlogger-publiek is te niche binnen MKB | Medium | Medium | Validate via 5 demo-vloggers vóór V1 sprint start |

---

## 11. Aanbeveling

**Voor go-live deze week (zondag):**
- ✅ Doe niets extra. MVP (single-shot 60s) is acceptabel als "v1.0 video"
- ✅ Communiceer in App Store description: "Video recording + auto-publish to Reels & Facebook. Advanced editing in v1.1"

**Post-launch (week 1-3 na go-live):**
- 🚀 **Sprint V1 vlogger-ready** — 3 weken, scope strict gelocked op P0/P1 features
- Beta-test met 5-10 vloggers uit eigen netwerk (Almere creators, Inclufy partners)
- Iterate based on feedback voordat V2 wordt overwogen

**Post-V1 (maand 2-3):**
- 📊 Meet adoption: hoeveel videos/dag, hoeveel posts gepubliceerd, hoeveel time-to-publish?
- Beslis V2 op basis van data, niet aanname

---

## 12. Volgende stap

Als Sami akkoord is met deze roadmap:

1. **Vandaag**: niets — focus op go-live photo-flow
2. **Maandag (na launch)**: review deze doc met team + scope V1 sprint
3. **Dinsdag**: start sprint V1 — eerste taak: PoC `react-native-video-processing` op test-branch
4. **Deadline V1**: 28 mei 2026 (3 weken vanaf 7 mei)

---

*Dit document is een levend roadmap. Update na elke sprint-review met nieuwe data + aanpassingen.*
