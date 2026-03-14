// src/pages/PublicationEngine.tsx
// Full-featured Publication Engine — multi-channel content publishing hub

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { usePublicationEngine } from '@/hooks/usePublicationEngine';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Send,
  Loader2,
  Clock,
  CalendarCheck,
  CalendarDays,
  AlertTriangle,
  Sparkles,
  Bot,
  User,
  Users,
  Play,
  Recycle,
  BarChart3,
  History,
  ListTodo,
  Eye,
  MousePointerClick,
  TrendingUp,
  Share2,
  Heart,
  MessageCircle,
  Target,
  Zap,
  CheckCircle2,
  XCircle,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { PublishChannel, PublishStatus } from '@/services/context-marketing/publication-engine.service';

// ─── Channel color mapping ──────────────────────────────────────────

const CHANNEL_COLORS: Record<PublishChannel, string> = {
  linkedin: 'bg-blue-600 text-white',
  facebook: 'bg-blue-500 text-white',
  instagram: 'bg-pink-500 text-white',
  twitter: 'bg-sky-500 text-white',
  email: 'bg-amber-500 text-white',
  blog: 'bg-green-600 text-white',
  tiktok: 'bg-red-500 text-white',
};

const CHANNEL_DOT_COLORS: Record<PublishChannel, string> = {
  linkedin: 'bg-blue-600',
  facebook: 'bg-blue-500',
  instagram: 'bg-pink-500',
  twitter: 'bg-sky-400',
  email: 'bg-amber-500',
  blog: 'bg-green-500',
  tiktok: 'bg-red-500',
};

const CHANNEL_RING_COLORS: Record<PublishChannel, string> = {
  linkedin: 'ring-blue-600/30',
  facebook: 'ring-blue-500/30',
  instagram: 'ring-pink-500/30',
  twitter: 'ring-sky-400/30',
  email: 'ring-amber-500/30',
  blog: 'ring-green-500/30',
  tiktok: 'ring-red-500/30',
};

const STATUS_STYLES: Record<string, { label: Record<string, string>; color: string; icon: React.ReactNode }> = {
  draft: {
    label: { en: 'Draft', nl: 'Concept', fr: 'Brouillon' },
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: <ListTodo className="w-3 h-3" />,
  },
  queued: {
    label: { en: 'Queued', nl: 'In Wachtrij', fr: 'En File' },
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    icon: <Clock className="w-3 h-3" />,
  },
  scheduled: {
    label: { en: 'Scheduled', nl: 'Ingepland', fr: 'Planifié' },
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    icon: <CalendarCheck className="w-3 h-3" />,
  },
  publishing: {
    label: { en: 'Publishing', nl: 'Publiceren...', fr: 'Publication...' },
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 animate-pulse',
    icon: <Radio className="w-3 h-3 animate-pulse" />,
  },
  published: {
    label: { en: 'Published', nl: 'Gepubliceerd', fr: 'Publié' },
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  failed: {
    label: { en: 'Failed', nl: 'Mislukt', fr: 'Échoué' },
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    icon: <XCircle className="w-3 h-3" />,
  },
  recycled: {
    label: { en: 'Recycled', nl: 'Gerecycled', fr: 'Recyclé' },
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    icon: <Recycle className="w-3 h-3" />,
  },
};

const PIE_COLORS = ['#3b82f6', '#2563eb', '#ec4899', '#38bdf8', '#f59e0b', '#22c55e', '#ef4444'];

// ─── Helper: Performance score badge ────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 90
      ? 'bg-emerald-500 text-white'
      : score >= 75
      ? 'bg-green-500 text-white'
      : score >= 60
      ? 'bg-amber-500 text-white'
      : score >= 40
      ? 'bg-orange-500 text-white'
      : 'bg-red-500 text-white';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      <Target className="w-3 h-3" />
      {score}
    </span>
  );
}

// ─── Helper: Format numbers compactly ───────────────────────────────

function fmtNum(n: number): string {
  if (n == null) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ─── StatCard sub-component ───────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  const accentStyles: Record<string, string> = {
    indigo: 'from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-900/10 border-indigo-200/50',
    emerald: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-900/10 border-emerald-200/50',
    purple: 'from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 border-purple-200/50',
    blue: 'from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border-blue-200/50',
    red: 'from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 border-red-200/50',
  };

  return (
    <Card className={`bg-gradient-to-br ${accentStyles[accent] || ''}`}>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ─────────────────────────────────────────────────

export default function PublicationEngine() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { formatCurrency, formatCompact } = useCurrency();

  const {
    queue,
    queueStats,
    channelHealth,
    history,
    recycleCandidates,
    performanceDashboard,
    isLoading,
    error,
    publishNow,
    autoSchedule,
    recycle,
  } = usePublicationEngine();

  const [publishingIds, setPublishingIds] = useState<Set<string>>(new Set());
  const [schedulingIds, setSchedulingIds] = useState<Set<string>>(new Set());
  const [recyclingIds, setRecyclingIds] = useState<Set<string>>(new Set());

  // Group queue items by status
  const groupedQueue = useMemo(() => {
    const groups: Record<string, typeof queue> = { draft: [], queued: [], scheduled: [], publishing: [] };
    queue.forEach((item) => {
      if (groups[item.status]) {
        groups[item.status].push(item);
      }
    });
    return groups;
  }, [queue]);

  // Sort history by published_at descending
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const da = a.published_at ? new Date(a.published_at).getTime() : 0;
      const db = b.published_at ? new Date(b.published_at).getTime() : 0;
      return db - da;
    });
  }, [history]);

  // ─── Handlers ───────────────────────────────────────────────────

  const handlePublishNow = async (id: string, channels: PublishChannel[]) => {
    setPublishingIds((prev) => new Set(prev).add(id));
    try {
      await publishNow(id, channels);
    } finally {
      setPublishingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleAutoSchedule = async (id: string) => {
    setSchedulingIds((prev) => new Set(prev).add(id));
    try {
      await autoSchedule(id);
    } finally {
      setSchedulingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleRecycle = async (id: string) => {
    setRecyclingIds((prev) => new Set(prev).add(id));
    try {
      await recycle(id);
    } finally {
      setRecyclingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // ─── Loading state ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
          <p className="text-sm text-muted-foreground">
            {nl ? 'Publicatie-engine laden...' : fr ? 'Chargement du moteur de publication...' : 'Loading publication engine...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1440px] mx-auto">
      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg">
          <Send className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {nl ? 'Publicatie Engine' : fr ? 'Moteur de Publication' : 'Publication Engine'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {nl
              ? 'Beheer en publiceer content over al je kanalen'
              : fr
              ? 'Gérez et publiez du contenu sur tous vos canaux'
              : 'Manage and publish content across all your channels'}
          </p>
        </div>
        <Badge variant="secondary" className="ml-auto text-sm font-semibold px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
          {queueStats?.total_queued ?? 0} {nl ? 'in wachtrij' : fr ? 'en file' : 'queued'}
        </Badge>
      </div>

      {/* ── Stats Bar ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          icon={<Clock className="w-4 h-4 text-indigo-500" />}
          label={nl ? 'In Wachtrij' : fr ? 'En File' : 'Queued'}
          value={queueStats?.total_queued ?? 0}
          accent="indigo"
        />
        <StatCard
          icon={<Radio className="w-4 h-4 text-emerald-500 animate-pulse" />}
          label={nl ? 'Nu Publiceren' : fr ? 'Publication en Cours' : 'Publishing Now'}
          value={queueStats?.publishing_now ?? 0}
          accent="emerald"
        />
        <StatCard
          icon={<CalendarCheck className="w-4 h-4 text-purple-500" />}
          label={nl ? 'Vandaag Ingepland' : fr ? "Planifié Aujourd'hui" : 'Scheduled Today'}
          value={queueStats?.scheduled_today ?? 0}
          accent="purple"
        />
        <StatCard
          icon={<CalendarDays className="w-4 h-4 text-blue-500" />}
          label={nl ? 'Deze Week' : fr ? 'Cette Semaine' : 'This Week'}
          value={queueStats?.scheduled_this_week ?? 0}
          accent="blue"
        />
        <StatCard
          icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
          label={nl ? 'Mislukt 24u' : fr ? 'Échoué 24h' : 'Failed 24h'}
          value={queueStats?.failed_last_24h ?? 0}
          accent="red"
        />
      </div>

      {/* ── Channel Status Strip ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {channelHealth.map((ch) => (
          <div
            key={ch.channel}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all ring-2 ${
              ch.connected ? CHANNEL_RING_COLORS[ch.channel] : 'ring-gray-200 dark:ring-gray-700 opacity-50'
            } bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${ch.connected ? CHANNEL_DOT_COLORS[ch.channel] : 'bg-gray-400'}`} />
            <span className="text-sm font-medium capitalize">{ch.channel}</span>
            {ch.connected ? (
              <>
                <Wifi className="w-3 h-3 text-green-500" />
                <span className="text-xs text-muted-foreground">{fmtNum(ch.followers)}</span>
                <span className="text-xs font-medium">
                  {ch.health_score >= 90 ? (
                    <span className="text-emerald-600">{ch.health_score}%</span>
                  ) : ch.health_score >= 70 ? (
                    <span className="text-amber-600">{ch.health_score}%</span>
                  ) : (
                    <span className="text-red-600">{ch.health_score}%</span>
                  )}
                </span>
              </>
            ) : (
              <WifiOff className="w-3 h-3 text-gray-400" />
            )}
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="queue" className="gap-1.5">
            <ListTodo className="w-4 h-4" />
            {nl ? 'Wachtrij' : fr ? 'File' : 'Queue'}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="w-4 h-4" />
            {nl ? 'Geschiedenis' : fr ? 'Historique' : 'History'}
          </TabsTrigger>
          <TabsTrigger value="recycle" className="gap-1.5">
            <Recycle className="w-4 h-4" />
            {nl ? 'Recyclen' : fr ? 'Recycler' : 'Recycle'}
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            {nl ? 'Prestaties' : fr ? 'Performance' : 'Performance'}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Queue ───────────────────────────────────────── */}
        <TabsContent value="queue" className="space-y-6">
          {(['draft', 'queued', 'scheduled', 'publishing'] as PublishStatus[]).map((status) => {
            const items = groupedQueue[status] || [];
            if (items.length === 0) return null;
            const style = STATUS_STYLES[status];
            return (
              <div key={status} className="space-y-3">
                <div className="flex items-center gap-2">
                  {style.icon}
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {style.label[lang] || style.label.en}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {items.length}
                  </Badge>
                </div>

                <div className="grid gap-3">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      className="group relative overflow-hidden border-l-4 transition-all hover:shadow-md"
                      style={{
                        borderLeftColor:
                          status === 'draft'
                            ? '#9ca3af'
                            : status === 'queued'
                            ? '#6366f1'
                            : status === 'scheduled'
                            ? '#a855f7'
                            : '#10b981',
                      }}
                    >
                      <CardContent className="py-4 px-5">
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          {/* Title & Meta */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-semibold truncate">{item.title}</h4>
                              <Badge className={`text-[10px] ${style.color}`}>
                                {style.label[lang] || style.label.en}
                              </Badge>
                              {item.auto_scheduled && (
                                <Badge className="text-[10px] bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0 gap-0.5">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  AI
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={`text-[10px] gap-0.5 ${
                                  item.created_by === 'ai_agent'
                                    ? 'border-violet-300 text-violet-600 dark:border-violet-600 dark:text-violet-400'
                                    : 'border-gray-300 text-gray-600 dark:border-gray-600 dark:text-gray-400'
                                }`}
                              >
                                {item.created_by === 'ai_agent' ? <Bot className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                                {item.created_by === 'ai_agent'
                                  ? 'AI Agent'
                                  : nl
                                  ? 'Gebruiker'
                                  : fr
                                  ? 'Utilisateur'
                                  : 'User'}
                              </Badge>
                            </div>

                            {/* Channels */}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {item.channels.map((ch) => (
                                <span
                                  key={ch}
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium capitalize ${CHANNEL_COLORS[ch]}`}
                                >
                                  {ch}
                                </span>
                              ))}
                            </div>

                            {/* Tags */}
                            {item.tags.length > 0 && (
                              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                {item.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-block px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-muted-foreground"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Scheduled time */}
                            {item.scheduled_at && (
                              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                                <CalendarCheck className="w-3 h-3" />
                                <span>
                                  {new Date(item.scheduled_at).toLocaleDateString(
                                    nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-US',
                                    { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                                  )}
                                </span>
                                {item.optimal_time_reason && (
                                  <span className="text-violet-500 italic ml-1">— {item.optimal_time_reason}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {(status === 'draft' || status === 'queued') && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handlePublishNow(item.id, item.channels)}
                                  disabled={publishingIds.has(item.id)}
                                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs gap-1 shadow-sm"
                                >
                                  {publishingIds.has(item.id) ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Play className="w-3 h-3" />
                                  )}
                                  {nl ? 'Publiceer Nu' : fr ? 'Publier' : 'Publish Now'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAutoSchedule(item.id)}
                                  disabled={schedulingIds.has(item.id)}
                                  className="text-xs gap-1 border-violet-300 text-violet-600 hover:bg-violet-50 dark:border-violet-600 dark:text-violet-400 dark:hover:bg-violet-900/20"
                                >
                                  {schedulingIds.has(item.id) ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-3 h-3" />
                                  )}
                                  {nl ? 'Auto-Plan' : fr ? 'Auto-Planifier' : 'Auto-Schedule'}
                                </Button>
                              </>
                            )}
                            {status === 'publishing' && (
                              <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {nl ? 'Bezig met publiceren...' : fr ? 'Publication en cours...' : 'Publishing...'}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {queue.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Send className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{nl ? 'Geen content in de wachtrij' : fr ? 'Aucun contenu en file' : 'No content in queue'}</p>
            </div>
          )}
        </TabsContent>

        {/* ── Tab: History ──────────────────────────────────────── */}
        <TabsContent value="history" className="space-y-3">
          {sortedHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {nl ? 'Nog geen publicaties' : fr ? 'Aucune publication encore' : 'No publications yet'}
              </p>
            </div>
          ) : (
            sortedHistory.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="py-4 px-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Left: Title & meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold truncate">{item.title}</h4>
                        <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                          {nl ? 'Gepubliceerd' : fr ? 'Publié' : 'Published'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {item.channels.map((ch) => (
                          <span
                            key={ch}
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium capitalize ${CHANNEL_COLORS[ch]}`}
                          >
                            {ch}
                          </span>
                        ))}
                        {item.published_at && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {new Date(item.published_at).toLocaleDateString(
                              nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-US',
                              { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Performance metrics */}
                    {item.performance && (
                      <div className="flex items-center gap-4 flex-wrap text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="w-3.5 h-3.5" />
                          <span className="font-medium text-foreground">{fmtNum(item.performance.impressions)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="w-3.5 h-3.5" />
                          <span className="font-medium text-foreground">{fmtNum(item.performance.reach)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span className="font-medium text-foreground">{(item.performance.engagement_rate ?? 0).toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MousePointerClick className="w-3.5 h-3.5" />
                          <span className="font-medium text-foreground">{fmtNum(item.performance.clicks)}</span>
                        </div>
                        <ScoreBadge score={item.performance.performance_score} />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── Tab: Recycle ──────────────────────────────────────── */}
        <TabsContent value="recycle" className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Recycle className="w-5 h-5 text-teal-500" />
            <p className="text-sm text-muted-foreground">
              {nl
                ? 'Top-presterende content opnieuw inzetten met een AI-vernieuwde versie'
                : fr
                ? "Réutilisez le contenu le plus performant avec une version renouvelée par l'IA"
                : 'Repurpose top-performing content with an AI-refreshed version'}
            </p>
          </div>

          {recycleCandidates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Recycle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {nl ? 'Geen recycle-kandidaten gevonden' : fr ? 'Aucun candidat au recyclage' : 'No recycle candidates found'}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recycleCandidates.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden hover:shadow-lg transition-all group border-t-4 border-t-teal-400"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">{item.title}</CardTitle>
                      {item.performance && <ScoreBadge score={item.performance.performance_score} />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Channel badges */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {item.channels.map((ch) => (
                        <span
                          key={ch}
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium capitalize ${CHANNEL_COLORS[ch]}`}
                        >
                          {ch}
                        </span>
                      ))}
                    </div>

                    {/* Mini performance stats */}
                    {item.performance && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Eye className="w-3 h-3" />
                          {fmtNum(item.performance.impressions)} {nl ? 'weergaven' : fr ? 'vues' : 'impressions'}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          {(item.performance.engagement_rate ?? 0).toFixed(1)}% {nl ? 'betrokkenheid' : fr ? 'engagement' : 'engagement'}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Heart className="w-3 h-3" />
                          {fmtNum(item.performance.likes)} likes
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Share2 className="w-3 h-3" />
                          {fmtNum(item.performance.shares)} {nl ? 'shares' : fr ? 'partages' : 'shares'}
                        </div>
                      </div>
                    )}

                    {/* Recycle button */}
                    <Button
                      size="sm"
                      onClick={() => handleRecycle(item.id)}
                      disabled={recyclingIds.has(item.id)}
                      className="w-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white gap-1.5 shadow-sm"
                    >
                      {recyclingIds.has(item.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Recycle className="w-4 h-4" />
                      )}
                      {nl ? 'Recyclen' : fr ? 'Recycler' : 'Recycle'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab: Performance ─────────────────────────────────── */}
        <TabsContent value="performance" className="space-y-6">
          {performanceDashboard ? (
            <>
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50">
                  <CardContent className="pt-5 pb-4">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {nl ? 'Totaal Gepubliceerd' : fr ? 'Total Publié' : 'Total Published'}
                    </p>
                    <p className="text-3xl font-bold mt-1 text-blue-900 dark:text-blue-100">
                      {performanceDashboard.total_published}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200/50">
                  <CardContent className="pt-5 pb-4">
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      {nl ? 'Totaal Bereik' : fr ? 'Portée Totale' : 'Total Reach'}
                    </p>
                    <p className="text-3xl font-bold mt-1 text-purple-900 dark:text-purple-100">
                      {fmtNum(performanceDashboard.total_reach)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200/50">
                  <CardContent className="pt-5 pb-4">
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      {nl ? 'Gem. Betrokkenheid' : fr ? 'Engagement Moy.' : 'Avg Engagement'}
                    </p>
                    <p className="text-3xl font-bold mt-1 text-emerald-900 dark:text-emerald-100">
                      {(performanceDashboard.avg_engagement ?? 0).toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200/50">
                  <CardContent className="pt-5 pb-4">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      {nl ? 'Totale Omzet' : fr ? 'Revenu Total' : 'Total Revenue'}
                    </p>
                    <p className="text-3xl font-bold mt-1 text-amber-900 dark:text-amber-100">
                      {formatCompact(performanceDashboard.total_revenue)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts row */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Weekly Trend Area Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      {nl ? 'Wekelijkse Trend' : fr ? 'Tendance Hebdomadaire' : 'Weekly Trend'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={performanceDashboard.weekly_trend}>
                        <defs>
                          <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#a855f7" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="engGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="reach" orientation="left" tick={{ fontSize: 12 }} tickFormatter={fmtNum} />
                        <YAxis yAxisId="eng" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v: number) => `${v}%`} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, fontSize: 12 }}
                          formatter={(value: number, name: string) =>
                            name === 'reach'
                              ? [fmtNum(value), nl ? 'Bereik' : fr ? 'Portée' : 'Reach']
                              : [`${value}%`, nl ? 'Betrokkenheid' : fr ? 'Engagement' : 'Engagement']
                          }
                        />
                        <Area
                          yAxisId="reach"
                          type="monotone"
                          dataKey="reach"
                          stroke="#a855f7"
                          strokeWidth={2}
                          fill="url(#reachGradient)"
                        />
                        <Area
                          yAxisId="eng"
                          type="monotone"
                          dataKey="engagement"
                          stroke="#6366f1"
                          strokeWidth={2}
                          fill="url(#engGradient)"
                        />
                        <Legend
                          formatter={(value: string) =>
                            value === 'reach'
                              ? nl ? 'Bereik' : fr ? 'Portée' : 'Reach'
                              : nl ? 'Betrokkenheid' : fr ? 'Engagement' : 'Engagement'
                          }
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Channel Breakdown Bar Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      {nl ? 'Kanaal Overzicht' : fr ? 'Répartition par Canal' : 'Channel Breakdown'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={performanceDashboard.channel_breakdown} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="channel" tick={{ fontSize: 12 }} width={80} />
                        <Tooltip
                          contentStyle={{ borderRadius: 8, fontSize: 12 }}
                          formatter={(value: number, name: string) => {
                            if (name === 'engagement') return [`${value}%`, nl ? 'Betrokkenheid' : fr ? 'Engagement' : 'Engagement'];
                            if (name === 'reach') return [fmtNum(value), nl ? 'Bereik' : fr ? 'Portée' : 'Reach'];
                            return [value, name];
                          }}
                        />
                        <Bar dataKey="engagement" fill="#6366f1" radius={[0, 4, 4, 0]} name="engagement" />
                        <Bar dataKey="posts" fill="#a855f7" radius={[0, 4, 4, 0]} name="posts" />
                        <Legend
                          formatter={(value: string) => {
                            if (value === 'engagement') return nl ? 'Betrokkenheid (%)' : fr ? 'Engagement (%)' : 'Engagement (%)';
                            if (value === 'posts') return nl ? 'Berichten' : fr ? 'Publications' : 'Posts';
                            return value;
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue by channel pie chart + top performing */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Revenue Pie Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      {nl ? 'Omzet per Kanaal' : fr ? 'Revenu par Canal' : 'Revenue by Channel'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={performanceDashboard.channel_breakdown}
                          dataKey="revenue"
                          nameKey="channel"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          label={({ channel, revenue }: { channel: string; revenue: number }) => `${channel}: ${formatCompact(revenue)}`}
                          labelLine={false}
                        >
                          {performanceDashboard.channel_breakdown.map((_: any, idx: number) => (
                            <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 8, fontSize: 12 }}
                          formatter={(value: number) => [formatCurrency(value), nl ? 'Omzet' : fr ? 'Revenu' : 'Revenue']}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Top Performing Content */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      {nl ? 'Toppresterend' : fr ? 'Meilleurs Résultats' : 'Top Performing'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {performanceDashboard.top_performing.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        {nl ? 'Geen data beschikbaar' : fr ? 'Aucune donnée disponible' : 'No data available'}
                      </p>
                    ) : (
                      performanceDashboard.top_performing.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium truncate">{item.title}</h5>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                <Eye className="w-3 h-3" />
                                {item.performance ? fmtNum(item.performance.reach) : '-'}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <TrendingUp className="w-3 h-3" />
                                {item.performance ? `${(item.performance.engagement_rate ?? 0).toFixed(1)}%` : '-'}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <MousePointerClick className="w-3 h-3" />
                                {item.performance ? fmtNum(item.performance.clicks) : '-'}
                              </span>
                            </div>
                          </div>
                          {item.performance && <ScoreBadge score={item.performance.performance_score} />}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {nl ? 'Prestatiedata laden...' : fr ? 'Chargement des données de performance...' : 'Loading performance data...'}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
