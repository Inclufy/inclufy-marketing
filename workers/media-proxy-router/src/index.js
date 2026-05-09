// ═══════════════════════════════════════════════════════════════════════════
// media-proxy-router
//
// Cloudflare Worker that reverse-proxies images.inclufy.com → Supabase
// `media-proxy` edge function. See ../README.md for the full architecture
// and why this Worker is necessary (Cloudflare error 1014).
//
// Request flow:
//   TikTok / Meta / Pinterest
//     → GET https://images.inclufy.com/media/<path>
//     → Cloudflare Worker (this file)
//     → fetch https://<project>.supabase.co/functions/v1/media-proxy/media/<path>
//     → Supabase storage object streamed back
// ═══════════════════════════════════════════════════════════════════════════

const ORIGIN = 'https://mpxkugfqzmxydxnlxqoj.supabase.co/functions/v1/media-proxy';

// Headers that are added by Cloudflare on the inbound side and must NOT
// leak to Supabase. Most of them confuse Supabase's edge router or look
// like spoofing attempts.
const HEADERS_TO_STRIP = [
  'host',
  'cf-connecting-ip',
  'cf-ipcountry',
  'cf-ray',
  'cf-visitor',
  'cf-worker',
  'x-forwarded-proto',
  'x-forwarded-for',
  'x-real-ip',
];

export default {
  async fetch(request, _env, _ctx) {
    const url = new URL(request.url);

    // The media-proxy is read-only by design. Reject anything that could
    // mutate state — even though Supabase would reject it too, fail fast.
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return new Response('Method not allowed', {
        status: 405,
        headers: { 'allow': 'GET, HEAD, OPTIONS' },
      });
    }

    const target = `${ORIGIN}${url.pathname}${url.search}`;

    const fwdHeaders = new Headers(request.headers);
    for (const h of HEADERS_TO_STRIP) fwdHeaders.delete(h);

    let upstream;
    try {
      upstream = await fetch(target, {
        method: request.method,
        headers: fwdHeaders,
        redirect: 'follow',
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'upstream fetch failed', detail: String(err) }),
        { status: 502, headers: { 'content-type': 'application/json' } },
      );
    }

    // Pass through with a marker header so we can confirm the Worker ran
    // when debugging. Everything else flows from the upstream response.
    const respHeaders = new Headers(upstream.headers);
    respHeaders.set('x-proxied-by', 'cloudflare-worker:media-proxy-router');

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  },
};
