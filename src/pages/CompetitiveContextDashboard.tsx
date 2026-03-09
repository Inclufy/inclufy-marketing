// src/components/context-marketing/CompetitiveContextDashboard.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Users,
  Plus,
  RefreshCw,
  Target,
  Sword,
  Shield,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { competitiveContextService, Competitor, CompetitiveAlert } from '@/services/context-marketing/competitive-context.service';
import CompetitorsList from '@/components/context-marketing/CompetitorsList';
import CompetitorAnalysis from '@/components/context-marketing/CompetitorAnalysis';
import PositioningMatrix from '@/components/context-marketing/PositioningMatrix';
import FeatureComparison from '@/components/context-marketing/FeatureComparison';
import CompetitiveAlerts from '@/components/context-marketing/CompetitiveAlerts';
import BattleCards from '@/components/context-marketing/BattleCards';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface CompetitiveInsights {
  totalCompetitors: number;
  directCompetitors: number;
  marketCoverage: number;
  competitiveScore: number;
  unreadAlerts: number;
  lastAnalysis?: string;
}

export default function CompetitiveContextDashboard() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [insights, setInsights] = useState<CompetitiveInsights>({
    totalCompetitors: 0,
    directCompetitors: 0,
    marketCoverage: 0,
    competitiveScore: 0,
    unreadAlerts: 0
  });
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [alerts, setAlerts] = useState<CompetitiveAlert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCompetitiveData();
  }, []);

  const loadCompetitiveData = async () => {
    try {
      setLoading(true);

      const [competitorsList, alertsList, winLoss] = await Promise.all([
        competitiveContextService.getCompetitors(),
        competitiveContextService.getAlerts(true),
        competitiveContextService.getWinLossAnalysis()
      ]);

      setCompetitors(competitorsList);
      setAlerts(alertsList);

      // Calculate insights
      const directCompetitors = competitorsList.filter(c => c.company_type === 'direct').length;
      const totalMarketShare = competitorsList.reduce((sum, c) => sum + (c.market_share || 0), 0);

      setInsights({
        totalCompetitors: competitorsList.length,
        directCompetitors,
        marketCoverage: Math.min(100, totalMarketShare + 20), // Assume we have 20% if not specified
        competitiveScore: winLoss.overall_competitiveness || 0,
        unreadAlerts: alertsList.length,
        lastAnalysis: competitorsList[0]?.last_analyzed
      });

    } catch (error) {
      console.error('Error loading competitive data:', error);
      toast.error(nl ? 'Fout bij laden van concurrentie-informatie' : fr ? '\u00c9chec du chargement des donn\u00e9es concurrentielles' : 'Failed to load competitive intelligence');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCompetitiveData();
    setRefreshing(false);
    toast.success(nl ? 'Concurrentiedata vernieuwd' : fr ? 'Donn\u00e9es concurrentielles actualis\u00e9es' : 'Competitive data refreshed');
  };

  const getCompetitiveStatus = (score: number) => {
    if (score >= 80) return { label: nl ? 'Leidend' : fr ? 'Leader' : 'Leading', color: 'text-green-600' };
    if (score >= 60) return { label: nl ? 'Concurrerend' : fr ? 'Comp\u00e9titif' : 'Competitive', color: 'text-yellow-600' };
    if (score >= 40) return { label: nl ? 'Uitgedaagd' : fr ? 'Contest\u00e9' : 'Challenged', color: 'text-orange-600' };
    return { label: nl ? 'Risico' : fr ? '\u00c0 risque' : 'At Risk', color: 'text-red-600' };
  };

  const status = getCompetitiveStatus(insights.competitiveScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{nl ? 'Concurrentie-intelligentie' : fr ? 'Intelligence Concurrentielle' : 'Competitive Intelligence'}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {nl ? 'Monitor concurrenten en behoud je marktvoordeel' : fr ? 'Surveillez les concurrents et maintenez votre avantage concurrentiel' : 'Monitor competitors and maintain your market advantage'}
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{nl ? 'Totaal Concurrenten' : fr ? 'Total Concurrents' : 'Total Competitors'}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.totalCompetitors}</div>
              <p className="text-xs text-muted-foreground">
                {insights.directCompetitors} {nl ? 'direct' : fr ? 'directs' : 'direct'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{nl ? 'Marktdekking' : fr ? 'Couverture du March\u00e9' : 'Market Coverage'}</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.marketCoverage}%</div>
              <Progress value={insights.marketCoverage} className="mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{nl ? 'Concurrentiescore' : fr ? 'Score Concurrentiel' : 'Competitive Score'}</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${status.color}`}>
                {insights.competitiveScore}%
              </div>
              <Badge variant="secondary" className="mt-1">{status.label}</Badge>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{nl ? 'Ongelezen Meldingen' : fr ? 'Alertes Non Lues' : 'Unread Alerts'}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {insights.unreadAlerts}
              </div>
              <p className="text-xs text-muted-foreground">
                {nl ? 'Vereist aandacht' : fr ? 'N\u00e9cessite une attention' : 'Requires attention'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{nl ? 'Laatste Analyse' : fr ? 'Derni\u00e8re Analyse' : 'Last Analysis'}</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {insights.lastAnalysis
                  ? new Date(insights.lastAnalysis).toLocaleDateString(nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-US')
                  : (nl ? 'Nooit' : fr ? 'Jamais' : 'Never')
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {nl ? 'Automatische monitoring actief' : fr ? 'Surveillance automatique active' : 'Auto-monitoring active'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">{nl ? 'Overzicht' : fr ? 'Aper\u00e7u' : 'Overview'}</TabsTrigger>
          <TabsTrigger value="competitors">{nl ? 'Concurrenten' : fr ? 'Concurrents' : 'Competitors'}</TabsTrigger>
          <TabsTrigger value="analysis">{nl ? 'Analyse' : fr ? 'Analyse' : 'Analysis'}</TabsTrigger>
          <TabsTrigger value="features">{nl ? 'Functies' : fr ? 'Fonctionnalit\u00e9s' : 'Features'}</TabsTrigger>
          <TabsTrigger value="battlecards">{nl ? 'Strijdkaarten' : fr ? 'Fiches de Combat' : 'Battle Cards'}</TabsTrigger>
          <TabsTrigger value="alerts">
            {nl ? 'Meldingen' : fr ? 'Alertes' : 'Alerts'} {alerts.length > 0 && <Badge className="ml-1">{alerts.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Snelle Acties' : fr ? 'Actions Rapides' : 'Quick Actions'}</CardTitle>
              <CardDescription>
                {nl ? 'Veelgebruikte concurrentie-intelligentie taken' : fr ? 'T\u00e2ches courantes d\'intelligence concurrentielle' : 'Common competitive intelligence tasks'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab('competitors')}
                >
                  <Plus className="w-5 h-5" />
                  {nl ? 'Concurrent Toevoegen' : fr ? 'Ajouter un Concurrent' : 'Add Competitor'}
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab('analysis')}
                >
                  <BarChart3 className="w-5 h-5" />
                  {nl ? 'Analyse Bekijken' : fr ? 'Voir l\'Analyse' : 'View Analysis'}
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab('features')}
                >
                  <Shield className="w-5 h-5" />
                  {nl ? 'Functies Vergelijken' : fr ? 'Comparer les Fonctionnalit\u00e9s' : 'Compare Features'}
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab('battlecards')}
                >
                  <Sword className="w-5 h-5" />
                  {nl ? 'Strijdkaarten' : fr ? 'Fiches de Combat' : 'Battle Cards'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Competitive Landscape */}
          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Concurrentielandschap' : fr ? 'Paysage Concurrentiel' : 'Competitive Landscape'}</CardTitle>
              <CardDescription>
                {nl ? 'Marktpositionering in \u00e9\u00e9n oogopslag' : fr ? 'Positionnement sur le march\u00e9 en un coup d\'\u0153il' : 'Market positioning at a glance'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PositioningMatrix competitors={competitors} simplified />
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{nl ? 'Recente Concurrentie-meldingen' : fr ? 'Alertes Concurrentielles R\u00e9centes' : 'Recent Competitive Alerts'}</CardTitle>
                <CardDescription>
                  {nl ? 'Laatste concurrentactiviteiten die aandacht vereisen' : fr ? 'Derni\u00e8res activit\u00e9s des concurrents n\u00e9cessitant une attention' : 'Latest competitor activities requiring attention'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CompetitiveAlerts alerts={alerts.slice(0, 5)} compact />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="competitors" className="space-y-4">
          <CompetitorsList
            competitors={competitors}
            onUpdate={loadCompetitiveData}
          />
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <CompetitorAnalysis
            competitors={competitors}
            onUpdate={loadCompetitiveData}
          />
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <FeatureComparison
            competitors={competitors}
            onUpdate={loadCompetitiveData}
          />
        </TabsContent>

        <TabsContent value="battlecards" className="space-y-4">
          <BattleCards
            competitors={competitors}
            onUpdate={loadCompetitiveData}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <CompetitiveAlerts
            alerts={alerts}
            onUpdate={loadCompetitiveData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
