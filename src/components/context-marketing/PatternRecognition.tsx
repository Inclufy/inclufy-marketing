// src/components/context-marketing/PatternsView.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Filter,
  Calendar,
  BarChart3,
  Sparkles,
  Clock,
  Eye,
  Archive,
  CheckCircle,
  XCircle,
  ChevronRight,
  Layers
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  patternRecognitionService, 
  DetectedPattern,
  PatternCorrelation,
  PatternDefinition
} from '@/services/context-marketing/pattern-recognition.service';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface PatternRecognitionProps {
  onUpdate?: () => void;
}
export default function PatternRecognition({ onUpdate }: PatternRecognitionProps) {
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<DetectedPattern[]>([]);
  const [patternDefinitions, setPatternDefinitions] = useState<PatternDefinition[]>([]);
  const [correlations, setCorrelations] = useState<PatternCorrelation[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<DetectedPattern | null>(null);
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [showPatternDetails, setShowPatternDetails] = useState(false);

  useEffect(() => {
    loadPatterns();
    loadPatternDefinitions();
  }, [domainFilter, typeFilter, statusFilter]);

  const loadPatterns = async () => {
    try {
      setLoading(true);
      const patternsData = await patternRecognitionService.getDetectedPatterns(
        domainFilter === 'all' ? undefined : domainFilter,
        statusFilter
      );

      // Apply type filter
      const filtered = typeFilter === 'all' 
        ? patternsData
        : patternsData.filter(p => p.pattern_type === typeFilter);

      setPatterns(filtered);

      // Load correlations if patterns exist
      if (filtered.length > 0) {
        loadCorrelations(filtered.map(p => p.id));
      }
    } catch (error) {
      console.error('Error loading patterns:', error);
      toast.error('Failed to load patterns');
    } finally {
      setLoading(false);
    }
  };

  const loadPatternDefinitions = async () => {
    try {
      const definitions = await patternRecognitionService.getPatternDefinitions();
      setPatternDefinitions(definitions);
    } catch (error) {
      console.error('Error loading pattern definitions:', error);
    }
  };

  const loadCorrelations = async (patternIds: string[]) => {
    // In a real implementation, this would fetch correlations from the API
    // For now, we'll set an empty array
    setCorrelations([]);
  };

  const updatePatternStatus = async (patternId: string, status: DetectedPattern['status']) => {
    try {
      // In a real implementation, this would call an API method
      toast.success(`Pattern marked as ${status}`);
      loadPatterns();
    } catch (error) {
      console.error('Error updating pattern:', error);
      toast.error('Failed to update pattern status');
    }
  };

  const getPatternIcon = (type: string) => {
    const icons: { [key: string]: JSX.Element } = {
      'anomaly': <AlertTriangle className="w-5 h-5" />,
      'trend': <TrendingUp className="w-5 h-5" />,
      'behavioral': <Activity className="w-5 h-5" />,
      'temporal': <Clock className="w-5 h-5" />,
      'correlational': <Layers className="w-5 h-5" />,
      'cyclical': <RefreshCw className="w-5 h-5" />,
      default: <Activity className="w-5 h-5" />
    };
    return icons[type] || icons.default;
  };

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getDomainColor = (domain: string) => {
    const colors: { [key: string]: string } = {
      'business': 'bg-purple-100 text-purple-800',
      'product': 'bg-blue-100 text-blue-800',
      'competitive': 'bg-red-100 text-red-800',
      'market': 'bg-green-100 text-green-800',
      'audience': 'bg-yellow-100 text-yellow-800',
      'content': 'bg-pink-100 text-pink-800',
      'cross_domain': 'bg-indigo-100 text-indigo-800'
    };
    return colors[domain] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="w-4 h-4 text-green-600" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'monitoring': return <Eye className="w-4 h-4 text-yellow-600" />;
      case 'archived': return <Archive className="w-4 h-4 text-gray-600" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  // Group patterns by domain for visualization
  const patternsByDomain = patterns.reduce((acc, pattern) => {
    if (!acc[pattern.domain]) acc[pattern.domain] = [];
    acc[pattern.domain].push(pattern);
    return acc;
  }, {} as Record<string, DetectedPattern[]>);

  // Calculate pattern statistics
  const stats = {
    totalPatterns: patterns.length,
    byType: patterns.reduce((acc, p) => {
      acc[p.pattern_type] = (acc[p.pattern_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byDomain: Object.entries(patternsByDomain).map(([domain, patterns]) => ({
      domain,
      count: patterns.length
    })),
    highImpact: patterns.filter(p => p.impact_level === 'high' || p.impact_level === 'critical').length,
    recentPatterns: patterns.filter(p => {
      const daysSince = (Date.now() - new Date(p.first_detected).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Detected Patterns</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor and analyze patterns across all context domains
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="competitive">Competitive</SelectItem>
              <SelectItem value="market">Market</SelectItem>
              <SelectItem value="audience">Audience</SelectItem>
              <SelectItem value="content">Content</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="anomaly">Anomaly</SelectItem>
              <SelectItem value="trend">Trend</SelectItem>
              <SelectItem value="behavioral">Behavioral</SelectItem>
              <SelectItem value="temporal">Temporal</SelectItem>
              <SelectItem value="correlational">Correlational</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="monitoring">Monitoring</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pattern Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatterns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all domains
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">High Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.highImpact}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Critical or high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentPatterns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Monitoring</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {patterns.filter(p => p.status === 'monitoring').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Being tracked
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Patterns List */}
      <Card>
        <CardHeader>
          <CardTitle>Pattern Timeline</CardTitle>
          <CardDescription>
            All detected patterns in chronological order
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Loading patterns...</p>
            </div>
          ) : patterns.length > 0 ? (
            <div className="space-y-4">
              {patterns.map((pattern, index) => (
                <motion.div
                  key={pattern.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setSelectedPattern(pattern);
                    setShowPatternDetails(true);
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getImpactColor(pattern.impact_level)}`}>
                      {getPatternIcon(pattern.pattern_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{pattern.pattern_name}</h4>
                            <Badge variant="outline" className={getDomainColor(pattern.domain)}>
                              {pattern.domain}
                            </Badge>
                            <Badge variant="secondary">
                              {pattern.pattern_type}
                            </Badge>
                            {pattern.confidence_score && (
                              <Badge variant="outline">
                                {pattern.confidence_score}% confidence
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {pattern.pattern_description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              First detected: {format(new Date(pattern.first_detected), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last observed: {formatDistanceToNow(new Date(pattern.last_observed))} ago
                            </span>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(pattern.status)}
                              {pattern.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {pattern.status === 'active' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updatePatternStatus(pattern.id, 'monitoring');
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updatePatternStatus(pattern.id, 'resolved');
                                }}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Pattern Data Points Preview */}
                      {pattern.data_points && pattern.data_points.length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <p className="text-xs font-medium mb-2">Key Data Points:</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {pattern.data_points.slice(0, 3).map((point, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="text-gray-500">
                                  {Object.keys(point)[0]}:
                                </span>{' '}
                                <span className="font-medium">
                                  {Object.values(point)[0]}
                                </span>
                              </div>
                            ))}
                            {pattern.data_points.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{pattern.data_points.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No patterns found</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {statusFilter === 'active' 
                  ? 'Run pattern detection to discover patterns in your data' 
                  : 'No patterns match the selected filters'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pattern Definitions */}
      <Card>
        <CardHeader>
          <CardTitle>Available Pattern Definitions</CardTitle>
          <CardDescription>
            Pre-configured patterns that can be activated for detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patternDefinitions.map((definition) => (
              <div
                key={definition.id}
                className={`p-4 rounded-lg border ${
                  definition.is_active 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium flex items-center gap-2">
                      {definition.pattern_name}
                      {definition.is_active && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Type: {definition.pattern_type} | Domain: {definition.domain}
                    </p>
                  </div>
                  {!definition.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        patternRecognitionService.activatePattern(definition.id);
                        toast.success('Pattern definition activated');
                        loadPatternDefinitions();
                      }}
                    >
                      Activate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pattern Details Dialog */}
      {selectedPattern && (
        <Dialog open={showPatternDetails} onOpenChange={setShowPatternDetails}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedPattern.pattern_name}</DialogTitle>
              <DialogDescription>
                Pattern detected on {format(new Date(selectedPattern.first_detected), 'MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Pattern Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Pattern Type</p>
                  <Badge>{selectedPattern.pattern_type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Domain</p>
                  <Badge variant="outline">{selectedPattern.domain}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Impact Level</p>
                  <Badge className={getImpactColor(selectedPattern.impact_level)}>
                    {selectedPattern.impact_level}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Confidence Score</p>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedPattern.confidence_score} className="flex-1" />
                    <span className="text-sm font-medium">
                      {selectedPattern.confidence_score}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedPattern.pattern_description}
                </p>
              </div>

              {/* Data Points */}
              {selectedPattern.data_points && selectedPattern.data_points.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Supporting Data Points</p>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-sm">
                      <tbody>
                        {selectedPattern.data_points.map((point, idx) => (
                          <tr key={idx} className="border-b">
                            {Object.entries(point).map(([key, value], i) => (
                              <>
                                <td className="py-2 text-gray-500">{key}</td>
                                <td className="py-2 font-medium">{value as string}</td>
                              </>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Affected Entities */}
              {selectedPattern.affected_entities && selectedPattern.affected_entities.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Affected Entities</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPattern.affected_entities.map((entity, idx) => (
                      <Badge key={idx} variant="secondary">
                        {entity}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowPatternDetails(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // Navigate to insights for this pattern
                    toast.info('Viewing related insights coming soon');
                  }}
                >
                  View Related Insights
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}