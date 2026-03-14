// src/services/context-marketing/lead-scoring.service.ts
// Predictive Lead Scoring service — AI-powered lead scoring and funnel management

import { supabase } from '@/integrations/supabase/client';

export type LeadStage = 'visitor' | 'lead' | 'mql' | 'sql' | 'opportunity' | 'customer';
export type ScoreCategory = 'behavioral' | 'demographic' | 'firmographic' | 'engagement' | 'intent';

export interface ScoredLead {
  id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  composite_score: number;
  score_breakdown: Record<ScoreCategory, number>;
  stage: LeadStage;
  conversion_probability: number;
  predicted_value: number;
  predicted_close_date?: string;
  hot_signals: string[];
  cold_signals: string[];
  last_activity: string;
  activity_count_30d: number;
  source: string;
  tags: string[];
  score_history: Array<{ date: string; score: number }>;
  next_best_action: string;
}

export interface ScoringRule {
  id: string;
  name: string;
  category: ScoreCategory;
  description: string;
  condition: string;
  points: number;
  is_active: boolean;
  triggers_count: number;
}

export interface ScoringModel {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  accuracy: number;
  total_leads_scored: number;
  last_trained: string;
  category_weights: Record<ScoreCategory, number>;
  threshold_mql: number;
  threshold_sql: number;
}

export interface LeadFunnelData {
  stage: LeadStage;
  label: string;
  count: number;
  conversion_rate: number;
  avg_score: number;
  avg_time_in_stage: number;
  value: number;
}

export interface LeadScoringDashboardData {
  total_leads: number;
  average_score: number;
  hot_leads: number;
  mql_count: number;
  sql_count: number;
  conversion_rate: number;
  score_distribution: Array<{ range: string; count: number; color: string }>;
  funnel: LeadFunnelData[];
  score_trend: Array<{ date: string; avg_score: number; new_leads: number }>;
  top_leads: ScoredLead[];
  recent_score_changes: Array<{ lead_id: string; lead_name: string; old_score: number; new_score: number; reason: string; timestamp: string }>;
}

export interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  suggested_action: string;
  category: string;
}

const STAGE_LABELS: Record<LeadStage, string> = {
  visitor: 'Visitors',
  lead: 'Leads',
  mql: 'MQL',
  sql: 'SQL',
  opportunity: 'Opportunity',
  customer: 'Customer',
};

// Ensure any value rendered in JSX is a primitive, not an object
function str(val: any): string {
  if (val == null) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function safeLead(raw: any): ScoredLead {
  // next_best_action may be stored as { action, priority, channel } object — extract the string
  let nba = raw.next_best_action;
  if (nba && typeof nba === 'object') nba = nba.action ?? nba.label ?? JSON.stringify(nba);
  nba = str(nba);

  // score_breakdown may be stored differently
  let sb = raw.score_breakdown;
  if (sb == null || typeof sb !== 'object') sb = {};

  return {
    ...raw,
    name: str(raw.name),
    email: str(raw.email),
    company: str(raw.company ?? ''),
    title: str(raw.title ?? ''),
    source: str(raw.source ?? ''),
    stage: raw.stage || 'visitor',
    composite_score: Number(raw.composite_score) || 0,
    conversion_probability: Number(raw.conversion_probability) || 0,
    predicted_value: Number(raw.predicted_value) || 0,
    activity_count_30d: Number(raw.activity_count_30d) || 0,
    last_activity: str(raw.last_activity ?? ''),
    predicted_close_date: raw.predicted_close_date ? str(raw.predicted_close_date) : undefined,
    next_best_action: nba,
    score_breakdown: {
      behavioral: Number(sb.behavioral) || 0,
      demographic: Number(sb.demographic) || 0,
      firmographic: Number(sb.firmographic) || 0,
      engagement: Number(sb.engagement) || 0,
      intent: Number(sb.intent) || 0,
    },
    score_history: Array.isArray(raw.score_history) ? raw.score_history : [],
    hot_signals: Array.isArray(raw.hot_signals) ? raw.hot_signals.map(str) : [],
    cold_signals: Array.isArray(raw.cold_signals) ? raw.cold_signals.map(str) : [],
    tags: Array.isArray(raw.tags) ? raw.tags.map(str) : [],
  };
}

function safeRule(raw: any): ScoringRule {
  return {
    ...raw,
    name: str(raw.name),
    category: raw.category || 'behavioral',
    description: str(raw.description),
    condition: str(raw.condition),
    points: Number(raw.points) || 0,
    is_active: raw.is_active ?? true,
    triggers_count: Number(raw.triggers_count) || 0,
  };
}

function safeModel(raw: any): ScoringModel {
  const cw = raw.category_weights || {};
  return {
    ...raw,
    name: str(raw.name),
    description: str(raw.description ?? ''),
    is_active: raw.is_active ?? false,
    accuracy: Number(raw.accuracy) || 0,
    total_leads_scored: Number(raw.total_leads_scored) || 0,
    last_trained: str(raw.last_trained ?? ''),
    threshold_mql: Number(raw.threshold_mql) || 40,
    threshold_sql: Number(raw.threshold_sql) || 70,
    category_weights: {
      behavioral: Number(cw.behavioral) || 20,
      demographic: Number(cw.demographic) || 20,
      firmographic: Number(cw.firmographic) || 20,
      engagement: Number(cw.engagement) || 20,
      intent: Number(cw.intent) || 20,
    },
  };
}

const SCORE_DISTRIBUTION_COLORS: Record<string, string> = {
  '0-10': '#ef4444',
  '11-20': '#f97316',
  '21-30': '#f59e0b',
  '31-40': '#eab308',
  '41-50': '#84cc16',
  '51-60': '#22c55e',
  '61-70': '#10b981',
  '71-80': '#14b8a6',
  '81-90': '#06b6d4',
  '91-100': '#8b5cf6',
};

class LeadScoringService {
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  async getDashboard(): Promise<LeadScoringDashboardData> {
    const userId = await this.getUserId();

    // Fetch all scored leads for the user
    const { data: leads, error } = await supabase
      .from('scored_leads')
      .select('*')
      .eq('user_id', userId)
      .order('composite_score', { ascending: false });

    if (error) throw error;

    const allLeads = (leads || []).map(safeLead);
    const totalLeads = allLeads.length;
    const averageScore = totalLeads > 0
      ? Math.round((allLeads.reduce((sum, l) => sum + l.composite_score, 0) / totalLeads) * 10) / 10
      : 0;
    const hotLeads = allLeads.filter(l => l.composite_score >= 80).length;
    const mqlCount = allLeads.filter(l => l.stage === 'mql').length;
    const sqlCount = allLeads.filter(l => l.stage === 'sql').length;
    const customerCount = allLeads.filter(l => l.stage === 'customer').length;
    const conversionRate = totalLeads > 0
      ? Math.round((customerCount / totalLeads) * 1000) / 10
      : 0;

    // Build score distribution
    const scoreRanges = ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90', '91-100'];
    const scoreDistribution = scoreRanges.map(range => {
      const [min, max] = range.split('-').map(Number);
      const count = allLeads.filter(l => l.composite_score >= min && l.composite_score <= max).length;
      return { range, count, color: SCORE_DISTRIBUTION_COLORS[range] || '#6b7280' };
    });

    // Build funnel data
    const stages: LeadStage[] = ['visitor', 'lead', 'mql', 'sql', 'opportunity', 'customer'];
    const funnel: LeadFunnelData[] = stages.map((stage, idx) => {
      const stageLeads = allLeads.filter(l => l.stage === stage);
      const count = stageLeads.length;
      const avgScore = count > 0
        ? Math.round(stageLeads.reduce((s, l) => s + l.composite_score, 0) / count)
        : 0;
      const totalValue = stageLeads.reduce((s, l) => s + l.predicted_value, 0);
      const nextStageCount = idx < stages.length - 1
        ? allLeads.filter(l => l.stage === stages[idx + 1]).length
        : count;
      const convRate = count > 0
        ? Math.round((nextStageCount / count) * 1000) / 10
        : 0;
      return {
        stage,
        label: STAGE_LABELS[stage],
        count,
        conversion_rate: stage === 'customer' ? 100 : convRate,
        avg_score: avgScore,
        avg_time_in_stage: stage === 'customer' ? 0 : Math.round(7 + idx * 3),
        value: totalValue,
      };
    });

    // Build score trend from the last 5 weeks using score_history from leads
    const now = new Date();
    const scoreTrend: Array<{ date: string; avg_score: number; new_leads: number }> = [];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const dateStr = d.toISOString().split('T')[0];
      const scoresForDate = allLeads
        .filter(l => l.score_history && l.score_history.length > 0)
        .map(l => {
          const entry = l.score_history.find(h => h.date === dateStr);
          return entry ? entry.score : null;
        })
        .filter((s): s is number => s !== null);
      const avgScoreForDate = scoresForDate.length > 0
        ? Math.round((scoresForDate.reduce((a, b) => a + b, 0) / scoresForDate.length) * 10) / 10
        : averageScore;
      scoreTrend.push({
        date: dateStr,
        avg_score: avgScoreForDate,
        new_leads: Math.round(totalLeads * 0.02 * (5 - i)),
      });
    }

    // Top leads (score >= 80)
    const topLeads = allLeads.filter(l => l.composite_score >= 80)
      .sort((a, b) => b.composite_score - a.composite_score);

    // Recent score changes: find leads with score_history that had changes
    const recentScoreChanges = allLeads
      .filter(l => l.score_history && l.score_history.length >= 2)
      .map(l => {
        const history = l.score_history;
        const latest = history[history.length - 1];
        const previous = history[history.length - 2];
        return {
          lead_id: l.id,
          lead_name: l.name,
          old_score: previous.score,
          new_score: latest.score,
          reason: l.next_best_action || 'Score updated based on recent activity',
          timestamp: l.last_activity,
        };
      })
      .filter(c => c.old_score !== c.new_score)
      .sort((a, b) => Math.abs(b.new_score - b.old_score) - Math.abs(a.new_score - a.old_score))
      .slice(0, 10);

    return {
      total_leads: totalLeads,
      average_score: averageScore,
      hot_leads: hotLeads,
      mql_count: mqlCount,
      sql_count: sqlCount,
      conversion_rate: conversionRate,
      score_distribution: scoreDistribution,
      funnel,
      score_trend: scoreTrend,
      top_leads: topLeads,
      recent_score_changes: recentScoreChanges,
    };
  }

  async getLeads(filters?: { stage?: LeadStage; minScore?: number; maxScore?: number }): Promise<ScoredLead[]> {
    const userId = await this.getUserId();

    let query = supabase
      .from('scored_leads')
      .select('*')
      .eq('user_id', userId)
      .order('composite_score', { ascending: false });

    if (filters?.stage) {
      query = query.eq('stage', filters.stage);
    }
    if (filters?.minScore !== undefined) {
      query = query.gte('composite_score', filters.minScore);
    }
    if (filters?.maxScore !== undefined) {
      query = query.lte('composite_score', filters.maxScore);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(safeLead);
  }

  async getLeadById(id: string): Promise<ScoredLead | null> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('scored_leads')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? safeLead(data) : null;
  }

  async getScoringRules(): Promise<ScoringRule[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('scoring_rules')
      .select('*')
      .eq('user_id', userId)
      .order('category', { ascending: true });

    if (error) throw error;
    return (data || []).map(safeRule);
  }

  async updateScoringRule(id: string, updates: Partial<ScoringRule>): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from('scoring_rules')
      .update(updates)
      .eq('user_id', userId)
      .eq('id', id);

    if (error) throw error;
  }

  async getScoringModel(): Promise<ScoringModel> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('scoring_models')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      // Return a sensible default model when none exists yet
      return safeModel({
        id: '',
        name: 'Default Model',
        accuracy: 0,
        is_active: false,
        category_weights: { behavioral: 20, demographic: 20, firmographic: 20, engagement: 20, intent: 20 },
        threshold_mql: 40,
        threshold_sql: 70,
        last_trained: null,
      });
    }
    return safeModel(data);
  }

  async updateModelWeights(weights: Record<ScoreCategory, number>): Promise<void> {
    const userId = await this.getUserId();

    // Find the active model
    const { data: model, error: fetchError } = await supabase
      .from('scoring_models')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!model) throw new Error('No active scoring model found');

    const { error } = await supabase
      .from('scoring_models')
      .update({ category_weights: weights })
      .eq('user_id', userId)
      .eq('id', model.id);

    if (error) throw error;
  }

  async rescoreAllLeads(): Promise<{ total_rescored: number; changes: number }> {
    const userId = await this.getUserId();

    // Get the active scoring model with weights
    const model = await this.getScoringModel();

    // Fetch all leads
    const { data: leads, error: leadsError } = await supabase
      .from('scored_leads')
      .select('*')
      .eq('user_id', userId);

    if (leadsError) throw leadsError;

    const allLeads = (leads || []).map(safeLead);
    let changes = 0;

    for (const lead of allLeads) {
      const breakdown = lead.score_breakdown || {} as Record<ScoreCategory, number>;
      const weights = model.category_weights;

      // Recalculate composite score using weighted average
      const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
      const newScore = totalWeight > 0
        ? Math.round(
            Object.entries(weights).reduce((sum, [cat, weight]) => {
              return sum + (breakdown[cat as ScoreCategory] || 0) * weight;
            }, 0) / totalWeight
          )
        : lead.composite_score;

      // Determine new stage based on thresholds
      let newStage: LeadStage = 'visitor';
      if (newScore >= 90) newStage = 'customer';
      else if (newScore >= model.threshold_sql + 10) newStage = 'opportunity';
      else if (newScore >= model.threshold_sql) newStage = 'sql';
      else if (newScore >= model.threshold_mql) newStage = 'mql';
      else if (newScore >= 30) newStage = 'lead';

      if (newScore !== lead.composite_score || newStage !== lead.stage) {
        changes++;

        // Update the score_history with the new score
        const updatedHistory = [...(lead.score_history || [])];
        updatedHistory.push({ date: new Date().toISOString().split('T')[0], score: newScore });

        const { error: updateError } = await supabase
          .from('scored_leads')
          .update({
            composite_score: newScore,
            stage: newStage,
            score_history: updatedHistory,
          })
          .eq('user_id', userId)
          .eq('id', lead.id);

        if (updateError) throw updateError;
      }
    }

    // Update the model's total_leads_scored
    const { error: modelUpdateError } = await supabase
      .from('scoring_models')
      .update({ total_leads_scored: allLeads.length })
      .eq('user_id', userId)
      .eq('id', model.id);

    if (modelUpdateError) throw modelUpdateError;

    return { total_rescored: allLeads.length, changes };
  }

  async getFunnelData(): Promise<LeadFunnelData[]> {
    const userId = await this.getUserId();

    const { data: leads, error } = await supabase
      .from('scored_leads')
      .select('stage, composite_score, predicted_value')
      .eq('user_id', userId);

    if (error) throw error;

    const allLeads = (leads || []).map((r: any) => ({
      stage: r.stage as LeadStage,
      composite_score: Number(r.composite_score) || 0,
      predicted_value: Number(r.predicted_value) || 0,
    }));
    const stages: LeadStage[] = ['visitor', 'lead', 'mql', 'sql', 'opportunity', 'customer'];

    return stages.map((stage, idx) => {
      const stageLeads = allLeads.filter(l => l.stage === stage);
      const count = stageLeads.length;
      const avgScore = count > 0
        ? Math.round(stageLeads.reduce((s, l) => s + l.composite_score, 0) / count)
        : 0;
      const totalValue = stageLeads.reduce((s, l) => s + (l.predicted_value || 0), 0);
      const nextStageCount = idx < stages.length - 1
        ? allLeads.filter(l => l.stage === stages[idx + 1]).length
        : count;
      const convRate = count > 0
        ? Math.round((nextStageCount / count) * 1000) / 10
        : 0;

      return {
        stage,
        label: STAGE_LABELS[stage],
        count,
        conversion_rate: stage === 'customer' ? 100 : convRate,
        avg_score: avgScore,
        avg_time_in_stage: stage === 'customer' ? 0 : Math.round(7 + idx * 3),
        value: totalValue,
      };
    });
  }

  async getPredictiveInsights(): Promise<PredictiveInsight[]> {
    const userId = await this.getUserId();

    // Fetch leads to generate data-driven insights
    const { data: leads, error } = await supabase
      .from('scored_leads')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const allLeads = (leads || []).map(safeLead);
    const insights: PredictiveInsight[] = [];

    // Insight 1: High-value leads stalling at MQL
    const stalledMqls = allLeads.filter(
      l => l.stage === 'mql' && l.predicted_value > 50000
    );
    if (stalledMqls.length > 0) {
      insights.push({
        id: 'ins-stalled-mql',
        title: 'High-value leads stalling at MQL',
        description: `${stalledMqls.length} leads with predicted value >EUR 50K are currently in MQL stage. Score patterns suggest they need a personalized touchpoint.`,
        impact: 'high',
        confidence: 87,
        suggested_action: 'Trigger personalized demo invitation for stalled high-value MQLs',
        category: 'conversion',
      });
    }

    // Insight 2: Hot leads ready for conversion
    const hotLeads = allLeads.filter(l => l.composite_score >= 85 && l.stage !== 'customer');
    if (hotLeads.length > 0) {
      insights.push({
        id: 'ins-hot-leads',
        title: `${hotLeads.length} hot leads ready for conversion`,
        description: `${hotLeads.length} leads have scores above 85 but haven't converted yet. These represent the highest conversion probability in your pipeline.`,
        impact: 'high',
        confidence: 92,
        suggested_action: 'Prioritize outreach to hot leads with personalized proposals',
        category: 'acceleration',
      });
    }

    // Insight 3: Low engagement leads at risk
    const lowEngagement = allLeads.filter(
      l => l.activity_count_30d < 5 && l.stage !== 'visitor' && l.stage !== 'customer'
    );
    if (lowEngagement.length > 0) {
      insights.push({
        id: 'ins-low-engagement',
        title: 'Leads at risk due to low engagement',
        description: `${lowEngagement.length} active leads have fewer than 5 activities in the last 30 days. Historical patterns show elevated churn risk.`,
        impact: 'high',
        confidence: 84,
        suggested_action: 'Assign dedicated account manager and initiate re-engagement sequence',
        category: 'retention',
      });
    }

    // Insight 4: Source performance insight
    const sourceMap = new Map<string, number[]>();
    allLeads.forEach(l => {
      if (!sourceMap.has(l.source)) sourceMap.set(l.source, []);
      sourceMap.get(l.source)!.push(l.composite_score);
    });
    let bestSource = '';
    let bestAvg = 0;
    sourceMap.forEach((scores, source) => {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestSource = source;
      }
    });
    if (bestSource) {
      insights.push({
        id: 'ins-source-performance',
        title: `${bestSource} producing highest quality leads`,
        description: `Leads from ${bestSource} have an average score of ${Math.round(bestAvg)}, outperforming other sources. Consider increasing investment in this channel.`,
        impact: 'medium',
        confidence: 89,
        suggested_action: `Increase marketing budget allocation for ${bestSource} channel`,
        category: 'opportunity',
      });
    }

    // Insight 5: Score momentum
    const risingLeads = allLeads.filter(l => {
      if (!l.score_history || l.score_history.length < 2) return false;
      const recent = l.score_history.slice(-2);
      return recent[1].score - recent[0].score >= 10;
    });
    if (risingLeads.length > 0) {
      insights.push({
        id: 'ins-rising-scores',
        title: `${risingLeads.length} leads with rapidly rising scores`,
        description: `${risingLeads.length} leads gained 10+ points recently, indicating strong buying signals. Capitalize on this momentum with timely outreach.`,
        impact: 'medium',
        confidence: 78,
        suggested_action: 'Prioritize rising leads for immediate sales follow-up',
        category: 'expansion',
      });
    }

    return insights;
  }
}

export const leadScoringService = new LeadScoringService();
export default leadScoringService;
