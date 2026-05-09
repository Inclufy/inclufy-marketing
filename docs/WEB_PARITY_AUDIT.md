# Web Parity Audit — AMOS Marketing web/

**Date:** 2026-05-09
**Auditor:** Read-only validation pass over `web/` (Next.js).
**Scope:** the 6 features the React Native mobile app shipped today (see `docs/MULTI_AGENT_FEATURES.md`).
**Repo root:** `/Users/samiloukile/Dropbox/Inclufy Marketing/Inclufy Marketing-main`
**Web app root:** `/Users/samiloukile/Dropbox/Inclufy Marketing/Inclufy Marketing-main/web/`

---

## Verification method

1. Read `docs/MULTI_AGENT_FEATURES.md` and `docs/WEBSITE_FEATURES_TO_ADD.md`.
2. Listed every route under `web/src/app/(app)/*/page.tsx`.
3. Ran `grep -rE "Multi-Agent|MultiAgent|orchestrator|agent_runs|agent-ads|BoostFlow|VoiceCommand|Counterfactual|kill switch|daily_token_cap|daily_spend_cap" web/src/ --include="*.tsx" --include="*.ts"` — **0 hits in app code** (only `node_modules` matches, which are unrelated `https.Agent` / `proxy-agent` types).
4. Ran a broader `grep -rEi "agent|orchestrator|boost|counterfactual|voice"` to find any near-misses; only result is the existing `posts/[id]/boost/page.tsx` BoostFlow wizard — no agent integration.
5. Inspected `web/src/components/layout/Sidebar.tsx` — confirmed there is **no `/agents`, `/multi-agent`, or `/copilot/agents` link** in the navigation.

Routes currently shipped in `web/src/app/(app)/`:

```
analytics, automations, brand-kit, budget, calendar, campaigns,
contacts, copilot, dashboard, events, integrations, library,
notifications, organization, personas, posts, products,
proposals, settings, strategy, team
```

The closest existing analogues:

- `automations/page.tsx` — toggles legacy `automations` table rows (Play/Pause). NOT the multi-agent system; it does not read/write `agents`, `agent_runs`, or `agent_run_messages`.
- `posts/[id]/boost/page.tsx` — full 4-step BoostFlow wizard (budget → audience → AI variants → confirm) calling the existing `boost-post` and `ai-ad-variants` edge functions and writing `ad_campaigns`. **No `recommended_pacing` prefill from an Ads Agent run.**
- `copilot/page.tsx` — generic chat copilot, not orchestrator-driven.

---

## Feature-by-feature parity table

| # | Feature | In web/? | Where in web/ (path) | Should port? (Y/N + reasoning) | Effort | Routes/files to add |
|---|---|---|---|---|---|---|
| 1 | Multi-Agent System (5 agents + DB + orchestrator dispatch UI) | **N** | none — no `/agents` route, no Sidebar link, no `agents` / `agent_runs` reads | **Y** — B2B buyers (CFO/IT) evaluate AMOS on desktop; the agent catalogue is the headline differentiator and must be reachable without a phone | **M** | `web/src/app/(app)/agents/page.tsx`, `web/src/app/(app)/agents/[kind]/page.tsx`, `web/src/hooks/useAgents.ts`, Sidebar link |
| 2 | Live Receipts (input/output/tool_calls JSON viewer + tokens + cost) | **N** | none — no run detail screen | **Y** — this is the trust/compliance pitch ("no black box"); enterprise reviewers need to read JSON on a real screen, not a phone | **M** | `web/src/app/(app)/agents/[kind]/runs/[runId]/page.tsx`, JSON viewer component (use `react-json-view` or hand-rolled `<pre>` with copy button) |
| 3 | Capture-to-Ads — Approve→BoostFlow prefill | **Partial** — BoostFlow exists at `web/src/app/(app)/posts/[id]/boost/page.tsx` but does NOT accept `?suggestedBudgetCents=&suggestedDays=&runId=` query params from an Ads Agent run, and the post detail page has no "Approve agent suggestion" CTA | **Y** — already 60% done because BoostFlow ships; only the bridge and the prefill query-param plumbing are missing | **S** | edit `web/src/app/(app)/posts/[id]/page.tsx` (add agent-suggestion banner) + edit `web/src/app/(app)/posts/[id]/boost/page.tsx` (read query-string prefill, mount "Suggested by Ads Agent" badge) |
| 4 | Voice command (FAB long-press → record → transcribe → orchestrator dispatch) | **N** | none — no FAB, no recorder | **N** — desktop UX has no FAB; browser MediaRecorder is possible but voice-to-action is a phone-native demo. Skip to ship faster | **L if forced** | (skip — mobile-only) |
| 5 | Counterfactual nudge ("Left on the table" weekly) | **N** | none — `agent-counterfactual` edge function exists server-side, but no web component calls it | **Y** — the EUR figure converts skeptical buyers; rendering it on the dashboard takes one component because the edge fn is already deployed | **S** | `web/src/components/CounterfactualBanner.tsx` + mount in `web/src/app/(app)/dashboard/page.tsx` (and optionally `analytics/page.tsx`) |
| 6 | Per-agent kill switch + daily caps (Pause toggle, daily_token_cap, daily_spend_cap_eur) | **N** | none — `automations/page.tsx` has a Pause/Play toggle for the legacy `automations` table only, NOT for the `agents` table | **Y** — the "AI Governance" pillar of the Enterprise pricing tier sits here; CFO sign-off depends on cap controls being clickable in the browser | **S** | inside the new `web/src/app/(app)/agents/[kind]/page.tsx` — Pause toggle, two number inputs (token cap, EUR cap), Save button writing to `agents.config` JSONB |

---

## Recommendations

### 1. What MUST go to web/ to maintain parity

Three of the six features are non-negotiable for the web app because B2B buyers (CFO, IT, compliance, agency leads) evaluate AMOS at a desk and rarely touch the phone app during procurement:

- **Multi-Agent System dashboard (#1)** — the headline pitch ("5 agents that collaborate") is invisible on web today. A buyer who lands on `inclufy.com`, books a demo and logs into the web app sees no agent surface at all. This is the single biggest parity gap.
- **Live Receipts (#2)** — enterprise IT reads JSON on a 27" monitor, not a phone. The value-prop copy on the marketing site says "no black box, every action shows what went in, what came out, what it cost" — the web app needs a screen that proves this claim or the copy is unsupported.
- **Per-agent kill switch + caps (#6)** — `Trust & Compliance` page on the marketing site lists this as an Enterprise tier feature. If web has no UI for it, the feature page becomes a hollow promise. This one is easy because it's a single CRUD form on `agents.config`.

The Counterfactual nudge (#5) is *strongly recommended* for parity but slightly less critical: it's a behavioral nudge layered on top of the dashboard, not a blocking missing capability.

### 2. What CAN stay mobile-only

Two features are reasonable to leave mobile-only and not port:

- **Voice command (#4)** — the long-press camera FAB is the entire UX. A desktop browser has no FAB and no obvious moment where holding a key feels natural. The web equivalent would be `MediaRecorder` + a "Hold to talk" button, which is technically doable but loses the demo charm and adds permission-prompt friction. This is the one Tier-1 feature `MULTI_AGENT_FEATURES.md` itself flags as RN-only ("Voice mode is RN-only. No web equivalent."). Honest copy on the marketing site should call this an iOS/Android feature.
- **Capture-to-Ads (#3) — the *capture* half** — events / `LiveCapture` (FAB short-press, photo capture) is mobile-native (camera access, EXIF, location). The *Approve→BoostFlow* half can and should land on web because BoostFlow already exists; we only need the query-string bridge and the agent-run banner. So #3 ships partially: the trigger stays mobile, the approval surface lands on web.

### 3. Suggested rollout order

Because the Supabase backend (migration `20260509060000_multi_agent_system.sql` + the three edge functions) is already deployed, every web port is **pure UI work** — no backend dependency. That means we can sequence by smallest-effort-highest-value:

**Sprint 1 (~1.5 dev-days, two ship-able features):**
1. **Capture-to-Ads bridge (#3)** — S effort, the existing BoostFlow page just needs to read a URL query string and render a "Suggested by Ads Agent" badge. This is the killer demo flow and unblocks selling event capture as a web revenue path.
2. **Counterfactual nudge (#5)** — S effort, one banner component on the dashboard. The `agent-counterfactual` edge fn is live; no schema work, no auth work.

**Sprint 2 (~3 dev-days, the parity payload):**
3. **Multi-Agent dashboard (#1)** — M effort, one list page + one detail page reading from the `agents` table + `agent_runs` table (RLS-filtered). Adds the Sidebar link.
4. **Per-agent kill switch + caps (#6)** — S effort, lives inside the agent detail page from #3 (cheaper to do together than separately).
5. **Live Receipts (#2)** — M effort, the run detail page nested under the agent detail page. Pure read-only render of `agent_runs` + `agent_run_messages`. The mobile screen has 6 metric cells + 3 collapsible JSON viewers — directly portable.

**Skipped:**
6. **Voice command (#4)** — mobile-only by nature.

No feature has a backend blocker because all DB tables, RLS policies, and edge functions ship with the migration that's already deployed. The only build-time work is React/Tailwind UI that consumes existing endpoints.

---

## Punch-list — files to create in web/ to reach parity

```markdown
| Feature | New web/ file(s) | Effort | Blocked-by |
|---|---|---|---|
| Multi-Agent dashboard | web/src/app/(app)/agents/page.tsx (list) + web/src/hooks/useAgents.ts + Sidebar link | M | none — `agents` table + RLS already deployed |
| Multi-Agent detail (per kind) | web/src/app/(app)/agents/[kind]/page.tsx (covers caps + kill switch + recent runs list) | M | none |
| Live Receipts | web/src/app/(app)/agents/[kind]/runs/[runId]/page.tsx + a small JSON-viewer component | M | none — `agent_runs` + `agent_run_messages` tables already deployed |
| Capture-to-Ads bridge — banner | edit web/src/app/(app)/posts/[id]/page.tsx — add "Ads Agent suggestion" card when an awaiting_approval run exists for this post | S | none |
| Capture-to-Ads bridge — prefill | edit web/src/app/(app)/posts/[id]/boost/page.tsx — read `?budget_cents=&days=&runId=` query, preselect closest BUDGET_PRESET, render "Suggested by Ads Agent" purple badge | S | none |
| Counterfactual nudge | web/src/components/CounterfactualBanner.tsx + mount in web/src/app/(app)/dashboard/page.tsx | S | edge fn `agent-counterfactual` already deployed |
| Kill switch + caps | folded into web/src/app/(app)/agents/[kind]/page.tsx above | S | none |
| Voice command | (skip — mobile-only) | — | — |
```

### Implementation notes for the porter

- The existing mobile screens are the spec. `src/screens/AgentDetailScreen.tsx`, `src/screens/AgentRunDetailScreen.tsx`, `src/components/CounterfactualNudge.tsx`, `src/components/AgentActivityTile.tsx` are all readable from this repo and can be re-rendered in Tailwind/Next without backend work.
- Auth pattern: the existing web pages use `@/lib/supabase` directly with the user JWT — same pattern works for orchestrator dispatch (`supabase.functions.invoke('orchestrator', { ... })`).
- RLS is already correct: `agent_runs` is org-scoped via `organization_members`. No new policies needed.
- The query-string contract for the Capture-to-Ads bridge should mirror the mobile prop drop: `recommended_pacing.daily_cap_eur × days` → preselect the BoostFlow preset whose `cents/days` is closest, default to "€25 / 3 dagen" if no agent suggestion exists (current behavior preserved).
