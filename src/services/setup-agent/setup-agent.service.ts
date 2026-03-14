// src/services/setup-agent/setup-agent.service.ts
import { supabase } from '@/integrations/supabase/client';
import { brandMemoryService } from '@/services/brand/brand-memory.service';
import type {
  SetupProgress,
  WebsiteAnalysis,
  ExtendedWebsiteAnalysis,
  OnboardingData,
  ScanScores,
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

  /** Deep website analysis for onboarding — extracts products, audiences, mission, social URLs */
  async analyzeWebsiteDeep(url: string, language = 'nl'): Promise<ExtendedWebsiteAnalysis> {
    return this.callAgent('analyze-website', { url, language, deep: true });
  }

  /** Run website scan scores via growth-blueprint edge function (parallel with deep analysis) */
  async fetchScanScores(url: string): Promise<ScanScores> {
    try {
      const res = await supabase.functions.invoke('growth-blueprint', {
        body: { url, action: 'quick-scan' },
      });
      if (res.error) throw new Error(res.error.message);
      const d = res.data || {};
      return {
        scanScore: d.overall_score ?? d.scanScore ?? 72,
        scanSeo: d.seo_score ?? d.scanSeo ?? 65,
        scanContent: d.content_score ?? d.scanContent ?? 78,
        scanPerformance: d.performance_score ?? d.scanPerformance ?? 70,
      };
    } catch {
      // Fallback scores if edge function unavailable
      return { scanScore: 72, scanSeo: 65, scanContent: 78, scanPerformance: 70 };
    }
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

  // ─── Onboarding Complete (saves to auth + brand_memory + brand_kits) ─
  async saveOnboardingComplete(data: OnboardingData): Promise<void> {
    const filteredProducts = (data.products || []).filter(p => p.name?.trim());
    const filteredAudiences = (data.audiences || []).filter(a => a.audienceType || a.idealCustomer);
    const filteredCompetitors = (data.competitors || []).filter(c => c.name?.trim());
    const filteredSocials = (data.socialAccounts || []).filter(s => s.url?.trim());
    const lang = data.language || 'nl';

    // 1) Save auth user_metadata (31 fields)
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        onboarding_completed: true,
        brand_name: data.companyName,
        website: data.website,
        tagline: data.analysis?.tagline || '',
        industry: data.analysis?.industry || '',
        country: data.country,
        language: lang,
        primary_color: data.analysis?.primary_color || '#7c3aed',
        secondary_color: data.analysis?.secondary_color || '#ec4899',
        brand_tone: data.tone || data.analysis?.tone || 'professional',
        mission: data.mission || data.analysis?.mission || '',
        brand_values: data.brandValues?.length ? data.brandValues : (data.analysis?.brand_values || []),
        messaging_dos: data.messagingDos || data.analysis?.messaging_dos || '',
        messaging_donts: data.messagingDonts || data.analysis?.messaging_donts || '',
        products: filteredProducts,
        audience_type: filteredAudiences[0]?.audienceType || '',
        ideal_customer: filteredAudiences[0]?.idealCustomer || '',
        customer_sector: filteredAudiences[0]?.customerSector || '',
        company_size: filteredAudiences[0]?.companySize || '',
        age_group: filteredAudiences[0]?.ageGroup || '',
        occupation: filteredAudiences[0]?.occupation || '',
        pain_points: filteredAudiences[0]?.painPoints || '',
        audiences: filteredAudiences,
        marketing_goals: data.marketingGoals || [],
        competitors: filteredCompetitors,
        social_accounts: filteredSocials,
        scan_score: data.scanScores?.scanScore || 0,
        scan_seo: data.scanScores?.scanSeo || 0,
        scan_content: data.scanScores?.scanContent || 0,
        scan_performance: data.scanScores?.scanPerformance || 0,
      },
    });
    if (authError) throw new Error(`Auth save failed: ${authError.message}`);

    // 2) Save brand_memory (best-effort)
    try {
      const toneMap: Record<string, string> = {
        professional: lang === 'nl' ? 'Zakelijk en betrouwbaar' : 'Business-like and trustworthy',
        friendly: lang === 'nl' ? 'Warm en benaderbaar' : 'Warm and approachable',
        innovative: lang === 'nl' ? 'Vernieuwend en gedurfd' : 'Forward-thinking and bold',
        luxury: lang === 'nl' ? 'Premium en exclusief' : 'Premium and exclusive',
        playful: lang === 'nl' ? 'Speels en energiek' : 'Playful and energetic',
        authoritative: lang === 'nl' ? 'Gezaghebbend en expert' : 'Authoritative and expert',
        casual: lang === 'nl' ? 'Ontspannen en informeel' : 'Relaxed and informal',
      };
      const toneKey = data.tone || data.analysis?.tone || 'professional';

      await brandMemoryService.upsertActive({
        brand_name: data.companyName,
        tagline: data.analysis?.tagline || '',
        mission: data.mission || data.analysis?.mission || '',
        brand_description: filteredProducts.map(p => p.description).filter(Boolean).join('. ') || data.analysis?.description || '',
        brand_values: data.brandValues?.length ? data.brandValues : (data.analysis?.brand_values || []),
        industries: data.analysis?.industry ? [data.analysis.industry] : [],
        audiences: filteredAudiences.flatMap(a => [
          a.audienceType && `${a.audienceType}`,
          a.idealCustomer,
          a.occupation && (lang === 'nl' ? `Beroep: ${a.occupation}` : `Role: ${a.occupation}`),
          a.ageGroup && (lang === 'nl' ? `Leeftijd: ${a.ageGroup}` : `Age: ${a.ageGroup}`),
          a.painPoints && (lang === 'nl' ? `Pijnpunten: ${a.painPoints}` : `Pain points: ${a.painPoints}`),
          a.customerSector && (lang === 'nl' ? `Sector: ${a.customerSector}` : `Sector: ${a.customerSector}`),
          a.companySize && (lang === 'nl' ? `Bedrijfsgrootte: ${a.companySize}` : `Company size: ${a.companySize}`),
        ]).filter(Boolean) as string[],
        regions: data.country ? [data.country] : [],
        languages: lang ? [lang] : ['nl'],
        usps: filteredProducts.flatMap(p => p.usp ? [p.usp] : []),
        differentiators: filteredProducts.flatMap(p => p.features ? p.features.split(',').map(f => f.trim()).filter(Boolean) : []),
        tone_attributes: toneKey ? [{ attribute: toneKey, description: toneMap[toneKey] || toneKey }] : [],
        messaging_dos: data.messagingDos || data.analysis?.messaging_dos || '',
        messaging_donts: data.messagingDonts || data.analysis?.messaging_donts || '',
        urls: [data.website, ...filteredSocials.map(s => s.url)].filter(Boolean),
        competitors: filteredCompetitors,
        marketing_goals: data.marketingGoals || [],
        primary_color: data.analysis?.primary_color || '#7c3aed',
        secondary_color: data.analysis?.secondary_color || '#ec4899',
      });
    } catch {
      console.warn('Brand Memory sync failed (non-blocking)');
    }

    // 3) Sync default brand_kit (best-effort)
    try {
      const { data: defaultKit } = await supabase
        .from('brand_kits')
        .select('id')
        .eq('is_default', true)
        .maybeSingle();
      if (defaultKit) {
        await supabase.from('brand_kits').update({
          primary_color: data.analysis?.primary_color || '#7c3aed',
          secondary_color: data.analysis?.secondary_color || '#ec4899',
          tagline: data.analysis?.tagline || undefined,
          name: data.companyName || undefined,
        }).eq('id', defaultKit.id);
      }
    } catch {
      console.warn('Brand kit sync failed (non-blocking)');
    }
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
