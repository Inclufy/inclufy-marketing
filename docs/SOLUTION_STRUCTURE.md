# Inclufy Ecosystem — Solution Structure

> Gebaseerd op feature scans van alle 4 productie-applicaties (28 maart 2026).
> Dit document definieert de logische structuur voor de website (inclufy.com).

---

## Bron: Echte Features uit Code

| Product | Bron | Pages/Modules | Port |
|---------|------|--------------|------|
| Inclufy AI Marketing | iCloud Drive / web app | 53 mobile + 18 web screens | :8085 |
| ProjeXtPal | Projects/projextpal/frontend | 200+ pages, 8 methodologieën | :8084 |
| Inclufy Finance | Projects/inclufy-auto-finance-main | 25+ modules, 3 portals, 8 rollen | :8083 |
| Inclufy AI ERP (Ignite) | Dropbox/inclufy-ignite | 50+ modules, 3 portals | :8082 |

---

## Oplossingsstructuur — 6 Hoofdoplossingen + Platform

### 1. AI ERP & Operations (Ignite)
**Doelgroep:** Operations, Supply Chain, COO, Inkoop, Warehouse, Productie
**Prijs:** €39/user/mo (Full)

| Sub-Oplossing | Echte Modules uit Code | Key Features |
|---------------|----------------------|--------------|
| **Procurement & E-Sourcing** | Marketplace (buyer), E-Sourcing (RFQ/RFP/RFI), Supplier Management, Contract Management, Contract Intelligence, Orders, Invoices | Bid evaluatie, supplier risk assessment, 3-way matching (PO-GR-Invoice), KPI tracking, SLA monitoring |
| **Sales & CRM** | CRM (Companies, Contacts, Deals Pipeline, Activities), Sales Orders, Sales Invoicing, Marketplace (supplier), Sales Reporting, Sales Automation | Deal stages (lead→closed), custom attributes, revenue dashboards, deal approval workflows |
| **Warehouse Management** | Warehouse Locations, Goods Receipt, Stock Checkin, Stock Movements, Lot Tracking, Inventory Counts | Bin management, quality inspection, serial/batch tracking, expiration dates, cycle counting |
| **Manufacturing** | Production Orders, BOM, Quality Control, Work Centers, Routing, Scheduling, Scrap Records, Maintenance | Cost rollup, incoming/in-process/final QC, shift management, capacity planning, preventive maintenance |
| **Inventory Management** | Inventory (real-time tracking), automated reordering, demand forecasting | SKU tracking, barcode scanning, safety stock, multi-location |
| **Logistics & Shipping** | Shipping Orders, Returns, Carriers, Delivery Routes, Freight Invoicing | Route optimization, driver assignment, freight reconciliation, tracking integration |
| **Risk & Compliance** | Supplier risk (financial, operational, geopolitical, ESG), Compliance monitoring, Audit trail | Risk scores, ESG ratings, regulatory tracking, contract compliance |
| **Market Intelligence** | Price Intelligence, Commodity tracking, Market Research | Historical price analysis, price alerts, industry benchmarks |
| **Workflow Automation** | Workflow definitions, Alert rules, Approval workflows, Notification rules | Multi-step approvals, escalation paths, email/in-app/webhook triggers |

**Portals:** Procurement Portal, Sales Portal, Tenant Admin Portal
**Integraties:** SAP S/4HANA, Microsoft Dynamics, Salesforce, Exact Online, QuickBooks, HubSpot, 40+ meer

---

### 2. AI Finance
**Doelgroep:** CFO, Controller, Finance Manager, Accountant, Boekhouder
**Prijs:** €39/user/mo (Full), €19/user/mo (Mobile)

| Sub-Oplossing | Echte Modules uit Code | Key Features |
|---------------|----------------------|--------------|
| **Boekhouding & Grootboek** | Boekhouding (journal entries), Grootboek (GL accounts), Afschrijvingen | AI-suggested bookings, cost centers, recurring entries, account hierarchy |
| **Facturatie & Declaraties** | Facturenbeheer, Declaraties | UBL/Excel/bulk import, 3-way matching, approval workflows, status tracking |
| **BTW & Compliance** | BTW-aangifte, Compliance, Regelgeving & Updates, Audit Logs | VAT calculation, filing, regulatory info, complete activity logging |
| **Analyse & Planning** | Cashflow, Scenario Analyse, Jaarplan, Budget, Wisselkoersen | Liquidity forecasting, what-if simulations, multi-currency |
| **Handel** | Inkoop, Verkoop | Purchase orders, sales orders, CRM |
| **Subsidies & ROI** | Subsidies & Investeringen | Subsidy discovery, matching, investment tracking |
| **Payroll** | Personeelskosten | Dashboard, CSV import, GL mapping, journal review |
| **AI & Automatisering** | AI Workflows, AI Copilot, Projecten, Integraties | Bank reconciliation, booking suggestions, ML feedback, document upload |
| **Rapportage** | Rapportages, Financial Reports, ROI Dashboard | KPI dashboards, export (PDF/Excel), AI insights |

**Portals:** Finance Portal, Procurement Portal, Sales Portal
**Rollen:** Superadmin, CFO, Finance Manager, Register Accountant, Controller, Accountant, Boekhouder, Viewer
**Talen:** NL, EN, DE, FR, ES

---

### 3. AI Marketing (AMOS)
**Doelgroep:** Marketing Manager, CMO, Content Team, Event Organizer
**Prijs:** €15/user/mo (Full), €9/user/mo (Mobile)

| Sub-Oplossing | Echte Modules uit Code | Key Features |
|---------------|----------------------|--------------|
| **Autonoom Commandocentrum** | AMOS Hub, Autonomous Hub, AI Command, Multi-Agent | Autonomy levels (conservative/balanced/aggressive), trust score, health score, decision tracking, 24/7 AI management |
| **Strategie & Doelen** | Marketing Strategy, Goals, Channels, Posting schedule | Budget, active channels (5), posts/week, posting days, autonomy level |
| **Campagnes** | Campaigns (4 types: multi-channel/email/SMS/push) | 7 cost categories, 6 revenue sources, budget monitoring, ROI calculation |
| **Content Creatie** | Content Creator, Content Proposals, Content Calendar | 5 content types, 6 tones, 3 lengths, AI image generation, quick templates, approval workflows |
| **Events & Networking** | Events, Event Intelligence, Event Scanner, Event Recap, Story Arc | AI event discovery, QR/NFC/card scanning, priority scoring, ROI estimation, attendee management |
| **Contacten & CRM** | Contacts, Lead Capture, Smart Lead, Team Directory | Source tracking, AI lead qualification & scoring, digital business cards |
| **Merk & Identiteit** | Brand Kit, Organization, Products | Multiple brand kits (colors, logo, font, tagline), 8 presets |
| **Automatisering** | Marketing Automation, Opportunity Radar, Content Proposals | Email/SMS/push/multi-channel automation, workflow builder, autopilot |
| **Analyse & Rapportage** | Analytics, Budget Monitor | Per-platform engagement, campaign ROI, funnels, audience insights |
| **Publicatie** | Post Management, Multi-platform publishing | LinkedIn, Instagram, X, Facebook, TikTok — AI captions, scheduling, batch publishing |

**Kanalen:** LinkedIn, Instagram, Facebook, TikTok, X/Twitter
**Talen:** NL, EN, FR

---

### 4. AI Project Management (ProjeXtPal)
**Doelgroep:** PMO, Project Manager, Programme Manager, Directie
**Prijs:** €15/user/mo (Full), €9/user/mo (Mobile)

| Sub-Oplossing | Echte Modules uit Code | Key Features |
|---------------|----------------------|--------------|
| **Portfolio Management** | Portfolio Dashboard, Portfolio Detail, Boards, Create Portfolio | 6 KPIs (programs, projects, active, risk, budget, progress), Kanban-style boards |
| **Programme Management** | Programs Overview, Program Dashboard, Benefits, Governance, Resources, Roadmap | 5 methodologieën: SAFe (ART, PI Planning), MSP, PMI, PRINCE2 Programme, Hybrid |
| **PRINCE2** (11 pages) | Dashboard, Business Case, Project Brief, Project Board, Stage Plan, Stage Gate, Work Packages, Tolerances, Highlight Report, Governance, Closure | Volledige PRINCE2 implementatie |
| **Agile** (10 pages) | Overview, Product Vision, User Personas, Backlog, Iteration Board, Daily Progress, Retrospective, Velocity, Release Planning, Budget | Product backlog, sprints, velocity tracking |
| **Scrum** (12 pages) | Overview, Sprint Planning, Sprint Board, Sprint Review, Daily Standup, Backlog, Definition of Done, Retrospective, Velocity, Increments, Team, Budget | Full Scrum events + artifacts |
| **Kanban** (12 pages) | Overview, Board, WIP Limits, Flow Metrics, CFD, Continuous Improvement, Blocked Items, Configuration, Work Items, Policies, Team, Budget | WIP limits, cumulative flow, kaizen |
| **Waterfall** (17 pages) | Overview, Requirements, Design, Development, Testing, Deployment, Maintenance, Gantt, Milestones, Baselines, Phase Gates, Change Requests, Risks, Issues, Deliverables, Budget, Team | Full waterfall lifecycle met Gantt |
| **Lean Six Sigma** (21 pages) | DMAIC, VOC, SIPOC, Baseline, Data Collection, Fishbone, Pareto, Root Cause, Hypothesis, MSA, Regression, Solutions, FMEA, Pilot, Implementation, Improve, Control Plan, SPC, Monitoring, Closure, Tollgate | Volledige DMAIC + statistische tools |
| **Project Lifecycle** | Foundation (Overview, Workflow, Charter, Team, Budget), Planning (Timeline, Milestones, Tasks, RACI, Dependencies, Calendar, Workflow Diagram, System Integration, Risks), Execution (Stakeholders, Communication, Governance, Deployment), Monitoring (Documents, Lessons Learned) | 42+ pages per project |
| **AI Features** | AI Copilot + Voice, AI Commander, AI Reports (6 types), Setup Agent | Portfolio Analyse, Directiesamenvatting, Financieel Overzicht, Programmaprestaties, Batenrealisatie, Governance Rapport |
| **Time Tracking** | Time Tracking, Timesheet Export | Timer, AI inzichten, slimme invoer, AI rapport, project/task verdeling |
| **Governance** | Governance Boards, Stakeholder Management, Impact Analysis | Governance structuur, user/business/compliance impact, steering/board reports |
| **Academy** | Course Builder, Learning Player, Training Marketplace | Ingebouwd trainingsplatform |

**Methodologieën:** PRINCE2, Agile, Scrum, Kanban, Waterfall, Lean Six Sigma (Green + Black), Hybrid
**Industries:** 14 templates (IT, Bouw, Zorg, Finance, Onderwijs, Retail, Productie, Consultancy, Media, Transport, Overheid, Non-profit, Energie, Agri)

---

### 5. AI Academy (InclufAI)
**Doelgroep:** HR, L&D, Training Manager, Compliance Officer
**Prijs:** €9/user/mo

| Sub-Oplossing | Echte Modules uit Code |
|---------------|----------------------|
| **Cursussen & Certificering** | Course creation, quizzes, exams, certificates |
| **AI Leerpaden** | Gepersonaliseerde leerroutes op basis van rol en skill gaps |
| **Skill Gap Analyse** | AI-powered competentie-assessment |
| **Compliance Tracking** | Certificeringsstatus, deadlines, regulatory requirements |
| **IQ Helix Assessments** | IQ/EQ/SQ testing, talent analytics, performance benchmarking |

---

### 6. Platform (Hub + Connect)
**Doelgroep:** CEO, CTO, IT Manager, Directie
**Prijs:** Hub = gratis bij 2+, Connect = inbegrepen Business

| Sub-Oplossing | Echte Modules uit Code |
|---------------|----------------------|
| **Hub Dashboard** | Cross-product KPIs, AI alerts, unified notifications, real-time reporting |
| **Connect (SSO/API)** | Unified authentication, shared data layer, AI engine, REST API, GDPR compliance |
| **AI Copilot** | 32 AI agents, conversational + voice, predictive analytics, document OCR |
| **Mobile (InclufyGO)** | 3 native apps (AMOS, ProjeXtPal, Finance), NFC, barcode, offline-first |

---

## Website Navigatie — Voorgesteld

```
Ecosystem ▼
│
├── 🏭 AI ERP & Operations
│   ├── Procurement & E-Sourcing
│   ├── Sales & CRM
│   ├── B2B Marketplace
│   ├── Inventory Management
│   ├── Warehouse Management
│   ├── Manufacturing & Production
│   ├── Logistics & Shipping
│   ├── Risk & Compliance
│   └── Workflow Automation
│
├── 💰 AI Finance
│   ├── Boekhouding & Grootboek
│   ├── Facturatie & Declaraties
│   ├── Analyse & Planning
│   ├── BTW & Compliance
│   └── Payroll & HR
│
├── 📣 AI Marketing
│   ├── Autonoom Commandocentrum
│   ├── Campagnes & Content
│   ├── Events & Networking
│   └── Analyse & Automatisering
│
├── 📊 AI Project Management
│   ├── Portfolio & Programme
│   ├── 8 Methodologieën
│   ├── Governance & Compliance
│   └── Time Tracking & Rapportage
│
├── 🎓 AI Academy & Skills
│   ├── Cursussen & Certificering
│   ├── IQ Helix Assessments
│   └── Compliance Training
│
└── 🎓 AI Academy & Skills
    ├── Cursussen & Certificering
    ├── IQ Helix Assessments
    └── Compliance Training

Note: AI Copilot (32 agents) en Mobile (3 native apps) zijn features
BINNEN de oplossingen, geen aparte menu-items.
```

---

*Gebaseerd op feature scans: 28 maart 2026*
*Bron: productie code van alle 4 applicaties*
