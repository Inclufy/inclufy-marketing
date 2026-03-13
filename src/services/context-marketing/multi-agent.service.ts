// src/services/context-marketing/multi-agent.service.ts
// Multi-Agent System service — specialized AI agents that collaborate autonomously

import { supabase } from '@/integrations/supabase/client';

export type AgentType = 'social' | 'email' | 'ads' | 'analytics' | 'orchestrator';
export type AgentStatus = 'active' | 'idle' | 'busy' | 'error' | 'paused' | 'learning';

export interface AIAgent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  description: string;
  capabilities: string[];
  current_task?: string;
  tasks_completed_today: number;
  tasks_in_queue: number;
  success_rate: number;
  efficiency_score: number;
  last_action?: string;
  last_action_at?: string;
  uptime_hours: number;
  decisions_made: number;
  revenue_impact: number;
  learning_progress: number;
  model_version: string;
  performance_trend: Array<{ date: string; score: number }>;
}

export interface AgentMessage {
  id: string;
  from_agent: AgentType;
  to_agent: AgentType | 'all';
  message_type: 'request' | 'response' | 'alert' | 'handoff' | 'conflict' | 'resolution';
  content: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  resolved: boolean;
}

export interface AgentTask {
  id: string;
  agent_type: AgentType;
  title: string;
  description: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  result?: string;
  dependencies?: string[];
}

export interface OrchestratorState {
  active_agents: number;
  total_tasks_today: number;
  conflicts_resolved: number;
  resource_allocation: Record<AgentType, number>;
  coordination_score: number;
  system_load: number;
  uptime_percentage: number;
}

class MultiAgentService {
  private async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return user.id;
  }

  async getAgents(): Promise<AIAgent[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('user_id', userId)
      .order('type', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as AIAgent[];
  }

  async getAgentById(id: string): Promise<AIAgent | null> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('user_id', userId)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return (data as unknown as AIAgent) || null;
  }

  async getAgentMessages(limit: number = 20): Promise<AgentMessage[]> {
    const userId = await this.getUserId();

    const { data, error } = await supabase
      .from('agent_messages')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as unknown as AgentMessage[];
  }

  async getTaskQueue(agentType?: AgentType): Promise<AgentTask[]> {
    const userId = await this.getUserId();

    let query = supabase
      .from('agent_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (agentType) {
      query = query.eq('agent_type', agentType);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as AgentTask[];
  }

  async getOrchestratorState(): Promise<OrchestratorState> {
    const userId = await this.getUserId();

    // Fetch all agents
    const { data: agents, error: agentsError } = await supabase
      .from('ai_agents')
      .select('type, status, efficiency_score')
      .eq('user_id', userId);

    if (agentsError) throw agentsError;

    const allAgents = (agents || []) as unknown as Array<{ type: AgentType; status: AgentStatus; efficiency_score: number }>;

    // Fetch today's tasks
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: tasks, error: tasksError } = await supabase
      .from('agent_tasks')
      .select('status, agent_type')
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString());

    if (tasksError) throw tasksError;

    const allTasks = (tasks || []) as unknown as Array<{ status: string; agent_type: AgentType }>;

    // Count active agents (active or busy)
    const activeAgents = allAgents.filter(a => a.status === 'active' || a.status === 'busy').length;

    // Count resolved conflicts from messages
    const { data: resolvedMessages, error: messagesError } = await supabase
      .from('agent_messages')
      .select('id')
      .eq('user_id', userId)
      .eq('message_type', 'resolution')
      .eq('resolved', true)
      .gte('timestamp', todayStart.toISOString());

    if (messagesError) throw messagesError;

    const conflictsResolved = (resolvedMessages || []).length;

    // Calculate resource allocation as percentage per agent type
    const totalAgents = allAgents.length || 1;
    const resourceAllocation: Record<AgentType, number> = {
      social: 0,
      email: 0,
      ads: 0,
      analytics: 0,
      orchestrator: 0,
    };

    // Distribute based on agent efficiency scores or evenly if not available
    const totalEfficiency = allAgents.reduce((sum, a) => sum + (a.efficiency_score || 0), 0);
    if (totalEfficiency > 0) {
      allAgents.forEach(a => {
        resourceAllocation[a.type] = Math.round(((a.efficiency_score || 0) / totalEfficiency) * 100);
      });
    } else {
      const even = Math.round(100 / totalAgents);
      allAgents.forEach(a => {
        resourceAllocation[a.type] = even;
      });
    }

    // Coordination score: average efficiency of all agents
    const coordinationScore = allAgents.length > 0
      ? Math.round((allAgents.reduce((sum, a) => sum + (a.efficiency_score || 0), 0) / allAgents.length) * 10) / 10
      : 0;

    // System load: ratio of in_progress tasks to total capacity
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    const systemLoad = allAgents.length > 0
      ? Math.round((inProgressTasks / (allAgents.length * 5)) * 100)
      : 0;

    // Uptime: all agents active percentage
    const uptimePercentage = allAgents.length > 0
      ? Math.round(((allAgents.filter(a => a.status !== 'error').length / allAgents.length) * 100) * 100) / 100
      : 0;

    return {
      active_agents: activeAgents,
      total_tasks_today: allTasks.length,
      conflicts_resolved: conflictsResolved,
      resource_allocation: resourceAllocation,
      coordination_score: coordinationScore,
      system_load: Math.min(systemLoad, 100),
      uptime_percentage: uptimePercentage,
    };
  }

  async pauseAgent(agentType: AgentType): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from('ai_agents')
      .update({ status: 'paused' })
      .eq('user_id', userId)
      .eq('type', agentType);

    if (error) throw error;
  }

  async resumeAgent(agentType: AgentType): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await supabase
      .from('ai_agents')
      .update({ status: 'active' })
      .eq('user_id', userId)
      .eq('type', agentType);

    if (error) throw error;
  }

  async triggerAgentAction(agentType: AgentType, action: string): Promise<void> {
    const userId = await this.getUserId();

    // Create a new task for the agent
    const { error } = await supabase
      .from('agent_tasks')
      .insert({
        user_id: userId,
        agent_type: agentType,
        title: action,
        description: `Manually triggered action: ${action}`,
        status: 'queued',
        priority: 'high',
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Update the agent's current_task
    const { error: agentError } = await supabase
      .from('ai_agents')
      .update({
        current_task: action,
        status: 'busy',
        last_action: action,
        last_action_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('type', agentType);

    if (agentError) throw agentError;
  }

  async getAgentPerformanceHistory(agentType: AgentType): Promise<Array<{ date: string; tasks: number; success_rate: number; efficiency: number }>> {
    const userId = await this.getUserId();

    // Fetch the agent to get its performance_trend
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('performance_trend, success_rate, efficiency_score')
      .eq('user_id', userId)
      .eq('type', agentType)
      .maybeSingle();

    if (agentError) throw agentError;

    if (!agent) return [];

    const agentData = agent as unknown as {
      performance_trend: Array<{ date: string; score: number }>;
      success_rate: number;
      efficiency_score: number;
    };

    // Fetch historical tasks for this agent type grouped by day
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: tasks, error: tasksError } = await supabase
      .from('agent_tasks')
      .select('created_at, status')
      .eq('user_id', userId)
      .eq('agent_type', agentType)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (tasksError) throw tasksError;

    const allTasks = (tasks || []) as unknown as Array<{ created_at: string; status: string }>;

    // Group tasks by date
    const dateMap = new Map<string, { total: number; completed: number }>();
    allTasks.forEach(t => {
      const dateStr = t.created_at.split('T')[0];
      if (!dateMap.has(dateStr)) dateMap.set(dateStr, { total: 0, completed: 0 });
      const entry = dateMap.get(dateStr)!;
      entry.total++;
      if (t.status === 'completed') entry.completed++;
    });

    // Build 30-day history
    const result: Array<{ date: string; tasks: number; success_rate: number; efficiency: number }> = [];
    const performanceTrend = agentData.performance_trend || [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayData = dateMap.get(dateStr);
      const trendEntry = performanceTrend.find(p => p.date === dateStr);

      result.push({
        date: dateStr,
        tasks: dayData ? dayData.total : 0,
        success_rate: dayData && dayData.total > 0
          ? Math.round((dayData.completed / dayData.total) * 1000) / 10
          : (agentData.success_rate || 0),
        efficiency: trendEntry ? trendEntry.score : (agentData.efficiency_score || 0),
      });
    }

    return result;
  }
}

export const multiAgentService = new MultiAgentService();
export default multiAgentService;
