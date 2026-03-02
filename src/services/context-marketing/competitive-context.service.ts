// src/services/competitive-context.service.ts
import { supabase } from '@/integrations/supabase/client';

export interface Competitor {
  id: string;
  user_id: string;
  competitor_name: string;
  website_url?: string;
  company_type: 'direct' | 'indirect' | 'potential' | 'substitute';
  market_share?: number;
  estimated_revenue?: number;
  employee_count?: number;
  founding_year?: number;
  headquarters_location?: string;
  key_products: any[];
  target_segments: any[];
  pricing_strategy?: string;
  strengths: any[];
  weaknesses: any[];
  opportunities: any[];
  threats: any[];
  last_analyzed?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface CompetitiveFeature {
  id: string;
  user_id: string;
  feature_name: string;
  feature_category?: string;
  our_capability?: string;
  our_score?: number;
  competitor_capabilities: { [key: string]: { capability: string; score: number } };
  importance_weight?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitiveAnalysis {
  id: string;
  user_id: string;
  analysis_type: 'porter_five_forces' | 'swot' | 'positioning' | 'feature_comparison';
  analysis_data: any;
  insights: any[];
  created_at: string;
  updated_at: string;
}

export interface CompetitiveAlert {
  id: string;
  user_id: string;
  competitor_id: string;
  alert_type: 'price_change' | 'feature_update' | 'news' | 'leadership_change' | 'funding' | 'acquisition';
  alert_data: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledged: boolean;
  created_at: string;
  competitor?: Competitor;
}

export class CompetitiveContextService {
  // Competitor Management
  async createCompetitor(competitor: Partial<Competitor>): Promise<Competitor> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('competitors')
      .insert({
        ...competitor,
        user_id: user.user.id,
        strengths: competitor.strengths || [],
        weaknesses: competitor.weaknesses || [],
        opportunities: competitor.opportunities || [],
        threats: competitor.threats || [],
        key_products: competitor.key_products || [],
        target_segments: competitor.target_segments || [],
        metadata: competitor.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCompetitor(id: string, updates: Partial<Competitor>): Promise<Competitor> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('competitors')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getCompetitors(type?: string): Promise<Competitor[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('competitors')
      .select('*')
      .eq('user_id', user.user.id)
      .order('market_share', { ascending: false, nullsFirst: false });

    if (type) {
      query = query.eq('company_type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getCompetitor(id: string): Promise<Competitor | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('competitors')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.user.id)
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCompetitor(id: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('competitors')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id);

    if (error) throw error;
  }

  // Feature Comparison
  async createFeatureComparison(feature: Partial<CompetitiveFeature>): Promise<CompetitiveFeature> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('competitive_features')
      .insert({
        ...feature,
        user_id: user.user.id,
        competitor_capabilities: feature.competitor_capabilities || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateFeatureComparison(id: string, updates: Partial<CompetitiveFeature>): Promise<CompetitiveFeature> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('competitive_features')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getFeatureComparisons(): Promise<CompetitiveFeature[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('competitive_features')
      .select('*')
      .eq('user_id', user.user.id)
      .order('importance_weight', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // SWOT Analysis
  async generateSWOT(): Promise<CompetitiveAnalysis> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all competitors
    const competitors = await this.getCompetitors();

    // Aggregate SWOT data
    const swotData = {
      our_strengths: [],
      our_weaknesses: [],
      market_opportunities: [],
      market_threats: [],
      competitor_analysis: competitors.map(c => ({
        name: c.competitor_name,
        strengths: c.strengths,
        weaknesses: c.weaknesses,
        market_share: c.market_share
      }))
    };

    // Generate insights
    const insights = this.generateSWOTInsights(competitors);

    // Save analysis
    const { data, error } = await supabase
      .from('competitive_analysis')
      .insert({
        user_id: user.user.id,
        analysis_type: 'swot',
        analysis_data: swotData,
        insights
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private generateSWOTInsights(competitors: Competitor[]): string[] {
    const insights: string[] = [];

    // Market share insights
    const totalMarketShare = competitors.reduce((sum, c) => sum + (c.market_share || 0), 0);
    if (totalMarketShare > 0) {
      const leader = competitors.reduce((prev, current) => 
        (current.market_share || 0) > (prev.market_share || 0) ? current : prev
      );
      insights.push(`${leader.competitor_name} leads with ${leader.market_share}% market share`);
    }

    // Competitive threats
    const directCompetitors = competitors.filter(c => c.company_type === 'direct');
    if (directCompetitors.length > 3) {
      insights.push(`High competitive intensity with ${directCompetitors.length} direct competitors`);
    }

    // Opportunity detection
    const weaknessPatterns = this.findCommonWeaknesses(competitors);
    if (weaknessPatterns.length > 0) {
      insights.push(`Market opportunity: Competitors struggle with ${weaknessPatterns[0]}`);
    }

    return insights;
  }

  private findCommonWeaknesses(competitors: Competitor[]): string[] {
    const weaknessCount = new Map<string, number>();
    
    competitors.forEach(c => {
      c.weaknesses.forEach(w => {
        weaknessCount.set(w, (weaknessCount.get(w) || 0) + 1);
      });
    });

    return Array.from(weaknessCount.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([weakness]) => weakness);
  }

  // Positioning Matrix
  async createPositioningMatrix(): Promise<CompetitiveAnalysis> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const competitors = await this.getCompetitors();
    const features = await this.getFeatureComparisons();

    // Calculate positioning scores
    const positioning = {
      axes: {
        x: 'price_competitiveness',
        y: 'feature_richness'
      },
      positions: competitors.map(c => ({
        competitor_id: c.id,
        name: c.competitor_name,
        x: this.calculatePriceScore(c),
        y: this.calculateFeatureScore(c, features),
        size: c.market_share || 10,
        type: c.company_type
      })),
      quadrants: {
        topRight: { label: 'Premium Leaders', description: 'High features, high price' },
        topLeft: { label: 'Value Leaders', description: 'High features, low price' },
        bottomRight: { label: 'Niche Players', description: 'Low features, high price' },
        bottomLeft: { label: 'Budget Options', description: 'Low features, low price' }
      }
    };

    const { data, error } = await supabase
      .from('competitive_analysis')
      .insert({
        user_id: user.user.id,
        analysis_type: 'positioning',
        analysis_data: positioning,
        insights: this.generatePositioningInsights(positioning)
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private calculatePriceScore(competitor: Competitor): number {
    // Simplified price scoring - in real implementation, would use actual pricing data
    const strategies = {
      'premium': 80,
      'competitive': 50,
      'budget': 20,
      'freemium': 30
    };
    return strategies[competitor.pricing_strategy as keyof typeof strategies] || 50;
  }

  private calculateFeatureScore(competitor: Competitor, features: CompetitiveFeature[]): number {
    if (features.length === 0) return 50;

    let totalScore = 0;
    let totalWeight = 0;

    features.forEach(f => {
      const competitorCapability = f.competitor_capabilities[competitor.id];
      if (competitorCapability) {
        totalScore += competitorCapability.score * (f.importance_weight || 3);
        totalWeight += (f.importance_weight || 3);
      }
    });

    return totalWeight > 0 ? (totalScore / totalWeight) * 10 : 50;
  }

  private generatePositioningInsights(positioning: any): string[] {
    const insights: string[] = [];
    const positions = positioning.positions;

    // Find leaders
    const leaders = positions.filter((p: any) => p.x > 60 && p.y > 60);
    if (leaders.length > 0) {
      insights.push(`Premium leaders: ${leaders.map((l: any) => l.name).join(', ')}`);
    }

    // Find value players
    const valueLeaders = positions.filter((p: any) => p.x < 40 && p.y > 60);
    if (valueLeaders.length > 0) {
      insights.push(`Value disruption threat from: ${valueLeaders.map((l: any) => l.name).join(', ')}`);
    }

    return insights;
  }

  // Competitive Alerts
  async getAlerts(unacknowledgedOnly = false): Promise<CompetitiveAlert[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('competitive_alerts')
      .select(`
        *,
        competitor:competitors (
          id,
          competitor_name,
          company_type
        )
      `)
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (unacknowledgedOnly) {
      query = query.eq('acknowledged', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('competitive_alerts')
      .update({ acknowledged: true })
      .eq('id', alertId)
      .eq('user_id', user.user.id);

    if (error) throw error;
  }

  async createAlert(alert: Partial<CompetitiveAlert>): Promise<CompetitiveAlert> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('competitive_alerts')
      .insert({
        ...alert,
        user_id: user.user.id,
        acknowledged: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Battle Cards
  async generateBattleCard(competitorId: string): Promise<any> {
    const competitor = await this.getCompetitor(competitorId);
    if (!competitor) throw new Error('Competitor not found');

    const features = await this.getFeatureComparisons();

    const battleCard = {
      competitor: competitor.competitor_name,
      updated: new Date().toISOString(),
      summary: {
        type: competitor.company_type,
        market_share: competitor.market_share,
        employees: competitor.employee_count,
        founded: competitor.founding_year
      },
      our_advantages: this.identifyAdvantages(competitor, features),
      their_advantages: this.identifyTheirAdvantages(competitor, features),
      win_strategies: this.generateWinStrategies(competitor),
      objection_handling: this.generateObjectionHandling(competitor),
      key_differentiators: this.identifyKeyDifferentiators(competitor, features)
    };

    return battleCard;
  }

  private identifyAdvantages(competitor: Competitor, features: CompetitiveFeature[]): string[] {
    const advantages: string[] = [];

    features.forEach(f => {
      const theirScore = f.competitor_capabilities[competitor.id]?.score || 0;
      const ourScore = f.our_score || 0;
      
      if (ourScore > theirScore && f.importance_weight && f.importance_weight >= 4) {
        advantages.push(`Superior ${f.feature_name} (${ourScore}/10 vs ${theirScore}/10)`);
      }
    });

    return advantages;
  }

  private identifyTheirAdvantages(competitor: Competitor, features: CompetitiveFeature[]): string[] {
    const advantages: string[] = [];

    features.forEach(f => {
      const theirScore = f.competitor_capabilities[competitor.id]?.score || 0;
      const ourScore = f.our_score || 0;
      
      if (theirScore > ourScore) {
        advantages.push(`${f.feature_name} (${theirScore}/10 vs our ${ourScore}/10)`);
      }
    });

    if (competitor.market_share && competitor.market_share > 20) {
      advantages.push(`Market leader with ${competitor.market_share}% share`);
    }

    return advantages;
  }

  private generateWinStrategies(competitor: Competitor): string[] {
    const strategies: string[] = [];

    if (competitor.company_type === 'direct') {
      strategies.push('Focus on unique value propositions not offered by competitor');
    }

    if (competitor.pricing_strategy === 'premium') {
      strategies.push('Emphasize value and ROI over price');
    } else if (competitor.pricing_strategy === 'budget') {
      strategies.push('Highlight quality and long-term benefits');
    }

    competitor.weaknesses.forEach(weakness => {
      strategies.push(`Exploit weakness: ${weakness}`);
    });

    return strategies;
  }

  private generateObjectionHandling(competitor: Competitor): { objection: string; response: string }[] {
    const objections = [];

    if (competitor.market_share && competitor.market_share > 30) {
      objections.push({
        objection: `Why not go with ${competitor.competitor_name}? They're the market leader.`,
        response: 'Market leaders often become complacent. We offer more innovative solutions and personalized support.'
      });
    }

    if (competitor.pricing_strategy === 'budget') {
      objections.push({
        objection: `${competitor.competitor_name} is cheaper`,
        response: 'True value comes from results, not just price. Our solution delivers superior ROI through [specific benefits].'
      });
    }

    return objections;
  }

  private identifyKeyDifferentiators(competitor: Competitor, features: CompetitiveFeature[]): string[] {
    const differentiators: string[] = [];

    // Find features where we excel
    features
      .filter(f => {
        const ourScore = f.our_score || 0;
        const theirScore = f.competitor_capabilities[competitor.id]?.score || 0;
        return ourScore >= 8 && ourScore > theirScore + 2;
      })
      .forEach(f => {
        differentiators.push(f.feature_name);
      });

    return differentiators;
  }

  // Win/Loss Analysis
  async getWinLossAnalysis(): Promise<any> {
    const competitors = await this.getCompetitors();
    const features = await this.getFeatureComparisons();

    const analysis = {
      overall_competitiveness: this.calculateOverallCompetitiveness(features),
      key_battlegrounds: this.identifyKeyBattlegrounds(features, competitors),
      competitive_gaps: this.identifyCompetitiveGaps(features, competitors),
      recommendations: this.generateCompetitiveRecommendations(features, competitors)
    };

    return analysis;
  }

  private calculateOverallCompetitiveness(features: CompetitiveFeature[]): number {
    if (features.length === 0) return 50;

    const avgOurScore = features.reduce((sum, f) => sum + (f.our_score || 0), 0) / features.length;
    return Math.round(avgOurScore * 10);
  }

  private identifyKeyBattlegrounds(features: CompetitiveFeature[], competitors: Competitor[]): any[] {
    return features
      .filter(f => f.importance_weight && f.importance_weight >= 4)
      .map(f => {
        const competitorScores = competitors.map(c => ({
          name: c.competitor_name,
          score: f.competitor_capabilities[c.id]?.score || 0
        }));

        return {
          feature: f.feature_name,
          importance: f.importance_weight,
          our_score: f.our_score,
          competitor_average: competitorScores.reduce((sum, c) => sum + c.score, 0) / competitorScores.length,
          status: f.our_score! > 7 ? 'winning' : f.our_score! > 5 ? 'competitive' : 'losing'
        };
      });
  }

  private identifyCompetitiveGaps(features: CompetitiveFeature[], competitors: Competitor[]): any[] {
    const gaps: any[] = [];

    features.forEach(f => {
      const maxCompetitorScore = Math.max(
        ...competitors.map(c => f.competitor_capabilities[c.id]?.score || 0)
      );

      if (maxCompetitorScore > (f.our_score || 0) + 2) {
        gaps.push({
          feature: f.feature_name,
          gap: maxCompetitorScore - (f.our_score || 0),
          leader: competitors.find(c => 
            f.competitor_capabilities[c.id]?.score === maxCompetitorScore
          )?.competitor_name
        });
      }
    });

    return gaps.sort((a, b) => b.gap - a.gap);
  }

  private generateCompetitiveRecommendations(features: CompetitiveFeature[], competitors: Competitor[]): string[] {
    const recommendations: string[] = [];
    const gaps = this.identifyCompetitiveGaps(features, competitors);

    if (gaps.length > 0) {
      recommendations.push(`Priority: Close feature gap in ${gaps[0].feature} (${gaps[0].gap} points behind ${gaps[0].leader})`);
    }

    const directCompetitors = competitors.filter(c => c.company_type === 'direct');
    if (directCompetitors.length > 3) {
      recommendations.push('Consider differentiation strategy to stand out in crowded market');
    }

    const avgOurScore = features.reduce((sum, f) => sum + (f.our_score || 0), 0) / features.length;
    if (avgOurScore < 6) {
      recommendations.push('Overall product competitiveness needs improvement across multiple features');
    }

    return recommendations;
  }
}

export const competitiveContextService = new CompetitiveContextService();