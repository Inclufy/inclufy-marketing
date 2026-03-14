// src/services/context-marketing/opportunity-intelligence.service.ts
// Opportunity Intelligence — AI discovers trends, events, partnerships, viral topics, new markets

import { supabase } from '@/integrations/supabase/client';

export type OpportunityType = 'trend' | 'event' | 'partnership' | 'viral_topic' | 'new_market' | 'competitor_gap' | 'content_gap';
export type OpportunityStatus = 'new' | 'reviewing' | 'approved' | 'actioned' | 'dismissed' | 'expired';
export type OpportunityPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  source: string;
  priority: OpportunityPriority;
  status: OpportunityStatus;
  confidence: number;
  estimated_impact: number;
  estimated_reach: number;
  trend_velocity: number; // percentage growth
  relevance_score: number;
  discovered_at: string;
  expires_at?: string;
  tags: string[];
  suggested_actions: string[];
  related_keywords: string[];
  data_sources: string[];
  campaign_suggestion?: { title: string; channels: string[]; budget: number; duration_days: number };
}

// Safe mapper: DB stores estimated_impact as JSONB — may be number, object, or string
function safeOpp(raw: any): Opportunity {
  const ei = raw.estimated_impact;
  return {
    ...raw,
    estimated_impact:
      typeof ei === 'number' ? ei
      : ei && typeof ei === 'object' && typeof ei.value === 'number' ? ei.value
      : Number(ei) || 0,
    estimated_reach: Number(raw.estimated_reach) || 0,
    trend_velocity: Number(raw.trend_velocity) || 0,
    relevance_score: Number(raw.relevance_score) || 0,
    confidence: Number(raw.confidence) || 0,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    suggested_actions: Array.isArray(raw.suggested_actions) ? raw.suggested_actions : [],
    related_keywords: Array.isArray(raw.related_keywords) ? raw.related_keywords : [],
    data_sources: Array.isArray(raw.data_sources) ? raw.data_sources : [],
  };
}

export interface TrendData {
  keyword: string;
  volume: number;
  growth_rate: number;
  peak_date: string;
  related_topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  regions: string[];
  trend_history: Array<{ date: string; volume: number }>;
}

export interface OpportunityDashboardData {
  total_opportunities: number;
  new_today: number;
  high_priority: number;
  total_estimated_value: number;
  action_rate: number;
  avg_confidence: number;
  opportunities_by_type: Array<{ type: OpportunityType; count: number; color: string }>;
  trend_velocity: Array<{ date: string; opportunities: number; actioned: number }>;
  top_trends: TrendData[];
}

const TYPE_COLORS: Record<OpportunityType, string> = {
  trend: '#8b5cf6',
  viral_topic: '#ec4899',
  partnership: '#3b82f6',
  new_market: '#10b981',
  competitor_gap: '#f59e0b',
  content_gap: '#14b8a6',
  event: '#ef4444',
};

class OpportunityIntelligenceService {
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  async getOpportunities(status?: OpportunityStatus): Promise<Opportunity[]> {
    const userId = await this.getUserId();
    let query = supabase
      .from('opportunities')
      .select('*')
      .eq('user_id', userId)
      .order('discovered_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(safeOpp) as Opportunity[];
  }

  async getDashboard(): Promise<OpportunityDashboardData> {
    const userId = await this.getUserId();

    // Fetch all opportunities for computing stats
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('user_id', userId);
    if (oppError) throw oppError;

    const opps = (opportunities || []).map(safeOpp) as Opportunity[];

    const today = new Date().toISOString().split('T')[0];
    const newToday = opps.filter(o => o.discovered_at?.startsWith(today)).length;
    const highPriority = opps.filter(o => o.priority === 'critical' || o.priority === 'high').length;
    const totalValue = opps.reduce((sum, o) => sum + (o.estimated_impact || 0), 0);
    const actionedCount = opps.filter(o => o.status === 'actioned').length;
    const actionRate = opps.length > 0 ? (actionedCount / opps.length) * 100 : 0;
    const avgConfidence = opps.length > 0
      ? opps.reduce((sum, o) => sum + (o.confidence || 0), 0) / opps.length
      : 0;

    // Group by type
    const typeCounts = new Map<OpportunityType, number>();
    for (const o of opps) {
      typeCounts.set(o.type, (typeCounts.get(o.type) || 0) + 1);
    }
    const opportunitiesByType = Object.entries(TYPE_COLORS).map(([type, color]) => ({
      type: type as OpportunityType,
      count: typeCounts.get(type as OpportunityType) || 0,
      color,
    }));

    // Build trend velocity from last 7 days
    const trendVelocity: Array<{ date: string; opportunities: number; actioned: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOpps = opps.filter(o => o.discovered_at?.startsWith(dateStr));
      trendVelocity.push({
        date: dateStr,
        opportunities: dayOpps.length,
        actioned: dayOpps.filter(o => o.status === 'actioned').length,
      });
    }

    // Fetch top trends
    const { data: trends, error: trendError } = await supabase
      .from('trend_data')
      .select('*')
      .eq('user_id', userId)
      .order('growth_rate', { ascending: false })
      .limit(5);
    if (trendError) throw trendError;

    return {
      total_opportunities: opps.length,
      new_today: newToday,
      high_priority: highPriority,
      total_estimated_value: totalValue,
      action_rate: Math.round(actionRate * 10) / 10,
      avg_confidence: Math.round(avgConfidence * 10) / 10,
      opportunities_by_type: opportunitiesByType,
      trend_velocity: trendVelocity,
      top_trends: (trends || []) as unknown as TrendData[],
    };
  }

  async actionOpportunity(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('opportunities')
      .update({ status: 'actioned' })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async dismissOpportunity(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('opportunities')
      .update({ status: 'dismissed' })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async launchCampaignFromOpportunity(id: string): Promise<{ campaign_id: string }> {
    const userId = await this.getUserId();
    const campaignId = `camp-auto-${Date.now()}`;
    const { error } = await supabase
      .from('opportunities')
      .update({ status: 'actioned', campaign_id: campaignId })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
    return { campaign_id: campaignId };
  }

  async launchCampaign(id: string): Promise<{ campaign_id: string }> {
    return this.launchCampaignFromOpportunity(id);
  }

  async refreshTrends(): Promise<TrendData[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('trend_data')
      .select('*')
      .eq('user_id', userId)
      .order('growth_rate', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as TrendData[];
  }
}

export const opportunityIntelligenceService = new OpportunityIntelligenceService();
export default opportunityIntelligenceService;
