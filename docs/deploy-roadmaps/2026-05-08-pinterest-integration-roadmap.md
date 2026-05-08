# Pinterest Integration Roadmap

**Datum:** 2026-05-08
**Status:** Implementation roadmap — voor week 22-23 (na TikTok)
**Effort:** ~3 dev-dagen + 7-14 dagen Pinterest review (parallel)
**Pre-req:** TikTok integration live + F&B vertical strategy bevestigd

---

## 1. Status vandaag (audit)

### Wat al in code staat

**Niets** — Pinterest is een schone slate. Geen code-references behalve potentieel in Channel type (niet bevestigd).

### Wat moet komen

| File / Component | Wat |
|---|---|
| `src/types/index.ts` | `Channel` type uitbreiden met `'pinterest'` |
| `supabase/functions/oauth-callback/index.ts` | Pinterest OAuth branch (token exchange + profile + boards fetch) |
| `supabase/functions/publish-social/index.ts` | Pinterest publish branch (board management + pin creation) |
| `src/screens/PostReviewScreen.tsx` | Pinterest tab in channel selector |
| `src/components/wizard/StepConnect.tsx` | Pinterest in PLATFORM_META + SCOPE_LIST + startOAuth |
| `src/components/wizard/StepGoal.tsx` | Pinterest als platform optie (niet meer Beta) |
| `supabase/functions/event-studio-ai/index.ts` | Pinterest-specifieke AI prompt (SEO descriptions, board suggestions) |
| Nieuwe edge function `ai-board-organizer` | Auto-suggesteer welke board past bij capture |

---

## 2. Pinterest Developer Portal setup (Sami doet dit, ~30 min + 7-14 dagen wait)

### 2.1 Account aanmaken

1. Open https://developers.pinterest.com
2. **Sign up** met Pinterest-account `@inclufy_ecosystem` (of business account)
3. Bevestig email + accept developer terms

### 2.2 App aanmaken

1. **My apps** → **Connect app**
2. Vul in:
   - **App name:** AMOS by Inclufy
   - **App description:** Multi-channel marketing automation. Captures + AI-generated pins + multi-platform publishing for SMBs, with focus on F&B, hospitality, and visual brands.
   - **Website:** `https://inclufy.com`
   - **Privacy policy:** `https://inclufy.com/privacy`
   - **Terms of service:** `https://inclufy.com/terms`
   - **App contact email:** `support@inclufy.com`
3. **Submit**

### 2.3 OAuth Redirect URI

In **App settings** → **Redirect URIs**:

```
https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/oauth-callback
```

Save.

### 2.4 Scopes aanvragen

Pinterest gebruikt **scope-based permissions** in OAuth. Te vragen scopes:

| Scope | Doel | Trial / Standard |
|---|---|---|
| `boards:read` | List user's boards | Trial (direct) |
| `boards:write` | Create new boards | Trial |
| `pins:read` | List/view pins | Trial |
| `pins:write` | Create new pins | Trial |
| `user_accounts:read` | Username + email | Trial |

**Trial mode** geeft direct toegang voor max 5 testers (Sami's account).

**Standard mode** (na review) opent voor alle users — vergelijkbaar met Meta App Review.

### 2.5 Submit voor Standard access

App → **Submit for review** met:
- Demo video (kun je hergebruiken van Meta)
- Use case beschrijving:
  ```
  AMOS is a marketing automation app for SMBs. Users capture moments
  (events, products, dishes) and AMOS AI generates Pinterest-optimized
  pins with SEO descriptions, board suggestions, and click-through links.

  Use case for pins:write:
  Users explicitly review each generated pin before publishing.
  AMOS does not auto-pin without user confirmation. Pins go to
  user's own boards (or boards we create on their behalf with
  their permission).

  Use case for boards:write:
  AMOS auto-organizes pins into themed boards (e.g., "Maandag Specials"
  for restaurants, "Q3 2026 Events" for organizers) based on capture
  context. User can override or rename.

  Anti-abuse measures:
  1. Per-pin user confirmation before publish
  2. Rate limit compliance (1000 calls/hour per user)
  3. Disconnect revokes tokens within 30 sec
  4. No bulk auto-pinning
  5. No pin scraping or aggregation

  Test access: TestFlight link [VUL IN]
  Sample pins: pinterest.com/inclufy_ecosystem
  ```

→ Pinterest review process: 7-14 dagen typisch.

### 2.6 Na approval — environment variables

Zodra approved:

1. App credentials → kopieer **App ID** + **App Secret access token**
2. Set in Supabase:
   ```bash
   supabase secrets set PINTEREST_CLIENT_ID=<app_id> --project-ref mpxkugfqzmxydxnlxqoj
   supabase secrets set PINTEREST_CLIENT_SECRET=<app_secret> --project-ref mpxkugfqzmxydxnlxqoj
   ```
3. EAS secret:
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_PINTEREST_CLIENT_ID --value <app_id>
   ```
4. Update `ios/ci_scripts/ci_post_clone.sh` voor `EXPO_PUBLIC_PINTEREST_CLIENT_ID`.

---

## 3. Code implementatie (~3 dev-dagen)

### 3.1 oauth-callback Pinterest branch (~0.5 dag)

In `supabase/functions/oauth-callback/index.ts`:

```typescript
const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';
const PINTEREST_CLIENT_ID = Deno.env.get('PINTEREST_CLIENT_ID') ?? '';
const PINTEREST_CLIENT_SECRET = Deno.env.get('PINTEREST_CLIENT_SECRET') ?? '';

// Inside main handler, add platform === 'pinterest' branch:
} else if (platform === 'pinterest') {
  console.log('Pinterest token exchange');

  // Step 1: Exchange code for token
  const tokenRes = await fetch(`${PINTEREST_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${PINTEREST_CLIENT_ID}:${PINTEREST_CLIENT_SECRET}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    return errorPage('Pinterest', 'Token exchange mislukt', err);
  }

  const tokenData = await tokenRes.json();
  accessToken = tokenData.access_token;
  tokenRefreshToken = tokenData.refresh_token;
  if (tokenData.expires_in) {
    tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
  }

  // Step 2: Fetch user profile
  const profileRes = await fetch(`${PINTEREST_API_BASE}/user_account`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await profileRes.json();
  profileId = profile.username ?? '';
  profileName = profile.username ?? 'Pinterest User';
  profilePicture = profile.profile_image ?? '';

  // Step 3: Fetch existing boards (so wizard Verify step can show them)
  try {
    const boardsRes = await fetch(`${PINTEREST_API_BASE}/boards?page_size=100`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const boardsData = await boardsRes.json();
    const boards = boardsData.items ?? [];

    // Optionally store boards as separate metadata in social_accounts.metadata JSONB column
    // For now, we'll fetch on-demand at publish time.
  } catch (e) {
    console.error('Pinterest boards fetch failed:', e);
  }
}

// Then store account (existing upsertSocialAccount call):
await upsertSocialAccount(
  db, userId, platform, profileId, profileName, profilePicture,
  accessToken, 'personal', undefined, tokenExpiresAt, tokenRefreshToken,
);
```

### 3.2 publish-social Pinterest branch (~1 dag)

```typescript
const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';

async function publishPinterest(
  imageUrl: string,
  title: string,
  description: string,
  link: string | undefined,
  boardId: string,
  accessToken: string,
): Promise<{ pinId: string }> {
  const body: any = {
    board_id: boardId,
    media_source: {
      source_type: 'image_url',
      url: imageUrl,
    },
    title: title.substring(0, 100), // Pinterest max 100 chars
    description: description.substring(0, 800), // max 800 chars
  };
  if (link) body.link = link;

  const res = await fetch(`${PINTEREST_API_BASE}/pins`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinterest pin failed: ${err}`);
  }
  const data = await res.json();
  return { pinId: data.id };
}

async function findOrCreateBoard(
  boardName: string,
  accessToken: string,
): Promise<string> {
  // Try to find existing
  const listRes = await fetch(`${PINTEREST_API_BASE}/boards?page_size=100`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (listRes.ok) {
    const data = await listRes.json();
    const existing = (data.items ?? []).find(
      (b: any) => b.name.toLowerCase() === boardName.toLowerCase(),
    );
    if (existing) return existing.id;
  }

  // Create new
  const createRes = await fetch(`${PINTEREST_API_BASE}/boards`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: boardName,
      description: `${boardName} — by AMOS`,
      privacy: 'PUBLIC',
    }),
  });
  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`Pinterest board create failed: ${err}`);
  }
  const data = await createRes.json();
  return data.id;
}

// In main publish handler:
if (channel === 'pinterest') {
  if (!imageUrl) {
    return jsonResp({ error: 'Pinterest requires an image' }, 400);
  }

  const boardName = proposal.pinterest_board_name ?? 'AMOS Captures';
  const boardId = await findOrCreateBoard(boardName, socialAccount.access_token);

  const { pinId } = await publishPinterest(
    imageUrl,
    proposal.title || 'AMOS Capture',
    captionText,
    proposal.click_through_link,
    boardId,
    socialAccount.access_token,
  );

  await db.from('posts').update({
    platform_post_id: pinId,
    publish_status: 'published',
    published_at: new Date().toISOString(),
  }).eq('id', postId);

  return jsonResp({ success: true, post_id: pinId, board_id: boardId });
}
```

### 3.3 PostReview Pinterest tab (~0.5 dag)

In `src/screens/PostReviewScreen.tsx`:

```tsx
// PLATFORM_META add:
pinterest: { label: 'Pinterest', color: '#E60023', icon: 'logo-pinterest' },

// In CHANNEL_TABS:
{
  key: 'pinterest',
  label: 'Pinterest',
  color: '#E60023',
  icon: 'logo-pinterest',
  requiresImage: true,
  maxTitleLength: 100,
  maxDescriptionLength: 800,
  hasClickThroughLink: true,  // Pinterest unique feature
  hasBoardSelector: true,      // Pinterest unique feature
}

// Custom UI elements voor Pinterest tab:
{selectedChannel === 'pinterest' && (
  <View>
    {/* Board picker */}
    <BoardSelector
      currentBoard={selectedBoard}
      onSelect={setSelectedBoard}
      onCreateNew={(name) => createBoard(name)}
    />

    {/* Click-through link */}
    <TextInput
      placeholder="Link bij click (optioneel)"
      value={clickThroughLink}
      onChangeText={setClickThroughLink}
    />

    {/* SEO description hint */}
    <Text>💡 Pinterest is search-driven. Voeg keywords toe in description voor SEO.</Text>
  </View>
)}
```

### 3.4 AI prompt template voor Pinterest (~0.5 dag)

In `supabase/functions/event-studio-ai/index.ts`:

```typescript
const PINTEREST_PROMPT = `Generate a Pinterest pin caption.

Context: ${captureContext}
Industry: ${userIndustry ?? 'general'}
Brand voice: ${brandVoiceProfile?.tone ?? 'authentic'}

Pinterest is SEARCH-DRIVEN. Optimize for keywords, not engagement.

Format:
- Title (max 100 chars): clear, keyword-rich, descriptive
  Example: "Easy Sunday Brunch Pasta — Carbonara di Mare Recipe"
- Description (max 800 chars): keyword-dense, useful info
  - First 50 chars are most important (shown in search results)
  - Include 3-5 relevant keywords naturally
  - End with subtle CTA
- Suggested board name: based on capture category
  Example: "Maandag Specials", "Italian Recipes", "Q3 2026 Events"
- Suggested click-through link: user's website + relevant slug

Tone: helpful, informative, search-friendly. NO emoji-heavy or hashtag stuffing.

Return JSON: {
  title: string,
  description: string,
  suggested_board: string,
  seo_keywords: string[],
  suggested_click_through?: string
}`;
```

### 3.5 Nieuwe edge function `ai-board-organizer` (optioneel, ~0.5 dag)

Voor F&B vertical: auto-suggesteer welke board past bij een capture:

```typescript
// supabase/functions/ai-board-organizer/index.ts
//
// Input: capture context + user's existing Pinterest boards
// Output: best matching board name + reason

const prompt = `User has these existing Pinterest boards:
${userBoards.join(', ')}

New capture context:
${captureContext}

Should this go into:
1. An existing board (which one?)
2. A new board (suggest name)

Return JSON: { board_name, is_new, reason }`;
```

### 3.6 Database — geen wijzigingen nodig

`social_accounts.account_type='personal'` werkt voor Pinterest. Boards worden on-demand uit Pinterest API gefetched.

**Optioneel:** voeg `metadata JSONB` kolom toe aan `social_accounts` om boards te cachen (voorkomt herhaalde API calls):

```sql
ALTER TABLE social_accounts
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
```

Dan in oauth-callback: `metadata: { boards: [...] }` opslaan na fetch.

---

## 4. Pinterest content specs

### 4.1 Image specs

| Spec | Limiet |
|---|---|
| **Aspect ratio (recommended)** | 2:3 (portrait) — beste performance |
| **Min resolution** | 600 × 900 px |
| **Max file size** | 32 MB |
| **Format** | JPEG, PNG, WebP |

→ AMOS captures zijn vaak 1:1 of 4:3 (event photos). Pinterest accepteert die wel maar performance is lager. Optioneel: AMOS biedt **"Optimize for Pinterest"** toggle die crop naar 2:3 toepast.

### 4.2 Video pins (Idea Pins)

| Spec | Limiet |
|---|---|
| **Aspect ratio** | 9:16 (vertical) |
| **Duration** | 1-60 sec |
| **Max file size** | 100 MB |
| **Format** | MP4, MOV |

→ Idea Pins zijn Pinterest's TikTok-equivalent. AMOS kan zelfde video als TikTok hergebruiken voor Pinterest Idea Pin.

### 4.3 Text-only pins

Niet supported. Pinterest vereist altijd image of video.

---

## 5. Rate limits

| Limit | Waarde |
|---|---|
| API calls / uur / user | 1000 |
| Pins / dag (soft limit) | 100 (geen harde cap, Pinterest detecteert spam) |
| Boards / account | Geen formele limit (Pinterest's "personal interest" boards) |
| Concurrent uploads | 5 |

Genoeg voor AMOS use cases.

---

## 6. Test protocol

### 6.1 Pre-deploy checks

- [ ] PINTEREST_CLIENT_ID + SECRET in Supabase secrets
- [ ] EXPO_PUBLIC_PINTEREST_CLIENT_ID in EAS secret
- [ ] OAuth redirect URI matches in Pinterest Developer Portal
- [ ] App in Trial mode (Sami als tester) of Standard (na review)

### 6.2 Smoke test (in TestFlight)

1. Settings → Verbind via wizard → Stap 3 → tap **Pinterest**
2. Pinterest consent screen verschijnt
3. Approve → return naar wizard → Pinterest rij toont "Verbonden"
4. Verify in DB:
   ```sql
   SELECT platform, account_name, account_type
   FROM social_accounts
   WHERE platform='pinterest' AND user_id=<sami>;
   ```

### 6.3 Live publish test (per-channel confirm)

⚠️ Bevestig: "ja, Pinterest live"

1. Open AMOS → tap + → upload food photo (carbonara)
2. AI generates Pinterest pin: title, description, board suggestion
3. PostReview → Pinterest tab → review:
   - Title: "Easy Sunday Brunch Pasta — Carbonara di Mare"
   - Description: "Authentic Italian carbonara with seafood..."
   - Board: "Italian Recipes" (auto-suggested)
   - Click-through: optional
4. Tap Publiceer → confirm → 5-10 sec
5. Open pinterest.com/inclufy_ecosystem → check pin live op de juiste board

### 6.4 Edge cases

- [ ] Capture is video → AMOS biedt Idea Pin format (9:16)
- [ ] Aspect ratio mismatch → "Optimize for Pinterest" toggle (auto-crop 2:3)
- [ ] Board doesn't exist → AMOS creates met user permission
- [ ] User rate limit (1000/uur) → graceful queue + retry
- [ ] Token expired → reconnect prompt

---

## 7. F&B vertical: Pinterest-specific features

Voor restaurants is Pinterest **de killer platform**. AMOS biedt:

### 7.1 Auto-board structure

Bij eerste F&B-klant connect:

| AMOS suggesteert deze boards | Wanneer pin er heen gaat |
|---|---|
| **Maandag Specials** | Capture met tag "weekly_special" |
| **Hoofdgerechten** | Capture category="product" + AI dish recognition = main course |
| **Dranken & Wijn** | Capture category="product" + dish=drink/wine |
| **Behind the Scenes** | Capture category="behind_scenes" |
| **Dessert** | AI dish=dessert |
| **Vegan & Plantbased** | AI tag=vegan |
| **Events & Catering** | Capture category="event" |

### 7.2 SEO description templates

Voor F&B captures, AI gebruikt deze patterns:

```
Title: "{cuisine} {dish_type} — {restaurant_name} in {city}"
Description: "Authentic {dish_name} prepared by Chef {chef_name}.
Made with {key_ingredients}. Available at {restaurant_name}, {address}.
Reserveer een tafel: {website_url}.

#{cuisine}food #{city}restaurants #{cuisine}cuisine"
```

### 7.3 Local SEO injection

Pinterest is **lokale zoekmachine** voor 30% van foodzoekopdrachten. AMOS injecteert automatisch:
- Restaurant naam
- Stad/wijk
- Cuisine type
- Walking distance keywords

→ Pin verschijnt in "best Italian restaurants Amsterdam Centrum" search

### 7.4 Pin → reservation tracking (toekomst)

Q1 2027: integratie met Resy / OpenTable / Toast om te tracken:
- Pin gepubliceerd
- Click-through naar reservation site
- Reservation completed
- "Pin XYZ leidde naar 3 reserveringen, ROI €450"

---

## 8. Implementation timeline

| Dag | Werk |
|---|---|
| Week 21 (parallel met TikTok) | Sami: Pinterest Developer App registratie + submit voor verification |
| Week 22 | Verification wait — start coding |
| Week 22, dag 1 | oauth-callback Pinterest branch |
| Week 22, dag 2 | publish-social Pinterest branch + board management |
| Week 22, dag 3 | PostReview tab + AI prompt + board picker UI |
| Week 22, dag 4 | F&B-specific features (auto-board, dish recognition integration) |
| Week 22, dag 5 | Tests + edge cases + commit + push → Build 230 |
| Week 23, dag 1-3 | Verification approval (best case) → env vars + smoke test |
| Week 23, dag 4 | Live publish test + DB verification |
| Week 23, dag 5 | Roll-out aankondiging |

---

## 9. Risico's & mitigaties

| Risico | Mitigatie |
|---|---|
| Pinterest verification trager dan TikTok | Begin parallel met TikTok in week 21 |
| Trial mode beperkt (5 testers) | Voldoende voor interne testing — submit Standard ASAP |
| Aspect ratio mismatch performance | "Optimize for Pinterest" auto-crop feature |
| Board management complexity | Default "AMOS Captures" board, gebruiker kan upgraden |
| Pin spam detection (te veel gelijkaardige pins) | Rate limiting in app + waarschuwing in UI |
| F&B integration tooling (Resy/OpenTable) | Skip voor v1, doe later in Q1 2027 |

---

## 10. Marketing / GTM

Bij Pinterest-launch in week 23-24:

**Email naar bestaande AMOS users + nieuwe F&B prospects:**
> "Pinterest is nu live in AMOS! 🍝 Foto van je gerecht → SEO-geoptimaliseerde pin → ontdekt door duizenden foodies. Long content lifespan = jaren ROI per pin."

**LinkedIn post:**
> "Restaurants die op Pinterest publiceren krijgen 2-3x meer reservations dan IG-only. AMOS automatiseert dat: 1 capture → IG + FB + Pinterest pin in seconden, met SEO-descriptions die echt scoren."

**Pricing impact:**
- Pinterest in AMOS Pro (€29/mo) — geen extra fee
- AMOS F&B tier (€59/mo) krijgt Pinterest priority + dish recognition + recipe boards
- Marketing positie: "AMOS F&B = de enige tool die Pinterest serieus neemt voor restaurants"

---

## 11. Vergelijking met andere F&B-tools

| Tool | Pinterest? | F&B-specifiek? | Capture-flow? |
|---|---|---|---|
| Hootsuite | ✅ Basic | ❌ | ❌ |
| Buffer | ✅ Basic | ❌ | ❌ |
| Later | ✅ Visual | ⚠️ Some | ❌ |
| Tailwind | ✅ Pinterest-only | ❌ | ❌ |
| Plaiced (NL) | ❌ | ✅ F&B | ❌ |
| **AMOS F&B** | ✅ Priority | ✅ Native | ✅ Capture-first |

→ AMOS F&B = enige tool met Pinterest priority + F&B AI + capture-first workflow.

---

## 12. Gerelateerde docs

- `docs/deploy-roadmaps/2026-05-08-amos-platform-expansion-strategy.md` — Master strategy
- `docs/deploy-roadmaps/2026-05-08-tiktok-integration-roadmap.md` — Vorige platform
- `docs/SOCIAL_ACCOUNT_TYPES_REFERENCE.md` — Account types reference
- `docs/META_DEMO_VIDEO_VOICEOVER.md` — Hergebruikbaar voor Pinterest review

---

## 13. Eerste actie (na TikTok live)

1. Sami: Pinterest Developer App registratie (15 min)
2. Submit voor Standard access review (waiting starts)
3. Tijdens 7-14 dagen wait: code branches implementeren
4. Approval → env vars set → live test
5. F&B-specific features in week 25 als onderdeel van vertical tier launch

---

*Pinterest is jouw F&B-killer. Vooral combineer met dish recognition AI en je hebt een unique offering die geen concurrent matcht.*
