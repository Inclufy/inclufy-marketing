// src/services/setup-agent/types.ts

export type SetupStep = 'website' | 'competitors' | 'goals' | 'channels' | 'personas' | 'templates';

export const SETUP_STEPS: SetupStep[] = ['website', 'competitors', 'goals', 'channels', 'personas', 'templates'];

// Onboarding-specific steps (4-phase conversational flow)
export type OnboardingStep = 'basics' | 'refine' | 'strategy' | 'summary';
export const ONBOARDING_STEPS: OnboardingStep[] = ['basics', 'refine', 'strategy', 'summary'];

export interface SetupProgress {
  currentStep: number;
  completedSteps: SetupStep[];
  stepData: Record<string, any>;
  startedAt: string;
  lastUpdated: string;
}

// ─── Website Analysis (basic — sidebar mode) ─────────────────────
export interface WebsiteAnalysis {
  brand_name: string;
  description: string;
  industry: string;
  tone: string;
  brand_values: string[];
  usps: string[];
  primary_color: string;
  secondary_color: string;
  tagline: string;
  target_audiences: string[];
  suggested_competitors: string[];
}

// ─── Extended Website Analysis (deep — onboarding mode) ──────────
export interface ProductInfo {
  name: string;
  description: string;
  usp: string;
  features: string;
}

export interface AudienceDetailed {
  audienceType: 'B2B' | 'B2C' | 'Both';
  idealCustomer: string;
  customerSector: string;
  companySize: string;
  ageGroup: string;
  occupation: string;
  painPoints: string;
}

export interface SocialUrls {
  linkedin: string;
  instagram: string;
  facebook: string;
  twitter: string;
  youtube: string;
  tiktok: string;
}

export interface ExtendedWebsiteAnalysis extends WebsiteAnalysis {
  mission: string;
  products: ProductInfo[];
  audiences_detailed: AudienceDetailed[];
  messaging_dos: string;
  messaging_donts: string;
  social_urls: SocialUrls;
}

// ─── Scan Scores (from growth-blueprint edge function) ───────────
export interface ScanScores {
  scanScore: number;
  scanSeo: number;
  scanContent: number;
  scanPerformance: number;
}

// ─── Onboarding Data (accumulated across all phases) ─────────────
export interface OnboardingData {
  // Phase 1: Basics
  companyName: string;
  website: string;
  country: string;
  language: string;

  // Phase 1: AI analysis result
  analysis: ExtendedWebsiteAnalysis | null;
  scanScores: ScanScores | null;

  // Phase 2: Refinements (user can edit AI results)
  products: ProductInfo[];
  audiences: AudienceDetailed[];
  brandValues: string[];
  mission: string;
  messagingDos: string;
  messagingDonts: string;
  tone: string;

  // Phase 3: Strategy (AI generated, user confirms)
  marketingGoals: string[];
  competitors: { name: string; website_url?: string }[];
  selectedChannels: string[];

  // Phase 3: AI results
  strategyResult: StrategyResult | null;
  personaResult: { personas: PersonaResult[] } | null;
  scoringResult: ScoringResult | null;
  integrationResult: { integrations: IntegrationResult[] } | null;
  templateResult: { templates: TemplateResult[] } | null;

  // Social accounts
  socialAccounts: { platform: string; url: string }[];
}

// ─── Competitor Analysis ──────────────────────────────────────────
export interface CompetitorInput {
  name: string;
  website_url?: string;
}

export interface CompetitorResult {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  key_products: string[];
  pricing_strategy: string;
  target_segments: string[];
  opportunities: string[];
  threats: string[];
}

// ─── Strategy ─────────────────────────────────────────────────────
export interface StrategyObjective {
  title: string;
  description: string;
  objective_type: string;
  priority: string;
  target_value: number;
  current_value: number;
  unit: string;
  success_metrics: { metric: string; target: number }[];
  suggested_actions: string[];
}

export interface StrategyResult {
  objectives: StrategyObjective[];
}

// ─── Personas ─────────────────────────────────────────────────────
export interface PersonaResult {
  name: string;
  demographics: Record<string, string>;
  psychographics: Record<string, any>;
  behavioral: Record<string, any>;
}

// ─── Scoring Model ────────────────────────────────────────────────
export interface ScoringRule {
  name: string;
  category: string;
  description: string;
  condition: Record<string, any>;
  points: number;
}

export interface ScoringResult {
  model: {
    name: string;
    description: string;
    category_weights: Record<string, number>;
    threshold_mql: number;
    threshold_sql: number;
  };
  rules: ScoringRule[];
}

// ─── Integrations ─────────────────────────────────────────────────
export interface IntegrationResult {
  platform: string;
  display_name: string;
  category: string;
  reason: string;
  priority: string;
}

// ─── Templates ────────────────────────────────────────────────────
export interface TemplateResult {
  name: string;
  content_type: string;
  category: string;
  description: string;
  prompt_template: string;
  variables: string[];
  channels: string[];
}
