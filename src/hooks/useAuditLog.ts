import { useCallback } from 'react';
import { supabase } from '../services/supabase';

interface AuditLogEntry {
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
}

/**
 * Hook for logging user actions to the Supabase audit_logs table.
 * Silently ignores errors to avoid breaking the calling flow.
 */
export function useAuditLog() {
  const log = useCallback(async (entry: AuditLogEntry) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: entry.action,
        resource_type: entry.resource_type ?? null,
        resource_id: entry.resource_id ?? null,
        details: entry.details ?? null,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Audit logging must never throw — best effort only
    }
  }, []);

  return { log };
}
