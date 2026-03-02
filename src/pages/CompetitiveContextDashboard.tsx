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

interface CompetitiveInsights {
  totalCompetitors: number;
  directCompetitors: number;
  marketCoverage: number;
  competitiveScore: number;
  unreadAlerts: number;
  lastAnalysis?: string;
}

export default function CompetitiveContextDashboard() {
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
      toast.error('Failed to load competitive intelligence');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCompetitiveData();
    setRefreshing(false);
    toast.success('Competitive data refreshed');
  };

  const getCompetitiveStatus = (score: number) => {
    if (score >= 80) return { label: 'Leading', color: 'text-green-600' };
    if (score >= 60) return { label: 'Competitive', color: 'text-yellow-600' };
    if (score >= 40) return { label: 'Challenged', color: 'text-orange-600' };
    return { label: 'At Risk', color: 'text-red-600' };
  };

  const status = getCompetitiveStatus(insights.competitiveScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Competitive Intelligence</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor competitors and maintain your market advantage
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
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
              <CardTitle className="text-sm font-medium">Total Competitors</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{insights.totalCompetitors}</div>
              <p className="text-xs text-muted-foreground">
                {insights.directCompetitors} direct
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
              <CardTitle className="text-sm font-medium">Market Coverage</CardTitle>
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
              <CardTitle className="text-sm font-medium">Competitive Score</CardTitle>
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
              <CardTitle className="text-sm font-medium">Unread Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {insights.unreadAlerts}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
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
              <CardTitle className="text-sm font-medium">Last Analysis</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {insights.lastAnalysis 
                  ? new Date(insights.lastAnalysis).toLocaleDateString()
                  : 'Never'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Auto-monitoring active
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="battlecards">Battle Cards</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts {alerts.length > 0 && <Badge className="ml-1">{alerts.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common competitive intelligence tasks
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
                  Add Competitor
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab('analysis')}
                >
                  <BarChart3 className="w-5 h-5" />
                  View Analysis
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab('features')}
                >
                  <Shield className="w-5 h-5" />
                  Compare Features
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setActiveTab('battlecards')}
                >
                  <Sword className="w-5 h-5" />
                  Battle Cards
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Competitive Landscape */}
          <Card>
            <CardHeader>
              <CardTitle>Competitive Landscape</CardTitle>
              <CardDescription>
                Market positioning at a glance
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
                <CardTitle>Recent Competitive Alerts</CardTitle>
                <CardDescription>
                  Latest competitor activities requiring attention
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