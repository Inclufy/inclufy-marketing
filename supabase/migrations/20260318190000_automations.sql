-- Marketing Automations — real trigger-based workflows linked to the marketing strategy
-- Replaces mock automations with persistent Supabase-backed workflows

-- ═══════════════════════════════════════════════════════
-- 1. Automation Workflows (trigger definitions)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.go_automations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT 'lightning-bolt',        -- MaterialCommunityIcons name
  color TEXT DEFAULT '#3B82F6',

  -- Trigger config
  trigger_type TEXT NOT NULL DEFAULT 'manual',
  -- Types: new_lead, event_reminder, engagement_spike, budget_threshold,
  --        campaign_end, content_scheduled, new_follower, post_published, manual
  trigger_config JSONB DEFAULT '{}',
  -- e.g. { "threshold_pct": 80 } for budget_threshold
  -- e.g. { "hours_before": 24 } for event_reminder
  -- e.g. { "spike_pct": 50 } for engagement_spike

  -- Actions (what happens when triggered)
  actions JSONB DEFAULT '[]',
  -- Array of action objects:
  -- [
  --   { "type": "send_email", "template": "welcome", "channel": "email" },
  --   { "type": "post_social", "channel": "linkedin", "content_template": "reminder" },
  --   { "type": "notify_team", "message": "New lead captured" },
  --   { "type": "pause_campaign", "criteria": "lowest_roi" },
  --   { "type": "generate_report", "report_type": "performance" }
  -- ]

  -- Linked strategy channel (optional)
  channel TEXT,                              -- linkedin, instagram, x, facebook, tiktok, email

  -- Execution settings
  is_active BOOLEAN DEFAULT true,
  autopilot_mode TEXT DEFAULT 'assisted',    -- manual, assisted, autopilot
  cooldown_minutes INT DEFAULT 60,           -- min time between triggers
  max_runs_per_day INT DEFAULT 10,

  -- Stats (updated by logs aggregation)
  total_runs INT DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  success_rate NUMERIC DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.go_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own automations" ON public.go_automations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════
-- 2. Automation Logs (execution history)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.go_automation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  automation_id UUID NOT NULL REFERENCES public.go_automations(id) ON DELETE CASCADE,

  -- Execution details
  status TEXT NOT NULL DEFAULT 'pending',    -- pending, running, success, failed, skipped
  trigger_data JSONB DEFAULT '{}',           -- what triggered this run
  actions_executed JSONB DEFAULT '[]',       -- which actions ran and their results
  error_message TEXT,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.go_automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own automation logs" ON public.go_automation_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Index for fast log queries
CREATE INDEX idx_automation_logs_automation ON public.go_automation_logs(automation_id);
CREATE INDEX idx_automation_logs_user ON public.go_automation_logs(user_id, created_at DESC);
CREATE INDEX idx_automation_logs_status ON public.go_automation_logs(status);

-- ═══════════════════════════════════════════════════════
-- 3. Seed default automations function
-- ═══════════════════════════════════════════════════════
-- This function creates default automation workflows for a user
-- based on their marketing strategy settings.
-- Called when a user first sets up their strategy.

CREATE OR REPLACE FUNCTION public.seed_default_automations(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Only seed if user has no automations yet
  IF EXISTS (SELECT 1 FROM public.go_automations WHERE user_id = p_user_id LIMIT 1) THEN
    RETURN;
  END IF;

  INSERT INTO public.go_automations (user_id, name, description, icon, color, trigger_type, trigger_config, actions, channel, is_active) VALUES
  (
    p_user_id,
    'Nieuwe lead ontvangen',
    'Stuur welkomstmail en LinkedIn connectieverzoek bij nieuwe lead',
    'account-plus',
    '#10B981',
    'new_lead',
    '{}',
    '[{"type":"send_email","template":"welcome"},{"type":"post_social","channel":"linkedin","action":"connect"}]',
    'email',
    true
  ),
  (
    p_user_id,
    'Event herinnering (24u)',
    'Post herinnering op social media 24 uur voor event start',
    'calendar-clock',
    '#F59E0B',
    'event_reminder',
    '{"hours_before": 24}',
    '[{"type":"post_social","channel":"linkedin","content_template":"event_reminder"},{"type":"post_social","channel":"instagram","content_template":"event_reminder"}]',
    NULL,
    true
  ),
  (
    p_user_id,
    'Engagement piek gedetecteerd',
    'Notificeer team en stel follow-up voor bij significante engagement stijging',
    'trending-up',
    '#8B5CF6',
    'engagement_spike',
    '{"spike_pct": 50}',
    '[{"type":"notify_team","message":"Engagement piek gedetecteerd!"},{"type":"generate_report","report_type":"engagement"}]',
    NULL,
    false
  ),
  (
    p_user_id,
    'Budget drempel bereikt (80%)',
    'Pauzeer laagst presterende campagne en stuur alert bij 80% budgetgebruik',
    'cash-remove',
    '#EF4444',
    'budget_threshold',
    '{"threshold_pct": 80}',
    '[{"type":"pause_campaign","criteria":"lowest_roi"},{"type":"notify_team","message":"Budget drempel bereikt"}]',
    NULL,
    true
  ),
  (
    p_user_id,
    'Campagne afgelopen',
    'Genereer prestatierapport en AI-samenvatting na afloop campagne',
    'flag-checkered',
    '#06B6D4',
    'campaign_end',
    '{}',
    '[{"type":"generate_report","report_type":"performance"},{"type":"notify_team","message":"Campagne afgerond — rapport beschikbaar"}]',
    NULL,
    true
  ),
  (
    p_user_id,
    'Content gepland',
    'Publiceer content automatisch op de geplande tijd en kanalen',
    'clock-check',
    '#3B82F6',
    'content_scheduled',
    '{}',
    '[{"type":"post_social","channel":"auto","content_template":"scheduled"}]',
    NULL,
    true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
