# Goal Mode — Design Doc (Tier-2 Suggestion)

Status: **Scoping only. No code in this PR.**
Owner: AMOS / Multi-Agent System
Companion to: `supabase/migrations/20260509060000_multi_agent_system.sql`,
`supabase/functions/orchestrator/index.ts`,
`supabase/functions/agent-ads/index.ts`,
`src/screens/MarketingStrategyScreen.tsx`,
`src/screens/MultiAgentScreen.tsx`.

## 1. What Goal Mode is

The user sets one quarterly outcome — e.g. "+25 % leads in Q3, max €5 000 spend".
A daily orchestrator job reads the goal, computes the gap, and dispatches whichever
agents move the metric. Every agent action still passes through the existing
`agent_runs.requires_approval` gate. Goal Mode is opt-in and lives behind a new
home-screen tile and a Hub module.

---

## 2. Schema design

### 2.1 Recommendation: new `agent_goals` table (NOT `go_marketing_strategy.goals`)

`go_marketing_strategy.goals` is `TEXT[]` (a tag list — `['lead_gen','event_promo']`)
and the table is keyed on `user_id` (legacy per-user RLS, no `organization_id`).
Goal Mode needs:

- **Org scope** to match `agents` / `agent_runs` (`organization_id` + `organization_members`).
- **Time-boxed targets** with a numeric metric, target value, currency budget, deadline, status.
- **Indexable** state for the cron worker (`status = 'active' AND period_end >= today`).
- **A run history** so we can show "yesterday's gap was 18 leads, today 14".

Stuffing this into `goals JSONB` would force every cron tick to scan every strategy
row and JSON-deconstruct it. A real table is cheaper and matches the new agent stack.

### 2.2 `agent_goals` columns

| column | type | notes |
| --- | --- | --- |
| `id` | UUID PK | `gen_random_uuid()` |
| `organization_id` | UUID NOT NULL | FK `organizations(id) ON DELETE CASCADE` |
| `created_by_user` | UUID | FK `auth.users(id) ON DELETE SET NULL` |
| `title` | TEXT NOT NULL | user-visible, e.g. "Q3 Lead Push" |
| `metric` | TEXT NOT NULL CHECK | one of `leads`, `revenue_eur`, `event_attendees`, `posts_published`, `roas`, `followers` |
| `target_value` | NUMERIC(14,2) NOT NULL | absolute (`+50 leads`) or % via `target_kind` |
| `target_kind` | TEXT CHECK | `absolute` \| `delta_pct` \| `delta_abs` |
| `baseline_value` | NUMERIC(14,2) | snapshot at activation (for `delta_*`) |
| `period_start` | DATE NOT NULL | inclusive |
| `period_end` | DATE NOT NULL | inclusive |
| `budget_eur` | NUMERIC(10,2) NOT NULL DEFAULT 0 | hard cap |
| `spent_eur` | NUMERIC(10,2) NOT NULL DEFAULT 0 | recomputed daily from `campaign_costs` |
| `current_value` | NUMERIC(14,2) | last computed metric value |
| `last_evaluated_at` | TIMESTAMPTZ | set by the cron worker |
| `status` | TEXT CHECK | `draft`, `active`, `paused`, `met`, `missed`, `archived` |
| `autonomy_level` | TEXT CHECK | mirrors `go_marketing_strategy.autonomy_level` (`conservative`/`balanced`/`aggressive`) |
| `agent_kinds` | TEXT[] | which agents may be dispatched (`{ads,content,social}`) |
| `config` | JSONB DEFAULT `'{}'` | overrides: per-channel split, max daily spend, kill-switch flag |
| `created_at`, `updated_at` | TIMESTAMPTZ | trigger-managed |

Plus child table `agent_goal_runs` (one row per daily evaluation) to keep history out of the goal row:

| column | type |
| --- | --- |
| `id` | UUID PK |
| `goal_id` | UUID FK `agent_goals(id) ON DELETE CASCADE` |
| `evaluated_at` | TIMESTAMPTZ |
| `current_value` | NUMERIC |
| `gap_to_target` | NUMERIC |
| `actions_dispatched` | JSONB | `[{tool, run_id, budget_eur}]` |
| `parent_run_id` | UUID FK `agent_runs(id) ON DELETE SET NULL` |

Indexes: `(organization_id, status)`, `(status, period_end)` for the cron sweep.

### 2.3 RLS

Match the `agents` migration verbatim:

- **Org members SELECT** (`organization_members.user_id = auth.uid()`).
- **Admins/owners INSERT/UPDATE/DELETE**.
- **Service role full access** (used by `orchestrator/run_goals`).
- `agent_goal_runs` SELECT joins via `agent_goals.organization_id`.

---

## 3. Goal lifecycle

```
draft ──activate──▶ active ──pause──▶ paused
                       │  ▲              │
                       │  └──resume──────┘
                       │
                ┌──────┼─────┐
        target met    period_end passed
                │              │
                ▼              ▼
               met           missed
                │              │
                └──archive────▶ archived
```

Allowed transitions, enforced by an UPDATE trigger:

| from | to | by |
| --- | --- | --- |
| `draft` | `active` | admin/owner |
| `active` | `paused`, `met`, `missed` | admin/owner OR cron worker |
| `paused` | `active`, `archived` | admin/owner |
| `met` / `missed` | `archived` | any member |
| any | `draft` | never (immutable once activated) |

Only ONE `active` goal per `(organization_id, metric)` (partial unique index on `status='active'`).

---

## 4. Daily orchestrator extension — `POST /orchestrator/run_goals`

Reuses everything in `orchestrator/index.ts`: `assertOrgMember`, `serviceClient()`,
`AGENT_TOOLS`, `TOOL_TO_AGENT`, the kill-switch + daily-cap block, and the
`requires_approval` gate. New route lives next to `/dispatch`, `/approve`, `/runs`.

```ts
// pseudocode — DO NOT IMPLEMENT IN THIS PR
async function handleRunGoals(req: Request) {
  // 1. Auth: service-role only (cron) OR caller is admin/owner.
  // 2. Load all active goals whose period covers today:
  //    SELECT * FROM agent_goals
  //    WHERE status='active' AND period_start <= today AND period_end >= today
  for (const goal of goals) {
    // 3. Compute current_value per metric (read-only):
    //    leads            → COUNT(go_event_attendees) WHERE source IN ('form','qr_scan') in period
    //                       (until a real `leads` table exists — see Risks §7)
    //    revenue_eur      → SUM(campaign_revenue.amount) WHERE date in period
    //    event_attendees  → COUNT(go_event_attendees) WHERE registered_at in period
    //    posts_published  → COUNT(go_posts.published_at in period)
    //    roas             → SUM(campaign_revenue) / NULLIF(SUM(campaign_costs),0)
    //    followers        → latest from social_accounts.metrics_json
    const current = await computeMetric(goal);
    const gap     = computeGap(goal, current);              // signed
    const remainingBudget = goal.budget_eur - goal.spent_eur;
    if (gap <= 0)        { markStatus(goal, 'met'); continue; }
    if (today > goal.period_end) { markStatus(goal, 'missed'); continue; }

    // 4. Build a goal-aware planner prompt and reuse callOpenAI(AGENT_TOOLS, ...)
    //    so the same tool catalogue routes to ads / content / social / lead.
    //    Constraint hint: `budget_cap_eur = min(remainingBudget, dailyAllowance(goal))`.
    const calls = await planForGoal(goal, current, gap, remainingBudget);

    // 5. For each tool call, REUSE the same kill-switch + daily-cap + status
    //    blocks already in handleDispatch(). Inject parent_run_id pointing at
    //    a new orchestrator run linked to this goal. requires_approval is
    //    inherited from TOOL_TO_AGENT[tool].requiresApproval — unchanged.
    const parent = await createParentRun({ trigger: 'cron', goal_id: goal.id });
    for (const c of calls) await dispatchChild(c, parent, goal);

    // 6. Insert agent_goal_runs row with parent_run_id + actions_dispatched.
    // 7. UPDATE agent_goals SET current_value, last_evaluated_at, spent_eur.
  }
  return jsonResp({ evaluated: goals.length });
}
```

Idempotency: cron worker takes a `pg_advisory_xact_lock(hashtext('run_goals'))`
and sets `last_evaluated_at` — a second invocation on the same UTC day skips
goals already evaluated within 12 h.

---

## 5. Cron / trigger

Pattern follows `supabase/migrations/20260502150000_demo_rate_limit_cleanup_cron.sql`
and `…/20260424010000_scheduled_publisher.sql`.

- Extension: `pg_cron` (already in use).
- Job name: `agent-goal-mode-daily`.
- Schedule: **`0 4 * * *` (04:00 UTC)**. Picked because (a) after the
  `demo-rate-limit-cleanup` 03:00 job, (b) before EU business hours so morning
  approvals are fresh in the user's queue, (c) ad reporting APIs have
  yesterday's numbers settled.
- Body: `SELECT net.http_post('${SUPABASE_URL}/functions/v1/orchestrator/run_goals', …, headers => 'Bearer ${service_role}')`.
- Idempotency: advisory lock + `last_evaluated_at` filter as above.

---

## 6. UI surfaces

| screen | change | spec |
| --- | --- | --- |
| `src/screens/HomeScreen.tsx` | New `GoalModeTile` between `<AgentActivityTile />` and the stats grid (line ~395). | Pulls the single active goal from `useActiveGoal(orgId)`. Renders title, progress bar (`current_value / target_value`), spend bar (`spent_eur / budget_eur`), and a "Goedkeuringen wachten (n)" pill linking to `MultiAgentScreen` filtered by `goal_id`. Tap → new `GoalDetailScreen`. |
| `src/screens/AMOSHubScreen.tsx` | New module entry in `COMING_MODULES` adjacent to `multiagent` (line ~304). | `id:'goalmode'`, route `'GoalMode'`, gradient `['#EA580C','#F97316']`, status `'beta'`. |
| `src/screens/MarketingStrategyScreen.tsx` | Add a "Activeer Goal Mode" CTA on the Step 3 (Autonomy) summary screen. | Pre-fills `agent_goals` from the strategy: `metric=primary_goal`, `budget_eur=monthly_budget*3`, `period_*` = current quarter, `agent_kinds` = active `channels`. |
| `src/screens/GoalSetupScreen.tsx` (new) | 3-step wizard: pick metric, set target + budget, pick agents. | Mirrors `MarketingStrategyScreen` step UX (`STEP_TITLES`, `progressDot`). Final step writes one row to `agent_goals` with status `draft`, then a confirm button flips it to `active`. |
| `src/screens/GoalDetailScreen.tsx` (new) | Read-only view of one goal. | Big metric ring, daily-eval timeline from `agent_goal_runs`, list of child `agent_runs` grouped by day, "Pause" / "Archive" actions for admins. |
| `src/screens/MultiAgentScreen.tsx` | Add an optional `goalId` filter param. | When set, only show runs whose `parent_run_id` traces back to that goal (one extra `.in('parent_run_id', goalRunIds)` clause). |

No design system additions — all components reuse existing `themedStyles`, `subtleShadow`, gradient cards.

---

## 7. Approval delegation

The plumbing already exists: `TOOL_TO_AGENT[…].requiresApproval` flips
`agent_runs.status` to `'awaiting_approval'`, and `handleApprove()` releases it.
Goal Mode does **not** change that contract. It only feeds different `input.budget_eur`
values into the same dispatch.

Recommended new role-based thresholds (stored in `agent_goals.config.approval_thresholds`,
fall back to org defaults):

| role | auto-approve up to | over → `awaiting_approval` |
| --- | --- | --- |
| `member` | €0 | always |
| `admin` | €100 / run, €500 / day | over either cap |
| `owner` | €500 / run, €2 000 / day | over either cap |

The orchestrator pre-checks the cap before flipping `requires_approval=true`. A
member can still *trigger* Goal Mode but every paid run sits in their queue.

---

## 8. Risks & open questions

1. **No `leads` table.** No migration matches `*lead*`. We currently proxy "leads"
   via `go_event_attendees` rows with `source IN ('form','qr_scan')` — this misses
   organic web leads and conflates events with broader demand. **Open:** ship
   `agent_goals` with `metric IN ('event_attendees','revenue_eur','posts_published','roas','followers')`
   only, and gate `metric='leads'` behind a future `go_leads` table.
2. **Kill switch ↔ goal stalls.** `agents.config.paused === true` already short-circuits
   to `status='blocked'` in `handleDispatch`. If all eligible agents for a goal are paused,
   the goal silently misses target. **Mitigation:** if 3 consecutive `agent_goal_runs`
   end with zero non-blocked dispatches, the goal auto-flips to `paused` and notifies the owner.
3. **Attribution.** `campaign_revenue.source` has 6 enums but no `goal_id` link. ROAS
   per goal is approximate. **Open:** add an optional `agent_goals_id UUID` column to
   `campaign_costs` + `campaign_revenue` so spend & revenue can be summed per goal.
   Out of scope for v1; do during ROAS hardening.
4. **Multi-org users / org switching.** `agent_goals` is `organization_id`-scoped, but
   `go_marketing_strategy` is `user_id`-scoped. A user with two orgs can have two
   strategies but should see two distinct Goal Mode tiles. **Open:** does
   `useActiveGoal()` hard-bind to the current `useCurrentOrg()` context? Yes —
   match the `useProductIssues` hook pattern.
5. **Offline drafts.** Goal wizard saved as `draft` row works offline via
   TanStack Query optimistic update, but activation must hit the network so the
   cron worker sees it the next day.
6. **Cost runaway from cron.** The new `/run_goals` route calls OpenAI for every
   active goal every day. Cap at 1 planner call per goal per day; reuse the
   existing `agents.config.daily_token_cap` limit for the orchestrator agent itself.
7. **Time-zone drift.** `period_start/end` are `DATE`, cron runs at 04:00 UTC.
   Users in Casablanca (UTC+1) entering "Q3" expect Jul-1 → Sep-30 local. Store
   periods as DATE in user-local TZ, evaluate with `>=` against `(now() AT TIME ZONE org.timezone)::date`.

---

## 9. Build estimate (punch-list)

| file | action | effort |
| --- | --- | --- |
| `supabase/migrations/2026XXXXXXXXXX_agent_goals.sql` | create `agent_goals` + `agent_goal_runs` + RLS + transition trigger + partial unique index | **M** (~1 day) |
| `supabase/migrations/2026XXXXXXXXXX_agent_goal_mode_cron.sql` | `pg_cron` job calling `/orchestrator/run_goals` | **S** (~2 h) |
| `supabase/functions/orchestrator/index.ts` | add `handleRunGoals()`, `computeMetric()`, `planForGoal()`, route wiring | **L** (~2 days) |
| `src/hooks/useAgentGoals.ts` (new) | TanStack hooks: `useActiveGoal`, `useGoalRuns`, `useCreateGoal`, `useTransitionGoal` | **M** (~1 day) |
| `src/screens/GoalSetupScreen.tsx` (new) | 3-step wizard | **M** (~1 day) |
| `src/screens/GoalDetailScreen.tsx` (new) | read-only progress + history | **M** (~1 day) |
| `src/components/GoalModeTile.tsx` (new) | home-screen tile | **S** (~3 h) |
| `src/screens/HomeScreen.tsx` | mount `<GoalModeTile />`, l10n keys | **S** (~1 h) |
| `src/screens/AMOSHubScreen.tsx` | add hub module entry | **S** (~30 min) |
| `src/screens/MarketingStrategyScreen.tsx` | "Activeer Goal Mode" CTA on autonomy step | **S** (~2 h) |
| `src/screens/MultiAgentScreen.tsx` | optional `goalId` filter | **S** (~2 h) |
| `src/types/index.ts` (or equivalent) | navigator types `GoalSetup`, `GoalDetail` | **S** (~30 min) |
| `App.tsx` | register two new screens | **S** (~15 min) |
| **Total** | | **~7–8 dev-days** |

S = ≤4 h, M = ≤1 day, L = >1 day.

---

## 10. Out of scope (v1)

- Web counterpart in `web/` (mobile-first ship; port follows the
  `feedback_mobile_features_to_web.md` rule once stable).
- Multi-metric goals (each row is single-metric for v1).
- Cross-org goal templates.
- Goal Mode for non-marketing tenants (Ignite, Finance) — hard-bind to AMOS for now.
