'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import { scoreChannelFormat, channelLabel, type FormatBreach } from '@/lib/channelRules';
import type { LibraryPost, MarketingStrategy, Persona, Channel } from '@/types';

export type AlignmentStatus = 'ok' | 'warning' | 'no_strategy';

export interface AlignmentWarning {
  kind:
    | 'no_strategy'
    | 'channel_inactive'
    | 'channel_missing'
    | 'format_breach'
    | 'persona_no_target'
    | 'persona_low_match';
  channel?: Channel;
  message: string;
}

export interface ChannelScore {
  channel: Channel;
  score: number;
  formatScore: number;
  personaScore: number;
  inStrategy: boolean;
  breaches: FormatBreach[];
  matchedPersonas: string[];
  detectedTone: string | null;
}

export interface AlignmentResult {
  status: AlignmentStatus;
  strategy: MarketingStrategy | null;
  warnings: AlignmentWarning[];
  alignedChannels: Channel[];
  misalignedChannels: Channel[];
  needsSetup: boolean;
  channelScores: ChannelScore[];
  overallScore: number;
}

function scorePersonaMatch(
  channel: Channel,
  postText: string,
  hashtags: string[],
  personas: Persona[],
): { score: number; matched: string[]; warning: AlignmentWarning | null } {
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
  let bestOverlap = 0;
  const matched: string[] = [];
  for (const p of targeting) {
    const points = p.pain_points ?? [];
    if (points.length === 0) {
      bestOverlap = Math.max(bestOverlap, 0.5);
      matched.push(p.name);
      continue;
    }
    const hits = points.filter(
      (kw) => kw.trim() && haystack.includes(kw.toLowerCase().trim()),
    ).length;
    const overlap = hits / points.length;
    if (overlap > bestOverlap) bestOverlap = overlap;
    if (overlap > 0) matched.push(p.name);
  }
  const score = Math.min(100, Math.round(60 + bestOverlap * 50));
  const warning: AlignmentWarning | null = bestOverlap === 0
    ? {
        kind: 'persona_low_match',
        channel,
        message: `Post raakt geen pijnpunten van je ${channelLabel(channel)} persona's`,
      }
    : null;
  return { score, matched, warning };
}

export function useStrategyAlignment(post: LibraryPost | null | undefined): AlignmentResult {
  const { data: strategy } = useQuery<MarketingStrategy | null>({
    queryKey: ['strategy'],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('go_marketing_strategy')
        .select('*')
        .limit(1)
        .maybeSingle();
      return data as MarketingStrategy | null;
    },
    staleTime: 60_000,
  });

  if (!post) {
    return {
      status: 'ok', strategy: strategy ?? null, warnings: [],
      alignedChannels: [], misalignedChannels: [],
      needsSetup: !strategy, channelScores: [], overallScore: 100,
    };
  }

  if (!strategy) {
    return {
      status: 'no_strategy',
      strategy: null,
      warnings: [{
        kind: 'no_strategy',
        message: 'Geen actieve marketing strategie. Stel er eerst één in voor optimale alignment.',
      }],
      alignedChannels: [],
      misalignedChannels: post.channels,
      needsSetup: true,
      channelScores: [],
      overallScore: 50,
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
        kind: 'channel_missing', channel: ch,
        message: `${channelLabel(ch)} staat niet in je strategie targeting.`,
      });
    } else if (!cfg.active) {
      misalignedChannels.push(ch);
      warnings.push({
        kind: 'channel_inactive', channel: ch,
        message: `${channelLabel(ch)} is uitgeschakeld in je strategie.`,
      });
    } else {
      alignedChannels.push(ch);
    }

    const fmt = scoreChannelFormat(ch, caption, hashtags);
    for (const b of fmt.breaches) {
      warnings.push({
        kind: 'format_breach', channel: ch,
        message: `${channelLabel(ch)}: ${b.message}`,
      });
    }

    const persona = scorePersonaMatch(ch, caption, hashtags, personas);
    if (persona.warning) warnings.push(persona.warning);

    let combined = Math.round(fmt.score * 0.6 + persona.score * 0.4);
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
    status, strategy, warnings,
    alignedChannels, misalignedChannels,
    needsSetup: false, channelScores, overallScore,
  };
}
