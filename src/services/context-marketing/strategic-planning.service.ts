// src/services/context-marketing/strategic-planning.service.ts
import { supabase } from '@/integrations/supabase/client';

// Type definitions
export interface StrategicPlan {
  id: string;
  user_id: string;
  plan_name: string;
  plan_type: 'annual' | 'quarterly' | 'campaign' | 'product_launch' | 'custom';
  description?: string;
  goals?: Goal[];
  strategies?: Strategy[];
  timeline?: Timeline;
  resources?: ResourceAllocation;
  scenarios?: Scenario[];
  status: 'draft' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  approved_at?: string;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status?: 'on_track' | 'at_risk' | 'behind' | 'completed';
  owner?: string;
  dependencies?: string[];
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  target_date: string;
  completed: boolean;
  completed_date?: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  type: 'growth' | 'retention' | 'acquisition' | 'engagement' | 'brand' | 'operational';
  tactics?: string[];
  owner?: string;
  timeline?: string;
  budget?: number;
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  success_metrics?: string[];
}

export interface Timeline {
  start_date: string;
  end_date: string;
  phases?: Phase[];
  key_dates?: KeyDate[];
}

export interface Phase {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  objectives: string[];
  deliverables: string[];
}

export interface KeyDate {
  date: string;
  event: string;
  type: 'milestone' | 'deadline' | 'review' | 'launch';
}

export interface ResourceAllocation {
  total_budget: number;
  budget_breakdown: Record<string, number>;
  team_members: TeamMember[];
  time_allocation: Record<string, number>; // hours per week
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  allocation_percentage: number;
  responsibilities: string[];
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  probability: number; // 0-100
  impact: 'positive' | 'negative';
  impact_level: 'low' | 'medium' | 'high';
  strategies?: string[];
  triggers?: string[];
}

export interface StrategySuggestion {
  id: string;
  strategy: Strategy;
  rationale: string;
  expected_impact: string;
  effort_level: 'low' | 'medium' | 'high';
  confidence_score: number;
}

// Service implementation
class StrategicPlanningService {
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  // Plan Management
  async getPlans(): Promise<StrategicPlan[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('strategic_plans')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as StrategicPlan[];
  }

  async getPlanById(id: string): Promise<StrategicPlan | null> {
    const userId = await this.getUserId();
    const { data, error } = await supabase
      .from('strategic_plans')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as StrategicPlan | null;
  }

  async createPlan(plan: Partial<StrategicPlan>): Promise<StrategicPlan> {
    const userId = await this.getUserId();

    const newPlan = {
      user_id: userId,
      plan_name: plan.plan_name || 'New Strategic Plan',
      plan_type: plan.plan_type || 'quarterly',
      description: plan.description || null,
      goals: plan.goals || [],
      strategies: plan.strategies || [],
      timeline: plan.timeline || null,
      resources: plan.resources || null,
      scenarios: plan.scenarios || [],
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('strategic_plans')
      .insert(newPlan)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as StrategicPlan;
  }

  async updatePlan(id: string, updates: Partial<StrategicPlan>): Promise<StrategicPlan> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('strategic_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error('Plan not found');
    return data as unknown as StrategicPlan;
  }

  // Goal Management - append to goals JSONB array
  async addGoal(planId: string, goal: Goal): Promise<void> {
    const plan = await this.getPlanById(planId);
    if (!plan) throw new Error('Plan not found');

    const newGoal: Goal = {
      ...goal,
      id: `goal_${Date.now()}`
    };

    const currentGoals = plan.goals || [];
    const updatedGoals = [...currentGoals, newGoal];

    const userId = await this.getUserId();
    const { error } = await supabase
      .from('strategic_plans')
      .update({
        goals: updatedGoals as unknown as Record<string, unknown>[],
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async updateGoal(planId: string, goalId: string, updates: Partial<Goal>): Promise<void> {
    const plan = await this.getPlanById(planId);
    if (!plan || !plan.goals) throw new Error('Plan or goals not found');

    const goalIndex = plan.goals.findIndex(g => g.id === goalId);
    if (goalIndex === -1) throw new Error('Goal not found');

    const updatedGoals = [...plan.goals];
    updatedGoals[goalIndex] = { ...updatedGoals[goalIndex], ...updates };

    const userId = await this.getUserId();
    const { error } = await supabase
      .from('strategic_plans')
      .update({
        goals: updatedGoals as unknown as Record<string, unknown>[],
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .eq('user_id', userId);
    if (error) throw error;
  }

  // Strategy Management - append to strategies JSONB array
  async addStrategy(planId: string, strategy: Strategy): Promise<void> {
    const plan = await this.getPlanById(planId);
    if (!plan) throw new Error('Plan not found');

    const newStrategy: Strategy = {
      ...strategy,
      id: `strategy_${Date.now()}`
    };

    const currentStrategies = plan.strategies || [];
    const updatedStrategies = [...currentStrategies, newStrategy];

    const userId = await this.getUserId();
    const { error } = await supabase
      .from('strategic_plans')
      .update({
        strategies: updatedStrategies as unknown as Record<string, unknown>[],
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .eq('user_id', userId);
    if (error) throw error;
  }

  // AI-Powered Features
  async generateStrategySuggestions(planId: string): Promise<StrategySuggestion[]> {
    const plan = await this.getPlanById(planId);
    if (!plan) return [];

    const goals = plan.goals || [];
    const strategies = plan.strategies || [];

    // Analyze existing goals to generate relevant suggestions
    const suggestions: StrategySuggestion[] = [];

    // Suggest growth strategy if no growth strategy exists
    const hasGrowth = strategies.some(s => s.type === 'growth');
    if (!hasGrowth) {
      suggestions.push({
        id: `suggestion_${Date.now()}_1`,
        strategy: {
          id: `suggested_${Date.now()}_1`,
          name: 'Implement Dynamic Pricing Strategy',
          description: 'Use AI to optimize pricing based on demand, competition, and customer segments',
          type: 'growth',
          tactics: [
            'Deploy pricing optimization algorithm',
            'A/B test price points by segment',
            'Monitor competitor pricing in real-time',
            'Create value-based bundles'
          ],
          budget: 15000,
          success_metrics: ['Revenue increase', 'Conversion rate', 'Average order value']
        },
        rationale: 'No growth strategy currently defined. Dynamic pricing can capture price-sensitive customers.',
        expected_impact: '15-20% revenue increase',
        effort_level: 'medium',
        confidence_score: 87
      });
    }

    // Suggest acquisition strategy if goals mention customer growth
    const hasAcquisitionGoal = goals.some(g =>
      g.name.toLowerCase().includes('customer') ||
      g.name.toLowerCase().includes('acquisition') ||
      g.name.toLowerCase().includes('expand')
    );
    const hasAcquisition = strategies.some(s => s.type === 'acquisition');
    if (hasAcquisitionGoal && !hasAcquisition) {
      suggestions.push({
        id: `suggestion_${Date.now()}_2`,
        strategy: {
          id: `suggested_${Date.now()}_2`,
          name: 'Launch Referral Program',
          description: 'Incentivize existing customers to refer new business',
          type: 'acquisition',
          tactics: [
            'Design tiered referral rewards',
            'Build referral tracking system',
            'Create referral marketing materials',
            'Launch to top 20% of customers first'
          ],
          budget: 20000,
          success_metrics: ['New customer acquisition', 'Customer lifetime value', 'Referral rate']
        },
        rationale: 'Customer acquisition goals detected without a referral program. Referral programs typically see 3x higher conversion rates.',
        expected_impact: '250+ new customers per month',
        effort_level: 'low',
        confidence_score: 92
      });
    }

    // Suggest retention if at-risk goals exist
    const hasAtRiskGoals = goals.some(g => g.status === 'at_risk' || g.status === 'behind');
    if (hasAtRiskGoals) {
      suggestions.push({
        id: `suggestion_${Date.now()}_3`,
        strategy: {
          id: `suggested_${Date.now()}_3`,
          name: 'Customer Retention Campaign',
          description: 'Targeted retention efforts to address at-risk goals',
          type: 'retention',
          tactics: [
            'Identify at-risk customer segments',
            'Create personalized re-engagement flows',
            'Offer loyalty incentives',
            'Implement proactive support outreach'
          ],
          budget: 10000,
          success_metrics: ['Churn reduction', 'Customer satisfaction', 'Renewal rate']
        },
        rationale: 'At-risk goals detected. A focused retention campaign can help recover performance.',
        expected_impact: '20-30% churn reduction',
        effort_level: 'medium',
        confidence_score: 85
      });
    }

    // Always provide at least one suggestion
    if (suggestions.length === 0) {
      suggestions.push({
        id: `suggestion_${Date.now()}_default`,
        strategy: {
          id: `suggested_${Date.now()}_default`,
          name: 'Content Marketing Scale-up',
          description: 'Increase content production to drive organic growth',
          type: 'growth',
          tactics: [
            'Double content production cadence',
            'Repurpose top-performing content',
            'Launch thought leadership series',
            'Optimize for search and social'
          ],
          budget: 15000,
          success_metrics: ['Organic traffic', 'Content engagement', 'Lead generation']
        },
        rationale: 'Content marketing provides consistent, compounding returns with relatively low investment.',
        expected_impact: '50-100% organic traffic increase',
        effort_level: 'medium',
        confidence_score: 80
      });
    }

    return suggestions;
  }

  async generateGoalSuggestions(context: any): Promise<Goal[]> {
    // Generate SMART goals based on context
    const goals: Goal[] = [
      {
        id: `suggested_goal_${Date.now()}_1`,
        name: 'Improve Customer Retention',
        description: 'Increase customer retention rate through enhanced engagement',
        target_value: 85,
        current_value: context?.current_retention || 72,
        unit: '%',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'high'
      },
      {
        id: `suggested_goal_${Date.now()}_2`,
        name: 'Reduce Customer Acquisition Cost',
        description: 'Optimize marketing spend to reduce CAC',
        target_value: 50,
        current_value: context?.current_cac || 75,
        unit: 'USD',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        priority: 'medium'
      }
    ];

    return goals;
  }

  async runScenarioAnalysis(planId: string, scenario: Scenario): Promise<{
    impact: any;
    recommendations: string[];
  }> {
    const plan = await this.getPlanById(planId);
    if (!plan) throw new Error('Plan not found');

    const goals = plan.goals || [];
    const strategies = plan.strategies || [];

    // Compute impact based on scenario and plan data
    const totalBudget = strategies.reduce((sum, s) => sum + (s.budget || 0), 0);
    const goalsOnTrack = goals.filter(g => g.status === 'on_track').length;
    const totalGoals = goals.length || 1;

    const revenueChangePercent = scenario.impact === 'positive'
      ? (scenario.probability / 100) * (scenario.impact_level === 'high' ? 20 : scenario.impact_level === 'medium' ? 10 : 5)
      : -(scenario.probability / 100) * (scenario.impact_level === 'high' ? 15 : scenario.impact_level === 'medium' ? 8 : 3);

    const recommendations: string[] = [];
    if (scenario.impact === 'negative') {
      recommendations.push('Adjust budget allocation to high-performing channels');
      if (goalsOnTrack / totalGoals < 0.7) {
        recommendations.push('Re-prioritize goals to focus on critical outcomes');
      }
      recommendations.push('Consider hiring additional contractors');
    } else {
      recommendations.push('Accelerate content production timeline');
      recommendations.push('Increase investment in top-performing strategies');
      if (totalBudget > 0) {
        recommendations.push('Reallocate savings to emerging opportunities');
      }
    }

    return {
      impact: {
        revenue_change: `${revenueChangePercent > 0 ? '+' : ''}${Math.round(revenueChangePercent)}%`,
        timeline_adjustment: scenario.impact === 'negative'
          ? `+${scenario.impact_level === 'high' ? 3 : scenario.impact_level === 'medium' ? 2 : 1} weeks`
          : '0',
        resource_needs: scenario.impact_level === 'high'
          ? '+20%'
          : scenario.impact_level === 'medium'
            ? '+10%'
            : '+5%'
      },
      recommendations
    };
  }

  async optimizeResourceAllocation(planId: string): Promise<ResourceAllocation> {
    const plan = await this.getPlanById(planId);
    if (!plan) throw new Error('Plan not found');

    const strategies = plan.strategies || [];
    const existingResources = plan.resources;

    // Compute optimized allocation from strategies
    const totalBudget = existingResources?.total_budget
      || strategies.reduce((sum, s) => sum + (s.budget || 0), 0)
      || 100000;

    const budgetBreakdown: Record<string, number> = {};
    if (strategies.length > 0) {
      // Allocate proportionally based on strategy budgets
      const strategyTotal = strategies.reduce((sum, s) => sum + (s.budget || totalBudget / strategies.length), 0);
      for (const s of strategies) {
        const budget = s.budget || totalBudget / strategies.length;
        budgetBreakdown[s.name] = Math.round((budget / strategyTotal) * totalBudget);
      }
    } else {
      budgetBreakdown['Paid Advertising'] = Math.round(totalBudget * 0.35);
      budgetBreakdown['Content Creation'] = Math.round(totalBudget * 0.25);
      budgetBreakdown['Email Marketing'] = Math.round(totalBudget * 0.15);
      budgetBreakdown['Social Media'] = Math.round(totalBudget * 0.15);
      budgetBreakdown['Analytics & Tools'] = Math.round(totalBudget * 0.10);
    }

    const teamMembers = existingResources?.team_members || [];
    const timeAllocation: Record<string, number> = existingResources?.time_allocation || {
      'Campaign Planning': 20,
      'Content Creation': 30,
      'Analysis & Optimization': 15,
      'Team Coordination': 10
    };

    return {
      total_budget: totalBudget,
      budget_breakdown: budgetBreakdown,
      team_members: teamMembers,
      time_allocation: timeAllocation
    };
  }

  async getProgressReport(planId: string): Promise<{
    overall_progress: number;
    goals_status: any;
    strategies_status: any;
    risks: string[];
    opportunities: string[];
  }> {
    const plan = await this.getPlanById(planId);
    if (!plan) throw new Error('Plan not found');

    const goals = plan.goals || [];
    const strategies = plan.strategies || [];

    // Compute goals status
    const goalsStatus = {
      on_track: goals.filter(g => g.status === 'on_track').length,
      at_risk: goals.filter(g => g.status === 'at_risk').length,
      behind: goals.filter(g => g.status === 'behind').length,
      completed: goals.filter(g => g.status === 'completed').length
    };

    // Compute strategies status
    const strategiesStatus = {
      planned: strategies.filter(s => s.status === 'planned').length,
      in_progress: strategies.filter(s => s.status === 'in_progress').length,
      completed: strategies.filter(s => s.status === 'completed').length,
      cancelled: strategies.filter(s => s.status === 'cancelled').length
    };

    // Compute overall progress from goals
    let overallProgress = 0;
    if (goals.length > 0) {
      const progressPerGoal = goals.map(g => {
        if (g.target_value === 0) return 100;
        return Math.min(100, (g.current_value / g.target_value) * 100);
      });
      overallProgress = Math.round(
        progressPerGoal.reduce((sum, p) => sum + p, 0) / goals.length
      );
    }

    // Identify risks from at-risk/behind goals
    const risks: string[] = [];
    goals.filter(g => g.status === 'at_risk' || g.status === 'behind').forEach(g => {
      risks.push(`Goal "${g.name}" is ${g.status === 'at_risk' ? 'at risk' : 'behind schedule'}`);
    });
    if (risks.length === 0) {
      risks.push('No critical risks identified at this time');
    }

    // Identify opportunities from goals near completion or high-performing strategies
    const opportunities: string[] = [];
    goals.filter(g => g.current_value / g.target_value > 0.8 && g.status !== 'completed').forEach(g => {
      opportunities.push(`Goal "${g.name}" is near completion - consider raising the target`);
    });
    strategies.filter(s => s.status === 'in_progress').forEach(s => {
      opportunities.push(`Strategy "${s.name}" in progress - monitor for early results`);
    });
    if (opportunities.length === 0) {
      opportunities.push('Review current strategies for optimization potential');
    }

    return {
      overall_progress: overallProgress,
      goals_status: goalsStatus,
      strategies_status: strategiesStatus,
      risks,
      opportunities
    };
  }
}

// Export singleton instance
export const strategicPlanningService = new StrategicPlanningService();

// Re-export as default
export default strategicPlanningService;
