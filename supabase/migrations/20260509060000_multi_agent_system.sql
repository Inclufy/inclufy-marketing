-- ============================================================================
-- multi_agent_system — runtime tables for the AMOS Multi-Agent System.
--
-- Backs MultiAgentScreen.tsx + the new orchestrator + agent-ads edge functions.
-- Mirrors the org-scoped RLS pattern used by product_issues (organizations +
-- organization_members), not the legacy per-user pattern of campaign_costs.
--
-- Three tables:
--   agents          — registered agents per organization (config + status)
--   agent_runs      — every dispatched run (input/output/status/cost)
--   agent_run_messages  — inter-agent + agent-to-orchestrator messages within a run
-- ============================================================================

-- ─── agents ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Stable identifier matching MultiAgentScreen.AGENTS[].id ('content','social','ads','analytics','lead')
  kind            TEXT NOT NULL
                    CHECK (kind IN ('content','social','ads','analytics','lead','orchestrator')),

  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',

  -- 'active' = wired to a real backend, 'beta' = partial, 'coming' = stub
  status          TEXT NOT NULL DEFAULT 'coming'
                    CHECK (status IN ('active','beta','coming','paused','disabled')),

  -- Per-agent runtime config: model, temperature, channel constraints, budget caps,
  -- LMDP-gated capabilities, etc. The orchestrator reads this on every dispatch.
  config          JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Capabilities flag set — used by orchestrator tool-routing.
  capabilities    JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_agents_org_status
  ON public.agents(organization_id, status);

COMMENT ON TABLE public.agents IS
  'Per-org registered AI agents (content, social, ads, analytics, lead, orchestrator). Backs MultiAgentScreen + orchestrator dispatch.';

-- ─── agent_runs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  agent_id          UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,

  -- Optional parent run when an orchestrator dispatches to a sub-agent.
  parent_run_id     UUID REFERENCES public.agent_runs(id) ON DELETE SET NULL,

  -- Who/what initiated. user_id is null for cron-triggered runs.
  initiated_by_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trigger           TEXT NOT NULL DEFAULT 'manual'
                      CHECK (trigger IN ('manual','automation','cron','agent_chain','api')),

  -- Goal/input as free-form structured data.
  goal              TEXT NOT NULL DEFAULT '',
  input             JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Output + intermediate state (tool calls, partial results).
  output            JSONB NOT NULL DEFAULT '{}'::jsonb,
  tool_calls        JSONB NOT NULL DEFAULT '[]'::jsonb,

  status            TEXT NOT NULL DEFAULT 'queued'
                      CHECK (status IN (
                        'queued','running','awaiting_approval',
                        'completed','failed','cancelled','blocked'
                      )),

  -- Approval gate — agent runs that mutate spend / publish must wait.
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by_user  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,

  error_message     TEXT,

  -- Cost + token tracking.
  prompt_tokens     INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd          NUMERIC(10,4) NOT NULL DEFAULT 0,

  -- Optional pointers into related app entities so the UI can deep-link.
  related_post_id     UUID,
  related_campaign_id UUID,
  related_event_id    UUID,

  started_at        TIMESTAMPTZ,
  finished_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_org_status_created
  ON public.agent_runs(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_created
  ON public.agent_runs(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_parent
  ON public.agent_runs(parent_run_id) WHERE parent_run_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_runs_awaiting_approval
  ON public.agent_runs(organization_id, requires_approval, status)
  WHERE status = 'awaiting_approval';

COMMENT ON TABLE public.agent_runs IS
  'Every dispatched agent execution. Stores goal, input, output, tool calls, cost, approval state, and links to related app entities.';

-- ─── agent_run_messages ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.agent_run_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,

  role        TEXT NOT NULL
                CHECK (role IN ('system','user','assistant','tool','agent')),
  -- For inter-agent traffic. Null for system/user/assistant messages.
  from_agent  TEXT,
  to_agent    TEXT,

  content     TEXT NOT NULL DEFAULT '',
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_run_messages_run_created
  ON public.agent_run_messages(run_id, created_at);

COMMENT ON TABLE public.agent_run_messages IS
  'Trace of LLM messages and inter-agent payloads within an agent_run. Auditable timeline.';

-- ─── updated_at triggers ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.tg_agents_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS agents_set_updated_at ON public.agents;
CREATE TRIGGER agents_set_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.tg_agents_set_updated_at();

DROP TRIGGER IF EXISTS agent_runs_set_updated_at ON public.agent_runs;
CREATE TRIGGER agent_runs_set_updated_at
  BEFORE UPDATE ON public.agent_runs
  FOR EACH ROW EXECUTE FUNCTION public.tg_agents_set_updated_at();

-- ─── RLS ───────────────────────────────────────────────────────────────────
ALTER TABLE public.agents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_run_messages  ENABLE ROW LEVEL SECURITY;

-- agents: members read; admins/owners write; service-role full.
DO $$ BEGIN
  CREATE POLICY "Org members read agents"
    ON public.agents FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = agents.organization_id
           AND om.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Org admins write agents"
    ON public.agents FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = agents.organization_id
           AND om.user_id = auth.uid()
           AND om.role IN ('admin','owner')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = agents.organization_id
           AND om.user_id = auth.uid()
           AND om.role IN ('admin','owner')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access on agents"
    ON public.agents FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- agent_runs: members read; members can insert their own; only the initiator or
-- an admin/owner can approve. Service-role full (used by orchestrator).
DO $$ BEGIN
  CREATE POLICY "Org members read agent_runs"
    ON public.agent_runs FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = agent_runs.organization_id
           AND om.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Org members insert agent_runs"
    ON public.agent_runs FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = agent_runs.organization_id
           AND om.user_id = auth.uid()
      )
      AND (initiated_by_user IS NULL OR initiated_by_user = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Org members update own agent_runs (approval)"
    ON public.agent_runs FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = agent_runs.organization_id
           AND om.user_id = auth.uid()
           AND (om.role IN ('admin','owner') OR agent_runs.initiated_by_user = auth.uid())
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = agent_runs.organization_id
           AND om.user_id = auth.uid()
           AND (om.role IN ('admin','owner') OR agent_runs.initiated_by_user = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access on agent_runs"
    ON public.agent_runs FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- agent_run_messages: members read via parent run org; service-role write.
DO $$ BEGIN
  CREATE POLICY "Org members read agent_run_messages"
    ON public.agent_run_messages FOR SELECT
    USING (
      EXISTS (
        SELECT 1
          FROM public.agent_runs ar
          JOIN public.organization_members om
            ON om.organization_id = ar.organization_id
         WHERE ar.id = agent_run_messages.run_id
           AND om.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access on agent_run_messages"
    ON public.agent_run_messages FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Seed default agents per org ───────────────────────────────────────────
-- For every existing org, insert the 5 stub agents at status='coming' (and
-- 'beta' for content) so the UI immediately reflects DB state. Idempotent
-- via UNIQUE(organization_id, kind).
INSERT INTO public.agents (organization_id, kind, name, description, status, capabilities)
SELECT o.id, 'content', 'Content Agent',
       'Generates and optimizes marketing content across all channels using brand voice and strategy.',
       'beta',
       '["blog","social_post","email_copy","ad_copy"]'::jsonb
  FROM public.organizations o
ON CONFLICT (organization_id, kind) DO NOTHING;

INSERT INTO public.agents (organization_id, kind, name, description, status, capabilities)
SELECT o.id, 'social', 'Social Agent',
       'Manages social media scheduling, engagement and community interactions.',
       'beta',
       '["auto_schedule","reply_management","trend_detection","hashtag_strategy"]'::jsonb
  FROM public.organizations o
ON CONFLICT (organization_id, kind) DO NOTHING;

INSERT INTO public.agents (organization_id, kind, name, description, status, capabilities)
SELECT o.id, 'ads', 'Ads Agent',
       'Promotes top posts, drafts campaign briefs for LinkedIn / Google / Meta, paces budgets and reports ROAS.',
       'coming',
       '["post_boosting","audience_targeting","budget_pacing","roas_reporting"]'::jsonb
  FROM public.organizations o
ON CONFLICT (organization_id, kind) DO NOTHING;

INSERT INTO public.agents (organization_id, kind, name, description, status, capabilities)
SELECT o.id, 'analytics', 'Analytics Agent',
       'Monitors performance, detects patterns and generates actionable insights in real-time.',
       'coming',
       '["roi_tracking","ab_analysis","anomaly_detection","weekly_reports"]'::jsonb
  FROM public.organizations o
ON CONFLICT (organization_id, kind) DO NOTHING;

INSERT INTO public.agents (organization_id, kind, name, description, status, capabilities)
SELECT o.id, 'lead', 'Lead Agent',
       'Identifies, scores and nurtures leads through intelligent automation sequences.',
       'coming',
       '["lead_scoring","email_sequences","crm_sync","conversion_tracking"]'::jsonb
  FROM public.organizations o
ON CONFLICT (organization_id, kind) DO NOTHING;

NOTIFY pgrst, 'reload schema';
