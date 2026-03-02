// src/components/context-marketing/AnalyticsDashboard.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Target,
  Users,
  DollarSign,
  FileText,
  Calendar,
  Plus,
  RefreshCw,
  Download,
  Settings,
  ChevronRight,
  Activity,
  PieChart,
  Eye,
  Brain,
  Zap,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle
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
  analyticsService,
  MetricDefinition,
  AnalyticsDashboard as DashboardType
} from '@/services/context-marketing/analytics.service';
import { reportingService } from '@/services/context-marketing/reporting.service';
import MetricsDashboard from './MetricsDashboard';
import DashboardBuilder from './DashboardBuilder';
import ReportsView from './ReportsView';
import PredictiveAnalytics from './PredictiveAnalytics';
import ExperimentsView from './ExperimentsView';
import { toast } from 'sonner';
import { ContextHealthScore } from './ContextHealthScore';

interface DashboardMetrics {
  totalMetrics: number;
  activeGoals: number;
  runningExperiments: number;
  scheduledReports: number;
  dataQualityScore: number;
  predictionAccuracy: number;
  dashboardCount: number;
  lastReportDate?: string;
}

interface MetricSummary {
  metric: MetricDefinition;
  currentValue: number;
  previousValue: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
}

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalMetrics: 0,
    activeGoals: 0,
    runningExperiments: 0,
    scheduledReports: 0,
    dataQualityScore: 0,
    predictionAccuracy: 0,
    dashboardCount: 0
  });
  const [keyMetrics, setKeyMetrics] = useState<MetricSummary[]>([]);
  const [dashboards, setDashboards] = useState<DashboardType[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<string>('');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      const [
        metricDefs,
        goals,
        experiments,
        reports,
        dashboardsList,
        dataQuality
      ] = await Promise.all([
        analyticsService.getMetricDefinitions(),
        analyticsService.getGoals('active'),
        analyticsService.getExperiments(),
        reportingService.getScheduledReports(),
        analyticsService.getDashboards(),
        reportingService.runDataQualityCheck()
      ]);

      // Calculate metrics
      setMetrics({
        totalMetrics: metricDefs.length,
        activeGoals: goals.filter(g => g.status === 'on_track' || g.status === 'at_risk').length,
        runningExperiments: experiments.filter(e => e.status === 'running').length,
        scheduledReports: reports.filter(r => r.is_active).length,
        dataQualityScore: Math.round(
          dataQuality.reduce((sum, dq) => sum + dq.overall_score, 0) / dataQuality.length
        ),
        predictionAccuracy: 85, // Placeholder
        dashboardCount: dashboardsList.length,
        lastReportDate: reports[0]?.last_generated_at
      });

      setDashboards(dashboardsList);

      // Load key metrics
      await loadKeyMetrics(metricDefs.slice(0, 4));

    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadKeyMetrics = async (metricDefs: MetricDefinition[]) => {
    const summaries: MetricSummary[] = [];

    for (const metric of metricDefs) {
      try {
        const data = await analyticsService.getMetricData(metric.id, timeRange);
        
        if (data.length > 0) {
          const currentValue = data[0].value;
          const previousValue = data[data.length - 1]?.value || currentValue;
          const change = previousValue !== 0 
            ? ((currentValue - previousValue) / previousValue) * 100 
            : 0;

          summaries.push({
            metric,
            currentValue,
            previousValue,
            change,
            trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
            status: this.getMetricStatus(currentValue, metric)
          });
        }
      } catch (error) {
        console.error(`Error loading metric ${metric.metric_name}:`, error);
      }
    }

    setKeyMetrics(summaries);
  };

  const getMetricStatus = (value: number, metric: MetricDefinition): 'good' | 'warning' | 'critical' => {
    if (metric.threshold_critical && value <= metric.threshold_critical) return 'critical';
    if (metric.threshold_warning && value <= metric.threshold_warning) return 'warning';
    return 'good';
  };

  const formatMetricValue = (value: number, format: string): string => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'duration':
        return `${value.toFixed(0)}h`;
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
      case 'on_track':
      case 'achieved':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'warning':
      case 'at_risk':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'critical':
      case 'behind':
      case 'missed':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const refreshData = async () => {
    await loadAnalyticsData();
    toast.success('Analytics data refreshed');
  };

  const createFirstDashboard = async () => {
    try {
      await analyticsService.createDefaultDashboards();
      await loadAnalyticsData();
      toast.success('Default dashboards created');
    } catch (error) {
      console.error('Error creating dashboards:', error);
      toast.error('Failed to create dashboards');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Reporting</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Advanced analytics, predictive insights, and comprehensive reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.dataQualityScore}%</div>
              <Progress value={metrics.dataQualityScore} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Overall data health
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
              <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {metrics.activeGoals}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Being tracked
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
              <CardTitle className="text-sm font-medium">Experiments</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {metrics.runningExperiments}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Currently running
              </p>
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
              <CardTitle className="text-sm font-medium">Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.scheduledReports}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Scheduled reports
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="dashboards">Dashboards</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick View Dashboard */}
          {dashboards.length > 0 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Quick View Dashboard</CardTitle>
                    <CardDescription>
                      Your most important metrics at a glance
                    </CardDescription>
                  </div>
                  <Select value={selectedDashboard} onValueChange={setSelectedDashboard}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select a dashboard" />
                    </SelectTrigger>
                    <SelectContent>
                      {dashboards.map(dashboard => (
                        <SelectItem key={dashboard.id} value={dashboard.id}>
                          {dashboard.dashboard_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {selectedDashboard ? (
                  <div className="text-center py-8 text-gray-500">
                    Dashboard view will render here
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Select a dashboard to view</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No dashboards yet</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Create your first dashboard to visualize key metrics
                </p>
                <Button onClick={createFirstDashboard}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Default Dashboards
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Key Metrics Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics Summary</CardTitle>
              <CardDescription>
                Performance of your most important metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {keyMetrics.length > 0 ? (
                <div className="space-y-4">
                  {keyMetrics.map((summary, index) => (
                    <motion.div
                      key={summary.metric.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{summary.metric.metric_name}</h4>
                          <Badge className={getStatusColor(summary.status)}>
                            {summary.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>
                            Current: {formatMetricValue(summary.currentValue, summary.metric.display_format)}
                          </span>
                          <span>
                            Previous: {formatMetricValue(summary.previousValue, summary.metric.display_format)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            {getTrendIcon(summary.trend)}
                            <span className={`font-medium ${
                              summary.change > 0 ? 'text-green-600' : 
                              summary.change < 0 ? 'text-red-600' : 
                              'text-gray-600'
                            }`}>
                              {Math.abs(summary.change).toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{summary.trend}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>No metrics configured yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setActiveTab('metrics')}
                  >
                    Configure Metrics
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Goal Progress</CardTitle>
                    <CardDescription>
                      Track progress towards your goals
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab('metrics')}
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Revenue Target</span>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                  <Progress value={75} />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Lead Generation</span>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                  <Progress value={92} />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Customer Retention</span>
                    <span className="text-sm font-medium">68%</span>
                  </div>
                  <Progress value={68} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Reports</CardTitle>
                    <CardDescription>
                      Latest generated reports
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab('reports')}
                  >
                    View All
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-purple-600" />
                      <div>
                        <p className="font-medium text-sm">Executive Summary</p>
                        <p className="text-xs text-gray-500">Dec 2025</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">Campaign Performance</p>
                        <p className="text-xs text-gray-500">Nov 2025</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Phase 5 Info */}
          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertTitle>Advanced Analytics & Reporting</AlertTitle>
            <AlertDescription>
              Phase 5 brings powerful analytics to your Context Marketing platform. Create custom 
              dashboards, track KPIs, generate reports, run experiments, and leverage predictive 
              analytics to stay ahead of the competition.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="metrics">
          <MetricsDashboard onUpdate={loadAnalyticsData} />
        </TabsContent>

        <TabsContent value="dashboards">
          <DashboardBuilder onUpdate={loadAnalyticsData} />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsView onUpdate={loadAnalyticsData} />
        </TabsContent>

        <TabsContent value="predictions">
          <PredictiveAnalytics onUpdate={loadAnalyticsData} />
        </TabsContent>

        <TabsContent value="experiments">
          <ExperimentsView onUpdate={loadAnalyticsData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}