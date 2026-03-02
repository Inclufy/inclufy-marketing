// src/components/context-marketing/StrategyPlanner.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  BarChart3,
  Zap,
  Clock,
  Flag,
  Layers,
  GitBranch,
  Sparkles,
  Save,
  FileText,
  Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { strategicPlanningService, StrategicPlan, Goal, Strategy, Scenario } from '@/services/context-marketing/strategic-planning.service';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface StrategyPlannerProps {
  onPlanCreated?: (plan: StrategicPlan) => void;
}

export default function StrategyPlanner({ onPlanCreated }: StrategyPlannerProps) {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<StrategicPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<StrategicPlan | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Plan creation state
  const [newPlan, setNewPlan] = useState({
    name: '',
    type: 'quarterly',
    description: ''
  });

  // Goal creation state
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    name: '',
    description: '',
    target_value: 0,
    current_value: 0,
    unit: '',
    deadline: ''
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const plansData = await strategicPlanningService.getPlans();
      setPlans(plansData);
      if (plansData.length > 0 && !selectedPlan) {
        setSelectedPlan(plansData[0]);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load strategic plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      const plan = await strategicPlanningService.createPlan(newPlan);
      toast.success('Strategic plan created!');
      setShowCreateDialog(false);
      setNewPlan({ name: '', type: 'quarterly', description: '' });
      await loadPlans();
      setSelectedPlan(plan);
      if (onPlanCreated) {
        onPlanCreated(plan);
      }
    } catch (error) {
      console.error('Error creating plan:', error);
      toast.error('Failed to create plan');
    }
  };

  const handleAddGoal = async () => {
    if (!selectedPlan) return;

    try {
      await strategicPlanningService.addGoal(selectedPlan.id, newGoal as Goal);
      toast.success('Goal added to plan!');
      setShowGoalDialog(false);
      setNewGoal({
        name: '',
        description: '',
        target_value: 0,
        current_value: 0,
        unit: '',
        deadline: ''
      });
      await loadPlans();
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Failed to add goal');
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!selectedPlan) return;

    try {
      setLoading(true);
      const suggestions = await strategicPlanningService.generateStrategySuggestions(selectedPlan.id);
      // In a real implementation, you would display these suggestions
      toast.success(`Generated ${suggestions.length} strategy suggestions!`);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const getGoalProgress = (goal: Goal) => {
    if (!goal.target_value) return 0;
    return Math.round((goal.current_value / goal.target_value) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'text-green-600';
      case 'at_risk': return 'text-yellow-600';
      case 'behind': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Target className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Strategy Planner
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered strategic marketing planning
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Plans Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Strategic Plans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {plans.length > 0 ? (
                plans.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedPlan?.id === plan.id
                        ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="font-medium">{plan.plan_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {plan.plan_type}
                      </Badge>
                      <span className={`text-xs ${getStatusColor(plan.status)}`}>
                        {plan.status}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
                  No plans yet. Create your first strategic plan!
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {selectedPlan ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedPlan.plan_name}</CardTitle>
                    <CardDescription>{selectedPlan.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="goals">Goals</TabsTrigger>
                    <TabsTrigger value="strategies">Strategies</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    {/* Plan Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Goals</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {selectedPlan.goals?.length || 0}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Active objectives
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Strategies</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {selectedPlan.strategies?.length || 0}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Implementation tactics
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Progress</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">
                            65%
                          </div>
                          <Progress value={65} className="mt-2" />
                        </CardContent>
                      </Card>
                    </div>

                    {/* AI Insights */}
                    <Card className="border-purple-500/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                          AI Strategic Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-600 mt-2" />
                          <div>
                            <p className="font-medium">Strong momentum on digital channels</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Your digital marketing goals are 23% ahead of schedule
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-yellow-600 mt-2" />
                          <div>
                            <p className="font-medium">Content production needs attention</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Current pace won't meet Q4 content goals
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                          <div>
                            <p className="font-medium">Consider budget reallocation</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Shift 15% from traditional to digital for better ROI
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="goals" className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Strategic Goals</h3>
                      <Button onClick={() => setShowGoalDialog(true)} size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Goal
                      </Button>
                    </div>

                    {selectedPlan.goals && selectedPlan.goals.length > 0 ? (
                      selectedPlan.goals.map((goal, index) => (
                        <motion.div
                          key={goal.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-lg ${getPriorityBadge(goal.priority || 'medium')}`}>
                                    <Target className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-base">{goal.name}</CardTitle>
                                    <CardDescription>{goal.description}</CardDescription>
                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                      <span className="flex items-center gap-1">
                                        <Flag className="w-3 h-3" />
                                        {goal.deadline ? format(new Date(goal.deadline), 'MMM d, yyyy') : 'No deadline'}
                                      </span>
                                      <Badge variant="outline" className={getStatusColor(goal.status || 'on_track')}>
                                        {goal.status || 'on_track'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold">
                                    {goal.current_value}/{goal.target_value}
                                  </div>
                                  <p className="text-xs text-gray-500">{goal.unit}</p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <Progress value={getGoalProgress(goal)} className="h-2" />
                              <div className="flex justify-between text-xs text-gray-500 mt-1">
                                <span>{getGoalProgress(goal)}% Complete</span>
                                <span>{goal.target_value - goal.current_value} {goal.unit} remaining</span>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600 dark:text-gray-400">
                            No goals defined yet. Add your first strategic goal!
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="strategies" className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-medium">Implementation Strategies</h3>
                      <Button onClick={handleGenerateSuggestions} size="sm" disabled={loading}>
                        <Sparkles className="w-4 h-4 mr-1" />
                        AI Suggestions
                      </Button>
                    </div>

                    {selectedPlan.strategies && selectedPlan.strategies.length > 0 ? (
                      selectedPlan.strategies.map((strategy, index) => (
                        <Card key={strategy.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{strategy.name}</CardTitle>
                              <Badge>{strategy.type}</Badge>
                            </div>
                            <CardDescription>{strategy.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm">Key Tactics</Label>
                                <ul className="mt-1 space-y-1">
                                  {strategy.tactics?.map((tactic, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                      <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5" />
                                      <span>{tactic}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="flex items-center justify-between pt-3 border-t">
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {strategy.owner || 'Unassigned'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {strategy.timeline || 'Ongoing'}
                                  </span>
                                </div>
                                <Badge variant="outline" className={getStatusColor(strategy.status || 'planned')}>
                                  {strategy.status || 'planned'}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-gray-600 dark:text-gray-400">
                            No strategies defined yet. Click AI Suggestions to get started!
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="timeline">
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Timeline visualization coming soon
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="scenarios">
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Layers className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">
                          Scenario planning coming soon
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-20 text-center">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No plan selected</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create a new strategic plan to get started
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Strategic Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Plan Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Strategic Plan</DialogTitle>
            <DialogDescription>
              Define a new strategic marketing plan with AI assistance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                value={newPlan.name}
                onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Q4 2024 Marketing Strategy"
              />
            </div>
            <div>
              <Label htmlFor="plan-type">Plan Type</Label>
              <Select 
                value={newPlan.type} 
                onValueChange={(value) => setNewPlan(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="plan-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="product_launch">Product Launch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="plan-description">Description</Label>
              <Textarea
                id="plan-description"
                value={newPlan.description}
                onChange={(e) => setNewPlan(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your strategic objectives..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePlan} disabled={!newPlan.name}>
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Goal Dialog */}
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Strategic Goal</DialogTitle>
            <DialogDescription>
              Define a measurable goal for your plan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="goal-name">Goal Name</Label>
              <Input
                id="goal-name"
                value={newGoal.name}
                onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Increase website conversions"
              />
            </div>
            <div>
              <Label htmlFor="goal-description">Description</Label>
              <Textarea
                id="goal-description"
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what success looks like..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="current-value">Current Value</Label>
                <Input
                  id="current-value"
                  type="number"
                  value={newGoal.current_value}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, current_value: parseInt(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="target-value">Target Value</Label>
                <Input
                  id="target-value"
                  type="number"
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, target_value: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={newGoal.unit}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="conversions, %, users"
                />
              </div>
              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGoalDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddGoal} disabled={!newGoal.name}>
              Add Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}