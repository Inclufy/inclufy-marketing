-- Brand Memory System: core tables for AI content generation context
-- Run in Supabase SQL Editor to create all brand memory tables

-- ═══════════════════════════════════════════════════════════════════
-- Table 1: brand_memory — Central brand identity store
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.brand_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core Identity
  brand_name TEXT NOT NULL DEFAULT '',
  legal_name TEXT NOT NULL DEFAULT '',
  brand_description TEXT NOT NULL DEFAULT '',
  mission TEXT NOT NULL DEFAULT '',
  vision TEXT NOT NULL DEFAULT '',
  tagline TEXT NOT NULL DEFAULT '',
  elevator_pitch TEXT NOT NULL DEFAULT '',
  positioning_statement TEXT NOT NULL DEFAULT '',

  -- Brand Characteristics
  brand_values TEXT[] DEFAULT '{}',
  brand_pillars TEXT[] DEFAULT '{}',
  archetypes TEXT[] DEFAULT '{}',

  -- Market Definition
  industries TEXT[] DEFAULT '{}',
  audiences TEXT[] DEFAULT '{}',
  regions TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{en}',

  -- Competitive Advantages
  usps TEXT[] DEFAULT '{}',
  differentiators TEXT[] DEFAULT '{}',
  proof_points TEXT[] DEFAULT '{}',

  -- Voice & Messaging
  tone_attributes JSONB DEFAULT '[]'::jsonb,
  messaging_dos TEXT NOT NULL DEFAULT '',
  messaging_donts TEXT NOT NULL DEFAULT '',
  preferred_vocabulary TEXT[] DEFAULT '{}',
  banned_phrases TEXT[] DEFAULT '{}',
  compliance_rules TEXT NOT NULL DEFAULT '',

  -- References
  urls TEXT[] DEFAULT '{}',

  -- Examples
  examples_good TEXT NOT NULL DEFAULT '',
  examples_poor TEXT NOT NULL DEFAULT '',
  test_prompt TEXT NOT NULL DEFAULT '',

  -- Extended fields (bridged from onboarding)
  competitors JSONB DEFAULT '[]'::jsonb,
  marketing_goals TEXT[] DEFAULT '{}',
  primary_color TEXT DEFAULT '#7c3aed',
  secondary_color TEXT DEFAULT '#ec4899',

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One active brand memory per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_memory_user_active
  ON brand_memory(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_brand_memory_user
  ON brand_memory(user_id);

-- RLS
ALTER TABLE brand_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own brand memory"
  ON brand_memory FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Reuse existing trigger function
CREATE TRIGGER update_brand_memory_updated_at
  BEFORE UPDATE ON brand_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- Table 2: brand_memory_versions — Snapshot history
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.brand_memory_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_memory_id UUID NOT NULL REFERENCES brand_memory(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_memory_versions_bm
  ON brand_memory_versions(brand_memory_id);

ALTER TABLE brand_memory_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own brand memory versions"
  ON brand_memory_versions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ═══════════════════════════════════════════════════════════════════
-- Table 3: brand_entities — Products, personas, campaigns etc.
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.brand_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_memory_id UUID NOT NULL REFERENCES brand_memory(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_entities_bm
  ON brand_entities(brand_memory_id, entity_type);

ALTER TABLE brand_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own brand entities"
  ON brand_entities FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_brand_entities_updated_at
  BEFORE UPDATE ON brand_entities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- Table 4: brand_messaging_examples — Good/bad content examples
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.brand_messaging_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_memory_id UUID NOT NULL REFERENCES brand_memory(id) ON DELETE CASCADE,
  example_type TEXT NOT NULL CHECK (example_type IN ('good', 'bad')),
  channel TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_messaging_examples_bm
  ON brand_messaging_examples(brand_memory_id);

ALTER TABLE brand_messaging_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own brand messaging examples"
  ON brand_messaging_examples FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_brand_messaging_examples_updated_at
  BEFORE UPDATE ON brand_messaging_examples
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════
-- Table 5: brand_documents — Brand guides, PDFs, URLs
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.brand_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_memory_id UUID NOT NULL REFERENCES brand_memory(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('file', 'url', 'text')),
  title TEXT NOT NULL DEFAULT '',
  source_url TEXT,
  storage_path TEXT,
  mime_type TEXT,
  checksum TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'error')),
  error_message TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_documents_bm
  ON brand_documents(brand_memory_id);

ALTER TABLE brand_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own brand documents"
  ON brand_documents FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_brand_documents_updated_at
  BEFORE UPDATE ON brand_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
