// src/components/context-marketing/PredictiveAnalytics.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Target,
  AlertCircle,
  Activity,
  BarChart3,
  LineChart,
  Plus,
  RefreshCw,
  Settings,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  ChevronRight,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  analyticsService,
  PredictiveModel
} from '@/services/context-marketing/analytics.service';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface PredictiveAnalyticsProps {
  onUpdate: () => void;
}

interface ModelFormData {
  model_name: string;
  model_type: PredictiveModel['model_type'];
  algorithm: string;
  features: string[];
  training_data_start?: string;
  training_data_end?: string;
}

interface PredictionRequest {
  model_id: string;
  input_features: any;
}

const defaultModelForm: ModelFormData = {
  model_name: '',
  model_type: 'revenue_forecast',
  algorithm: 'auto',
  features: []
};

const modelTypes = [
  {
    type: 'revenue_forecast',
    name: 'Revenue Forecast',
    icon: DollarSign,
    description: 'Predict future revenue based on historical data and trends',
    features: ['historical_revenue', 'marketing_spend', 'seasonality', 'market_conditions']
  },
  {
    type: 'churn_prediction',
    name: 'Churn Prediction',
    icon: Users,
    description: 'Identify customers at risk of churning',
    features: ['engagement_score', 'usage_frequency', 'support_tickets', 'contract_value']
  },
  {
    type: 'lead_scoring',
    name: 'Lead Scoring',
    icon: Target,
    description: 'Score and prioritize leads based on conversion likelihood',
    features: ['demographic_data', 'behavior_data', 'engagement_history', 'firmographics']
  },
  {
    type: 'content_performance',
    name: 'Content Performance',
    icon: FileText,
    description: 'Predict how content will perform before publishing',
    features: ['content_type', 'topic', 'length', 'publish_time', 'historical_performance']
  },
  {
    type: 'campaign_outcome',
    name: 'Campaign Outcome',
    icon: BarChart3,
    description: 'Forecast campaign results and ROI',
    features: ['budget', 'channels', 'audience_size', 'campaign_type', 'historical_campaigns']
  },
  {
    type: 'competitive_impact',
    name: 'Competitive Impact',
    icon: Activity,
    description: 'Predict impact of competitive moves on your business',
    features: ['competitor_actions', 'market_share', 'pricing_changes', 'product_launches']
  },
  {
    type: 'trend_forecast',
    name: 'Trend Forecast',
    icon: TrendingUp,
    description: 'Identify and predict market trends',
    features: ['search_volume', 'social_mentions', 'news_coverage', 'market_indicators']
  },
  {
    type: 'anomaly_detection',
    name: 'Anomaly Detection',
    icon: AlertCircle,
    description: 'Detect unusual patterns and outliers in your data',
    features: ['metric_values', 'time_series_data', 'threshold_values', 'pattern_history']
  }
];

export default function PredictiveAnalytics({ onUpdate }: PredictiveAnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<PredictiveModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<PredictiveModel | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPredictionDialog, setShowPredictionDialog] = useState(false);
  const [modelForm, setModelForm] = useState<ModelFormData>(defaultModelForm);
  const [selectedModelType, setSelectedModelType] = useState<string>('');
  const [predictionInput, setPredictionInput] = useState<any>({});
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      // This would load from the actual service
      const mockModels: PredictiveModel[] = [
        {
          id: '1',
          user_id: 'user1',
          model_name: 'Q1 Revenue Forecast',
          model_type: 'revenue_forecast',
          algorithm: 'auto',
          features: ['historical_revenue', 'marketing_spend'],
          training_status: 'completed',
          accuracy_score: 0.85,
          precision_score: 0.82,
          recall_score: 0.88,
          f1_score: 0.85,
          prediction_count: 25,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setModels(mockModels);
    } catch (error) {
      console.error('Error loading models:', error);
      toast.error('Failed to load predictive models');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateModel = async () => {
    try {
      if (!modelForm.model_name) {
        toast.error('Please enter a model name');
        return;
      }

      const model = await analyticsService.createPredictiveModel({
        ...modelForm,
        features: modelForm.features.length > 0 ? modelForm.features : 
                  modelTypes.find(m => m.type === modelForm.model_type)?.features || []
      });

      toast.success('Model created and training started');
      setShowCreateDialog(false);
      setModelForm(defaultModelForm);
      setSelectedModelType('');
      
      // Simulate training completion
      setTimeout(async () => {
        await loadModels();
        toast.success('Model training completed');
        onUpdate();
      }, 5000);
    } catch (error) {
      console.error('Error creating model:', error);
      toast.error('Failed to create model');
    }
  };

  const handleGeneratePrediction = async () => {
    try {
      if (!selectedModel) return;
      
      setPredicting(true);
      const result = await analyticsService.generatePrediction(
        selectedModel.id,
        predictionInput
      );
      
      setPredictionResult(result);
      toast.success('Prediction generated successfully');
    } catch (error) {
      console.error('Error generating prediction:', error);
      toast.error('Failed to generate prediction');
    } finally {
      setPredicting(false);
    }
  };

  const getModelIcon = (type: string) => {
    const modelType = modelTypes.find(m => m.type === type);
    return modelType ? <modelType.icon className="w-5 h-5" /> : <Brain className="w-5 h-5" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'training': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'failed': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const formatAccuracy = (score: number | undefined): string => {
    if (!score) return 'N/A';
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Predictive Analytics</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI-powered predictions to stay ahead of the market
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Model
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {models.filter(m => m.is_active).length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Ready to use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {models.reduce((sum, m) => sum + m.prediction_count, 0)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Average Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {models.length > 0
                ? formatAccuracy(
                    models.reduce((sum, m) => sum + (m.accuracy_score || 0), 0) / models.length
                  )
                : 'N/A'
              }
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Across models</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Training</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {models.filter(m => m.training_status === 'training').length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Models Grid */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading predictive models...</p>
          </CardContent>
        </Card>
      ) : models.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model, index) => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        {getModelIcon(model.model_type)}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">
                          {model.model_name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {modelTypes.find(m => m.type === model.model_type)?.name}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(model.training_status)}>
                      {model.training_status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Model Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="space-y-1">
                      <p className="text-gray-600 dark:text-gray-400">Accuracy</p>
                      <p className="font-medium">{formatAccuracy(model.accuracy_score)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-600 dark:text-gray-400">Predictions</p>
                      <p className="font-medium">{model.prediction_count}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-600 dark:text-gray-400">F1 Score</p>
                      <p className="font-medium">{formatAccuracy(model.f1_score)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-600 dark:text-gray-400">Algorithm</p>
                      <p className="font-medium">{model.algorithm}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      size="sm"
                      disabled={model.training_status !== 'completed'}
                      onClick={() => {
                        setSelectedModel(model);
                        setShowPredictionDialog(true);
                      }}
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      Predict
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>

                  {model.last_prediction_at && (
                    <p className="text-xs text-gray-500 text-center">
                      Last used {format(new Date(model.last_prediction_at), 'MMM d, h:mm a')}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No predictive models yet</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create your first AI model to start making predictions
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Model
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Model Use Cases */}
      <Card>
        <CardHeader>
          <CardTitle>Available Model Types</CardTitle>
          <CardDescription>
            Choose from pre-configured models for common use cases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modelTypes.slice(0, 4).map((modelType, index) => (
              <motion.div
                key={modelType.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-4 border rounded-lg hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors cursor-pointer"
                onClick={() => {
                  setModelForm({
                    ...defaultModelForm,
                    model_type: modelType.type as any,
                    features: modelType.features
                  });
                  setSelectedModelType(modelType.type);
                  setShowCreateDialog(true);
                }}
              >
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  <modelType.icon className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{modelType.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {modelType.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Tips */}
      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertTitle>AI-Powered Predictions</AlertTitle>
        <AlertDescription>
          Our predictive models use advanced machine learning algorithms to analyze historical data 
          and identify patterns. The more data you have, the more accurate the predictions become. 
          Models automatically retrain periodically to stay current with changing trends.
        </AlertDescription>
      </Alert>

      {/* Create Model Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Predictive Model</DialogTitle>
            <DialogDescription>
              Configure and train a new AI model
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!selectedModelType ? (
              <div>
                <Label>Select Model Type</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {modelTypes.map((type) => (
                    <div
                      key={type.type}
                      className="p-4 border rounded-lg cursor-pointer hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors"
                      onClick={() => {
                        setSelectedModelType(type.type);
                        setModelForm({
                          ...modelForm,
                          model_type: type.type as any,
                          features: type.features
                        });
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <type.icon className="w-5 h-5 text-purple-600" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{type.name}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </div>
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
                      setSelectedModelType('');
                      setModelForm(defaultModelForm);
                    }}
                  >
                    ← Back
                  </Button>
                  <div className="flex items-center gap-2">
                    {getModelIcon(selectedModelType)}
                    <span className="font-medium">
                      {modelTypes.find(m => m.type === selectedModelType)?.name}
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="model-name">Model Name</Label>
                  <Input
                    id="model-name"
                    value={modelForm.model_name}
                    onChange={(e) => setModelForm({ ...modelForm, model_name: e.target.value })}
                    placeholder="e.g., Q1 2026 Revenue Forecast"
                  />
                </div>

                <div>
                  <Label htmlFor="algorithm">Algorithm</Label>
                  <Select
                    value={modelForm.algorithm}
                    onValueChange={(value) => setModelForm({ ...modelForm, algorithm: value })}
                  >
                    <SelectTrigger id="algorithm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (Recommended)</SelectItem>
                      <SelectItem value="linear_regression">Linear Regression</SelectItem>
                      <SelectItem value="random_forest">Random Forest</SelectItem>
                      <SelectItem value="neural_network">Neural Network</SelectItem>
                      <SelectItem value="xgboost">XGBoost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Features</Label>
                  <div className="space-y-2 mt-2">
                    {modelForm.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{feature.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Training Data Period (Optional)</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <Input
                      type="date"
                      value={modelForm.training_data_start || ''}
                      onChange={(e) => setModelForm({ ...modelForm, training_data_start: e.target.value })}
                      placeholder="Start date"
                    />
                    <Input
                      type="date"
                      value={modelForm.training_data_end || ''}
                      onChange={(e) => setModelForm({ ...modelForm, training_data_end: e.target.value })}
                      placeholder="End date"
                    />
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    The model will begin training immediately after creation. Training typically 
                    takes 2-5 minutes depending on data size and complexity.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setModelForm(defaultModelForm);
              setSelectedModelType('');
            }}>
              Cancel
            </Button>
            {selectedModelType && (
              <Button onClick={handleCreateModel}>
                Create & Train Model
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Prediction Dialog */}
      <Dialog open={showPredictionDialog} onOpenChange={setShowPredictionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Prediction</DialogTitle>
            <DialogDescription>
              Enter input data to generate a prediction
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedModel && (
              <>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {getModelIcon(selectedModel.model_type)}
                  <div>
                    <p className="font-medium">{selectedModel.model_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Accuracy: {formatAccuracy(selectedModel.accuracy_score)}
                    </p>
                  </div>
                </div>

                {!predictionResult ? (
                  <>
                    <div>
                      <Label>Input Features</Label>
                      <Textarea
                        className="mt-2 font-mono"
                        placeholder="Enter input data as JSON..."
                        value={JSON.stringify(predictionInput, null, 2)}
                        onChange={(e) => {
                          try {
                            setPredictionInput(JSON.parse(e.target.value));
                          } catch (error) {
                            // Invalid JSON, ignore
                          }
                        }}
                      />
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Enter the required features for this model type. The AI will process 
                        your input and generate a prediction based on learned patterns.
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <h4 className="font-medium mb-2">Prediction Result</h4>
                      <pre className="text-sm overflow-auto">
                        {JSON.stringify(predictionResult.prediction, null, 2)}
                      </pre>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Confidence Score
                      </span>
                      <div className="flex items-center gap-2">
                        <Progress value={predictionResult.confidence * 100} className="w-24" />
                        <span className="font-medium">
                          {formatAccuracy(predictionResult.confidence)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            {predictionResult ? (
              <>
                <Button variant="outline" onClick={() => {
                  setPredictionResult(null);
                  setPredictionInput({});
                }}>
                  New Prediction
                </Button>
                <Button onClick={() => {
                  setShowPredictionDialog(false);
                  setPredictionResult(null);
                  setPredictionInput({});
                }}>
                  Done
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => {
                  setShowPredictionDialog(false);
                  setPredictionInput({});
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleGeneratePrediction}
                  disabled={predicting || Object.keys(predictionInput).length === 0}
                >
                  {predicting ? (
                    <>
                      <Brain className="w-4 h-4 mr-2 animate-pulse" />
                      Predicting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Prediction
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}