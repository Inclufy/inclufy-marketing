// src/pages/MarketIntelligence.tsx
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  TrendingUp,
  Globe,
  Users,
  Search,
  AlertCircle,
  Sparkles,
  Target,
  Activity,
  Clock,
  Filter,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Hash,
  MessageSquare,
  Shield
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAnalyticsDashboard } from '@/hooks/queries/useAnalytics';
import { LoadingSkeleton, ErrorState } from '@/components/DataState';

// ─── Types ──────────────────────────────────────────────────────────

interface TrendData {
  topic: string;
  growth: number;
  volume: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
}

interface CompetitorUpdate {
  company: string;
  type: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  date: string;
}

interface MarketInsight {
  title: string;
  description: string;
  source: string;
  relevance: number;
  category: string;
  date: string;
}

export default function MarketIntelligence() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch real dashboard stats to enrich market data
  const { data: dashboardStats, isLoading, isError, refetch } = useAnalyticsDashboard();

  const trends: TrendData[] = dashboardStats?.market_trends ?? [];
  const competitorUpdates: CompetitorUpdate[] = dashboardStats?.competitor_updates ?? [];
  const marketInsights: MarketInsight[] = dashboardStats?.market_insights ?? [];

  // Real data from API
  const activeCampaigns = dashboardStats?.active_campaigns ?? 0;
  const totalContacts = dashboardStats?.total_contacts ?? 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({
      title: nl ? "Marktintelligentie bijgewerkt" : fr ? "Intelligence de marché mise à jour" : "Market intelligence updated",
      description: nl ? "Laatste marktdata is opgehaald." : fr ? "Les dernières données de marché ont été récupérées." : "Latest market data has been fetched.",
    });
  };

  if (isLoading) return <LoadingSkeleton cards={4} />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="w-full py-2">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{nl ? 'Marktintelligentie' : fr ? 'Intelligence de Marché' : 'Market Intelligence'}</h1>
              <p className="text-gray-600">{nl ? 'Realtime marktinzichten en concurrentie-intelligentie' : fr ? 'Informations de marché en temps réel et intelligence concurrentielle' : 'Real-time market insights and competitive intelligence'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="24h">{nl ? 'Laatste 24 uur' : fr ? 'Dernières 24 heures' : 'Last 24 hours'}</option>
              <option value="7d">{nl ? 'Laatste 7 dagen' : fr ? '7 derniers jours' : 'Last 7 days'}</option>
              <option value="30d">{nl ? 'Laatste 30 dagen' : fr ? '30 derniers jours' : 'Last 30 days'}</option>
              <option value="90d">{nl ? 'Laatste 90 dagen' : fr ? '90 derniers jours' : 'Last 90 days'}</option>
            </select>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder={nl ? "Zoek trends, bedrijven of onderwerpen..." : fr ? "Rechercher des tendances, entreprises ou sujets..." : "Search trends, companies, or topics..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-32"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              {nl ? 'Filters' : fr ? 'Filtres' : 'Filters'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">{nl ? 'Overzicht' : fr ? 'Aperçu' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="trends">{nl ? 'Markttrends' : fr ? 'Tendances du Marché' : 'Market Trends'}</TabsTrigger>
          <TabsTrigger value="competitors">{nl ? 'Concurrenten' : fr ? 'Concurrents' : 'Competitors'}</TabsTrigger>
          <TabsTrigger value="insights">{nl ? 'Inzichten' : fr ? 'Insights' : 'Insights'}</TabsTrigger>
          <TabsTrigger value="alerts">{nl ? 'Meldingen' : fr ? 'Alertes' : 'Alerts'}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{nl ? 'Marktgroei' : fr ? 'Croissance du Marché' : 'Market Growth'}</p>
                    <p className="text-2xl font-bold">+23.5%</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <ChevronUp className="w-3 h-3" />
                      5.2% {nl ? 't.o.v. vorige maand' : fr ? 'vs mois dernier' : 'vs last month'}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{nl ? 'Concurrentiebewegingen' : fr ? 'Mouvements Concurrentiels' : 'Competitor Moves'}</p>
                    <p className="text-2xl font-bold">{competitorUpdates.length}</p>
                    <p className="text-xs text-gray-600 mt-1">{nl ? 'Deze week' : fr ? 'Cette semaine' : 'This week'}</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{nl ? 'Trending Onderwerpen' : fr ? 'Sujets Tendance' : 'Trending Topics'}</p>
                    <p className="text-2xl font-bold">{trends.length}</p>
                    <p className="text-xs text-gray-600 mt-1">{nl ? 'Worden gevolgd' : fr ? 'En suivi' : 'Being tracked'}</p>
                  </div>
                  <Hash className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{nl ? 'Actieve Campagnes' : fr ? 'Campagnes Actives' : 'Active Campaigns'}</p>
                    <p className="text-2xl font-bold">{activeCampaigns}</p>
                    <p className="text-xs text-gray-600 mt-1">{totalContacts.toLocaleString()} {nl ? 'contacten' : fr ? 'contacts' : 'contacts'}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trending Now */}
          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Trending in Jouw Branche' : fr ? 'Tendances dans Votre Secteur' : 'Trending in Your Industry'}</CardTitle>
              <CardDescription>{nl ? 'Snelst groeiende onderwerpen en gesprekken' : fr ? 'Sujets et conversations à plus forte croissance' : 'Top growing topics and conversations'}</CardDescription>
            </CardHeader>
            <CardContent>
              {trends.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  {nl ? 'Nog geen trenddata beschikbaar' : fr ? 'Pas encore de données de tendance' : 'No trend data available yet'}
                </p>
              ) : (
                <div className="space-y-4">
                  {trends.slice(0, 3).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                        <div>
                          <p className="font-medium">{trend.topic}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {trend.category}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {trend.volume.toLocaleString()} {nl ? 'vermeldingen' : fr ? 'mentions' : 'mentions'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 ${
                          trend.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {trend.growth > 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          <span className="font-medium">{Math.abs(trend.growth)}%</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Competitor Activity */}
          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Recente Concurrentieactiviteit' : fr ? 'Activité Concurrentielle Récente' : 'Recent Competitor Activity'}</CardTitle>
              <CardDescription>{nl ? 'Laatste bewegingen van je concurrenten' : fr ? 'Derniers mouvements de la concurrence' : 'Latest moves from your competition'}</CardDescription>
            </CardHeader>
            <CardContent>
              {competitorUpdates.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  {nl ? 'Nog geen concurrentie-updates' : fr ? 'Pas encore de mises à jour concurrentielles' : 'No competitor updates yet'}
                </p>
              ) : (
                <div className="space-y-3">
                  {competitorUpdates.map((update, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        update.impact === 'high' ? 'bg-red-500' :
                        update.impact === 'medium' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{update.company}</span>
                          <Badge variant="secondary" className="text-xs">
                            {update.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{update.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{update.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Trends Tab */}
        <TabsContent value="trends" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{nl ? 'Groeitrends' : fr ? 'Tendances de Croissance' : 'Growth Trends'}</CardTitle>
                <CardDescription>{nl ? 'Onderwerpen met snelle groei' : fr ? 'Sujets en forte croissance' : 'Topics experiencing rapid growth'}</CardDescription>
              </CardHeader>
              <CardContent>
                {trends.filter(t => t.growth > 0).length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">
                    {nl ? 'Nog geen groeitrends beschikbaar' : fr ? 'Pas encore de tendances de croissance' : 'No growth trends available yet'}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {trends.filter(t => t.growth > 0).map((trend, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{trend.topic}</span>
                          <span className="text-green-600 font-medium">+{trend.growth}%</span>
                        </div>
                        <Progress value={trend.growth} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{trend.volume.toLocaleString()} {nl ? 'vermeldingen' : fr ? 'mentions' : 'mentions'}</span>
                          <Badge
                            variant={trend.sentiment === 'positive' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {trend.sentiment}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{nl ? 'Branchesentiment' : fr ? 'Sentiment du Secteur' : 'Industry Sentiment'}</CardTitle>
                <CardDescription>{nl ? 'Algehele marktsentimentanalyse' : fr ? 'Analyse globale du sentiment du marché' : 'Overall market sentiment analysis'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-700">78%</p>
                        <p className="text-sm text-green-600">{nl ? 'Positief' : fr ? 'Positif' : 'Positive'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{nl ? 'Positieve Vermeldingen' : fr ? 'Mentions Positives' : 'Positive Mentions'}</span>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{nl ? 'Neutrale Vermeldingen' : fr ? 'Mentions Neutres' : 'Neutral Mentions'}</span>
                      <span className="text-sm font-medium">17%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{nl ? 'Negatieve Vermeldingen' : fr ? 'Mentions Négatives' : 'Negative Mentions'}</span>
                      <span className="text-sm font-medium">5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Categorie-analyse' : fr ? 'Analyse par Catégorie' : 'Category Analysis'}</CardTitle>
              <CardDescription>{nl ? 'Prestaties per marktcategorie' : fr ? 'Performance par catégorie de marché' : 'Performance by market category'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Technology', 'Content', 'Strategy'].map(category => (
                  <div key={category} className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3">{category}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{nl ? 'Groeipercentage' : fr ? 'Taux de Croissance' : 'Growth Rate'}</span>
                        <span className="font-medium text-green-600">+45%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>{nl ? 'Volume' : fr ? 'Volume' : 'Volume'}</span>
                        <span className="font-medium">28.5K</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>{nl ? 'Betrokkenheid' : fr ? 'Engagement' : 'Engagement'}</span>
                        <span className="font-medium">{nl ? 'Hoog' : fr ? 'Élevé' : 'High'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Concurrentiebewaking' : fr ? 'Surveillance Concurrentielle' : 'Competitor Monitoring'}</CardTitle>
              <CardDescription>{nl ? 'Volg concurrentieactiviteiten en -strategieën' : fr ? 'Suivez les activités et stratégies concurrentielles' : 'Track competitor activities and strategies'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Competitor A', 'Competitor B', 'Competitor C'].map(company => (
                  <div key={company} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{company}</h4>
                      <Badge>{nl ? 'Actief' : fr ? 'Actif' : 'Active'}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">{nl ? 'Recente Activiteit' : fr ? 'Activité Récente' : 'Recent Activity'}</p>
                        <p className="font-medium">{nl ? '12 updates' : fr ? '12 mises à jour' : '12 updates'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{nl ? 'Marktaandeel' : fr ? 'Part de Marché' : 'Market Share'}</p>
                        <p className="font-medium">23.5%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{nl ? 'Groei' : fr ? 'Croissance' : 'Growth'}</p>
                        <p className="font-medium text-green-600">+15%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{nl ? 'Dreigingsniveau' : fr ? 'Niveau de Menace' : 'Threat Level'}</p>
                        <p className="font-medium text-orange-600">{nl ? 'Gemiddeld' : fr ? 'Moyen' : 'Medium'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Concurrentievoordelen' : fr ? 'Avantages Concurrentiels' : 'Competitive Advantages'}</CardTitle>
              <CardDescription>{nl ? 'Hoe je je verhoudt tot de concurrentie' : fr ? 'Comment vous vous comparez à la concurrence' : 'How you compare to the competition'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { feature: 'AI Capabilities', you: 85, competitors: 65 },
                  { feature: 'Price Competitiveness', you: 70, competitors: 75 },
                  { feature: 'Customer Satisfaction', you: 90, competitors: 80 },
                  { feature: 'Market Presence', you: 60, competitors: 85 }
                ].map(comparison => (
                  <div key={comparison.feature} className="space-y-2">
                    <p className="text-sm font-medium">{comparison.feature}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>{nl ? 'Jij' : fr ? 'Vous' : 'You'}</span>
                          <span>{comparison.you}%</span>
                        </div>
                        <Progress value={comparison.you} className="h-2 bg-purple-100">
                          <div className="h-full bg-purple-600 rounded-full" style={{ width: `${comparison.you}%` }} />
                        </Progress>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>{nl ? 'Gem. Concurrent' : fr ? 'Concurrent Moyen' : 'Avg Competitor'}</span>
                          <span>{comparison.competitors}%</span>
                        </div>
                        <Progress value={comparison.competitors} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                {nl ? 'AI-gegenereerde Marktinzichten' : fr ? 'Insights de Marché Générés par IA' : 'AI-Generated Market Insights'}
              </CardTitle>
              <CardDescription>{nl ? 'Strategische inzichten op basis van marktanalyse' : fr ? 'Insights stratégiques basés sur l\'analyse de marché' : 'Strategic insights based on market analysis'}</CardDescription>
            </CardHeader>
            <CardContent>
              {marketInsights.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  {nl ? 'Nog geen marktinzichten beschikbaar' : fr ? 'Pas encore d\'insights de marché' : 'No market insights available yet'}
                </p>
              ) : (
                <div className="space-y-4">
                  {marketInsights.map((insight, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <Badge variant="outline" className="text-xs">
                              {insight.category}
                            </Badge>
                            <span className="text-xs text-gray-500">{insight.source}</span>
                            <span className="text-xs text-gray-500">{insight.date}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs text-gray-600">{nl ? 'Relevantie' : fr ? 'Pertinence' : 'Relevance'}</p>
                          <p className="text-2xl font-bold text-purple-600">{insight.relevance}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{nl ? 'Kansenradar' : fr ? 'Radar d\'Opportunités' : 'Opportunity Radar'}</CardTitle>
                <CardDescription>{nl ? 'Opkomende kansen in jouw markt' : fr ? 'Opportunités émergentes dans votre marché' : 'Emerging opportunities in your market'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">{nl ? 'Hoge Prioriteit' : fr ? 'Priorité Élevée' : 'High Priority'}</span>
                    </div>
                    <p className="text-sm text-green-800">
                      {nl ? 'Vraag naar videocontent stijgt 200% - overweeg videomarketing functies' : fr ? 'La demande de contenu vidéo augmente de 200% - envisagez des fonctionnalités de marketing vidéo' : 'Video content demand increasing 200% - consider video marketing features'}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">{nl ? 'Marktlacune' : fr ? 'Lacune du Marché' : 'Market Gap'}</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      {nl ? 'Beperkte concurrentie in AI-gestuurde lokale marketingoplossingen' : fr ? 'Concurrence limitée dans les solutions de marketing local alimentées par IA' : 'Limited competition in AI-powered local marketing solutions'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{nl ? 'Risicomonitor' : fr ? 'Moniteur de Risques' : 'Risk Monitor'}</CardTitle>
                <CardDescription>{nl ? 'Potentiële bedreigingen om te volgen' : fr ? 'Menaces potentielles à surveiller' : 'Potential threats to monitor'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-red-900">{nl ? 'Hoog Risico' : fr ? 'Risque Élevé' : 'High Risk'}</span>
                    </div>
                    <p className="text-sm text-red-800">
                      {nl ? 'Grote concurrent lanceert vergelijkbare AI-functies volgende maand' : fr ? 'Un concurrent majeur lance des fonctionnalités IA similaires le mois prochain' : 'Major competitor launching similar AI features next month'}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-900">{nl ? 'In de gaten houden' : fr ? 'À Surveiller' : 'Watch'}</span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      {nl ? 'Privacyregelgeving kan dataverzameling beïnvloeden' : fr ? 'Les réglementations sur la vie privée peuvent impacter la collecte de données' : 'Privacy regulations may impact data collection practices'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Actieve Meldingen' : fr ? 'Alertes Actives' : 'Active Alerts'}</CardTitle>
              <CardDescription>{nl ? 'Belangrijke marktveranderingen die aandacht vereisen' : fr ? 'Changements de marché importants nécessitant attention' : 'Important market changes requiring attention'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900">{nl ? 'Concurrentiedreiging' : fr ? 'Menace Concurrentielle' : 'Competitive Threat'}</h4>
                    <p className="text-sm text-red-800 mt-1">
                      {nl ? 'Concurrent A kondigde 40% prijsverlaging aan op enterprise plannen' : fr ? 'Le concurrent A a annoncé une réduction de prix de 40% sur les plans entreprise' : 'Competitor A announced 40% price reduction on enterprise plans'}
                    </p>
                    <p className="text-xs text-red-600 mt-2">{nl ? '2 uur geleden' : fr ? 'Il y a 2 heures' : '2 hours ago'}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-600">
                    {nl ? 'Details Bekijken' : fr ? 'Voir les Détails' : 'View Details'}
                  </Button>
                </div>

                <div className="flex items-start gap-3 p-4 border-l-4 border-orange-500 bg-orange-50 rounded-r-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-900">{nl ? 'Marktverschuiving' : fr ? 'Changement de Marché' : 'Market Shift'}</h4>
                    <p className="text-sm text-orange-800 mt-1">
                      {nl ? 'AI-marketingadoptie versnelt sneller dan verwacht' : fr ? 'L\'adoption du marketing IA s\'accélère plus vite que prévu' : 'AI marketing adoption accelerating faster than projected'}
                    </p>
                    <p className="text-xs text-orange-600 mt-2">{nl ? '5 uur geleden' : fr ? 'Il y a 5 heures' : '5 hours ago'}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-orange-600">
                    {nl ? 'Details Bekijken' : fr ? 'Voir les Détails' : 'View Details'}
                  </Button>
                </div>

                <div className="flex items-start gap-3 p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900">{nl ? 'Klantentrend' : fr ? 'Tendance Client' : 'Customer Trend'}</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      {nl ? 'Groeiende vraag naar privacygerichte marketingoplossingen' : fr ? 'Demande croissante de solutions marketing axées sur la vie privée' : 'Increasing demand for privacy-focused marketing solutions'}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">{nl ? '1 dag geleden' : fr ? 'Il y a 1 jour' : '1 day ago'}</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-blue-600">
                    {nl ? 'Details Bekijken' : fr ? 'Voir les Détails' : 'View Details'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Meldinginstellingen' : fr ? 'Paramètres d\'Alertes' : 'Alert Settings'}</CardTitle>
              <CardDescription>{nl ? 'Configureer je marktintelligentie meldingen' : fr ? 'Configurez vos alertes d\'intelligence de marché' : 'Configure your market intelligence alerts'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'Competitor Updates', label: nl ? 'Concurrentie-updates' : fr ? 'Mises à jour Concurrentielles' : 'Competitor Updates', icon: Users, enabled: true },
                  { type: 'Market Trends', label: nl ? 'Markttrends' : fr ? 'Tendances du Marché' : 'Market Trends', icon: TrendingUp, enabled: true },
                  { type: 'Technology Changes', label: nl ? 'Technologische Veranderingen' : fr ? 'Changements Technologiques' : 'Technology Changes', icon: Sparkles, enabled: false },
                  { type: 'Regulatory Updates', label: nl ? 'Regelgeving Updates' : fr ? 'Mises à jour Réglementaires' : 'Regulatory Updates', icon: Shield, enabled: true },
                  { type: 'Customer Sentiment', label: nl ? 'Klantsentiment' : fr ? 'Sentiment Client' : 'Customer Sentiment', icon: MessageSquare, enabled: false }
                ].map(alert => (
                  <div key={alert.type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <alert.icon className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">{alert.label}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked={alert.enabled}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
