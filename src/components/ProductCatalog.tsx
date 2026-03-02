// src/components/context-marketing/ProductCatalog.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Zap,
  Link2,
  ChevronRight,
  Grid,
  List,
  Search,
  Filter
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
import { productContextService } from '@/services/context-marketing/product-context.service';
import { Product } from '@/types/context-marketing';
import { toast } from 'sonner';

interface ProductCatalogProps {
  onUpdate: () => void;
}

export function ProductCatalog({ onUpdate }: ProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    product_name: '',
    product_code: '',
    status: 'concept',
    product_type: 'software',
    description: '',
    launch_date: '',
    sunset_date: '',
    target_audience: [] as string[],
    key_features: [] as string[],
    differentiators: [] as string[],
    constraints: [] as any[],
    pricing_model: {
      type: '',
      tiers: [] as any[]
    }
  });

  // Form inputs for arrays
  const [newAudience, setNewAudience] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [newDifferentiator, setNewDifferentiator] = useState('');
  const [newConstraint, setNewConstraint] = useState({ type: 'availability', description: '' });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productContextService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        await productContextService.updateProduct(editingProduct.id, formData);
        toast.success('Product updated');
      } else {
        await productContextService.createProduct(formData);
        toast.success('Product created');
      }
      
      setIsDialogOpen(false);
      resetForm();
      loadProducts();
      onUpdate();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const resetForm = () => {
    setFormData({
      product_name: '',
      product_code: '',
      status: 'concept',
      product_type: 'software',
      description: '',
      launch_date: '',
      sunset_date: '',
      target_audience: [],
      key_features: [],
      differentiators: [],
      constraints: [],
      pricing_model: { type: '', tiers: [] }
    });
    setEditingProduct(null);
    setNewAudience('');
    setNewFeature('');
    setNewDifferentiator('');
    setNewConstraint({ type: 'availability', description: '' });
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      product_name: product.product_name,
      product_code: product.product_code || '',
      status: product.status,
      product_type: product.product_type,
      description: product.description || '',
      launch_date: product.launch_date || '',
      sunset_date: product.sunset_date || '',
      target_audience: product.target_audience || [],
      key_features: product.key_features || [],
      differentiators: product.differentiators || [],
      constraints: product.constraints || [],
      pricing_model: product.pricing_model || { type: '', tiers: [] }
    });
    setIsDialogOpen(true);
  };

  const addToArray = (arrayName: string, value: string) => {
    if (value.trim()) {
      setFormData({
        ...formData,
        [arrayName]: [...formData[arrayName as keyof typeof formData] as string[], value]
      });
    }
  };

  const removeFromArray = (arrayName: string, index: number) => {
    setFormData({
      ...formData,
      [arrayName]: (formData[arrayName as keyof typeof formData] as string[]).filter((_, i) => i !== index)
    });
  };

  const addConstraint = () => {
    if (newConstraint.description) {
      setFormData({
        ...formData,
        constraints: [...formData.constraints, newConstraint]
      });
      setNewConstraint({ type: 'availability', description: '' });
    }
  };

  const removeConstraint = (index: number) => {
    setFormData({
      ...formData,
      constraints: formData.constraints.filter((_, i) => i !== index)
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'beta':
        return <Zap className="w-4 h-4 text-blue-600" />;
      case 'pilot':
        return <Clock className="w-4 h-4 text-purple-600" />;
      case 'development':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'deprecated':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'live':
        return 'default';
      case 'beta':
      case 'pilot':
        return 'secondary';
      case 'deprecated':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Catalog</CardTitle>
              <CardDescription>
                Manage your product portfolio and features
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="beta">Beta</SelectItem>
                <SelectItem value="pilot">Pilot</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="concept">Concept</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Products Display */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading products...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">No products found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Start by adding your first product'}
              </p>
              {searchQuery || statusFilter !== 'all' ? (
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Product
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
                          onClick={() => openEditDialog(product)}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                            <Package className="w-7 h-7 text-white" />
                          </div>
                          <Badge variant={getStatusBadgeVariant(product.status)}>
                            {product.status}
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-2">{product.product_name}</h3>
                        {product.product_code && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Code: {product.product_code}
                          </p>
                        )}
                        
                        {product.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                            {product.description}
                          </p>
                        )}

                        <div className="space-y-2">
                          {product.key_features && product.key_features.length > 0 && (
                            <div className="flex items-center gap-2 text-sm">
                              <Zap className="w-3 h-3" />
                              <span>{product.key_features.length} features</span>
                            </div>
                          )}
                          
                          {product.target_audience && product.target_audience.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {product.target_audience.slice(0, 2).map((audience, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {audience}
                                </Badge>
                              ))}
                              {product.target_audience.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{product.target_audience.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {product.launch_date && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                            <Calendar className="w-3 h-3" />
                            Launched {new Date(product.launch_date).toLocaleDateString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            // List view
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {getStatusIcon(product.status)}
                            <div>
                              <h4 className="font-medium">{product.product_name}</h4>
                              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                <span>{product.product_type}</span>
                                {product.product_code && (
                                  <>
                                    <span>•</span>
                                    <span>{product.product_code}</span>
                                  </>
                                )}
                                {product.key_features && product.key_features.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>{product.key_features.length} features</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(product.status)}>
                              {product.status}
                            </Badge>
                            <Button 
                              size="icon" 
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(product);
                              }}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <DialogDescription>
              Define your product details and capabilities
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="constraints">Constraints</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="e.g., Inclufy Marketing Suite"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="product_code">Product Code</Label>
                  <Input
                    id="product_code"
                    value={formData.product_code}
                    onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                    placeholder="e.g., IMS-001"
                  />
                </div>

                <div>
                  <Label htmlFor="product_type">Product Type</Label>
                  <Select
                    value={formData.product_type}
                    onValueChange={(value) => setFormData({ ...formData, product_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="platform">Platform</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the product and its value proposition..."
                  rows={4}
                />
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
                      <SelectItem value="concept">Concept</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="pilot">Pilot</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="sunset">Sunset</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="launch_date">Launch Date</Label>
                  <Input
                    id="launch_date"
                    type="date"
                    value={formData.launch_date}
                    onChange={(e) => setFormData({ ...formData, launch_date: e.target.value })}
                  />
                </div>
              </div>

              {(formData.status === 'sunset' || formData.status === 'deprecated') && (
                <div>
                  <Label htmlFor="sunset_date">Sunset Date</Label>
                  <Input
                    id="sunset_date"
                    type="date"
                    value={formData.sunset_date}
                    onChange={(e) => setFormData({ ...formData, sunset_date: e.target.value })}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <div>
                <Label>Key Features</Label>
                <div className="space-y-2 mt-2">
                  {formData.key_features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="flex-1 text-sm">{feature}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromArray('key_features', index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a key feature..."
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToArray('key_features', newFeature);
                          setNewFeature('');
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        addToArray('key_features', newFeature);
                        setNewFeature('');
                      }}
                      size="icon"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Key Differentiators</Label>
                <div className="space-y-2 mt-2">
                  {formData.differentiators.map((diff, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="flex-1 text-sm">{diff}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromArray('differentiators', index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="What makes this product unique?"
                      value={newDifferentiator}
                      onChange={(e) => setNewDifferentiator(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToArray('differentiators', newDifferentiator);
                          setNewDifferentiator('');
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        addToArray('differentiators', newDifferentiator);
                        setNewDifferentiator('');
                      }}
                      size="icon"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audience" className="space-y-4">
              <div>
                <Label>Target Audience</Label>
                <div className="space-y-2 mt-2">
                  {formData.target_audience.map((audience, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="flex-1 text-sm">{audience}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromArray('target_audience', index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add target audience segment..."
                      value={newAudience}
                      onChange={(e) => setNewAudience(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addToArray('target_audience', newAudience);
                          setNewAudience('');
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        addToArray('target_audience', newAudience);
                        setNewAudience('');
                      }}
                      size="icon"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="constraints" className="space-y-4">
              <div>
                <Label>Product Constraints</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Define limitations or requirements for this product
                </p>
                
                <div className="space-y-2">
                  {formData.constraints.map((constraint, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <span className="text-sm font-medium">{constraint.type}:</span>
                        <span className="text-sm ml-2">{constraint.description}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeConstraint(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="space-y-2 mt-3">
                    <Select
                      value={newConstraint.type}
                      onValueChange={(value) => setNewConstraint({ ...newConstraint, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="availability">Regional Availability</SelectItem>
                        <SelectItem value="technical">Technical Requirement</SelectItem>
                        <SelectItem value="legal">Legal/Compliance</SelectItem>
                        <SelectItem value="dependency">Dependency</SelectItem>
                        <SelectItem value="performance">Performance Limit</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Describe the constraint..."
                        value={newConstraint.description}
                        onChange={(e) => setNewConstraint({ ...newConstraint, description: e.target.value })}
                      />
                      <Button onClick={addConstraint} size="icon" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.product_name}>
              {editingProduct ? 'Update' : 'Create'} Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}