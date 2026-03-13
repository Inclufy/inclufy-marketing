// src/pages/OpportunityFeed.tsx
// AI Opportunity Feed — Central feed aggregating leads, trends, events & partnerships

import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useOpportunityFeed } from '@/hooks/useOpportunityFeed';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Rss,
  Loader2,
  RefreshCw,
  UserCheck,
  TrendingUp,
  Zap,
  Calendar,
  Handshake,
  Swords,
  FileText,
  DollarSign,
  AlertTriangle,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Target,
  BarChart3,
  ArrowUpRight,
  Bell,
  BellOff,
  Activity,
  Flame,
  PieChart as PieChartIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Users,
  Megaphone,
  CircleDot,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { FeedItem, FeedItemType, FeedItemUrgency } from '@/services/context-marketing/opportunity-feed.service';

// ─── Helpers ────────────────────────────────────────────────────────

function getTypeIcon(type: FeedItemType): React.ReactNode {
  switch (type) {
    case 'lead_signal': return <UserCheck className="h-5 w-5" />;
    case 'trend_alert': return <TrendingUp className="h-5 w-5" />;
    case 'campaign_trigger': return <Zap className="h-5 w-5" />;
    case 'event_opportunity': return <Calendar className="h-5 w-5" />;
    case 'partnership_match': return <Handshake className="h-5 w-5" />;
    case 'competitor_move': return <Swords className="h-5 w-5" />;
    case 'content_opportunity': return <FileText className="h-5 w-5" />;
    case 'budget_optimization': return <DollarSign className="h-5 w-5" />;
    default: return <CircleDot className="h-5 w-5" />;
  }
}

function getTypeColor(type: FeedItemType): { bg: string; text: string; border: string; iconBg: string } {
  switch (type) {
    case 'lead_signal':
      return { bg: 'bg-purple-50 dark:bg-purple-950/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800', iconBg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400' };
    case 'trend_alert':
      return { bg: 'bg-pink-50 dark:bg-pink-950/20', text: 'text-pink-700 dark:text-pink-300', border: 'border-pink-200 dark:border-pink-800', iconBg: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400' };
    case 'campaign_trigger':
      return { bg: 'bg-blue-50 dark:bg-blue-950/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' };
    case 'event_opportunity':
      return { bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' };
    case 'partnership_match':
      return { bg: 'bg-teal-50 dark:bg-teal-950/20', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800', iconBg: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400' };
    case 'competitor_move':
      return { bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' };
    case 'content_opportunity':
      return { bg: 'bg-cyan-50 dark:bg-cyan-950/20', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800', iconBg: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400' };
    case 'budget_optimization':
      return { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800', iconBg: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' };
    default:
      return { bg: 'bg-gray-50 dark:bg-gray-950/20', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-200 dark:border-gray-800', iconBg: 'bg-gray-100 dark:bg-gray-900/40 text-gray-600 dark:text-gray-400' };
  }
}

function getTypeLabel(type: FeedItemType, nl: boolean, fr: boolean): string {
  const labels: Record<FeedItemType, { en: string; nl: string; fr: string }> = {
    lead_signal: { en: 'Lead Signal', nl: 'Lead Signaal', fr: 'Signal Lead' },
    trend_alert: { en: 'Trend Alert', nl: 'Trend Alert', fr: 'Alerte Tendance' },
    campaign_trigger: { en: 'Campaign Trigger', nl: 'Campagne Trigger', fr: 'D\u00e9clencheur Campagne' },
    event_opportunity: { en: 'Event Opportunity', nl: 'Event Kans', fr: '\u00c9v\u00e9nement' },
    partnership_match: { en: 'Partnership Match', nl: 'Partnership Match', fr: 'Partenariat' },
    competitor_move: { en: 'Competitor Move', nl: 'Concurrentie', fr: 'Mouvement Concurrent' },
    content_opportunity: { en: 'Content Opportunity', nl: 'Content Kans', fr: 'Opportunit\u00e9 Contenu' },
    budget_optimization: { en: 'Budget Optimization', nl: 'Budget Optimalisatie', fr: 'Optimisation Budget' },
  };
  const l = labels[type];
  return nl ? l.nl : fr ? l.fr : l.en;
}

function getUrgencyBadge(urgency: FeedItemUrgency, nl: boolean, fr: boolean): { color: string; label: string; pulse: boolean } {
  switch (urgency) {
    case 'immediate':
      return {
        color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-700',
        label: nl ? 'Direct' : fr ? 'Imm\u00e9diat' : 'Immediate',
        pulse: true,
      };
    case 'today':
      return {
        color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700',
        label: nl ? 'Vandaag' : fr ? "Aujourd'hui" : 'Today',
        pulse: false,
      };
    case 'this_week':
      return {
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700',
        label: nl ? 'Deze Week' : fr ? 'Cette Semaine' : 'This Week',
        pulse: false,
      };
    case 'this_month':
      return {
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300 border-gray-300 dark:border-gray-700',
        label: nl ? 'Deze Maand' : fr ? 'Ce Mois' : 'This Month',
        pulse: false,
      };
    default:
      return { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300', label: urgency, pulse: false };
  }
}

function formatRelativeTime(iso: string, nl: boolean, fr: boolean): string {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return nl ? 'Zojuist' : fr ? "\u00c0 l'instant" : 'Just now';
  if (diffMins < 60) return nl ? `${diffMins} min geleden` : fr ? `Il y a ${diffMins} min` : `${diffMins}m ago`;
  if (diffHours < 24) return nl ? `${diffHours} uur geleden` : fr ? `Il y a ${diffHours}h` : `${diffHours}h ago`;
  if (diffDays < 7) return nl ? `${diffDays} dagen geleden` : fr ? `Il y a ${diffDays} jours` : `${diffDays}d ago`;
  return d.toLocaleDateString();
}

// ─── Main Component ─────────────────────────────────────────────────

export default function OpportunityFeed() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { formatCurrency, formatCompact } = useCurrency();
  const { toast } = useToast();
  const {
    feedItems,
    stats,
    isLoading,
    error,
    markAsRead,
    actionItem,
    dismissItem,
    refetch,
  } = useOpportunityFeed();

  const [activeTab, setActiveTab] = useState('feed');
  const [urgencyFilter, setUrgencyFilter] = useState<FeedItemUrgency | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<FeedItemType | 'all'>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // ─── Action handlers ──────────────────────────────────────────────

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await markAsRead(id);
    } catch {
      toast({ title: nl ? 'Fout' : fr ? 'Erreur' : 'Error', variant: 'destructive' });
    }
  }, [markAsRead, toast, nl, fr]);

  const handleAction = useCallback(async (id: string, label: string) => {
    setActionLoadingId(id);
    try {
      await actionItem(id);
      toast({
        title: nl ? 'Actie uitgevoerd' : fr ? 'Action ex\u00e9cut\u00e9e' : 'Action taken',
        description: label,
      });
      refetch();
    } catch {
      toast({ title: nl ? 'Fout' : fr ? 'Erreur' : 'Error', description: nl ? 'Actie mislukt' : fr ? "\u00c9chec de l'action" : 'Action failed', variant: 'destructive' });
    } finally {
      setActionLoadingId(null);
    }
  }, [actionItem, refetch, toast, nl, fr]);

  const handleDismiss = useCallback(async (id: string) => {
    setActionLoadingId(`dismiss-${id}`);
    try {
      await dismissItem(id);
      toast({
        title: nl ? 'Item verwijderd' : fr ? '\u00c9l\u00e9ment ignor\u00e9' : 'Item dismissed',
      });
    } catch {
      toast({ title: nl ? 'Fout' : fr ? 'Erreur' : 'Error', variant: 'destructive' });
    } finally {
      setActionLoadingId(null);
    }
  }, [dismissItem, toast, nl, fr]);

  // ─── Filtered items ───────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    let items = [...feedItems];
    if (urgencyFilter !== 'all') {
      items = items.filter(i => i.urgency === urgencyFilter);
    }
    if (typeFilter !== 'all') {
      items = items.filter(i => i.type === typeFilter);
    }
    return items;
  }, [feedItems, urgencyFilter, typeFilter]);

  // ─── Type options for filter ──────────────────────────────────────

  const typeOptions: FeedItemType[] = [
    'lead_signal', 'trend_alert', 'campaign_trigger', 'event_opportunity',
    'partnership_match', 'competitor_move', 'content_opportunity', 'budget_optimization',
  ];

  // ─── Loading State ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-amber-600 mx-auto" />
          <p className="text-sm text-muted-foreground">
            {nl ? 'Opportunity feed laden...' : fr ? 'Chargement du flux...' : 'Loading opportunity feed...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {nl ? 'Opnieuw proberen' : fr ? 'R\u00e9essayer' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Stats ────────────────────────────────────────────────────────

  const statCards = [
    {
      label: nl ? 'Totale Items' : fr ? 'Total Items' : 'Total Items',
      value: stats?.total_items?.toLocaleString() ?? '\u2014',
      icon: <Rss className="h-5 w-5" />,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: nl ? 'Ongelezen' : fr ? 'Non lus' : 'Unread',
      value: stats?.unread?.toLocaleString() ?? '\u2014',
      icon: <Bell className="h-5 w-5" />,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
      badge: stats && stats.unread > 0 ? stats.unread : null,
    },
    {
      label: nl ? 'Directe Acties' : fr ? 'Actions Imm\u00e9diates' : 'Immediate Actions',
      value: stats?.immediate_actions?.toLocaleString() ?? '\u2014',
      icon: <Flame className="h-5 w-5" />,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    },
    {
      label: nl ? 'Potenti\u00eble Waarde' : fr ? 'Valeur Potentielle' : 'Potential Value',
      value: stats ? formatCurrency(stats.total_potential_value) : '\u2014',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 p-6 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <Rss className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {nl ? 'AI Opportunity Feed' : fr ? "Flux d'Opportunit\u00e9s IA" : 'AI Opportunity Feed'}
              </h1>
              <p className="text-sm text-white/70 mt-0.5">
                {nl
                  ? 'Centraal overzicht van alle kansen: leads, trends, events en partnerships'
                  : fr
                  ? 'Vue centrale de toutes les opportunit\u00e9s'
                  : 'Central feed aggregating leads, trends, events & partnerships'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats && (
              <Badge className="bg-white/20 text-white border-white/30 px-3 py-1 text-sm">
                <Activity className="h-3.5 w-3.5 mr-1.5" />
                {nl ? 'Actieratio' : fr ? "Taux d'action" : 'Action Rate'}: {stats.action_rate}%
              </Badge>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              onClick={refetch}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Stats Bar ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow relative">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
              {'badge' in stat && stat.badge && (
                <span className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                  {stat.badge > 99 ? '99+' : stat.badge}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="feed" className="gap-1.5">
            <Rss className="h-4 w-4" />
            {nl ? 'Feed' : fr ? 'Flux' : 'Feed'}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {nl ? 'Analyse' : fr ? 'Analytiques' : 'Analytics'}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Feed                                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="feed" className="mt-6 space-y-4">
          {/* Filter bar */}
          <div className="space-y-3">
            {/* Urgency filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground mr-1">
                {nl ? 'Urgentie:' : fr ? 'Urgence:' : 'Urgency:'}
              </span>
              {(['all', 'immediate', 'today', 'this_week', 'this_month'] as const).map((u) => {
                const label = u === 'all'
                  ? (nl ? 'Alle' : fr ? 'Tous' : 'All')
                  : getUrgencyBadge(u as FeedItemUrgency, nl, fr).label;
                return (
                  <Button
                    key={u}
                    variant={urgencyFilter === u ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUrgencyFilter(u)}
                    className="text-xs h-7"
                  >
                    {u === 'immediate' && urgencyFilter !== u && <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5 animate-pulse" />}
                    {label}
                  </Button>
                );
              })}
            </div>

            {/* Type filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground mr-1">
                {nl ? 'Type:' : fr ? 'Type:' : 'Type:'}
              </span>
              <Button
                variant={typeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter('all')}
                className="text-xs h-7"
              >
                {nl ? 'Alle' : fr ? 'Tous' : 'All'}
              </Button>
              {typeOptions.map((t) => (
                <Button
                  key={t}
                  variant={typeFilter === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTypeFilter(t)}
                  className="text-xs h-7 gap-1"
                >
                  {getTypeLabel(t, nl, fr)}
                </Button>
              ))}
            </div>
          </div>

          {/* Feed timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />

            <div className="space-y-4">
              {filteredItems.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BellOff className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {nl ? 'Geen items gevonden' : fr ? 'Aucun \u00e9l\u00e9ment trouv\u00e9' : 'No items found'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredItems.map((item) => {
                  const typeColors = getTypeColor(item.type);
                  const urgencyBadge = getUrgencyBadge(item.urgency, nl, fr);
                  const isExpanded = expandedItemId === item.id;
                  const isUnread = !item.is_read;

                  return (
                    <div key={item.id} className="relative md:pl-14">
                      {/* Timeline dot */}
                      <div className="absolute left-4 top-5 w-5 h-5 rounded-full border-2 border-background bg-background hidden md:flex items-center justify-center z-10">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            item.urgency === 'immediate' ? 'bg-red-500 animate-pulse'
                              : item.urgency === 'today' ? 'bg-orange-500'
                              : item.urgency === 'this_week' ? 'bg-blue-500'
                              : 'bg-gray-400'
                          }`}
                        />
                      </div>

                      <Card
                        className={`transition-all duration-200 hover:shadow-lg cursor-pointer ${
                          isUnread
                            ? 'border-l-4 border-l-purple-500 bg-purple-50/30 dark:bg-purple-950/10'
                            : item.is_actioned
                            ? 'border-l-4 border-l-green-500 opacity-75'
                            : ''
                        }`}
                        onClick={() => {
                          setExpandedItemId(isExpanded ? null : item.id);
                          if (isUnread) handleMarkAsRead(item.id);
                        }}
                      >
                        <CardContent className="p-5">
                          {/* Top row */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {/* Type icon */}
                              <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${typeColors.iconBg}`}>
                                {getTypeIcon(item.type)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <Badge className={`${typeColors.text} ${typeColors.bg} text-xs border ${typeColors.border}`}>
                                    {getTypeLabel(item.type, nl, fr)}
                                  </Badge>
                                  <Badge className={`${urgencyBadge.color} text-xs border`}>
                                    {urgencyBadge.pulse && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-ping" />}
                                    {urgencyBadge.label}
                                  </Badge>
                                  {isUnread && (
                                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                                  )}
                                  {item.is_actioned && (
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      {nl ? 'Uitgevoerd' : fr ? 'Effectu\u00e9' : 'Actioned'}
                                    </Badge>
                                  )}
                                </div>

                                <h3 className={`text-sm leading-snug ${isUnread ? 'font-bold' : 'font-medium'}`}>
                                  {item.title}
                                </h3>

                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {item.description}
                                </p>

                                {/* Inline metrics */}
                                <div className="flex items-center gap-3 mt-2 flex-wrap">
                                  {item.confidence > 0 && (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                      <Target className="h-3 w-3" />
                                      {item.confidence}%
                                    </span>
                                  )}
                                  {item.estimated_value > 0 && (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                                      <DollarSign className="h-3 w-3" />
                                      {formatCurrency(item.estimated_value)}
                                    </span>
                                  )}
                                  {item.impact_metrics.reach && (
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                      <Megaphone className="h-3 w-3" />
                                      {formatCompact(item.impact_metrics.reach)} {nl ? 'bereik' : fr ? 'port\u00e9e' : 'reach'}
                                    </span>
                                  )}
                                  {item.impact_metrics.leads && (
                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                      <Users className="h-3 w-3" />
                                      {item.impact_metrics.leads} leads
                                    </span>
                                  )}
                                  {item.impact_metrics.roi && (
                                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                                      <ArrowUpRight className="h-3 w-3" />
                                      {item.impact_metrics.roi}% ROI
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right column */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(item.timestamp, nl, fr)}
                              </span>
                              <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                {item.source}
                              </span>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>

                          {/* Tags */}
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {item.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-400"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Expanded section */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-border space-y-4">
                              {/* Full description */}
                              <p className="text-sm text-foreground">{item.description}</p>

                              {/* Related entities */}
                              {item.related_entities.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {nl ? 'Gerelateerde entiteiten' : fr ? 'Entit\u00e9s li\u00e9es' : 'Related Entities'}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {item.related_entities.map((entity, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs gap-1">
                                        {entity.type === 'lead' && <UserCheck className="h-3 w-3" />}
                                        {entity.type === 'company' && <Users className="h-3 w-3" />}
                                        {entity.type === 'event' && <Calendar className="h-3 w-3" />}
                                        {entity.type === 'competitor' && <Swords className="h-3 w-3" />}
                                        {entity.type === 'partner' && <Handshake className="h-3 w-3" />}
                                        {entity.type === 'campaign' && <Megaphone className="h-3 w-3" />}
                                        {entity.type === 'opportunity' && <Sparkles className="h-3 w-3" />}
                                        {entity.type === 'webinar' && <Calendar className="h-3 w-3" />}
                                        {entity.name}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Impact metrics expanded */}
                              {(item.impact_metrics.reach || item.impact_metrics.leads || item.impact_metrics.revenue || item.impact_metrics.roi) && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {item.impact_metrics.reach && (
                                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                                      <p className="text-xs text-muted-foreground">{nl ? 'Bereik' : fr ? 'Port\u00e9e' : 'Reach'}</p>
                                      <p className="text-lg font-bold">{formatCompact(item.impact_metrics.reach)}</p>
                                    </div>
                                  )}
                                  {item.impact_metrics.leads && (
                                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                                      <p className="text-xs text-muted-foreground">Leads</p>
                                      <p className="text-lg font-bold">{item.impact_metrics.leads}</p>
                                    </div>
                                  )}
                                  {item.impact_metrics.revenue && (
                                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                                      <p className="text-xs text-muted-foreground">{nl ? 'Omzet' : fr ? 'Revenus' : 'Revenue'}</p>
                                      <p className="text-lg font-bold">{formatCurrency(item.impact_metrics.revenue)}</p>
                                    </div>
                                  )}
                                  {item.impact_metrics.roi && (
                                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                                      <p className="text-xs text-muted-foreground">ROI</p>
                                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{item.impact_metrics.roi}%</p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Action buttons */}
                              <div className="flex flex-wrap gap-2 pt-2">
                                {!item.is_actioned && (
                                  <Button
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAction(item.id, item.suggested_action.label);
                                    }}
                                    disabled={actionLoadingId === item.id}
                                    className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                                  >
                                    {actionLoadingId === item.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-3.5 w-3.5" />
                                    )}
                                    {item.suggested_action.label}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDismiss(item.id);
                                  }}
                                  disabled={actionLoadingId === `dismiss-${item.id}`}
                                  className="gap-1.5 text-muted-foreground"
                                >
                                  {actionLoadingId === `dismiss-${item.id}` ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5" />
                                  )}
                                  {nl ? 'Negeren' : fr ? 'Ignorer' : 'Dismiss'}
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Analytics                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          {/* Action rate & actioned today stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{nl ? 'Actieratio' : fr ? "Taux d'action" : 'Action Rate'}</p>
                    <p className="text-2xl font-bold">{stats?.action_rate ?? 0}%</p>
                  </div>
                </div>
                <Progress value={stats?.action_rate ?? 0} className="h-2" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{nl ? 'Vandaag Uitgevoerd' : fr ? "Actions Aujourd'hui" : 'Actioned Today'}</p>
                    <p className="text-2xl font-bold">{stats?.items_actioned_today ?? 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{nl ? 'Totale Waarde' : fr ? 'Valeur Totale' : 'Total Value'}</p>
                    <p className="text-2xl font-bold">{stats ? formatCurrency(stats.total_potential_value) : '\u2014'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Type — Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-amber-500" />
                  {nl ? 'Verdeling per Type' : fr ? 'Distribution par Type' : 'Distribution by Type'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.by_type && stats.by_type.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={stats.by_type.map(t => ({
                          name: getTypeLabel(t.type, nl, fr),
                          value: t.count,
                          color: t.color,
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {stats.by_type.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        formatter={(value: number, name: string) => [value, name]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
                    {nl ? 'Geen data beschikbaar' : fr ? 'Aucune donn\u00e9e disponible' : 'No data available'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Feed — Area Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-orange-500" />
                  {nl ? 'Dagelijkse Feed Activiteit' : fr ? 'Activit\u00e9 Quotidienne' : 'Daily Feed Activity'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.daily_feed && stats.daily_feed.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={stats.daily_feed}>
                      <defs>
                        <linearGradient id="feedItemsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="feedActionedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        labelFormatter={(v: string) => new Date(v).toLocaleDateString()}
                        formatter={(value: number, name: string) => {
                          if (name === 'value') return [formatCurrency(value), nl ? 'Waarde' : fr ? 'Valeur' : 'Value'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="items"
                        name={nl ? 'Items' : fr ? '\u00c9l\u00e9ments' : 'Items'}
                        stroke="#f59e0b"
                        fill="url(#feedItemsGrad)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="actioned"
                        name={nl ? 'Uitgevoerd' : fr ? 'Effectu\u00e9s' : 'Actioned'}
                        stroke="#10b981"
                        fill="url(#feedActionedGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
                    {nl ? 'Geen data beschikbaar' : fr ? 'Aucune donn\u00e9e disponible' : 'No data available'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Type breakdown table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                {nl ? 'Opportunity Types Overzicht' : fr ? 'Aper\u00e7u des Types' : 'Opportunity Types Breakdown'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.by_type?.map((entry) => {
                  const total = stats.by_type.reduce((s, e) => s + e.count, 0);
                  const pct = total > 0 ? ((entry.count / total) * 100) : 0;
                  const colors = getTypeColor(entry.type);
                  return (
                    <div key={entry.type} className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${colors.iconBg}`}>
                        {getTypeIcon(entry.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{getTypeLabel(entry.type, nl, fr)}</span>
                          <span className="text-sm font-bold">{entry.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: entry.color }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
