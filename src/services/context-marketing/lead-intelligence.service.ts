// src/services/context-marketing/lead-intelligence.service.ts
// Lead Intelligence Engine — AI analyzes intent signals, website behavior, social interactions, predicts best follow-up

import { supabase } from '@/integrations/supabase/client';

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

class LeadIntelligenceService {
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  async getDashboard(): Promise<LeadIntelligenceDashboard> {
    const userId = await this.getUserId();

    const [leadsRes, signalsRes] = await Promise.all([
      supabase
        .from('lead_profiles')
        .select('*')
        .eq('user_id', userId),
      supabase
        .from('intent_signals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ]);

    if (leadsRes.error) throw leadsRes.error;
    if (signalsRes.error) throw signalsRes.error;

    const leads = (leadsRes.data || []) as unknown as LeadIntelligenceProfile[];
    const signals = (signalsRes.data || []) as unknown as IntentSignal[];

    const totalTracked = leads.length;
    const highIntent = leads.filter(l =>
      l.intent_level === 'very_high' || l.intent_level === 'high'
    ).length;

    const today = new Date().toISOString().substring(0, 10);
    const signalsToday = signals.filter(s =>
      s.timestamp && s.timestamp.substring(0, 10) === today
    ).length;

    const avgIntentScore = leads.length > 0
      ? Math.round((leads.reduce((sum, l) => sum + (l.intent_score || 0), 0) / leads.length) * 10) / 10
      : 0;

    // Estimate pipeline value from high-intent leads
    const predictedPipelineValue = leads
      .filter(l => l.intent_level === 'very_high' || l.intent_level === 'high')
      .reduce((sum, l) => sum + ((l.predicted_actions?.buy_probability || 0.5) * 50000), 0);

    // Intent distribution with colors
    const intentColorMap: Record<IntentLevel, string> = {
      very_high: '#8b5cf6',
      high: '#3b82f6',
      medium: '#10b981',
      low: '#f59e0b',
      cold: '#6b7280',
    };
    const intentDistribution: Array<{ level: IntentLevel; count: number; color: string }> = (
      ['very_high', 'high', 'medium', 'low', 'cold'] as IntentLevel[]
    ).map(level => ({
      level,
      count: leads.filter(l => l.intent_level === level).length,
      color: intentColorMap[level],
    }));

    // Build signal heatmap from actual signals
    const heatmapMap = new Map<string, number>();
    signals.forEach(s => {
      if (!s.timestamp) return;
      const d = new Date(s.timestamp);
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      const hour = d.getHours();
      const key = `${hour}-${day}`;
      heatmapMap.set(key, (heatmapMap.get(key) || 0) + 1);
    });
    const signalHeatmap = Array.from(heatmapMap.entries()).map(([key, count]) => {
      const [hourStr, day] = key.split('-');
      return { hour: parseInt(hourStr, 10), day, count };
    });

    // Top leads sorted by intent score
    const topIntentLeads = [...leads]
      .sort((a, b) => (b.intent_score || 0) - (a.intent_score || 0))
      .slice(0, 10);

    // Recent signals (most recent first, limit 20)
    const recentSignals = signals.slice(0, 20);

    // Channel effectiveness computed from signals
    const channelMap = new Map<string, { leads: Set<string>; totalLift: number; count: number }>();
    signals.forEach(s => {
      const channel = mapSignalTypeToChannel(s.type);
      const entry = channelMap.get(channel) || { leads: new Set<string>(), totalLift: 0, count: 0 };
      entry.leads.add(s.lead_id);
      entry.totalLift += s.strength || 0;
      entry.count += 1;
      channelMap.set(channel, entry);
    });
    const channelEffectiveness = Array.from(channelMap.entries()).map(([channel, stats]) => ({
      channel,
      leads_influenced: stats.leads.size,
      avg_intent_lift: stats.count > 0 ? Math.round((stats.totalLift / stats.count) * 10) / 10 : 0,
      cost_per_intent_point: 0, // Would require budget data to compute
    }));

    return {
      total_tracked: totalTracked,
      high_intent: highIntent,
      signals_today: signalsToday,
      avg_intent_score: avgIntentScore,
      predicted_pipeline_value: Math.round(predictedPipelineValue),
      intent_distribution: intentDistribution,
      signal_heatmap: signalHeatmap,
      top_intent_leads: topIntentLeads,
      recent_signals: recentSignals,
      channel_effectiveness: channelEffectiveness,
    };
  }

  async getLeadProfile(id: string): Promise<LeadIntelligenceProfile | null> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lead_profiles')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data ? (data as unknown as LeadIntelligenceProfile) : null;
  }

  async getTopIntentLeads(limit: number = 10): Promise<LeadIntelligenceProfile[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('lead_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('intent_score', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as unknown as LeadIntelligenceProfile[];
  }

  async getRecentSignals(limit: number = 20): Promise<IntentSignal[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('intent_signals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as unknown as IntentSignal[];
  }

  async getTopLeads(limit: number = 10): Promise<LeadIntelligenceProfile[]> {
    return this.getTopIntentLeads(limit);
  }

  async predictBestAction(leadId: string): Promise<BestAction> {
    const userId = await this.getUserId();

    // Fetch lead profile
    const { data: leadData, error: leadError } = await supabase
      .from('lead_profiles')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', userId)
      .single();
    if (leadError) throw leadError;

    const lead = leadData as unknown as LeadIntelligenceProfile;

    // Fetch recent signals for this lead
    const { data: signalData, error: signalError } = await supabase
      .from('intent_signals')
      .select('*')
      .eq('user_id', userId)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(5);
    if (signalError) throw signalError;

    const signals = (signalData || []) as unknown as IntentSignal[];

    // Determine best action based on intent level and signals
    const hasPricingView = signals.some(s => s.type === 'pricing_view');
    const hasDemoRequest = signals.some(s => s.type === 'demo_request');
    const hasCompetitorComparison = signals.some(s => s.type === 'competitor_comparison');

    let action: string;
    let channel: string;
    let timing: string;
    let confidence: number;

    if (lead.intent_level === 'very_high' || hasDemoRequest) {
      action = 'Schedule personalized demo';
      channel = 'Direct call';
      timing = 'Within 24 hours';
      confidence = 92;
    } else if (lead.intent_level === 'high' || hasPricingView) {
      action = 'Send ROI case study and offer consultation';
      channel = 'Email';
      timing = 'Next business day morning';
      confidence = 78;
    } else if (hasCompetitorComparison) {
      action = 'Share competitive comparison content';
      channel = 'LinkedIn';
      timing = 'Within 48 hours';
      confidence = 72;
    } else if (lead.intent_level === 'medium') {
      action = 'Enroll in nurture email sequence';
      channel = 'Email';
      timing = 'This week';
      confidence = 65;
    } else {
      action = 'Add to awareness campaign';
      channel = 'Content Marketing';
      timing = 'Next content cycle';
      confidence = 45;
    }

    // Adjust confidence based on intent score
    confidence = Math.min(99, Math.round(confidence * ((lead.intent_score || 50) / 80)));

    return { action, channel, timing, confidence };
  }
}

// Helper: map signal type to a marketing channel name
function mapSignalTypeToChannel(type: SignalType): string {
  const mapping: Record<SignalType, string> = {
    page_view: 'Organic Search',
    content_download: 'Content Marketing',
    email_engagement: 'Email Nurture',
    social_interaction: 'Social Media',
    event_attendance: 'Events',
    form_submission: 'Direct',
    pricing_view: 'Organic Search',
    api_docs: 'Content Marketing',
    competitor_comparison: 'Organic Search',
    demo_request: 'Direct',
  };
  return mapping[type] || 'Other';
}

export const leadIntelligenceService = new LeadIntelligenceService();
export default leadIntelligenceService;
