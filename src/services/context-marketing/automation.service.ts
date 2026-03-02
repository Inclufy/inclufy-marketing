// src/services/context-marketing/automation.service.ts

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
  private mockAutomations: AutomationRule[] = [
    {
      id: '1',
      user_id: 'user1',
      name: 'Welcome Email Series',
      description: 'Onboard new subscribers with a 5-email series',
      automation_type: 'email_sequence',
      status: 'active',
      trigger_type: 'event',
      trigger_conditions: [
        {
          id: 'tc1',
          condition_type: 'tag',
          operator: 'equals',
          value: 'new_subscriber'
        }
      ],
      actions: [
        {
          id: 'a1',
          action_type: 'send_email',
          name: 'Welcome Email',
          config: { email_template_id: 'welcome_1' },
          order: 1,
          success_count: 234,
          error_count: 2
        },
        {
          id: 'a2',
          action_type: 'wait',
          name: 'Wait 2 days',
          config: { wait_config: { delay_value: 2, delay_unit: 'days' } },
          order: 2,
          success_count: 230,
          error_count: 0
        }
      ],
      settings: {
        allow_re_entry: false,
        timezone: 'America/New_York',
        priority: 1
      },
      metrics: {
        total_enrolled: 250,
        currently_active: 45,
        completed: 200,
        exited_early: 5,
        success_rate: 89,
        average_completion_time: 7200,
        conversion_rate: 34
      },
      is_template: false,
      created_at: new Date('2024-01-15').toISOString(),
      updated_at: new Date().toISOString(),
      last_run: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      user_id: 'user1',
      name: 'Cart Abandonment Recovery',
      description: 'Recover lost sales from abandoned carts',
      automation_type: 'workflow',
      status: 'active',
      trigger_type: 'event',
      trigger_conditions: [
        {
          id: 'tc2',
          condition_type: 'event',
          operator: 'equals',
          value: 'cart_abandoned',
          time_config: { delay_value: 1, delay_unit: 'hours' }
        }
      ],
      actions: [
        {
          id: 'a3',
          action_type: 'send_email',
          name: 'Reminder Email',
          config: { email_template_id: 'cart_reminder_1' },
          order: 1,
          success_count: 89,
          error_count: 1
        }
      ],
      settings: {
        allow_re_entry: true,
        re_entry_delay: { delay_value: 7, delay_unit: 'days' },
        timezone: 'America/New_York',
        priority: 2
      },
      metrics: {
        total_enrolled: 100,
        currently_active: 12,
        completed: 85,
        exited_early: 3,
        success_rate: 34,
        revenue_attributed: 12500
      },
      is_template: false,
      created_at: new Date('2024-02-01').toISOString(),
      updated_at: new Date().toISOString(),
      last_run: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    }
  ];

  private mockTemplates: AutomationTemplate[] = [
    {
      id: 't1',
      name: 'Welcome Series for New Customers',
      description: 'A 5-email series to onboard new customers',
      category: 'welcome',
      automation_type: 'email_sequence',
      config: {
        name: 'Welcome Series',
        trigger_type: 'event',
        automation_type: 'email_sequence'
      },
      use_count: 1234,
      rating: 4.8,
      tags: ['onboarding', 'email', 'new customer']
    },
    {
      id: 't2',
      name: 'Lead Nurturing Campaign',
      description: 'Nurture leads through the sales funnel',
      category: 'nurture',
      automation_type: 'workflow',
      config: {
        name: 'Lead Nurturing',
        trigger_type: 'condition',
        automation_type: 'workflow'
      },
      use_count: 890,
      rating: 4.6,
      tags: ['leads', 'sales', 'nurture']
    }
  ];

  // CRUD Operations
  async getAutomationRules(): Promise<AutomationRule[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockAutomations;
  }

  async getAutomationById(id: string): Promise<AutomationRule | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockAutomations.find(a => a.id === id) || null;
  }

  async createAutomation(automation: Partial<AutomationRule>): Promise<AutomationRule> {
    const newAutomation: AutomationRule = {
      id: Date.now().toString(),
      user_id: 'user1',
      name: automation.name || 'New Automation',
      automation_type: automation.automation_type || 'workflow',
      status: 'draft',
      trigger_type: automation.trigger_type || 'manual',
      trigger_conditions: automation.trigger_conditions || [],
      actions: automation.actions || [],
      settings: automation.settings || {
        allow_re_entry: false,
        timezone: 'UTC',
        priority: 1
      },
      metrics: {
        total_enrolled: 0,
        currently_active: 0,
        completed: 0,
        exited_early: 0,
        success_rate: 0
      },
      is_template: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...automation
    };

    this.mockAutomations.push(newAutomation);
    return newAutomation;
  }

  async updateAutomation(id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const index = this.mockAutomations.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Automation not found');

    this.mockAutomations[index] = {
      ...this.mockAutomations[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    return this.mockAutomations[index];
  }

  async deleteAutomation(id: string): Promise<void> {
    const index = this.mockAutomations.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Automation not found');
    
    this.mockAutomations.splice(index, 1);
  }

  // Status Management
  async activateAutomation(id: string): Promise<void> {
    await this.updateAutomation(id, { status: 'active' });
  }

  async pauseAutomation(id: string): Promise<void> {
    await this.updateAutomation(id, { status: 'paused' });
  }

  async getActiveWorkflows(): Promise<AutomationRule[]> {
    return this.mockAutomations.filter(a => a.status === 'active');
  }

  // Template Operations
  async getAutomationTemplates(): Promise<AutomationTemplate[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.mockTemplates;
  }

  async createFromTemplate(templateId: string, customizations: Partial<AutomationRule>): Promise<AutomationRule> {
    const template = this.mockTemplates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    return this.createAutomation({
      ...template.config,
      ...customizations,
      name: customizations.name || `${template.name} - Copy`
    });
  }

  // Analytics & Metrics
  async getAutomationStats(): Promise<AutomationStats> {
    await new Promise(resolve => setTimeout(resolve, 400));

    const activeAutomations = this.mockAutomations.filter(a => a.status === 'active');
    const totalContacts = this.mockAutomations.reduce((sum, a) => sum + a.metrics.currently_active, 0);
    const totalActions = this.mockAutomations.reduce((sum, a) => 
      sum + a.actions.reduce((actionSum, action) => actionSum + action.success_count + action.error_count, 0), 0
    );

    return {
      total_automations: this.mockAutomations.length,
      active_automations: activeAutomations.length,
      total_contacts_in_automations: totalContacts,
      automations_run_today: 89,
      total_actions_executed: totalActions,
      success_rate: 72,
      time_saved_hours: 156,
      top_performing_automations: this.mockAutomations
        .filter(a => a.metrics.success_rate > 0)
        .sort((a, b) => b.metrics.success_rate - a.metrics.success_rate)
        .slice(0, 5)
        .map(a => ({
          id: a.id,
          name: a.name,
          success_rate: a.metrics.success_rate,
          completions: a.metrics.completed
        })),
      automation_types_breakdown: {
        email_sequence: 4,
        workflow: 3,
        scoring: 2,
        campaign: 3
      },
      hourly_activity: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        count: Math.floor(Math.random() * 50) + 10
      }))
    };
  }

  async getAutomationLogs(automationId: string, limit: number = 100): Promise<AutomationLog[]> {
    // Mock implementation - in real app, fetch from database
    await new Promise(resolve => setTimeout(resolve, 300));
    return [];
  }

  // Workflow Management
  async getWorkflowNodes(automationId: string): Promise<WorkflowNode[]> {
    // Mock implementation for visual workflow editor
    await new Promise(resolve => setTimeout(resolve, 200));
    return [];
  }

  async testAutomation(id: string, testContactId: string): Promise<void> {
    // Mock implementation - would run automation in test mode
    await new Promise(resolve => setTimeout(resolve, 1000));
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
      errors
    };
  }

  async duplicateAutomation(id: string): Promise<AutomationRule> {
    const original = await this.getAutomationById(id);
    if (!original) throw new Error('Automation not found');

    return this.createAutomation({
      ...original,
      id: undefined,
      name: `${original.name} - Copy`,
      status: 'draft',
      metrics: {
        total_enrolled: 0,
        currently_active: 0,
        completed: 0,
        exited_early: 0,
        success_rate: 0
      }
    });
  }
}

// Export singleton instance
export const automationService = new AutomationService();

// Re-export service as default for consistency
export default automationService;