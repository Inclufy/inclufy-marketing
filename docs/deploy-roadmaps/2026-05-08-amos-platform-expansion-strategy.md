# AMOS Platform Expansion Strategy

**Datum:** 2026-05-08
**Status:** Strategic roadmap — voor Q3 2026 t/m Q4 2027
**Scope:** Multi-platform expansion + vertical specialization + Capture-to-Ad evolution
**Doel:** Groeien van organic-only AMOS (FB+IG+LinkedIn) naar full-funnel marketing automation suite met vertical-specific go-to-market.

---

## 1. Executive Summary

AMOS positioneert zich vandaag als "moment-to-publication" multi-channel publishing tool voor SMBs. Drie strategische uitbreidingsrichtingen creëren een 8-10x ARR-groei opportunity:

1. **Platform breedte** — van 3 naar 8 organic platforms (TikTok, Pinterest, Threads, YouTube Shorts, Snapchat manual)
2. **Vertical specialisatie** — F&B / Hospitality / Real Estate vertical tiers met domain-specific AI
3. **Funnel diepte** — Capture-to-Ad: organic content wordt AI-geoptimaliseerde paid ads

Effort over 18 maanden: ~12 dev-weken plus marketing+sales investeringen. Verwachte ARR-uplift: van €29/user-tier naar €59-249/user-tier afhankelijk van vertical + ad-features.

---

## 2. Huidige stand (Q2 2026)

| Component | Status |
|---|---|
| Wizard FB/IG/LinkedIn organic publish | ✅ Live (Build 228) |
| Brand voice AI analyzer | ✅ Live (90-day cache profiles) |
| TikTok OAuth code | ✅ In oauth-callback, geen publish-flow |
| LinkedIn LMDP submitted | ⏳ Approval pending (2-12 wk) |
| Meta App Review | ⏳ Submitted/pending |
| Pinterest, Threads, YouTube, Snap | ❌ Niet geïmplementeerd |
| Ads-feature | ❌ Niet geïmplementeerd |
| Vertical tiers | ❌ Generic SMB pricing only |

---

## 3. Platform expansion roadmap

### 3.1 Per-platform analyse

| Platform | API beschikbaar | AMOS fit | Effort | Prio |
|---|---|---|---|---|
| **TikTok** organic | ✅ | ⭐⭐⭐ | 3 dagen | **1ste** |
| **Pinterest** organic | ✅ | ⭐⭐⭐ | 3 dagen | **2de** |
| **Threads** organic | ✅ (via Meta app) | ⭐⭐ | 1.5 dag | **3de** |
| **YouTube Shorts** | ✅ | ⭐⭐ | 5 dagen | 4de |
| **Snapchat Pad A** (manual) | ❌ API; ⚠️ Manual share | ⭐ | 1 dag | 5de |
| **Snapchat Ads** | ✅ Marketing API | ⭐⭐ | 5 dagen | Bij ads-fase |
| **X / Twitter** organic | ✅ | ⭐⭐ | 2 dagen | Skip tot 50 klanten (cost) |

### 3.2 TikTok organic (1ste prioriteit)

**Status code-side:**
- ✅ `Channel` type bevat `'tiktok'`
- ✅ `oauth-callback/index.ts` line 334-373 heeft TikTok OAuth
- ✅ Wizard StepConnect heeft TikTok als "Beta" platform
- ✅ Wizard scopes: `user.info.basic`, `video.publish`, `video.list`
- ❌ `publish-social/index.ts` mist TikTok branch
- ❌ PostReview heeft geen TikTok tab

**Wat te doen:**

1. **TikTok Developer Portal setup** (Sami, 1×):
   - https://developers.tiktok.com → Create App
   - App naam: AMOS by Inclufy
   - Redirect URI: `https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/oauth-callback`
   - Scopes aanvragen: `user.info.basic`, `video.publish`, `video.list`
   - Submit voor verification (TikTok review proces, 7-14 dagen)

2. **publish-social/index.ts TikTok branch** (1.5 dag dev):
   ```ts
   if (channel === 'tiktok') {
     // Step 1: Init video upload
     POST /v2/post/publish/inbox/video/init/
     // Returns: upload_url + video_id

     // Step 2: Upload video bytes
     PUT {upload_url}

     // Step 3: Publish
     POST /v2/post/publish/video/init/
     // body: { post_info: { title, privacy_level, ... }, source_info }
   }
   ```
   Specs: MP4, max 4 min, max 287MB unverified. Verticaal 9:16 aanbevolen.

3. **PostReview TikTok tab** (0.5 dag):
   - Add `'tiktok'` to channel selector
   - AI prompt template: kort, casual, hashtag-heavy
   - Video-only validatie (geen photo-only TikTok)

4. **Beperkingen documenteren:**
   - 5 video's/dag/user (TikTok rate limit unverified apps)
   - Geen carousel, geen photo-only posts (alleen video)
   - Privacy level: `PUBLIC_TO_EVERYONE` of `MUTUAL_FOLLOW_FRIENDS`

### 3.3 Pinterest organic (2de prioriteit)

**Status code-side:** Niets aanwezig — clean slate.

**Wat te doen:**

1. **Pinterest Developer Portal setup** (1×):
   - https://developers.pinterest.com → Create App
   - App naam: AMOS by Inclufy
   - Redirect URI: `https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/oauth-callback`
   - Scopes: `pins:write`, `boards:write`, `boards:read`, `user_accounts:read`
   - Verification: 1-2 weken Pinterest review

2. **OAuth flow toevoegen** (0.5 dag):
   - oauth-callback Pinterest branch
   - Token exchange: `POST /v5/oauth/token`
   - Profile fetch: `GET /v5/user_account`

3. **publish-social Pinterest branch** (1 dag):
   ```ts
   if (channel === 'pinterest') {
     // Auto-create board als nodig
     POST /v5/boards { name, description }
     // Create pin
     POST /v5/pins {
       board_id,
       media_source: { source_type: 'image_url', url },
       title,
       description,  // SEO-optimized!
       link  // Click-through naar website
     }
   }
   ```

4. **PostReview Pinterest tab** (0.5 dag):
   - AI prompt: lange descriptions met SEO keywords (Pinterest is search!)
   - Board picker: existing boards of "Create new"
   - Click-through link veld voor commerce

5. **AI features specifiek voor Pinterest** (1 dag):
   - SEO keyword extraction uit capture context
   - Board name suggestion ("Maandag Specials", "Vegan opties")
   - Idea Pin format detection (stories-format)

### 3.4 Threads organic (3de prioriteit)

**Status code-side:** Niets, maar Meta app heeft al **"Access the Threads API"** use case beschikbaar (zagen we eerder in use cases lijst).

**Wat te doen:**

1. **Activeer Threads use case** in Meta App dashboard (5 min):
   - https://developers.facebook.com/apps/947950264797942/use_cases/
   - Add use case → Threads API
   - Customize permissions: `threads_basic`, `threads_content_publish`

2. **OAuth scopes uitbreiden** (0.25 dag):
   - Voeg `threads_basic`, `threads_content_publish` toe aan FB OAuth scope list
   - Threads gebruikt zelfde Meta OAuth als FB/IG

3. **publish-social Threads branch** (0.5 dag):
   ```ts
   if (channel === 'threads') {
     // Step 1: Create container
     POST /v1.0/me/threads {
       media_type: 'IMAGE' | 'VIDEO' | 'TEXT',
       text,
       image_url
     }
     // Step 2: Publish container
     POST /v1.0/me/threads_publish { creation_id }
   }
   ```

4. **PostReview Threads tab** (0.25 dag):
   - Text-first format (max 500 chars)
   - Optionele image
   - AI prompt: Twitter-achtig, conversational, korter dan IG

5. **Auto-cross-post** (optioneel, 0.5 dag):
   - Toggle: "Cross-post Instagram → Threads automatisch"
   - Voor Inclufy_Ecosystem doen we dit altijd → consistency

### 3.5 YouTube Shorts (4de prioriteit)

**Status code-side:** Niets.

**Wat te doen:**

1. **Google Cloud Console** (1 dag, inclusief Google verification):
   - Create project, enable YouTube Data API v3
   - OAuth 2.0 client ID
   - Verification: 1-7 dagen Google review (afhankelijk scope-set)
   - Scopes: `youtube.upload`, `youtube.readonly`

2. **OAuth flow** (1 dag):
   - oauth-callback YouTube branch
   - Channel discovery: `GET /youtube/v3/channels?mine=true`
   - Multi-channel support (personal + brand channels)

3. **publish-social YouTube branch** (2 dagen):
   ```ts
   // Resumable upload
   POST /upload/youtube/v3/videos?uploadType=resumable&part=snippet,status
   // Headers: X-Upload-Content-Length, X-Upload-Content-Type
   // Body: { snippet: { title, description, tags, categoryId },
   //        status: { privacyStatus: 'public' | 'unlisted', shortFormVideo: true } }

   // Then PUT to upload_url with video bytes (chunked)
   ```

4. **PostReview YouTube Shorts tab** (1 dag):
   - Vertical 9:16 video required (max 60 sec)
   - Title (100 chars), description (5000 chars), tags
   - Channel picker (personal + brand channels)

### 3.6 Snapchat Pad A — Manual share (5de prioriteit)

**Strategie:** Geen API maar wel deep-link share workflow.

**Wat te doen** (1 dag totaal):

1. **PostReview Snapchat tab** met "Manual share" indicator
2. AI generates Snap-optimized:
   - Vertical 9:16 video (auto-conversion)
   - Snap-style overlay text
   - Casual caption met emoji
3. **Export to Camera Roll** + show success alert
4. **Deep-link prompt:** "Open in Snapchat" → `snapchat://camera`
5. User plakt content zelf in Snap → 5 sec extra werk
6. Track in DB als `account_type='manual'` zonder publish-API call

Geen Snap-account / verification nodig. Werkt direct.

---

## 4. AMOS Capture-to-Ad evolution (Fase 2-3)

### 4.1 Strategische pivot

**Vandaag:** AMOS = "Capture → AI generate → Publish to organic feeds"

**Volgende stap:** AMOS = "Capture → AI generate → Multi-channel organic + paid ads"

**Differentiator t.o.v. concurrentie:**

| Tool | Mist t.o.v. AMOS Capture-to-Ad |
|---|---|
| Buffer Boost | Geen content capture, alleen scheduling |
| Hootsuite Boost | Idem — geen AI creative generation |
| Canva Ads | Templates only, geen real footage |
| AdCreative.ai | Generic AI, geen brand voice, geen capture |
| Smartly.io | Enterprise, complex, niet voor SMBs |
| **AMOS Capture-to-Ad** | ✅ Capture + brand voice + multi-platform native |

### 4.2 Per capture-category → ad-format mapping

| AMOS capture | Optimale ad-format | Beste platforms |
|---|---|---|
| Product capture | Catalog ads, Carousel | Meta + TikTok + Pinterest |
| Vlog (founder) | Story ads, Reels | IG + TikTok + Snap |
| Behind-the-scenes | Authenticity ads | Meta + Snap |
| Event capture | Live promotion | Meta + Snap |
| Educational | Carousel, Slideshow | LinkedIn + FB |
| Quote / testimonial | Trust ads, Static | LinkedIn + FB |
| **Restaurant dish** | **Photo ads, Catalog** | **Pinterest + IG + Meta** |

### 4.3 "Boost this post" — eerste ad-feature

```
[Klant publiceert organic post via AMOS]                   
        ↓                                                  
[24u monitoring engagement]                                
        ↓                                                  
[AMOS detecteert top-performer (3x boven gemiddelde)]      
        ↓                                                  
[Push notification: "🚀 Promote deze post als ad?"]        
        ↓                                                  
[AMOS AI suggesteert:                                      
  - Budget: €25-50 voor 3 dagen                            
  - Audience: lookalike van Page volgers                   
  - Duration: 3 dagen                                      
  - 3 creative variants automatisch gegenereerd]           
        ↓                                                  
[Klant: 1-tap "Promote"]                                   
        ↓                                                  
[AMOS calls Meta Marketing API → ad live]                  
        ↓                                                  
[Performance terug in AMOS dashboard]                      
```

**Dev effort:** ~3 weken voor Meta Boost feature alleen. Daarna ~2 weken per extra platform.

### 4.4 Revenue model voor ads

**Optie A — Tier-based:**
| Tier | €/mo | Boost feature |
|---|---|---|
| AMOS Pro | €29 | Geen boost |
| AMOS Promote | €99 | Boost via Meta only |
| AMOS Ads | €249 | + TikTok + Pinterest + LinkedIn |

**Optie B — Commission-based:**
- Geen tier-fee voor boost
- AMOS pakt 5-10% commission op ad spend
- Klant doet €100 ad spend → AMOS revenue €5-10
- Schaalt mee met klant's success

**Aanbevolen: Hybride (Optie A baseline + Optie B als groeiknop)**

---

## 5. Vertical specialisatie strategie

### 5.1 F&B / Restaurant vertical (eerste vertical)

**Why F&B first:**
- Restaurants zijn visueel-zwaar (perfect voor AMOS capture-flow)
- Hoge bereidheid om voor SMM-tooling te betalen (€59+/mo accepteerbaar)
- Sterke fit met Pinterest (food = top-3 category)
- Sterk in jouw 3 markten (NL/Marokko/UAE)
- Meetbare ROI: pin → reservation → revenue

**Markt:**
| Markt | F&B SMBs | TAM (10% AMOS @ €59/mo) |
|---|---|---|
| NL | ~40.000 | €236k MRR |
| Marokko | ~25.000 | €100k MRR |
| UAE | ~15.000 | €150k MRR |
| **Totaal** | **80.000** | **€486k MRR** |

**F&B-specifieke AI features (extra t.o.v. generic AMOS):**

1. **Dish recognition AI**
   - Foto van pasta → AI: "Carbonara di mare, Italian cuisine"
   - Auto-tag: cuisine, ingredients, dietary (vegan/GF)
   - Endpoint: nieuwe `ai-dish-recognizer` edge function

2. **Recipe board generator (Pinterest)**
   - Auto-organize pins in boards: "Maandag specials", "Wijn pairings", "Dessert"
   - Klant hoeft geen Pinterest board management te doen

3. **Local SEO injection**
   - "Best pasta restaurant Amsterdam Centrum" in pin descriptions
   - Pinterest als local SEO kanaal

4. **Menu seasonal updates**
   - "Vorige week 4 nieuwe pasta's gepost — herhaal voor pinterest update?"
   - Auto-reminder voor consistent posting

5. **Reservation tracking integratie** (toekomst)
   - Klanten verbinden Toast / Resy / Booking.com
   - AMOS toont: "Pin XYZ leidde naar 3 reserveringen"

**F&B pricing tier:**
| Tier | €/mo | Features |
|---|---|---|
| AMOS Free | €0 | 5 captures/mo |
| AMOS Pro | €29/mo | Standard SMB features |
| **AMOS F&B** | **€59/mo** | + Dish recognition, recipe boards, F&B AI prompts, Pinterest priority |
| AMOS F&B + Promote | €129/mo | + Boost feature |

### 5.2 Andere verticals (na F&B)

| Vertical | Pinterest fit | Wanneer | Pricing tier |
|---|---|---|---|
| **F&B / Restaurants** | ⭐⭐⭐ | Q3 2026 (eerst) | €59/mo |
| **Hotels / Hospitality** | ⭐⭐⭐ | Q4 2026 | €79/mo |
| **Real Estate** | ⭐⭐⭐ | Q1 2027 | €99/mo |
| **Wedding venues / planners** | ⭐⭐⭐ | Q1 2027 | €79/mo |
| **Tour operators** (relevant Marokko!) | ⭐⭐⭐ | Q2 2027 | €79/mo |
| **Boutique retail** | ⭐⭐ | Q2 2027 | €49/mo |
| **Salons / spas** | ⭐⭐ | Q3 2027 | €49/mo |

---

## 6. Geconsolideerde roadmap (Q3 2026 - Q4 2027)

| Periode | Wat | Doel | Status |
|---|---|---|---|
| Week 19 (nu) | Wizard FB+IG+LinkedIn live testen | Bewijs huidige stack werkt | ⏳ Build 228 |
| Week 20 | Meta App Review submit | Productie-toegang advanced scopes | ⏳ |
| Week 21 | TikTok Developer App + code | Eerste nieuwe platform | Geplannd |
| Week 22-23 | Pinterest integration | F&B-killer platform | Geplannd |
| Week 24 | Threads (Meta use case al klaar) | Snel laaghangend fruit | Geplannd |
| Week 25 | F&B vertical AI features (dish recognition + boards) | Eerste vertical tier | Geplannd |
| Week 26-27 | YouTube Shorts | Video reach | Geplannd |
| Week 28 | Snapchat Pad A manual share | MENA influencer fit | Geplannd |
| Week 29-30 | Stabilisatie + bug fixing voor 5 platforms | Production-stable | Geplannd |
| **Q1 2027** | AMOS Promote (Meta Boost) | Eerste ad-feature | Strategic |
| **Q2 2027** | + TikTok Ads + LinkedIn Marketing API | Multi-platform ads | Strategic |
| **Q3 2027** | + Snap Ads + Pinterest Ads | All ads platforms | Strategic |
| **Q4 2027** | AMOS Ads premium tier launch | Pricing optimization | Strategic |

---

## 7. Code-architecture impact

### 7.1 Wat blijft hetzelfde

- Wizard flow (Goal → Status → Connect → Verify → Brand Voice → First Post)
- Brand voice analyzer per account
- AMOS capture flow (LiveCaptureScreen)
- Multi-platform PostReview tabs (uit te breiden)

### 7.2 Wat moet uitgebreid

- `Channel` type: `'tiktok'` (al), `'pinterest'`, `'threads'`, `'youtube'`, `'snapchat'`
- `social_accounts.account_type`: nieuwe waarden `'creator'`, `'channel'`
- `oauth-callback` per platform branch
- `publish-social` per platform branch
- AI prompts per platform format
- PostReview channel tabs (visual updates)

### 7.3 Nieuwe edge functions

- `ai-dish-recognizer` — F&B specific AI for cuisine + ingredient detection
- `ai-board-organizer` — Pinterest board structure suggestion
- `ai-ad-creative-generator` — variant generation voor Boost feature (Q1 2027)
- `ad-publish` — Meta + TikTok + LinkedIn Marketing API wrapper

### 7.4 DB migrations

- Nieuwe tabel `ad_campaigns` (Q1 2027)
- Nieuwe tabel `boards` per platform (auto-managed)
- Vertical preference op `profiles` table (F&B, Hospitality, etc.)

---

## 8. Marketing positionering per fase

| Fase | Positioning statement |
|---|---|
| Vandaag (organic) | "Capture once. Publish everywhere. Multi-channel content automation for SMBs." |
| + 5 platforms | "All your social channels. One capture. Zero hassle." |
| + F&B vertical | "Turn every dish into 5 social posts + Pinterest reservations." |
| + Boost feature | "From organic post to paid ad in one tap." |
| Final state | "AI-powered content + ads automation for visual SMB verticals." |

---

## 9. Risico's & mitigaties

| Risico | Mitigatie |
|---|---|
| Te veel platforms tegelijk = brittle code | Per-platform release gates (test 1× volledig vóór volgende start) |
| Meta App Review afwijzing voor Threads | Threads use case zit al in app, lager risico |
| TikTok account ban bij rate-limit overschrijding | Per-user rate limit warnings in app + queue management |
| Pinterest verification trager dan verwacht | Begin verification proces parallel met dev (week 22) |
| F&B vertical resoneert niet | Pilot met 5 restaurants vóór tier-launch (week 25) |
| Ad-features = juridische verantwoordelijkheid | Disclaimer + opt-in flow + alleen klant-geapproved budgets |
| Concurrent doet hetzelfde sneller | First-mover voordeel via brand voice differentiator + capture-first flow |

---

## 10. Beslismomenten voor Sami

| Wanneer | Beslissing |
|---|---|
| **Nu** | Goedkeuring fase 1-3 (TikTok + Pinterest + Threads) |
| Week 25 | Goedkeuring F&B vertical tier launch + pricing €59/mo |
| Week 30 | Goedkeuring AMOS Promote (Q1 2027 dev start) |
| Q1 2027 | Pricing-tier goedkeuring voor Promote/Ads tiers |
| Q2 2027 | Vertical expansie (Hotel, Real Estate) goedkeuring |

---

## 11. Concrete eerste stap (week 19)

Vandaag, na FB+IG live test:

1. **TikTok Developer App registratie** door Sami (15 min) — submit voor verification, parallel proces
2. **Pinterest Developer App registratie** door Sami (15 min) — idem
3. **Threads use case activeren** in Meta App dashboard (5 min)
4. Tijdens 7-14 dagen verification wait: dev werk aan publish-social branches
5. Na verification: live test → roll-out

Drie verificaties parallel = elk platform kan in week 21 worden geactiveerd.

---

## 12. Verwachte ARR-uplift

**Conservatief scenario** (per AMOS user, gemiddelde):

| Jaar | ARPU/mo | Reasoning |
|---|---|---|
| Vandaag | €15 (mix free/€29) | Generic SMB |
| Q4 2026 | €25 | + verticals dragen €59 |
| Q4 2027 | €45 | + Boost adoption + ads commission |

**Bij 1.000 betalende AMOS users:**
- Vandaag: €15k MRR / €180k ARR
- Q4 2026: €25k MRR / €300k ARR
- Q4 2027: €45k MRR / €540k ARR (3x groei)

**Bij 5.000 users (realistisch bij F&B vertical adoption):**
- €225k MRR / €2.7M ARR Q4 2027

---

## 13. Gerelateerde documenten

- `docs/META_DEMO_VIDEO_VOICEOVER.md` — Meta App Review video script
- `docs/META_APP_REVIEW_SUBMISSION.md` — Meta submission package
- `docs/SOCIAL_ACCOUNT_TYPES_REFERENCE.md` — Per-platform account types matrix
- `docs/deploy-roadmaps/2026-05-07-social-wizard-with-ai-design.md` — Wizard design
- `docs/deploy-roadmaps/2026-05-07-whatsapp-pad-b-cloud-api-setup.md` — WhatsApp Cloud API
- `docs/deploy-roadmaps/2026-05-07-social-wizard-with-ai-design.md` — Wizard architecture

---

*Dit document is de strategische ankerpaal voor AMOS' platform expansion in Q3 2026 - Q4 2027. Update na elk go/no-go beslismoment.*
