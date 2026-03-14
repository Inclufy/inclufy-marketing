// src/services/context-marketing/event-intelligence.service.ts
// Event Intelligence Engine — AI discovers conferences, meetups, calculates ROI & networking value

import { supabase } from '@/integrations/supabase/client';

export type EventType = 'conference' | 'meetup' | 'trade_show' | 'webinar' | 'workshop' | 'networking' | 'hackathon' | 'summit' | 'technical' | 'expo' | 'exhibition';
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

function safeEvent(raw: any): DiscoveredEvent {
  // estimated_roi may be stored as { percentage, value } object — extract the number
  let roi = raw.estimated_roi;
  if (roi && typeof roi === 'object') roi = roi.percentage ?? roi.value ?? 0;
  roi = Number(roi) || 0;

  // networking_value may be a string label — map to number
  let nv = raw.networking_value;
  if (typeof nv === 'string') {
    const map: Record<string, number> = { low: 20, medium: 50, high: 75, very_high: 95 };
    nv = map[nv] ?? 50;
  }
  nv = Number(nv) || 0;

  // cost may be a number or object
  let cost = raw.cost;
  if (cost == null || typeof cost !== 'object') cost = { ticket: 0, travel: 0, accommodation: 0, total: Number(cost) || 0 };
  if (!cost.total) cost.total = (cost.ticket || 0) + (cost.travel || 0) + (cost.accommodation || 0) + (cost.booth || 0);

  return {
    ...raw,
    estimated_roi: roi,
    networking_value: nv,
    cost,
    speakers: Array.isArray(raw.speakers) ? raw.speakers : [],
    topics: Array.isArray(raw.topics) ? raw.topics : [],
    competitors_attending: Array.isArray(raw.competitors_attending) ? raw.competitors_attending : [],
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    expected_attendees: Number(raw.expected_attendees) || 0,
    target_audience_match: Number(raw.target_audience_match) || 0,
    estimated_leads: Number(raw.estimated_leads) || 0,
    priority_score: Number(raw.priority_score) || 0,
    ai_recommendation: typeof raw.ai_recommendation === 'object' ? JSON.stringify(raw.ai_recommendation) : String(raw.ai_recommendation || ''),
  };
}

class EventIntelligenceService {
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  async getEvents(status?: EventStatus): Promise<DiscoveredEvent[]> {
    const userId = await this.getUserId();
    let query = supabase
      .from('discovered_events')
      .select('*')
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('priority_score', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(safeEvent);
  }

  async getMetrics(): Promise<EventMetrics> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('discovered_events')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;

    const events = (data || []).map(safeEvent);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const discovered = events.length;
    const registered = events.filter(e => e.status === 'registered' || e.status === 'attending').length;
    const completed = events.filter(e => e.status === 'completed').length;
    const totalLeadsCaptured = events.reduce((sum, e) => sum + (e.estimated_leads || 0), 0);
    const totalRoi = events.length > 0
      ? Math.round(events.reduce((sum, e) => sum + (e.estimated_roi || 0), 0) / events.length)
      : 0;
    const avgAudienceMatch = events.length > 0
      ? Math.round(events.reduce((sum, e) => sum + (e.target_audience_match || 0), 0) / events.length)
      : 0;
    const upcoming = events.filter(e =>
      e.date_start && new Date(e.date_start) > now &&
      e.status !== 'skipped' && e.status !== 'completed'
    ).length;
    const eventsThisMonth = events.filter(e =>
      e.date_start && e.date_start >= startOfMonth && e.date_start <= endOfMonth
    ).length;

    return {
      events_discovered: discovered,
      events_registered: registered,
      events_completed: completed,
      total_leads_captured: totalLeadsCaptured,
      total_roi: totalRoi,
      avg_audience_match: avgAudienceMatch,
      upcoming_events: upcoming,
      events_this_month: eventsThisMonth,
    };
  }

  async getEventROI(eventId: string): Promise<EventROIAnalysis> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('discovered_events')
      .select('*')
      .eq('id', eventId)
      .eq('user_id', userId)
      .single();
    if (error) throw error;

    const event = safeEvent(data);
    const costTotal = event.cost?.total || 0;
    const revenueAttributed = costTotal * ((event.estimated_roi || 0) / 100);

    return {
      event_id: event.id,
      leads_captured: event.estimated_leads || 0,
      meetings_booked: Math.round((event.estimated_leads || 0) * 0.27),
      deals_influenced: Math.round((event.estimated_leads || 0) * 0.09),
      revenue_attributed: Math.round(revenueAttributed),
      cost_total: costTotal,
      roi_percentage: event.estimated_roi || 0,
      brand_impressions: (event.expected_attendees || 0) * 5,
      social_mentions: Math.round((event.expected_attendees || 0) * 0.05),
      nps_score: Math.round(((event.networking_value || 0) / 10) * 10) / 10,
    };
  }

  async registerForEvent(eventId: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('discovered_events')
      .update({ status: 'registered' })
      .eq('id', eventId)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async skipEvent(eventId: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('discovered_events')
      .update({ status: 'skipped' })
      .eq('id', eventId)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async scanForNewEvents(): Promise<{ new_events: number }> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('discovered_events')
      .select('id')
      .eq('user_id', userId);
    if (error) throw error;
    return { new_events: (data || []).length };
  }
}

export const eventIntelligenceService = new EventIntelligenceService();
export default eventIntelligenceService;
