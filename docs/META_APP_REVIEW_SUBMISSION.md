# Meta App Review — Submission Package (AMOS)

**App**: AMOS (Inclufy Marketing platform)
**Meta App ID**: `947950264797942`
**Company**: Inclufy BV (Almere, Netherlands · KvK 35193999)
**Submission URL**: https://developers.facebook.com → AMOS app → App Review → Permissions and Features

---

## What we're requesting

| Permission | Purpose |
|---|---|
| `pages_read_engagement` | Read user's admin Facebook Pages so they can pick a publishing target |
| `pages_manage_posts` | Publish photos, carousels, and videos to admin-controlled Facebook Pages |
| `pages_show_list` | List all Pages a user manages so the account picker can show them |
| `instagram_basic` | Read Instagram Business profile info (handle, profile picture, follower count) |
| `instagram_content_publish` | Publish photos, carousels, Reels, and Stories to Instagram Business accounts |
| `business_management` | Read business assets (Pages, Instagram accounts) within a user's Meta Business Portfolio |

**Note**: We are NOT requesting `pages_messaging`, `instagram_manage_comments`, or `ads_*` scopes — those are out of AMOS's scope.

---

## 1. Use Case Document

### 1.1 Product Overview

**AMOS (Autonomous Marketing OS)** is an iOS mobile app for SMBs and event organisers in the Netherlands and broader EU. Users capture moments during real-world business events (conferences, product launches, behind-the-scenes), our AI generates platform-optimised post drafts, and the user reviews + publishes to their connected social channels — all from a single mobile flow.

We are the marketing pillar of the **Inclufy ecosystem** (an integrated business platform: ERP, CRM, Project Management, Academy, Marketing — for Dutch SMBs).

Unlike generic schedulers (Buffer, Hootsuite, Later), AMOS focuses on **moment-to-publication workflow**: photo/video capture → AI post generation → multi-channel review → publish. The user always reviews and explicitly approves each post before it goes live.

### 1.2 Why we need Meta APIs

Today AMOS users can connect their Facebook Pages and Instagram Business accounts via OAuth, and the picker UI lets them choose which page/account to post to. Without `pages_manage_posts` and `instagram_content_publish` (production-mode), AMOS can only operate for the developer + 25 test users — it cannot serve the full SMB market we target.

### 1.3 User Stories

**Story 1 — Multi-Page Brand Owner (real production case)**

> As founder of Inclufy BV, I admin our `Inclufy Ecosystem` Facebook Page (the renamed Eprocure Consulting page that serves as our corporate brand on Meta) and `@inclufy_ecosystem` Instagram Business account (linked to the same Page). When I capture content at a partner event, I want AMOS to publish the same post to both — without opening Facebook.com and Instagram.com separately. AMOS calls `pages_manage_posts` to create the FB photo+caption, then `instagram_content_publish` to push the same image with platform-optimised caption to IG.

**Story 2 — Event Organiser**

> As an event organiser running a conference, I capture 20+ moments during the event (talks, panels, behind-the-scenes). I want each AI-generated post to go simultaneously to my Page Feed and my IG Business feed. AMOS uses `pages_manage_posts` for the Page Photo node and `instagram_content_publish` to create an IG container + publish.

**Story 3 — SMB Marketer Managing Multiple Brands**

> As a fractional CMO admin for 4 client Facebook Pages, I want one AMOS session to route each client's content to their respective Page. The picker at publish time shows all my admin Pages (`pages_show_list` + `pages_read_engagement`) and I tap the correct destination. AMOS posts to that Page only — no broadcasting.

### 1.4 Consent & UX flow (per-permission)

1. User taps **Verbind Facebook** in AMOS Settings → Social Media
2. In-app browser opens Meta OAuth dialog
3. **Meta shows the consent screen** — user sees exactly which permissions are requested (Pages list, Page management, Page posts, Business Management)
4. User consents (or denies; AMOS handles denial gracefully)
5. On approval, AMOS' `oauth-callback` edge function:
   - Exchanges code for token
   - Calls `/me/accounts` to list the user's Pages → stores each as a `social_accounts` row with `account_type='page'`
   - Calls `/{page_id}?fields=instagram_business_account` to detect linked IG accounts → stores each linked IG as `account_type='business'` with `linked_facebook_page_id` set
6. Back in AMOS: user sees their Pages + linked IG Business accounts in the account picker

If user denies: AMOS shows error, no rows stored, user can retry.

### 1.5 Per-publish flow (explicit user action)

1. User captures content + reviews AI-generated post
2. User taps **Publish** → AMOS shows **account picker** with all Pages + linked IG accounts
3. User selects 1 or more destinations (multi-select supported)
4. User confirms
5. AMOS' `publish-social` edge function:
   - For Facebook Page: `POST /{page-id}/photos` with image_url + caption + page access token
   - For Instagram: `POST /{ig-id}/media` (create container with image_url + caption + media_type) → `POST /{ig-id}/media_publish` (publish container)
6. Result is shown to user; on error, the per-account error is displayed

**No silent posts. No bulk auto-posting. Every publish requires user tap.**

### 1.6 Rate limits & volume

- Typical user: 5-15 posts per week per channel
- Power user (event days): 30-50 posts over 2-3 days per event
- Rate-limit handling:
  - Meta's `200 calls/hour/user` quota — we stay well below
  - Our edge function handles 429 with exponential backoff
  - Token-refresh on 401 via long-lived Page tokens (60-day expiry, refreshed on use)

### 1.7 Anti-abuse measures

1. **Per-post user confirmation** — explicit tap on "Publiceer" required, no bulk auto-posting
2. **Account picker at publish time** — user consciously selects each destination
3. **Error transparency** — failed posts store `publish_error` in DB, visible to user; no silent retries
4. **Consent revocation** — user can disconnect any account in Settings; we revoke tokens server-side
5. **JWT-gated edge function** — publish API requires authenticated Supabase user session; `service_role` bypass closed via `user_id` match
6. **No scraping** — we only use Meta APIs for which the user has granted consent; we never scrape, bulk-download, or store data outside the user's own admin scope

### 1.8 Terms of Service compliance

AMOS adheres to Meta's Platform Terms:

- No publishing content the user hasn't explicitly created/approved in-app
- No automated follow/unfollow, like, comment, or DM actions
- No resale of user data
- No use of data outside what's needed to deliver the publishing flow
- Tokens revoked on disconnect; post metadata kept for user history only
- Compliant with EU GDPR (Inclufy BV is the Data Controller, see Privacy Policy)

---

## 2. Demo Video Script (3-5 minutes)

### Setup

- Record in **English** (Meta reviewers are global)
- Use **real production accounts** — `Inclufy Ecosystem` FB Page (admin: Sami) + `@inclufy_ecosystem` IG Business
- Screen recording + voice-over
- Export at 1080p minimum

### Scene-by-Scene

**[00:00-00:20] Intro**
> "Hi, I'm Sami Loukile, founder of Inclufy BV. AMOS is our event-based marketing platform for Dutch SMBs. I'm going to demonstrate the Facebook Page and Instagram Business publishing flow, which we're requesting production access for."

Show: AMOS app icon, opening.

**[00:20-00:50] OAuth consent flow**
> "Users connect their Meta accounts from our Settings screen. The consent screen shows exactly which permissions we request — Pages access, Page management, Instagram basic, and Instagram content publish."

Show: tap "Verbind Facebook" → Meta consent dialog → highlight scope list → tap "Allow" → redirect back to AMOS → see "Inclufy Ecosystem" Page + "@inclufy_ecosystem" IG listed in Settings.

**[00:50-01:30] Content capture**
> "Our differentiator is on-site capture. Here I'm at a partner event. I take a photo, add a brief note, and AMOS generates platform-optimised post drafts using our AI."

Show: LiveCapture screen → take photo → add note "Kickoff of the Q3 partner summit" → tap generate → AI creates LinkedIn + Instagram + Facebook + WhatsApp drafts.

**[01:30-02:20] Account picker**
> "In the post review screen, I tap Publish. The account picker shows all my connected destinations — my Facebook Page 'Inclufy Ecosystem' and my Instagram Business account '@inclufy_ecosystem'. I can select one or both."

Show: PostReview screen → tap Publish → account picker modal showing 2 rows (FB Page + IG Business) → I check both.

**[02:20-03:10] Publish to Facebook Page**
> "AMOS calls `pages_manage_posts` to create a Page photo with our caption. The post appears on the company Page, attributed to the Page brand."

Show: Confirm publish → success → switch to Facebook on web → see post live on Inclufy Ecosystem Page.

**[03:10-04:00] Publish to Instagram Business**
> "For Instagram, AMOS uses `instagram_content_publish` — first creates a media container with the image URL and caption, then publishes it."

Show: Switch to Instagram app → see post live on @inclufy_ecosystem.

**[04:00-04:30] Error handling & disconnect**
> "Tokens are validated before each publish. If a token is expired, the user gets a clear reconnect prompt. Disconnecting in Settings revokes our access."

Show: Settings → Social Media → tap Disconnect on Facebook → confirmation → row disappears.

**[04:30-05:00] Closing**
> "AMOS is used by SMBs across the Netherlands who need to maintain an active brand presence without dedicated social media staff. Multi-channel publishing via Meta APIs is core to our value. Thank you for reviewing our application."

Upload to YouTube (unlisted) or Vimeo. Add URL to Meta App Review form.

---

## 3. Privacy Policy section — Meta data

**Add to https://inclufy.com/privacy** (existing privacy page) under "Third-party data" heading.

### Meta (Facebook & Instagram) data usage

When you connect Meta to AMOS, we request access to:

- Your basic profile information (name, profile picture) — to display your identity in the app
- Your list of administered Facebook Pages — to enable you to choose a publishing destination
- Your linked Instagram Business accounts — same purpose
- Permission to publish content **that you explicitly approve in-app** to those Pages and IG accounts
- Permission to read business assets within Meta Business Portfolio (Pages, IG accounts)

We do **not**:

- Read your Facebook or Instagram private messages
- Read or store comments, likes, or audience data outside of post-level engagement metrics displayed to you in AMOS
- Scrape or bulk-download Meta data
- Share your Meta data with third parties
- Use your Meta data for advertising targeting outside of posts you explicitly publish
- Retain Meta data beyond what is needed to deliver AMOS functionality

### Data retention & deletion

- **OAuth tokens**: encrypted at rest, automatically refreshed when needed, deleted within 30 days of disconnect
- **Page/IG metadata**: cached locally to avoid repeated API calls; refreshed on reconnect; deleted when account disconnected
- **Post content**: post text/images stored for your review history; you can delete any post at any time
- **Account deletion**: upon request, all Meta-related data permanently deleted within 30 days. Contact `privacy@inclufy.com`

### GDPR rights

- Access, Rectification, Erasure, Portability, Restriction — exercise via `privacy@inclufy.com`
- Response within 30 days per GDPR Article 12

---

## 4. Pre-Submission Checklist

Before clicking **Submit for Review** in Meta App Dashboard:

- [ ] App website (https://inclufy.com) is **live and accessible**
- [ ] Privacy Policy page is **live** with the Meta section above
- [ ] Terms of Service page is **live**
- [ ] Contact email (`privacy@inclufy.com`, `support@inclufy.com`) is monitored
- [ ] App Icon uploaded in App Settings (1024×1024 PNG)
- [ ] OAuth Redirect URIs match production:
      - `https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/oauth-callback`
- [ ] **App Domains** in App Settings includes `inclufy.com` and the Supabase functions domain
- [ ] Demo video recorded, uploaded to YouTube (unlisted) or Vimeo, URL added to form
- [ ] Use case document (section 1) pasted into "Provide more details about how your app uses this permission" field
- [ ] **Test users**: at least 1 admin Page + 1 linked IG Business set up so reviewer can test
- [ ] **Business Verification** completed (if required) — KvK uittreksel Inclufy BV uploaded in Business Manager
- [ ] App version: production iOS build live in App Store (TestFlight is acceptable for review)
- [ ] Sentry/logging visible: reviewer should see successful test posts in your monitoring

---

## 5. Submission steps

1. Go to https://developers.facebook.com/apps/947950264797942/app-review/permissions/
2. Click **Request Advanced Access** for each permission listed at the top of this doc
3. For each permission, attach:
   - Use case description (excerpt from section 1.3 user stories matching that permission)
   - Demo video URL
   - Privacy policy URL: `https://inclufy.com/privacy#meta`
4. Submit
5. **Wait time**: 5-15 business days typical (longer during high-volume periods)
6. Whitelist email: `appreview-noreply@meta.com`

---

## 6. Response scenarios

### ✅ Approved
- All requested permissions move to "Live" status automatically
- Existing AMOS users keep working; new users can now connect
- Announce internally; new IG/FB connections work immediately

### ⚠️ More info requested
- Respond within 5 business days
- Common requests: more demo footage of specific permission usage, clarification on a user story, additional privacy policy language
- Reply via the App Review reply field; keep the original use case + video URL handy

### 🚫 Rejected
- Read the rejection reason carefully (Meta usually pinpoints which permission and why)
- Common fixes:
  - Re-record demo to show the permission in action more clearly
  - Improve user-story specificity (less abstract, more concrete in the AMOS UI)
  - Address policy concerns (e.g., "data sharing" language — clarify we share nothing externally)
- Wait at least 7 days before resubmitting per Meta guidelines
- Resubmit referencing the previous submission ID

---

## 7. Code state — what's ready

### Already deployed
- `oauth-callback` edge function handles Meta OAuth flow (with Pages list + IG-linked detection)
- `publish-social` edge function calls `/{page-id}/photos` for FB Page posts and `/{ig-id}/media` + `/{ig-id}/media_publish` for IG Business
- AMOS Settings → Social Media UI shows multi-account state
- Account picker in PostReview supports multi-select

### What we'll bump on approval
- No env-flag toggle needed for Meta (unlike LinkedIn LMDP — that has a feature flag)
- Once Meta approves, the existing OAuth flow + edge function code starts succeeding for non-test users automatically

---

*Generated 2026-05-07. Update demo video URL once recorded.*
