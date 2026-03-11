// src/hooks/useIntegrationHub.ts
import { useState, useEffect, useCallback } from 'react';
import integrationHubService, {
  type IntegrationConfig,
  type IntegrationHealthReport,
  type DataFlowEvent,
  type IntegrationPlatform,
} from '@/services/context-marketing/integration-hub.service';

export interface IntegrationHubState {
  integrations: IntegrationConfig[];
  healthReport: IntegrationHealthReport | null;
  dataFlow: DataFlowEvent[];
  isLoading: boolean;
  error: string | null;
  connect: (platform: IntegrationPlatform) => Promise<void>;
  disconnect: (id: string) => Promise<void>;
  refreshSync: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useIntegrationHub(): IntegrationHubState {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [healthReport, setHealthReport] = useState<IntegrationHealthReport | null>(null);
  const [dataFlow, setDataFlow] = useState<DataFlowEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [integrationsRes, healthRes, flowRes] = await Promise.all([
        integrationHubService.getIntegrations(),
        integrationHubService.getHealthReport(),
        integrationHubService.getDataFlow(),
      ]);
      setIntegrations(integrationsRes);
      setHealthReport(healthRes);
      setDataFlow(flowRes);
    } catch (err: any) {
      console.error('Integration Hub fetch error:', err);
      setError(err.message || 'Failed to load integration data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const connect = useCallback(async (platform: IntegrationPlatform) => {
    await integrationHubService.connectIntegration(platform);
    fetchData();
  }, [fetchData]);

  const disconnect = useCallback(async (id: string) => {
    await integrationHubService.disconnectIntegration(id);
    fetchData();
  }, [fetchData]);

  const refreshSync = useCallback(async (id: string) => {
    await integrationHubService.refreshSync(id);
    fetchData();
  }, [fetchData]);

  return { integrations, healthReport, dataFlow, isLoading, error, connect, disconnect, refreshSync, refetch: fetchData };
}
