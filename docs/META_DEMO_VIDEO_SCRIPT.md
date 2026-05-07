# Meta App Review — Demo Video Script (production-ready)

**Doel:** 4-5 minuten video die Meta-reviewers laat zien hoe AMOS gebruikt wordt voor het publiceren naar Facebook Pages + Instagram Business via de aangevraagde scopes.

**Format:** 1080p MP4, voice-over in **Engels** (Meta's reviewers zijn globaal). Ondertitels niet nodig.

**Upload:** YouTube → unlisted, OF Vimeo → password protected. Plak URL in submission form.

---

## Pre-flight checklist (15 min vóór opname)

### A. Test-omgeving klaarzetten
- [ ] iPhone met TestFlight build van AMOS geïnstalleerd
- [ ] Ingelogd als `sami@inclufy.com`
- [ ] Settings → Social Media gekoppeld:
  - LinkedIn: persoonlijk (Sami Loukile) + Inclufy_Ecosystem company page
  - Instagram: `@inclufy_ecosystem` (Business)
  - Facebook: `Inclufy Ecosystem` page
- [ ] Bug 2 IG-cleanup-SQL gerund (account_type='business' bevestigd)
- [ ] Build 212 (na Sentry-fix) is in TestFlight

### B. Demo-content voorbereiden
- [ ] Eén testfoto klaar in Photo Library (bv. een AMOS app icoon, een foto van een whiteboard, of een prop-event-foto)
- [ ] Tekst-snippet om als note te plakken: `"Q3 partner summit kickoff at Inclufy HQ — building the AI ecosystem together"` (Engels)
- [ ] Bevestig dat er geen private/nsfw content in beeld kan komen tijdens screen-recording

### C. Recording setup
- [ ] **Mac**: gebruik QuickTime → File → New Movie Recording → input "iPhone (via USB or AirPlay)" → Record. Dit geeft schermopname van iPhone met crisp 1080p+
- [ ] **Voice-over**: gebruik externe USB-mic of AirPods. Niet de Mac-ingebouwde mic
- [ ] **Stille omgeving** — Meta-reviewers letten op verstaanbaarheid
- [ ] Zet **Niet-storen-modus AAN** op iPhone tijdens opname (geen notificaties die in beeld popnen)

### D. Browser-tabs klaar
Open in Safari op je Mac, naast iPhone-recording:
- [ ] `linkedin.com/company/inclufysolutions` (om te tonen dat post live komt op company page)
- [ ] `facebook.com/inclufyecosystem` (idem voor FB)
- [ ] `instagram.com/inclufy_ecosystem` (idem voor IG)

→ Tijdens recording switch je tussen iPhone-screen en deze tabs om "post landed live" te bewijzen.

---

## Shot list — 4 minuten 30 seconden

### 🎬 Scene 1 — Intro [0:00–0:20] (20 sec)

**Wat in beeld:** Dropbox/Inclufy logo, of AMOS app icon op iPhone home screen.

**Voice-over (English):**
> "Hi, I'm Sami Loukile, founder of Inclufy BV based in Almere, Netherlands. AMOS is our event-based marketing app for SMBs. In this video I'll demonstrate the Facebook Page and Instagram Business publishing flows we're requesting production access for."

**Cut to:** AMOS app icon → tap → app opens.

---

### 🎬 Scene 2 — Settings & connected accounts [0:20–0:50] (30 sec)

**Wat in beeld:**
1. AMOS opens → tap **Instellingen** (Settings) → scroll to **Social Media** section
2. Show the list with all 5 connected accounts:
   - LinkedIn: 2 verbonden (Sami Loukile + Inclufy_Ecosystem)
   - Instagram: 1 verbonden (@inclufy_ecosystem)
   - Facebook: 1 verbonden (Inclufy Ecosystem)
3. Pause 2 sec on the screen so reviewer can read

**Voice-over:**
> "Users connect their Meta accounts here. The OAuth flow shows the consent screen with all requested scopes — Pages access, Page management, Instagram basic, and Instagram content publishing. Once approved, AMOS lists each managed Facebook Page and linked Instagram Business account."

---

### 🎬 Scene 3 — OAuth consent recap [0:50–1:20] (30 sec)

**Wat in beeld:**
1. Tap **+** next to Facebook (or Disconnect → Reconnect to show fresh)
2. Meta consent screen opens in in-app browser
3. **Highlight (zoom or arrow overlay) the scope list** on the consent screen:
   - "Manage your Pages"
   - "Create content on your Pages"
   - "Access your Instagram Business profiles"
   - "Create content on your Instagram Business accounts"
4. Tap **Allow** (or just show — don't actually re-approve if not needed)

**Voice-over:**
> "The Meta consent screen shows exactly which scopes we request — `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`. Nothing is hidden, and the user can deny at any time."

---

### 🎬 Scene 4 — Capture content [1:20–2:00] (40 sec)

**Wat in beeld:**
1. Back to AMOS Main → tap **+** (new post / capture)
2. Select photo from library OR use camera
3. After capture: PostReview opens
4. AI generation runs (briefly) → drafts appear
5. Show that **4 platform tabs** are visible: LinkedIn / Instagram / Facebook / WhatsApp

**Voice-over:**
> "AMOS' differentiator is on-site capture. I take a photo at a partner event, add a brief note, and our AI generates platform-optimized post drafts in under 10 seconds. Each platform — LinkedIn, Instagram, Facebook, WhatsApp — gets its own tab with appropriate length, tone, and hashtags."

---

### 🎬 Scene 5 — Account picker (multi-select) [2:00–2:40] (40 sec)

**Wat in beeld:**
1. On the Facebook tab, tap **Publiceer** (Publish)
2. Account picker modal appears showing:
   - "Inclufy Ecosystem" Facebook Page (with logo)
3. **Don't tap publish yet** — switch to Instagram tab, tap Publiceer there too
4. Account picker shows:
   - `@inclufy_ecosystem` IG Business
   - Possibly `loukile_sami` (personal) marked with warning "⚠️ Vereist Business + FB-koppeling"
5. Pause to demonstrate the warning UI

**Voice-over:**
> "Before publishing, AMOS shows an account picker for every channel — even with a single connected account, we never auto-publish. The user consciously taps the destination. Personal Instagram accounts are surfaced with a warning that they cannot publish via API."

---

### 🎬 Scene 6 — Publish to Facebook [2:40–3:20] (40 sec)

**Wat in beeld:**
1. Back to FB tab → Publiceer → pick Inclufy Ecosystem → confirm
2. Loading spinner → success alert "✅ Gepubliceerd"
3. Switch to Mac browser → Facebook page tab → refresh
4. **Show the post live** on `facebook.com/inclufyecosystem`
5. Highlight: post is attributed to **Page brand**, not personal

**Voice-over:**
> "Behind the scenes, AMOS calls `pages_manage_posts` with the page access token to create a Photo node with our caption. The post lands on the Page, attributed to the Inclufy Ecosystem brand — not to my personal Facebook profile."

---

### 🎬 Scene 7 — Publish to Instagram [3:20–4:00] (40 sec)

**Wat in beeld:**
1. Back to AMOS IG tab → Publiceer → pick `@inclufy_ecosystem` → confirm
2. Loading spinner (~5-10 sec, IG takes longer than FB) → success
3. Switch to Mac browser → instagram.com/inclufy_ecosystem → refresh
4. **Show the post live** on Instagram

**Voice-over:**
> "For Instagram, AMOS uses a two-step flow: `instagram_content_publish` first creates a media container with the image URL and caption via `/{ig-id}/media`, then publishes it via `/{ig-id}/media_publish`. The post appears on `@inclufy_ecosystem` immediately."

---

### 🎬 Scene 8 — Error handling + disconnect [4:00–4:30] (30 sec)

**Wat in beeld:**
1. Back to AMOS Settings → Social Media
2. Long-press or tap menu on Facebook row → **Disconnect**
3. Confirmation dialog → confirm
4. Row removed, show empty state for Facebook
5. (Optional) Show a forced TOKEN_EXPIRED state if you can mock it — otherwise just describe via voice-over

**Voice-over:**
> "Tokens are validated before each publish. When a token is expired, AMOS shows a clear reconnect prompt instead of silently failing. Disconnecting in Settings revokes our server-side access and clears the OAuth tokens within 30 seconds."

---

### 🎬 Scene 9 — Closing [4:30–4:50] (20 sec) — optional outro

**Wat in beeld:**
- AMOS app icon on iPhone home screen, OR
- Inclufy.com landing page on Mac browser

**Voice-over:**
> "AMOS is used by SMBs across the Netherlands who need to maintain a professional brand presence without dedicated social media staff. Multi-channel publishing via Meta APIs is the core of our value proposition. Thank you for reviewing our application."

---

## Total runtime: ~4:30 min

**Min: 3:00** (Skip Scene 9 + tighten transitions)
**Max: 5:00** (Add a bonus Story 1 use case at the start)

---

## Post-production checklist

- [ ] Trim to 4:30 max (Meta reviewers stop watching after 5 min)
- [ ] Add subtle **lower-third title cards** for each scene (e.g., "Settings & Connected Accounts", "OAuth Consent")
- [ ] Add **0.5s zoom** on the OAuth consent scope list (Scene 3) — Meta reviewers MUST see scopes clearly
- [ ] Add **arrow/circle overlay** on key UI elements (account picker rows, scope list, success alerts)
- [ ] Background music: **none** OR very low-volume corporate-vibe (royalty-free, e.g., from YouTube Audio Library)
- [ ] No third-party watermarks (no QuickTime, no ScreenFlow logo)
- [ ] Export at 1080p H.264, max 100 MB for fast upload
- [ ] Upload to YouTube **unlisted** (NOT public — keeps it review-only)
- [ ] Test the unlisted URL in incognito tab to confirm it plays

---

## Common Meta-rejection reasons (avoid these in video)

| Reason | How to avoid |
|---|---|
| "Permission usage not clearly shown" | Each scope must be visible in action — show consent screen + actual API call result |
| "Demo video doesn't match the app shown" | Use the production TestFlight build, not a dev simulator |
| "Cannot identify the user/account" | Voice-over should say your name + role + company at start |
| "Post privacy policy URL" | Make sure inclufy.com/privacy is live with Meta section before submitting |
| "App not findable" | Have a TestFlight invite link OR App Store URL ready in the form |

---

## Optional: Subtitle file (.srt) for higher acceptance rate

Meta tolerant van geen subtitles, maar reviewers in non-English-native regio's kunnen sneller scannen met srt. Als je tijd hebt:
1. Use Descript or otter.ai om automatic transcript te genereren
2. Export als .srt
3. Upload naast de video op YouTube

---

## Recording-quality tips (van apps die approval kregen)

- **Verticale recording is OK** voor Mobile-app demos — Meta accepteert beide
- **Geen jitter** — gebruik een rotsvaste hand of zet iPhone in een houder als je hardware demo doet
- **Voice-over volume**: -12 to -6 dB (niet te zacht — reviewers werken vaak zonder headphones)
- **No fast cuts** — geef minstens 1.5 sec per scherm zodat reviewer kan lezen
- **Geen background apps actief** — sluit Slack, Mail, etc. tijdens de recording (notifications)

---

*Use this script as your shot-by-shot guide while recording. After upload, paste the YouTube/Vimeo URL into the Meta App Review form's "Demo video" field for each requested permission.*
