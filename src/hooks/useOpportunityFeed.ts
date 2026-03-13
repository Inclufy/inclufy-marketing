// src/hooks/useOpportunityFeed.ts
// Aggregation hook for opportunity feed data

import { useState, useEffect, useCallback } from 'react';
import opportunityFeedService, {
  type FeedItem,
  type FeedStats,
} from '@/services/context-marketing/opportunity-feed.service';

export interface OpportunityFeedState {
  feedItems: FeedItem[];
  stats: FeedStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  markAsRead: (id: string) => Promise<void>;
  actionItem: (id: string) => Promise<void>;
  dismissItem: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useOpportunityFeed(): OpportunityFeedState {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [stats, setStats] = useState<FeedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        feedRes,
        statsRes,
      ] = await Promise.all([
        opportunityFeedService.getFeedItems(),
        opportunityFeedService.getStats(),
      ]);

      setFeedItems(feedRes);
      setStats(statsRes);
    } catch (err: any) {
      console.error('Opportunity feed fetch error:', err);
      setError(err.message || 'Failed to load opportunity feed data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const markAsRead = useCallback(async (id: string) => {
    await opportunityFeedService.markAsRead(id);
    setFeedItems(prev => prev.map(item =>
      item.id === id ? { ...item, read: true } : item
    ));
  }, []);

  const actionItem = useCallback(async (id: string) => {
    await opportunityFeedService.actionItem(id);
    setFeedItems(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'actioned' as const } : item
    ));
  }, []);

  const dismissItem = useCallback(async (id: string) => {
    await opportunityFeedService.dismissItem(id);
    setFeedItems(prev => prev.filter(item => item.id !== id));
  }, []);

  return {
    feedItems,
    stats,
    isLoading,
    error,
    markAsRead,
    actionItem,
    dismissItem,
    refetch: fetchData,
  };
}
