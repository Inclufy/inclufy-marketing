-- Personas — target audience profiles per user, used by channel-fit alignment evaluator
-- Stored as JSON array on go_marketing_strategy so they live with the rest of the strategy.
-- Shape: [{ id, name, role, pain_points: string[], tone: 'formal'|'casual'|'inspirational', channels: string[] }]

ALTER TABLE public.go_marketing_strategy
  ADD COLUMN IF NOT EXISTS personas JSONB DEFAULT '[]'::jsonb;
