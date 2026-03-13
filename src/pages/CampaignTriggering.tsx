// src/pages/CampaignTriggering.tsx
// Autonomous Campaign Triggering — AI detects signals and auto-starts campaigns

import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCampaignTriggering } from '@/hooks/useCampaignTriggering';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Zap,
  Loader2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Shield,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Activity,
  Clock,
  Rocket,
  Users,
  Target,
  DollarSign,
  Hash,
  Radio,
  Sparkles,
  FileText,
  Crosshair,
  CalendarDays,
  Brain,
  MousePointerClick,
  ArrowUpRight,
  Layers,
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
import type {
  CampaignTrigger,
  TriggeredCampaign,
  TriggerType,
  TriggerStatus,
} from '@/services/context-marketing/campaign-triggering.service';

// ─── Helpers ─────────────────────────────────────────────────────────

const TRIGGER_TYPE_META: Record<TriggerType, { icon: React.ReactNode; label: string; labelNl: string; labelFr: string; color: string }> = {
  trend_detected:        { icon: <TrendingUp className="h-3.5 w-3.5" />,        label: 'Trend Detected',       labelNl: 'Trend Gedetecteerd',   labelFr: 'Tendance Detectee',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  competitor_move:       { icon: <Crosshair className="h-3.5 w-3.5" />,         label: 'Competitor Move',      labelNl: 'Concurrent Actie',     labelFr: 'Mouvement Concurrent', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  audience_signal:       { icon: <Radio className="h-3.5 w-3.5" />,             label: 'Audience Signal',      labelNl: 'Publiek Signaal',      labelFr: 'Signal Audience',      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  performance_threshold: { icon: <BarChart3 className="h-3.5 w-3.5" />,         label: 'Perf. Threshold',      labelNl: 'Prestatie Drempel',    labelFr: 'Seuil Performance',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  seasonal:              { icon: <CalendarDays className="h-3.5 w-3.5" />,      label: 'Seasonal',             labelNl: 'Seizoensgebonden',     labelFr: 'Saisonnier',           color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  event_based:           { icon: <Sparkles className="h-3.5 w-3.5" />,          label: 'Event Based',          labelNl: 'Event Gebaseerd',      labelFr: 'Evenementiel',         color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  lead_behavior:         { icon: <MousePointerClick className="h-3.5 w-3.5" />, label: 'Lead Behavior',        labelNl: 'Lead Gedrag',          labelFr: 'Comportement Lead',    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
};

function getStatusBadge(status: TriggerStatus | TriggeredCampaign['status'], nl: boolean, fr: boolean) {
  switch (status) {
    case 'active':
      return { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700', label: nl ? 'Actief' : fr ? 'Actif' : 'Active', pulse: true };
    case 'paused':
      return { color: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400 border-gray-300 dark:border-gray-700', label: nl ? 'Gepauzeerd' : fr ? 'En Pause' : 'Paused', pulse: false };
    case 'triggered':
      return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700', label: nl ? 'Getriggerd' : fr ? 'Declenche' : 'Triggered', pulse: false };
    case 'completed':
      return { color: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border-slate-300 dark:border-slate-700', label: nl ? 'Voltooid' : fr ? 'Termine' : 'Completed', pulse: false };
    case 'failed':
      return { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700', label: nl ? 'Mislukt' : fr ? 'Echoue' : 'Failed', pulse: false };
    case 'pending_approval':
      return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-400 dark:border-amber-600', label: nl ? 'Wacht op Goedkeuring' : fr ? 'En Attente' : 'Pending Approval', pulse: true };
    case 'launching':
      return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700', label: nl ? 'Lancering' : fr ? 'Lancement' : 'Launching', pulse: true };
    case 'cancelled':
      return { color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700', label: nl ? 'Geannuleerd' : fr ? 'Annule' : 'Cancelled', pulse: false };
    default:
      return { color: 'bg-gray-100 text-gray-600', label: String(status), pulse: false };
  }
}

function formatTimeSince(dateStr: string | undefined, nl: boolean, fr: boolean): string {
  if (!dateStr) return nl ? 'Nooit' : fr ? 'Jamais' : 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ${nl ? 'geleden' : fr ? 'passe' : 'ago'}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${nl ? 'geleden' : fr ? 'passe' : 'ago'}`;
  const days = Math.floor(hours / 24);
  return `${days}d ${nl ? 'geleden' : fr ? 'passe' : 'ago'}`;
}

const AUTO_MANUAL_COLORS = ['#f43f5e', '#6366f1'];

// ─── Main Component ──────────────────────────────────────────────────

export default function CampaignTriggering() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { formatCurrency, formatCompact } = useCurrency();
  const { toast } = useToast();
  const {
    triggers,
    triggeredCampaigns,
    dashboard,
    isLoading,
    error,
    approveCampaign,
    cancelCampaign,
    toggleTrigger,
    refetch,
  } = useCampaignTriggering();

  const [activeTab, setActiveTab] = useState('triggers');
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // ─── Actions ───────────────────────────────────────────────────────

  const handleApprove = useCallback(async (id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await approveCampaign(id);
      toast({ title: nl ? 'Campagne goedgekeurd' : fr ? 'Campagne approuvee' : 'Campaign approved', description: nl ? 'De campagne wordt gelanceerd.' : fr ? 'La campagne sera lancee.' : 'The campaign is being launched.' });
    } catch {
      toast({ title: nl ? 'Fout' : fr ? 'Erreur' : 'Error', description: nl ? 'Kan campagne niet goedkeuren' : fr ? 'Impossible d\'approuver' : 'Failed to approve', variant: 'destructive' });
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }, [approveCampaign, toast, nl, fr]);

  const handleCancel = useCallback(async (id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await cancelCampaign(id);
      toast({ title: nl ? 'Campagne geannuleerd' : fr ? 'Campagne annulee' : 'Campaign cancelled' });
    } catch {
      toast({ title: nl ? 'Fout' : fr ? 'Erreur' : 'Error', variant: 'destructive' });
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }, [cancelCampaign, toast, nl, fr]);

  const handleToggle = useCallback(async (id: string) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      await toggleTrigger(id);
      toast({ title: nl ? 'Trigger bijgewerkt' : fr ? 'Declencheur mis a jour' : 'Trigger updated' });
    } catch {
      toast({ title: nl ? 'Fout' : fr ? 'Erreur' : 'Error', variant: 'destructive' });
    } finally {
      setProcessingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }, [toggleTrigger, toast, nl, fr]);

  // ─── Loading / Error ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-rose-600 mx-auto" />
          <p className="text-sm text-muted-foreground">
            {nl ? 'Campaign triggering data laden...' : fr ? 'Chargement des declencheurs...' : 'Loading campaign triggering data...'}
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
              {nl ? 'Opnieuw proberen' : fr ? 'Reessayer' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Stats ─────────────────────────────────────────────────────────

  const stats = [
    {
      label: nl ? 'Actieve Triggers' : fr ? 'Declencheurs Actifs' : 'Active Triggers',
      value: dashboard?.active_triggers?.toString() ?? '—',
      icon: <Zap className="h-5 w-5" />,
      color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30',
    },
    {
      label: nl ? 'Totaal Getriggerd' : fr ? 'Total Declenches' : 'Total Triggered',
      value: dashboard?.total_triggered?.toLocaleString() ?? '—',
      icon: <Activity className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: nl ? 'Campagnes Gelanceerd' : fr ? 'Campagnes Lancees' : 'Campaigns Launched',
      value: dashboard?.campaigns_launched?.toLocaleString() ?? '—',
      icon: <Rocket className="h-5 w-5" />,
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      label: nl ? 'Omzet' : fr ? 'Revenus' : 'Revenue',
      value: dashboard ? formatCurrency(dashboard.total_revenue) : '—',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: nl ? 'Gem. ROI' : fr ? 'ROI Moyen' : 'Avg ROI',
      value: dashboard ? `${dashboard.avg_roi}%` : '—',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    },
  ];

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-6 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {nl ? 'Autonome Campaign Triggering' : fr ? 'Declenchement Autonome de Campagnes' : 'Autonomous Campaign Triggering'}
              </h1>
              <p className="text-sm text-white/70 mt-0.5">
                {nl ? 'AI detecteert signalen en start automatisch campagnes' : fr ? "L'IA detecte les signaux et lance automatiquement des campagnes" : 'AI detects signals and auto-starts campaigns'}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/20" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* ─── Stats Bar ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

      {/* ─── Tabs ────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="triggers" className="gap-1.5">
            <Zap className="h-4 w-4" />
            {nl ? 'Triggers' : fr ? 'Declencheurs' : 'Triggers'}
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="gap-1.5">
            <Rocket className="h-4 w-4" />
            {nl ? 'Campagnes' : fr ? 'Campagnes' : 'Campaigns'}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-1.5">
            <Clock className="h-4 w-4" />
            {nl ? 'Tijdlijn' : fr ? 'Chronologie' : 'Timeline'}
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {nl ? 'Prestaties' : fr ? 'Performance' : 'Performance'}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Triggers                                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="triggers" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {triggers.map((trigger) => {
              const typeMeta = TRIGGER_TYPE_META[trigger.type];
              const statusBadge = getStatusBadge(trigger.status, nl, fr);
              const isProcessing = processingIds.has(trigger.id);

              return (
                <Card key={trigger.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-rose-500/60">
                  <CardContent className="p-5 space-y-4">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">{trigger.name}</h3>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeMeta.color}`}>
                            {typeMeta.icon}
                            <span className="ml-1">{nl ? typeMeta.labelNl : fr ? typeMeta.labelFr : typeMeta.label}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{trigger.description}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs flex-shrink-0 ${statusBadge.color}`}>
                        {statusBadge.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1.5" />}
                        {statusBadge.label}
                      </Badge>
                    </div>

                    {/* Condition (monospace code block) */}
                    <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
                      <code className="text-xs text-slate-600 dark:text-slate-400 font-mono break-all">{trigger.condition}</code>
                    </div>

                    {/* Channel badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {trigger.channels.map((ch) => (
                        <Badge key={ch} variant="secondary" className="text-[10px] px-1.5 py-0 bg-slate-100 dark:bg-slate-800">
                          {ch}
                        </Badge>
                      ))}
                    </div>

                    {/* Meta row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>{nl ? 'Budget' : fr ? 'Budget' : 'Budget'}: <span className="font-semibold text-foreground">{trigger.budget_limit > 0 ? formatCurrency(trigger.budget_limit) : '—'}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Target className="h-3.5 w-3.5" />
                        <span>{nl ? 'Zekerheid' : fr ? 'Confiance' : 'Confidence'}: <span className="font-semibold text-foreground">{trigger.confidence_threshold}%</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Hash className="h-3.5 w-3.5" />
                        <span>{nl ? 'Getriggerd' : fr ? 'Declenche' : 'Triggered'}: <span className="font-semibold text-foreground">{trigger.times_triggered}x</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        {trigger.requires_approval ? (
                          <Shield className="h-3.5 w-3.5 text-amber-500" />
                        ) : (
                          <Zap className="h-3.5 w-3.5 text-green-500" />
                        )}
                        <span>{trigger.requires_approval ? (nl ? 'Goedkeuring vereist' : fr ? 'Approbation requise' : 'Approval required') : (nl ? 'Automatisch' : fr ? 'Automatique' : 'Automatic')}</span>
                      </div>
                    </div>

                    {/* Performance inline stats */}
                    {trigger.performance.campaigns_launched > 0 && (
                      <div className="flex flex-wrap gap-4 text-xs border-t border-dashed pt-3 text-muted-foreground">
                        <span>{nl ? 'Campagnes' : fr ? 'Campagnes' : 'Campaigns'}: <span className="font-semibold text-foreground">{trigger.performance.campaigns_launched}</span></span>
                        <span>{nl ? 'Bereik' : fr ? 'Portee' : 'Reach'}: <span className="font-semibold text-foreground">{formatCompact(trigger.performance.total_reach)}</span></span>
                        <span>Leads: <span className="font-semibold text-foreground">{trigger.performance.leads_generated}</span></span>
                        <span>{nl ? 'Omzet' : fr ? 'Revenus' : 'Revenue'}: <span className="font-semibold text-foreground">{formatCurrency(trigger.performance.revenue_impact)}</span></span>
                        <span>ROI: <span className="font-semibold text-foreground">{trigger.performance.avg_roi}%</span></span>
                      </div>
                    )}

                    {/* Last triggered + toggle button */}
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {nl ? 'Laatst' : fr ? 'Dernier' : 'Last'}: {formatTimeSince(trigger.last_triggered, nl, fr)}
                      </span>
                      <Button
                        variant={trigger.status === 'active' ? 'outline' : 'default'}
                        size="sm"
                        className="h-8 text-xs"
                        disabled={isProcessing}
                        onClick={() => handleToggle(trigger.id)}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : trigger.status === 'active' ? (
                          <PauseCircle className="h-3.5 w-3.5 mr-1.5" />
                        ) : (
                          <PlayCircle className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {trigger.status === 'active'
                          ? (nl ? 'Pauzeren' : fr ? 'Mettre en Pause' : 'Pause')
                          : (nl ? 'Activeren' : fr ? 'Activer' : 'Activate')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Campaigns                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="campaigns" className="mt-6 space-y-4">
          {triggeredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Rocket className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>{nl ? 'Geen getriggerde campagnes gevonden' : fr ? 'Aucune campagne declenchee' : 'No triggered campaigns found'}</p>
              </CardContent>
            </Card>
          ) : (
            triggeredCampaigns.map((campaign) => {
              const statusBadge = getStatusBadge(campaign.status, nl, fr);
              const isExpanded = expandedCampaignId === campaign.id;
              const isProcessing = processingIds.has(campaign.id);

              return (
                <Card
                  key={campaign.id}
                  className={`transition-all duration-300 hover:shadow-md ${
                    campaign.status === 'pending_approval'
                      ? 'border-amber-400 dark:border-amber-600 ring-1 ring-amber-200 dark:ring-amber-800/40'
                      : ''
                  }`}
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">{campaign.campaign_name}</h3>
                          <Badge variant="outline" className={`text-xs ${statusBadge.color}`}>
                            {statusBadge.pulse && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse mr-1.5" />}
                            {statusBadge.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Zap className="h-3 w-3" />
                          {nl ? 'Trigger' : fr ? 'Declencheur' : 'Trigger'}: {campaign.trigger_name}
                        </p>
                      </div>
                      {campaign.status === 'pending_approval' && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button size="sm" className="h-8 bg-green-600 hover:bg-green-700 text-white text-xs" disabled={isProcessing} onClick={() => handleApprove(campaign.id)}>
                            {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                            {nl ? 'Goedkeuren' : fr ? 'Approuver' : 'Approve'}
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8 text-xs" disabled={isProcessing} onClick={() => handleCancel(campaign.id)}>
                            {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                            {nl ? 'Annuleren' : fr ? 'Annuler' : 'Cancel'}
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Signal highlight */}
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg px-3 py-2">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                        <Radio className="h-3.5 w-3.5" />
                        {nl ? 'Signaal' : fr ? 'Signal' : 'Signal'}: {campaign.signal}
                      </p>
                    </div>

                    {/* Channels + budget */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex flex-wrap gap-1.5">
                        {campaign.channels.map((ch) => (
                          <Badge key={ch} variant="secondary" className="text-[10px] px-1.5 py-0">{ch}</Badge>
                        ))}
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {nl ? 'Budget' : fr ? 'Budget' : 'Budget'}: <span className="text-foreground">{formatCurrency(campaign.budget_allocated)}</span>
                      </span>
                    </div>

                    {/* Performance metrics grid */}
                    {(campaign.performance.impressions > 0 || campaign.status === 'completed') && (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {[
                          { label: 'Impressions', value: formatCompact(campaign.performance.impressions) },
                          { label: 'Clicks', value: formatCompact(campaign.performance.clicks) },
                          { label: 'Leads', value: campaign.performance.leads.toString() },
                          { label: 'Conversions', value: campaign.performance.conversions.toString() },
                          { label: nl ? 'Omzet' : fr ? 'Revenus' : 'Revenue', value: formatCurrency(campaign.performance.revenue) },
                          { label: 'ROI', value: `${campaign.performance.roi}%` },
                        ].map((metric) => (
                          <div key={metric.label} className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{metric.label}</p>
                            <p className="text-sm font-bold">{metric.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expand toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs text-muted-foreground"
                      onClick={() => setExpandedCampaignId(isExpanded ? null : campaign.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 mr-1" /> : <ChevronDown className="h-3.5 w-3.5 mr-1" />}
                      {isExpanded
                        ? (nl ? 'Minder tonen' : fr ? 'Voir moins' : 'Show less')
                        : (nl ? 'AI Redenering & Content' : fr ? 'Raisonnement IA & Contenu' : 'AI Reasoning & Content')}
                    </Button>

                    {/* Expanded: AI Reasoning + Content */}
                    {isExpanded && (
                      <div className="space-y-4 pt-2 border-t">
                        {/* AI Reasoning */}
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800/50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                              {nl ? 'AI Redenering' : fr ? 'Raisonnement IA' : 'AI Reasoning'}
                            </span>
                          </div>
                          <p className="text-sm text-purple-800 dark:text-purple-200 italic leading-relaxed">
                            &ldquo;{campaign.ai_reasoning}&rdquo;
                          </p>
                        </div>

                        {/* Content Generated list */}
                        {campaign.content_generated.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              {nl ? 'Gegenereerde Content' : fr ? 'Contenu Genere' : 'Content Generated'}
                            </h4>
                            <div className="space-y-2">
                              {campaign.content_generated.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                    <div>
                                      <p className="text-xs font-medium">{item.title}</p>
                                      <p className="text-[10px] text-muted-foreground">{item.type}</p>
                                    </div>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${
                                      item.status === 'published' || item.status === 'sent'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                        : item.status === 'ready' || item.status === 'scheduled'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                    }`}
                                  >
                                    {item.status}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Timeline                                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="timeline" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-rose-500" />
                {nl ? 'Trigger & Campagne Tijdlijn' : fr ? 'Chronologie Declencheurs & Campagnes' : 'Trigger & Campaign Timeline'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.trigger_timeline && dashboard.trigger_timeline.length > 0 ? (
                <ResponsiveContainer width="100%" height={360}>
                  <AreaChart data={dashboard.trigger_timeline}>
                    <defs>
                      <linearGradient id="ctTriggerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ctCampaignGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="ctRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="triggers" name={nl ? 'Triggers' : fr ? 'Declencheurs' : 'Triggers'} stroke="#f43f5e" fill="url(#ctTriggerGrad)" strokeWidth={2} />
                    <Area yAxisId="left" type="monotone" dataKey="campaigns" name={nl ? 'Campagnes' : fr ? 'Campagnes' : 'Campaigns'} stroke="#3b82f6" fill="url(#ctCampaignGrad)" strokeWidth={2} />
                    <Area yAxisId="right" type="monotone" dataKey="revenue" name={nl ? 'Omzet' : fr ? 'Revenus' : 'Revenue'} stroke="#10b981" fill="url(#ctRevenueGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[360px] text-muted-foreground text-sm">
                  {nl ? 'Geen tijdlijndata beschikbaar' : fr ? 'Aucune donnee chronologique' : 'No timeline data available'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Performance                                               */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="performance" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Triggers by ROI — BarChart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-500" />
                  {nl ? 'Triggers op ROI' : fr ? 'Declencheurs par ROI' : 'Triggers by ROI'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {triggers.filter(t => t.performance.avg_roi > 0).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={triggers
                        .filter(t => t.performance.avg_roi > 0)
                        .sort((a, b) => b.performance.avg_roi - a.performance.avg_roi)
                        .map(t => ({
                          name: t.name.length > 22 ? t.name.slice(0, 22) + '...' : t.name,
                          roi: t.performance.avg_roi,
                        }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} formatter={(v: number) => [`${v}%`, 'ROI']} />
                      <Bar dataKey="roi" name="ROI %" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    {nl ? 'Geen ROI data' : fr ? 'Aucune donnee ROI' : 'No ROI data'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Auto vs Manual — PieChart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-pink-500" />
                  {nl ? 'Auto vs Handmatig' : fr ? 'Auto vs Manuel' : 'Auto vs Manual'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.auto_vs_manual ? (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: nl ? 'Automatisch' : fr ? 'Automatique' : 'Automatic', value: dashboard.auto_vs_manual.auto },
                            { name: nl ? 'Handmatig' : fr ? 'Manuel' : 'Manual', value: dashboard.auto_vs_manual.manual },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {AUTO_MANUAL_COLORS.map((color, index) => (
                            <Cell key={index} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-6 mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: AUTO_MANUAL_COLORS[0] }} />
                        <span>{nl ? 'Automatisch' : fr ? 'Automatique' : 'Automatic'}: {dashboard.auto_vs_manual.auto}%</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: AUTO_MANUAL_COLORS[1] }} />
                        <span>{nl ? 'Handmatig' : fr ? 'Manuel' : 'Manual'}: {dashboard.auto_vs_manual.manual}%</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    {nl ? 'Geen data' : fr ? 'Aucune donnee' : 'No data'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Campaigns table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                {nl ? 'Best Presterende Campagnes' : fr ? 'Meilleures Campagnes' : 'Top Performing Campaigns'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.top_performing && dashboard.top_performing.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-muted-foreground text-xs">{nl ? 'Campagne' : fr ? 'Campagne' : 'Campaign'}</th>
                        <th className="pb-3 font-medium text-muted-foreground text-xs">{nl ? 'Trigger' : fr ? 'Declencheur' : 'Trigger'}</th>
                        <th className="pb-3 font-medium text-muted-foreground text-xs text-right">Impressions</th>
                        <th className="pb-3 font-medium text-muted-foreground text-xs text-right">Leads</th>
                        <th className="pb-3 font-medium text-muted-foreground text-xs text-right">{nl ? 'Omzet' : fr ? 'Revenus' : 'Revenue'}</th>
                        <th className="pb-3 font-medium text-muted-foreground text-xs text-right">ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dashboard.top_performing.map((c) => (
                        <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-3 font-medium">{c.campaign_name}</td>
                          <td className="py-3 text-muted-foreground text-xs">{c.trigger_name}</td>
                          <td className="py-3 text-right">{formatCompact(c.performance.impressions)}</td>
                          <td className="py-3 text-right">{c.performance.leads}</td>
                          <td className="py-3 text-right font-medium">{formatCurrency(c.performance.revenue)}</td>
                          <td className="py-3 text-right">
                            <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                              {c.performance.roi}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  {nl ? 'Nog geen campagneresultaten' : fr ? 'Pas encore de resultats' : 'No campaign results yet'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
