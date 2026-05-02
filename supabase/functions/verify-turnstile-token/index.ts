// Supabase Edge Function: verify-turnstile-token
// Server-side verification of a Cloudflare Turnstile CAPTCHA token.
// Called from the demo-request form (and any other public form) before
// the actual INSERT, so spam can be blocked even when an attacker rotates
// IPs around the BEFORE INSERT rate-limit trigger on demo_requests.
//
// Setup vereist (Supabase Dashboard > Edge Functions > Secrets):
//   TURNSTILE_SECRET_KEY  — uit Cloudflare Turnstile dashboard
// Frontend env var:
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY  — de public site-key (geen secret)
//
// Request shape:  POST { token: string }
// Response shape: { success: boolean, errors?: string[] }
//
// Errors are returned as Cloudflare's error-codes (e.g. "missing-input-response",
// "invalid-input-response", "timeout-or-duplicate"). The frontend should treat
// any { success: false } as a hard fail and re-render the widget.

const TURNSTILE_SECRET_KEY = Deno.env.get('TURNSTILE_SECRET_KEY') ?? '';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, errors: ['method-not-allowed'] }, 405);
  }

  // Fail closed if the server-side secret is not configured. Without it we
  // would otherwise silently accept any token.
  if (!TURNSTILE_SECRET_KEY) {
    console.error('[verify-turnstile-token] TURNSTILE_SECRET_KEY not configured');
    return jsonResponse({ success: false, errors: ['server-misconfigured'] }, 500);
  }

  let body: { token?: string } = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, errors: ['invalid-json'] }, 400);
  }

  const token = (body.token ?? '').trim();
  if (!token) {
    return jsonResponse({ success: false, errors: ['missing-input-response'] }, 400);
  }

  // Forward the original client IP if available (Turnstile uses it as an extra
  // signal). Supabase / Cloudflare set x-real-ip and x-forwarded-for.
  const remoteIp =
    req.headers.get('x-real-ip') ??
    (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ??
    '';

  const form = new URLSearchParams();
  form.set('secret', TURNSTILE_SECRET_KEY);
  form.set('response', token);
  if (remoteIp) form.set('remoteip', remoteIp);

  try {
    const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });

    if (!verifyRes.ok) {
      console.error('[verify-turnstile-token] Cloudflare HTTP error:', verifyRes.status);
      return jsonResponse({ success: false, errors: ['cloudflare-http-error'] }, 502);
    }

    const data = (await verifyRes.json()) as {
      success: boolean;
      'error-codes'?: string[];
    };

    if (data.success) {
      return jsonResponse({ success: true });
    }

    return jsonResponse(
      { success: false, errors: data['error-codes'] ?? ['unknown'] },
      200,
    );
  } catch (err) {
    console.error('[verify-turnstile-token] Exception:', (err as Error).message);
    return jsonResponse({ success: false, errors: ['exception'] }, 500);
  }
});
