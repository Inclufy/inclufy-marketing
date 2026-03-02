// src/services/context-marketing/pattern-recognition.service.ts
import { supabase } from '@/integrations/supabase/client';
import { businessContextService } from './business-context.service';
import { productContextService } from './product-context.service';
import { competitiveContextService } from './competitive-context.service';

export interface PatternDefinition {
  id: string;
  user_id: string;
  pattern_name: string;
  pattern_type: 'behavioral' | 'temporal' | 'correlational' | 'anomaly' | 'trend' | 'cyclical' | 'causal' | 'comparative';
  domain: 'business' | 'product' | 'competitive' | 'market' | 'audience' | 'content' | 'cross_domain';
  detection_rules: any;
  threshold_config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DetectedPattern {
  id: string;
  user_id: string;
  pattern_definition_id?: string;
  pattern_type: string;
  domain: string;
  pattern_name: string;
  pattern_description?: string;
  confidence_score?: number;
  impact_level?: 'low' | 'medium' | 'high' | 'critical';
  data_points: any[];
  time_range: any;
  affected_entities: any[];
  status: 'active' | 'resolved' | 'monitoring' | 'archived';
  first_detected: string;
  last_observed: string;
  metadata?: any;
  created_at: string;
}

export interface PatternCorrelation {
  id: string;
  user_id: string;
  pattern_a_id: string;
  pattern_b_id: string;
  correlation_type: 'causal' | 'temporal' | 'inverse' | 'reinforcing' | 'neutral';
  correlation_strength: number;
  confidence_level: number;
  analysis_data: any;
  created_at: string;
}

export interface Insight {
  id: string;
  user_id: string;
  insight_type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'recommendation' | 'prediction' | 'optimization';
  category: 'strategic' | 'tactical' | 'operational' | 'competitive' | 'market' | 'product' | 'customer' | 'content';
  title: string;
  description: string;
  key_finding: string;
  impact_score?: number;
  urgency?: 'immediate' | 'high' | 'medium' | 'low';
  confidence_level?: number;
  supporting_patterns: string[];
  data_sources: any[];
  evidence: any[];
  status: 'new' | 'reviewed' | 'accepted' | 'implemented' | 'dismissed';
  reviewed_at?: string;
  actioned_at?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface InsightRecommendation {
  id: string;
  insight_id: string;
  user_id: string;
  recommendation_type: 'action' | 'strategy' | 'content' | 'campaign' | 'product' | 'pricing' | 'positioning';
  title: string;
  description: string;
  expected_impact?: string;
  implementation_effort?: 'low' | 'medium' | 'high';
  action_steps: any[];
  resources_required: any[];
  timeline?: string;
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ContentPrediction {
  id: string;
  user_id: string;
  content_type: 'blog' | 'email' | 'social' | 'ad' | 'landing_page' | 'presentation' | 'whitepaper' | 'case_study';
  content_topic?: string;
  target_audience?: string;
  predicted_engagement?: number;
  predicted_conversion?: number;
  predicted_reach?: number;
  confidence_scores: any;
  positive_factors: any[];
  negative_factors: any[];
  optimization_suggestions: any[];
  context_factors: any;
  patterns_applied: string[];
  created_at: string;
}

export interface PatternDetectionRun {
  id: string;
  user_id: string;
  run_type: 'scheduled' | 'manual' | 'triggered';
  domains_analyzed: string[];
  patterns_detected: number;
  insights_generated: number;
  anomalies_found: number;
  processing_time_ms?: number;
  data_points_analyzed?: number;
  status: 'running' | 'completed' | 'failed';
  error_details?: any;
  started_at: string;
  completed_at?: string;
}

export class PatternRecognitionService {
  // Pattern Definitions Management
  async getPatternDefinitions(domain?: string): Promise<PatternDefinition[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('pattern_definitions')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('is_active', true);

    if (domain) {
      query = query.eq('domain', domain);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async activatePattern(patternId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('pattern_definitions')
      .update({ is_active: true })
      .eq('id', patternId)
      .eq('user_id', user.user.id);

    if (error) throw error;
  }

  // Pattern Detection
  async runPatternDetection(domains: string[] = ['all']): Promise<PatternDetectionRun> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Create detection run record
    const { data: run, error: runError } = await supabase
      .from('pattern_detection_runs')
      .insert({
        user_id: user.user.id,
        run_type: 'manual',
        domains_analyzed: domains,
        status: 'running'
      })
      .select()
      .single();

    if (runError) throw runError;

    try {
      // Run detection logic
      const startTime = Date.now();
      const results = await this.detectPatterns(domains);
      const processingTime = Date.now() - startTime;

      // Update run with results
      const { error: updateError } = await supabase
        .from('pattern_detection_runs')
        .update({
          patterns_detected: results.patterns.length,
          insights_generated: results.insights.length,
          anomalies_found: results.anomalies.length,
          processing_time_ms: processingTime,
          data_points_analyzed: results.dataPointsAnalyzed,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id);

      if (updateError) throw updateError;
      
      return { ...run, ...results };
    } catch (error) {
      // Update run with error
      await supabase
        .from('pattern_detection_runs')
        .update({
          status: 'failed',
          error_details: { message: error.message },
          completed_at: new Date().toISOString()
        })
        .eq('id', run.id);

      throw error;
    }
  }

  private async detectPatterns(domains: string[]) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const patterns: DetectedPattern[] = [];
    const insights: Insight[] = [];
    const anomalies: DetectedPattern[] = [];
    let dataPointsAnalyzed = 0;

    // Get all context data
    const [businessContext, productContext, competitiveData] = await Promise.all([
      businessContextService.getCompleteContext(),
      productContextService.getCompleteContext(),
      this.getCompetitiveContext()
    ]);

    // Analyze business patterns
    if (domains.includes('all') || domains.includes('business')) {
      const businessPatterns = await this.analyzeBusinessPatterns(businessContext);
      patterns.push(...businessPatterns.patterns);
      dataPointsAnalyzed += businessPatterns.dataPoints;
    }

    // Analyze product patterns
    if (domains.includes('all') || domains.includes('product')) {
      const productPatterns = await this.analyzeProductPatterns(productContext);
      patterns.push(...productPatterns.patterns);
      dataPointsAnalyzed += productPatterns.dataPoints;
    }

    // Analyze competitive patterns
    if (domains.includes('all') || domains.includes('competitive')) {
      const competitivePatterns = await this.analyzeCompetitivePatterns(competitiveData);
      patterns.push(...competitivePatterns.patterns);
      anomalies.push(...competitivePatterns.anomalies);
      dataPointsAnalyzed += competitivePatterns.dataPoints;
    }

    // Find cross-domain correlations
    const correlations = await this.findPatternCorrelations(patterns);

    // Generate insights from patterns
    const generatedInsights = await this.generateInsights(patterns, correlations);
    insights.push(...generatedInsights);

    // Save all detected patterns and insights
    await this.saveDetectedPatterns(patterns);
    await this.saveInsights(insights);
    await this.saveCorrelations(correlations);

    return {
      patterns,
      insights,
      anomalies,
      correlations,
      dataPointsAnalyzed
    };
  }

  private async getCompetitiveContext() {
    const [competitors, features, alerts] = await Promise.all([
      competitiveContextService.getCompetitors(),
      competitiveContextService.getFeatureComparisons(),
      competitiveContextService.getAlerts()
    ]);

    return { competitors, features, alerts };
  }

  private async analyzeBusinessPatterns(context: any) {
    const patterns: DetectedPattern[] = [];
    let dataPoints = 0;

    // Analyze objective achievement patterns
    if (context.objectives && context.objectives.length > 0) {
      dataPoints += context.objectives.length;

      // Find at-risk objectives pattern
      const atRiskObjectives = context.objectives.filter(o => o.status === 'at_risk' || o.status === 'behind');
      if (atRiskObjectives.length > context.objectives.length * 0.3) {
        patterns.push({
          id: crypto.randomUUID(),
          user_id: '',
          pattern_type: 'risk',
          domain: 'business',
          pattern_name: 'High Risk Objectives',
          pattern_description: `${atRiskObjectives.length} of ${context.objectives.length} strategic objectives are at risk`,
          confidence_score: 95,
          impact_level: 'high',
          data_points: atRiskObjectives.map(o => ({
            objective: o.objective_name,
            status: o.status,
            target_date: o.target_date
          })),
          time_range: {},
          affected_entities: atRiskObjectives.map(o => o.id),
          status: 'active',
          first_detected: new Date().toISOString(),
          last_observed: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }

      // Find overachievement pattern
      const overachieving = context.objectives.filter(o => 
        o.current_value && o.target_value && 
        parseFloat(o.current_value) > parseFloat(o.target_value) * 1.2
      );
      if (overachieving.length > 0) {
        patterns.push({
          id: crypto.randomUUID(),
          user_id: '',
          pattern_type: 'opportunity',
          domain: 'business',
          pattern_name: 'Overachievement Opportunity',
          pattern_description: `${overachieving.length} objectives exceeding targets by 20%+`,
          confidence_score: 90,
          impact_level: 'medium',
          data_points: overachieving.map(o => ({
            objective: o.objective_name,
            current: o.current_value,
            target: o.target_value,
            percentage: ((parseFloat(o.current_value) / parseFloat(o.target_value) - 1) * 100).toFixed(1)
          })),
          time_range: {},
          affected_entities: overachieving.map(o => o.id),
          status: 'active',
          first_detected: new Date().toISOString(),
          last_observed: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }
    }

    return { patterns, dataPoints };
  }

  private async analyzeProductPatterns(context: any) {
    const patterns: DetectedPattern[] = [];
    let dataPoints = 0;

    // Analyze product lifecycle patterns
    if (context.products && context.products.length > 0) {
      dataPoints += context.products.length;

      // Find deprecated products pattern
      const deprecatedProducts = context.products.filter(p => p.status === 'deprecated');
      if (deprecatedProducts.length > 0) {
        patterns.push({
          id: crypto.randomUUID(),
          user_id: '',
          pattern_type: 'trend',
          domain: 'product',
          pattern_name: 'Product Sunset Trend',
          pattern_description: `${deprecatedProducts.length} products in deprecation phase`,
          confidence_score: 100,
          impact_level: 'medium',
          data_points: deprecatedProducts.map(p => ({
            product: p.product_name,
            sunset_date: p.sunset_date,
            type: p.product_type
          })),
          time_range: {},
          affected_entities: deprecatedProducts.map(p => p.id),
          status: 'active',
          first_detected: new Date().toISOString(),
          last_observed: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }
    }

    // Analyze roadmap patterns
    if (context.roadmapItems && context.roadmapItems.length > 0) {
      dataPoints += context.roadmapItems.length;

      // Find delayed features pattern
      const delayedFeatures = context.roadmapItems.filter(r => 
        r.status === 'in_progress' && 
        r.target_release && 
        new Date(r.target_release) < new Date()
      );

      if (delayedFeatures.length > context.roadmapItems.length * 0.2) {
        patterns.push({
          id: crypto.randomUUID(),
          user_id: '',
          pattern_type: 'anomaly',
          domain: 'product',
          pattern_name: 'Roadmap Delays Pattern',
          pattern_description: `${delayedFeatures.length} features past target release date`,
          confidence_score: 95,
          impact_level: 'high',
          data_points: delayedFeatures.map(f => ({
            feature: f.feature_name,
            target: f.target_release,
            delay_days: Math.floor((new Date().getTime() - new Date(f.target_release).getTime()) / (1000 * 60 * 60 * 24))
          })),
          time_range: {},
          affected_entities: delayedFeatures.map(f => f.id),
          status: 'active',
          first_detected: new Date().toISOString(),
          last_observed: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }
    }

    return { patterns, dataPoints };
  }

  private async analyzeCompetitivePatterns(context: any) {
    const patterns: DetectedPattern[] = [];
    const anomalies: DetectedPattern[] = [];
    let dataPoints = 0;

    // Analyze competitor patterns
    if (context.competitors && context.competitors.length > 0) {
      dataPoints += context.competitors.length;

      // Find market concentration pattern
      const totalMarketShare = context.competitors.reduce((sum, c) => sum + (c.market_share || 0), 0);
      const topCompetitors = context.competitors
        .filter(c => c.market_share)
        .sort((a, b) => (b.market_share || 0) - (a.market_share || 0))
        .slice(0, 3);

      if (topCompetitors.length > 0) {
        const topThreeShare = topCompetitors.reduce((sum, c) => sum + (c.market_share || 0), 0);
        if (topThreeShare > totalMarketShare * 0.7) {
          patterns.push({
            id: crypto.randomUUID(),
            user_id: '',
            pattern_type: 'trend',
            domain: 'competitive',
            pattern_name: 'Market Concentration',
            pattern_description: `Top 3 competitors control ${topThreeShare}% of tracked market`,
            confidence_score: 85,
            impact_level: 'high',
            data_points: topCompetitors.map(c => ({
              competitor: c.competitor_name,
              market_share: c.market_share,
              type: c.company_type
            })),
            time_range: {},
            affected_entities: topCompetitors.map(c => c.id),
            status: 'active',
            first_detected: new Date().toISOString(),
            last_observed: new Date().toISOString(),
            created_at: new Date().toISOString()
          });
        }
      }

      // Find new competitor threats
      const recentCompetitors = context.competitors.filter(c => {
        const daysSinceAdded = Math.floor(
          (new Date().getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysSinceAdded < 30 && c.company_type === 'direct';
      });

      if (recentCompetitors.length > 0) {
        anomalies.push({
          id: crypto.randomUUID(),
          user_id: '',
          pattern_type: 'anomaly',
          domain: 'competitive',
          pattern_name: 'New Direct Competitors',
          pattern_description: `${recentCompetitors.length} new direct competitors in last 30 days`,
          confidence_score: 100,
          impact_level: 'medium',
          data_points: recentCompetitors.map(c => ({
            competitor: c.competitor_name,
            added: c.created_at,
            strengths: c.strengths.length
          })),
          time_range: { days: 30 },
          affected_entities: recentCompetitors.map(c => c.id),
          status: 'active',
          first_detected: new Date().toISOString(),
          last_observed: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }
    }

    // Analyze feature comparison patterns
    if (context.features && context.features.length > 0) {
      dataPoints += context.features.length;

      // Find competitive gaps
      const weakFeatures = context.features.filter(f => {
        if (!f.our_score) return false;
        const avgCompetitorScore = Object.values(f.competitor_capabilities || {})
          .reduce((sum: number, cap: any) => sum + (cap.score || 0), 0) / 
          Object.keys(f.competitor_capabilities || {}).length;
        return avgCompetitorScore > f.our_score + 2;
      });

      if (weakFeatures.length > 0) {
        patterns.push({
          id: crypto.randomUUID(),
          user_id: '',
          pattern_type: 'risk',
          domain: 'competitive',
          pattern_name: 'Competitive Feature Gaps',
          pattern_description: `Falling behind on ${weakFeatures.length} key features`,
          confidence_score: 90,
          impact_level: 'high',
          data_points: weakFeatures.map(f => ({
            feature: f.feature_name,
            our_score: f.our_score,
            importance: f.importance_weight,
            gap: 'behind'
          })),
          time_range: {},
          affected_entities: weakFeatures.map(f => f.id),
          status: 'active',
          first_detected: new Date().toISOString(),
          last_observed: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }
    }

    return { patterns, anomalies, dataPoints };
  }

  private async findPatternCorrelations(patterns: DetectedPattern[]): Promise<PatternCorrelation[]> {
    const correlations: PatternCorrelation[] = [];

    // Find correlations between patterns
    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        const patternA = patterns[i];
        const patternB = patterns[j];

        // Check for temporal correlation (patterns occurring around same time)
        const timeDiff = Math.abs(
          new Date(patternA.first_detected).getTime() - 
          new Date(patternB.first_detected).getTime()
        );
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

        if (daysDiff < 7) {
          correlations.push({
            id: crypto.randomUUID(),
            user_id: '',
            pattern_a_id: patternA.id,
            pattern_b_id: patternB.id,
            correlation_type: 'temporal',
            correlation_strength: 1 - (daysDiff / 7),
            confidence_level: 80,
            analysis_data: {
              time_difference_days: daysDiff,
              pattern_a: patternA.pattern_name,
              pattern_b: patternB.pattern_name
            },
            created_at: new Date().toISOString()
          });
        }

        // Check for causal relationships
        if (
          patternA.domain === 'product' && 
          patternA.pattern_type === 'anomaly' &&
          patternB.domain === 'business' && 
          patternB.pattern_type === 'risk'
        ) {
          correlations.push({
            id: crypto.randomUUID(),
            user_id: '',
            pattern_a_id: patternA.id,
            pattern_b_id: patternB.id,
            correlation_type: 'causal',
            correlation_strength: 0.75,
            confidence_level: 70,
            analysis_data: {
              hypothesis: 'Product delays may be causing business objective risks'
            },
            created_at: new Date().toISOString()
          });
        }
      }
    }

    return correlations;
  }

  private async generateInsights(
    patterns: DetectedPattern[], 
    correlations: PatternCorrelation[]
  ): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Generate insights from patterns
    for (const pattern of patterns) {
      if (pattern.impact_level === 'high' || pattern.impact_level === 'critical') {
        const insight = await this.createInsightFromPattern(pattern, correlations);
        if (insight) insights.push(insight);
      }
    }

    // Generate cross-domain insights from correlations
    for (const correlation of correlations) {
      if (correlation.correlation_strength > 0.7) {
        const insight = await this.createInsightFromCorrelation(correlation, patterns);
        if (insight) insights.push(insight);
      }
    }

    return insights;
  }

  private async createInsightFromPattern(
    pattern: DetectedPattern,
    correlations: PatternCorrelation[]
  ): Promise<Insight | null> {
    const relatedCorrelations = correlations.filter(
      c => c.pattern_a_id === pattern.id || c.pattern_b_id === pattern.id
    );

    let insight: Partial<Insight> | null = null;

    switch (pattern.pattern_name) {
      case 'High Risk Objectives':
        insight = {
          insight_type: 'risk',
          category: 'strategic',
          title: 'Strategic Objectives at Risk',
          description: 'Multiple strategic objectives are falling behind targets, indicating potential execution challenges.',
          key_finding: pattern.pattern_description || '',
          impact_score: 85,
          urgency: 'high',
          confidence_level: pattern.confidence_score,
          supporting_patterns: [pattern.id],
          data_sources: ['strategic_objectives'],
          evidence: pattern.data_points
        };
        break;

      case 'Competitive Feature Gaps':
        insight = {
          insight_type: 'risk',
          category: 'competitive',
          title: 'Falling Behind on Key Features',
          description: 'Competitor analysis reveals significant gaps in critical product features.',
          key_finding: pattern.pattern_description || '',
          impact_score: 90,
          urgency: 'high',
          confidence_level: pattern.confidence_score,
          supporting_patterns: [pattern.id],
          data_sources: ['competitive_features'],
          evidence: pattern.data_points
        };
        break;

      case 'Roadmap Delays Pattern':
        insight = {
          insight_type: 'anomaly',
          category: 'product',
          title: 'Systematic Product Delivery Delays',
          description: 'Product roadmap experiencing consistent delays across multiple features.',
          key_finding: pattern.pattern_description || '',
          impact_score: 75,
          urgency: 'medium',
          confidence_level: pattern.confidence_score,
          supporting_patterns: [pattern.id],
          data_sources: ['product_roadmap'],
          evidence: pattern.data_points
        };
        break;

      case 'Market Concentration':
        insight = {
          insight_type: 'trend',
          category: 'market',
          title: 'High Market Concentration Risk',
          description: 'Market is dominated by few players, creating both risk and opportunity.',
          key_finding: pattern.pattern_description || '',
          impact_score: 80,
          urgency: 'medium',
          confidence_level: pattern.confidence_score,
          supporting_patterns: [pattern.id],
          data_sources: ['competitors'],
          evidence: pattern.data_points
        };
        break;
    }

    if (!insight) return null;

    return {
      id: crypto.randomUUID(),
      user_id: '',
      ...insight,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as Insight;
  }

  private async createInsightFromCorrelation(
    correlation: PatternCorrelation,
    patterns: DetectedPattern[]
  ): Promise<Insight | null> {
    const patternA = patterns.find(p => p.id === correlation.pattern_a_id);
    const patternB = patterns.find(p => p.id === correlation.pattern_b_id);

    if (!patternA || !patternB) return null;

    if (correlation.correlation_type === 'causal' && correlation.correlation_strength > 0.7) {
      return {
        id: crypto.randomUUID(),
        user_id: '',
        insight_type: 'recommendation',
        category: 'operational',
        title: 'Cross-Domain Impact Detected',
        description: `Strong correlation found between ${patternA.pattern_name} and ${patternB.pattern_name}`,
        key_finding: `Addressing ${patternA.domain} issues may improve ${patternB.domain} performance`,
        impact_score: 85,
        urgency: 'high',
        confidence_level: correlation.confidence_level,
        supporting_patterns: [patternA.id, patternB.id],
        data_sources: [patternA.domain, patternB.domain],
        evidence: [correlation.analysis_data],
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    return null;
  }

  // Save methods
  private async saveDetectedPatterns(patterns: DetectedPattern[]): Promise<void> {
    if (patterns.length === 0) return;

    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const patternsWithUserId = patterns.map(p => ({
      ...p,
      user_id: user.user.id
    }));

    const { error } = await supabase
      .from('detected_patterns')
      .insert(patternsWithUserId);

    if (error) throw error;
  }

  private async saveInsights(insights: Insight[]): Promise<void> {
    if (insights.length === 0) return;

    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const insightsWithUserId = insights.map(i => ({
      ...i,
      user_id: user.user.id
    }));

    const { error } = await supabase
      .from('insights')
      .insert(insightsWithUserId);

    if (error) throw error;
  }

  private async saveCorrelations(correlations: PatternCorrelation[]): Promise<void> {
    if (correlations.length === 0) return;

    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const correlationsWithUserId = correlations.map(c => ({
      ...c,
      user_id: user.user.id
    }));

    const { error } = await supabase
      .from('pattern_correlations')
      .insert(correlationsWithUserId);

    if (error) throw error;
  }

  // Retrieve methods
  async getDetectedPatterns(
    domain?: string,
    status: string = 'active'
  ): Promise<DetectedPattern[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('detected_patterns')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('status', status);

    if (domain) {
      query = query.eq('domain', domain);
    }

    const { data, error } = await query.order('confidence_score', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async getInsights(
    category?: string,
    status: string = 'new'
  ): Promise<Insight[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.user.id);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query
      .order('impact_score', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async updateInsightStatus(
    insightId: string,
    status: Insight['status']
  ): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updates: any = { status };
    
    if (status === 'reviewed') {
      updates.reviewed_at = new Date().toISOString();
    } else if (status === 'implemented') {
      updates.actioned_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('insights')
      .update(updates)
      .eq('id', insightId)
      .eq('user_id', user.user.id);

    if (error) throw error;
  }

  // Content Intelligence
  async predictContentPerformance(
    contentType: ContentPrediction['content_type'],
    topic: string,
    targetAudience?: string
  ): Promise<ContentPrediction> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get relevant patterns and insights
    const [patterns, insights] = await Promise.all([
      this.getDetectedPatterns('content'),
      this.getInsights('content')
    ]);

    // Simple prediction logic (in real implementation, this would use ML)
    const prediction: Partial<ContentPrediction> = {
      content_type: contentType,
      content_topic: topic,
      target_audience: targetAudience,
      predicted_engagement: Math.random() * 100,
      predicted_conversion: Math.random() * 30,
      predicted_reach: Math.floor(Math.random() * 10000) + 1000,
      confidence_scores: {
        engagement: 75,
        conversion: 65,
        reach: 80
      },
      positive_factors: [],
      negative_factors: [],
      optimization_suggestions: [],
      patterns_applied: patterns.map(p => p.id)
    };

    // Add factors based on patterns
    if (patterns.length > 0) {
      prediction.positive_factors = ['Historical pattern match found', 'Topic trending upward'];
    }

    // Add optimization suggestions
    prediction.optimization_suggestions = [
      'Optimal posting time: Tuesday 10 AM',
      'Recommended length: 1,200-1,500 words',
      'Include 2-3 visuals for better engagement'
    ];

    // Save prediction
    const { data, error } = await supabase
      .from('content_predictions')
      .insert({
        ...prediction,
        user_id: user.user.id,
        context_factors: {},
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get pattern detection history
  async getDetectionRuns(limit: number = 10): Promise<PatternDetectionRun[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('pattern_detection_runs')
      .select('*')
      .eq('user_id', user.user.id)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // Generate recommendations from insights
  async generateRecommendations(insightId: string): Promise<InsightRecommendation[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the insight
    const { data: insight, error: insightError } = await supabase
      .from('insights')
      .select('*')
      .eq('id', insightId)
      .eq('user_id', user.user.id)
      .single();

    if (insightError) throw insightError;
    if (!insight) throw new Error('Insight not found');

    const recommendations: Partial<InsightRecommendation>[] = [];

    // Generate recommendations based on insight type
    switch (insight.insight_type) {
      case 'risk':
        recommendations.push({
          recommendation_type: 'action',
          title: 'Immediate Risk Mitigation',
          description: `Address the identified risk: ${insight.key_finding}`,
          expected_impact: 'Reduce risk exposure by 40-60%',
          implementation_effort: 'medium',
          action_steps: [
            'Conduct detailed risk assessment',
            'Identify root causes',
            'Implement corrective measures',
            'Monitor progress weekly'
          ],
          resources_required: ['Project manager', 'Domain expert', 'Analytics tools'],
          timeline: '2-4 weeks'
        });
        break;

      case 'opportunity':
        recommendations.push({
          recommendation_type: 'strategy',
          title: 'Capitalize on Opportunity',
          description: `Leverage the identified opportunity: ${insight.key_finding}`,
          expected_impact: 'Potential 20-30% improvement in KPIs',
          implementation_effort: 'high',
          action_steps: [
            'Develop opportunity exploitation plan',
            'Allocate necessary resources',
            'Set measurable goals',
            'Track implementation'
          ],
          resources_required: ['Strategic planning team', 'Budget allocation', 'Executive sponsorship'],
          timeline: '4-8 weeks'
        });
        break;

      case 'anomaly':
        recommendations.push({
          recommendation_type: 'action',
          title: 'Investigate Anomaly',
          description: `Deep dive into the detected anomaly: ${insight.key_finding}`,
          expected_impact: 'Prevent potential issues',
          implementation_effort: 'low',
          action_steps: [
            'Gather additional data',
            'Analyze root causes',
            'Document findings',
            'Implement monitoring'
          ],
          resources_required: ['Data analyst', 'Domain expert'],
          timeline: '1-2 weeks'
        });
        break;
    }

    // Save recommendations
    const recommendationsWithIds = recommendations.map(r => ({
      ...r,
      id: crypto.randomUUID(),
      insight_id: insightId,
      user_id: user.user.id,
      status: 'proposed' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('insight_recommendations')
      .insert(recommendationsWithIds)
      .select();

    if (error) throw error;
    return data || [];
  }
}

export const patternRecognitionService = new PatternRecognitionService();