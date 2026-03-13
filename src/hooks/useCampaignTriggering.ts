// src/hooks/useCampaignTriggering.ts
// Aggregation hook for campaign triggering data

import { useState, useEffect, useCallback } from 'react';
import campaignTriggeringService, {
  type Trigger,
  type TriggeredCampaign,
  type TriggeringDashboard,
} from '@/services/context-marketing/campaign-triggering.service';

export interface CampaignTriggeringState {
  triggers: Trigger[];
  triggeredCampaigns: TriggeredCampaign[];
  dashboard: TriggeringDashboard | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  approveCampaign: (id: string) => Promise<void>;
  cancelCampaign: (id: string) => Promise<void>;
  toggleTrigger: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useCampaignTriggering(): CampaignTriggeringState {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [triggeredCampaigns, setTriggeredCampaigns] = useState<TriggeredCampaign[]>([]);
  const [dashboard, setDashboard] = useState<TriggeringDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        triggersRes,
        campaignsRes,
        dashboardRes,
      ] = await Promise.all([
        campaignTriggeringService.getTriggers(),
        campaignTriggeringService.getTriggeredCampaigns(),
        campaignTriggeringService.getDashboard(),
      ]);

      setTriggers(triggersRes);
      setTriggeredCampaigns(campaignsRes);
      setDashboard(dashboardRes);
    } catch (err: any) {
      console.error('Campaign triggering fetch error:', err);
      setError(err.message || 'Failed to load campaign triggering data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const approveCampaign = useCallback(async (id: string) => {
    await campaignTriggeringService.approveCampaign(id);
    setTriggeredCampaigns(prev => prev.map(c =>
      c.id === id ? { ...c, status: 'approved' as const } : c
    ));
  }, []);

  const cancelCampaign = useCallback(async (id: string) => {
    await campaignTriggeringService.cancelCampaign(id);
    setTriggeredCampaigns(prev => prev.filter(c => c.id !== id));
  }, []);

  const toggleTrigger = useCallback(async (id: string) => {
    await campaignTriggeringService.toggleTrigger(id);
    setTriggers(prev => prev.map(t =>
      t.id === id ? { ...t, enabled: !t.enabled } : t
    ));
  }, []);

  return {
    triggers,
    triggeredCampaigns,
    dashboard,
    isLoading,
    error,
    approveCampaign,
    cancelCampaign,
    toggleTrigger,
    refetch: fetchData,
  };
}
