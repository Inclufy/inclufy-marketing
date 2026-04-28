'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Trash2, Send, Calendar, Loader2, AlertCircle,
  CheckCircle2, AlertTriangle, ChevronRight, Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useLibraryPost, usePublishLibraryPost, useScheduleLibraryPost, useDeleteLibraryPost,
} from '@/hooks/useLibraryPosts';
import { useStrategyAlignment, type ChannelScore } from '@/hooks/useStrategyAlignment';
import { channelLabel } from '@/lib/channelRules';
import type { LibraryLanguage } from '@/types';

const LANGS: LibraryLanguage[] = ['nl', 'en', 'fr'];

export default function LibraryPostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: post, isLoading } = useLibraryPost(id);
  const [language, setLanguage] = useState<LibraryLanguage>('nl');
  const [expandedDetails, setExpandedDetails] = useState(false);
  const alignment = useStrategyAlignment(post);
  const publish = usePublishLibraryPost();
  const schedule = useScheduleLibraryPost();
  const del = useDeleteLibraryPost();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!post) return <div className="p-6">Post niet gevonden.</div>;

  const tr = post.translations[language] ?? post.translations[post.primary_language];

  const onPublish = async () => {
    try {
      const res = await publish.mutateAsync({ postId: post.id, language });
      if (res.ok) toast.success('Gepubliceerd op alle kanalen!');
      else toast.error('Publicatie deels mislukt — zie publish resultaten onder');
    } catch (err: any) {
      toast.error(err.message || 'Publicatie mislukt');
    }
  };

  const onSchedule = async (offset: '+1h' | '+1d' | '+1w') => {
    const d = new Date();
    if (offset === '+1h') d.setHours(d.getHours() + 1);
    if (offset === '+1d') d.setDate(d.getDate() + 1);
    if (offset === '+1w') d.setDate(d.getDate() + 7);
    try {
      await schedule.mutateAsync({ postId: post.id, scheduledFor: d.toISOString() });
      toast.success(`Gepland voor ${d.toLocaleString('nl-NL')}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const onDelete = async () => {
    if (!confirm('Deze post verwijderen?')) return;
    try {
      await del.mutateAsync(post.id);
      toast.info('Verwijderd');
      router.push('/library');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/library" className="text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 text-xl font-bold truncate">{post.external_id ?? `Post ${post.id.slice(0, 8)}`}</h1>
        <button
          onClick={onDelete}
          className="rounded-full p-2 text-red-500 hover:bg-red-50"
          aria-label="Verwijder"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Image preview */}
      <div className="aspect-square w-full rounded-xl bg-slate-100 overflow-hidden relative">
        {tr?.image_url ? (
          <Image src={tr.image_url} alt="post preview" fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">Geen afbeelding</div>
        )}
      </div>

      {/* Language toggle */}
      <div className="flex gap-2">
        {LANGS.map((l) => (
          <button
            key={l}
            onClick={() => setLanguage(l)}
            className={`px-3 py-1 text-xs font-semibold rounded-full border ${
              language === l
                ? 'border-pink-600 bg-pink-50 text-pink-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Caption */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-700">Caption</h2>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{tr?.caption}</p>
        {tr?.hashtags && tr.hashtags.length > 0 && (
          <p className="text-sm text-pink-600 flex flex-wrap gap-x-2">
            {tr.hashtags.map((h) => (
              <span key={h} className="inline-flex items-center gap-0.5">
                {!h.startsWith('#') && <Hash className="h-3 w-3" />}
                {h}
              </span>
            ))}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-sm">
        <Row label="Status" value={post.status} />
        <Row label="Type" value={post.post_type} />
        <Row label="Kanalen" value={post.channels.join(', ')} />
        {post.campaign && <Row label="Campagne" value={post.campaign} />}
      </div>

      {/* Alignment banner */}
      <AlignmentBanner alignment={alignment} expanded={expandedDetails} onToggle={() => setExpandedDetails((e) => !e)} />

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={onPublish}
          disabled={publish.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-pink-600 px-6 py-3 text-base font-semibold text-white hover:bg-pink-700 disabled:opacity-50"
        >
          {publish.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          {publish.isPending ? 'Bezig met publiceren…' : 'Nu publiceren'}
        </button>
        <div className="grid grid-cols-3 gap-2">
          {(['+1h', '+1d', '+1w'] as const).map((o) => (
            <button
              key={o}
              onClick={() => onSchedule(o)}
              className="flex items-center justify-center gap-1 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Calendar className="h-3.5 w-3.5" />
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Publish results */}
      {Object.keys(post.publish_results ?? {}).length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">Publish resultaten</h3>
          {Object.entries(post.publish_results).map(([ch, r]) => (
            <div key={ch} className="flex items-start gap-2 text-sm">
              <span className="w-24 text-slate-500">{ch}</span>
              <span className="flex-1">
                {r.error ? (
                  <span className="text-red-600 inline-flex items-start gap-1">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    {r.error}
                  </span>
                ) : (
                  <span className="text-green-600 inline-flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    {r.url || r.post_id || 'gepubliceerd'}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-24 text-slate-500">{label}</span>
      <span className="flex-1 font-medium text-slate-900">{value}</span>
    </div>
  );
}

function paletteFor(score: number, status: string) {
  if (status === 'no_strategy') return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', accent: 'text-slate-500' };
  if (score >= 80) return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-900', accent: 'text-green-600' };
  if (score >= 50) return { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-900', accent: 'text-amber-600' };
  return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900', accent: 'text-red-600' };
}

function AlignmentBanner({
  alignment, expanded, onToggle,
}: { alignment: ReturnType<typeof useStrategyAlignment>; expanded: boolean; onToggle: () => void }) {
  const p = paletteFor(alignment.overallScore, alignment.status);
  const Icon = alignment.status === 'ok' ? CheckCircle2 : alignment.status === 'no_strategy' ? AlertCircle : AlertTriangle;
  const headline =
    alignment.status === 'no_strategy'
      ? 'Geen actieve strategie'
      : alignment.status === 'ok'
      ? `Aligned met strategie · ${alignment.alignedChannels.length}/${alignment.alignedChannels.length + alignment.misalignedChannels.length} kanalen`
      : `Channel-fit: ${alignment.overallScore}/100 · ${alignment.warnings.length} waarschuwing${alignment.warnings.length === 1 ? '' : 'en'}`;

  return (
    <div className={`rounded-xl border ${p.bg} ${p.border} p-4 space-y-3`}>
      <div className={`flex items-center gap-2 font-semibold ${p.text}`}>
        <Icon className={`h-5 w-5 ${p.accent}`} />
        <span className="flex-1 text-sm">{headline}</span>
      </div>

      {alignment.channelScores.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alignment.channelScores.map((cs) => (
            <ChannelChip key={cs.channel} score={cs} />
          ))}
        </div>
      )}

      {alignment.warnings.length > 0 && (
        <button
          onClick={onToggle}
          className={`text-xs font-semibold ${p.accent} hover:underline inline-flex items-center gap-1`}
        >
          <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          {expanded ? 'Verberg details' : `Toon details (${alignment.warnings.length})`}
        </button>
      )}

      {expanded && alignment.warnings.length > 0 && (
        <ul className={`space-y-1 pl-4 text-xs ${p.text}`}>
          {alignment.warnings.map((w, i) => <li key={i}>• {w.message}</li>)}
        </ul>
      )}

      {alignment.status !== 'ok' && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/strategy"
            className={`text-xs font-semibold ${p.accent} rounded-full border ${p.border} px-3 py-1 hover:bg-white/50`}
          >
            {alignment.needsSetup ? 'Strategie instellen →' : 'Strategie aanpassen →'}
          </Link>
          {!alignment.needsSetup && (
            <Link
              href="/personas"
              className={`text-xs font-semibold ${p.accent} rounded-full border ${p.border} px-3 py-1 hover:bg-white/50`}
            >
              Persona&apos;s beheren →
            </Link>
          )}
        </div>
      )}

      <p className="text-[11px] italic text-slate-500">
        Dit is een waarschuwing — je kunt nog steeds publiceren.
      </p>
    </div>
  );
}

function ChannelChip({ score }: { score: ChannelScore }) {
  const p = paletteFor(score.score, 'warning');
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border ${p.border} ${p.bg} px-3 py-1`}>
      <span className={`text-xs font-medium ${p.text}`}>{channelLabel(score.channel)}</span>
      <span className={`text-sm font-bold ${p.accent}`}>{score.score}</span>
    </div>
  );
}
