// src/services/context-marketing/recommendations.service.ts
import { supabase } from '@/integrations/supabase/client';

// Type definitions
export interface Recommendation {
  id: string;
  user_id: string;
  type: 'optimization' | 'campaign' | 'content' | 'budget' | 'competitive' | 'automation' | 'strategic';
  title: string;
  description: string;
  rationale: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence_score: number; // 0-100
  impact_estimate: {
    metric: string;
    value: number;
    unit: string;
    revenue?: number;
    time_saved?: number;
    engagement?: number;
  };
  implementation_effort: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'implemented' | 'dismissed';
  action_items?: string[];
  dependencies?: string[];
  data_sources: string[];
  created_at: string;
  updated_at: string;
  implemented_at?: string;
  dismissed_at?: string;
  dismissal_reason?: string;
  results?: RecommendationResult;
}

// Safe mapper: impact_estimate comes from JSONB — ensure correct shape
function safeRec(raw: any): Recommendation {
  const ie = raw.impact_estimate;
  return {
    ...raw,
    confidence_score: Number(raw.confidence_score) || 0,
    impact_estimate:
      ie && typeof ie === 'object' && ie.metric
        ? ie
        : { metric: 'General', value: 0, unit: '', revenue: 0, time_saved: 0, engagement: 0 },
    action_items: Array.isArray(raw.action_items) ? raw.action_items : [],
    data_sources: Array.isArray(raw.data_sources) ? raw.data_sources : [],
  };
}

export interface RecommendationResult {
  actual_impact: {
    metric: string;
    value: number;
    unit: string;
  };
  success: boolean;
  feedback?: string;
  learnings?: string[];
}

export interface RecommendationStats {
  total_active: number;
  by_type: Record<string, number>;
  by_priority: Record<string, number>;
  by_status: Record<string, number>;
  success_rate: number;
  average_confidence: number;
  total_impact_value: number;
  implemented_this_month: number;
}

export interface RecommendationFilter {
  type?: string;
  priority?: string;
  status?: string;
  minConfidence?: number;
}

// Service implementation
class RecommendationsService {
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  // Get recommendations with filters
  async getRecommendations(filters?: RecommendationFilter): Promise<Recommendation[]> {
    const userId = await this.getUserId();

    let query = supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', userId);

    if (filters) {
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.minConfidence) {
        query = query.gte('confidence_score', filters.minConfidence);
      }
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    const recommendations = (data || []).map(safeRec) as Recommendation[];

    // Sort by priority and confidence (client-side for multi-column sort)
    recommendations.sort((a, b) => {
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence_score - a.confidence_score;
    });

    return recommendations;
  }

  // Get recommendation by ID
  async getRecommendationById(id: string): Promise<Recommendation | null> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data ? safeRec(data) as Recommendation : null;
  }

  // Get statistics computed from recommendations data
  async getStats(): Promise<RecommendationStats> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;

    const allRecs = (data || []).map(safeRec) as Recommendation[];
    const activeRecs = allRecs.filter(r => r.status === 'pending' || r.status === 'in_progress');
    const implementedRecs = allRecs.filter(r => r.status === 'implemented');

    // Count implemented this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const implementedThisMonth = implementedRecs.filter(r =>
      r.implemented_at && new Date(r.implemented_at) >= startOfMonth
    ).length;

    // Compute success rate from implemented recommendations with results
    const implementedWithResults = implementedRecs.filter(r => r.results);
    const successCount = implementedWithResults.filter(r => r.results?.success).length;
    const successRate = implementedWithResults.length > 0
      ? Math.round((successCount / implementedWithResults.length) * 100)
      : 0;

    const stats: RecommendationStats = {
      total_active: activeRecs.length,
      by_type: {},
      by_priority: {},
      by_status: {},
      success_rate: successRate,
      average_confidence: activeRecs.length > 0
        ? Math.round(activeRecs.reduce((sum, r) => sum + r.confidence_score, 0) / activeRecs.length)
        : 0,
      total_impact_value: activeRecs.reduce((sum, r) => sum + (r.impact_estimate?.revenue || 0), 0),
      implemented_this_month: implementedThisMonth
    };

    // Count by type, priority, status
    allRecs.forEach(rec => {
      stats.by_type[rec.type] = (stats.by_type[rec.type] || 0) + 1;
      stats.by_priority[rec.priority] = (stats.by_priority[rec.priority] || 0) + 1;
      stats.by_status[rec.status] = (stats.by_status[rec.status] || 0) + 1;
    });

    return stats;
  }

  // Mark recommendation as implemented
  async markAsImplemented(id: string): Promise<void> {
    const userId = await this.getUserId();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('recommendations')
      .update({
        status: 'implemented',
        implemented_at: now,
        updated_at: now
      })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  // Dismiss recommendation
  async dismiss(id: string, reason?: string): Promise<void> {
    const userId = await this.getUserId();
    const now = new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
      status: 'dismissed',
      dismissed_at: now,
      updated_at: now
    };

    if (reason) {
      updatePayload.dismissal_reason = reason;
    }

    const { error } = await supabase
      .from('recommendations')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  // Record actual results
  async recordResults(id: string, results: RecommendationResult): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from('recommendations')
      .update({
        results: results as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  }

  // Generate new recommendations - returns active (pending/in_progress) recommendations
  async generateRecommendations(): Promise<Recommendation[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false });
    if (error) throw error;

    return (data || []).map(safeRec) as Recommendation[];
  }

  // Get similar recommendations by same type
  async getSimilarRecommendations(id: string, limit: number = 3): Promise<Recommendation[]> {
    const recommendation = await this.getRecommendationById(id);
    if (!recommendation) return [];

    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('type', recommendation.type)
      .neq('id', id)
      .order('confidence_score', { ascending: false })
      .limit(limit);
    if (error) throw error;

    return (data || []).map(safeRec) as Recommendation[];
  }
}

// Export singleton instance
export const recommendationsService = new RecommendationsService();

// Re-export service as default
export default recommendationsService;
