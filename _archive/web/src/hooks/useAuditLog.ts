'use client';

import { useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase';

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export function useAuditLog() {
  const supabase = useMemo(() => createClient(), []);

  const logEvent = useCallback(
    async (
      action: string,
      resource_type: string,
      resource_id?: string,
      details?: Record<string, unknown>
    ): Promise<void> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.warn('[useAuditLog] logEvent called without an authenticated user — skipping.');
        return;
      }

      const { error } = await supabase.from('audit_logs').insert({
        user_id: user.id,
        action,
        resource_type,
        resource_id: resource_id ?? null,
        details: details ?? null,
      });

      if (error) {
        console.error('[useAuditLog] Failed to write audit log:', error.message);
      }
    },
    [supabase]
  );

  return { logEvent };
}
