# Paste-Ready Form Answers — LinkedIn LMDP + Meta App Review

**Datum:** 2026-05-07
**Doel:** Open dit doc náást het LinkedIn / Meta dev-portaal. Kopieer per veld de paste-ready text. **Geen aanpassingen nodig** — tenzij gemarkeerd als `[VUL IN]`.

---

## ⚠️ Voorbereidings-checklist (doe DIT eerst)

Vóór je een formulier opent:

- [ ] **Privacy Policy live**: `https://inclufy.com/privacy` toont sectie 2.6 (Meta) + 2.7 (LinkedIn). Run `deploy-production.sh` in `inclufy-ignite` na commit `64f44d3`.
- [ ] **Demo video uploaded**: zie `docs/META_DEMO_VIDEO_SCRIPT.md` — opnemen in TestFlight build 218, uploaden YouTube unlisted, URL noteren.
- [ ] **Test users**: minstens 2 LinkedIn accounts (jij + één team-lid) als admin op Inclufy_Ecosystem company page.
- [ ] **App Logo**: 1024×1024 PNG van AMOS icon in `assets/icon.png` of `ios/AMOS/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png`.
- [ ] **TestFlight invite link**: voor Meta-reviewer die de app moet testen. Genereer via App Store Connect → InclufyGO → TestFlight → Public Link.

---

## 🅰️ LinkedIn LMDP submission form

URL: https://www.linkedin.com/developers/apps/78sy9roeoz1143/products/marketing-developer-platform

> **Client ID gebruikt:** `78sy9roeoz1143` (nieuwe AMOS Community app — 2026-05-07).
> Oude AMOS app `789493c65q6j5e` is hierdoor vervangen voor LMDP-aanvraag.

### Field — "What does your app do?" (use case)

```
AMOS (Autonomous Marketing OS) is an iOS mobile app for SMBs and event organisers in the Netherlands and broader EU. Users capture moments during real-world business events (conferences, product launches, behind-the-scenes), our AI generates platform-optimised post drafts, and the user reviews and explicitly publishes to their connected LinkedIn profile and admin-managed Company Pages — all from a single mobile flow.

Today AMOS publishes to personal LinkedIn feeds via w_member_social. Users can sign in with LinkedIn (OIDC), generate AI posts from photos taken at events, and post to their personal feed with multi-image support and retry-aware error handling.

We are requesting Marketing Developer Platform access to extend this to Company Page publishing — so users who admin one or more LinkedIn Company Pages can route their content to those pages directly from the same review-and-publish flow, without manual re-uploads on linkedin.com.

The expected use cases for our requested scopes are:
1. Per-event content distribution across multiple admin-managed Company Pages
2. Multi-brand marketers who manage 2-4 client Company Pages from one app session
3. Founders publishing to both their personal feed AND their company brand

AMOS is built and operated by Inclufy BV (Almere, Netherlands · KvK 35193999). Privacy policy at https://inclufy.com/privacy includes a dedicated LinkedIn data section.
```

### Field — "Target audience"

```
Small and mid-sized businesses (SMBs, 1-50 employees) in the Netherlands and broader EU, with a focus on event organisers, B2B service providers, and SaaS founders who maintain professional LinkedIn presence as a primary marketing channel but lack dedicated social media staff.
```

### Field — "Why do you need w_organization_social?"

```
We need w_organization_social to publish photo, video, and text-with-link posts to LinkedIn Company Pages on behalf of administrators who explicitly approve each post within AMOS.

Concrete user-flow:
1. User taps "+" in AMOS, captures a photo at an event
2. AI generates a LinkedIn-optimised draft (1300 char body + 3-5 hashtags)
3. User reviews + edits in PostReview screen
4. User taps "Publiceer" — picker shows their personal profile + all admin Company Pages
5. User explicitly selects a Company Page destination
6. AMOS calls /v2/ugcPosts with the organization URN as author
7. Post lands on the Company Page

Without w_organization_social, AMOS users with admin Company Page access must manually download the AI-generated content from AMOS, switch to LinkedIn.com, navigate to their Page, and re-upload — high friction that defeats the moment-to-publication purpose.
```

### Field — "Why do you need r_organization_social?"

```
We need r_organization_social to fetch the list of Company Pages each user administrates so we can present them as publish destinations in the picker UI.

After the user authenticates, our oauth-callback edge function calls /v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED. Each returned organization is stored as a separate social_accounts row with account_type='company'. The PostReview picker then shows: [Personal: Sami Loukile] + [Inclufy Ecosystem (Company)] + [other admin pages]. The user picks consciously per post.

Without r_organization_social we cannot show the picker — meaning no user-side awareness of which Pages are publishable, leading to errors and confusion.
```

### Field — "Why do you need rw_organization_admin?"

```
We need rw_organization_admin for two reasons:

1. To verify that the user actually holds an ADMINISTRATOR role on a Company Page before showing it as a publish destination — preventing users from attempting to publish to Pages where they have only a content-creator or non-admin role (which would fail with 403).

2. (Future, post-launch v1.1) to read post-publish engagement metrics (likes, comments, shares) for each AMOS-published Company Page post — so the user can see analytics from within AMOS rather than switching to LinkedIn.com. This is read-only metric access; we do NOT plan to write organization settings.

For v1, only the role-verification use of this scope is exercised.
```

### Field — "Anti-abuse / spam prevention measures"

```
AMOS embeds 6 anti-abuse measures in the publishing flow:

1. Per-post user confirmation — every publish requires explicit user tap on "Publiceer" with destination Page selected. NO bulk auto-posting, NO scheduled-without-review, NO auto-resharing.

2. Account picker at publish time — user consciously selects each destination from a modal listing all connected accounts. Single-select OR opt-in multi-select with explicit count ("Publiceer naar 3 accounts").

3. Error transparency — failed posts store publish_error in DB and surface a typed Alert to the user with reconnect instructions. No silent retries, no failed-publish hidden from user.

4. Consent revocation — user can disconnect any LinkedIn account in Settings, which calls our disconnect flow and revokes server-side OAuth tokens within 30 seconds. All cached organization metadata is also purged.

5. JWT-gated edge function — the publish-social Supabase edge function requires an authenticated Supabase user session. Service-role bypass is closed via a JWT user_id match check at the start of every invocation.

6. Rate limit compliance — typical user posts 5-15 times/week per channel; AMOS retries with exponential backoff on 429 responses; token refresh via refresh_token grant on 401. We stay well below LinkedIn's 150 UGC posts/day per user quota.

We do NOT scrape, do NOT bulk-download user data, do NOT use user data for advertising targeting outside the posts they explicitly publish, and do NOT resell LinkedIn data.
```

### Field — "App website URL"

```
https://inclufy.com
```

### Field — "Privacy policy URL"

```
https://inclufy.com/privacy
```

### Field — "Terms of Service URL"

```
https://inclufy.com/terms
```

### Field — "Demo video URL"

```
[VUL IN — YouTube unlisted URL na opname]
```

→ Volg `docs/META_DEMO_VIDEO_SCRIPT.md` voor de 4:30 min shot list (werkt voor zowel LinkedIn als Meta).

### Field — "Anything else we should know?" (optional)

```
- AMOS is currently in TestFlight Beta. iOS production release scheduled for Sunday 2026-05-11.
- Inclufy BV holds Apple Developer Team ID 3238TB3BMF and is registered with Dutch KvK 35193999.
- Demo video covers all three requested scopes in <5 minutes.
- We are happy to provide TestFlight access to LinkedIn reviewers via the public link if that helps the review.
- Single point of contact for follow-up: Sami Loukile, sami@inclufy.com (founder), responds within 24h on weekdays.
```

---

## 🅱️ Meta App Review submission form

URL: https://developers.facebook.com/apps/947950264797942/app-review/permissions/

Voor ELKE permission moet je een aparte review-aanvraag indienen (Meta vereist per-scope justification). Hieronder per scope: paste-ready use case + step-by-step instructions for reviewer.

### Permission 1 — `pages_read_engagement`

#### Field — "How will your app use this permission?"

```
AMOS uses pages_read_engagement to show users the engagement metrics (likes, comments, shares) of posts they have published to Facebook Pages from within the app. After a successful publish via pages_manage_posts, AMOS fetches the post's engagement data periodically so users can track how their content is performing without leaving the app.

Specific endpoints used:
- /{post-id}/insights — for view counts
- /{post-id}?fields=likes.summary(true),comments.summary(true),shares — for engagement totals

Data is displayed only in the user's own AMOS Library screen. We do NOT aggregate, share, or use this data for any purpose other than showing the user their own post performance.
```

#### Field — "Step-by-step instructions for reviewer"

```
1. Install AMOS via the TestFlight invite link [VUL IN].
2. Sign in with the test account: [VUL IN — test@inclufy.com / wachtwoord]. This account has admin access to the test Facebook Page "Inclufy Test Page".
3. Tap the + button in the bottom navigation to start a new capture.
4. Take a photo (or pick from library) — AI generates a Facebook draft.
5. In the Facebook tab of PostReview, tap "Publiceer" → select "Inclufy Test Page" in the picker.
6. After successful publish, navigate to the Library tab.
7. Tap the just-published post — engagement section shows likes/comments/shares fetched via pages_read_engagement.

Expected: engagement counts visible. The screen never leaves AMOS.
```

### Permission 2 — `pages_manage_posts`

#### Field — "How will your app use this permission?"

```
AMOS uses pages_manage_posts to publish photo, video, link, and text posts to Facebook Pages on behalf of administrators who explicitly approve each post within the app.

Concrete user flow:
1. User captures or selects a photo/video at an event
2. Our AI service generates a Facebook-optimised post draft (caption + hashtags)
3. User reviews and edits the draft in PostReview
4. User taps "Publiceer" — account picker shows all admin-managed Pages
5. User selects destination Page (or multiple, via opt-in multi-select)
6. AMOS calls POST /{page-id}/photos OR /{page-id}/feed with the page access token
7. Post lands on the Page, attributed to the Page brand (not the individual user)

Without pages_manage_posts, our users — small and mid-sized business owners managing their own Facebook brand presence — must manually re-upload on facebook.com after AMOS generates the content. This defeats the moment-to-publication value of the app.

Anti-abuse: every publish requires per-post user tap. No bulk auto-posting. No scheduled-without-review. Error states are transparently shown to user.
```

#### Field — "Step-by-step instructions for reviewer"

```
[Same TestFlight + sign-in steps as Permission 1]

3. Tap + → take photo → review AI-generated Facebook draft.
4. In Facebook tab, tap "Publiceer" → picker shows "Inclufy Test Page" → tap.
5. Confirmation dialog → confirm.
6. Loading spinner ~3-5 sec → success Alert "✅ Gepubliceerd".
7. Open Facebook on desktop, navigate to "Inclufy Test Page" → the just-published post is visible.

Expected: post live on Page within 5 seconds, attributed to Page brand.
```

### Permission 3 — `pages_show_list`

#### Field — "How will your app use this permission?"

```
AMOS uses pages_show_list to enumerate the Facebook Pages a user manages, so they can be presented as publish destinations in our account picker UI.

After OAuth completion, our oauth-callback edge function calls /me/accounts. Each returned Page is stored as a social_accounts row with account_type='page'. When the user later opens PostReview's account picker, all admin Pages are shown with their name and profile photo.

Without pages_show_list, the user cannot see which Pages they can publish to from within AMOS — they would have to type or memorise Page IDs, which is impractical.
```

#### Field — "Step-by-step instructions for reviewer"

```
[Same TestFlight + sign-in steps]

3. Open AMOS Settings → Social Media.
4. Tap "Verbinden" next to Facebook → Meta consent screen → tap "Doorgaan".
5. After redirect back to AMOS, the Settings shows "Inclufy Test Page" + any other admin Pages of the test account in the connected list.

Expected: every admin-Page of the test account is listed.
```

### Permission 4 — `instagram_basic`

#### Field — "How will your app use this permission?"

```
AMOS uses instagram_basic to display the user's Instagram Business profile information (handle, profile picture) in the account picker UI when they're choosing a publish destination.

After OAuth, we read /{ig-id}?fields=username,profile_picture_url and cache it locally. The cached values are shown in the picker with the IG icon and "@handle" label so the user knows which IG account they're publishing to.

We do NOT read media, comments, follower lists, or any audience-level data via this scope. Strict identification-only use.
```

#### Field — "Step-by-step instructions for reviewer"

```
[Same TestFlight steps]

3. Open AMOS Settings → Social Media → Facebook is connected (from prior steps).
4. Below Facebook, Instagram should now also show "@inclufytest" (the IG Business linked to "Inclufy Test Page").

Expected: handle + profile picture visible in connected list.
```

### Permission 5 — `instagram_content_publish`

#### Field — "How will your app use this permission?"

```
AMOS uses instagram_content_publish to publish photos, carousels, Reels, and (when supported) Stories to Instagram Business accounts on behalf of users who explicitly approve each post.

Two-step flow:
1. POST /{ig-id}/media with image_url + caption + media_type → returns container_id
2. POST /{ig-id}/media_publish with creation_id=container_id → publishes container

Same per-post user-confirmation pattern as pages_manage_posts. No bulk auto-posting. No scheduled posts without user review.

Use case examples (from real users):
- Event organiser captures speaker photo, publishes to IG Business with auto-generated caption
- Founder publishes product launch image as IG Reel from event floor
- Marketer publishes 3-image carousel of conference highlights
```

#### Field — "Step-by-step instructions for reviewer"

```
[Same TestFlight + Facebook connect steps]

3. Tap + → take photo → review IG draft in PostReview's Instagram tab.
4. Tap "Publiceer" → picker shows "@inclufytest (Business)".
5. Confirm → 5-15 sec loading (IG container creation + publish).
6. Open Instagram app on phone OR instagram.com → navigate to @inclufytest → post visible.

Expected: post published to IG Business within 15 seconds.
```

### Permission 6 — `business_management`

#### Field — "How will your app use this permission?"

```
AMOS uses business_management to read business assets (Pages, Instagram accounts) within a user's Meta Business Portfolio.

Specific use:
- For users whose Pages are owned by a Business Portfolio (not a personal account), pages_show_list alone may not return all Pages. business_management lets us call /me/businesses → /{business-id}/owned_pages to enumerate Pages in their business.
- Same for Instagram Business accounts linked to a Business Portfolio.

We do NOT modify business settings, do NOT read employee lists, do NOT touch ad accounts. Pure read of Pages + linked Instagram accounts only.
```

#### Field — "Step-by-step instructions for reviewer"

```
[Same TestFlight steps]

3. Sign in with a test account that has a Meta Business Portfolio with at least one Page in it (NOT a personal-account Page).
4. AMOS Settings → Social Media → connect Facebook with Business Portfolio access granted.
5. After OAuth, the connected list shows all Pages owned by the Business Portfolio.

Expected: Pages owned by Business Portfolio appear in connected list.
```

### Field (across all permissions) — "Privacy Policy URL"

```
https://inclufy.com/privacy
```

→ Specifically section 2.6 covers Meta data: https://inclufy.com/privacy#meta

### Field — "Data Deletion Instructions URL"

```
https://inclufy.com/privacy#data-deletion
```

→ Of plak deze instructies direct in de form:

```
Users can disconnect any Meta account in AMOS Settings → Social Media → tap account → Disconnect. This revokes our server-side OAuth tokens and purges all cached metadata within 30 seconds.

For complete account-level data deletion, users email privacy@inclufy.com. We confirm receipt within 1 business day and delete all associated data within 30 days per GDPR Article 17.

Operational deletion endpoint: POST https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/delete-user-data with the user's authenticated JWT.
```

### Field — "App Domain"

```
inclufy.com
mpxkugfqzmxydxnlxqoj.supabase.co
```

### Field — "OAuth Redirect URI"

```
https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/oauth-callback
```

### Field — "Demo video URL" (one URL per permission, OR same URL for all)

```
[VUL IN — YouTube unlisted URL na opname]
```

→ Eén video covers alle 6 scopes als je het script volgt uit `docs/META_DEMO_VIDEO_SCRIPT.md`.

### Field — "Test User Credentials"

```
Email: [VUL IN — test@inclufy.com]
Password: [VUL IN — wachtwoord]
TestFlight invite: [VUL IN — public link uit App Store Connect]

Test account has admin access to:
- Facebook Page: "Inclufy Test Page" (id [VUL IN])
- Instagram Business: @inclufytest (linked to above Page)
- Business Portfolio: "Inclufy Test Business" with ≥2 Pages (for business_management testing)
```

---

## 📝 Eindcheck vóór Submit

### LinkedIn LMDP

- [ ] All 8 fields filled (gebruik blokken hierboven)
- [ ] Demo video URL ingevuld (niet placeholder)
- [ ] Privacy policy URL test (open in incognito → moet 200 OK)
- [ ] Terms URL test
- [ ] Click "Submit for Review"
- [ ] Whitelist `marketing-platform-developer@linkedin.com` in spam-filter
- [ ] Verwacht 2-12 weken doorlooptijd

### Meta App Review

- [ ] All 6 permissions submitted apart (per-scope review)
- [ ] Test user credentials verified working
- [ ] TestFlight invite URL active (niet expired)
- [ ] Demo video URL works in incognito
- [ ] Click "Request Advanced Access" per permission
- [ ] Whitelist `appreview-noreply@meta.com`
- [ ] Verwacht 5-15 werkdagen per permission

---

## ⏰ Tijdlijn

| Wat | Wie | Wanneer |
|---|---|---|
| Privacy deploy (`deploy-production.sh`) | Sami | Vandaag |
| Demo video opname | Sami | Donderdag/vrijdag |
| YouTube unlisted upload | Sami | Vrijdag |
| LinkedIn LMDP submit | Sami | Vrijdag |
| Meta App Review submits (6×) | Sami | Vrijdag |
| LinkedIn approval (best-case) | LinkedIn | 21 mei – 1 juni |
| Meta approval (best-case) | Meta | 14 – 22 mei |
| AMOS production release iOS | Sami | Zondag 11 mei |

---

*Dit document samen open te houden naast je browser tijdens form-invul. Alle waardes zijn vooraf gedacht voor jouw scope. `[VUL IN]`-velden zijn de enige plekken waar jouw input nodig is.*
