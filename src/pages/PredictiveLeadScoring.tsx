// src/pages/PredictiveLeadScoring.tsx
// Predictive Lead Scoring — AI-powered lead scoring with funnel management and insights

import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useLeadScoring } from '@/hooks/useLeadScoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Loader2,
  RefreshCw,
  Users,
  TrendingUp,
  Flame,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Brain,
  Lightbulb,
  Shield,
  Eye,
  Activity,
  Layers,
  UserCheck,
  Crown,
  Percent,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Filter,
  Clock,
  Building2,
  MousePointerClick,
  Search,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import type { ScoredLead, ScoringRule, ScoreCategory } from '@/services/context-marketing/lead-scoring.service';

// ─── Score color helpers ─────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 85) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
  if (score >= 70) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  if (score >= 50) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
  if (score >= 30) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
}

function getScoreDotColor(score: number): string {
  if (score >= 85) return 'bg-purple-500';
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}

function getStageBadge(stage: string): { color: string; label: string; labelNl: string; labelFr: string } {
  switch (stage) {
    case 'customer': return { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30', label: 'Customer', labelNl: 'Klant', labelFr: 'Client' };
    case 'opportunity': return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30', label: 'Opportunity', labelNl: 'Kans', labelFr: 'Opportunité' };
    case 'sql': return { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30', label: 'SQL', labelNl: 'SQL', labelFr: 'SQL' };
    case 'mql': return { color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30', label: 'MQL', labelNl: 'MQL', labelFr: 'MQL' };
    case 'lead': return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30', label: 'Lead', labelNl: 'Lead', labelFr: 'Lead' };
    default: return { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30', label: 'Visitor', labelNl: 'Bezoeker', labelFr: 'Visiteur' };
  }
}

const CATEGORY_META: Record<ScoreCategory, { icon: React.ReactNode; label: string; labelNl: string; labelFr: string; color: string }> = {
  behavioral: { icon: <MousePointerClick className="h-3.5 w-3.5" />, label: 'Behavioral', labelNl: 'Gedrag', labelFr: 'Comportement', color: '#8b5cf6' },
  demographic: { icon: <UserCheck className="h-3.5 w-3.5" />, label: 'Demographic', labelNl: 'Demografie', labelFr: 'Démographie', color: '#06b6d4' },
  firmographic: { icon: <Building2 className="h-3.5 w-3.5" />, label: 'Firmographic', labelNl: 'Firmografie', labelFr: 'Firmographie', color: '#f59e0b' },
  engagement: { icon: <Activity className="h-3.5 w-3.5" />, label: 'Engagement', labelNl: 'Betrokkenheid', labelFr: 'Engagement', color: '#22c55e' },
  intent: { icon: <Zap className="h-3.5 w-3.5" />, label: 'Intent', labelNl: 'Intentie', labelFr: 'Intention', color: '#ef4444' },
};

// ─── Main Component ─────────────────────────────────────────────────

export default function PredictiveLeadScoring() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { formatCurrency, formatCompact } = useCurrency();
  const {
    dashboard,
    leads,
    scoringRules,
    scoringModel,
    funnelData,
    insights,
    isLoading,
    error,
    updateRule,
    rescoreAll,
    refetch,
  } = useLeadScoring();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [rescoring, setRescoring] = useState(false);
  const [rescoreResult, setRescoreResult] = useState<{ total_rescored: number; changes: number } | null>(null);

  const handleRescoreAll = useCallback(async () => {
    setRescoring(true);
    setRescoreResult(null);
    try {
      const result = await rescoreAll();
      setRescoreResult(result);
    } catch (err) {
      console.error('Rescore failed:', err);
    } finally {
      setRescoring(false);
    }
  }, [rescoreAll]);

  const handleToggleRule = useCallback(async (rule: ScoringRule) => {
    await updateRule(rule.id, { is_active: !rule.is_active });
  }, [updateRule]);

  const groupedRules = useMemo(() => {
    const groups: Record<ScoreCategory, ScoringRule[]> = {
      behavioral: [],
      demographic: [],
      firmographic: [],
      engagement: [],
      intent: [],
    };
    scoringRules.forEach(rule => {
      if (groups[rule.category]) {
        groups[rule.category].push(rule);
      }
    });
    return groups;
  }, [scoringRules]);

  // ─── Loading State ──────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto" />
          <p className="text-sm text-muted-foreground">
            {nl ? 'Lead scoring data laden...' : fr ? 'Chargement des données de scoring...' : 'Loading lead scoring data...'}
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
              {nl ? 'Opnieuw proberen' : fr ? 'Réessayer' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Stats ──────────────────────────────────────────────────────

  const stats = [
    {
      label: nl ? 'Totale Leads' : fr ? 'Total Leads' : 'Total Leads',
      value: dashboard?.total_leads?.toLocaleString() ?? '—',
      icon: <Users className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: nl ? 'Gem. Score' : fr ? 'Score Moy.' : 'Avg Score',
      value: dashboard?.average_score?.toFixed(1) ?? '—',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      label: nl ? 'Hot Leads' : fr ? 'Leads Chauds' : 'Hot Leads',
      value: dashboard?.hot_leads?.toLocaleString() ?? '—',
      icon: <Flame className="h-5 w-5" />,
      color: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'MQLs',
      value: dashboard?.mql_count?.toLocaleString() ?? '—',
      icon: <Filter className="h-5 w-5" />,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: 'SQLs',
      value: dashboard?.sql_count?.toLocaleString() ?? '—',
      icon: <Crown className="h-5 w-5" />,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: nl ? 'Conversieratio' : fr ? 'Taux de Conversion' : 'Conversion Rate',
      value: dashboard ? `${dashboard.conversion_rate}%` : '—',
      icon: <Percent className="h-5 w-5" />,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    },
  ];

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {nl ? 'Voorspellende Lead Scoring' : fr ? 'Scoring Prédictif des Leads' : 'Predictive Lead Scoring'}
              </h1>
              <p className="text-sm text-white/70 mt-0.5">
                {nl
                  ? 'AI-gestuurde leadkwalificatie en funneloptimalisatie'
                  : fr
                  ? 'Qualification des leads et optimisation du funnel par IA'
                  : 'AI-powered lead qualification and funnel optimization'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {scoringModel && (
              <Badge className="bg-green-500/20 text-green-100 border-green-400/30 px-3 py-1 text-sm">
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                {nl ? 'Nauwkeurigheid' : fr ? 'Précision' : 'Accuracy'}: {scoringModel.accuracy}%
              </Badge>
            )}
            {rescoreResult && (
              <Badge className="bg-white/20 text-white border-white/30 px-3 py-1 text-xs animate-in fade-in">
                {rescoreResult.total_rescored} {nl ? 'herscored' : fr ? 'rescorés' : 'rescored'}, {rescoreResult.changes} {nl ? 'gewijzigd' : fr ? 'modifiés' : 'changed'}
              </Badge>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              onClick={handleRescoreAll}
              disabled={rescoring}
            >
              {rescoring ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {nl ? 'Alles Herscoren' : fr ? 'Rescorer Tout' : 'Rescore All'}
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Stats Bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {nl ? 'Dashboard' : fr ? 'Tableau de Bord' : 'Dashboard'}
          </TabsTrigger>
          <TabsTrigger value="leads" className="gap-1.5">
            <Users className="h-4 w-4" />
            {nl ? 'Leads' : fr ? 'Leads' : 'Leads'}
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-1.5">
            <Layers className="h-4 w-4" />
            {nl ? 'Regels' : fr ? 'Règles' : 'Rules'}
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-1.5">
            <Lightbulb className="h-4 w-4" />
            {nl ? 'Inzichten' : fr ? 'Insights' : 'Insights'}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB: Dashboard                                             */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="dashboard" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-500" />
                  {nl ? 'Score Verdeling' : fr ? 'Distribution des Scores' : 'Score Distribution'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.score_distribution ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dashboard.score_distribution}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        formatter={(value: number) => [value, nl ? 'Leads' : fr ? 'Leads' : 'Leads']}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {dashboard.score_distribution.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                    {nl ? 'Geen data beschikbaar' : fr ? 'Aucune donnée disponible' : 'No data available'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lead Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4 text-purple-500" />
                  {nl ? 'Lead Funnel' : fr ? 'Entonnoir des Leads' : 'Lead Funnel'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.funnel && dashboard.funnel.length > 0 ? (
                  <div className="space-y-2">
                    {dashboard.funnel.map((stage, idx) => {
                      const maxCount = dashboard.funnel[0].count;
                      const widthPercent = Math.max(20, (stage.count / maxCount) * 100);
                      const colors = [
                        'from-gray-400 to-gray-500',
                        'from-amber-400 to-amber-500',
                        'from-indigo-400 to-indigo-500',
                        'from-purple-400 to-purple-500',
                        'from-blue-400 to-blue-500',
                        'from-emerald-400 to-emerald-500',
                      ];
                      return (
                        <div key={stage.stage} className="group">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-10 rounded-lg bg-gradient-to-r ${colors[idx]} flex items-center px-3 transition-all duration-500 group-hover:shadow-md`}
                              style={{ width: `${widthPercent}%` }}
                            >
                              <span className="text-white text-xs font-semibold truncate">
                                {stage.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs shrink-0">
                              <span className="font-bold">{stage.count.toLocaleString()}</span>
                              {idx < dashboard.funnel.length - 1 && (
                                <span className="text-muted-foreground">
                                  {stage.conversion_rate}%
                                  <ArrowUpRight className="h-3 w-3 inline ml-0.5 text-green-500" />
                                </span>
                              )}
                              {stage.avg_time_in_stage > 0 && (
                                <span className="text-muted-foreground hidden md:inline">
                                  <Clock className="h-3 w-3 inline mr-0.5" />
                                  {stage.avg_time_in_stage}d
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                    {nl ? 'Geen funnel data' : fr ? 'Aucune donnée d\'entonnoir' : 'No funnel data'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Score Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                {nl ? 'Score Trend' : fr ? 'Tendance des Scores' : 'Score Trend'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.score_trend && dashboard.score_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={dashboard.score_trend}>
                    <defs>
                      <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="avg_score"
                      name={nl ? 'Gem. Score' : fr ? 'Score Moy.' : 'Avg Score'}
                      stroke="#8b5cf6"
                      fill="url(#gradScore)"
                      strokeWidth={2}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="new_leads"
                      name={nl ? 'Nieuwe Leads' : fr ? 'Nouveaux Leads' : 'New Leads'}
                      stroke="#22c55e"
                      fill="url(#gradLeads)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                  {nl ? 'Geen trenddata' : fr ? 'Aucune donnée de tendance' : 'No trend data'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Score Changes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-500" />
                {nl ? 'Recente Score Wijzigingen' : fr ? 'Changements de Score Récents' : 'Recent Score Changes'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboard?.recent_score_changes && dashboard.recent_score_changes.length > 0 ? (
                <div className="max-h-[320px] overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                  {dashboard.recent_score_changes.map((change, idx) => {
                    const delta = change.new_score - change.old_score;
                    const isUp = delta > 0;
                    return (
                      <div
                        key={`${change.lead_id}-${idx}`}
                        className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isUp ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                          {isUp ? (
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{change.lead_name}</p>
                          <p className="text-xs text-muted-foreground truncate">{change.reason}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-sm">
                          <span className="text-muted-foreground">{change.old_score}</span>
                          <span className="text-muted-foreground">&rarr;</span>
                          <span className="font-bold">{change.new_score}</span>
                          <Badge className={`text-xs ${isUp ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                            {isUp ? '+' : ''}{delta}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground hidden md:block shrink-0">
                          {new Date(change.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {nl ? 'Geen recente wijzigingen' : fr ? 'Aucun changement récent' : 'No recent changes'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB: Leads                                                 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="leads" className="mt-6 space-y-4">
          {leads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>{nl ? 'Geen leads gevonden' : fr ? 'Aucun lead trouvé' : 'No leads found'}</p>
              </CardContent>
            </Card>
          ) : (
            leads.map((lead) => {
              const isExpanded = expandedLeadId === lead.id;
              const stageMeta = getStageBadge(lead.stage);
              const breakdownData = Object.entries(lead.score_breakdown).map(([key, val]) => ({
                category: CATEGORY_META[key as ScoreCategory]?.[nl ? 'labelNl' : fr ? 'labelFr' : 'label'] ?? key,
                value: val,
                fullMark: 100,
              }));

              return (
                <Card
                  key={lead.id}
                  className={`transition-all duration-300 hover:shadow-md ${isExpanded ? 'ring-2 ring-purple-400/40' : ''}`}
                >
                  <CardContent className="p-4">
                    {/* Lead Row */}
                    <div
                      className="flex items-center gap-4 cursor-pointer"
                      onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                    >
                      {/* Score Badge */}
                      <div className="flex items-center justify-center shrink-0">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${getScoreColor(lead.composite_score)}`}>
                          {lead.composite_score}
                        </div>
                      </div>

                      {/* Name & Company */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{lead.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {lead.title && `${lead.title} · `}{lead.company || lead.email}
                        </p>
                      </div>

                      {/* Stage Badge */}
                      <Badge className={`${stageMeta.color} text-xs shrink-0 hidden sm:flex`}>
                        {nl ? stageMeta.labelNl : fr ? stageMeta.labelFr : stageMeta.label}
                      </Badge>

                      {/* Conversion Probability */}
                      <div className="w-24 shrink-0 hidden md:block">
                        <p className="text-[10px] text-muted-foreground mb-1">
                          {nl ? 'Conversie' : fr ? 'Conversion' : 'Conversion'}
                        </p>
                        <div className="flex items-center gap-2">
                          <Progress value={lead.conversion_probability * 100} className="h-2 flex-1" />
                          <span className="text-xs font-medium">{Math.round(lead.conversion_probability * 100)}%</span>
                        </div>
                      </div>

                      {/* Predicted Value */}
                      <div className="shrink-0 text-right hidden lg:block">
                        <p className="text-[10px] text-muted-foreground">
                          {nl ? 'Voorspelde Waarde' : fr ? 'Valeur Prédite' : 'Predicted Value'}
                        </p>
                        <p className="text-sm font-bold">{formatCompact(lead.predicted_value)}</p>
                      </div>

                      {/* Next Best Action */}
                      <div className="shrink-0 max-w-[180px] hidden xl:block">
                        <p className="text-[10px] text-muted-foreground">
                          {nl ? 'Volgende Actie' : fr ? 'Prochaine Action' : 'Next Action'}
                        </p>
                        <p className="text-xs truncate">{lead.next_best_action}</p>
                      </div>

                      {/* Source */}
                      <Badge variant="outline" className="text-[10px] shrink-0 hidden lg:flex">
                        {lead.source}
                      </Badge>

                      {/* Expand/Collapse */}
                      <div className="shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-4 animate-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Score Breakdown Bars */}
                          <div className="space-y-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              {nl ? 'Score Verdeling' : fr ? 'Répartition du Score' : 'Score Breakdown'}
                            </p>
                            {(Object.entries(lead.score_breakdown) as [ScoreCategory, number][]).map(
                              ([cat, val]) => {
                                const meta = CATEGORY_META[cat];
                                return (
                                  <div key={cat} className="space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="flex items-center gap-1.5">
                                        {meta.icon}
                                        {nl ? meta.labelNl : fr ? meta.labelFr : meta.label}
                                      </span>
                                      <span className="font-bold">{val}</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                          width: `${val}%`,
                                          backgroundColor: meta.color,
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>

                          {/* Radar Chart */}
                          <div className="flex items-center justify-center">
                            <ResponsiveContainer width="100%" height={200}>
                              <RadarChart data={breakdownData} cx="50%" cy="50%" outerRadius="70%">
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="category" tick={{ fontSize: 10 }} />
                                <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                                <Radar
                                  dataKey="value"
                                  stroke="#8b5cf6"
                                  fill="#8b5cf6"
                                  fillOpacity={0.25}
                                  strokeWidth={2}
                                />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Signals + History */}
                          <div className="space-y-3">
                            {/* Hot Signals */}
                            {lead.hot_signals.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-green-600 mb-1.5 flex items-center gap-1">
                                  <Flame className="h-3 w-3" />
                                  {nl ? 'Hot Signalen' : fr ? 'Signaux Chauds' : 'Hot Signals'}
                                </p>
                                <div className="space-y-1">
                                  {lead.hot_signals.map((sig, i) => (
                                    <div key={i} className="flex items-start gap-1.5 text-xs">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                                      <span>{sig}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Cold Signals */}
                            {lead.cold_signals.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {nl ? 'Koude Signalen' : fr ? 'Signaux Froids' : 'Cold Signals'}
                                </p>
                                <div className="space-y-1">
                                  {lead.cold_signals.map((sig, i) => (
                                    <div key={i} className="flex items-start gap-1.5 text-xs">
                                      <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                                      <span>{sig}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Score History Sparkline */}
                            {lead.score_history.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  {nl ? 'Score Geschiedenis' : fr ? 'Historique du Score' : 'Score History'}
                                </p>
                                <ResponsiveContainer width="100%" height={60}>
                                  <LineChart data={lead.score_history}>
                                    <Line
                                      type="monotone"
                                      dataKey="score"
                                      stroke="#8b5cf6"
                                      strokeWidth={2}
                                      dot={{ r: 2, fill: '#8b5cf6' }}
                                    />
                                    <Tooltip
                                      contentStyle={{ borderRadius: '6px', fontSize: '10px', padding: '4px 8px' }}
                                      formatter={(val: number) => [val, 'Score']}
                                      labelFormatter={(label: string) => label}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Info Row */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                          <Badge variant="outline" className="text-[10px]">
                            <Eye className="h-3 w-3 mr-1" />
                            {lead.activity_count_30d} {nl ? 'activiteiten (30d)' : fr ? 'activités (30j)' : 'activities (30d)'}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            <Clock className="h-3 w-3 mr-1" />
                            {nl ? 'Laatst' : fr ? 'Dernier' : 'Last'}: {new Date(lead.last_activity).toLocaleDateString()}
                          </Badge>
                          {lead.predicted_close_date && (
                            <Badge variant="outline" className="text-[10px]">
                              <Target className="h-3 w-3 mr-1" />
                              {nl ? 'Sluit' : fr ? 'Clôture' : 'Close'}: {new Date(lead.predicted_close_date).toLocaleDateString()}
                            </Badge>
                          )}
                          {lead.tags.map(tag => (
                            <Badge key={tag} className="text-[10px] bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB: Rules                                                 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="rules" className="mt-6 space-y-6">
          {scoringModel && (
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200/50">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Brain className="h-4 w-4 text-indigo-500" />
                      {scoringModel.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{scoringModel.description}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span>
                      {nl ? 'Nauwkeurigheid' : fr ? 'Précision' : 'Accuracy'}: <strong>{scoringModel.accuracy}%</strong>
                    </span>
                    <span>
                      MQL &ge; <strong>{scoringModel.threshold_mql}</strong>
                    </span>
                    <span>
                      SQL &ge; <strong>{scoringModel.threshold_sql}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      {nl ? 'Getraind' : fr ? 'Entraîné' : 'Trained'}: {new Date(scoringModel.last_trained).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {/* Category Weights */}
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {(Object.entries(scoringModel.category_weights) as [ScoreCategory, number][]).map(([cat, weight]) => {
                    const meta = CATEGORY_META[cat];
                    return (
                      <div key={cat} className="text-center p-2 bg-white/60 dark:bg-white/5 rounded-lg">
                        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mb-1">
                          {meta.icon}
                          <span>{nl ? meta.labelNl : fr ? meta.labelFr : meta.label}</span>
                        </div>
                        <p className="text-lg font-bold" style={{ color: meta.color }}>{weight}%</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {(Object.entries(groupedRules) as [ScoreCategory, ScoringRule[]][]).map(([category, rules]) => {
            if (rules.length === 0) return null;
            const meta = CATEGORY_META[category];
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="flex items-center justify-center w-6 h-6 rounded"
                    style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                  >
                    {meta.icon}
                  </div>
                  <h3 className="text-sm font-semibold">
                    {nl ? meta.labelNl : fr ? meta.labelFr : meta.label}
                  </h3>
                  <Badge variant="secondary" className="text-[10px]">{rules.length}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rules.map((rule) => (
                    <Card
                      key={rule.id}
                      className={`transition-all duration-200 hover:shadow-md ${!rule.is_active ? 'opacity-50' : ''}`}
                    >
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{rule.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                          </div>
                          <button
                            onClick={() => handleToggleRule(rule)}
                            className="shrink-0 focus:outline-none"
                            aria-label={rule.is_active ? 'Deactivate rule' : 'Activate rule'}
                          >
                            {rule.is_active ? (
                              <ToggleRight className="h-6 w-6 text-green-500" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-gray-400" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono truncate flex-1">
                            {rule.condition}
                          </code>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge
                            className={`text-xs font-bold ${
                              rule.points >= 0
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            }`}
                          >
                            {rule.points > 0 ? '+' : ''}{rule.points} {nl ? 'punten' : fr ? 'points' : 'points'}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {rule.triggers_count.toLocaleString()} {nl ? 'keer getriggerd' : fr ? 'fois déclenché' : 'triggers'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB: Insights                                              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="insights" className="mt-6">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Lightbulb className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>{nl ? 'Geen inzichten beschikbaar' : fr ? 'Aucun insight disponible' : 'No insights available'}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight) => {
                const impactColors: Record<string, { bg: string; text: string; border: string }> = {
                  high: { bg: 'bg-red-50 dark:bg-red-950/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800/40' },
                  medium: { bg: 'bg-yellow-50 dark:bg-yellow-950/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800/40' },
                  low: { bg: 'bg-green-50 dark:bg-green-950/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800/40' },
                };
                const impactStyle = impactColors[insight.impact] || impactColors.medium;

                return (
                  <Card
                    key={insight.id}
                    className={`${impactStyle.bg} ${impactStyle.border} border hover:shadow-md transition-all duration-200`}
                  >
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Sparkles className={`h-4 w-4 mt-0.5 shrink-0 ${impactStyle.text}`} />
                          <h3 className="text-sm font-semibold leading-tight">{insight.title}</h3>
                        </div>
                        <Badge
                          className={`shrink-0 text-[10px] uppercase font-bold ${
                            insight.impact === 'high'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              : insight.impact === 'medium'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                          }`}
                        >
                          {insight.impact === 'high'
                            ? (nl ? 'Hoog' : fr ? 'Élevé' : 'High')
                            : insight.impact === 'medium'
                            ? (nl ? 'Gemiddeld' : fr ? 'Moyen' : 'Medium')
                            : (nl ? 'Laag' : fr ? 'Faible' : 'Low')}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>

                      {/* Confidence */}
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-muted-foreground shrink-0">
                          {nl ? 'Betrouwbaarheid' : fr ? 'Confiance' : 'Confidence'}
                        </p>
                        <Progress value={insight.confidence} className="h-1.5 flex-1" />
                        <span className="text-xs font-bold">{insight.confidence}%</span>
                      </div>

                      {/* Suggested Action */}
                      <div className="flex items-start gap-2 p-2.5 bg-white/60 dark:bg-white/5 rounded-lg border border-dashed">
                        <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                            {nl ? 'Aanbevolen Actie' : fr ? 'Action Suggérée' : 'Suggested Action'}
                          </p>
                          <p className="text-xs">{insight.suggested_action}</p>
                        </div>
                      </div>

                      {/* Category Tag */}
                      <div className="flex items-center justify-end">
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {insight.category}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
