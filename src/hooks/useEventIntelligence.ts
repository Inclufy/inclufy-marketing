// src/hooks/useEventIntelligence.ts
// Aggregation hook for event intelligence data

import { useState, useEffect, useCallback } from 'react';
import eventIntelligenceService, {
  type Event,
  type EventMetrics,
} from '@/services/context-marketing/event-intelligence.service';

export interface EventIntelligenceState {
  events: Event[];
  metrics: EventMetrics | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  registerForEvent: (id: string) => Promise<void>;
  skipEvent: (id: string) => Promise<void>;
  scanForNewEvents: () => Promise<void>;
  refetch: () => void;
}

export function useEventIntelligence(): EventIntelligenceState {
  const [events, setEvents] = useState<Event[]>([]);
  const [metrics, setMetrics] = useState<EventMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        eventsRes,
        metricsRes,
      ] = await Promise.all([
        eventIntelligenceService.getEvents(),
        eventIntelligenceService.getMetrics(),
      ]);

      setEvents(eventsRes);
      setMetrics(metricsRes);
    } catch (err: any) {
      console.error('Event intelligence fetch error:', err);
      setError(err.message || 'Failed to load event intelligence data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const registerForEvent = useCallback(async (id: string) => {
    await eventIntelligenceService.registerForEvent(id);
    setEvents(prev => prev.map(e =>
      e.id === id ? { ...e, status: 'registered' as const } : e
    ));
  }, []);

  const skipEvent = useCallback(async (id: string) => {
    await eventIntelligenceService.skipEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const scanForNewEvents = useCallback(async () => {
    await eventIntelligenceService.scanForNewEvents();
    fetchData();
  }, [fetchData]);

  return {
    events,
    metrics,
    isLoading,
    error,
    registerForEvent,
    skipEvent,
    scanForNewEvents,
    refetch: fetchData,
  };
}
