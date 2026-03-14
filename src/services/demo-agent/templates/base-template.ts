// src/services/demo-agent/templates/base-template.ts
// Shared helpers and generators for industry templates

export function generatePerformanceTrend(baseScore: number, days = 7): { date: string; score: number }[] {
  const trend: { date: string; score: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const variance = Math.floor(Math.random() * 5) - 2;
    trend.push({
      date: d.toISOString().split('T')[0],
      score: Math.min(100, Math.max(60, baseScore + variance + Math.floor(i * 0.5))),
    });
  }
  return trend;
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function todayISO(): string {
  return new Date().toISOString();
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateScoreHistory(finalScore: number): { date: string; score: number }[] {
  const history: { date: string; score: number }[] = [];
  const now = new Date();
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const progress = (4 - i) / 4;
    history.push({
      date: d.toISOString().split('T')[0],
      score: Math.round(30 + (finalScore - 30) * progress + (Math.random() * 6 - 3)),
    });
  }
  return history;
}

export function generateScoreBreakdown(compositeScore: number) {
  const base = compositeScore - 5;
  return {
    behavioral: Math.min(100, base + randomBetween(-3, 8)),
    demographic: Math.min(100, base + randomBetween(-5, 5)),
    firmographic: Math.min(100, base + randomBetween(-2, 6)),
    engagement: Math.min(100, base + randomBetween(-4, 7)),
    intent: Math.min(100, base + randomBetween(-3, 5)),
  };
}

export function generateInvoiceNumber(prefix: string, index: number): string {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(index + 1).padStart(4, '0')}`;
}

export function generateContentPerformance(published: boolean) {
  if (!published) return {};
  return {
    impressions: randomBetween(5000, 60000),
    reach: randomBetween(3000, 45000),
    engagement_rate: +(Math.random() * 12 + 2).toFixed(1),
    clicks: randomBetween(200, 4000),
    shares: randomBetween(20, 600),
    comments: randomBetween(5, 150),
    likes: randomBetween(50, 2000),
    conversions: randomBetween(5, 120),
    revenue_attributed: randomBetween(500, 15000),
  };
}

// Base integration configs shared across all industries
export function getBaseIntegrations(userId: string) {
  return [
    {
      user_id: userId, platform: 'meta', display_name: 'Meta (Facebook & Instagram)', description: 'Facebook Ads, Instagram, Pages & Messenger', category: 'advertising', status: 'connected',
      connected_at: daysAgo(120), last_sync: daysAgo(0), sync_frequency: 'real_time', data_flowing: true, account_name: 'Business Suite', account_id: 'act_' + randomBetween(1000000, 9999999),
      permissions: ['ads_management', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish', 'leads_retrieval'], health_score: 96,
      sync_stats: { records_synced: 145892, last_24h_syncs: 2847, failed_syncs: 3, data_volume_mb: 234.5 },
      features: ['Ad Campaigns', 'Audience Insights', 'Lead Forms', 'Auto-posting', 'Pixel Tracking'],
    },
    {
      user_id: userId, platform: 'linkedin', display_name: 'LinkedIn', description: 'Company Page, Ads, Lead Gen Forms & Analytics', category: 'social', status: 'connected',
      connected_at: daysAgo(100), last_sync: daysAgo(0), sync_frequency: 'hourly', data_flowing: true, account_name: 'Company Page', account_id: 'urn:li:organization:' + randomBetween(10000000, 99999999),
      permissions: ['r_organization_social', 'w_organization_social', 'rw_ads', 'r_ads_reporting'], health_score: 91,
      sync_stats: { records_synced: 67234, last_24h_syncs: 1523, failed_syncs: 7, data_volume_mb: 89.2 },
      features: ['Sponsored Content', 'Lead Gen Forms', 'Company Updates', 'Analytics', 'Matched Audiences'],
    },
    {
      user_id: userId, platform: 'google_ads', display_name: 'Google Ads', description: 'Search, Display, Shopping & YouTube Ads', category: 'advertising', status: 'connected',
      connected_at: daysAgo(150), last_sync: daysAgo(0), sync_frequency: 'real_time', data_flowing: true, account_name: 'Main Account', account_id: randomBetween(100, 999) + '-' + randomBetween(100, 999) + '-' + randomBetween(1000, 9999),
      permissions: ['campaign_management', 'reporting', 'billing', 'keyword_planner'], health_score: 98,
      sync_stats: { records_synced: 289456, last_24h_syncs: 4521, failed_syncs: 1, data_volume_mb: 456.8 },
      features: ['Search Campaigns', 'Display Network', 'Shopping Ads', 'YouTube Ads', 'Conversion Tracking', 'Smart Bidding'],
    },
    {
      user_id: userId, platform: 'sendgrid', display_name: 'SendGrid', description: 'Transactional & Marketing Email', category: 'email', status: 'connected',
      connected_at: daysAgo(180), last_sync: daysAgo(0), sync_frequency: 'real_time', data_flowing: true, account_name: 'Production', account_id: 'sg_prod_' + randomBetween(10000, 99999),
      permissions: ['mail.send', 'marketing.contacts', 'stats.read', 'templates.read'], health_score: 94,
      sync_stats: { records_synced: 523891, last_24h_syncs: 8934, failed_syncs: 12, data_volume_mb: 167.3 },
      features: ['Email Campaigns', 'Transactional Email', 'Contact Lists', 'Templates', 'A/B Testing', 'Analytics'],
    },
    {
      user_id: userId, platform: 'hubspot', display_name: 'HubSpot CRM', description: 'CRM, Sales Pipeline & Marketing Automation', category: 'crm', status: 'connected',
      connected_at: daysAgo(90), last_sync: daysAgo(0), sync_frequency: 'hourly', data_flowing: true, account_name: 'CRM Suite', account_id: 'hub_' + randomBetween(100000, 999999),
      permissions: ['contacts', 'deals', 'forms', 'email', 'workflows'], health_score: 92,
      sync_stats: { records_synced: 34500, last_24h_syncs: 890, failed_syncs: 2, data_volume_mb: 45.6 },
      features: ['Contact Sync', 'Deal Pipeline', 'Form Submissions', 'Email Tracking', 'Workflows'],
    },
    {
      user_id: userId, platform: 'zapier', display_name: 'Zapier', description: 'Workflow Automation & App Integrations', category: 'automation', status: 'connected',
      connected_at: daysAgo(60), last_sync: daysAgo(0), sync_frequency: 'real_time', data_flowing: true, account_name: 'Team Plan', account_id: 'zap_team_' + randomBetween(10000, 99999),
      permissions: ['zaps.read', 'zaps.write', 'triggers', 'actions'], health_score: 88,
      sync_stats: { records_synced: 34567, last_24h_syncs: 892, failed_syncs: 5, data_volume_mb: 23.1 },
      features: ['Custom Zaps', 'Multi-step Workflows', 'Webhooks', 'Scheduled Triggers', 'Error Handling'],
    },
    {
      user_id: userId, platform: 'slack', display_name: 'Slack', description: 'Team Communication & Notifications', category: 'communication', status: 'connected',
      connected_at: daysAgo(200), last_sync: daysAgo(0), sync_frequency: 'real_time', data_flowing: true, account_name: 'Workspace', account_id: 'T04' + randomBetween(100000, 999999),
      permissions: ['chat:write', 'channels:read', 'files:write', 'incoming-webhook'], health_score: 100,
      sync_stats: { records_synced: 12345, last_24h_syncs: 456, failed_syncs: 0, data_volume_mb: 5.7 },
      features: ['Campaign Alerts', 'Performance Reports', 'Approval Requests', 'AI Insights', 'Custom Channels'],
    },
    {
      user_id: userId, platform: 'mailchimp', display_name: 'Mailchimp', description: 'Email Marketing & Audience Management', category: 'email', status: 'connected',
      connected_at: daysAgo(75), last_sync: daysAgo(0), sync_frequency: 'daily', data_flowing: true, account_name: 'Marketing', account_id: 'mc_' + randomBetween(100000, 999999),
      permissions: ['campaigns', 'lists', 'templates', 'reports'], health_score: 89,
      sync_stats: { records_synced: 28900, last_24h_syncs: 120, failed_syncs: 1, data_volume_mb: 34.2 },
      features: ['Email Campaigns', 'Audience Segments', 'Landing Pages', 'Automations', 'Reports'],
    },
  ];
}

// Base attribution models shared across industries
// Note: live DB has `model_name` as NOT NULL — must include it alongside `name`
export function getBaseAttributionModels(userId: string) {
  return [
    { user_id: userId, name: 'First Touch', model_name: 'First Touch', type: 'first_touch', description: 'Credits the first interaction that started the journey', is_active: true },
    { user_id: userId, name: 'Last Touch', model_name: 'Last Touch', type: 'last_touch', description: 'Credits the last interaction before conversion', is_active: true },
    { user_id: userId, name: 'Linear', model_name: 'Linear', type: 'linear', description: 'Distributes credit equally across all touchpoints', is_active: true },
    { user_id: userId, name: 'Time Decay', model_name: 'Time Decay', type: 'time_decay', description: 'More credit to touchpoints closer to conversion', is_active: true },
    { user_id: userId, name: 'U-Shaped', model_name: 'U-Shaped', type: 'u_shaped', description: '40% first touch, 40% last touch, 20% distributed middle', is_active: true },
    { user_id: userId, name: 'W-Shaped', model_name: 'W-Shaped', type: 'w_shaped', description: '30% first, 30% lead creation, 30% opportunity, 10% rest', is_active: true },
    { user_id: userId, name: 'Markov Chain', model_name: 'Markov Chain', type: 'data_driven_markov', description: 'Data-driven model using transition probabilities', is_active: true, accuracy_score: 94.2 },
    { user_id: userId, name: 'Shapley Value', model_name: 'Shapley Value', type: 'data_driven_shapley', description: 'Game theory approach for channel contribution', is_active: true, accuracy_score: 96.1 },
  ];
}

// Base AI agents with industry-customizable current_task
export function getBaseAgents(userId: string, tasks: { social_task: string; email_task: string; ads_task: string; analytics_task: string; orchestrator_task: string }) {
  return [
    {
      user_id: userId, name: 'Social Agent', type: 'social', status: 'busy',
      description: 'Monitors social trends, creates & schedules content, manages engagement across all social platforms',
      capabilities: ['Trend Detection', 'Content Generation', 'Scheduling', 'Engagement Analysis', 'Hashtag Optimization', 'Audience Targeting'],
      current_task: tasks.social_task, tasks_completed_today: 47, tasks_in_queue: 12, success_rate: 94.2, efficiency_score: 91,
      last_action: 'Published LinkedIn carousel about quarterly results', last_action_at: daysAgo(0),
      uptime_hours: 2184, decisions_made: 15678, revenue_impact: 89000, learning_progress: 87, model_version: 'social-v4.1',
      performance_trend: generatePerformanceTrend(91),
    },
    {
      user_id: userId, name: 'Email Agent', type: 'email', status: 'active',
      description: 'Manages email sequences, A/B tests subject lines, optimizes send times, personalizes content',
      capabilities: ['Subject Line A/B Testing', 'Send Time Optimization', 'Personalization', 'Sequence Building', 'Bounce Management', 'Deliverability Monitoring'],
      current_task: tasks.email_task, tasks_completed_today: 34, tasks_in_queue: 8, success_rate: 96.8, efficiency_score: 94,
      last_action: 'Deployed winning subject line to remaining 80% of list', last_action_at: daysAgo(0),
      uptime_hours: 2184, decisions_made: 12456, revenue_impact: 156000, learning_progress: 92, model_version: 'email-v3.8',
      performance_trend: generatePerformanceTrend(95),
    },
    {
      user_id: userId, name: 'Ads Agent', type: 'ads', status: 'busy',
      description: 'Manages ad budgets across platforms, creates ad variants, optimizes targeting & bidding strategies',
      capabilities: ['Budget Allocation', 'Ad Copywriting', 'Audience Targeting', 'Bid Optimization', 'Creative Testing', 'Cross-platform Management'],
      current_task: tasks.ads_task, tasks_completed_today: 28, tasks_in_queue: 15, success_rate: 91.5, efficiency_score: 88,
      last_action: 'Paused 3 low-performing ad sets and launched 2 new retargeting campaigns', last_action_at: daysAgo(0),
      uptime_hours: 2184, decisions_made: 9234, revenue_impact: 234000, learning_progress: 84, model_version: 'ads-v5.0',
      performance_trend: generatePerformanceTrend(88),
    },
    {
      user_id: userId, name: 'Analytics Agent', type: 'analytics', status: 'active',
      description: 'Monitors KPIs in real-time, detects anomalies, generates reports, identifies optimization opportunities',
      capabilities: ['Anomaly Detection', 'KPI Monitoring', 'Report Generation', 'Trend Forecasting', 'Cohort Analysis', 'Attribution Modeling'],
      current_task: tasks.analytics_task, tasks_completed_today: 56, tasks_in_queue: 4, success_rate: 98.1, efficiency_score: 96,
      last_action: 'Generated weekly performance report with 3 optimization recommendations', last_action_at: daysAgo(0),
      uptime_hours: 2184, decisions_made: 23456, revenue_impact: 67000, learning_progress: 95, model_version: 'analytics-v6.2',
      performance_trend: generatePerformanceTrend(96),
    },
    {
      user_id: userId, name: 'Orchestrator', type: 'orchestrator', status: 'active',
      description: 'Central coordinator that manages all agents, resolves conflicts, allocates resources, ensures strategic alignment',
      capabilities: ['Agent Coordination', 'Conflict Resolution', 'Resource Allocation', 'Priority Management', 'Strategic Alignment', 'Load Balancing'],
      current_task: tasks.orchestrator_task, tasks_completed_today: 89, tasks_in_queue: 3, success_rate: 99.2, efficiency_score: 97,
      last_action: 'Resolved conflict: Social and Email agents targeting overlapping segments', last_action_at: daysAgo(0),
      uptime_hours: 2184, decisions_made: 45678, revenue_impact: 0, learning_progress: 98, model_version: 'orchestrator-v7.0',
      performance_trend: generatePerformanceTrend(98),
    },
  ];
}
