import type { Channel } from '@/types';

// ─── Per-channel norms (industry best practices, tunable) ──────────────

export interface ChannelRules {
  caption: { minIdeal: number; maxIdeal: number; hardMax: number };
  hashtags: { minIdeal: number; maxIdeal: number; hardMax: number };
  expectedTone: Tone;
  altTones: Tone[];
}

export type Tone = 'formal' | 'casual' | 'inspirational' | 'community' | 'visual';

export const CHANNEL_RULES: Partial<Record<Channel, ChannelRules>> = {
  linkedin: {
    caption: { minIdeal: 600, maxIdeal: 3000, hardMax: 3000 },
    hashtags: { minIdeal: 3, maxIdeal: 5, hardMax: 10 },
    expectedTone: 'formal',
    altTones: ['inspirational'],
  },
  instagram: {
    caption: { minIdeal: 125, maxIdeal: 2200, hardMax: 2200 },
    hashtags: { minIdeal: 8, maxIdeal: 15, hardMax: 30 },
    expectedTone: 'visual',
    altTones: ['casual', 'inspirational'],
  },
  facebook: {
    caption: { minIdeal: 40, maxIdeal: 500, hardMax: 5000 },
    hashtags: { minIdeal: 1, maxIdeal: 2, hardMax: 5 },
    expectedTone: 'community',
    altTones: ['casual'],
  },
  x: {
    caption: { minIdeal: 71, maxIdeal: 280, hardMax: 280 },
    hashtags: { minIdeal: 1, maxIdeal: 2, hardMax: 4 },
    expectedTone: 'casual',
    altTones: ['formal'],
  },
  tiktok: {
    caption: { minIdeal: 80, maxIdeal: 150, hardMax: 300 },
    hashtags: { minIdeal: 3, maxIdeal: 8, hardMax: 12 },
    expectedTone: 'casual',
    altTones: ['inspirational'],
  },
};

// ─── Tone lexicon (NL/EN, lowercase, simple .includes match) ──────────

const TONE_KEYWORDS: Record<Tone, string[]> = {
  formal: [
    'expertise', 'strategie', 'strategy', 'roi', 'implementatie', 'implementation',
    'stakeholders', 'synergie', 'operationele', 'transformatie', 'transformation',
    'enterprise', 'b2b', 'governance', 'compliance', 'rendement', 'kwartaal',
  ],
  casual: [
    'vibe', 'love', 'share', 'yay', 'omg', 'guys', 'jongens', 'jullie', 'gewoon',
    'super', 'check it', 'haha', 'btw', 'lol',
  ],
  inspirational: [
    'droom', 'dream', 'inspire', 'inspireer', 'believe', 'geloof', 'mindset',
    'journey', 'reis', 'never give up', 'unlock', 'potential', 'potentieel',
  ],
  community: [
    'samen', 'together', 'familie', 'family', 'buurt', 'neighborhood',
    'iedereen welkom', 'community', 'wij', 'ons', 'leden',
  ],
  visual: [], // visual is implicit in IG; not keyword-detectable. Used as channel norm only.
};

// ─── Public API ─────────────────────────────────────────────────────

export interface FormatBreach {
  kind:
    | 'caption_too_short' | 'caption_too_long' | 'caption_over_hard_max'
    | 'hashtags_too_few' | 'hashtags_too_many' | 'hashtags_over_hard_max'
    | 'tone_mismatch' | 'all_caps' | 'no_caption';
  message: string;
  penalty: number; // points subtracted from base 100
}

export interface FormatScoreResult {
  score: number; // 0-100
  breaches: FormatBreach[];
  detectedTone: Tone | null;
}

export function scoreChannelFormat(
  channel: Channel,
  caption: string,
  hashtags: string[],
): FormatScoreResult {
  const rules = CHANNEL_RULES[channel];
  // No rules defined (e.g. whatsapp) → neutral pass
  if (!rules) {
    return { score: 100, breaches: [], detectedTone: null };
  }

  const text = (caption || '').trim();
  const breaches: FormatBreach[] = [];
  let score = 100;

  // Caption length
  if (text.length === 0) {
    breaches.push({
      kind: 'no_caption',
      message: `Geen caption — ${channelLabel(channel)} verwacht tekst`,
      penalty: 25,
    });
    score -= 25;
  } else {
    if (text.length < rules.caption.minIdeal) {
      const penalty = text.length < rules.caption.minIdeal / 2 ? 15 : 8;
      breaches.push({
        kind: 'caption_too_short',
        message: `Caption is kort (${text.length} tekens, ideaal ${rules.caption.minIdeal}–${rules.caption.maxIdeal})`,
        penalty,
      });
      score -= penalty;
    } else if (text.length > rules.caption.hardMax) {
      breaches.push({
        kind: 'caption_over_hard_max',
        message: `Caption ${text.length} tekens — ${channelLabel(channel)} kapt af bij ${rules.caption.hardMax}`,
        penalty: 20,
      });
      score -= 20;
    } else if (text.length > rules.caption.maxIdeal) {
      breaches.push({
        kind: 'caption_too_long',
        message: `Caption ${text.length} tekens — over ideale lengte (${rules.caption.maxIdeal})`,
        penalty: 5,
      });
      score -= 5;
    }
  }

  // Hashtag count
  const tagCount = hashtags.length;
  if (tagCount < rules.hashtags.minIdeal) {
    const penalty = tagCount === 0 ? 8 : 4;
    breaches.push({
      kind: 'hashtags_too_few',
      message: `${tagCount} hashtags — ${channelLabel(channel)} ideaal ${rules.hashtags.minIdeal}–${rules.hashtags.maxIdeal}`,
      penalty,
    });
    score -= penalty;
  } else if (tagCount > rules.hashtags.hardMax) {
    breaches.push({
      kind: 'hashtags_over_hard_max',
      message: `${tagCount} hashtags — boven ${channelLabel(channel)} maximum (${rules.hashtags.hardMax})`,
      penalty: 12,
    });
    score -= 12;
  } else if (tagCount > rules.hashtags.maxIdeal) {
    breaches.push({
      kind: 'hashtags_too_many',
      message: `${tagCount} hashtags — over ideaal aantal (${rules.hashtags.maxIdeal})`,
      penalty: 4,
    });
    score -= 4;
  }

  // Tone detection (lexicon hit-count)
  const lower = text.toLowerCase();
  const toneHits: Record<Tone, number> = {
    formal: 0, casual: 0, inspirational: 0, community: 0, visual: 0,
  };
  (Object.keys(TONE_KEYWORDS) as Tone[]).forEach((t) => {
    for (const kw of TONE_KEYWORDS[t]) {
      if (lower.includes(kw)) toneHits[t]++;
    }
  });

  // Pick dominant tone (must have ≥2 hits to register)
  let detectedTone: Tone | null = null;
  let maxHits = 1;
  (Object.keys(toneHits) as Tone[]).forEach((t) => {
    if (toneHits[t] > maxHits) { maxHits = toneHits[t]; detectedTone = t; }
  });

  // Tone mismatch: warn only if detected tone is set AND it's neither expected nor an alt
  if (detectedTone && detectedTone !== rules.expectedTone && !rules.altTones.includes(detectedTone)) {
    breaches.push({
      kind: 'tone_mismatch',
      message: `Toon lijkt ${toneLabel(detectedTone)} — ${channelLabel(channel)} verwacht ${toneLabel(rules.expectedTone)}`,
      penalty: 12,
    });
    score -= 12;
  }

  // ALL-CAPS abuse (>15% of letters uppercase, only check if text has letters)
  const letters = text.match(/[a-zA-Z]/g) ?? [];
  if (letters.length > 20) {
    const upperCount = letters.filter((c) => c === c.toUpperCase()).length;
    const upperRatio = upperCount / letters.length;
    if (upperRatio > 0.4) {
      breaches.push({
        kind: 'all_caps',
        message: `Veel HOOFDLETTERS (${Math.round(upperRatio * 100)}%) — komt schreeuwerig over`,
        penalty: 8,
      });
      score -= 8;
    }
  }

  // Floor score
  score = Math.max(0, score);

  return { score, breaches, detectedTone };
}

// ─── Helpers ────────────────────────────────────────────────────────

export function channelLabel(c: Channel): string {
  switch (c) {
    case 'linkedin': return 'LinkedIn';
    case 'instagram': return 'Instagram';
    case 'facebook': return 'Facebook';
    case 'x': return 'X';
    case 'tiktok': return 'TikTok';
    default: return c;
  }
}

export function toneLabel(t: Tone): string {
  switch (t) {
    case 'formal': return 'formeel';
    case 'casual': return 'casual';
    case 'inspirational': return 'inspirerend';
    case 'community': return 'community-gericht';
    case 'visual': return 'visueel';
  }
}

