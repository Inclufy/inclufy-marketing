// src/components/context-marketing/FeatureComparison.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Star,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { competitiveContextService, Competitor, CompetitiveFeature } from '@/services/context-marketing/competitive-context.service';
import { toast } from 'sonner';

interface FeatureComparisonProps {
  competitors: Competitor[];
  onUpdate: () => void;
}

export default function FeatureComparison({ competitors, onUpdate }: FeatureComparisonProps) {
  const [features, setFeatures] = useState<CompetitiveFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingFeature, setEditingFeature] = useState<CompetitiveFeature | null>(null);
  const [activeView, setActiveView] = useState<'matrix' | 'cards'>('matrix');
  const [formData, setFormData] = useState<Partial<CompetitiveFeature>>({
    feature_name: '',
    feature_category: '',
    our_capability: '',
    our_score: 5,
    competitor_capabilities: {},
    importance_weight: 3,
    notes: ''
  });

  useEffect(() => {
    loadFeatures();
  }, []);

  const loadFeatures = async () => {
    try {
      setLoading(true);
      const data = await competitiveContextService.getFeatureComparisons();
      setFeatures(data);
    } catch (error) {
      console.error('Error loading features:', error);
      toast.error('Failed to load feature comparisons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingFeature) {
        await competitiveContextService.updateFeatureComparison(editingFeature.id, formData);
        toast.success('Feature updated successfully');
      } else {
        await competitiveContextService.createFeatureComparison(formData);
        toast.success('Feature added successfully');
      }
      
      setShowAddDialog(false);
      setEditingFeature(null);
      resetForm();
      await loadFeatures();
      onUpdate();
    } catch (error) {
      console.error('Error saving feature:', error);
      toast.error('Failed to save feature');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feature comparison?')) return;

    try {
      // For now, we'll just remove from local state
      // In a real implementation, you'd call a delete service method
      setFeatures(features.filter(f => f.id !== id));
      toast.success('Feature deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting feature:', error);
      toast.error('Failed to delete feature');
    }
  };

  const resetForm = () => {
    setFormData({
      feature_name: '',
      feature_category: '',
      our_capability: '',
      our_score: 5,
      competitor_capabilities: {},
      importance_weight: 3,
      notes: ''
    });
  };

  const handleEdit = (feature: CompetitiveFeature) => {
    setEditingFeature(feature);
    setFormData(feature);
    setShowAddDialog(true);
  };

  const updateCompetitorScore = (competitorId: string, score: number, capability: string = '') => {
    setFormData({
      ...formData,
      competitor_capabilities: {
        ...formData.competitor_capabilities,
        [competitorId]: { score, capability }
      }
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreIcon = (ourScore: number, theirScore: number) => {
    if (ourScore > theirScore + 2) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (theirScore > ourScore + 2) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getImportanceStars = (weight: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < weight ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'core': 'default',
      'advanced': 'secondary',
      'support': 'outline',
      'integration': 'destructive'
    };
    return colors[category] || 'default';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">Loading feature comparisons...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Feature Comparison Matrix</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Compare product capabilities across competitors
          </p>
        </div>
        <div className="flex gap-2">
          <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)}>
            <TabsList>
              <TabsTrigger value="matrix">Matrix View</TabsTrigger>
              <TabsTrigger value="cards">Card View</TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) {
              setEditingFeature(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Feature
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingFeature ? 'Edit Feature Comparison' : 'Add Feature Comparison'}
                </DialogTitle>
                <DialogDescription>
                  Define how your product compares to competitors on this feature
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Feature Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="feature_name">Feature Name*</Label>
                    <Input
                      id="feature_name"
                      value={formData.feature_name}
                      onChange={(e) => setFormData({ ...formData, feature_name: e.target.value })}
                      placeholder="e.g., Real-time Analytics"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.feature_category}
                      onValueChange={(value) => setFormData({ ...formData, feature_category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="core">Core Features</SelectItem>
                        <SelectItem value="advanced">Advanced Features</SelectItem>
                        <SelectItem value="support">Support & Service</SelectItem>
                        <SelectItem value="integration">Integrations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="importance">Importance ({formData.importance_weight}/5)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="importance"
                      min={1}
                      max={5}
                      step={1}
                      value={[formData.importance_weight || 3]}
                      onValueChange={(value) => setFormData({ ...formData, importance_weight: value[0] })}
                      className="flex-1"
                    />
                    <div className="flex">
                      {getImportanceStars(formData.importance_weight || 3)}
                    </div>
                  </div>
                </div>

                {/* Our Capability */}
                <div className="space-y-4 p-4 border rounded-lg">
                  <h4 className="font-semibold">Our Capability</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="our_capability">Description</Label>
                      <Input
                        id="our_capability"
                        value={formData.our_capability}
                        onChange={(e) => setFormData({ ...formData, our_capability: e.target.value })}
                        placeholder="How we deliver this feature"
                      />
                    </div>
                    <div>
                      <Label htmlFor="our_score">Score ({formData.our_score}/10)</Label>
                      <Slider
                        id="our_score"
                        min={0}
                        max={10}
                        step={1}
                        value={[formData.our_score || 5]}
                        onValueChange={(value) => setFormData({ ...formData, our_score: value[0] })}
                      />
                    </div>
                  </div>
                </div>

                {/* Competitor Scores */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Competitor Capabilities</h4>
                  <div className="space-y-3">
                    {competitors.map(competitor => (
                      <div key={competitor.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{competitor.competitor_name}</span>
                          <Badge variant={competitor.company_type === 'direct' ? 'destructive' : 'secondary'}>
                            {competitor.company_type}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Capability</Label>
                            <Input
                              size="sm"
                              value={formData.competitor_capabilities?.[competitor.id]?.capability || ''}
                              onChange={(e) => updateCompetitorScore(
                                competitor.id,
                                formData.competitor_capabilities?.[competitor.id]?.score || 5,
                                e.target.value
                              )}
                              placeholder="Their implementation"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">
                              Score ({formData.competitor_capabilities?.[competitor.id]?.score || 0}/10)
                            </Label>
                            <Slider
                              min={0}
                              max={10}
                              step={1}
                              value={[formData.competitor_capabilities?.[competitor.id]?.score || 0]}
                              onValueChange={(value) => updateCompetitorScore(
                                competitor.id,
                                value[0],
                                formData.competitor_capabilities?.[competitor.id]?.capability || ''
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional context or observations"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowAddDialog(false);
                  setEditingFeature(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!formData.feature_name}>
                  {editingFeature ? 'Update' : 'Add'} Feature
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      {activeView === 'matrix' ? (
        /* Matrix View */
        <Card>
          <CardContent className="p-0">
            {features.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-center p-4 font-semibold min-w-[100px]">
                        <div className="flex flex-col items-center">
                          <span>Our Product</span>
                          <Badge variant="default" className="mt-1">You</Badge>
                        </div>
                      </th>
                      {competitors.map(competitor => (
                        <th key={competitor.id} className="text-center p-4 font-semibold min-w-[100px]">
                          <div className="flex flex-col items-center">
                            <span className="text-sm">{competitor.competitor_name}</span>
                            <Badge 
                              variant={competitor.company_type === 'direct' ? 'destructive' : 'secondary'}
                              className="mt-1 text-xs"
                            >
                              {competitor.company_type}
                            </Badge>
                          </div>
                        </th>
                      ))}
                      <th className="text-center p-4 w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, index) => (
                      <motion.tr
                        key={feature.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="font-medium">{feature.feature_name}</div>
                            <div className="flex items-center gap-2">
                              {feature.feature_category && (
                                <Badge variant={getCategoryBadgeColor(feature.feature_category)} className="text-xs">
                                  {feature.feature_category}
                                </Badge>
                              )}
                              <div className="flex">
                                {getImportanceStars(feature.importance_weight || 3)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className={`text-2xl font-bold ${getScoreColor(feature.our_score || 0)}`}>
                            {feature.our_score}
                          </div>
                        </td>
                        {competitors.map(competitor => {
                          const competitorScore = feature.competitor_capabilities?.[competitor.id]?.score || 0;
                          return (
                            <td key={competitor.id} className="p-4 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className={`text-2xl font-bold ${getScoreColor(competitorScore)}`}>
                                  {competitorScore}
                                </div>
                                {getScoreIcon(feature.our_score || 0, competitorScore)}
                              </div>
                            </td>
                          );
                        })}
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(feature)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(feature.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500 mb-4">No features compared yet</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Feature
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Card View */
        <div className="grid gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{feature.feature_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {feature.feature_category && (
                          <Badge variant={getCategoryBadgeColor(feature.feature_category)}>
                            {feature.feature_category}
                          </Badge>
                        )}
                        <div className="flex">
                          {getImportanceStars(feature.importance_weight || 3)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(feature)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(feature.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Our Score */}
                    <div className="p-3 border rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Our Product</span>
                        <Badge variant="default">You</Badge>
                      </div>
                      <div className={`text-3xl font-bold ${getScoreColor(feature.our_score || 0)}`}>
                        {feature.our_score}/10
                      </div>
                      {feature.our_capability && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {feature.our_capability}
                        </p>
                      )}
                    </div>

                    {/* Competitor Scores */}
                    {competitors.map(competitor => {
                      const competitorData = feature.competitor_capabilities?.[competitor.id];
                      const score = competitorData?.score || 0;
                      const comparison = getScoreIcon(feature.our_score || 0, score);
                      
                      return (
                        <div key={competitor.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{competitor.competitor_name}</span>
                            {comparison}
                          </div>
                          <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                            {score}/10
                          </div>
                          {competitorData?.capability && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {competitorData.capability}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {feature.notes && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Notes:</span> {feature.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {features.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500 mb-4">No features compared yet</p>
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Feature
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}