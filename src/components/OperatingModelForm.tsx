// src/components/context-marketing/OperatingModelForm.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  DollarSign, 
  Target, 
  Users, 
  Building2, 
  TrendingUp,
  Save,
  Plus,
  X,
  Layers,
  Link,
  Zap,
  Package
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { businessContextService } from '@/services/context-marketing/business-context.service';
import { toast } from 'sonner';

interface OperatingModelFormProps {
  onUpdate: () => void;
}

interface RevenueStream {
  name: string;
  type: string;
  percentage: number;
  description: string;
}

interface KeyActivity {
  name: string;
  category: string;
  importance: 'critical' | 'important' | 'supportive';
}

interface KeyResource {
  name: string;
  type: 'human' | 'physical' | 'intellectual' | 'financial';
  description: string;
}

interface Partnership {
  name: string;
  type: string;
  strategic_value: string;
}

export function OperatingModelForm({ onUpdate }: OperatingModelFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    business_model_type: 'b2b',
    revenue_model: 'subscription',
    target_market: '',
    value_proposition: '',
    maturity_stage: 'growth',
    revenue_streams: [] as RevenueStream[],
    key_activities: [] as KeyActivity[],
    key_resources: [] as KeyResource[],
    key_partnerships: [] as Partnership[],
    cost_structure: {
      fixed_costs: [] as string[],
      variable_costs: [] as string[],
      major_expenses: [] as string[]
    }
  });

  // Form inputs for new items
  const [newRevenue, setNewRevenue] = useState<RevenueStream>({ 
    name: '', type: 'subscription', percentage: 0, description: '' 
  });
  const [newActivity, setNewActivity] = useState<KeyActivity>({ 
    name: '', category: 'core', importance: 'important' 
  });
  const [newResource, setNewResource] = useState<KeyResource>({ 
    name: '', type: 'human', description: '' 
  });
  const [newPartnership, setNewPartnership] = useState<Partnership>({ 
    name: '', type: 'strategic', strategic_value: '' 
  });
  const [newCost, setNewCost] = useState({ type: 'fixed', name: '' });

  useEffect(() => {
    loadOperatingModel();
  }, []);

  const loadOperatingModel = async () => {
    try {
      setLoading(true);
      const model = await businessContextService.getOperatingModel();
      if (model) {
        setFormData({
          ...formData,
          ...model,
          revenue_streams: model.revenue_streams || [],
          key_activities: model.key_activities || [],
          key_resources: model.key_resources || [],
          key_partnerships: model.key_partnerships || [],
          cost_structure: model.cost_structure || {
            fixed_costs: [],
            variable_costs: [],
            major_expenses: []
          }
        });
      }
    } catch (error) {
      console.error('Error loading operating model:', error);
      toast.error('Failed to load operating model');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await businessContextService.saveOperatingModel(formData);
      toast.success('Operating model saved successfully');
      onUpdate();
    } catch (error) {
      console.error('Error saving operating model:', error);
      toast.error('Failed to save operating model');
    } finally {
      setSaving(false);
    }
  };

  const addRevenueStream = () => {
    if (newRevenue.name && newRevenue.percentage > 0) {
      setFormData({
        ...formData,
        revenue_streams: [...formData.revenue_streams, newRevenue]
      });
      setNewRevenue({ name: '', type: 'subscription', percentage: 0, description: '' });
    }
  };

  const removeRevenueStream = (index: number) => {
    setFormData({
      ...formData,
      revenue_streams: formData.revenue_streams.filter((_, i) => i !== index)
    });
  };

  const addActivity = () => {
    if (newActivity.name) {
      setFormData({
        ...formData,
        key_activities: [...formData.key_activities, newActivity]
      });
      setNewActivity({ name: '', category: 'core', importance: 'important' });
    }
  };

  const removeActivity = (index: number) => {
    setFormData({
      ...formData,
      key_activities: formData.key_activities.filter((_, i) => i !== index)
    });
  };

  const addResource = () => {
    if (newResource.name) {
      setFormData({
        ...formData,
        key_resources: [...formData.key_resources, newResource]
      });
      setNewResource({ name: '', type: 'human', description: '' });
    }
  };

  const removeResource = (index: number) => {
    setFormData({
      ...formData,
      key_resources: formData.key_resources.filter((_, i) => i !== index)
    });
  };

  const addPartnership = () => {
    if (newPartnership.name) {
      setFormData({
        ...formData,
        key_partnerships: [...formData.key_partnerships, newPartnership]
      });
      setNewPartnership({ name: '', type: 'strategic', strategic_value: '' });
    }
  };

  const removePartnership = (index: number) => {
    setFormData({
      ...formData,
      key_partnerships: formData.key_partnerships.filter((_, i) => i !== index)
    });
  };

  const addCost = () => {
    if (newCost.name) {
      const costType = newCost.type === 'fixed' ? 'fixed_costs' : 
                      newCost.type === 'variable' ? 'variable_costs' : 'major_expenses';
      
      setFormData({
        ...formData,
        cost_structure: {
          ...formData.cost_structure,
          [costType]: [...(formData.cost_structure[costType] || []), newCost.name]
        }
      });
      setNewCost({ type: 'fixed', name: '' });
    }
  };

  const removeCost = (type: string, index: number) => {
    setFormData({
      ...formData,
      cost_structure: {
        ...formData.cost_structure,
        [type]: formData.cost_structure[type].filter((_, i) => i !== index)
      }
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading operating model...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Operating Model</CardTitle>
              <CardDescription>
                Define how your business creates, delivers, and captures value
              </CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Model
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="costs">Costs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="business_model_type">Business Model Type</Label>
                  <Select
                    value={formData.business_model_type}
                    onValueChange={(value) => setFormData({ ...formData, business_model_type: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="b2b">B2B - Business to Business</SelectItem>
                      <SelectItem value="b2c">B2C - Business to Consumer</SelectItem>
                      <SelectItem value="b2g">B2G - Business to Government</SelectItem>
                      <SelectItem value="marketplace">Marketplace</SelectItem>
                      <SelectItem value="platform">Platform</SelectItem>
                      <SelectItem value="hybrid">Hybrid Model</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="revenue_model">Revenue Model</Label>
                  <Select
                    value={formData.revenue_model}
                    onValueChange={(value) => setFormData({ ...formData, revenue_model: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="licensing">Licensing</SelectItem>
                      <SelectItem value="advertising">Advertising</SelectItem>
                      <SelectItem value="freemium">Freemium</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="target_market">Target Market</Label>
                <Textarea
                  id="target_market"
                  value={formData.target_market}
                  onChange={(e) => setFormData({ ...formData, target_market: e.target.value })}
                  placeholder="Describe your primary target market segments..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="value_proposition">Value Proposition</Label>
                <Textarea
                  id="value_proposition"
                  value={formData.value_proposition}
                  onChange={(e) => setFormData({ ...formData, value_proposition: e.target.value })}
                  placeholder="What unique value do you deliver to customers?"
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="maturity_stage">Maturity Stage</Label>
                <Select
                  value={formData.maturity_stage}
                  onValueChange={(value) => setFormData({ ...formData, maturity_stage: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="scale">Scale</SelectItem>
                    <SelectItem value="mature">Mature</SelectItem>
                    <SelectItem value="transformation">Transformation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="revenue" className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Revenue Streams</h3>
                  <Badge variant="outline">
                    Total: {formData.revenue_streams.reduce((sum, r) => sum + r.percentage, 0)}%
                  </Badge>
                </div>

                <div className="space-y-3">
                  {formData.revenue_streams.map((stream, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <div className="font-medium">{stream.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {stream.type} • {stream.percentage}% of revenue
                        </div>
                        {stream.description && (
                          <div className="text-sm text-gray-500 mt-1">{stream.description}</div>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeRevenueStream(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Add Revenue Stream</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      placeholder="Stream name"
                      value={newRevenue.name}
                      onChange={(e) => setNewRevenue({ ...newRevenue, name: e.target.value })}
                    />
                    <Select
                      value={newRevenue.type}
                      onValueChange={(value) => setNewRevenue({ ...newRevenue, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="transaction">Transaction</SelectItem>
                        <SelectItem value="licensing">Licensing</SelectItem>
                        <SelectItem value="services">Services</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      placeholder="% of revenue"
                      value={newRevenue.percentage || ''}
                      onChange={(e) => setNewRevenue({ 
                        ...newRevenue, 
                        percentage: parseInt(e.target.value) || 0 
                      })}
                      className="w-32"
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newRevenue.description}
                      onChange={(e) => setNewRevenue({ ...newRevenue, description: e.target.value })}
                      className="flex-1"
                    />
                    <Button onClick={addRevenueStream} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Key Partnerships</h3>
                <div className="space-y-3">
                  {formData.key_partnerships.map((partnership, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <Link className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <div className="font-medium">{partnership.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {partnership.type} partner • {partnership.strategic_value}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removePartnership(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}

                  <div className="flex gap-3 mt-3">
                    <Input
                      placeholder="Partner name"
                      value={newPartnership.name}
                      onChange={(e) => setNewPartnership({ ...newPartnership, name: e.target.value })}
                    />
                    <Input
                      placeholder="Strategic value"
                      value={newPartnership.strategic_value}
                      onChange={(e) => setNewPartnership({ 
                        ...newPartnership, 
                        strategic_value: e.target.value 
                      })}
                    />
                    <Button onClick={addPartnership} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activities" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Key Activities</h3>
                <div className="space-y-3">
                  {formData.key_activities.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <Zap className={`w-5 h-5 ${
                        activity.importance === 'critical' 
                          ? 'text-red-600' 
                          : activity.importance === 'important' 
                          ? 'text-yellow-600' 
                          : 'text-gray-600'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium">{activity.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.category} • {activity.importance}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeActivity(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}

                  <div className="flex gap-3 mt-3">
                    <Input
                      placeholder="Activity name"
                      value={newActivity.name}
                      onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                      className="flex-1"
                    />
                    <Select
                      value={newActivity.importance}
                      onValueChange={(value: any) => setNewActivity({ ...newActivity, importance: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="important">Important</SelectItem>
                        <SelectItem value="supportive">Supportive</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addActivity} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Key Resources</h3>
                <div className="space-y-3">
                  {formData.key_resources.map((resource, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <Package className="w-5 h-5 text-purple-600" />
                      <div className="flex-1">
                        <div className="font-medium">{resource.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {resource.type} resource
                        </div>
                        {resource.description && (
                          <div className="text-sm text-gray-500 mt-1">{resource.description}</div>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeResource(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}

                  <div className="space-y-3 mt-3">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Resource name"
                        value={newResource.name}
                        onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                      />
                      <Select
                        value={newResource.type}
                        onValueChange={(value: any) => setNewResource({ ...newResource, type: value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="human">Human</SelectItem>
                          <SelectItem value="physical">Physical</SelectItem>
                          <SelectItem value="intellectual">Intellectual</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={addResource} size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Description (optional)"
                      value={newResource.description}
                      onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Fixed Costs</h4>
                  <div className="space-y-2">
                    {formData.cost_structure.fixed_costs.map((cost, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">{cost}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeCost('fixed_costs', index)}
                          className="h-6 w-6"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Variable Costs</h4>
                  <div className="space-y-2">
                    {formData.cost_structure.variable_costs.map((cost, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">{cost}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeCost('variable_costs', index)}
                          className="h-6 w-6"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Major Expenses</h4>
                  <div className="space-y-2">
                    {formData.cost_structure.major_expenses.map((cost, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="text-sm">{cost}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeCost('major_expenses', index)}
                          className="h-6 w-6"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Input
                  placeholder="Cost item"
                  value={newCost.name}
                  onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                  className="flex-1"
                />
                <Select
                  value={newCost.type}
                  onValueChange={(value) => setNewCost({ ...newCost, type: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Cost</SelectItem>
                    <SelectItem value="variable">Variable Cost</SelectItem>
                    <SelectItem value="major">Major Expense</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addCost} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}