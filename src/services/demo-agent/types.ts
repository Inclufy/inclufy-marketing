// src/services/demo-agent/types.ts
// Types for the multi-app, industry-specific demo agent

export type IndustryType = 'healthcare' | 'construction' | 'it' | 'real-estate' | 'manufacturing';

export interface BrandTemplate {
  name: string;
  tagline: string;
  mission: string;
  description: string;
  tone_attributes: string[];
  primary_color: string;
  secondary_color: string;
  usps: string[];
  brand_values: string[];
  audiences: string[];
  industries: string[];
  messaging_dos: string;
  messaging_donts: string;
  preferred_vocabulary: string[];
  banned_phrases: string[];
  voice_name: string;
  voice_description: string;
}

export interface LeadTemplate {
  name: string;
  email: string;
  company: string;
  title: string;
  composite_score: number;
  stage: string;
  conversion_probability: number;
  predicted_value: number;
  hot_signals: string[];
  cold_signals: string[];
  source: string;
  tags: string[];
  next_best_action: string;
  intent_level?: string;
  buying_stage?: string;
}

export interface CampaignTemplate {
  name: string;
  description: string;
  objective: string;
  status: string;
  budget_total: number;
  budget_spent: number;
  days_remaining: number;
  roi: number;
  conversions: number;
  ai_managed: boolean;
  performance_score: number;
}

export interface ContentTemplate {
  title: string;
  body: string;
  content_type: string;
  channels: string[];
  status: string;
  tags: string[];
  performance?: Record<string, number>;
}

export interface CompetitorTemplate {
  name: string;
  description: string;
  website: string;
  market_share: number;
  strengths: string[];
  weaknesses: string[];
}

export interface EventTemplate {
  name: string;
  type: string;
  description: string;
  location: string;
  city: string;
  country: string;
  date_start: string;
  date_end: string;
  expected_attendees: number;
  target_audience_match: number;
  estimated_roi: number;
  estimated_leads: number;
  networking_value: number;
  cost: number;
  topics: string[];
  status: string;
  priority_score: number;
}

export interface PersonaTemplate {
  name: string;
  description: string;
  demographics: Record<string, string>;
  psychographics: Record<string, string>;
  pain_points: string[];
  goals: string[];
  preferred_channels: string[];
}

export interface ProductTemplate {
  name: string;
  description: string;
  category: string;
  status: string;
  price_range: string;
  target_audience: string;
  key_features: string[];
  competitive_advantages: string[];
}

export interface AgentTaskOverride {
  social_task: string;
  email_task: string;
  ads_task: string;
  analytics_task: string;
  orchestrator_task: string;
}

// Finance-specific templates
export interface FinanceCustomerTemplate {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  contact_person: string;
  kvk_number: string;
  btw_number: string;
  payment_terms: number;
  status: string;
}

export interface FinanceSupplierTemplate {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
  contact_person: string;
  kvk_number: string;
  btw_number: string;
  payment_terms: number;
  status: string;
}

export interface FinanceInvoiceTemplate {
  invoice_type: 'sales' | 'purchase';
  entity_name: string;
  description: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  days_offset: number; // days from today for invoice_date
}

export interface FinanceBudgetTemplate {
  category: string;
  budgeted_amount: number;
  actual_amount: number;
}

export interface FinanceGoalTemplate {
  goal: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  status: string;
}

export interface StrategicObjectiveTemplate {
  name: string;
  description: string;
  category: string;
  target_value: number;
  current_value: number;
  unit: string;
  priority: string;
}

export interface OrganizationEntityTemplate {
  name: string;
  type: string;
  description: string;
}

// Main template interface combining everything
export interface IndustryTemplate {
  industry: IndustryType;
  brand: BrandTemplate;
  agentTasks: AgentTaskOverride;
  leads: LeadTemplate[];
  campaigns: CampaignTemplate[];
  content: ContentTemplate[];
  competitors: CompetitorTemplate[];
  events: EventTemplate[];
  personas: PersonaTemplate[];
  products: ProductTemplate[];
  strategicObjectives: StrategicObjectiveTemplate[];
  organizationEntities: OrganizationEntityTemplate[];
  // Finance
  financeCustomers: FinanceCustomerTemplate[];
  financeSuppliers: FinanceSupplierTemplate[];
  financeInvoices: FinanceInvoiceTemplate[];
  financeBudgets: FinanceBudgetTemplate[];
  financeGoals: FinanceGoalTemplate[];
  yearPlanName: string;
}

export interface DemoConfig {
  userId: string;
  industry: IndustryType;
  seedMarketing: boolean;
  seedFinance: boolean;
}

export interface SeedProgress {
  step: string;
  total: number;
  current: number;
  status: 'pending' | 'running' | 'done' | 'error';
  error?: string;
}
