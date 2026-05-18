// src/utils/superadmin.ts
// ────────────────────────────────────────────────────────────────────────
// Client-side superadmin gate.
//
// Mirrors the server-side SUPERADMIN_EMAILS Supabase secret (set on the
// project as `sami@inclufy.com`). The client-side gate is strictly a UX
// affordance — it determines whether dev-only tools (TierSwitcher,
// product_events viewer, force-flush analytics, etc.) are visible. It is
// NOT a security boundary: the underlying writes (e.g. UPDATE profiles
// SET tier=...) are gated by Postgres RLS, which checks auth.uid()
// against the row owner. So even if a non-superadmin user spoofs the
// client-side flag, the DB rejects the write.
//
// Update process: when a new superadmin is added on the server, add their
// email here too. Keep the lists in sync.
// ────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

// Lower-case the comparison input — keep this list lower-case too.
const SUPERADMIN_EMAILS: ReadonlySet<string> = new Set([
  'sami@inclufy.com',
]);

/**
 * Synchronous email-list check. Use when you already have the email
 * loaded (e.g. from a profile row or from `auth.getUser()`).
 */
export function isSuperadminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SUPERADMIN_EMAILS.has(email.trim().toLowerCase());
}

/**
 * React hook — auto-resolves the current user's email and returns
 * whether they're a superadmin. `loading` is true on first render until
 * the auth check resolves.
 */
export function useIsSuperadmin(): { isSuperadmin: boolean; loading: boolean } {
  const [state, setState] = useState<{ isSuperadmin: boolean; loading: boolean }>({
    isSuperadmin: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (cancelled) return;
        setState({ isSuperadmin: isSuperadminEmail(user?.email), loading: false });
      } catch {
        if (!cancelled) setState({ isSuperadmin: false, loading: false });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return state;
}
