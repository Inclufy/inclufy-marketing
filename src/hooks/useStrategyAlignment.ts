import { useMarketingStrategy, type MarketingStrategy, type Persona } from './useMarketingStrategy';
import type { LibraryPost, Channel } from '../types';
import { scoreChannelFormat, type FormatBreach, channelLabel } from '../lib/channelRules';

export type AlignmentStatus = 'ok' | 'warning' | 'no_strategy';

export interface AlignmentWarning {
  kind:
    | 'no_strategy'
    | 'channel_inactive'
    | 'channel_missing'
    | 'cadence_high'
    | 'format_breach'
    | 'persona_no_target'
    | 'persona_low_match';
  channel?: Channel;
  message: string;
}

export interface ChannelScore {
  channel: Channel;
  score: number; // 0-100
  formatScore: number;
  personaScore: number; // 100 if no personas configured (neutral)
  inStrategy: boolean;
  breaches: FormatBreach[];
  matchedPersonas: string[]; // names
  detectedTone: string | null;
}

export interface AlignmentResult {
  status: AlignmentStatus;
  strategy: MarketingStrategy | null;
  warnings: AlignmentWarning[];
  /** Channels in the post that ARE active in strategy */
  alignedChannels: Channel[];
  /** Channels in the post that are NOT active in strategy */
  misalignedChannels: Channel[];
  /** True if no strategy exists yet OR strategy.is_active === false */
  needsSetup: boolean;
  /** Per-channel score breakdown (empty when no strategy) */
  channelScores: ChannelScore[];
  /** Worst score across all channels (used for banner color), 100 if none */
  overallScore: number;
}

// ─── Persona-match helper ──────────────────────────────────────────

function scorePersonaMatch(
  channel: Channel,
  postText: string,
  hashtags: string[],
  personas: Persona[],
): { score: number; matched: string[]; warning: AlignmentWarning | null } {
  // No personas configured → neutral pass (don't penalize, don't warn)
  if (!personas || personas.length === 0) {
    return { score: 100, matched: [], warning: null };
  }

  const targeting = personas.filter((p) => (p.channels ?? []).includes(channel));
  if (targeting.length === 0) {
    return {
      score: 70,
      matched: [],
      warning: {
        kind: 'persona_no_target',
        channel,
        message: `Geen persona gericht op ${channelLabel(channel)} — voeg er één toe of haal het kanaal weg`,
      },
    };
  }

  const haystack = (postText + ' ' + hashtags.join(' ')).toLowerCase();

  // Per-persona overlap = fraction of pain_points whose keyword appears in text.
  // Inflation guard: empty pain_points = no signal (overlap 0, NOT 0.5). A single
  // pain-point persona can no longer max out the score with one keyword hit
  // because we apply a sqrt-saturation curve below.
  let bestOverlap = 0;
  let anyPersonaHadPainPoints = false;
  const matched: string[] = [];
  for (const p of targeting) {
    const points = (p.pain_points ?? []).map((kw) => kw.trim()).filter(Boolean);
    if (points.length === 0) {
      // No pain points defined → no signal from this persona (was 0.5 — inflation)
      continue;
    }
    anyPersonaHadPainPoints = true;
    const hits = points.filter((kw) => haystack.includes(kw.toLowerCase())).length;
    const overlap = hits / points.length;
    if (overlap > bestOverlap) bestOverlap = overlap;
    if (overlap > 0) matched.push(p.name);
  }

  // Special case: targeting personas exist but none have pain_points configured.
  // Cannot evaluate match → return neutral 60 with explicit warning.
  if (!anyPersonaHadPainPoints) {
    return {
      score: 60,
      matched: [],
      warning: {
        kind: 'persona_low_match',
        channel,
        message: `Persona's voor ${channelLabel(channel)} hebben geen pijnpunten gedefinieerd — vul ze aan voor een betrouwbare match-score`,
      },
    };
  }

  // Sqrt-saturation: 0% → 40, 25% → 70, 50% → 82, 100% → 100.
  // Softer curve than linear so a single keyword hit doesn't max out the score.
  const score = Math.min(100, Math.round(40 + Math.sqrt(bestOverlap) * 60));
  const warning: AlignmentWarning | null = bestOverlap === 0
    ? {
        kind: 'persona_low_match',
        channel,
        message: `Post raakt geen pijnpunten van je ${channelLabel(channel)} persona's`,
      }
    : null;

  return { score, matched, warning };
}

// ─── Hook ────────────────────────────────────────────────────────────

/**
 * Channel-fit alignment between a Library post and the user's marketing strategy.
 * Combines three layers (all soft-warnings, never blocks publishing):
 *   1. On/off — is the channel active in strategy.channels?
 *   2. Format — caption length, hashtag count, tone, ALL-CAPS (per-channel rules)
 *   3. Persona — when personas are defined, does the post target one of them?
 */
export function useStrategyAlignment(post: LibraryPost | null | undefined): AlignmentResult {
  const { data: strategy } = useMarketingStrategy();

  if (!post) {
    return {
      status: 'ok',
      strategy: strategy ?? null,
      warnings: [],
      alignedChannels: [],
      misalignedChannels: [],
      needsSetup: !strategy || !strategy.is_active,
      channelScores: [],
      overallScore: 100,
    };
  }

  // Gate 1 — strategy missing or inactive
  if (!strategy || !strategy.is_active) {
    return {
      status: 'no_strategy',
      strategy: strategy ?? null,
      warnings: [{
        kind: 'no_strategy',
        message: 'Geen actieve marketing strategie. Stel er eerst één in voor optimale alignment.',
      }],
      alignedChannels: [],
      misalignedChannels: post.channels,
      needsSetup: true,
      channelScores: [],
      overallScore: 50, // unknown — show as warning color
    };
  }

  const personas = strategy.personas ?? [];
  const tr = post.translations[post.primary_language];
  const caption = tr?.caption ?? '';
  const hashtags = tr?.hashtags ?? [];

  const warnings: AlignmentWarning[] = [];
  const alignedChannels: Channel[] = [];
  const misalignedChannels: Channel[] = [];
  const channelScores: ChannelScore[] = [];

  for (const ch of post.channels) {
    const cfg = strategy.channels?.[ch];
    const inStrategy = !!cfg && cfg.active;

    if (!cfg) {
      misalignedChannels.push(ch);
      warnings.push({
        kind: 'channel_missing',
        channel: ch,
        message: `${channelLabel(ch)} staat niet in je strategie targeting.`,
      });
    } else if (!cfg.active) {
      misalignedChannels.push(ch);
      warnings.push({
        kind: 'channel_inactive',
        channel: ch,
        message: `${channelLabel(ch)} is uitgeschakeld in je strategie.`,
      });
    } else {
      alignedChannels.push(ch);
    }

    // Layer 1 — format scoring
    const fmt = scoreChannelFormat(ch, caption, hashtags);
    for (const b of fmt.breaches) {
      warnings.push({
        kind: 'format_breach',
        channel: ch,
        message: `${channelLabel(ch)}: ${b.message}`,
      });
    }

    // Layer 2 — persona match
    const persona = scorePersonaMatch(ch, caption, hashtags, personas);
    if (persona.warning) warnings.push(persona.warning);

    // Combined channel score: avg of format + persona, then -25 if not in strategy
    let combined = Math.round((fmt.score * 0.6) + (persona.score * 0.4));
    if (!inStrategy) combined = Math.max(0, combined - 25);

    channelScores.push({
      channel: ch,
      score: combined,
      formatScore: fmt.score,
      personaScore: persona.score,
      inStrategy,
      breaches: fmt.breaches,
      matchedPersonas: persona.matched,
      detectedTone: fmt.detectedTone,
    });
  }

  const overallScore = channelScores.length === 0
    ? 100
    : Math.min(...channelScores.map((s) => s.score));

  const status: AlignmentStatus = warnings.length === 0 ? 'ok' : 'warning';

  return {
    status,
    strategy,
    warnings,
    alignedChannels,
    misalignedChannels,
    needsSetup: false,
    channelScores,
    overallScore,
  };
}
