// src/hooks/useLeadIntelligence.ts
// Aggregation hook for lead intelligence data

import { useState, useEffect, useCallback } from 'react';
import leadIntelligenceService, {
  type LeadIntelligenceDashboard,
  type Lead,
  type LeadSignal,
  type BestAction,
} from '@/services/context-marketing/lead-intelligence.service';

export interface LeadIntelligenceState {
  dashboard: LeadIntelligenceDashboard | null;
  topLeads: Lead[];
  recentSignals: LeadSignal[];
  isLoading: boolean;
  error: string | null;

  // Actions
  predictBestAction: (leadId: string) => Promise<BestAction | null>;
  refetch: () => void;
}

export function useLeadIntelligence(): LeadIntelligenceState {
  const [dashboard, setDashboard] = useState<LeadIntelligenceDashboard | null>(null);
  const [topLeads, setTopLeads] = useState<Lead[]>([]);
  const [recentSignals, setRecentSignals] = useState<LeadSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        dashboardRes,
        topLeadsRes,
        signalsRes,
      ] = await Promise.all([
        leadIntelligenceService.getDashboard(),
        leadIntelligenceService.getTopLeads(),
        leadIntelligenceService.getRecentSignals(),
      ]);

      setDashboard(dashboardRes);
      setTopLeads(topLeadsRes);
      setRecentSignals(signalsRes);
    } catch (err: any) {
      console.error('Lead intelligence fetch error:', err);
      setError(err.message || 'Failed to load lead intelligence data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const predictBestAction = useCallback(async (leadId: string): Promise<BestAction | null> => {
    try {
      const action = await leadIntelligenceService.predictBestAction(leadId);
      return action;
    } catch (err: any) {
      console.error('Predict best action error:', err);
      return null;
    }
  }, []);

  return {
    dashboard,
    topLeads,
    recentSignals,
    isLoading,
    error,
    predictBestAction,
    refetch: fetchData,
  };
}
