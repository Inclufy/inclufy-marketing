// services/market-context.service.ts
import { supabase } from '@/integrations/supabase/client';
import { WebsiteAnalyzerService } from './website-analyzer.service';

export class MarketContextService {
  private websiteAnalyzer = new WebsiteAnalyzerService();

  async identifyIndustry(websiteUrl: string): Promise<Industry> {
    // Use existing website analyzer to extract business info
    const websiteData = await this.websiteAnalyzer.analyzeWebsite(websiteUrl);
    
    // Extract industry signals
    const industrySignals = this.extractIndustrySignals(websiteData);
    
    // Match to NAICS/SIC codes
    const classification = await this.classifyIndustry(industrySignals);
    
    // Save to database
    return await this.saveIndustryClassification(classification);
  }

  async getIndustryBenchmarks(industryId: string): Promise<Benchmark[]> {
    const { data, error } = await supabase
      .from('industry_benchmarks')
      .select('*')
      .eq('industry_id', industryId)
      .order('benchmark_type', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async analyzeMarketPosition(): Promise<MarketPositionAnalysis> {
    // Get user's metrics
    const userMetrics = await this.getUserBusinessMetrics();
    
    // Get industry benchmarks
    const benchmarks = await this.getIndustryBenchmarks(userMetrics.industryId);
    
    // Calculate position
    return this.calculateMarketPosition(userMetrics, benchmarks);
  }

  private extractIndustrySignals(websiteData: any): IndustrySignals {
    // NLP analysis of website content
    const keywords = this.extractKeywords(websiteData.content);
    const services = this.identifyServices(websiteData.services);
    const products = this.identifyProducts(websiteData.products);
    
    return {
      keywords,
      services,
      products,
      businessModel: websiteData.businessModel
    };
  }
}