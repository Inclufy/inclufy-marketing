// src/services/context-marketing/phase6-integration.service.ts
import { businessContextService } from './business-context.service';
import { productContextService as productCatalogService } from './product-context.service';
import { competitiveContextService as competitiveIntelligenceService } from './competitive-context.service';
import { patternRecognitionService } from './pattern-recognition.service';
import { insightsService } from './insights.service';
import automationService from './automation.service';
import aiAssistantService from './ai-assistant.service';
import recommendationsService from './recommendations.service';
import contentGenerationService from './content-generation.service';
import strategicPlanningService from './strategic-planning.service';

// Type definitions for integrated context
export interface IntegratedMarketingContext {
  business: {
    company: any;
    goals: any[];
    metrics: any[];
    team: any[];
  };
  products: {
    catalog: any[];
    features: any[];
    pricing: any[];
  };
  competitive: {
    competitors: any[];
    market_position: any;
    opportunities: any[];
    threats: any[];
  };
  patterns: {
    detected_patterns: any[];
    anomalies: any[];
    trends: any[];
  };
  insights: {
    active_insights: any[];
    recommendations: any[];
    predictions: any[];
  };
  automations: {
    active_rules: any[];
    performance: any;
  };
  performance: {
    campaigns: any[];
    content: any[];
    conversions: any;
  };
}

export interface AIContextEnrichment {
  relevant_data: any[];
  suggested_actions: any[];
  historical_context: any;
  predictive_insights: any;
}

// Service implementation
class Phase6IntegrationService {
  // Get comprehensive marketing context for AI
  async getIntegratedContext(userId: string): Promise<IntegratedMarketingContext> {
    try {
      // Gather data from all phases in parallel
      const [
        businessData,
        productData,
        competitiveData,
        patterns,
        insights,
        automations
      ] = await Promise.all([
        this.getBusinessContext(userId),
        this.getProductContext(userId),
        this.getCompetitiveContext(userId),
        this.getPatternContext(userId),
        this.getInsightContext(userId),
        this.getAutomationContext(userId)
      ]);

      return {
        business: businessData,
        products: productData,
        competitive: competitiveData,
        patterns,
        insights,
        automations,
        performance: await this.getPerformanceContext(userId)
      };
    } catch (error) {
      console.error('Error getting integrated context:', error);
      throw error;
    }
  }

  // Phase 1: Business Context Integration
  private async getBusinessContext(userId: string) {
    const [company, goals, kpis, team] = await Promise.all([
      businessContextService.getCompanyProfile(),
      businessContextService.getBusinessGoals(),
      businessContextService.getKPIs(),
      businessContextService.getTeamMembers()
    ]);

    return {
      company,
      goals: goals.filter(g => g.status === 'active'),
      metrics: kpis,
      team: team.filter(t => t.is_active)
    };
  }

  // Phase 1: Product Context Integration  
  private async getProductContext(userId: string) {
    const [products, features, pricing] = await Promise.all([
      productCatalogService.getProducts(),
      productCatalogService.getFeatures(),
      productCatalogService.getAllPricingTiers()
    ]);

    return {
      catalog: products,
      features: features,
      pricing: pricing
    };
  }

  // Phase 2: Competitive Intelligence Integration
  private async getCompetitiveContext(userId: string) {
    const [competitors, analysis] = await Promise.all([
      competitiveIntelligenceService.getCompetitors(),
      competitiveIntelligenceService.getMarketAnalysis()
    ]);

    return {
      competitors,
      market_position: analysis.market_position,
      opportunities: analysis.opportunities || [],
      threats: analysis.threats || []
    };
  }

  // Phase 3: Pattern Recognition Integration
  private async getPatternContext(userId: string) {
    const patterns = await patternRecognitionService.getDetectedPatterns();
    
    return {
      detected_patterns: patterns.filter(p => p.status === 'active'),
      anomalies: patterns.filter(p => p.pattern_type === 'anomaly'),
      trends: patterns.filter(p => p.pattern_type === 'trend')
    };
  }

  // Phase 3: Insights Integration
  private async getInsightContext(userId: string) {
    const [insights, recommendations] = await Promise.all([
      insightsService.getInsights({ status: 'new' }),
      recommendationsService.getRecommendations({ status: 'pending' })
    ]);

    return {
      active_insights: insights,
      recommendations: recommendations,
      predictions: [] // Would come from analytics service
    };
  }

  // Phase 4: Automation Integration
  private async getAutomationContext(userId: string) {
    const [rules, stats] = await Promise.all([
      automationService.getAutomationRules(),
      automationService.getAutomationStats()
    ]);

    return {
      active_rules: rules.filter(r => r.status === 'active'),
      performance: stats
    };
  }

  // Performance data (simulated - would come from analytics)
  private async getPerformanceContext(userId: string) {
    return {
      campaigns: [],
      content: [],
      conversions: {
        rate: 3.2,
        trend: 'up',
        value: 125000
      }
    };
  }

  // Enrich AI prompts with relevant context
  async enrichAIPrompt(prompt: string, context: IntegratedMarketingContext): Promise<AIContextEnrichment> {
    // Analyze prompt to determine what context is needed
    const relevantData = this.extractRelevantContext(prompt, context);
    const historicalContext = await this.getHistoricalContext(prompt);
    const suggestedActions = await this.generateSuggestedActions(prompt, context);
    const predictiveInsights = await this.generatePredictiveInsights(prompt, context);

    return {
      relevant_data: relevantData,
      suggested_actions: suggestedActions,
      historical_context: historicalContext,
      predictive_insights: predictiveInsights
    };
  }

  // Extract relevant context based on prompt
  private extractRelevantContext(prompt: string, context: IntegratedMarketingContext): any[] {
    const relevantData = [];
    const promptLower = prompt.toLowerCase();

    // Check for business context keywords
    if (promptLower.includes('goal') || promptLower.includes('objective')) {
      relevantData.push(...context.business.goals);
    }

    // Check for product context keywords
    if (promptLower.includes('product') || promptLower.includes('feature')) {
      relevantData.push(...context.products.catalog);
    }

    // Check for competitive context keywords
    if (promptLower.includes('competitor') || promptLower.includes('competition')) {
      relevantData.push(...context.competitive.competitors);
    }

    // Check for performance keywords
    if (promptLower.includes('performance') || promptLower.includes('metric')) {
      relevantData.push(context.performance);
    }

    // Check for pattern/insight keywords
    if (promptLower.includes('pattern') || promptLower.includes('trend')) {
      relevantData.push(...context.patterns.trends);
    }

    return relevantData;
  }

  // Get historical context
  private async getHistoricalContext(prompt: string): Promise<any> {
    // In real implementation, this would query historical data
    return {
      similar_questions: [],
      past_performance: {},
      previous_actions: []
    };
  }

  // Generate suggested actions based on context
  private async generateSuggestedActions(prompt: string, context: IntegratedMarketingContext): Promise<any[]> {
    const suggestions = [];

    // Example: If asking about performance and conversion is low
    if (prompt.includes('performance') && context.performance.conversions.rate < 5) {
      suggestions.push({
        action: 'optimize_conversion',
        description: 'Run A/B tests on landing pages',
        priority: 'high',
        estimated_impact: '+1.2% conversion rate'
      });
    }

    // Example: If asking about content and patterns show engagement drop
    if (prompt.includes('content')) {
      const engagementTrend = context.patterns.trends.find(t => 
        t.pattern_name?.includes('engagement')
      );
      if (engagementTrend) {
        suggestions.push({
          action: 'content_refresh',
          description: 'Update top 10 performing articles',
          priority: 'medium',
          estimated_impact: '+25% engagement'
        });
      }
    }

    return suggestions;
  }

  // Generate predictive insights
  private async generatePredictiveInsights(prompt: string, context: IntegratedMarketingContext): Promise<any> {
    return {
      forecast: {
        revenue: { trend: 'up', percentage: 15 },
        traffic: { trend: 'stable', percentage: 0 },
        conversions: { trend: 'up', percentage: 8 }
      },
      risks: [
        'Competitor price reduction may impact Q4 sales',
        'Seasonal traffic drop expected in January'
      ],
      opportunities: [
        'Holiday shopping trend starting earlier',
        'Untapped audience segment identified'
      ]
    };
  }

  // Generate comprehensive marketing report
  async generateIntegratedReport(planId?: string): Promise<any> {
    const context = await this.getIntegratedContext('user1');
    
    const report = {
      executive_summary: this.generateExecutiveSummary(context),
      key_metrics: this.extractKeyMetrics(context),
      insights_summary: context.insights.active_insights.slice(0, 5),
      pattern_analysis: context.patterns.detected_patterns.slice(0, 5),
      competitive_position: context.competitive.market_position,
      recommendations: context.insights.recommendations.slice(0, 10),
      action_plan: await this.generateActionPlan(context)
    };

    return report;
  }

  private generateExecutiveSummary(context: IntegratedMarketingContext): string {
    const activeGoals = context.business.goals.length;
    const activeAutomations = context.automations.active_rules.length;
    const conversionRate = context.performance.conversions.rate;

    return `Marketing operations are showing strong momentum with ${activeGoals} active goals ` +
           `and ${activeAutomations} automation rules in place. Current conversion rate of ${conversionRate}% ` +
           `represents a positive trend. Key opportunities include expanding content production and ` +
           `optimizing paid advertising channels based on recent pattern analysis.`;
  }

  private extractKeyMetrics(context: IntegratedMarketingContext): any {
    return {
      business_health: {
        active_goals: context.business.goals.length,
        team_size: context.business.team.length,
        goal_completion_rate: 72 // Would calculate from actual data
      },
      market_position: {
        competitors_tracked: context.competitive.competitors.length,
        market_opportunities: context.competitive.opportunities.length,
        competitive_threats: context.competitive.threats.length
      },
      ai_insights: {
        active_patterns: context.patterns.detected_patterns.length,
        pending_recommendations: context.insights.recommendations.length,
        automation_efficiency: 85 // Would calculate from automation stats
      }
    };
  }

  private async generateActionPlan(context: IntegratedMarketingContext): Promise<any[]> {
    // Generate prioritized action items based on all context
    return [
      {
        priority: 1,
        action: 'Implement top 3 AI recommendations',
        timeline: 'This week',
        owner: 'Marketing Manager',
        impact: 'High'
      },
      {
        priority: 2,
        action: 'Launch A/B test for conversion optimization',
        timeline: 'Next 2 weeks',
        owner: 'Growth Team',
        impact: 'Medium'
      },
      {
        priority: 3,
        action: 'Scale content production based on trending topics',
        timeline: 'This month',
        owner: 'Content Team',
        impact: 'High'
      }
    ];
  }

  // Real-time monitoring and alerts
  async checkForCriticalAlerts(userId: string): Promise<any[]> {
    const context = await this.getIntegratedContext(userId);
    const alerts = [];

    // Check for critical patterns
    const criticalPatterns = context.patterns.detected_patterns.filter(p => 
      p.impact_level === 'critical'
    );
    if (criticalPatterns.length > 0) {
      alerts.push({
        type: 'pattern',
        severity: 'critical',
        message: `${criticalPatterns.length} critical patterns detected requiring immediate attention`,
        data: criticalPatterns
      });
    }

    // Check for automation failures
    const failedAutomations = context.automations.active_rules.filter(r => 
      r.status === 'error'
    );
    if (failedAutomations.length > 0) {
      alerts.push({
        type: 'automation',
        severity: 'high',
        message: `${failedAutomations.length} automations require attention`,
        data: failedAutomations
      });
    }

    // Check for competitive threats
    if (context.competitive.threats.length > 0) {
      alerts.push({
        type: 'competitive',
        severity: 'medium',
        message: 'New competitive threats identified',
        data: context.competitive.threats
      });
    }

    return alerts;
  }
}

// Export singleton instance
export const phase6IntegrationService = new Phase6IntegrationService();

// Re-export as default
export default phase6IntegrationService;