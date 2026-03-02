// src/components/context-marketing/ProductEcosystem.tsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  GitBranch, 
  Plus, 
  Trash2, 
  Package,
  Link2,
  ArrowRight,
  ArrowLeftRight,
  AlertCircle,
  Info,
  Layers,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { productContextService } from '@/services/context-marketing/product-context.service';
import { toast } from 'sonner';

interface Product {
  id: string;
  product_name: string;
  status: string;
  product_type: string;
}

interface Relationship {
  product_id: string;
  related_product_id: string;
  relationship_type: string;
  description?: string;
}

interface EcosystemNode {
  id: string;
  label: string;
  status: string;
  type: string;
}

interface EcosystemEdge {
  source: string;
  target: string;
  type: string;
  label?: string;
}

interface ProductEcosystemProps {
  onUpdate: () => void;
}

export function ProductEcosystem({ onUpdate }: ProductEcosystemProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [ecosystem, setEcosystem] = useState<{ nodes: EcosystemNode[], edges: EcosystemEdge[] }>({ 
    nodes: [], 
    edges: [] 
  });
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const canvasRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    related_product_id: '',
    relationship_type: 'depends_on',
    description: ''
  });

  useEffect(() => {
    loadEcosystem();
  }, []);

  const loadEcosystem = async () => {
    try {
      setLoading(true);
      const [productsData, ecosystemData] = await Promise.all([
        productContextService.getProducts(),
        productContextService.getProductEcosystem()
      ]);
      setProducts(productsData);
      setEcosystem(ecosystemData);
    } catch (error) {
      console.error('Error loading ecosystem:', error);
      toast.error('Failed to load product ecosystem');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await productContextService.createProductRelationship(formData);
      toast.success('Product relationship created');
      
      setIsDialogOpen(false);
      resetForm();
      loadEcosystem();
      onUpdate();
    } catch (error) {
      console.error('Error creating relationship:', error);
      toast.error('Failed to create relationship');
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      related_product_id: '',
      relationship_type: 'depends_on',
      description: ''
    });
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case 'depends_on':
        return <ArrowRight className="w-4 h-4" />;
      case 'integrates_with':
        return <ArrowLeftRight className="w-4 h-4" />;
      case 'replaces':
        return <RefreshCw className="w-4 h-4" />;
      case 'bundles_with':
        return <Package className="w-4 h-4" />;
      case 'complements':
        return <Layers className="w-4 h-4" />;
      case 'conflicts_with':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Link2 className="w-4 h-4" />;
    }
  };

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'depends_on':
        return '#3b82f6'; // blue
      case 'integrates_with':
        return '#10b981'; // green
      case 'replaces':
        return '#f59e0b'; // yellow
      case 'conflicts_with':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const getNodePosition = (index: number, total: number) => {
    const centerX = 400;
    const centerY = 300;
    const radius = 200;
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  };

  const renderEcosystemVisualization = () => {
    if (ecosystem.nodes.length === 0) return null;

    const nodePositions = {};
    ecosystem.nodes.forEach((node, index) => {
      nodePositions[node.id] = getNodePosition(index, ecosystem.nodes.length);
    });

    return (
      <svg width="800" height="600" className="w-full h-full">
        {/* Render edges */}
        {ecosystem.edges.map((edge, index) => {
          const start = nodePositions[edge.source];
          const end = nodePositions[edge.target];
          
          if (!start || !end) return null;

          return (
            <g key={`edge-${index}`}>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={getRelationshipColor(edge.type)}
                strokeWidth="2"
                strokeDasharray={edge.type === 'conflicts_with' ? '5,5' : undefined}
              />
              {edge.label && (
                <text
                  x={(start.x + end.x) / 2}
                  y={(start.y + end.y) / 2}
                  textAnchor="middle"
                  className="text-xs fill-gray-600 dark:fill-gray-400"
                >
                  {edge.type.replace('_', ' ')}
                </text>
              )}
            </g>
          );
        })}

        {/* Render nodes */}
        {ecosystem.nodes.map((node) => {
          const pos = nodePositions[node.id];
          const isSelected = selectedProduct === node.id;
          
          return (
            <motion.g
              key={node.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="cursor-pointer"
              onClick={() => setSelectedProduct(node.id)}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r="40"
                fill={isSelected ? '#7c3aed' : '#e5e7eb'}
                stroke={isSelected ? '#5b21b6' : '#d1d5db'}
                strokeWidth="2"
                className="transition-all"
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-medium fill-gray-900 dark:fill-gray-100 pointer-events-none"
              >
                {node.label.length > 15 ? node.label.substring(0, 12) + '...' : node.label}
              </text>
              <text
                x={pos.x}
                y={pos.y + 15}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400 pointer-events-none"
              >
                {node.status}
              </text>
            </motion.g>
          );
        })}
      </svg>
    );
  };

  const getProductRelationships = (productId: string) => {
    return ecosystem.edges.filter(
      edge => edge.source === productId || edge.target === productId
    );
  };

  const availableProducts = products.filter(
    p => formData.product_id && p.id !== formData.product_id
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Product Ecosystem</CardTitle>
              <CardDescription>
                Visualize relationships and dependencies between products
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={loadEcosystem}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Relationship
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Click on products to see their relationships. Lines represent different types of connections between products.
            </AlertDescription>
          </Alert>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading ecosystem...</div>
            </div>
          ) : ecosystem.nodes.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">No product relationships defined</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start by creating relationships between your products
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Relationship
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Visualization */}
              <div className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
                <div ref={canvasRef} className="relative h-[600px]">
                  {renderEcosystemVisualization()}
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { type: 'depends_on', label: 'Depends On' },
                  { type: 'integrates_with', label: 'Integrates With' },
                  { type: 'replaces', label: 'Replaces' },
                  { type: 'bundles_with', label: 'Bundles With' },
                  { type: 'complements', label: 'Complements' },
                  { type: 'conflicts_with', label: 'Conflicts With' }
                ].map(({ type, label }) => (
                  <div key={type} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded">
                    {getRelationshipIcon(type)}
                    <span className="text-sm">{label}</span>
                    <div 
                      className="w-12 h-1 ml-auto"
                      style={{ 
                        backgroundColor: getRelationshipColor(type),
                        borderStyle: type === 'conflicts_with' ? 'dashed' : 'solid'
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Selected Product Details */}
              {selectedProduct && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {ecosystem.nodes.find(n => n.id === selectedProduct)?.label}
                    </CardTitle>
                    <CardDescription>Product relationships</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {getProductRelationships(selectedProduct).map((rel, index) => {
                        const isSource = rel.source === selectedProduct;
                        const relatedProduct = ecosystem.nodes.find(
                          n => n.id === (isSource ? rel.target : rel.source)
                        );
                        
                        return (
                          <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            {getRelationshipIcon(rel.type)}
                            <span className="text-sm">
                              {isSource ? (
                                <>
                                  <span className="font-medium">{rel.type.replace(/_/g, ' ')}</span>
                                  {' '}
                                  {relatedProduct?.label}
                                </>
                              ) : (
                                <>
                                  {relatedProduct?.label}
                                  {' '}
                                  <span className="font-medium">{rel.type.replace(/_/g, ' ')}</span>
                                  {' this product'}
                                </>
                              )}
                            </span>
                            {rel.label && (
                              <span className="text-xs text-gray-500">{rel.label}</span>
                            )}
                          </div>
                        );
                      })}
                      
                      {getProductRelationships(selectedProduct).length === 0 && (
                        <p className="text-sm text-gray-500">No relationships defined for this product</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Relationship Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) resetForm();
        setIsDialogOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product Relationship</DialogTitle>
            <DialogDescription>
              Define how your products relate to each other
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="product_id">From Product *</Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select source product" />
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
              <Label htmlFor="relationship_type">Relationship Type *</Label>
              <Select
                value={formData.relationship_type}
                onValueChange={(value) => setFormData({ ...formData, relationship_type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="depends_on">Depends On</SelectItem>
                  <SelectItem value="integrates_with">Integrates With</SelectItem>
                  <SelectItem value="replaces">Replaces</SelectItem>
                  <SelectItem value="complements">Complements</SelectItem>
                  <SelectItem value="bundles_with">Bundles With</SelectItem>
                  <SelectItem value="conflicts_with">Conflicts With</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="related_product_id">To Product *</Label>
              <Select
                value={formData.related_product_id}
                onValueChange={(value) => setFormData({ ...formData, related_product_id: value })}
                disabled={!formData.product_id}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select target product" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the nature of this relationship"
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.product_id || !formData.related_product_id}
            >
              Create Relationship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}