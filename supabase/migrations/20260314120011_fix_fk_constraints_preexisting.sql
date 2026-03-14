-- Fix FK constraints on pre-existing tables that reference public.users instead of auth.users
-- Also fix NOT NULL constraints on columns not used by the app

-- 1. strategic_plans: FK user_id → public.users should be auth.users
DO $$ BEGIN
  ALTER TABLE public.strategic_plans DROP CONSTRAINT IF EXISTS strategic_plans_user_id_fkey;
  ALTER TABLE public.strategic_plans DROP CONSTRAINT IF EXISTS fk_strategic_plans_user_id;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not drop strategic_plans FK: %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER TABLE public.strategic_plans
    ADD CONSTRAINT strategic_plans_user_id_auth_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'FK strategic_plans → auth.users already exists';
WHEN others THEN
  RAISE NOTICE 'Could not add strategic_plans FK: %', SQLERRM;
END $$;

-- 2. revenue_opportunities: FK user_id → public.users should be auth.users
DO $$ BEGIN
  ALTER TABLE public.revenue_opportunities DROP CONSTRAINT IF EXISTS revenue_opportunities_user_id_fkey;
  ALTER TABLE public.revenue_opportunities DROP CONSTRAINT IF EXISTS fk_revenue_opportunities_user_id;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not drop revenue_opportunities FK: %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER TABLE public.revenue_opportunities
    ADD CONSTRAINT revenue_opportunities_user_id_auth_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'FK revenue_opportunities → auth.users already exists';
WHEN others THEN
  RAISE NOTICE 'Could not add revenue_opportunities FK: %', SQLERRM;
END $$;

-- 3. media_assets: make uploaded_by and team_id nullable (pre-existing NOT NULL constraints)
DO $$ BEGIN
  ALTER TABLE public.media_assets ALTER COLUMN uploaded_by DROP NOT NULL;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not alter media_assets.uploaded_by: %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER TABLE public.media_assets ALTER COLUMN team_id DROP NOT NULL;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not alter media_assets.team_id: %', SQLERRM;
END $$;

-- 4. social_accounts: make organization_id nullable if it exists
DO $$ BEGIN
  ALTER TABLE public.social_accounts ALTER COLUMN organization_id DROP NOT NULL;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not alter social_accounts.organization_id: %', SQLERRM;
END $$;

-- 5. revenue_predictions: fix FK if needed
DO $$ BEGIN
  ALTER TABLE public.revenue_predictions DROP CONSTRAINT IF EXISTS revenue_predictions_user_id_fkey;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not drop revenue_predictions FK: %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER TABLE public.revenue_predictions
    ADD CONSTRAINT revenue_predictions_user_id_auth_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'FK revenue_predictions → auth.users already exists';
WHEN others THEN
  RAISE NOTICE 'Could not add revenue_predictions FK: %', SQLERRM;
END $$;

-- 6. recommendations: fix FK if needed
DO $$ BEGIN
  ALTER TABLE public.recommendations DROP CONSTRAINT IF EXISTS recommendations_user_id_fkey;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not drop recommendations FK: %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER TABLE public.recommendations
    ADD CONSTRAINT recommendations_user_id_auth_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'FK recommendations → auth.users already exists';
WHEN others THEN
  RAISE NOTICE 'Could not add recommendations FK: %', SQLERRM;
END $$;

-- 7. customer_ltv: fix FK if needed
DO $$ BEGIN
  ALTER TABLE public.customer_ltv DROP CONSTRAINT IF EXISTS customer_ltv_user_id_fkey;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not drop customer_ltv FK: %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER TABLE public.customer_ltv
    ADD CONSTRAINT customer_ltv_user_id_auth_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'FK customer_ltv → auth.users already exists';
WHEN others THEN
  RAISE NOTICE 'Could not add customer_ltv FK: %', SQLERRM;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
