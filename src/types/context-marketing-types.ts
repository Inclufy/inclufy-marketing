// src/types/context-marketing.ts

// Business Context Types
export interface OrganizationEntity {
  id: string;
  user_id: string;
  parent_id?: string;
  entity_name: string;
  entity_type: 'holding' | 'subsidiary' | 'division' | 'department' | 'team';
  legal_name?: string;
  legal_structure?: 'corporation' | 'llc' | 'partnership' | 'nonprofit' | 'government';
  jurisdiction?: string;
  description?: string;
  employee_count?: number;
  annual_revenue?: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
  children?: OrganizationEntity[];
}

export interface StrategicObjective {
  id: string;
  user_id: string;
  org_entity_id?: string;
  title: string;
  description?: string;
  objective_type: 'financial' | 'operational' | 'customer' | 'innovation' | 'sustainability';
  priority: number;
  time_horizon: 'quarter' | '1year' | '3year' | '5year';
  target_date?: string;
  status: 'draft' | 'active' | 'completed' | 'paused' | 'cancelled';
  success_metrics?: SuccessMetric[];
  owner_name?: string;
  owner_role?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface SuccessMetric {
  id?: number;
  name: string;
  target: string;
  unit: string;
}

export interface OperatingModel {
  id: string;
  user_id: string;
  business_model_type: 'b2b' | 'b2c' | 'b2g' | 'marketplace' | 'platform' | 'hybrid';
  revenue_model: 'subscription' | 'transactional' | 'licensing' | 'advertising' | 'freemium' | 'hybrid';
  target_market?: string;
  value_proposition?: string;
  key_activities?: KeyActivity[];
  key_resources?: KeyResource[];
  key_partnerships?: Partnership[];
  cost_structure?: CostStructure;
  revenue_streams?: RevenueStream[];
  maturity_stage?: 'startup' | 'growth' | 'scale' | 'mature' | 'transformation';
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface KeyActivity {
  name: string;
  category: string;
  importance: 'critical' | 'important' | 'supportive';
}

export interface KeyResource {
  name: string;
  type: 'human' | 'physical' | 'intellectual' | 'financial';
  description: string;
}

export interface Partnership {
  name: string;
  type: string;
  strategic_value: string;
}

export interface CostStructure {
  fixed_costs: string[];
  variable_costs: string[];
  major_expenses: string[];
}

export interface RevenueStream {
  name: string;
  type: string;
  percentage: number;
  description: string;
}

export interface GovernanceFramework {
  id: string;
  user_id: string;
  decision_framework?: string;
  approval_levels?: ApprovalLevel[];
  risk_tolerance?: 'conservative' | 'moderate' | 'aggressive';
  compliance_requirements?: ComplianceRequirement[];
  key_policies?: Policy[];
  governance_bodies?: GovernanceBody[];
  reporting_structure?: ReportingStructure;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface ApprovalLevel {
  level: number;
  role: string;
  threshold: string;
  description: string;
}

export interface ComplianceRequirement {
  name: string;
  type: string;
  status: 'compliant' | 'in_progress' | 'non_compliant';
  description: string;
}

export interface Policy {
  name: string;
  category: string;
  status: 'active' | 'draft' | 'review';
  lastReviewed: string;
}

export interface GovernanceBody {
  name: string;
  type: string;
  frequency: string;
  members: string[];
}

export interface ReportingStructure {
  board_reporting: string;
  executive_reporting: string;
  operational_reporting: string;
}

// Product Context Types
export interface Product {
  id: string;
  user_id: string;
  product_name: string;
  product_code?: string;
  status: 'concept' | 'development' | 'pilot' | 'beta' | 'live' | 'sunset' | 'deprecated';
  product_type: 'software' | 'service' | 'platform' | 'hardware' | 'hybrid';
  description?: string;
  launch_date?: string;
  sunset_date?: string;
  target_audience?: string[];
  key_features?: string[];
  differentiators?: string[];
  constraints?: ProductConstraint[];
  dependencies?: string[];
  pricing_model?: PricingModel;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface ProductConstraint {
  type: 'availability' | 'technical' | 'regulatory' | 'capacity';
  description: string;
  regions?: string[];
}

export interface PricingModel {
  type: 'subscription' | 'perpetual' | 'usage' | 'tiered' | 'freemium' | 'custom';
  details?: any;
}

export interface ProductRelationship {
  id: string;
  user_id: string;
  product_id: string;
  related_product_id: string;
  relationship_type: 'depends_on' | 'integrates_with' | 'replaces' | 'complements' | 'bundles_with' | 'conflicts_with';
  description?: string;
  metadata?: any;
  created_at: string;
}

export interface ProductRoadmapItem {
  id: string;
  user_id: string;
  product_id: string;
  feature_name: string;
  feature_description?: string;
  quarter: string;
  year: number;
  confidence_level: number;
  public_commitment: boolean;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  dependencies?: string[];
  metadata?: any;
  created_at: string;
  updated_at: string;
}

// Context Completeness Types
export interface ContextCompleteness {
  id: string;
  user_id: string;
  domain: 'business' | 'product' | 'market' | 'competitive' | 'audience' | 'geographic' | 'brand' | 'overall';
  completeness_score: number;
  missing_elements?: string[];
  last_updated: string;
  metadata?: any;
}

// Context Validation Types
export interface ValidationRule {
  id: string;
  rule_name: string;
  rule_type: 'required' | 'consistency' | 'format' | 'business_logic';
  domain?: string;
  validation_logic: any;
  error_message?: string;
  severity: 'error' | 'warning' | 'info';
  is_active: boolean;
  metadata?: any;
  created_at: string;
}

export interface ContextAssumption {
  id: string;
  user_id: string;
  assumption_type: 'data_gap' | 'inference' | 'default_value' | 'external_source';
  domain?: string;
  assumption_text: string;
  confidence_level: number;
  validation_status: 'unverified' | 'verified' | 'rejected';
  context?: any;
  created_at: string;
  validated_at?: string;
}

// Service Response Types
export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  domain?: string;
  field?: string;
  type?: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  feature?: string;
  product?: string;
  suggestion?: string;
}

export interface ContextHealth {
  domains: ContextCompleteness[];
  overall: number;
}