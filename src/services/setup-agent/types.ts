// src/services/setup-agent/types.ts

export type SetupStep = 'website' | 'competitors' | 'goals' | 'channels' | 'personas' | 'templates';

export const SETUP_STEPS: SetupStep[] = ['website', 'competitors', 'goals', 'channels', 'personas', 'templates'];

export interface SetupProgress {
  currentStep: number;
  completedSteps: SetupStep[];
  stepData: Record<string, any>;
  startedAt: string;
  lastUpdated: string;
}

// ─── Website Analysis ─────────────────────────────────────────────
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
