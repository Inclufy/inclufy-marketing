// src/hooks/useAutonomousMarketing.ts
// Aggregation hook for all autonomous marketing data

import { useState, useEffect, useCallback, useMemo } from 'react';
import autonomousService, {
  type SystemHealth,
  type AutonomousDecision,
  type CampaignStatus,
  type AutonomousMetrics,
  type PredictiveAlert,
} from '@/services/context-marketing/autonomous.service';
import recommendationsService, {
  type Recommendation,
  type RecommendationStats,
} from '@/services/context-marketing/recommendations.service';

export interface AutonomousMarketingState {
  // System
  systemHealth: SystemHealth | null;
  isPaused: boolean;
  autonomyLevel: 'conservative' | 'balanced' | 'aggressive';

  // Decisions
  pendingDecisions: AutonomousDecision[];
  pendingCount: number;

  // Campaigns
  activeCampaigns: CampaignStatus[];
  campaignPerformance: {
    total_campaigns: number;
    avg_roi: number;
    total_revenue: number;
    vs_manual_performance: number;
  } | null;

  // Metrics
  metrics: AutonomousMetrics | null;

  // Recommendations
  topRecommendations: Recommendation[];
  recommendationStats: RecommendationStats | null;

  // Predictive Alerts
  predictiveAlerts: PredictiveAlert[];

  // State
  isLoading: boolean;
  error: string | null;

  // Actions
  approveDecision: (id: string) => Promise<void>;
  rejectDecision: (id: string) => Promise<void>;
  acceptRecommendation: (id: string) => Promise<void>;
  dismissRecommendation: (id: string) => Promise<void>;
  togglePause: () => Promise<void>;
  refetch: () => void;
}

export function useAutonomousMarketing(): AutonomousMarketingState {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [autonomyLevel] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [pendingDecisions, setPendingDecisions] = useState<AutonomousDecision[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<CampaignStatus[]>([]);
  const [campaignPerformance, setCampaignPerformance] = useState<AutonomousMarketingState['campaignPerformance']>(null);
  const [metrics, setMetrics] = useState<AutonomousMetrics | null>(null);
  const [topRecommendations, setTopRecommendations] = useState<Recommendation[]>([]);
  const [recommendationStats, setRecommendationStats] = useState<RecommendationStats | null>(null);
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        healthRes,
        decisionsRes,
        campaignsRes,
        metricsRes,
        performanceRes,
        recsRes,
        statsRes,
        alertsRes,
      ] = await Promise.all([
        autonomousService.getSystemHealth(),
        autonomousService.getPendingDecisions(),
        autonomousService.getActiveCampaigns(),
        autonomousService.getSystemStats('24h'),
        autonomousService.getAutonomousCampaignPerformance(),
        recommendationsService.getRecommendations({ status: 'pending' }),
        recommendationsService.getStats(),
        autonomousService.getPredictiveAlerts(),
      ]);

      setSystemHealth(healthRes);
      setPendingDecisions(decisionsRes);
      setActiveCampaigns(campaignsRes);
      setMetrics(metricsRes);
      setCampaignPerformance(performanceRes);
      setTopRecommendations(recsRes.slice(0, 3)); // Top 3
      setRecommendationStats(statsRes);
      setPredictiveAlerts(alertsRes);
    } catch (err: any) {
      console.error('Autonomous marketing fetch error:', err);
      setError(err.message || 'Failed to load autonomous marketing data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const approveDecision = useCallback(async (id: string) => {
    await autonomousService.overrideDecision(id, 'approve');
    setPendingDecisions(prev => prev.filter(d => d.id !== id));
  }, []);

  const rejectDecision = useCallback(async (id: string) => {
    await autonomousService.overrideDecision(id, 'reject');
    setPendingDecisions(prev => prev.filter(d => d.id !== id));
  }, []);

  const acceptRecommendation = useCallback(async (id: string) => {
    await recommendationsService.markAsImplemented(id);
    setTopRecommendations(prev => prev.filter(r => r.id !== id));
  }, []);

  const dismissRecommendation = useCallback(async (id: string) => {
    await recommendationsService.dismiss(id);
    setTopRecommendations(prev => prev.filter(r => r.id !== id));
  }, []);

  const togglePause = useCallback(async () => {
    if (isPaused) {
      await autonomousService.resumeSystem();
      setIsPaused(false);
    } else {
      await autonomousService.pauseSystem();
      setIsPaused(true);
    }
  }, [isPaused]);

  const pendingCount = useMemo(() => pendingDecisions.length, [pendingDecisions]);

  return {
    systemHealth,
    isPaused,
    autonomyLevel,
    pendingDecisions,
    pendingCount,
    activeCampaigns,
    campaignPerformance,
    metrics,
    topRecommendations,
    recommendationStats,
    predictiveAlerts,
    isLoading,
    error,
    approveDecision,
    rejectDecision,
    acceptRecommendation,
    dismissRecommendation,
    togglePause,
    refetch: fetchData,
  };
}
