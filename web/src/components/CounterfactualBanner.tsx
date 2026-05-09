'use client';

/**
 * CounterfactualBanner — "Left on the table" nudge.
 *
 * Web port of `src/components/CounterfactualNudge.tsx` (AMOS RN).
 * Calls the `agent-counterfactual` edge function and shows a yellow-orange
 * gradient banner when the org has missed agent runs with a non-zero estimated
 * euro impact. Hides itself entirely when there is nothing to nudge about.
 *
 * Mounting:
 *   <CounterfactualBanner />          // navigates to /agents on click
 *   <CounterfactualBanner onClick={fn} windowDays={14} />
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, Sparkles, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface CounterfactualResponse {
  window_days: number;
  missed_runs: number;
  missed_kinds: Record<string, number>;
  est_eur_left_on_table: number;
  methodology: string;
}

export interface CounterfactualBannerProps {
  /** Days to look back. Default 7. */
  windowDays?: number;
  /** Override action — defaults to navigating to `/agents`. */
  onClick?: () => void;
}

const eurFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export default function CounterfactualBanner({
  windowDays = 7,
  onClick,
}: CounterfactualBannerProps) {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<CounterfactualResponse | null>(null);

  // Auto-resolve org via organization_members (mirrors the RN spec).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      if (!userId || cancelled) return;
      const { data: row } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      if (!cancelled) setOrgId((row?.organization_id as string | undefined) ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch the counterfactual once we have an org id.
  useEffect(() => {
    let cancelled = false;
    if (!orgId) {
      // No org yet — keep loading=true (banner stays hidden) until resolution.
      return;
    }

    (async () => {
      try {
        const supabase = createClient();
        const { data: sessionRes } = await supabase.auth.getSession();
        const token = sessionRes?.session?.access_token ?? SUPABASE_ANON_KEY;

        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/agent-counterfactual`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
              apikey: SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              organization_id: orgId,
              window_days: windowDays,
            }),
          },
        );
        const json = (await res.json().catch(() => null)) as CounterfactualResponse | null;
        if (cancelled) return;
        if (!res.ok || !json || typeof json !== 'object') {
          setData(null);
        } else {
          setData(json);
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orgId, windowDays]);

  // Hide while we don't yet have an org / data, or when there is nothing to nudge.
  if (!orgId) return null;
  if (loading) return null;
  if (!data) return null;
  if (
    data.missed_runs === 0 ||
    data.est_eur_left_on_table === 0 ||
    data.methodology === 'no_missed_runs' ||
    data.methodology === 'no_missed_ad_runs' ||
    data.methodology === 'insufficient_history'
  ) {
    return null;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    router.push('/agents');
  };

  const eur = Math.round(data.est_eur_left_on_table);
  const formattedEur = eurFormatter.format(eur);
  const runs = data.missed_runs;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-left text-white shadow-md hover:shadow-lg transition-all"
      aria-label={`Left on the table. ${runs} missed agent runs, est. ${formattedEur} revenue.`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
        <Lightbulb className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          <p className="font-bold text-base">Left on the table</p>
        </div>
        <p className="text-sm text-white/90 leading-snug mt-0.5">
          If you&apos;d approved last week&apos;s {runs} agent {runs === 1 ? 'run' : 'runs'}, est. {formattedEur} revenue left on the table.
        </p>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
        <ChevronRight className="h-4 w-4 text-white" />
      </div>
    </button>
  );
}
