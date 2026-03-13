// src/hooks/useOpportunityIntelligence.ts
// Aggregation hook for opportunity intelligence data

import { useState, useEffect, useCallback } from 'react';
import opportunityIntelligenceService, {
  type Opportunity,
  type OpportunityDashboardData,
  type TrendData,
} from '@/services/context-marketing/opportunity-intelligence.service';

export interface OpportunityIntelligenceState {
  opportunities: Opportunity[];
  dashboard: OpportunityDashboardData | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  actionOpportunity: (id: string) => Promise<void>;
  dismissOpportunity: (id: string) => Promise<void>;
  launchCampaign: (opportunityId: string) => Promise<void>;
  refreshTrends: () => Promise<void>;
  refetch: () => void;
}

export function useOpportunityIntelligence(): OpportunityIntelligenceState {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [dashboard, setDashboard] = useState<OpportunityDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        opportunitiesRes,
        dashboardRes,
      ] = await Promise.all([
        opportunityIntelligenceService.getOpportunities(),
        opportunityIntelligenceService.getDashboard(),
      ]);

      setOpportunities(opportunitiesRes);
      setDashboard(dashboardRes);
    } catch (err: any) {
      console.error('Opportunity intelligence fetch error:', err);
      setError(err.message || 'Failed to load opportunity intelligence data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const actionOpportunity = useCallback(async (id: string) => {
    await opportunityIntelligenceService.actionOpportunity(id);
    setOpportunities(prev => prev.map(o =>
      o.id === id ? { ...o, status: 'actioned' as const } : o
    ));
  }, []);

  const dismissOpportunity = useCallback(async (id: string) => {
    await opportunityIntelligenceService.dismissOpportunity(id);
    setOpportunities(prev => prev.filter(o => o.id !== id));
  }, []);

  const launchCampaign = useCallback(async (opportunityId: string) => {
    await opportunityIntelligenceService.launchCampaign(opportunityId);
    fetchData();
  }, [fetchData]);

  const refreshTrends = useCallback(async () => {
    const trendsRes = await opportunityIntelligenceService.refreshTrends();
    setDashboard(prev => prev ? { ...prev, trends: trendsRes } : prev);
  }, []);

  return {
    opportunities,
    dashboard,
    isLoading,
    error,
    actionOpportunity,
    dismissOpportunity,
    launchCampaign,
    refreshTrends,
    refetch: fetchData,
  };
}
