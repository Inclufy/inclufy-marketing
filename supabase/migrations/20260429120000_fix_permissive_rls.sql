-- =============================================================================
-- Security fix: replace USING (true) policies with tenant-scoped policies
-- Reason: api_keys and organization_members were globally readable to any
-- authenticated user, leaking secrets and cross-tenant membership.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. api_keys: only members of the owning organization may read
--    Falls back to user_id ownership if api_keys has user_id column.
--    Uses dynamic detection so the migration is safe regardless of schema.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS api_keys_select_auth ON public.api_keys;

DO $$
DECLARE
  has_org_id  boolean;
  has_user_id boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'api_keys' AND column_name = 'organization_id'
  ) INTO has_org_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'api_keys' AND column_name = 'user_id'
  ) INTO has_user_id;

  IF has_org_id THEN
    EXECUTE $POL$
      CREATE POLICY api_keys_select_own_org ON public.api_keys
        FOR SELECT TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.user_id = auth.uid()
              AND om.organization_id = api_keys.organization_id
          )
        )
    $POL$;
  ELSIF has_user_id THEN
    EXECUTE $POL$
      CREATE POLICY api_keys_select_own ON public.api_keys
        FOR SELECT TO authenticated
        USING (user_id = auth.uid())
    $POL$;
  ELSE
    -- No tenant column: deny by default; service-role bypasses RLS for backend access.
    EXECUTE $POL$
      CREATE POLICY api_keys_deny_all ON public.api_keys
        FOR SELECT TO authenticated
        USING (false)
    $POL$;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. organization_members: only members of the same org may see each other
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS org_members_select_auth ON public.organization_members;

CREATE POLICY org_members_select_same_org ON public.organization_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members self
      WHERE self.user_id = auth.uid()
        AND self.organization_id = organization_members.organization_id
    )
  );
