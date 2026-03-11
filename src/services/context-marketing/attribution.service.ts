// src/services/context-marketing/attribution.service.ts
// Multi-Touch Attribution service — AI-driven channel attribution with multiple models

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

const mockModels: AttributionModelConfig[] = [
  { id: 'attr-first', name: 'First Touch', type: 'first_touch', description: 'Credits the first interaction that started the journey', is_active: true },
  { id: 'attr-last', name: 'Last Touch', type: 'last_touch', description: 'Credits the last interaction before conversion', is_active: true },
  { id: 'attr-linear', name: 'Linear', type: 'linear', description: 'Distributes credit equally across all touchpoints', is_active: true },
  { id: 'attr-time', name: 'Time Decay', type: 'time_decay', description: 'More credit to touchpoints closer to conversion', is_active: true },
  { id: 'attr-u', name: 'U-Shaped', type: 'u_shaped', description: '40% first touch, 40% last touch, 20% distributed middle', is_active: true },
  { id: 'attr-w', name: 'W-Shaped', type: 'w_shaped', description: '30% first, 30% lead creation, 30% opportunity, 10% rest', is_active: true },
  { id: 'attr-markov', name: 'Markov Chain', type: 'data_driven_markov', description: 'Data-driven model using transition probabilities between channels', is_active: true, accuracy_score: 94.2 },
  { id: 'attr-shapley', name: 'Shapley Value', type: 'data_driven_shapley', description: 'Game theory approach calculating marginal contribution of each channel', is_active: true, accuracy_score: 96.1 },
];

function generateChannelData(modelType: AttributionModelType): ChannelAttribution[] {
  const baseData: Record<string, { conv: number; rev: number; cost: number; pos: number; tp: number }> = {
    'Organic Search': { conv: 312, rev: 468000, cost: 45000, pos: 1.8, tp: 2450 },
    'Paid Search': { conv: 228, rev: 389000, cost: 125000, pos: 2.4, tp: 1890 },
    'Social Media': { conv: 156, rev: 187000, cost: 67000, pos: 2.1, tp: 3200 },
    'Email': { conv: 186, rev: 312000, cost: 18000, pos: 3.2, tp: 5600 },
    'Direct': { conv: 83, rev: 124000, cost: 0, pos: 3.8, tp: 890 },
    'Referral': { conv: 31, rev: 46000, cost: 12000, pos: 1.5, tp: 420 },
    'Display Ads': { conv: 42, rev: 63000, cost: 89000, pos: 1.2, tp: 12400 },
  };

  // Apply model-specific weighting adjustments
  const multipliers: Record<string, number> = {};
  switch (modelType) {
    case 'first_touch':
      multipliers['Organic Search'] = 1.35; multipliers['Display Ads'] = 1.4; multipliers['Referral'] = 1.3;
      multipliers['Email'] = 0.65; multipliers['Direct'] = 0.5;
      break;
    case 'last_touch':
      multipliers['Email'] = 1.4; multipliers['Direct'] = 1.5; multipliers['Paid Search'] = 1.2;
      multipliers['Display Ads'] = 0.5; multipliers['Referral'] = 0.6;
      break;
    case 'time_decay':
      multipliers['Email'] = 1.25; multipliers['Paid Search'] = 1.15; multipliers['Direct'] = 1.3;
      multipliers['Display Ads'] = 0.6; multipliers['Organic Search'] = 0.9;
      break;
    case 'u_shaped':
      multipliers['Organic Search'] = 1.2; multipliers['Direct'] = 1.25; multipliers['Display Ads'] = 1.15;
      multipliers['Social Media'] = 0.85;
      break;
    case 'w_shaped':
      multipliers['Organic Search'] = 1.15; multipliers['Email'] = 1.2; multipliers['Direct'] = 1.15;
      multipliers['Display Ads'] = 0.9;
      break;
    case 'data_driven_markov':
      multipliers['Social Media'] = 1.3; multipliers['Email'] = 1.15; multipliers['Organic Search'] = 1.1;
      multipliers['Display Ads'] = 0.7; multipliers['Direct'] = 0.85;
      break;
    case 'data_driven_shapley':
      multipliers['Social Media'] = 1.25; multipliers['Email'] = 1.2; multipliers['Organic Search'] = 1.15;
      multipliers['Paid Search'] = 1.05; multipliers['Display Ads'] = 0.65;
      break;
    default: // linear
      break;
  }

  const totalRev = Object.entries(baseData).reduce((sum, [ch, d]) => sum + d.rev * (multipliers[ch] || 1), 0);

  return Object.entries(baseData).map(([channel, data]) => {
    const m = multipliers[channel] || 1;
    const adjustedRev = Math.round(data.rev * m);
    return {
      channel,
      display_name: channel,
      color: CHANNEL_COLORS[channel] || '#6b7280',
      attributed_conversions: Math.round(data.conv * m),
      attributed_revenue: adjustedRev,
      cost: data.cost,
      roi: data.cost > 0 ? Math.round(((adjustedRev - data.cost) / data.cost) * 100) : 999,
      percentage_share: Math.round((adjustedRev / totalRev) * 1000) / 10,
      avg_position_in_journey: data.pos,
      total_touchpoints: data.tp,
      confidence: modelType.startsWith('data_driven') ? 85 + Math.random() * 12 : 70 + Math.random() * 15,
    };
  }).sort((a, b) => b.attributed_revenue - a.attributed_revenue);
}

const mockJourneyPaths: JourneyPath[] = [
  { id: 'jp-001', touchpoints: [{ channel: 'Display Ads', timestamp: '2026-02-15', interaction_type: 'Ad View' }, { channel: 'Organic Search', timestamp: '2026-02-18', interaction_type: 'Blog Visit' }, { channel: 'Email', timestamp: '2026-02-22', interaction_type: 'Newsletter Click' }, { channel: 'Direct', timestamp: '2026-02-28', interaction_type: 'Website Visit' }, { channel: 'Paid Search', timestamp: '2026-03-05', interaction_type: 'Ad Click → Signup' }], conversion_type: 'Trial Start', conversion_value: 2500, total_duration_days: 18, touchpoint_count: 5, frequency: 89 },
  { id: 'jp-002', touchpoints: [{ channel: 'Social Media', timestamp: '2026-02-20', interaction_type: 'LinkedIn Post' }, { channel: 'Email', timestamp: '2026-02-24', interaction_type: 'Webinar Invite' }, { channel: 'Direct', timestamp: '2026-03-01', interaction_type: 'Demo Request' }], conversion_type: 'Demo', conversion_value: 5000, total_duration_days: 9, touchpoint_count: 3, frequency: 67 },
  { id: 'jp-003', touchpoints: [{ channel: 'Organic Search', timestamp: '2026-02-10', interaction_type: 'Blog Visit' }, { channel: 'Social Media', timestamp: '2026-02-14', interaction_type: 'Instagram Follow' }, { channel: 'Email', timestamp: '2026-02-20', interaction_type: 'Case Study Download' }, { channel: 'Paid Search', timestamp: '2026-02-28', interaction_type: 'Ad Click' }, { channel: 'Email', timestamp: '2026-03-04', interaction_type: 'Pricing Follow-up' }, { channel: 'Direct', timestamp: '2026-03-08', interaction_type: 'Purchase' }], conversion_type: 'Purchase', conversion_value: 12000, total_duration_days: 26, touchpoint_count: 6, frequency: 45 },
  { id: 'jp-004', touchpoints: [{ channel: 'Referral', timestamp: '2026-02-25', interaction_type: 'Partner Link' }, { channel: 'Direct', timestamp: '2026-02-26', interaction_type: 'Pricing Page' }, { channel: 'Email', timestamp: '2026-03-02', interaction_type: 'Free Trial Reminder' }], conversion_type: 'Trial Start', conversion_value: 2500, total_duration_days: 5, touchpoint_count: 3, frequency: 34 },
  { id: 'jp-005', touchpoints: [{ channel: 'Paid Search', timestamp: '2026-02-12', interaction_type: 'Ad Click' }, { channel: 'Organic Search', timestamp: '2026-02-16', interaction_type: 'Feature Comparison' }, { channel: 'Social Media', timestamp: '2026-02-20', interaction_type: 'LinkedIn Article' }, { channel: 'Email', timestamp: '2026-02-25', interaction_type: 'Nurture Email' }, { channel: 'Direct', timestamp: '2026-03-03', interaction_type: 'Enterprise Demo' }, { channel: 'Email', timestamp: '2026-03-07', interaction_type: 'Proposal Follow-up' }, { channel: 'Direct', timestamp: '2026-03-10', interaction_type: 'Contract Signed' }], conversion_type: 'Enterprise Deal', conversion_value: 48000, total_duration_days: 26, touchpoint_count: 7, frequency: 23 },
  { id: 'jp-006', touchpoints: [{ channel: 'Display Ads', timestamp: '2026-03-01', interaction_type: 'Banner View' }, { channel: 'Social Media', timestamp: '2026-03-03', interaction_type: 'Facebook Ad Click' }, { channel: 'Direct', timestamp: '2026-03-05', interaction_type: 'Signup' }], conversion_type: 'Free Trial', conversion_value: 1500, total_duration_days: 4, touchpoint_count: 3, frequency: 56 },
  { id: 'jp-007', touchpoints: [{ channel: 'Organic Search', timestamp: '2026-02-08', interaction_type: 'SEO Landing' }, { channel: 'Email', timestamp: '2026-02-15', interaction_type: 'Welcome Series' }, { channel: 'Social Media', timestamp: '2026-02-22', interaction_type: 'Retargeting Ad' }, { channel: 'Organic Search', timestamp: '2026-03-01', interaction_type: 'Case Study' }, { channel: 'Direct', timestamp: '2026-03-09', interaction_type: 'Purchase' }], conversion_type: 'Purchase', conversion_value: 8500, total_duration_days: 29, touchpoint_count: 5, frequency: 38 },
];

class AttributionService {
  async getModels(): Promise<AttributionModelConfig[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockModels]), 300);
    });
  }

  async runAttribution(modelType: AttributionModelType): Promise<AttributionDashboardData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const channels = generateChannelData(modelType);
        resolve({
          total_conversions: 1038,
          total_revenue: channels.reduce((sum, c) => sum + c.attributed_revenue, 0),
          avg_touchpoints_per_conversion: 4.2,
          avg_days_to_conversion: 16.8,
          channels,
          top_paths: mockJourneyPaths,
          model_comparison: [],
          revenue_over_time: [
            { date: '2026-01', revenue: 189000, conversions: 124 },
            { date: '2026-02', revenue: 234000, conversions: 156 },
            { date: '2026-03', revenue: 278000, conversions: 189 },
          ],
        });
      }, 800);
    });
  }

  async getModelComparison(): Promise<ModelComparison[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const channels = ['Organic Search', 'Paid Search', 'Social Media', 'Email', 'Direct', 'Referral', 'Display Ads'];
        const modelTypes: AttributionModelType[] = ['first_touch', 'last_touch', 'linear', 'time_decay', 'data_driven_shapley'];

        resolve(channels.map(channel => {
          const models: ModelComparison['models'] = {};
          modelTypes.forEach(mt => {
            const data = generateChannelData(mt).find(c => c.channel === channel);
            if (data) {
              models[mt] = { attributed_revenue: data.attributed_revenue, percentage_share: data.percentage_share };
            }
          });
          return { channel, color: CHANNEL_COLORS[channel] || '#6b7280', models };
        }));
      }, 1000);
    });
  }

  async getJourneyPaths(limit: number = 10): Promise<JourneyPath[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockJourneyPaths.slice(0, limit)), 500);
    });
  }

  async getChannelROI(modelType: AttributionModelType): Promise<ChannelAttribution[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(generateChannelData(modelType)), 600);
    });
  }
}

export const attributionService = new AttributionService();
export default attributionService;
