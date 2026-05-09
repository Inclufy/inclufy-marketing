-- ============================================================================
-- agent_goals — Tier-2 Goal Mode tables for AMOS Multi-Agent System.
--
-- Companion to: supabase/migrations/20260509060000_multi_agent_system.sql
-- Design doc:   docs/GOAL_MODE_DESIGN.md (sections 2 + 3)
--
-- A user-set quarterly outcome (e.g. "+25% revenue in Q3, max €5 000 spend")
-- evaluated daily by the orchestrator cron worker (see companion migration
-- 20260509073500_agent_goal_mode_cron.sql). Every dispatched action still
-- routes through the existing agent_runs.requires_approval gate.
--
-- Two tables:
--   agent_goals     — one row per goal (org-scoped, time-boxed, status FSM)
--   agent_goal_runs — one row per daily evaluation (history + dispatch trail)
--
-- IMPORTANT — `metric` CHECK does NOT include 'leads'. Per design §7 risk #1
-- there is no `go_leads` table yet; gating that metric until one exists.
-- ============================================================================

-- ─── agent_goals ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_goals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by_user    UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  title              TEXT NOT NULL,

  -- Allowed metrics. 'leads' deliberately excluded until a real go_leads table
  -- is shipped (design §7 risk #1).
  metric             TEXT NOT NULL
                       CHECK (metric IN (
                         'event_attendees',
                         'revenue_eur',
                         'posts_published',
                         'roas',
                         'followers'
                       )),

  target_value       NUMERIC(14,2) NOT NULL,
  target_kind        TEXT NOT NULL
                       CHECK (target_kind IN ('absolute','delta_pct','delta_abs')),

  -- Snapshot of the metric at activation (used for delta_pct / delta_abs).
  baseline_value     NUMERIC(14,2),

  period_start       DATE NOT NULL,
  period_end         DATE NOT NULL,

  budget_eur         NUMERIC(10,2) NOT NULL DEFAULT 0,
  spent_eur          NUMERIC(10,2) NOT NULL DEFAULT 0,

  current_value      NUMERIC(14,2),
  last_evaluated_at  TIMESTAMPTZ,

  status             TEXT NOT NULL DEFAULT 'draft'
                       CHECK (status IN ('draft','active','paused','met','missed','archived')),

  -- Mirrors go_marketing_strategy.autonomy_level.
  autonomy_level     TEXT NOT NULL DEFAULT 'balanced'
                       CHECK (autonomy_level IN ('conservative','balanced','aggressive')),

  -- Which agent kinds may be dispatched for this goal (e.g. {ads,content,social}).
  agent_kinds        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- Per-channel split, daily caps, kill-switch flag, approval thresholds, etc.
  config             JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_goals_org_status
  ON public.agent_goals(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_agent_goals_status_period_end
  ON public.agent_goals(status, period_end);

-- Only ONE active goal per (organization_id, metric). Enforced as a partial
-- unique index so draft / paused / met / missed / archived rows can coexist.
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_goals_one_active_per_metric
  ON public.agent_goals(organization_id, metric)
  WHERE status = 'active';

COMMENT ON TABLE public.agent_goals IS
  'Tier-2 Goal Mode: org-scoped, time-boxed numeric targets evaluated daily by the orchestrator cron worker. One active goal per (org, metric).';

-- ─── agent_goal_runs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_goal_runs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id             UUID NOT NULL REFERENCES public.agent_goals(id) ON DELETE CASCADE,

  evaluated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_value       NUMERIC(14,2),
  gap_to_target       NUMERIC(14,2),

  -- [{tool, run_id, budget_eur}, ...]
  actions_dispatched  JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Optional pointer to the orchestrator's parent agent_run row.
  parent_run_id       UUID REFERENCES public.agent_runs(id) ON DELETE SET NULL,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_goal_runs_goal_evaluated
  ON public.agent_goal_runs(goal_id, evaluated_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_goal_runs_parent
  ON public.agent_goal_runs(parent_run_id) WHERE parent_run_id IS NOT NULL;

COMMENT ON TABLE public.agent_goal_runs IS
  'Daily evaluation history per agent_goal: current value, gap, dispatched actions, link to orchestrator parent run.';

-- ─── updated_at trigger ────────────────────────────────────────────────────
-- Reuse public.tg_agents_set_updated_at() defined in 20260509060000.
DROP TRIGGER IF EXISTS agent_goals_set_updated_at ON public.agent_goals;
CREATE TRIGGER agent_goals_set_updated_at
  BEFORE UPDATE ON public.agent_goals
  FOR EACH ROW EXECUTE FUNCTION public.tg_agents_set_updated_at();

-- ─── Status transition trigger (FSM enforcement) ──────────────────────────
-- Allowed transitions per design §3:
--   draft   -> active                       (admin/owner)
--   active  -> paused | met | missed        (admin/owner OR cron worker)
--   paused  -> active | archived            (admin/owner)
--   met     -> archived                     (any member)
--   missed  -> archived                     (any member)
--   any     -> draft                        FORBIDDEN once activated
--
-- Service-role (cron worker) bypasses the check entirely so it can flip
-- 'active' -> 'met' / 'missed' on schedule.
CREATE OR REPLACE FUNCTION public.tg_agent_goals_check_status_transition()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- No-op when status hasn't changed.
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Service-role bypass — cron worker needs to flip met/missed.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Forbid reverting to 'draft' once activated.
  IF NEW.status = 'draft' AND OLD.status <> 'draft' THEN
    RAISE EXCEPTION
      'Invalid agent_goals status transition: % -> draft is forbidden once activated',
      OLD.status;
  END IF;

  -- Enumerate allowed transitions.
  IF (OLD.status = 'draft'   AND NEW.status = 'active')
  OR (OLD.status = 'active'  AND NEW.status IN ('paused','met','missed'))
  OR (OLD.status = 'paused'  AND NEW.status IN ('active','archived'))
  OR (OLD.status = 'met'     AND NEW.status = 'archived')
  OR (OLD.status = 'missed'  AND NEW.status = 'archived')
  THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION
    'Invalid agent_goals status transition: % -> %',
    OLD.status, NEW.status;
END;
$$;

DROP TRIGGER IF EXISTS agent_goals_check_status_transition ON public.agent_goals;
CREATE TRIGGER agent_goals_check_status_transition
  BEFORE UPDATE OF status ON public.agent_goals
  FOR EACH ROW EXECUTE FUNCTION public.tg_agent_goals_check_status_transition();

-- ─── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.agent_goals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_goal_runs  ENABLE ROW LEVEL SECURITY;

-- agent_goals: org members read; admin/owner write; service role full.
DO $$ BEGIN
  CREATE POLICY "Org members read agent_goals"
    ON public.agent_goals FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = agent_goals.organization_id
           AND om.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Org admins insert agent_goals"
    ON public.agent_goals FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = agent_goals.organization_id
           AND om.user_id = auth.uid()
           AND om.role IN ('admin','owner')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Org admins update agent_goals"
    ON public.agent_goals FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = agent_goals.organization_id
           AND om.user_id = auth.uid()
           AND om.role IN ('admin','owner')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = agent_goals.organization_id
           AND om.user_id = auth.uid()
           AND om.role IN ('admin','owner')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Org admins delete agent_goals"
    ON public.agent_goals FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = agent_goals.organization_id
           AND om.user_id = auth.uid()
           AND om.role IN ('admin','owner')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access on agent_goals"
    ON public.agent_goals FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- agent_goal_runs: members read via parent goal's organization_id; service role full.
DO $$ BEGIN
  CREATE POLICY "Org members read agent_goal_runs"
    ON public.agent_goal_runs FOR SELECT
    USING (
      EXISTS (
        SELECT 1
          FROM public.agent_goals g
          JOIN public.organization_members om
            ON om.organization_id = g.organization_id
         WHERE g.id = agent_goal_runs.goal_id
           AND om.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access on agent_goal_runs"
    ON public.agent_goal_runs FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

NOTIFY pgrst, 'reload schema';
