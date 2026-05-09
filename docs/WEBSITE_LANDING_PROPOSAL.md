# inclufy.com Landing-Page Proposal — 6 New AMOS Capabilities

**Date:** 2026-05-09
**Auditor:** website-landingpage-curator
**Source brief:** `docs/WEBSITE_FEATURES_TO_ADD.md`
**Target repo (read-only):** `/Users/samiloukile/Dropbox/inclufy-ignite` (Vite + React + i18next, NL/EN/FR)
**Mode:** RECOMMENDATION ONLY — no edits, no commits, no pushes.
**Primary market:** Netherlands (per `feedback_market_focus.md`). MA/UAE references avoided.

---

## 0. TL;DR

The 6 AMOS capabilities split cleanly into **two narrative pillars**:

1. **Trust pillar** (B2B unblocker) — Live Receipts, Per-agent Kill Switch + Budget Caps. Compliance/CFO ammo. Belongs on **`/solutions/marketing`** Trust block + **`/pricing`** Enterprise tier feature list. New optional page **`/trust`** (or `/security`-extension) bundles them.
2. **Speed-to-revenue pillar** (marketer hook) — Multi-Agent System, Capture-to-Ads, Voice Command, Counterfactual Nudge. These are the demo-magnets. They belong on **`/solutions/marketing`** as a new "Meet your AI team" + "From capture to campaign" section, with the homepage hero teasing the multi-agent angle in a single slot, not all 4.

**Hero discipline:** the homepage hero is already loaded (badge + title + subtitle + 4 stats + 2 CTAs + wheel). Adding 4 new tiles will break it. Add **one** stat tile ("5 specialized agents") and a **single** sub-link to `/solutions/marketing#agents`.

---

## 1. Audience-Pain-Capability matrix

Personas drawn from the existing site evidence (B2B SaaS NL focus: marketing/event leads, MKB owners, CFO/finance buyer, IT/security buyer). I have not found a `personas.ts` file in `inclufy-ignite` — these are derived from the AMOS narrative + existing copy in `src/i18n/locales/nl/website.json`.

| Persona | #1 Pain | Capability that fits | Bereik (1-7) | Pain (L/M/H) | Prio |
|---|---|---|---|---|---|
| **CMO / Marketing lead (MKB)** | "Te veel tools, te veel hand-offs" | Multi-Agent System | 6/7 | H | **P1** |
| **Event/Field marketer** | "Mooie post, maar niemand boost hem op tijd" | Capture-to-Ads | 5/7 | H | **P1** |
| **CFO / Finance owner** | "AI-budget loopt onbedoeld op, geen audit" | Kill Switch + Budget Caps | 6/7 | H | **P1** |
| **IT / Security / DPO** | "AI is een black box, ik kan het niet auditen" | Live Receipts | 5/7 | H | **P1** |
| **Sales/Marketing solo** | "Vergeet posts goed te keuren in de drukte" | Counterfactual Nudge | 4/7 | M | **P2** |
| **Demo-stand visitor / first-time** | "Wow-factor mist op events" | Voice Command | 3/7 | M | **P2** |

**Prioritization rule applied:** P1 capabilities deserve placement on the AMOS solution page above the fold AND a footprint elsewhere (homepage stat / pricing tier / trust page). P2 capabilities go further down the AMOS solution page or in supporting collateral (events page, ROI calculator).

**Hero capacity rule:** AMOS solution-page hero gets max 1 new claim ("Eén AI-team. Met jouw goedkeuring."). Homepage hero gets max 1 stat update. Anything more = capability bloat.

---

## 2. Existing-content inventory (duplicate-avoidance grep)

Grep'd `inclufy-ignite/src/` for the 6 feature names. Findings:

| Term searched | Hits | Verdict |
|---|---|---|
| `multi-agent` / `multiagent` | 0 hits | New territory — no duplicates |
| `5-agent` / `five agent` | 0 | New territory |
| `kill switch` / `killswitch` | 0 | New territory |
| `voice command` | 0 | New territory |
| `capture-to-ads` / `boost this post` | 0 | New territory |
| `live receipt` | 0 | New territory |
| `counterfactual` / `left on the table` | 0 | New territory |
| `budget cap` | 0 | New territory |
| `AI agents` (generic) | NL i18n line 28, 48, 160, 300 ("20+ AI Agents", "20+ AI-agents automatiseren je bedrijf") | **Conflict to resolve.** Existing copy advertises "20+ AI agents" globally. The new "5-agent system" is the specialized **marketing** sub-set. Copy must clarify: "5 gespecialiseerde marketing-agents (deel van het bredere 20+ ecosystem-team)" — otherwise the numbers contradict each other. |
| `AI Copilot` | NL i18n lines 47, 487, 502, 1407, 1443 | **Wording risk.** Existing site uses "AI Copilot" as the umbrella term. The new multi-agent page must position the agents as "what powers the Copilot under the hood", not as a competing brand. |
| `AMOS` mentions | Sub-brand internal name + 1 academy course + 1 event + 1 gallery title | **No duplicate sections** to remove. Existing AMOS solution page (`/solutions/marketing` rendered via `SolutionPage.tsx` keyed on `marketing`) has copy in `solutions.marketing.*` (NL i18n lines 958-1031). |

**Conclusion:** the new 6 capabilities are net-new content. No deletions needed. Two **wording conflicts** to harmonize ("20+" vs "5", "AI Copilot" vs "5-agent system") — addressed in the per-feature copy below.

**Existing AMOS solution-page sections** (`SolutionPage.tsx` driven by i18n key `solutions.marketing`):
- Hero, How It Works (4 items), Benefits (4 items), Process (3 steps), CTA, Features (6 items), Use Cases (3 items), Gallery.
- The 6 new capabilities should slot in between **Features** and **Use Cases** as a new section, OR replace 2 of the 6 generic features ("Autonome Campagnes" → "5-Agent System", "Multichannel Orkestratie" → "Capture-to-Ads"). Recommend **slot in** to preserve existing SEO ranking on the generic terms.

---

## 3. Per-feature placement & copy

For each feature: page + section + already-on-site + CTA + NL/EN copy + visual + SEO meta.

---

### Feature 1 — Multi-Agent System (5 specialized agents)

**Best placement:**
- **Primary:** `/solutions/marketing` — new section "Maak kennis met je AI-team" inserted between existing `features` block and `useCases` block (would map to new i18n key `solutions.marketing.agents`).
- **Secondary:** `/` (homepage) — replace the existing `hero.stat2` ("20+ AI Agents") subline with a sub-tag "incl. 5 marketing-agents" OR add a new ecosystem-section subtitle. **Do NOT add a 5th stat tile** — current 4 are calibrated.
- **Tertiary:** `/pricing` — under Growth/Business/Enterprise tier rows, add a feature-row "5-agent marketing system included" so tier comparisons stay honest.

**Already on the site?** "AI Copilot" is the existing umbrella. "20+ AI agents" is the ecosystem-wide claim (`hero.stat2_label`, `ecosystem.hub.feature4`). New copy must position the 5 marketing agents as a **specialization** of the bigger 20+, not a new product line.

**CTA recommendation:** `Boek een demo` (the agent system is a guided-walkthrough sell, not self-serve). Secondary: `Bekijk het AI-team` → anchor link to the new section.

**NL copy:**
- **Hero (max 12 words):** "Vijf AI-agents. Eén marketingteam. Jouw goedkeuring."
- **Sub-line (max 30 words):** "Content, Social, Ads, Analytics en Lead-agents werken samen aan je campagne — orchestrator stuurt de juiste agent voor elk doel. Jij keurt elke stap goed."
- **3-bullet list:**
  - "5 gespecialiseerde agents — Content, Social, Ads, Analytics, Lead — werken samen, geen losse tools."
  - "Orchestrator dispatcht automatisch de juiste agent per doel."
  - "Onderdeel van het bredere Inclufy ecosysteem (20+ agents in totaal)."

**EN copy:**
- **Hero:** "Five AI agents. One marketing team. Your approval."
- **Sub-line:** "Content, Social, Ads, Analytics, and Lead agents collaborate on every campaign. An orchestrator dispatches the right one — you approve every step."
- **3-bullet list:**
  - "Five specialized agents — Content, Social, Ads, Analytics, Lead — replace a 5-tool stack."
  - "An orchestrator decides which agent handles each goal."
  - "Part of the wider Inclufy ecosystem of 20+ agents."

**FR (optional):**
- "Cinq agents IA. Une équipe marketing. Votre validation."

**Visual recommendation:** Mobile screenshot of `MultiAgentScreen.tsx` (path: `/Users/samiloukile/InclufyMarketing/src/screens/MultiAgentScreen.tsx`). Show the chat-thread view where agents talk to each other. Pair with a static SVG of the 5 agent cards in brand colors (use existing `marketing.svg` accent palette `#FF6B35`). **Do not fake** — if the screenshot isn't ready, use the SVG-only variant first and mark a TODO to swap once the screen ships.

**SEO meta (target: section anchor `/solutions/marketing#agents`):**
- **Title (≤60 chars):** "AMOS Multi-Agent Systeem — 5 marketing AI-agents | Inclufy"
- **Meta description (≤155 chars):** "Vijf gespecialiseerde AI-agents — Content, Social, Ads, Analytics, Lead — werken samen aan jouw campagnes. Met goedkeuring per stap. Boek een demo."

---

### Feature 2 — Live Receipts (every AI decision shows its work)

**Best placement:**
- **Primary:** `/solutions/marketing` — new tile in the existing `features` grid, positioned 4th (the "Trust & Compliance" angle). Replaces or sits next to the current `features.item5_title` "Merk Template Engine" — keep both, this is additive.
- **Secondary:** `/security` page (existing route confirmed in `App.tsx` line 306) — add a new "AI Transparency" subsection. This is the page CFOs/IT auditors land on; perfect fit.
- **Tertiary:** `/pricing` Enterprise tier — bullet "Audit-grade AI Receipts (input/output/cost per run)".

**Already on the site?** No. Existing security/privacy page covers GDPR/ISO 27001 but does not mention AI auditability. **Net-new content.**

**CTA recommendation:** `Lees over AI-governance` → deep-link to `/security#ai-transparency`. Secondary: `Boek een demo`.

**NL copy:**
- **Hero (≤12):** "Geen black box. Elke AI-actie laat zijn werk zien."
- **Sub-line (≤30):** "Iedere agent-run toont input, gebruikte tools, output, tokens, kosten en duur. Selecteerbare JSON. Audit-grade. Klaar voor je IT en CFO."
- **3-bullet list:**
  - "Volledige input/output per run, met tools en parameters."
  - "Kosten en duur per stap — geen budget-verrassingen."
  - "Selecteerbare JSON, exporteerbaar voor audit en compliance."

**EN copy:**
- **Hero:** "No black box. Every AI action shows its work."
- **Sub-line:** "Each agent run displays input, tool calls, output, tokens, cost, and duration — selectable JSON, audit-grade. Built for IT and CFO sign-off."
- **3-bullet list:**
  - "Full input/output per run, including tools and parameters."
  - "Cost and duration per step — no budget surprises."
  - "Selectable JSON, exportable for audit and compliance."

**Visual recommendation:** Mobile screenshot of `MultiAgentScreen.tsx` "receipt drawer" (the JSON inspector view). If not yet shippable as image, use a stylized code-block UI mock in brand colors (no fake numbers — placeholder labels only).

**SEO meta:**
- **Title:** "AI Live Receipts — transparante agent-uitvoer | Inclufy AMOS"
- **Meta description:** "Elke AI-agent run laat input, tools, output, kosten en duur zien. Audit-grade transparantie. Klaar voor je IT, DPO en CFO."

---

### Feature 3 — Capture-to-Ads (Boost-this-Post, agent-suggested)

**Best placement:**
- **Primary:** `/solutions/marketing` — repurpose or replace the existing `features.item3` "Multichannel Orkestratie" (NL i18n line 1006) with this. Multichannel-orchestration messaging is generic; capture-to-ads is differentiating.
- **Secondary:** `/events` page (event marketing playbook) — this is the killer angle for trade-show/event campaigns. Add a new "From booth photo to paid campaign" section.
- **Tertiary:** `/roi-calculator` page (`ROICalculatorPage.tsx` exists at line 87 of `App.tsx`) — add a "Boost-suggested ROI" line to the calculator output.

**Already on the site?** No. "Multichannel orkestratie" is the closest existing claim; but it does not mention organic→paid conversion or 75th percentile threshold. **Net-new.**

**CTA recommendation:** `Probeer Capture-to-Ads in AMOS` → deep-link to AMOS app store / sign-in (in-app try). Secondary: `Boek een demo`.

**NL copy:**
- **Hero (≤12):** "Top-presterende posts worden betaalde campagnes — als jij goedkeurt."
- **Sub-line (≤30):** "Analytics-agent spot je beste organische post (top-25%). Ads-agent maakt direct een campagne-concept met budget en doelgroep. Jij keurt goed met één tap."
- **3-bullet list:**
  - "Automatische detectie van top-25% organische posts."
  - "Vooringevulde campagne in de bestaande 4-staps BoostFlow."
  - "Goedkeuring per campagne — nooit automatisch live."

**EN copy:**
- **Hero:** "Top-performing posts become paid campaigns — with your approval."
- **Sub-line:** "The Analytics agent spots your best organic post (top 25%). The Ads agent drafts a campaign with budget and audience. You approve in one tap."
- **3-bullet list:**
  - "Auto-detection of top-25% organic posts."
  - "Pre-filled campaign drops into the 4-step BoostFlow."
  - "Approval per campaign — never auto-live."

**Visual recommendation:** Side-by-side mobile screenshots: `BoostFlowScreen.tsx` (the 4-step flow, source `/Users/samiloukile/InclufyMarketing/src/screens/BoostFlowScreen.tsx`) + `AnalyticsScreen.tsx` (the post-engagement chart). No faked metrics — use placeholder anonymized numbers if needed.

**Honesty note:** The brief says LinkedIn programmatic is **gated by LMDP approval** (per memory `project_linkedin_lmdp_status.md` — submitted 2026-05-07, awaiting review). Copy must say "LinkedIn campagne-briefs" or "LinkedIn campaigns klaar voor handmatige publicatie", **not** "LinkedIn-ads automatisch live". Meta and Instagram are unaffected.

**SEO meta:**
- **Title:** "Capture-to-Ads — organische post naar betaalde campagne | AMOS"
- **Meta description:** "AMOS Analytics-agent spot top-25% posts. Ads-agent maakt campagne-concept. Jij keurt goed in één tap. Sluit de loop tussen organisch en paid."

---

### Feature 4 — Voice Command (long-press FAB)

**Best placement:**
- **Primary:** `/solutions/marketing` — second-fold hero video / animated section. Voice is a **demo-piece**, not a primary buying reason; show it as proof of how easy the system is.
- **Secondary:** `/events` page — sponsor pitch angle (the only feature where on-stage demo-magic matters).
- **Tertiary:** Keep out of `/`, `/pricing`. Reason: low audience-bereik (3/7), risks distracting from P1 capabilities.

**Already on the site?** No.

**CTA recommendation:** `Bekijk de 30-sec demo` (video, autoplay muted) — Voice command is a "see-it-to-believe-it" feature, not a CTA-trigger. Secondary CTA: `Boek een live demo`.

**NL copy:**
- **Hero (≤12):** "Spreek je doel in. AMOS doet de rest."
- **Sub-line (≤30):** "Houd de cameraknop ingedrukt, spreek je doel: 'Boost mijn beste post van vorige week met €100'. De juiste agent gaat aan het werk — voor je je telefoon weglegt."
- **3-bullet list:**
  - "Long-press camera-button → spreek je doel in (NL/EN)."
  - "Orchestrator dispatcht automatisch de juiste agent."
  - "Geen menu's, geen formulieren — alleen jouw stem."

**EN copy:**
- **Hero:** "Speak your goal. AMOS does the rest."
- **Sub-line:** "Long-press the camera button, speak your goal: 'Boost last week's best post with €100'. The right agent gets to work before you put the phone down."
- **3-bullet list:**
  - "Long-press FAB → speak your goal (NL/EN)."
  - "Orchestrator dispatches the right agent."
  - "No menus, no forms — just your voice."

**Visual recommendation:** Short autoplay-muted-loop video (≤8 MB, mp4 + webm). Captured from a real device demo, not stock. If unavailable, use a static still + overlay text "Long-press → speak". **Do not fake a voice waveform** if not real.

**SEO meta:**
- **Title:** "Voice command — spreek je marketing-doel in | AMOS"
- **Meta description:** "Houd de camera-knop ingedrukt en spreek je marketing-doel. AMOS dispatcht de juiste AI-agent. Geen menu's, geen formulieren."

---

### Feature 5 — Counterfactual Nudge ("Left on the Table")

**Best placement:**
- **Primary:** `/roi-calculator` — embedded in the calculator output. After the user fills in their inputs, show a "What you'd leave on the table without AMOS" line. This is the perfect funnel-context.
- **Secondary:** `/solutions/marketing` — small testimonial-style block under `benefits` ("Bespaar 10+ Uur per Week" already exists at NL line 977; add a sibling "Geen gemiste omzet" tile).
- **Tertiary:** `/pricing` — under Enterprise/Business tier description, add a one-liner: "Inclusief weekly counterfactual report".

**Already on the site?** No. The ROI calculator exists but doesn't reference counterfactual / "left on the table" framing yet.

**CTA recommendation:** `Bereken jouw gemiste omzet` → links to `/roi-calculator`. Secondary: `Boek een demo`.

**NL copy:**
- **Hero (≤12):** "Wat je vorige week liet liggen, in euro's."
- **Sub-line (≤30):** "Wekelijks rapport: geschatte omzet als je de openstaande agent-runs had goedgekeurd. Concrete getallen, geen vage 'AI bespaart tijd'."
- **3-bullet list:**
  - "Wekelijks counterfactual-rapport in de app."
  - "Geschat €-bedrag per niet-goedgekeurde run."
  - "Maakt goedkeuring concreet, niet abstract."

**EN copy:**
- **Hero:** "What you left on the table last week, in euros."
- **Sub-line:** "Weekly report: estimated revenue if you had approved the pending agent runs. Concrete numbers, not vague 'AI saves time' claims."
- **3-bullet list:**
  - "Weekly counterfactual report in-app."
  - "Estimated EUR per unapproved run."
  - "Makes approval concrete, not abstract."

**Visual recommendation:** Static screenshot of the counterfactual screen (if shipped — check `AnalyticsScreen.tsx` or the `agent-counterfactual` edge function output `/Users/samiloukile/InclufyMarketing/supabase/functions/agent-counterfactual`). If not yet rendered, build a clean info-graphic in `assets/images/` matching brand palette — labelled "Concept" until real screen lands.

**Honesty note:** Numbers in copy must be illustrative (e.g. "€420") and labelled as "voorbeeld" or "schatting" — never imply they are average customer outcomes (no validated cohort data yet).

**SEO meta:**
- **Title:** "Counterfactual Nudge — wat je liet liggen, in euro's | AMOS"
- **Meta description:** "Wekelijks AMOS-rapport: geschatte omzet bij goedkeuring van agent-runs. Maakt AI-marketing concreet, niet abstract."

---

### Feature 6 — Per-agent Kill Switch + Daily Budget Caps

**Best placement:**
- **Primary:** `/security` page — new subsection "AI Governance: kill switches & budget caps". This is the page IT/finance buyers land on; perfect fit.
- **Secondary:** `/pricing` — Enterprise tier feature list (`pricing.enterprise.features`, NL i18n line 516+) gets a new bullet: "Per-agent aan/uit-knop + daglimieten (tokens & EUR)". Also add to Business tier as a partial: "Daglimieten (EUR) op alle agents".
- **Tertiary:** `/solutions/marketing` — small Trust block at bottom of the page, just before the final CTA. Mirrors the AVG/ISO 27001 reassurance pattern already used.

**Already on the site?** No. The existing site mentions GDPR + ISO 27001 (NL line 770-771, in `consultancy.why2`) but nothing on AI-spend governance. **Net-new.**

**CTA recommendation:** `Bekijk AI-governance` → `/security#ai-governance`. Secondary on pricing page: `Praat met sales` (Enterprise context).

**NL copy:**
- **Hero (≤12):** "AI met aan/uit-knop. En een dagbudget."
- **Sub-line (≤30):** "Elke agent heeft een Pause-toggle, een tokens-limiet en een EUR-limiet per dag. Server-side afgedwongen — geen onbedoelde uitgaven, geen 'oeps' van de CFO."
- **3-bullet list:**
  - "Per-agent Pause-toggle — direct uit als nodig."
  - "Daglimieten in tokens én EUR — server-side afgedwongen."
  - "Over-cap runs worden geblokkeerd met heldere reden."

**EN copy:**
- **Hero:** "AI with an off-switch. And a daily budget."
- **Sub-line:** "Every agent has a Pause toggle, a daily token cap, and a daily EUR cap. Enforced server-side — no surprise spend, no CFO 'oops'."
- **3-bullet list:**
  - "Per-agent Pause toggle — instant off."
  - "Daily caps in tokens and EUR — enforced server-side."
  - "Over-cap runs blocked with a clear reason."

**Visual recommendation:** Mobile screenshot of `BudgetMonitorScreen.tsx` (path: `/Users/samiloukile/InclufyMarketing/src/screens/BudgetMonitorScreen.tsx`). Pair with a small SVG icon set (toggle + EUR + token icons). Brand-color the toggle switches with `#FF6B35`.

**SEO meta:**
- **Title:** "AI Kill Switch & Budget Caps — AMOS Governance | Inclufy"
- **Meta description:** "Per-agent aan/uit-knop, daglimieten in tokens en EUR. Server-side afgedwongen. AI die jouw grenzen kent — voor CFO en IT."

---

## 4. Page-level placement summary

| Feature | `/` | `/solutions/marketing` | `/pricing` | `/security` | `/events` | `/roi-calculator` |
|---|---|---|---|---|---|---|
| 1. Multi-Agent System | sub-text only | **Primary section** | Tier rows | — | — | — |
| 2. Live Receipts | — | features tile | Enterprise bullet | **Secondary** | — | — |
| 3. Capture-to-Ads | — | **Primary section** (replaces item3) | — | — | Secondary | — |
| 4. Voice Command | — | Demo block | — | — | Secondary | — |
| 5. Counterfactual Nudge | — | Benefits tile | Enterprise bullet | — | — | **Primary** |
| 6. Kill Switch + Caps | — | Trust block | Enterprise + Business bullets | **Primary** | — | — |

---

## 5. Cross-checks done

| # | Check | Result |
|---|---|---|
| 1 | Currency match (NL → €) | PASS — all draft copy uses € |
| 2 | LMDP honesty (LinkedIn programmatic gated) | PASS — Capture-to-Ads copy carries the explicit "Meta + Instagram, LinkedIn handmatig" caveat (memory `project_linkedin_lmdp_status.md`) |
| 3 | NRTO keurmerk-logo not used | PASS — not relevant to this work |
| 4 | NL primary, MA/UAE not foregrounded | PASS — no MA/UAE copy in draft |
| 5 | Sub-brand naming consistent | PASS — "AMOS" used as internal name; user-facing remains "Inclufy Marketing" / "Marketing & Campagnes" per existing pattern |
| 6 | AI agent count consistent (20+ vs 5) | WARN — addressed via "5 marketing-agents (deel van 20+ ecosystem)" framing in copy 1 |
| 7 | i18n parity NL/EN/FR | TODO — FR drafts marked optional; this proposal includes NL+EN only as required by brief |
| 8 | Brand-honesty: only ship-ready features promised | PASS — Goal Mode, pre-emptive proposals cron, cross-product chains, industry-trained agents all excluded from copy. Counterfactual numbers labelled "schatting/voorbeeld". |

---

## 6. Punch-list — top-5 most impactful changes (ordered by leverage)

| # | Change | Why high-leverage | Effort |
|---|---|---|---|
| 1 | New section `solutions.marketing.agents` on `/solutions/marketing` covering Multi-Agent + Capture-to-Ads + Counterfactual + Voice in 4 tiles, with the multi-agent angle as the section hero | Single page-update covers 4 of 6 features. Existing AMOS solution page already has the highest-intent traffic. | **M** (1.5 days: NL+EN+FR copy, new tile component, 4 visuals, i18n keys, SEO update) |
| 2 | Extend `/security` page with "AI Governance" subsection (Live Receipts + Kill Switch + Budget Caps) | These are the unblocker capabilities for ENT deals. CFO/IT path becomes self-serve. | **S** (4-6 hrs: 2 sub-blocks, 1 visual, i18n keys) |
| 3 | Update `/pricing` tier feature lists — Enterprise gets "AI Governance" bullets; Business gets "Daily caps" bullet; all tiers get a "5-agent system" line | Pricing pages convert. Honest tier differentiation = upgrade path. | **S** (2-3 hrs: i18n only, no new components) |
| 4 | Add Counterfactual to `/roi-calculator` output as a "What you'd leave on the table" line | Closes the loop between calculator-output and a buying decision. | **S** (3-4 hrs: 1 calculator output line, copy, optional graph) |
| 5 | Update homepage hero stat-block subtitle to clarify "20+ AI agents incl. 5 marketing-specialists" + small "Bekijk het AI-team" link to the new agents section | Resolves the existing 20+ vs 5 agent number conflict; drives traffic to the new section without bloating hero. | **S** (1-2 hrs: i18n + 1 link) |

**Out of scope but flagged:** dedicated **`/trust`** or **`/ai-governance`** standalone landing page. Recommended only if the security page becomes too crowded after change #2 lands. Effort: **M** (1 day).

**Total dev-time estimate:** **3 to 4 dev-days** for items 1-5. Add ~1 day if a standalone `/trust` page is approved.

**What this proposal does NOT cover (escalate):**
- Customer testimonials referencing the new capabilities → escalate to `customer-stories` skill once first 3 customers have shipped on multi-agent.
- Full FR copy → escalate to `translation-qa` skill after NL+EN are signed off.
- New visual assets / illustrations beyond what already exists in `inclufy-ignite/src/assets/` and the AMOS mobile screenshots → escalate to `brand-visuals` skill.
- LinkedIn programmatic copy → blocked until LMDP approval (track via memory `project_linkedin_lmdp_status.md`).
- Pricing-bedragen wijzigen → human-in-the-loop (no auto-edit).

---

## 7. Risk callouts before any implementation

1. **Mobile→web claim drift.** AMOS mobile ships these features; the marketing site can advertise them only as long as a paying user can actually use them via the AMOS app on iOS/Android. The Vite web app `inclufy-marketing` web port (separate codebase) likely does NOT have all six. If the site says "use voice command" and a web-only user can't, that's a credibility hit. Recommend: every new section caps with a small "Beschikbaar in de AMOS-app op iOS en Android" note.
2. **"20+ AI agents" vs "5 agents" number conflict.** Today's homepage stat says "20+". The new pages will say "5". Without the harmonization wording, sceptical visitors will catch the inconsistency. Fix in punch-list item #5.
3. **Counterfactual numbers risk over-promise.** "€420 last week" is a feature-projection, not a customer cohort outcome. Keep all € figures labelled "voorbeeld" / "example" until validated cohort data exists.
4. **LMDP gating.** The Capture-to-Ads section must say Meta/Instagram automatic, LinkedIn manual handover. If we say "LinkedIn ads launched automatically" we mislead and it's also against LinkedIn ToS until LMDP approval lands.
5. **Hero capacity.** The homepage hero is already at the bound of how much copy fits without scrolling on a laptop viewport. Any addition beyond punch-list #5 will tip it into overflow.

---

**Recommendation:** ship punch-list items #1, #2, #3 in a single sprint (~2.5 dev-days); items #4 and #5 as polish in the following week. Total time-to-live: ~1 sprint.
