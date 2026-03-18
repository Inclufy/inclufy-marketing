-- Marketing Strategy table — the "brain" of AMOS Autonomous Hub
-- Stores user's marketing goals, budget allocation, channel config, content mix, and autonomy settings

CREATE TABLE IF NOT EXISTS public.go_marketing_strategy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Goals
  goals TEXT[] DEFAULT '{}',
  primary_goal TEXT DEFAULT 'brand_awareness',

  -- Channels & Frequency
  channels JSONB DEFAULT '{}',

  -- Budget
  monthly_budget NUMERIC DEFAULT 0,
  budget_allocation JSONB DEFAULT '{}',

  -- Content Planning
  content_mix JSONB DEFAULT '{}',
  posts_per_week INT DEFAULT 5,

  -- Events
  events_per_quarter INT DEFAULT 2,
  event_budget_pct INT DEFAULT 20,

  -- Timing & Momentum
  peak_months TEXT[] DEFAULT '{}',
  posting_days TEXT[] DEFAULT '{}',
  posting_times JSONB DEFAULT '{}',

  -- Autonomy
  autonomy_level TEXT DEFAULT 'balanced',
  auto_publish BOOLEAN DEFAULT false,
  require_approval BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id)
);

ALTER TABLE public.go_marketing_strategy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own strategy" ON public.go_marketing_strategy
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
