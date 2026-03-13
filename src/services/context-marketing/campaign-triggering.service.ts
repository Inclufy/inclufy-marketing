// src/services/context-marketing/campaign-triggering.service.ts
// Autonomous Campaign Triggering — AI detects signals and auto-starts campaigns

import { supabase } from '@/integrations/supabase/client';

export type TriggerType = 'trend_detected' | 'competitor_move' | 'audience_signal' | 'performance_threshold' | 'seasonal' | 'event_based' | 'lead_behavior';
export type TriggerStatus = 'active' | 'paused' | 'triggered' | 'completed' | 'failed';
export type CampaignAction = 'linkedin_posts' | 'blog_article' | 'email_sequence' | 'google_ads' | 'social_ads' | 'landing_page' | 'webinar' | 'multi_channel';

export interface CampaignTrigger {
  id: string;
  name: string;
  type: TriggerType;
  description: string;
  condition: string;
  status: TriggerStatus;
  actions: CampaignAction[];
  channels: string[];
  budget_limit: number;
  confidence_threshold: number;
  requires_approval: boolean;
  times_triggered: number;
  last_triggered?: string;
  created_at: string;
  performance: { campaigns_launched: number; total_reach: number; leads_generated: number; revenue_impact: number; avg_roi: number };
}

export interface TriggeredCampaign {
  id: string;
  trigger_id: string;
  trigger_name: string;
  campaign_name: string;
  signal: string;
  channels: string[];
  budget_allocated: number;
  status: 'pending_approval' | 'launching' | 'active' | 'completed' | 'cancelled';
  launched_at: string;
  performance: { impressions: number; clicks: number; leads: number; conversions: number; revenue: number; roi: number };
  ai_reasoning: string;
  content_generated: Array<{ type: string; title: string; status: string }>;
}

export interface TriggeringDashboard {
  active_triggers: number;
  total_triggered: number;
  campaigns_launched: number;
  total_revenue: number;
  avg_roi: number;
  auto_vs_manual: { auto: number; manual: number };
  trigger_timeline: Array<{ date: string; triggers: number; campaigns: number; revenue: number }>;
  top_performing: TriggeredCampaign[];
}

// Type alias for hook compatibility
export type Trigger = CampaignTrigger;

const DEFAULT_TRIGGER_PERF = { campaigns_launched: 0, total_reach: 0, leads_generated: 0, revenue_impact: 0, avg_roi: 0 };
const DEFAULT_CAMPAIGN_PERF = { impressions: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0, roi: 0 };

function safeTrigger(raw: any): CampaignTrigger {
  return {
    ...raw,
    channels: raw.channels || [],
    actions: raw.actions || [],
    budget_limit: raw.budget_limit ?? 0,
    confidence_threshold: raw.confidence_threshold ?? 70,
    times_triggered: raw.times_triggered ?? 0,
    performance: { ...DEFAULT_TRIGGER_PERF, ...(raw.performance || {}) },
  };
}

function safeCampaign(raw: any): TriggeredCampaign {
  return {
    ...raw,
    channels: raw.channels || [],
    budget_allocated: raw.budget_allocated ?? 0,
    signal: raw.signal || '',
    trigger_name: raw.trigger_name || '',
    ai_reasoning: raw.ai_reasoning || '',
    content_generated: raw.content_generated || [],
    performance: { ...DEFAULT_CAMPAIGN_PERF, ...(raw.performance || {}) },
  };
}

class CampaignTriggeringService {
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  async getTriggers(): Promise<CampaignTrigger[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('campaign_triggers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(safeTrigger);
  }

  async getTriggeredCampaigns(): Promise<TriggeredCampaign[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('triggered_campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('launched_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(safeCampaign);
  }

  async getDashboard(): Promise<TriggeringDashboard> {
    const userId = await this.getUserId();

    const [triggersRes, campaignsRes] = await Promise.all([
      supabase
        .from('campaign_triggers')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('triggered_campaigns')
        .select('*')
        .eq('user_id', userId),
    ]);

    if (triggersRes.error) throw triggersRes.error;
    if (campaignsRes.error) throw campaignsRes.error;

    const triggers = (triggersRes.data || []).map(safeTrigger);
    const campaigns = (campaignsRes.data || []).map(safeCampaign);

    const activeTriggers = triggers.filter(t => t.status === 'active').length;
    const totalTriggered = triggers.reduce((sum, t) => sum + (t.times_triggered || 0), 0);
    const campaignsLaunched = campaigns.length;
    const totalRevenue = campaigns.reduce((sum, c) => sum + (c.performance?.revenue || 0), 0);

    const roiValues = campaigns.filter(c => c.performance?.roi > 0).map(c => c.performance.roi);
    const avgRoi = roiValues.length > 0
      ? Math.round(roiValues.reduce((sum, r) => sum + r, 0) / roiValues.length)
      : 0;

    const autoCount = campaigns.filter(c => {
      const trigger = triggers.find(t => t.id === c.trigger_id);
      return trigger && !trigger.requires_approval;
    }).length;
    const manualCount = campaigns.length - autoCount;
    const total = autoCount + manualCount || 1;

    // Build timeline from campaigns grouped by date
    const timelineMap = new Map<string, { triggers: number; campaigns: number; revenue: number }>();
    campaigns.forEach(c => {
      const date = c.launched_at ? c.launched_at.substring(0, 10) : '';
      if (!date) return;
      const entry = timelineMap.get(date) || { triggers: 0, campaigns: 0, revenue: 0 };
      entry.campaigns += 1;
      entry.triggers += 1;
      entry.revenue += c.performance?.revenue || 0;
      timelineMap.set(date, entry);
    });
    const triggerTimeline = Array.from(timelineMap.entries())
      .map(([date, vals]) => ({ date, ...vals }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topPerforming = campaigns
      .filter(c => c.performance?.roi > 100)
      .sort((a, b) => (b.performance?.roi || 0) - (a.performance?.roi || 0));

    return {
      active_triggers: activeTriggers,
      total_triggered: totalTriggered,
      campaigns_launched: campaignsLaunched,
      total_revenue: totalRevenue,
      avg_roi: avgRoi,
      auto_vs_manual: {
        auto: Math.round((autoCount / total) * 100),
        manual: Math.round((manualCount / total) * 100),
      },
      trigger_timeline: triggerTimeline,
      top_performing: topPerforming,
    };
  }

  async approveCampaign(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('triggered_campaigns')
      .update({ status: 'approved' })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async cancelCampaign(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('triggered_campaigns')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async toggleTrigger(id: string): Promise<void> {
    const userId = await this.getUserId();

    // First fetch the current trigger to read its enabled state
    const { data, error: fetchError } = await supabase
      .from('campaign_triggers')
      .select('enabled')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    if (fetchError) throw fetchError;

    const currentEnabled = (data as unknown as { enabled: boolean }).enabled;

    const { error } = await supabase
      .from('campaign_triggers')
      .update({ enabled: !currentEnabled })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async createTrigger(trigger: Partial<CampaignTrigger>): Promise<CampaignTrigger> {
    const userId = await this.getUserId();
    const newTrigger = {
      ...trigger,
      user_id: userId,
      status: 'active',
      times_triggered: 0,
      performance: {
        campaigns_launched: 0,
        total_reach: 0,
        leads_generated: 0,
        revenue_impact: 0,
        avg_roi: 0,
      },
    };

    const { data, error } = await supabase
      .from('campaign_triggers')
      .insert(newTrigger)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as CampaignTrigger;
  }
}

export const campaignTriggeringService = new CampaignTriggeringService();
export default campaignTriggeringService;
