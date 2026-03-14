-- Fix: Add user_id to media_assets + missing RLS policies

-- media_assets: add user_id column if missing
ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own media_assets') THEN
    CREATE POLICY "Users manage own media_assets" ON public.media_assets FOR ALL
      USING (user_id = auth.uid() OR user_id IS NULL) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- journeys: add user_id if missing + RLS
ALTER TABLE public.journeys ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.journeys ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own journeys') THEN
    CREATE POLICY "Users manage own journeys" ON public.journeys FOR ALL
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- social_accounts: add user_id if missing + RLS
ALTER TABLE public.social_accounts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own social_accounts') THEN
    CREATE POLICY "Users manage own social_accounts" ON public.social_accounts FOR ALL
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
