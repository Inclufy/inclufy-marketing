'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Megaphone, Calendar, Send, AlertCircle, CheckCircle2, Loader2,
  Clock, Pencil, Linkedin, Facebook, Instagram, Music, Twitter,
} from 'lucide-react';
import { useAllPosts } from '@/hooks/useEventPosts';
import type { PostStatus, Channel } from '@/types';

const STATUS_TABS: { label: string; value: PostStatus | undefined }[] = [
  { label: 'Alle',          value: undefined   },
  { label: 'Concept',       value: 'draft'     },
  { label: 'Goedgekeurd',   value: 'approved'  },
  { label: 'Gepland',       value: 'scheduled' },
  { label: 'Gepubliceerd',  value: 'published' },
  { label: 'Mislukt',       value: 'failed'    },
];

const CHANNEL_FILTERS: { value: Channel; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { value: 'linkedin',  label: 'LinkedIn',  icon: Linkedin,  color: '#0A66C2' },
  { value: 'facebook',  label: 'Facebook',  icon: Facebook,  color: '#1877F2' },
  { value: 'instagram', label: 'Instagram', icon: Instagram, color: '#E4405F' },
  { value: 'tiktok',    label: 'TikTok',    icon: Music,     color: '#000'    },
  { value: 'x',         label: 'X',         icon: Twitter,   color: '#000'    },
];

const STATUS_COLOR: Record<PostStatus, string> = {
  draft:      'bg-slate-400',
  approved:   'bg-violet-500',
  scheduled:  'bg-blue-500',
  published:  'bg-emerald-500',
  failed:     'bg-red-500',
  in_review:  'bg-amber-500',
};

const STATUS_ICON: Record<PostStatus, React.ComponentType<{ className?: string }>> = {
  draft:      Pencil,
  approved:   CheckCircle2,
  scheduled:  Calendar,
  published:  Send,
  failed:     AlertCircle,
  in_review:  Clock,
};

const CHANNEL_LABEL: Record<string, string> = {
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  x: 'X',
};

export default function PostsListPage() {
  const [tab, setTab] = useState<PostStatus | undefined>(undefined);
  const [channel, setChannel] = useState<Channel | undefined>(undefined);
  const { data: posts = [], isLoading } = useAllPosts({ status: tab, channel });

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: posts.length };
    for (const p of posts) out[p.status] = (out[p.status] ?? 0) + 1;
    return out;
  }, [posts]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <Megaphone className="h-7 w-7 text-pink-600" />
        <div>
          <h1 className="text-2xl font-bold">Posts</h1>
          <p className="text-sm text-slate-500">
            Alle posts uit captures, events en handmatige creaties — bewerk, plan en publiceer.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {STATUS_TABS.map((t) => {
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

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setChannel(undefined)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            !channel ? 'border-slate-700 bg-slate-700 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          Alle kanalen
        </button>
        {CHANNEL_FILTERS.map((c) => {
          const Icon = c.icon;
          const active = channel === c.value;
          return (
            <button
              key={c.value}
              onClick={() => setChannel(active ? undefined : c.value)}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition"
              style={{
                borderColor: active ? c.color : '#e2e8f0',
                color: active ? c.color : '#475569',
                backgroundColor: active ? c.color + '15' : 'transparent',
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {c.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center text-slate-500">
          <Megaphone className="mx-auto h-10 w-10 text-slate-400" />
          <h3 className="mt-4 text-base font-semibold text-slate-700">Geen posts</h3>
          <p className="mt-1 text-sm">
            Posts ontstaan vanuit captures, events of de Content Library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((p) => {
            const StatusIcon = STATUS_ICON[p.status] ?? Pencil;
            const ChannelIcon = CHANNEL_FILTERS.find((c) => c.value === p.channel)?.icon ?? Megaphone;
            const channelColor = CHANNEL_FILTERS.find((c) => c.value === p.channel)?.color ?? '#64748b';
            return (
              <Link
                key={p.id}
                href={`/posts/${p.id}`}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-pink-300 hover:shadow-md transition"
              >
                <div className="aspect-square bg-slate-100 relative">
                  {p.branded_image_url ? (
                    <Image
                      src={p.branded_image_url}
                      alt={p.text_content?.slice(0, 60) || 'post'}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <ChannelIcon className="h-12 w-12" />
                    </div>
                  )}
                  <div
                    className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold shadow-sm"
                    style={{ color: channelColor }}
                  >
                    <ChannelIcon className="h-3 w-3" />
                    {CHANNEL_LABEL[p.channel] ?? p.channel}
                  </div>
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`inline-flex h-2 w-2 rounded-full ${STATUS_COLOR[p.status]}`} />
                    <StatusIcon className="h-3 w-3 text-slate-500" />
                    <span className="text-slate-500 truncate">{p.status}</span>
                    {p.scheduled_at && p.status === 'scheduled' && (
                      <span className="text-blue-600 truncate">
                        · {new Date(p.scheduled_at).toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-900 line-clamp-3">
                    {p.text_content || '(geen tekst)'}
                  </p>
                  {p.publish_error && (
                    <p className="text-xs text-red-600 line-clamp-2 flex items-start gap-1">
                      <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                      {p.publish_error}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
