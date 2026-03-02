// src/services/context-marketing/insights.service.ts
import { supabase } from '@/integrations/supabase/client';
import { Insight, InsightRecommendation } from './pattern-recognition.service';

export interface InsightStats {
  total: number;
  byType: { [key: string]: number };
  byCategory: { [key: string]: number };
  byUrgency: { [key: string]: number };
  byStatus: { [key: string]: number };
  averageImpactScore: number;
  actionableInsights: number;
}

export interface InsightTrend {
  date: string;
  count: number;
  avgImpactScore: number;
}

export interface InsightImpact {
  id: string;
  insight_id: string;
  metric_type: string;
  baseline_value: number;
  current_value: number;
  target_value?: number;
  improvement_percentage?: number;
  confidence_in_attribution?: number;
  measured_at: string;
}

export class InsightsService {
  // Get insights with advanced filtering
  async getInsights(filters: {
    type?: string;
    category?: string;
    urgency?: string;
    status?: string;
    minImpactScore?: number;
    dateRange?: { start: string; end: string };
    limit?: number;
  } = {}): Promise<Insight[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.user.id);

    // Apply filters
    if (filters.type) {
      query = query.eq('insight_type', filters.type);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.urgency) {
      query = query.eq('urgency', filters.urgency);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.minImpactScore) {
      query = query.gte('impact_score', filters.minImpactScore);
    }
    if (filters.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end);
    }

    // Order by priority (impact score and urgency)
    query = query
      .order('urgency', { ascending: true })
      .order('impact_score', { ascending: false })
      .order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Get a single insight with recommendations
  async getInsightWithRecommendations(insightId: string): Promise<{
    insight: Insight;
    recommendations: InsightRecommendation[];
  }> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get insight
    const { data: insight, error: insightError } = await supabase
      .from('insights')
      .select('*')
      .eq('id', insightId)
      .eq('user_id', user.user.id)
      .single();

    if (insightError) throw insightError;
    if (!insight) throw new Error('Insight not found');

    // Get recommendations
    const { data: recommendations, error: recError } = await supabase
      .from('insight_recommendations')
      .select('*')
      .eq('insight_id', insightId)
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: true });

    if (recError) throw recError;

    return {
      insight,
      recommendations: recommendations || []
    };
  }

  // Get insight statistics
  async getInsightStats(): Promise<InsightStats> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: insights, error } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.user.id);

    if (error) throw error;
    if (!insights || insights.length === 0) {
      return {
        total: 0,
        byType: {},
        byCategory: {},
        byUrgency: {},
        byStatus: {},
        averageImpactScore: 0,
        actionableInsights: 0
      };
    }

    const stats: InsightStats = {
      total: insights.length,
      byType: {},
      byCategory: {},
      byUrgency: {},
      byStatus: {},
      averageImpactScore: 0,
      actionableInsights: 0
    };

    let totalImpactScore = 0;

    insights.forEach(insight => {
      // Count by type
      stats.byType[insight.insight_type] = (stats.byType[insight.insight_type] || 0) + 1;

      // Count by category
      stats.byCategory[insight.category] = (stats.byCategory[insight.category] || 0) + 1;

      // Count by urgency
      if (insight.urgency) {
        stats.byUrgency[insight.urgency] = (stats.byUrgency[insight.urgency] || 0) + 1;
      }

      // Count by status
      stats.byStatus[insight.status] = (stats.byStatus[insight.status] || 0) + 1;

      // Sum impact scores
      totalImpactScore += insight.impact_score || 0;

      // Count actionable insights
      if (insight.status === 'new' || insight.status === 'reviewed') {
        stats.actionableInsights++;
      }
    });

    stats.averageImpactScore = totalImpactScore / insights.length;

    return stats;
  }

  // Get insight trends over time
  async getInsightTrends(days: number = 30): Promise<InsightTrend[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: insights, error } = await supabase
      .from('insights')
      .select('created_at, impact_score')
      .eq('user_id', user.user.id)
      .gte('created_at', startDate.toISOString());

    if (error) throw error;
    if (!insights || insights.length === 0) return [];

    // Group by date
    const trendMap = new Map<string, { count: number; totalImpact: number }>();

    insights.forEach(insight => {
      const date = new Date(insight.created_at).toISOString().split('T')[0];
      const existing = trendMap.get(date) || { count: 0, totalImpact: 0 };
      
      trendMap.set(date, {
        count: existing.count + 1,
        totalImpact: existing.totalImpact + (insight.impact_score || 0)
      });
    });

    // Convert to array and calculate averages
    const trends: InsightTrend[] = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      avgImpactScore: data.totalImpact / data.count
    }));

    // Sort by date
    trends.sort((a, b) => a.date.localeCompare(b.date));

    return trends;
  }

  // Update insight status
  async updateInsightStatus(
    insightId: string,
    status: Insight['status'],
    notes?: string
  ): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updates: any = { status };
    
    if (status === 'reviewed') {
      updates.reviewed_at = new Date().toISOString();
    } else if (status === 'implemented') {
      updates.actioned_at = new Date().toISOString();
    }

    if (notes) {
      // Get existing metadata and add notes
      const { data: insight } = await supabase
        .from('insights')
        .select('metadata')
        .eq('id', insightId)
        .single();

      updates.metadata = {
        ...(insight?.metadata || {}),
        status_notes: notes,
        last_updated_by: user.user.email
      };
    }

    const { error } = await supabase
      .from('insights')
      .update(updates)
      .eq('id', insightId)
      .eq('user_id', user.user.id);

    if (error) throw error;
  }

  // Create manual insight
  async createManualInsight(insight: Partial<Insight>): Promise<Insight> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('insights')
      .insert({
        ...insight,
        user_id: user.user.id,
        supporting_patterns: insight.supporting_patterns || [],
        data_sources: insight.data_sources || [],
        evidence: insight.evidence || [],
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Track insight impact
  async trackInsightImpact(
    insightId: string,
    impact: {
      metric_type: string;
      baseline_value: number;
      current_value: number;
      target_value?: number;
    }
  ): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const improvementPercentage = ((impact.current_value - impact.baseline_value) / impact.baseline_value) * 100;

    const { error } = await supabase
      .from('insight_impact_tracking')
      .insert({
        insight_id: insightId,
        user_id: user.user.id,
        metric_type: impact.metric_type,
        baseline_value: impact.baseline_value,
        current_value: impact.current_value,
        target_value: impact.target_value,
        improvement_percentage: improvementPercentage,
        confidence_in_attribution: 80, // Default confidence
        measured_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  // Get impact tracking for an insight
  async getInsightImpact(insightId: string): Promise<InsightImpact[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('insight_impact_tracking')
      .select('*')
      .eq('insight_id', insightId)
      .eq('user_id', user.user.id)
      .order('measured_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Update recommendation status
  async updateRecommendationStatus(
    recommendationId: string,
    status: InsightRecommendation['status']
  ): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('insight_recommendations')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', recommendationId)
      .eq('user_id', user.user.id);

    if (error) throw error;
  }

  // Get actionable insights summary
  async getActionableInsightsSummary(): Promise<{
    immediate: Insight[];
    highPriority: Insight[];
    opportunities: Insight[];
    totalValue: number;
  }> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all actionable insights
    const { data: insights, error } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.user.id)
      .in('status', ['new', 'reviewed'])
      .order('impact_score', { ascending: false });

    if (error) throw error;
    if (!insights) {
      return {
        immediate: [],
        highPriority: [],
        opportunities: [],
        totalValue: 0
      };
    }

    const immediate = insights.filter(i => i.urgency === 'immediate');
    const highPriority = insights.filter(i => 
      i.urgency === 'high' && i.impact_score && i.impact_score >= 80
    );
    const opportunities = insights.filter(i => i.insight_type === 'opportunity');

    const totalValue = insights.reduce((sum, i) => sum + (i.impact_score || 0), 0);

    return {
      immediate,
      highPriority,
      opportunities,
      totalValue
    };
  }

  // Bulk operations
  async dismissInsights(insightIds: string[]): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('insights')
      .update({ 
        status: 'dismissed',
        updated_at: new Date().toISOString()
      })
      .in('id', insightIds)
      .eq('user_id', user.user.id);

    if (error) throw error;
  }

  // Export insights
  async exportInsights(format: 'json' | 'csv' = 'json'): Promise<any> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const insights = await this.getInsights({ limit: 1000 });

    if (format === 'json') {
      return insights;
    }

    // Convert to CSV
    if (insights.length === 0) return '';

    const headers = [
      'Title',
      'Type',
      'Category',
      'Impact Score',
      'Urgency',
      'Status',
      'Created At',
      'Description',
      'Key Finding'
    ];

    const rows = insights.map(insight => [
      insight.title,
      insight.insight_type,
      insight.category,
      insight.impact_score || '',
      insight.urgency || '',
      insight.status,
      new Date(insight.created_at).toLocaleDateString(),
      insight.description.replace(/"/g, '""'), // Escape quotes
      insight.key_finding.replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  // Search insights
  async searchInsights(query: string): Promise<Insight[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const searchTerms = query.toLowerCase().split(' ');

    // Get all insights
    const { data: insights, error } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.user.id);

    if (error) throw error;
    if (!insights) return [];

    // Filter by search terms
    return insights.filter(insight => {
      const searchableText = [
        insight.title,
        insight.description,
        insight.key_finding,
        insight.category,
        insight.insight_type
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  // Get insights by pattern
  async getInsightsByPattern(patternId: string): Promise<Insight[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.user.id)
      .contains('supporting_patterns', [patternId])
      .order('impact_score', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const insightsService = new InsightsService();