import { useMarketingStrategy, type MarketingStrategy } from './useMarketingStrategy';
import type { LibraryPost, Channel } from '../types';

export type AlignmentStatus = 'ok' | 'warning' | 'no_strategy';

export interface AlignmentWarning {
  kind: 'no_strategy' | 'channel_inactive' | 'channel_missing' | 'cadence_high';
  channel?: Channel;
  message: string;
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
}

/**
 * Soft-warning alignment check between a Library post and the user's marketing strategy.
 * Never blocks publishing — only reports mismatches so the user can make an informed choice.
 *
 * Checks:
 *   1. Is there an active strategy at all?
 *   2. For each channel in the post, is that channel active in the strategy?
 *   3. (Future) Does scheduled cadence exceed strategy.posts_per_week per channel?
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
    };
  }

  const warnings: AlignmentWarning[] = [];
  const alignedChannels: Channel[] = [];
  const misalignedChannels: Channel[] = [];

  // Gate 1 — strategy missing or inactive
  if (!strategy || !strategy.is_active) {
    warnings.push({
      kind: 'no_strategy',
      message: 'Geen actieve marketing strategie. Stel er eerst één in voor optimale alignment.',
    });
    return {
      status: 'no_strategy',
      strategy: strategy ?? null,
      warnings,
      alignedChannels: [],
      misalignedChannels: post.channels,
      needsSetup: true,
    };
  }

  // Gate 2 — per-channel match
  for (const ch of post.channels) {
    const cfg = strategy.channels?.[ch];
    if (!cfg) {
      misalignedChannels.push(ch);
      warnings.push({
        kind: 'channel_missing',
        channel: ch,
        message: `${ch} staat niet in je strategie targeting.`,
      });
    } else if (!cfg.active) {
      misalignedChannels.push(ch);
      warnings.push({
        kind: 'channel_inactive',
        channel: ch,
        message: `${ch} is uitgeschakeld in je strategie.`,
      });
    } else {
      alignedChannels.push(ch);
    }
  }

  return {
    status: warnings.length > 0 ? 'warning' : 'ok',
    strategy,
    warnings,
    alignedChannels,
    misalignedChannels,
    needsSetup: false,
  };
}
