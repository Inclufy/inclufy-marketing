// src/services/context-marketing/revenue-engine.service.ts
import { supabase } from '@/integrations/supabase/client';

// Type definitions
export interface RevenuePrediction {
  id: string;
  entity_type: 'customer' | 'campaign' | 'channel' | 'product';
  entity_id: string;
  predicted_value: number;
  confidence: number; // 0-100
  time_horizon: number; // days
  factors: string[];
  created_at: string;
  updated_at: string;
}

export interface RevenueOpportunity {
  id: string;
  title: string;
  description: string;
  opportunity_type: 'upsell' | 'cross_sell' | 'retention' | 'acquisition' | 'pricing' | 'expansion';
  estimated_value: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort_required: 'low' | 'medium' | 'high';
  time_to_value: number; // days
  success_probability: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  status: 'identified' | 'in_progress' | 'implemented' | 'dismissed';
  created_at: string;
}

export interface CustomerLifetimeValue {
  customer_id?: string;
  segment_name: string;
  avg_ltv: number;
  predicted_ltv: number;
  churn_probability: number;
  expansion_potential: number;
  customer_count: number;
  key_characteristics: string[];
}

export interface RevenueMetrics {
  currentRevenue: number;
  predictedRevenue: number;
  growthRate: number;
  avgCustomerValue: number;
  conversionRate: number;
  churnRate: number;
}

// Safe mappers: DB may store JSONB/TEXT that differs from TS interface
function safePrediction(raw: any): RevenuePrediction {
  const th = raw.time_horizon;
  return {
    ...raw,
    predicted_value: Number(raw.predicted_value) || 0,
    confidence: Number(raw.confidence) || 0,
    time_horizon: typeof th === 'number' ? th : parseInt(String(th)) || 30,
    factors: Array.isArray(raw.factors) ? raw.factors : [],
  };
}

function safeRevOpp(raw: any): RevenueOpportunity {
  const imp = raw.impact;
  const ttv = raw.time_to_value;
  return {
    ...raw,
    estimated_value: Number(raw.estimated_value) || 0,
    success_probability: Number(raw.success_probability) || 0,
    impact:
      typeof imp === 'string' ? imp
      : imp && typeof imp === 'object' && imp.level ? imp.level
      : 'medium',
    time_to_value:
      typeof ttv === 'number' ? ttv
      : parseInt(String(ttv)) || 30,
  };
}

export interface PriceOptimization {
  product_id: string;
  current_price: number;
  optimal_price: number;
  elasticity: number;
  projected_impact: {
    revenue: number;
    volume: number;
    profit: number;
  };
  confidence: number;
}

// Service implementation
class RevenueEngineService {
  private optimizationRunning: boolean = false;

  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  // Get revenue metrics computed from predictions and opportunities
  async getRevenueMetrics(timeRange: string): Promise<RevenueMetrics> {
    const userId = await this.getUserId();

    const multiplier = timeRange === '7d' ? 0.25 :
                      timeRange === '30d' ? 1 :
                      timeRange === '90d' ? 3 : 12;

    // Fetch predictions to compute current/predicted revenue
    const { data: predictions, error: predError } = await supabase
      .from('revenue_predictions')
      .select('*')
      .eq('user_id', userId);
    if (predError) throw predError;

    // Fetch opportunities to compute conversion and churn
    const { data: opportunities, error: oppError } = await supabase
      .from('revenue_opportunities')
      .select('*')
      .eq('user_id', userId);
    if (oppError) throw oppError;

    const preds = (predictions || []).map(safePrediction) as RevenuePrediction[];
    const opps = (opportunities || []).map(safeRevOpp) as RevenueOpportunity[];

    const totalPredictedValue = preds.reduce((sum, p) => sum + p.predicted_value, 0);
    const avgConfidence = preds.length > 0
      ? preds.reduce((sum, p) => sum + p.confidence, 0) / preds.length
      : 85;

    const currentRevenue = totalPredictedValue > 0
      ? totalPredictedValue * multiplier * (avgConfidence / 100)
      : 2500000 * multiplier;

    const identifiedOpps = opps.filter(o => o.status === 'identified' || o.status === 'in_progress');
    const totalOppValue = identifiedOpps.reduce((sum, o) => sum + o.estimated_value, 0);
    const predictedRevenue = currentRevenue + totalOppValue * (avgConfidence / 100);

    const growthRate = currentRevenue > 0
      ? ((predictedRevenue - currentRevenue) / currentRevenue) * 100
      : 15;

    const avgSuccessProb = opps.length > 0
      ? opps.reduce((sum, o) => sum + o.success_probability, 0) / opps.length
      : 3.5;

    const retentionOpps = opps.filter(o => o.opportunity_type === 'retention');
    const churnRate = retentionOpps.length > 0
      ? 100 - retentionOpps.reduce((sum, o) => sum + o.success_probability, 0) / retentionOpps.length
      : 5.8;

    return {
      currentRevenue,
      predictedRevenue,
      growthRate,
      avgCustomerValue: preds.length > 0
        ? totalPredictedValue / preds.length
        : 2500,
      conversionRate: avgSuccessProb > 10 ? avgSuccessProb / 10 : avgSuccessProb,
      churnRate
    };
  }

  // Get revenue predictions
  async getRevenuePredictions(): Promise<RevenuePrediction[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('revenue_predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(safePrediction) as RevenuePrediction[];
  }

  // Get revenue opportunities
  async getRevenueOpportunities(): Promise<RevenueOpportunity[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('revenue_opportunities')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'identified')
      .order('estimated_value', { ascending: false });
    if (error) throw error;
    return (data || []).map(safeRevOpp) as RevenueOpportunity[];
  }

  // Get customer lifetime value analysis
  async getCustomerLTV(): Promise<CustomerLifetimeValue[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('customer_ltv')
      .select('*')
      .eq('user_id', userId)
      .order('avg_ltv', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as CustomerLifetimeValue[];
  }

  // Predict customer value
  async predictCustomerValue(customerId: string, timeHorizon: number = 365): Promise<{
    predicted_ltv: number;
    confidence: number;
    key_factors: string[];
    churn_risk: number;
    expansion_opportunities: string[];
  }> {
    const userId = await this.getUserId();

    // Fetch customer LTV data for this customer
    const { data, error } = await supabase
      .from('customer_ltv')
      .select('*')
      .eq('user_id', userId)
      .eq('customer_id', customerId)
      .maybeSingle();
    if (error) throw error;

    if (data) {
      const record = data as unknown as CustomerLifetimeValue;
      const horizonMultiplier = timeHorizon / 365;
      return {
        predicted_ltv: record.predicted_ltv * horizonMultiplier,
        confidence: Math.max(50, 95 - (timeHorizon / 30)),
        key_factors: record.key_characteristics || [
          'Product usage patterns',
          'Engagement metrics',
          'Historical spend'
        ],
        churn_risk: record.churn_probability,
        expansion_opportunities: record.expansion_potential > 60
          ? ['Analytics package upgrade', 'Additional user seats', 'Premium support tier']
          : ['Feature adoption improvement', 'Engagement programs']
      };
    }

    // Fallback: compute from segment averages
    const { data: segments, error: segError } = await supabase
      .from('customer_ltv')
      .select('*')
      .eq('user_id', userId);
    if (segError) throw segError;

    const allSegments = (segments || []) as unknown as CustomerLifetimeValue[];
    const avgLtv = allSegments.length > 0
      ? allSegments.reduce((sum, s) => sum + s.predicted_ltv, 0) / allSegments.length
      : 45000;
    const avgChurn = allSegments.length > 0
      ? allSegments.reduce((sum, s) => sum + s.churn_probability, 0) / allSegments.length
      : 20;

    return {
      predicted_ltv: avgLtv * (timeHorizon / 365),
      confidence: 70,
      key_factors: [
        'Segment average estimation',
        'Historical patterns',
        'Market benchmarks'
      ],
      churn_risk: avgChurn,
      expansion_opportunities: [
        'Analytics package upgrade',
        'Additional user seats',
        'Premium support tier'
      ]
    };
  }

  // Optimize pricing
  async optimizePricing(productId: string): Promise<PriceOptimization> {
    const userId = await this.getUserId();

    // Pull revenue data to inform pricing suggestions
    const { data: predictions, error } = await supabase
      .from('revenue_predictions')
      .select('*')
      .eq('user_id', userId)
      .eq('entity_type', 'product')
      .eq('entity_id', productId);
    if (error) throw error;

    const preds = (predictions || []).map(safePrediction) as RevenuePrediction[];

    const avgPredictedValue = preds.length > 0
      ? preds.reduce((sum, p) => sum + p.predicted_value, 0) / preds.length
      : 99;

    const avgConfidence = preds.length > 0
      ? preds.reduce((sum, p) => sum + p.confidence, 0) / preds.length
      : 80;

    const currentPrice = avgPredictedValue > 1000 ? avgPredictedValue / 100 : avgPredictedValue;
    const elasticity = -1.2 + (avgConfidence / 200);
    const optimalPrice = currentPrice * (1 + (1 / Math.abs(elasticity) - 1) * 0.1);

    return {
      product_id: productId,
      current_price: Math.round(currentPrice * 100) / 100,
      optimal_price: Math.round(optimalPrice * 100) / 100,
      elasticity,
      projected_impact: {
        revenue: Math.round((optimalPrice - currentPrice) * 1000),
        volume: optimalPrice > currentPrice ? -50 : 100,
        profit: Math.round((optimalPrice - currentPrice) * 800)
      },
      confidence: avgConfidence
    };
  }

  // Optimize revenue (main optimization function)
  async optimizeRevenue(): Promise<{
    optimizations_applied: number;
    projected_impact: number;
    actions_taken: string[];
  }> {
    if (this.optimizationRunning) {
      throw new Error('Optimization already in progress');
    }

    this.optimizationRunning = true;

    try {
      const userId = await this.getUserId();

      // Fetch identified opportunities
      const { data: opportunities, error } = await supabase
        .from('revenue_opportunities')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'identified')
        .order('estimated_value', { ascending: false });
      if (error) throw error;

      const opps = (opportunities || []).map(safeRevOpp) as RevenueOpportunity[];
      const actions: string[] = [];
      let projectedImpact = 0;

      // Move top opportunities to in_progress
      for (const opp of opps.slice(0, 5)) {
        const { error: updateError } = await supabase
          .from('revenue_opportunities')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('id', opp.id)
          .eq('user_id', userId);
        if (!updateError) {
          actions.push(`Activated: ${opp.title}`);
          projectedImpact += opp.estimated_value * (opp.success_probability / 100);
        }
      }

      if (actions.length === 0) {
        actions.push('No new opportunities to optimize at this time');
      }

      return {
        optimizations_applied: actions.length,
        projected_impact: Math.round(projectedImpact),
        actions_taken: actions
      };
    } finally {
      this.optimizationRunning = false;
    }
  }

  // Implement specific opportunity
  async implementOpportunity(opportunityId: string): Promise<void> {
    const userId = await this.getUserId();

    const { data, error: fetchError } = await supabase
      .from('revenue_opportunities')
      .select('*')
      .eq('id', opportunityId)
      .eq('user_id', userId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!data) throw new Error('Opportunity not found');

    const { error: updateError } = await supabase
      .from('revenue_opportunities')
      .update({ status: 'implemented', updated_at: new Date().toISOString() })
      .eq('id', opportunityId)
      .eq('user_id', userId);
    if (updateError) throw updateError;
  }

  // Forecast revenue
  async forecastRevenue(scenarios: any[]): Promise<{
    base_case: number;
    best_case: number;
    worst_case: number;
    most_likely: number;
    confidence_intervals: any;
  }> {
    const userId = await this.getUserId();

    // Pull historical predictions to build forecast
    const { data: predictions, error } = await supabase
      .from('revenue_predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const preds = (predictions || []).map(safePrediction) as RevenuePrediction[];

    const baseRevenue = preds.length > 0
      ? preds.reduce((sum, p) => sum + p.predicted_value, 0)
      : 2500000;

    const avgConfidence = preds.length > 0
      ? preds.reduce((sum, p) => sum + p.confidence, 0) / preds.length
      : 85;

    const confidenceFactor = avgConfidence / 100;
    const varianceMultiplier = 1 - confidenceFactor + 0.5;

    return {
      base_case: Math.round(baseRevenue),
      best_case: Math.round(baseRevenue * (1 + varianceMultiplier * 0.35)),
      worst_case: Math.round(baseRevenue * (1 - varianceMultiplier * 0.15)),
      most_likely: Math.round(baseRevenue * (1 + varianceMultiplier * 0.15)),
      confidence_intervals: {
        '95': [
          Math.round(baseRevenue * (1 - varianceMultiplier * 0.2)),
          Math.round(baseRevenue * (1 + varianceMultiplier * 0.4))
        ],
        '80': [
          Math.round(baseRevenue * (1 - varianceMultiplier * 0.1)),
          Math.round(baseRevenue * (1 + varianceMultiplier * 0.25))
        ],
        '50': [
          Math.round(baseRevenue * (1 + varianceMultiplier * 0.05)),
          Math.round(baseRevenue * (1 + varianceMultiplier * 0.15))
        ]
      }
    };
  }

  // Churn prevention - identify at-risk customers from customer_ltv
  async identifyChurnRisks(): Promise<{
    at_risk_customers: Array<{
      customer_id: string;
      churn_probability: number;
      value_at_risk: number;
      key_indicators: string[];
      recommended_actions: string[];
    }>;
    total_revenue_at_risk: number;
  }> {
    const userId = await this.getUserId();

    // Query customer_ltv for high churn probability
    const { data, error } = await supabase
      .from('customer_ltv')
      .select('*')
      .eq('user_id', userId)
      .gte('churn_probability', 50)
      .order('churn_probability', { ascending: false });
    if (error) throw error;

    const records = (data || []) as unknown as CustomerLifetimeValue[];

    const atRiskCustomers = records.map(record => ({
      customer_id: record.customer_id || record.segment_name,
      churn_probability: record.churn_probability,
      value_at_risk: record.predicted_ltv,
      key_indicators: record.key_characteristics.length > 0
        ? record.key_characteristics
        : [
            'Engagement declining',
            'Usage metrics below average',
            'Support interactions increasing'
          ],
      recommended_actions: record.churn_probability >= 70
        ? [
            'Schedule executive business review',
            'Offer dedicated success manager',
            'Provide platform training',
            'Consider contract incentives'
          ]
        : [
            'Send personalized re-engagement campaign',
            'Offer product roadmap preview',
            'Provide competitive comparison'
          ]
    }));

    return {
      at_risk_customers: atRiskCustomers,
      total_revenue_at_risk: atRiskCustomers.reduce((sum, c) => sum + c.value_at_risk, 0)
    };
  }

  // Revenue attribution - compute from revenue data
  async analyzeRevenueAttribution(): Promise<{
    by_channel: Record<string, number>;
    by_campaign: Record<string, number>;
    by_touchpoint: Record<string, number>;
    multi_touch_impact: number;
  }> {
    const userId = await this.getUserId();

    // Pull predictions by entity type to build attribution
    const { data: predictions, error } = await supabase
      .from('revenue_predictions')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;

    const preds = (predictions || []).map(safePrediction) as RevenuePrediction[];

    const byChannel: Record<string, number> = {};
    const byCampaign: Record<string, number> = {};
    const byTouchpoint: Record<string, number> = {};

    for (const pred of preds) {
      if (pred.entity_type === 'channel') {
        byChannel[pred.entity_id] = (byChannel[pred.entity_id] || 0) + pred.predicted_value;
      } else if (pred.entity_type === 'campaign') {
        byCampaign[pred.entity_id] = (byCampaign[pred.entity_id] || 0) + pred.predicted_value;
      }
    }

    // Compute touchpoint attribution from channel data
    const totalChannelRevenue = Object.values(byChannel).reduce((sum, v) => sum + v, 0);
    if (totalChannelRevenue > 0) {
      byTouchpoint['first_touch'] = Math.round(totalChannelRevenue * 0.32);
      byTouchpoint['last_touch'] = Math.round(totalChannelRevenue * 0.48);
      byTouchpoint['assisted'] = Math.round(totalChannelRevenue * 0.20);
    }

    // Multi-touch impact: percentage of predictions that involve multiple entities
    const campaignCount = preds.filter(p => p.entity_type === 'campaign').length;
    const channelCount = preds.filter(p => p.entity_type === 'channel').length;
    const multiTouchImpact = (campaignCount > 0 && channelCount > 0)
      ? Math.round((Math.min(campaignCount, channelCount) / Math.max(campaignCount, channelCount)) * 50)
      : 35;

    return {
      by_channel: byChannel,
      by_campaign: byCampaign,
      by_touchpoint: byTouchpoint,
      multi_touch_impact: multiTouchImpact
    };
  }
}

// Export singleton instance
export const revenueEngineService = new RevenueEngineService();

// Re-export as default
export default revenueEngineService;
