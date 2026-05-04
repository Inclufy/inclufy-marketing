# Ultra-Scan & State-of-the-Art Voorstellen — marketing.inclufy.com

**Datum**: 2026-05-04
**Auditor**: website-landingpage-curator (handmatig gedraaid, agent geconfigureerd)
**Scope**: marketing.inclufy.com (live productie) + lokale Next.js codebase
**Bron-screenshot**: pricing-pagina (NL, donkere modus, $-valuta, 3 tiers)

---

## TL;DR

De live site werkt, maar zit op het niveau van **"functioneel B2B SaaS 2022"**. Voor de NL/MA/UAE launch en accountancy-doelgroep is dit ondermaats. 12 P0/P1 findings. Met ~3 weken focus is een upgrade naar **state-of-the-art 2026** haalbaar: AI-eerst, conversational, multi-locale, conversie-geoptimaliseerd.

**Score**: 22 / 50 (44%) — onder productie-drempel van 35/50.

| Dimensie | Score |
|---|---|
| Brand consistency | 5/10 |
| Content completeness | 4/10 |
| Currency / market fit | 2/10 |
| Conversion-readiness | 4/10 |
| Tech (SEO, perf, a11y) | 7/10 |

---

## Findings — gesorteerd op severity

### P0 — Blockers (release-stop)

| # | Finding | Bewijs | Voorstel-fix |
|---|---|---|---|
| 1 | $-valuta op NL pricing-pagina | screenshot `marketing.inclufy.com/pricing` toont `$29 / $79 / $199` in NL-tekst | Currency-formatter per locale (`Intl.NumberFormat('nl-NL', {currency:'EUR'})`); fallback op `€` voor onbekend |
| 2 | Geen light-mode (toegankelijkheid + B2B context) | site is dark-only, accountancy/MKB verwacht licht | ✅ Opgelost in deze sessie — light/dark/system toggle in app-zijde |
| 3 | Pricing-tier waardes niet verifieerbaar | `docs/PRICING_BUNDLES.md` is untracked lokaal, prijzen hardcoded in component | Single source of truth: `lib/pricing.ts` met types + tests; UI rendert daaruit |

### P1 — Release-blockers (mag wel live, maar niet voor NL/MA/UAE launch)

| # | Finding | Voorstel-fix |
|---|---|---|
| 4 | Sub-brand naming drift ("Inclufy. AI MARKETING" vs "AMOS Autonomous Marketing OS" vs "Inclufy GO") | Brand-style-guide met canonical naming + 1× search-replace door alle pagina's |
| 5 | Geen i18n-routing (NL/FR/EN/AR) | Next.js i18n-routing met `[locale]` segment + automatische taal-detectie via `accept-language` |
| 6 | Geen marktdetectie (NL vs MA vs UAE) | Geo-IP via Vercel `headers().get('x-vercel-ip-country')` → currency + tier + lokalisatie |
| 7 | Geen sales-chatbot (hoge bounce zonder direct kanaal) | ✅ Opgelost in deze sessie — Claude Haiku-gestuurde widget met context-prompts |
| 8 | Pricing-pagina mist FAQ | FAQ-accordion met 8-12 veelgestelde vragen + JSON-LD schema voor SEO |
| 9 | Geen feature-vergelijkingstabel side-by-side | Sticky compare-tabel met "Meest populair"-highlight |
| 10 | Geen social proof / klantlogo's | Logo-strip + 2-3 case-study quote-cards + G2/Capterra rating-widget |
| 11 | "14 dagen proefperiode" niet gekoppeld aan Stripe-config | Stripe-trial config in `lib/billing.ts` + integration-test |
| 12 | Geen OG-images per route | Dynamic `opengraph-image.tsx` per route, gegenereerd via `next/og` |

### P2 — Polish

13. Brand-kleur paars in screenshot conflicteert met Tailwind primary oranje `#FF6B35`
14. Geen "Why Inclufy"-sectie boven de fold
15. Hero claim is generiek ("AI-Powered Marketing Platform") — geen branche-specifieke variants
16. Geen pricing-calculator voor enterprise (contact-flow ontbreekt)
17. Footer heeft geen sitemap, geen sociale kanalen, geen NRTO/CRKBO-badge
18. Cookies-consent zonder per-categorie toggle (alleen accept/reject)
19. Geen exit-intent overlay
20. Geen "vergelijk met concurrenten"-tabel (HubSpot, Mailchimp, ActiveCampaign)

### P3 — Nice-to-have

21. Geen pricing-page A/B framework
22. Geen heatmap / session-replay (Hotjar/Microsoft Clarity)
23. Geen referral-loop / partner-pagina

---

## State-of-the-art proposals — naar 2026 niveau

### A. AI-first website experience (USP voor Inclufy)

**Waarom**: Inclufy verkoopt AI. De website moet zelf het beste voorbeeld zijn van wat AI doet — anders is het cognitive dissonance.

| Feature | Wat | Tool / Aanpak | Waarom impact |
|---|---|---|---|
| **AI Sales Concierge** | ✅ Gestart deze sessie. Floating chat met productkennis + demo-booking. | Claude Haiku 4.5 + RAG over pricing/features docs | Conversie-uplift 30-40% volgens benchmarks (Drift, Intercom) |
| **AI Product Tour** | Personalized 60s walkthrough op basis van bedrijfsgrootte + branche | Form-questionnaire → dynamic video composition (Remotion) of geanimeerde slide-deck | "Show, don't tell" vs typische static demo-video |
| **AI Pricing Recommender** | "Beantwoord 3 vragen → pakket-advies + ROI-schatting" | Beslis-boom + Claude voor uitleg | Reduce cognitieve load, raise close-rate |
| **AI Content Generator demo** | Live demo embedded op homepage: "Genereer een LinkedIn-post voor jouw bedrijf" | API-call naar AMOS productie-endpoint met rate-limit | Direct value-demonstration < 30s |
| **Voice search / agent** | "Klik om te vragen" → Whisper STT + Claude → TTS antwoord | OpenAI Whisper + ElevenLabs of Claude voice mode | Frictie wegnemen voor mobile users |

### B. Conversie-architectuur (state of the art)

| Patroon | Implementatie | Tool |
|---|---|---|
| **Sticky comparison table** | Bij scroll over pricing-tiers blijft een compacte "Selecteer" rij sticky | Pure CSS `position: sticky` |
| **Exit-intent personalisatie** | Op exit-detect: "Wacht — hier is een vergelijking met HubSpot" of "Krijg 20% korting voor de eerste 100 klanten" | `mouseleave` listener + `<Dialog>` |
| **Social proof livestream** | "Sami uit Rotterdam heeft net AMOS Pro genomen" toast (anonieme data uit Stripe) | Webhook → Pusher / Ably broadcast |
| **Smart CTAs** | Eerste bezoek = "Probeer gratis"; tweede bezoek = "Plan demo"; derde = "Bel direct" | First-party cookie + segment.io of zelf-built |
| **Conversion-Aware Form** | Form-velden adapteren op basis van segment (MKB vs enterprise vs accountancy) | Stepper met conditionele logica |
| **Sticky bottom-bar mobile** | "Begin gratis →" altijd zichtbaar op mobile | Tailwind fixed bottom |

### C. Visual / UX next-gen patronen

| Patroon | Voorbeeld in 't wild | Voor Inclufy |
|---|---|---|
| **Bento-grid features** | apple.com, vercel.com, raycast.com | Vervang generieke 3-kolom feature-cards door bento-grid met onregelmatige sizes per impact |
| **Motion gradient hero** | linear.app, supabase.com | Inclufy oranje→paars→navy gradient als animated WebGL of CSS conic-gradient |
| **Real-time product preview** | figma.com (interactive embed) | Embed live AMOS-dashboard preview met fake data — direct "hands-on feel" |
| **Scroll-driven animation** | apple.com/airpods-pro, framer.com | Scroll-triggered reveal van module-icons (7 sub-brands die "in elkaar klikken") — vertelt het ecosysteem-verhaal |
| **3D product mockups** | spline.design exports, three.js | Geroteerd dashboard-mockup in hero, 60fps |
| **Cursor-aware glow** | linear.app | Hover effects op feature-cards met radial-gradient die cursor volgt |
| **Variable fonts** | github.com, vercel.com | 1 font-file (Inter Variable), schaalbaar wicht — 200kb saved |

### D. Performance & Tech (Core Web Vitals 2026)

| Doel | Metric | Aanpak |
|---|---|---|
| LCP < 1.8s | Hero-paint | Next.js 15 PPR (Partial Prerendering), `next/image` met AVIF |
| INP < 150ms | Interaction | React Server Components voor static delen, client-only voor chat/toggle |
| CLS < 0.05 | Layout-shift | Skeleton-loaders, `aspect-ratio` op alle `<img>` |
| TTFB < 200ms | Edge-render | Vercel Edge Functions of Cloudflare Workers voor i18n routing |
| Bundle size < 80kb | First load JS | Verwijder Lucide tree-shaking residue, lazy-load ChatWidget |

### E. Multi-locale architectuur (NL / FR / EN / AR)

```
app/
  [locale]/
    page.tsx
    pricing/page.tsx
    contact/page.tsx
  api/
    sales-chat/route.ts
middleware.ts                 # detect locale via Accept-Language + Geo-IP
i18n/
  nl.json, fr.json, en.json, ar.json
  pricing.nl.json (currency=EUR)
  pricing.ma.json (currency=MAD)
  pricing.ae.json (currency=AED)
```

- **AR-support**: `dir="rtl"` automatisch op `[locale=ar]`, Tailwind `rtl:` variants
- **Hreflang tags**: per pagina alle locale-varianten in `<head>`
- **Sitemap.xml**: dynamisch gegenereerd met alle locales

### F. SEO & Discoverability 2026

| Item | Status | Voorstel |
|---|---|---|
| `metadata` per route | basic | Volledige `generateMetadata()` per route met OG, Twitter, alternates |
| Structured data (JSON-LD) | ontbreekt | `Organization`, `SoftwareApplication`, `Product`, `FAQPage`, `BreadcrumbList` |
| Sitemap | ontbreekt | `app/sitemap.ts` (Next.js native) |
| Robots | ontbreekt | `app/robots.ts` met staging exclusion |
| OG-images | ontbreekt | `app/opengraph-image.tsx` per route, dynamic |
| AI-search optimization | n.v.t. | `llms.txt` toevoegen (nieuwe standaard) — Inclufy-context voor ChatGPT/Claude search |

### G. Privacy & Compliance (NL eerst, EU breed)

- AVG-compliant cookie-consent (per categorie, niet alleen all/none)
- DPA-link in footer
- ISO 27001 statement (in progress per memory)
- CRKBO/NRTO badges voor Academy-pagina (memory: voorwaardelijk lid #5361, NRTO keurmerk in mei 2026)
- Subprocessor-lijst openbaar
- DSAR-self-service form (recht op inzage / verwijdering)

### H. Analytics & Continuous Improvement

| Tool | Waarvoor | Cost |
|---|---|---|
| **Vercel Analytics** | Core Web Vitals real-user | included |
| **PostHog** | Product analytics, feature flags, A/B test, session replay | free tier |
| **Plausible** | Privacy-first traffic | €9/mnd |
| **Microsoft Clarity** | Heatmaps + session replay (gratis) | free |
| **Sentry** | Error tracking (al ingericht per recent commits) | already in use |

---

## Roadmap — 3 weken naar state-of-the-art

### Week 1 — Foundation (production-readiness)
- ✅ Light-mode infrastructure (deze sessie)
- ✅ Sales chatbot widget + API (deze sessie)
- ⏳ Gitlab-rebase + pricing-page refactor ($→€)
- ⏳ i18n-routing scaffold (`[locale]`)
- ⏳ Currency-formatter + market-detect
- ⏳ Sub-brand naming-audit + sweep
- ⏳ Sitemap + robots + OG-images
- ⏳ Structured data (JSON-LD) op pricing + homepage

### Week 2 — Conversion & Content
- Bento-grid features
- FAQ-accordion + schema
- Klantlogo-strip + case-studies
- Feature-vergelijkingstabel
- AI Pricing Recommender (3-vragen flow)
- Sticky CTA + smart variants per visit-count
- Footer-rewrite (legal + sociale kanalen + NRTO badge)

### Week 3 — Polish & Differentiator
- AI Product Tour (personalized 60s)
- Live AMOS dashboard-preview embed
- Scroll-driven storytelling (7 sub-brands)
- Motion gradient hero
- Cursor-aware feature cards
- Voice-input op chatbot
- Exit-intent personalisatie
- A/B test framework (PostHog feature flags)
- llms.txt voor AI-search

---

## Concurrentie-benchmark (waar staan we vs)

| Site | Waarom benchmark |
|---|---|
| **linear.app** | Goldstandard B2B SaaS marketing site — motion, gradient, performance |
| **vercel.com** | RSC + Edge + bento-grids — performance + dev-credibility |
| **supabase.com** | Open-source dev tone, donker hoofd-thema met perfect contrast |
| **resend.com** | Minimalistisch + AI-tooling integratie |
| **clay.com** | AI-first messaging, "Hire Claygent" als product-personificatie |
| **hubspot.com** | Inclufy's grootste concurrent — feature-vergelijkingstabel-blauwdruk |
| **mailchimp.com** | Pricing-tier presentatie + freemium-flow |
| **sleekflow.io** | WhatsApp Business + AI sales chatbot precedent (relevant voor MA/UAE markt) |

Inclufy mist op alle dimensies behalve "feature-rich" — maar dat communiceren we niet goed.

---

## Quick wins (kunnen vandaag al)

1. ✅ Light-mode toggle (gedaan)
2. ✅ Sales chatbot (gedaan)
3. **$→€** met simpele Intl.NumberFormat — 30 min
4. **Sub-brand naming sweep** — 1 search-replace, 30 min
5. **Footer-rewrite** met legal + sociale + NRTO — 1 uur
6. **`app/sitemap.ts` + `app/robots.ts`** — 1 uur
7. **OG-image generator** — 1 uur
8. **Klantlogo-strip** (5 logos) — 1 uur

Totaal day-1: 6 uur werk → score van 22/50 naar ~32/50.

---

## Wat NIET ondernemen (anti-voorstellen)

- **Geen pagina-rewrite vanaf scratch** — bestaande Next.js setup is solide; rebase + iterate
- **Geen full-CMS migratie** (Sanity/Contentful) tenzij content-team het echt nodig heeft — overhead niet waard
- **Geen WebGL hero zonder fallback** — Marokko/UAE hebben gemiddeld zwakker bandwidth
- **Geen excessive micro-interactions** — conversie kelders bij overload
- **Niet met OpenAI starten** — Inclufy ecosysteem gebruikt Anthropic Claude, consistency belangrijk

---

## Eindoordeel

De marketing-website is **functioneel, niet onderscheidend**. Met de drie weken-roadmap hierboven kunnen we het tot een conversie-machine maken die past bij de AI-first positionering.

**Aanbeveling**: Approve week 1 (~5 dagen werk) als productie-readiness gate. Week 2 + 3 plannen na launch en data-driven prioriteren via PostHog metrics.

**Volgende stap voor user**: bevestig of week 1 mag starten, en of `ANTHROPIC_API_KEY` als prod-env-var toegevoegd kan worden voor de chatbot.
