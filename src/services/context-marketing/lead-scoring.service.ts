// src/services/context-marketing/lead-scoring.service.ts
// Predictive Lead Scoring service — AI-powered lead scoring and funnel management

export type LeadStage = 'visitor' | 'lead' | 'mql' | 'sql' | 'opportunity' | 'customer';
export type ScoreCategory = 'behavioral' | 'demographic' | 'firmographic' | 'engagement' | 'intent';

export interface ScoredLead {
  id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  composite_score: number;
  score_breakdown: Record<ScoreCategory, number>;
  stage: LeadStage;
  conversion_probability: number;
  predicted_value: number;
  predicted_close_date?: string;
  hot_signals: string[];
  cold_signals: string[];
  last_activity: string;
  activity_count_30d: number;
  source: string;
  tags: string[];
  score_history: Array<{ date: string; score: number }>;
  next_best_action: string;
}

export interface ScoringRule {
  id: string;
  name: string;
  category: ScoreCategory;
  description: string;
  condition: string;
  points: number;
  is_active: boolean;
  triggers_count: number;
}

export interface ScoringModel {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  accuracy: number;
  total_leads_scored: number;
  last_trained: string;
  category_weights: Record<ScoreCategory, number>;
  threshold_mql: number;
  threshold_sql: number;
}

export interface LeadFunnelData {
  stage: LeadStage;
  label: string;
  count: number;
  conversion_rate: number;
  avg_score: number;
  avg_time_in_stage: number;
  value: number;
}

export interface LeadScoringDashboardData {
  total_leads: number;
  average_score: number;
  hot_leads: number;
  mql_count: number;
  sql_count: number;
  conversion_rate: number;
  score_distribution: Array<{ range: string; count: number; color: string }>;
  funnel: LeadFunnelData[];
  score_trend: Array<{ date: string; avg_score: number; new_leads: number }>;
  top_leads: ScoredLead[];
  recent_score_changes: Array<{ lead_id: string; lead_name: string; old_score: number; new_score: number; reason: string; timestamp: string }>;
}

export interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  suggested_action: string;
  category: string;
}

const mockLeads: ScoredLead[] = [
  { id: 'lead-001', name: 'Sophie Van den Berg', email: 'sophie@techcorp.be', company: 'TechCorp Belgium', title: 'Marketing Director', composite_score: 94, score_breakdown: { behavioral: 92, demographic: 88, firmographic: 96, engagement: 98, intent: 90 }, stage: 'sql', conversion_probability: 0.87, predicted_value: 45000, predicted_close_date: '2026-04-15', hot_signals: ['Pricing page visited 5x', 'Demo requested', 'Downloaded ROI whitepaper'], cold_signals: [], last_activity: '2026-03-09T16:30:00Z', activity_count_30d: 47, source: 'Organic Search', tags: ['enterprise', 'high-value'], score_history: [{ date: '2026-02-10', score: 45 }, { date: '2026-02-17', score: 58 }, { date: '2026-02-24', score: 72 }, { date: '2026-03-03', score: 86 }, { date: '2026-03-10', score: 94 }], next_best_action: 'Schedule executive demo with CEO' },
  { id: 'lead-002', name: 'Thomas De Smedt', email: 'thomas@growthlab.nl', company: 'GrowthLab Netherlands', title: 'CEO', composite_score: 89, score_breakdown: { behavioral: 85, demographic: 92, firmographic: 94, engagement: 88, intent: 86 }, stage: 'sql', conversion_probability: 0.78, predicted_value: 62000, predicted_close_date: '2026-04-22', hot_signals: ['API documentation viewed', 'Competitor comparison page', 'Multiple team members visited'], cold_signals: ['No social engagement'], last_activity: '2026-03-10T09:15:00Z', activity_count_30d: 34, source: 'LinkedIn Ad', tags: ['enterprise', 'multi-user'], score_history: [{ date: '2026-02-10', score: 30 }, { date: '2026-02-17', score: 48 }, { date: '2026-02-24', score: 65 }, { date: '2026-03-03', score: 79 }, { date: '2026-03-10', score: 89 }], next_best_action: 'Send enterprise pricing proposal' },
  { id: 'lead-003', name: 'Marie-Claire Dubois', email: 'mc.dubois@luxebrands.fr', company: 'Luxe Brands Paris', title: 'VP Digital', composite_score: 82, score_breakdown: { behavioral: 78, demographic: 90, firmographic: 88, engagement: 76, intent: 82 }, stage: 'mql', conversion_probability: 0.64, predicted_value: 78000, predicted_close_date: '2026-05-10', hot_signals: ['Case study downloaded', 'Webinar attended', 'Integration page viewed'], cold_signals: ['Low email engagement rate'], last_activity: '2026-03-08T14:00:00Z', activity_count_30d: 21, source: 'Webinar', tags: ['luxury', 'france'], score_history: [{ date: '2026-02-10', score: 35 }, { date: '2026-02-17', score: 42 }, { date: '2026-02-24', score: 55 }, { date: '2026-03-03', score: 68 }, { date: '2026-03-10', score: 82 }], next_best_action: 'Send personalized demo link focused on luxury brand features' },
  { id: 'lead-004', name: 'Jan Willems', email: 'j.willems@mediahuis.be', company: 'Mediahuis', title: 'Digital Marketing Lead', composite_score: 76, score_breakdown: { behavioral: 80, demographic: 72, firmographic: 82, engagement: 74, intent: 70 }, stage: 'mql', conversion_probability: 0.52, predicted_value: 34000, predicted_close_date: '2026-05-25', hot_signals: ['Blog posts read frequently', 'Newsletter subscriber'], cold_signals: ['No pricing page visit', 'Single user visits'], last_activity: '2026-03-09T11:00:00Z', activity_count_30d: 18, source: 'Content Marketing', tags: ['media', 'mid-market'], score_history: [{ date: '2026-02-10', score: 40 }, { date: '2026-02-17', score: 48 }, { date: '2026-02-24', score: 56 }, { date: '2026-03-03', score: 68 }, { date: '2026-03-10', score: 76 }], next_best_action: 'Invite to exclusive media industry webinar' },
  { id: 'lead-005', name: 'Eva Johansson', email: 'eva@scandibrand.se', company: 'ScandiBrand AB', title: 'CMO', composite_score: 71, score_breakdown: { behavioral: 65, demographic: 86, firmographic: 78, engagement: 62, intent: 68 }, stage: 'mql', conversion_probability: 0.45, predicted_value: 52000, predicted_close_date: '2026-06-01', hot_signals: ['Features page explored', 'Connected social account'], cold_signals: ['Low frequency visits', 'Unsubscribed from weekly digest'], last_activity: '2026-03-07T10:00:00Z', activity_count_30d: 12, source: 'Google Ads', tags: ['nordic', 'enterprise'], score_history: [{ date: '2026-02-10', score: 28 }, { date: '2026-02-17', score: 38 }, { date: '2026-02-24', score: 50 }, { date: '2026-03-03', score: 62 }, { date: '2026-03-10', score: 71 }], next_best_action: 'Re-engage with personalized case study for Nordic brands' },
  { id: 'lead-006', name: 'Ahmed El Fassi', email: 'ahmed@digiwave.ma', company: 'DigiWave Morocco', title: 'Founder', composite_score: 65, score_breakdown: { behavioral: 72, demographic: 60, firmographic: 55, engagement: 78, intent: 58 }, stage: 'lead', conversion_probability: 0.34, predicted_value: 18000, predicted_close_date: '2026-06-15', hot_signals: ['Free trial started', 'Active in-app usage'], cold_signals: ['Small company size', 'Budget constraints signal'], last_activity: '2026-03-10T08:00:00Z', activity_count_30d: 28, source: 'Product Hunt', tags: ['startup', 'trial'], score_history: [{ date: '2026-02-10', score: 20 }, { date: '2026-02-17', score: 35 }, { date: '2026-02-24', score: 48 }, { date: '2026-03-03', score: 56 }, { date: '2026-03-10', score: 65 }], next_best_action: 'Offer startup pricing plan' },
  { id: 'lead-007', name: 'Pieter Jansen', email: 'pieter@retailplus.nl', company: 'RetailPlus BV', title: 'E-commerce Manager', composite_score: 58, score_breakdown: { behavioral: 55, demographic: 62, firmographic: 68, engagement: 48, intent: 56 }, stage: 'lead', conversion_probability: 0.28, predicted_value: 28000, hot_signals: ['E-commerce integration page viewed'], cold_signals: ['Low engagement', 'No return visits in 2 weeks'], last_activity: '2026-02-28T15:00:00Z', activity_count_30d: 8, source: 'Referral', tags: ['retail', 'e-commerce'], score_history: [{ date: '2026-02-10', score: 32 }, { date: '2026-02-17', score: 42 }, { date: '2026-02-24', score: 52 }, { date: '2026-03-03', score: 56 }, { date: '2026-03-10', score: 58 }], next_best_action: 'Send e-commerce-specific feature comparison' },
  { id: 'lead-008', name: 'Laura Moretti', email: 'laura@fashionista.it', company: 'Fashionista Milano', title: 'Brand Manager', composite_score: 47, score_breakdown: { behavioral: 42, demographic: 55, firmographic: 50, engagement: 38, intent: 52 }, stage: 'lead', conversion_probability: 0.19, predicted_value: 22000, hot_signals: ['Instagram integration page viewed'], cold_signals: ['Only visited once', 'Bounced from pricing page'], last_activity: '2026-03-02T12:00:00Z', activity_count_30d: 3, source: 'Facebook Ad', tags: ['fashion', 'italy'], score_history: [{ date: '2026-02-10', score: 15 }, { date: '2026-02-17', score: 25 }, { date: '2026-02-24', score: 38 }, { date: '2026-03-03', score: 45 }, { date: '2026-03-10', score: 47 }], next_best_action: 'Nurture with fashion industry success stories' },
  { id: 'lead-009', name: 'Henrik Andersen', email: 'henrik@nordisk.dk', company: 'Nordisk Marketing', title: 'Managing Director', composite_score: 35, score_breakdown: { behavioral: 30, demographic: 48, firmographic: 42, engagement: 25, intent: 30 }, stage: 'visitor', conversion_probability: 0.12, predicted_value: 15000, hot_signals: ['Attended virtual event'], cold_signals: ['No demo request', 'Minimal website interaction', 'Unknown budget'], last_activity: '2026-02-25T09:00:00Z', activity_count_30d: 2, source: 'Event', tags: ['denmark'], score_history: [{ date: '2026-02-10', score: 10 }, { date: '2026-02-17', score: 18 }, { date: '2026-02-24', score: 28 }, { date: '2026-03-03', score: 32 }, { date: '2026-03-10', score: 35 }], next_best_action: 'Add to awareness nurture sequence' },
  { id: 'lead-010', name: 'Claire Fontaine', email: 'claire@agencebleu.fr', company: 'Agence Bleu', title: 'Account Director', composite_score: 91, score_breakdown: { behavioral: 88, demographic: 90, firmographic: 92, engagement: 94, intent: 92 }, stage: 'opportunity', conversion_probability: 0.91, predicted_value: 85000, predicted_close_date: '2026-03-28', hot_signals: ['Contract terms discussed', 'Legal review initiated', 'Budget approved'], cold_signals: [], last_activity: '2026-03-10T11:00:00Z', activity_count_30d: 52, source: 'Partner Referral', tags: ['agency', 'france', 'high-value'], score_history: [{ date: '2026-02-10', score: 60 }, { date: '2026-02-17', score: 72 }, { date: '2026-02-24', score: 80 }, { date: '2026-03-03', score: 87 }, { date: '2026-03-10', score: 91 }], next_best_action: 'Prepare final contract and onboarding timeline' },
];

const mockScoringRules: ScoringRule[] = [
  { id: 'rule-001', name: 'Pricing Page Visit', category: 'intent', description: 'Visited pricing page', condition: 'page_view == "/pricing"', points: 15, is_active: true, triggers_count: 234 },
  { id: 'rule-002', name: 'Demo Request', category: 'intent', description: 'Submitted demo request form', condition: 'form_submit == "demo"', points: 25, is_active: true, triggers_count: 89 },
  { id: 'rule-003', name: 'Content Download', category: 'behavioral', description: 'Downloaded whitepaper, case study, or report', condition: 'download_count > 0', points: 10, is_active: true, triggers_count: 456 },
  { id: 'rule-004', name: 'Email Open Rate', category: 'engagement', description: 'Opened 3+ marketing emails', condition: 'email_opens >= 3', points: 8, is_active: true, triggers_count: 1230 },
  { id: 'rule-005', name: 'Social Engagement', category: 'engagement', description: 'Engaged with social posts (like, comment, share)', condition: 'social_engagements > 0', points: 5, is_active: true, triggers_count: 567 },
  { id: 'rule-006', name: 'C-Level Title', category: 'demographic', description: 'Has C-level or VP title', condition: 'title IN ("CEO", "CTO", "CMO", "VP")', points: 20, is_active: true, triggers_count: 78 },
  { id: 'rule-007', name: 'Enterprise Company', category: 'firmographic', description: 'Company has 500+ employees', condition: 'company_size >= 500', points: 18, is_active: true, triggers_count: 45 },
  { id: 'rule-008', name: 'Return Visitor', category: 'behavioral', description: 'Visited website 5+ times', condition: 'visit_count >= 5', points: 12, is_active: true, triggers_count: 890 },
  { id: 'rule-009', name: 'Integration Page View', category: 'intent', description: 'Viewed specific integration pages', condition: 'page_view LIKE "/integrations/*"', points: 10, is_active: true, triggers_count: 312 },
  { id: 'rule-010', name: 'Free Trial Start', category: 'intent', description: 'Started free trial', condition: 'trial_started == true', points: 30, is_active: true, triggers_count: 156 },
  { id: 'rule-011', name: 'Webinar Attendance', category: 'engagement', description: 'Attended live webinar', condition: 'webinar_attended == true', points: 15, is_active: true, triggers_count: 234 },
  { id: 'rule-012', name: 'Budget Authority', category: 'demographic', description: 'Has budget decision authority', condition: 'budget_authority == true', points: 15, is_active: true, triggers_count: 67 },
  { id: 'rule-013', name: 'Target Industry', category: 'firmographic', description: 'Company in target industry (Tech, Retail, Finance)', condition: 'industry IN ("Technology", "Retail", "Finance")', points: 12, is_active: true, triggers_count: 389 },
  { id: 'rule-014', name: 'Bounce from Pricing', category: 'intent', description: 'Visited pricing page but left immediately', condition: 'pricing_bounce == true', points: -5, is_active: true, triggers_count: 123 },
  { id: 'rule-015', name: 'Unsubscribe', category: 'engagement', description: 'Unsubscribed from emails', condition: 'unsubscribed == true', points: -15, is_active: true, triggers_count: 45 },
];

const mockModel: ScoringModel = {
  id: 'model-001', name: 'Inclufy Lead Score v3.2', description: 'Multi-signal predictive scoring model trained on 12 months of conversion data',
  is_active: true, accuracy: 91.4, total_leads_scored: 8456, last_trained: '2026-03-08T02:00:00Z',
  category_weights: { behavioral: 25, demographic: 15, firmographic: 20, engagement: 20, intent: 20 },
  threshold_mql: 50, threshold_sql: 75,
};

class LeadScoringService {
  async getDashboard(): Promise<LeadScoringDashboardData> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const leads = mockLeads;
        resolve({
          total_leads: 8456,
          average_score: 62.4,
          hot_leads: leads.filter(l => l.composite_score >= 80).length * 12,
          mql_count: leads.filter(l => l.stage === 'mql').length * 28,
          sql_count: leads.filter(l => l.stage === 'sql').length * 15,
          conversion_rate: 12.8,
          score_distribution: [
            { range: '0-10', count: 245, color: '#ef4444' },
            { range: '11-20', count: 389, color: '#f97316' },
            { range: '21-30', count: 567, color: '#f59e0b' },
            { range: '31-40', count: 890, color: '#eab308' },
            { range: '41-50', count: 1234, color: '#84cc16' },
            { range: '51-60', count: 1567, color: '#22c55e' },
            { range: '61-70', count: 1345, color: '#10b981' },
            { range: '71-80', count: 987, color: '#14b8a6' },
            { range: '81-90', count: 756, color: '#06b6d4' },
            { range: '91-100', count: 476, color: '#8b5cf6' },
          ],
          funnel: [
            { stage: 'visitor', label: 'Visitors', count: 24500, conversion_rate: 18.2, avg_score: 15, avg_time_in_stage: 14, value: 0 },
            { stage: 'lead', label: 'Leads', count: 4459, conversion_rate: 35.6, avg_score: 42, avg_time_in_stage: 21, value: 89000 },
            { stage: 'mql', label: 'MQL', count: 1587, conversion_rate: 42.8, avg_score: 65, avg_time_in_stage: 12, value: 476000 },
            { stage: 'sql', label: 'SQL', count: 679, conversion_rate: 56.4, avg_score: 82, avg_time_in_stage: 8, value: 1358000 },
            { stage: 'opportunity', label: 'Opportunity', count: 383, conversion_rate: 67.1, avg_score: 89, avg_time_in_stage: 15, value: 3830000 },
            { stage: 'customer', label: 'Customer', count: 257, conversion_rate: 100, avg_score: 95, avg_time_in_stage: 0, value: 5140000 },
          ],
          score_trend: [
            { date: '2026-02-10', avg_score: 54.2, new_leads: 145 },
            { date: '2026-02-17', avg_score: 56.8, new_leads: 178 },
            { date: '2026-02-24', avg_score: 58.1, new_leads: 156 },
            { date: '2026-03-03', avg_score: 60.5, new_leads: 198 },
            { date: '2026-03-10', avg_score: 62.4, new_leads: 212 },
          ],
          top_leads: leads.filter(l => l.composite_score >= 80).sort((a, b) => b.composite_score - a.composite_score),
          recent_score_changes: [
            { lead_id: 'lead-001', lead_name: 'Sophie Van den Berg', old_score: 86, new_score: 94, reason: 'Requested enterprise demo + visited API docs', timestamp: '2026-03-09T16:30:00Z' },
            { lead_id: 'lead-010', lead_name: 'Claire Fontaine', old_score: 87, new_score: 91, reason: 'Legal review initiated — contract stage signal', timestamp: '2026-03-10T11:00:00Z' },
            { lead_id: 'lead-002', lead_name: 'Thomas De Smedt', old_score: 79, new_score: 89, reason: 'Multiple team members from same company visited', timestamp: '2026-03-10T09:15:00Z' },
            { lead_id: 'lead-003', lead_name: 'Marie-Claire Dubois', old_score: 68, new_score: 82, reason: 'Webinar attended + integration page explored', timestamp: '2026-03-08T14:00:00Z' },
            { lead_id: 'lead-007', lead_name: 'Pieter Jansen', old_score: 56, new_score: 58, reason: 'E-commerce integration page viewed', timestamp: '2026-02-28T15:00:00Z' },
          ],
        });
      }, 800);
    });
  }

  async getLeads(filters?: { stage?: LeadStage; minScore?: number; maxScore?: number }): Promise<ScoredLead[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = [...mockLeads];
        if (filters?.stage) result = result.filter(l => l.stage === filters.stage);
        if (filters?.minScore) result = result.filter(l => l.composite_score >= filters.minScore!);
        if (filters?.maxScore) result = result.filter(l => l.composite_score <= filters.maxScore!);
        resolve(result.sort((a, b) => b.composite_score - a.composite_score));
      }, 500);
    });
  }

  async getLeadById(id: string): Promise<ScoredLead | null> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockLeads.find(l => l.id === id) || null), 300);
    });
  }

  async getScoringRules(): Promise<ScoringRule[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockScoringRules]), 400);
    });
  }

  async updateScoringRule(id: string, updates: Partial<ScoringRule>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  }

  async getScoringModel(): Promise<ScoringModel> {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ ...mockModel }), 400);
    });
  }

  async updateModelWeights(weights: Record<ScoreCategory, number>): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 600);
    });
  }

  async rescoreAllLeads(): Promise<{ total_rescored: number; changes: number }> {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ total_rescored: 8456, changes: 1234 }), 3000);
    });
  }

  async getFunnelData(): Promise<LeadFunnelData[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([
        { stage: 'visitor', label: 'Visitors', count: 24500, conversion_rate: 18.2, avg_score: 15, avg_time_in_stage: 14, value: 0 },
        { stage: 'lead', label: 'Leads', count: 4459, conversion_rate: 35.6, avg_score: 42, avg_time_in_stage: 21, value: 89000 },
        { stage: 'mql', label: 'MQL', count: 1587, conversion_rate: 42.8, avg_score: 65, avg_time_in_stage: 12, value: 476000 },
        { stage: 'sql', label: 'SQL', count: 679, conversion_rate: 56.4, avg_score: 82, avg_time_in_stage: 8, value: 1358000 },
        { stage: 'opportunity', label: 'Opportunity', count: 383, conversion_rate: 67.1, avg_score: 89, avg_time_in_stage: 15, value: 3830000 },
        { stage: 'customer', label: 'Customer', count: 257, conversion_rate: 100, avg_score: 95, avg_time_in_stage: 0, value: 5140000 },
      ]), 500);
    });
  }

  async getPredictiveInsights(): Promise<PredictiveInsight[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([
        { id: 'ins-001', title: 'High-value leads stalling at MQL', description: '23 leads with predicted value >EUR 50K have been in MQL stage for >14 days. Score pattern suggests they need a personalized touchpoint.', impact: 'high', confidence: 87, suggested_action: 'Trigger personalized demo invitation for stalled high-value MQLs', category: 'conversion' },
        { id: 'ins-002', title: 'Webinar attendees convert 3.2x faster', description: 'Leads who attended webinars reach SQL stage 3.2x faster than average. Current webinar pipeline has 45 registered leads.', impact: 'high', confidence: 92, suggested_action: 'Increase webinar frequency and create targeted post-webinar nurture sequence', category: 'acceleration' },
        { id: 'ins-003', title: 'Intent signals from tech sector surging', description: 'Technology sector leads showing 45% increase in pricing page visits and integration page exploration this week.', impact: 'medium', confidence: 78, suggested_action: 'Launch targeted tech sector campaign with integration-focused messaging', category: 'opportunity' },
        { id: 'ins-004', title: 'Email engagement predicting churn risk', description: '12 SQLs have decreased email engagement by >50% in last 2 weeks. Historical pattern shows 40% churn risk.', impact: 'high', confidence: 84, suggested_action: 'Assign dedicated account manager and initiate win-back sequence', category: 'retention' },
        { id: 'ins-005', title: 'Multi-stakeholder visits correlate with deal size', description: 'When 3+ people from same company visit, deal size averages 2.8x higher. Currently 8 companies showing multi-stakeholder activity.', impact: 'medium', confidence: 89, suggested_action: 'Identify and target additional stakeholders at multi-visitor companies', category: 'expansion' },
      ]), 600);
    });
  }
}

export const leadScoringService = new LeadScoringService();
export default leadScoringService;
