'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLibraryPosts } from '@/hooks/useLibraryPosts';
import type { LibraryPostStatus, LibraryLanguage } from '@/types';
import { Library as LibraryIcon, Upload, Calendar, Send, AlertCircle, Loader2, Globe } from 'lucide-react';

const TABS: { label: string; value: LibraryPostStatus | undefined }[] = [
  { label: 'Alle',          value: undefined  },
  { label: 'Concept',       value: 'draft'    },
  { label: 'Gepland',       value: 'scheduled'},
  { label: 'Gepubliceerd',  value: 'published'},
  { label: 'Mislukt',       value: 'failed'   },
];

const LANGS: { label: string; value: LibraryLanguage }[] = [
  { label: 'NL', value: 'nl' },
  { label: 'EN', value: 'en' },
  { label: 'FR', value: 'fr' },
];

const STATUS_COLOR: Record<LibraryPostStatus, string> = {
  draft:      'bg-slate-400',
  scheduled:  'bg-blue-500',
  publishing: 'bg-amber-500',
  published:  'bg-green-500',
  failed:     'bg-red-500',
  archived:   'bg-slate-300',
};

const STATUS_ICON: Record<LibraryPostStatus, React.ComponentType<{ className?: string }>> = {
  draft:      Calendar,
  scheduled:  Calendar,
  publishing: Loader2,
  published:  Send,
  failed:     AlertCircle,
  archived:   Calendar,
};

export default function LibraryPage() {
  const [tab, setTab] = useState<LibraryPostStatus | undefined>(undefined);
  const [language, setLanguage] = useState<LibraryLanguage>('nl');
  const { data: posts, isLoading } = useLibraryPosts(tab ? { status: tab } : undefined);

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: posts?.length ?? 0 };
    for (const p of posts ?? []) out[p.status] = (out[p.status] ?? 0) + 1;
    return out;
  }, [posts]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LibraryIcon className="h-7 w-7 text-pink-600" />
          <div>
            <h1 className="text-2xl font-bold">Content Library</h1>
            <p className="text-sm text-slate-500">Pre-designed product posts klaar om te plannen of publiceren.</p>
          </div>
        </div>
        <Link
          href="/library/import"
          className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
        >
          <Upload className="h-4 w-4" />
          Import ZIP
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => {
          const count = t.value ? counts[t.value] ?? 0 : counts.all;
          const active = tab === t.value;
          return (
            <button
              key={t.label}
              onClick={() => setTab(t.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
                active
                  ? 'border-pink-600 text-pink-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label} <span className="ml-1 opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Language toggle */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-sm text-slate-500">
          <Globe className="h-4 w-4" /> Taal:
        </span>
        {LANGS.map((l) => (
          <button
            key={l.value}
            onClick={() => setLanguage(l.value)}
            className={`px-3 py-1 text-xs font-semibold rounded-full border ${
              language === l.value
                ? 'border-pink-600 bg-pink-50 text-pink-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center">
          <LibraryIcon className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-4 text-base font-semibold text-slate-700">Nog geen posts</h3>
          <p className="mt-1 text-sm text-slate-500">
            Importeer een ZIP-bestand om posts toe te voegen.
          </p>
          <Link
            href="/library/import"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-pink-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"
          >
            <Upload className="h-4 w-4" /> Import ZIP
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((p) => {
            const tr = p.translations[language] ?? p.translations[p.primary_language];
            const StatusIcon = STATUS_ICON[p.status];
            return (
              <Link
                key={p.id}
                href={`/library/${p.id}`}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-pink-300 hover:shadow-md transition"
              >
                <div className="aspect-square bg-slate-100 relative">
                  {tr?.image_url ? (
                    <Image
                      src={tr.image_url}
                      alt={tr.caption?.slice(0, 60) || 'post'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <LibraryIcon className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`inline-flex h-2 w-2 rounded-full ${STATUS_COLOR[p.status]}`} />
                    <StatusIcon className={`h-3 w-3 text-slate-500 ${p.status === 'publishing' ? 'animate-spin' : ''}`} />
                    <span className="text-slate-500 truncate">
                      {p.status}{p.campaign ? ` · ${p.campaign}` : ''}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 line-clamp-2">
                    {tr?.caption || '(geen caption)'}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {p.channels.slice(0, 3).map((ch) => (
                      <span
                        key={ch}
                        className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] text-slate-500"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
