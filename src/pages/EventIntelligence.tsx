// src/pages/EventIntelligence.tsx
// Event Intelligence — AI discovers conferences, meetups & calculates ROI

import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useEventIntelligence } from '@/hooks/useEventIntelligence';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  CalendarDays,
  Loader2,
  RefreshCw,
  Search,
  MapPin,
  Users,
  TrendingUp,
  Target,
  CheckCircle2,
  XCircle,
  Star,
  Globe,
  Clock,
  BarChart3,
  AlertTriangle,
  Calendar,
  Ticket,
  Building,
  Sparkles,
  Award,
  Map,
  Mic2,
  Hash,
  ArrowUpRight,
  DollarSign,
  Handshake,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DiscoveredEvent, EventType } from '@/services/context-marketing/event-intelligence.service';

// ─── Helpers ─────────────────────────────────────────────────────────

function getEventTypeBadge(type: EventType): { color: string; label: string; icon: React.ReactNode } {
  switch (type) {
    case 'conference':
      return { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', label: 'Conference', icon: <Mic2 className="h-3 w-3" /> };
    case 'meetup':
      return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Meetup', icon: <Users className="h-3 w-3" /> };
    case 'trade_show':
      return { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: 'Trade Show', icon: <Building className="h-3 w-3" /> };
    case 'webinar':
      return { color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300', label: 'Webinar', icon: <Globe className="h-3 w-3" /> };
    case 'workshop':
      return { color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300', label: 'Workshop', icon: <Target className="h-3 w-3" /> };
    case 'networking':
      return { color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300', label: 'Networking', icon: <Handshake className="h-3 w-3" /> };
    case 'hackathon':
      return { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', label: 'Hackathon', icon: <Sparkles className="h-3 w-3" /> };
  }
}

function getPriorityColor(score: number): string {
  if (score >= 90) return 'bg-red-500 text-white';
  if (score >= 70) return 'bg-orange-500 text-white';
  if (score >= 50) return 'bg-blue-500 text-white';
  return 'bg-gray-400 text-white';
}

function getAudienceMatchColor(match: number): string {
  if (match >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (match >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  if (start === end) return s.toLocaleDateString('en-GB', opts);
  return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${e.toLocaleDateString('en-GB', opts)}`;
}

// chart color palette for event types
const TYPE_CHART_COLORS: Record<string, string> = {
  conference: '#8b5cf6',
  meetup: '#3b82f6',
  trade_show: '#10b981',
  webinar: '#6366f1',
  workshop: '#ec4899',
  networking: '#14b8a6',
  hackathon: '#f97316',
};

// ─── Main Component ──────────────────────────────────────────────────

export default function EventIntelligence() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { formatCurrency, formatCompact } = useCurrency();
  const { toast } = useToast();
  const {
    events,
    metrics,
    isLoading,
    error,
    registerForEvent,
    skipEvent,
    scanForNewEvents,
    refetch,
  } = useEventIntelligence();

  const [activeTab, setActiveTab] = useState('discover');
  const [actioningIds, setActioningIds] = useState<Set<string>>(new Set());
  const [isScanning, setIsScanning] = useState(false);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleRegister = useCallback(async (id: string) => {
    setActioningIds(prev => new Set(prev).add(id));
    try {
      await registerForEvent(id);
      toast({
        title: nl ? 'Geregistreerd!' : fr ? 'Inscrit!' : 'Registered!',
        description: nl ? 'Je bent geregistreerd voor dit event' : fr ? 'Vous etes inscrit a cet evenement' : 'You are registered for this event',
      });
    } catch (err) {
      toast({
        title: nl ? 'Fout' : fr ? 'Erreur' : 'Error',
        description: nl ? 'Kon niet registreren' : fr ? 'Impossible de s\'inscrire' : 'Could not register',
        variant: 'destructive',
      });
    } finally {
      setActioningIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  }, [registerForEvent, toast, nl, fr]);

  const handleSkip = useCallback(async (id: string) => {
    setActioningIds(prev => new Set(prev).add(id));
    try {
      await skipEvent(id);
      toast({
        title: nl ? 'Overgeslagen' : fr ? 'Ignore' : 'Skipped',
        description: nl ? 'Event is overgeslagen' : fr ? 'Evenement ignore' : 'Event skipped',
      });
    } catch (err) {
      toast({
        title: nl ? 'Fout' : fr ? 'Erreur' : 'Error',
        description: nl ? 'Kon niet overslaan' : fr ? 'Impossible d\'ignorer' : 'Could not skip',
        variant: 'destructive',
      });
    } finally {
      setActioningIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  }, [skipEvent, toast, nl, fr]);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    try {
      await scanForNewEvents();
      toast({
        title: nl ? 'Scan voltooid' : fr ? 'Scan termine' : 'Scan complete',
        description: nl ? 'Nieuwe events gevonden en toegevoegd' : fr ? 'Nouveaux evenements trouves' : 'New events found and added',
      });
    } catch (err) {
      toast({
        title: nl ? 'Fout' : fr ? 'Erreur' : 'Error',
        description: nl ? 'Scan mislukt' : fr ? 'Echec du scan' : 'Scan failed',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  }, [scanForNewEvents, toast, nl, fr]);

  // ─── Derived data ──────────────────────────────────────────────

  const registeredEvents = useMemo(
    () => events
      .filter(e => e.status === 'registered' || e.status === 'attending')
      .sort((a, b) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime()),
    [events],
  );

  const eventsByCountry = useMemo(() => {
    const map: Record<string, DiscoveredEvent[]> = {};
    events.forEach(e => {
      if (!map[e.country]) map[e.country] = [];
      map[e.country].push(e);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  const roiChartData = useMemo(() => {
    return events
      .filter(e => e.estimated_roi > 0)
      .sort((a, b) => b.estimated_roi - a.estimated_roi)
      .map(e => ({
        name: e.name.length > 25 ? e.name.substring(0, 22) + '...' : e.name,
        roi: e.estimated_roi,
        cost: e.cost.total,
        leads: e.estimated_leads,
      }));
  }, [events]);

  const typeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({
      name: type.replace('_', ' '),
      value: count,
      fill: TYPE_CHART_COLORS[type] || '#6b7280',
    }));
  }, [events]);

  // ─── Loading State ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-600 mx-auto" />
          <p className="text-sm text-muted-foreground">
            {nl ? 'Event intelligence laden...' : fr ? 'Chargement de l\'intelligence evenementielle...' : 'Loading event intelligence...'}
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
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {nl ? 'Opnieuw proberen' : fr ? 'Reessayer' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Stats ─────────────────────────────────────────────────────

  const stats = [
    {
      label: nl ? 'Events Ontdekt' : fr ? 'Evenements Decouverts' : 'Events Discovered',
      value: metrics?.events_discovered?.toLocaleString() ?? '—',
      icon: <Search className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: nl ? 'Geregistreerd' : fr ? 'Inscrits' : 'Registered',
      value: metrics?.events_registered?.toLocaleString() ?? '—',
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: nl ? 'Leads Gevangen' : fr ? 'Leads Captures' : 'Leads Captured',
      value: metrics?.total_leads_captured?.toLocaleString() ?? '—',
      icon: <Users className="h-5 w-5" />,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: nl ? 'Gem. ROI' : fr ? 'ROI Moyen' : 'Avg ROI',
      value: metrics ? `${metrics.total_roi}%` : '—',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    },
  ];

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-6 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {nl ? 'Event Intelligence' : fr ? 'Intelligence Evenementielle' : 'Event Intelligence'}
              </h1>
              <p className="text-sm text-white/70 mt-0.5">
                {nl
                  ? 'AI ontdekt conferenties, meetups en berekent ROI'
                  : fr
                  ? "L'IA decouvre conferences et calcule le ROI"
                  : 'AI discovers conferences, meetups & calculates ROI'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {metrics && (
              <Badge className="bg-green-500/20 text-green-100 border-green-400/30 px-3 py-1 text-sm">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                {metrics.upcoming_events} {nl ? 'aankomend' : fr ? 'a venir' : 'upcoming'}
              </Badge>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              onClick={handleScan}
              disabled={isScanning}
            >
              {isScanning ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {nl ? 'Scan voor nieuwe events' : fr ? 'Scanner de nouveaux evenements' : 'Scan for new events'}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Stats Bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Tabs ──────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="discover" className="gap-1.5">
            <Search className="h-4 w-4" />
            {nl ? 'Ontdek' : fr ? 'Decouvrir' : 'Discover'}
          </TabsTrigger>
          <TabsTrigger value="registered" className="gap-1.5">
            <Calendar className="h-4 w-4" />
            {nl ? 'Geregistreerd' : fr ? 'Inscrits' : 'Registered'}
          </TabsTrigger>
          <TabsTrigger value="roi" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            ROI Analysis
          </TabsTrigger>
          <TabsTrigger value="map" className="gap-1.5">
            <Map className="h-4 w-4" />
            {nl ? 'Kaart' : fr ? 'Carte' : 'Map'}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB: Discover                                               */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="discover" className="mt-6">
          {events.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center space-y-3">
                <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  {nl ? 'Geen events gevonden' : fr ? 'Aucun evenement trouve' : 'No events found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {events.map((event) => {
                const typeBadge = getEventTypeBadge(event.type);
                const isActioning = actioningIds.has(event.id);
                const isRegistered = event.status === 'registered' || event.status === 'attending';

                return (
                  <Card key={event.id} className="hover:shadow-lg transition-all duration-200 relative overflow-hidden">
                    {/* Priority Score Badge */}
                    <div className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${getPriorityColor(event.priority_score)}`}>
                      {event.priority_score}
                    </div>

                    <CardContent className="p-5">
                      <div className="flex flex-col gap-3 pr-12">
                        {/* Type + Status badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`${typeBadge.color} text-xs flex items-center gap-1`}>
                            {typeBadge.icon}
                            {typeBadge.label}
                          </Badge>
                          {isRegistered && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {nl ? 'Geregistreerd' : fr ? 'Inscrit' : 'Registered'}
                            </Badge>
                          )}
                          {event.tags.includes('must-attend') && (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Must Attend
                            </Badge>
                          )}
                        </div>

                        {/* Name */}
                        <h3 className="font-semibold text-base leading-tight">{event.name}</h3>

                        {/* Date + Location */}
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-cyan-500" />
                            {formatDateRange(event.date_start, event.date_end)}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-pink-500" />
                            {event.city}, {event.country}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-purple-500" />
                            {formatCompact(event.expected_attendees)} {nl ? 'verwacht' : fr ? 'attendus' : 'expected'}
                          </span>
                        </div>

                        {/* Target audience match */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              {nl ? 'Doelgroep Match' : fr ? 'Correspondance Cible' : 'Target Audience Match'}
                            </span>
                            <span className={`font-medium ${getAudienceMatchColor(event.target_audience_match)}`}>
                              {event.target_audience_match}%
                            </span>
                          </div>
                          <Progress value={event.target_audience_match} className="h-2" />
                        </div>

                        {/* Key metrics row */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg bg-muted/50 dark:bg-muted/20 p-2 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase">ROI</p>
                            <p className={`text-sm font-bold ${event.estimated_roi >= 400 ? 'text-emerald-600 dark:text-emerald-400' : 'text-cyan-600 dark:text-cyan-400'}`}>
                              {event.estimated_roi}%
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/50 dark:bg-muted/20 p-2 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase">Networking</p>
                            <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                              {event.networking_value}/100
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/50 dark:bg-muted/20 p-2 text-center">
                            <p className="text-[10px] text-muted-foreground uppercase">
                              {nl ? 'Kosten' : fr ? 'Cout' : 'Cost'}
                            </p>
                            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                              {formatCurrency(event.cost.total)}
                            </p>
                          </div>
                        </div>

                        {/* Topics as tags */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {event.topics.slice(0, 4).map((topic) => (
                            <Badge key={topic} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-muted/60">
                              <Hash className="h-2.5 w-2.5 mr-0.5" />
                              {topic}
                            </Badge>
                          ))}
                          {event.topics.length > 4 && (
                            <span className="text-[10px] text-muted-foreground">+{event.topics.length - 4}</span>
                          )}
                        </div>

                        {/* Speakers */}
                        {event.speakers.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">
                              {nl ? 'Sprekers' : fr ? 'Intervenants' : 'Speakers'}:
                            </span>{' '}
                            {event.speakers.join(', ')}
                          </div>
                        )}

                        {/* Competitors */}
                        {event.competitors_attending.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-muted-foreground font-medium uppercase">
                              {nl ? 'Concurrenten' : fr ? 'Concurrents' : 'Competitors'}:
                            </span>
                            {event.competitors_attending.map((comp) => (
                              <Badge key={comp} variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-red-200 text-red-600 dark:border-red-800 dark:text-red-400">
                                {comp}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* AI Recommendation */}
                        <Card className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20 border-cyan-200 dark:border-cyan-800">
                          <CardContent className="p-3">
                            <p className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              AI {nl ? 'Aanbeveling' : fr ? 'Recommandation' : 'Recommendation'}
                            </p>
                            <p className="text-xs text-muted-foreground italic leading-relaxed">
                              {event.ai_recommendation}
                            </p>
                          </CardContent>
                        </Card>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleRegister(event.id)}
                            disabled={isActioning || isRegistered}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white"
                          >
                            {isActioning ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                            )}
                            {nl ? 'Registreren' : fr ? "S'inscrire" : 'Register'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSkip(event.id)}
                            disabled={isActioning || isRegistered}
                            className="text-muted-foreground hover:text-red-600"
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1.5" />
                            Skip
                          </Button>
                          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                            <Ticket className="h-3 w-3" />
                            {formatCurrency(event.cost.ticket)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB: Registered                                             */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="registered" className="mt-6 space-y-4">
          {registeredEvents.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center space-y-3">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  {nl ? 'Geen geregistreerde events' : fr ? 'Aucun evenement enregistre' : 'No registered events'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 via-blue-500/30 to-transparent" />

              {registeredEvents.map((event) => {
                const typeBadge = getEventTypeBadge(event.type);
                const daysUntil = Math.ceil(
                  (new Date(event.date_start).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                );

                return (
                  <div key={event.id} className="relative mb-6 ml-16">
                    {/* Timeline dot */}
                    <div className="absolute -left-[2.45rem] top-6 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/20">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge variant="outline" className={`${typeBadge.color} text-xs flex items-center gap-1`}>
                                {typeBadge.icon}
                                {typeBadge.label}
                              </Badge>
                              {daysUntil > 0 ? (
                                <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {daysUntil} {nl ? 'dagen' : fr ? 'jours' : 'days'}
                                </Badge>
                              ) : daysUntil === 0 ? (
                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                                  {nl ? 'Vandaag!' : fr ? "Aujourd'hui!" : 'Today!'}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                  {nl ? 'Afgelopen' : fr ? 'Termine' : 'Past'}
                                </Badge>
                              )}
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {nl ? 'Geregistreerd' : fr ? 'Inscrit' : 'Registered'}
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-base">{event.name}</h3>
                            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-cyan-500" />
                                {formatDateRange(event.date_start, event.date_end)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5 text-pink-500" />
                                {event.location}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {formatCompact(event.expected_attendees)} {nl ? 'deelnemers' : fr ? 'participants' : 'attendees'}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(event.cost.total)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">{nl ? 'Geschatte leads' : fr ? 'Leads estimes' : 'Est. leads'}</p>
                            <p className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{event.estimated_leads}</p>
                            <p className="text-xs text-muted-foreground mt-1">ROI: <span className="font-medium text-emerald-600 dark:text-emerald-400">{event.estimated_roi}%</span></p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB: ROI Analysis                                           */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="roi" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart — Events by ROI */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-cyan-500" />
                  {nl ? 'ROI per Event' : fr ? 'ROI par Evenement' : 'ROI by Event'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={roiChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Legend iconType="circle" iconSize={8} />
                    <Bar dataKey="roi" name="ROI %" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="leads" name={nl ? 'Geschatte Leads' : fr ? 'Leads Estimes' : 'Est. Leads'} fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Cost vs ROI */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                  {nl ? 'Kosten vs ROI' : fr ? 'Cout vs ROI' : 'Cost vs ROI'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={roiChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(value: number, name: string) => [
                        name === 'cost' ? formatCurrency(value) : value,
                        name === 'cost' ? (nl ? 'Kosten' : fr ? 'Cout' : 'Cost') : 'ROI %',
                      ]}
                    />
                    <Legend iconType="circle" iconSize={8} />
                    <Bar dataKey="cost" name={nl ? 'Kosten' : fr ? 'Cout' : 'Cost'} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="roi" name="ROI %" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart — Distribution by type */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-purple-500" />
                  {nl ? 'Verdeling per Type' : fr ? 'Distribution par Type' : 'Distribution by Type'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center">
                  <ResponsiveContainer width={280} height={280}>
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={100}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {typeDistribution.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        formatter={(value: number, name: string) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-3">
                    {typeDistribution.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-lg bg-muted/30 px-3 py-2">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                        <div>
                          <p className="text-xs font-medium capitalize">{entry.name}</p>
                          <p className="text-xs text-muted-foreground">{entry.value} events</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed ROI Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                {nl ? 'Gedetailleerde ROI Breakdown' : fr ? 'Analyse ROI Detaillee' : 'Detailed ROI Breakdown'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 dark:bg-muted/10">
                      <th className="text-left p-3 font-medium text-muted-foreground">Event</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">
                        {nl ? 'Kosten' : fr ? 'Cout' : 'Cost'}
                      </th>
                      <th className="text-right p-3 font-medium text-muted-foreground">
                        {nl ? 'Geschatte Leads' : fr ? 'Leads Estimes' : 'Est. Leads'}
                      </th>
                      <th className="text-right p-3 font-medium text-muted-foreground">ROI</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">
                        {nl ? 'Doelgroep' : fr ? 'Cible' : 'Audience'}
                      </th>
                      <th className="text-center p-3 font-medium text-muted-foreground">
                        {nl ? 'Prioriteit' : fr ? 'Priorite' : 'Priority'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {events
                      .sort((a, b) => b.estimated_roi - a.estimated_roi)
                      .map((event) => {
                        const typeBadge = getEventTypeBadge(event.type);
                        return (
                          <tr key={event.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                            <td className="p-3">
                              <div className="font-medium text-sm">{event.name}</div>
                              <div className="text-xs text-muted-foreground">{event.city}, {event.country}</div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className={`${typeBadge.color} text-xs`}>
                                {typeBadge.label}
                              </Badge>
                            </td>
                            <td className="p-3 text-right font-mono text-sm">{formatCurrency(event.cost.total)}</td>
                            <td className="p-3 text-right font-medium">{event.estimated_leads}</td>
                            <td className="p-3 text-right">
                              <span className={`font-bold ${event.estimated_roi >= 400 ? 'text-emerald-600 dark:text-emerald-400' : event.estimated_roi >= 200 ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {event.estimated_roi}%
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <span className={`font-medium ${getAudienceMatchColor(event.target_audience_match)}`}>
                                {event.target_audience_match}%
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className={`inline-flex w-8 h-8 rounded-full items-center justify-center text-xs font-bold ${getPriorityColor(event.priority_score)}`}>
                                {event.priority_score}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB: Map (organized by country)                             */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="map" className="mt-6 space-y-6">
          {eventsByCountry.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center space-y-3">
                <Map className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  {nl ? 'Geen events gevonden' : fr ? 'Aucun evenement trouve' : 'No events found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            eventsByCountry.map(([country, countryEvents]) => (
              <div key={country}>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-5 w-5 text-cyan-500" />
                  <h2 className="text-lg font-semibold">{country}</h2>
                  <Badge variant="secondary" className="text-xs">
                    {countryEvents.length} {countryEvents.length === 1 ? 'event' : 'events'}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-2">
                  {countryEvents
                    .sort((a, b) => b.priority_score - a.priority_score)
                    .map((event) => {
                      const typeBadge = getEventTypeBadge(event.type);
                      const isRegistered = event.status === 'registered' || event.status === 'attending';

                      return (
                        <Card key={event.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <Badge variant="outline" className={`${typeBadge.color} text-xs flex items-center gap-1`}>
                                {typeBadge.icon}
                                {typeBadge.label}
                              </Badge>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${getPriorityColor(event.priority_score)}`}>
                                {event.priority_score}
                              </div>
                            </div>
                            <h4 className="font-medium text-sm mb-1">{event.name}</h4>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.city} — {event.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDateRange(event.date_start, event.date_end)}
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {formatCompact(event.expected_attendees)}
                                </span>
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                  ROI: {event.estimated_roi}%
                                </span>
                              </div>
                            </div>
                            {isRegistered && (
                              <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-[10px]">
                                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                {nl ? 'Geregistreerd' : fr ? 'Inscrit' : 'Registered'}
                              </Badge>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
