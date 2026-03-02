// src/components/context-marketing/StrategicObjectives.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  AlertCircle,
  Flag
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { businessContextService } from '@/services/context-marketing/business-context.service';
import { toast } from 'sonner';

interface Objective {
  id: string;
  title: string;
  description: string;
  objective_type: string;
  priority: number;
  time_horizon: string;
  target_date?: string;
  status: string;
  success_metrics: any[];
  owner_name?: string;
  owner_role?: string;
}

interface StrategicObjectivesProps {
  onUpdate: () => void;
}

export function StrategicObjectives({ onUpdate }: StrategicObjectivesProps) {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    objective_type: 'operational',
    priority: 3,
    time_horizon: '1year',
    target_date: '',
    status: 'draft',
    owner_name: '',
    owner_role: '',
    success_metrics: [] as any[]
  });
  const [newMetric, setNewMetric] = useState({ name: '', target: '', unit: '' });

  useEffect(() => {
    loadObjectives();
  }, []);

  const loadObjectives = async () => {
    try {
      setLoading(true);
      const data = await businessContextService.getObjectives();
      setObjectives(data);
    } catch (error) {
      console.error('Error loading objectives:', error);
      toast.error('Failed to load strategic objectives');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingObjective) {
        await businessContextService.updateObjective(editingObjective.id, formData);
        toast.success('Objective updated');
      } else {
        await businessContextService.createObjective(formData);
        toast.success('Objective created');
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadObjectives();
      onUpdate();
    } catch (error) {
      console.error('Error saving objective:', error);
      toast.error('Failed to save objective');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      objective_type: 'operational',
      priority: 3,
      time_horizon: '1year',
      target_date: '',
      status: 'draft',
      owner_name: '',
      owner_role: '',
      success_metrics: []
    });
    setEditingObjective(null);
    setNewMetric({ name: '', target: '', unit: '' });
  };

  const openEditDialog = (objective: Objective) => {
    setEditingObjective(objective);
    setFormData({
      title: objective.title,
      description: objective.description,
      objective_type: objective.objective_type,
      priority: objective.priority,
      time_horizon: objective.time_horizon,
      target_date: objective.target_date || '',
      status: objective.status,
      owner_name: objective.owner_name || '',
      owner_role: objective.owner_role || '',
      success_metrics: objective.success_metrics || []
    });
    setIsDialogOpen(true);
  };

  const addMetric = () => {
    if (newMetric.name && newMetric.target) {
      setFormData({
        ...formData,
        success_metrics: [...formData.success_metrics, { ...newMetric, id: Date.now() }]
      });
      setNewMetric({ name: '', target: '', unit: '' });
    }
  };

  const removeMetric = (id: number) => {
    setFormData({
      ...formData,
      success_metrics: formData.success_metrics.filter((m: any) => m.id !== id)
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'paused':
        return <PauseCircle className="w-4 h-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'paused':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return 'text-red-600';
    if (priority === 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'financial':
        return <TrendingUp className="w-4 h-4" />;
      case 'customer':
        return <Target className="w-4 h-4" />;
      case 'operational':
        return <Clock className="w-4 h-4" />;
      case 'innovation':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Flag className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Strategic Objectives</CardTitle>
              <CardDescription>
                Define and track your organization's strategic goals
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Objective
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading objectives...</div>
            </div>
          ) : objectives.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">No strategic objectives defined</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start by adding your first strategic objective
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Objective
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {objectives.map((objective, index) => (
                  <motion.div
                    key={objective.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                objective.priority <= 2 
                                  ? 'bg-red-100 dark:bg-red-900/20' 
                                  : objective.priority === 3
                                  ? 'bg-yellow-100 dark:bg-yellow-900/20'
                                  : 'bg-green-100 dark:bg-green-900/20'
                              }`}>
                                {getTypeIcon(objective.objective_type)}
                              </div>
                              <div>
                                <h4 className="font-medium text-lg">{objective.title}</h4>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                  <span className="capitalize">{objective.objective_type}</span>
                                  <span>•</span>
                                  <span>{objective.time_horizon.replace('year', ' year')}</span>
                                  {objective.target_date && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(objective.target_date).toLocaleDateString()}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {objective.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {objective.description}
                              </p>
                            )}

                            {objective.success_metrics && objective.success_metrics.length > 0 && (
                              <div className="space-y-1 mb-3">
                                <p className="text-xs font-medium text-gray-500 uppercase">Success Metrics</p>
                                <div className="flex flex-wrap gap-2">
                                  {objective.success_metrics.map((metric: any, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {metric.name}: {metric.target} {metric.unit}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {objective.owner_name && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Owner:</span>
                                <span>{objective.owner_name}</span>
                                {objective.owner_role && <span>({objective.owner_role})</span>}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex flex-col items-end gap-2">
                              <Badge 
                                variant={getStatusBadgeVariant(objective.status)}
                                className="flex items-center gap-1"
                              >
                                {getStatusIcon(objective.status)}
                                {objective.status}
                              </Badge>
                              <span className={`text-sm font-medium ${getPriorityColor(objective.priority)}`}>
                                P{objective.priority}
                              </span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEditDialog(objective)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsDialogOpen(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingObjective ? 'Edit Strategic Objective' : 'Add Strategic Objective'}
            </DialogTitle>
            <DialogDescription>
              Define a strategic objective for your organization
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Objective Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Increase customer retention by 25%"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the objective and its importance"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="objective_type">Objective Type</Label>
                <Select
                  value={formData.objective_type}
                  onValueChange={(value) => setFormData({ ...formData, objective_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="innovation">Innovation</SelectItem>
                    <SelectItem value="sustainability">Sustainability</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority (1-5)</Label>
                <Select
                  value={formData.priority.toString()}
                  onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">P1 - Critical</SelectItem>
                    <SelectItem value="2">P2 - High</SelectItem>
                    <SelectItem value="3">P3 - Medium</SelectItem>
                    <SelectItem value="4">P4 - Low</SelectItem>
                    <SelectItem value="5">P5 - Nice to have</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time_horizon">Time Horizon</Label>
                <Select
                  value={formData.time_horizon}
                  onValueChange={(value) => setFormData({ ...formData, time_horizon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="3year">3 Years</SelectItem>
                    <SelectItem value="5year">5 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="target_date">Target Date</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="owner_name">Owner Name</Label>
                <Input
                  id="owner_name"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                  placeholder="Person responsible for this objective"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="owner_role">Owner Role</Label>
              <Input
                id="owner_role"
                value={formData.owner_role}
                onChange={(e) => setFormData({ ...formData, owner_role: e.target.value })}
                placeholder="e.g., VP of Sales, Product Manager"
              />
            </div>

            {/* Success Metrics */}
            <div>
              <Label>Success Metrics</Label>
              <div className="space-y-2 mt-2">
                {formData.success_metrics.map((metric: any) => (
                  <div key={metric.id} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="flex-1 text-sm">
                      {metric.name}: {metric.target} {metric.unit}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeMetric(metric.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Metric name"
                    value={newMetric.name}
                    onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Target"
                    value={newMetric.target}
                    onChange={(e) => setNewMetric({ ...newMetric, target: e.target.value })}
                    className="w-24"
                  />
                  <Input
                    placeholder="Unit"
                    value={newMetric.unit}
                    onChange={(e) => setNewMetric({ ...newMetric, unit: e.target.value })}
                    className="w-20"
                  />
                  <Button onClick={addMetric} size="icon" variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title}>
              {editingObjective ? 'Update' : 'Create'} Objective
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}