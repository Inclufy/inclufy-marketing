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
import { decode as decodeImage, Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts';

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
    let contentType = MIME_BY_EXT[ext] ?? data.type ?? 'application/octet-stream';
    let bodyBytes: Uint8Array | null = null;

    // ── Optional on-the-fly image resize ──────────────────────────────
    // Triggered by query params: ?max=N (max width/height) or ?preset=tiktok
    // Used by TikTok / Meta / Pinterest publishers to ensure the bytes
    // delivered to the platform fit each platform's spec.
    const presetParam = url.searchParams.get('preset');
    const maxParam = url.searchParams.get('max');
    let targetMaxW: number | null = null;
    let targetMaxH: number | null = null;
    if (presetParam === 'tiktok') {
      // TikTok Photo Mode strict spec (Sandbox): 1080×1920 max for portrait,
      // 1920×1080 for landscape. Center-crop to exact ratio.
      targetMaxW = 1080;
      targetMaxH = 1920;
    } else if (presetParam === 'meta') {
      // Meta (Threads / Instagram) photo: max recommended 1080×1920 portrait.
      // Threads rejects oversized images with container error 400 (timeout
      // pulling the URL). Fit-into-box without forced aspect-ratio crop.
      targetMaxW = 1080;
      targetMaxH = 1920;
    } else if (maxParam) {
      const n = parseInt(maxParam, 10);
      if (!isNaN(n) && n > 0 && n <= 4096) {
        targetMaxW = n;
        targetMaxH = n;
      }
    }
    const targetMax = targetMaxW ?? targetMaxH;

    // Run resize for BOTH HEAD and GET so Content-Length is consistent.
    // TikTok (and other platforms) probe with HEAD first; if HEAD's
    // content-length doesn't match the GET body, the platform aborts with
    // photo_pull_failed (or video_pull_failed for video).
    if ((targetMaxW || targetMaxH || presetParam === 'tiktok') && contentType.startsWith('image/')) {
      try {
        const inputBytes = new Uint8Array(await data.arrayBuffer());
        let img: any = await decodeImage(inputBytes);
        const origW = img.width;
        const origH = img.height;

        const roundEven = (n: number) => Math.max(2, Math.floor(n / 2) * 2);

        let newW = origW;
        let newH = origH;

        if (presetParam === 'tiktok') {
          // TikTok Photo Mode (Sandbox) only accepts EXACT 9:16 portrait
          // (1080×1920) or 16:9 landscape (1920×1080). Anything off-ratio
          // returns picture_size_check_failed.
          //
          // 319 fix: previously we scaled-to-COVER then center-cropped, which
          // chopped overlays positioned in corners (AMOS chip, brand logo,
          // overlay text). Now we scale-to-CONTAIN inside the target box and
          // add letterbox/pillarbox bars to fill the remaining canvas. The
          // result is still exactly 1080×1920 (so TikTok accepts it) but the
          // source pixels — including all corner-positioned overlays — are
          // preserved intact.
          //
          // For square sources (1011×1011 from our wizard bake), this means
          // ~360px black bars top + bottom around the centered square.
          const isPortrait = origH >= origW;
          const targetW = isPortrait ? 1080 : 1920;
          const targetH = isPortrait ? 1920 : 1080;
          const scaleW = targetW / origW;
          const scaleH = targetH / origH;
          const scale = Math.min(scaleW, scaleH); // contain (was: max → cover)
          const scaledW = Math.round(origW * scale);
          const scaledH = Math.round(origH * scale);
          img.resize(scaledW, scaledH);

          // Compose onto a black 1080×1920 canvas — center the scaled image,
          // leave letterbox/pillarbox bars around it.
          const canvas: any = new Image(targetW, targetH);
          // Fill with opaque black: Image constructor defaults to transparent
          // (RGBA 0x00000000); set every pixel to opaque black so platforms
          // that flatten alpha don't end up with strange grey backgrounds.
          canvas.fill(0x000000ff);
          const offsetX = Math.floor((targetW - scaledW) / 2);
          const offsetY = Math.floor((targetH - scaledH) / 2);
          canvas.composite(img, offsetX, offsetY);

          // Swap reference so the encode step below emits the letterboxed canvas.
          img = canvas;

          newW = targetW;
          newH = targetH;
          console.log(`[media-proxy] tiktok preset (letterbox): ${origW}×${origH} → scaled ${scaledW}×${scaledH} → composed onto ${targetW}×${targetH} at offset (${offsetX},${offsetY})`);
        } else {
          // Generic fit-into-box (preset=max or ?max=N)
          const maxW = targetMaxW ?? Number.MAX_SAFE_INTEGER;
          const maxH = targetMaxH ?? Number.MAX_SAFE_INTEGER;
          const scale = Math.min(maxW / origW, maxH / origH, 1);
          newW = roundEven(origW * scale);
          newH = roundEven(origH * scale);
          if (newW !== origW || newH !== origH) {
            img.resize(newW, newH);
            console.log(`[media-proxy] resized ${objectPath} from ${origW}×${origH} → ${newW}×${newH} (preset=${presetParam ?? 'max'})`);
          } else {
            console.log(`[media-proxy] no resize needed for ${objectPath} (${origW}×${origH} already fits)`);
          }
        }

        // Always re-encode as JPEG for max platform compatibility
        bodyBytes = await img.encodeJPEG(85);
        contentType = 'image/jpeg';
      } catch (resizeErr: any) {
        console.warn('[media-proxy] resize failed, serving original:', resizeErr?.message);
        bodyBytes = null;
      }
    }

    const finalBody: BodyInit | null = bodyBytes ?? data;
    const finalSize = bodyBytes ? bodyBytes.byteLength : data.size;

    const baseHeaders: Record<string, string> = {
      ...corsHeaders,
      'Content-Type': contentType,
      'Content-Length': String(finalSize),
      'Cache-Control': 'public, max-age=3600, immutable',
      // Help debugging without leaking the full Supabase URL
      'X-Media-Proxy': 'inclufy-media-proxy',
      ...(targetMaxW || targetMaxH ? { 'X-Media-Proxy-Resize': `${targetMaxW ?? '*'}x${targetMaxH ?? '*'}` } : {}),
    };

    if (req.method === 'HEAD') {
      return new Response(null, { status: 200, headers: baseHeaders });
    }
    return new Response(finalBody, { status: 200, headers: baseHeaders });
  } catch (err: any) {
    console.error('[media-proxy] exception:', err?.message);
    return jsonError(500, 'media-proxy exception', err?.message);
  }
});
