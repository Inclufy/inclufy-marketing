// src/services/context-marketing/lead-intelligence.service.ts
// Lead Intelligence Engine — AI analyzes intent signals, website behavior, social interactions, predicts best follow-up

export type IntentLevel = 'very_high' | 'high' | 'medium' | 'low' | 'cold';
export type SignalType = 'page_view' | 'content_download' | 'email_engagement' | 'social_interaction' | 'event_attendance' | 'form_submission' | 'pricing_view' | 'api_docs' | 'competitor_comparison' | 'demo_request';

export interface IntentSignal {
  id: string;
  lead_id: string;
  lead_name: string;
  company: string;
  type: SignalType;
  description: string;
  strength: number; // 0-100
  timestamp: string;
  page_url?: string;
  duration_seconds?: number;
  metadata?: Record<string, any>;
}

export interface LeadIntelligenceProfile {
  id: string;
  name: string;
  email: string;
  company: string;
  title: string;
  intent_level: IntentLevel;
  intent_score: number; // 0-100
  buying_stage: 'awareness' | 'consideration' | 'decision' | 'purchase';
  signals: IntentSignal[];
  website_behavior: { total_visits: number; pages_viewed: number; avg_session_duration: number; last_visit: string; top_pages: string[]; bounce_rate: number };
  social_activity: { linkedin_engagements: number; twitter_mentions: number; content_shares: number; community_posts: number };
  engagement_timeline: Array<{ date: string; score: number; event: string }>;
  predicted_actions: { buy_probability: number; churn_risk: number; upsell_potential: number; best_channel: string; best_time: string; next_best_action: string };
  company_intel: { size: string; industry: string; revenue: string; tech_stack: string[]; recent_news: string[]; growth_signals: string[] };
}

export interface LeadIntelligenceDashboard {
  total_tracked: number;
  high_intent: number;
  signals_today: number;
  avg_intent_score: number;
  predicted_pipeline_value: number;
  intent_distribution: Array<{ level: IntentLevel; count: number; color: string }>;
  signal_heatmap: Array<{ hour: number; day: string; count: number }>;
  top_intent_leads: LeadIntelligenceProfile[];
  recent_signals: IntentSignal[];
  channel_effectiveness: Array<{ channel: string; leads_influenced: number; avg_intent_lift: number; cost_per_intent_point: number }>;
}

// Type aliases for hook compatibility
export type Lead = LeadIntelligenceProfile;
export type LeadSignal = IntentSignal;
export type BestAction = { action: string; channel: string; timing: string; confidence: number };

const mockProfiles: LeadIntelligenceProfile[] = [
  {
    id: 'li-001', name: 'Sophie Van den Berg', email: 'sophie@techcorp.be', company: 'TechCorp Belgium', title: 'Marketing Director', intent_level: 'very_high', intent_score: 96, buying_stage: 'decision',
    signals: [
      { id: 's-001', lead_id: 'li-001', lead_name: 'Sophie Van den Berg', company: 'TechCorp Belgium', type: 'pricing_view', description: 'Pricing pagina bezocht (5e keer deze week)', strength: 95, timestamp: '2026-03-11T09:00:00Z', page_url: '/pricing', duration_seconds: 180 },
      { id: 's-002', lead_id: 'li-001', lead_name: 'Sophie Van den Berg', company: 'TechCorp Belgium', type: 'api_docs', description: 'API documentatie bekeken — integration planning', strength: 88, timestamp: '2026-03-10T16:00:00Z', page_url: '/docs/api', duration_seconds: 420 },
      { id: 's-003', lead_id: 'li-001', lead_name: 'Sophie Van den Berg', company: 'TechCorp Belgium', type: 'content_download', description: 'ROI Calculator whitepaper gedownload', strength: 85, timestamp: '2026-03-09T14:00:00Z' },
      { id: 's-004', lead_id: 'li-001', lead_name: 'Sophie Van den Berg', company: 'TechCorp Belgium', type: 'demo_request', description: 'Enterprise demo aangevraagd', strength: 98, timestamp: '2026-03-09T10:00:00Z' },
    ],
    website_behavior: { total_visits: 47, pages_viewed: 156, avg_session_duration: 340, last_visit: '2026-03-11T09:00:00Z', top_pages: ['/pricing', '/features/attribution', '/docs/api', '/case-studies', '/enterprise'], bounce_rate: 8 },
    social_activity: { linkedin_engagements: 12, twitter_mentions: 0, content_shares: 3, community_posts: 1 },
    engagement_timeline: [{ date: '2026-02-24', score: 45, event: 'First blog visit' }, { date: '2026-03-01', score: 58, event: 'Newsletter signup' }, { date: '2026-03-05', score: 72, event: 'Case study download' }, { date: '2026-03-09', score: 88, event: 'Demo request' }, { date: '2026-03-11', score: 96, event: 'Pricing page (5th visit)' }],
    predicted_actions: { buy_probability: 0.87, churn_risk: 0.03, upsell_potential: 0.72, best_channel: 'Direct call', best_time: 'Dinsdag 10:00-11:00', next_best_action: 'Schedule executive demo with CTO involvement' },
    company_intel: { size: '200-500', industry: 'Technology', revenue: '20M-50M', tech_stack: ['HubSpot', 'Salesforce', 'Google Analytics', 'React'], recent_news: ['Series B funding: EUR 12M', 'Expanded to DACH market'], growth_signals: ['Hiring 3 marketing roles', 'New CMO appointed', 'Budget increase signal'] },
  },
  {
    id: 'li-002', name: 'Claire Fontaine', email: 'claire@agencebleu.fr', company: 'Agence Bleu', title: 'Account Director', intent_level: 'very_high', intent_score: 93, buying_stage: 'purchase',
    signals: [
      { id: 's-005', lead_id: 'li-002', lead_name: 'Claire Fontaine', company: 'Agence Bleu', type: 'form_submission', description: 'Contract terms besproken — legal review gestart', strength: 98, timestamp: '2026-03-10T11:00:00Z' },
      { id: 's-006', lead_id: 'li-002', lead_name: 'Claire Fontaine', company: 'Agence Bleu', type: 'pricing_view', description: 'Enterprise pricing pagina + custom plan calculator', strength: 90, timestamp: '2026-03-08T14:00:00Z' },
    ],
    website_behavior: { total_visits: 52, pages_viewed: 189, avg_session_duration: 280, last_visit: '2026-03-10T11:00:00Z', top_pages: ['/pricing/enterprise', '/security', '/compliance', '/integrations'], bounce_rate: 5 },
    social_activity: { linkedin_engagements: 8, twitter_mentions: 2, content_shares: 5, community_posts: 0 },
    engagement_timeline: [{ date: '2026-02-10', score: 60, event: 'Partner referral visit' }, { date: '2026-02-20', score: 75, event: 'Security whitepaper' }, { date: '2026-03-01', score: 85, event: 'Enterprise demo' }, { date: '2026-03-08', score: 91, event: 'Custom pricing request' }, { date: '2026-03-10', score: 93, event: 'Legal review initiated' }],
    predicted_actions: { buy_probability: 0.91, churn_risk: 0.02, upsell_potential: 0.85, best_channel: 'Email', best_time: 'Woensdag 09:00', next_best_action: 'Send final contract with onboarding timeline' },
    company_intel: { size: '50-200', industry: 'Marketing Agency', revenue: '10M-20M', tech_stack: ['Adobe Creative Suite', 'Salesforce', 'Hootsuite'], recent_news: ['Won Cannes Lions award', 'Opened Brussels office'], growth_signals: ['Portfolio expansion', 'Hiring account managers', 'New enterprise clients'] },
  },
  {
    id: 'li-003', name: 'Thomas De Smedt', email: 'thomas@growthlab.nl', company: 'GrowthLab Netherlands', title: 'CEO', intent_level: 'high', intent_score: 82, buying_stage: 'consideration',
    signals: [
      { id: 's-007', lead_id: 'li-003', lead_name: 'Thomas De Smedt', company: 'GrowthLab Netherlands', type: 'competitor_comparison', description: 'Vergelijkingspagina Inclufy vs HubSpot bekeken', strength: 82, timestamp: '2026-03-10T09:00:00Z', page_url: '/compare/hubspot', duration_seconds: 300 },
      { id: 's-008', lead_id: 'li-003', lead_name: 'Thomas De Smedt', company: 'GrowthLab Netherlands', type: 'page_view', description: '4 teamleden van dezelfde company bezochten de website', strength: 78, timestamp: '2026-03-09T14:00:00Z' },
    ],
    website_behavior: { total_visits: 34, pages_viewed: 98, avg_session_duration: 210, last_visit: '2026-03-10T09:15:00Z', top_pages: ['/compare/hubspot', '/features', '/pricing', '/api'], bounce_rate: 15 },
    social_activity: { linkedin_engagements: 5, twitter_mentions: 0, content_shares: 1, community_posts: 0 },
    engagement_timeline: [{ date: '2026-02-17', score: 30, event: 'LinkedIn ad click' }, { date: '2026-02-24', score: 48, event: 'Blog visit' }, { date: '2026-03-03', score: 65, event: 'Features exploration' }, { date: '2026-03-09', score: 78, event: 'Multi-stakeholder visits' }, { date: '2026-03-10', score: 82, event: 'Competitor comparison' }],
    predicted_actions: { buy_probability: 0.64, churn_risk: 0.15, upsell_potential: 0.60, best_channel: 'LinkedIn', best_time: 'Donderdag 14:00', next_best_action: 'Send team demo invitation targeting multiple stakeholders' },
    company_intel: { size: '50-200', industry: 'Consulting', revenue: '5M-20M', tech_stack: ['HubSpot', 'Slack', 'Notion'], recent_news: ['Acquired data analytics firm'], growth_signals: ['Hiring data team', 'New enterprise practice'] },
  },
];

const mockRecentSignals: IntentSignal[] = [
  { id: 'rs-001', lead_id: 'li-001', lead_name: 'Sophie Van den Berg', company: 'TechCorp Belgium', type: 'pricing_view', description: 'Pricing pagina bezocht (5e keer)', strength: 95, timestamp: '2026-03-11T09:00:00Z' },
  { id: 'rs-002', lead_id: 'li-002', lead_name: 'Claire Fontaine', company: 'Agence Bleu', type: 'form_submission', description: 'Legal review contract gestart', strength: 98, timestamp: '2026-03-10T11:00:00Z' },
  { id: 'rs-003', lead_id: 'li-003', lead_name: 'Thomas De Smedt', company: 'GrowthLab Netherlands', type: 'competitor_comparison', description: 'Inclufy vs HubSpot vergelijking bekeken', strength: 82, timestamp: '2026-03-10T09:00:00Z' },
  { id: 'rs-004', lead_id: 'li-004', lead_name: 'Jan Willems', company: 'Mediahuis', type: 'content_download', description: 'Attribution whitepaper gedownload', strength: 72, timestamp: '2026-03-09T15:00:00Z' },
  { id: 'rs-005', lead_id: 'li-005', lead_name: 'Eva Johansson', company: 'ScandiBrand AB', type: 'social_interaction', description: 'LinkedIn post geliked en gedeeld', strength: 55, timestamp: '2026-03-09T12:00:00Z' },
  { id: 'rs-006', lead_id: 'li-006', lead_name: 'Ahmed El Fassi', company: 'DigiWave Morocco', type: 'page_view', description: 'Product tour pagina (12 min sessie)', strength: 68, timestamp: '2026-03-10T08:00:00Z' },
  { id: 'rs-007', lead_id: 'li-007', lead_name: 'Marie-Claire Dubois', company: 'Luxe Brands Paris', type: 'event_attendance', description: 'Webinar AI Attribution bijgewoond', strength: 75, timestamp: '2026-03-08T14:00:00Z' },
  { id: 'rs-008', lead_id: 'li-008', lead_name: 'Pieter Jansen', company: 'RetailPlus BV', type: 'email_engagement', description: 'Nurture email geopend + 2 links geklikt', strength: 60, timestamp: '2026-03-09T10:00:00Z' },
];

class LeadIntelligenceService {
  async getDashboard(): Promise<LeadIntelligenceDashboard> {
    return new Promise(r => setTimeout(() => r({
      total_tracked: 8456,
      high_intent: 234,
      signals_today: 47,
      avg_intent_score: 58.4,
      predicted_pipeline_value: 2340000,
      intent_distribution: [
        { level: 'very_high', count: 89, color: '#8b5cf6' },
        { level: 'high', count: 234, color: '#3b82f6' },
        { level: 'medium', count: 1567, color: '#10b981' },
        { level: 'low', count: 3890, color: '#f59e0b' },
        { level: 'cold', count: 2676, color: '#6b7280' },
      ],
      signal_heatmap: [
        { hour: 9, day: 'Mon', count: 45 }, { hour: 10, day: 'Mon', count: 67 }, { hour: 11, day: 'Mon', count: 56 },
        { hour: 9, day: 'Tue', count: 52 }, { hour: 10, day: 'Tue', count: 78 }, { hour: 11, day: 'Tue', count: 89 },
        { hour: 9, day: 'Wed', count: 48 }, { hour: 10, day: 'Wed', count: 72 }, { hour: 14, day: 'Wed', count: 65 },
        { hour: 9, day: 'Thu', count: 38 }, { hour: 14, day: 'Thu', count: 82 }, { hour: 15, day: 'Thu', count: 71 },
        { hour: 9, day: 'Fri', count: 34 }, { hour: 10, day: 'Fri', count: 45 }, { hour: 11, day: 'Fri', count: 28 },
      ],
      top_intent_leads: mockProfiles,
      recent_signals: mockRecentSignals,
      channel_effectiveness: [
        { channel: 'Organic Search', leads_influenced: 890, avg_intent_lift: 15.2, cost_per_intent_point: 0.45 },
        { channel: 'LinkedIn Ads', leads_influenced: 567, avg_intent_lift: 22.8, cost_per_intent_point: 2.80 },
        { channel: 'Email Nurture', leads_influenced: 1234, avg_intent_lift: 18.5, cost_per_intent_point: 0.12 },
        { channel: 'Events', leads_influenced: 234, avg_intent_lift: 35.4, cost_per_intent_point: 8.50 },
        { channel: 'Content Marketing', leads_influenced: 789, avg_intent_lift: 12.3, cost_per_intent_point: 0.85 },
        { channel: 'Webinars', leads_influenced: 345, avg_intent_lift: 28.9, cost_per_intent_point: 3.20 },
      ],
    }), 700));
  }

  async getLeadProfile(id: string): Promise<LeadIntelligenceProfile | null> {
    return new Promise(r => setTimeout(() => r(mockProfiles.find(p => p.id === id) || null), 400));
  }

  async getTopIntentLeads(limit: number = 10): Promise<LeadIntelligenceProfile[]> {
    return new Promise(r => setTimeout(() => r(mockProfiles.sort((a, b) => b.intent_score - a.intent_score).slice(0, limit)), 500));
  }

  async getRecentSignals(limit: number = 20): Promise<IntentSignal[]> {
    return new Promise(r => setTimeout(() => r(mockRecentSignals.slice(0, limit)), 400));
  }

  async getTopLeads(limit: number = 10): Promise<LeadIntelligenceProfile[]> {
    return this.getTopIntentLeads(limit);
  }

  async predictBestAction(leadId: string): Promise<{ action: string; channel: string; timing: string; confidence: number }> {
    return new Promise(r => setTimeout(() => r({ action: 'Schedule personalized demo', channel: 'Direct call', timing: 'Tomorrow 10:00 CET', confidence: 89 }), 600));
  }
}

export const leadIntelligenceService = new LeadIntelligenceService();
export default leadIntelligenceService;
