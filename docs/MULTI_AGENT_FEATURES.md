# AMOS Multi-Agent System — Feature Reference

**Status as of 2026-05-09.** Functional documentation of every Tier-1 capability shipped, where it lives in code, how it behaves, and how to test it. The companion to `GOAL_MODE_DESIGN.md` (Tier-2, scoped only).

---

## 1. The agents — what each one is for

Five agents per organization, seeded automatically by the migration `20260509060000_multi_agent_system.sql`. Status reflects **honest readiness** (not aspirational marketing).

| Agent | Kind | Status | What it does | Real backend? |
|---|---|---|---|---|
| Content Agent | `content` | `beta` | Generates marketing content (blog, social posts, email copy, ad copy) | Wraps existing `event-studio-ai` edge function |
| Social Agent | `social` | `beta` | Schedules posts, manages replies, hashtag strategy | Wraps existing `publish-social` + `scheduled-publisher` |
| **Ads Agent** | `ads` | `coming` | Boost top posts, draft LinkedIn / Google / Meta campaigns, pace budgets, report ROAS | New `agent-ads` edge function (4 sub-actions) |
| Analytics Agent | `analytics` | `coming` | KPI monitoring, anomaly detection, weekly reports | Stub, planned to wrap `fetch-post-engagement` |
| Lead Agent | `lead` | `coming` | Lead scoring, nurture sequences, CRM sync | Stub |

Each agent has per-organization config in `agents.config` (JSONB):
```json
{
  "paused": false,
  "daily_token_cap": 50000,
  "daily_spend_cap_eur": 100,
  "linkedin_lmdp_approved": false
}
```

---

## 2. The orchestrator — how agents work together

Single Supabase edge function `supabase/functions/orchestrator/index.ts` exposing three routes:

| Route | Purpose | Auth |
|---|---|---|
| `POST /dispatch` | Plan + dispatch agent(s) for a goal | JWT, org membership |
| `POST /approve` | Flip an `awaiting_approval` run to `queued` | JWT, admin/owner OR initiator |
| `GET /runs?organization_id=` | List recent runs (RLS-filtered) | JWT, org membership |

### Dispatch flow
```
goal + input
  ▼
OpenAI tool-calling planner (gpt-4o-mini)
  ▼  → picks one or more dispatch_*_agent tools
For each child:
  ▼
  ┌─ check agents.config.paused ────────┐  blocked + error_message
  ├─ check daily_token_cap (today's)  ──┤  blocked + "(used/cap)"
  ├─ check daily_spend_cap_eur ────────┤  blocked + EUR figure
  ├─ check agent.status='coming' ──────┤  blocked + "not yet active"
  └─ otherwise:
        - requires_approval=true  → status='awaiting_approval'
        - requires_approval=false → status='queued'
```

Approval requirements (the safety rail):
- **Ads Agent** → always requires approval (any spend gate)
- **Social Agent** → required for live publishing
- **Lead Agent** → required for outbound sends
- **Content Agent** → free (just text generation)
- **Analytics Agent** → free (read-only)

---

## 3. Database schema

`supabase/migrations/20260509060000_multi_agent_system.sql`. Three tables, org-scoped RLS via `organization_members`.

### `agents`
| Column | Notes |
|---|---|
| `id` | UUID PK |
| `organization_id` | FK organizations, RLS scope |
| `kind` | `content` / `social` / `ads` / `analytics` / `lead` / `orchestrator` |
| `status` | `active` / `beta` / `coming` / `paused` / `disabled` |
| `config` | JSONB — paused, caps, LMDP flag, future toggles |
| `capabilities` | JSONB array — for UI chips |
| `UNIQUE(organization_id, kind)` | one agent per kind per org |

### `agent_runs`
Every dispatched execution. Key columns:
- `parent_run_id` — chains orchestrator → child agent dispatches
- `goal`, `input`, `output`, `tool_calls` (all JSONB)
- `status` ∈ {queued, running, awaiting_approval, completed, failed, cancelled, blocked}
- `requires_approval`, `approved_by_user`, `approved_at`
- `prompt_tokens`, `completion_tokens`, `cost_usd` — receipt data
- `related_post_id`, `related_campaign_id`, `related_event_id` — deep-links
- `error_message` — populated for `blocked` / `failed`

### `agent_run_messages`
Inter-agent + LLM message timeline. Renamed from `agent_messages` to avoid colliding with a legacy in-app queue table.
- `run_id` → FK agent_runs
- `role` ∈ {system, user, assistant, tool, agent}
- `from_agent`, `to_agent` — populated for inter-agent traffic
- `content`, `payload` (JSONB)

---

## 4. The Ads Agent — `agent-ads` edge function

`supabase/functions/agent-ads/index.ts`. Four POST actions:

### `boost_post`
Promotes an existing `go_posts` row.
- Looks up the post + warm audience size from `go_event_attendees` (last 90d)
- LMDP guard: `linkedin` channel → `dispatch_mode: 'manual_queue'` if `agents.config.linkedin_lmdp_approved !== true`
- OpenAI drafts headline / body / audience summary / pacing suggestion
- Writes `[pending] {channel} boost for post {id}` row to `campaign_costs` when programmatic dispatch is allowed AND the post belongs to a campaign

### `draft_campaign`
Full campaign brief (objective / audience / creative / tracking / budget / KPIs) — handed off to UI.

### `pace_budget`
Reads `campaign_costs.category='ads'` for a campaign, returns total + last-7d burn + flags.

### `report_roas`
Joins `campaign_costs` ÷ `campaign_revenue`. Returns ROAS + verdict (`healthy` / `breakeven` / `underperforming` / `no_spend_yet`).

### Output contract → consumed by AgentRunDetail
`output.draft.recommended_pacing.{daily_cap_eur, days}` is the bridge to the BoostFlow prefill.

---

## 5. The Counterfactual Agent — `agent-counterfactual`

`supabase/functions/agent-counterfactual/index.ts`. Single POST endpoint.

**Purpose:** show "linker op tafel" — what users left on the table by not approving recent agent runs.

```
POST /agent-counterfactual
Body: { organization_id, window_days?: 7 (max 90) }
Response: {
  window_days,
  missed_runs,
  missed_kinds: { ads: N, social: M, … },
  est_eur_left_on_table,
  methodology: 'no_missed_runs' | 'historical_avg_daily_cap'
             | 'fallback_flat_eur_per_run' | 'no_missed_ad_runs'
             | 'insufficient_history'
}
```

Methodology priority:
1. If there are completed historical ads runs, use the average `output.draft.recommended_pacing.daily_cap_eur × days`.
2. Otherwise fallback to EUR 50 per missed boost.
3. If no history at all → `insufficient_history`, `est = 0`.

---

## 6. UI surfaces (mobile app)

### `MultiAgentScreen.tsx`
- AMOS Hub → "Multi-Agent System" card → this screen.
- Renders 5 agent cards (status badge per readiness).
- Tapping a card navigates to `AgentDetail` with `agentKind`.
- Below: an "Agent Orchestratie" section showing the 5-step flow including step 4 (Ads Agent boosts top posts).

### `AgentDetailScreen.tsx`
Per-agent screen with:
- Gradient header per kind, capabilities chips from DB.
- **Recent runs list** — last 20 runs scoped to this agent + its parent chain. Tap a row → `AgentRunDetail`.
- **Limits & kill switch card** — Pause toggle, Daily token cap input, Daily spend cap EUR input, Save button. Persists to `agents.config`.
- **Start test run button** — POSTs `/orchestrator/dispatch` with `agent_kind` + the agent's name as goal (smoke test).

### `AgentRunDetailScreen.tsx`
Per-run page with:
- Header: goal, status pill, agent name, trigger, duration, total tokens, cost.
- **Live Receipts panel** — 6 metric cells + 3 collapsible JSON viewers (input, tool_calls, output). Selectable text.
- **Approve CTA** — only when `status='awaiting_approval'`; flips status via `/orchestrator/approve`.
- **Killer integration: Approve → BoostFlow** — when the run is an Ads Agent boost with a `related_post_id`, after approve the screen navigates into `BoostFlowScreen` with prefilled values from `output.draft.recommended_pacing`.
- **Agent conversation thread** — `agent_run_messages` rendered as chat bubbles, color-per-role. From-to_agent label like "AnalyticsAgent → AdsAgent" when set.
- Related deep-links section (post / campaign / event ids).

### `AgentActivityTile.tsx` — Home tile (Tier-1 #2)
Purple-gradient card under the AMOS Hub Banner. Shows:
- **Pending pill** when `awaiting_approval > 0`.
- 4 stats: awaiting approval count · blocked today · tokens today · cost today.
- Tap → `MultiAgent`.
- Data-source: RLS-filtered `agent_runs` reads, no edge function.

### `CounterfactualNudge.tsx` — Home banner (Tier-1 #6)
Yellow-orange gradient. Hidden when no history or zero missed runs.
- Reads `agent-counterfactual` edge fn on mount.
- Auto-resolves org via `organization_members` if no prop passed (drop-in pattern).
- Tap → `MultiAgent`.

### `VoiceCommandSheet.tsx` — voice input (Tier-1 #5)
Bottom sheet opened by **long-press on the camera FAB** (500 ms).
- Records audio via `expo-audio` (`useAudioRecorder` / `RecordingPresets.HIGH_QUALITY`).
- Base64-uploads to existing `event-studio-ai` `transcribe` action.
- POSTs the transcription as the goal to `/orchestrator/dispatch`.
- Navigates to `AgentRunDetail` on success.

### First-run voice tooltip
`AppNavigator.tsx` MainTabsWrapper. Pill above the FAB (`Houd ingedrukt voor spraak` / `Hold to speak`), microphone icon. Dismissed forever via `AsyncStorage` key `@amos:voice_tip_dismissed_v1` on first tap or first long-press.

### `AMOSHubScreen.tsx` — Hub catalog (regrouped 2026-05-09)
21 modules now grouped into 6 sections:
- **Today** — multiagent (beta), analytics (beta), opportunity (active)
- **Capture** — event (active), library (active), proposals (active)
- **Content** — content, calendar (beta), ai, automation
- **Ads** — boost (beta, NEW), campaign, budget (beta), strategy
- **Intelligence** — networking, lead
- **Team & Setup** — products, team, organization, integrations (coming), autonomous (beta), onboarding (coming)

Status downgrades (from `active` → honest): multiagent → beta, analytics → beta, calendar → beta, autonomous → beta, budget → beta, integrations → coming, onboarding → coming.

---

## 7. End-to-end flows

### Flow A — Capture → Organic → Paid → Lead (the canonical loop)
```
Events.LiveCapture  (FAB short-press, captures photo)
  → go_captures row
  → Content Agent drafts go_posts
  → Events.PostReview (user approves)
  → Social Agent publishes via publish-social
  → Analytics Agent (24h) detects engagement > P75
  → Ads Agent dispatched (status='awaiting_approval')
  → User taps Approve in AgentRunDetail
  → Navigates to BoostFlowScreen with prefilled budget/duration
  → User confirms steps 1-4 → boost-post edge fn → ad_campaigns row
  → Lead Agent nurtures inbound from the ad
  → Analytics computes ROAS via agent-ads/report_roas
```

### Flow B — Voice command
```
Long-press camera FAB
  → VoiceCommandSheet opens (recording dot pulses)
  → Stop → audio base64 → event-studio-ai/transcribe
  → Transcription becomes "goal" → orchestrator/dispatch
  → Sheet closes → AgentRunDetail opens with the parent run
  → Live receipts visible immediately
```

### Flow C — Approval delegation (manual)
```
Open AMOSHub → Multi-Agent → Ads Agent card → Recent runs
  → Tap an awaiting_approval run
  → Approve → orchestrator/approve flips status to queued
  → If ads-boost with related_post_id → auto-jump to BoostFlow with prefill
```

---

## 8. Approval & safety rails

- **Every spend / publish action requires explicit chat approval per channel** (memory: `feedback_no_live_publish.md`).
- LinkedIn programmatic spend is **blocked** until `agents.config.linkedin_lmdp_approved=true` (memory: `project_linkedin_lmdp_status.md`). All LinkedIn actions today fall back to `dispatch_mode: 'manual_queue'`.
- Per-agent kill switch + daily caps are checked *before* every child dispatch. Cap hits become `status='blocked'` rows with a clear `error_message`.
- `agent_runs` RLS allows updates only by admin/owner OR the run's initiator. Service role bypass for orchestrator writes only.
- `agent_run_messages` is read-only for org members; service role writes.

---

## 9. Known limitations (be honest)

- **Queue worker not implemented yet.** `status='queued'` runs sit there until something polls. Phase-2 task: add a Supabase scheduled function or `pg_cron` poller that consumes `agent_runs WHERE status='queued'` and invokes the corresponding agent edge function. Until then, `agent-ads` actions only run when invoked synchronously by the AgentDetail "Start test run" button (which goes via dispatch, not via the queue).
- **No `leads` table.** Goal Mode (Tier-2) restricts `metric='leads'` until a `go_leads` table is added — see `docs/GOAL_MODE_DESIGN.md`.
- **Counterfactual methodology is heuristic.** Uplift modeling is a Tier-3 item.
- **Voice mode is RN-only.** No web equivalent (web/marketing app doesn't ship the FAB long-press).
- **MultiAgentScreen card stats are derived from `AGENTS.length`**, not from the DB directly; `AgentActivityTile` is the live-data tile.
- **"Active" Hub items still need full audit.** This pass demoted 7 items; the remaining 14 should be re-validated in the next sprint by an operational tester run.

---

## 10. How to test (manual)

1. Run the migration via Supabase Dashboard SQL Editor (or `supabase db push` after history repair).
2. Deploy the three edge functions: `supabase functions deploy orchestrator agent-ads agent-counterfactual`.
3. Bundle the app (Expo / EAS / Xcode Cloud).
4. **Home tab** — verify the purple Multi-Agent tile shows below the AMOS Hub Banner with `0 awaiting / 0 blocked / 0 tokens / $0.00`.
5. **Long-press the camera FAB** — voice tooltip should appear once, then VoiceCommandSheet opens. (Requires microphone permission.)
6. **Hub** → Multi-Agent System (status: `beta`). Tap → 5 agent cards.
7. Tap any card → AgentDetail. Test the Pause toggle + cap inputs + Save. Re-load to verify persistence.
8. **Start test run** → check that an `agent_runs` row appears in the DB. For `coming` agents (Ads/Analytics/Lead) the run should be `blocked` with a clear error_message. For `beta` agents (Content/Social) the run should be `queued` (or `awaiting_approval` for Social).
9. Tap a run row → AgentRunDetail. Verify Live Receipts JSON viewers expand correctly and the agent thread renders.
10. To test the **Approve → BoostFlow** integration: create a synthetic `agent_runs` row in the dashboard with `agent_id` of an ads agent, `status='awaiting_approval'`, `related_post_id` set to a real `go_posts.id`, and `output.draft.recommended_pacing = {"daily_cap_eur": 25, "days": 3}`. Open the run in the app → Approve → should land in BoostFlow step 1 with €75/3 days preselected and the purple "Suggested by Ads Agent" badge.

---

## 11. Companion files

- Migration: `supabase/migrations/20260509060000_multi_agent_system.sql`
- Edge functions: `supabase/functions/orchestrator/index.ts`, `supabase/functions/agent-ads/index.ts`, `supabase/functions/agent-counterfactual/index.ts`
- Screens: `src/screens/MultiAgentScreen.tsx`, `src/screens/AgentDetailScreen.tsx`, `src/screens/AgentRunDetailScreen.tsx`, `src/screens/BoostFlowScreen.tsx`, `src/screens/AMOSHubScreen.tsx`
- Components: `src/components/AgentActivityTile.tsx`, `src/components/CounterfactualNudge.tsx`, `src/components/VoiceCommandSheet.tsx`
- Navigation: `src/navigation/AppNavigator.tsx`, `src/types/index.ts`
- Test agent definition: `~/.claude/agents/amos-operational-tester.md` (extended for these features)
- Tier-2 design: `docs/GOAL_MODE_DESIGN.md`
