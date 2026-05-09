/**
 * Single source of truth for "which channels can this user publish to right now".
 *
 * Used by every content-creation screen that needs to render channel options
 * (LiveCapture picker, ContentCreator wizard, Library publish modal,
 * QuickPost, etc.) so they stay in sync as users connect/disconnect
 * social accounts.
 *
 * Returns:
 *   - oauthChannels: list of Channel keys with status='active' or 'connected'
 *     in the social_accounts table (deduped — multiple FB Pages count once)
 *   - manualChannels: always ['snapchat', 'whatsapp'] (no OAuth, deep-link share)
 *   - allChannels: oauth + manual, deduped
 *
 * Defaults sensibly when user has zero connections — returns the manual-only
 * list so the UI never shows an empty picker (user can always copy-paste).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import type { Channel } from '../types';

const MANUAL_CHANNELS: Channel[] = ['snapchat', 'whatsapp'];

interface ConnectedChannelsResult {
  oauthChannels: Channel[];
  manualChannels: Channel[];
  allChannels: Channel[];
  loading: boolean;
  refetch: () => void;
}

export function useConnectedChannels(): ConnectedChannelsResult {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['connected-channels'],
    queryFn: async (): Promise<{ oauth: Channel[] }> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { oauth: [] };
      const { data: accounts } = await supabase
        .from('social_accounts')
        .select('platform')
        .eq('user_id', user.id)
        .in('status', ['active', 'connected']);
      const oauth = Array.from(
        new Set((accounts ?? []).map((a: any) => a.platform as Channel))
      );
      return { oauth };
    },
    staleTime: 60_000, // refetch at most once per minute
  });

  const oauthChannels = data?.oauth ?? [];
  const manualChannels = MANUAL_CHANNELS;
  const allChannels = Array.from(new Set([...oauthChannels, ...manualChannels]));

  return {
    oauthChannels,
    manualChannels,
    allChannels,
    loading: isLoading,
    refetch,
  };
}

/**
 * Helper for use outside React (in async event handlers, e.g. capture flow).
 * Direct Supabase query, returns the same shape as the hook.
 */
export async function fetchConnectedChannels(): Promise<{
  oauthChannels: Channel[];
  manualChannels: Channel[];
  allChannels: Channel[];
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { oauthChannels: [], manualChannels: MANUAL_CHANNELS, allChannels: [...MANUAL_CHANNELS] };
    }
    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('platform')
      .eq('user_id', user.id)
      .in('status', ['active', 'connected']);
    const oauthChannels = Array.from(
      new Set((accounts ?? []).map((a: any) => a.platform as Channel))
    );
    const allChannels = Array.from(new Set([...oauthChannels, ...MANUAL_CHANNELS]));
    return { oauthChannels, manualChannels: MANUAL_CHANNELS, allChannels };
  } catch {
    return { oauthChannels: [], manualChannels: MANUAL_CHANNELS, allChannels: [...MANUAL_CHANNELS] };
  }
}
