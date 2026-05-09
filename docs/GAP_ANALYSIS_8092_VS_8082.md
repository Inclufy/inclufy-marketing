# Gap Analysis — 8092 (deprecated Next.js `/web/`) vs 8082 (production `inclufy-marketing-web`)

**Date:** 2026-05-09
**Decision:** Production = 8082 (`inclufy-marketing-web`, Vite + React + shadcn). 8092 (`Inclufy Marketing-main/web/`, Next.js + Tailwind) is being archived.
**Purpose:** Record what the deprecated Next.js port had that production lacks, so future sprints can port the genuinely-new capabilities without re-discovering them.

---

## 1. Apps at a glance

| | 8082 (production, KEEP) | 8092 (Next.js, ARCHIVE) |
|---|---|---|
| Repo | `Inclufy/inclufy-marketing-web` | `Inclufy/inclufy-marketing-mobile` (`/web/` subfolder) |
| Framework | Vite + React + shadcn + Tailwind | Next.js 14.2.35 + Tailwind |
| Routing | `react-router-dom` v6 | App Router |
| Live URL | https://marketing.inclufy.com | none — never deployed |
| Sidebar / Layout | LuxuryTopNavLayout (top nav + collapsible sidebar) | basic Sidebar component |
| Pages | ~100 (incl. ~16 `admin/*`) | 30 |
| Services | 40+ specialized services in `src/services/context-marketing/*` | basic CRUD hooks only |
| Public surface | Homepage, Features, Pricing, IQ Helix case study | none |
| Admin portal | full (`/app/admin/*` — 16 pages) | none |

**Verdict:** 8082 is a comprehensive marketing AI platform. 8092 was a much smaller dashboard scope that ended up duplicating only the basics + the new multi-agent governance work.

---

## 2. Multi-Agent System — head-to-head (the core ask)

| Capability | 8082 (production) | 8092 (deprecated) | Where the gap is |
|---|---|---|---|
| Page route | `/app/automation/agents` (under "Automatisering") | `/agents` | naming / IA |
| Component | `MultiAgentSystem.tsx` (1500+ lines, charts, tabs, gradient cards) | `(app)/agents/page.tsx` (5 status-pill cards) | **8082 wins** on polish |
| Data source | `ai_agents` table (user-scoped, 10 demo seed rows from Mar 2026) | `agents` table (org-scoped, 5 seeded per org) | different schemas |
| Run history | none | **`agent_runs` table** with parent_run_id chain | **8092 only** |
| Live Receipts (input/output/tool_calls JSON, tokens, cost, duration per run) | none | `(app)/agents/[kind]/runs/[runId]/page.tsx` | **8092 only** |
| Agent conversation thread | none | `agent_run_messages` chat bubbles (per role + from→to_agent label) | **8092 only** |
| Approval gate | Pause/Resume buttons only | `awaiting_approval` status with explicit Approve flow | **8092 only** |
| Daily token cap (server-enforced) | none | orchestrator guard reads `agents.config.daily_token_cap` | **8092 only** |
| Daily EUR spend cap (server-enforced) | none | orchestrator guard reads `agents.config.daily_spend_cap_eur` | **8092 only** |
| Approve→BoostFlow deep-link prefill | n/a | client-side `useRouter().push('/posts/[id]/boost?budget_cents=…&days=…&runId=…')` | **8092 only** |
| Counterfactual nudge ("Left on the table €X") | none | `CounterfactualBanner.tsx` mounted on dashboard, calls `agent-counterfactual` edge fn | **8092 only** |
| Goal Mode (quarterly outcomes) | none | mobile only — design doc + RN screens; Next.js had route placeholder | **mobile only** |
| Voice command (FAB long-press) | none (no FAB on web) | mobile only | **mobile only** |
| Real-time success-rate / efficiency / revenue impact stats | yes (from `ai_agents.*` columns — currently stale demo data) | no aggregates | **8082 wins** but data is stale |
| 7-day trend chart per agent | yes (`recharts`) | no | **8082 wins** |
| Pretty UI (gradient cards, badges, progress bars) | yes | no | **8082 wins** |

### Net read

8082 has the **better visual** but a **shallower data model** (no run history, no approval gate, no caps, no goal mode, no counterfactual). 8092 had the **deeper governance/audit features** but **basic visuals** and was never deployed.

**The actual gap that matters going forward** = the 9 capabilities marked "**8092 only**" or "**mobile only**" above. Those are the items production should port in over time.

---

## 3. New / additive features in 8092 that 8082 should consider porting

In priority order — the ones that move the needle most for B2B trust + governance:

| # | Feature | Effort to port to 8082 | Backend already deployed? |
|---|---|---|---|
| 1 | **Live Receipts** — per-run JSON viewer of input / tool_calls / output + tokens + cost | M | ✅ `agent_runs` table live |
| 2 | **Per-agent Kill Switch + daily token + EUR caps** — server-enforced before any dispatch | S | ✅ orchestrator guard live |
| 3 | **Counterfactual nudge** banner on dashboard ("Left on the table €X") | S | ✅ `agent-counterfactual` edge fn deployed |
| 4 | **Approval flow** — `awaiting_approval` status with explicit Approve button + Approve→BoostFlow prefill | M | ✅ orchestrator `/approve` route live |
| 5 | **Agent conversation thread** — `agent_run_messages` chat bubbles | S | ✅ table live |
| 6 | **Goal Mode** — quarterly outcomes with cron-driven daily evaluations + budget caps | L | ✅ `agent_goals` table live, cron scheduled, orchestrator `/run_goals` route live |
| 7 | **"Suggested by Ads Agent" banner** on post detail + prefill on boost wizard | S | ✅ `agent_runs` query is sufficient |

Total estimate to port all 7 into 8082: **~5–7 dev-days**.

The backend (Supabase migrations + edge functions) is already live and shared — porting is **pure UI work** in 8082's React/shadcn idiom.

---

## 4. Features 8082 has that 8092 lacks (do NOT lose by archiving)

Long list — not exhaustive, just the ones that confirm 8082 is the right keeper:

- **Public website** (Homepage, Features, Pricing, IQ Helix case study, AI Agents Showcase landing component)
- **Admin portal** — `/app/admin/{users,organizations,subscriptions,pricing,features,inquiries,chat,demo-requests,registrations,trainings,invoices,activity,settings,integrations}` (16 pages)
- **Authentication** — Login, Signup, BiometricSetup, full AuthContext
- **AI tools** — AIWriter, AITrainingInterface, ImageGenerator, ConversationalAI, CommercialCreator, TutorialCreator
- **Marketing tools** — EmailCampaignGenerator, SocialPostGenerator, LandingPageGenerator
- **Intelligence layer** — GrowthBlueprint, PostScanWizard, MarketIntelligence, MarketInsights, NetworkingEngine, OpportunityIntelligence, EventIntelligence
- **Analytics layer** — MultiTouchAttribution, PredictiveLeadScoring, RevenueIntelligence, dashboard/Analytics, dashboard/Reports
- **Setup wizards** — TargetAudience, CompetitiveAnalysisSetup, BrandSetup, SetupAgentOnboarding, QuickStart
- **Brand** — BrandKits, BrandMemory, ContextMarketing
- **Operations** — IntegrationHub, PublicationEngine, ContentApprovals, ContentCalendar, ContentLibrary, ContentHub, MediaLibrary
- **Strategy / governance** — MarketingStrategyConfig, EnterpriseGovernance, TrustAutonomy, EcosystemExpansion
- **Specialized** — DigitalBusinessCard, EventScanner, JourneyBuilder, JourneyDashboard, CampaignOrchestrator, CampaignTriggering, ContactManager, AutonomousMarketing
- **Multi-tenant org/team management** — Organization, Team, ProductsHub
- **Settings** — Profile, AccountSettings, ApplicationSettings, TeamSettings
- **40+ specialized services** in `src/services/context-marketing/*` — autonomous, attribution, audience-context, business-context, campaign-triggering, competitive-context, content-factory, content-generation, context-governance, event-intelligence, insights, integration-hub, lead-intelligence, lead-scoring, multi-agent (existing), networking-engine, opportunity-feed, pattern-recognition, publication-engine, quantum-marketing, recommendations, reporting, revenue-engine, strategic-planning

**Verdict on which to keep is clear:** 8082 stays. 8092 is archived.

---

## 5. Backend (DB + Edge Functions) — neutral, both can use

The new tables and edge functions are **shared backend** under the same Supabase project (`mpxkugfqzmxydxnlxqoj`). They were deployed via `Inclufy Marketing-main` migrations + function deploys but are reachable from any frontend that authenticates against this project.

| Asset | Status | Used by 8082 today? | Used by 8092 today? |
|---|---|---|---|
| `agents` table | live | no (uses `ai_agents` instead) | yes |
| `agent_runs` table | live | no | yes |
| `agent_run_messages` table | live (renamed from `agent_messages` to avoid clash with 8082's existing legacy queue) | no | yes |
| `agent_goals` + `agent_goal_runs` tables | live | no | mobile only |
| `ai_agents` table (legacy from 8082) | live | yes | no |
| `agent_messages` table (legacy from 8082) | live | yes (in-app priority/resolved queue) | no |
| Edge fn `orchestrator` | deployed | no | yes |
| Edge fn `agent-ads` | deployed | no | yes |
| Edge fn `agent-counterfactual` | deployed | no | yes |
| Edge fn `event-studio-ai` | deployed | unclear (worth checking) | n/a |
| Edge fn `publish-social` | deployed | yes (likely) | yes |
| pg_cron job `agent-goal-mode-daily` | scheduled 04:00 UTC | n/a — fires regardless | n/a — fires regardless |

**Action item for the migration sync:** the `inclufy-marketing-web` repo's `supabase/migrations/` folder doesn't include the new multi-agent / goal_mode / agent_run_messages migrations. Tidy this in a separate small commit later by copying the 3 new migration files over so its local history reflects what's actually on prod. Pure documentation / repo-honesty fix.

---

## 6. Mobile app — completely unaffected

Mobile (RN, in `Inclufy Marketing-main/`) is the production AMOS / InclufyGO mobile app. Currently building on Xcode Cloud as 1.0.2 (265). All 6 multi-agent features ship on mobile regardless of what happens to the web archive.

The Next.js `/web/` archive does NOT touch the mobile RN code.

---

## 7. Forward roadmap (after archive)

| Sprint | Goal | Items |
|---|---|---|
| Now | Archive 8092 | Move `/web/` → `_archive/web/`; update CI; commit |
| Sprint +1 | Trust & Governance basics on 8082 | Items #1, #2, #3 from §3 — Live Receipts, Caps, Counterfactual |
| Sprint +2 | Approval & Boost flow on 8082 | Items #4, #5, #7 from §3 — Approval, Conversation thread, Suggested-by-Ads-Agent |
| Sprint +3 | Goal Mode on 8082 | Item #6 from §3 — full Goal Mode UI in the existing shadcn shell |
| Sprint +N | `ai_agents` → `agents` rewire (optional) | If we ever want to retire `ai_agents` table, rewrite `useMultiAgent` to read `agents` (translate `kind` → `type`); back-fill `success_rate` etc. from `agent_runs` aggregations |

---

## 8. Companion docs

- Mobile features: `docs/MULTI_AGENT_FEATURES.md`
- Goal Mode design: `docs/GOAL_MODE_DESIGN.md`
- Web parity audit (now superseded by this doc): `docs/WEB_PARITY_AUDIT.md`
- Marketing copy proposals: `docs/WEBSITE_FEATURES_TO_ADD.md`, `docs/WEBSITE_LANDING_PROPOSAL.md`
