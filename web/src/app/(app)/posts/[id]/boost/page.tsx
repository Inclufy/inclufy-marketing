'use client';

/**
 * Web BoostFlow page — campaign config wizard.
 *
 * Mirror of mobile BoostFlowScreen. Same 4-step flow, same backend
 * (boost-post + ai-ad-variants edge functions, ad_campaigns DB).
 *
 * Route: /posts/[id]/boost
 */

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Sparkles, Check, Loader2, ExternalLink, Target, Wallet, Wand2, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase';

type BudgetPreset = { label: string; cents: number; days: number };
const BUDGET_PRESETS: BudgetPreset[] = [
  { label: '€15 / 3 dagen', cents: 1500, days: 3 },
  { label: '€25 / 3 dagen', cents: 2500, days: 3 },
  { label: '€50 / 5 dagen', cents: 5000, days: 5 },
  { label: '€100 / 7 dagen', cents: 10000, days: 7 },
  { label: '€250 / 14 dagen', cents: 25000, days: 14 },
];

type AudiencePreset = {
  key: string;
  label: string;
  description: string;
  config: Record<string, unknown>;
};
const AUDIENCE_PRESETS: AudiencePreset[] = [
  {
    key: 'lookalike_followers',
    label: 'Lookalike: Page volgers',
    description: 'Mensen vergelijkbaar met je huidige Inclufy Page volgers. Meta zoekt 1-2% lookalike binnen Nederland.',
    config: { type: 'lookalike', source: 'page_followers', country: 'NL', size: '1%' },
  },
  {
    key: 'esg_dei_interest',
    label: 'Interest: ESG / DEI / Inclusion',
    description: 'Doelgroep met expliciete interesses in duurzaamheid, diversiteit en inclusion. NL, leeftijd 25-55.',
    config: { type: 'interest', interests: ['ESG', 'DEI', 'inclusion', 'sustainability'], age: [25, 55], country: 'NL' },
  },
  {
    key: 'business_decisionmakers',
    label: 'Business decision-makers',
    description: 'HR-managers, CEO\'s, Operations leads in mid-large bedrijven. Voor B2B AMOS sales-positioning.',
    config: { type: 'job_title', job_titles: ['HR', 'CEO', 'COO', 'Director', 'Manager'], company_size: ['51-200', '201-500', '500+'], country: 'NL' },
  },
  {
    key: 'geo_only',
    label: 'Alleen geografisch',
    description: 'Iedereen in Nederland — Meta optimaliseert op basis van post performance.',
    config: { type: 'geo', country: 'NL' },
  },
];

type Variant = {
  id?: string;
  variant_label: string;
  headline?: string;
  primary_text: string;
  description?: string;
  call_to_action?: string;
  ai_rationale?: string;
  ai_target_emotion?: string;
};

export default function BoostFlowPage() {
  const { id: postId } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Prefill from Ads Agent (Capture-to-Ads bridge) ──────────────────────
  // When the user lands here from an Ads-Agent suggestion banner, the URL
  // carries `runId`, `budget_cents`, `days`, and optionally `audienceKey`.
  // We map them onto the closest existing preset so the chip UI stays clean.
  const runId = searchParams?.get('runId') ?? null;
  const prefillBudgetCents = (() => {
    const v = searchParams?.get('budget_cents');
    if (!v) return null;
    const n = Number(v);
    return isFinite(n) && n > 0 ? n : null;
  })();
  const prefillDays = (() => {
    const v = searchParams?.get('days');
    if (!v) return null;
    const n = Number(v);
    return isFinite(n) && n > 0 ? n : null;
  })();
  const prefillAudienceKey = searchParams?.get('audienceKey') ?? null;

  const initialBudget = useMemo<BudgetPreset>(() => {
    if (prefillBudgetCents == null || prefillDays == null) return BUDGET_PRESETS[1];
    const closest = BUDGET_PRESETS
      .map((p) => ({
        p,
        score: Math.abs(p.cents - prefillBudgetCents) + Math.abs(p.days - prefillDays) * 100,
      }))
      .sort((a, b) => a.score - b.score)[0];
    return closest?.p ?? BUDGET_PRESETS[1];
  }, [prefillBudgetCents, prefillDays]);

  const initialAudience = useMemo<AudiencePreset>(() => {
    if (!prefillAudienceKey) return AUDIENCE_PRESETS[0];
    return AUDIENCE_PRESETS.find((a) => a.key === prefillAudienceKey) ?? AUDIENCE_PRESETS[0];
  }, [prefillAudienceKey]);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [budget, setBudget] = useState<BudgetPreset>(initialBudget);
  const [audience, setAudience] = useState<AudiencePreset>(initialAudience);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [chosenVariant, setChosenVariant] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Generate variants when entering step 3
  useEffect(() => {
    if (step !== 3 || variants.length > 0) return;
    (async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.functions.invoke('boost-post', {
          body: {
            post_id: postId,
            channel: 'meta',
            budget_cents: budget.cents,
            duration_days: budget.days,
            audience_config: audience.config,
            objective: 'POST_ENGAGEMENT',
            auto_generate_variants: true,
            dry_run: true,
          },
        });
        if (error) throw error;
        setCampaignId(data?.campaign?.id ?? null);
        setVariants(data?.variants ?? []);
        if ((data?.variants ?? []).length > 0) {
          setChosenVariant((data.variants[0] as Variant).variant_label);
        }
      } catch (e: any) {
        toast.error(`AI variants genereren mislukt: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [step]);

  const onConfirm = async () => {
    if (!campaignId || !chosenVariant) return;
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase
        .from('campaign_creatives')
        .update({ is_winner: true })
        .eq('campaign_id', campaignId)
        .eq('variant_label', chosenVariant);

      // BUG-NEW-06 fix: populate started_at so the cron's duration
      // detection works. approved_at marks user confirmation moment;
      // started_at marks when the campaign clock begins.
      const now = new Date().toISOString();
      await supabase
        .from('ad_campaigns')
        .update({
          status: 'pending_approval',
          approved_at: now,
          started_at: now,
        })
        .eq('id', campaignId);

      setSubmitted(true);
      toast.success('Boost ingediend');
    } catch (e: any) {
      toast.error(`Bevestigen mislukt: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onOpenAdsManager = () => {
    const url = `https://www.facebook.com/ads/manager/manage/ads/?post_id=${postId}&boost=1`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-full border border-slate-200 p-2 hover:bg-slate-50"
          aria-label="Terug"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" /> Boost
          </h1>
          <p className="text-sm text-slate-500">Capture-to-Ad — stap {step} van 4</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-amber-500' : 'bg-slate-200'}`}
          />
        ))}
      </div>

      {/* Agent-suggested badge — only when prefill is supplied via URL. */}
      {runId && (
        <div className="inline-flex items-center gap-1.5 rounded-md border border-purple-300 bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
          <Sparkles className="h-3.5 w-3.5" />
          Suggested by Ads Agent
        </div>
      )}

      {/* Step 1: Budget */}
      {step === 1 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Wallet className="h-5 w-5 text-amber-500" /> Hoeveel wil je investeren?
          </div>
          <p className="text-sm text-slate-600">
            Tip: €25 over 3 dagen geeft genoeg signaal om Meta&apos;s algoritme te trainen, zonder hoog risico.
          </p>
          <div className="space-y-2">
            {BUDGET_PRESETS.map((p) => {
              const selected = budget.cents === p.cents;
              return (
                <button
                  key={p.label}
                  onClick={() => setBudget(p)}
                  className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                    selected ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-semibold text-slate-900">{p.label}</span>
                  {selected && <Check className="h-5 w-5 text-amber-500" />}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Step 2: Audience */}
      {step === 2 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Target className="h-5 w-5 text-amber-500" /> Wie wil je bereiken?
          </div>
          <p className="text-sm text-slate-600">
            Kies een doelgroep-preset. Je kunt later in Meta Ads Manager verder verfijnen.
          </p>
          <div className="space-y-2">
            {AUDIENCE_PRESETS.map((a) => {
              const selected = audience.key === a.key;
              return (
                <button
                  key={a.key}
                  onClick={() => setAudience(a)}
                  className={`flex w-full flex-col gap-1 rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                    selected ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{a.label}</span>
                    {selected && <Check className="h-5 w-5 text-amber-500 shrink-0" />}
                  </div>
                  <span className="text-sm text-slate-600">{a.description}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Step 3: AI Variants */}
      {step === 3 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Wand2 className="h-5 w-5 text-amber-500" /> AI-gegenereerde varianten
          </div>
          <p className="text-sm text-slate-600">
            Kies welke versie je als ad wilt gebruiken. Ze targetten verschillende emoties.
          </p>
          {loading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <p className="text-sm text-slate-500">3 varianten genereren…</p>
            </div>
          )}
          {!loading && variants.length === 0 && (
            <p className="text-sm text-red-600">Geen varianten beschikbaar. Probeer opnieuw.</p>
          )}
          {!loading && variants.length > 0 && (
            <div className="space-y-3">
              {variants.map((v) => {
                const selected = chosenVariant === v.variant_label;
                return (
                  <button
                    key={v.variant_label}
                    onClick={() => setChosenVariant(v.variant_label)}
                    className={`block w-full rounded-xl border-2 p-4 text-left transition-colors ${
                      selected ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 font-bold text-white">
                        {v.variant_label}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                          {v.ai_target_emotion?.replace('_', ' ') ?? 'variant'}
                        </p>
                        <p className="text-xs text-slate-500">{v.ai_rationale}</p>
                      </div>
                      {selected && <Check className="h-5 w-5 text-amber-500" />}
                    </div>
                    {v.headline && (
                      <p className="font-semibold text-slate-900">{v.headline}</p>
                    )}
                    <p className="mt-1 text-sm text-slate-700 leading-relaxed">{v.primary_text}</p>
                    {v.call_to_action && (
                      <span className="mt-2 inline-block rounded bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-700">
                        {v.call_to_action.replace(/_/g, ' ')}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
            <CheckCircle2 className="h-5 w-5 text-amber-500" />
            {submitted ? 'Boost ingediend' : 'Bevestig boost'}
          </div>
          {submitted ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                Je campagne staat klaar in dry-run mode. Zodra Meta de ads_management scope goedkeurt voor AMOS,
                gaat hij automatisch live. Tot dan kun je hem ook handmatig in Meta Ads Manager pushen.
              </p>
              <button
                onClick={onOpenAdsManager}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white hover:bg-amber-600"
              >
                <ExternalLink className="h-4 w-4" /> Open Meta Ads Manager
              </button>
              <button
                onClick={() => router.push(`/posts/${postId}`)}
                className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Terug naar post
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Budget</p>
                <p className="font-semibold text-slate-900">{budget.label}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Doelgroep</p>
                <p className="font-semibold text-slate-900">{audience.label}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Winnende variant</p>
                <p className="font-semibold text-slate-900">Variant {chosenVariant}</p>
              </div>
              <button
                onClick={onConfirm}
                disabled={loading || !chosenVariant}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                Bevestig + boost
              </button>
            </div>
          )}
        </section>
      )}

      {/* Bottom nav: Back + Next */}
      {!submitted && (
        <div className="flex gap-2 pt-4">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s))}
              className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Terug
            </button>
          )}
          {step < 4 && (
            <button
              onClick={() => setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s))}
              disabled={step === 3 && (loading || !chosenVariant)}
              className="flex-[2] rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              Volgende
            </button>
          )}
        </div>
      )}
    </div>
  );
}
