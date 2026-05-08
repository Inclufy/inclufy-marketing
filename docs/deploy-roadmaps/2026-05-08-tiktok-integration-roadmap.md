# TikTok Integration Roadmap

**Datum:** 2026-05-08
**Status:** Implementation roadmap — voor week 21 (na FB+IG live test)
**Effort:** ~3 dev-dagen + 7-14 dagen TikTok review (parallel)
**Pre-req:** Build 228+ live + FB/IG wizard flow getest

---

## 1. Status vandaag (audit)

### Wat al in code staat

| File | Wat |
|---|---|
| `src/types/index.ts:25` | `Channel` type bevat `'tiktok'` ✅ |
| `supabase/functions/oauth-callback/index.ts:334-373` | TikTok OAuth flow + token exchange + profile fetch ✅ |
| `src/components/wizard/StepGoal.tsx` | TikTok als "Beta" platform met "Beperkt: 5 video's/dag" hint ✅ |
| `src/components/wizard/StepConnect.tsx` | TikTok in `PLATFORM_META` + `SCOPE_LIST` ✅ |
| `src/screens/SettingsScreen.tsx:727` | TikTok OAuth URL constructie met `EXPO_PUBLIC_TIKTOK_CLIENT_KEY` ✅ |

### Wat ontbreekt

| File / Component | Wat |
|---|---|
| `supabase/functions/publish-social/index.ts` | TikTok publish branch (video upload + publish) ❌ |
| `src/screens/PostReviewScreen.tsx` | TikTok tab in channel selector ❌ |
| `supabase/functions/event-studio-ai/index.ts` | TikTok-specifieke AI prompt template ❌ |
| TikTok Developer Portal | App geregistreerd + verified ❌ |
| Env vars productie | `TIKTOK_CLIENT_KEY` + `TIKTOK_CLIENT_SECRET` in Supabase secrets ❌ |

---

## 2. TikTok Developer Portal setup (Sami doet dit, ~30 min + 7-14 dagen wait)

### 2.1 Account aanmaken

1. Open https://developers.tiktok.com
2. **Sign up** met je TikTok-account (gebruik `@inclufy_ecosystem` of separate developer-account)
3. Bevestig email + accept developer terms

### 2.2 App aanmaken

1. **Manage apps** → **Create App** (rechts boven)
2. Vul in:
   - **App name:** AMOS by Inclufy
   - **Category:** Business / Productivity
   - **Description:** Multi-channel marketing automation for SMBs. Captures + AI-generated content + multi-platform publishing.
   - **Website:** `https://inclufy.com`
   - **Privacy URL:** `https://inclufy.com/privacy`
   - **Terms URL:** `https://inclufy.com/terms`
3. **Submit**

### 2.3 Redirect URI configureren

1. App → **Login Kit** → **Configuration**
2. Add redirect URI:
   ```
   https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/oauth-callback
   ```
3. Save

### 2.4 Scopes aanvragen

In **Login Kit** → **Scopes**:

| Scope | Doel | Standard / Pending |
|---|---|---|
| `user.info.basic` | Username + avatar | Standard |
| `video.publish` | Upload + publish videos | Pending review |
| `video.list` | List user's videos | Standard |

→ `video.publish` is de cruciale scope. TikTok review process duurt 7-14 dagen.

### 2.5 Submit voor review

1. App → **Submit for review**
2. Vereist: live demo URL of TestFlight invite + use case beschrijving
3. Use case template:
   ```
   AMOS is een mobile marketing automation app voor SMBs.

   Use case for video.publish:
   Users capture moments at events (product launches, conferences),
   AMOS' AI generates a TikTok-optimized vertical video format with
   captions, hashtags, and music suggestions. User reviews in app
   and explicitly approves before publishing to their connected
   TikTok account.

   Anti-abuse measures:
   1. Per-post user confirmation (no bulk auto-posting)
   2. Account picker at publish time
   3. Rate limit compliance (5 videos/day for unverified users)
   4. Token refresh handled server-side
   5. User can disconnect TikTok in Settings → revokes tokens

   Test access: TestFlight link [VUL IN]
   Test account: [VUL IN]
   ```

### 2.6 Na approval — environment variables

Zodra approved:

1. App → **Credentials** → kopieer **Client Key** + **Client Secret**
2. Set in Supabase Edge Functions secrets:
   ```bash
   supabase secrets set TIKTOK_CLIENT_KEY=<client_key> --project-ref mpxkugfqzmxydxnlxqoj
   supabase secrets set TIKTOK_CLIENT_SECRET=<client_secret> --project-ref mpxkugfqzmxydxnlxqoj
   ```
3. EAS secret voor de app:
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_TIKTOK_CLIENT_KEY --value <client_key>
   ```
4. Update `ios/ci_scripts/ci_post_clone.sh` om `EXPO_PUBLIC_TIKTOK_CLIENT_KEY` in `.env.local` te schrijven (zelfde patroon als andere keys).

---

## 3. Code implementatie (~3 dev-dagen)

### 3.1 publish-social/index.ts — TikTok branch (~1.5 dag)

**TikTok publish flow is 3-stap:**

```typescript
// In supabase/functions/publish-social/index.ts

const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

async function publishTikTok(
  videoUrl: string,
  caption: string,
  accessToken: string,
  userId: string,
): Promise<{ publishId: string; videoId?: string }> {
  // ─── Step 1: Init video upload ────────────────────────────────────
  // Direct post (publishes immediately) — alternative is "inbox"
  // (saved as draft in user's TikTok inbox).
  const initRes = await fetch(`${TIKTOK_API_BASE}/post/publish/video/init/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: caption.substring(0, 2200), // TikTok max 2200 chars
        privacy_level: 'PUBLIC_TO_EVERYONE', // or 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
        video_cover_timestamp_ms: 1000, // first second as cover
      },
      source_info: {
        source: 'PULL_FROM_URL', // alternative: 'FILE_UPLOAD' for direct bytes
        video_url: videoUrl, // must be HTTPS, publicly accessible, MP4
      },
    }),
  });

  if (!initRes.ok) {
    const err = await initRes.text();
    throw new Error(`TikTok init failed: ${err}`);
  }
  const initData = await initRes.json();
  const publishId: string = initData.data?.publish_id;

  // ─── Step 2: Poll publish status ──────────────────────────────────
  // TikTok processes the video async. Poll until done or timeout.
  let attempts = 0;
  const maxAttempts = 30; // 30 × 2 sec = 60 sec timeout
  let videoId: string | undefined;

  while (attempts < maxAttempts) {
    await new Promise((r) => setTimeout(r, 2000));
    attempts++;

    const statusRes = await fetch(`${TIKTOK_API_BASE}/post/publish/status/fetch/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publish_id: publishId }),
    });
    if (!statusRes.ok) continue;
    const statusData = await statusRes.json();
    const status = statusData.data?.status;

    if (status === 'PUBLISH_COMPLETE') {
      videoId = statusData.data?.publicaly_available_post_id;
      break;
    }
    if (status === 'FAILED') {
      throw new Error(`TikTok publish failed: ${statusData.data?.fail_reason}`);
    }
    // Else status is PROCESSING_DOWNLOAD or PROCESSING_UPLOAD — keep polling
  }

  if (!videoId && attempts >= maxAttempts) {
    // Timeout — but publish_id may still complete async. Return it.
    return { publishId };
  }

  return { publishId, videoId };
}

// In main publish handler:
if (channel === 'tiktok') {
  // Validate: TikTok requires video, no photo-only posts
  if (!videoUrl) {
    return jsonResp({
      error: 'TikTok requires a video. Photo posts are not supported on TikTok.',
    }, 400);
  }

  const { publishId, videoId } = await publishTikTok(
    videoUrl,
    captionText,
    socialAccount.access_token,
    socialAccount.user_id,
  );

  // Store in DB
  await db.from('posts').update({
    platform_post_id: videoId ?? publishId,
    publish_status: videoId ? 'published' : 'processing',
    published_at: new Date().toISOString(),
  }).eq('id', postId);

  return jsonResp({ success: true, post_id: videoId ?? publishId });
}
```

### 3.2 PostReview TikTok tab (~0.5 dag)

In `src/screens/PostReviewScreen.tsx`:

```tsx
// PLATFORM_META al heeft tiktok entry. Voeg tab toe in channel selector:

const CHANNEL_TABS = [
  { key: 'linkedin', ... },
  { key: 'instagram', ... },
  { key: 'facebook', ... },
  // NEW:
  { key: 'tiktok', label: 'TikTok', color: '#FE2C55', icon: 'logo-tiktok',
    requiresVideo: true,
    maxCaptionLength: 2200,
    aspectRatio: '9:16' },
  { key: 'whatsapp', ... },
];

// Toon hint als capture is photo:
if (selectedChannel === 'tiktok' && captureType === 'photo') {
  return (
    <View>
      <Ionicons name="warning" />
      <Text>TikTok requires video. Switch to a video capture or upload one.</Text>
    </View>
  );
}
```

### 3.3 AI prompt template voor TikTok (~0.5 dag)

In `supabase/functions/event-studio-ai/index.ts`:

```typescript
const TIKTOK_PROMPT = `Generate a TikTok video caption.

Context: ${captureContext}
Brand voice: ${brandVoiceProfile?.tone ?? 'casual'}

Format:
- Hook in first 1-3 words (catch attention)
- Body: max 200 chars (TikTok caption length matters less than first 100 chars)
- 5-8 hashtags at the end (mix of niche + trending)
- 1-3 emoji
- Optional: trending sound suggestion in [brackets]

Tone: casual, authentic, Gen Z friendly. NO corporate language.

Return JSON: { caption, hashtags: string[], suggested_sound?: string }`;
```

### 3.4 Update wizard StepConnect TikTok flow (~0.25 dag)

Geen grote changes nodig — TikTok is al in `SCOPE_LIST` en `PLATFORM_META`. Wel:

- Toon prerequisite tip: "TikTok requires a Business or Personal account. Verified accounts get higher rate limits."
- Toon bij connect: "AMOS publishes vertical videos to your TikTok feed."

### 3.5 Database — geen wijzigingen nodig

`social_accounts.account_type` heeft `'personal'` waarde die voor TikTok prima werkt. Geen migratie nodig.

---

## 4. TikTok video specs (cruciaal voor publish-success)

| Spec | Limiet |
|---|---|
| **Format** | MP4 (H.264) |
| **Resolutie** | 720x1280 of 1080x1920 (9:16 vertical) |
| **Duur** | Min 3 sec, max 4 min (unverified) of 10 min (verified) |
| **Bestandsgrootte** | Max 287 MB (unverified), max 4 GB (verified) |
| **Aspect ratio** | 9:16 strongly recommended (verticaal) |
| **Frame rate** | 30 fps recommended |
| **Audio** | Required (geen mute) |

→ AMOS moet captures **eerst transcoden** als ze niet 9:16 zijn. Of: warning aan user "Your video is landscape — TikTok prefers vertical."

---

## 5. Rate limits + restrictions

| Limit | Unverified | Verified |
|---|---|---|
| Posts per dag | 5 | 100+ |
| Posts per uur | 2 | 10+ |
| File size | 287 MB | 4 GB |
| Video duration | 4 min | 10 min |
| API calls | 500/dag/user | 1000+/dag |

→ AMOS toont een teller in PostReview: "TikTok quota: 3/5 today" met warning bij 80%.

---

## 6. Test protocol

### 6.1 Pre-deploy checks

- [ ] TikTok client_key + secret in Supabase secrets
- [ ] EAS secret `EXPO_PUBLIC_TIKTOK_CLIENT_KEY` set
- [ ] Test app build heeft TikTok scope
- [ ] Test TikTok-account heeft `video.publish` scope approved
- [ ] OAuth redirect URI matches in TikTok Developer Portal

### 6.2 Smoke test (in TestFlight)

1. Settings → Verbind via wizard → Stap 3 → tap **TikTok**
2. Verwacht: TikTok consent screen in in-app browser
3. Approve → terug in wizard → TikTok rij toont "Verbonden"
4. Verify in DB: `SELECT * FROM social_accounts WHERE platform='tiktok' AND user_id=<sami>`
5. → Verwacht 1 row met `account_type='personal'` + valid token

### 6.3 Live publish test (per-channel confirm REQUIRED)

⚠️ Bevestig in chat: "ja, TikTok live"

1. Open AMOS → tap +  → take video (vertical, 5-30 sec)
2. AI generates TikTok caption
3. PostReview → TikTok tab → tap Publiceer
4. Account picker shows TikTok account
5. Confirm → loading 30-60 sec
6. Open TikTok app → check video is live op @inclufy_ecosystem

### 6.4 Edge case checks

- [ ] Photo-only capture → TikTok tab shows warning, blocks publish
- [ ] Video > 4 min (unverified) → TikTok rejection error → user-friendly message
- [ ] Wrong aspect ratio → AMOS warning (not blocking)
- [ ] Rate limit hit → "Daily limit reached, try tomorrow" message
- [ ] Token expired → reconnect prompt

---

## 7. Compliance / Privacy

### 7.1 Privacy policy update

Add to `inclufy.com/privacy`:

```
2.9 TikTok-integratiegegevens

Wanneer u uw TikTok-account verbindt aan AMOS, vragen wij toegang tot:
- Basis profiel-info (naam, profielfoto)
- Publish-rechten op uw eigen TikTok-account
- Lijst van uw eerdere posts (voor metrics tracking)

Wij doen NIET:
- Privéberichten lezen
- Andere accounts dan die u expliciet verbindt benaderen
- TikTok-data delen met derden
- TikTok-content scrapen of bulk-downloaden

Bewaartermijnen: OAuth-tokens worden versleuteld bewaard, automatisch
ververst, en binnen 30 dagen na ontkoppeling permanent verwijderd.

Naleving: AMOS volgt TikTok's Developer Terms of Service.
```

### 7.2 Anti-abuse measures (voor TikTok review submission)

1. **Per-post user confirmation** — geen bulk auto-posting
2. **Account picker at publish time** — user kiest bewust
3. **Rate limit compliance** — quota tracking + UI warnings
4. **Error transparency** — failed posts surfaced to user
5. **Disconnect feature** — revokes tokens binnen 30 sec
6. **No content scraping** — alleen user's eigen posts read voor metrics

---

## 8. Implementation timeline (week 21 + verification wait)

| Dag | Werk |
|---|---|
| Week 19, dag 5 | Sami: TikTok Developer App registratie + submit voor verification |
| Week 20-21 | Verification wait (7-14 dagen) — parallel start met code |
| Week 21, dag 1 | publish-social TikTok branch coderen |
| Week 21, dag 2 | PostReview TikTok tab + AI prompt |
| Week 21, dag 3 | Tests + edge cases + commit + push → Build 229 |
| Week 21, dag 5 | Na verification: env vars set, smoke test, live publish test |
| Week 22, dag 1 | TikTok roll-out aankondiging naar beta-users |

**Verification kan uitlopen** — als TikTok 14+ dagen duurt, wacht dat. Code blijft klaar.

---

## 9. Risico's & mitigaties

| Risico | Mitigatie |
|---|---|
| TikTok rejection van app review | Use case beschrijving zorgvuldig + demo video meesturen |
| Video format mismatch (landscape) | Auto-transcode in AMOS of warning + manual rotate |
| Rate limit (5/day) frustreert power users | Verified status aanvragen na 1000+ followers |
| Token refresh failures | Server-side refresh logic + reconnect prompt |
| TikTok privacy_level keuze fout | Default `MUTUAL_FOLLOW_FRIENDS`, user kan upgraden naar `PUBLIC_TO_EVERYONE` |
| Kosten bij scale | TikTok API is gratis, geen per-call cost |

---

## 10. Marketing / GTM

Bij TikTok-launch in week 22:

**Email naar bestaande AMOS users:**
> "TikTok is nu live! 🎵 Capture once, publish to TikTok + IG Reels + FB + LinkedIn in één keer."

**LinkedIn post (Inclufy_Ecosystem):**
> "AMOS supports TikTok publishing. Vertical video, AI-generated captions, brand voice consistency. SMBs can now reach Gen Z without a dedicated TikTok manager."

**Pricing:**
- TikTok integratie zit in AMOS Pro (€29/mo)
- Geen extra fee
- Onderdeel van "5+ platforms in één tool" pitch

---

## 11. Gerelateerde docs

- `docs/deploy-roadmaps/2026-05-08-amos-platform-expansion-strategy.md` — Master strategy
- `docs/deploy-roadmaps/2026-05-08-pinterest-integration-roadmap.md` — Volgende platform
- `docs/SOCIAL_ACCOUNT_TYPES_REFERENCE.md` — Account types reference
- `docs/META_DEMO_VIDEO_VOICEOVER.md` — Voor latere TikTok review video

---

*Begin met Stap 2 (Sami's developer registratie) zodra Build 228 FB+IG live test is geslaagd. Verification proces draait parallel met dev.*
