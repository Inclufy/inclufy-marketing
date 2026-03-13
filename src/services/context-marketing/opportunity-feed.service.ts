// src/services/context-marketing/opportunity-feed.service.ts
// Central AI Opportunity Feed — aggregates leads, trends, events, partnerships, marketing opportunities

import { supabase } from '@/integrations/supabase/client';

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

const TYPE_COLORS: Record<FeedItemType, string> = {
  lead_signal: '#8b5cf6',
  trend_alert: '#ec4899',
  campaign_trigger: '#3b82f6',
  event_opportunity: '#10b981',
  competitor_move: '#f59e0b',
  partnership_match: '#14b8a6',
  content_opportunity: '#06b6d4',
  budget_optimization: '#ef4444',
};

class OpportunityFeedService {
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  private safeFeedItem(raw: any): FeedItem {
    return {
      ...raw,
      suggested_action: raw.suggested_action || { label: '—', action_type: 'monitor' },
      related_entities: raw.related_entities || [],
      impact_metrics: raw.impact_metrics || {},
      tags: raw.tags || [],
      estimated_value: raw.estimated_value ?? 0,
      confidence: raw.confidence ?? 0,
    };
  }

  async getFeedItems(limit: number = 20): Promise<FeedItem[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('feed_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(d => this.safeFeedItem(d));
  }

  async getStats(): Promise<FeedStats> {
    const userId = await this.getUserId();

    const { data: items, error } = await supabase
      .from('feed_items')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;

    const allItems = (items || []).map(d => this.safeFeedItem(d)) as (FeedItem & { is_dismissed?: boolean; created_at?: string })[];

    const total = allItems.length;
    const unread = allItems.filter(i => !i.is_read).length;
    const immediate = allItems.filter(i => i.urgency === 'immediate').length;
    const totalValue = allItems.reduce((sum, i) => sum + (i.estimated_value || 0), 0);

    const today = new Date().toISOString().split('T')[0];
    const actionedToday = allItems.filter(i => i.is_actioned && (i.timestamp || '').startsWith(today)).length;
    const actionedTotal = allItems.filter(i => i.is_actioned).length;
    const actionRate = total > 0 ? (actionedTotal / total) * 100 : 0;

    // Group by type
    const typeCounts = new Map<FeedItemType, number>();
    for (const item of allItems) {
      typeCounts.set(item.type, (typeCounts.get(item.type) || 0) + 1);
    }
    const byType = Object.entries(TYPE_COLORS).map(([type, color]) => ({
      type: type as FeedItemType,
      count: typeCounts.get(type as FeedItemType) || 0,
      color,
    }));

    // Build daily feed for the last 7 days
    const dailyFeed: Array<{ date: string; items: number; actioned: number; value: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayItems = allItems.filter(item => (item.timestamp || '').startsWith(dateStr));
      dailyFeed.push({
        date: dateStr,
        items: dayItems.length,
        actioned: dayItems.filter(item => item.is_actioned).length,
        value: dayItems.reduce((sum, item) => sum + (item.estimated_value || 0), 0),
      });
    }

    return {
      total_items: total,
      unread,
      immediate_actions: immediate,
      total_potential_value: totalValue,
      items_actioned_today: actionedToday,
      action_rate: Math.round(actionRate * 10) / 10,
      by_type: byType,
      daily_feed: dailyFeed,
    };
  }

  async markAsRead(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('feed_items')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async actionItem(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('feed_items')
      .update({ is_actioned: true })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async dismissItem(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await supabase
      .from('feed_items')
      .update({ is_dismissed: true })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }
}

export const opportunityFeedService = new OpportunityFeedService();
export default opportunityFeedService;
