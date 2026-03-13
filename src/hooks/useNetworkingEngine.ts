// src/hooks/useNetworkingEngine.ts
// Aggregation hook for networking engine data

import { useState, useEffect, useCallback } from 'react';
import networkingEngineService, {
  type Contact,
  type NetworkingMetrics,
  type QRCode,
} from '@/services/context-marketing/networking-engine.service';

export interface NetworkingEngineState {
  contacts: Contact[];
  metrics: NetworkingMetrics | null;
  qrCodes: QRCode[];
  isLoading: boolean;
  error: string | null;

  // Actions
  enrichContact: (id: string) => Promise<void>;
  syncToCRM: (id: string) => Promise<void>;
  sendFollowUp: (id: string) => Promise<void>;
  generateQRCode: (contactId: string) => Promise<void>;
  refetch: () => void;
}

export function useNetworkingEngine(): NetworkingEngineState {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [metrics, setMetrics] = useState<NetworkingMetrics | null>(null);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [
        contactsRes,
        metricsRes,
        qrCodesRes,
      ] = await Promise.all([
        networkingEngineService.getContacts(),
        networkingEngineService.getMetrics(),
        networkingEngineService.getQRCodes(),
      ]);

      setContacts(contactsRes);
      setMetrics(metricsRes);
      setQrCodes(qrCodesRes);
    } catch (err: any) {
      console.error('Networking engine fetch error:', err);
      setError(err.message || 'Failed to load networking engine data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const enrichContact = useCallback(async (id: string) => {
    await networkingEngineService.enrichContact(id);
    setContacts(prev => prev.map(c =>
      c.id === id ? { ...c, enriched: true } : c
    ));
  }, []);

  const syncToCRM = useCallback(async (id: string) => {
    await networkingEngineService.syncToCRM(id);
    setContacts(prev => prev.map(c =>
      c.id === id ? { ...c, synced: true } : c
    ));
  }, []);

  const sendFollowUp = useCallback(async (id: string) => {
    await networkingEngineService.sendFollowUp(id);
    setContacts(prev => prev.map(c =>
      c.id === id ? { ...c, followUpSent: true } : c
    ));
  }, []);

  const generateQRCode = useCallback(async (contactId: string) => {
    const newQR = await networkingEngineService.generateQRCode(contactId);
    setQrCodes(prev => [...prev, newQR]);
  }, []);

  return {
    contacts,
    metrics,
    qrCodes,
    isLoading,
    error,
    enrichContact,
    syncToCRM,
    sendFollowUp,
    generateQRCode,
    refetch: fetchData,
  };
}
