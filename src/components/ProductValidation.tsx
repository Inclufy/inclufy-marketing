// src/components/context-marketing/ProductValidation.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  FileText,
  Search,
  AlertTriangle,
  Info,
  ShieldCheck,
  FileWarning,
  Copy,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { productContextService } from '@/services/context-marketing/product-context.service';
import { toast } from 'sonner';

interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  feature?: string;
  product?: string;
  suggestion?: string;
}

interface ProductValidationProps {
  onUpdate: () => void;
}

export function ProductValidation({ onUpdate }: ProductValidationProps) {
  const [content, setContent] = useState('');
  const [validating, setValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    isValid: boolean;
    issues: ValidationIssue[];
  } | null>(null);
  const [activeTab, setActiveTab] = useState('validate');

  // Example content templates
  const contentExamples = [
    {
      title: 'Product Launch Announcement',
      content: `We're excited to announce that our Advanced Analytics Suite is now available to all customers! This powerful new feature includes real-time dashboards, predictive analytics, and automated reporting capabilities.`,
      hasIssues: false
    },
    {
      title: 'Feature Update (With Issues)',
      content: `Our AI-powered insights engine is launching next week for all users. The quantum computing module provides instant analysis across all regions. Premium tier users get unlimited API access.`,
      hasIssues: true
    },
    {
      title: 'Sales Pitch',
      content: `Transform your business with our Enterprise Platform. Unlike competitors, we offer seamless integration with all major systems, 24/7 support, and guaranteed 99.99% uptime. Available in select markets.`,
      hasIssues: true
    }
  ];

  const handleValidate = async () => {
    if (!content.trim()) {
      toast.error('Please enter content to validate');
      return;
    }

    try {
      setValidating(true);
      const results = await productContextService.validateProductClaim(content);
      setValidationResults(results);
      
      if (results.isValid) {
        toast.success('Content validated successfully!');
      } else {
        toast.error(`Found ${results.issues.length} validation issues`);
      }
    } catch (error) {
      console.error('Error validating content:', error);
      toast.error('Failed to validate content');
    } finally {
      setValidating(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getIssueTypeDescription = (type: string) => {
    switch (type) {
      case 'roadmap_claim':
        return 'Feature mentioned is on roadmap but not yet available';
      case 'deprecated_product':
        return 'Product mentioned is deprecated and should not be promoted';
      case 'constraint_violation':
        return 'Content violates product constraints or limitations';
      case 'missing_product':
        return 'Product mentioned is not in the catalog';
      case 'incorrect_status':
        return 'Product status is misrepresented';
      default:
        return 'General validation issue';
    }
  };

  const loadExample = (example: typeof contentExamples[0]) => {
    setContent(example.content);
    setValidationResults(null);
    toast.success(`Loaded "${example.title}" example`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Content Validation</CardTitle>
          <CardDescription>
            Validate marketing content against your product catalog to ensure accuracy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="validate">Validate Content</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
              <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
            </TabsList>

            <TabsContent value="validate" className="space-y-6">
              {/* Content Input */}
              <div>
                <Label htmlFor="content">Content to Validate</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your marketing content, product description, or sales pitch here..."
                  rows={8}
                  className="mt-2 font-mono text-sm"
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {content.length} characters
                  </span>
                  <Button 
                    onClick={handleValidate} 
                    disabled={validating || !content.trim()}
                  >
                    {validating ? (
                      <>
                        <Search className="w-4 h-4 mr-2 animate-pulse" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Validate Content
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Validation Results */}
              {validationResults && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Summary */}
                  <Alert className={validationResults.isValid ? 'border-green-500' : 'border-red-500'}>
                    {validationResults.isValid ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <AlertTitle>
                      {validationResults.isValid ? 'Content Validated' : 'Validation Issues Found'}
                    </AlertTitle>
                    <AlertDescription>
                      {validationResults.isValid ? (
                        'Your content has been validated against the product catalog. No issues found!'
                      ) : (
                        <>
                          Found {validationResults.issues.length} issue{validationResults.issues.length !== 1 && 's'} 
                          {' '}({validationResults.issues.filter(i => i.severity === 'error').length} error
                          {validationResults.issues.filter(i => i.severity === 'error').length !== 1 && 's'}, 
                          {' '}{validationResults.issues.filter(i => i.severity === 'warning').length} warning
                          {validationResults.issues.filter(i => i.severity === 'warning').length !== 1 && 's'})
                        </>
                      )}
                    </AlertDescription>
                  </Alert>

                  {/* Issues List */}
                  {validationResults.issues.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium">Issues Detected:</h3>
                      <AnimatePresence>
                        {validationResults.issues.map((issue, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card className={`border-l-4 ${
                              issue.severity === 'error' 
                                ? 'border-l-red-500' 
                                : issue.severity === 'warning'
                                ? 'border-l-yellow-500'
                                : 'border-l-blue-500'
                            }`}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  {getSeverityIcon(issue.severity)}
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant={getSeverityBadgeVariant(issue.severity)}>
                                        {issue.type.replace(/_/g, ' ')}
                                      </Badge>
                                      <span className="text-sm text-gray-600 dark:text-gray-400">
                                        {getIssueTypeDescription(issue.type)}
                                      </span>
                                    </div>
                                    <p className="font-medium">{issue.message}</p>
                                    {issue.feature && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Feature: <span className="font-mono">{issue.feature}</span>
                                      </p>
                                    )}
                                    {issue.product && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Product: <span className="font-mono">{issue.product}</span>
                                      </p>
                                    )}
                                    {issue.suggestion && (
                                      <Alert className="mt-2">
                                        <Info className="h-4 w-4" />
                                        <AlertDescription className="text-sm">
                                          <strong>Suggestion:</strong> {issue.suggestion}
                                        </AlertDescription>
                                      </Alert>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="examples" className="space-y-4">
              <div className="space-y-4">
                {contentExamples.map((example, index) => (
                  <Card 
                    key={index} 
                    className={`cursor-pointer hover:shadow-lg transition-all ${
                      example.hasIssues 
                        ? 'border-yellow-500 dark:border-yellow-600' 
                        : 'border-green-500 dark:border-green-600'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{example.title}</h4>
                            <Badge variant={example.hasIssues ? 'destructive' : 'default'}>
                              {example.hasIssues ? 'Has Issues' : 'Valid'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                            {example.content}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => loadExample(example)}
                          className="ml-4"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Load
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="guidelines" className="space-y-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Content Validation Guidelines</CardTitle>
                    <CardDescription>
                      Best practices for creating accurate product content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Verify Product Status</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Always check if a product is "live" before promoting it as available
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Respect Roadmap Commitments</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Only mention roadmap features if they're marked as "public commitment"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Honor Constraints</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Be transparent about regional availability, technical limitations, or capacity constraints
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Avoid Deprecated Products</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Never promote products marked as "deprecated" or "sunset"
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Common Validation Errors</CardTitle>
                    <CardDescription>
                      Issues to watch out for when creating content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-600">Roadmap Features as Live</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Claiming features are available when they're still in development
                          </p>
                          <p className="text-sm font-mono bg-red-50 dark:bg-red-900/20 p-2 mt-1 rounded">
                            ❌ "Our AI insights are available now"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-600">Ignoring Constraints</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Not mentioning important limitations or availability restrictions
                          </p>
                          <p className="text-sm font-mono bg-red-50 dark:bg-red-900/20 p-2 mt-1 rounded">
                            ❌ "Available to all customers worldwide"
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-600">Vague Timelines</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Using unclear language about feature availability
                          </p>
                          <p className="text-sm font-mono bg-yellow-50 dark:bg-yellow-900/20 p-2 mt-1 rounded">
                            ⚠️ "Coming soon" (specify quarter/year instead)
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Alert>
                  <FileWarning className="h-4 w-4" />
                  <AlertTitle>Remember</AlertTitle>
                  <AlertDescription>
                    Product validation helps maintain trust with customers by ensuring all claims are 
                    accurate and verifiable. When in doubt, be conservative with product claims.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}