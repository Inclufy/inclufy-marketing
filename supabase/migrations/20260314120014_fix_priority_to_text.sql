-- Migration: Change strategic_objectives.priority from INTEGER to TEXT
-- The code sends string values like 'critical', 'high', 'medium', 'low'
-- but the column was defined as INTEGER in an older migration.
-- Must drop constraints that reference the column first.

DO $$
DECLARE
  con RECORD;
BEGIN
  -- Drop all CHECK constraints on strategic_objectives that reference priority
  FOR con IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.strategic_objectives'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%priority%'
  LOOP
    EXECUTE format('ALTER TABLE public.strategic_objectives DROP CONSTRAINT %I', con.conname);
  END LOOP;

  -- Now change the column type
  ALTER TABLE public.strategic_objectives
    ALTER COLUMN priority DROP DEFAULT;
  ALTER TABLE public.strategic_objectives
    ALTER COLUMN priority TYPE TEXT USING priority::TEXT;
  ALTER TABLE public.strategic_objectives
    ALTER COLUMN priority SET DEFAULT 'medium';
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
