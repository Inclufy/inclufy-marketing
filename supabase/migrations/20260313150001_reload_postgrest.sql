-- Force PostgREST to reload its schema cache
-- This is needed after creating new tables
NOTIFY pgrst, 'reload schema';

-- Also grant usage on all new tables to authenticated and anon roles
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'autonomous_campaign_status', 'data_flow_events', 'integration_configs',
    'publishable_content', 'channel_health',
    'scored_leads', 'scoring_rules', 'scoring_models',
    'agent_messages', 'agent_tasks',
    'channel_attributions', 'journey_paths',
    'trend_data', 'feed_items',
    'captured_contacts', 'qr_codes',
    'discovered_events',
    'campaign_triggers', 'triggered_campaigns',
    'lead_profiles', 'intent_signals',
    'customer_ltv', 'recommendations',
    'autonomous_content', 'generated_content', 'brand_voices',
    'content_templates_ai',
    'automation_rules', 'automation_logs', 'automation_templates_ai',
    'autonomous_decisions', 'ai_agents', 'attribution_models',
    'opportunities', 'revenue_predictions', 'revenue_opportunities',
    'strategic_plans'
  ] LOOP
    BEGIN
      EXECUTE format('GRANT ALL ON public.%I TO authenticated', tbl);
      EXECUTE format('GRANT SELECT ON public.%I TO anon', tbl);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not grant on %: %', tbl, SQLERRM;
    END;
  END LOOP;
END $$;

-- Notify PostgREST again after grants
NOTIFY pgrst, 'reload schema';
