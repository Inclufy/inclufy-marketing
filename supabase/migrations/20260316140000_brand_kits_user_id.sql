-- ─── Add user_id to brand_kits + RLS policies ──────────────────────────────

-- Add user_id column
ALTER TABLE public.brand_kits
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (safe re-run)
DROP POLICY IF EXISTS "Users can view own brand kits" ON public.brand_kits;
DROP POLICY IF EXISTS "Users can insert own brand kits" ON public.brand_kits;
DROP POLICY IF EXISTS "Users can update own brand kits" ON public.brand_kits;
DROP POLICY IF EXISTS "Users can delete own brand kits" ON public.brand_kits;

-- RLS policies: each user sees/manages only their own kits
CREATE POLICY "Users can view own brand kits"
  ON public.brand_kits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand kits"
  ON public.brand_kits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand kits"
  ON public.brand_kits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand kits"
  ON public.brand_kits FOR DELETE
  USING (auth.uid() = user_id);
