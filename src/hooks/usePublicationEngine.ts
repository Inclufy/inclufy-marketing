// src/hooks/usePublicationEngine.ts
import { useState, useEffect, useCallback } from 'react';
import publicationEngineService, {
  type PublishableContent,
  type PublishQueueStats,
  type ChannelHealth,
  type PerformanceDashboard,
  type PublishChannel,
  type PublishStatus,
} from '@/services/context-marketing/publication-engine.service';

export interface PublicationEngineState {
  queue: PublishableContent[];
  queueStats: PublishQueueStats | null;
  channelHealth: ChannelHealth[];
  history: PublishableContent[];
  recycleCandidates: PublishableContent[];
  performanceDashboard: PerformanceDashboard | null;
  isLoading: boolean;
  error: string | null;
  publishNow: (contentId: string, channels: PublishChannel[]) => Promise<void>;
  schedule: (contentId: string, scheduledAt: string, channels: PublishChannel[]) => Promise<void>;
  autoSchedule: (contentId: string) => Promise<{ scheduled_at: string; channels: PublishChannel[]; reason: string }>;
  recycle: (contentId: string) => Promise<void>;
  refetch: () => void;
}

export function usePublicationEngine(): PublicationEngineState {
  const [queue, setQueue] = useState<PublishableContent[]>([]);
  const [queueStats, setQueueStats] = useState<PublishQueueStats | null>(null);
  const [channelHealth, setChannelHealth] = useState<ChannelHealth[]>([]);
  const [history, setHistory] = useState<PublishableContent[]>([]);
  const [recycleCandidates, setRecycleCandidates] = useState<PublishableContent[]>([]);
  const [performanceDashboard, setPerformanceDashboard] = useState<PerformanceDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [queueRes, statsRes, healthRes, historyRes, recycleRes, perfRes] = await Promise.all([
        publicationEngineService.getPublishQueue(),
        publicationEngineService.getQueueStats(),
        publicationEngineService.getChannelHealth(),
        publicationEngineService.getPublishHistory(),
        publicationEngineService.getRecycleCandidates(),
        publicationEngineService.getPerformanceDashboard(),
      ]);
      setQueue(queueRes);
      setQueueStats(statsRes);
      setChannelHealth(healthRes);
      setHistory(historyRes);
      setRecycleCandidates(recycleRes);
      setPerformanceDashboard(perfRes);
    } catch (err: any) {
      console.error('Publication Engine fetch error:', err);
      setError(err.message || 'Failed to load publication data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const publishNow = useCallback(async (contentId: string, channels: PublishChannel[]) => {
    await publicationEngineService.publishNow(contentId, channels);
    fetchData();
  }, [fetchData]);

  const schedule = useCallback(async (contentId: string, scheduledAt: string, channels: PublishChannel[]) => {
    await publicationEngineService.scheduleContent(contentId, scheduledAt, channels);
    fetchData();
  }, [fetchData]);

  const autoSchedule = useCallback(async (contentId: string) => {
    const result = await publicationEngineService.autoSchedule(contentId);
    fetchData();
    return result;
  }, [fetchData]);

  const recycle = useCallback(async (contentId: string) => {
    await publicationEngineService.recycleContent(contentId);
    fetchData();
  }, [fetchData]);

  return { queue, queueStats, channelHealth, history, recycleCandidates, performanceDashboard, isLoading, error, publishNow, schedule, autoSchedule, recycle, refetch: fetchData };
}
