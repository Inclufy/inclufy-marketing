# New AMOS Features — for the Website

**Audience:** Inclufy.com visitors (B2B marketers, CMOs, event leads, PMOs).
**Use:** input for the inclufy.com (sister repo: `inclufy-ignite`) marketing site copy and feature pages, plus the AMOS landing page sections.
**Source of truth:** `docs/MULTI_AGENT_FEATURES.md` (technical), this doc (marketing).

---

## The story in one line

> **AMOS now ships with a 5-agent AI system that turns every event capture into organic posts, paid campaigns, and qualified leads — with you in the approval seat.**

---

## The 6 sellable new capabilities

### 1. Multi-Agent System (5 agents that actually collaborate)
**What:** Five specialized AI agents — Content, Social, Ads, Analytics, Lead — orchestrated by a planner that decides which agent to dispatch for any goal.

**Why it matters (B2B):**
- One product replaces a 5-tool stack (Jasper + Buffer + AdEspresso + GA + HubSpot).
- Agents talk to each other; users see the conversation as a chat thread.
- Per-agent kill switch + daily budget caps — every CFO's first ask.

**Demo value-prop copy (NL):**
> "Eén AI-team dat samenwerkt aan jouw marketing. Geen losse tools, geen handmatige hand-offs."

**Demo value-prop copy (EN):**
> "One AI team that collaborates on your marketing. No siloed tools, no manual hand-offs."

**Where on the site:** new section on AMOS landing page; deep-link to the Multi-Agent feature page.

---

### 2. Live Receipts — every AI decision shows its work
**What:** Every agent run displays the exact input it received, the tool calls it made, the output it produced, plus tokens, cost, and duration. Selectable JSON.

**Why it matters:** B2B trust killer. Most AI products are black boxes; AMOS shows the receipts. CFOs and IT teams approve faster.

**Copy (NL):**
> "Geen black box. Iedere AI-actie laat zien wat erin ging, wat eruit kwam, en wat het kostte."

**Copy (EN):**
> "No black box. Every AI action shows what went in, what came out, and what it cost."

**Where:** AMOS feature grid (3rd or 4th tile, "Trust & Compliance" angle).

---

### 3. Capture-to-Ads (Boost-this-Post, agent-suggested)
**What:** When the Analytics Agent spots an organic post performing above the 75th percentile, the Ads Agent drafts a paid campaign automatically. User approves with one tap → lands directly inside the existing 4-step BoostFlow with budget + audience prefilled by the agent.

**Why it matters:** Closes the loop between organic content and paid amplification — the #1 thing customers ask AMOS for.

**Copy (NL):**
> "Top-presterende posts worden automatisch betaalde campagnes — met jouw goedkeuring, niet automatisch."

**Copy (EN):**
> "Top-performing posts become paid campaigns — with your approval, never automatic."

**Where:** "From capture to campaign" hero on the events landing page; case study angle.

---

### 4. Voice command (long-press FAB)
**What:** Hold the camera button → speak your goal ("promoot mijn beste post van vorige week met €100") → orchestrator dispatches the right agent(s).

**Why it matters:** No competitor (HubSpot, Buffer, Hootsuite) has voice → action. Demo gold for events.

**Copy (NL):**
> "Spreek je doel in. AMOS stuurt de juiste agent — voor je het scherm los hebt."

**Copy (EN):**
> "Speak your goal. AMOS dispatches the right agent before you put the phone down."

**Where:** AMOS landing page hero video; events sponsorship pitch deck.

---

### 5. Counterfactual nudge ("Left on the table")
**What:** Weekly, AMOS shows users what they would have earned if they had approved the previous week's pending agent runs. Drives approval rate up.

**Why it matters:** Behavioral nudge with a real EUR figure. Counter-intuitive: makes the agent system more trusted, not less.

**Copy (NL):**
> "Geschat €420 omzet als je de 3 ad-runs van vorige week had goedgekeurd."

**Copy (EN):**
> "Estimated €420 revenue if you'd approved last week's 3 ad runs."

**Where:** ROI calculator section on the AMOS pricing page.

---

### 6. Per-agent kill switch + daily budget caps
**What:** Every agent has a Pause toggle, a daily token cap, and a daily EUR spend cap. Caps enforced server-side in the orchestrator before any dispatch — over-cap runs are blocked with a clear reason.

**Why it matters:** Compliance + budget discipline. Agents cannot accidentally burn money. Sales gold for ENT/finance buyers.

**Copy (NL):**
> "Per agent een aan/uit-knop, dagelijkse token- en eurolimieten. AI die jouw grenzen kent."

**Copy (EN):**
> "Per-agent on/off switch, daily token + EUR caps. AI that respects your guardrails."

**Where:** AMOS Trust & Compliance page; Enterprise pricing tier feature list.

---

## How they fit the existing AMOS narrative

The current AMOS positioning is **event-first marketing**: capture → AI → publish. The new layer makes that loop **agentic + auditable + paid-aware**:

```
EVENT  →  CAPTURE  →  AI CONTENT  →  ORGANIC POST  →  ADS BOOST  →  LEADS
                                          │
                                          ├── Live receipts (every step)
                                          ├── Counterfactual nudge (weekly)
                                          └── Voice command (anywhere in the loop)
```

Existing landing pages to update:
- **AMOS landing** — new section "Meet your AI team" with 5 agent cards.
- **Pricing** — Enterprise tier should list "AI Governance: kill switches + budget caps".
- **Events sponsorship page** — add the voice + capture-to-ads angle.
- **Trust & compliance page** (if exists, otherwise new) — Live receipts, RLS-enforced approval, LMDP gate explanation.

---

## What's NOT shippable yet (don't promise)

Be honest in copy — don't oversell:

- **Goal Mode** (Tier-2) is designed but not built. ~7 dev-days. Don't promise.
- **Pre-emptive proposals cron** — orchestrator scans engagement daily — not yet wired. Don't promise.
- **Cross-product agent chains** (Marketing → Finance → ProjeXtPal) — design only, no implementation.
- **LinkedIn programmatic ads** — gated by LMDP approval (drafted, not submitted). Manual queue only on prod today.
- **Industry-trained agents** — Tier-3 idea, not started.

---

## Asks of the website agent

1. Where on inclufy.com should each of these 6 features surface? Recommend page + section + above/below the fold.
2. Does any of this already have a placeholder on the site? (Don't duplicate.)
3. What's the cleanest CTA pairing: demo request, or in-app "try it" link?
4. NL/EN/FR copy for hero + 1 paragraph + bullet list per feature.
5. Image/visual recommendation per section (screenshots from AMOS, or original brand assets — but don't fake screenshots).
6. SEO meta titles + descriptions per feature page.

---

## Asks of the web/ validator (this repo's Next.js app)

The mobile app (RN) has shipped these features. The marketing-app web port (`web/` in this repo) is a separate Next.js codebase. For each feature:

1. Is it already in `web/src/app/(app)/...` somewhere?
2. If not, is it desirable to port to web? (Voice mode probably not — no FAB on web.)
3. If yes to port: what's the rough effort + which routes need to be added?
4. Any data model that's RN-only and would need parity work first?

---

## Companion files

- Technical reference: `docs/MULTI_AGENT_FEATURES.md`
- Tier-2 design (Goal Mode): `docs/GOAL_MODE_DESIGN.md`
- Mobile app screens: `src/screens/MultiAgent*.tsx`, `BoostFlowScreen.tsx`
- Edge functions: `supabase/functions/{orchestrator,agent-ads,agent-counterfactual}/`
