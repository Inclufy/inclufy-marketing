// src/services/context-marketing/integration-hub.service.ts
// Integration Hub service — manages platform connections (Meta, LinkedIn, Google Ads, SendGrid, etc.)

export type IntegrationPlatform = 'meta' | 'linkedin' | 'google_ads' | 'sendgrid' | 'hubspot' | 'mailchimp' | 'zapier' | 'slack';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending' | 'expired';
export type IntegrationCategory = 'advertising' | 'social' | 'email' | 'crm' | 'analytics' | 'communication' | 'automation';

export interface IntegrationConfig {
  id: string;
  platform: IntegrationPlatform;
  display_name: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  connected_at?: string;
  last_sync?: string;
  sync_frequency: 'real_time' | 'hourly' | 'daily' | 'manual';
  data_flowing: boolean;
  account_name?: string;
  account_id?: string;
  permissions: string[];
  health_score: number;
  error_message?: string;
  sync_stats: {
    records_synced: number;
    last_24h_syncs: number;
    failed_syncs: number;
    data_volume_mb: number;
  };
  features: string[];
}

export interface DataFlowEvent {
  id: string;
  integration_id: string;
  platform: IntegrationPlatform;
  direction: 'inbound' | 'outbound';
  data_type: string;
  record_count: number;
  status: 'success' | 'partial' | 'failed';
  timestamp: string;
  duration_ms: number;
}

export interface IntegrationHealthReport {
  overall_score: number;
  connected_count: number;
  total_available: number;
  total_synced_today: number;
  total_data_volume_mb: number;
  issues: Array<{ integration_id: string; platform: IntegrationPlatform; severity: 'critical' | 'warning' | 'info'; message: string }>;
  data_flow_24h: DataFlowEvent[];
}

// Mock integration data
const mockIntegrations: IntegrationConfig[] = [
  {
    id: 'int-meta-001',
    platform: 'meta',
    display_name: 'Meta (Facebook & Instagram)',
    description: 'Facebook Ads, Instagram, Pages & Messenger',
    category: 'advertising',
    status: 'connected',
    connected_at: '2025-11-15T10:30:00Z',
    last_sync: '2026-03-10T08:45:00Z',
    sync_frequency: 'real_time',
    data_flowing: true,
    account_name: 'Inclufy Business',
    account_id: 'act_2847561930',
    permissions: ['ads_management', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish', 'leads_retrieval'],
    health_score: 96,
    sync_stats: { records_synced: 145892, last_24h_syncs: 2847, failed_syncs: 3, data_volume_mb: 234.5 },
    features: ['Ad Campaigns', 'Audience Insights', 'Lead Forms', 'Auto-posting', 'Pixel Tracking'],
  },
  {
    id: 'int-linkedin-001',
    platform: 'linkedin',
    display_name: 'LinkedIn',
    description: 'Company Page, Ads, Lead Gen Forms & Analytics',
    category: 'social',
    status: 'connected',
    connected_at: '2025-12-01T14:20:00Z',
    last_sync: '2026-03-10T09:00:00Z',
    sync_frequency: 'hourly',
    data_flowing: true,
    account_name: 'Inclufy BV',
    account_id: 'urn:li:organization:84729361',
    permissions: ['r_organization_social', 'w_organization_social', 'rw_ads', 'r_ads_reporting', 'r_basicprofile'],
    health_score: 91,
    sync_stats: { records_synced: 67234, last_24h_syncs: 1523, failed_syncs: 7, data_volume_mb: 89.2 },
    features: ['Sponsored Content', 'Lead Gen Forms', 'Company Updates', 'Analytics', 'Matched Audiences'],
  },
  {
    id: 'int-google-001',
    platform: 'google_ads',
    display_name: 'Google Ads',
    description: 'Search, Display, Shopping & YouTube Ads',
    category: 'advertising',
    status: 'connected',
    connected_at: '2025-10-20T09:15:00Z',
    last_sync: '2026-03-10T09:10:00Z',
    sync_frequency: 'real_time',
    data_flowing: true,
    account_name: 'Inclufy Marketing',
    account_id: '847-293-6150',
    permissions: ['campaign_management', 'reporting', 'billing', 'keyword_planner'],
    health_score: 98,
    sync_stats: { records_synced: 289456, last_24h_syncs: 4521, failed_syncs: 1, data_volume_mb: 456.8 },
    features: ['Search Campaigns', 'Display Network', 'Shopping Ads', 'YouTube Ads', 'Conversion Tracking', 'Smart Bidding'],
  },
  {
    id: 'int-sendgrid-001',
    platform: 'sendgrid',
    display_name: 'SendGrid',
    description: 'Transactional & Marketing Email',
    category: 'email',
    status: 'connected',
    connected_at: '2025-09-05T11:00:00Z',
    last_sync: '2026-03-10T08:30:00Z',
    sync_frequency: 'real_time',
    data_flowing: true,
    account_name: 'inclufy.com',
    account_id: 'sg_inclufy_prod',
    permissions: ['mail.send', 'marketing.contacts', 'stats.read', 'templates.read'],
    health_score: 94,
    sync_stats: { records_synced: 523891, last_24h_syncs: 8934, failed_syncs: 12, data_volume_mb: 167.3 },
    features: ['Email Campaigns', 'Transactional Email', 'Contact Lists', 'Templates', 'A/B Testing', 'Analytics'],
  },
  {
    id: 'int-hubspot-001',
    platform: 'hubspot',
    display_name: 'HubSpot CRM',
    description: 'CRM, Sales Pipeline & Marketing Automation',
    category: 'crm',
    status: 'pending',
    sync_frequency: 'hourly',
    data_flowing: false,
    permissions: [],
    health_score: 0,
    sync_stats: { records_synced: 0, last_24h_syncs: 0, failed_syncs: 0, data_volume_mb: 0 },
    features: ['Contact Sync', 'Deal Pipeline', 'Form Submissions', 'Email Tracking', 'Workflows'],
  },
  {
    id: 'int-mailchimp-001',
    platform: 'mailchimp',
    display_name: 'Mailchimp',
    description: 'Email Marketing & Audience Management',
    category: 'email',
    status: 'disconnected',
    sync_frequency: 'daily',
    data_flowing: false,
    permissions: [],
    health_score: 0,
    sync_stats: { records_synced: 0, last_24h_syncs: 0, failed_syncs: 0, data_volume_mb: 0 },
    features: ['Email Campaigns', 'Audience Segments', 'Landing Pages', 'Automations', 'Reports'],
  },
  {
    id: 'int-zapier-001',
    platform: 'zapier',
    display_name: 'Zapier',
    description: 'Workflow Automation & App Integrations',
    category: 'automation',
    status: 'connected',
    connected_at: '2026-01-10T16:45:00Z',
    last_sync: '2026-03-10T09:05:00Z',
    sync_frequency: 'real_time',
    data_flowing: true,
    account_name: 'Inclufy Team',
    account_id: 'zap_team_inclufy',
    permissions: ['zaps.read', 'zaps.write', 'triggers', 'actions'],
    health_score: 88,
    sync_stats: { records_synced: 34567, last_24h_syncs: 892, failed_syncs: 5, data_volume_mb: 23.1 },
    features: ['Custom Zaps', 'Multi-step Workflows', 'Webhooks', 'Scheduled Triggers', 'Error Handling'],
  },
  {
    id: 'int-slack-001',
    platform: 'slack',
    display_name: 'Slack',
    description: 'Team Communication & Notifications',
    category: 'communication',
    status: 'connected',
    connected_at: '2025-08-20T13:00:00Z',
    last_sync: '2026-03-10T09:12:00Z',
    sync_frequency: 'real_time',
    data_flowing: true,
    account_name: 'Inclufy Workspace',
    account_id: 'T04INCLUFY',
    permissions: ['chat:write', 'channels:read', 'files:write', 'incoming-webhook'],
    health_score: 100,
    sync_stats: { records_synced: 12345, last_24h_syncs: 456, failed_syncs: 0, data_volume_mb: 5.7 },
    features: ['Campaign Alerts', 'Performance Reports', 'Approval Requests', 'AI Insights', 'Custom Channels'],
  },
];

const mockDataFlow: DataFlowEvent[] = [
  { id: 'df-001', integration_id: 'int-meta-001', platform: 'meta', direction: 'inbound', data_type: 'Ad Performance', record_count: 1245, status: 'success', timestamp: '2026-03-10T09:12:00Z', duration_ms: 2340 },
  { id: 'df-002', integration_id: 'int-google-001', platform: 'google_ads', direction: 'inbound', data_type: 'Campaign Metrics', record_count: 892, status: 'success', timestamp: '2026-03-10T09:10:00Z', duration_ms: 1870 },
  { id: 'df-003', integration_id: 'int-sendgrid-001', platform: 'sendgrid', direction: 'outbound', data_type: 'Email Campaign', record_count: 15000, status: 'success', timestamp: '2026-03-10T09:08:00Z', duration_ms: 4560 },
  { id: 'df-004', integration_id: 'int-linkedin-001', platform: 'linkedin', direction: 'inbound', data_type: 'Lead Gen Forms', record_count: 34, status: 'success', timestamp: '2026-03-10T09:05:00Z', duration_ms: 980 },
  { id: 'df-005', integration_id: 'int-meta-001', platform: 'meta', direction: 'outbound', data_type: 'Audience Sync', record_count: 8500, status: 'partial', timestamp: '2026-03-10T08:55:00Z', duration_ms: 6780 },
  { id: 'df-006', integration_id: 'int-zapier-001', platform: 'zapier', direction: 'inbound', data_type: 'Webhook Events', record_count: 156, status: 'success', timestamp: '2026-03-10T08:50:00Z', duration_ms: 450 },
  { id: 'df-007', integration_id: 'int-slack-001', platform: 'slack', direction: 'outbound', data_type: 'Notifications', record_count: 12, status: 'success', timestamp: '2026-03-10T08:45:00Z', duration_ms: 230 },
  { id: 'df-008', integration_id: 'int-google-001', platform: 'google_ads', direction: 'outbound', data_type: 'Audience Upload', record_count: 25000, status: 'success', timestamp: '2026-03-10T08:40:00Z', duration_ms: 8920 },
  { id: 'df-009', integration_id: 'int-sendgrid-001', platform: 'sendgrid', direction: 'inbound', data_type: 'Bounce Reports', record_count: 67, status: 'success', timestamp: '2026-03-10T08:35:00Z', duration_ms: 340 },
  { id: 'df-010', integration_id: 'int-meta-001', platform: 'meta', direction: 'inbound', data_type: 'Conversion Events', record_count: 2341, status: 'success', timestamp: '2026-03-10T08:30:00Z', duration_ms: 1560 },
  { id: 'df-011', integration_id: 'int-linkedin-001', platform: 'linkedin', direction: 'outbound', data_type: 'Sponsored Post', record_count: 3, status: 'success', timestamp: '2026-03-10T08:25:00Z', duration_ms: 1200 },
  { id: 'df-012', integration_id: 'int-google-001', platform: 'google_ads', direction: 'inbound', data_type: 'Keyword Performance', record_count: 4567, status: 'success', timestamp: '2026-03-10T08:20:00Z', duration_ms: 3450 },
];

class IntegrationHubService {
  async getIntegrations(): Promise<IntegrationConfig[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockIntegrations]), 600);
    });
  }

  async getIntegrationById(id: string): Promise<IntegrationConfig | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockIntegrations.find(i => i.id === id) || null);
      }, 300);
    });
  }

  async connectIntegration(platform: IntegrationPlatform): Promise<{ authorization_url?: string; status: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (['meta', 'linkedin', 'google_ads'].includes(platform)) {
          resolve({ authorization_url: `https://auth.${platform}.com/oauth2/authorize?client_id=inclufy&scope=all`, status: 'redirecting' });
        } else {
          resolve({ status: 'api_key_required' });
        }
      }, 800);
    });
  }

  async disconnectIntegration(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  }

  async refreshSync(id: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 1500);
    });
  }

  async getHealthReport(): Promise<IntegrationHealthReport> {
    return new Promise((resolve) => {
      const connected = mockIntegrations.filter(i => i.status === 'connected');
      const totalSynced = connected.reduce((sum, i) => sum + i.sync_stats.last_24h_syncs, 0);
      const totalVolume = connected.reduce((sum, i) => sum + i.sync_stats.data_volume_mb, 0);
      const avgHealth = connected.reduce((sum, i) => sum + i.health_score, 0) / (connected.length || 1);

      setTimeout(() => resolve({
        overall_score: Math.round(avgHealth),
        connected_count: connected.length,
        total_available: mockIntegrations.length,
        total_synced_today: totalSynced,
        total_data_volume_mb: Math.round(totalVolume * 10) / 10,
        issues: [
          { integration_id: 'int-sendgrid-001', platform: 'sendgrid', severity: 'warning', message: '12 failed email deliveries in last 24h — check bounce list' },
          { integration_id: 'int-meta-001', platform: 'meta', severity: 'info', message: 'Audience sync partially completed — 8,200 of 8,500 records synced' },
          { integration_id: 'int-hubspot-001', platform: 'hubspot', severity: 'critical', message: 'OAuth token expired — reconnection required' },
        ],
        data_flow_24h: mockDataFlow,
      }), 700);
    });
  }

  async getDataFlow(integrationId?: string): Promise<DataFlowEvent[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (integrationId) {
          resolve(mockDataFlow.filter(e => e.integration_id === integrationId));
        } else {
          resolve([...mockDataFlow]);
        }
      }, 400);
    });
  }

  async updateIntegrationSettings(id: string, settings: Record<string, any>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  }
}

export const integrationHubService = new IntegrationHubService();
export default integrationHubService;
