-- Add sync_stats JSONB column to integration_configs
-- This column stores sync statistics for each integration
ALTER TABLE public.integration_configs
  ADD COLUMN IF NOT EXISTS sync_stats JSONB DEFAULT '{"records_synced": 0, "last_24h_syncs": 0, "failed_syncs": 0, "data_volume_mb": 0}';

-- Notify PostgREST to pick up the new column
NOTIFY pgrst, 'reload schema';
