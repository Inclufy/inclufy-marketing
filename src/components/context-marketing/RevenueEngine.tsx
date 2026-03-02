// src/components/context-marketing/RevenueEngine.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  ShoppingCart,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Brain,
  Sparkles,
  Clock,
  Calendar,
  BarChart3,
  LineChart,
  PieChart,
  Calculator,
  Zap,
  ChevronRight,
  ChevronUp,
  ChevronDown
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { revenueEngineService, RevenuePrediction, CustomerLifetimeValue, RevenueOpportunity } from '@/services/context-marketing/revenue-engine.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Chart placeholder component
const ChartPlaceholder = ({ type }: { type: string }) => (
  <div className="h-[300px] flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
    <div className="text-center">
      {type === 'revenue' ? <LineChart className="w-12 h-12 mx-auto mb-2 text-gray-400" /> :
       type === 'ltv' ? <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" /> :
       <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-400" />}
      <p className="text-sm text-gray-600 dark:text-gray-400">{type} visualization</p>
    </div>
  </div>
);

export default function RevenueEngine() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [autoOptimize, setAutoOptimize] = useState(true);
  
  // Revenue metrics
  const [metrics, setMetrics] = useState({
    currentRevenue: 0,
    predictedRevenue: 0,
    growthRate: 0,
    avgCustomerValue: 0,
    conversionRate: 0,
    churnRate: 0
  });

  // Predictions
  const [predictions, setPredictions] = useState<RevenuePrediction[]>([]);
  const [opportunities, setOpportunities] = useState<RevenueOpportunity[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerLifetimeValue[]>([]);

  useEffect(() => {
    loadRevenueData();
  }, [timeRange]);

  const loadRevenueData = async () => {
    try {
      setLoading(true);
      
      const [
        revenueMetrics,
        revenuePredictions,
        revenueOpportunities,
        ltvSegments
      ] = await Promise.all([
        revenueEngineService.getRevenueMetrics(timeRange),
        revenueEngineService.getRevenuePredictions(),
        revenueEngineService.getRevenueOpportunities(),
        revenueEngineService.getCustomerLTV()
      ]);

      setMetrics(revenueMetrics);
      setPredictions(revenuePredictions);
      setOpportunities(revenueOpportunities);
      setCustomerSegments(ltvSegments);
    } catch (error) {
      console.error('Error loading revenue data:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeRevenue = async () => {
    try {
      await revenueEngineService.optimizeRevenue();
      toast.success('Revenue optimization initiated');
      loadRevenueData();
    } catch (error) {
      toast.error('Failed to optimize revenue');
    }
  };

  const handleImplementOpportunity = async (opportunityId: string) => {
    try {
      await revenueEngineService.implementOpportunity(opportunityId);
      toast.success('Opportunity implementation started');
      loadRevenueData();
    } catch (error) {
      toast.error('Failed to implement opportunity');
    }
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpRight className="w-4 h-4 text-green-600" />;
    if (growth < 0) return <ArrowDownRight className="w-4 h-4 text-red-600" />;
    return null;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-green-100 text-green-800">High</Badge>;
    if (confidence >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
    return <Badge className="bg-red-100 text-red-800">Low</Badge>;
  };

  const getImpactColor = (impact: string) => {
    if (impact === 'high') return 'text-green-600';
    if (impact === 'medium') return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-transparent bg-clip-text">
              Revenue Engine
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered revenue optimization and prediction
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Label htmlFor="auto-optimize">Auto-Optimize</Label>
            <Switch
              id="auto-optimize"
              checked={autoOptimize}
              onCheckedChange={setAutoOptimize}
            />
          </div>

          <Button onClick={handleOptimizeRevenue}>
            <Zap className="w-4 h-4 mr-2" />
            Optimize Now
          </Button>
        </div>
      </div>

      {/* Key Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Current Revenue
              {getGrowthIcon(metrics.growthRate)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(metrics.currentRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.growthRate > 0 ? '+' : ''}{metrics.growthRate}% vs last period
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              Predicted Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(metrics.predictedRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Next 30 days</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Customer Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${metrics.avgCustomerValue}
            </div>
            <p className="text-xs text-gray-500 mt-1">Lifetime value</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.conversionRate}%
            </div>
            <Progress value={metrics.conversionRate} max={10} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {metrics.churnRate}%
            </div>
            <Progress value={metrics.churnRate} max={20} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Revenue/Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Math.round(metrics.currentRevenue / 1000)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Monthly average</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Opportunities Alert */}
      {opportunities.filter(o => o.priority === 'critical').length > 0 && (
        <Alert className="border-purple-500">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>High-Impact Revenue Opportunities Detected</AlertTitle>
          <AlertDescription>
            {opportunities.filter(o => o.priority === 'critical').length} critical opportunities
            could generate an additional ${opportunities
              .filter(o => o.priority === 'critical')
              .reduce((sum, o) => sum + o.estimated_value, 0)
              .toLocaleString()} in revenue.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="ltv">Customer LTV</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Predictions</CardTitle>
              <CardDescription>
                AI-generated forecasts based on current trends and patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Revenue Trend Chart */}
              <ChartPlaceholder type="revenue" />

              {/* Prediction Details */}
              <div className="mt-6 space-y-4">
                <h3 className="font-medium mb-3">Detailed Predictions</h3>
                {predictions.map((prediction, idx) => (
                  <motion.div
                    key={prediction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{prediction.entity_type}</h4>
                          {getConfidenceBadge(prediction.confidence)}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Predicted Value</span>
                            <p className="font-medium">{formatCurrency(prediction.predicted_value)}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Time Horizon</span>
                            <p className="font-medium">{prediction.time_horizon} days</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Key Factor</span>
                            <p className="font-medium">{prediction.factors[0]}</p>
                          </div>
                        </div>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm">
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View detailed analysis</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Opportunities</CardTitle>
              <CardDescription>
                AI-identified opportunities to increase revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {opportunities.map((opportunity, idx) => (
                  <motion.div
                    key={opportunity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "p-4 rounded-lg border-2",
                      opportunity.priority === 'critical' ? "border-red-500 bg-red-50 dark:bg-red-900/20" :
                      opportunity.priority === 'high' ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" :
                      "border-gray-300"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          {opportunity.title}
                          <Badge variant={opportunity.priority === 'critical' ? 'destructive' : 'default'}>
                            {opportunity.priority}
                          </Badge>
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {opportunity.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          +{formatCurrency(opportunity.estimated_value)}
                        </p>
                        <p className="text-xs text-gray-500">potential revenue</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <Label className="text-xs">Implementation Effort</Label>
                        <Badge variant="outline" className="mt-1">
                          {opportunity.effort_required}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-xs">Time to Value</Label>
                        <p className="text-sm font-medium">{opportunity.time_to_value} days</p>
                      </div>
                      <div>
                        <Label className="text-xs">Success Probability</Label>
                        <div className="flex items-center gap-2">
                          <Progress value={opportunity.success_probability} className="flex-1 h-2" />
                          <span className="text-sm">{opportunity.success_probability}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Sparkles className={cn("w-4 h-4", getImpactColor(opportunity.impact))} />
                        <span className={cn("text-sm font-medium", getImpactColor(opportunity.impact))}>
                          {opportunity.impact} impact
                        </span>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleImplementOpportunity(opportunity.id)}
                      >
                        Implement
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ltv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Lifetime Value Analysis</CardTitle>
              <CardDescription>
                Segment analysis and LTV predictions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* LTV Chart */}
              <ChartPlaceholder type="ltv" />

              {/* Segment Details */}
              <div className="mt-6">
                <h3 className="font-medium mb-3">Customer Segments</h3>
                <div className="space-y-3">
                  {customerSegments.map((segment, idx) => (
                    <div
                      key={segment.segment_name}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          idx === 0 ? "bg-purple-100" :
                          idx === 1 ? "bg-blue-100" : "bg-green-100"
                        )}>
                          <Users className={cn(
                            "w-6 h-6",
                            idx === 0 ? "text-purple-600" :
                            idx === 1 ? "text-blue-600" : "text-green-600"
                          )} />
                        </div>
                        <div>
                          <h4 className="font-medium">{segment.segment_name}</h4>
                          <p className="text-sm text-gray-600">
                            {segment.customer_count} customers
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${segment.avg_ltv}</p>
                        <p className="text-xs text-gray-500">avg lifetime value</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retention Strategies */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-600" />
                  AI Retention Recommendations
                </h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Implement VIP program for Enterprise segment (+15% retention)</li>
                  <li>• Launch win-back campaign for at-risk Mid-Market customers</li>
                  <li>• Increase onboarding touchpoints for Small Business segment</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Optimization Settings</CardTitle>
              <CardDescription>
                Configure how AI optimizes revenue generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Optimization Goals */}
              <div>
                <Label className="text-base mb-3 block">Optimization Goals</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label htmlFor="maximize-revenue">Maximize Total Revenue</Label>
                    <Switch id="maximize-revenue" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label htmlFor="reduce-churn">Minimize Churn Rate</Label>
                    <Switch id="reduce-churn" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label htmlFor="increase-ltv">Increase Customer LTV</Label>
                    <Switch id="increase-ltv" />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <Label htmlFor="optimize-pricing">Dynamic Pricing</Label>
                    <Switch id="optimize-pricing" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Risk Tolerance */}
              <div>
                <Label className="text-base mb-3 block">Revenue Risk Tolerance</Label>
                <Select defaultValue="balanced">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">
                      Conservative - Steady, predictable growth
                    </SelectItem>
                    <SelectItem value="balanced">
                      Balanced - Moderate risk for better returns
                    </SelectItem>
                    <SelectItem value="aggressive">
                      Aggressive - Maximum growth, higher volatility
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Optimization Constraints */}
              <div>
                <Label className="text-base mb-3 block">Constraints</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Min profit margin</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border rounded"
                        defaultValue="20"
                      />
                      <span className="text-sm">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Max discount allowed</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-20 px-2 py-1 border rounded"
                        defaultValue="30"
                      />
                      <span className="text-sm">%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Customer acquisition cap</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">$</span>
                      <input
                        type="number"
                        className="w-24 px-2 py-1 border rounded"
                        defaultValue="500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline">Reset to Defaults</Button>
                <Button>Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}