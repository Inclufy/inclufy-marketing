// src/services/context-marketing/attribution.service.ts
// Multi-Touch Attribution service — AI-driven channel attribution with multiple models

import { supabase } from '@/integrations/supabase/client';

export type AttributionModelType = 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'u_shaped' | 'w_shaped' | 'data_driven_markov' | 'data_driven_shapley';

export interface AttributionModelConfig {
  id: string;
  name: string;
  type: AttributionModelType;
  description: string;
  is_active: boolean;
  accuracy_score?: number;
}

export interface ChannelAttribution {
  channel: string;
  display_name: string;
  color: string;
  attributed_conversions: number;
  attributed_revenue: number;
  cost: number;
  roi: number;
  percentage_share: number;
  avg_position_in_journey: number;
  total_touchpoints: number;
  confidence: number;
}

export interface JourneyPath {
  id: string;
  touchpoints: Array<{
    channel: string;
    timestamp: string;
    interaction_type: string;
  }>;
  conversion_type: string;
  conversion_value: number;
  total_duration_days: number;
  touchpoint_count: number;
  frequency: number;
}

export interface ModelComparison {
  channel: string;
  color: string;
  models: Partial<Record<AttributionModelType, { attributed_revenue: number; percentage_share: number }>>;
}

export interface AttributionDashboardData {
  total_conversions: number;
  total_revenue: number;
  avg_touchpoints_per_conversion: number;
  avg_days_to_conversion: number;
  channels: ChannelAttribution[];
  top_paths: JourneyPath[];
  model_comparison: ModelComparison[];
  revenue_over_time: Array<{ date: string; revenue: number; conversions: number }>;
}

const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': '#22c55e',
  'Paid Search': '#3b82f6',
  'Social Media': '#ec4899',
  'Email': '#f59e0b',
  'Direct': '#8b5cf6',
  'Referral': '#14b8a6',
  'Display Ads': '#ef4444',
};

class AttributionService {
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  async getModels(): Promise<AttributionModelConfig[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('attribution_models')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as AttributionModelConfig[];
  }

  async runAttribution(modelType: AttributionModelType): Promise<AttributionDashboardData> {
    const userId = await this.getUserId();

    // Fetch channel attributions for the specified model type
    const { data: channelData, error: channelError } = await supabase
      .from('channel_attributions')
      .select('*')
      .eq('user_id', userId)
      .eq('model_type', modelType)
      .order('attributed_revenue', { ascending: false });

    if (channelError) throw channelError;

    const channels = ((channelData || []) as unknown as ChannelAttribution[]).map(ch => ({
      ...ch,
      color: CHANNEL_COLORS[ch.channel] || '#6b7280',
      display_name: ch.display_name || ch.channel,
      roi: ch.cost > 0 ? Math.round(((ch.attributed_revenue - ch.cost) / ch.cost) * 100) : 999,
    }));

    // Recalculate percentage_share based on actual total
    const totalRevenue = channels.reduce((sum, c) => sum + c.attributed_revenue, 0);
    channels.forEach(ch => {
      ch.percentage_share = totalRevenue > 0
        ? Math.round((ch.attributed_revenue / totalRevenue) * 1000) / 10
        : 0;
    });

    // Fetch journey paths for top paths
    const { data: paths, error: pathsError } = await supabase
      .from('journey_paths')
      .select('*')
      .eq('user_id', userId)
      .order('frequency', { ascending: false })
      .limit(10);

    if (pathsError) throw pathsError;

    const topPaths = (paths || []) as unknown as JourneyPath[];

    // Calculate aggregate stats
    const totalConversions = channels.reduce((sum, c) => sum + c.attributed_conversions, 0);
    const totalTouchpoints = channels.reduce((sum, c) => sum + c.total_touchpoints, 0);
    const avgTouchpointsPerConversion = totalConversions > 0
      ? Math.round((totalTouchpoints / totalConversions) * 10) / 10
      : 0;

    // Calculate average days to conversion from journey paths
    const avgDaysToConversion = topPaths.length > 0
      ? Math.round(
          (topPaths.reduce((sum, p) => sum + p.total_duration_days * p.frequency, 0) /
            topPaths.reduce((sum, p) => sum + p.frequency, 0)) * 10
        ) / 10
      : 0;

    // Build revenue over time from channel attributions
    // Group by month from journey path timestamps
    const revenueByMonth = new Map<string, { revenue: number; conversions: number }>();
    topPaths.forEach(path => {
      if (path.touchpoints && path.touchpoints.length > 0) {
        const lastTouchpoint = path.touchpoints[path.touchpoints.length - 1];
        const monthKey = lastTouchpoint.timestamp.substring(0, 7); // YYYY-MM
        if (!revenueByMonth.has(monthKey)) {
          revenueByMonth.set(monthKey, { revenue: 0, conversions: 0 });
        }
        const entry = revenueByMonth.get(monthKey)!;
        entry.revenue += path.conversion_value * path.frequency;
        entry.conversions += path.frequency;
      }
    });

    const revenueOverTime = Array.from(revenueByMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        conversions: data.conversions,
      }));

    return {
      total_conversions: totalConversions,
      total_revenue: totalRevenue,
      avg_touchpoints_per_conversion: avgTouchpointsPerConversion,
      avg_days_to_conversion: avgDaysToConversion,
      channels,
      top_paths: topPaths,
      model_comparison: [],
      revenue_over_time: revenueOverTime,
    };
  }

  async getModelComparison(): Promise<ModelComparison[]> {
    const userId = await this.getUserId();

    // Fetch all channel attributions across all model types
    const { data: allAttributions, error } = await supabase
      .from('channel_attributions')
      .select('channel, model_type, attributed_revenue')
      .eq('user_id', userId);

    if (error) throw error;

    const attributions = (allAttributions || []) as unknown as Array<{
      channel: string;
      model_type: AttributionModelType;
      attributed_revenue: number;
    }>;

    // Group by channel
    const channelMap = new Map<string, Map<AttributionModelType, number>>();
    attributions.forEach(a => {
      if (!channelMap.has(a.channel)) {
        channelMap.set(a.channel, new Map());
      }
      const existing = channelMap.get(a.channel)!.get(a.model_type) || 0;
      channelMap.get(a.channel)!.set(a.model_type, existing + a.attributed_revenue);
    });

    // Calculate total revenue per model type for percentage share
    const modelTotals = new Map<AttributionModelType, number>();
    attributions.forEach(a => {
      const existing = modelTotals.get(a.model_type) || 0;
      modelTotals.set(a.model_type, existing + a.attributed_revenue);
    });

    // Build comparison objects
    const result: ModelComparison[] = [];
    channelMap.forEach((modelMap, channel) => {
      const models: ModelComparison['models'] = {};
      modelMap.forEach((revenue, modelType) => {
        const total = modelTotals.get(modelType) || 1;
        models[modelType] = {
          attributed_revenue: revenue,
          percentage_share: Math.round((revenue / total) * 1000) / 10,
        };
      });
      result.push({
        channel,
        color: CHANNEL_COLORS[channel] || '#6b7280',
        models,
      });
    });

    // Sort by the highest attributed revenue across any model
    result.sort((a, b) => {
      const maxA = Math.max(...Object.values(a.models).map(m => m?.attributed_revenue || 0));
      const maxB = Math.max(...Object.values(b.models).map(m => m?.attributed_revenue || 0));
      return maxB - maxA;
    });

    return result;
  }

  async getJourneyPaths(limit: number = 10): Promise<JourneyPath[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('journey_paths')
      .select('*')
      .eq('user_id', userId)
      .order('frequency', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as unknown as JourneyPath[];
  }

  async getChannelROI(modelType: AttributionModelType): Promise<ChannelAttribution[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('channel_attributions')
      .select('*')
      .eq('user_id', userId)
      .eq('model_type', modelType)
      .order('attributed_revenue', { ascending: false });

    if (error) throw error;

    const channels = ((data || []) as unknown as ChannelAttribution[]).map(ch => ({
      ...ch,
      color: CHANNEL_COLORS[ch.channel] || '#6b7280',
      display_name: ch.display_name || ch.channel,
      roi: ch.cost > 0 ? Math.round(((ch.attributed_revenue - ch.cost) / ch.cost) * 100) : 999,
    }));

    // Recalculate percentage_share
    const totalRevenue = channels.reduce((sum, c) => sum + c.attributed_revenue, 0);
    channels.forEach(ch => {
      ch.percentage_share = totalRevenue > 0
        ? Math.round((ch.attributed_revenue / totalRevenue) * 1000) / 10
        : 0;
    });

    return channels;
  }
}

export const attributionService = new AttributionService();
export default attributionService;
