# Social Account Types — Reference Matrix

**Datum:** 2026-05-07
**Doel:** Eenduidige bron voor: wat is een persoonlijk vs. zakelijk account per platform, welke API-mogelijkheden zijn er per type, welke scopes/approvals zijn nodig, en wat is AMOS' huidige status.

Deze matrix wordt gebruikt door:
- Database (`social_accounts.account_type` enum)
- AMOS account picker UI
- Wizard prerequisites & error messaging
- LinkedIn LMDP / Meta App Review submissions
- Privacy Policy sections 2.6 + 2.7

---

## 1. Korte versie (TL;DR)

| Platform | Persoonlijk kan publiceren? | Zakelijk kan publiceren? | AMOS status |
|---|---|---|---|
| **Facebook** | ❌ Nee (API deprecated 2018) | ✅ Ja, via Page (Meta App Review nodig) | Page-publish werkt na approval |
| **Instagram** | ❌ Nee (API never existed for personal) | ✅ Ja, alleen Business of Creator | Business-publish werkt na approval |
| **LinkedIn** | ✅ Ja, eigen feed | ✅ Ja, Company Page (LMDP nodig) | Personal werkt; Company wacht op LMDP |
| **TikTok** | ⚠️ Beperkt (scope + quota) | ⚠️ Apart Business platform | Code aanwezig, niet gevalideerd |
| **Snapchat** | ❌ API niet beschikbaar publiek | ⚠️ Alleen Marketing API (ads) | Niet ondersteund |
| **X / Twitter** | ✅ Ja (free tier 1500/mo) | ✅ Ja, zelfde API | Disabled (te lage limit) |
| **YouTube** | ✅ Ja, channel-upload | ✅ Brand account | Niet geïmplementeerd |
| **WhatsApp** | ❌ Niet via API | ✅ Cloud API (Business Account) | Pad A manual / Pad B in onderzoek |

---

## 2. Per-platform detail

### 2.1 Facebook

**Persoonlijk profiel (`account_type = 'personal'`)**

- **Wat is het:** Je gewone Facebook-profiel waar je vrienden, foto's, etc. hebt.
- **API publish-mogelijkheid:** ❌ **Bestaat niet meer.** Sinds 2018 (Cambridge Analytica) heeft Meta de `publish_actions` permission gedeprecateerd. Je kunt vanuit een 3e-party app (zoals AMOS) NIET meer naar je persoonlijke FB-feed posten.
- **Wat AMOS hier opslaat:** alleen de identiteit (FB user ID + naam) zodat we kunnen zien tot welke Pages je toegang hebt.
- **Picker-zichtbaarheid:** ❌ Personal FB-profiel verschijnt NIET in de AMOS picker als publiceer-bestemming.
- **Use case:** alleen technisch nodig om Pages te ontdekken.

**Page (`account_type = 'page'`)**

- **Wat is het:** Een Facebook-bedrijfspagina (bv. "Inclufy Ecosystem"). Door admins beheerd, gevolgd door fans.
- **API publish-mogelijkheid:** ✅ Volledig — foto's, video, link-posts, status updates, Stories.
- **Vereiste scopes:** `pages_show_list` + `pages_manage_posts` + `pages_read_engagement`
- **Goedkeuring nodig:** Meta App Review (5-15 werkdagen)
- **Wat AMOS doet:** OAuth via FB → roept `/me/accounts` → voor elke Page: stort row met `account_type='page'` + page-specific access token.
- **Picker-zichtbaarheid:** ✅ Toont elke admin Page met page-naam + page-logo.

**Group**

- **Wat is het:** Facebook Groep waar leden discussiëren.
- **API publish-mogelijkheid:** ⚠️ Beperkt — alleen als de admin van de groep ook page-admin is, en alleen via `pages_manage_posts`.
- **AMOS:** niet ondersteund. Te niche voor v1.

---

### 2.2 Instagram

**Persoonlijk IG account (`account_type = 'personal'` op IG-platform)**

- **Wat is het:** Een gewoon Instagram-account.
- **API publish-mogelijkheid:** ❌ **Heeft nooit bestaan.** Instagram heeft sinds 2020 alleen de Content Publishing API gepubliceerd voor Business + Creator accounts. Persoonlijke IG kan NIET via API posten.
- **Workaround:** Instagram Basic Display API geeft alleen lees-toegang (foto's, profiel) — geen publish. Sinds 2024 ook gedeprecateerd.
- **Wat AMOS BIJ DEZE BUG opsloeg:** sinds gisteren-fix: niets meer voor personal IG (skip in oauth-callback). Daarvoor: een onbruikbare row die in picker verscheen → silent fail bij publish.
- **Picker-zichtbaarheid:** ❌ NIET getoond na bug-fix.

**Instagram Business account (`account_type = 'business'`)**

- **Wat is het:** Een Instagram-account dat is **omgezet naar Business of Creator** in IG-instellingen, gekoppeld aan een Facebook Page.
- **API publish-mogelijkheid:** ✅ Foto's, carousels, Reels, recent ook Stories (limited).
- **Vereiste scopes:** `instagram_basic` + `instagram_content_publish` + `pages_show_list` (om de gekoppelde Page te vinden)
- **Goedkeuring nodig:** Meta App Review
- **Hoe vinden we het:** Via Facebook OAuth → `/me/accounts?fields=instagram_business_account` → IG account_id zit in elke FB Page response.
- **Wat AMOS doet:** OAuth via FB → voor elke Page met `instagram_business_account` field: stort IG row met `account_type='business'` + page access token (IG API gebruikt page tokens).
- **Picker-zichtbaarheid:** ✅ Toont @handle + IG-logo + "Business"-badge.

**Creator account**

- **Wat is het:** Variant van Business voor influencers/creators.
- **API:** identiek aan Business voor publish-doeleinden.
- **AMOS:** behandelt als `account_type='business'`.

**Hoe converteert een gebruiker van Personal → Business?**

In Instagram-app: **Profile → Menu → Settings → Account → Schakel naar professioneel account → Business**. Vereist FB Page gekoppeld. Dit is de #1 aanbeveling die de wizard moet geven aan users met personal IG.

---

### 2.3 LinkedIn

**Persoonlijk profiel (`account_type = 'personal'`)**

- **Wat is het:** Je LinkedIn-profiel als professional.
- **API publish-mogelijkheid:** ✅ Werkt vandaag — eigen feed posts, multi-image support.
- **Vereiste scope:** `w_member_social` (basis, geen extra approval)
- **Goedkeuring:** automatisch verleend via standaard LinkedIn OAuth.
- **Wat AMOS doet:** OAuth → store met `account_type='personal'` + access_token.
- **Picker-zichtbaarheid:** ✅ Toont eigen naam + persoonlijke profielfoto + "Persoonlijk"-badge.

**Company Page (`account_type = 'company'`)**

- **Wat is het:** Een LinkedIn-bedrijfspagina (bv. "Inclufy Solutions"). Door admins beheerd.
- **API publish-mogelijkheid:** ✅ Foto, video, tekst-post, document-post.
- **Vereiste scopes:** `r_organization_social` + `w_organization_social` + `rw_organization_admin`
- **Goedkeuring nodig:** **LinkedIn Marketing Developer Platform (LMDP)** — 2-12 weken doorlooptijd, ingediend 2026-05-07.
- **Hoe vinden we het:** Na OAuth: `/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED` → list van admin orgs.
- **Wat AMOS doet:** Bij LMDP-approval scope-set wordt geactiveerd → oauth-callback ontdekt admin orgs → store als `account_type='company'`.
- **Picker-zichtbaarheid:** ✅ Toont elke admin Company Page met logo + "Bedrijf"-badge — alleen na LMDP approval.

**Showcase Page**

- **Wat is het:** Sub-page onder een Company Page voor specifieke product-lijnen.
- **API:** identiek aan Company Page (zelfde scopes).
- **AMOS:** behandelt als `account_type='company'`.

**Group**

- **Wat is het:** LinkedIn Groep voor discussies.
- **API publish-mogelijkheid:** Geen publieke publish-API meer sinds 2017.
- **AMOS:** niet ondersteund.

---

### 2.4 TikTok

**Persoonlijk account**

- **Wat is het:** Standaard TikTok-account.
- **API publish-mogelijkheid:** ⚠️ Mogelijk via `video.publish` scope, maar:
  - Quota: 5 videos/dag per user
  - Inhoudelijke checks (geen reposts van TT-content)
  - Authenticatie via TikTok Login Kit
- **AMOS status:** code aanwezig in oauth-callback (TikTok branch line 366), maar niet end-to-end gevalideerd. Niet zichtbaar in PostReview tabs (alleen in Settings).

**TikTok for Business**

- **Wat is het:** Apart platform voor merken — TikTok Marketing API.
- **API publish-mogelijkheid:** Aparte SDK, andere scopes. Vereist TikTok-business approval.
- **AMOS:** niet ondersteund. Te complex voor v1.

**Reactie voor reviewers:** "TikTok is in de Settings zichtbaar als toekomstige feature ('Beta'-badge). PostReview heeft geen TikTok-tab → users kunnen niet per ongeluk naar TikTok proberen te posten."

---

### 2.5 Snapchat

**Persoonlijk account**

- **API:** Snapchat heeft GEEN publieke publish-API voor 3e-party apps. Snap Kit (deprecated) bood beperkte stories-deling, maar is opgeheven.
- **AMOS:** niet implementeerbaar.

**Snapchat Marketing API**

- **Wat is het:** Voor advertentiebeheer + Snap Ads.
- **AMOS:** out of scope (geen ad management in v1).

**UI status in AMOS:** Snapchat staat als "Binnenkort"-badge in Settings. Bij tap → alert "Wordt binnenkort ondersteund". Deze copy klopt strikt genomen niet — Snapchat zal waarschijnlijk NOOIT ondersteund worden tenzij Snap een nieuwe API uitbrengt. Aanbeveling: **vervang "Binnenkort" door "Niet ondersteund"** of verwijder de rij volledig vóór reviewer-tests.

---

### 2.6 X / Twitter

**Persoonlijk + Zakelijk (geen onderscheid op API-niveau)**

- **API:** Tweet posten via X API v2 met `tweet.write` scope.
- **Limit op free tier:** **1500 tweets/maand totaal voor de hele app, niet per user**. Bij 50 users die elk 30 tweets/mo posten = limit reached.
- **Pricing:** Basic tier $100/mo voor 3000 tweets, Pro $5000/mo.
- **AMOS:** disabled in v1 i.v.m. cost. Code-pad bestaat, kan na launch geactiveerd als business case rondkomt.

---

### 2.7 YouTube

**Channel (Personal of Brand)**

- **API:** YouTube Data API v3 → `youtube.upload` scope via Google OAuth.
- **Verschil:** persoonlijk channel = jouw account, brand channel = team-share account.
- **Use case voor AMOS:** YouTube Shorts upload (verticale 60s video).
- **AMOS status:** niet geïmplementeerd. Roadmap-item voor Q3.

---

### 2.8 WhatsApp

**Persoonlijk WhatsApp**

- **API:** ❌ Geen publieke API voor 3e-party publish.
- **Workaround:** WhatsApp Business App heeft een Status-feature die handmatig gebruikt kan worden.

**WhatsApp Business — twee opties**

| | Pad A: Manual share | Pad B: Cloud API |
|---|---|---|
| Wat | Deep-link naar WhatsApp Business app, user plakt content zelf | AMOS roept Cloud API en post automatisch |
| Setup | Geen | Meta KYB + Phone Number registratie |
| Kosten | €0 | Per-message (€0.005-0.05) |
| Doorlooptijd | 0 dagen | 2-3 weken voor approval |
| AMOS status | ✅ Werkt vandaag | ❌ Niet aangevraagd |

**`account_type` voor WhatsApp:** geen onderscheid — Pad A vereist geen account-koppeling. Pad B zou `account_type='business'` zijn met een Phone Number ID.

---

## 3. AMOS database — `account_type` enum

Huidige waardes in `social_accounts.account_type`:

| Waarde | Betekenis | Welke platforms |
|---|---|---|
| `'personal'` | Eigen profiel/feed | LinkedIn (✅ werkt), Facebook (alleen identity, niet publishbaar), TikTok (beperkt) |
| `'page'` | Facebook Page | Alleen Facebook |
| `'business'` | Instagram Business/Creator | Alleen Instagram |
| `'company'` | LinkedIn Company Page | Alleen LinkedIn |

**Aanbevolen toevoegingen voor v1.1:**

| Waarde | Betekenis | Reden |
|---|---|---|
| `'showcase'` | LinkedIn Showcase Page | Subset van company, kan apart treated |
| `'creator'` | Instagram Creator | Aparte UI-badge, zelfde API als business |
| `'brand'` | YouTube Brand Channel | Alleen relevant na YT-implementatie |

---

## 4. UI/UX guidelines per type

### Account-picker badges

```
✅ Persoonlijk profiel  → grijs/blauw badge, geen icoon
🏢 Bedrijfspagina       → groen badge + 🏢 icoon (FB Page, LI Company)
💼 Business profiel     → paars badge + 💼 icoon (IG Business)
👤 Creator profiel      → oranje badge + 👤 icoon (IG Creator)
```

### Wat zichtbaar in picker per platform

| Platform | Toon in picker | Verberg in picker |
|---|---|---|
| Facebook | Pages | Personal profiel (alleen identity) |
| Instagram | Business + Creator | Personal (heeft geen API) |
| LinkedIn | Personal + Company Pages (na LMDP) | Groups, Showcase optioneel |
| TikTok | Personal (Beta badge) | TT for Business |

### Error messages

Wanneer user iets probeert dat niet kan:

| Probleem | User-vriendelijke message |
|---|---|
| Probeert te posten naar IG personal | "Voor Instagram-publicatie heb je een Business of Creator account nodig. Open IG → Settings → Account → Schakel naar professioneel." |
| Probeert te posten naar FB personal | "Facebook ondersteunt geen 3e-party app posts naar je persoonlijke profiel sinds 2018. Maak een Pagina aan om met AMOS te posten." |
| Probeert LinkedIn Company maar LMDP nog niet approved | "Company Page-publicatie wacht op LinkedIn-goedkeuring (verwacht binnen 2-12 weken). Tot die tijd: post naar je persoonlijk profiel en deel handmatig naar de Company Page op linkedin.com." |

---

## 5. Submissions impact

### LinkedIn LMDP application

Onze submission claimt:
- "Personal feed publishing already works"
- "Company Page publishing requested via LMDP"
- "Anti-abuse: account picker forces conscious destination choice"

→ Alle 3 kloppen na bug-fix van vandaag.

### Meta App Review (6 permissions)

Onze submission claimt:
- "AMOS publishes to Facebook Pages (not personal profiles)"
- "AMOS publishes to Instagram Business (not personal IG)"
- "Account picker shows only valid publish destinations"

→ Klopt na bug-fix (personal IG niet meer in picker).

### Privacy Policy

Sections 2.6 (Meta) + 2.7 (LinkedIn) noemen de scopes per type. → Up-to-date.

---

## 6. Open vragen / aanbevelingen

1. **Snapchat-rij verbergen of relabelen** vóór reviewer-tests. "Binnenkort" suggereert development; werkelijkheid is "niet beschikbaar via API".
2. **Voeg `account_subtype` kolom toe** aan `social_accounts` voor finere distinctie (bv. `business` vs `creator` voor IG).
3. **Wizard prerequisite step** moet expliciet differentiëren: gebruiker met personal IG → krijg upgrade-instructies vóór OAuth-flow start.
4. **TikTok-tab toevoegen aan PostReview** of TikTok-rij verbergen in Settings — huidige inconsistentie tussen Settings (zichtbaar) en PostReview (geen tab) is verwarrend.

---

*Dit document is de single source of truth voor account-type semantiek in AMOS. Update bij elke schema-wijziging of nieuwe platform-toevoeging.*
