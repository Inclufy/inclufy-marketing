// src/services/context-marketing/opportunity-intelligence.service.ts
// Opportunity Intelligence — AI discovers trends, events, partnerships, viral topics, new markets

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

const mockOpportunities: Opportunity[] = [
  {
    id: 'opp-001', type: 'trend', title: 'AI Governance stijgt 240% in zoekopdrachten', description: 'Google Trends en LinkedIn data tonen een explosieve groei in "AI governance" en "responsible AI" content. B2B beslissers zoeken actief naar compliance oplossingen.', source: 'Google Trends + LinkedIn Analysis', priority: 'critical', status: 'new', confidence: 94, estimated_impact: 85000, estimated_reach: 450000, trend_velocity: 240, relevance_score: 96, discovered_at: '2026-03-11T08:00:00Z', expires_at: '2026-03-25T00:00:00Z', tags: ['AI', 'governance', 'compliance', 'B2B'], suggested_actions: ['Start thought leadership blog serie', 'Launch LinkedIn ad campaign', 'Create whitepaper: AI Governance Guide 2026', 'Host webinar met industrie experts'], related_keywords: ['AI compliance', 'responsible AI', 'AI ethics', 'AI regulation EU'], data_sources: ['Google Trends', 'LinkedIn Pulse', 'Twitter/X', 'Reddit r/MachineLearning'], campaign_suggestion: { title: 'AI Governance Thought Leadership', channels: ['LinkedIn', 'Blog', 'Email', 'Google Ads'], budget: 15000, duration_days: 30 },
  },
  {
    id: 'opp-002', type: 'viral_topic', title: '#MarketingAutomation trending op LinkedIn Benelux', description: 'Het hashtag #MarketingAutomation heeft 3.2x meer engagement deze week in de Benelux. Meerdere thought leaders delen content over marketing AI tools.', source: 'LinkedIn Social Listening', priority: 'high', status: 'new', confidence: 88, estimated_impact: 42000, estimated_reach: 280000, trend_velocity: 320, relevance_score: 92, discovered_at: '2026-03-11T06:30:00Z', expires_at: '2026-03-18T00:00:00Z', tags: ['marketing automation', 'LinkedIn', 'Benelux', 'trending'], suggested_actions: ['Publiceer 3 LinkedIn posts vandaag', 'Deel customer success stories', 'Reageer op trending discussies', 'Launch retargeting campagne'], related_keywords: ['marketing automation', 'AI marketing', 'martech'], data_sources: ['LinkedIn Analytics', 'BuzzSumo'],
  },
  {
    id: 'opp-003', type: 'partnership', title: 'HubSpot Benelux Partner Event — strategische partnership kans', description: 'HubSpot organiseert hun jaarlijkse Benelux Partner Summit op 15 april. Kans om als technology partner te presenteren en 200+ agencies te bereiken.', source: 'Event Monitoring + Industry Intel', priority: 'high', status: 'reviewing', confidence: 82, estimated_impact: 120000, estimated_reach: 15000, trend_velocity: 0, relevance_score: 88, discovered_at: '2026-03-10T14:00:00Z', tags: ['partnership', 'HubSpot', 'events', 'agencies'], suggested_actions: ['Contact HubSpot partner team', 'Bereid demo voor agencie doelgroep', 'Maak co-marketing materiaal', 'Plan follow-up campagne voor leads'], related_keywords: ['HubSpot partner', 'martech integration', 'agency tools'], data_sources: ['HubSpot Partner Portal', 'Event Databases'],
  },
  {
    id: 'opp-004', type: 'new_market', title: 'Scandinavische markt: 45% groei in AI marketing spend', description: 'Nieuwe data toont dat Scandinavische bedrijven hun AI marketing budget met 45% verhogen in 2026. Weinig lokale concurrenten met vergelijkbaar platform.', source: 'Market Research + Competitor Analysis', priority: 'high', status: 'new', confidence: 79, estimated_impact: 340000, estimated_reach: 89000, trend_velocity: 45, relevance_score: 85, discovered_at: '2026-03-10T10:00:00Z', tags: ['scandinavie', 'expansion', 'market entry', 'nordic'], suggested_actions: ['Marktonderzoek Scandinavie verdiepen', 'Vertaal platform naar Zweeds/Deens', 'Identificeer lokale partners', 'Start LinkedIn campagne Nordic targeting'], related_keywords: ['Nordic marketing', 'AI marketing Scandinavia', 'martech Sweden'], data_sources: ['Statista', 'CB Insights', 'Crunchbase'],
  },
  {
    id: 'opp-005', type: 'competitor_gap', title: 'Concurrent ActiveCampaign mist AI attribution', description: 'ActiveCampaign\'s recente productupdate bevat geen multi-touch attribution of AI lead scoring. Hun gebruikers klagen op G2 en Reddit over deze gap.', source: 'Competitive Intelligence', priority: 'medium', status: 'new', confidence: 91, estimated_impact: 67000, estimated_reach: 120000, trend_velocity: 0, relevance_score: 90, discovered_at: '2026-03-09T16:00:00Z', tags: ['competitor', 'ActiveCampaign', 'attribution', 'lead scoring'], suggested_actions: ['Maak vergelijkingspagina vs ActiveCampaign', 'Target ActiveCampaign reviews op G2', 'Launch "Switch to Inclufy" campagne', 'Bied migratie support aan'], related_keywords: ['ActiveCampaign alternative', 'marketing automation comparison'], data_sources: ['G2 Reviews', 'Reddit', 'Product Hunt'],
  },
  {
    id: 'opp-006', type: 'content_gap', title: 'Geen Nederlandstalige AI marketing content in Google top 10', description: 'Voor 23 high-value keywords rond AI marketing bestaat er geen kwalitatieve Nederlandstalige content in de top 10 resultaten. Enorme SEO kans.', source: 'SEO Gap Analysis', priority: 'high', status: 'approved', confidence: 95, estimated_impact: 28000, estimated_reach: 180000, trend_velocity: 15, relevance_score: 94, discovered_at: '2026-03-08T09:00:00Z', tags: ['SEO', 'content gap', 'Nederlands', 'keywords'], suggested_actions: ['Schrijf 23 SEO-geoptimaliseerde artikelen', 'Maak pillar page "AI Marketing Gids"', 'Bouw interne linkstructuur', 'Start link building campagne'], related_keywords: ['AI marketing uitleg', 'marketing automatisering', 'lead scoring betekenis'], data_sources: ['Ahrefs', 'SEMrush', 'Google Search Console'],
  },
  {
    id: 'opp-007', type: 'event', title: 'Web Summit Lisbon 2026 — Early bird tickets beschikbaar', description: 'Web Summit opent early bird registratie. 70.000+ attendees, sterke marketing tech track. Ideaal voor brand awareness en enterprise lead generation.', source: 'Event Monitoring', priority: 'medium', status: 'new', confidence: 75, estimated_impact: 95000, estimated_reach: 70000, trend_velocity: 0, relevance_score: 78, discovered_at: '2026-03-11T07:00:00Z', tags: ['event', 'Web Summit', 'conference', 'lead gen'], suggested_actions: ['Koop early bird startup ticket', 'Bereid elevator pitch voor', 'Plan side events/dinners', 'Pre-event LinkedIn campagne'], related_keywords: ['Web Summit 2026', 'martech conference', 'SaaS events'], data_sources: ['Web Summit Website', 'Event Databases'],
  },
  {
    id: 'opp-008', type: 'trend', title: 'Zero-party data strategie wint terrein na cookie deprecation', description: 'Na de definitieve afschaffing van third-party cookies zoeken marketeers naar zero-party data oplossingen. Zoekopdrachten stegen 180% in Q1 2026.', source: 'Google Trends + Industry Reports', priority: 'medium', status: 'new', confidence: 86, estimated_impact: 52000, estimated_reach: 340000, trend_velocity: 180, relevance_score: 82, discovered_at: '2026-03-10T12:00:00Z', tags: ['zero-party data', 'privacy', 'cookies', 'data strategy'], suggested_actions: ['Publiceer guide: Zero-Party Data Strategie', 'Highlight Inclufy privacy features', 'Partner met privacy compliance tools'], related_keywords: ['zero-party data', 'first-party data', 'cookie deprecation'], data_sources: ['Google Trends', 'eMarketer', 'IAB'],
  },
];

const mockTrends: TrendData[] = [
  { keyword: 'AI governance', volume: 145000, growth_rate: 240, peak_date: '2026-03-15', related_topics: ['AI ethics', 'responsible AI', 'EU AI Act'], sentiment: 'positive', regions: ['Belgium', 'Netherlands', 'Germany'], trend_history: [{ date: '2026-01', volume: 42000 }, { date: '2026-02', volume: 89000 }, { date: '2026-03', volume: 145000 }] },
  { keyword: 'marketing automation', volume: 230000, growth_rate: 35, peak_date: '2026-03-20', related_topics: ['AI marketing', 'lead nurturing', 'email automation'], sentiment: 'positive', regions: ['Belgium', 'Netherlands', 'France'], trend_history: [{ date: '2026-01', volume: 178000 }, { date: '2026-02', volume: 205000 }, { date: '2026-03', volume: 230000 }] },
  { keyword: 'zero-party data', volume: 67000, growth_rate: 180, peak_date: '2026-04-01', related_topics: ['privacy', 'GDPR', 'consent management'], sentiment: 'neutral', regions: ['Global'], trend_history: [{ date: '2026-01', volume: 24000 }, { date: '2026-02', volume: 45000 }, { date: '2026-03', volume: 67000 }] },
  { keyword: 'predictive analytics marketing', volume: 89000, growth_rate: 62, peak_date: '2026-03-25', related_topics: ['machine learning', 'forecasting', 'customer analytics'], sentiment: 'positive', regions: ['Belgium', 'UK', 'USA'], trend_history: [{ date: '2026-01', volume: 55000 }, { date: '2026-02', volume: 72000 }, { date: '2026-03', volume: 89000 }] },
  { keyword: 'AI content creation', volume: 312000, growth_rate: 95, peak_date: '2026-03-10', related_topics: ['generative AI', 'content marketing', 'AI copywriting'], sentiment: 'positive', regions: ['Global'], trend_history: [{ date: '2026-01', volume: 160000 }, { date: '2026-02', volume: 245000 }, { date: '2026-03', volume: 312000 }] },
];

class OpportunityIntelligenceService {
  async getOpportunities(status?: OpportunityStatus): Promise<Opportunity[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (status) resolve(mockOpportunities.filter(o => o.status === status));
        else resolve([...mockOpportunities]);
      }, 600);
    });
  }

  async getDashboard(): Promise<OpportunityDashboardData> {
    return new Promise((resolve) => {
      setTimeout(() => resolve({
        total_opportunities: mockOpportunities.length + 34,
        new_today: 4,
        high_priority: mockOpportunities.filter(o => o.priority === 'critical' || o.priority === 'high').length + 8,
        total_estimated_value: mockOpportunities.reduce((s, o) => s + o.estimated_impact, 0),
        action_rate: 67.5,
        avg_confidence: 86.3,
        opportunities_by_type: [
          { type: 'trend', count: 14, color: '#8b5cf6' },
          { type: 'viral_topic', count: 8, color: '#ec4899' },
          { type: 'partnership', count: 6, color: '#3b82f6' },
          { type: 'new_market', count: 4, color: '#10b981' },
          { type: 'competitor_gap', count: 5, color: '#f59e0b' },
          { type: 'content_gap', count: 3, color: '#14b8a6' },
          { type: 'event', count: 2, color: '#ef4444' },
        ],
        trend_velocity: [
          { date: '2026-03-05', opportunities: 5, actioned: 2 },
          { date: '2026-03-06', opportunities: 7, actioned: 4 },
          { date: '2026-03-07', opportunities: 4, actioned: 3 },
          { date: '2026-03-08', opportunities: 9, actioned: 5 },
          { date: '2026-03-09', opportunities: 6, actioned: 4 },
          { date: '2026-03-10', opportunities: 8, actioned: 3 },
          { date: '2026-03-11', opportunities: 4, actioned: 1 },
        ],
        top_trends: mockTrends,
      }), 700);
    });
  }

  async actionOpportunity(id: string): Promise<void> {
    return new Promise(r => setTimeout(r, 800));
  }

  async dismissOpportunity(id: string): Promise<void> {
    return new Promise(r => setTimeout(r, 400));
  }

  async launchCampaignFromOpportunity(id: string): Promise<{ campaign_id: string }> {
    return new Promise(r => setTimeout(() => r({ campaign_id: `camp-auto-${Date.now()}` }), 1500));
  }

  async launchCampaign(id: string): Promise<{ campaign_id: string }> {
    return this.launchCampaignFromOpportunity(id);
  }

  async refreshTrends(): Promise<TrendData[]> {
    return new Promise(r => setTimeout(() => r([...mockTrends]), 2000));
  }
}

export const opportunityIntelligenceService = new OpportunityIntelligenceService();
export default opportunityIntelligenceService;
