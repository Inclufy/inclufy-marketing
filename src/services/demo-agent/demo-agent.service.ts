// src/services/demo-agent/demo-agent.service.ts
// Marketing app — demo agent orchestrator (marketing data only)
import type { IndustryType, IndustryTemplate, SeedProgress } from './types';
import { marketingSupabase } from './config/supabase-clients';

// Templates
import { healthcareTemplate } from './templates/healthcare.template';
import { constructionTemplate } from './templates/construction.template';
import { itTemplate } from './templates/it.template';
import { realEstateTemplate } from './templates/real-estate.template';
import { manufacturingTemplate } from './templates/manufacturing.template';

// Marketing seeders
import { seedBrand } from './seeders/marketing/brand-seeder';
import { seedAgents } from './seeders/marketing/agents-seeder';
import { seedLeads } from './seeders/marketing/leads-seeder';
import { seedCampaigns } from './seeders/marketing/campaigns-seeder';
import { seedContent } from './seeders/marketing/content-seeder';
import { seedIntegrations } from './seeders/marketing/integrations-seeder';
import { seedAnalytics } from './seeders/marketing/analytics-seeder';
import { seedOpportunities } from './seeders/marketing/opportunities-seeder';
import { seedContext } from './seeders/marketing/context-seeder';
import { seedAutomation } from './seeders/marketing/automation-seeder';

const TEMPLATES: Record<IndustryType, IndustryTemplate> = {
  healthcare: healthcareTemplate,
  construction: constructionTemplate,
  it: itTemplate,
  'real-estate': realEstateTemplate,
  manufacturing: manufacturingTemplate,
};

// All marketing tables that get seeded (reverse dependency order for deletion)
const MARKETING_TABLES = [
  'data_flow_events', 'autonomous_decisions', 'qr_codes',
  'feed_items', 'discovered_events', 'opportunities',
  'content_items', 'publishable_content', 'content_templates_ai',
  'campaigns', 'triggered_campaigns', 'campaign_triggers', 'autonomous_campaign_status',
  'contacts', 'intent_signals', 'captured_contacts', 'lead_profiles', 'scored_leads',
  'channel_attributions', 'attribution_models', 'channel_health',
  'scoring_models', 'scoring_rules',
  'ai_agents', 'integration_configs', 'agent_messages', 'agent_tasks',
  'segments', 'personas', 'competitive_features', 'competitors',
  'product_relationships', 'products',
  'strategic_objectives', 'operating_model', 'organization_entities',
  'brand_voices', 'brand_memory',
];

type ProgressCallback = (progress: SeedProgress) => void;

class DemoAgentService {
  private activeIndustry: IndustryType | null = null;

  getTemplate(industry: IndustryType): IndustryTemplate {
    return TEMPLATES[industry];
  }

  getAvailableIndustries(): { id: IndustryType; name: string; color: string; icon: string }[] {
    return [
      { id: 'healthcare', name: 'Healthcare', color: '#0EA5E9', icon: 'Heart' },
      { id: 'construction', name: 'Construction', color: '#F59E0B', icon: 'HardHat' },
      { id: 'it', name: 'IT / SaaS', color: '#8B5CF6', icon: 'Cloud' },
      { id: 'real-estate', name: 'Real Estate', color: '#10B981', icon: 'Building2' },
      { id: 'manufacturing', name: 'Manufacturing', color: '#EF4444', icon: 'Factory' },
    ];
  }

  async getActiveIndustry(): Promise<IndustryType | null> {
    if (this.activeIndustry) return this.activeIndustry;
    const stored = localStorage.getItem('demo_active_industry_marketing');
    if (stored) this.activeIndustry = stored as IndustryType;
    return this.activeIndustry;
  }

  private setActiveIndustry(industry: IndustryType | null): void {
    this.activeIndustry = industry;
    if (industry) {
      localStorage.setItem('demo_active_industry_marketing', industry);
    } else {
      localStorage.removeItem('demo_active_industry_marketing');
    }
  }

  // ── Main seed method ──────────────────────────────────────────────
  async seedIndustryDemo(
    userId: string,
    industry: IndustryType,
    onProgress?: ProgressCallback,
  ): Promise<void> {
    const template = TEMPLATES[industry];
    if (!template) throw new Error(`Unknown industry: ${industry}`);

    const steps: { name: string; fn: () => Promise<void> }[] = [
      { name: 'Brand & Voice', fn: () => seedBrand(userId, template) },
      { name: 'Context & Strategy', fn: () => seedContext(userId, template) },
      { name: 'Integrations', fn: () => seedIntegrations(userId, template) },
      { name: 'AI Agents', fn: () => seedAgents(userId, template) },
      { name: 'Analytics & Scoring', fn: () => seedAnalytics(userId, template) },
      { name: 'Leads & Intelligence', fn: () => seedLeads(userId, template) },
      { name: 'Campaigns & Triggers', fn: () => seedCampaigns(userId, template) },
      { name: 'Content & Templates', fn: () => seedContent(userId, template) },
      { name: 'Opportunities & Events', fn: () => seedOpportunities(userId, template) },
      { name: 'Automation & QR Codes', fn: () => seedAutomation(userId, template) },
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      onProgress?.({ step: step.name, total: steps.length, current: i + 1, status: 'running' });
      try {
        await step.fn();
        onProgress?.({ step: step.name, total: steps.length, current: i + 1, status: 'done' });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Seed step "${step.name}" failed:`, err);
        onProgress?.({ step: step.name, total: steps.length, current: i + 1, status: 'error', error: message });
      }
    }

    this.setActiveIndustry(industry);
  }

  // ── Reset all marketing demo data ─────────────────────────────────
  async resetDemo(userId: string, onProgress?: ProgressCallback): Promise<void> {
    for (let i = 0; i < MARKETING_TABLES.length; i++) {
      const table = MARKETING_TABLES[i];
      onProgress?.({ step: `Clearing ${table}`, total: MARKETING_TABLES.length, current: i + 1, status: 'running' });
      try {
        const { error } = await marketingSupabase.from(table).delete().eq('user_id', userId);
        if (error) console.warn(`Could not clear ${table}:`, error.message);
      } catch {
        // Table may not exist — skip
      }
    }
    this.setActiveIndustry(null);
  }

  // ── Switch industry (reset + reseed) ──────────────────────────────
  async switchIndustry(
    userId: string,
    industry: IndustryType,
    onProgress?: ProgressCallback,
  ): Promise<void> {
    onProgress?.({ step: 'Resetting existing data...', total: 2, current: 1, status: 'running' });
    await this.resetDemo(userId);
    onProgress?.({ step: 'Seeding new industry data...', total: 2, current: 2, status: 'running' });
    await this.seedIndustryDemo(userId, industry, onProgress);
  }

  // ── Check if demo data exists ─────────────────────────────────────
  async hasDemoData(userId: string): Promise<boolean> {
    const { count } = await marketingSupabase
      .from('ai_agents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    return (count ?? 0) > 0;
  }
}

export const demoAgentService = new DemoAgentService();
export default demoAgentService;
