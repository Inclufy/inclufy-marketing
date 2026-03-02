// src/services/context-marketing/context-governance.service.ts
import { supabase } from '@/integrations/supabase/client';
import { businessContextService } from './business-context.service';
import { productContextService } from './product-context.service';

export interface ContextValidationResult {
  isValid: boolean;
  confidence: number;
  missingContext: string[];
  assumptions: ContextAssumption[];
  recommendations: string[];
}

export interface ContextAssumption {
  type: 'data_gap' | 'inference' | 'default_value' | 'external_source';
  domain: string;
  assumption: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
}

export interface DomainConfidence {
  domain: string;
  score: number;
  factors: ConfidenceFactor[];
}

export interface ConfidenceFactor {
  name: string;
  weight: number;
  score: number;
  reason: string;
}

export class ContextGovernanceService {
  // Calculate confidence score for each domain
  async calculateDomainConfidence(domain: string): Promise<DomainConfidence> {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    switch (domain) {
      case 'business':
        return this.calculateBusinessConfidence();
      case 'product':
        return this.calculateProductConfidence();
      default:
        return {
          domain,
          score: 0,
          factors: []
        };
    }
  }

  private async calculateBusinessConfidence(): Promise<DomainConfidence> {
    const factors: ConfidenceFactor[] = [];
    let totalWeight = 0;
    let weightedScore = 0;

    try {
      // Check organization structure
      const orgStructure = await businessContextService.getOrganizationStructure();
      const orgScore = orgStructure.length > 0 ? 100 : 0;
      factors.push({
        name: 'Organization Structure',
        weight: 25,
        score: orgScore,
        reason: orgScore > 0 ? 'Organization structure defined' : 'No organization structure defined'
      });

      // Check strategic objectives
      const objectives = await businessContextService.getObjectives('active');
      const objScore = objectives.length >= 3 ? 100 : (objectives.length / 3) * 100;
      factors.push({
        name: 'Strategic Objectives',
        weight: 30,
        score: objScore,
        reason: `${objectives.length} active objectives defined`
      });

      // Check operating model
      const operatingModel = await businessContextService.getOperatingModel();
      const modelScore = operatingModel ? 100 : 0;
      factors.push({
        name: 'Operating Model',
        weight: 25,
        score: modelScore,
        reason: modelScore > 0 ? 'Operating model defined' : 'Operating model not defined'
      });

      // Check governance framework
      const { data: governance } = await supabase
        .from('governance_framework')
        .select('id')
        .single();
      
      const govScore = governance ? 100 : 0;
      factors.push({
        name: 'Governance Framework',
        weight: 20,
        score: govScore,
        reason: govScore > 0 ? 'Governance framework established' : 'No governance framework'
      });

      // Calculate weighted average
      factors.forEach(factor => {
        totalWeight += factor.weight;
        weightedScore += factor.score * factor.weight;
      });

      return {
        domain: 'business',
        score: Math.round(weightedScore / totalWeight),
        factors
      };
    } catch (error) {
      console.error('Error calculating business confidence:', error);
      return {
        domain: 'business',
        score: 0,
        factors
      };
    }
  }

  private async calculateProductConfidence(): Promise<DomainConfidence> {
    const factors: ConfidenceFactor[] = [];
    let totalWeight = 0;
    let weightedScore = 0;

    try {
      // Check product catalog
      const products = await productContextService.getProducts();
      const liveProducts = products.filter(p => p.status === 'live');
      const catalogScore = liveProducts.length > 0 ? Math.min((liveProducts.length / 5) * 100, 100) : 0;
      
      factors.push({
        name: 'Product Catalog',
        weight: 35,
        score: catalogScore,
        reason: `${liveProducts.length} live products in catalog`
      });

      // Check product details completeness
      let detailsScore = 0;
      products.forEach(product => {
        let productScore = 0;
        if (product.description && product.description.length > 50) productScore += 25;
        if (product.key_features && product.key_features.length > 0) productScore += 25;
        if (product.differentiators && product.differentiators.length > 0) productScore += 25;
        if (product.pricing_model) productScore += 25;
        detailsScore += productScore;
      });
      
      detailsScore = products.length > 0 ? detailsScore / products.length : 0;
      factors.push({
        name: 'Product Information Quality',
        weight: 30,
        score: detailsScore,
        reason: `Average product detail completeness: ${Math.round(detailsScore)}%`
      });

      // Check roadmap
      const roadmap = await productContextService.getRoadmap();
      const roadmapScore = roadmap.length > 0 ? Math.min((roadmap.length / 10) * 100, 100) : 0;
      
      factors.push({
        name: 'Product Roadmap',
        weight: 20,
        score: roadmapScore,
        reason: `${roadmap.length} roadmap items defined`
      });

      // Check ecosystem relationships
      const ecosystem = await productContextService.getProductEcosystem();
      const ecosystemScore = ecosystem.edges.length > 0 ? 100 : 0;
      
      factors.push({
        name: 'Product Ecosystem',
        weight: 15,
        score: ecosystemScore,
        reason: `${ecosystem.edges.length} product relationships defined`
      });

      // Calculate weighted average
      factors.forEach(factor => {
        totalWeight += factor.weight;
        weightedScore += factor.score * factor.weight;
      });

      return {
        domain: 'product',
        score: Math.round(weightedScore / totalWeight),
        factors
      };
    } catch (error) {
      console.error('Error calculating product confidence:', error);
      return {
        domain: 'product',
        score: 0,
        factors
      };
    }
  }

  // Validate content against context
  async validateContent(content: string, requireDomains: string[] = ['business', 'product']): Promise<ContextValidationResult> {
    const missingContext: string[] = [];
    const assumptions: ContextAssumption[] = [];
    const recommendations: string[] = [];
    let overallConfidence = 100;

    // Check each required domain
    for (const domain of requireDomains) {
      const domainConfidence = await this.calculateDomainConfidence(domain);
      
      if (domainConfidence.score < 60) {
        missingContext.push(`${domain} context is incomplete (${domainConfidence.score}% confidence)`);
        overallConfidence = Math.min(overallConfidence, domainConfidence.score);
        
        // Add specific missing elements
        domainConfidence.factors
          .filter(f => f.score < 50)
          .forEach(factor => {
            recommendations.push(`Complete ${factor.name}: ${factor.reason}`);
          });
      }
    }

    // Identify assumptions based on gaps
    if (missingContext.length > 0) {
      // Business context assumptions
      if (missingContext.some(m => m.includes('business'))) {
        assumptions.push({
          type: 'data_gap',
          domain: 'business',
          assumption: 'Assuming standard B2B SaaS business model',
          confidence: 60,
          impact: 'medium'
        });
      }

      // Product context assumptions
      if (missingContext.some(m => m.includes('product'))) {
        assumptions.push({
          type: 'data_gap',
          domain: 'product',
          assumption: 'Assuming all mentioned features are currently available',
          confidence: 50,
          impact: 'high'
        });
      }
    }

    // Store assumptions in database
    if (assumptions.length > 0) {
      await this.storeAssumptions(assumptions);
    }

    return {
      isValid: overallConfidence >= 80,
      confidence: overallConfidence,
      missingContext,
      assumptions,
      recommendations
    };
  }

  // Store context assumptions
  private async storeAssumptions(assumptions: ContextAssumption[]) {
    const { data: user } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const assumptionRecords = assumptions.map(a => ({
        user_id: user.user.id,
        assumption_type: a.type,
        domain: a.domain,
        assumption_text: a.assumption,
        confidence_level: Math.round(a.confidence / 20), // Convert to 1-5 scale
        validation_status: 'unverified' as const,
        context: { impact: a.impact }
      }));

      await supabase
        .from('context_assumptions')
        .insert(assumptionRecords);
    } catch (error) {
      console.error('Error storing assumptions:', error);
    }
  }

  // Get governance summary
  async getGovernanceSummary() {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get all domain confidences
    const domains = ['business', 'product', 'market', 'competitive', 'audience', 'geographic', 'brand'];
    const domainConfidences = await Promise.all(
      domains.map(async domain => {
        const confidence = await this.calculateDomainConfidence(domain);
        return {
          domain,
          confidence: confidence.score,
          status: this.getConfidenceStatus(confidence.score)
        };
      })
    );

    // Get recent assumptions
    const { data: assumptions } = await supabase
      .from('context_assumptions')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get validation rules
    const { data: rules } = await supabase
      .from('validation_rules')
      .select('*')
      .eq('is_active', true);

    // Calculate overall governance health
    const overallScore = domainConfidences.reduce((sum, d) => sum + d.confidence, 0) / domainConfidences.length;

    return {
      overallScore,
      status: this.getConfidenceStatus(overallScore),
      domains: domainConfidences,
      recentAssumptions: assumptions || [],
      activeRules: rules?.length || 0,
      recommendations: this.generateGovernanceRecommendations(domainConfidences)
    };
  }

  private getConfidenceStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  private generateGovernanceRecommendations(domains: any[]): string[] {
    const recommendations: string[] = [];

    // Find domains needing attention
    const weakDomains = domains.filter(d => d.confidence < 60);
    if (weakDomains.length > 0) {
      recommendations.push(
        `Focus on improving ${weakDomains[0].domain} context (currently ${weakDomains[0].confidence}% confidence)`
      );
    }

    // Check for critical domains
    const criticalDomains = ['business', 'product'];
    criticalDomains.forEach(domain => {
      const domainData = domains.find(d => d.domain === domain);
      if (domainData && domainData.confidence < 80) {
        recommendations.push(
          `${domain.charAt(0).toUpperCase() + domain.slice(1)} context needs attention for reliable AI outputs`
        );
      }
    });

    // General recommendations
    if (domains.every(d => d.confidence >= 80)) {
      recommendations.push('Excellent context coverage! Consider expanding to advanced use cases');
    }

    return recommendations;
  }

  // Refusal logic - when AI should say "I don't know"
  async shouldRefuseGeneration(prompt: string, contextRequirements: string[]): Promise<{
    shouldRefuse: boolean;
    reason?: string;
  }> {
    // Check context completeness
    const validation = await this.validateContent(prompt, contextRequirements);
    
    if (validation.confidence < 60) {
      return {
        shouldRefuse: true,
        reason: `Insufficient context to generate reliable content. ${validation.missingContext.join('. ')}`
      };
    }

    // Check for high-impact assumptions
    const highImpactAssumptions = validation.assumptions.filter(a => a.impact === 'high');
    if (highImpactAssumptions.length > 0) {
      return {
        shouldRefuse: true,
        reason: `Cannot proceed due to critical missing information: ${highImpactAssumptions[0].assumption}`
      };
    }

    // Check for specific content that requires validation
    if (prompt.toLowerCase().includes('pricing') || prompt.toLowerCase().includes('cost')) {
      const products = await productContextService.getProducts();
      const hasValidPricing = products.some(p => p.pricing_model && Object.keys(p.pricing_model).length > 0);
      
      if (!hasValidPricing) {
        return {
          shouldRefuse: true,
          reason: 'Cannot generate pricing content without defined pricing models'
        };
      }
    }

    return {
      shouldRefuse: false
    };
  }
}

// Export singleton instance
export const contextGovernanceService = new ContextGovernanceService();