// src/services/setup-agent/setup-agent.service.ts
import { supabase } from '@/integrations/supabase/client';
import { brandMemoryService } from '@/services/brand/brand-memory.service';
import type {
  SetupProgress,
  WebsiteAnalysis,
  CompetitorInput,
  CompetitorResult,
  StrategyResult,
  PersonaResult,
  ScoringResult,
  IntegrationResult,
  TemplateResult,
} from './types';

const PROGRESS_KEY = 'setup_copilot_progress';

class SetupAgentService {
  // ─── AI Generation (calls edge function) ─────────────────────────
  private async callAgent(action: string, data: Record<string, any>): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await supabase.functions.invoke('setup-agent', {
      body: { action, ...data },
    });

    if (res.error) throw new Error(res.error.message || 'Edge function error');
    return res.data;
  }

  async analyzeWebsite(url: string, language = 'nl'): Promise<WebsiteAnalysis> {
    return this.callAgent('analyze-website', { url, language });
  }

  async analyzeCompetitors(
    competitors: CompetitorInput[],
    industry: string,
    ourBrand: string,
    language = 'nl'
  ): Promise<{ competitors: CompetitorResult[] }> {
    return this.callAgent('analyze-competitors', {
      competitors,
      industry,
      our_brand: ourBrand,
      language,
    });
  }

  async generateStrategy(
    goals: string[],
    industry: string,
    brandName: string,
    language = 'nl'
  ): Promise<StrategyResult> {
    return this.callAgent('generate-strategy', {
      marketing_goals: goals,
      industry,
      brand_name: brandName,
      language,
    });
  }

  async generatePersonas(
    industry: string,
    brandName: string,
    targetAudiences: string[],
    goals: string[],
    language = 'nl'
  ): Promise<{ personas: PersonaResult[] }> {
    return this.callAgent('generate-personas', {
      industry,
      brand_name: brandName,
      target_audiences: targetAudiences,
      goals,
      language,
    });
  }

  async generateScoringModel(
    industry: string,
    goals: string,
    personas: any[],
    language = 'nl'
  ): Promise<ScoringResult> {
    return this.callAgent('generate-scoring-model', { industry, goals, personas, language });
  }

  async suggestIntegrations(
    channels: string[],
    industry: string,
    goals: string,
    language = 'nl'
  ): Promise<{ integrations: IntegrationResult[] }> {
    return this.callAgent('suggest-integrations', { channels, industry, goals, language });
  }

  async suggestTemplates(
    industry: string,
    channels: string[],
    goals: string,
    tone: string,
    brandName: string,
    language = 'nl'
  ): Promise<{ templates: TemplateResult[] }> {
    return this.callAgent('suggest-templates', {
      industry,
      channels,
      goals,
      tone,
      brand_name: brandName,
      language,
    });
  }

  // ─── Persistence (delegates to existing services + direct inserts) ─
  async saveBrandData(data: WebsiteAnalysis): Promise<void> {
    await brandMemoryService.upsertActive({
      brand_name: data.brand_name,
      brand_description: data.description,
      tagline: data.tagline,
      industries: [data.industry],
      tone_attributes: [data.tone],
      brand_values: data.brand_values,
      usps: data.usps,
      primary_color: data.primary_color,
      secondary_color: data.secondary_color,
      audiences: data.target_audiences,
    });
  }

  async saveCompetitors(competitors: CompetitorResult[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    for (const comp of competitors) {
      await supabase.from('competitors').insert({
        user_id: user.id,
        competitor_name: comp.name,
        company_type: 'direct',
        strengths: comp.strengths,
        weaknesses: comp.weaknesses,
        key_products: comp.key_products,
        pricing_strategy: comp.pricing_strategy,
        target_segments: comp.target_segments,
        opportunities: comp.opportunities,
        threats: comp.threats,
        metadata: { description: comp.description },
      });
    }
  }

  async saveObjectives(result: StrategyResult): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const rows = result.objectives.map((o) => ({
      user_id: user.id,
      title: o.title,
      description: o.description,
      objective_type: o.objective_type,
      priority: o.priority,
      target_value: o.target_value,
      current_value: o.current_value || 0,
      status: 'active',
      success_metrics: o.success_metrics || [],
    }));

    const { error } = await supabase.from('strategic_objectives').insert(rows);
    if (error) throw error;
  }

  async savePersonas(personas: PersonaResult[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const rows = personas.map((p) => ({
      user_id: user.id,
      name: p.name,
      demographics: p.demographics,
      psychographics: p.psychographics,
      behavioral: p.behavioral,
    }));

    const { error } = await supabase.from('personas').insert(rows);
    if (error) throw error;
  }

  async saveScoringModel(result: ScoringResult): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Save model
    const { error: modelError } = await supabase.from('scoring_models').insert({
      user_id: user.id,
      name: result.model.name,
      description: result.model.description,
      is_active: true,
      accuracy: 0,
      total_leads_scored: 0,
      last_trained: new Date().toISOString(),
      category_weights: result.model.category_weights,
      threshold_mql: result.model.threshold_mql,
      threshold_sql: result.model.threshold_sql,
    });
    if (modelError) console.error('scoring_models save error:', modelError);

    // Save rules
    if (result.rules.length > 0) {
      const rules = result.rules.map((r) => ({
        user_id: user.id,
        name: r.name,
        category: r.category,
        description: r.description,
        condition: r.condition,
        points: r.points,
        is_active: true,
        triggers_count: 0,
      }));
      const { error: rulesError } = await supabase.from('scoring_rules').insert(rules);
      if (rulesError) console.error('scoring_rules save error:', rulesError);
    }
  }

  async saveIntegrations(integrations: IntegrationResult[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const rows = integrations.map((i) => ({
      user_id: user.id,
      platform: i.platform,
      display_name: i.display_name,
      category: i.category,
      status: 'disconnected',
      config: { reason: i.reason, priority: i.priority },
    }));

    const { error } = await supabase.from('integration_configs').insert(rows);
    if (error) console.error('integration_configs save error:', error);
  }

  async saveTemplates(templates: TemplateResult[], brandName: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const rows = templates.map((t) => ({
      user_id: user.id,
      name: t.name,
      description: t.description,
      content_type: t.content_type,
      category: t.category,
      prompt_template: t.prompt_template,
      variables: t.variables,
      use_count: 0,
      rating: 0,
    }));

    const { error } = await supabase.from('content_templates_ai').insert(rows);
    if (error) console.error('content_templates_ai save error:', error);
  }

  // ─── Progress (localStorage) ─────────────────────────────────────
  getProgress(): SetupProgress | null {
    try {
      const raw = localStorage.getItem(PROGRESS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  saveProgress(progress: SetupProgress): void {
    progress.lastUpdated = new Date().toISOString();
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }

  clearProgress(): void {
    localStorage.removeItem(PROGRESS_KEY);
  }
}

export const setupAgentService = new SetupAgentService();
