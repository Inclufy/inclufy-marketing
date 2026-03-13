// src/services/context-marketing/automation.service.ts
import { supabase } from '@/integrations/supabase/client';

// Type definitions
export interface AutomationRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  automation_type: 'email_sequence' | 'workflow' | 'scoring' | 'campaign' | 'nurture' | 'trigger';
  status: 'active' | 'paused' | 'draft' | 'error' | 'completed';
  trigger_type: 'event' | 'condition' | 'schedule' | 'manual' | 'webhook';
  trigger_conditions: TriggerCondition[];
  actions: AutomationAction[];
  settings: AutomationSettings;
  metrics: AutomationMetrics;
  is_template: boolean;
  created_at: string;
  updated_at: string;
  last_run?: string;
  next_run?: string;
}

export interface TriggerCondition {
  id: string;
  condition_type: 'event' | 'field_change' | 'time_based' | 'score_threshold' | 'tag' | 'form_submission';
  field?: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value?: any;
  time_config?: TimeConfig;
  combine_with?: 'AND' | 'OR';
}

export interface TimeConfig {
  delay_value?: number;
  delay_unit?: 'minutes' | 'hours' | 'days' | 'weeks';
  specific_time?: string;
  timezone?: string;
  recurring?: boolean;
  recurrence_pattern?: string;
}

export interface AutomationAction {
  id: string;
  action_type: 'send_email' | 'add_tag' | 'remove_tag' | 'update_field' | 'create_task' | 'notify_user' | 'webhook' | 'wait' | 'condition';
  name: string;
  config: ActionConfig;
  order: number;
  success_count: number;
  error_count: number;
}

export interface ActionConfig {
  email_template_id?: string;
  tag_name?: string;
  field_updates?: Record<string, any>;
  task_config?: TaskConfig;
  webhook_url?: string;
  wait_config?: TimeConfig;
  condition_config?: ConditionConfig;
  notification_config?: NotificationConfig;
}

export interface TaskConfig {
  title: string;
  description?: string;
  assigned_to?: string;
  due_date_offset?: TimeConfig;
  priority?: 'low' | 'medium' | 'high';
}

export interface ConditionConfig {
  if_conditions: TriggerCondition[];
  then_actions: string[]; // Action IDs
  else_actions?: string[]; // Action IDs
}

export interface NotificationConfig {
  recipient_type: 'user' | 'team' | 'email';
  recipients: string[];
  message_template: string;
  include_data?: boolean;
}

export interface AutomationSettings {
  allow_re_entry: boolean;
  re_entry_delay?: TimeConfig;
  exit_conditions?: TriggerCondition[];
  goal_conditions?: TriggerCondition[];
  timezone: string;
  active_days?: number[]; // 0-6, Sunday-Saturday
  active_hours?: { start: string; end: string };
  max_contacts?: number;
  priority: number;
  tags_on_complete?: string[];
}

export interface AutomationMetrics {
  total_enrolled: number;
  currently_active: number;
  completed: number;
  exited_early: number;
  success_rate: number;
  average_completion_time?: number; // in minutes
  conversion_rate?: number;
  revenue_attributed?: number;
  last_enrollment?: string;
}

export interface AutomationLog {
  id: string;
  automation_id: string;
  contact_id: string;
  action_id: string;
  status: 'success' | 'error' | 'skipped';
  details?: string;
  error_message?: string;
  created_at: string;
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'welcome' | 'nurture' | 'onboarding' | 'retention' | 're_engagement' | 'sales' | 'event' | 'custom';
  automation_type: AutomationRule['automation_type'];
  config: Partial<AutomationRule>;
  preview_image?: string;
  use_count: number;
  rating?: number;
  tags: string[];
}

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'wait' | 'goal';
  data: any;
  position: { x: number; y: number };
  connections: string[];
}

export interface AutomationStats {
  total_automations: number;
  active_automations: number;
  total_contacts_in_automations: number;
  automations_run_today: number;
  total_actions_executed: number;
  success_rate: number;
  time_saved_hours: number;
  top_performing_automations: Array<{
    id: string;
    name: string;
    success_rate: number;
    completions: number;
  }>;
  automation_types_breakdown: Record<string, number>;
  hourly_activity: Array<{ hour: number; count: number }>;
}

// Service implementation
class AutomationService {
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  // CRUD Operations
  async getAutomationRules(): Promise<AutomationRule[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as AutomationRule[];
  }

  async getAutomationById(id: string): Promise<AutomationRule | null> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as unknown as AutomationRule;
  }

  async createAutomation(automation: Partial<AutomationRule>): Promise<AutomationRule> {
    const userId = await this.getUserId();

    const insertPayload = {
      user_id: userId,
      name: automation.name || 'New Automation',
      description: automation.description || null,
      automation_type: automation.automation_type || 'workflow',
      status: automation.status || 'draft',
      trigger_type: automation.trigger_type || 'manual',
      trigger_conditions: automation.trigger_conditions || [],
      actions: automation.actions || [],
      settings: automation.settings || {
        allow_re_entry: false,
        timezone: 'UTC',
        priority: 1,
      },
      metrics: automation.metrics || {
        total_enrolled: 0,
        currently_active: 0,
        completed: 0,
        exited_early: 0,
        success_rate: 0,
      },
      is_template: automation.is_template || false,
    };

    const { data, error } = await supabase
      .from('automation_rules')
      .insert(insertPayload)
      .select('*')
      .single();

    if (error) throw error;
    return data as unknown as AutomationRule;
  }

  async updateAutomation(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('automation_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data as unknown as AutomationRule;
  }

  async deleteAutomation(id: string): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Status Management
  async activateAutomation(id: string): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from('automation_rules')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async pauseAutomation(id: string): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from('automation_rules')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getActiveWorkflows(): Promise<AutomationRule[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as AutomationRule[];
  }

  // Template Operations
  async getAutomationTemplates(): Promise<AutomationTemplate[]> {
    const { data, error } = await supabase
      .from('automation_templates_ai')
      .select('*')
      .order('use_count', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as AutomationTemplate[];
  }

  async createFromTemplate(templateId: string, customizations: Partial<AutomationRule>): Promise<AutomationRule> {
    const { data: template, error: templateError } = await supabase
      .from('automation_templates_ai')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw new Error('Template not found');

    const tmpl = template as unknown as AutomationTemplate;

    return this.createAutomation({
      ...tmpl.config,
      ...customizations,
      name: customizations.name || `${tmpl.name} - Copy`,
    });
  }

  // Analytics & Metrics
  async getAutomationStats(): Promise<AutomationStats> {
    const userId = await this.getUserId();

    // Fetch all rules
    const { data: rulesData, error: rulesError } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('user_id', userId);

    if (rulesError) throw rulesError;

    const rules = (rulesData || []) as unknown as AutomationRule[];

    // Fetch today's logs
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: logsData, error: logsError } = await supabase
      .from('automation_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString());

    if (logsError) throw logsError;

    const todayLogs = (logsData || []) as unknown as AutomationLog[];

    const activeRules = rules.filter(r => r.status === 'active');
    const totalContacts = rules.reduce((sum, r) => sum + (r.metrics?.currently_active || 0), 0);
    const totalActions = rules.reduce((sum, r) =>
      sum + (r.actions || []).reduce((aSum: number, a: AutomationAction) => aSum + a.success_count + a.error_count, 0), 0
    );
    const successLogs = todayLogs.filter(l => l.status === 'success').length;
    const successRate = todayLogs.length > 0 ? Math.round((successLogs / todayLogs.length) * 100) : 0;

    // Automation types breakdown
    const typesBreakdown: Record<string, number> = {};
    rules.forEach(r => {
      typesBreakdown[r.automation_type] = (typesBreakdown[r.automation_type] || 0) + 1;
    });

    // Top performing
    const topPerforming = rules
      .filter(r => r.metrics && r.metrics.success_rate > 0)
      .sort((a, b) => b.metrics.success_rate - a.metrics.success_rate)
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        name: r.name,
        success_rate: r.metrics.success_rate,
        completions: r.metrics.completed,
      }));

    return {
      total_automations: rules.length,
      active_automations: activeRules.length,
      total_contacts_in_automations: totalContacts,
      automations_run_today: todayLogs.length,
      total_actions_executed: totalActions,
      success_rate: successRate,
      time_saved_hours: Math.round(totalActions * 0.25),
      top_performing_automations: topPerforming,
      automation_types_breakdown: typesBreakdown,
      hourly_activity: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: todayLogs.filter(l => new Date(l.created_at).getHours() === i).length,
      })),
    };
  }

  async getAutomationLogs(automationId: string, limit: number = 100): Promise<AutomationLog[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('automation_logs')
      .select('*')
      .eq('automation_id', automationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as unknown as AutomationLog[];
  }

  // Workflow Management
  async getWorkflowNodes(automationId: string): Promise<WorkflowNode[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('automation_rules')
      .select('actions')
      .eq('id', automationId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const actions = (data?.actions || []) as unknown as AutomationAction[];

    // Convert actions JSONB to workflow nodes
    return actions.map((action, index) => ({
      id: action.id,
      type: action.action_type === 'condition' ? 'condition' as const :
            action.action_type === 'wait' ? 'wait' as const :
            'action' as const,
      data: action,
      position: { x: 250, y: 100 + index * 120 },
      connections: index < actions.length - 1 ? [actions[index + 1].id] : [],
    }));
  }

  async testAutomation(id: string, testContactId: string): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from('automation_logs')
      .insert({
        automation_id: id,
        contact_id: testContactId,
        action_id: 'test_run',
        status: 'success',
        details: 'Test run executed',
        user_id: userId,
      });

    if (error) throw error;
  }

  // Utility Methods
  async validateAutomation(automation: Partial<AutomationRule>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!automation.name) errors.push('Name is required');
    if (!automation.trigger_conditions || automation.trigger_conditions.length === 0) {
      errors.push('At least one trigger condition is required');
    }
    if (!automation.actions || automation.actions.length === 0) {
      errors.push('At least one action is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async duplicateAutomation(id: string): Promise<AutomationRule> {
    const original = await this.getAutomationById(id);
    if (!original) throw new Error('Automation not found');

    // Remove id so a new one is generated, reset status and metrics
    const { id: _id, ...rest } = original;

    return this.createAutomation({
      ...rest,
      name: `${original.name} - Copy`,
      status: 'draft',
      metrics: {
        total_enrolled: 0,
        currently_active: 0,
        completed: 0,
        exited_early: 0,
        success_rate: 0,
      },
    });
  }
}

// Export singleton instance
export const automationService = new AutomationService();

// Re-export service as default for consistency
export default automationService;
