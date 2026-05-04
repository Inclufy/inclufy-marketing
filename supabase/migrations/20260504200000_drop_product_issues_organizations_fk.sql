-- ============================================================================
-- Drop the FK from product_issues.organization_id -> organizations(id).
--
-- The previous migration (20260504190000) tried to drop this FK but its
-- regex pattern looked for "public.organizations(id)" while Postgres stores
-- the constraint definition without the "public." schema prefix. As a
-- result the constraint stayed in place and TestFlight users with a
-- go_organization-derived org_id (which is NOT a row in organizations)
-- still hit:
--   "violates foreign key constraint product_issues_organization_id_fkey"
--
-- This migration drops the FK by its known auto-generated name and is
-- idempotent: if it doesn't exist, no-op.
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.product_issues'::regclass
       AND conname = 'product_issues_organization_id_fkey'
  ) THEN
    ALTER TABLE public.product_issues
      DROP CONSTRAINT product_issues_organization_id_fkey;
    RAISE NOTICE 'Dropped FK product_issues_organization_id_fkey';
  ELSE
    RAISE NOTICE 'FK product_issues_organization_id_fkey already absent';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
