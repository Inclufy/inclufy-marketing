// src/components/context-marketing/ProductContextDashboard.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Plus,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Layers,
  GitBranch,
  Rocket,
  Archive,
  Eye,
  Code,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { productContextService } from '@/services/context-marketing/product-context.service';
import { ProductCatalog } from '../ProductCatalog';
import { ProductRoadmap } from '../ProductRoadmap';
import { ProductEcosystem } from '../ProductEcosystem';
import { ProductValidation } from '../ProductValidation';
import { toast } from 'sonner';

interface ProductInsights {
  totalProducts: number;
  liveProducts: number;
  inDevelopment: number;
  roadmapItems: number;
  upcomingQuarter: number;
  productHealth: number;
}

export default function ProductContextDashboard() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<ProductInsights>({
    totalProducts: 0,
    liveProducts: 0,
    inDevelopment: 0,
    roadmapItems: 0,
    upcomingQuarter: 0,
    productHealth: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [validationIssues, setValidationIssues] = useState<any[]>([]);

  useEffect(() => {
    loadProductData();
  }, []);

  const loadProductData = async () => {
    try {
      setLoading(true);
      const productInsights = await productContextService.getProductInsights();
      setInsights(productInsights);
      
      // Update context completeness
      await productContextService.updateProductContextCompleteness();
    } catch (error) {
      console.error('Error loading product data:', error);
      toast.error('Failed to load product context');
    } finally {
      setLoading(false);
    }
  };

  const validateContent = async () => {
    try {
      // Example content validation
      const testContent = "Our new AI feature is now available to all customers";
      const result = await productContextService.validateProductClaim(testContent);
      setValidationIssues(result.issues);
    } catch (error) {
      console.error('Error validating content:', error);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'beta':
        return <Eye className="w-4 h-4 text-blue-600" />;
      case 'development':
        return <Code className="w-4 h-4 text-yellow-600" />;
      case 'deprecated':
        return <Archive className="w-4 h-4 text-red-600" />;
      default:
        return <Settings className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Package className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              Product Context
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your product catalog, roadmap, and ecosystem
            </p>
          </div>
        </div>
        <Button 
          onClick={loadProductData}
          variant="outline"
          disabled={loading}
        >
          <Settings className="w-4 h-4 mr-2" />
          Refresh Context
        </Button>
      </div>

      {/* Product Insights */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalProducts}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">In catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              Live
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{insights.liveProducts}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Available now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Code className="w-4 h-4 text-yellow-600" />
              In Dev
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{insights.inDevelopment}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Building</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{insights.roadmapItems}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Features planned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <Rocket className="w-4 h-4 text-purple-600" />
              Next Quarter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{insights.upcomingQuarter}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Launching soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Product Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthColor(insights.productHealth)}`}>
              {Math.round(insights.productHealth)}%
            </div>
            <Progress value={insights.productHealth} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Validation Issues Alert */}
      {validationIssues.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Product validation issues:</p>
              {validationIssues.map((issue, index) => (
                <p key={index} className="text-sm">
                  • {issue.message}
                </p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="catalog">Product Catalog</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="ecosystem">Ecosystem</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your product portfolio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => setActiveTab('catalog')}
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Add New Product
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => setActiveTab('roadmap')}
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Update Roadmap
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => setActiveTab('ecosystem')}
                >
                  <span className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    Map Dependencies
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => setActiveTab('validation')}
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Validate Content
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Context Guidelines</CardTitle>
                <CardDescription>Best practices for product information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Accurate Status</p>
                    <p className="text-xs text-gray-600">Keep product status current (live, beta, deprecated)</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Clear Constraints</p>
                    <p className="text-xs text-gray-600">Document availability limits and requirements</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Roadmap Accuracy</p>
                    <p className="text-xs text-gray-600">Only mark features as public when confirmed</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Dependency Mapping</p>
                    <p className="text-xs text-gray-600">Define product relationships and integrations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Status Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Product Portfolio Status</CardTitle>
              <CardDescription>Current state of your product catalog</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['live', 'beta', 'pilot', 'development', 'deprecated'].map((status) => {
                  const count = status === 'live' ? insights.liveProducts : 
                               status === 'development' ? insights.inDevelopment : 0;
                  const percentage = insights.totalProducts > 0 
                    ? (count / insights.totalProducts) * 100 
                    : 0;

                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className="w-32 flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="text-sm capitalize">{status}</span>
                      </div>
                      <div className="flex-1">
                        <Progress value={percentage} className="h-2" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog">
          <ProductCatalog onUpdate={loadProductData} />
        </TabsContent>

        <TabsContent value="roadmap">
          <ProductRoadmap onUpdate={loadProductData} />
        </TabsContent>

        <TabsContent value="ecosystem">
          <ProductEcosystem onUpdate={loadProductData} />
        </TabsContent>

        <TabsContent value="validation">
          <ProductValidation onUpdate={loadProductData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}