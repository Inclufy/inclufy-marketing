// src/services/context-marketing/event-intelligence.service.ts
// Event Intelligence Engine — AI discovers conferences, meetups, calculates ROI & networking value

export type EventType = 'conference' | 'meetup' | 'trade_show' | 'webinar' | 'workshop' | 'networking' | 'hackathon';
export type EventStatus = 'discovered' | 'evaluating' | 'registered' | 'attending' | 'completed' | 'skipped';

export interface DiscoveredEvent {
  id: string;
  name: string;
  type: EventType;
  description: string;
  location: string;
  city: string;
  country: string;
  date_start: string;
  date_end: string;
  website: string;
  expected_attendees: number;
  target_audience_match: number; // 0-100
  estimated_roi: number;
  estimated_leads: number;
  networking_value: number; // 0-100
  cost: { ticket: number; travel: number; accommodation: number; booth?: number; total: number };
  speakers: string[];
  topics: string[];
  status: EventStatus;
  priority_score: number; // 0-100, AI-calculated
  ai_recommendation: string;
  competitors_attending: string[];
  tags: string[];
}

export interface EventMetrics {
  events_discovered: number;
  events_registered: number;
  events_completed: number;
  total_leads_captured: number;
  total_roi: number;
  avg_audience_match: number;
  upcoming_events: number;
  events_this_month: number;
}

export interface EventROIAnalysis {
  event_id: string;
  leads_captured: number;
  meetings_booked: number;
  deals_influenced: number;
  revenue_attributed: number;
  cost_total: number;
  roi_percentage: number;
  brand_impressions: number;
  social_mentions: number;
  nps_score: number;
}

// Type aliases for hook compatibility
export type Event = DiscoveredEvent;

const mockEvents: DiscoveredEvent[] = [
  {
    id: 'evt-001', name: 'SaaS Growth Summit Benelux', type: 'conference', description: 'De grootste SaaS conferentie in de Benelux met focus op growth strategies, marketing automation en AI-driven sales.', location: 'Kinepolis Antwerpen', city: 'Antwerpen', country: 'Belgium', date_start: '2026-04-15', date_end: '2026-04-16', website: 'saasgrowthsummit.be', expected_attendees: 1200, target_audience_match: 94, estimated_roi: 450, estimated_leads: 85, networking_value: 92, cost: { ticket: 890, travel: 150, accommodation: 280, booth: 4500, total: 5820 }, speakers: ['Pieter Levels', 'Sarah Mueller', 'Jonas Van der Auwera'], topics: ['SaaS Growth', 'Marketing AI', 'Product-Led Growth', 'B2B Sales'], status: 'registered', priority_score: 96, ai_recommendation: 'Sterk aanbevolen. Hoge doelgroep match en aanwezigheid van key decision makers. Boek een booth voor maximale zichtbaarheid.', competitors_attending: ['Hubspot', 'Mailchimp'], tags: ['premium', 'Benelux', 'SaaS', 'must-attend'],
  },
  {
    id: 'evt-002', name: 'Digital Marketing World Forum', type: 'conference', description: 'Internationaal marketing event met tracks over AI, attribution, content marketing en customer experience.', location: 'RAI Amsterdam', city: 'Amsterdam', country: 'Netherlands', date_start: '2026-05-08', date_end: '2026-05-10', website: 'dmwf.eu', expected_attendees: 3500, target_audience_match: 88, estimated_roi: 380, estimated_leads: 120, networking_value: 85, cost: { ticket: 1200, travel: 200, accommodation: 560, booth: 8000, total: 9960 }, speakers: ['Ann Handley', 'Rand Fishkin', 'Marketing AI Institute'], topics: ['Marketing AI', 'Attribution', 'Content Strategy', 'Customer Experience'], status: 'evaluating', priority_score: 91, ai_recommendation: 'Groot publiek met hoge relevantie. Overweeg een speaking slot aan te vragen over multi-touch attribution.', competitors_attending: ['Marketo', 'Pardot', 'ActiveCampaign'], tags: ['international', 'marketing', 'AI'],
  },
  {
    id: 'evt-003', name: 'Brussels AI & Data Meetup', type: 'meetup', description: 'Maandelijkse meetup voor AI professionals en data scientists in Brussel. Informeel networking format met 2 talks.', location: 'BeCentral, Brussel', city: 'Brussel', country: 'Belgium', date_start: '2026-03-20', date_end: '2026-03-20', website: 'meetup.com/brussels-ai', expected_attendees: 150, target_audience_match: 72, estimated_roi: 250, estimated_leads: 12, networking_value: 78, cost: { ticket: 0, travel: 30, accommodation: 0, total: 30 }, speakers: ['Community speakers'], topics: ['AI', 'Machine Learning', 'Data Science'], status: 'discovered', priority_score: 68, ai_recommendation: 'Laag budget, goede netwerkkans. Ideaal voor een korte productdemo of lightning talk.', competitors_attending: [], tags: ['free', 'networking', 'Brussels', 'AI'],
  },
  {
    id: 'evt-004', name: 'E-commerce Expo Belgium', type: 'trade_show', description: 'De grootste e-commerce beurs in Belgie met focus op digital marketing, fulfillment en customer retention.', location: 'Brussels Expo', city: 'Brussel', country: 'Belgium', date_start: '2026-06-03', date_end: '2026-06-04', website: 'ecommerceexpo.be', expected_attendees: 5000, target_audience_match: 65, estimated_roi: 220, estimated_leads: 95, networking_value: 70, cost: { ticket: 450, travel: 50, accommodation: 0, booth: 6000, total: 6500 }, speakers: ['Various industry leaders'], topics: ['E-commerce', 'Digital Marketing', 'Customer Retention', 'Personalization'], status: 'discovered', priority_score: 72, ai_recommendation: 'Groot publiek maar lagere doelgroep match. Focus op e-commerce marketeers die automation zoeken.', competitors_attending: ['Klaviyo', 'Emarsys'], tags: ['e-commerce', 'Belgium', 'trade show'],
  },
  {
    id: 'evt-005', name: 'MarTech Conference London', type: 'conference', description: 'Premier marketing technology conference met focus op the martech landscape, AI innovation en composable architectures.', location: 'ExCeL London', city: 'London', country: 'UK', date_start: '2026-06-18', date_end: '2026-06-19', website: 'martechconf.com', expected_attendees: 4200, target_audience_match: 96, estimated_roi: 520, estimated_leads: 150, networking_value: 95, cost: { ticket: 1500, travel: 350, accommodation: 800, booth: 12000, total: 14650 }, speakers: ['Scott Brinker', 'Marketing AI experts'], topics: ['MarTech', 'AI Marketing', 'CDP', 'Marketing Operations'], status: 'evaluating', priority_score: 98, ai_recommendation: 'Hoogste prioriteit. Perfect doelgroep match. Overweeg als sponsor te participeren voor maximale impact. Verwachte ROI: 520%.', competitors_attending: ['HubSpot', 'Salesforce', 'Adobe'], tags: ['premium', 'international', 'martech', 'must-attend'],
  },
  {
    id: 'evt-006', name: 'Startup Weekend Gent', type: 'hackathon', description: '54-uur hackathon voor startups en innovators. Goede kans om jonge ondernemers te bereiken en brand awareness te bouwen.', location: 'De Krook, Gent', city: 'Gent', country: 'Belgium', date_start: '2026-04-25', date_end: '2026-04-27', website: 'startupweekend.gent', expected_attendees: 200, target_audience_match: 55, estimated_roi: 180, estimated_leads: 15, networking_value: 65, cost: { ticket: 75, travel: 40, accommodation: 0, total: 115 }, speakers: ['Local entrepreneurs'], topics: ['Startups', 'Innovation', 'Growth Hacking'], status: 'discovered', priority_score: 52, ai_recommendation: 'Laag budget kans. Goed voor employer branding en startup community visibility. Bied mentorship aan.', competitors_attending: [], tags: ['startup', 'hackathon', 'Gent', 'low-cost'],
  },
];

class EventIntelligenceService {
  async getEvents(status?: EventStatus): Promise<DiscoveredEvent[]> {
    return new Promise(r => setTimeout(() => {
      if (status) r(mockEvents.filter(e => e.status === status));
      else r([...mockEvents].sort((a, b) => b.priority_score - a.priority_score));
    }, 600));
  }

  async getMetrics(): Promise<EventMetrics> {
    return new Promise(r => setTimeout(() => r({
      events_discovered: 42, events_registered: 8, events_completed: 12, total_leads_captured: 456, total_roi: 380, avg_audience_match: 78, upcoming_events: 6, events_this_month: 2,
    }), 500));
  }

  async getEventROI(eventId: string): Promise<EventROIAnalysis> {
    return new Promise(r => setTimeout(() => r({
      event_id: eventId, leads_captured: 85, meetings_booked: 23, deals_influenced: 8, revenue_attributed: 67000, cost_total: 5820, roi_percentage: 450, brand_impressions: 45000, social_mentions: 234, nps_score: 8.7,
    }), 500));
  }

  async registerForEvent(eventId: string): Promise<void> {
    return new Promise(r => setTimeout(r, 1000));
  }

  async skipEvent(eventId: string): Promise<void> {
    return new Promise(r => setTimeout(r, 400));
  }

  async scanForNewEvents(): Promise<{ new_events: number }> {
    return new Promise(r => setTimeout(() => r({ new_events: 3 }), 3000));
  }
}

export const eventIntelligenceService = new EventIntelligenceService();
export default eventIntelligenceService;
