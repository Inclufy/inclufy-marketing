// src/pages/LeadIntelligence.tsx
// Lead Intelligence Engine — AI analyzes intent signals, website behavior & predicts best follow-up

import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLeadIntelligence } from '@/hooks/useLeadIntelligence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Eye,
  Loader2,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Users,
  Activity,
  BarChart3,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Target,
  Sparkles,
  Brain,
  Globe,
  Clock,
  Building2,
  UserCheck,
  Zap,
  Radio,
  Hash,
  ArrowUpRight,
  Phone,
  Mail,
  MousePointerClick,
  FileText,
  MessageSquare,
  CalendarDays,
  Crosshair,
  Download,
  Megaphone,
  Search,
  Signal,
  Linkedin,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type {
  LeadIntelligenceProfile,
  IntentSignal,
  IntentLevel,
  SignalType,
} from '@/services/context-marketing/lead-intelligence.service';

// ─── Helpers ─────────────────────────────────────────────────────────

const INTENT_LEVEL_META: Record<IntentLevel, { label: string; labelNl: string; labelFr: string; color: string; borderColor: string; dotColor: string }> = {
  very_high: { label: 'Very High', labelNl: 'Zeer Hoog', labelFr: 'Tres Eleve', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', borderColor: 'border-l-purple-500', dotColor: '#8b5cf6' },
  high:      { label: 'High',      labelNl: 'Hoog',      labelFr: 'Eleve',       color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',       borderColor: 'border-l-blue-500',   dotColor: '#3b82f6' },
  medium:    { label: 'Medium',    labelNl: 'Gemiddeld',  labelFr: 'Moyen',       color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',   borderColor: 'border-l-green-500',  dotColor: '#10b981' },
  low:       { label: 'Low',       labelNl: 'Laag',       labelFr: 'Faible',      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',   borderColor: 'border-l-amber-500',  dotColor: '#f59e0b' },
  cold:      { label: 'Cold',      labelNl: 'Koud',       labelFr: 'Froid',       color: 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400',       borderColor: 'border-l-gray-400',   dotColor: '#6b7280' },
};

const BUYING_STAGE_META: Record<string, { label: string; labelNl: string; labelFr: string; color: string }> = {
  awareness:     { label: 'Awareness',     labelNl: 'Bewustzijn',  labelFr: 'Sensibilisation', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  consideration: { label: 'Consideration', labelNl: 'Overweging',  labelFr: 'Consideration',   color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  decision:      { label: 'Decision',      labelNl: 'Beslissing',  labelFr: 'Decision',        color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  purchase:      { label: 'Purchase',      labelNl: 'Aankoop',     labelFr: 'Achat',           color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
};

const SIGNAL_TYPE_META: Record<SignalType, { icon: React.ReactNode; label: string; color: string }> = {
  pricing_view:         { icon: <DollarSign className="h-3.5 w-3.5" />,       label: 'Pricing View',       color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  api_docs:             { icon: <FileText className="h-3.5 w-3.5" />,         label: 'API Docs',           color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  demo_request:         { icon: <Target className="h-3.5 w-3.5" />,           label: 'Demo Request',       color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  content_download:     { icon: <Download className="h-3.5 w-3.5" />,         label: 'Content Download',   color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  page_view:            { icon: <Globe className="h-3.5 w-3.5" />,            label: 'Page View',          color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  email_engagement:     { icon: <Mail className="h-3.5 w-3.5" />,             label: 'Email Engagement',   color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  social_interaction:   { icon: <Linkedin className="h-3.5 w-3.5" />,         label: 'Social Interaction', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  event_attendance:     { icon: <CalendarDays className="h-3.5 w-3.5" />,     label: 'Event Attendance',   color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  form_submission:      { icon: <FileText className="h-3.5 w-3.5" />,         label: 'Form Submission',    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  competitor_comparison:{ icon: <Crosshair className="h-3.5 w-3.5" />,        label: 'Competitor Compare', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

function formatTimeSince(dateStr: string, nl: boolean, fr: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ${nl ? 'geleden' : fr ? 'passe' : 'ago'}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${nl ? 'geleden' : fr ? 'passe' : 'ago'}`;
  const days = Math.floor(hours / 24);
  return `${days}d ${nl ? 'geleden' : fr ? 'passe' : 'ago'}`;
}

function getHeatmapColor(count: number): string {
  if (count >= 80) return 'bg-purple-600 dark:bg-purple-500';
  if (count >= 60) return 'bg-purple-400 dark:bg-purple-400';
  if (count >= 40) return 'bg-purple-300 dark:bg-purple-600/60';
  if (count >= 20) return 'bg-purple-200 dark:bg-purple-700/40';
  return 'bg-purple-100 dark:bg-purple-900/30';
}

// ─── Main Component ──────────────────────────────────────────────────

export default function LeadIntelligence() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { formatCurrency, formatCompact } = useCurrency();
  const { toast } = useToast();
  const {
    dashboard,
    topLeads,
    recentSignals,
    isLoading,
    error,
    predictBestAction,
    refetch,
  } = useLeadIntelligence();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [predictingIds, setPredictingIds] = useState<Set<string>>(new Set());

  // ─── Actions ───────────────────────────────────────────────────────

  const handlePredict = useCallback(async (leadId: string) => {
    setPredictingIds(prev => new Set(prev).add(leadId));
    try {
      const result = await predictBestAction(leadId);
      if (result) {
        toast({
          title: nl ? 'Voorspelling gereed' : fr ? 'Prediction prete' : 'Prediction ready',
          description: `${result.action} via ${result.channel} (${result.confidence}% ${nl ? 'zekerheid' : fr ? 'confiance' : 'confidence'})`,
        });
      }
    } catch {
      toast({ title: nl ? 'Fout' : fr ? 'Erreur' : 'Error', variant: 'destructive' });
    } finally {
      setPredictingIds(prev => { const s = new Set(prev); s.delete(leadId); return s; });
    }
  }, [predictBestAction, toast, nl, fr]);

  // ─── Loading / Error ───────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600 mx-auto" />
          <p className="text-sm text-muted-foreground">
            {nl ? 'Lead intelligence data laden...' : fr ? 'Chargement de l\'intelligence des leads...' : 'Loading lead intelligence data...'}
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
      label: nl ? 'Totaal Gevolgd' : fr ? 'Total Suivis' : 'Total Tracked',
      value: dashboard?.total_tracked?.toLocaleString() ?? '—',
      icon: <Users className="h-5 w-5" />,
      color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30',
    },
    {
      label: nl ? 'Hoge Intentie' : fr ? 'Haute Intention' : 'High Intent',
      value: dashboard?.high_intent?.toLocaleString() ?? '—',
      icon: <Zap className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: nl ? 'Signalen Vandaag' : fr ? 'Signaux Aujourd\'hui' : 'Signals Today',
      value: dashboard?.signals_today?.toString() ?? '—',
      icon: <Activity className="h-5 w-5" />,
      color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30',
    },
    {
      label: nl ? 'Gem. Score' : fr ? 'Score Moyen' : 'Avg Score',
      value: dashboard?.avg_intent_score?.toFixed(1) ?? '—',
      icon: <Target className="h-5 w-5" />,
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      label: nl ? 'Pipeline Waarde' : fr ? 'Valeur Pipeline' : 'Pipeline Value',
      value: dashboard ? formatCurrency(dashboard.predicted_pipeline_value) : '—',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
  ];

  // Build heatmap grid data
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const hours = [9, 10, 11, 14, 15];
  const heatmapGrid = dashboard?.signal_heatmap ?? [];

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-6 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {nl ? 'Lead Intelligence Engine' : fr ? 'Moteur d\'Intelligence des Leads' : 'Lead Intelligence Engine'}
              </h1>
              <p className="text-sm text-white/70 mt-0.5">
                {nl ? 'AI analyseert intent signalen, website gedrag en voorspelt beste follow-up' : fr ? "L'IA analyse les signaux d'intention et predit le meilleur suivi" : 'AI analyzes intent signals, website behavior & predicts best follow-up'}
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
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-1.5">
            <Users className="h-4 w-4" />
            {nl ? 'Top Leads' : fr ? 'Meilleurs Leads' : 'Top Leads'}
          </TabsTrigger>
          <TabsTrigger value="signals" className="gap-1.5">
            <Radio className="h-4 w-4" />
            {nl ? 'Signalen' : fr ? 'Signaux' : 'Signals'}
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-1.5">
            <Megaphone className="h-4 w-4" />
            {nl ? 'Kanaaleffectiviteit' : fr ? 'Efficacite des Canaux' : 'Channel Effectiveness'}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Dashboard                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Intent Distribution PieChart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-violet-500" />
                  {nl ? 'Intent Verdeling' : fr ? 'Distribution d\'Intention' : 'Intent Distribution'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.intent_distribution && dashboard.intent_distribution.length > 0 ? (
                  <div className="flex flex-col items-center">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={dashboard.intent_distribution.map(d => ({
                            name: nl ? INTENT_LEVEL_META[d.level].labelNl : fr ? INTENT_LEVEL_META[d.level].labelFr : INTENT_LEVEL_META[d.level].label,
                            value: d.count,
                            color: d.color,
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={95}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {dashboard.intent_distribution.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {dashboard.intent_distribution.map((d) => (
                        <div key={d.level} className="flex items-center gap-1.5 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span>{nl ? INTENT_LEVEL_META[d.level].labelNl : fr ? INTENT_LEVEL_META[d.level].labelFr : INTENT_LEVEL_META[d.level].label}: {d.count.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                    {nl ? 'Geen data beschikbaar' : fr ? 'Aucune donnee disponible' : 'No data available'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Signal Heatmap */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  {nl ? 'Signaal Heatmap' : fr ? 'Heatmap des Signaux' : 'Signal Heatmap'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {heatmapGrid.length > 0 ? (
                  <div className="space-y-3">
                    {/* Header row: hours */}
                    <div className="flex items-center gap-1">
                      <div className="w-12" />
                      {hours.map(h => (
                        <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground font-medium">{h}:00</div>
                      ))}
                    </div>
                    {/* Day rows */}
                    {days.map(day => (
                      <div key={day} className="flex items-center gap-1">
                        <div className="w-12 text-xs text-muted-foreground font-medium">{day}</div>
                        {hours.map(hour => {
                          const cell = heatmapGrid.find(c => c.day === day && c.hour === hour);
                          const count = cell?.count ?? 0;
                          return (
                            <div
                              key={`${day}-${hour}`}
                              className={`flex-1 h-10 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${getHeatmapColor(count)} ${count > 0 ? 'text-white' : 'text-muted-foreground'}`}
                              title={`${day} ${hour}:00 — ${count} ${nl ? 'signalen' : fr ? 'signaux' : 'signals'}`}
                            >
                              {count > 0 ? count : ''}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground text-center mt-2">
                      {nl ? 'Donkerder = meer signalen' : fr ? 'Plus sombre = plus de signaux' : 'Darker = more signals'}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                    {nl ? 'Geen heatmap data' : fr ? 'Aucune donnee heatmap' : 'No heatmap data'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Channel Effectiveness BarChart (compact view in dashboard) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-emerald-500" />
                {nl ? 'Kanaal Effectiviteit' : fr ? 'Efficacite des Canaux' : 'Channel Effectiveness'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.channel_effectiveness && dashboard.channel_effectiveness.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboard.channel_effectiveness}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="channel" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="avg_intent_lift" name={nl ? 'Gem. Intent Lift' : fr ? 'Lift Intention Moy.' : 'Avg Intent Lift'} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="leads_influenced" name={nl ? 'Leads Beinvloed' : fr ? 'Leads Influences' : 'Leads Influenced'} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                  {nl ? 'Geen kanaaldata' : fr ? 'Aucune donnee de canal' : 'No channel data'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Top Leads                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="leads" className="mt-6 space-y-4">
          {topLeads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>{nl ? 'Geen leads gevonden' : fr ? 'Aucun lead trouve' : 'No leads found'}</p>
              </CardContent>
            </Card>
          ) : (
            topLeads.map((lead) => {
              const intentMeta = INTENT_LEVEL_META[lead.intent_level];
              const stageMeta = BUYING_STAGE_META[lead.buying_stage] ?? BUYING_STAGE_META.awareness;
              const isExpanded = expandedLeadId === lead.id;
              const isPredicting = predictingIds.has(lead.id);

              return (
                <Card key={lead.id} className={`transition-all duration-300 hover:shadow-lg border-l-4 ${intentMeta.borderColor}`}>
                  <CardContent className="p-5 space-y-4">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-base">{lead.name}</h3>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${intentMeta.color}`}>
                            {nl ? intentMeta.labelNl : fr ? intentMeta.labelFr : intentMeta.label}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${stageMeta.color}`}>
                            {nl ? stageMeta.labelNl : fr ? stageMeta.labelFr : stageMeta.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{lead.title} @ {lead.company}</p>
                      </div>

                      {/* Intent score circle */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="relative w-16 h-16">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
                            <circle
                              cx="32" cy="32" r="28" fill="none"
                              stroke={intentMeta.dotColor}
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={`${(lead.intent_score / 100) * 175.9} 175.9`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold">{lead.intent_score}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Intent</span>
                      </div>
                    </div>

                    {/* Predicted actions summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                        <span>{nl ? 'Koopkans' : fr ? 'Prob. Achat' : 'Buy Prob.'}: <span className="font-semibold text-foreground">{(lead.predicted_actions.buy_probability * 100).toFixed(0)}%</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Brain className="h-3.5 w-3.5 text-violet-500" />
                        <span>{nl ? 'Beste Actie' : fr ? 'Meilleure Action' : 'Next Action'}: <span className="font-semibold text-foreground truncate block max-w-[120px]">{lead.predicted_actions.next_best_action.split(' ').slice(0, 3).join(' ')}...</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Megaphone className="h-3.5 w-3.5 text-blue-500" />
                        <span>{nl ? 'Kanaal' : fr ? 'Canal' : 'Channel'}: <span className="font-semibold text-foreground">{lead.predicted_actions.best_channel}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        <span>{nl ? 'Beste Tijd' : fr ? 'Meilleur Moment' : 'Best Time'}: <span className="font-semibold text-foreground">{lead.predicted_actions.best_time}</span></span>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <div className="flex items-center justify-between border-t pt-3">
                      <Button variant="outline" size="sm" className="h-8 text-xs" disabled={isPredicting} onClick={() => handlePredict(lead.id)}>
                        {isPredicting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
                        {nl ? 'Voorspel Actie' : fr ? 'Predire Action' : 'Predict Action'}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5 mr-1" /> : <ChevronDown className="h-3.5 w-3.5 mr-1" />}
                        {isExpanded ? (nl ? 'Minder' : fr ? 'Moins' : 'Less') : (nl ? 'Meer Details' : fr ? 'Plus de Details' : 'More Details')}
                      </Button>
                    </div>

                    {/* ─── Expanded Section ────────────────────────────── */}
                    {isExpanded && (
                      <div className="space-y-5 pt-2 border-t">
                        {/* Website Behavior */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5" />
                            {nl ? 'Website Gedrag' : fr ? 'Comportement Web' : 'Website Behavior'}
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {[
                              { label: nl ? 'Bezoeken' : fr ? 'Visites' : 'Visits', value: lead.website_behavior.total_visits },
                              { label: nl ? 'Paginas' : fr ? 'Pages' : 'Pages', value: lead.website_behavior.pages_viewed },
                              { label: nl ? 'Gem. Sessie' : fr ? 'Session Moy.' : 'Avg Session', value: `${Math.round(lead.website_behavior.avg_session_duration / 60)}m` },
                              { label: nl ? 'Laatst' : fr ? 'Derniere' : 'Last Visit', value: formatTimeSince(lead.website_behavior.last_visit, nl, fr) },
                              { label: nl ? 'Bounce Rate' : fr ? 'Taux de Rebond' : 'Bounce Rate', value: `${lead.website_behavior.bounce_rate}%` },
                              { label: nl ? 'Top Pagina' : fr ? 'Page Top' : 'Top Page', value: lead.website_behavior.top_pages[0] ?? '—' },
                            ].map((m) => (
                              <div key={m.label} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                                <p className="text-sm font-bold mt-0.5 truncate">{m.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Social Activity */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Linkedin className="h-3.5 w-3.5" />
                            {nl ? 'Sociale Activiteit' : fr ? 'Activite Sociale' : 'Social Activity'}
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                              { label: 'LinkedIn', value: lead.social_activity.linkedin_engagements },
                              { label: 'Twitter', value: lead.social_activity.twitter_mentions },
                              { label: nl ? 'Gedeeld' : fr ? 'Partages' : 'Shares', value: lead.social_activity.content_shares },
                              { label: nl ? 'Community' : fr ? 'Communaute' : 'Community', value: lead.social_activity.community_posts },
                            ].map((m) => (
                              <div key={m.label} className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-center">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                                <p className="text-sm font-bold mt-0.5">{m.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Engagement Timeline mini chart */}
                        {lead.engagement_timeline.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Activity className="h-3.5 w-3.5" />
                              {nl ? 'Betrokkenheid Tijdlijn' : fr ? 'Chronologie d\'Engagement' : 'Engagement Timeline'}
                            </h4>
                            <ResponsiveContainer width="100%" height={160}>
                              <LineChart data={lead.engagement_timeline}>
                                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                                <YAxis tick={{ fontSize: 9 }} domain={[0, 100]} />
                                <Tooltip
                                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}
                                  formatter={(value: number, _name: string, props: any) => [value, props?.payload?.event ?? 'Score']}
                                />
                                <Line type="monotone" dataKey="score" stroke={intentMeta.dotColor} strokeWidth={2} dot={{ r: 4, fill: intentMeta.dotColor }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* Company Intel */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            {nl ? 'Bedrijfsintelligentie' : fr ? 'Intelligence Entreprise' : 'Company Intel'}
                          </h4>
                          <div className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-lg p-4 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                              <div>
                                <span className="text-muted-foreground">{nl ? 'Grootte' : fr ? 'Taille' : 'Size'}</span>
                                <p className="font-semibold">{lead.company_intel.size} {nl ? 'medewerkers' : fr ? 'employes' : 'employees'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{nl ? 'Industrie' : fr ? 'Industrie' : 'Industry'}</span>
                                <p className="font-semibold">{lead.company_intel.industry}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{nl ? 'Omzet' : fr ? 'Revenus' : 'Revenue'}</span>
                                <p className="font-semibold">{lead.company_intel.revenue}</p>
                              </div>
                            </div>
                            {/* Tech Stack */}
                            <div>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Tech Stack</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {lead.company_intel.tech_stack.map((tech) => (
                                  <Badge key={tech} variant="secondary" className="text-[10px] px-1.5 py-0">{tech}</Badge>
                                ))}
                              </div>
                            </div>
                            {/* Recent News */}
                            {lead.company_intel.recent_news.length > 0 && (
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{nl ? 'Recent Nieuws' : fr ? 'Nouvelles Recentes' : 'Recent News'}</span>
                                <ul className="mt-1 space-y-1">
                                  {lead.company_intel.recent_news.map((news, i) => (
                                    <li key={i} className="text-xs flex items-start gap-1.5">
                                      <ArrowUpRight className="h-3 w-3 text-indigo-500 mt-0.5 flex-shrink-0" />
                                      {news}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {/* Growth Signals */}
                            {lead.company_intel.growth_signals.length > 0 && (
                              <div>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{nl ? 'Groei Signalen' : fr ? 'Signaux de Croissance' : 'Growth Signals'}</span>
                                <ul className="mt-1 space-y-1">
                                  {lead.company_intel.growth_signals.map((sig, i) => (
                                    <li key={i} className="text-xs flex items-start gap-1.5">
                                      <TrendingUp className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                      {sig}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Signals list */}
                        {lead.signals.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Radio className="h-3.5 w-3.5" />
                              {nl ? 'Signalen' : fr ? 'Signaux' : 'Signals'} ({lead.signals.length})
                            </h4>
                            <div className="space-y-2">
                              {lead.signals.map((signal) => {
                                const signalMeta = SIGNAL_TYPE_META[signal.type];
                                return (
                                  <div key={signal.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${signalMeta.color}`}>
                                        {signalMeta.icon}
                                        <span className="ml-1">{signalMeta.label}</span>
                                      </Badge>
                                      <span className="text-xs text-muted-foreground truncate">{signal.description}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                      <Progress value={signal.strength} className="w-16 h-1.5" />
                                      <span className="text-[10px] font-medium w-8 text-right">{signal.strength}%</span>
                                    </div>
                                  </div>
                                );
                              })}
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
        {/* TAB: Signals (real-time feed)                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="signals" className="mt-6 space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Radio className="h-4 w-4 text-rose-500" />
                {nl ? 'Recente Signalen' : fr ? 'Signaux Recents' : 'Recent Signals'}
                <Badge variant="secondary" className="ml-2 text-xs">{recentSignals.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentSignals.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  <Radio className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>{nl ? 'Geen recente signalen' : fr ? 'Aucun signal recent' : 'No recent signals'}</p>
                </div>
              ) : (
                recentSignals.map((signal) => {
                  const signalMeta = SIGNAL_TYPE_META[signal.type];
                  return (
                    <div key={signal.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                      {/* Signal type icon */}
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 ${signalMeta.color}`}>
                        {signalMeta.icon}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold">{signal.lead_name}</span>
                          <span className="text-xs text-muted-foreground">@ {signal.company}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{signal.description}</p>
                        {signal.page_url && (
                          <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5 truncate">{signal.page_url}</p>
                        )}
                      </div>

                      {/* Strength + time */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <Progress value={signal.strength} className="w-16 h-1.5" />
                          <span className="text-[10px] font-bold w-8 text-right">{signal.strength}%</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{formatTimeSince(signal.timestamp, nl, fr)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Channel Effectiveness                                     */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="channels" className="mt-6 space-y-6">
          {/* BarChart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-violet-500" />
                {nl ? 'Kanaal Effectiviteit' : fr ? 'Efficacite des Canaux' : 'Channel Effectiveness'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.channel_effectiveness && dashboard.channel_effectiveness.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={dashboard.channel_effectiveness}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="channel" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={55} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar yAxisId="left" dataKey="leads_influenced" name={nl ? 'Leads Beinvloed' : fr ? 'Leads Influences' : 'Leads Influenced'} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="avg_intent_lift" name={nl ? 'Gem. Intent Lift' : fr ? 'Lift Intention Moy.' : 'Avg Intent Lift'} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[320px] text-muted-foreground text-sm">
                  {nl ? 'Geen kanaaldata' : fr ? 'Aucune donnee' : 'No channel data'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                {nl ? 'Kanaal Details' : fr ? 'Details des Canaux' : 'Channel Details'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.channel_effectiveness && dashboard.channel_effectiveness.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-muted-foreground text-xs">{nl ? 'Kanaal' : fr ? 'Canal' : 'Channel'}</th>
                        <th className="pb-3 font-medium text-muted-foreground text-xs text-right">{nl ? 'Leads Beinvloed' : fr ? 'Leads Influences' : 'Leads Influenced'}</th>
                        <th className="pb-3 font-medium text-muted-foreground text-xs text-right">{nl ? 'Gem. Intent Lift' : fr ? 'Lift Intention' : 'Avg Intent Lift'}</th>
                        <th className="pb-3 font-medium text-muted-foreground text-xs text-right">{nl ? 'Kosten/Intent Punt' : fr ? 'Cout/Point Intention' : 'Cost/Intent Point'}</th>
                        <th className="pb-3 font-medium text-muted-foreground text-xs text-right">{nl ? 'Effectiviteit' : fr ? 'Efficacite' : 'Effectiveness'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dashboard.channel_effectiveness
                        .sort((a, b) => b.avg_intent_lift - a.avg_intent_lift)
                        .map((ch) => {
                          const effectiveness = Math.min(100, Math.round((ch.avg_intent_lift / 40) * 100));
                          return (
                            <tr key={ch.channel} className="hover:bg-muted/40 transition-colors">
                              <td className="py-3 font-medium">{ch.channel}</td>
                              <td className="py-3 text-right">{ch.leads_influenced.toLocaleString()}</td>
                              <td className="py-3 text-right">
                                <Badge variant="outline" className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-xs">
                                  +{ch.avg_intent_lift}
                                </Badge>
                              </td>
                              <td className="py-3 text-right">{formatCurrency(ch.cost_per_intent_point)}</td>
                              <td className="py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Progress value={effectiveness} className="w-20 h-2" />
                                  <span className="text-xs font-medium w-8 text-right">{effectiveness}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  {nl ? 'Geen kanaaldata beschikbaar' : fr ? 'Aucune donnee de canal' : 'No channel data available'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
