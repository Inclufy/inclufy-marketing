// Cloudflare Turnstile helper
// ---------------------------
// Thin wrapper around the verify-turnstile-token Supabase edge function.
// Use this from any public form that needs CAPTCHA-style spam protection
// (currently the demo-request form).
//
// Setup vereist:
//   - Edge function secret:  TURNSTILE_SECRET_KEY
//       (Supabase Dashboard > Edge Functions > Secrets)
//   - Public site key (frontend):  NEXT_PUBLIC_TURNSTILE_SITE_KEY
//       (Cloudflare Turnstile dashboard → "Site key" — safe to ship to client)
//
// Typical usage in a form-submit handler:
//
//   import { verifyTurnstileToken, TURNSTILE_SITE_KEY } from '@/lib/turnstile';
//
//   if (!TURNSTILE_SITE_KEY) {
//     // Turnstile not configured — fall through to the rate-limit-only path.
//   } else {
//     const ok = await verifyTurnstileToken(token);
//     if (!ok) {
//       setError('CAPTCHA-validatie mislukt. Probeer het opnieuw.');
//       return;
//     }
//   }
//
// The Turnstile widget itself can be rendered with either:
//   (a) a raw <div class="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} />
//       plus the global <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
//   (b) the @marsidev/react-turnstile package (NOT installed in this repo at
//       the time of writing — installation is out of scope for this scaffold).

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';

export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

export const TURNSTILE_WIDGET_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js';

/**
 * Verify a Turnstile response token via the verify-turnstile-token edge
 * function. Returns `true` on success, `false` on any failure (network,
 * misconfigured secret, expired/duplicate token, etc.).
 *
 * Never throws — callers can `if (!ok) showError()` without try/catch.
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!token) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-turnstile-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      // 5xx / network — treat as a hard fail so spam can't slip through on
      // a transient Cloudflare hiccup.
      console.warn('[turnstile] verify HTTP error:', res.status);
      return false;
    }

    const data = (await res.json()) as {
      success?: boolean;
      errors?: string[];
    };

    if (!data.success && data.errors?.length) {
      console.warn('[turnstile] verify failed:', data.errors.join(', '));
    }

    return data.success === true;
  } catch (err) {
    console.warn('[turnstile] verify exception:', (err as Error).message);
    return false;
  }
}
