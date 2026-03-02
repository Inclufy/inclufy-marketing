// services/context-orchestration.service.ts
export class ContextOrchestrationService {
  async getCompleteContext(domain?: string): Promise<CompleteContext> {
    const [business, product, market, competitive, audience, geographic] = await Promise.all([
      this.businessContextService.getContext(),
      this.productContextService.getContext(),
      this.marketContextService.getContext(),
      this.competitiveContextService.getContext(),
      this.audienceContextService.getContext(),
      this.geographicContextService.getContext()
    ]);

    return {
      business,
      product,
      market,
      competitive,
      audience,
      geographic,
      confidence: this.calculateOverallConfidence(),
      completeness: this.calculateCompleteness(),
      recommendations: this.generateRecommendations()
    };
  }

  async validateContent(content: string, targetAudience?: string, targetRegion?: string): Promise<ValidationResult> {
    const context = await this.getCompleteContext();
    
    const validations = await Promise.all([
      this.validateAgainstBusiness(content, context.business),
      this.validateAgainstProducts(content, context.product),
      this.validateAgainstMarket(content, context.market),
      this.validateAgainstCompetitors(content, context.competitive),
      this.validateAgainstAudience(content, context.audience, targetAudience),
      this.validateAgainstRegion(content, context.geographic, targetRegion)
    ]);

    return this.consolidateValidations(validations);
  }
}