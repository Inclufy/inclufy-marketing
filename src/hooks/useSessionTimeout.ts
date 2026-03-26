import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../services/supabase';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Idle session timeout hook.
 * Call inside the authenticated root layout or app shell.
 * Signs the user out after 15 minutes of the app being backgrounded.
 */
export function useSessionTimeout() {
  const lastActiveRef = useRef<number>(Date.now());

  useEffect(() => {
    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'active') {
        const elapsed = Date.now() - lastActiveRef.current;
        if (elapsed > IDLE_TIMEOUT_MS) {
          supabase.auth.signOut().catch(() => {
            // Ignore sign-out errors — session may already be invalid
          });
        }
        lastActiveRef.current = Date.now();
      } else {
        lastActiveRef.current = Date.now();
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);
}
