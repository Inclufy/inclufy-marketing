import { useState, useEffect, useCallback } from 'react';
import { aiConsentService } from '../services/ai-consent.service';

/**
 * Hook to manage AI data processing consent.
 *
 * Returns:
 * - hasConsent: whether consent has been given
 * - loading: whether the consent status is being loaded
 * - showModal: whether the consent modal should be shown
 * - requestConsent: call this before an AI operation to trigger the modal if needed
 * - onAccept / onDecline: handlers for the modal
 */
export function useAIConsent() {
  const [hasConsent, setHasConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  // Callback to execute after consent is granted
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    aiConsentService.hasConsent().then((v) => {
      setHasConsent(v);
      setLoading(false);
    });
  }, []);

  /**
   * Call before any AI operation.
   * If consent is already given, runs the callback immediately.
   * Otherwise shows the consent modal first.
   */
  const requestConsent = useCallback(
    (callback?: () => void) => {
      if (hasConsent) {
        callback?.();
        return;
      }
      // Store callback to run after accept
      if (callback) {
        setPendingCallback(() => callback);
      }
      setShowModal(true);
    },
    [hasConsent],
  );

  const onAccept = useCallback(() => {
    setHasConsent(true);
    setShowModal(false);
    pendingCallback?.();
    setPendingCallback(null);
  }, [pendingCallback]);

  const onDecline = useCallback(() => {
    setShowModal(false);
    setPendingCallback(null);
  }, []);

  const revokeConsent = useCallback(async () => {
    await aiConsentService.revokeConsent();
    setHasConsent(false);
  }, []);

  return { hasConsent, loading, showModal, requestConsent, onAccept, onDecline, revokeConsent };
}
