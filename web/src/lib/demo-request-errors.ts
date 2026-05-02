// Demo-request error mapping
// --------------------------
// Maps the Postgres error returned by the BEFORE INSERT rate-limit trigger
// on public.demo_requests (see migration 20260502140000_demo_rate_limit_oauth_lockdown.sql)
// to a friendly, user-facing message in Dutch.
//
// The trigger raises:
//   RAISE EXCEPTION 'Rate limit exceeded for demo request' USING ERRCODE = 'check_violation';
// which surfaces in supabase-js as:
//   { code: '23514', message: '... Rate limit exceeded for demo request ...' }
//
// (Note: the migration uses ERRCODE = 'check_violation' which maps to 23514,
//  not the generic P0001 raise_exception code. We accept both to be safe in
//  case a future migration changes the ERRCODE.)
//
// Typical usage in the demo-form submit handler:
//
//   import { mapDemoRequestError } from '@/lib/demo-request-errors';
//
//   const { error } = await supabase.from('demo_requests').insert({...});
//   if (error) {
//     setError(mapDemoRequestError(error));
//     return;
//   }

export interface PostgrestLikeError {
  code?: string | null;
  message?: string | null;
  details?: string | null;
}

export const DEMO_REQUEST_RATE_LIMIT_MESSAGE =
  'Te veel verzoeken vanaf dit netwerk. Probeer het later opnieuw of neem direct contact met ons op via support@inclufy.com.';

export const DEMO_REQUEST_GENERIC_MESSAGE =
  'Er ging iets mis bij het versturen van je aanvraag. Probeer het opnieuw of mail ons op support@inclufy.com.';

/**
 * Detect the rate-limit error from the BEFORE INSERT trigger.
 *
 * - Postgres P0001 (raise_exception) is the default RAISE EXCEPTION code.
 * - check_violation (23514) is what the current trigger uses.
 * - Plain message regex covers both, plus any future re-coding.
 */
export function isDemoRateLimitError(err: PostgrestLikeError | null | undefined): boolean {
  if (!err) return false;
  const code = err.code ?? '';
  const msg = `${err.message ?? ''} ${err.details ?? ''}`;
  if (code === 'P0001' || code === '23514') {
    return /rate.?limit/i.test(msg);
  }
  return /rate.?limit.*demo|demo.*rate.?limit/i.test(msg);
}

/**
 * Pick the right Dutch user-facing message for a demo_requests INSERT error.
 * Always returns a string (never null) so the caller can `setError(...)` directly.
 */
export function mapDemoRequestError(err: PostgrestLikeError | null | undefined): string {
  if (isDemoRateLimitError(err)) {
    return DEMO_REQUEST_RATE_LIMIT_MESSAGE;
  }
  return DEMO_REQUEST_GENERIC_MESSAGE;
}
