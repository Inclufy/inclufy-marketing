// src/components/context-marketing/StrategyLaboratory.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FlaskConical,
  Play,
  Pause,
  RefreshCw,
  Settings,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Zap,
  Users,
  DollarSign,
  Target,
  GitBranch,
  Cpu,
  Brain,
  Sparkles,
  ChevronRight,
  Shield,
  Rocket,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { autonomousService, MarketSimulation } from '@/services/context-marketing/autonomous.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  parameters: {
    budget: number;
    duration: number;
    channels: string[];
    target_audience: string;
    strategy_type: string;
    competitive_response: boolean;
    market_conditions: 'stable' | 'volatile' | 'declining';
  };
  constraints?: {
    max_spend_per_day?: number;
    required_roi?: number;
    brand_safety?: boolean;
  };
}

interface SimulationResult {
  scenario_id: string;
  outcomes: MarketSimulation;
  confidence: number;
  risks: string[];
  opportunities: string[];
  recommendation: string;
}

export default function StrategyLaboratory() {
  const [loading, setLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<SimulationScenario | null>(null);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [showNewScenarioDialog, setShowNewScenarioDialog] = useState(false);
  
  // Scenario parameters
  const [scenarioParams, setScenarioParams] = useState({
    name: '',
    budget: 50000,
    duration: 30,
    channels: ['email', 'social', 'search'],
    target_audience: 'broad',
    strategy_type: 'balanced',
    competitive_response: true,
    market_conditions: 'stable' as 'stable' | 'volatile' | 'declining'
  });

  // Predefined scenarios
  const predefinedScenarios: SimulationScenario[] = [
    {
      id: 'aggressive_growth',
      name: 'Aggressive Growth',
      description: 'High-risk, high-reward strategy focused on rapid market share capture',
      parameters: {
        budget: 100000,
        duration: 90,
        channels: ['search', 'social', 'display', 'video'],
        target_audience: 'competitors_customers',
        strategy_type: 'aggressive',
        competitive_response: true,
        market_conditions: 'stable'
      }
    },
    {
      id: 'defensive_retention',
      name: 'Defensive Retention',
      description: 'Focus on protecting existing customer base from competitor attacks',
      parameters: {
        budget: 50000,
        duration: 60,
        channels: ['email', 'direct_mail', 'phone'],
        target_audience: 'existing_customers',
        strategy_type: 'defensive',
        competitive_response: false,
        market_conditions: 'volatile'
      }
    },
    {
      id: 'efficient_scaling',
      name: 'Efficient Scaling',
      description: 'Balanced approach optimizing for sustainable growth and profitability',
      parameters: {
        budget: 75000,
        duration: 45,
        channels: ['search', 'email', 'social'],
        target_audience: 'lookalike',
        strategy_type: 'balanced',
        competitive_response: true,
        market_conditions: 'stable'
      }
    }
  ];

  const runSimulation = async (scenario: SimulationScenario) => {
    setLoading(true);
    setIsSimulating(true);
    
    try {
      // Run market simulation
      const result = await autonomousService.runMarketSimulation({
        name: scenario.name,
        ...scenario.parameters
      });

      // Calculate confidence based on parameters
      const confidence = calculateConfidence(scenario);

      // Generate risks and opportunities
      const risks = generateRisks(scenario, result);
      const opportunities = generateOpportunities(scenario, result);
      const recommendation = generateRecommendation(result, confidence);

      const simulationResult: SimulationResult = {
        scenario_id: scenario.id,
        outcomes: result,
        confidence,
        risks,
        opportunities,
        recommendation
      };

      setSimulationResults(prev => [simulationResult, ...prev]);
      toast.success('Simulation completed successfully');
    } catch (error) {
      console.error('Simulation error:', error);
      toast.error('Failed to run simulation');
    } finally {
      setLoading(false);
      setIsSimulating(false);
    }
  };

  const calculateConfidence(scenario: SimulationScenario): number {
    let confidence = 85; // Base confidence
    
    // Adjust based on market conditions
    if (scenario.parameters.market_conditions === 'volatile') confidence -= 10;
    if (scenario.parameters.market_conditions === 'declining') confidence -= 15;
    
    // Adjust based on strategy aggressiveness
    if (scenario.parameters.strategy_type === 'aggressive') confidence -= 5;
    if (scenario.parameters.strategy_type === 'defensive') confidence += 5;
    
    // Adjust based on competitive response
    if (scenario.parameters.competitive_response) confidence -= 5;
    
    return Math.max(60, Math.min(95, confidence));
  };

  const generateRisks(scenario: SimulationScenario, result: MarketSimulation): string[] {
    const risks = [...result.predicted_outcomes.risks];
    
    if (scenario.parameters.budget > 75000) {
      risks.push('High budget exposure in case of underperformance');
    }
    
    if (scenario.parameters.strategy_type === 'aggressive') {
      risks.push('Brand safety concerns with aggressive tactics');
      risks.push('Potential customer backlash');
    }
    
    if (scenario.parameters.channels.includes('video')) {
      risks.push('High production costs for video content');
    }
    
    return risks;
  };

  const generateOpportunities(scenario: SimulationScenario, result: MarketSimulation): string[] {
    const opportunities = [];
    
    if (result.predicted_outcomes.roi > 200) {
      opportunities.push('High ROI potential - consider increasing budget');
    }
    
    if (scenario.parameters.target_audience === 'competitors_customers') {
      opportunities.push('Market share capture from competitors');
    }
    
    if (scenario.parameters.channels.length < 3) {
      opportunities.push('Expand to additional channels for broader reach');
    }
    
    opportunities.push('First-mover advantage in emerging segments');
    opportunities.push('Build long-term customer relationships');
    
    return opportunities;
  };

  const generateRecommendation(result: MarketSimulation, confidence: number): string {
    if (confidence > 85 && result.predicted_outcomes.roi > 250) {
      return 'Strongly recommend proceeding with this strategy. High confidence and excellent ROI projection.';
    } else if (confidence > 70 && result.predicted_outcomes.roi > 150) {
      return 'Recommend proceeding with careful monitoring. Good potential but watch for risks.';
    } else if (confidence < 70) {
      return 'Consider alternative strategies or phased approach to reduce risk.';
    } else {
      return 'Marginal returns expected. Optimize strategy parameters before proceeding.';
    }
  };

  const createCustomScenario = () => {
    const customScenario: SimulationScenario = {
      id: `custom_${Date.now()}`,
      name: scenarioParams.name,
      description: 'Custom simulation scenario',
      parameters: {
        ...scenarioParams
      }
    };
    
    setSelectedScenario(customScenario);
    setShowNewScenarioDialog(false);
    runSimulation(customScenario);
  };

  const getOutcomeIcon = (value: number, threshold: number) => {
    if (value >= threshold) {
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    } else {
      return <TrendingDown className="w-5 h-5 text-red-600" />;
    }
  };

  const getRiskLevelBadge = (risks: string[]) => {
    if (risks.length <= 2) {
      return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
    } else if (risks.length <= 4) {
      return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <FlaskConical className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Strategy Laboratory
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Test marketing strategies in simulated environments
            </p>
          </div>
        </div>
        <Button onClick={() => setShowNewScenarioDialog(true)}>
          <Sparkles className="w-4 h-4 mr-2" />
          New Scenario
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario Selection */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Simulation Scenarios</CardTitle>
              <CardDescription>Choose or create a strategy to test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {predefinedScenarios.map((scenario) => (
                <motion.button
                  key={scenario.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedScenario(scenario)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border transition-all",
                    selectedScenario?.id === scenario.id
                      ? "border-purple-600 bg-purple-50 dark:bg-purple-900/20"
                      : "hover:border-gray-400"
                  )}
                >
                  <h4 className="font-medium mb-1">{scenario.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {scenario.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="secondary">
                      ${(scenario.parameters.budget / 1000).toFixed(0)}K budget
                    </Badge>
                    <Badge variant="secondary">
                      {scenario.parameters.duration}d
                    </Badge>
                  </div>
                </motion.button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Simulation Control & Results */}
        <div className="lg:col-span-2 space-y-6">
          {selectedScenario ? (
            <>
              {/* Scenario Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedScenario.name}</CardTitle>
                      <CardDescription>Simulation parameters and controls</CardDescription>
                    </div>
                    <Button
                      onClick={() => runSimulation(selectedScenario)}
                      disabled={isSimulating}
                    >
                      {isSimulating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Simulating...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Run Simulation
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <Label className="text-xs">Budget</Label>
                      <p className="font-medium">${selectedScenario.parameters.budget.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Duration</Label>
                      <p className="font-medium">{selectedScenario.parameters.duration} days</p>
                    </div>
                    <div>
                      <Label className="text-xs">Strategy Type</Label>
                      <p className="font-medium capitalize">{selectedScenario.parameters.strategy_type}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Market Conditions</Label>
                      <p className="font-medium capitalize">{selectedScenario.parameters.market_conditions}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Channels</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedScenario.parameters.channels.map(channel => (
                        <Badge key={channel} variant="secondary">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Simulation Results */}
              {simulationResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Simulation Results</CardTitle>
                    <CardDescription>Predicted outcomes and recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="latest" className="space-y-4">
                      <TabsList>
                        <TabsTrigger value="latest">Latest Result</TabsTrigger>
                        <TabsTrigger value="comparison">Compare Scenarios</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                      </TabsList>

                      <TabsContent value="latest" className="space-y-4">
                        {simulationResults[0] && (
                          <div className="space-y-4">
                            {/* Outcome Predictions */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm flex items-center justify-between">
                                    Revenue
                                    {getOutcomeIcon(
                                      simulationResults[0].outcomes.predicted_outcomes.revenue,
                                      2000000
                                    )}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-2xl font-bold">
                                    ${(simulationResults[0].outcomes.predicted_outcomes.revenue / 1000000).toFixed(1)}M
                                  </p>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm flex items-center justify-between">
                                    Market Share
                                    {getOutcomeIcon(
                                      simulationResults[0].outcomes.predicted_outcomes.market_share,
                                      10
                                    )}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-2xl font-bold">
                                    {simulationResults[0].outcomes.predicted_outcomes.market_share}%
                                  </p>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm flex items-center justify-between">
                                    New Customers
                                    {getOutcomeIcon(
                                      simulationResults[0].outcomes.predicted_outcomes.customer_acquisition,
                                      3000
                                    )}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <p className="text-2xl font-bold">
                                    {simulationResults[0].outcomes.predicted_outcomes.customer_acquisition.toLocaleString()}
                                  </p>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Confidence & Risk */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center gap-4">
                                <div>
                                  <Label className="text-xs">Confidence Level</Label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Progress value={simulationResults[0].confidence} className="w-24 h-2" />
                                    <span className="text-sm font-medium">{simulationResults[0].confidence}%</span>
                                  </div>
                                </div>
                                <Separator orientation="vertical" className="h-8" />
                                <div>
                                  <Label className="text-xs">Risk Assessment</Label>
                                  <div className="mt-1">
                                    {getRiskLevelBadge(simulationResults[0].risks)}
                                  </div>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                <BarChart3 className="w-4 h-4 mr-1" />
                                Details
                              </Button>
                            </div>

                            {/* Recommendation */}
                            <Alert className="border-purple-500">
                              <Brain className="w-4 h-4" />
                              <AlertTitle>AI Recommendation</AlertTitle>
                              <AlertDescription>
                                {simulationResults[0].recommendation}
                              </AlertDescription>
                            </Alert>

                            {/* Risks & Opportunities */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                                  Risks
                                </h4>
                                <ul className="space-y-1">
                                  {simulationResults[0].risks.map((risk, idx) => (
                                    <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                      <span className="text-orange-600 mt-1">•</span>
                                      {risk}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                  Opportunities
                                </h4>
                                <ul className="space-y-1">
                                  {simulationResults[0].opportunities.map((opp, idx) => (
                                    <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                      <span className="text-green-600 mt-1">•</span>
                                      {opp}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                              <Button className="flex-1">
                                <Rocket className="w-4 h-4 mr-2" />
                                Deploy Strategy
                              </Button>
                              <Button variant="outline" className="flex-1">
                                <GitBranch className="w-4 h-4 mr-2" />
                                Create Variant
                              </Button>
                              <Button variant="outline">
                                <Settings className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="comparison">
                        <div className="text-center py-8">
                          <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600 dark:text-gray-400">
                            Run multiple scenarios to compare results
                          </p>
                        </div>
                      </TabsContent>

                      <TabsContent value="history">
                        <div className="space-y-3">
                          {simulationResults.map((result, idx) => (
                            <div
                              key={idx}
                              className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">Scenario: {result.scenario_id}</p>
                                  <p className="text-sm text-gray-600">
                                    Revenue: ${(result.outcomes.predicted_outcomes.revenue / 1000000).toFixed(1)}M
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-20 text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Select a Scenario</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Choose a predefined scenario or create a custom one to start simulating
                </p>
                <Button onClick={() => setShowNewScenarioDialog(true)}>
                  Create Custom Scenario
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Scenario Dialog */}
      <Dialog open={showNewScenarioDialog} onOpenChange={setShowNewScenarioDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Custom Scenario</DialogTitle>
            <DialogDescription>
              Define your own simulation parameters
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="scenario-name">Scenario Name</Label>
              <Input
                id="scenario-name"
                value={scenarioParams.name}
                onChange={(e) => setScenarioParams(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Holiday Campaign Test"
              />
            </div>
            <div>
              <Label htmlFor="budget">Budget</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm">$</span>
                <Input
                  id="budget"
                  type="number"
                  value={scenarioParams.budget}
                  onChange={(e) => setScenarioParams(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="duration">Duration (days)</Label>
              <Input
                id="duration"
                type="number"
                value={scenarioParams.duration}
                onChange={(e) => setScenarioParams(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              />
            </div>
            <div className="col-span-2">
              <Label>Channels</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['email', 'social', 'search', 'display', 'video', 'direct_mail'].map(channel => (
                  <Button
                    key={channel}
                    variant={scenarioParams.channels.includes(channel) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setScenarioParams(prev => ({
                        ...prev,
                        channels: prev.channels.includes(channel)
                          ? prev.channels.filter(c => c !== channel)
                          : [...prev.channels, channel]
                      }));
                    }}
                  >
                    {channel}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="strategy-type">Strategy Type</Label>
              <Select
                value={scenarioParams.strategy_type}
                onValueChange={(value) => setScenarioParams(prev => ({ ...prev, strategy_type: value }))}
              >
                <SelectTrigger id="strategy-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                  <SelectItem value="defensive">Defensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="market-conditions">Market Conditions</Label>
              <Select
                value={scenarioParams.market_conditions}
                onValueChange={(value: any) => setScenarioParams(prev => ({ ...prev, market_conditions: value }))}
              >
                <SelectTrigger id="market-conditions">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="volatile">Volatile</SelectItem>
                  <SelectItem value="declining">Declining</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewScenarioDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createCustomScenario} disabled={!scenarioParams.name}>
              Create & Simulate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}