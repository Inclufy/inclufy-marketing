// src/components/context-marketing/InsightDetails.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  FileText,
  Users,
  Calendar,
  BarChart3,
  Sparkles,
  MessageSquare,
  Download,
  Share2,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  insightsService,
  Insight,
  InsightRecommendation,
  InsightImpact
} from '@/services/context-marketing/insights.service';
import { patternRecognitionService, DetectedPattern } from '@/services/context-marketing/pattern-recognition.service';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface InsightDetailsProps {
  insightId: string;
  onBack: () => void;
}

export default function InsightDetails({ insightId, onBack }: InsightDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [recommendations, setRecommendations] = useState<InsightRecommendation[]>([]);
  const [relatedPatterns, setRelatedPatterns] = useState<DetectedPattern[]>([]);
  const [impactTracking, setImpactTracking] = useState<InsightImpact[]>([]);
  const [notes, setNotes] = useState('');
  const [showImpactDialog, setShowImpactDialog] = useState(false);
  const [generatingRecommendations, setGeneratingRecommendations] = useState(false);

  // Impact tracking form
  const [impactMetric, setImpactMetric] = useState('');
  const [baselineValue, setBaselineValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [targetValue, setTargetValue] = useState('');

  useEffect(() => {
    loadInsightDetails();
  }, [insightId]);

  const loadInsightDetails = async () => {
    try {
      setLoading(true);
      
      const { insight: insightData, recommendations: recs } = 
        await insightsService.getInsightWithRecommendations(insightId);
      
      setInsight(insightData);
      setRecommendations(recs);

      // Load related patterns
      if (insightData.supporting_patterns && insightData.supporting_patterns.length > 0) {
        loadRelatedPatterns(insightData.supporting_patterns);
      }

      // Load impact tracking
      const impacts = await insightsService.getInsightImpact(insightId);
      setImpactTracking(impacts);

    } catch (error) {
      console.error('Error loading insight details:', error);
      toast.error('Failed to load insight details');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedPatterns = async (patternIds: string[]) => {
    try {
      // In a real implementation, this would fetch specific patterns by IDs
      const patterns = await patternRecognitionService.getDetectedPatterns();
      const related = patterns.filter(p => patternIds.includes(p.id));
      setRelatedPatterns(related);
    } catch (error) {
      console.error('Error loading related patterns:', error);
    }
  };

  const handleStatusUpdate = async (status: Insight['status']) => {
    if (!insight) return;

    try {
      await insightsService.updateInsightStatus(insight.id, status, notes);
      toast.success(`Insight marked as ${status}`);
      setInsight({ ...insight, status });
    } catch (error) {
      console.error('Error updating insight status:', error);
      toast.error('Failed to update insight status');
    }
  };

  const handleRecommendationStatusUpdate = async (
    recommendationId: string, 
    status: InsightRecommendation['status']
  ) => {
    try {
      await insightsService.updateRecommendationStatus(recommendationId, status);
      toast.success('Recommendation status updated');
      loadInsightDetails();
    } catch (error) {
      console.error('Error updating recommendation:', error);
      toast.error('Failed to update recommendation status');
    }
  };

  const generateRecommendations = async () => {
    if (!insight) return;

    try {
      setGeneratingRecommendations(true);
      const newRecs = await patternRecognitionService.generateRecommendations(insight.id);
      setRecommendations([...recommendations, ...newRecs]);
      toast.success(`Generated ${newRecs.length} new recommendations`);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setGeneratingRecommendations(false);
    }
  };

  const handleImpactSubmit = async () => {
    if (!insight || !impactMetric || !baselineValue || !currentValue) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await insightsService.trackInsightImpact(insight.id, {
        metric_type: impactMetric,
        baseline_value: parseFloat(baselineValue),
        current_value: parseFloat(currentValue),
        target_value: targetValue ? parseFloat(targetValue) : undefined
      });

      toast.success('Impact tracked successfully');
      setShowImpactDialog(false);
      
      // Reset form
      setImpactMetric('');
      setBaselineValue('');
      setCurrentValue('');
      setTargetValue('');
      
      // Reload impact tracking
      const impacts = await insightsService.getInsightImpact(insight.id);
      setImpactTracking(impacts);
    } catch (error) {
      console.error('Error tracking impact:', error);
      toast.error('Failed to track impact');
    }
  };

  const exportInsight = () => {
    if (!insight) return;

    const content = `
# ${insight.title}

## Key Finding
${insight.key_finding}

## Description
${insight.description}

## Details
- Type: ${insight.insight_type}
- Category: ${insight.category}
- Impact Score: ${insight.impact_score}
- Urgency: ${insight.urgency || 'Not specified'}
- Status: ${insight.status}
- Created: ${format(new Date(insight.created_at), 'MMMM d, yyyy')}

## Recommendations
${recommendations.map(rec => `
### ${rec.title}
${rec.description}
- Expected Impact: ${rec.expected_impact || 'Not specified'}
- Implementation Effort: ${rec.implementation_effort || 'Not specified'}
- Status: ${rec.status}
`).join('\n')}

## Impact Tracking
${impactTracking.map(impact => `
- ${impact.metric_type}: ${impact.baseline_value} → ${impact.current_value} (${impact.improvement_percentage?.toFixed(1)}% improvement)
`).join('\n')}
`;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insight-${insight.id}-${format(new Date(), 'yyyy-MM-dd')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Sparkles className="w-5 h-5" />;
      case 'risk': return <AlertTriangle className="w-5 h-5" />;
      case 'trend': return <TrendingUp className="w-5 h-5" />;
      case 'recommendation': return <Target className="w-5 h-5" />;
      default: return <Lightbulb className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'accepted': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'implemented': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'dismissed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Insight not found</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Insights
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Insights
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportInsight}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Insight Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${getStatusColor(insight.status)}`}>
                {getTypeIcon(insight.insight_type)}
              </div>
              <div>
                <CardTitle className="text-2xl mb-2">{insight.title}</CardTitle>
                <div className="flex items-center gap-2 mb-2">
                  <Badge>{insight.insight_type}</Badge>
                  <Badge variant="outline">{insight.category}</Badge>
                  {insight.urgency && (
                    <Badge variant={insight.urgency === 'immediate' ? 'destructive' : 'secondary'}>
                      {insight.urgency}
                    </Badge>
                  )}
                  <Badge className={getStatusColor(insight.status)}>
                    {insight.status}
                  </Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  Created {format(new Date(insight.created_at), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-purple-600">
                {insight.impact_score}
              </div>
              <p className="text-sm text-gray-500">Impact Score</p>
              {insight.confidence_level && (
                <p className="text-xs text-gray-400 mt-1">
                  {insight.confidence_level}% confidence
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Key Finding</h3>
              <p className="text-lg">{insight.key_finding}</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-gray-600 dark:text-gray-400">{insight.description}</p>
            </div>

            {/* Action Buttons */}
            {insight.status === 'new' && (
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => handleStatusUpdate('reviewed')}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Reviewed
                </Button>
                <Button variant="outline" onClick={() => handleStatusUpdate('dismissed')}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Dismiss
                </Button>
              </div>
            )}

            {insight.status === 'reviewed' && (
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => handleStatusUpdate('accepted')}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept & Implement
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Details */}
      <Tabs defaultValue="recommendations">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">
            Recommendations ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="impact">Impact Tracking</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No recommendations yet</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Generate AI-powered recommendations for this insight
                </p>
                <Button onClick={generateRecommendations} disabled={generatingRecommendations}>
                  {generatingRecommendations ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Recommendations
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge>{rec.recommendation_type}</Badge>
                        <Badge variant="outline">
                          {rec.implementation_effort} effort
                        </Badge>
                        <Badge 
                          variant={rec.status === 'completed' ? 'default' : 'secondary'}
                          className={rec.status === 'completed' ? 'bg-green-600' : ''}
                        >
                          {rec.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    {rec.description}
                  </p>

                  {rec.expected_impact && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        Expected Impact: {rec.expected_impact}
                      </p>
                    </div>
                  )}

                  {rec.action_steps.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Action Steps:</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        {rec.action_steps.map((step, idx) => (
                          <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {rec.timeline && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      Timeline: {rec.timeline}
                    </div>
                  )}

                  {rec.status === 'proposed' && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm"
                        onClick={() => handleRecommendationStatusUpdate(rec.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleRecommendationStatusUpdate(rec.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  )}

                  {rec.status === 'approved' && (
                    <Button 
                      size="sm"
                      onClick={() => handleRecommendationStatusUpdate(rec.id, 'in_progress')}
                    >
                      Start Implementation
                    </Button>
                  )}

                  {rec.status === 'in_progress' && (
                    <Button 
                      size="sm"
                      onClick={() => handleRecommendationStatusUpdate(rec.id, 'completed')}
                    >
                      Mark as Completed
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {recommendations.length > 0 && (
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={generateRecommendations} 
                disabled={generatingRecommendations}
              >
                Generate More Recommendations
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          {/* Supporting Patterns */}
          {relatedPatterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Supporting Patterns</CardTitle>
                <CardDescription>
                  Patterns that contributed to this insight
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {relatedPatterns.map((pattern, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4" />
                      <span className="font-medium">{pattern.pattern_name}</span>
                      <Badge variant="outline">{pattern.pattern_type}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {pattern.pattern_description}
                    </p>
                    {pattern.confidence_score && (
                      <p className="text-xs text-gray-500 mt-1">
                        Confidence: {pattern.confidence_score}%
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Evidence Data */}
          {insight.evidence && insight.evidence.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Supporting Evidence</CardTitle>
                <CardDescription>
                  Data points backing this insight
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insight.evidence.map((evidence, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(evidence, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Sources */}
          {insight.data_sources && insight.data_sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {insight.data_sources.map((source, idx) => (
                    <Badge key={idx} variant="secondary">
                      {source}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="impact" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowImpactDialog(true)}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Track Impact
            </Button>
          </div>

          {impactTracking.length > 0 ? (
            <div className="space-y-4">
              {impactTracking.map((impact, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-base">{impact.metric_type}</CardTitle>
                    <CardDescription>
                      Measured on {format(new Date(impact.measured_at), 'MMMM d, yyyy')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Baseline</p>
                          <p className="text-lg font-semibold">{impact.baseline_value}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Current</p>
                          <p className="text-lg font-semibold">{impact.current_value}</p>
                        </div>
                        {impact.target_value && (
                          <div>
                            <p className="text-gray-500">Target</p>
                            <p className="text-lg font-semibold">{impact.target_value}</p>
                          </div>
                        )}
                      </div>

                      {impact.improvement_percentage !== undefined && (
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={Math.abs(impact.improvement_percentage)} 
                            className="flex-1"
                          />
                          <span className={`font-semibold ${
                            impact.improvement_percentage > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {impact.improvement_percentage > 0 ? '+' : ''}
                            {impact.improvement_percentage.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No impact tracking yet</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Track the measurable impact of implementing this insight
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Implementation Notes</CardTitle>
              <CardDescription>
                Document your thoughts, decisions, and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add notes about this insight..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="mb-4"
              />
              <Button onClick={() => {
                handleStatusUpdate(insight.status);
                toast.success('Notes saved');
              }}>
                Save Notes
              </Button>
            </CardContent>
          </Card>

          <Alert>
            <MessageSquare className="h-4 w-4" />
            <AlertTitle>Collaboration</AlertTitle>
            <AlertDescription>
              Share this insight with team members to gather feedback and ensure aligned implementation. 
              Notes and status updates are visible to all team members with access.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Impact Tracking Dialog */}
      <Dialog open={showImpactDialog} onOpenChange={setShowImpactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Track Impact</DialogTitle>
            <DialogDescription>
              Measure the impact of implementing this insight
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Metric Name*</label>
              <input
                type="text"
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="e.g., Conversion Rate, Revenue, User Engagement"
                value={impactMetric}
                onChange={(e) => setImpactMetric(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Baseline Value*</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  placeholder="0"
                  value={baselineValue}
                  onChange={(e) => setBaselineValue(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Current Value*</label>
                <input
                  type="number"
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                  placeholder="0"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Target Value (Optional)</label>
              <input
                type="number"
                className="w-full mt-1 px-3 py-2 border rounded-lg"
                placeholder="0"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImpactDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImpactSubmit}>
              Track Impact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}