# LinkedIn Marketing Developer Platform — Application Package

**App**: AMOS (Inclufy Marketing platform)
**Client ID**: `789493c65q6j5e`
**Company**: Inclufy BV
**Submission URL**: https://www.linkedin.com/developers/apps → your app → Products → Marketing Developer Platform → Request access

---

## 1. Use Case Document

### 1.1 Product Overview

**AMOS (Autonomous Marketing OS)** is an event-based marketing automation platform for SMBs and event organizers. Users capture content during real-world business moments (events, product launches, behind-the-scenes), AI generates platform-optimized posts, and the content is scheduled or published to the user's connected social networks.

Unlike generic schedulers (Buffer, Hootsuite, Later), AMOS focuses on **moment-to-publication workflow**: photo capture → AI post generation → multi-channel review → publish. All within a mobile app built for fast on-site use.

### 1.2 LinkedIn Integration — Current State

Today AMOS publishes **only to personal LinkedIn feeds** using the `w_member_social` scope. Users can:
- Sign in with LinkedIn (OIDC)
- Post to their personal feed from a generated post
- Multi-image posts (UGC Shares API)
- Retry-aware publishing with token expiry detection

### 1.3 LinkedIn Integration — With LMDP Approval

We request Marketing Developer Platform access to enable **Company Page publishing** for users who admin one or more LinkedIn organizations.

**Requested scopes**:
- `r_organization_social` — list user's admin organizations, read page metadata
- `w_organization_social` — publish UGC posts to company pages
- `rw_organization_admin` — verify admin role, read page insights (future)

### 1.4 User Stories

**Story 1 — Multi-Page Brand Owner (real Inclufy use case)**
> As founder of Inclufy BV, I admin 6 LinkedIn Company Pages representing our ecosystem: Inclufy_Ecosystem (corporate hoofdpage, URL `linkedin.com/company/inclufysolutions`, 178 followers), Inclufy Academy (training pillar), Inclufy Consulting (services pillar), Inclufy-AI (solutions pillar), plus standalone product pages ProjeXtPal and AMOS. When I capture content at an industry event, I need AMOS to route each post to the correct page based on context — product news to ProjeXtPal/AMOS, training updates to Academy, ecosystem stories to Inclufy_Ecosystem. Today I must manually re-upload to LinkedIn.com 6 separate times.

**Story 2 — Event Organizer (Multi-Channel)**
> As an event organizer running the annual Inclufy Summit, I capture 20+ moments during the event. I want each AI-generated post to go simultaneously to (a) my personal profile, (b) the Inclufy_Ecosystem corporate page, and (c) optionally a partner's page where I have admin rights — without opening LinkedIn.com 60 times.

**Story 3 — Multi-Brand Marketer**
> As a fractional CMO admin for 4 client company pages (e.g., one user managing both Inclufy Academy AND a partner organization's page), I want one AMOS session to route each client's content to their respective LinkedIn page. Picker at publish time chooses between the destination pages with clear branding so I never publish to the wrong audience.

### 1.5 Consent & UX Flow

1. User taps "Verbind LinkedIn" in AMOS Settings → Social Media
2. In-app browser opens LinkedIn OAuth page
3. LinkedIn shows **full scope consent screen** — user sees exactly which permissions (personal publishing, organization access) are requested
4. User consents (or denies)
5. On approval, AMOS `/oauth-callback` edge function:
   - Exchanges code for token
   - Fetches user profile (`/v2/userinfo`) → stores personal account row
   - Calls `/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED` → stores each admin org as a separate `social_accounts` row with `account_type='company'`
6. Back in AMOS: user sees their personal + all company pages listed in account picker

If user denies: AMOS shows error, no rows stored. User can retry.

### 1.6 Rate Limit & Volume

- **Typical user**: 5-15 posts per week
- **Power user** (events): 30-50 posts over 2-3 days per event
- **Rate-limit compliance**:
  - LinkedIn's daily quota (per user): 150 UGC posts/day — we stay far below
  - Retry logic uses exponential backoff on 429 responses
  - Token refresh on 401 (using `refresh_token` grant for long-lived sessions)

### 1.7 Anti-Abuse Measures

1. **Per-post user confirmation**: AMOS requires explicit user tap on "Publiceer" per post — no bulk auto-posting
2. **Account picker at publish time**: user must select destination account consciously
3. **Error transparency**: failed posts store `publish_error` visible to user; no silent retries
4. **Consent revocation**: user can disconnect any LinkedIn account in Settings, which calls our disconnect flow + clears tokens
5. **JWT-gated edge function**: publish API requires authenticated Supabase user session; service-role bypass was closed via JWT user_id match check
6. **No scraping**: we only call LinkedIn APIs for which we have user consent; we do not scrape or store data outside user's own admin scope

### 1.8 Terms of Service Adherence

AMOS complies with LinkedIn's API Terms:
- No publishing content user hasn't explicitly created/approved in-app
- No automated follow/unfollow/like actions
- No resale of LinkedIn data
- User data retention: tokens revoked on disconnect; posts metadata kept for user history only

---

## 2. Demo Video Script (3-5 min)

### Setup
- Record in **English** (LinkedIn reviewers are global)
- Use a **real LinkedIn test account** (not production data)
- Screen recording + voice-over in post
- Export at 1080p minimum

### Scene-by-Scene

**[00:00-00:20] Intro**
> "Hi, this is Sami Loukile, founder of Inclufy. I'm presenting the LinkedIn integration in AMOS — our event-based marketing platform for small and mid-sized businesses. I'll demonstrate personal feed publishing, which is already live, and the Company Page publishing we're requesting approval for."

Show: AMOS app icon, opening.

**[00:20-00:50] OAuth consent flow**
> "Users connect LinkedIn from our Settings screen. LinkedIn's consent page shows exactly which scopes are requested — `w_member_social` for personal posting, and `w_organization_social` plus `rw_organization_admin` for company page access."

Show: Tap "Verbind LinkedIn" → LinkedIn consent page appears → highlight scope list → user taps "Allow" → redirect back to AMOS → confirmation.

**[00:50-01:30] Content capture**
> "Our differentiator is on-site capture. Here I'm at a partner event. I take a photo, add a note, and AMOS generates platform-optimized posts using our AI."

Show: LiveCapture screen → take photo → add note "Kickoff of the Q3 partner summit" → tap generate.

**[01:30-02:20] Account picker**
> "In the post review screen, the user sees all their connected LinkedIn accounts — personal and each company page they admin. In my test account I have my personal profile plus two company pages: Eprocure Consulting and Inclufy Academy."

Show: PostReview screen → tap Publish → account picker modal showing 3 rows: Sami Loukile (personal), Eprocure Consulting (Bedrijf), Inclufy Academy (Bedrijf).

**[02:20-03:00] Publish to personal (already working)**
> "Publishing to personal uses `w_member_social` — this is already approved for our app. Here's the post going live."

Show: Select personal → confirm → success alert → switch to LinkedIn.com in browser → see the post live on personal feed.

**[03:00-04:00] Publish to Company Page (the new capability)**
> "Now the Company Page flow. The same post, different destination. AMOS uses the `w_organization_social` scope to create a UGC share with the organization URN as author. The post appears on the company page, attributed to the page brand — not to the individual user."

Show: Return to AMOS → duplicate post → select Eprocure Consulting → confirm → success → switch to Eprocure company page on LinkedIn.com → see the post live.

**[04:00-04:30] Error handling & consent revocation**
> "Tokens are validated before each publish. If scope is missing or expired, the user gets a clear reconnect prompt. Disconnecting in Settings revokes tokens server-side."

Show: Settings → Social Media → tap Disconnect on Eprocure Consulting → confirmation → row disappears.

**[04:30-05:00] Closing**
> "AMOS is used by SMBs across Europe who want to maintain an active brand presence without hiring a full-time social media team. LinkedIn Company Page support is our top requested feature. Thank you for reviewing our application."

---

## 3. Privacy Policy Section — LinkedIn Data

**Add this to https://inclufy.com/privacy or equivalent public URL.**

### LinkedIn Data Usage

When you connect LinkedIn to AMOS, we request access to:
- Your basic profile information (name, profile picture, email) — to display your identity in the app
- Your personal publishing scope — to post content on your behalf that you explicitly approve
- Your organization administrator relationships — to enable publishing to LinkedIn Company Pages you manage
- Your organization publishing scope — to post content to selected company pages when you explicitly approve

We do **not**:
- Read your private messages or connections
- Scrape or bulk-download your LinkedIn data
- Share your LinkedIn data with third parties
- Use your data for advertising targeting outside of posts you explicitly publish
- Retain LinkedIn data beyond what is necessary to deliver AMOS functionality

### Data Retention & Deletion

- **OAuth tokens**: stored encrypted in our database. Automatically refreshed when expired. Deleted immediately when you disconnect the account in AMOS Settings.
- **Post content**: post text/images you create in AMOS are stored for your review history. You can delete any post at any time.
- **Organization metadata**: company page names and IDs are cached locally to avoid repeated API calls. Refreshed on reconnect. Deleted when the account is disconnected.
- **Account deletion**: upon your request, all LinkedIn-related data is permanently deleted within 30 days. Contact privacy@inclufy.com.

### Your Rights (GDPR)

- **Access**: request a copy of all data we hold about your LinkedIn connection
- **Rectification**: correct inaccurate data
- **Erasure**: delete your data ("right to be forgotten")
- **Portability**: export your data in a machine-readable format
- **Restriction**: limit how we process your data

Exercise these rights via privacy@inclufy.com. Response within 30 days per GDPR Article 12.

---

## 4. Pre-Submission Checklist

Before clicking "Submit" in LinkedIn Developer Portal:

- [ ] App website (https://inclufy.com or equivalent) is **live and accessible**
- [ ] Privacy Policy page is **live** and contains the LinkedIn section above
- [ ] Terms of Service page is **live**
- [ ] Contact email (privacy@inclufy.com, support@inclufy.com) is monitored
- [ ] App logo uploaded in LinkedIn app settings (1024×1024 PNG)
- [ ] OAuth redirect URIs match production + testing:
      `https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/oauth-callback`
- [ ] Demo video recorded, uploaded to YouTube (unlisted) or Vimeo
- [ ] Demo video URL added to application form
- [ ] Use case document (section 1 above) pasted into application form
- [ ] Test account with admin role on at least 2 LinkedIn company pages (for the demo)
- [ ] Screenshot of app in action for application form (optional but helpful)
- [ ] App traction evidence: user count, publish count, company testimonials (strengthens application)

---

## 5. What to Do After Submission

### Email monitoring
LinkedIn replies come from `marketing-platform-developer@linkedin.com`. Whitelist to avoid spam.

### Response scenarios

**Approved** (2-6 weeks typical)
1. Enable the scopes in the LinkedIn Developer Portal → Products tab
2. Set `EXPO_PUBLIC_LINKEDIN_LMDP=true` in `.env.local` and EAS secrets
3. Trigger a new EAS build: `eas build --platform ios --profile production --auto-submit`
4. Announce the feature to users: disconnect + reconnect required

**More info requested**
- Respond within 5 business days
- Keep the original use case + video URL handy
- Provide extra screenshots or clarifications as asked

**Rejected**
- Read reject reason carefully
- Common fixes:
  - Increase traction (users, posts) before resubmitting
  - Rewrite use case to be more specific
  - Re-record video showing actual approved scopes + a mock of requested scopes
  - Update privacy policy for gaps LinkedIn identified
- Wait 30 days before resubmitting (LinkedIn's guideline)
- Resubmit with a cover letter referencing the ticket ID

---

## 6. Code State — What's Ready

### Server-side (already deployed)
- `oauth-callback` edge function calls `/v2/organizationAcls` after LinkedIn token exchange
- Each admin org is stored as a separate `social_accounts` row with `account_type='company'`
- If scope missing (pre-approval), 403 is caught, logged, and flow continues with personal-only (current behavior preserved)
- Commit: `[this commit]` in `InclufyMarketing` repo

### Client-side (behind feature flag)
- `SettingsScreen.tsx` LinkedIn OAuth URL scope list is env-driven
- `EXPO_PUBLIC_LINKEDIN_LMDP=true` enables requesting the 3 org scopes
- Default is `false` — existing users see no change until flag flipped
- Commit: `[this commit]` in `InclufyMarketing` repo

### `publish-social` edge function
- Already handles `account_type='company'` case (since commit `cb3b951`)
- Builds `urn:li:organization:${profileId}` author URN automatically
- No changes needed post-approval

### EAS build steps after LMDP approval
```bash
# In project root
echo "EXPO_PUBLIC_LINKEDIN_LMDP=true" >> .env.local
# Add the same secret in EAS:
eas secret:create --scope project --name EXPO_PUBLIC_LINKEDIN_LMDP --value true
# Trigger build
eas build --platform ios --profile production --auto-submit --non-interactive
```

---

## 7. References

- [LinkedIn Marketing Developer Platform overview](https://learn.microsoft.com/en-us/linkedin/marketing/)
- [Community Management API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/)
- [OrganizationAcls endpoint](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/organizations/organization-access-control)
- [UGC Posts API](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/ugc-post-api)
- [App review FAQ](https://learn.microsoft.com/en-us/linkedin/shared/api-guide/product-requests)

---

*Generated 2026-04-23. Update Section 2 video URL once recorded.*
