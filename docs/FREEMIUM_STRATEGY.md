# AMOS Freemium Strategy

> Strategisch ontwerp van de freemium-laag van AMOS. Wat krijgt een free user,
> wat is een upgrade trigger, en waarom. Auteur: Sami Loukile + Claude.
> Versie 1, 2026-05-17.

## TL;DR — De drie wetten van een goede freemium

1. **Free is een product, geen handicap.** Een free user moet het kern­voordeel
   van AMOS daadwerkelijk ervaren — capture → AI → publish — niet alleen lezen
   dat het bestaat. Anders gaan ze weg vóór de upgrade-trigger.
2. **Upgrade triggers zijn pijnpunten van actief gebruik, geen gates.** Niet
   "je mag deze feature niet zien", wel "je hebt de feature gebruikt, je wilt
   meer, hier's hoe je meer krijgt". Pijn = momentum.
3. **Free tier moet je niets kosten.** Storage, AI tokens, social-API calls —
   alles begrensd door harde caps. Eén viral user die 100k posts maakt op
   free mag onze bottom line niet raken.

## Huidige implementatie (na vandaag's commits)

| Laag | Free | Pro+ |
|------|------|------|
| **Content maken** in app | ✅ onbeperkt | ✅ onbeperkt |
| **Publish-actions / dag** | 3 | onbeperkt |
| **Channels / post** | 1 (geen cross-channel) | onbeperkt |
| **Watermark** "AMOS · by Inclufy" | ✅ gebakken in foto | ❌ |
| **Storage retention** | 0 dagen (auto-delete na publish) | onbeperkt (Pro/Promote) of langer |
| **AI calls** | gedeeld met paid: 100/uur + 1000/dag | idem (cap blijft als safety net) |

## Voorgesteld 5-tier model

### Free — "AMOS Starter" (€ 0)
**Doel**: laat user de capture→AI→publish flow ervaren binnen één werkdag.
Genoeg om te zeggen "wow", niet genoeg om er een merk op te bouwen.

- 1 connected social account (uit: LinkedIn personal, IG personal, FB pers, X)
- 3 publishes / dag
- 1 channel per post (geen cross-channel)
- 5 AI generations / dag (event-studio-ai + ai-ad-variants gecombineerd)
- AMOS watermark op elke foto (server-side gehandhaafd zodra de bypass fix er is)
- 0 dagen storage retention (auto-delete na publish ✅ geïmplementeerd)
- Basis AI-model (gpt-4o-mini)
- Geen scheduling, geen content library, geen team, geen brand kit
- Geen analytics history (alleen huidige sessie)
- Email-only support

### Pro — "AMOS Pro" (€ 19 / mnd, jaarlijks)
**Doel**: marketing-driven solopreneur die wekelijks 5-15 posts maakt.

- Alle Free features +
- 3 connected social accounts (incl. LinkedIn personal + 1 pagina, IG, FB, X)
- Onbeperkt publishes / dag
- Cross-channel publishing (1 capture → meerdere platforms tegelijk)
- 50 AI generations / dag
- ❌ Geen watermark
- 30 dagen storage retention
- Scheduling (publish later)
- Basic content library (laatste 30 dagen)
- Brand kit (1 brand: logo + kleuren + voice profile)
- 6 mnd analytics history

### Promote — "AMOS Promote" (€ 49 / mnd)
**Doel**: marketer die organisch + paid combineert. Eerste-tier paid ads.

- Alle Pro features +
- 1 Meta-boost inbegrepen per maand (~ € 30 ad spend value)
- Per-boost top-up beschikbaar
- TikTok + Pinterest channels toegevoegd (8 totaal connected accounts)
- Multi-agent workflows enabled (agent-counterfactual, agent-ads)
- 200 AI generations / dag
- 90 dagen storage retention
- 1-jaar analytics history

### Ads — "AMOS Ads" (€ 99 / mnd)
**Doel**: bureau/team die paid social actief inzet. Boost-engine zit hier.

- Alle Promote features +
- 5 boosts inbegrepen / mnd (Meta, LinkedIn, TikTok, Pinterest gemengd, ~ € 150 spend value)
- ai-ad-variants enabled (multi-variant generator)
- Lookalike audiences via ai-connection-helper
- 500 AI generations / dag
- Onbeperkt storage retention
- 3-jaar analytics history
- Priority support (chat, < 4u response)

### Enterprise — "AMOS Enterprise" (vanaf € 299 / mnd, custom)
**Doel**: organisatie met meerdere users, white-label behoefte, of branche-eis
voor DPA + on-prem storage.

- Alle Ads features +
- Multi-user (team-licenties)
- White label (zero AMOS branding overal, ook in watermark slot)
- Custom storage retention (kan tot 10 jaar voor banken / NRTO / etc.)
- Dedicated CSM + SLA
- Custom AI-model keuze (Claude Opus, GPT-4 Premium)
- API access voor eigen integraties
- Onbeperkt AI generations
- DPA + GDPR-Art.28 contract als bijlage

## Upgrade triggers per actief gebruik-moment

| Moment in app | Wat zien free users | Wat Pro+ users zien |
|---------------|---------------------|---------------------|
| 3e publish van de dag | Modal "Dagelijkse limiet bereikt → Upgrade" | Niets |
| Probeert 2e channel toe te voegen aan post | "Cross-channel publishing is een Pro feature" | Free toe te voegen |
| Tap "Schedule for later" | Locked icon + "Pro" badge | Volledige scheduling UI |
| Tap "Boost post" | "Promote tier nodig — vanaf € 49/mnd, eerste boost inbegrepen" | Boost flow opent |
| Tap "Bekijk archief" | "Archief is een Pro feature — je posts staan live op de platforms" | Lijst van laatste 30d |
| Probeert een 2e brand toe te voegen | "Multi-brand is een Promote feature" | UI toont brand-switcher |
| Run brand-voice analyzer | "Brand Voice analyse — Pro feature" | Analyse opent |
| Probeert team-lid uit te nodigen | "Teams zijn Enterprise" | Invite UI opent |
| Probeert API key te genereren | "API access is Enterprise" | API-key generator |

## Wat we NIET doen (en waarom niet)

- **Niet limiteren op # AI-generations < 5/dag** — minder dan dat is geen
  workflow meer. User raakt gefrustreerd vóór de "wow" en gaat weg.
- **Niet de feed verbergen** — als user posts heeft gepubliceerd, mag hij
  zien dat ze live staan. Anders voelt het als bait-and-switch.
- **Niet alle social platforms achter Pro zetten** — minimaal LinkedIn + IG
  + FB + X moet free hebben, anders kan user de kern-USP niet ervaren.
- **Niet trial-only** ("14 dagen gratis daarna betalen") — de Inclufy
  brandbelofte = bereikbaar / inclusief. Free moet permanent gratis blijven.
- **Niet limiteren op aantal events** — events zijn cosmetisch in AMOS,
  niet de bottleneck. Cap zit op publishes, niet events.

## Cost containment — onder de motorkap

| Resource | Cap mechanisme | Schatting cost-per-free-user / mnd |
|----------|----------------|-----------------------------------|
| Supabase storage | Auto-delete na publish ✅ | < € 0.05 |
| Supabase egress | Storage = 0 dus geen herhaalde fetches | < € 0.10 |
| OpenAI tokens | Daily AI cap (5/dag) | < € 0.50 (5× gpt-4o-mini ~ € 0.10 per call) |
| Supabase edge fn invocations | Daily 3 publishes + AI quota | < € 0.10 |
| Push notifications | per push send_log gecapped | < € 0.05 |
| **Totaal worst-case** | | **~ € 0.80 / free user / mnd** |

Free user is breakeven zodra hij in 24 maanden een betaalde upgrade rechtvaardigt
(€ 19 Pro = 24× € 0.80). Realistisch breakeven binnen 6-12 mnd voor 20-30% van
de free-base. Voor de andere 70-80% kost € 0.80/mnd = acceptabel CAC voor
brand-spread via watermark.

## Phasering — wat ship-en we waar

### Vandaag — already live (commits 812b6ba, 3e977d8, ea57260, 804faaf)
- ✅ Watermark op publish
- ✅ Multi-logo overlay
- ✅ 3 posts/dag cap
- ✅ Storage cleanup na publish

### Sprint-4 — server-side hardening + UI polishing
- Server-side gate in `publish-social` edge fn (anti-bypass)
- Channels-per-post UI gate (filter selectable accounts naar 1 op free)
- "Archived" tile in All-Posts feed (vervangt broken image)
- Pricing page conversie (marketing.inclufy.com/pricing met de 5 tier ladder)
- Stripe webhook → profiles.tier mapping (al deels gedaan)

### Sprint-5 — analytics + upgrade-funnel
- Upgrade-CTA impression / click tracking → conversion funnel
- A/B test 3-vs-5 daily cap, watermark on/off, etc.
- Cohort analysis: free→pro conversion na X dagen
- Voorspellings­model voor wie waarschijnlijk upgrades doet (agent-counterfactual)

### Later — variabele caps + ML
- Dynamic daily cap (3 standaard, naar 5 voor users die positieve engagement
  delivery laten zien) — beloon power-users
- Verlaag tot 1/dag voor users die alleen al AI tokens slurpen zonder publish
  (bot-screening)
- Gamification: "Post 7 dagen in een rij → tijdelijk 5/dag gratis"

## Acceptatie criteria voor "freemium is goed ingesteld"

- [ ] Free user kan binnen 60 sec na install zijn eerste post live krijgen
- [ ] Free user die 3 posts/dag haalt voelt zich genoten, niet beperkt
- [ ] Upgrade CTA percent click-through > 8% (industry benchmark)
- [ ] Free user → Pro conversie binnen 30 dagen > 4% (Buffer benchmark = 5%, Canva = 8%)
- [ ] Free user gross-cost / mnd < € 1.00
- [ ] Pro+ user heeft géén features die ontbreken die ze in Free hadden
- [ ] Geen feature is gegate door tier zonder dat de upgrade-pad < 3 clicks bevat

## Open vragen voor jou (Sami) als product owner

1. **Free → Pro prijs**: ben je OK met € 19 / mnd jaarlijks (= € 228 / jaar)? Of
   ander prijs­punt? Stripe is al klaar om dit te ondersteunen, ontbreekt
   alleen de prijs-config.
2. **Watermark removal als one-time-buy**: aanvulling op subscription? Bv.
   "Remove watermark for 24h on this post — € 0.50". Kan via Stripe one-time.
   Risico: cannibaliseert subscription, maar trekt budget-conscious users.
3. **Free op LinkedIn pagina's** of alleen LinkedIn personal: het LMDP-pakket
   beslist hierover technisch — zodra LMDP approved is, kunnen we kiezen.
4. **Annual vs Monthly**: enkele tier of beide? Aanrader: bied annually with
   ~20% discount (€ 19/mnd of € 190/jaar voor Pro).
5. **Friends-and-family** of education / non-profit pricing? Inclufy hint
   ook richting maatschappelijke organisaties — daar past gerichte korting bij.

---

Antwoord op deze 5 vragen → ik implementeer de prijs/tier-config in
`marketing.inclufy.com/pricing` + Stripe + profiles.tier mapping en sluit dit
strategiedocument als v1 actief.
