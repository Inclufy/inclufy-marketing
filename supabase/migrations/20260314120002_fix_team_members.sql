-- Fix team_members RLS infinite recursion

-- Drop ALL policies on team_members (use pg_catalog to find them)
DO $$
DECLARE
  pol_name TEXT;
BEGIN
  FOR pol_name IN
    SELECT policyname FROM pg_policies WHERE tablename = 'team_members' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.team_members', pol_name);
    RAISE NOTICE 'Dropped policy: %', pol_name;
  END LOOP;
END $$;

-- Disable RLS temporarily
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;

-- Ensure user_id column exists
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Re-enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create simple policy
CREATE POLICY "Users manage own team_members" ON public.team_members FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Grant access
GRANT ALL ON public.team_members TO authenticated;
GRANT SELECT ON public.team_members TO anon;

NOTIFY pgrst, 'reload schema';
