-- Fix pre-existing tables: add missing DEFAULT values and fix NOT NULL constraints

-- strategic_plans: id may lack DEFAULT
ALTER TABLE public.strategic_plans ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- media_assets: team_id NOT NULL but not used by app — make nullable
DO $$ BEGIN
  ALTER TABLE public.media_assets ALTER COLUMN team_id DROP NOT NULL;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not alter media_assets.team_id: %', SQLERRM;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
