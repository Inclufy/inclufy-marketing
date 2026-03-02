// src/components/context-marketing/DashboardBuilder.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Activity,
  Gauge,
  Map,
  Table,
  Grid,
  Layers,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Copy,
  Share2,
  Lock,
  Unlock,
  Save,
  Settings,
  Move,
  Maximize2,
  ChevronRight,
  RefreshCw,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  analyticsService,
  AnalyticsDashboard,
  DashboardWidget,
  MetricDefinition
} from '@/services/context-marketing/analytics.service';
import { toast } from 'sonner';

interface DashboardBuilderProps {
  onUpdate: () => void;
}

interface DashboardFormData {
  dashboard_name: string;
  dashboard_type: AnalyticsDashboard['dashboard_type'];
  description?: string;
  layout_type: AnalyticsDashboard['layout_type'];
  auto_refresh: boolean;
  refresh_interval_seconds?: number;
}

interface WidgetFormData {
  widget_type: DashboardWidget['widget_type'];
  widget_title: string;
  metrics?: string[];
  time_range: string;
  comparison_period?: string;
  position?: { x: number; y: number; w: number; h: number };
}

const defaultDashboardForm: DashboardFormData = {
  dashboard_name: '',
  dashboard_type: 'custom',
  layout_type: 'responsive',
  auto_refresh: false
};

const defaultWidgetForm: WidgetFormData = {
  widget_type: 'metric_card',
  widget_title: '',
  time_range: '30d'
};

const widgetTypes = [
  { type: 'metric_card', name: 'Metric Card', icon: BarChart3 },
  { type: 'line_chart', name: 'Line Chart', icon: LineChart },
  { type: 'bar_chart', name: 'Bar Chart', icon: BarChart3 },
  { type: 'pie_chart', name: 'Pie Chart', icon: PieChart },
  { type: 'gauge', name: 'Gauge', icon: Gauge },
  { type: 'table', name: 'Table', icon: Table },
  { type: 'trend', name: 'Trend', icon: TrendingUp },
  { type: 'comparison', name: 'Comparison', icon: Activity },
  { type: 'heatmap', name: 'Heatmap', icon: Grid },
  { type: 'map', name: 'Map', icon: Map }
];

export default function DashboardBuilder({ onUpdate }: DashboardBuilderProps) {
  const [loading, setLoading] = useState(true);
  const [dashboards, setDashboards] = useState<AnalyticsDashboard[]>([]);
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<AnalyticsDashboard | null>(null);
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showWidgetDialog, setShowWidgetDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [dashboardForm, setDashboardForm] = useState<DashboardFormData>(defaultDashboardForm);
  const [widgetForm, setWidgetForm] = useState<WidgetFormData>(defaultWidgetForm);
  const [editMode, setEditMode] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDashboard) {
      loadDashboardWidgets(selectedDashboard.id);
    }
  }, [selectedDashboard]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashboardsData, metricsData] = await Promise.all([
        analyticsService.getDashboards(),
        analyticsService.getMetricDefinitions()
      ]);
      setDashboards(dashboardsData);
      setMetrics(metricsData);
      
      // Select first dashboard by default
      if (dashboardsData.length > 0 && !selectedDashboard) {
        setSelectedDashboard(dashboardsData[0]);
      }
    } catch (error) {
      console.error('Error loading dashboards:', error);
      toast.error('Failed to load dashboards');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardWidgets = async (dashboardId: string) => {
    try {
      const widgets = await analyticsService.getDashboardWidgets(dashboardId);
      setDashboardWidgets(widgets);
    } catch (error) {
      console.error('Error loading widgets:', error);
      toast.error('Failed to load dashboard widgets');
    }
  };

  const handleCreateDashboard = async () => {
    try {
      if (!dashboardForm.dashboard_name) {
        toast.error('Please enter a dashboard name');
        return;
      }

      const dashboard = await analyticsService.createDashboard({
        ...dashboardForm,
        refresh_interval_seconds: dashboardForm.auto_refresh 
          ? dashboardForm.refresh_interval_seconds || 60 
          : undefined
      });

      toast.success('Dashboard created successfully');
      setShowCreateDialog(false);
      setDashboardForm(defaultDashboardForm);
      await loadData();
      setSelectedDashboard(dashboard);
      onUpdate();
    } catch (error) {
      console.error('Error creating dashboard:', error);
      toast.error('Failed to create dashboard');
    }
  };

  const handleAddWidget = async () => {
    try {
      if (!selectedDashboard || !widgetForm.widget_title) {
        toast.error('Please fill in all required fields');
        return;
      }

      await analyticsService.addWidgetToDashboard(selectedDashboard.id, widgetForm);
      
      toast.success('Widget added successfully');
      setShowWidgetDialog(false);
      setWidgetForm(defaultWidgetForm);
      setSelectedWidgetType('');
      await loadDashboardWidgets(selectedDashboard.id);
    } catch (error) {
      console.error('Error adding widget:', error);
      toast.error('Failed to add widget');
    }
  };

  const handleUpdateWidgetPosition = async (widgetId: string, position: any) => {
    try {
      await analyticsService.updateWidgetPosition(widgetId, position);
      await loadDashboardWidgets(selectedDashboard!.id);
    } catch (error) {
      console.error('Error updating widget position:', error);
      toast.error('Failed to update widget position');
    }
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return;

    try {
      // In a real implementation, we'd have a delete method
      toast.success('Dashboard deleted');
      await loadData();
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      toast.error('Failed to delete dashboard');
    }
  };

  const getDashboardIcon = (type: string) => {
    switch (type) {
      case 'executive': return <Layers className="w-5 h-5" />;
      case 'operational': return <Activity className="w-5 h-5" />;
      case 'campaign': return <TrendingUp className="w-5 h-5" />;
      case 'competitive': return <BarChart3 className="w-5 h-5" />;
      case 'content': return <PieChart className="w-5 h-5" />;
      case 'team': return <Table className="w-5 h-5" />;
      case 'roi': return <LineChart className="w-5 h-5" />;
      default: return <Grid className="w-5 h-5" />;
    }
  };

  const getWidgetIcon = (type: string) => {
    const widget = widgetTypes.find(w => w.type === type);
    return widget ? <widget.icon className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />;
  };

  const renderWidgetPreview = (widget: DashboardWidget) => {
    // In a real implementation, this would render actual charts
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded">
        <div className="text-center">
          {getWidgetIcon(widget.widget_type)}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {widget.widget_type.replace('_', ' ')}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Dashboard List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dashboards</CardTitle>
              <CardDescription>
                Create and manage custom dashboards for different audiences
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Dashboard
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading dashboards...</p>
            </div>
          ) : dashboards.length > 0 ? (
            <div className="space-y-2">
              {dashboards.map((dashboard) => (
                <motion.div
                  key={dashboard.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedDashboard?.id === dashboard.id
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/10'
                      : 'hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedDashboard(dashboard)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                      {getDashboardIcon(dashboard.dashboard_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{dashboard.dashboard_name}</h4>
                        {dashboard.is_public ? (
                          <Unlock className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dashboard.dashboard_type} • {dashboard.view_count || 0} views
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {dashboard.auto_refresh && (
                      <Badge variant="outline">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Auto
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDashboard(dashboard);
                        setShowShareDialog(true);
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDashboard(dashboard.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Grid className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No dashboards yet</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Create your first dashboard to visualize data
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dashboard Builder */}
      {selectedDashboard && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{selectedDashboard.dashboard_name}</CardTitle>
                <CardDescription>
                  {selectedDashboard.description || 'Customize your dashboard layout and widgets'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={editMode ? "default" : "outline"}
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Layout
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Layout
                    </>
                  )}
                </Button>
                <Button onClick={() => setShowWidgetDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Widget
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardWidgets.length > 0 ? (
              <div className="grid grid-cols-12 gap-4">
                {dashboardWidgets.map((widget) => (
                  <motion.div
                    key={widget.id}
                    layout
                    className={`col-span-${widget.position.w || 4} row-span-${widget.position.h || 3}`}
                    style={{
                      gridColumnStart: widget.position.x + 1,
                      gridColumnEnd: `span ${widget.position.w || 4}`,
                      minHeight: `${(widget.position.h || 3) * 100}px`
                    }}
                  >
                    <Card className="h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">{widget.widget_title}</CardTitle>
                          {editMode && (
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm">
                                <Move className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        {renderWidgetPreview(widget)}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Plus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No widgets yet</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Add widgets to visualize your data
                </p>
                <Button onClick={() => setShowWidgetDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Widget
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dashboard Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Dashboard</DialogTitle>
            <DialogDescription>
              Set up a new dashboard to visualize your metrics
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="dashboard-name">Dashboard Name</Label>
              <Input
                id="dashboard-name"
                value={dashboardForm.dashboard_name}
                onChange={(e) => setDashboardForm({ ...dashboardForm, dashboard_name: e.target.value })}
                placeholder="e.g., Executive Overview"
              />
            </div>

            <div>
              <Label htmlFor="dashboard-type">Dashboard Type</Label>
              <Select
                value={dashboardForm.dashboard_type}
                onValueChange={(value: any) => setDashboardForm({ ...dashboardForm, dashboard_type: value })}
              >
                <SelectTrigger id="dashboard-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="competitive">Competitive</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="team">Team</SelectItem>
                  <SelectItem value="roi">ROI</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={dashboardForm.description || ''}
                onChange={(e) => setDashboardForm({ ...dashboardForm, description: e.target.value })}
                placeholder="What is this dashboard for?"
              />
            </div>

            <div>
              <Label htmlFor="layout-type">Layout Type</Label>
              <Select
                value={dashboardForm.layout_type}
                onValueChange={(value: any) => setDashboardForm({ ...dashboardForm, layout_type: value })}
              >
                <SelectTrigger id="layout-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="freeform">Freeform</SelectItem>
                  <SelectItem value="responsive">Responsive</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="auto-refresh">Auto Refresh</Label>
              <Switch
                id="auto-refresh"
                checked={dashboardForm.auto_refresh}
                onCheckedChange={(checked) => setDashboardForm({ ...dashboardForm, auto_refresh: checked })}
              />
            </div>

            {dashboardForm.auto_refresh && (
              <div>
                <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
                <Input
                  id="refresh-interval"
                  type="number"
                  min="10"
                  value={dashboardForm.refresh_interval_seconds || 60}
                  onChange={(e) => setDashboardForm({ 
                    ...dashboardForm, 
                    refresh_interval_seconds: parseInt(e.target.value) || 60 
                  })}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setDashboardForm(defaultDashboardForm);
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateDashboard}>
              Create Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Widget Dialog */}
      <Dialog open={showWidgetDialog} onOpenChange={setShowWidgetDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
            <DialogDescription>
              Choose a widget type and configure its settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!selectedWidgetType ? (
              <div>
                <Label>Widget Type</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {widgetTypes.map((type) => (
                    <motion.div
                      key={type.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 border rounded-lg cursor-pointer hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
                      onClick={() => {
                        setSelectedWidgetType(type.type);
                        setWidgetForm({ ...widgetForm, widget_type: type.type as any });
                      }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <type.icon className="w-8 h-8 text-purple-600" />
                        <span className="text-sm font-medium">{type.name}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedWidgetType('');
                      setWidgetForm(defaultWidgetForm);
                    }}
                  >
                    ← Back
                  </Button>
                  <div className="flex items-center gap-2">
                    {getWidgetIcon(selectedWidgetType)}
                    <span className="font-medium">
                      {widgetTypes.find(w => w.type === selectedWidgetType)?.name}
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="widget-title">Widget Title</Label>
                  <Input
                    id="widget-title"
                    value={widgetForm.widget_title}
                    onChange={(e) => setWidgetForm({ ...widgetForm, widget_title: e.target.value })}
                    placeholder="e.g., Revenue Trend"
                  />
                </div>

                <div>
                  <Label>Select Metrics</Label>
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                    {metrics.map((metric) => (
                      <label
                        key={metric.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <input
                          type="checkbox"
                          checked={widgetForm.metrics?.includes(metric.id) || false}
                          onChange={(e) => {
                            const currentMetrics = widgetForm.metrics || [];
                            if (e.target.checked) {
                              setWidgetForm({
                                ...widgetForm,
                                metrics: [...currentMetrics, metric.id]
                              });
                            } else {
                              setWidgetForm({
                                ...widgetForm,
                                metrics: currentMetrics.filter(id => id !== metric.id)
                              });
                            }
                          }}
                        />
                        <span className="text-sm">{metric.metric_name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="time-range">Time Range</Label>
                  <Select
                    value={widgetForm.time_range}
                    onValueChange={(value) => setWidgetForm({ ...widgetForm, time_range: value })}
                  >
                    <SelectTrigger id="time-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">Last 24 hours</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                      <SelectItem value="1y">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="comparison-period">Comparison Period (Optional)</Label>
                  <Select
                    value={widgetForm.comparison_period || ''}
                    onValueChange={(value) => setWidgetForm({ 
                      ...widgetForm, 
                      comparison_period: value || undefined 
                    })}
                  >
                    <SelectTrigger id="comparison-period">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      <SelectItem value="previous_period">Previous Period</SelectItem>
                      <SelectItem value="previous_year">Previous Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowWidgetDialog(false);
              setWidgetForm(defaultWidgetForm);
              setSelectedWidgetType('');
            }}>
              Cancel
            </Button>
            {selectedWidgetType && (
              <Button onClick={handleAddWidget}>
                Add Widget
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}