// src/components/context-marketing/BusinessContextDashboard.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Target,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Plus,
  Settings,
  BarChart3,
  Users,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { businessContextService } from '@/services/context-marketing/business-context.service';
import { OrganizationChart } from '../OrganizationChart';
import { StrategicObjectives } from '../StrategicObjectives';
import { OperatingModelForm } from '../OperatingModelForm';
import { GovernanceFramework } from '../GovernanceFramework';
import { ContextHealthScore } from './ContextHealthScore';
import { toast } from 'sonner';

interface ContextScore {
  domain: string;
  completeness_score: number;
  missing_elements: string[];
}

export default function BusinessContextDashboard() {
  const [loading, setLoading] = useState(true);
  const [contextScores, setContextScores] = useState<ContextScore[]>([]);
  const [overallScore, setOverallScore] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [validationIssues, setValidationIssues] = useState<any[]>([]);

  useEffect(() => {
    loadContextData();
  }, []);

  const loadContextData = async () => {
    try {
      setLoading(true);
      
      // Get context completeness
      const completeness = await businessContextService.getContextCompleteness();
      setContextScores(completeness.domains);
      setOverallScore(completeness.overall);

      // Validate context
      const validation = await businessContextService.validateBusinessContext();
      setValidationIssues(validation.issues);
    } catch (error) {
      console.error('Error loading context:', error);
      toast.error('Failed to load business context');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Business Context
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Define your organization, strategy, and operating model
            </p>
          </div>
        </div>
        <Button 
          onClick={loadContextData}
          variant="outline"
          disabled={loading}
        >
          <Settings className="w-4 h-4 mr-2" />
          Refresh Context
        </Button>
      </div>

      {/* Context Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Context Health</CardTitle>
            <CardDescription>Overall business context completeness</CardDescription>
          </CardHeader>
          <CardContent>
            <ContextHealthScore score={overallScore} />
            <div className="mt-4 space-y-2">
              {contextScores.map((score) => (
                <div key={score.domain} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{score.domain} Context</span>
                  <div className="flex items-center gap-2">
                    <Progress value={score.completeness_score} className="w-20" />
                    <Badge variant={getScoreBadgeVariant(score.completeness_score)}>
                      {Math.round(score.completeness_score)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Ready
            </CardTitle>
            <CardDescription>Completed context areas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {contextScores.filter(s => s.completeness_score >= 80).length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              of {contextScores.length} domains
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              Issues
            </CardTitle>
            <CardDescription>Validation warnings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {validationIssues.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {validationIssues.filter(i => i.severity === 'error').length} critical
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Validation Issues Alert */}
      {validationIssues.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Context validation issues:</p>
              {validationIssues.slice(0, 3).map((issue, index) => (
                <p key={index} className="text-sm">
                  • {issue.message}
                </p>
              ))}
              {validationIssues.length > 3 && (
                <p className="text-sm text-gray-500">
                  ...and {validationIssues.length - 3} more
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Complete your business context</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => setActiveTab('organization')}
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Define Organization Structure
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => setActiveTab('strategy')}
                >
                  <span className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Set Strategic Objectives
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => setActiveTab('operations')}
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Configure Operating Model
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => setActiveTab('governance')}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Setup Governance
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Context Guidelines</CardTitle>
                <CardDescription>Best practices for context definition</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Be Specific</p>
                    <p className="text-xs text-gray-600">Use exact names, titles, and metrics</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Stay Current</p>
                    <p className="text-xs text-gray-600">Update context quarterly or when changes occur</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Validate Accuracy</p>
                    <p className="text-xs text-gray-600">Have leadership review and approve</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Document Constraints</p>
                    <p className="text-xs text-gray-600">Include what you cannot or will not do</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="organization">
          <OrganizationChart onUpdate={loadContextData} />
        </TabsContent>

        <TabsContent value="strategy">
          <StrategicObjectives onUpdate={loadContextData} />
        </TabsContent>

        <TabsContent value="operations">
          <OperatingModelForm onUpdate={loadContextData} />
        </TabsContent>

        <TabsContent value="governance">
          <GovernanceFramework onUpdate={loadContextData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}