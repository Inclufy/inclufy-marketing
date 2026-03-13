// src/services/context-marketing/campaign-triggering.service.ts
// Autonomous Campaign Triggering — AI detects signals and auto-starts campaigns

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

const mockTriggers: CampaignTrigger[] = [
  { id: 'trg-001', name: 'Trending Topic Detector', type: 'trend_detected', description: 'Detecteert trending topics in de industrie en start automatisch thought leadership content', condition: 'trend_velocity > 150% AND relevance_score > 80', status: 'active', actions: ['linkedin_posts', 'blog_article', 'email_sequence'], channels: ['LinkedIn', 'Blog', 'Email'], budget_limit: 5000, confidence_threshold: 85, requires_approval: false, times_triggered: 12, last_triggered: '2026-03-11T08:00:00Z', created_at: '2026-01-15', performance: { campaigns_launched: 12, total_reach: 890000, leads_generated: 234, revenue_impact: 156000, avg_roi: 340 } },
  { id: 'trg-002', name: 'Competitor Gap Exploiter', type: 'competitor_move', description: 'Detecteert zwakheden bij concurrenten en lanceert vergelijkings-campagnes', condition: 'competitor_negative_reviews > 10 AND our_feature_available = true', status: 'active', actions: ['google_ads', 'landing_page', 'social_ads'], channels: ['Google Ads', 'Landing Page', 'Facebook'], budget_limit: 8000, confidence_threshold: 80, requires_approval: true, times_triggered: 5, last_triggered: '2026-03-09T16:00:00Z', created_at: '2026-02-01', performance: { campaigns_launched: 5, total_reach: 450000, leads_generated: 89, revenue_impact: 234000, avg_roi: 480 } },
  { id: 'trg-003', name: 'High-Intent Lead Accelerator', type: 'lead_behavior', description: 'Detecteert leads met hoge koopintentie en triggert personalized nurture', condition: 'lead_score > 80 AND pricing_page_views >= 3 AND days_since_last_visit < 3', status: 'active', actions: ['email_sequence', 'linkedin_posts'], channels: ['Email', 'LinkedIn'], budget_limit: 2000, confidence_threshold: 75, requires_approval: false, times_triggered: 34, last_triggered: '2026-03-11T09:15:00Z', created_at: '2026-01-20', performance: { campaigns_launched: 34, total_reach: 12000, leads_generated: 34, revenue_impact: 890000, avg_roi: 1200 } },
  { id: 'trg-004', name: 'Performance Threshold Optimizer', type: 'performance_threshold', description: 'Pauzeert underperforming campagnes en herverdelt budget automatisch', condition: 'campaign_roas < 1.5 AND running_days > 7', status: 'active', actions: ['multi_channel'], channels: ['All Active'], budget_limit: 0, confidence_threshold: 90, requires_approval: false, times_triggered: 18, last_triggered: '2026-03-10T09:30:00Z', created_at: '2026-02-10', performance: { campaigns_launched: 0, total_reach: 0, leads_generated: 0, revenue_impact: 67000, avg_roi: 0 } },
  { id: 'trg-005', name: 'Seasonal Campaign Launcher', type: 'seasonal', description: 'Lanceert seizoensgebonden campagnes op basis van kalender en historische data', condition: 'season_event_approaching AND days_until_event <= 30', status: 'active', actions: ['multi_channel'], channels: ['LinkedIn', 'Email', 'Google Ads', 'Blog'], budget_limit: 15000, confidence_threshold: 70, requires_approval: true, times_triggered: 4, last_triggered: '2026-03-01T00:00:00Z', created_at: '2025-12-01', performance: { campaigns_launched: 4, total_reach: 560000, leads_generated: 145, revenue_impact: 189000, avg_roi: 280 } },
  { id: 'trg-006', name: 'Event Buzz Amplifier', type: 'event_based', description: 'Detecteert aankomende events en start pre-event awareness campagnes', condition: 'registered_event AND days_until_event <= 14', status: 'active', actions: ['linkedin_posts', 'email_sequence', 'social_ads'], channels: ['LinkedIn', 'Email', 'Instagram'], budget_limit: 3000, confidence_threshold: 75, requires_approval: false, times_triggered: 8, last_triggered: '2026-03-08T00:00:00Z', created_at: '2026-01-10', performance: { campaigns_launched: 8, total_reach: 234000, leads_generated: 67, revenue_impact: 78000, avg_roi: 320 } },
];

const mockTriggeredCampaigns: TriggeredCampaign[] = [
  { id: 'tc-001', trigger_id: 'trg-001', trigger_name: 'Trending Topic Detector', campaign_name: 'AI Governance Thought Leadership', signal: 'AI Governance zoekvolume +240%', channels: ['LinkedIn', 'Blog', 'Email'], budget_allocated: 4500, status: 'active', launched_at: '2026-03-11T08:30:00Z', performance: { impressions: 12000, clicks: 890, leads: 23, conversions: 5, revenue: 12000, roi: 167 }, ai_reasoning: 'Explosieve groei in AI governance interesse gedetecteerd. Geen concurrenten met Nederlandstalige content. First-mover advantage window: ~14 dagen.', content_generated: [{ type: 'LinkedIn Post', title: 'AI Governance: Wat elke marketeer moet weten', status: 'published' }, { type: 'Blog Article', title: 'Complete Gids: AI Governance voor Marketing Teams', status: 'writing' }, { type: 'Email Sequence', title: '5-delige AI Governance serie', status: 'scheduled' }] },
  { id: 'tc-002', trigger_id: 'trg-003', trigger_name: 'High-Intent Lead Accelerator', campaign_name: 'Enterprise Demo Push — Sophie Van den Berg', signal: 'Lead score 86→94, pricing page 5x bezocht', channels: ['Email', 'LinkedIn'], budget_allocated: 500, status: 'active', launched_at: '2026-03-11T09:20:00Z', performance: { impressions: 15, clicks: 3, leads: 1, conversions: 0, revenue: 0, roi: 0 }, ai_reasoning: 'Hoge koopintentie gedetecteerd: 5 pricing page visits, ROI whitepaper download, en API docs bekeken. Estimated deal value: EUR 45.000.', content_generated: [{ type: 'Email', title: 'Personalized enterprise demo invite', status: 'sent' }, { type: 'LinkedIn InMail', title: 'Connection request + value proposition', status: 'sent' }] },
  { id: 'tc-003', trigger_id: 'trg-002', trigger_name: 'Competitor Gap Exploiter', campaign_name: 'Switch from ActiveCampaign', signal: '23 negatieve G2 reviews over ontbrekende attribution', channels: ['Google Ads', 'Landing Page'], budget_allocated: 6000, status: 'pending_approval', launched_at: '2026-03-10T10:00:00Z', performance: { impressions: 0, clicks: 0, leads: 0, conversions: 0, revenue: 0, roi: 0 }, ai_reasoning: 'ActiveCampaign gebruikers uiten ontevredenheid over ontbrekende AI attribution en lead scoring. Inclufy biedt deze features. Verwachte CPA: EUR 45, verwachte deal value: EUR 8.500.', content_generated: [{ type: 'Landing Page', title: 'Inclufy vs ActiveCampaign: Complete vergelijking', status: 'ready' }, { type: 'Google Ad Set', title: '3 ad varianten targeting AC keywords', status: 'ready' }] },
  { id: 'tc-004', trigger_id: 'trg-006', trigger_name: 'Event Buzz Amplifier', campaign_name: 'Pre-SaaS Summit Awareness', signal: 'SaaS Growth Summit in 5 dagen', channels: ['LinkedIn', 'Email', 'Instagram'], budget_allocated: 2500, status: 'completed', launched_at: '2026-03-05T08:00:00Z', performance: { impressions: 89000, clicks: 4500, leads: 45, conversions: 12, revenue: 34000, roi: 1260 }, ai_reasoning: 'SaaS Growth Summit Benelux nadert. Pre-event campagne maximaliseert booth traffic en meeting bookings.', content_generated: [{ type: 'LinkedIn Posts', title: '5 posts: countdown to SaaS Summit', status: 'published' }, { type: 'Email', title: 'Meet us at SaaS Summit booth #42', status: 'sent' }] },
];

class CampaignTriggeringService {
  async getTriggers(): Promise<CampaignTrigger[]> {
    return new Promise(r => setTimeout(() => r([...mockTriggers]), 500));
  }

  async getTriggeredCampaigns(): Promise<TriggeredCampaign[]> {
    return new Promise(r => setTimeout(() => r([...mockTriggeredCampaigns]), 500));
  }

  async getDashboard(): Promise<TriggeringDashboard> {
    return new Promise(r => setTimeout(() => r({
      active_triggers: mockTriggers.filter(t => t.status === 'active').length,
      total_triggered: mockTriggers.reduce((s, t) => s + t.times_triggered, 0),
      campaigns_launched: mockTriggeredCampaigns.length + 12,
      total_revenue: 1614000,
      avg_roi: 520,
      auto_vs_manual: { auto: 67, manual: 33 },
      trigger_timeline: [
        { date: '2026-03-05', triggers: 3, campaigns: 2, revenue: 34000 },
        { date: '2026-03-06', triggers: 1, campaigns: 1, revenue: 12000 },
        { date: '2026-03-07', triggers: 4, campaigns: 3, revenue: 56000 },
        { date: '2026-03-08', triggers: 2, campaigns: 2, revenue: 23000 },
        { date: '2026-03-09', triggers: 3, campaigns: 2, revenue: 45000 },
        { date: '2026-03-10', triggers: 5, campaigns: 4, revenue: 78000 },
        { date: '2026-03-11', triggers: 3, campaigns: 2, revenue: 12000 },
      ],
      top_performing: mockTriggeredCampaigns.filter(tc => tc.performance.roi > 100),
    }), 600));
  }

  async approveCampaign(id: string): Promise<void> {
    return new Promise(r => setTimeout(r, 800));
  }

  async cancelCampaign(id: string): Promise<void> {
    return new Promise(r => setTimeout(r, 500));
  }

  async toggleTrigger(id: string): Promise<void> {
    return new Promise(r => setTimeout(r, 500));
  }

  async createTrigger(trigger: Partial<CampaignTrigger>): Promise<CampaignTrigger> {
    return new Promise(r => setTimeout(() => r({ ...trigger, id: `trg-${Date.now()}`, status: 'active', times_triggered: 0, created_at: new Date().toISOString(), performance: { campaigns_launched: 0, total_reach: 0, leads_generated: 0, revenue_impact: 0, avg_roi: 0 } } as CampaignTrigger), 800));
  }
}

export const campaignTriggeringService = new CampaignTriggeringService();
export default campaignTriggeringService;
