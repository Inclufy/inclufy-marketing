// src/hooks/useMultiAgent.ts
import { useState, useEffect, useCallback } from 'react';
import multiAgentService, {
  type AIAgent,
  type AgentMessage,
  type AgentTask,
  type OrchestratorState,
  type AgentType,
} from '@/services/context-marketing/multi-agent.service';

export interface MultiAgentState {
  agents: AIAgent[];
  messages: AgentMessage[];
  taskQueue: AgentTask[];
  orchestratorState: OrchestratorState | null;
  isLoading: boolean;
  error: string | null;
  pauseAgent: (agentType: AgentType) => Promise<void>;
  resumeAgent: (agentType: AgentType) => Promise<void>;
  triggerAction: (agentType: AgentType, action: string) => Promise<void>;
  refetch: () => void;
}

export function useMultiAgent(): MultiAgentState {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [taskQueue, setTaskQueue] = useState<AgentTask[]>([]);
  const [orchestratorState, setOrchestratorState] = useState<OrchestratorState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [agentsRes, messagesRes, tasksRes, orchRes] = await Promise.all([
        multiAgentService.getAgents(),
        multiAgentService.getAgentMessages(),
        multiAgentService.getTaskQueue(),
        multiAgentService.getOrchestratorState(),
      ]);
      setAgents(agentsRes);
      setMessages(messagesRes);
      setTaskQueue(tasksRes);
      setOrchestratorState(orchRes);
    } catch (err: any) {
      console.error('Multi-Agent fetch error:', err);
      setError(err.message || 'Failed to load multi-agent data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pauseAgent = useCallback(async (agentType: AgentType) => {
    await multiAgentService.pauseAgent(agentType);
    fetchData();
  }, [fetchData]);

  const resumeAgent = useCallback(async (agentType: AgentType) => {
    await multiAgentService.resumeAgent(agentType);
    fetchData();
  }, [fetchData]);

  const triggerAction = useCallback(async (agentType: AgentType, action: string) => {
    await multiAgentService.triggerAgentAction(agentType, action);
    fetchData();
  }, [fetchData]);

  return { agents, messages, taskQueue, orchestratorState, isLoading, error, pauseAgent, resumeAgent, triggerAction, refetch: fetchData };
}
