# Het Inclufy Ecosystem — Marketing Concept

> Van losse applicaties naar een geintegreerd AI-powered business platform voor Benelux MKB.
> Dit is het masterdocument voor het Inclufy ecosystem marketing concept.

---

## Inhoudsopgave

1. [Ecosystem Architectuur — Alle Applicaties](#1-ecosystem-architectuur)
2. [Merkarchitectuur & Naamgeving](#2-merkarchitectuur--naamgeving)
3. [De Vijf Pilaren van Inclufy](#3-de-vijf-pilaren-van-inclufy)
4. [Ecosystem Propositie](#4-ecosystem-propositie)
5. [Per-Pilaar Marketing Strategie](#5-per-pilaar-marketing-strategie)
6. [Ecosystem Flywheel & Cross-Sell Model](#6-ecosystem-flywheel--cross-sell-model)
7. [Pricing & Bundling Strategie](#7-pricing--bundling-strategie)
8. [Campagne Concepten](#8-campagne-concepten)
9. [Content & Social Strategie](#9-content--social-strategie)
10. [Go-to-Market Timeline](#10-go-to-market-timeline)
11. [Budget & KPIs](#11-budget--kpis)

---

## 1. Ecosystem Architectuur

### Alle Inclufy Applicaties — Compleet Overzicht

Het Inclufy ecosystem bestaat uit **7 kernproducten** verdeeld over **6 pilaren**, elk met web- en mobiele varianten:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        INCLUFY PLATFORM                                  │
│                   "AI-Powered Business Suite"                             │
│                                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │  AMOS   │ │ProjeXt- │ │ Finance │ │InclufAI │ │ Ignite  │          │
│  │Marketing│ │  Pal    │ │         │ │ Academy │ │Operations│          │
│  │         │ │Projects │ │         │ │         │ │         │          │
│  │Mobile+  │ │Mobile+  │ │Mobile+  │ │Mobile+  │ │  Web    │          │
│  │  Web    │ │  Web    │ │  Web    │ │ Backend │ │         │          │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘          │
│       │           │           │            │           │               │
│       ▼           ▼           ▼            ▼           ▼               │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │               Inclufy Hub — Centraal Dashboard                 │    │
│  │    KPIs · Rapportage · Alerts · AI-inzichten · Overzicht      │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │              IQ Helix — Unified Backend & API                  │    │
│  │     Authentication · Data · AI · Payments · Integrations      │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │              Gedeelde Infrastructuur                            │    │
│  │  Supabase · Sentry · Stripe · NL/EN/FR/AR · GDPR · SSO       │    │
│  └────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Applicatie Matrix

| App | Type | Platforms | Status | Primaire Gebruiker |
|---|---|---|---|---|
| **AMOS (InclufyGO)** | Event Marketing & Content | iOS, Android, Web | Live | Marketing Manager |
| **AMOS Web** | Marketing Dashboard | Web (Next.js) | Live | Marketing Team Lead |
| **ProjeXtPal** | Project Management | iOS, Android | Live | Project Manager |
| **ProjeXtPal Web** | Project Dashboard | Web (Vite/React) | Live | Project Director |
| **Inclufy Finance** | Financieel Beheer | iOS, Android, Web | Live | CFO / Controller |
| **InclufAI** | AI ERP & Academy | Mobile + Backend | Live | Operations / HR / Training |
| **Inclufy Ignite** | Procurement, Sales, Warehousing, Manufacturing & Logistics | Web | Live | Operations / Supply Chain / COO |
| **IQ Helix** | Unified Backend | API (FastAPI) | Live | — (Backend) |

### Technologie Stack (Gedeeld)

| Laag | Technologie |
|---|---|
| **Mobile** | React Native (Expo SDK 55), TypeScript |
| **Web Frontend** | Next.js 14 / Vite + React 18, Tailwind CSS, shadcn-ui |
| **Backend** | FastAPI (Python), SQLAlchemy, PostgreSQL, Redis |
| **Cloud** | Supabase (Auth, DB, Storage), AWS EU |
| **Payments** | Stripe |
| **AI** | Anthropic Claude API |
| **Monitoring** | Sentry |
| **i18n** | Nederlands, Engels, Frans |
| **Compliance** | GDPR, MFA/TOTP, CSRF, Rate Limiting, Audit Logging |

---

## 2. Merkarchitectuur & Naamgeving

### Het Probleem met Losse Namen

Momenteel heeft elk product een eigen identiteit. Voor de markt is dit verwarrend:
- "AMOS" klinkt niet als Inclufy
- "IQ Helix" zegt niets over de functie
- "InclufAI" lijkt op een typo

### Voorgestelde Merkarchitectuur: "Inclufy + Descriptor"

Gebaseerd op het Atlassian-model ("Jira", "Confluence", "Trello" — allemaal onder Atlassian) en het HubSpot-model ("Marketing Hub", "Sales Hub" — allemaal onder HubSpot):

| Huidige Naam | Ecosystem Naam | Korte Naam | Tagline |
|---|---|---|---|
| AMOS / InclufyGO | **Inclufy Marketing** | Marketing | "Elk event, een merk-moment" |
| ProjeXtPal | **Inclufy Projects** | Projects | "Projecten met beeld en overzicht" |
| Inclufy Finance | **Inclufy Finance** | Finance | "AI-powered financieel beheer" |
| InclufAI | **Inclufy Academy** | Academy | "Leer, groei, certificeer" |
| Inclufy Ignite | **Inclufy Operations** | Operations | "Procurement, sales, warehouse, manufacturing & logistics" |
| — | **Inclufy Hub** | Hub | "Je bedrijf in een dashboard" (cross-pilaar dashboard) |
| IQ Helix | **Inclufy Connect** | Connect | (Intern — de integratie-laag) |

### Visuele Hiërarchie

```
                       INCLUFY
                    ┌────┴────┐
               Het merk    Het platform
                    │
    ┌────────┬──────┴──┬────────┬──────────┬────────┐
    │        │         │        │          │        │
Marketing Projects  Finance Academy  Operations  Hub
  (AMOS)  (ProjeXtPal)       (InclufAI) (Ignite)  (Dashboard)
```

**Regel:** Elk product wordt extern gecommuniceerd als "Inclufy [Descriptor]". De interne/technische namen (AMOS, ProjeXtPal, IQ Helix) blijven bestaan in code en app stores maar worden in marketing altijd vergezeld door het Inclufy-merk.

### Kleurcodering per Pilaar

| Pilaar | Kleur | Hex | Rationale |
|---|---|---|---|
| **Marketing** | Oranje | #FF6B35 | Energie, creativiteit, events |
| **Projects** | Blauw | #2196F3 | Vertrouwen, structuur, bouw |
| **Finance** | Groen | #4CAF50 | Groei, geld, stabiliteit |
| **Academy** | Paars | #9C27B0 | Kennis, innovatie, AI |
| **Operations** | Rood-oranje | #E65100 | Actie, supply chain, productie |
| **Hub** | Donkergrijs | #37474F | Autoriteit, overzicht, C-suite |
| **Inclufy (merk)** | Primair blauw | #1A237E | Vertrouwen, technologie |

---

## 3. De Vijf Pilaren van Inclufy

### Pilaar 1: Inclufy Marketing (AMOS)

**Wat het doet:**
- Branded foto's en video's maken op events
- NFC-contactkaarten scannen en opslaan
- Campagnes beheren en plannen
- AI Copilot voor content suggesties
- Event kalender met herinneringen
- Cloud fotobibliotheek met sync

**Voor wie:** Marketing managers, event organizers, brand managers

**Uniek:** De enige app die event-networking (NFC) combineert met branded content creation en campagne-management in een mobiel-eerst platform.

**Ecosystem connecties:**
- Marketing > **Projects**: Eventfoto's delen als projectdocumentatie
- Marketing > **Finance**: Event-ROI direct koppelen aan budgetten
- Marketing > **Academy**: Marketing trainingen en certificeringen
- Marketing > **Hub**: Marketing KPIs in het centrale dashboard

---

### Pilaar 2: Inclufy Projects (ProjeXtPal)

**Wat het doet:**
- Projecten beheren met foto-documentatie
- Taken toewijzen en opvolgen
- Real-time samenwerken met het team
- Documenten delen en annoteren
- Offline werken op de bouwplaats

**Voor wie:** Projectleiders, bouwteams, installateurs, facility managers

**Uniek:** Foto-eerst projectbeheer met native NL/FR ondersteuning, gebouwd voor teams die buiten werken — niet achter een bureau.

**Ecosystem connecties:**
- Projects > **Marketing**: Projectresultaten als branded content publiceren
- Projects > **Finance**: Projectkosten en uren realtime doorboeken
- Projects > **Academy**: Veiligheidstrainingen en certificeringen per project
- Projects > **Hub**: Projectstatus en -voortgang in het overzichtsdashboard

---

### Pilaar 3: Inclufy Finance

**Wat het doet:**
- AI-powered procurement (inkoopportaal)
- Slimme sales forecasting
- ROI en kostenbesparingscalculator
- Governance en goedkeuringsworkflows
- Real-time financieel dashboard
- Invoice management

**Voor wie:** CFOs, controllers, procurement managers, financieel directeuren

**Uniek:** Het enige mid-market ERP met native AI voor procurement en forecasting, gebouwd voor Benelux bedrijven met NL/FR/EN ondersteuning.

**Ecosystem connecties:**
- Finance > **Marketing**: Marketing-ROI per campagne en event meten
- Finance > **Projects**: Projectbudgetten en werkelijke kosten vergelijken
- Finance > **Academy**: Training-ROI berekenen, compliance tracking
- Finance > **Hub**: Financiele KPIs en cashflow in het centrale dashboard

---

### Pilaar 4: Inclufy Academy (InclufAI)

**Wat het doet:**
- Cursussen en lessen aanmaken en volgen
- Quizzen en examens afnemen
- Certificaten genereren
- Vaardigheden tracken per medewerker
- Meerdere rollen: docent, student, admin
- AI-ondersteunde leerpaden

**Voor wie:** HR managers, trainingscoordinatoren, operationeel managers, medewerkers

**Uniek:** Geintegreerd leerplatform dat direct gekoppeld is aan de andere Inclufy-pilaren — leer over de tools die je dagelijks gebruikt.

**Ecosystem connecties:**
- Academy > **Marketing**: Marketing-trainingen (branding, event management, social media)
- Academy > **Projects**: Veiligheids- en kwaliteitscertificeringen voor veldteams
- Academy > **Finance**: Financiele compliance trainingen, procurement procedures
- Academy > **Hub**: Training-voortgang en certificeringsstatus in het dashboard

---

### Pilaar 5: Inclufy Operations (Ignite)

**Wat het doet:**
- **Procurement:** Volledig inkoopproces — van aanvraag tot betaling, leveranciersbeheer, RFQ's
- **Sales:** Verkoopbeheer, offertes, orderverwerking, klantbeheer, pipeline tracking
- **Warehousing:** Voorraadbeheer, magazijnlocaties, in/uit-boekingen, voorraadoptimalisatie
- **Manufacturing:** Productieplanning, stuklijsten (BOM), werkorders, capaciteitsplanning
- **Logistics:** Verzendbeheer, routeplanning, tracking, leveringsbevestiging

**Voor wie:** Operations managers, supply chain directors, COOs, productiemanagers, inkoopmanagers, warehouse managers

**Uniek:** Het enige geintegreerde operations platform dat procurement, sales, warehouse, manufacturing en logistics combineert met AI — gebouwd voor Benelux en MENA bedrijven.

**Ecosystem connecties:**
- Operations > **Finance**: Inkoopkosten, sales revenue, voorraadwaarde direct in financiele rapportage
- Operations > **Projects**: Materiaalinkoop per project, leveringen koppelen aan projectfases
- Operations > **Marketing**: Sales pipeline data voor marketing-ROI, campagne-to-deal tracking
- Operations > **Academy**: Supply chain trainingen, warehouse safety certificeringen
- Operations > **Hub**: Operations KPIs (voorraadniveaus, leverbetrouwbaarheid, productie-output) in het dashboard

---

### Pilaar 6: Inclufy Hub (Cross-Pilaar Dashboard)

**Wat het doet:**
- Centraal dashboard voor alle Inclufy-pilaren
- Real-time KPIs uit Marketing, Projects, Finance, Academy en Operations
- AI-gestuurde alerts en inzichten
- Cross-pilaar rapportages en exports (PDF/Excel)
- Organisatie-breed gebruikersbeheer
- Donker/licht thema

**Voor wie:** CEOs, COOs, directieteams, board members

**Uniek:** Het enige dashboard dat marketing, projecten, finance, operations en training combineert in een overzicht — het "single pane of glass" voor groeiende bedrijven.

**Ecosystem connecties:**
- Hub is het **verbindende element** dat alle pilaren samenbrengt in een overzicht
- Unified login (SSO) voor alle Inclufy-apps
- Cross-pilaar rapportages en KPIs
- AI-inzichten: "Project X overschrijdt budget met 15%", "Voorraad artikel Y bijna op"

---

## 4. Ecosystem Propositie

### Het Kernprobleem

**Groeiende Benelux bedrijven (50-500 FTE) lijden aan "Tool Sprawl":**

| Afdeling | Huidige situatie | Kosten (geschat) | Problemen |
|---|---|---|---|
| Marketing | Canva + Mailchimp + Eventbrite + losse tools | EUR 200-500/mo | Geen projectkoppeling, geen ROI-inzicht |
| Projecten | WhatsApp + Excel + Monday/Trello | EUR 100-400/mo | Foto's kwijt, geen documentatie, geen budget-link |
| Finance | Exact Online + Excel + losse tools | EUR 300-1,500/mo | Geen AI, handmatig, geen operationeel inzicht |
| Training | Losse e-learning + Word docs | EUR 100-300/mo | Geen koppeling met compliance of projecten |
| Management | Losse dashboards + Excel + vergaderingen | EUR 0 (maar 10+ uur/week) | Geen centraal overzicht, te laat inzicht |
| **Totaal** | **8-15 losse tools** | **EUR 700-3,200/mo** | **Geen verbinding, data silo's, dubbel werk** |

### De Inclufy Oplossing

**Inclufy is het AI-powered business platform dat marketing, projecten, finance, training en management verbindt voor Benelux bedrijven.**

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│    "Van 15 losse tools naar 1 platform"                 │
│                                                          │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│    │Marketing │  │ Projects │  │ Finance  │            │
│    │Events    │  │Foto-docs │  │AI Inkoop │            │
│    │Content   │  │Taken     │  │Forecast  │            │
│    │Campaigns │  │Team      │  │Governance│            │
│    └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│         │              │              │                   │
│         └──────┐  ┌────┘   ┌──────────┘                  │
│                ▼  ▼        ▼                              │
│         ┌──────────────────────┐                         │
│         │    Inclufy Hub       │                         │
│         │  Centraal Dashboard  │                         │
│         └──────────┬───────────┘                         │
│                    │                                      │
│              ┌─────┴─────┐                               │
│              │  Academy  │                               │
│              │ Training  │                               │
│              │Certificeer│                               │
│              └───────────┘                               │
│                                                          │
│    Powered by: AI · NL/EN/FR · GDPR · Mobile-first     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Waardepropositie per Stakeholder

| Stakeholder | Pijn | Inclufy Belofte | Bewijs |
|---|---|---|---|
| **CEO / COO** | "Ik heb geen totaaloverzicht over mijn bedrijf" | Inclufy Hub: alle KPIs in een dashboard | Bespaar 10+ uur/week aan rapportage-vergaderingen |
| **Marketing Manager** | "Ik besteed meer tijd aan tools dan aan strategie" | Inclufy Marketing: van event tot campagne in 1 app | 80% sneller branded content produceren |
| **Project Manager** | "Mijn projectfoto's zitten verspreid over 5 WhatsApp-groepen" | Inclufy Projects: gestructureerd foto-projectbeheer | Nul foto's kwijt, 100% gedocumenteerd |
| **CFO** | "Forecasting kost me 3 dagen per maand in Excel" | Inclufy Finance: AI-powered forecasting en procurement | Van 3 dagen naar 3 uur met AI |
| **HR / Training** | "Ik weet niet wie welke certificering heeft" | Inclufy Academy: leren + certificeren + tracken | Altijd actueel certificeringsoverzicht |
| **IT Manager** | "We beheren 15 tools met 15 logins" | Inclufy Connect: SSO, unified API, GDPR-compliant | 1 leverancier, 1 factuur, 1 support |

### De Drie Kernboodschappen

**1. "Een Platform"**
> Stop met jongleren tussen 15 tools. Inclufy brengt marketing, projecten, finance, training en management samen op een platform.

**2. "AI-Powered"**
> Inclufy is niet zomaar software. AI helpt je met content suggesties, slimme inkoop, forecasting en gepersonaliseerde leerpaden.

**3. "Gebouwd voor Benelux"**
> Nederlands, Frans, Engels. GDPR-compliant. Lokale support. Gebouwd voor hoe Benelux bedrijven werken — op de bouwplaats, op events, en op kantoor.

---

## 5. Per-Pilaar Marketing Strategie

### Pilaar 1: Inclufy Marketing (AMOS)

| Element | Detail |
|---|---|
| **Positionering** | "Het event marketing platform dat branded content en leads levert" |
| **Primaire ICP** | Marketing managers bij B2B bedrijven, 50-500 FTE |
| **Concurrenten** | Bizzabo (EUR 17,999+/jr), Whova (EUR 1,499+/event), Canva (geen events) |
| **Prijs** | EUR 49-199/mo |
| **Kanalen** | LinkedIn Ads, event sponsorships, Instagram, ASO |
| **Key content** | Event ROI gids, branded content templates, case studies |
| **Launch hook** | Live demo op NIMA Marketing Day of EventSummit |
| **ASO keywords** | event marketing, branded content, NFC networking, contact scanner |
| **Success metric** | 100 actieve marketing teams (Q4 2026) |

**Top 3 campagne-ideeen:**
1. **"10 Seconden"** — Video: van NFC-scan tot branded foto in 10 seconden
2. **"Event ROI Calculator"** — Interactieve tool op inclufy.com/marketing
3. **"De Marketing Manager Challenge"** — LinkedIn serie: 1 event, 1 app, 1 week resultaten

---

### Pilaar 2: Inclufy Projects (ProjeXtPal)

| Element | Detail |
|---|---|
| **Positionering** | "Projectbeheer met foto's — gebouwd voor teams die buiten werken" |
| **Primaire ICP** | Projectleiders bij bouw/installatie/facility, 10-200 FTE |
| **Concurrenten** | Fieldwire (EUR 39/user/mo), Procore (EUR 667+/mo), Monday.com (geen veld) |
| **Prijs** | EUR 29-99/mo |
| **Kanalen** | Google Search, Bouwbeurs, LinkedIn, YouTube, WhatsApp viral |
| **Key content** | Digitaal bouwdossier gids, oplevering checklist, foto-documentatie best practices |
| **Launch hook** | Demo op Building Holland of Bouwbeurs |
| **ASO keywords** | project management bouw, bouwdossier app, foto documentatie, oplevering |
| **Success metric** | 50 actieve bouwteams (Q4 2026) |

**Top 3 campagne-ideeen:**
1. **"WhatsApp vs. ProjeXtPal"** — Split-screen video: chaos vs. structuur
2. **"Het Digitale Bouwdossier"** — Whitepaper + webinar serie (Dutch SEO play)
3. **"Bouwplaats Challenge"** — 1 aannemer, 1 project, 1 maand ProjeXtPal — video documentary

---

### Pilaar 3: Inclufy Finance

| Element | Detail |
|---|---|
| **Positionering** | "AI-powered financieel beheer voor groeiende Benelux bedrijven" |
| **Primaire ICP** | CFOs en controllers bij mid-market, 50-500 FTE |
| **Concurrenten** | Exact Online (geen AI), SAP Business One (te duur), Odoo (te complex) |
| **Prijs** | EUR 499-2,500/mo |
| **Kanalen** | CFO roundtables, outbound SDR, LinkedIn thought leadership, partner channel |
| **Key content** | "AI ERP Gids", procurement automation whitepaper, ROI calculator |
| **Launch hook** | Exclusief CFO diner + demo in Amsterdam |
| **Success metric** | 15 betalende mid-market klanten (Q4 2026) |

**Top 3 campagne-ideeen:**
1. **"De Spreadsheet is Dood"** — Provocatieve LinkedIn-serie over AI vs. handmatig
2. **"CFO Roundtable: AI in Finance"** — Exclusieve diners in Amsterdam, Rotterdam, Brussel
3. **"90 Dagen naar AI Procurement"** — Implementatie-programma als marketing-aanbod

---

### Pilaar 4: Inclufy Academy (InclufAI)

| Element | Detail |
|---|---|
| **Positionering** | "Het leerplatform dat direct gekoppeld is aan je bedrijfsprocessen" |
| **Primaire ICP** | HR managers, trainingscoordinatoren, compliance officers |
| **Concurrenten** | Studytube (NL), GoodHabitz (generiek), eigen LMS systemen |
| **Prijs** | EUR 99-499/mo (of gratis bij Business/Enterprise bundle) |
| **Kanalen** | LinkedIn, HR events, CHRO/HR Director outreach, content marketing |
| **Key content** | "Compliance training automatiseren", certificering templates, ROI van training |
| **Launch hook** | Gratis pilot voor bestaande Inclufy klanten |
| **Success metric** | 500 actieve gebruikers in Academy (Q4 2026) |

**Top 3 campagne-ideeen:**
1. **"Ken Jij Je Certificeringen?"** — Assessment tool: is je team compliant?
2. **"Van Onboarding tot Expert"** — Case study: hoe een bouwbedrijf training digitaliseerde
3. **"Academy + Projects"** — Bundel: veiligheidstraining gekoppeld aan projecttoegang

---

### Pilaar 5: Inclufy Hub (Ignite)

| Element | Detail |
|---|---|
| **Positionering** | "Je hele bedrijf in een dashboard" |
| **Primaire ICP** | CEOs, COOs, directieteams bij MKB 50-500 FTE |
| **Concurrenten** | Custom dashboards, Power BI, Databox, losse rapportages |
| **Prijs** | Inbegrepen bij Business/Enterprise bundle |
| **Kanalen** | C-suite events, CEO/COO outreach, partner channel, LinkedIn |
| **Key content** | "De CEO Dashboard Gids", bedrijfsoverzicht templates |
| **Launch hook** | Gratis als verbindend element voor bedrijven die 2+ apps gebruiken |
| **Success metric** | 30 bedrijven met actief Hub dashboard (Q4 2026) |

**Top 3 campagne-ideeen:**
1. **"Maandagmorgen Overzicht"** — LinkedIn post serie: "Dit is wat een CEO ziet in Inclufy Hub"
2. **"Van Vergadering naar Dashboard"** — ROI: bespaar 10 uur/week aan status-vergaderingen
3. **"Hub Gratis bij 2 Apps"** — Cross-sell incentive: koop 2 pilaren, krijg Hub gratis

---

## 6. Ecosystem Flywheel & Cross-Sell Model

### Het Inclufy Flywheel

```
                    ┌─────────────┐
                    │   ATTRACT   │
                    │ 1 app gratis│
                    │   proberen  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   ACTIVATE  │
                    │  Eerste     │
                    │  succes     │
                    │  bereiken   │
                    └──────┬──────┘
                           │
              ┌────────────▼────────────┐
              │        EXPAND           │
              │ 2e pilaar ontdekken     │
              │ via in-app suggesties   │
              │ + ecosystem korting     │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │       INTEGRATE         │
              │  Hub activeert          │
              │  Alles verbonden        │
              │  Switching costs stijgen│
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │       ADVOCATE          │
              │  Klant verwijst         │
              │  andere bedrijven       │
              │  Case study materiaal   │
              └─────────────────────────┘
```

### Cross-Sell Matrix

Elk kruispunt beschrijft het natuurlijke pad van de ene pilaar naar de andere:

| Van ↓ / Naar → | Marketing | Projects | Finance | Academy | Hub |
|---|---|---|---|---|---|
| **Marketing** | — | "Deel eventfoto's als projectdoc" | "Koppel event-spend aan ROI" | "Marketing trainingen" | "Marketing KPIs" |
| **Projects** | "Publiceer resultaten als content" | — | "Projectkosten realtime" | "Veiligheids-certificering" | "Project dashboards" |
| **Finance** | "Meet marketing-ROI" | "Budget per project" | — | "Finance compliance training" | "Financiele KPIs" |
| **Academy** | "Marketing skills" | "Veldwerk training" | "Procurement opleiding" | — | "Training overzicht" |
| **Hub** | "Marketing analytics" | "Project overview" | "Finance dashboard" | "Certificering status" | — |

### Trigger-Based Cross-Sell Automatie

| Trigger | Van | Naar | Actie | Timing |
|---|---|---|---|---|
| Gebruiker maakt 5e event in AMOS | Marketing | Projects | In-app: "Beheer je event-projecten in ProjeXtPal" | Na 1 maand |
| Team uploadt 50e projectfoto | Projects | Marketing | Email: "Maak branded content van je projectresultaten" | Na 6 weken |
| Gebruiker bekijkt budget-tab in Projects | Projects | Finance | In-app: "Volledige financiele controle met Inclufy Finance" | Real-time |
| Bedrijf heeft 10+ gebruikers | Elke app | Academy | Customer Success: "Train je team met Inclufy Academy" | Na 2 maanden |
| Bedrijf gebruikt 2 pilaren | 2 pilaren | Hub | Email: "Ontgrendel je Inclufy Hub — gratis bij 2+ apps" | Na activatie 2e app |
| Bedrijf gebruikt 3+ pilaren | 3 pilaren | Enterprise | Account Manager: "Upgrade naar Inclufy Enterprise" | Na 3 maanden |

### Verwachte Cross-Sell Funnel

```
1000 gratis trial starts
  └─> 200 betaalde single-app klanten (20% conversie)
        └─> 40 bedrijven met 2 apps (20% cross-sell in 6 mnd)
              └─> 12 bedrijven met 3+ apps (30% van 2-app klanten)
                    └─> 4 enterprise deals (33% van 3+ app klanten)
```

---

## 7. Pricing & Bundling Strategie

### Pricing per Pilaar (Standalone)

| Pilaar | Starter | Pro | Business |
|---|---|---|---|
| **Marketing** (AMOS) | EUR 0 (5 events) | EUR 49/mo | EUR 149/mo |
| **Projects** (ProjeXtPal) | EUR 0 (3 projecten) | EUR 29/mo | EUR 79/mo |
| **Finance** | — | EUR 499/mo | EUR 1,499/mo |
| **Academy** | EUR 0 (10 cursussen) | EUR 99/mo | EUR 299/mo |
| **Hub** | — | — | Gratis bij 2+ apps |

### Ecosystem Bundles

| Bundle | Inclusief | Prijs | vs. Los | Target |
|---|---|---|---|---|
| **Inclufy Starter** | 1 app naar keuze (Pro) | EUR 29-499/mo | — | Starters, 1 afdeling |
| **Inclufy Growth** | 2 apps naar keuze (Pro) + Hub | EUR 199/mo | Bespaar 20-30% | Groeiend MKB (10-50 FTE) |
| **Inclufy Business** | Alle 5 pilaren (Business) + Hub | EUR 599/mo | Bespaar 40%+ | Mid-market (50-200 FTE) |
| **Inclufy Enterprise** | Alles + custom + dedicated support + SLA | Op aanvraag | — | 200+ FTE |

### Pricing Psychologie (Geinspireerd op Microsoft 365 / Atlassian)

1. **Freemium als groeihefboom** — Elke pilaar heeft een gratis tier. Dit verlaagt de drempel en creëert product-ervaring voor de gebruiker begint te betalen.

2. **Bundle korting als cross-sell incentive** — 20-40% korting bij 2+ apps maakt het irrationeel om losse tools te kopen.

3. **Hub als "gratis" verbinder** — Hub is gratis bij 2+ apps, maar is het product dat de meeste waarde ontsluit. Dit stimuleert multi-app adoptie.

4. **Academy als retentie-instrument** — Hoe meer certificeringen een team haalt, hoe hoger de switching costs.

5. **Enterprise als "land and expand" eindpunt** — Begin met 1 app bij 1 afdeling, groei naar het volledige platform.

---

## 8. Campagne Concepten

### Mastercampagne: "Eén Team. Eén Platform."

**Concept:** Een doorlopende merkcampagne die het Inclufy ecosystem positioneert als het alternatief voor tool-chaos bij groeiende Benelux bedrijven.

**Kernvisual:** Vijf gekleurde verbonden cirkels (de 5 pilaren) die samen een "I" vormen (Inclufy logo). Elke cirkel kan los leven maar is sterker samen.

**Hero video (90 seconden):**

```
[Scene 1 — 0:00-0:15] "Het Probleem"
Marketing manager: opent Canva, Mailchimp, Eventbrite, 3 browsers
Project manager: scrolt door 200 WhatsApp-berichten, zoekt een foto
CFO: kopieert getallen van Excel naar Excel, zucht

[Scene 2 — 0:15-0:45] "De Verandering"
Dezelfde personen openen Inclufy op hun laptop/telefoon
Marketing: branded event foto in 10 seconden (AMOS)
Project: foto-timeline van project, alles op een plek (ProjeXtPal)
CFO: AI-dashboard met forecast, 1 klik (Finance)

[Scene 3 — 0:45-1:10] "Het Ecosystem"
CEO opent Inclufy Hub: ziet marketing KPIs, projectstatus, financiele
overzichten, training-voortgang — allemaal in een dashboard
"Wanneer heb ik voor het laatst een statusvergadering nodig gehad?"

[Scene 4 — 1:10-1:30] "De Uitnodiging"
Logo + tagline: "Inclufy — Een team. Een platform."
CTA: "Start gratis met 1 app. Groei naar het volledige ecosystem."
URL: inclufy.com/platform
```

**Taalversies:** NL (primair), EN, FR

---

### Campagne A: "Tool Audit" — Awareness

**Doel:** 500 bedrijven laten nadenken over hun tool-situatie

**Concept:** Interactieve "Tool Audit" op inclufy.com — bedrijven vullen in welke tools ze gebruiken per afdeling. Inclufy berekent:
- Geschatte maandkosten
- Aantal data-silo's
- Geschatte uren verloren aan dubbel werk
- Inclufy alternatief met besparingscalculatie

**Kanalen:**
| Kanaal | Budget | Tactiek |
|---|---|---|
| LinkedIn Ads | EUR 3,000 | Lead Gen Form: "Hoeveel tools gebruikt jouw bedrijf?" |
| Google Ads | EUR 1,500 | Search: "bedrijfssoftware vergelijken", "tool consolidatie" |
| Email blast | EUR 0 | Naar bestaande lijst: "Doe de Tool Audit" |
| PR | EUR 500 | Persbericht: "Benelux MKB besteedt EUR 3,000+/mo aan losse tools" |

**KPIs:** 500 audit completions, 100 qualified leads, 30 demo requests

---

### Campagne B: "5 Pilaren in 5 Weken" — Education

**Doel:** Elke pilaar individueel positioneren en tegelijk het ecosystem-verhaal vertellen

**Concept:** Vijf weken lang staat elke week een pilaar centraal. Elke week:
- LinkedIn deep-dive post (organic)
- Korte demo video (60s)
- Blog post met use case
- LinkedIn Ad targeting de ICP van die pilaar

| Week | Pilaar | Thema | ICP Target |
|---|---|---|---|
| Week 1 | Hub | "Waarom je CEO een dashboard nodig heeft" | CEOs, COOs |
| Week 2 | Marketing | "Elk event is een kans — maar alleen als je hem pakt" | Marketing Managers |
| Week 3 | Projects | "Je bouwplaats verdient beter dan WhatsApp" | Project Managers |
| Week 4 | Finance | "AI maakt je CFO 10x sneller" | CFOs, Controllers |
| Week 5 | Academy | "Train je team op de tools die ze dagelijks gebruiken" | HR Managers |
| Bonus | Ecosystem | "5 pilaren. 1 platform. Jouw bedrijf." | C-Suite, alle ICPs |

**Budget:** EUR 5,000 (EUR 800/week ads + EUR 1,000 content productie)

**KPIs:** 50K LinkedIn impressions, 500 website visits per week, 75 total leads

---

### Campagne C: "De Inclufy Pilot" — Conversion

**Doel:** 20 bedrijven laten starten met een gratis 90-dagen pilot van het volledige ecosystem

**Concept:** Selecteer 20 Benelux MKB bedrijven (50-200 FTE) voor een gratis ecosystem pilot:
- Volledige toegang tot alle 5 pilaren gedurende 90 dagen
- Dedicated onboarding sessie (2 uur)
- Maandelijkse check-in met customer success
- In ruil: case study + testimonial + feedback

**Selectiecriteria:**
- 50-200 FTE
- Minimaal 3 afdelingen (marketing/sales + projecten + finance)
- Bereid tot case study deelname
- Gevestigd in NL of BE

**Kanalen:**
| Kanaal | Tactiek |
|---|---|
| LinkedIn outreach | Gepersonaliseerde InMails naar CEOs/COOs van target bedrijven |
| Event recruitment | Pitch op SaaS Summit Benelux en sector-events |
| Partner referrals | Accountants en consultants verwijzen klanten door |
| Bestaande klanten | Single-app klanten uitnodigen voor ecosystem upgrade pilot |

**Budget:** EUR 3,000 (onboarding tijd + events)

**KPIs:** 20 pilot-starts, 12 converteren naar betaald (60%), 8 case studies

---

### Campagne D: "Inclufy Impact Awards" — Community & PR

**Doel:** Inclufy positioneren als thought leader en community bouwen

**Concept:** Jaarlijkse "Inclufy Impact Awards" voor Benelux bedrijven die digitale transformatie het beste aanpakken:

**Categorieen:**
- Beste Event Marketing Innovatie (Marketing pilaar)
- Beste Digitale Projectdocumentatie (Projects pilaar)
- Beste AI-toepassing in Finance (Finance pilaar)
- Beste Digitale Leeromgeving (Academy pilaar)
- Beste Geintegreerd Bedrijfsplatform (Ecosystem prijs)

**Timeline:**
- September: Nominaties openen
- Oktober: Jury selectie (inclusief bekende Benelux tech/business namen)
- November: Uitreiking op een Inclufy-evenement in Amsterdam

**Budget:** EUR 5,000 (event + PR + awards)

**KPIs:** 50+ nominaties, 5+ media-publicaties, 200+ event attendees, merkbekendheid lift

---

## 9. Content & Social Strategie

### Content Pilaren (Ecosystem Level)

| Pilaar | Thema | Frequentie | Formaat |
|---|---|---|---|
| **Platform verhaal** | Waarom 1 platform beter is dan 15 tools | 2x/maand | LinkedIn post, blog |
| **Product spotlight** | Deep-dive per Inclufy pilaar | 1x/week (roterend) | Video (60s), blog, carousel |
| **Klant verhalen** | Case studies en testimonials | 1x/maand | Video, blog, LinkedIn post |
| **Thought leadership** | AI in business, digitale transformatie Benelux | 2x/maand | Whitepaper, LinkedIn, podcast |
| **Behind the scenes** | Product development, team, cultuur | 1x/week | LinkedIn, Instagram |

### Social Media Plan

| Platform | Rol | Frequentie | Content Type |
|---|---|---|---|
| **LinkedIn** | Primair kanaal — B2B leads + thought leadership | 5x/week | Carousels, video, text posts, articles |
| **Instagram** | Visueel — events, product screenshots, team | 3x/week | Reels, Stories, Posts |
| **YouTube** | Demo's, tutorials, webinars | 2x/maand | Product demo's (2-5 min), webinar replays |
| **X (Twitter)** | Tech community, snelle updates | 3x/week | Product updates, thread over AI/tech |
| **TikTok** | Bereik jongere PMs en marketeers | 1x/week | Korte, informal product tips |

### LinkedIn Content Kalender (Maand Template)

| Week | Maandag | Woensdag | Vrijdag |
|---|---|---|---|
| **W1** | Platform verhaal (ecosystem post) | Product spotlight: Marketing (AMOS video) | Behind the scenes (team/cultuur) |
| **W2** | Thought leadership (AI in business) | Product spotlight: Projects (case study) | Klant testimonial |
| **W3** | Platform verhaal (vergelijking tools) | Product spotlight: Finance (demo video) | Behind the scenes (dev update) |
| **W4** | Thought leadership (Benelux digital) | Product spotlight: Academy (tutorial) | Maand-samenvatting + CTA |

### SEO Strategie

**Nederlandse zoekwoorden (hoog volume, lage concurrentie):**

| Cluster | Keywords | Target Pilaar |
|---|---|---|
| Event marketing | event marketing app, branded content maken, NFC contact scannen | Marketing |
| Bouw digitalisering | digitaal bouwdossier, project foto documentatie, oplevering app | Projects |
| AI ERP | AI boekhouding, slimme inkoop software, forecast tool MKB | Finance |
| Bedrijfstraining | online training platform MKB, certificering software, LMS Nederland | Academy |
| Tool consolidatie | bedrijfssoftware vergelijken, tool audit, platform vs losse tools | Ecosystem |

**Content productie doel:** 4 SEO-blogs per maand (NL), 1 per maand (EN), 1 per maand (FR)

---

## 10. Go-to-Market Timeline

### Fase 0: Voorbereiding — April 2026

| Actie | Eigenaar | Deadline |
|---|---|---|
| Merkarchitectuur finaliseren (namen, kleuren, logo-varianten) | Design | W1 |
| inclufy.com/platform landing page bouwen | Dev + Design | W2 |
| Per-pilaar landing pages (/marketing, /projects, /finance, /academy, /hub) | Dev | W3 |
| Hero video produceren (90s ecosystem + 5x 30s per pilaar) | Marketing + Video | W3 |
| App Store listings updaten met ecosystem branding (NL/EN/FR) | Marketing | W2 |
| LinkedIn company page rebrand + eerste 10 posts schedulen | Marketing | W2 |
| CRM opzetten (lead scoring, cross-sell automatie) | Sales + Dev | W3 |
| Tool Audit calculator bouwen op inclufy.com | Dev | W4 |
| PR-kit en perslijst samenstellen | Marketing | W4 |
| SDR prospect lijst bouwen (500 MKB decision-makers) | Sales | W4 |

### Fase 1: Soft Launch — Mei 2026

| Week | Activiteit | Budget |
|---|---|---|
| W5 | Persbericht: "Inclufy lanceert AI-powered business platform voor Benelux MKB" | EUR 500 |
| W5 | LinkedIn Ads starten: ecosystem campagne (CEOs/COOs) | EUR 1,000 |
| W5-6 | "Tool Audit" campagne live | EUR 2,000 |
| W6 | Email blast naar bestaande klanten: ecosystem upgrade aanbod | EUR 0 |
| W7 | AMOS pilaar-campagne live (LinkedIn + Instagram) | EUR 1,500 |
| W7 | ProjeXtPal pilaar-campagne live (Google + LinkedIn) | EUR 2,000 |
| W8 | Finance pilaar-campagne live (LinkedIn + SDR outreach) | EUR 2,000 |
| W8 | Eerste webinar: "Een Platform voor je Hele Bedrijf" | EUR 500 |

### Fase 2: "5 Pilaren in 5 Weken" — Juni-Juli 2026

| Week | Pilaar | Key Activity | Budget |
|---|---|---|---|
| W9 | Hub | CEO dashboard launch + LinkedIn push | EUR 800 |
| W10 | Marketing | AMOS demo video + event partnership announcement | EUR 800 |
| W11 | Projects | ProjeXtPal case study + Bouwbeurs demo | EUR 800 |
| W12 | Finance | CFO Roundtable #1 (Amsterdam) | EUR 2,500 |
| W13 | Academy | Academy beta launch + pilot invitations | EUR 800 |
| W14 | Ecosystem | "5 Pilaren. 1 Platform." wrap-up post + retargeting | EUR 1,000 |

### Fase 3: Pilot & Conversie — Augustus-September 2026

| Week | Activiteit | Budget |
|---|---|---|
| W15-16 | "De Inclufy Pilot" — 20 bedrijven werven | EUR 1,000 |
| W17-20 | Pilot onboarding en monitoring | EUR 1,000 |
| W18 | CFO Roundtable #2 (Rotterdam) | EUR 2,500 |
| W20 | Finance whitepaper launch: "AI ERP Gids voor Benelux" | EUR 500 |
| W22 | **SaaS Summit Benelux (23 sept, Amsterdam)** — ecosystem stand | EUR 3,000 |
| W22 | Eerste 3 case studies publiceren (pilot klanten) | EUR 500 |

### Fase 4: Scale — Oktober-December 2026

| Maand | Activiteit | Budget |
|---|---|---|
| Oktober | Schaal winnende kanalen op (2x budget op best performers) | EUR 5,000 |
| Oktober | "Inclufy Impact Awards" nominaties openen | EUR 1,000 |
| November | Impact Awards uitreiking (Amsterdam) | EUR 4,000 |
| November | Enterprise sales push (pilotklanten > enterprise) | EUR 1,000 |
| December | Internationale pilot: FR markt (Belgie/Frankrijk) | EUR 2,000 |
| December | 2027 marketingplan + budget op basis van 2026 data | — |

---

## 11. Budget & KPIs

### Totaal Budget 2026 (April-December)

| Categorie | Q2 (Apr-Jun) | Q3 (Jul-Sep) | Q4 (Okt-Dec) | Totaal |
|---|---|---|---|---|
| **LinkedIn Ads** | EUR 4,500 | EUR 4,000 | EUR 5,000 | **EUR 13,500** |
| **Google Ads** | EUR 3,500 | EUR 2,000 | EUR 2,500 | **EUR 8,000** |
| **Instagram / YouTube / TikTok** | EUR 1,000 | EUR 1,500 | EUR 2,000 | **EUR 4,500** |
| **Events & Sponsorships** | EUR 1,000 | EUR 8,000 | EUR 5,000 | **EUR 14,000** |
| **Content & Creative** | EUR 3,000 | EUR 3,000 | EUR 3,000 | **EUR 9,000** |
| **PR & Influencer** | EUR 500 | EUR 500 | EUR 1,000 | **EUR 2,000** |
| **Outbound (SDR)** | EUR 1,000 | EUR 1,500 | EUR 1,500 | **EUR 4,000** |
| **Webinars & Roundtables** | EUR 500 | EUR 5,500 | EUR 1,000 | **EUR 7,000** |
| **Pilot programma** | EUR 0 | EUR 2,000 | EUR 1,000 | **EUR 3,000** |
| **Impact Awards** | EUR 0 | EUR 0 | EUR 5,000 | **EUR 5,000** |
| | | | | |
| **Totaal** | **EUR 15,000** | **EUR 28,000** | **EUR 27,000** | **EUR 70,000** |

### KPI Dashboard

| Metric | Q2 Target | Q3 Target | Q4 Target | Jaar Target |
|---|---|---|---|---|
| **Website visits** (inclufy.com) | 5,000 | 15,000 | 25,000 | 45,000 |
| **Qualified leads** | 75 | 150 | 200 | 425 |
| **Trial/free signups** | 200 | 400 | 600 | 1,200 |
| **Betalende klanten (nieuw)** | 20 | 50 | 80 | 150 |
| **Multi-app klanten** (2+ pilaren) | 5 | 15 | 30 | 30 |
| **Ecosystem klanten** (3+ pilaren) | 0 | 5 | 12 | 12 |
| **MRR** | EUR 5,000 | EUR 15,000 | EUR 35,000 | EUR 35,000 |
| **ARR run-rate** (eind jaar) | — | — | — | EUR 420,000 |
| **LinkedIn followers** | 1,000 | 2,500 | 5,000 | 5,000 |
| **NPS** | Baseline | > 40 | > 50 | > 50 |
| **CAC (blended)** | EUR 300 | EUR 250 | EUR 200 | EUR 225 |
| **LTV:CAC ratio** | 5:1 | 7:1 | 10:1 | 8:1 |

### ROI Projectie

| Scenario | Klanten | Gem. MRR/klant | MRR (dec 2026) | ARR | Marketing spend | Payback |
|---|---|---|---|---|---|---|
| **Conservative** | 80 | EUR 200 | EUR 16,000 | EUR 192,000 | EUR 70,000 | 5 maanden |
| **Base case** | 150 | EUR 250 | EUR 37,500 | EUR 450,000 | EUR 70,000 | 2 maanden |
| **Optimistic** | 250 | EUR 300 | EUR 75,000 | EUR 900,000 | EUR 70,000 | < 1 maand |

---

## Bijlage: Ecosystem Visual Identity Cheat Sheet

### Taglines per Context

| Context | Tagline |
|---|---|
| **Merkniveau** | "Inclufy — Een team. Een platform." |
| **Ecosystem pitch** | "Van 15 tools naar 1 platform" |
| **AI-focus** | "AI-powered business suite voor Benelux" |
| **Kosten-focus** | "Bespaar 40% op bedrijfssoftware" |
| **Gebruiksgemak** | "Zo simpel als een app. Zo krachtig als een platform." |

### Elevator Pitches

**10 seconden (NL):**
> Inclufy is het AI-powered business platform dat marketing, projecten, finance en training verbindt voor Benelux bedrijven.

**30 seconden (NL):**
> Groeiende bedrijven gebruiken gemiddeld 15 losse tools. Marketing in Canva, projecten in WhatsApp, finance in Excel. Niemand heeft het overzicht. Inclufy brengt alles samen in vijf pilaren — Marketing, Projects, Finance, Academy en Hub — op een AI-powered platform. Nederlands, Frans, Engels. GDPR-compliant. Gebouwd voor Benelux.

**10 seconden (EN):**
> Inclufy is the AI-powered business platform that connects marketing, projects, finance, and training for Benelux companies.

**10 seconden (FR):**
> Inclufy est la plateforme d'entreprise alimentee par l'IA qui connecte marketing, projets, finance et formation pour les entreprises du Benelux.

---

*Document aangemaakt: maart 2026 | Versie: 1.0*
*Volgende review: juni 2026 na eerste campagne-data*
*Gebruik `/marketing` voor verdieping per pilaar of campagne.*
