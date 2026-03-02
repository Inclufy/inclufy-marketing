// src/components/context-marketing/ContextGovernanceDashboard.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  FileWarning,
  BarChart,
  Activity,
  Lock,
  Unlock,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { contextGovernanceService } from '@/services/context-marketing/context-governance.service';
import { ContextHealthScore } from './context-marketing/ContextHealthScore';
import { toast } from 'sonner';

interface GovernanceSummary {
  overallScore: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  domains: Array<{
    domain: string;
    confidence: number;
    status: string;
  }>;
  recentAssumptions: any[];
  activeRules: number;
  recommendations: string[];
}

export function ContextGovernanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [governanceSummary, setGovernanceSummary] = useState<GovernanceSummary | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [domainDetails, setDomainDetails] = useState<any>(null);

  useEffect(() => {
    loadGovernanceData();
  }, []);

  const loadGovernanceData = async () => {
    try {
      setLoading(true);
      const summary = await contextGovernanceService.getGovernanceSummary();
      setGovernanceSummary(summary);
    } catch (error) {
      console.error('Error loading governance data:', error);
      toast.error('Failed to load governance data');
    } finally {
      setLoading(false);
    }
  };

  const loadDomainDetails = async (domain: string) => {
    try {
      const details = await contextGovernanceService.calculateDomainConfidence(domain);
      setDomainDetails(details);
      setSelectedDomain(domain);
    } catch (error) {
      console.error('Error loading domain details:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'good':
        return <Activity className="w-5 h-5 text-blue-600" />;
      case 'fair':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'poor':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'good':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'fair':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'poor':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getAssumptionIcon = (type: string) => {
    switch (type) {
      case 'data_gap':
        return <FileWarning className="w-4 h-4 text-yellow-600" />;
      case 'inference':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'default_value':
        return <Settings className="w-4 h-4 text-gray-600" />;
      case 'external_source':
        return <AlertCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-gray-500">Loading governance data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!governanceSummary) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Context Governance</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Confidence scoring, validation, and quality control
            </p>
          </div>
        </div>
        <Button 
          onClick={loadGovernanceData}
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Health */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Governance Health</CardTitle>
            <CardDescription>Overall confidence in your context</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ContextHealthScore score={governanceSummary.overallScore} size="md" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{governanceSummary.activeRules}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Validation rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Assumptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{governanceSummary.recentAssumptions.length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Made by system</p>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Alert */}
      {governanceSummary.recommendations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Governance Recommendations</AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1">
              {governanceSummary.recommendations.map((rec, index) => (
                <li key={index} className="text-sm">• {rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="confidence">Confidence Scores</TabsTrigger>
          <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
          <TabsTrigger value="rules">Validation Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Domain Confidence Overview</CardTitle>
              <CardDescription>
                Confidence levels across all context domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {governanceSummary.domains.map((domain) => (
                  <motion.div
                    key={domain.domain}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 rounded-lg ${getStatusColor(domain.status)} cursor-pointer hover:shadow-md transition-all`}
                    onClick={() => loadDomainDetails(domain.domain)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(domain.status)}
                        <div>
                          <h4 className="font-medium capitalize">{domain.domain} Context</h4>
                          <p className="text-sm opacity-75">
                            Click for detailed confidence breakdown
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{domain.confidence}%</div>
                        <Badge variant={domain.status === 'excellent' || domain.status === 'good' ? 'default' : 'secondary'}>
                          {domain.status}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Refusal Logic
                </CardTitle>
                <CardDescription>
                  When AI should say "I don't know"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="text-sm font-medium">Confidence &lt; 60%</span>
                    <Badge variant="destructive">Refuse</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="text-sm font-medium">High Impact Assumptions</span>
                    <Badge variant="destructive">Refuse</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <span className="text-sm font-medium">Missing Critical Data</span>
                    <Badge className="bg-yellow-600">Warn</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="text-sm font-medium">All Context Available</span>
                    <Badge className="bg-green-600">Proceed</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Quality Metrics
                </CardTitle>
                <CardDescription>
                  Context quality indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Data Completeness</span>
                      <span className="text-sm font-medium">
                        {Math.round(governanceSummary.domains.filter(d => d.confidence >= 60).length / governanceSummary.domains.length * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={governanceSummary.domains.filter(d => d.confidence >= 60).length / governanceSummary.domains.length * 100} 
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Validation Coverage</span>
                      <span className="text-sm font-medium">
                        {Math.min(governanceSummary.activeRules * 10, 100)}%
                      </span>
                    </div>
                    <Progress value={Math.min(governanceSummary.activeRules * 10, 100)} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Assumption Confidence</span>
                      <span className="text-sm font-medium">75%</span>
                    </div>
                    <Progress value={75} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="confidence" className="space-y-6">
          {selectedDomain && domainDetails ? (
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{selectedDomain} Context Confidence</CardTitle>
                <CardDescription>
                  Detailed breakdown of confidence factors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center mb-6">
                    <ContextHealthScore score={domainDetails.score} size="sm" />
                  </div>
                  
                  <div className="space-y-3">
                    {domainDetails.factors.map((factor: any, index: number) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{factor.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={factor.score >= 80 ? 'default' : factor.score >= 50 ? 'secondary' : 'destructive'}>
                              {factor.score}%
                            </Badge>
                            <span className="text-sm text-gray-500">Weight: {factor.weight}%</span>
                          </div>
                        </div>
                        <Progress value={factor.score} className="mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">{factor.reason}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Weighted Score</span>
                      <span className="text-2xl font-bold">{domainDetails.score}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select a domain from the Overview tab to see detailed confidence breakdown
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="assumptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Context Assumptions</CardTitle>
              <CardDescription>
                Assumptions made when context is incomplete
              </CardDescription>
            </CardHeader>
            <CardContent>
              {governanceSummary.recentAssumptions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No assumptions made - complete context available!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {governanceSummary.recentAssumptions.map((assumption: any, index: number) => (
                      <motion.div
                        key={assumption.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          {getAssumptionIcon(assumption.assumption_type)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline" className="capitalize">
                                {assumption.domain}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(assumption.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{assumption.assumption_text}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-500">
                                Confidence: {assumption.confidence_level}/5
                              </span>
                              <Badge 
                                variant={
                                  assumption.validation_status === 'verified' 
                                    ? 'default' 
                                    : assumption.validation_status === 'rejected' 
                                    ? 'destructive' 
                                    : 'secondary'
                                }
                                className="text-xs"
                              >
                                {assumption.validation_status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Rules</CardTitle>
              <CardDescription>
                Active rules for context validation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6">
                <Lock className="h-4 w-4" />
                <AlertTitle>Context Validation</AlertTitle>
                <AlertDescription>
                  These rules ensure AI-generated content is accurate and aligned with your context.
                  Rules prevent hallucinations and maintain consistency.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {/* Example rules - would be loaded from database */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Product Status Validation</h4>
                    <Badge variant="destructive">Required</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Content must not claim features are available if they're in development or on roadmap
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Pricing Consistency</h4>
                    <Badge variant="destructive">Required</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All pricing mentions must match defined pricing models in product catalog
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Regional Availability</h4>
                    <Badge className="bg-yellow-600">Warning</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Content should indicate regional restrictions where products have availability constraints
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Strategic Alignment</h4>
                    <Badge variant="secondary">Info</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generated content should align with defined strategic objectives and priorities
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}