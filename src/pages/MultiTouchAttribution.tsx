// src/pages/MultiTouchAttribution.tsx
// Multi-Touch Attribution — AI-driven channel attribution with multiple models

import React, { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAttribution } from '@/hooks/useAttribution';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  GitBranch,
  Loader2,
  BarChart3,
  ArrowRightLeft,
  Route,
  Target,
  TrendingUp,
  DollarSign,
  Clock,
  Layers,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from 'recharts';
import type { AttributionModelType } from '@/services/context-marketing/attribution.service';

// ─── Model metadata ──────────────────────────────────────────────────

interface ModelMeta {
  type: AttributionModelType;
  label: string;
  labelNl: string;
  labelFr: string;
  icon: React.ReactNode;
}

const MODEL_META: ModelMeta[] = [
  { type: 'first_touch', label: 'First Touch', labelNl: 'Eerste Aanraking', labelFr: 'Premier Contact', icon: <Zap className="h-3 w-3" /> },
  { type: 'last_touch', label: 'Last Touch', labelNl: 'Laatste Aanraking', labelFr: 'Dernier Contact', icon: <Target className="h-3 w-3" /> },
  { type: 'linear', label: 'Linear', labelNl: 'Lineair', labelFr: 'Linéaire', icon: <Layers className="h-3 w-3" /> },
  { type: 'time_decay', label: 'Time Decay', labelNl: 'Tijdsverval', labelFr: 'Déclin Temporel', icon: <Clock className="h-3 w-3" /> },
  { type: 'u_shaped', label: 'U-Shaped', labelNl: 'U-Vorm', labelFr: 'Forme en U', icon: <ArrowRightLeft className="h-3 w-3" /> },
  { type: 'w_shaped', label: 'W-Shaped', labelNl: 'W-Vorm', labelFr: 'Forme en W', icon: <Route className="h-3 w-3" /> },
  { type: 'data_driven_markov', label: 'Markov Chain', labelNl: 'Markov Keten', labelFr: 'Chaîne de Markov', icon: <GitBranch className="h-3 w-3" /> },
  { type: 'data_driven_shapley', label: 'Shapley Value', labelNl: 'Shapley Waarde', labelFr: 'Valeur de Shapley', icon: <Sparkles className="h-3 w-3" /> },
];

const MODEL_TYPE_SHORT_LABELS: Record<AttributionModelType, string> = {
  first_touch: 'First',
  last_touch: 'Last',
  linear: 'Linear',
  time_decay: 'Time',
  u_shaped: 'U',
  w_shaped: 'W',
  data_driven_markov: 'Markov',
  data_driven_shapley: 'Shapley',
};

// ─── Helpers ─────────────────────────────────────────────────────────

function roiColor(roi: number): string {
  if (roi >= 200) return 'text-emerald-400';
  if (roi >= 100) return 'text-amber-400';
  return 'text-red-400';
}

function roiBadgeClass(roi: number): string {
  if (roi >= 200) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  if (roi >= 100) return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  return 'bg-red-500/15 text-red-400 border-red-500/30';
}

// ─── Custom Recharts tooltips ────────────────────────────────────────

function CustomBarTooltip({ active, payload, label, formatCurrency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="mb-1 text-sm font-semibold text-white">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-slate-300">
          {entry.name}: <span className="font-medium text-white">{formatCurrency(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

function CustomScatterTooltip({ active, payload, formatCurrency }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="mb-1 text-sm font-semibold text-white">{data.channel}</p>
      <p className="text-xs text-slate-300">Cost: <span className="font-medium text-white">{formatCurrency(data.cost)}</span></p>
      <p className="text-xs text-slate-300">Revenue: <span className="font-medium text-white">{formatCurrency(data.attributed_revenue)}</span></p>
      <p className="text-xs text-slate-300">Conversions: <span className="font-medium text-white">{data.attributed_conversions}</span></p>
      <p className="text-xs text-slate-300">ROI: <span className={`font-medium ${roiColor(data.roi)}`}>{data.roi}%</span></p>
    </div>
  );
}

function CustomAreaTooltip({ active, payload, label, formatCurrency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/95 px-4 py-3 shadow-xl backdrop-blur-sm">
      <p className="mb-1 text-sm font-semibold text-white">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-xs text-slate-300">
          {entry.name}: <span className="font-medium text-white">
            {entry.name === 'Revenue' || entry.name === 'Omzet' || entry.name === 'Revenu' ? formatCurrency(entry.value) : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────

export default function MultiTouchAttribution() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { formatCurrency, formatCompact } = useCurrency();

  const {
    dashboardData,
    models,
    selectedModel,
    modelComparison,
    journeyPaths,
    isLoading,
    error,
    selectModel,
    refetch,
  } = useAttribution();

  // Active model config
  const activeModel = useMemo(
    () => models.find((m) => m.type === selectedModel),
    [models, selectedModel]
  );

  // Active model label for header badge
  const activeModelMeta = useMemo(
    () => MODEL_META.find((m) => m.type === selectedModel),
    [selectedModel]
  );

  // Sorted channels for charts
  const sortedChannels = useMemo(
    () => (dashboardData?.channels ?? []).slice().sort((a, b) => b.attributed_revenue - a.attributed_revenue),
    [dashboardData]
  );

  // Chart data for channel attribution bar chart
  const channelBarData = useMemo(
    () => sortedChannels.map((c) => ({ name: c.display_name, revenue: c.attributed_revenue, color: c.color })),
    [sortedChannels]
  );

  // Model comparison grouped bar data
  const comparisonBarData = useMemo(() => {
    if (!modelComparison.length) return [];
    return modelComparison.map((mc) => {
      const row: any = { channel: mc.channel, color: mc.color };
      Object.entries(mc.models).forEach(([modelType, data]) => {
        row[modelType] = data?.percentage_share ?? 0;
      });
      return row;
    });
  }, [modelComparison]);

  // Model types present in comparison data
  const comparisonModelTypes = useMemo(() => {
    if (!modelComparison.length) return [];
    const types = new Set<string>();
    modelComparison.forEach((mc) => Object.keys(mc.models).forEach((t) => types.add(t)));
    return Array.from(types) as AttributionModelType[];
  }, [modelComparison]);

  // Scatter data for ROI chart
  const scatterData = useMemo(
    () => sortedChannels.filter((c) => c.cost > 0).map((c) => ({
      channel: c.display_name,
      cost: c.cost,
      attributed_revenue: c.attributed_revenue,
      attributed_conversions: c.attributed_conversions,
      roi: c.roi,
      color: c.color,
    })),
    [sortedChannels]
  );

  // ROI ranking sorted descending
  const roiRanking = useMemo(
    () => sortedChannels.slice().sort((a, b) => b.roi - a.roi),
    [sortedChannels]
  );

  // Sorted journey paths by frequency
  const sortedPaths = useMemo(
    () => (journeyPaths ?? []).slice().sort((a, b) => b.frequency - a.frequency),
    [journeyPaths]
  );

  // Revenue over time
  const revenueOverTime = dashboardData?.revenue_over_time ?? [];

  // Model comparison colors
  const MODEL_COLORS: Record<string, string> = {
    first_touch: '#ef4444',
    last_touch: '#f59e0b',
    linear: '#22c55e',
    time_decay: '#3b82f6',
    u_shaped: '#ec4899',
    w_shaped: '#14b8a6',
    data_driven_markov: '#8b5cf6',
    data_driven_shapley: '#a855f7',
  };

  // ─── Loading state ─────────────────────────────────────────────────

  if (isLoading && !dashboardData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-purple-500/20" />
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
          </div>
          <p className="text-sm text-slate-400">
            {nl ? 'Attributiemodellen laden...' : fr ? 'Chargement des modèles d\'attribution...' : 'Loading attribution models...'}
          </p>
        </div>
      </div>
    );
  }

  // ─── Error state ───────────────────────────────────────────────────

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <Shield className="h-10 w-10 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {nl ? 'Opnieuw proberen' : fr ? 'Réessayer' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = dashboardData!;

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 shadow-lg shadow-purple-500/25">
            <GitBranch className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {nl ? 'Multi-Touch Attributie' : fr ? 'Attribution Multi-Touch' : 'Multi-Touch Attribution'}
            </h1>
            <p className="text-sm text-slate-400">
              {nl
                ? 'Begrijp de werkelijke waarde van elk kanaal in de klantreis'
                : fr
                  ? 'Comprenez la vraie valeur de chaque canal dans le parcours client'
                  : 'Understand the true value of each channel in the customer journey'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {activeModelMeta && (
            <Badge className="border-purple-500/30 bg-gradient-to-r from-purple-600/20 to-violet-600/20 px-3 py-1 text-purple-300">
              {activeModelMeta.icon}
              <span className="ml-1.5">
                {nl ? activeModelMeta.labelNl : fr ? activeModelMeta.labelFr : activeModelMeta.label}
              </span>
              {activeModel?.accuracy_score && (
                <span className="ml-1.5 text-xs text-purple-400">
                  {activeModel.accuracy_score.toFixed(1)}%
                </span>
              )}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="border-white/10 text-slate-300 hover:bg-white/5"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* ── Model Selector ─────────────────────────────────────────── */}
      <Card className="border-white/5 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm">
        <CardContent className="py-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
            {nl ? 'Attributiemodel' : fr ? "Modèle d'attribution" : 'Attribution Model'}
          </div>
          <div className="flex flex-wrap gap-2">
            {MODEL_META.map((m) => {
              const isSelected = selectedModel === m.type;
              return (
                <button
                  key={m.type}
                  onClick={() => selectModel(m.type)}
                  disabled={isLoading}
                  className={`
                    inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200
                    ${isSelected
                      ? 'border-purple-500/50 bg-gradient-to-r from-purple-600/30 to-violet-600/30 text-white shadow-lg shadow-purple-500/10'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-slate-200'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {m.icon}
                  <span>{nl ? m.labelNl : fr ? m.labelFr : m.label}</span>
                  {isSelected && m.type.startsWith('data_driven') && (
                    <Badge variant="outline" className="ml-1 border-purple-400/30 bg-purple-500/10 px-1 py-0 text-[10px] text-purple-300">
                      AI
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Stats bar ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: nl ? 'Totale Conversies' : fr ? 'Conversions Totales' : 'Total Conversions',
            value: data.total_conversions.toLocaleString(),
            icon: <Target className="h-5 w-5" />,
            gradient: 'from-emerald-600 to-green-700',
            shadow: 'shadow-emerald-500/20',
            accent: 'text-emerald-400',
          },
          {
            label: nl ? 'Totale Omzet' : fr ? 'Revenu Total' : 'Total Revenue',
            value: formatCompact(data.total_revenue),
            icon: <DollarSign className="h-5 w-5" />,
            gradient: 'from-blue-600 to-cyan-700',
            shadow: 'shadow-blue-500/20',
            accent: 'text-blue-400',
          },
          {
            label: nl ? 'Gem. Touchpoints' : fr ? 'Moy. Points de Contact' : 'Avg Touchpoints',
            value: data.avg_touchpoints_per_conversion.toFixed(1),
            icon: <Layers className="h-5 w-5" />,
            gradient: 'from-violet-600 to-purple-700',
            shadow: 'shadow-violet-500/20',
            accent: 'text-violet-400',
          },
          {
            label: nl ? 'Gem. Dagen tot Conversie' : fr ? 'Moy. Jours Conversion' : 'Avg Days to Conversion',
            value: `${data.avg_days_to_conversion.toFixed(1)}d`,
            icon: <Clock className="h-5 w-5" />,
            gradient: 'from-amber-600 to-orange-700',
            shadow: 'shadow-amber-500/20',
            accent: 'text-amber-400',
          },
        ].map((stat, i) => (
          <Card key={i} className="border-white/5 bg-slate-900/60 backdrop-blur-sm">
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg ${stat.shadow}`}>
                <span className="text-white">{stat.icon}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.accent}`}>{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList className="border-white/5 bg-slate-900/60">
          <TabsTrigger value="channels" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <BarChart3 className="mr-2 h-4 w-4" />
            {nl ? 'Kanaalattributie' : fr ? 'Attribution Canal' : 'Channel Attribution'}
          </TabsTrigger>
          <TabsTrigger value="comparison" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            {nl ? 'Modelvergelijking' : fr ? 'Comparaison Modèles' : 'Model Comparison'}
          </TabsTrigger>
          <TabsTrigger value="journeys" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <Route className="mr-2 h-4 w-4" />
            {nl ? 'Klantreizen' : fr ? 'Parcours Client' : 'Journey Paths'}
          </TabsTrigger>
          <TabsTrigger value="roi" className="data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300">
            <TrendingUp className="mr-2 h-4 w-4" />
            {nl ? 'Kanaal ROI' : fr ? 'ROI Canal' : 'Channel ROI'}
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Channel Attribution ─────────────────────────────── */}
        <TabsContent value="channels" className="space-y-4">
          {/* Bar chart */}
          <Card className="border-white/5 bg-slate-900/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base text-white">
                {nl ? 'Omzet per Kanaal' : fr ? 'Revenu par Canal' : 'Revenue by Channel'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelBarData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => formatCompact(v)}
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomBarTooltip formatCurrency={formatCurrency} />} />
                    <Bar dataKey="revenue" name={nl ? 'Omzet' : fr ? 'Revenu' : 'Revenue'} radius={[0, 6, 6, 0]}>
                      {channelBarData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Attribution table */}
          <Card className="border-white/5 bg-slate-900/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base text-white">
                {nl ? 'Kanaaloverzicht' : fr ? 'Aperçu des Canaux' : 'Channel Overview'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-3">{nl ? 'Kanaal' : fr ? 'Canal' : 'Channel'}</th>
                      <th className="px-3 py-3 text-right">{nl ? 'Conversies' : fr ? 'Conversions' : 'Conversions'}</th>
                      <th className="px-3 py-3 text-right">{nl ? 'Omzet' : fr ? 'Revenu' : 'Revenue'}</th>
                      <th className="px-3 py-3 text-right">{nl ? 'Kosten' : fr ? 'Coût' : 'Cost'}</th>
                      <th className="px-3 py-3 text-right">ROI</th>
                      <th className="px-3 py-3 text-right">{nl ? 'Aandeel' : fr ? 'Part' : 'Share'}</th>
                      <th className="px-3 py-3">{nl ? 'Vertrouwen' : fr ? 'Confiance' : 'Confidence'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedChannels.map((ch) => (
                      <tr key={ch.channel} className="border-b border-white/5 transition-colors hover:bg-white/5">
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ch.color }} />
                            <span className="font-medium text-white">{ch.display_name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-300">
                          {ch.attributed_conversions.toLocaleString()}
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-white">
                          {formatCurrency(ch.attributed_revenue, { compact: true })}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-400">
                          {ch.cost > 0 ? formatCurrency(ch.cost, { compact: true }) : '--'}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Badge variant="outline" className={`text-xs ${roiBadgeClass(ch.roi)}`}>
                            {ch.roi === 999 ? '\u221E' : `${ch.roi}%`}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-right text-slate-300">
                          {ch.percentage_share.toFixed(1)}%
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all duration-500"
                                style={{ width: `${Math.min(ch.confidence, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{ch.confidence.toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Model Comparison ────────────────────────────────── */}
        <TabsContent value="comparison" className="space-y-4">
          {/* Grouped bar chart */}
          <Card className="border-white/5 bg-slate-900/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base text-white">
                {nl ? 'Modelvergelijking per Kanaal' : fr ? 'Comparaison des Modèles par Canal' : 'Model Comparison by Channel'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonBarData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="channel"
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}%`}
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(15,23,42,0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'white', fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`]}
                    />
                    <Legend
                      formatter={(value: string) => MODEL_TYPE_SHORT_LABELS[value as AttributionModelType] || value}
                      wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}
                    />
                    {comparisonModelTypes.map((mt) => (
                      <Bar
                        key={mt}
                        dataKey={mt}
                        name={mt}
                        fill={MODEL_COLORS[mt] || '#6b7280'}
                        radius={[3, 3, 0, 0]}
                        fillOpacity={0.8}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Comparison table */}
          <Card className="border-white/5 bg-slate-900/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base text-white">
                {nl ? 'Gedetailleerde Vergelijking' : fr ? 'Comparaison Détaillée' : 'Detailed Comparison'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-3">{nl ? 'Kanaal' : fr ? 'Canal' : 'Channel'}</th>
                      {comparisonModelTypes.map((mt) => (
                        <th key={mt} className="px-3 py-3 text-center">
                          {MODEL_TYPE_SHORT_LABELS[mt]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {modelComparison.map((mc) => {
                      // Calculate average across models for highlighting
                      const shares = comparisonModelTypes.map((mt) => mc.models[mt]?.percentage_share ?? 0);
                      const validShares = shares.filter((v) => v > 0);
                      const avgShare = validShares.length > 0 ? validShares.reduce((s, v) => s + v, 0) / validShares.length : 0;

                      return (
                        <tr key={mc.channel} className="border-b border-white/5 transition-colors hover:bg-white/5">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: mc.color }} />
                              <span className="font-medium text-white">{mc.channel}</span>
                            </div>
                          </td>
                          {comparisonModelTypes.map((mt) => {
                            const share = mc.models[mt]?.percentage_share ?? 0;
                            const diff = Math.abs(share - avgShare);
                            const isSignificant = diff > 5 && share > 0;
                            return (
                              <td key={mt} className="px-3 py-3 text-center">
                                <span
                                  className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                                    isSignificant
                                      ? share > avgShare
                                        ? 'bg-emerald-500/15 text-emerald-400'
                                        : 'bg-red-500/15 text-red-400'
                                      : 'text-slate-300'
                                  }`}
                                >
                                  {share > 0 ? `${share.toFixed(1)}%` : '--'}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {nl
                  ? 'Gemarkeerde cellen tonen significante afwijkingen (>5%) van het gemiddelde over modellen.'
                  : fr
                    ? 'Les cellules surlignées montrent des écarts significatifs (>5%) par rapport à la moyenne des modèles.'
                    : 'Highlighted cells show significant deviations (>5%) from the average across models.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Journey Paths ───────────────────────────────────── */}
        <TabsContent value="journeys" className="space-y-4">
          <Card className="border-white/5 bg-slate-900/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base text-white">
                {nl ? 'Top Klantreizen' : fr ? 'Meilleurs Parcours Client' : 'Top Customer Journey Paths'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedPaths.map((path) => (
                <div
                  key={path.id}
                  className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-200 hover:border-purple-500/20 hover:bg-white/[0.04]"
                >
                  {/* Journey flow */}
                  <div className="mb-3 flex flex-wrap items-center gap-1">
                    {path.touchpoints.map((tp, idx) => (
                      <React.Fragment key={idx}>
                        <div className="group relative flex flex-col items-center">
                          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-colors group-hover:border-purple-500/30 group-hover:bg-purple-500/10">
                            {tp.channel}
                          </span>
                          <span className="mt-0.5 text-[10px] text-slate-500">{tp.interaction_type}</span>
                        </div>
                        {idx < path.touchpoints.length - 1 && (
                          <ArrowRight className="mx-1 h-4 w-4 shrink-0 text-slate-600" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Journey metadata */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-xs text-purple-300">
                      {path.conversion_type}
                    </Badge>
                    <span className="text-xs font-semibold text-emerald-400">
                      {formatCurrency(path.conversion_value)}
                    </span>
                    <span className="text-xs text-slate-500">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {path.total_duration_days}d
                    </span>
                    <span className="text-xs text-slate-500">
                      <Layers className="mr-1 inline h-3 w-3" />
                      {path.touchpoint_count} {nl ? 'touchpoints' : fr ? 'points de contact' : 'touchpoints'}
                    </span>
                    <span className="text-xs text-slate-500">
                      <TrendingUp className="mr-1 inline h-3 w-3" />
                      {nl ? 'Frequentie' : fr ? 'Fréquence' : 'Frequency'}: <span className="font-medium text-slate-300">{path.frequency}</span>
                    </span>
                  </div>
                </div>
              ))}
              {sortedPaths.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">
                  {nl ? 'Geen klantreizen gevonden.' : fr ? 'Aucun parcours client trouvé.' : 'No journey paths found.'}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Channel ROI ─────────────────────────────────────── */}
        <TabsContent value="roi" className="space-y-4">
          {/* Scatter chart */}
          <Card className="border-white/5 bg-slate-900/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base text-white">
                {nl ? 'Kanaal ROI Analyse' : fr ? 'Analyse ROI Canal' : 'Channel ROI Analysis'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="cost"
                      type="number"
                      name={nl ? 'Kosten' : fr ? 'Coût' : 'Cost'}
                      tickFormatter={(v) => formatCompact(v)}
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                      label={{
                        value: nl ? 'Kosten' : fr ? 'Coût' : 'Cost',
                        position: 'insideBottom',
                        offset: -10,
                        fill: 'rgba(255,255,255,0.4)',
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      dataKey="attributed_revenue"
                      type="number"
                      name={nl ? 'Omzet' : fr ? 'Revenu' : 'Revenue'}
                      tickFormatter={(v) => formatCompact(v)}
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                      label={{
                        value: nl ? 'Omzet' : fr ? 'Revenu' : 'Revenue',
                        angle: -90,
                        position: 'insideLeft',
                        offset: 0,
                        fill: 'rgba(255,255,255,0.4)',
                        fontSize: 12,
                      }}
                    />
                    <ZAxis
                      dataKey="attributed_conversions"
                      type="number"
                      range={[100, 1000]}
                      name={nl ? 'Conversies' : fr ? 'Conversions' : 'Conversions'}
                    />
                    <Tooltip content={<CustomScatterTooltip formatCurrency={formatCurrency} />} />
                    <Scatter data={scatterData} name={nl ? 'Kanalen' : fr ? 'Canaux' : 'Channels'}>
                      {scatterData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} fillOpacity={0.85} stroke={entry.color} strokeWidth={2} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              {/* Legend for scatter */}
              <div className="mt-4 flex flex-wrap justify-center gap-4">
                {scatterData.map((entry) => (
                  <div key={entry.channel} className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs text-slate-400">{entry.channel}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ROI ranking table */}
          <Card className="border-white/5 bg-slate-900/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base text-white">
                {nl ? 'ROI Ranglijst' : fr ? 'Classement ROI' : 'ROI Ranking'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      <th className="px-3 py-3">#</th>
                      <th className="px-3 py-3">{nl ? 'Kanaal' : fr ? 'Canal' : 'Channel'}</th>
                      <th className="px-3 py-3 text-right">{nl ? 'Omzet' : fr ? 'Revenu' : 'Revenue'}</th>
                      <th className="px-3 py-3 text-right">{nl ? 'Kosten' : fr ? 'Coût' : 'Cost'}</th>
                      <th className="px-3 py-3 text-right">{nl ? 'Winst' : fr ? 'Profit' : 'Profit'}</th>
                      <th className="px-3 py-3 text-right">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roiRanking.map((ch, idx) => (
                      <tr key={ch.channel} className="border-b border-white/5 transition-colors hover:bg-white/5">
                        <td className="px-3 py-3">
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            idx === 0 ? 'bg-amber-500/20 text-amber-400' : idx === 1 ? 'bg-slate-400/20 text-slate-300' : idx === 2 ? 'bg-orange-500/20 text-orange-400' : 'text-slate-500'
                          }`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: ch.color }} />
                            <span className="font-medium text-white">{ch.display_name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-white">
                          {formatCurrency(ch.attributed_revenue, { compact: true })}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-400">
                          {ch.cost > 0 ? formatCurrency(ch.cost, { compact: true }) : '--'}
                        </td>
                        <td className="px-3 py-3 text-right text-emerald-400">
                          {ch.cost > 0 ? formatCurrency(ch.attributed_revenue - ch.cost, { compact: true }) : formatCurrency(ch.attributed_revenue, { compact: true })}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <Badge variant="outline" className={`text-xs font-bold ${roiBadgeClass(ch.roi)}`}>
                            {ch.roi === 999 ? '\u221E' : `${ch.roi}%`}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Revenue over time area chart */}
          <Card className="border-white/5 bg-slate-900/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base text-white">
                {nl ? 'Omzet in de Tijd' : fr ? 'Revenu au Fil du Temps' : 'Revenue Over Time'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="conversionsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="date"
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    />
                    <YAxis
                      yAxisId="revenue"
                      tickFormatter={(v) => formatCompact(v)}
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    />
                    <YAxis
                      yAxisId="conversions"
                      orientation="right"
                      stroke="rgba(255,255,255,0.3)"
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                    />
                    <Tooltip content={<CustomAreaTooltip formatCurrency={formatCurrency} />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
                    <Area
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="revenue"
                      name={nl ? 'Omzet' : fr ? 'Revenu' : 'Revenue'}
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fill="url(#revenueGradient)"
                    />
                    <Area
                      yAxisId="conversions"
                      type="monotone"
                      dataKey="conversions"
                      name={nl ? 'Conversies' : fr ? 'Conversions' : 'Conversions'}
                      stroke="#22c55e"
                      strokeWidth={2}
                      fill="url(#conversionsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
