# 2026-05-08 — Capture-to-Ad Release & Test Roadmap

**Sprint scope:** Vandaag in 1 dag een production-grade social media + ads engine.

**Wat is gedeployed:**
- 6 OAuth platforms (LinkedIn, Facebook, Instagram, TikTok, Pinterest, Threads)
- 2 manual share platforms (Snapchat, WhatsApp)
- Volledige Capture-to-Ad flow (DB + 4 edge functions + cron + 2 wizards mobile/web)
- Live Meta Marketing API integratie (achter feature flag)

---

## 1. Deploy artefacten — wat moet getest

### 1.1 Code wijzigingen (commits vandaag)

| Commit | Onderdeel | Test scope |
|---|---|---|
| `9e5fe60` | IG Direct Login (separate App ID) | OAuth flow Instagram |
| `05370cb` | Threads Direct Login (separate App ID) | OAuth flow Threads |
| `19b9cbb` | Snapchat manual-share UX (wizard) | Wizard goal-step Snapchat selectie |
| `4135900` | Settings: Pinterest + Threads + WhatsApp | Settings rendering |
| `39d7a99` | force_reauth=true voor IG | IG OAuth cache bypass |
| `d4043c5` | enable_fb_login=0 voor IG | IG "Ontwikkelaarsrol" fix |
| `627e5c0` | Pinterest + Threads in wizard goal-step | Wizard 8 platforms |
| `bac687f` | WhatsApp + manual-share generalization | Manual platform render |
| `5e61b22` | LinkedIn 3000-char truncate + cropForChannel utility | Long-form posts + ratio crop |
| `2e10a93` | Capture-to-Ad foundation (DB + 2 edge fns) | Boost-post + AI variants |
| `0060682` | Boost button mobile (PostReview) | Boost UI mobile |
| `f61b918` | Web Boost button + ad-performance-monitor cron | Boost UI web + cron |
| `47c4d67` | Threads profile fallback | Threads DB insert robust |
| `18eb674` | BoostFlow wizard mobile (4-step) | Mobile BoostFlow E2E |
| `40554a0` | BoostFlow page web | Web BoostFlow E2E |
| `6e56a93` | Live Meta Marketing API + Snapchat deep-link + boost notifs | Full ads pipeline |

### 1.2 DB schema

- `ad_campaigns` (organisation/user, source_post_id, channel, status, budget, audience_config, external_*)
- `campaign_creatives` (variant_label, headline, primary_text, ai_target_emotion)
- `campaign_metrics` (daily impressions/clicks/spent + generated CTR/CPC/CPM)
- 4 RLS policies (owner, via-campaign reads, service_role write metrics)
- 5 indexes
- Migration file: `20260508160000_capture_to_ad_schema.sql`

### 1.3 Edge functions (deployed)

| Function | Status | Acceptance criteria |
|---|---|---|
| `oauth-callback` | ✅ Live | Token exchange werkt voor 6 platforms |
| `publish-social` | ✅ Live | LinkedIn 3000-char truncate actief |
| `ai-ad-variants` | ✅ Live | Genereert 3 variants per call (aspiration/social/urgency) |
| `boost-post` | ✅ Live | DRY-RUN + LIVE mode beide werkend |
| `ad-performance-monitor` | ✅ Live | Cron job 3 actief (daily 09:00 UTC) |

### 1.4 Cron schedules

| Job ID | Schedule | Function |
|---|---|---|
| 3 | `0 9 * * *` (daily 09:00 UTC) | ad-performance-monitor |

---

## 2. Test scope — uitgebreid

### 2.1 Smoke tests (5 min)

| # | Wat | Resultaat |
|---|---|---|
| S1 | Open AMOS → Settings → Sociale Accounts | 6 connected (groen) + 2 manual (Klaar) |
| S2 | Open AMOS → Wizard | 8 platforms zichtbaar in goal-step |
| S3 | SQL: `SELECT count(*) FROM social_accounts WHERE status='active'` | ≥ 6 |
| S4 | SQL: `SELECT count(*) FROM ad_campaigns` | ≥ 0 (table exists, RLS works) |
| S5 | Edge fn ping: `curl https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/boost-post` | 401 (auth needed = up) |
| S6 | Cron status: `SELECT * FROM cron.job WHERE jobid = 3` | active |

### 2.2 Connect flow tests (per platform)

| Platform | OAuth start URL | Verwacht |
|---|---|---|
| LinkedIn | `linkedin.com/oauth/v2/authorization` | userinfo → social_accounts row personal |
| Facebook | `facebook.com/v21.0/dialog/oauth` | me/accounts → personal + Pages rows |
| Instagram | `instagram.com/oauth/authorize` (force_reauth=true, enable_fb_login=0) | sami.louk Business row |
| TikTok | `tiktok.com/v2/auth/authorize` (Sandbox) | dkouk92 row |
| Pinterest | `pinterest.com/oauth` | Inclufy business row |
| Threads | `threads.net/oauth/authorize` (separate APP_ID) | sami.louk row |
| Snapchat | n.v.t. (manual) | Wizard toont MANUEEL badge |
| WhatsApp | n.v.t. (manual) | idem |

### 2.3 Publish flow tests (echte content)

⚠️ **Per platform expliciete goedkeuring vragen voor live publish.**

| Test | Channel | Format | Verwacht |
|---|---|---|---|
| P1 | LinkedIn | tekst-only | Post zichtbaar op linkedin.com/in/sami-loukile |
| P2 | LinkedIn | + landscape foto | UGC posts asset upload werkt, foto zichtbaar |
| P3 | Facebook | Inclufy Page tekst-only | Post zichtbaar op fb.com/Inclufy.Ecosystem |
| P4 | Facebook | + foto | Page foto post werkt |
| P5 | Instagram | tekst + 1:1 foto | IG feed post zichtbaar |
| P6 | TikTok Sandbox | 9:16 video | Video upload + status polling werkt |
| P7 | Pinterest | foto + board pick | Pin zichtbaar op Inclufy Pinterest |
| P8 | Threads | tekst | Thread zichtbaar op @sami.louk |
| P9 | Snapchat | tekst | Snap app opent + clipboard heeft tekst |
| P10 | WhatsApp | tekst | WA opent met tekst pre-filled |

### 2.4 Multi-channel tests

| Test | Wat | Verwacht |
|---|---|---|
| M1 | Publiceer 1 post tegelijk naar LinkedIn + FB | Beide platforms krijgen post |
| M2 | Publiceer naar 5 platforms tegelijk (LinkedIn + FB + IG + TikTok + Pinterest) | Sequentieel, partial-success als 1 faalt |
| M3 | 1 platform faalt expres (token revoked) | Andere blijven werken, error in Alert |

### 2.5 Capture-to-Ad tests (DRY-RUN mode)

| Test | Wat | Verwacht |
|---|---|---|
| A1 | Publiceer FB post → tap 🚀 Boost | Navigeert naar BoostFlow wizard stap 1 |
| A2 | Wizard stap 1 → kies €25/3d | Volgende-knop active |
| A3 | Wizard stap 2 → kies Lookalike | Volgende-knop active |
| A4 | Wizard stap 3 → boost-post call | 3 variants verschijnen (A/B/C met emoties) |
| A5 | Kies variant B → Volgende → stap 4 | Summary toont budget + audience + variant B |
| A6 | Bevestig → "Boost ingediend" | DB: ad_campaigns row + 3 campaign_creatives + 1 is_winner=true |
| A7 | SQL check: `SELECT * FROM ad_campaigns WHERE source_post_id = '<post_id>'` | 1 row, status='pending_approval' |

### 2.6 Capture-to-Ad tests (LIVE mode, na Meta App approval)

⚠️ **Pas activeren wanneer META_ADS_API_LIVE=true en META_AD_ACCOUNT_ID gezet.**

| Test | Wat | Verwacht |
|---|---|---|
| L1 | Boost FB post via wizard | Real Meta Marketing API call |
| L2 | Check Meta Ads Manager | Campaign + AdSet zichtbaar (status PAUSED) |
| L3 | DB: external_campaign_id gezet | Match met FB campaign ID |
| L4 | User unpauses in Meta UI | Ad goes live |
| L5 | Volgende dag: ad-performance-monitor cron | campaign_metrics row geschreven |

### 2.7 Edge cases / regression

| Test | Wat | Verwacht |
|---|---|---|
| E1 | Wizard met 0 platforms geselecteerd → goNext | "Verder" disabled |
| E2 | Boost button op LinkedIn post | Niet zichtbaar (alleen FB/IG) |
| E3 | LinkedIn post met >3000 chars | Truncate naar 2997 + '...' |
| E4 | iPhone foto 4:3 → IG | Wordt door IG auto-cropped (geen crash) |
| E5 | Token verlopen (LinkedIn) | Auto-refresh via refresh_token |
| E6 | Token verlopen (FB/IG) | status='expired', user notification om reconnect |
| E7 | Pinterest API call zonder pins:write | Error netjes afgehandeld |
| E8 | Snapchat tap "Open Snapchat" zonder app | Fallback naar webFallback URL |
| E9 | Boost wizard: ai-ad-variants faalt | Error toast, wizard niet stuck |
| E10 | Background boost-post call (oude flow) | DB row aangemaakt, geen UI lock |

### 2.8 Security tests

| Test | Wat | Verwacht |
|---|---|---|
| SEC1 | RLS: andere user kan ad_campaigns niet lezen | 0 rows returned |
| SEC2 | RLS: andere user kan campaign_creatives niet update | RLS error |
| SEC3 | service_role kan campaign_metrics writes | OK |
| SEC4 | OAuth state parameter: wrong userId rejected | errorPage('Ongeldige state') |
| SEC5 | Edge fn auth header missing | 401 |

---

## 3. Pre-deploy checks

- [x] Alle commits gepusht naar GitHub + GitLab
- [x] Edge functions deployed
- [x] DB migration applied (3 tabellen + RLS)
- [x] Cron job 3 active
- [x] Secrets in Supabase: `META_APP_SECRET`, `INSTAGRAM_APP_ID`, `INSTAGRAM_APP_SECRET`, `THREADS_APP_ID`, `THREADS_APP_SECRET`, `PINTEREST_CLIENT_ID`, `PINTEREST_CLIENT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`
- [ ] Build 250+ in TestFlight (containing all today's commits)
- [ ] Vercel deploy completed (web)
- [ ] `META_AD_ACCOUNT_ID` gezet (voor live mode)
- [ ] `META_ADS_API_LIVE=true` (voor live mode na approval)

## 4. Post-deploy validation

- [ ] Smoke tests S1-S6 passed
- [ ] 1 live publish per platform succesvol (P1, P3, P5, P6, P7, P8)
- [ ] BoostFlow E2E tests A1-A7 passed (DRY-RUN)
- [ ] Geen crash reports in Sentry/console eerste 30 min
- [ ] Edge function error rate < 1% in Supabase Dashboard

## 5. Rollback strategie

Per component:

| Component | Rollback actie |
|---|---|
| Mobile build | TestFlight: revert naar Build 247 |
| Web | Vercel: redeploy previous successful build |
| Edge fn | `supabase functions deploy oauth-callback --version <prev>` |
| DB schema | Migrations zijn additieve — geen rollback nodig (drop tables = data loss) |
| Cron job 3 | `SELECT cron.unschedule(3);` |
| Secrets | Houd vorige waarden in 1Password backup |

## 6. Bekende beperkingen / volgende sprint

- LMDP approval (LinkedIn Company Pages multi-account) → 2-4 weken wacht
- Meta App Review (ads_management + ads_read voor klanten) → 2-4 weken
- TikTok Production review → 7-14 dagen
- Pinterest Standard Access → al approved ✅
- BoostFlow custom audiences (lookalike server-side gemaakt) → volgende sprint
- TikTok / LinkedIn / Pinterest ads → future (Q3 2026)

## 7. Success metrics (eerste week)

- 6/6 platforms connected = 100%
- 1 live publish per platform = 6/6 = 100%
- 1 Boost via DRY-RUN = ad_campaigns + creatives row
- 0 production errors in eerste 24u
- Edge fn p95 latency < 2s

---

**Status: READY FOR DEPLOY + UITGEBREIDE TESTING.**
