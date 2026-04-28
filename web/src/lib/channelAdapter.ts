import type { Channel } from '@/types';
import { CHANNEL_RULES } from './channelRules';

// Channel-specific runtime adaptation of caption + hashtags.
// Single source-of-truth caption gets transformed per platform at publish time.
// Goals: trim/expand to channel sweet-spot, calibrate hashtag count, add platform-idiomatic flourishes.

export interface AdaptedContent {
  caption: string;
  hashtags: string[];
}

export function adaptForChannel(
  channel: Channel,
  caption: string,
  hashtags: string[],
): AdaptedContent {
  const rules = CHANNEL_RULES[channel];
  if (!rules) return { caption, hashtags };

  let outCaption = caption.trim();
  let outHashtags = [...hashtags];

  // ── Per-channel transforms ────────────────────────────
  switch (channel) {
    case 'instagram':
      outCaption = adaptForInstagram(outCaption);
      outHashtags = expandHashtags(outHashtags, rules.hashtags.minIdeal, rules.hashtags.maxIdeal);
      break;
    case 'facebook':
      outCaption = adaptForFacebook(outCaption, rules.caption.maxIdeal);
      outHashtags = trimHashtags(outHashtags, rules.hashtags.maxIdeal);
      break;
    case 'linkedin':
      // LinkedIn keeps the source caption + 3-5 tags
      outHashtags = trimHashtags(outHashtags, rules.hashtags.maxIdeal);
      break;
    case 'x':
      outCaption = trimToLength(outCaption, 250); // leave room for ~30 chars of hashtags
      outHashtags = trimHashtags(outHashtags, rules.hashtags.maxIdeal);
      break;
    case 'tiktok':
      outCaption = trimToLength(outCaption, rules.caption.maxIdeal);
      outHashtags = trimHashtags(outHashtags, rules.hashtags.maxIdeal);
      break;
    default:
      break;
  }

  // Always enforce hard caps last
  if (outCaption.length > rules.caption.hardMax) {
    outCaption = trimToLength(outCaption, rules.caption.hardMax);
  }
  if (outHashtags.length > rules.hashtags.hardMax) {
    outHashtags = outHashtags.slice(0, rules.hashtags.hardMax);
  }

  return { caption: outCaption, hashtags: outHashtags };
}

// ─── Channel-specific helpers ─────────────────────────────────────────

function adaptForInstagram(caption: string): string {
  // Instagram: prepend a visual emoji if caption has none, add line breaks for scannability
  // Catches BMP symbols (✨ ☀ etc.) and astral plane emoji via surrogate-pair range
  const hasEmoji = /[\u2600-\u27BF\uD800-\uDFFF]/.test(caption);
  let out = caption;
  if (!hasEmoji) out = '✨ ' + out;
  return out;
}

function adaptForFacebook(caption: string, maxIdeal: number): string {
  // Facebook: trim to ideal length (preview cuts ~80, but show 250-500 typical body)
  if (caption.length <= maxIdeal) return caption;
  // Keep first sentence + summary
  const firstStop = caption.search(/[.!?]\s/);
  if (firstStop > 0 && firstStop < maxIdeal) {
    return caption.slice(0, firstStop + 1);
  }
  return trimToLength(caption, maxIdeal);
}

function expandHashtags(tags: string[], minIdeal: number, maxIdeal: number): string[] {
  // If under minimum, pad from a small generic pool (only if tag count clearly below ideal)
  if (tags.length >= minIdeal) return tags.slice(0, maxIdeal);
  const generic = ['#Inclufy', '#AIvoorMensen', '#B2B', '#Innovation', '#Tech', '#FutureOfWork', '#SaaS'];
  const out = [...tags];
  for (const t of generic) {
    if (out.length >= minIdeal) break;
    if (!out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t);
  }
  return out.slice(0, maxIdeal);
}

function trimHashtags(tags: string[], maxIdeal: number): string[] {
  if (tags.length <= maxIdeal) return tags;
  return tags.slice(0, maxIdeal);
}

function trimToLength(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  // Trim at the last sentence/space boundary before maxLen, append ellipsis
  const slice = text.slice(0, maxLen - 1);
  const lastBoundary = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
    slice.lastIndexOf('\n'),
    slice.lastIndexOf(' '),
  );
  const cutAt = lastBoundary > maxLen * 0.6 ? lastBoundary + 1 : maxLen - 1;
  return slice.slice(0, cutAt).trim() + '…';
}
