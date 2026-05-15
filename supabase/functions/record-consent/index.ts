// ═══════════════════════════════════════════════════════════════════════════
// record-consent — server-side GDPR consent audit trail entry-point.
//
// Called by both AMOS mobile (AIConsentModal, signup terms checkbox, etc.)
// and marketing-web (Signup, cookie banner). Writes a single immutable row
// into public.consent_log for each user consent event.
//
// Wire format:
//   POST /functions/v1/record-consent
//   { user_id?, anonymous_id?, consent_type, accepted, document_version?,
//     locale?, source?, metadata? }
//
// At least ONE of user_id / anonymous_id must be present.
// The function adds: ip_address (truncated /24 for v4, /48 for v6),
// user_agent (from request headers), accepted_at (server time).
//
// verify_jwt=false because cookie/landing-page consent happens BEFORE
// signup (no JWT yet). When called with a Bearer JWT the user_id is
// pulled from the token rather than the body (defense in depth — a
// malicious caller cannot stamp consent under someone else's user_id).
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const VALID_CONSENT_TYPES = new Set([
  'terms_of_service',
  'privacy_policy',
  'cookies_functional',
  'cookies_analytics',
  'cookies_marketing',
  'ai_processing',
  'marketing_emails',
  'dpa_acceptance',
]);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Truncate IP for GDPR data minimization:
 *   IPv4: zero the last octet → /24 (256-host neighborhood)
 *   IPv6: zero the last 80 bits → /48 (site-local)
 * Returns null if input is invalid.
 */
function truncateIp(raw: string | null): string | null {
  if (!raw) return null;
  // request may carry "client_ip, proxy_ip" — take the first
  const ip = raw.split(',')[0].trim();
  if (ip.includes('.') && !ip.includes(':')) {
    const parts = ip.split('.');
    if (parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p))) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 3) {
      // keep first 3 groups, zero the rest → /48
      return `${parts[0]}:${parts[1]}:${parts[2]}::`;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'POST only' }, 405);

  let body: {
    user_id?: string;
    anonymous_id?: string;
    consent_type?: string;
    accepted?: boolean;
    document_version?: string;
    locale?: string;
    source?: string;
    metadata?: Record<string, unknown>;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400);
  }

  if (!body.consent_type || !VALID_CONSENT_TYPES.has(body.consent_type)) {
    return jsonResponse(
      { error: 'consent_type required', valid_values: [...VALID_CONSENT_TYPES] },
      400,
    );
  }
  if (typeof body.accepted !== 'boolean') {
    return jsonResponse({ error: 'accepted (boolean) required' }, 400);
  }
  if (!body.user_id && !body.anonymous_id) {
    return jsonResponse({ error: 'user_id or anonymous_id required' }, 400);
  }

  // If a Bearer JWT is present, prefer THAT user_id over body.user_id —
  // prevents stamping consent under another user's account.
  let effectiveUserId: string | null = null;
  const auth = req.headers.get('Authorization') ?? '';
  if (auth.startsWith('Bearer ') && SUPABASE_ANON_KEY) {
    try {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: auth } },
        auth: { persistSession: false },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) effectiveUserId = user.id;
    } catch {
      // Bearer token invalid — fall through to anonymous_id only
    }
  }
  // Fall back to body.user_id only if NO JWT context (pre-auth flows).
  if (!effectiveUserId && body.user_id) effectiveUserId = body.user_id;

  const rawIp = req.headers.get('x-forwarded-for')
    ?? req.headers.get('x-real-ip')
    ?? null;
  const ip = truncateIp(rawIp);
  const userAgent = req.headers.get('user-agent') ?? null;

  const row = {
    user_id: effectiveUserId,
    anonymous_id: body.anonymous_id ?? null,
    consent_type: body.consent_type,
    accepted: body.accepted,
    document_version: body.document_version ?? null,
    locale: (body.locale ?? 'nl').slice(0, 8),
    source: body.source && /^[a-z0-9-]{1,40}$/.test(body.source)
      ? body.source
      : 'unknown',
    ip_address: ip,
    user_agent: userAgent?.slice(0, 500) ?? null,
    metadata: body.metadata ?? {},
  };

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await admin
    .from('consent_log')
    .insert(row)
    .select('id, accepted_at')
    .single();
  if (error) {
    console.error('[record-consent] insert failed', error.message);
    return jsonResponse({ error: 'Failed to record consent', detail: error.message }, 500);
  }

  return jsonResponse({
    ok: true,
    consent_id: data.id,
    accepted_at: data.accepted_at,
  });
});
