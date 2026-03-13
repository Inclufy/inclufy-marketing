// src/services/context-marketing/opportunity-feed.service.ts
// Central AI Opportunity Feed — aggregates leads, trends, events, partnerships, marketing opportunities

export type FeedItemType = 'lead_signal' | 'trend_alert' | 'event_opportunity' | 'partnership_match' | 'campaign_trigger' | 'competitor_move' | 'content_opportunity' | 'budget_optimization';
export type FeedItemUrgency = 'immediate' | 'today' | 'this_week' | 'this_month';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  description: string;
  urgency: FeedItemUrgency;
  confidence: number;
  estimated_value: number;
  source: string;
  timestamp: string;
  is_read: boolean;
  is_actioned: boolean;
  suggested_action: { label: string; action_type: 'launch_campaign' | 'send_email' | 'create_content' | 'book_meeting' | 'adjust_budget' | 'monitor' | 'register_event' };
  related_entities: Array<{ type: string; id: string; name: string }>;
  impact_metrics: { reach?: number; leads?: number; revenue?: number; roi?: number };
  tags: string[];
}

export interface FeedStats {
  total_items: number;
  unread: number;
  immediate_actions: number;
  total_potential_value: number;
  items_actioned_today: number;
  action_rate: number;
  by_type: Array<{ type: FeedItemType; count: number; color: string }>;
  daily_feed: Array<{ date: string; items: number; actioned: number; value: number }>;
}

const mockFeedItems: FeedItem[] = [
  { id: 'fi-001', type: 'lead_signal', title: 'Hot lead: Sophie Van den Berg vraagt enterprise demo', description: 'Lead score gestegen van 86 naar 94. Heeft pricing pagina 5x bezocht en ROI whitepaper gedownload. Hoge koopintentie gedetecteerd.', urgency: 'immediate', confidence: 94, estimated_value: 45000, source: 'Lead Scoring Engine', timestamp: '2026-03-11T09:15:00Z', is_read: false, is_actioned: false, suggested_action: { label: 'Plan executive demo', action_type: 'book_meeting' }, related_entities: [{ type: 'lead', id: 'lead-001', name: 'Sophie Van den Berg' }, { type: 'company', id: 'comp-001', name: 'TechCorp Belgium' }], impact_metrics: { revenue: 45000, leads: 1 }, tags: ['hot-lead', 'enterprise'] },
  { id: 'fi-002', type: 'trend_alert', title: 'AI Governance trending +240% — campagne kans', description: 'Google Trends toont explosieve groei. Geen concurrenten hebben Nederlandstalige content. First-mover advantage beschikbaar.', urgency: 'today', confidence: 94, estimated_value: 85000, source: 'Opportunity Intelligence', timestamp: '2026-03-11T08:00:00Z', is_read: false, is_actioned: false, suggested_action: { label: 'Start thought leadership campagne', action_type: 'launch_campaign' }, related_entities: [{ type: 'opportunity', id: 'opp-001', name: 'AI Governance Trend' }], impact_metrics: { reach: 450000, leads: 120, revenue: 85000 }, tags: ['trend', 'AI', 'content'] },
  { id: 'fi-003', type: 'campaign_trigger', title: 'Automatische campagne trigger: #MarketingAutomation viral', description: 'Social listening detecteert 3.2x engagement spike op LinkedIn Benelux. AI heeft 3 post varianten gegenereerd en optimale publicatietijden berekend.', urgency: 'immediate', confidence: 88, estimated_value: 42000, source: 'Social Agent + Publication Engine', timestamp: '2026-03-11T06:30:00Z', is_read: true, is_actioned: false, suggested_action: { label: 'Publiceer 3 LinkedIn posts', action_type: 'create_content' }, related_entities: [{ type: 'opportunity', id: 'opp-002', name: '#MarketingAutomation trending' }], impact_metrics: { reach: 280000, leads: 45 }, tags: ['viral', 'LinkedIn', 'auto-trigger'] },
  { id: 'fi-004', type: 'event_opportunity', title: 'MarTech Conference London — Perfect doelgroep match (96%)', description: 'AI berekent 520% verwachte ROI. Early bird tickets nu beschikbaar. 4.200 attendees waarvan 68% marketing decision makers.', urgency: 'this_week', confidence: 82, estimated_value: 95000, source: 'Event Intelligence', timestamp: '2026-03-11T07:00:00Z', is_read: false, is_actioned: false, suggested_action: { label: 'Registreer als sponsor', action_type: 'register_event' }, related_entities: [{ type: 'event', id: 'evt-005', name: 'MarTech Conference London' }], impact_metrics: { reach: 70000, leads: 150, revenue: 95000, roi: 520 }, tags: ['event', 'London', 'martech'] },
  { id: 'fi-005', type: 'competitor_move', title: 'ActiveCampaign mist AI attribution — switch campagne kans', description: 'G2 reviews tonen ontevredenheid over ontbrekende attribution features. 23 negatieve reviews deze maand. Target deze doelgroep met vergelijkingscontent.', urgency: 'today', confidence: 91, estimated_value: 67000, source: 'Competitive Intelligence', timestamp: '2026-03-11T05:00:00Z', is_read: true, is_actioned: false, suggested_action: { label: 'Launch switch campagne', action_type: 'launch_campaign' }, related_entities: [{ type: 'competitor', id: 'comp-ac', name: 'ActiveCampaign' }], impact_metrics: { reach: 120000, leads: 35, revenue: 67000 }, tags: ['competitor', 'attribution', 'switch'] },
  { id: 'fi-006', type: 'partnership_match', title: 'HubSpot Benelux Partner Summit — partnership kans', description: 'Jaarlijkse partner summit op 15 april. 200+ agencies aanwezig. Kans om technologie partnership te presenteren.', urgency: 'this_week', confidence: 82, estimated_value: 120000, source: 'Partnership Intelligence', timestamp: '2026-03-10T14:00:00Z', is_read: false, is_actioned: false, suggested_action: { label: 'Contact partner team', action_type: 'send_email' }, related_entities: [{ type: 'partner', id: 'partner-hs', name: 'HubSpot' }], impact_metrics: { leads: 200, revenue: 120000 }, tags: ['partnership', 'HubSpot', 'agencies'] },
  { id: 'fi-007', type: 'budget_optimization', title: 'Budget herverdeleing: Facebook → Google Shopping (+EUR 2.500)', description: 'Ads Agent detecteert dalende ROAS op Facebook campagne #FB-2847. Google Shopping toont 3.2x betere performance. Herverdeleing bespaart EUR 4.200/maand.', urgency: 'today', confidence: 89, estimated_value: 4200, source: 'Ads Agent', timestamp: '2026-03-11T09:15:00Z', is_read: false, is_actioned: false, suggested_action: { label: 'Approve budget shift', action_type: 'adjust_budget' }, related_entities: [{ type: 'campaign', id: 'fb-2847', name: 'Facebook Campaign #2847' }], impact_metrics: { revenue: 4200, roi: 180 }, tags: ['budget', 'optimization', 'ads'] },
  { id: 'fi-008', type: 'content_opportunity', title: '23 SEO keywords zonder Nederlandstalige content in top 10', description: 'Gap analyse toont 23 high-value keywords waar geen kwalitatieve NL content bestaat. Geschatte organisch verkeer: 180.000/maand.', urgency: 'this_week', confidence: 95, estimated_value: 28000, source: 'SEO Gap Analysis', timestamp: '2026-03-10T09:00:00Z', is_read: true, is_actioned: true, suggested_action: { label: 'Start content productie', action_type: 'create_content' }, related_entities: [{ type: 'opportunity', id: 'opp-006', name: 'NL Content Gap' }], impact_metrics: { reach: 180000, leads: 80, revenue: 28000 }, tags: ['SEO', 'content', 'Nederlands'] },
  { id: 'fi-009', type: 'lead_signal', title: 'Multi-stakeholder activiteit: GrowthLab Netherlands', description: '4 medewerkers van GrowthLab hebben deze week de website bezocht. Historische data: multi-stakeholder visits correleren met 2.8x hogere deal size.', urgency: 'today', confidence: 89, estimated_value: 62000, source: 'Lead Intelligence', timestamp: '2026-03-11T09:00:00Z', is_read: false, is_actioned: false, suggested_action: { label: 'Stuur team demo uitnodiging', action_type: 'send_email' }, related_entities: [{ type: 'lead', id: 'lead-002', name: 'Thomas De Smedt' }, { type: 'company', id: 'comp-gl', name: 'GrowthLab Netherlands' }], impact_metrics: { revenue: 62000, leads: 4 }, tags: ['multi-stakeholder', 'enterprise'] },
  { id: 'fi-010', type: 'campaign_trigger', title: 'Webinar follow-up: 45 attendees wachten op nurture sequence', description: 'AI Attribution webinar had 45 registraties. Post-webinar analyse toont 3.2x snellere conversie. Nurture sequence niet geactiveerd.', urgency: 'immediate', confidence: 92, estimated_value: 34000, source: 'Email Agent + Analytics', timestamp: '2026-03-11T08:30:00Z', is_read: false, is_actioned: false, suggested_action: { label: 'Activeer nurture sequence', action_type: 'send_email' }, related_entities: [{ type: 'webinar', id: 'web-attr', name: 'AI Attribution Webinar' }], impact_metrics: { leads: 45, revenue: 34000 }, tags: ['webinar', 'follow-up', 'nurture'] },
];

class OpportunityFeedService {
  async getFeedItems(limit: number = 20): Promise<FeedItem[]> {
    return new Promise(r => setTimeout(() => r(mockFeedItems.slice(0, limit).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())), 600));
  }

  async getStats(): Promise<FeedStats> {
    return new Promise(r => setTimeout(() => r({
      total_items: mockFeedItems.length + 28,
      unread: mockFeedItems.filter(i => !i.is_read).length + 12,
      immediate_actions: mockFeedItems.filter(i => i.urgency === 'immediate').length,
      total_potential_value: mockFeedItems.reduce((s, i) => s + i.estimated_value, 0),
      items_actioned_today: 8,
      action_rate: 72.4,
      by_type: [
        { type: 'lead_signal', count: 12, color: '#8b5cf6' },
        { type: 'trend_alert', count: 8, color: '#ec4899' },
        { type: 'campaign_trigger', count: 6, color: '#3b82f6' },
        { type: 'event_opportunity', count: 4, color: '#10b981' },
        { type: 'competitor_move', count: 3, color: '#f59e0b' },
        { type: 'partnership_match', count: 2, color: '#14b8a6' },
        { type: 'content_opportunity', count: 2, color: '#06b6d4' },
        { type: 'budget_optimization', count: 1, color: '#ef4444' },
      ],
      daily_feed: [
        { date: '2026-03-05', items: 6, actioned: 4, value: 45000 },
        { date: '2026-03-06', items: 8, actioned: 6, value: 67000 },
        { date: '2026-03-07', items: 5, actioned: 3, value: 34000 },
        { date: '2026-03-08', items: 9, actioned: 7, value: 89000 },
        { date: '2026-03-09', items: 7, actioned: 5, value: 56000 },
        { date: '2026-03-10', items: 10, actioned: 6, value: 120000 },
        { date: '2026-03-11', items: 6, actioned: 2, value: 78000 },
      ],
    }), 500));
  }

  async markAsRead(id: string): Promise<void> {
    return new Promise(r => setTimeout(r, 200));
  }

  async actionItem(id: string): Promise<void> {
    return new Promise(r => setTimeout(r, 800));
  }

  async dismissItem(id: string): Promise<void> {
    return new Promise(r => setTimeout(r, 300));
  }
}

export const opportunityFeedService = new OpportunityFeedService();
export default opportunityFeedService;
