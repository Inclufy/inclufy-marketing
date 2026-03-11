// src/hooks/useLeadScoring.ts
import { useState, useEffect, useCallback } from 'react';
import leadScoringService, {
  type ScoredLead,
  type ScoringRule,
  type ScoringModel,
  type LeadFunnelData,
  type LeadScoringDashboardData,
  type PredictiveInsight,
  type LeadStage,
} from '@/services/context-marketing/lead-scoring.service';

export interface LeadScoringState {
  dashboard: LeadScoringDashboardData | null;
  leads: ScoredLead[];
  scoringRules: ScoringRule[];
  scoringModel: ScoringModel | null;
  funnelData: LeadFunnelData[];
  insights: PredictiveInsight[];
  isLoading: boolean;
  error: string | null;
  filterLeads: (filters?: { stage?: LeadStage; minScore?: number; maxScore?: number }) => Promise<void>;
  updateRule: (id: string, updates: Partial<ScoringRule>) => Promise<void>;
  updateWeights: (weights: Record<string, number>) => Promise<void>;
  rescoreAll: () => Promise<{ total_rescored: number; changes: number }>;
  refetch: () => void;
}

export function useLeadScoring(): LeadScoringState {
  const [dashboard, setDashboard] = useState<LeadScoringDashboardData | null>(null);
  const [leads, setLeads] = useState<ScoredLead[]>([]);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([]);
  const [scoringModel, setScoringModel] = useState<ScoringModel | null>(null);
  const [funnelData, setFunnelData] = useState<LeadFunnelData[]>([]);
  const [insights, setInsights] = useState<PredictiveInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [dashboardRes, leadsRes, rulesRes, modelRes, funnelRes, insightsRes] = await Promise.all([
        leadScoringService.getDashboard(),
        leadScoringService.getLeads(),
        leadScoringService.getScoringRules(),
        leadScoringService.getScoringModel(),
        leadScoringService.getFunnelData(),
        leadScoringService.getPredictiveInsights(),
      ]);
      setDashboard(dashboardRes);
      setLeads(leadsRes);
      setScoringRules(rulesRes);
      setScoringModel(modelRes);
      setFunnelData(funnelRes);
      setInsights(insightsRes);
    } catch (err: any) {
      console.error('Lead Scoring fetch error:', err);
      setError(err.message || 'Failed to load lead scoring data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filterLeads = useCallback(async (filters?: { stage?: LeadStage; minScore?: number; maxScore?: number }) => {
    const filtered = await leadScoringService.getLeads(filters);
    setLeads(filtered);
  }, []);

  const updateRule = useCallback(async (id: string, updates: Partial<ScoringRule>) => {
    await leadScoringService.updateScoringRule(id, updates);
    const rules = await leadScoringService.getScoringRules();
    setScoringRules(rules);
  }, []);

  const updateWeights = useCallback(async (weights: Record<string, number>) => {
    await leadScoringService.updateModelWeights(weights as any);
    const model = await leadScoringService.getScoringModel();
    setScoringModel(model);
  }, []);

  const rescoreAll = useCallback(async () => {
    const result = await leadScoringService.rescoreAllLeads();
    fetchData();
    return result;
  }, [fetchData]);

  return { dashboard, leads, scoringRules, scoringModel, funnelData, insights, isLoading, error, filterLeads, updateRule, updateWeights, rescoreAll, refetch: fetchData };
}
