-- ============================================================
-- Content Hubs: Products, Team Directory, Organization Profile
-- ============================================================

-- ── go_products ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.go_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'product' CHECK (category IN ('product', 'service', 'solution')),
  image_url TEXT,
  price TEXT DEFAULT '',
  usps TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  website_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.go_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products"
  ON public.go_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products"
  ON public.go_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON public.go_products FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON public.go_products FOR DELETE
  USING (auth.uid() = user_id);

-- ── go_team_directory ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.go_team_directory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  linkedin_url TEXT,
  bio TEXT DEFAULT '',
  expertise TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.go_team_directory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team"
  ON public.go_team_directory FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own team"
  ON public.go_team_directory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own team"
  ON public.go_team_directory FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own team"
  ON public.go_team_directory FOR DELETE
  USING (auth.uid() = user_id);

-- ── go_organization ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.go_organization (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL DEFAULT '',
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  elevator_pitch TEXT DEFAULT '',
  logo_url TEXT,
  website TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  founded_year TEXT DEFAULT '',
  team_size TEXT DEFAULT '',
  location TEXT DEFAULT '',
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  social_links JSONB DEFAULT '{}',
  media_kit_url TEXT,
  boilerplate TEXT DEFAULT '',
  client_logos TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.go_organization ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organization"
  ON public.go_organization FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own organization"
  ON public.go_organization FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own organization"
  ON public.go_organization FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own organization"
  ON public.go_organization FOR DELETE
  USING (auth.uid() = user_id);
