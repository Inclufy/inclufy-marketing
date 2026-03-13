// src/pages/OpportunityIntelligence.tsx
// Opportunity Intelligence — AI discovers trends, events, partnerships & viral topics

import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useOpportunityIntelligence } from '@/hooks/useOpportunityIntelligence';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Lightbulb,
  Loader2,
  RefreshCw,
  TrendingUp,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertTriangle,
  Eye,
  Rocket,
  Search,
  BarChart3,
  Globe,
  Hash,
  Clock,
  Star,
  Target,
  Activity,
  PieChart as PieChartIcon,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Megaphone,
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
  Opportunity,
  OpportunityPriority,
  OpportunityType,
  TrendData,
} from '@/services/context-marketing/opportunity-intelligence.service';

// ─── Helpers ─────────────────────────────────────────────────────────

function getPriorityBadge(priority: OpportunityPriority): {
  color: string;
  label: string;
  labelNl: string;
  labelFr: string;
} {
  switch (priority) {
    case 'critical':
      return {
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
        label: 'Critical',
        labelNl: 'Kritiek',
        labelFr: 'Critique',
      };
    case 'high':
      return {
        color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        label: 'High',
        labelNl: 'Hoog',
        labelFr: 'Haute',
      };
    case 'medium':
      return {
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        label: 'Medium',
        labelNl: 'Gemiddeld',
        labelFr: 'Moyenne',
      };
    case 'low':
      return {
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800',
        label: 'Low',
        labelNl: 'Laag',
        labelFr: 'Basse',
      };
  }
}

function getTypeBadge(type: OpportunityType): {
  color: string;
  label: string;
  icon: React.ReactNode;
} {
  switch (type) {
    case 'trend':
      return { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', label: 'Trend', icon: <TrendingUp className="h-3 w-3" /> };
    case 'viral_topic':
      return { color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300', label: 'Viral', icon: <Zap className="h-3 w-3" /> };
    case 'partnership':
      return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Partnership', icon: <Globe className="h-3 w-3" /> };
    case 'new_market':
      return { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'New Market', icon: <Rocket className="h-3 w-3" /> };
    case 'competitor_gap':
      return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', label: 'Competitor Gap', icon: <Target className="h-3 w-3" /> };
    case 'content_gap':
      return { color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300', label: 'Content Gap', icon: <Search className="h-3 w-3" /> };
    case 'event':
      return { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: 'Event', icon: <Star className="h-3 w-3" /> };
  }
}

function getSentimentBadge(sentiment: TrendData['sentiment']): { color: string; label: string } {
  switch (sentiment) {
    case 'positive':
      return { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: 'Positive' };
    case 'neutral':
      return { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300', label: 'Neutral' };
    case 'negative':
      return { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: 'Negative' };
  }
}

function getBorderColor(priority: OpportunityPriority): string {
  switch (priority) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'medium': return '#3b82f6';
    case 'low': return '#9ca3af';
  }
}

// ─── Main Component ──────────────────────────────────────────────────

export default function OpportunityIntelligence() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { formatCurrency, formatCompact } = useCurrency();
  const { toast } = useToast();
  const {
    opportunities,
    dashboard,
    isLoading,
    error,
    actionOpportunity,
    dismissOpportunity,
    launchCampaign,
    refreshTrends,
    refetch,
  } = useOpportunityIntelligence();

  const [activeTab, setActiveTab] = useState('feed');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actioningIds, setActioningIds] = useState<Set<string>>(new Set());
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);
  const [refreshingTrends, setRefreshingTrends] = useState(false);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleAction = useCallback(async (id: string) => {
    setActioningIds(prev => new Set(prev).add(id));
    try {
      await actionOpportunity(id);
      toast({
        title: nl ? 'Actie genomen' : fr ? 'Action effectuee' : 'Action taken',
        description: nl ? 'Opportunity gemarkeerd als actioned' : fr ? 'Opportunite marquee comme actionnee' : 'Opportunity marked as actioned',
      });
    } catch (err) {
      toast({
        title: nl ? 'Fout' : fr ? 'Erreur' : 'Error',
        description: nl ? 'Kon actie niet uitvoeren' : fr ? 'Impossible d\'effectuer l\'action' : 'Could not perform action',
        variant: 'destructive',
      });
    } finally {
      setActioningIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  }, [actionOpportunity, toast, nl, fr]);

  const handleDismiss = useCallback(async (id: string) => {
    setActioningIds(prev => new Set(prev).add(id));
    try {
      await dismissOpportunity(id);
      toast({
        title: nl ? 'Verwijderd' : fr ? 'Rejete' : 'Dismissed',
        description: nl ? 'Opportunity is verwijderd' : fr ? 'Opportunite rejetee' : 'Opportunity dismissed',
      });
    } catch (err) {
      toast({
        title: nl ? 'Fout' : fr ? 'Erreur' : 'Error',
        description: nl ? 'Kon niet verwijderen' : fr ? 'Impossible de rejeter' : 'Could not dismiss',
        variant: 'destructive',
      });
    } finally {
      setActioningIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  }, [dismissOpportunity, toast, nl, fr]);

  const handleLaunchCampaign = useCallback(async (id: string) => {
    setActioningIds(prev => new Set(prev).add(id));
    try {
      await launchCampaign(id);
      toast({
        title: nl ? 'Campagne gelanceerd!' : fr ? 'Campagne lancee!' : 'Campaign launched!',
        description: nl ? 'Een nieuwe campagne is aangemaakt' : fr ? 'Une nouvelle campagne a ete creee' : 'A new campaign has been created',
      });
    } catch (err) {
      toast({
        title: nl ? 'Fout' : fr ? 'Erreur' : 'Error',
        description: nl ? 'Kon campagne niet lanceren' : fr ? 'Impossible de lancer la campagne' : 'Could not launch campaign',
        variant: 'destructive',
      });
    } finally {
      setActioningIds(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  }, [launchCampaign, toast, nl, fr]);

  const handleRefreshTrends = useCallback(async () => {
    setRefreshingTrends(true);
    try {
      await refreshTrends();
      toast({ title: nl ? 'Trends vernieuwd' : fr ? 'Tendances actualisees' : 'Trends refreshed' });
    } catch (err) {
      toast({ title: nl ? 'Fout' : fr ? 'Erreur' : 'Error', variant: 'destructive' });
    } finally {
      setRefreshingTrends(false);
    }
  }, [refreshTrends, toast, nl, fr]);

  // ─── Derived data ──────────────────────────────────────────────

  const activeTrend = useMemo(() => {
    if (!dashboard?.top_trends?.length) return null;
    if (selectedTrend) return dashboard.top_trends.find(t => t.keyword === selectedTrend) || dashboard.top_trends[0];
    return dashboard.top_trends[0];
  }, [dashboard, selectedTrend]);

  // ─── Loading State ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto" />
          <p className="text-sm text-muted-foreground">
            {nl ? 'Opportunity data laden...' : fr ? 'Chargement des opportunites...' : 'Loading opportunity intelligence...'}
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
      label: nl ? 'Totale Opportunities' : fr ? 'Total Opportunites' : 'Total Opportunities',
      value: dashboard?.total_opportunities?.toLocaleString() ?? '—',
      icon: <Lightbulb className="h-5 w-5" />,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: nl ? 'Nieuw Vandaag' : fr ? 'Nouvelles Aujourd\'hui' : 'New Today',
      value: dashboard?.new_today?.toLocaleString() ?? '—',
      icon: <Sparkles className="h-5 w-5" />,
      color: 'text-fuchsia-600 bg-fuchsia-100 dark:bg-fuchsia-900/30',
    },
    {
      label: nl ? 'Hoge Prioriteit' : fr ? 'Haute Priorite' : 'High Priority',
      value: dashboard?.high_priority?.toLocaleString() ?? '—',
      icon: <Zap className="h-5 w-5" />,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    },
    {
      label: nl ? 'Geschatte Waarde' : fr ? 'Valeur Estimee' : 'Est. Value',
      value: dashboard ? formatCurrency(dashboard.total_estimated_value) : '—',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
  ];

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 p-6 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <Lightbulb className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {nl ? 'Opportunity Intelligence' : fr ? 'Intelligence des Opportunites' : 'Opportunity Intelligence'}
              </h1>
              <p className="text-sm text-white/70 mt-0.5">
                {nl
                  ? 'AI ontdekt trends, events, partnerships en virale topics'
                  : fr
                  ? "L'IA decouvre les tendances, evenements et partenariats"
                  : 'AI discovers trends, events, partnerships & viral topics'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {dashboard && (
              <Badge className="bg-green-500/20 text-green-100 border-green-400/30 px-3 py-1 text-sm">
                <Activity className="h-3.5 w-3.5 mr-1.5" />
                {nl ? 'Actieratio' : fr ? "Taux d'action" : 'Action Rate'}: {dashboard.action_rate}%
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
          <TabsTrigger value="feed" className="gap-1.5">
            <Eye className="h-4 w-4" />
            Feed
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-1.5">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB: Feed                                                   */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="feed" className="mt-6 space-y-4">
          {opportunities.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center space-y-3">
                <Lightbulb className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  {nl ? 'Geen opportunities gevonden' : fr ? 'Aucune opportunite trouvee' : 'No opportunities found'}
                </p>
              </CardContent>
            </Card>
          ) : (
            opportunities.map((opp) => {
              const priorityBadge = getPriorityBadge(opp.priority);
              const typeBadge = getTypeBadge(opp.type);
              const isExpanded = expandedId === opp.id;
              const isActioning = actioningIds.has(opp.id);

              return (
                <Card
                  key={opp.id}
                  className="hover:shadow-lg transition-all duration-200 border-l-4"
                  style={{ borderLeftColor: getBorderColor(opp.priority) }}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-3">
                      {/* Top row: badges + title */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Badge variant="outline" className={`${priorityBadge.color} text-xs`}>
                              {nl ? priorityBadge.labelNl : fr ? priorityBadge.labelFr : priorityBadge.label}
                            </Badge>
                            <Badge variant="outline" className={`${typeBadge.color} text-xs flex items-center gap-1`}>
                              {typeBadge.icon}
                              {typeBadge.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800">
                              <Globe className="h-2.5 w-2.5 mr-1" />
                              {opp.source.split('+')[0].trim()}
                            </Badge>
                            {opp.status === 'actioned' && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {nl ? 'Actie genomen' : fr ? 'Actionne' : 'Actioned'}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-base leading-tight">{opp.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{opp.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(opp.estimated_impact)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {nl ? 'geschatte waarde' : fr ? 'valeur estimee' : 'est. value'}
                          </p>
                        </div>
                      </div>

                      {/* Confidence + Reach */}
                      <div className="flex items-center gap-6 flex-wrap">
                        <div className="flex-1 max-w-xs min-w-[180px]">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">
                              {nl ? 'Betrouwbaarheid' : fr ? 'Confiance' : 'Confidence'}
                            </span>
                            <span className="font-medium">{opp.confidence}%</span>
                          </div>
                          <Progress value={opp.confidence} className="h-2" />
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">{nl ? 'Bereik' : fr ? 'Portee' : 'Reach'}:</span>{' '}
                          <span className="font-medium">{formatCompact(opp.estimated_reach)}</span>
                        </div>
                        {opp.trend_velocity > 0 && (
                          <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            <span className="font-medium">+{opp.trend_velocity}%</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {opp.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-muted/60">
                            <Hash className="h-2.5 w-2.5 mr-0.5" />
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : opp.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
                      >
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {isExpanded
                          ? (nl ? 'Minder tonen' : fr ? 'Voir moins' : 'Show less')
                          : (nl ? 'Meer tonen' : fr ? 'Voir plus' : 'Show more')}
                      </button>

                      {/* Expanded section */}
                      {isExpanded && (
                        <div className="mt-2 space-y-4 border-t pt-4 dark:border-gray-800">
                          {/* Suggested Actions */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                              {nl ? 'Voorgestelde Acties' : fr ? 'Actions Suggerees' : 'Suggested Actions'}
                            </p>
                            <ul className="space-y-1.5">
                              {opp.suggested_actions.map((action, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                  <span>{action}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Related Keywords */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                              {nl ? 'Gerelateerde Keywords' : fr ? 'Mots-cles Lies' : 'Related Keywords'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {opp.related_keywords.map((kw) => (
                                <Badge key={kw} variant="outline" className="text-xs">
                                  {kw}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Data Sources */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                              {nl ? 'Databronnen' : fr ? 'Sources de Donnees' : 'Data Sources'}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {opp.data_sources.map((src) => (
                                <Badge key={src} variant="secondary" className="text-xs">
                                  <ExternalLink className="h-2.5 w-2.5 mr-1" />
                                  {src}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Campaign Suggestion */}
                          {opp.campaign_suggestion && (
                            <Card className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/20 dark:to-fuchsia-950/20 border-purple-200 dark:border-purple-800">
                              <CardContent className="p-4">
                                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                                  <Megaphone className="h-3.5 w-3.5" />
                                  {nl ? 'Campagne Voorstel' : fr ? 'Suggestion de Campagne' : 'Campaign Suggestion'}
                                </p>
                                <p className="font-medium text-sm mb-2">{opp.campaign_suggestion.title}</p>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                  <span>
                                    {nl ? 'Kanalen' : fr ? 'Canaux' : 'Channels'}: {opp.campaign_suggestion.channels.join(', ')}
                                  </span>
                                  <span>
                                    {nl ? 'Budget' : fr ? 'Budget' : 'Budget'}: {formatCurrency(opp.campaign_suggestion.budget)}
                                  </span>
                                  <span>
                                    {opp.campaign_suggestion.duration_days} {nl ? 'dagen' : fr ? 'jours' : 'days'}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        {opp.status !== 'actioned' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAction(opp.id)}
                              disabled={isActioning}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              {isActioning ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              {nl ? 'Actie Nemen' : fr ? 'Actionner' : 'Take Action'}
                            </Button>
                            {opp.campaign_suggestion && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLaunchCampaign(opp.id)}
                                disabled={isActioning}
                                className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/30"
                              >
                                {isActioning ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                ) : (
                                  <Rocket className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                {nl ? 'Campagne Lanceren' : fr ? 'Lancer Campagne' : 'Launch Campaign'}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDismiss(opp.id)}
                              disabled={isActioning}
                              className="text-muted-foreground hover:text-red-600"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1.5" />
                              {nl ? 'Verwijderen' : fr ? 'Rejeter' : 'Dismiss'}
                            </Button>
                          </>
                        )}
                        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(opp.discovered_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB: Trends                                                 */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="trends" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              {nl ? 'Top Trends' : fr ? 'Tendances Principales' : 'Top Trends'}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshTrends}
              disabled={refreshingTrends}
            >
              {refreshingTrends ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {nl ? 'Trends Vernieuwen' : fr ? 'Actualiser Tendances' : 'Refresh Trends'}
            </Button>
          </div>

          {/* Trend Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 dark:bg-muted/10">
                      <th className="text-left p-3 font-medium text-muted-foreground">Keyword</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">Volume</th>
                      <th className="text-right p-3 font-medium text-muted-foreground">
                        {nl ? 'Groei' : fr ? 'Croissance' : 'Growth'}
                      </th>
                      <th className="text-center p-3 font-medium text-muted-foreground">Sentiment</th>
                      <th className="text-left p-3 font-medium text-muted-foreground">
                        {nl ? "Regio's" : fr ? 'Regions' : 'Regions'}
                      </th>
                      <th className="text-center p-3 font-medium text-muted-foreground" />
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboard?.top_trends ?? []).map((trend) => {
                      const sentBadge = getSentimentBadge(trend.sentiment);
                      const isActive = activeTrend?.keyword === trend.keyword;
                      return (
                        <tr
                          key={trend.keyword}
                          className={`border-b last:border-b-0 cursor-pointer transition-colors hover:bg-muted/30 ${
                            isActive ? 'bg-purple-50 dark:bg-purple-950/20' : ''
                          }`}
                          onClick={() => setSelectedTrend(trend.keyword)}
                        >
                          <td className="p-3 font-medium">
                            <div className="flex items-center gap-2">
                              <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                              {trend.keyword}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono">{formatCompact(trend.volume)}</td>
                          <td className="p-3 text-right">
                            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              +{trend.growth_rate}%
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className={`${sentBadge.color} text-xs`}>
                              {sentBadge.label}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {trend.regions.map((r) => (
                                <Badge key={r} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                  {r}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {isActive && <div className="w-2 h-2 rounded-full bg-purple-500 mx-auto" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Trend History Chart */}
          {activeTrend && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  {nl ? 'Trendgeschiedenis' : fr ? 'Historique de Tendance' : 'Trend History'}:{' '}
                  <span className="text-purple-600 dark:text-purple-400">{activeTrend.keyword}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={activeTrend.trend_history}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => formatCompact(v)} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(value: number) => [formatCompact(value), 'Volume']}
                    />
                    <Area
                      type="monotone"
                      dataKey="volume"
                      stroke="#a855f7"
                      strokeWidth={2.5}
                      fill="url(#trendGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Related topics for active trend */}
          {activeTrend && activeTrend.related_topics.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                  {nl ? 'Gerelateerde Topics' : fr ? 'Sujets Lies' : 'Related Topics'} — {activeTrend.keyword}
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeTrend.related_topics.map((topic) => (
                    <Badge key={topic} variant="outline" className="px-3 py-1">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/* TAB: Analytics                                              */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Opportunities by Type — Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-purple-500" />
                  {nl ? 'Opportunities per Type' : fr ? 'Opportunites par Type' : 'Opportunities by Type'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.opportunities_by_type ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashboard.opportunities_by_type}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {dashboard.opportunities_by_type.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        formatter={(value: number, name: string) => [value, name]}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => (
                          <span className="text-xs text-muted-foreground capitalize">
                            {value.replace('_', ' ')}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    {nl ? 'Geen data beschikbaar' : fr ? 'Aucune donnee disponible' : 'No data available'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trend Velocity — Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-fuchsia-500" />
                  {nl ? 'Trend Velocity' : fr ? 'Velocite des Tendances' : 'Trend Velocity'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.trend_velocity ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboard.trend_velocity}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(d: string) => d.split('-').slice(1).join('/')}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                      <Legend iconType="circle" iconSize={8} />
                      <Bar
                        dataKey="opportunities"
                        name={nl ? 'Ontdekt' : fr ? 'Decouvertes' : 'Discovered'}
                        fill="#a855f7"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="actioned"
                        name={nl ? 'Actie genomen' : fr ? 'Actionnees' : 'Actioned'}
                        fill="#ec4899"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    {nl ? 'Geen data beschikbaar' : fr ? 'Aucune donnee disponible' : 'No data available'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/20 dark:to-fuchsia-950/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-5 text-center">
                <Activity className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                  {dashboard?.action_rate ?? 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {nl ? 'Actieratio' : fr ? "Taux d'Action" : 'Action Rate'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/20 dark:to-pink-950/20 border-fuchsia-200 dark:border-fuchsia-800">
              <CardContent className="p-5 text-center">
                <Target className="h-8 w-8 text-fuchsia-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-fuchsia-700 dark:text-fuchsia-300">
                  {dashboard?.avg_confidence?.toFixed(1) ?? 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {nl ? 'Gem. Betrouwbaarheid' : fr ? 'Confiance Moyenne' : 'Avg. Confidence'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-pink-200 dark:border-pink-800">
              <CardContent className="p-5 text-center">
                <TrendingUp className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-pink-700 dark:text-pink-300">
                  {dashboard ? formatCurrency(dashboard.total_estimated_value) : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {nl ? 'Totale Geschatte Waarde' : fr ? 'Valeur Estimee Totale' : 'Total Estimated Value'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Opportunity Type Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                {nl ? 'Type Breakdown' : fr ? 'Repartition par Type' : 'Type Breakdown'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(dashboard?.opportunities_by_type ?? []).map((item) => {
                  const total = dashboard?.total_opportunities ?? 1;
                  const pct = Math.round((item.count / total) * 100);
                  const badge = getTypeBadge(item.type);
                  return (
                    <div key={item.type} className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={`${badge.color} text-xs w-28 justify-center flex items-center gap-1`}
                      >
                        {badge.icon}
                        {badge.label}
                      </Badge>
                      <div className="flex-1">
                        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{item.count}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
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
