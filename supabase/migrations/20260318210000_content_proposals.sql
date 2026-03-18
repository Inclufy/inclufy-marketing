-- Content Proposals — AI-generated content awaiting user approval
-- The core of AMOS "Assisted" mode: AI suggests → user approves → publish

CREATE TABLE IF NOT EXISTS public.go_content_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,                        -- korte titel/samenvatting
  content_text TEXT NOT NULL,                 -- volledige post tekst
  content_type TEXT DEFAULT 'social',         -- social, caption, blog, email, ad

  -- Platform & Planning
  channel TEXT NOT NULL,                      -- linkedin, instagram, x, facebook, tiktok
  scheduled_for TIMESTAMPTZ,                  -- voorgestelde publicatiedatum/tijd

  -- Context (waarom dit voorstel)
  based_on JSONB DEFAULT '{}',                -- { strategy_goal, content_mix_type, product_id, team_member_id, trigger }
  hashtags TEXT[] DEFAULT '{}',
  media_url TEXT,                             -- optionele afbeelding URL

  -- Approval workflow
  status TEXT DEFAULT 'pending',              -- pending, approved, rejected, scheduled, published, expired
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,                           -- feedback bij afwijzing of opmerking

  -- Metadata
  tone TEXT DEFAULT 'professional',           -- professional, casual, community, inspirerend, urgent, storytelling
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.go_content_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own content proposals" ON public.go_content_proposals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes for fast querying
CREATE INDEX idx_proposals_user_status ON public.go_content_proposals(user_id, status);
CREATE INDEX idx_proposals_scheduled ON public.go_content_proposals(scheduled_for) WHERE status = 'approved';
