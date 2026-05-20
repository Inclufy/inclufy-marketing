// ─────────────────────────────────────────────────────────────────────────
// Server-side AMOS watermark bake — v5 (real logo stamp, subtle).
//
// History:
//   v1 — tried to fetch Roboto-Bold.ttf from GitHub for text rendering →
//        timeouts on Supabase Edge Runtime, function errored before
//        any response was written.
//   v2 — stripped external deps; flat pink rectangle, hardcoded top-left.
//   v3 — added 9-position placement (top|middle|bottom × left|center|right)
//        via a fallback chain, but still drew a flat pink rectangle (no
//        logo, no text — purely a brand-color marker).
//   v4 — pre-rendered "AMOS by Inclufy" pink→orange gradient chip with
//        text, inlined as base64. Sized at 30% of image width, min 240px.
//        Worked but felt destructive: covered roughly a third of the photo
//        and the cobbled-together pill didn't match the real brand mark.
//   v5 (this) — replaces the text chip with the real polygonal AMOS logo
//        from assets/icon.png (square, 192×192 JPEG, dark gradient bg).
//        Defaults drop to 10% width (was 30%) with a 80px minimum (was
//        240px) so the stamp reads as "brand presence" rather than
//        "watermark obscuring the user's content".
// ─────────────────────────────────────────────────────────────────────────

import { Image, decode as imgDecode } from 'https://deno.land/x/imagescript@1.2.17/mod.ts';
import { decodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Tier } from './free-tier-policy.ts';

export type WatermarkPosition =
  | 'top-left'    | 'top-center'    | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

const VALID_POSITIONS: ReadonlySet<WatermarkPosition> = new Set([
  'top-left',    'top-center',    'top-right',
  'middle-left', 'middle-center', 'middle-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]);

/** Clamp arbitrary input back to a safe position (default top-left). */
export function safeWatermarkPosition(input: unknown): WatermarkPosition {
  if (typeof input === 'string' && VALID_POSITIONS.has(input as WatermarkPosition)) {
    return input as WatermarkPosition;
  }
  return 'top-left';
}

/** Size variant — controls the badge width as a % of image width. */
export type WatermarkSize = 'small' | 'medium' | 'large' | 'xlarge';

const VALID_SIZES: ReadonlySet<WatermarkSize> = new Set(['small', 'medium', 'large', 'xlarge']);

export function safeWatermarkSize(input: unknown): WatermarkSize {
  if (typeof input === 'string' && VALID_SIZES.has(input as WatermarkSize)) {
    return input as WatermarkSize;
  }
  return 'medium';
}

// v5 (2026-05-20): the previous text-pill design covered ~30% of the image
// and felt destructive on user content. Switched to a much smaller square
// AMOS logo stamp — the real polygonal A from assets/icon.png — at 10%
// width by default. The goal is "brand presence without ruining the photo".
const SIZE_PCT: Record<WatermarkSize, number> = {
  small:  0.06,  //  6% of image width — barely visible, just a hint
  medium: 0.10,  // 10% — default, brand-present but unobtrusive
  large:  0.14,  // 14% — prominent
  xlarge: 0.20,  // 20% — maximum, still well under the old 30% default
};

const SIZE_MIN_W_PX: Record<WatermarkSize, number> = {
  small:   48,
  medium:  80,
  large:  120,
  xlarge: 160,
};

const BADGE_MARGIN_PCT = 0.025; // 2.5% margin from edges
// Square logo — native dimensions of the inlined image (192×192 JPEG of
// assets/icon.png, the real polygonal-A AMOS brand mark on dark gradient).
const BADGE_PNG_NATIVE_W = 192;
const BADGE_PNG_NATIVE_H = 192;
const BADGE_ASPECT = BADGE_PNG_NATIVE_H / BADGE_PNG_NATIVE_W;

// ── AMOS logo watermark stamp ────────────────────────────────────────────
// The real polygonal-A AMOS brand mark (from assets/icon.png), resized to
// 192×192 JPEG and inlined as base64 so the Deno edge function needs zero
// external assets at runtime. Decoded once per cold start, cached in
// module scope, then resized to fit each target image.
//
// To regenerate (e.g. brand update), run:
//   sips -Z 192 -s format jpeg -s formatOptions 85 assets/icon.png --out /tmp/amos_logo_192.jpg
//   base64 -i /tmp/amos_logo_192.jpg | tr -d '\n'
// then paste over the constant below.
const BADGE_PNG_BASE64 =
  '/9j/4AAQSkZJRgABAQAASABIAAD/4QBYRXhpZgAATU0AKgAAAAgAAgESAAMAAAABAAEAAIdpAAQAAAABAAAAJgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAwKADAAQAAAABAAAAwAAAAAD/4QqPaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOklwdGM0eG1wRXh0PSJodHRwOi8vaXB0Yy5vcmcvc3RkL0lwdGM0eG1wRXh0LzIwMDgtMDItMjkvIiB4bWxuczpwaG90b3Nob3A9Imh0dHA6Ly9ucy5hZG9iZS5jb20vcGhvdG9zaG9wLzEuMC8iIElwdGM0eG1wRXh0OkRpZ2l0YWxTb3VyY2VGaWxlVHlwZT0iaHR0cDovL2N2LmlwdGMub3JnL25ld3Njb2Rlcy9kaWdpdGFsc291cmNldHlwZS90cmFpbmVkQWxnb3JpdGhtaWNNZWRpYSIgSXB0YzR4bXBFeHQ6RGlnaXRhbFNvdXJjZVR5cGU9Imh0dHA6Ly9jdi5pcHRjLm9yZy9uZXdzY29kZXMvZGlnaXRhbHNvdXJjZXR5cGUvdHJhaW5lZEFsZ29yaXRobWljTWVkaWEiIHBob3Rvc2hvcDpDcmVkaXQ9Ik1hZGUgd2l0aCBHb29nbGUgQUkiLz4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg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';

// Module-scoped cache for the decoded badge image. Decoded once per cold
// start (~5-20ms for a 7KB PNG); reused for every subsequent publish.
// Each bake clones-and-resizes this — the cached source is never mutated.
let _cachedBadge: Image | null = null;
async function getBadgeSource(): Promise<Image> {
  if (_cachedBadge) return _cachedBadge;
  const bytes = decodeBase64(BADGE_PNG_BASE64);
  const decoded = await imgDecode(bytes);
  if (!(decoded instanceof Image)) {
    throw new Error('[watermark] inlined badge PNG decoded as non-static image');
  }
  _cachedBadge = decoded;
  return _cachedBadge;
}

/**
 * Bake the AMOS watermark into the bottom-right corner of an image.
 *
 * - Free tier: downloads `imageUrl`, composites a flat pink badge, uploads
 *   the result to storage, returns the new signed URL.
 * - Pro+ tier: no-op, returns `imageUrl` unchanged.
 *
 * Fail-open: any error returns the original URL so publish never fails on
 * a bake issue.
 */
export async function bakeAmosWatermark(args: {
  db: SupabaseClient;
  imageUrl: string;
  userId: string;
  tier: Tier;
  /** One of the 9 grid positions. Defaults to 'top-left' when omitted. */
  position?: WatermarkPosition;
  /** Visual size of the chip. Defaults to 'medium'. */
  size?: WatermarkSize;
}): Promise<string> {
  const { db, imageUrl, userId, tier } = args;
  const position = safeWatermarkPosition(args.position);
  const size = safeWatermarkSize(args.size);

  if (tier !== 'free') return imageUrl;
  if (!imageUrl) return imageUrl;

  try {
    // 1. Download original image bytes (5s timeout — fail-open if slow)
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
    if (!imgRes.ok) {
      console.warn(`[watermark] fetch ${imgRes.status} — returning original`);
      return imageUrl;
    }
    const imgBytes = new Uint8Array(await imgRes.arrayBuffer());

    // 2. Decode (Image.decode handles PNG + JPEG; throws on unsupported)
    const decoded = await Image.decode(imgBytes);
    if (!(decoded instanceof Image)) {
      console.warn('[watermark] non-static image — returning original');
      return imageUrl;
    }

    // 3. Resolve target badge dimensions from the size variant. The width
    // scales with the image (% of image width) but is clamped to a minimum
    // so tiny images still get a legible chip. Height follows the badge's
    // native aspect ratio so the inlined PNG isn't squished.
    const targetW = Math.max(SIZE_MIN_W_PX[size], Math.round(decoded.width * SIZE_PCT[size]));
    const targetH = Math.round(targetW * BADGE_ASPECT);
    const margin  = Math.max(20, Math.round(decoded.width * BADGE_MARGIN_PCT));

    // 4. Load + resize the pre-rendered watermark chip (logo + text).
    // Clone first so the module-level cached source is never mutated.
    const source = await getBadgeSource();
    const badge = source.clone();
    badge.resize(targetW, targetH);

    // 5. Compute composite coordinates from the 9-position grid.
    // Image coords: (0,0) is top-left; (decoded.width, decoded.height) is
    // bottom-right. The badge anchor is its top-left, so we subtract badge
    // width/height for right/bottom positions and divide for center.
    const [vert, horiz] = position.split('-') as [
      'top' | 'middle' | 'bottom',
      'left' | 'center' | 'right',
    ];
    const x =
      horiz === 'left'  ? margin :
      horiz === 'right' ? decoded.width - targetW - margin :
                          Math.round((decoded.width - targetW) / 2);
    const y =
      vert === 'top'    ? margin :
      vert === 'bottom' ? decoded.height - targetH - margin :
                          Math.round((decoded.height - targetH) / 2);
    decoded.composite(badge, x, y);
    console.log(`[watermark] position=${position} size=${size} badge=${targetW}x${targetH} at (${x},${y}) img=${decoded.width}x${decoded.height}`);

    // 5. Encode JPEG q=85
    const out = await decoded.encodeJPEG(85);

    // 6. Upload to media bucket
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const path = `branded/${userId}/${fileName}`;
    const { error: upErr } = await db.storage
      .from('media')
      .upload(path, out, { contentType: 'image/jpeg', upsert: false });
    if (upErr) {
      console.warn(`[watermark] upload failed: ${upErr.message}`);
      return imageUrl;
    }

    // 7. Sign URL (7 days)
    const { data: signData } = await db.storage
      .from('media')
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (!signData?.signedUrl) {
      console.warn('[watermark] no signed URL — returning original');
      return imageUrl;
    }

    console.log(`[watermark] baked → ${path}`);
    return signData.signedUrl;
  } catch (err: any) {
    console.warn(`[watermark] threw: ${err?.message ?? err} — returning original`);
    return imageUrl;
  }
}
