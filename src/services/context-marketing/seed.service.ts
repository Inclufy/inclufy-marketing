// src/services/context-marketing/seed.service.ts
// Seed Service — checks if user has data and seeds demo data if empty
import { supabase } from '@/integrations/supabase/client';

class SeedService {
  private seeded = false;

  async seedIfEmpty(): Promise<void> {
    if (this.seeded) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if already seeded by counting ai_agents
    const { count } = await supabase
      .from('ai_agents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count && count > 0) {
      this.seeded = true;
      return;
    }

    // Seed all tables in order
    await this.seedAgents(user.id);
    await this.seedIntegrations(user.id);
    await this.seedAttributionModels(user.id);
    await this.seedChannelHealth(user.id);
    await this.seedScoredLeads(user.id);
    await this.seedScoringRules(user.id);
    await this.seedScoringModel(user.id);
    await this.seedOpportunities(user.id);
    await this.seedDiscoveredEvents(user.id);
    await this.seedCampaignTriggers(user.id);
    await this.seedLeadProfiles(user.id);
    await this.seedFeedItems(user.id);
    await this.seedCapturedContacts(user.id);
    await this.seedQRCodes(user.id);
    await this.seedIntentSignals(user.id);
    await this.seedTriggeredCampaigns(user.id);
    await this.seedAutonomousDecisions(user.id);
    await this.seedAutonomousCampaignStatus(user.id);
    await this.seedPublishableContent(user.id);
    await this.seedDataFlowEvents(user.id);

    this.seeded = true;
  }

  // ── AI Agents (5) ──────────────────────────────────────────────
  private async seedAgents(userId: string): Promise<void> {
    const agents = [
      {
        user_id: userId,
        name: 'Social Agent',
        type: 'social',
        status: 'busy',
        description: 'Monitors social trends, creates & schedules content, manages engagement across all social platforms',
        capabilities: ['Trend Detection', 'Content Generation', 'Scheduling', 'Engagement Analysis', 'Hashtag Optimization', 'Audience Targeting'],
        current_task: 'Generating 3 post variants for detected trending topic #SustainableMarketing',
        tasks_completed_today: 47,
        tasks_in_queue: 12,
        success_rate: 94.2,
        efficiency_score: 91,
        last_action: 'Published LinkedIn carousel about Q1 results',
        last_action_at: '2026-03-10T09:15:00Z',
        uptime_hours: 2184,
        decisions_made: 15678,
        revenue_impact: 89000,
        learning_progress: 87,
        model_version: 'social-v4.1',
        performance_trend: [{ date: '2026-03-04', score: 88 }, { date: '2026-03-05', score: 90 }, { date: '2026-03-06', score: 89 }, { date: '2026-03-07', score: 92 }, { date: '2026-03-08', score: 91 }, { date: '2026-03-09', score: 93 }, { date: '2026-03-10', score: 94 }],
      },
      {
        user_id: userId,
        name: 'Email Agent',
        type: 'email',
        status: 'active',
        description: 'Manages email sequences, A/B tests subject lines, optimizes send times, personalizes content per recipient',
        capabilities: ['Subject Line A/B Testing', 'Send Time Optimization', 'Personalization', 'Sequence Building', 'Bounce Management', 'Deliverability Monitoring'],
        current_task: 'Analyzing A/B test results — Subject B outperforming by 23%',
        tasks_completed_today: 34,
        tasks_in_queue: 8,
        success_rate: 96.8,
        efficiency_score: 94,
        last_action: 'Deployed winning subject line to remaining 80% of email list',
        last_action_at: '2026-03-10T08:45:00Z',
        uptime_hours: 2184,
        decisions_made: 12456,
        revenue_impact: 156000,
        learning_progress: 92,
        model_version: 'email-v3.8',
        performance_trend: [{ date: '2026-03-04', score: 93 }, { date: '2026-03-05', score: 94 }, { date: '2026-03-06', score: 95 }, { date: '2026-03-07', score: 94 }, { date: '2026-03-08', score: 96 }, { date: '2026-03-09', score: 95 }, { date: '2026-03-10', score: 97 }],
      },
      {
        user_id: userId,
        name: 'Ads Agent',
        type: 'ads',
        status: 'busy',
        description: 'Manages ad budgets across platforms, creates ad variants, optimizes targeting & bidding strategies',
        capabilities: ['Budget Allocation', 'Ad Copywriting', 'Audience Targeting', 'Bid Optimization', 'Creative Testing', 'Cross-platform Management'],
        current_task: 'Reallocating EUR 2,500 from underperforming Facebook campaign to Google Shopping',
        tasks_completed_today: 28,
        tasks_in_queue: 15,
        success_rate: 91.5,
        efficiency_score: 88,
        last_action: 'Paused 3 low-performing ad sets and launched 2 new retargeting campaigns',
        last_action_at: '2026-03-10T09:30:00Z',
        uptime_hours: 2184,
        decisions_made: 9234,
        revenue_impact: 234000,
        learning_progress: 84,
        model_version: 'ads-v5.0',
        performance_trend: [{ date: '2026-03-04', score: 85 }, { date: '2026-03-05', score: 87 }, { date: '2026-03-06', score: 86 }, { date: '2026-03-07', score: 89 }, { date: '2026-03-08', score: 88 }, { date: '2026-03-09', score: 90 }, { date: '2026-03-10', score: 91 }],
      },
      {
        user_id: userId,
        name: 'Analytics Agent',
        type: 'analytics',
        status: 'active',
        description: 'Monitors KPIs in real-time, detects anomalies, generates reports, identifies optimization opportunities',
        capabilities: ['Anomaly Detection', 'KPI Monitoring', 'Report Generation', 'Trend Forecasting', 'Cohort Analysis', 'Attribution Modeling'],
        current_task: 'Investigating 35% spike in organic traffic — correlating with recent content strategy changes',
        tasks_completed_today: 56,
        tasks_in_queue: 4,
        success_rate: 98.1,
        efficiency_score: 96,
        last_action: 'Generated weekly performance report with 3 optimization recommendations',
        last_action_at: '2026-03-10T09:00:00Z',
        uptime_hours: 2184,
        decisions_made: 23456,
        revenue_impact: 67000,
        learning_progress: 95,
        model_version: 'analytics-v6.2',
        performance_trend: [{ date: '2026-03-04', score: 95 }, { date: '2026-03-05', score: 96 }, { date: '2026-03-06', score: 97 }, { date: '2026-03-07', score: 96 }, { date: '2026-03-08', score: 98 }, { date: '2026-03-09', score: 97 }, { date: '2026-03-10', score: 98 }],
      },
      {
        user_id: userId,
        name: 'Orchestrator',
        type: 'orchestrator',
        status: 'active',
        description: 'Central coordinator that manages all agents, resolves conflicts, allocates resources, ensures strategic alignment',
        capabilities: ['Agent Coordination', 'Conflict Resolution', 'Resource Allocation', 'Priority Management', 'Strategic Alignment', 'Load Balancing'],
        current_task: 'Balancing resource allocation between Social and Ads agents for spring campaign',
        tasks_completed_today: 89,
        tasks_in_queue: 3,
        success_rate: 99.2,
        efficiency_score: 97,
        last_action: 'Resolved conflict: Social and Email agents targeting overlapping audience segments',
        last_action_at: '2026-03-10T09:20:00Z',
        uptime_hours: 2184,
        decisions_made: 45678,
        revenue_impact: 0,
        learning_progress: 98,
        model_version: 'orchestrator-v7.0',
        performance_trend: [{ date: '2026-03-04', score: 96 }, { date: '2026-03-05', score: 97 }, { date: '2026-03-06', score: 98 }, { date: '2026-03-07', score: 97 }, { date: '2026-03-08', score: 99 }, { date: '2026-03-09', score: 98 }, { date: '2026-03-10', score: 99 }],
      },
    ];
    const { error } = await supabase.from('ai_agents').insert(agents);
    if (error) throw error;
  }

  // ── Integration Configs (8) ────────────────────────────────────
  private async seedIntegrations(userId: string): Promise<void> {
    const integrations = [
      {
        user_id: userId, platform: 'meta', display_name: 'Meta (Facebook & Instagram)', description: 'Facebook Ads, Instagram, Pages & Messenger', category: 'advertising', status: 'connected',
        connected_at: '2025-11-15T10:30:00Z', last_sync: '2026-03-10T08:45:00Z', sync_frequency: 'real_time', data_flowing: true, account_name: 'Inclufy Business', account_id: 'act_2847561930',
        permissions: ['ads_management', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish', 'leads_retrieval'], health_score: 96,
        sync_stats: { records_synced: 145892, last_24h_syncs: 2847, failed_syncs: 3, data_volume_mb: 234.5 },
        features: ['Ad Campaigns', 'Audience Insights', 'Lead Forms', 'Auto-posting', 'Pixel Tracking'],
      },
      {
        user_id: userId, platform: 'linkedin', display_name: 'LinkedIn', description: 'Company Page, Ads, Lead Gen Forms & Analytics', category: 'social', status: 'connected',
        connected_at: '2025-12-01T14:20:00Z', last_sync: '2026-03-10T09:00:00Z', sync_frequency: 'hourly', data_flowing: true, account_name: 'Inclufy BV', account_id: 'urn:li:organization:84729361',
        permissions: ['r_organization_social', 'w_organization_social', 'rw_ads', 'r_ads_reporting', 'r_basicprofile'], health_score: 91,
        sync_stats: { records_synced: 67234, last_24h_syncs: 1523, failed_syncs: 7, data_volume_mb: 89.2 },
        features: ['Sponsored Content', 'Lead Gen Forms', 'Company Updates', 'Analytics', 'Matched Audiences'],
      },
      {
        user_id: userId, platform: 'google_ads', display_name: 'Google Ads', description: 'Search, Display, Shopping & YouTube Ads', category: 'advertising', status: 'connected',
        connected_at: '2025-10-20T09:15:00Z', last_sync: '2026-03-10T09:10:00Z', sync_frequency: 'real_time', data_flowing: true, account_name: 'Inclufy Marketing', account_id: '847-293-6150',
        permissions: ['campaign_management', 'reporting', 'billing', 'keyword_planner'], health_score: 98,
        sync_stats: { records_synced: 289456, last_24h_syncs: 4521, failed_syncs: 1, data_volume_mb: 456.8 },
        features: ['Search Campaigns', 'Display Network', 'Shopping Ads', 'YouTube Ads', 'Conversion Tracking', 'Smart Bidding'],
      },
      {
        user_id: userId, platform: 'sendgrid', display_name: 'SendGrid', description: 'Transactional & Marketing Email', category: 'email', status: 'connected',
        connected_at: '2025-09-05T11:00:00Z', last_sync: '2026-03-10T08:30:00Z', sync_frequency: 'real_time', data_flowing: true, account_name: 'inclufy.com', account_id: 'sg_inclufy_prod',
        permissions: ['mail.send', 'marketing.contacts', 'stats.read', 'templates.read'], health_score: 94,
        sync_stats: { records_synced: 523891, last_24h_syncs: 8934, failed_syncs: 12, data_volume_mb: 167.3 },
        features: ['Email Campaigns', 'Transactional Email', 'Contact Lists', 'Templates', 'A/B Testing', 'Analytics'],
      },
      {
        user_id: userId, platform: 'hubspot', display_name: 'HubSpot CRM', description: 'CRM, Sales Pipeline & Marketing Automation', category: 'crm', status: 'pending',
        sync_frequency: 'hourly', data_flowing: false, permissions: [], health_score: 0,
        sync_stats: { records_synced: 0, last_24h_syncs: 0, failed_syncs: 0, data_volume_mb: 0 },
        features: ['Contact Sync', 'Deal Pipeline', 'Form Submissions', 'Email Tracking', 'Workflows'],
      },
      {
        user_id: userId, platform: 'mailchimp', display_name: 'Mailchimp', description: 'Email Marketing & Audience Management', category: 'email', status: 'disconnected',
        sync_frequency: 'daily', data_flowing: false, permissions: [], health_score: 0,
        sync_stats: { records_synced: 0, last_24h_syncs: 0, failed_syncs: 0, data_volume_mb: 0 },
        features: ['Email Campaigns', 'Audience Segments', 'Landing Pages', 'Automations', 'Reports'],
      },
      {
        user_id: userId, platform: 'zapier', display_name: 'Zapier', description: 'Workflow Automation & App Integrations', category: 'automation', status: 'connected',
        connected_at: '2026-01-10T16:45:00Z', last_sync: '2026-03-10T09:05:00Z', sync_frequency: 'real_time', data_flowing: true, account_name: 'Inclufy Team', account_id: 'zap_team_inclufy',
        permissions: ['zaps.read', 'zaps.write', 'triggers', 'actions'], health_score: 88,
        sync_stats: { records_synced: 34567, last_24h_syncs: 892, failed_syncs: 5, data_volume_mb: 23.1 },
        features: ['Custom Zaps', 'Multi-step Workflows', 'Webhooks', 'Scheduled Triggers', 'Error Handling'],
      },
      {
        user_id: userId, platform: 'slack', display_name: 'Slack', description: 'Team Communication & Notifications', category: 'communication', status: 'connected',
        connected_at: '2025-08-20T13:00:00Z', last_sync: '2026-03-10T09:12:00Z', sync_frequency: 'real_time', data_flowing: true, account_name: 'Inclufy Workspace', account_id: 'T04INCLUFY',
        permissions: ['chat:write', 'channels:read', 'files:write', 'incoming-webhook'], health_score: 100,
        sync_stats: { records_synced: 12345, last_24h_syncs: 456, failed_syncs: 0, data_volume_mb: 5.7 },
        features: ['Campaign Alerts', 'Performance Reports', 'Approval Requests', 'AI Insights', 'Custom Channels'],
      },
    ];
    const { error } = await supabase.from('integration_configs').insert(integrations);
    if (error) throw error;
  }

  // ── Attribution Models (8) ─────────────────────────────────────
  private async seedAttributionModels(userId: string): Promise<void> {
    const models = [
      { user_id: userId, name: 'First Touch', type: 'first_touch', description: 'Credits the first interaction that started the journey', is_active: true },
      { user_id: userId, name: 'Last Touch', type: 'last_touch', description: 'Credits the last interaction before conversion', is_active: true },
      { user_id: userId, name: 'Linear', type: 'linear', description: 'Distributes credit equally across all touchpoints', is_active: true },
      { user_id: userId, name: 'Time Decay', type: 'time_decay', description: 'More credit to touchpoints closer to conversion', is_active: true },
      { user_id: userId, name: 'U-Shaped', type: 'u_shaped', description: '40% first touch, 40% last touch, 20% distributed middle', is_active: true },
      { user_id: userId, name: 'W-Shaped', type: 'w_shaped', description: '30% first, 30% lead creation, 30% opportunity, 10% rest', is_active: true },
      { user_id: userId, name: 'Markov Chain', type: 'data_driven_markov', description: 'Data-driven model using transition probabilities between channels', is_active: true, accuracy_score: 94.2 },
      { user_id: userId, name: 'Shapley Value', type: 'data_driven_shapley', description: 'Game theory approach calculating marginal contribution of each channel', is_active: true, accuracy_score: 96.1 },
    ];
    const { error } = await supabase.from('attribution_models').insert(models);
    if (error) throw error;
  }

  // ── Channel Health (7) ─────────────────────────────────────────
  private async seedChannelHealth(userId: string): Promise<void> {
    const channels = [
      { user_id: userId, channel: 'linkedin', connected: true, account_name: 'Inclufy BV', followers: 12450, avg_engagement: 8.4, posts_this_month: 18, best_time: '14:00 CET', health_score: 94 },
      { user_id: userId, channel: 'facebook', connected: true, account_name: 'Inclufy Marketing', followers: 8920, avg_engagement: 5.2, posts_this_month: 14, best_time: '12:00 CET', health_score: 87 },
      { user_id: userId, channel: 'instagram', connected: true, account_name: '@inclufy', followers: 6780, avg_engagement: 11.3, posts_this_month: 22, best_time: '18:00 CET', health_score: 91 },
      { user_id: userId, channel: 'twitter', connected: true, account_name: '@inclufy_ai', followers: 4560, avg_engagement: 3.8, posts_this_month: 28, best_time: '09:00 CET', health_score: 82 },
      { user_id: userId, channel: 'email', connected: true, account_name: 'inclufy.com', followers: 45200, avg_engagement: 24.5, posts_this_month: 8, best_time: '09:00 CET', health_score: 96 },
      { user_id: userId, channel: 'blog', connected: true, account_name: 'blog.inclufy.com', followers: 3200, avg_engagement: 4.2, posts_this_month: 6, best_time: '10:00 CET', health_score: 88 },
      { user_id: userId, channel: 'tiktok', connected: false, followers: 0, avg_engagement: 0, posts_this_month: 0, best_time: '-', health_score: 0 },
    ];
    const { error } = await supabase.from('channel_health').insert(channels);
    if (error) throw error;
  }

  // ── Scored Leads (10) ──────────────────────────────────────────
  private async seedScoredLeads(userId: string): Promise<void> {
    const leads = [
      { user_id: userId, name: 'Sophie Van den Berg', email: 'sophie@techcorp.be', company: 'TechCorp Belgium', title: 'Marketing Director', composite_score: 94, score_breakdown: { behavioral: 92, demographic: 88, firmographic: 96, engagement: 98, intent: 90 }, stage: 'sql', conversion_probability: 0.87, predicted_value: 45000, predicted_close_date: '2026-04-15', hot_signals: ['Pricing page visited 5x', 'Demo requested', 'Downloaded ROI whitepaper'], cold_signals: [], last_activity: '2026-03-09T16:30:00Z', activity_count_30d: 47, source: 'Organic Search', tags: ['enterprise', 'high-value'], score_history: [{ date: '2026-02-10', score: 45 }, { date: '2026-02-17', score: 58 }, { date: '2026-02-24', score: 72 }, { date: '2026-03-03', score: 86 }, { date: '2026-03-10', score: 94 }], next_best_action: 'Schedule executive demo with CEO' },
      { user_id: userId, name: 'Thomas De Smedt', email: 'thomas@growthlab.nl', company: 'GrowthLab Netherlands', title: 'CEO', composite_score: 89, score_breakdown: { behavioral: 85, demographic: 92, firmographic: 94, engagement: 88, intent: 86 }, stage: 'sql', conversion_probability: 0.78, predicted_value: 62000, predicted_close_date: '2026-04-22', hot_signals: ['API documentation viewed', 'Competitor comparison page', 'Multiple team members visited'], cold_signals: ['No social engagement'], last_activity: '2026-03-10T09:15:00Z', activity_count_30d: 34, source: 'LinkedIn Ad', tags: ['enterprise', 'multi-user'], score_history: [{ date: '2026-02-10', score: 30 }, { date: '2026-02-17', score: 48 }, { date: '2026-02-24', score: 65 }, { date: '2026-03-03', score: 79 }, { date: '2026-03-10', score: 89 }], next_best_action: 'Send enterprise pricing proposal' },
      { user_id: userId, name: 'Marie-Claire Dubois', email: 'mc.dubois@luxebrands.fr', company: 'Luxe Brands Paris', title: 'VP Digital', composite_score: 82, score_breakdown: { behavioral: 78, demographic: 90, firmographic: 88, engagement: 76, intent: 82 }, stage: 'mql', conversion_probability: 0.64, predicted_value: 78000, predicted_close_date: '2026-05-10', hot_signals: ['Case study downloaded', 'Webinar attended', 'Integration page viewed'], cold_signals: ['Low email engagement rate'], last_activity: '2026-03-08T14:00:00Z', activity_count_30d: 21, source: 'Webinar', tags: ['luxury', 'france'], score_history: [{ date: '2026-02-10', score: 35 }, { date: '2026-02-17', score: 42 }, { date: '2026-02-24', score: 55 }, { date: '2026-03-03', score: 68 }, { date: '2026-03-10', score: 82 }], next_best_action: 'Send personalized demo link focused on luxury brand features' },
      { user_id: userId, name: 'Jan Willems', email: 'j.willems@mediahuis.be', company: 'Mediahuis', title: 'Digital Marketing Lead', composite_score: 76, score_breakdown: { behavioral: 80, demographic: 72, firmographic: 82, engagement: 74, intent: 70 }, stage: 'mql', conversion_probability: 0.52, predicted_value: 34000, predicted_close_date: '2026-05-25', hot_signals: ['Blog posts read frequently', 'Newsletter subscriber'], cold_signals: ['No pricing page visit', 'Single user visits'], last_activity: '2026-03-09T11:00:00Z', activity_count_30d: 18, source: 'Content Marketing', tags: ['media', 'mid-market'], score_history: [{ date: '2026-02-10', score: 40 }, { date: '2026-02-17', score: 48 }, { date: '2026-02-24', score: 56 }, { date: '2026-03-03', score: 68 }, { date: '2026-03-10', score: 76 }], next_best_action: 'Invite to exclusive media industry webinar' },
      { user_id: userId, name: 'Eva Johansson', email: 'eva@scandibrand.se', company: 'ScandiBrand AB', title: 'CMO', composite_score: 71, score_breakdown: { behavioral: 65, demographic: 86, firmographic: 78, engagement: 62, intent: 68 }, stage: 'mql', conversion_probability: 0.45, predicted_value: 52000, predicted_close_date: '2026-06-01', hot_signals: ['Features page explored', 'Connected social account'], cold_signals: ['Low frequency visits', 'Unsubscribed from weekly digest'], last_activity: '2026-03-07T10:00:00Z', activity_count_30d: 12, source: 'Google Ads', tags: ['nordic', 'enterprise'], score_history: [{ date: '2026-02-10', score: 28 }, { date: '2026-02-17', score: 38 }, { date: '2026-02-24', score: 50 }, { date: '2026-03-03', score: 62 }, { date: '2026-03-10', score: 71 }], next_best_action: 'Re-engage with personalized case study for Nordic brands' },
      { user_id: userId, name: 'Ahmed El Fassi', email: 'ahmed@digiwave.ma', company: 'DigiWave Morocco', title: 'Founder', composite_score: 65, score_breakdown: { behavioral: 72, demographic: 60, firmographic: 55, engagement: 78, intent: 58 }, stage: 'lead', conversion_probability: 0.34, predicted_value: 18000, predicted_close_date: '2026-06-15', hot_signals: ['Free trial started', 'Active in-app usage'], cold_signals: ['Small company size', 'Budget constraints signal'], last_activity: '2026-03-10T08:00:00Z', activity_count_30d: 28, source: 'Product Hunt', tags: ['startup', 'trial'], score_history: [{ date: '2026-02-10', score: 20 }, { date: '2026-02-17', score: 35 }, { date: '2026-02-24', score: 48 }, { date: '2026-03-03', score: 56 }, { date: '2026-03-10', score: 65 }], next_best_action: 'Offer startup pricing plan' },
      { user_id: userId, name: 'Pieter Jansen', email: 'pieter@retailplus.nl', company: 'RetailPlus BV', title: 'E-commerce Manager', composite_score: 58, score_breakdown: { behavioral: 55, demographic: 62, firmographic: 68, engagement: 48, intent: 56 }, stage: 'lead', conversion_probability: 0.28, predicted_value: 28000, hot_signals: ['E-commerce integration page viewed'], cold_signals: ['Low engagement', 'No return visits in 2 weeks'], last_activity: '2026-02-28T15:00:00Z', activity_count_30d: 8, source: 'Referral', tags: ['retail', 'e-commerce'], score_history: [{ date: '2026-02-10', score: 32 }, { date: '2026-02-17', score: 42 }, { date: '2026-02-24', score: 52 }, { date: '2026-03-03', score: 56 }, { date: '2026-03-10', score: 58 }], next_best_action: 'Send e-commerce-specific feature comparison' },
      { user_id: userId, name: 'Laura Moretti', email: 'laura@fashionista.it', company: 'Fashionista Milano', title: 'Brand Manager', composite_score: 47, score_breakdown: { behavioral: 42, demographic: 55, firmographic: 50, engagement: 38, intent: 52 }, stage: 'lead', conversion_probability: 0.19, predicted_value: 22000, hot_signals: ['Instagram integration page viewed'], cold_signals: ['Only visited once', 'Bounced from pricing page'], last_activity: '2026-03-02T12:00:00Z', activity_count_30d: 3, source: 'Facebook Ad', tags: ['fashion', 'italy'], score_history: [{ date: '2026-02-10', score: 15 }, { date: '2026-02-17', score: 25 }, { date: '2026-02-24', score: 38 }, { date: '2026-03-03', score: 45 }, { date: '2026-03-10', score: 47 }], next_best_action: 'Nurture with fashion industry success stories' },
      { user_id: userId, name: 'Henrik Andersen', email: 'henrik@nordisk.dk', company: 'Nordisk Marketing', title: 'Managing Director', composite_score: 35, score_breakdown: { behavioral: 30, demographic: 48, firmographic: 42, engagement: 25, intent: 30 }, stage: 'visitor', conversion_probability: 0.12, predicted_value: 15000, hot_signals: ['Attended virtual event'], cold_signals: ['No demo request', 'Minimal website interaction', 'Unknown budget'], last_activity: '2026-02-25T09:00:00Z', activity_count_30d: 2, source: 'Event', tags: ['denmark'], score_history: [{ date: '2026-02-10', score: 10 }, { date: '2026-02-17', score: 18 }, { date: '2026-02-24', score: 28 }, { date: '2026-03-03', score: 32 }, { date: '2026-03-10', score: 35 }], next_best_action: 'Add to awareness nurture sequence' },
      { user_id: userId, name: 'Claire Fontaine', email: 'claire@agencebleu.fr', company: 'Agence Bleu', title: 'Account Director', composite_score: 91, score_breakdown: { behavioral: 88, demographic: 90, firmographic: 92, engagement: 94, intent: 92 }, stage: 'opportunity', conversion_probability: 0.91, predicted_value: 85000, predicted_close_date: '2026-03-28', hot_signals: ['Contract terms discussed', 'Legal review initiated', 'Budget approved'], cold_signals: [], last_activity: '2026-03-10T11:00:00Z', activity_count_30d: 52, source: 'Partner Referral', tags: ['agency', 'france', 'high-value'], score_history: [{ date: '2026-02-10', score: 60 }, { date: '2026-02-17', score: 72 }, { date: '2026-02-24', score: 80 }, { date: '2026-03-03', score: 87 }, { date: '2026-03-10', score: 91 }], next_best_action: 'Prepare final contract and onboarding timeline' },
    ];
    const { error } = await supabase.from('scored_leads').insert(leads);
    if (error) throw error;
  }

  // ── Scoring Rules (15) ─────────────────────────────────────────
  private async seedScoringRules(userId: string): Promise<void> {
    const rules = [
      { user_id: userId, name: 'Pricing Page Visit', category: 'intent', description: 'Visited pricing page', condition: 'page_view == "/pricing"', points: 15, is_active: true, triggers_count: 234 },
      { user_id: userId, name: 'Demo Request', category: 'intent', description: 'Submitted demo request form', condition: 'form_submit == "demo"', points: 25, is_active: true, triggers_count: 89 },
      { user_id: userId, name: 'Content Download', category: 'behavioral', description: 'Downloaded whitepaper, case study, or report', condition: 'download_count > 0', points: 10, is_active: true, triggers_count: 456 },
      { user_id: userId, name: 'Email Open Rate', category: 'engagement', description: 'Opened 3+ marketing emails', condition: 'email_opens >= 3', points: 8, is_active: true, triggers_count: 1230 },
      { user_id: userId, name: 'Social Engagement', category: 'engagement', description: 'Engaged with social posts (like, comment, share)', condition: 'social_engagements > 0', points: 5, is_active: true, triggers_count: 567 },
      { user_id: userId, name: 'C-Level Title', category: 'demographic', description: 'Has C-level or VP title', condition: 'title IN ("CEO", "CTO", "CMO", "VP")', points: 20, is_active: true, triggers_count: 78 },
      { user_id: userId, name: 'Enterprise Company', category: 'firmographic', description: 'Company has 500+ employees', condition: 'company_size >= 500', points: 18, is_active: true, triggers_count: 45 },
      { user_id: userId, name: 'Return Visitor', category: 'behavioral', description: 'Visited website 5+ times', condition: 'visit_count >= 5', points: 12, is_active: true, triggers_count: 890 },
      { user_id: userId, name: 'Integration Page View', category: 'intent', description: 'Viewed specific integration pages', condition: 'page_view LIKE "/integrations/*"', points: 10, is_active: true, triggers_count: 312 },
      { user_id: userId, name: 'Free Trial Start', category: 'intent', description: 'Started free trial', condition: 'trial_started == true', points: 30, is_active: true, triggers_count: 156 },
      { user_id: userId, name: 'Webinar Attendance', category: 'engagement', description: 'Attended live webinar', condition: 'webinar_attended == true', points: 15, is_active: true, triggers_count: 234 },
      { user_id: userId, name: 'Budget Authority', category: 'demographic', description: 'Has budget decision authority', condition: 'budget_authority == true', points: 15, is_active: true, triggers_count: 67 },
      { user_id: userId, name: 'Target Industry', category: 'firmographic', description: 'Company in target industry (Tech, Retail, Finance)', condition: 'industry IN ("Technology", "Retail", "Finance")', points: 12, is_active: true, triggers_count: 389 },
      { user_id: userId, name: 'Bounce from Pricing', category: 'intent', description: 'Visited pricing page but left immediately', condition: 'pricing_bounce == true', points: -5, is_active: true, triggers_count: 123 },
      { user_id: userId, name: 'Unsubscribe', category: 'engagement', description: 'Unsubscribed from emails', condition: 'unsubscribed == true', points: -15, is_active: true, triggers_count: 45 },
    ];
    const { error } = await supabase.from('scoring_rules').insert(rules);
    if (error) throw error;
  }

  // ── Scoring Model (1) ─────────────────────────────────────────
  private async seedScoringModel(userId: string): Promise<void> {
    const model = {
      user_id: userId,
      name: 'Inclufy Lead Score v3.2',
      description: 'Multi-signal predictive scoring model trained on 12 months of conversion data',
      is_active: true,
      accuracy: 91.4,
      total_leads_scored: 8456,
      last_trained: '2026-03-08T02:00:00Z',
      category_weights: { behavioral: 25, demographic: 15, firmographic: 20, engagement: 20, intent: 20 },
      threshold_mql: 50,
      threshold_sql: 75,
    };
    const { error } = await supabase.from('scoring_models').insert(model);
    if (error) throw error;
  }

  // ── Opportunities (8) ──────────────────────────────────────────
  private async seedOpportunities(userId: string): Promise<void> {
    const opportunities = [
      { user_id: userId, type: 'trend', title: 'AI Governance stijgt 240% in zoekopdrachten', description: 'Google Trends en LinkedIn data tonen explosieve groei in AI governance content.', source: 'Google Trends + LinkedIn Analysis', priority: 'critical', status: 'new', confidence: 94, estimated_impact: 85000, estimated_reach: 450000, trend_velocity: 240, relevance_score: 96, discovered_at: '2026-03-11T08:00:00Z', expires_at: '2026-03-25T00:00:00Z', tags: ['AI', 'governance', 'compliance', 'B2B'], suggested_actions: ['Start thought leadership blog serie', 'Launch LinkedIn ad campaign', 'Create whitepaper', 'Host webinar'], related_keywords: ['AI compliance', 'responsible AI', 'AI ethics', 'AI regulation EU'], data_sources: ['Google Trends', 'LinkedIn Pulse', 'Twitter/X', 'Reddit'], campaign_suggestion: { title: 'AI Governance Thought Leadership', channels: ['LinkedIn', 'Blog', 'Email', 'Google Ads'], budget: 15000, duration_days: 30 } },
      { user_id: userId, type: 'viral_topic', title: '#MarketingAutomation trending op LinkedIn Benelux', description: '3.2x meer engagement deze week in de Benelux.', source: 'LinkedIn Social Listening', priority: 'high', status: 'new', confidence: 88, estimated_impact: 42000, estimated_reach: 280000, trend_velocity: 320, relevance_score: 92, discovered_at: '2026-03-11T06:30:00Z', expires_at: '2026-03-18T00:00:00Z', tags: ['marketing automation', 'LinkedIn', 'Benelux'], suggested_actions: ['Publiceer 3 LinkedIn posts vandaag', 'Deel customer success stories'], related_keywords: ['marketing automation', 'AI marketing'], data_sources: ['LinkedIn Analytics', 'BuzzSumo'] },
      { user_id: userId, type: 'partnership', title: 'HubSpot Benelux Partner Event', description: 'Jaarlijkse partner summit op 15 april. 200+ agencies aanwezig.', source: 'Event Monitoring', priority: 'high', status: 'reviewing', confidence: 82, estimated_impact: 120000, estimated_reach: 15000, trend_velocity: 0, relevance_score: 88, discovered_at: '2026-03-10T14:00:00Z', tags: ['partnership', 'HubSpot', 'agencies'], suggested_actions: ['Contact partner team', 'Bereid demo voor'], related_keywords: ['HubSpot partner', 'martech integration'], data_sources: ['HubSpot Partner Portal'] },
      { user_id: userId, type: 'new_market', title: 'Scandinavische markt: 45% groei in AI marketing spend', description: 'Weinig lokale concurrenten met vergelijkbaar platform.', source: 'Market Research', priority: 'high', status: 'new', confidence: 79, estimated_impact: 340000, estimated_reach: 89000, trend_velocity: 45, relevance_score: 85, discovered_at: '2026-03-10T10:00:00Z', tags: ['scandinavie', 'expansion'], suggested_actions: ['Marktonderzoek verdiepen', 'Vertaal platform naar Zweeds/Deens'], related_keywords: ['Nordic marketing', 'AI marketing Scandinavia'], data_sources: ['Statista', 'CB Insights'] },
      { user_id: userId, type: 'competitor_gap', title: 'Concurrent ActiveCampaign mist AI attribution', description: 'Gebruikers klagen op G2 en Reddit over ontbrekende attribution features.', source: 'Competitive Intelligence', priority: 'medium', status: 'new', confidence: 91, estimated_impact: 67000, estimated_reach: 120000, trend_velocity: 0, relevance_score: 90, discovered_at: '2026-03-09T16:00:00Z', tags: ['competitor', 'ActiveCampaign', 'attribution'], suggested_actions: ['Maak vergelijkingspagina', 'Launch switch campagne'], related_keywords: ['ActiveCampaign alternative'], data_sources: ['G2 Reviews', 'Reddit'] },
      { user_id: userId, type: 'content_gap', title: 'Geen Nederlandstalige AI marketing content in Google top 10', description: 'Voor 23 high-value keywords geen kwalitatieve NL content beschikbaar.', source: 'SEO Gap Analysis', priority: 'high', status: 'approved', confidence: 95, estimated_impact: 28000, estimated_reach: 180000, trend_velocity: 15, relevance_score: 94, discovered_at: '2026-03-08T09:00:00Z', tags: ['SEO', 'content gap', 'Nederlands'], suggested_actions: ['Schrijf 23 SEO-geoptimaliseerde artikelen', 'Maak pillar page'], related_keywords: ['AI marketing uitleg', 'lead scoring betekenis'], data_sources: ['Ahrefs', 'SEMrush'] },
      { user_id: userId, type: 'event', title: 'Web Summit Lisbon 2026 — Early bird tickets beschikbaar', description: '70.000+ attendees, sterke marketing tech track.', source: 'Event Monitoring', priority: 'medium', status: 'new', confidence: 75, estimated_impact: 95000, estimated_reach: 70000, trend_velocity: 0, relevance_score: 78, discovered_at: '2026-03-11T07:00:00Z', tags: ['event', 'Web Summit', 'conference'], suggested_actions: ['Koop early bird ticket', 'Pre-event LinkedIn campagne'], related_keywords: ['Web Summit 2026', 'martech conference'], data_sources: ['Web Summit Website'] },
      { user_id: userId, type: 'trend', title: 'Zero-party data strategie wint terrein', description: 'Zoekopdrachten stegen 180% in Q1 2026 na cookie deprecation.', source: 'Google Trends + Industry Reports', priority: 'medium', status: 'new', confidence: 86, estimated_impact: 52000, estimated_reach: 340000, trend_velocity: 180, relevance_score: 82, discovered_at: '2026-03-10T12:00:00Z', tags: ['zero-party data', 'privacy', 'cookies'], suggested_actions: ['Publiceer guide: Zero-Party Data Strategie', 'Highlight privacy features'], related_keywords: ['zero-party data', 'first-party data', 'cookie deprecation'], data_sources: ['Google Trends', 'eMarketer', 'IAB'] },
    ];
    const { error } = await supabase.from('opportunities').insert(opportunities);
    if (error) throw error;
  }

  // ── Discovered Events (6) ─────────────────────────────────────
  private async seedDiscoveredEvents(userId: string): Promise<void> {
    const events = [
      { user_id: userId, name: 'SaaS Growth Summit Benelux', type: 'conference', description: 'De grootste SaaS conferentie in de Benelux met focus op growth strategies.', location: 'Kinepolis Antwerpen', city: 'Antwerpen', country: 'Belgium', date_start: '2026-04-15', date_end: '2026-04-16', website: 'saasgrowthsummit.be', expected_attendees: 1200, target_audience_match: 94, estimated_roi: 450, estimated_leads: 85, networking_value: 92, cost: { ticket: 890, travel: 150, accommodation: 280, booth: 4500, total: 5820 }, speakers: ['Pieter Levels', 'Sarah Mueller', 'Jonas Van der Auwera'], topics: ['SaaS Growth', 'Marketing AI', 'Product-Led Growth', 'B2B Sales'], status: 'registered', priority_score: 96, ai_recommendation: 'Sterk aanbevolen. Hoge doelgroep match.', competitors_attending: ['Hubspot', 'Mailchimp'], tags: ['premium', 'Benelux', 'SaaS'] },
      { user_id: userId, name: 'Digital Marketing World Forum', type: 'conference', description: 'Internationaal marketing event met tracks over AI, attribution, content marketing.', location: 'RAI Amsterdam', city: 'Amsterdam', country: 'Netherlands', date_start: '2026-05-08', date_end: '2026-05-10', website: 'dmwf.eu', expected_attendees: 3500, target_audience_match: 88, estimated_roi: 380, estimated_leads: 120, networking_value: 85, cost: { ticket: 1200, travel: 200, accommodation: 560, booth: 8000, total: 9960 }, speakers: ['Ann Handley', 'Rand Fishkin'], topics: ['Marketing AI', 'Attribution', 'Content Strategy'], status: 'evaluating', priority_score: 91, ai_recommendation: 'Groot publiek met hoge relevantie.', competitors_attending: ['Marketo', 'Pardot', 'ActiveCampaign'], tags: ['international', 'marketing', 'AI'] },
      { user_id: userId, name: 'Brussels AI & Data Meetup', type: 'meetup', description: 'Maandelijkse meetup voor AI professionals en data scientists in Brussel.', location: 'BeCentral, Brussel', city: 'Brussel', country: 'Belgium', date_start: '2026-03-20', date_end: '2026-03-20', website: 'meetup.com/brussels-ai', expected_attendees: 150, target_audience_match: 72, estimated_roi: 250, estimated_leads: 12, networking_value: 78, cost: { ticket: 0, travel: 30, accommodation: 0, total: 30 }, speakers: ['Community speakers'], topics: ['AI', 'Machine Learning', 'Data Science'], status: 'discovered', priority_score: 68, ai_recommendation: 'Laag budget, goede netwerkkans.', competitors_attending: [], tags: ['free', 'networking', 'Brussels'] },
      { user_id: userId, name: 'E-commerce Expo Belgium', type: 'trade_show', description: 'De grootste e-commerce beurs in Belgie.', location: 'Brussels Expo', city: 'Brussel', country: 'Belgium', date_start: '2026-06-03', date_end: '2026-06-04', website: 'ecommerceexpo.be', expected_attendees: 5000, target_audience_match: 65, estimated_roi: 220, estimated_leads: 95, networking_value: 70, cost: { ticket: 450, travel: 50, accommodation: 0, booth: 6000, total: 6500 }, speakers: ['Various industry leaders'], topics: ['E-commerce', 'Digital Marketing', 'Personalization'], status: 'discovered', priority_score: 72, ai_recommendation: 'Groot publiek maar lagere doelgroep match.', competitors_attending: ['Klaviyo', 'Emarsys'], tags: ['e-commerce', 'Belgium'] },
      { user_id: userId, name: 'MarTech Conference London', type: 'conference', description: 'Premier marketing technology conference met focus op martech landscape en AI.', location: 'ExCeL London', city: 'London', country: 'UK', date_start: '2026-06-18', date_end: '2026-06-19', website: 'martechconf.com', expected_attendees: 4200, target_audience_match: 96, estimated_roi: 520, estimated_leads: 150, networking_value: 95, cost: { ticket: 1500, travel: 350, accommodation: 800, booth: 12000, total: 14650 }, speakers: ['Scott Brinker', 'Marketing AI experts'], topics: ['MarTech', 'AI Marketing', 'CDP', 'Marketing Operations'], status: 'evaluating', priority_score: 98, ai_recommendation: 'Hoogste prioriteit. Perfect doelgroep match.', competitors_attending: ['HubSpot', 'Salesforce', 'Adobe'], tags: ['premium', 'international', 'martech'] },
      { user_id: userId, name: 'Startup Weekend Gent', type: 'hackathon', description: '54-uur hackathon voor startups en innovators.', location: 'De Krook, Gent', city: 'Gent', country: 'Belgium', date_start: '2026-04-25', date_end: '2026-04-27', website: 'startupweekend.gent', expected_attendees: 200, target_audience_match: 55, estimated_roi: 180, estimated_leads: 15, networking_value: 65, cost: { ticket: 75, travel: 40, accommodation: 0, total: 115 }, speakers: ['Local entrepreneurs'], topics: ['Startups', 'Innovation', 'Growth Hacking'], status: 'discovered', priority_score: 52, ai_recommendation: 'Laag budget kans. Goed voor employer branding.', competitors_attending: [], tags: ['startup', 'hackathon', 'Gent'] },
    ];
    const { error } = await supabase.from('discovered_events').insert(events);
    if (error) throw error;
  }

  // ── Campaign Triggers (6) ─────────────────────────────────────
  private async seedCampaignTriggers(userId: string): Promise<void> {
    const triggers = [
      { user_id: userId, name: 'Trending Topic Detector', type: 'trend_detected', description: 'Detecteert trending topics en start automatisch thought leadership content', condition: 'trend_velocity > 150% AND relevance_score > 80', status: 'active', actions: ['linkedin_posts', 'blog_article', 'email_sequence'], channels: ['LinkedIn', 'Blog', 'Email'], budget_limit: 5000, confidence_threshold: 85, requires_approval: false, times_triggered: 12, last_triggered: '2026-03-11T08:00:00Z', performance: { campaigns_launched: 12, total_reach: 890000, leads_generated: 234, revenue_impact: 156000, avg_roi: 340 } },
      { user_id: userId, name: 'Competitor Gap Exploiter', type: 'competitor_move', description: 'Detecteert zwakheden bij concurrenten en lanceert vergelijkings-campagnes', condition: 'competitor_negative_reviews > 10 AND our_feature_available = true', status: 'active', actions: ['google_ads', 'landing_page', 'social_ads'], channels: ['Google Ads', 'Landing Page', 'Facebook'], budget_limit: 8000, confidence_threshold: 80, requires_approval: true, times_triggered: 5, last_triggered: '2026-03-09T16:00:00Z', performance: { campaigns_launched: 5, total_reach: 450000, leads_generated: 89, revenue_impact: 234000, avg_roi: 480 } },
      { user_id: userId, name: 'High-Intent Lead Accelerator', type: 'lead_behavior', description: 'Detecteert leads met hoge koopintentie en triggert personalized nurture', condition: 'lead_score > 80 AND pricing_page_views >= 3', status: 'active', actions: ['email_sequence', 'linkedin_posts'], channels: ['Email', 'LinkedIn'], budget_limit: 2000, confidence_threshold: 75, requires_approval: false, times_triggered: 34, last_triggered: '2026-03-11T09:15:00Z', performance: { campaigns_launched: 34, total_reach: 12000, leads_generated: 34, revenue_impact: 890000, avg_roi: 1200 } },
      { user_id: userId, name: 'Performance Threshold Optimizer', type: 'performance_threshold', description: 'Pauzeert underperforming campagnes en herverdelt budget automatisch', condition: 'campaign_roas < 1.5 AND running_days > 7', status: 'active', actions: ['multi_channel'], channels: ['All Active'], budget_limit: 0, confidence_threshold: 90, requires_approval: false, times_triggered: 18, last_triggered: '2026-03-10T09:30:00Z', performance: { campaigns_launched: 0, total_reach: 0, leads_generated: 0, revenue_impact: 67000, avg_roi: 0 } },
      { user_id: userId, name: 'Seasonal Campaign Launcher', type: 'seasonal', description: 'Lanceert seizoensgebonden campagnes op basis van kalender en historische data', condition: 'season_event_approaching AND days_until_event <= 30', status: 'active', actions: ['multi_channel'], channels: ['LinkedIn', 'Email', 'Google Ads', 'Blog'], budget_limit: 15000, confidence_threshold: 70, requires_approval: true, times_triggered: 4, last_triggered: '2026-03-01T00:00:00Z', performance: { campaigns_launched: 4, total_reach: 560000, leads_generated: 145, revenue_impact: 189000, avg_roi: 280 } },
      { user_id: userId, name: 'Event Buzz Amplifier', type: 'event_based', description: 'Detecteert aankomende events en start pre-event awareness campagnes', condition: 'registered_event AND days_until_event <= 14', status: 'active', actions: ['linkedin_posts', 'email_sequence', 'social_ads'], channels: ['LinkedIn', 'Email', 'Instagram'], budget_limit: 3000, confidence_threshold: 75, requires_approval: false, times_triggered: 8, last_triggered: '2026-03-08T00:00:00Z', performance: { campaigns_launched: 8, total_reach: 234000, leads_generated: 67, revenue_impact: 78000, avg_roi: 320 } },
    ];
    const { error } = await supabase.from('campaign_triggers').insert(triggers);
    if (error) throw error;
  }

  // ── Lead Profiles (3) ──────────────────────────────────────────
  private async seedLeadProfiles(userId: string): Promise<void> {
    const profiles = [
      {
        user_id: userId, name: 'Sophie Van den Berg', email: 'sophie@techcorp.be', company: 'TechCorp Belgium', title: 'Marketing Director', intent_level: 'very_high', intent_score: 96, buying_stage: 'decision',
        website_behavior: { total_visits: 47, pages_viewed: 156, avg_session_duration: 340, last_visit: '2026-03-11T09:00:00Z', top_pages: ['/pricing', '/features/attribution', '/docs/api'], bounce_rate: 8 },
        social_activity: { linkedin_engagements: 12, twitter_mentions: 0, content_shares: 3, community_posts: 1 },
        engagement_timeline: [{ date: '2026-02-24', score: 45, event: 'First blog visit' }, { date: '2026-03-01', score: 58, event: 'Newsletter signup' }, { date: '2026-03-09', score: 88, event: 'Demo request' }, { date: '2026-03-11', score: 96, event: 'Pricing page (5th visit)' }],
        predicted_actions: { buy_probability: 0.87, churn_risk: 0.03, upsell_potential: 0.72, best_channel: 'Direct call', best_time: 'Dinsdag 10:00-11:00', next_best_action: 'Schedule executive demo with CTO' },
        company_intel: { size: '200-500', industry: 'Technology', revenue: '20M-50M', tech_stack: ['HubSpot', 'Salesforce', 'Google Analytics', 'React'], recent_news: ['Series B funding: EUR 12M', 'Expanded to DACH market'], growth_signals: ['Hiring 3 marketing roles', 'New CMO appointed'] },
      },
      {
        user_id: userId, name: 'Claire Fontaine', email: 'claire@agencebleu.fr', company: 'Agence Bleu', title: 'Account Director', intent_level: 'very_high', intent_score: 93, buying_stage: 'purchase',
        website_behavior: { total_visits: 52, pages_viewed: 189, avg_session_duration: 280, last_visit: '2026-03-10T11:00:00Z', top_pages: ['/pricing/enterprise', '/security', '/compliance'], bounce_rate: 5 },
        social_activity: { linkedin_engagements: 8, twitter_mentions: 2, content_shares: 5, community_posts: 0 },
        engagement_timeline: [{ date: '2026-02-10', score: 60, event: 'Partner referral visit' }, { date: '2026-03-01', score: 85, event: 'Enterprise demo' }, { date: '2026-03-10', score: 93, event: 'Legal review initiated' }],
        predicted_actions: { buy_probability: 0.91, churn_risk: 0.02, upsell_potential: 0.85, best_channel: 'Email', best_time: 'Woensdag 09:00', next_best_action: 'Send final contract with onboarding timeline' },
        company_intel: { size: '50-200', industry: 'Marketing Agency', revenue: '10M-20M', tech_stack: ['Adobe Creative Suite', 'Salesforce', 'Hootsuite'], recent_news: ['Won Cannes Lions award', 'Opened Brussels office'], growth_signals: ['Portfolio expansion', 'Hiring account managers'] },
      },
      {
        user_id: userId, name: 'Thomas De Smedt', email: 'thomas@growthlab.nl', company: 'GrowthLab Netherlands', title: 'CEO', intent_level: 'high', intent_score: 82, buying_stage: 'consideration',
        website_behavior: { total_visits: 34, pages_viewed: 98, avg_session_duration: 210, last_visit: '2026-03-10T09:15:00Z', top_pages: ['/compare/hubspot', '/features', '/pricing'], bounce_rate: 15 },
        social_activity: { linkedin_engagements: 5, twitter_mentions: 0, content_shares: 1, community_posts: 0 },
        engagement_timeline: [{ date: '2026-02-17', score: 30, event: 'LinkedIn ad click' }, { date: '2026-03-03', score: 65, event: 'Features exploration' }, { date: '2026-03-10', score: 82, event: 'Competitor comparison' }],
        predicted_actions: { buy_probability: 0.64, churn_risk: 0.15, upsell_potential: 0.60, best_channel: 'LinkedIn', best_time: 'Donderdag 14:00', next_best_action: 'Send team demo invitation targeting multiple stakeholders' },
        company_intel: { size: '50-200', industry: 'Consulting', revenue: '5M-20M', tech_stack: ['HubSpot', 'Slack', 'Notion'], recent_news: ['Acquired data analytics firm'], growth_signals: ['Hiring data team', 'New enterprise practice'] },
      },
    ];
    const { error } = await supabase.from('lead_profiles').insert(profiles);
    if (error) throw error;
  }

  // ── Feed Items (10) ────────────────────────────────────────────
  private async seedFeedItems(userId: string): Promise<void> {
    const items = [
      { user_id: userId, type: 'lead_signal', title: 'Hot lead: Sophie Van den Berg vraagt enterprise demo', description: 'Lead score gestegen van 86 naar 94. Hoge koopintentie gedetecteerd.', urgency: 'immediate', confidence: 94, estimated_value: 45000, source: 'Lead Scoring Engine', timestamp: '2026-03-11T09:15:00Z', is_read: false, is_actioned: false, suggested_action: { label: 'Plan executive demo', action_type: 'book_meeting' }, related_entities: [{ type: 'lead', id: 'lead-001', name: 'Sophie Van den Berg' }], impact_metrics: { revenue: 45000, leads: 1 }, tags: ['hot-lead', 'enterprise'] },
      { user_id: userId, type: 'trend_alert', title: 'AI Governance trending +240%', description: 'Google Trends toont explosieve groei. First-mover advantage beschikbaar.', urgency: 'today', confidence: 94, estimated_value: 85000, source: 'Opportunity Intelligence', timestamp: '2026-03-11T08:00:00Z', is_read: false, is_actioned: false, suggested_action: { label: 'Start thought leadership campagne', action_type: 'launch_campaign' }, related_entities: [{ type: 'opportunity', id: 'opp-001', name: 'AI Governance Trend' }], impact_metrics: { reach: 450000, leads: 120, revenue: 85000 }, tags: ['trend', 'AI', 'content'] },
      { user_id: userId, type: 'campaign_trigger', title: 'Automatische campagne trigger: #MarketingAutomation viral', description: 'Social listening detecteert 3.2x engagement spike op LinkedIn Benelux.', urgency: 'immediate', confidence: 88, estimated_value: 42000, source: 'Social Agent + Publication Engine', timestamp: '2026-03-11T06:30:00Z', is_read: true, is_actioned: false, suggested_action: { label: 'Publiceer 3 LinkedIn posts', action_type: 'create_content' }, related_entities: [{ type: 'opportunity', id: 'opp-002', name: '#MarketingAutomation trending' }], impact_metrics: { reach: 280000, leads: 45 }, tags: ['viral', 'LinkedIn'] },
      { user_id: userId, type: 'event_opportunity', title: 'MarTech Conference London — Perfect doelgroep match (96%)', description: 'AI berekent 520% verwachte ROI. Early bird tickets nu beschikbaar.', urgency: 'this_week', confidence: 82, estimated_value: 95000, source: 'Event Intelligence', timestamp: '2026-03-11T07:00:00Z', is_read: false, is_actioned: false, suggested_action: { label: 'Registreer als sponsor', action_type: 'register_event' }, related_entities: [{ type: 'event', id: 'evt-005', name: 'MarTech Conference London' }], impact_metrics: { reach: 70000, leads: 150, revenue: 95000, roi: 520 }, tags: ['event', 'London'] },
      { user_id: userId, type: 'competitor_move', title: 'ActiveCampaign mist AI attribution', description: 'G2 reviews tonen ontevredenheid over ontbrekende attribution features.', urgency: 'today', confidence: 91, estimated_value: 67000, source: 'Competitive Intelligence', timestamp: '2026-03-11T05:00:00Z', is_read: true, is_actioned: false, suggested_action: { label: 'Launch switch campagne', action_type: 'launch_campaign' }, related_entities: [{ type: 'competitor', id: 'comp-ac', name: 'ActiveCampaign' }], impact_metrics: { reach: 120000, leads: 35, revenue: 67000 }, tags: ['competitor', 'attribution'] },
      { user_id: userId, type: 'partnership_match', title: 'HubSpot Benelux Partner Summit', description: 'Jaarlijkse partner summit op 15 april. 200+ agencies aanwezig.', urgency: 'this_week', confidence: 82, estimated_value: 120000, source: 'Partnership Intelligence', timestamp: '2026-03-10T14:00:00Z', is_read: false, is_actioned: false, suggested_action: { label: 'Contact partner team', action_type: 'send_email' }, related_entities: [{ type: 'partner', id: 'partner-hs', name: 'HubSpot' }], impact_metrics: { leads: 200, revenue: 120000 }, tags: ['partnership', 'HubSpot'] },
      { user_id: userId, type: 'budget_optimization', title: 'Budget herverdeling: Facebook -> Google Shopping', description: 'Ads Agent detecteert dalende ROAS op Facebook. Herverdeling bespaart EUR 4.200/maand.', urgency: 'today', confidence: 89, estimated_value: 4200, source: 'Ads Agent', timestamp: '2026-03-11T09:15:00Z', is_read: false, is_actioned: false, suggested_action: { label: 'Approve budget shift', action_type: 'adjust_budget' }, related_entities: [{ type: 'campaign', id: 'fb-2847', name: 'Facebook Campaign #2847' }], impact_metrics: { revenue: 4200, roi: 180 }, tags: ['budget', 'optimization'] },
      { user_id: userId, type: 'content_opportunity', title: '23 SEO keywords zonder NL content in top 10', description: 'Gap analyse toont 23 high-value keywords. Geschatte organisch verkeer: 180.000/maand.', urgency: 'this_week', confidence: 95, estimated_value: 28000, source: 'SEO Gap Analysis', timestamp: '2026-03-10T09:00:00Z', is_read: true, is_actioned: true, suggested_action: { label: 'Start content productie', action_type: 'create_content' }, related_entities: [{ type: 'opportunity', id: 'opp-006', name: 'NL Content Gap' }], impact_metrics: { reach: 180000, leads: 80, revenue: 28000 }, tags: ['SEO', 'content', 'Nederlands'] },
      { user_id: userId, type: 'lead_signal', title: 'Multi-stakeholder activiteit: GrowthLab Netherlands', description: '4 medewerkers hebben deze week de website bezocht.', urgency: 'today', confidence: 89, estimated_value: 62000, source: 'Lead Intelligence', timestamp: '2026-03-11T09:00:00Z', is_read: false, is_actioned: false, suggested_action: { label: 'Stuur team demo uitnodiging', action_type: 'send_email' }, related_entities: [{ type: 'lead', id: 'lead-002', name: 'Thomas De Smedt' }], impact_metrics: { revenue: 62000, leads: 4 }, tags: ['multi-stakeholder', 'enterprise'] },
      { user_id: userId, type: 'campaign_trigger', title: 'Webinar follow-up: 45 attendees wachten op nurture', description: 'Post-webinar analyse toont 3.2x snellere conversie. Nurture sequence niet geactiveerd.', urgency: 'immediate', confidence: 92, estimated_value: 34000, source: 'Email Agent + Analytics', timestamp: '2026-03-11T08:30:00Z', is_read: false, is_actioned: false, suggested_action: { label: 'Activeer nurture sequence', action_type: 'send_email' }, related_entities: [{ type: 'webinar', id: 'web-attr', name: 'AI Attribution Webinar' }], impact_metrics: { leads: 45, revenue: 34000 }, tags: ['webinar', 'follow-up'] },
    ];
    const { error } = await supabase.from('feed_items').insert(items);
    if (error) throw error;
  }

  // ── Captured Contacts (5) ──────────────────────────────────────
  private async seedCapturedContacts(userId: string): Promise<void> {
    const contacts = [
      { user_id: userId, name: 'Marc Van Hoeck', email: 'marc@techventures.be', phone: '+32 476 123 456', company: 'TechVentures Belgium', title: 'CTO', linkedin_url: 'linkedin.com/in/marcvanhoeck', capture_method: 'qr_code', captured_at: '2026-03-10T14:30:00Z', event_name: 'SaaS Growth Summit Benelux', status: 'enriched', enrichment: { company_size: '50-200', industry: 'Technology', revenue_range: '5M-20M', location: 'Antwerpen', technologies: ['React', 'AWS', 'HubSpot'], social_profiles: ['linkedin', 'twitter'], score: 87 }, ai_insights: { intent_score: 82, best_channel: 'LinkedIn', best_time: 'Dinsdag 10:00', suggested_follow_up: 'Stuur case study over tech sector + demo uitnodiging', talking_points: ['AI attribution uitdagingen', 'Gebruikt momenteel HubSpot'], mutual_connections: 4 }, follow_up: { template: 'tech-sector-intro', scheduled_at: '2026-03-12T10:00:00Z', sent: false, opened: false, replied: false }, notes: 'Zeer geinteresseerd in multi-touch attribution.', tags: ['hot-lead', 'tech', 'SaaS Summit'] },
      { user_id: userId, name: 'Isabelle Claessens', email: 'isabelle@brandcraft.nl', company: 'BrandCraft Agency', title: 'Managing Partner', linkedin_url: 'linkedin.com/in/isabelleclaessens', capture_method: 'linkedin_scan', captured_at: '2026-03-10T15:45:00Z', event_name: 'SaaS Growth Summit Benelux', status: 'follow_up_sent', enrichment: { company_size: '10-50', industry: 'Marketing Agency', revenue_range: '2M-5M', location: 'Rotterdam', technologies: ['Adobe', 'Salesforce'], social_profiles: ['linkedin'], score: 78 }, ai_insights: { intent_score: 75, best_channel: 'Email', best_time: 'Woensdag 09:00', suggested_follow_up: 'Agency partnership voorstel + white-label demo', talking_points: ['Zoekt AI tools voor klanten', 'Budget approved voor Q2'], mutual_connections: 2 }, follow_up: { template: 'agency-partnership', scheduled_at: '2026-03-11T09:00:00Z', sent: true, opened: true, replied: false }, notes: 'Agency met 40+ klanten. Zoekt white-label platform.', tags: ['agency', 'partnership'] },
      { user_id: userId, name: 'Thomas Schneider', email: 'tschneider@globalretail.de', company: 'GlobalRetail GmbH', title: 'Head of Digital', capture_method: 'business_card', captured_at: '2026-03-09T11:00:00Z', event_name: 'Digital Meetup Berlin', status: 'synced_crm', enrichment: { company_size: '1000+', industry: 'Retail', revenue_range: '100M+', location: 'Berlin', technologies: ['SAP', 'Salesforce', 'Google Analytics'], social_profiles: ['linkedin', 'xing'], score: 92 }, ai_insights: { intent_score: 68, best_channel: 'Email', best_time: 'Maandag 08:00', suggested_follow_up: 'Enterprise demo + retail case studies', talking_points: ['Attribution across 200+ stores', 'Groot marketing team'], mutual_connections: 1 }, follow_up: { template: 'enterprise-retail', sent: false, opened: false, replied: false }, notes: 'Enterprise account. Enorm potentieel.', tags: ['enterprise', 'retail', 'Germany'] },
      { user_id: userId, name: 'Aisha Rahman', email: 'aisha@startupboost.io', company: 'StartupBoost', title: 'Founder', capture_method: 'nfc', captured_at: '2026-03-08T16:20:00Z', event_name: 'Startup Drinks Brussels', status: 'meeting_booked', enrichment: { company_size: '1-10', industry: 'Startup Accelerator', revenue_range: '<1M', location: 'Brussels', technologies: ['No-code tools', 'Zapier'], social_profiles: ['linkedin', 'twitter', 'instagram'], score: 65 }, ai_insights: { intent_score: 88, best_channel: 'WhatsApp', best_time: 'Vrijdag 14:00', suggested_follow_up: 'Startup plan demo + portfolio integratie', talking_points: ['Accelerator met 20 startups', 'Snelle beslisser'], mutual_connections: 6 }, follow_up: { template: 'startup-accelerator', scheduled_at: '2026-03-11T14:00:00Z', sent: true, opened: true, replied: true }, notes: 'Meeting gepland. Wil Inclufy als standaard tool voor portfolio startups.', tags: ['startup', 'accelerator', 'meeting-booked'] },
      { user_id: userId, name: 'Jan-Willem de Boer', email: 'jw@mediagroep.nl', company: 'Nederlandse MediaGroep', title: 'Marketing Director', capture_method: 'event_badge', captured_at: '2026-03-07T10:15:00Z', event_name: 'MarTech Day Netherlands', status: 'converted', enrichment: { company_size: '200-500', industry: 'Media', revenue_range: '20M-50M', location: 'Hilversum', technologies: ['Google Marketing Platform', 'DV360'], social_profiles: ['linkedin'], score: 88 }, ai_insights: { intent_score: 95, best_channel: 'Phone', best_time: 'Dinsdag 11:00', suggested_follow_up: 'Contract voorstel + onboarding plan', talking_points: ['Deal gesloten: Enterprise plan', 'Implementatie start volgende week'], mutual_connections: 3 }, follow_up: { template: 'onboarding', sent: true, opened: true, replied: true }, notes: 'GEWONNEN! Enterprise deal. EUR 78,000/jaar.', tags: ['customer', 'enterprise', 'media', 'won'] },
    ];
    const { error } = await supabase.from('captured_contacts').insert(contacts);
    if (error) throw error;
  }

  // ── QR Codes (3) ───────────────────────────────────────────────
  private async seedQRCodes(userId: string): Promise<void> {
    const codes = [
      { user_id: userId, name: 'SaaS Summit Booth QR', url: 'https://inclufy.com/connect/saas-summit', scans: 234, leads_captured: 67, created_at: '2026-03-01', active: true },
      { user_id: userId, name: 'General Contact Card', url: 'https://inclufy.com/connect/team', scans: 89, leads_captured: 34, created_at: '2026-02-15', active: true },
      { user_id: userId, name: 'Product Demo Link', url: 'https://inclufy.com/demo', scans: 456, leads_captured: 123, created_at: '2026-01-10', active: true },
    ];
    const { error } = await supabase.from('qr_codes').insert(codes);
    if (error) throw error;
  }

  // ── Intent Signals (8) ─────────────────────────────────────────
  private async seedIntentSignals(userId: string): Promise<void> {
    const signals = [
      { user_id: userId, lead_name: 'Sophie Van den Berg', company: 'TechCorp Belgium', type: 'pricing_view', description: 'Pricing pagina bezocht (5e keer)', strength: 95, timestamp: '2026-03-11T09:00:00Z', page_url: '/pricing', duration_seconds: 180 },
      { user_id: userId, lead_name: 'Sophie Van den Berg', company: 'TechCorp Belgium', type: 'api_docs', description: 'API documentatie bekeken', strength: 88, timestamp: '2026-03-10T16:00:00Z', page_url: '/docs/api', duration_seconds: 420 },
      { user_id: userId, lead_name: 'Claire Fontaine', company: 'Agence Bleu', type: 'form_submission', description: 'Contract terms besproken — legal review gestart', strength: 98, timestamp: '2026-03-10T11:00:00Z' },
      { user_id: userId, lead_name: 'Thomas De Smedt', company: 'GrowthLab Netherlands', type: 'competitor_comparison', description: 'Inclufy vs HubSpot vergelijking bekeken', strength: 82, timestamp: '2026-03-10T09:00:00Z', page_url: '/compare/hubspot', duration_seconds: 300 },
      { user_id: userId, lead_name: 'Jan Willems', company: 'Mediahuis', type: 'content_download', description: 'Attribution whitepaper gedownload', strength: 72, timestamp: '2026-03-09T15:00:00Z' },
      { user_id: userId, lead_name: 'Eva Johansson', company: 'ScandiBrand AB', type: 'social_interaction', description: 'LinkedIn post geliked en gedeeld', strength: 55, timestamp: '2026-03-09T12:00:00Z' },
      { user_id: userId, lead_name: 'Ahmed El Fassi', company: 'DigiWave Morocco', type: 'page_view', description: 'Product tour pagina (12 min sessie)', strength: 68, timestamp: '2026-03-10T08:00:00Z' },
      { user_id: userId, lead_name: 'Marie-Claire Dubois', company: 'Luxe Brands Paris', type: 'event_attendance', description: 'Webinar AI Attribution bijgewoond', strength: 75, timestamp: '2026-03-08T14:00:00Z' },
    ];
    const { error } = await supabase.from('intent_signals').insert(signals);
    if (error) throw error;
  }

  // ── Triggered Campaigns (4) ────────────────────────────────────
  private async seedTriggeredCampaigns(userId: string): Promise<void> {
    const campaigns = [
      { user_id: userId, trigger_name: 'Trending Topic Detector', campaign_name: 'AI Governance Thought Leadership', signal: 'AI Governance zoekvolume +240%', channels: ['LinkedIn', 'Blog', 'Email'], budget_allocated: 4500, status: 'active', launched_at: '2026-03-11T08:30:00Z', performance: { impressions: 12000, clicks: 890, leads: 23, conversions: 5, revenue: 12000, roi: 167 }, ai_reasoning: 'Explosieve groei in AI governance interesse gedetecteerd. First-mover advantage window: ~14 dagen.', content_generated: [{ type: 'LinkedIn Post', title: 'AI Governance: Wat elke marketeer moet weten', status: 'published' }, { type: 'Blog Article', title: 'Complete Gids: AI Governance voor Marketing Teams', status: 'writing' }] },
      { user_id: userId, trigger_name: 'High-Intent Lead Accelerator', campaign_name: 'Enterprise Demo Push — Sophie Van den Berg', signal: 'Lead score 86->94, pricing page 5x bezocht', channels: ['Email', 'LinkedIn'], budget_allocated: 500, status: 'active', launched_at: '2026-03-11T09:20:00Z', performance: { impressions: 15, clicks: 3, leads: 1, conversions: 0, revenue: 0, roi: 0 }, ai_reasoning: 'Hoge koopintentie gedetecteerd. Estimated deal value: EUR 45.000.', content_generated: [{ type: 'Email', title: 'Personalized enterprise demo invite', status: 'sent' }, { type: 'LinkedIn InMail', title: 'Connection request + value proposition', status: 'sent' }] },
      { user_id: userId, trigger_name: 'Competitor Gap Exploiter', campaign_name: 'Switch from ActiveCampaign', signal: '23 negatieve G2 reviews over ontbrekende attribution', channels: ['Google Ads', 'Landing Page'], budget_allocated: 6000, status: 'pending_approval', launched_at: '2026-03-10T10:00:00Z', performance: { impressions: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0, roi: 0 }, ai_reasoning: 'ActiveCampaign gebruikers uiten ontevredenheid. Verwachte CPA: EUR 45.', content_generated: [{ type: 'Landing Page', title: 'Inclufy vs ActiveCampaign', status: 'ready' }, { type: 'Google Ad Set', title: '3 ad varianten targeting AC keywords', status: 'ready' }] },
      { user_id: userId, trigger_name: 'Event Buzz Amplifier', campaign_name: 'Pre-SaaS Summit Awareness', signal: 'SaaS Growth Summit in 5 dagen', channels: ['LinkedIn', 'Email', 'Instagram'], budget_allocated: 2500, status: 'completed', launched_at: '2026-03-05T08:00:00Z', performance: { impressions: 89000, clicks: 4500, leads: 45, conversions: 12, revenue: 34000, roi: 1260 }, ai_reasoning: 'Pre-event campagne maximaliseert booth traffic en meeting bookings.', content_generated: [{ type: 'LinkedIn Posts', title: '5 posts: countdown to SaaS Summit', status: 'published' }, { type: 'Email', title: 'Meet us at SaaS Summit booth #42', status: 'sent' }] },
    ];
    const { error } = await supabase.from('triggered_campaigns').insert(campaigns);
    if (error) throw error;
  }

  // ── Autonomous Decisions (2) ───────────────────────────────────
  private async seedAutonomousDecisions(userId: string): Promise<void> {
    const decisions = [
      {
        user_id: userId, type: 'campaign_creation', title: 'Launch Holiday Flash Sale Campaign',
        description: 'AI recommends launching a 48-hour flash sale targeting high-value customers based on detected buying patterns',
        priority: 'high', confidence: 92, estimated_impact: { description: '+EUR 125K revenue', revenue: 125000, cost_savings: 0 }, risk_level: 'medium', cost_estimate: 15000,
        requires_approval: true, status: 'pending',
        decision_data: { target_audience: 'high_value_customers', discount: '25%', duration: '48_hours', channels: ['email', 'sms', 'push'] },
      },
      {
        user_id: userId, type: 'budget_allocation', title: 'Reallocate Budget to High-Performing Channels',
        description: 'Shift EUR 10K from underperforming Facebook ads to Google Shopping campaigns showing 3x better ROI',
        priority: 'critical', confidence: 95, estimated_impact: { description: '+45% ROI improvement', revenue: 0, cost_savings: 10000 }, risk_level: 'low', cost_estimate: 0,
        requires_approval: false, status: 'pending',
        decision_data: { from_channel: 'facebook_ads', to_channel: 'google_shopping', amount: 10000, reason: 'performance_optimization' },
      },
    ];
    const { error } = await supabase.from('autonomous_decisions').insert(decisions);
    if (error) throw error;
  }

  // ── Autonomous Campaign Status (3) ─────────────────────────────
  private async seedAutonomousCampaignStatus(userId: string): Promise<void> {
    const campaigns = [
      { user_id: userId, name: 'Black Friday Early Access', description: 'AI-managed early bird campaign for loyal customers', status: 'running', objective: 'Revenue maximization', budget_total: 50000, budget_spent: 32000, days_remaining: 5, roi: 285, conversions: 1247, ai_managed: true, performance_score: 92 },
      { user_id: userId, name: 'Abandoned Cart Recovery 2.0', description: 'Dynamic pricing and personalized messaging for cart recovery', status: 'optimizing', objective: 'Conversion optimization', budget_total: 20000, budget_spent: 8500, days_remaining: 12, roi: 425, conversions: 523, ai_managed: true, performance_score: 88 },
      { user_id: userId, name: 'Competitor Conquest Campaign', description: 'Target competitor customers with superior value props', status: 'running', objective: 'Market share capture', budget_total: 75000, budget_spent: 41000, days_remaining: 8, roi: 167, conversions: 892, ai_managed: true, performance_score: 79 },
    ];
    const { error } = await supabase.from('autonomous_campaign_status').insert(campaigns);
    if (error) throw error;
  }

  // ── Publishable Content (15 = 10 queue + 5 published) ──────────
  private async seedPublishableContent(userId: string): Promise<void> {
    const content = [
      // Queue items
      { user_id: userId, title: 'Q1 Marketing Results Highlight', body: 'Our AI-driven campaigns delivered outstanding ROI this quarter...', media_urls: ['/images/q1-results.png'], content_type: 'post', channels: ['linkedin', 'facebook'], status: 'scheduled', scheduled_at: '2026-03-10T14:00:00Z', auto_scheduled: true, optimal_time_reason: 'Peak LinkedIn engagement: Tue 14:00-15:00 CET', created_by: 'ai_agent', tags: ['performance', 'quarterly'], campaign_id: 'camp-q1' },
      { user_id: userId, title: 'New Feature Launch: Predictive Lead Scoring', body: 'Introducing AI-powered lead scoring that predicts purchase intent with high accuracy...', media_urls: ['/images/lead-scoring-feature.png'], content_type: 'article', channels: ['linkedin', 'blog'], status: 'queued', auto_scheduled: false, created_by: 'user', tags: ['product', 'launch', 'AI'] },
      { user_id: userId, title: 'Behind the Scenes: Team Workshop', body: 'Our team exploring the latest in marketing AI...', media_urls: ['/images/team-workshop.jpg'], content_type: 'story', channels: ['instagram', 'facebook'], status: 'draft', auto_scheduled: false, created_by: 'user', tags: ['culture', 'team'] },
      { user_id: userId, title: 'Email: Spring Campaign Kickoff', body: 'Dear {{first_name}}, Spring is here and so are fresh marketing strategies...', media_urls: [], content_type: 'email', channels: ['email'], status: 'scheduled', scheduled_at: '2026-03-11T09:00:00Z', auto_scheduled: true, optimal_time_reason: 'Optimal email open rate: Wed 09:00 CET', created_by: 'ai_agent', tags: ['email', 'spring'], campaign_id: 'camp-spring' },
      { user_id: userId, title: '5 Marketing Automation Trends for 2026', body: 'The landscape of marketing automation is evolving rapidly...', media_urls: ['/images/trends-2026.png'], content_type: 'post', channels: ['linkedin', 'twitter', 'facebook'], status: 'publishing', auto_scheduled: false, created_by: 'user', tags: ['trends', 'thought-leadership'] },
      { user_id: userId, title: 'Customer Success Story: TechCorp BV', body: 'How TechCorp increased their lead generation significantly using Inclufy...', media_urls: ['/images/techcorp-case.png'], content_type: 'article', channels: ['linkedin', 'blog', 'email'], status: 'queued', auto_scheduled: false, created_by: 'user', tags: ['case-study', 'social-proof'] },
      { user_id: userId, title: 'Weekly AI Tip: Audience Segmentation', body: 'Pro tip: Use behavioral micro-segments for better targeting...', media_urls: ['/images/ai-tip-7.png'], content_type: 'post', channels: ['linkedin', 'twitter', 'instagram'], status: 'scheduled', scheduled_at: '2026-03-12T12:00:00Z', auto_scheduled: true, optimal_time_reason: 'Engagement peak for educational content: Thu 12:00', created_by: 'ai_agent', tags: ['tip', 'AI', 'weekly'] },
      { user_id: userId, title: 'Product Demo Reel', body: 'See Inclufy Marketing in action - from setup to first campaign in 5 minutes', media_urls: ['/videos/demo-reel.mp4'], content_type: 'reel', channels: ['instagram', 'tiktok'], status: 'draft', auto_scheduled: false, created_by: 'user', tags: ['video', 'demo', 'product'] },
      { user_id: userId, title: 'Industry Report: B2B Marketing 2026', body: 'Download our comprehensive report on B2B marketing trends...', media_urls: ['/images/report-cover.png'], content_type: 'ad', channels: ['linkedin', 'facebook'], status: 'scheduled', scheduled_at: '2026-03-13T10:00:00Z', auto_scheduled: false, created_by: 'user', tags: ['report', 'lead-gen', 'sponsored'], campaign_id: 'camp-b2b-report' },
      { user_id: userId, title: 'Webinar Recap: AI-Driven Attribution', body: 'Key takeaways from our session on multi-touch attribution...', media_urls: ['/images/webinar-recap.png'], content_type: 'post', channels: ['linkedin', 'twitter'], status: 'queued', auto_scheduled: false, created_by: 'ai_agent', tags: ['webinar', 'attribution', 'recap'] },
      // Published items with performance
      { user_id: userId, title: 'AI Marketing Revolution: Our Journey', body: 'One year ago we started building...', media_urls: [], content_type: 'article', channels: ['linkedin', 'blog'], status: 'published', published_at: '2026-03-08T10:30:00Z', auto_scheduled: false, created_by: 'user', tags: ['milestone'], performance: { impressions: 45230, reach: 32100, engagement_rate: 8.7, clicks: 2890, shares: 456, comments: 234, likes: 3210, conversions: 89, revenue_attributed: 12500, performance_score: 92 } },
      { user_id: userId, title: 'Quick Tips: Email Subject Lines That Convert', body: 'A/B tested subject lines for best results...', media_urls: ['/images/email-tips.png'], content_type: 'post', channels: ['linkedin', 'twitter', 'facebook'], status: 'published', published_at: '2026-03-07T14:00:00Z', auto_scheduled: true, created_by: 'ai_agent', tags: ['tips', 'email'], performance: { impressions: 67890, reach: 48200, engagement_rate: 12.3, clicks: 5670, shares: 890, comments: 456, likes: 7890, conversions: 234, revenue_attributed: 28900, performance_score: 97 } },
      { user_id: userId, title: 'New Partnership: Google Cloud x Inclufy', body: 'We are thrilled to announce a new partnership...', media_urls: ['/images/partnership.png'], content_type: 'post', channels: ['linkedin', 'facebook', 'twitter'], status: 'published', published_at: '2026-03-05T09:00:00Z', auto_scheduled: false, created_by: 'user', tags: ['partnership', 'announcement'], performance: { impressions: 123456, reach: 89000, engagement_rate: 15.2, clicks: 12300, shares: 2340, comments: 890, likes: 15670, conversions: 567, revenue_attributed: 67800, performance_score: 99 } },
      { user_id: userId, title: 'Marketing Automation Infographic', body: 'Visual guide to modern marketing automation...', media_urls: ['/images/infographic.png'], content_type: 'post', channels: ['instagram', 'linkedin'], status: 'published', published_at: '2026-03-03T11:00:00Z', auto_scheduled: true, created_by: 'ai_agent', tags: ['infographic', 'education'], performance: { impressions: 34500, reach: 22800, engagement_rate: 6.5, clicks: 1230, shares: 234, comments: 89, likes: 2100, conversions: 45, revenue_attributed: 5600, performance_score: 74 } },
      { user_id: userId, title: 'Customer Spotlight: De Vlaamse Bakkerij', body: 'How a local bakery increased online orders significantly...', media_urls: ['/images/bakkerij-case.png'], content_type: 'article', channels: ['linkedin', 'blog', 'email'], status: 'published', published_at: '2026-03-01T10:00:00Z', auto_scheduled: false, created_by: 'user', tags: ['case-study', 'local-business'], performance: { impressions: 28900, reach: 19500, engagement_rate: 9.8, clicks: 2340, shares: 345, comments: 178, likes: 2890, conversions: 78, revenue_attributed: 9800, performance_score: 86 } },
    ];
    const { error } = await supabase.from('publishable_content').insert(content);
    if (error) throw error;
  }

  // ── Data Flow Events (12) ──────────────────────────────────────
  private async seedDataFlowEvents(userId: string): Promise<void> {
    const events = [
      { user_id: userId, platform: 'meta', direction: 'inbound', data_type: 'Ad Performance', record_count: 1245, status: 'success', timestamp: '2026-03-10T09:12:00Z', duration_ms: 2340 },
      { user_id: userId, platform: 'google_ads', direction: 'inbound', data_type: 'Campaign Metrics', record_count: 892, status: 'success', timestamp: '2026-03-10T09:10:00Z', duration_ms: 1870 },
      { user_id: userId, platform: 'sendgrid', direction: 'outbound', data_type: 'Email Campaign', record_count: 15000, status: 'success', timestamp: '2026-03-10T09:08:00Z', duration_ms: 4560 },
      { user_id: userId, platform: 'linkedin', direction: 'inbound', data_type: 'Lead Gen Forms', record_count: 34, status: 'success', timestamp: '2026-03-10T09:05:00Z', duration_ms: 980 },
      { user_id: userId, platform: 'meta', direction: 'outbound', data_type: 'Audience Sync', record_count: 8500, status: 'partial', timestamp: '2026-03-10T08:55:00Z', duration_ms: 6780 },
      { user_id: userId, platform: 'zapier', direction: 'inbound', data_type: 'Webhook Events', record_count: 156, status: 'success', timestamp: '2026-03-10T08:50:00Z', duration_ms: 450 },
      { user_id: userId, platform: 'slack', direction: 'outbound', data_type: 'Notifications', record_count: 12, status: 'success', timestamp: '2026-03-10T08:45:00Z', duration_ms: 230 },
      { user_id: userId, platform: 'google_ads', direction: 'outbound', data_type: 'Audience Upload', record_count: 25000, status: 'success', timestamp: '2026-03-10T08:40:00Z', duration_ms: 8920 },
      { user_id: userId, platform: 'sendgrid', direction: 'inbound', data_type: 'Bounce Reports', record_count: 67, status: 'success', timestamp: '2026-03-10T08:35:00Z', duration_ms: 340 },
      { user_id: userId, platform: 'meta', direction: 'inbound', data_type: 'Conversion Events', record_count: 2341, status: 'success', timestamp: '2026-03-10T08:30:00Z', duration_ms: 1560 },
      { user_id: userId, platform: 'linkedin', direction: 'outbound', data_type: 'Sponsored Post', record_count: 3, status: 'success', timestamp: '2026-03-10T08:25:00Z', duration_ms: 1200 },
      { user_id: userId, platform: 'google_ads', direction: 'inbound', data_type: 'Keyword Performance', record_count: 4567, status: 'success', timestamp: '2026-03-10T08:20:00Z', duration_ms: 3450 },
    ];
    const { error } = await supabase.from('data_flow_events').insert(events);
    if (error) throw error;
  }
}

export const seedService = new SeedService();
export default seedService;
