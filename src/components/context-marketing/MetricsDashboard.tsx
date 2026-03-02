// src/components/context-marketing/MetricsDashboard.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Plus,
  Settings,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  Trash2,
  Edit,
  Eye,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  analyticsService,
  MetricDefinition,
  MetricData,
  AnalyticsGoal
} from '@/services/context-marketing/analytics.service';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface MetricsDashboardProps {
  onUpdate: () => void;
}

interface MetricFormData {
  metric_name: string;
  metric_type: MetricDefinition['metric_type'];
  calculation_type: MetricDefinition['calculation_type'];
  calculation_formula?: string;
  data_source: MetricDefinition['data_source'];
  display_format: MetricDefinition['display_format'];
  decimal_places: number;
  target_value?: number;
  benchmark_value?: number;
  threshold_critical?: number;
  threshold_warning?: number;
  update_frequency: MetricDefinition['update_frequency'];
}

interface GoalFormData {
  goal_name: string;
  goal_type: AnalyticsGoal['goal_type'];
  metric_id?: string;
  target_value: number;
  start_date: string;
  end_date: string;
}

export default function MetricsDashboard({ onUpdate }: MetricsDashboardProps) {
  const [activeTab, setActiveTab] = useState('metrics');
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [goals, setGoals] = useState<AnalyticsGoal[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricDefinition | null>(null);
  const [metricData, setMetricData] = useState<MetricData[]>([]);
  const [showMetricDialog, setShowMetricDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  
  const [metricForm, setMetricForm] = useState<MetricFormData>({
    metric_name: '',
    metric_type: 'performance',
    calculation_type: 'sum',
    data_source: 'internal',
    display_format: 'number',
    decimal_places: 0,
    update_frequency: 'daily'
  });

  const [goalForm, setGoalForm] = useState<GoalFormData>({
    goal_name: '',
    goal_type: 'revenue',
    target_value: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsData, goalsData] = await Promise.all([
        analyticsService.getMetricDefinitions(),
        analyticsService.getGoals()
      ]);
      setMetrics(metricsData);
      setGoals(goalsData);

      // Update goal progress
      for (const goal of goalsData) {
        if (goal.metric_id) {
          await analyticsService.updateGoalProgress(goal.id);
        }
      }
    } catch (error) {
      console.error('Error loading metrics data:', error);
      toast.error('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  const loadMetricData = async (metricId: string) => {
    try {
      const data = await analyticsService.getMetricData(metricId, timeRange);
      setMetricData(data);
    } catch (error) {
      console.error('Error loading metric data:', error);
      toast.error('Failed to load metric data');
    }
  };

  const handleCreateMetric = async () => {
    try {
      await analyticsService.createMetricDefinition(metricForm);
      toast.success('Metric created successfully');
      setShowMetricDialog(false);
      setMetricForm({
        metric_name: '',
        metric_type: 'performance',
        calculation_type: 'sum',
        data_source: 'internal',
        display_format: 'number',
        decimal_places: 0,
        update_frequency: 'daily'
      });
      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Error creating metric:', error);
      toast.error('Failed to create metric');
    }
  };

  const handleCreateGoal = async () => {
    try {
      await analyticsService.createGoal(goalForm);
      toast.success('Goal created successfully');
      setShowGoalDialog(false);
      setGoalForm({
        goal_name: '',
        goal_type: 'revenue',
        target_value: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const handleRecordData = async (metricId: string, value: number) => {
    try {
      await analyticsService.recordMetricData(metricId, value);
      toast.success('Data recorded successfully');
      if (selectedMetric?.id === metricId) {
        await loadMetricData(metricId);
      }
    } catch (error) {
      console.error('Error recording data:', error);
      toast.error('Failed to record data');
    }
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'performance': return <TrendingUp className="w-5 h-5" />;
      case 'engagement': return <Users className="w-5 h-5" />;
      case 'conversion': return <Target className="w-5 h-5" />;
      case 'revenue': return <DollarSign className="w-5 h-5" />;
      case 'operational': return <Settings className="w-5 h-5" />;
      case 'strategic': return <BarChart3 className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getGoalStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'on_track': return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'at_risk': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'behind': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'missed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatValue = (value: number, format: string, decimals: number = 0): string => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(decimals)}%`;
      case 'currency':
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
      case 'duration':
        return `${value.toFixed(decimals)}h`;
      default:
        return value.toFixed(decimals);
    }
  };

  const calculateTrend = (data: MetricData[]): { value: number; direction: 'up' | 'down' | 'stable' } => {
    if (data.length < 2) return { value: 0, direction: 'stable' };
    
    const latest = data[0].value;
    const previous = data[1].value;
    const change = previous !== 0 ? ((latest - previous) / previous) * 100 : 0;
    
    return {
      value: Math.abs(change),
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable'
    };
  };

  const prepareChartData = (data: MetricData[]) => {
    return data.slice().reverse().map(d => ({
      date: format(new Date(d.timestamp), 'MMM d'),
      value: d.value
    }));
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="metrics">
              Metrics
              <Badge className="ml-2" variant="secondary">
                {metrics.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="goals">
              Goals
              <Badge className="ml-2" variant="secondary">
                {goals.filter(g => g.status !== 'achieved' && g.status !== 'missed').length}
              </Badge>
            </TabsTrigger>
          </TabsList>
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
            {activeTab === 'metrics' ? (
              <Button onClick={() => setShowMetricDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Metric
              </Button>
            ) : (
              <Button onClick={() => setShowGoalDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="metrics" className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedMetric(metric);
                    loadMetricData(metric.id);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                          {getMetricIcon(metric.metric_type)}
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {metric.metric_name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {metric.metric_type} • {metric.update_frequency}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold">
                          {formatValue(
                            Math.random() * 1000, // Placeholder value
                            metric.display_format,
                            metric.decimal_places
                          )}
                        </p>
                        {metric.target_value && (
                          <p className="text-xs text-gray-500">
                            Target: {formatValue(metric.target_value, metric.display_format)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <ArrowUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            12.5%
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">vs last period</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Selected Metric Detail */}
          {selectedMetric && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      {getMetricIcon(selectedMetric.metric_type)}
                    </div>
                    <div>
                      <CardTitle>{selectedMetric.metric_name}</CardTitle>
                      <CardDescription>
                        {selectedMetric.calculation_type} • Updated {selectedMetric.update_frequency}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const value = prompt('Enter metric value:');
                        if (value) {
                          handleRecordData(selectedMetric.id, parseFloat(value));
                        }
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Record Data
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {metricData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={prepareChartData(metricData)}>
                        <defs>
                          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#8b5cf6"
                          fillOpacity={1}
                          fill="url(#colorValue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">No data available</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        const value = prompt('Enter metric value:');
                        if (value) {
                          handleRecordData(selectedMetric.id, parseFloat(value));
                        }
                      }}
                    >
                      Record First Data Point
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          {/* Active Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.filter(g => g.status !== 'achieved' && g.status !== 'missed').map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{goal.goal_name}</CardTitle>
                        <CardDescription>
                          {goal.goal_type} • Due {format(new Date(goal.end_date), 'MMM d, yyyy')}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getGoalStatusIcon(goal.status)}
                        <Badge variant={
                          goal.status === 'on_track' ? 'default' :
                          goal.status === 'at_risk' ? 'secondary' :
                          'destructive'
                        }>
                          {goal.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium">
                            {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}
                          </span>
                        </div>
                        <Progress value={goal.progress_percentage} className="h-3" />
                        <p className="text-xs text-gray-500 mt-1">
                          {goal.progress_percentage}% complete
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="text-sm">
                          <p className="text-gray-600">Days remaining</p>
                          <p className="font-medium">
                            {Math.max(0, Math.ceil(
                              (new Date(goal.end_date).getTime() - new Date().getTime()) / 
                              (1000 * 60 * 60 * 24)
                            ))}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Completed Goals */}
          {goals.filter(g => g.status === 'achieved' || g.status === 'missed').length > 0 && (
            <>
              <h3 className="text-lg font-semibold">Completed Goals</h3>
              <div className="space-y-3">
                {goals.filter(g => g.status === 'achieved' || g.status === 'missed').map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getGoalStatusIcon(goal.status)}
                      <div>
                        <p className="font-medium">{goal.goal_name}</p>
                        <p className="text-sm text-gray-600">
                          Ended {format(new Date(goal.end_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {goal.current_value.toLocaleString()} / {goal.target_value.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {goal.progress_percentage}% achieved
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Metric Dialog */}
      <Dialog open={showMetricDialog} onOpenChange={setShowMetricDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Metric</DialogTitle>
            <DialogDescription>
              Define a new metric to track your marketing performance
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metric-name">Metric Name</Label>
                <Input
                  id="metric-name"
                  value={metricForm.metric_name}
                  onChange={(e) => setMetricForm({ ...metricForm, metric_name: e.target.value })}
                  placeholder="e.g., Monthly Revenue"
                />
              </div>
              <div>
                <Label htmlFor="metric-type">Metric Type</Label>
                <Select
                  value={metricForm.metric_type}
                  onValueChange={(value: any) => setMetricForm({ ...metricForm, metric_type: value })}
                >
                  <SelectTrigger id="metric-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="conversion">Conversion</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="strategic">Strategic</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calculation-type">Calculation Type</Label>
                <Select
                  value={metricForm.calculation_type}
                  onValueChange={(value: any) => setMetricForm({ ...metricForm, calculation_type: value })}
                >
                  <SelectTrigger id="calculation-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="ratio">Ratio</SelectItem>
                    <SelectItem value="custom_formula">Custom Formula</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="data-source">Data Source</Label>
                <Select
                  value={metricForm.data_source}
                  onValueChange={(value: any) => setMetricForm({ ...metricForm, data_source: value })}
                >
                  <SelectTrigger id="data-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="google_analytics">Google Analytics</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {metricForm.calculation_type === 'custom_formula' && (
              <div>
                <Label htmlFor="formula">Custom Formula</Label>
                <Textarea
                  id="formula"
                  value={metricForm.calculation_formula || ''}
                  onChange={(e) => setMetricForm({ ...metricForm, calculation_formula: e.target.value })}
                  placeholder="e.g., (conversions / visitors) * 100"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="display-format">Display Format</Label>
                <Select
                  value={metricForm.display_format}
                  onValueChange={(value: any) => setMetricForm({ ...metricForm, display_format: value })}
                >
                  <SelectTrigger id="display-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="currency">Currency</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="decimal-places">Decimal Places</Label>
                <Input
                  id="decimal-places"
                  type="number"
                  value={metricForm.decimal_places}
                  onChange={(e) => setMetricForm({ ...metricForm, decimal_places: parseInt(e.target.value) })}
                  min="0"
                  max="4"
                />
              </div>
              <div>
                <Label htmlFor="update-frequency">Update Frequency</Label>
                <Select
                  value={metricForm.update_frequency}
                  onValueChange={(value: any) => setMetricForm({ ...metricForm, update_frequency: value })}
                >
                  <SelectTrigger id="update-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real_time">Real Time</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target-value">Target Value (Optional)</Label>
                <Input
                  id="target-value"
                  type="number"
                  value={metricForm.target_value || ''}
                  onChange={(e) => setMetricForm({ ...metricForm, target_value: parseFloat(e.target.value) })}
                  placeholder="e.g., 10000"
                />
              </div>
              <div>
                <Label htmlFor="benchmark-value">Benchmark Value (Optional)</Label>
                <Input
                  id="benchmark-value"
                  type="number"
                  value={metricForm.benchmark_value || ''}
                  onChange={(e) => setMetricForm({ ...metricForm, benchmark_value: parseFloat(e.target.value) })}
                  placeholder="Industry average"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="threshold-warning">Warning Threshold (Optional)</Label>
                <Input
                  id="threshold-warning"
                  type="number"
                  value={metricForm.threshold_warning || ''}
                  onChange={(e) => setMetricForm({ ...metricForm, threshold_warning: parseFloat(e.target.value) })}
                  placeholder="Trigger warning alert"
                />
              </div>
              <div>
                <Label htmlFor="threshold-critical">Critical Threshold (Optional)</Label>
                <Input
                  id="threshold-critical"
                  type="number"
                  value={metricForm.threshold_critical || ''}
                  onChange={(e) => setMetricForm({ ...metricForm, threshold_critical: parseFloat(e.target.value) })}
                  placeholder="Trigger critical alert"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMetricDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMetric} disabled={!metricForm.metric_name}>
              Create Metric
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
            <DialogDescription>
              Set a measurable goal to track your progress
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="goal-name">Goal Name</Label>
              <Input
                id="goal-name"
                value={goalForm.goal_name}
                onChange={(e) => setGoalForm({ ...goalForm, goal_name: e.target.value })}
                placeholder="e.g., Q1 Revenue Target"
              />
            </div>

            <div>
              <Label htmlFor="goal-type">Goal Type</Label>
              <Select
                value={goalForm.goal_type}
                onValueChange={(value: any) => setGoalForm({ ...goalForm, goal_type: value })}
              >
                <SelectTrigger id="goal-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="conversion">Conversion</SelectItem>
                  <SelectItem value="engagement">Engagement</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="efficiency">Efficiency</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="goal-metric">Linked Metric (Optional)</Label>
              <Select
                value={goalForm.metric_id || ''}
                onValueChange={(value) => setGoalForm({ ...goalForm, metric_id: value })}
              >
                <SelectTrigger id="goal-metric">
                  <SelectValue placeholder="Select a metric" />
                </SelectTrigger>
                <SelectContent>
                  {metrics.map(metric => (
                    <SelectItem key={metric.id} value={metric.id}>
                      {metric.metric_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="target-value">Target Value</Label>
              <Input
                id="target-value"
                type="number"
                value={goalForm.target_value}
                onChange={(e) => setGoalForm({ ...goalForm, target_value: parseFloat(e.target.value) })}
                placeholder="e.g., 100000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={goalForm.start_date}
                  onChange={(e) => setGoalForm({ ...goalForm, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={goalForm.end_date}
                  onChange={(e) => setGoalForm({ ...goalForm, end_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateGoal} disabled={!goalForm.goal_name || !goalForm.target_value}>
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}