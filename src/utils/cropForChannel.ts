/**
 * Per-channel aspect ratio cropping helper.
 *
 * Each social platform has different aspect-ratio requirements:
 *   - Instagram feed: 1:1 (square) or 4:5 (portrait) or 1.91:1 (landscape)
 *   - Instagram Reels: 9:16 (vertical)
 *   - TikTok: 9:16 (vertical) — STRICT for video, photos auto-crop
 *   - Pinterest: 2:3 (vertical) preferred, accepts others
 *   - Facebook / LinkedIn / Threads: any ratio works
 *
 * This util takes a source image URI (local file or remote URL) and a
 * target channel + format, then returns a new URI cropped to the
 * platform's preferred ratio. Center-crop preserves the most important
 * part of the image (subject is usually centered).
 *
 * Used by PostReviewScreen before invoking publish-social so the right
 * ratio is uploaded — avoids server-side rejections (e.g. IG 4:3 reject)
 * or content getting accidentally cropped by the platform.
 */

import * as ImageManipulator from 'expo-image-manipulator';

export type Channel =
  | 'instagram'
  | 'tiktok'
  | 'pinterest'
  | 'facebook'
  | 'linkedin'
  | 'threads'
  | 'snapchat'
  | 'whatsapp'
  | 'x';

export type IgFormat = 'feed_square' | 'feed_portrait' | 'feed_landscape' | 'reel' | 'story';

const TARGET_RATIOS: Record<string, { width: number; height: number } | null> = {
  // Instagram
  'instagram_feed_square':    { width: 1, height: 1 },        // 1080x1080
  'instagram_feed_portrait':  { width: 4, height: 5 },        // 1080x1350
  'instagram_feed_landscape': { width: 1.91, height: 1 },     // 1080x566
  'instagram_reel':           { width: 9, height: 16 },       // 1080x1920
  'instagram_story':          { width: 9, height: 16 },

  // TikTok — vertical only
  'tiktok':                   { width: 9, height: 16 },       // 1080x1920

  // Pinterest — 2:3 preferred for organic reach
  'pinterest':                { width: 2, height: 3 },        // 1000x1500

  // Anything-goes platforms
  'facebook':                 null,
  'linkedin':                 null,
  'threads':                  null,
  'snapchat':                 null,
  'whatsapp':                 null,
  'x':                        null,
};

/**
 * Center-crop an image to a target aspect ratio.
 * Returns the original URI if no cropping is required for this channel.
 */
export async function cropForChannel(
  sourceUri: string,
  channel: Channel,
  igFormat?: IgFormat,
): Promise<string> {
  const key = channel === 'instagram' && igFormat
    ? `instagram_${igFormat}`
    : channel;

  const ratio = TARGET_RATIOS[key];
  if (!ratio) return sourceUri; // platform accepts any ratio

  try {
    // First read source dimensions via ImageManipulator (no-op resize)
    const probe = await ImageManipulator.manipulateAsync(
      sourceUri,
      [],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
    );
    const srcW = probe.width;
    const srcH = probe.height;
    if (!srcW || !srcH) return sourceUri;

    const targetRatio = ratio.width / ratio.height;
    const sourceRatio = srcW / srcH;

    // Already correct ratio (within 1% tolerance) — skip crop
    if (Math.abs(targetRatio - sourceRatio) < 0.01) return sourceUri;

    // Compute center crop dimensions
    let cropW: number;
    let cropH: number;
    let originX: number;
    let originY: number;

    if (sourceRatio > targetRatio) {
      // Source is wider than target → crop horizontally
      cropH = srcH;
      cropW = Math.round(cropH * targetRatio);
      originX = Math.round((srcW - cropW) / 2);
      originY = 0;
    } else {
      // Source is taller than target → crop vertically
      cropW = srcW;
      cropH = Math.round(cropW / targetRatio);
      originX = 0;
      originY = Math.round((srcH - cropH) / 2);
    }

    const cropped = await ImageManipulator.manipulateAsync(
      sourceUri,
      [{ crop: { originX, originY, width: cropW, height: cropH } }],
      { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
    );

    return cropped.uri;
  } catch (e) {
    console.warn('[cropForChannel] Crop failed, using original:', e);
    return sourceUri;
  }
}

/**
 * Get the target ratio for a channel/format. Returns null if any ratio is OK.
 * Used by PostReview to display ratio info to user before publishing.
 */
export function getTargetRatio(channel: Channel, igFormat?: IgFormat): { width: number; height: number } | null {
  const key = channel === 'instagram' && igFormat
    ? `instagram_${igFormat}`
    : channel;
  return TARGET_RATIOS[key] ?? null;
}
