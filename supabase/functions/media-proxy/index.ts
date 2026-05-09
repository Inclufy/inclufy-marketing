// ═══════════════════════════════════════════════════════════════════════════
// media-proxy — public read-only proxy for Supabase storage objects.
//
// Purpose
// -------
// Several social-media APIs (TikTok Content Posting, Meta IG Reels, Pinterest)
// only accept media URLs whose host is in their "verified domains" list.
// Supabase storage URLs live at `<project-ref>.supabase.co` which we cannot
// claim ownership of (no DNS control), so we serve a stable mirror under a
// host we DO control — typically `images.inclufy.com` — pointed at this edge
// function via Cloudflare.
//
// Path format
// -----------
//   GET /media-proxy/<bucket>/<object-path-incl-slashes>     (Supabase URL)
//   GET /<bucket>/<object-path>                              (custom domain
//                                                             that strips the
//                                                             /media-proxy/
//                                                             prefix in CF
//                                                             rewrite rule)
//
// Security model
// --------------
//   • Bucket allow-list (only "media" today) — prevents serving private
//     buckets such as "exports" or "drafts" through this proxy.
//   • GET / HEAD only.
//   • No auth required (deploy with --no-verify-jwt). The bucket-allow-list
//     is the trust boundary. If a future bucket needs auth, add a token
//     check before extending ALLOWED_BUCKETS.
//   • Service-role key is used to download — clients never see it.
//
// Cache
// -----
//   • Cache-Control: public, max-age=3600, immutable
//   • CDN can be layered (Cloudflare) — this function only sees uncached
//     misses.
//
// Deploy
// ------
//   supabase functions deploy media-proxy --no-verify-jwt
//
// Cloudflare wiring (needed once for TikTok / Meta verification)
// --------------------------------------------------------------
//   1. CNAME  images.inclufy.com  →  <project-ref>.supabase.co  (Proxied: ON)
//   2. Page Rule / Transform Rule on images.inclufy.com:
//        if URL = images.inclufy.com/*
//        rewrite to /functions/v1/media-proxy/$1
//   3. Add `images.inclufy.com` to TikTok Developer Portal → URL Properties.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Allow-list of buckets that may be served. Add buckets here only after
// confirming they contain no private data.
const ALLOWED_BUCKETS = new Set(['media']);

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic', heif: 'image/heif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  m4v: 'video/x-m4v',
};

function jsonError(status: number, error: string, detail?: string) {
  return new Response(
    JSON.stringify({ error, ...(detail ? { detail } : {}) }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return jsonError(405, 'Method not allowed');
  }

  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/').filter(Boolean);

    // Strip "media-proxy" prefix if Supabase routed us through /functions/v1/media-proxy/...
    // (a Cloudflare rewrite that strips the prefix on the public domain just
    // omits it; the same code path handles both forms.)
    const startIdx = segments[0] === 'media-proxy' ? 1 : 0;
    const bucket = segments[startIdx];
    const objectPath = segments.slice(startIdx + 1).join('/');

    if (!bucket || !objectPath) {
      return jsonError(400, 'Path must be /<bucket>/<file-path>');
    }

    if (!ALLOWED_BUCKETS.has(bucket)) {
      return jsonError(403, `Bucket "${bucket}" is not exposed via media-proxy`);
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError(500, 'media-proxy misconfigured', 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await db.storage.from(bucket).download(objectPath);

    if (error || !data) {
      console.warn('[media-proxy] download failed:', bucket, objectPath, error?.message);
      return jsonError(404, 'Object not found', error?.message);
    }

    const ext = objectPath.split('.').pop()?.toLowerCase() ?? '';
    const contentType = MIME_BY_EXT[ext] ?? data.type ?? 'application/octet-stream';
    const size = data.size;

    const baseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': contentType,
      'Content-Length': String(size),
      'Cache-Control': 'public, max-age=3600, immutable',
      // Help debugging without leaking the full Supabase URL
      'X-Media-Proxy': 'inclufy-media-proxy',
    };

    if (req.method === 'HEAD') {
      return new Response(null, { status: 200, headers: baseHeaders });
    }
    return new Response(data, { status: 200, headers: baseHeaders });
  } catch (err: any) {
    console.error('[media-proxy] exception:', err?.message);
    return jsonError(500, 'media-proxy exception', err?.message);
  }
});
