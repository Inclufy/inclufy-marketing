-- ============================================================================
-- product_issues — user-feedback + auto-CI captured issues for the Marketing
-- app (Phase 2c port).
--
-- Mirrors the Django ProductIssue (projextpal commit a1085d99) and the Finance
-- migration (inclufy-finance commit c3b601f). Schema column-names are
-- identical so a future cross-app aggregator can query all three uniformly.
--
-- Marketing uses `organization_members` (not `user_organizations`) for
-- membership; otherwise the RLS pattern is the same.
-- ============================================================================

-- ─── product_issues ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_issues (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id             UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reporter_user_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Module context (Marketing-specific): which area of the app
  module_context              TEXT,                  -- 'campaigns' | 'library' | 'studio' | 'whatsapp' | 'analytics' | 'oauth' | etc.
  related_entity_type         TEXT,                  -- 'post' | 'campaign' | 'library_zip' | 'persona' | etc.
  related_entity_id           UUID,                  -- pointer to that entity

  source                      TEXT NOT NULL DEFAULT 'user'
                                CHECK (source IN ('user','auto-test-ci','auto-test-runtime','agent-scan')),
  capture_method              TEXT NOT NULL DEFAULT 'manual_form'
                                CHECK (capture_method IN (
                                  'manual_form','paste_clipboard','upload',
                                  'auto_browser','auto_mobile_shake',
                                  'auto_ci','auto_runtime'
                                )),

  title                       TEXT NOT NULL,
  description                 TEXT NOT NULL DEFAULT '',
  reproduction_steps          TEXT NOT NULL DEFAULT '',
  expected_behavior           TEXT NOT NULL DEFAULT '',
  actual_behavior             TEXT NOT NULL DEFAULT '',
  error_trace                 TEXT NOT NULL DEFAULT '',
  environment                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  attachments                 JSONB NOT NULL DEFAULT '[]'::jsonb,
  category                    TEXT NOT NULL DEFAULT 'other'
                                CHECK (category IN (
                                  'ui','api','mobile','performance','security',
                                  'auth','data','integration','documentation','other'
                                )),

  classification              TEXT
                                CHECK (classification IS NULL OR classification IN (
                                  'bug','error','functionality','best-practice',
                                  'missing-feature','duplicate','user-error',
                                  'not-applicable'
                                )),
  severity                    TEXT
                                CHECK (severity IS NULL OR severity IN (
                                  'blocker','critical','major','minor','trivial'
                                )),
  priority                    TEXT
                                CHECK (priority IS NULL OR priority IN ('P0','P1','P2','P3')),
  agent_triage_result         JSONB NOT NULL DEFAULT '{}'::jsonb,
  triaged_at                  TIMESTAMPTZ,
  triaged_by                  TEXT,
  duplicate_of_id             UUID REFERENCES public.product_issues(id) ON DELETE SET NULL,

  reproduction_attempted_at   TIMESTAMPTZ,
  reproduction_result         TEXT NOT NULL DEFAULT 'not-attempted'
                                CHECK (reproduction_result IN (
                                  'not-attempted','reproduced','intermittent',
                                  'cannot-reproduce','not-applicable',
                                  'already-fixed','needs-data'
                                )),
  reproduction_log            JSONB NOT NULL DEFAULT '[]'::jsonb,
  reproduction_evidence       JSONB NOT NULL DEFAULT '[]'::jsonb,

  status                      TEXT NOT NULL DEFAULT 'new'
                                CHECK (status IN (
                                  'new','triaging','needs-info','accepted',
                                  'in-progress','resolved','wont-fix',
                                  'duplicate','closed'
                                )),
  assigned_to_user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  linked_pr_url               TEXT,
  resolved_at                 TIMESTAMPTZ,
  resolution_summary          TEXT NOT NULL DEFAULT '',

  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_issues_org_status_created
  ON public.product_issues(organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_issues_category_priority
  ON public.product_issues(category, priority);
CREATE INDEX IF NOT EXISTS idx_product_issues_source
  ON public.product_issues(source);
CREATE INDEX IF NOT EXISTS idx_product_issues_module
  ON public.product_issues(module_context)
  WHERE module_context IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_issues_reporter
  ON public.product_issues(reporter_user_id)
  WHERE reporter_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_issues_assigned
  ON public.product_issues(assigned_to_user_id)
  WHERE assigned_to_user_id IS NOT NULL;

COMMENT ON TABLE public.product_issues IS
  'Marketing-app product feedback + CI auto-issues. Mirrors projextpal product_issues.ProductIssue + Finance public.product_issues.';

-- ─── product_issue_comments ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_issue_comments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id        UUID NOT NULL REFERENCES public.product_issues(id) ON DELETE CASCADE,
  author          TEXT NOT NULL,
  body            TEXT NOT NULL,
  is_triage_step  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_issue_comments_issue_created
  ON public.product_issue_comments(issue_id, created_at);

COMMENT ON TABLE public.product_issue_comments IS
  'Thread of comments on a product_issue (human + agent triage trace).';

-- ─── updated_at trigger ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.tg_product_issues_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS product_issues_set_updated_at
  ON public.product_issues;
CREATE TRIGGER product_issues_set_updated_at
  BEFORE UPDATE ON public.product_issues
  FOR EACH ROW EXECUTE FUNCTION public.tg_product_issues_set_updated_at();

-- ─── RLS ───────────────────────────────────────────────────────────────────
-- Reading: org-members can see all issues for that org.
-- Inserting: any org-member can submit (own report).
-- Updating: admins/owners.
-- Service-role: full access (used by issue-triage-validator agent).
ALTER TABLE public.product_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_issue_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Org members read product_issues"
    ON public.product_issues
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = product_issues.organization_id
           AND om.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Org members insert product_issues"
    ON public.product_issues
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = product_issues.organization_id
           AND om.user_id = auth.uid()
      )
      AND (reporter_user_id IS NULL OR reporter_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Org admins update product_issues"
    ON public.product_issues
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = product_issues.organization_id
           AND om.user_id = auth.uid()
           AND om.role IN ('admin','owner')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = product_issues.organization_id
           AND om.user_id = auth.uid()
           AND om.role IN ('admin','owner')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access on product_issues"
    ON public.product_issues
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Org members read product_issue_comments"
    ON public.product_issue_comments
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
          FROM public.product_issues pi
          JOIN public.organization_members om
            ON om.organization_id = pi.organization_id
         WHERE pi.id = product_issue_comments.issue_id
           AND om.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Org members insert product_issue_comments"
    ON public.product_issue_comments
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1
          FROM public.product_issues pi
          JOIN public.organization_members om
            ON om.organization_id = pi.organization_id
         WHERE pi.id = product_issue_comments.issue_id
           AND om.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service role full access on product_issue_comments"
    ON public.product_issue_comments
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
