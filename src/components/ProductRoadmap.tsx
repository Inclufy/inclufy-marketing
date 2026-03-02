// src/components/context-marketing/ProductRoadmap.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Rocket,
  Lock,
  Unlock,
  Flag,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { productContextService } from '@/services/context-marketing/product-context.service';
import { toast } from 'sonner';

interface RoadmapItem {
  id: string;
  product_id: string;
  feature_name: string;
  feature_description: string;
  quarter: string;
  year: number;
  confidence_level: number;
  public_commitment: boolean;
  status: string;
  dependencies: string[];
  products?: {
    product_name: string;
    product_code?: string;
  };
}

interface ProductRoadmapProps {
  onUpdate: () => void;
}

export function ProductRoadmap({ onUpdate }: ProductRoadmapProps) {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    feature_name: '',
    feature_description: '',
    quarter: 'Q1',
    year: new Date().getFullYear(),
    confidence_level: 3,
    public_commitment: false,
    status: 'planned',
    dependencies: [] as string[]
  });

  const [newDependency, setNewDependency] = useState('');

  useEffect(() => {
    loadData();
    setCurrentQuarter();
  }, []);

  const setCurrentQuarter = () => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    setSelectedQuarter(`Q${currentQuarter}`);
    setSelectedYear(now.getFullYear());
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [roadmapData, productsData] = await Promise.all([
        productContextService.getRoadmap(),
        productContextService.getProducts()
      ]);
      setRoadmapItems(roadmapData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading roadmap:', error);
      toast.error('Failed to load roadmap data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await productContextService.updateRoadmapItem(editingItem.id, formData);
        toast.success('Roadmap item updated');
      } else {
        await productContextService.addRoadmapItem(formData);
        toast.success('Roadmap item added');
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadData();
      onUpdate();
    } catch (error) {
      console.error('Error saving roadmap item:', error);
      toast.error('Failed to save roadmap item');
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      feature_name: '',
      feature_description: '',
      quarter: 'Q1',
      year: new Date().getFullYear(),
      confidence_level: 3,
      public_commitment: false,
      status: 'planned',
      dependencies: []
    });
    setEditingItem(null);
    setNewDependency('');
  };

  const openEditDialog = (item: RoadmapItem) => {
    setEditingItem(item);
    setFormData({
      product_id: item.product_id,
      feature_name: item.feature_name,
      feature_description: item.feature_description,
      quarter: item.quarter,
      year: item.year,
      confidence_level: item.confidence_level,
      public_commitment: item.public_commitment,
      status: item.status,
      dependencies: item.dependencies || []
    });
    setIsDialogOpen(true);
  };

  const addDependency = () => {
    if (newDependency.trim()) {
      setFormData({
        ...formData,
        dependencies: [...formData.dependencies, newDependency]
      });
      setNewDependency('');
    }
  };

  const removeDependency = (index: number) => {
    setFormData({
      ...formData,
      dependencies: formData.dependencies.filter((_, i) => i !== index)
    });
  };

  const getConfidenceColor = (level: number) => {
    if (level >= 4) return 'text-green-600';
    if (level >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'delayed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <Trash2 className="w-4 h-4 text-gray-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getQuarters = () => {
    const years = [selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2];
    const quarters = [];
    
    for (const year of years) {
      for (let q = 1; q <= 4; q++) {
        quarters.push({ quarter: `Q${q}`, year });
      }
    }
    
    return quarters;
  };

  const groupItemsByQuarter = () => {
    const grouped = {};
    roadmapItems.forEach(item => {
      const key = `${item.year}-${item.quarter}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return grouped;
  };

  const groupedItems = groupItemsByQuarter();
  const quarters = getQuarters();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Roadmap</CardTitle>
              <CardDescription>
                Plan and track upcoming features and releases
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Feature
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Features marked with <Unlock className="inline w-3 h-3" /> are publicly committed. 
              Only mark features as public when you're confident about the timeline.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="timeline" className="space-y-4">
            <TabsList>
              <TabsTrigger value="timeline">Timeline View</TabsTrigger>
              <TabsTrigger value="kanban">Kanban View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading roadmap...</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[800px] space-y-4">
                    {quarters.map(({ quarter, year }) => {
                      const key = `${year}-${quarter}`;
                      const items = groupedItems[key] || [];
                      const isCurrentQuarter = quarter === selectedQuarter && year === selectedYear;
                      
                      return (
                        <div key={key} className={`border rounded-lg ${
                          isCurrentQuarter ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10' : ''
                        }`}>
                          <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <h3 className="font-medium text-lg">
                                  {quarter} {year}
                                </h3>
                                {isCurrentQuarter && (
                                  <Badge variant="secondary">Current</Badge>
                                )}
                                <Badge variant="outline">
                                  {items.length} items
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-4">
                            {items.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-4">
                                No features planned for this quarter
                              </p>
                            ) : (
                              <div className="space-y-3">
                                <AnimatePresence>
                                  {items.map((item, index) => (
                                    <motion.div
                                      key={item.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      exit={{ opacity: 0, x: 20 }}
                                      transition={{ delay: index * 0.05 }}
                                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border"
                                    >
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          {getStatusIcon(item.status)}
                                          <h4 className="font-medium">{item.feature_name}</h4>
                                          {item.public_commitment && (
                                            <Unlock className="w-4 h-4 text-green-600" />
                                          )}
                                          <Badge variant="outline" className="text-xs">
                                            {item.products?.product_name}
                                          </Badge>
                                        </div>
                                        {item.feature_description && (
                                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            {item.feature_description}
                                          </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2">
                                          <span className={`text-sm ${getConfidenceColor(item.confidence_level)}`}>
                                            Confidence: {item.confidence_level}/5
                                          </span>
                                          {item.dependencies.length > 0 && (
                                            <span className="text-sm text-gray-500">
                                              {item.dependencies.length} dependencies
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => openEditDialog(item)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="kanban" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['planned', 'in_progress', 'completed', 'delayed'].map((status) => {
                  const statusItems = roadmapItems.filter(item => item.status === status);
                  
                  return (
                    <div key={status} className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <h3 className="font-medium capitalize flex items-center gap-2">
                          {getStatusIcon(status)}
                          {status.replace('_', ' ')}
                        </h3>
                        <Badge variant="secondary">{statusItems.length}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {statusItems.map((item) => (
                          <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <h4 className="font-medium text-sm">{item.feature_name}</h4>
                                <div className="flex items-center justify-between">
                                  <Badge variant="outline" className="text-xs">
                                    {item.quarter} {item.year}
                                  </Badge>
                                  {item.public_commitment && (
                                    <Unlock className="w-3 h-3 text-green-600" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {item.products?.product_name}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="list" className="space-y-4">
              <div className="space-y-2">
                {roadmapItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(item.status)}
                            <h4 className="font-medium">{item.feature_name}</h4>
                            <Badge variant="outline">
                              {item.products?.product_name}
                            </Badge>
                            <Badge variant="secondary">
                              {item.quarter} {item.year}
                            </Badge>
                            {item.public_commitment && (
                              <Unlock className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                          {item.feature_description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {item.feature_description}
                            </p>
                          )}
                          <div className="flex items-center gap-6 mt-3">
                            <span className={`text-sm ${getConfidenceColor(item.confidence_level)}`}>
                              Confidence: {item.confidence_level}/5
                            </span>
                            <span className="text-sm capitalize">
                              Status: {item.status.replace('_', ' ')}
                            </span>
                            {item.dependencies.length > 0 && (
                              <span className="text-sm text-gray-500">
                                {item.dependencies.length} dependencies
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsDialogOpen(open);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Roadmap Item' : 'Add Roadmap Item'}
            </DialogTitle>
            <DialogDescription>
              Plan a feature for your product roadmap
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="product_id">Product *</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="feature_name">Feature Name *</Label>
              <Input
                id="feature_name"
                value={formData.feature_name}
                onChange={(e) => setFormData({ ...formData, feature_name: e.target.value })}
                placeholder="e.g., Advanced Analytics Dashboard"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="feature_description">Description</Label>
              <Textarea
                id="feature_description"
                value={formData.feature_description}
                onChange={(e) => setFormData({ ...formData, feature_description: e.target.value })}
                placeholder="Describe what this feature will do"
                rows={3}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quarter">Quarter</Label>
                <Select
                  value={formData.quarter}
                  onValueChange={(value) => setFormData({ ...formData, quarter: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q1">Q1</SelectItem>
                    <SelectItem value="Q2">Q2</SelectItem>
                    <SelectItem value="Q3">Q3</SelectItem>
                    <SelectItem value="Q4">Q4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 5}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="confidence_level">Confidence Level</Label>
              <Select
                value={formData.confidence_level.toString()}
                onValueChange={(value) => setFormData({ ...formData, confidence_level: parseInt(value) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Low</SelectItem>
                  <SelectItem value="2">2 - Low</SelectItem>
                  <SelectItem value="3">3 - Medium</SelectItem>
                  <SelectItem value="4">4 - High</SelectItem>
                  <SelectItem value="5">5 - Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="public_commitment"
                checked={formData.public_commitment}
                onCheckedChange={(checked) => setFormData({ ...formData, public_commitment: checked })}
              />
              <Label htmlFor="public_commitment" className="cursor-pointer">
                Public Commitment (visible to customers)
              </Label>
            </div>

            <div>
              <Label>Dependencies</Label>
              <div className="space-y-2 mt-2">
                {formData.dependencies.map((dep, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="secondary">{dep}</Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeDependency(index)}
                      className="h-6 w-6"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add dependency"
                    value={newDependency}
                    onChange={(e) => setNewDependency(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addDependency();
                      }
                    }}
                  />
                  <Button size="icon" variant="outline" onClick={addDependency}>
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
            <Button onClick={handleSubmit} disabled={!formData.product_id || !formData.feature_name}>
              {editingItem ? 'Update' : 'Add'} Feature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}