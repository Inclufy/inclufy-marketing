// src/components/context-marketing/MissionControl.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Zap,
  TrendingUp,
  AlertTriangle,
  Activity,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  PlayCircle,
  Settings,
  Shield,
  Cpu,
  BarChart3,
  Target,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Bot,
  Rocket
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
import { autonomousService, AutonomousDecision, CampaignStatus, SystemHealth } from '@/services/context-marketing/autonomous.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MissionControlProps {
  onOverride?: (decision: AutonomousDecision) => void;
}

export default function MissionControl({ onOverride }: MissionControlProps) {
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [activeDecisions, setActiveDecisions] = useState<AutonomousDecision[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignStatus[]>([]);
  const [autonomyLevel, setAutonomyLevel] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  
  // Real-time metrics
  const [metrics, setMetrics] = useState({
    decisionsPerHour: 0,
    successRate: 0,
    revenueImpact: 0,
    activeCampaigns: 0,
    humanInterventions: 0,
    systemEfficiency: 0
  });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [health, decisions, campaignData, stats] = await Promise.all([
        autonomousService.getSystemHealth(),
        autonomousService.getPendingDecisions(),
        autonomousService.getActiveCampaigns(),
        autonomousService.getSystemStats(selectedTimeRange)
      ]);

      setSystemHealth(health);
      setActiveDecisions(decisions);
      setCampaigns(campaignData);
      setMetrics(stats);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load mission control data');
    } finally {
      setLoading(false);
    }
  };

  const handleAutonomyChange = async (level: 'conservative' | 'balanced' | 'aggressive') => {
    try {
      await autonomousService.setAutonomyLevel(level);
      setAutonomyLevel(level);
      toast.success(`Autonomy level set to ${level}`);
    } catch (error) {
      toast.error('Failed to update autonomy level');
    }
  };

  const handleSystemToggle = async () => {
    try {
      if (isPaused) {
        await autonomousService.resumeSystem();
        setIsPaused(false);
        toast.success('Autonomous system resumed');
      } else {
        await autonomousService.pauseSystem();
        setIsPaused(true);
        toast.warning('Autonomous system paused');
      }
    } catch (error) {
      toast.error('Failed to toggle system state');
    }
  };

  const handleDecisionOverride = async (decision: AutonomousDecision, action: 'approve' | 'reject') => {
    try {
      await autonomousService.overrideDecision(decision.id, action);
      toast.success(`Decision ${action}d`);
      loadDashboardData();
      if (onOverride) onOverride(decision);
    } catch (error) {
      toast.error('Failed to override decision');
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 70) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getDecisionPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with System Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Mission Control
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Autonomous Marketing Operations Center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>

          {/* System Toggle */}
          <div className="flex items-center gap-2">
            <Label htmlFor="system-toggle">System</Label>
            <Switch
              id="system-toggle"
              checked={!isPaused}
              onCheckedChange={() => handleSystemToggle()}
              className="data-[state=checked]:bg-green-600"
            />
            <Badge variant={isPaused ? "destructive" : "default"}>
              {isPaused ? <PauseCircle className="w-3 h-3 mr-1" /> : <PlayCircle className="w-3 h-3 mr-1" />}
              {isPaused ? 'Paused' : 'Active'}
            </Badge>
          </div>

          {/* Settings */}
          <Button variant="outline" size="icon">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <Alert className={cn(
          "border-2",
          systemHealth.overall_score >= 90 ? "border-green-500" :
          systemHealth.overall_score >= 70 ? "border-yellow-500" : "border-red-500"
        )}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {getHealthIcon(systemHealth.overall_score)}
              <div>
                <AlertTitle>System Health: {systemHealth.overall_score}%</AlertTitle>
                <AlertDescription className="mt-1">
                  {systemHealth.message}
                </AlertDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadDashboardData()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </Alert>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Decisions/Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.decisionsPerHour}</div>
            <div className="flex items-center gap-1 mt-1">
              <Zap className="w-3 h-3 text-purple-600" />
              <span className="text-xs text-gray-500">Automated</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.successRate}%</div>
            <Progress value={metrics.successRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Revenue Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(metrics.revenueImpact / 1000).toFixed(1)}K
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span className="text-xs text-gray-500">Generated</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeCampaigns}</div>
            <div className="flex items-center gap-1 mt-1">
              <Rocket className="w-3 h-3 text-orange-600" />
              <span className="text-xs text-gray-500">Running</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Human Overrides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.humanInterventions}</div>
            <div className="flex items-center gap-1 mt-1">
              <Shield className="w-3 h-3 text-blue-600" />
              <span className="text-xs text-gray-500">This period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.systemEfficiency}%</div>
            <Progress value={metrics.systemEfficiency} className="mt-2 h-1" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="decisions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="decisions">
            Pending Decisions
            {activeDecisions.length > 0 && (
              <Badge className="ml-2">{activeDecisions.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="controls">AI Controls</TabsTrigger>
        </TabsList>

        <TabsContent value="decisions" className="space-y-4">
          {/* Autonomy Level Control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Autonomy Level</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Select value={autonomyLevel} onValueChange={handleAutonomyChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        Conservative
                      </div>
                    </SelectItem>
                    <SelectItem value="balanced">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-600" />
                        Balanced
                      </div>
                    </SelectItem>
                    <SelectItem value="aggressive">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-orange-600" />
                        Aggressive
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">
                  {autonomyLevel === 'conservative' && 'AI requires approval for most decisions'}
                  {autonomyLevel === 'balanced' && 'AI acts autonomously within set limits'}
                  {autonomyLevel === 'aggressive' && 'AI optimizes aggressively for growth'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Pending Decisions List */}
          <Card>
            <CardHeader>
              <CardTitle>Decisions Awaiting Review</CardTitle>
              <CardDescription>
                AI decisions that require human approval based on current settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {activeDecisions.length === 0 ? (
                    <div className="text-center py-12">
                      <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No decisions require approval
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        AI is operating within authorized parameters
                      </p>
                    </div>
                  ) : (
                    activeDecisions.map((decision) => (
                      <motion.div
                        key={decision.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={cn(
                          "p-4 rounded-lg border-2",
                          getDecisionPriorityColor(decision.priority)
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{decision.title}</h4>
                              <Badge variant="outline" className="text-xs">
                                {decision.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {decision.description}
                            </p>
                          </div>
                          <Badge className={cn(
                            "ml-2",
                            decision.confidence >= 90 ? "bg-green-100 text-green-800" :
                            decision.confidence >= 70 ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          )}>
                            {decision.confidence}% confidence
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Estimated Impact</span>
                            <span className="font-medium">{decision.estimated_impact}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Risk Level</span>
                            <Badge variant="outline" className="text-xs">
                              {decision.risk_level}
                            </Badge>
                          </div>
                          {decision.cost_estimate && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Cost</span>
                              <span className="font-medium">${decision.cost_estimate}</span>
                            </div>
                          )}
                        </div>

                        <Separator className="my-3" />

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">
                            {format(new Date(decision.created_at), 'MMM d, h:mm a')}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDecisionOverride(decision, 'reject')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleDecisionOverride(decision, 'approve')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Autonomous Campaigns</CardTitle>
              <CardDescription>
                Campaigns being managed by AI without human intervention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        campaign.status === 'running' ? "bg-green-100" :
                        campaign.status === 'optimizing' ? "bg-blue-100" :
                        campaign.status === 'paused' ? "bg-yellow-100" : "bg-gray-100"
                      )}>
                        <Rocket className={cn(
                          "w-5 h-5",
                          campaign.status === 'running' ? "text-green-600" :
                          campaign.status === 'optimizing' ? "text-blue-600" :
                          campaign.status === 'paused' ? "text-yellow-600" : "text-gray-600"
                        )} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{campaign.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {campaign.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <Target className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {campaign.objective}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              ${campaign.budget_spent}/{campaign.budget_total}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {campaign.days_remaining}d remaining
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {campaign.roi}% ROI
                      </div>
                      <p className="text-xs text-gray-500">
                        {campaign.conversions} conversions
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance metrics would go here */}
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Performance analytics visualization coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Behavior Controls</CardTitle>
              <CardDescription>
                Configure how the autonomous system operates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label>Budget Authority</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      Maximum budget AI can allocate without approval
                    </p>
                    <Select defaultValue="10000">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1000">$1,000</SelectItem>
                        <SelectItem value="10000">$10,000</SelectItem>
                        <SelectItem value="50000">$50,000</SelectItem>
                        <SelectItem value="100000">$100,000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Campaign Creation</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      AI can create new campaigns
                    </p>
                    <div className="flex items-center gap-2">
                      <Switch defaultChecked />
                      <span className="text-sm">Enabled</span>
                    </div>
                  </div>

                  <div>
                    <Label>Creative Generation</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      AI can generate and publish content
                    </p>
                    <div className="flex items-center gap-2">
                      <Switch defaultChecked />
                      <span className="text-sm">Enabled with review</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Risk Tolerance</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      Acceptable risk level for autonomous decisions
                    </p>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Risk</SelectItem>
                        <SelectItem value="medium">Medium Risk</SelectItem>
                        <SelectItem value="high">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Learning Mode</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      AI learning from outcomes
                    </p>
                    <div className="flex items-center gap-2">
                      <Switch defaultChecked />
                      <span className="text-sm">Active learning</span>
                    </div>
                  </div>

                  <div>
                    <Label>Competitive Response</Label>
                    <p className="text-sm text-gray-600 mb-2">
                      AI can respond to competitor actions
                    </p>
                    <div className="flex items-center gap-2">
                      <Switch />
                      <span className="text-sm">Requires approval</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Button variant="outline">Reset to Defaults</Button>
                <Button>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}