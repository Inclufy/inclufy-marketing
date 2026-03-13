// src/services/context-marketing/integration-hub.service.ts
// Integration Hub service — manages platform connections (Meta, LinkedIn, Google Ads, SendGrid, etc.)
import { supabase } from '@/integrations/supabase/client';

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

// Helper to get the current user ID
async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

class IntegrationHubService {
  async getIntegrations(): Promise<IntegrationConfig[]> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('user_id', userId)
      .order('health_score', { ascending: false });
    if (error) throw error;
    return (data || []) as IntegrationConfig[];
  }

  async getIntegrationById(id: string): Promise<IntegrationConfig | null> {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return (data as IntegrationConfig) || null;
  }

  async connectIntegration(platform: IntegrationPlatform): Promise<{ authorization_url?: string; status: string }> {
    const userId = await getUserId();

    // Update the integration status to pending
    const { error } = await supabase
      .from('integration_configs')
      .update({
        status: 'pending',
        connected_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', platform);
    if (error) throw error;

    if (['meta', 'linkedin', 'google_ads'].includes(platform)) {
      return {
        authorization_url: `https://auth.${platform}.com/oauth2/authorize?client_id=inclufy&scope=all`,
        status: 'redirecting',
      };
    }
    return { status: 'api_key_required' };
  }

  async disconnectIntegration(id: string): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from('integration_configs')
      .update({
        status: 'disconnected',
        data_flowing: false,
        health_score: 0,
        last_sync: null,
        connected_at: null,
        account_name: null,
        account_id: null,
      })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async refreshSync(id: string): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from('integration_configs')
      .update({
        last_sync: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async getHealthReport(): Promise<IntegrationHealthReport> {
    const userId = await getUserId();

    // Get all integrations
    const { data: integrations, error: intError } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('user_id', userId);
    if (intError) throw intError;

    const allIntegrations = (integrations || []) as IntegrationConfig[];
    const connected = allIntegrations.filter(i => i.status === 'connected');

    const totalSynced = connected.reduce((sum, i) => sum + (i.sync_stats?.last_24h_syncs || 0), 0);
    const totalVolume = connected.reduce((sum, i) => sum + (i.sync_stats?.data_volume_mb || 0), 0);
    const avgHealth = connected.length > 0
      ? connected.reduce((sum, i) => sum + i.health_score, 0) / connected.length
      : 0;

    // Get data flow events
    const { data: flowEvents, error: flowError } = await supabase
      .from('data_flow_events')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(20);
    if (flowError) throw flowError;

    // Detect issues from integration data
    const issues: Array<{ integration_id: string; platform: IntegrationPlatform; severity: 'critical' | 'warning' | 'info'; message: string }> = [];

    for (const integration of allIntegrations) {
      if (integration.status === 'pending' || integration.status === 'expired') {
        issues.push({
          integration_id: integration.id,
          platform: integration.platform,
          severity: 'critical',
          message: `OAuth token expired — reconnection required`,
        });
      }
      if (integration.sync_stats?.failed_syncs > 10) {
        issues.push({
          integration_id: integration.id,
          platform: integration.platform,
          severity: 'warning',
          message: `${integration.sync_stats.failed_syncs} failed syncs in last 24h — check configuration`,
        });
      }
      if (integration.status === 'connected' && integration.health_score < 90) {
        issues.push({
          integration_id: integration.id,
          platform: integration.platform,
          severity: 'info',
          message: `Health score below optimal (${integration.health_score}%) — consider reviewing settings`,
        });
      }
    }

    return {
      overall_score: Math.round(avgHealth),
      connected_count: connected.length,
      total_available: allIntegrations.length,
      total_synced_today: totalSynced,
      total_data_volume_mb: Math.round(totalVolume * 10) / 10,
      issues,
      data_flow_24h: (flowEvents || []) as DataFlowEvent[],
    };
  }

  async getDataFlow(integrationId?: string): Promise<DataFlowEvent[]> {
    const userId = await getUserId();

    let query = supabase
      .from('data_flow_events')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(20);

    if (integrationId) {
      query = query.eq('integration_id', integrationId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as DataFlowEvent[];
  }

  async updateIntegrationSettings(id: string, settings: Record<string, any>): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase
      .from('integration_configs')
      .update(settings)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }
}

export const integrationHubService = new IntegrationHubService();
export default integrationHubService;
