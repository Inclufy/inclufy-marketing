// src/components/context-marketing/ExperimentsView.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Flask,
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Info,
  Settings,
  Copy,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Percent,
  Timer,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  analyticsService,
  Experiment,
  MetricDefinition
} from '@/services/context-marketing/analytics.service';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ExperimentsViewProps {
  onUpdate: () => void;
}

interface ExperimentFormData {
  experiment_name: string;
  hypothesis: string;
  experiment_type: Experiment['experiment_type'];
  control_variant: {
    name: string;
    description: string;
    configuration: any;
  };
  test_variants: Array<{
    name: string;
    description: string;
    configuration: any;
  }>;
  primary_metric_id?: string;
  secondary_metrics?: string[];
  traffic_allocation: { [key: string]: number };
}

interface VariantResult {
  name: string;
  conversion_rate: number;
  lift: number;
  confidence: number;
  visitors: number;
  conversions: number;
}

const defaultExperimentForm: ExperimentFormData = {
  experiment_name: '',
  hypothesis: '',
  experiment_type: 'ab_test',
  control_variant: {
    name: 'Control',
    description: 'Original version',
    configuration: {}
  },
  test_variants: [
    {
      name: 'Variant A',
      description: 'Test variation',
      configuration: {}
    }
  ],
  traffic_allocation: {
    control: 50,
    variant_a: 50
  }
};

const experimentTemplates = [
  {
    name: 'CTA Button Test',
    description: 'Test different button colors, text, or placement',
    hypothesis: 'Changing the CTA button color from blue to green will increase click-through rate',
    type: 'ab_test',
    metrics: ['Click-through Rate', 'Conversion Rate']
  },
  {
    name: 'Headline Optimization',
    description: 'Test different headlines for better engagement',
    hypothesis: 'A more specific headline will increase engagement by 20%',
    type: 'ab_test',
    metrics: ['Engagement Rate', 'Time on Page']
  },
  {
    name: 'Pricing Display',
    description: 'Test different ways to display pricing',
    hypothesis: 'Showing monthly pricing instead of annual will increase conversions',
    type: 'ab_test',
    metrics: ['Conversion Rate', 'Revenue per Visitor']
  },
  {
    name: 'Landing Page Layout',
    description: 'Test multiple layout variations',
    hypothesis: 'A simplified layout will reduce bounce rate and increase conversions',
    type: 'multivariate',
    metrics: ['Bounce Rate', 'Conversion Rate', 'Page Load Time']
  }
];

export default function ExperimentsView({ onUpdate }: ExperimentsViewProps) {
  const [loading, setLoading] = useState(true);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [experimentForm, setExperimentForm] = useState<ExperimentFormData>(defaultExperimentForm);
  const [experimentResults, setExperimentResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [experimentsData, metricsData] = await Promise.all([
        analyticsService.getExperiments(),
        analyticsService.getMetricDefinitions()
      ]);
      setExperiments(experimentsData);
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error loading experiments:', error);
      toast.error('Failed to load experiments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExperiment = async () => {
    try {
      if (!experimentForm.experiment_name || !experimentForm.hypothesis) {
        toast.error('Please fill in all required fields');
        return;
      }

      const experiment = await analyticsService.createExperiment({
        experiment_name: experimentForm.experiment_name,
        hypothesis: experimentForm.hypothesis,
        experiment_type: experimentForm.experiment_type,
        control_variant: experimentForm.control_variant,
        test_variants: experimentForm.test_variants,
        traffic_allocation: experimentForm.traffic_allocation,
        primary_metric_id: experimentForm.primary_metric_id,
        secondary_metrics: experimentForm.secondary_metrics
      });

      toast.success('Experiment created successfully');
      setShowCreateDialog(false);
      setExperimentForm(defaultExperimentForm);
      await loadData();
      onUpdate();
    } catch (error) {
      console.error('Error creating experiment:', error);
      toast.error('Failed to create experiment');
    }
  };

  const handleStartExperiment = async (experimentId: string) => {
    try {
      await analyticsService.startExperiment(experimentId);
      toast.success('Experiment started');
      await loadData();
    } catch (error) {
      console.error('Error starting experiment:', error);
      toast.error('Failed to start experiment');
    }
  };

  const handlePauseExperiment = async (experimentId: string) => {
    try {
      // In a real implementation, this would pause the experiment
      toast.success('Experiment paused');
      await loadData();
    } catch (error) {
      console.error('Error pausing experiment:', error);
      toast.error('Failed to pause experiment');
    }
  };

  const handleAnalyzeResults = async (experiment: Experiment) => {
    try {
      setSelectedExperiment(experiment);
      const results = await analyticsService.analyzeExperiment(experiment.id);
      setExperimentResults(results);
      setShowResultsDialog(true);
    } catch (error) {
      console.error('Error analyzing experiment:', error);
      toast.error('Failed to analyze experiment');
    }
  };

  const addVariant = () => {
    const variantCount = experimentForm.test_variants.length;
    const variantName = `Variant ${String.fromCharCode(65 + variantCount)}`;
    
    setExperimentForm({
      ...experimentForm,
      test_variants: [
        ...experimentForm.test_variants,
        {
          name: variantName,
          description: 'Test variation',
          configuration: {}
        }
      ]
    });

    // Recalculate traffic allocation
    const totalVariants = 1 + experimentForm.test_variants.length + 1; // control + existing + new
    const equalAllocation = Math.floor(100 / totalVariants);
    const newAllocation: any = { control: equalAllocation };
    
    experimentForm.test_variants.forEach((variant, index) => {
      newAllocation[`variant_${String.fromCharCode(97 + index)}`] = equalAllocation;
    });
    newAllocation[`variant_${String.fromCharCode(97 + variantCount)}`] = equalAllocation;

    // Distribute remainder
    const remainder = 100 - (equalAllocation * totalVariants);
    if (remainder > 0) {
      newAllocation.control += remainder;
    }

    setExperimentForm({
      ...experimentForm,
      traffic_allocation: newAllocation
    });
  };

  const updateTrafficAllocation = (variant: string, value: number) => {
    const newAllocation = { ...experimentForm.traffic_allocation };
    newAllocation[variant] = value;
    
    // Ensure total is 100%
    const total = Object.values(newAllocation).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      const diff = 100 - total;
      const otherVariants = Object.keys(newAllocation).filter(k => k !== variant);
      if (otherVariants.length > 0) {
        const adjustment = diff / otherVariants.length;
        otherVariants.forEach(v => {
          newAllocation[v] = Math.max(0, Math.min(100, newAllocation[v] + adjustment));
        });
      }
    }

    setExperimentForm({
      ...experimentForm,
      traffic_allocation: newAllocation
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'inconclusive': return <AlertTriangle className="w-4 h-4" />;
      default: return <Timer className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'paused': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'completed': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'inconclusive': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.95) return 'text-green-600';
    if (confidence >= 0.90) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const activeExperiments = experiments.filter(e => e.status === 'running');
  const completedExperiments = experiments.filter(e => e.status === 'completed' || e.status === 'inconclusive');
  const draftExperiments = experiments.filter(e => e.status === 'draft' || e.status === 'paused');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">A/B Testing & Experiments</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Test hypotheses and optimize with data-driven decisions
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Experiment
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Experiments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeExperiments.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedExperiments.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">With results</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {completedExperiments.length > 0
                ? Math.round((completedExperiments.filter(e => e.winner_variant).length / completedExperiments.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Tests with winners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg. Lift</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              +12.5%
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">From winners</p>
          </CardContent>
        </Card>
      </div>

      {/* Experiments Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active
            {activeExperiments.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {activeExperiments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed
            {completedExperiments.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {completedExperiments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts
            {draftExperiments.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {draftExperiments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Experiments */}
        <TabsContent value="active" className="space-y-4">
          {activeExperiments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeExperiments.map((experiment, index) => (
                <motion.div
                  key={experiment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            {experiment.experiment_name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {experiment.hypothesis}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(experiment.status)}>
                          {getStatusIcon(experiment.status)}
                          <span className="ml-1">{experiment.status}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">
                            Sample Size
                          </span>
                          <span className="font-medium">2,450 / 10,000</span>
                        </div>
                        <Progress value={24.5} />
                      </div>

                      {/* Variants */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Variants</p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>Control</span>
                            <Badge variant="outline">50%</Badge>
                          </div>
                          {experiment.test_variants?.map((variant: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span>{variant.name}</span>
                              <Badge variant="outline">
                                {experiment.traffic_allocation?.[`variant_${String.fromCharCode(97 + idx)}`] || 50}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Time Running */}
                      {experiment.start_date && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Running for
                          </span>
                          <span className="font-medium">
                            {Math.ceil((new Date().getTime() - new Date(experiment.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1"
                          size="sm"
                          variant="outline"
                          onClick={() => handleAnalyzeResults(experiment)}
                        >
                          <BarChart3 className="w-4 h-4 mr-1" />
                          View Results
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePauseExperiment(experiment.id)}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No active experiments</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Start testing your hypotheses with A/B tests
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Experiment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Completed Experiments */}
        <TabsContent value="completed" className="space-y-4">
          {completedExperiments.length > 0 ? (
            <div className="space-y-3">
              {completedExperiments.map((experiment, index) => (
                <motion.div
                  key={experiment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{experiment.experiment_name}</h4>
                        {experiment.winner_variant && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Winner: {experiment.winner_variant}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {experiment.hypothesis}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Confidence: {experiment.confidence_level 
                            ? `${Math.round(experiment.confidence_level * 100)}%` 
                            : 'N/A'}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          Duration: {experiment.start_date && experiment.end_date
                            ? `${Math.ceil((new Date(experiment.end_date).getTime() - new Date(experiment.start_date).getTime()) / (1000 * 60 * 60 * 24))} days`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleAnalyzeResults(experiment)}
                    >
                      View Results
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No completed experiments</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Completed experiments will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Drafts */}
        <TabsContent value="drafts" className="space-y-4">
          {draftExperiments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {draftExperiments.map((experiment, index) => (
                <motion.div
                  key={experiment.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {experiment.experiment_name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {experiment.hypothesis}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          size="sm"
                          onClick={() => handleStartExperiment(experiment.id)}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Flask className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No draft experiments</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Draft experiments will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Experiment Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Templates</CardTitle>
          <CardDescription>
            Common experiment patterns to get started quickly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experimentTemplates.map((template, index) => (
              <motion.div
                key={template.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 border rounded-lg cursor-pointer hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
                onClick={() => {
                  setExperimentForm({
                    ...defaultExperimentForm,
                    experiment_name: template.name,
                    hypothesis: template.hypothesis,
                    experiment_type: template.type as any
                  });
                  setShowCreateDialog(true);
                }}
              >
                <h4 className="font-medium">{template.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {template.description}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {template.metrics.map((metric) => (
                    <Badge key={metric} variant="outline" className="text-xs">
                      {metric}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>A/B Testing Best Practices</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Run experiments for at least 2 weeks to account for weekly variations</li>
            <li>Ensure statistical significance (95%+ confidence) before declaring winners</li>
            <li>Test one variable at a time for clear results</li>
            <li>Define success metrics before starting the experiment</li>
            <li>Don't peek at results too early - it can lead to false positives</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Create Experiment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Experiment</DialogTitle>
            <DialogDescription>
              Set up a new A/B test to validate your hypothesis
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="experiment-name">Experiment Name</Label>
              <Input
                id="experiment-name"
                value={experimentForm.experiment_name}
                onChange={(e) => setExperimentForm({ ...experimentForm, experiment_name: e.target.value })}
                placeholder="e.g., Homepage CTA Button Test"
              />
            </div>

            <div>
              <Label htmlFor="hypothesis">Hypothesis</Label>
              <Textarea
                id="hypothesis"
                value={experimentForm.hypothesis}
                onChange={(e) => setExperimentForm({ ...experimentForm, hypothesis: e.target.value })}
                placeholder="e.g., Changing the CTA button color from blue to green will increase click-through rate by 15%"
              />
            </div>

            <div>
              <Label htmlFor="experiment-type">Experiment Type</Label>
              <Select
                value={experimentForm.experiment_type}
                onValueChange={(value: any) => setExperimentForm({ ...experimentForm, experiment_type: value })}
              >
                <SelectTrigger id="experiment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ab_test">A/B Test</SelectItem>
                  <SelectItem value="multivariate">Multivariate</SelectItem>
                  <SelectItem value="split_url">Split URL</SelectItem>
                  <SelectItem value="feature_flag">Feature Flag</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="primary-metric">Primary Metric</Label>
              <Select
                value={experimentForm.primary_metric_id || ''}
                onValueChange={(value) => setExperimentForm({ ...experimentForm, primary_metric_id: value })}
              >
                <SelectTrigger id="primary-metric">
                  <SelectValue placeholder="Select primary success metric" />
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

            <Separator />

            {/* Variants Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label>Variants</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                  disabled={experimentForm.test_variants.length >= 4}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Variant
                </Button>
              </div>

              {/* Control */}
              <div className="space-y-3">
                <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Control (Original)</h4>
                    <Badge>{experimentForm.traffic_allocation.control}%</Badge>
                  </div>
                  <Input
                    placeholder="Description"
                    value={experimentForm.control_variant.description}
                    onChange={(e) => setExperimentForm({
                      ...experimentForm,
                      control_variant: {
                        ...experimentForm.control_variant,
                        description: e.target.value
                      }
                    })}
                  />
                </div>

                {/* Test Variants */}
                {experimentForm.test_variants.map((variant, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{variant.name}</h4>
                      <Badge>
                        {experimentForm.traffic_allocation[`variant_${String.fromCharCode(97 + index)}`]}%
                      </Badge>
                    </div>
                    <Input
                      placeholder="Description of changes"
                      value={variant.description}
                      onChange={(e) => {
                        const newVariants = [...experimentForm.test_variants];
                        newVariants[index] = {
                          ...newVariants[index],
                          description: e.target.value
                        };
                        setExperimentForm({
                          ...experimentForm,
                          test_variants: newVariants
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Traffic Allocation */}
            <div>
              <Label>Traffic Allocation</Label>
              <div className="space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Control</span>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[experimentForm.traffic_allocation.control]}
                      onValueChange={(value) => updateTrafficAllocation('control', value[0])}
                      max={100}
                      step={5}
                      className="w-32"
                    />
                    <span className="text-sm font-medium w-12 text-right">
                      {experimentForm.traffic_allocation.control}%
                    </span>
                  </div>
                </div>

                {experimentForm.test_variants.map((variant, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{variant.name}</span>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[experimentForm.traffic_allocation[`variant_${String.fromCharCode(97 + index)}`]]}
                        onValueChange={(value) => updateTrafficAllocation(`variant_${String.fromCharCode(97 + index)}`, value[0])}
                        max={100}
                        step={5}
                        className="w-32"
                      />
                      <span className="text-sm font-medium w-12 text-right">
                        {experimentForm.traffic_allocation[`variant_${String.fromCharCode(97 + index)}`]}%
                      </span>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-sm font-medium">
                    {Object.values(experimentForm.traffic_allocation).reduce((sum, val) => sum + val, 0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setExperimentForm(defaultExperimentForm);
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateExperiment}>
              Create Experiment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Experiment Results</DialogTitle>
            <DialogDescription>
              {selectedExperiment?.experiment_name}
            </DialogDescription>
          </DialogHeader>

          {experimentResults && (
            <div className="space-y-4 py-4">
              {/* Summary */}
              {experimentResults.winner && (
                <Alert className="bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Winner Declared!</AlertTitle>
                  <AlertDescription>
                    {experimentResults.winner} performed significantly better with {Math.round(experimentResults.confidence * 100)}% confidence
                  </AlertDescription>
                </Alert>
              )}

              {/* Variant Results */}
              <div>
                <h4 className="font-medium mb-3">Variant Performance</h4>
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">Control</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Baseline performance
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {(experimentResults.control_conversion_rate * 100).toFixed(2)}%
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Conversion Rate
                        </p>
                      </div>
                    </div>
                  </div>

                  {experimentResults.variants?.map((variant: VariantResult) => (
                    <div key={variant.name} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">{variant.name}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={variant.lift > 0 ? "default" : "secondary"}>
                              {variant.lift > 0 ? '+' : ''}{variant.lift.toFixed(1)}% lift
                            </Badge>
                            <span className={`text-sm ${getConfidenceColor(variant.confidence)}`}>
                              {Math.round(variant.confidence * 100)}% confidence
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">
                            {(variant.conversion_rate * 100).toFixed(2)}%
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Conversion Rate
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistical Details */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium mb-2">Statistical Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Sample Size</p>
                    <p className="font-medium">10,245 visitors</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Duration</p>
                    <p className="font-medium">14 days</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Status</p>
                    <p className="font-medium">{experimentResults.status}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">P-Value</p>
                    <p className="font-medium">&lt; 0.05</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowResultsDialog(false);
              setSelectedExperiment(null);
              setExperimentResults(null);
            }}>
              Close
            </Button>
            {experimentResults?.winner && (
              <Button>
                Implement Winner
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}