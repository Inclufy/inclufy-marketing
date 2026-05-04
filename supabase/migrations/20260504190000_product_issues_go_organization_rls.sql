-- ============================================================================
-- Update RLS on product_issues to also accept users whose tenant identity
-- is their go_organization row (the per-user company profile in AMOS).
--
-- Schema reality check (verified against the live mpxkugfqzmxydxnlxqoj DB,
-- 2026-05-04): go_organization has NO organization_id column. Each user
-- has exactly one go_organization row, and `go_organization.id` IS that
-- user's effective tenant identifier. The TypeScript interface declared
-- `organization_id?: string` but no migration ever adds that column.
--
-- TestFlight smoke-test 2026-05-04 hit "Geen organisatie" because the user
-- doesn't have an organization_members row but does have a go_organization
-- row. We add a parallel OR-clause so AMOS-self-signup users can also
-- insert/read product_issues, with their go_organization.id used as the
-- product_issues.organization_id value.
--
-- We also drop the strict FK to organizations(id) because go_organization.id
-- is not a row in organizations — without dropping the FK, inserts would
-- still fail at constraint-check time.
-- ============================================================================

-- ─── Drop FK so go_organization.id values are accepted ─────────────────
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT conname INTO fk_name
    FROM pg_constraint
   WHERE conrelid = 'public.product_issues'::regclass
     AND contype = 'f'
     AND pg_get_constraintdef(oid) ILIKE '%REFERENCES public.organizations(id)%';
  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.product_issues DROP CONSTRAINT %I', fk_name);
    RAISE NOTICE 'Dropped FK % on product_issues', fk_name;
  END IF;
END $$;

-- ─── product_issues policies ────────────────────────────────────────────
DROP POLICY IF EXISTS "Org members read product_issues" ON public.product_issues;
CREATE POLICY "Org members read product_issues"
  ON public.product_issues
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
       WHERE om.organization_id = product_issues.organization_id
         AND om.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.go_organization go
       WHERE go.id = product_issues.organization_id
         AND go.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Org members insert product_issues" ON public.product_issues;
CREATE POLICY "Org members insert product_issues"
  ON public.product_issues
  FOR INSERT
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.organization_members om
         WHERE om.organization_id = product_issues.organization_id
           AND om.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.go_organization go
         WHERE go.id = product_issues.organization_id
           AND go.user_id = auth.uid()
      )
    )
    AND (reporter_user_id IS NULL OR reporter_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Org admins update product_issues" ON public.product_issues;
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
    OR EXISTS (
      -- AMOS self-signup: the go_organization row's owner is the de-facto
      -- admin (no role column).
      SELECT 1 FROM public.go_organization go
       WHERE go.id = product_issues.organization_id
         AND go.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
       WHERE om.organization_id = product_issues.organization_id
         AND om.user_id = auth.uid()
         AND om.role IN ('admin','owner')
    )
    OR EXISTS (
      SELECT 1 FROM public.go_organization go
       WHERE go.id = product_issues.organization_id
         AND go.user_id = auth.uid()
    )
  );

-- ─── product_issue_comments policies ────────────────────────────────────
DROP POLICY IF EXISTS "Org members read product_issue_comments" ON public.product_issue_comments;
CREATE POLICY "Org members read product_issue_comments"
  ON public.product_issue_comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
        FROM public.product_issues pi
       WHERE pi.id = product_issue_comments.issue_id
         AND (
           EXISTS (
             SELECT 1 FROM public.organization_members om
              WHERE om.organization_id = pi.organization_id
                AND om.user_id = auth.uid()
           )
           OR EXISTS (
             SELECT 1 FROM public.go_organization go
              WHERE go.id = pi.organization_id
                AND go.user_id = auth.uid()
           )
         )
    )
  );

DROP POLICY IF EXISTS "Org members insert product_issue_comments" ON public.product_issue_comments;
CREATE POLICY "Org members insert product_issue_comments"
  ON public.product_issue_comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
        FROM public.product_issues pi
       WHERE pi.id = product_issue_comments.issue_id
         AND (
           EXISTS (
             SELECT 1 FROM public.organization_members om
              WHERE om.organization_id = pi.organization_id
                AND om.user_id = auth.uid()
           )
           OR EXISTS (
             SELECT 1 FROM public.go_organization go
              WHERE go.id = pi.organization_id
                AND go.user_id = auth.uid()
           )
         )
    )
  );

NOTIFY pgrst, 'reload schema';
