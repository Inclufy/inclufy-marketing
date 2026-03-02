// src/components/context-marketing/PatternInsightsDashboard.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Activity,
  BarChart3,
  Target,
  RefreshCw,
  Play,
  Clock,
  Filter,
  Download,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  patternRecognitionService, 
  DetectedPattern, 
  Insight, 
  PatternDetectionRun 
} from '@/services/context-marketing/pattern-recognition.service';
import { insightsService, InsightStats } from '@/services/context-marketing/insights.service';
import PatternsView from './PatternRecognition';
import InsightsView from './InsightsDashboard';
import ContentIntelligence from './ContentIntelligence';
import InsightDetails from './InsightDetails';
import { toast } from 'sonner';

interface DashboardMetrics {
  totalPatterns: number;
  activePatterns: number;
  totalInsights: number;
  actionableInsights: number;
  avgImpactScore: number;
  lastDetectionRun?: PatternDetectionRun;
}

export default function PatternInsightsDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalPatterns: 0,
    activePatterns: 0,
    totalInsights: 0,
    actionableInsights: 0,
    avgImpactScore: 0
  });
  const [insightStats, setInsightStats] = useState<InsightStats | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [runningDetection, setRunningDetection] = useState(false);
  const [recentPatterns, setRecentPatterns] = useState<DetectedPattern[]>([]);
  const [topInsights, setTopInsights] = useState<Insight[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [patterns, insights, stats, runs, recentPatternsData, topInsightsData] = await Promise.all([
        patternRecognitionService.getDetectedPatterns(),
        insightsService.getInsights({ status: 'all' }),
        insightsService.getInsightStats(),
        patternRecognitionService.getDetectionRuns(1),
        patternRecognitionService.getDetectedPatterns(undefined, 'active'),
        insightsService.getInsights({ limit: 5, minImpactScore: 70 })
      ]);

      const activePatterns = patterns.filter(p => p.status === 'active');
      const actionableInsights = insights.filter(i => 
        i.status === 'new' || i.status === 'reviewed'
      );

      setMetrics({
        totalPatterns: patterns.length,
        activePatterns: activePatterns.length,
        totalInsights: insights.length,
        actionableInsights: actionableInsights.length,
        avgImpactScore: stats.averageImpactScore,
        lastDetectionRun: runs[0]
      });

      setInsightStats(stats);
      setRecentPatterns(recentPatternsData.slice(0, 5));
      setTopInsights(topInsightsData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load pattern & insights data');
    } finally {
      setLoading(false);
    }
  };

  const runPatternDetection = async () => {
    try {
      setRunningDetection(true);
      toast.info('Starting pattern detection...');

      const result = await patternRecognitionService.runPatternDetection(['all']);

      toast.success(`Detection complete! Found ${result.patterns_detected} patterns and generated ${result.insights_generated} insights.`);
      
      // Reload dashboard data
      await loadDashboardData();
    } catch (error) {
      console.error('Error running pattern detection:', error);
      toast.error('Pattern detection failed');
    } finally {
      setRunningDetection(false);
    }
  };

  const getPatternIcon = (type: string) => {
    switch (type) {
      case 'anomaly': return <AlertTriangle className="w-4 h-4" />;
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'opportunity': return <Sparkles className="w-4 h-4" />;
      case 'risk': return <AlertTriangle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getPatternColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getInsightBadgeVariant = (type: string) => {
    switch (type) {
      case 'opportunity': return 'default';
      case 'risk': return 'destructive';
      case 'recommendation': return 'secondary';
      case 'anomaly': return 'outline';
      default: return 'secondary';
    }
  };

  if (selectedInsight) {
    return (
      <InsightDetails
        insightId={selectedInsight.id}
        onBack={() => {
          setSelectedInsight(null);
          loadDashboardData();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pattern Recognition & Insights</h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered analysis discovering hidden patterns and opportunities
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={runPatternDetection} 
            disabled={runningDetection}
          >
            {runningDetection ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Detection
              </>
            )}
          </Button>
          <Button variant="outline" onClick={loadDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
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
              <CardTitle className="text-sm font-medium">Active Patterns</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activePatterns}</div>
              <p className="text-xs text-muted-foreground">
                of {metrics.totalPatterns} total
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
              <CardTitle className="text-sm font-medium">Actionable Insights</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {metrics.actionableInsights}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready to implement
              </p>
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
              <CardTitle className="text-sm font-medium">Avg Impact Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.avgImpactScore.toFixed(0)}%
              </div>
              <Progress value={metrics.avgImpactScore} className="mt-2" />
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
              <CardTitle className="text-sm font-medium">Total Insights</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalInsights}</div>
              <p className="text-xs text-muted-foreground">
                Generated to date
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
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {metrics.lastDetectionRun ? 
                  new Date(metrics.lastDetectionRun.started_at).toLocaleDateString() :
                  'Never'
                }
              </div>
              {metrics.lastDetectionRun && (
                <p className="text-xs text-muted-foreground">
                  {metrics.lastDetectionRun.patterns_detected} patterns found
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="insights">
            Insights {metrics.actionableInsights > 0 && (
              <Badge className="ml-1" variant="secondary">
                {metrics.actionableInsights}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="content">Content Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Patterns */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Patterns Detected</CardTitle>
                  <CardDescription>
                    Latest patterns identified across all domains
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab('patterns')}
                >
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPatterns.map((pattern, index) => (
                  <motion.div
                    key={pattern.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-start gap-3 p-3 rounded-lg ${getPatternColor(pattern.impact_level || 'medium')}`}
                  >
                    <div className="mt-1">
                      {getPatternIcon(pattern.pattern_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{pattern.pattern_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {pattern.domain}
                        </Badge>
                        {pattern.confidence_score && (
                          <Badge variant="secondary" className="text-xs">
                            {pattern.confidence_score}% confidence
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {pattern.pattern_description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Detected {new Date(pattern.first_detected).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {recentPatterns.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No patterns detected yet</p>
                    <p className="text-sm mt-2">Run pattern detection to discover insights</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Insights */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>High-Impact Insights</CardTitle>
                  <CardDescription>
                    Most valuable insights requiring attention
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setActiveTab('insights')}
                >
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topInsights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedInsight(insight)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getInsightBadgeVariant(insight.insight_type)}>
                            {insight.insight_type}
                          </Badge>
                          <Badge variant="outline">
                            {insight.category}
                          </Badge>
                          {insight.urgency && (
                            <Badge 
                              variant={insight.urgency === 'immediate' ? 'destructive' : 'secondary'}
                            >
                              {insight.urgency}
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold mb-1">{insight.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {insight.key_finding}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-purple-600">
                          {insight.impact_score}
                        </div>
                        <p className="text-xs text-gray-500">Impact</p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {topInsights.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No insights generated yet</p>
                    <p className="text-sm mt-2">Patterns will generate actionable insights</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Insight Statistics */}
          {insightStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">By Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(insightStats.byType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{type}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">By Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(insightStats.byCategory)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{category}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">By Urgency</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(insightStats.byUrgency).map(([urgency, count]) => (
                      <div key={urgency} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{urgency}</span>
                        <Badge 
                          variant={urgency === 'immediate' ? 'destructive' : 'secondary'}
                        >
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">By Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(insightStats.byStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{status}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pattern Detection Info */}
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertTitle>Automated Pattern Detection</AlertTitle>
            <AlertDescription>
              Our AI continuously analyzes your business, product, and competitive data to identify 
              patterns, anomalies, and opportunities. Run detection manually or schedule automatic runs 
              to stay ahead of trends and risks.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="patterns">
          <PatternsView />
        </TabsContent>

        <TabsContent value="insights">
          <InsightsView onSelectInsight={setSelectedInsight} />
        </TabsContent>

        <TabsContent value="content">
          <ContentIntelligence />
        </TabsContent>
      </Tabs>
    </div>
  );
}