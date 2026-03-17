-- Campaign cost tracking: ads, events, tools, personnel, etc.
CREATE TABLE IF NOT EXISTS public.campaign_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('ads', 'events', 'tools', 'personnel', 'travel', 'content', 'other')),
  description TEXT,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Campaign revenue tracking: conversions, sales, tickets, etc.
CREATE TABLE IF NOT EXISTS public.campaign_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('lead_conversion', 'direct_sale', 'event_ticket', 'subscription', 'referral', 'other')),
  description TEXT,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.campaign_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own campaign costs" ON public.campaign_costs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own campaign revenue" ON public.campaign_revenue FOR ALL USING (auth.uid() = user_id);
