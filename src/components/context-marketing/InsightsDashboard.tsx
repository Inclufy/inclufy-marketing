// src/components/context-marketing/InsightsView.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Target,
  Clock,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  ArrowRight,
  Sparkles,
  BarChart3,
  FileText,
  Search,
  SortDesc
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { insightsService, Insight, InsightStats } from '@/services/context-marketing/insights.service';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface InsightsViewProps {
  onUpdate?: () => void;
  onSelectInsight?: (insight: Insight) => void;
}

export default function InsightsView({ onSelectInsight }: InsightsViewProps) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [filteredInsights, setFilteredInsights] = useState<Insight[]>([]);
  const [stats, setStats] = useState<InsightStats | null>(null);
  const [selectedInsights, setSelectedInsights] = useState<string[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('new');
  const [sortBy, setSortBy] = useState<string>('impact');

  useEffect(() => {
    loadInsights();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [insights, searchQuery, typeFilter, categoryFilter, urgencyFilter, statusFilter, sortBy]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const data = await insightsService.getInsights({ status: statusFilter });
      setInsights(data);
    } catch (error) {
      console.error('Error loading insights:', error);
      toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await insightsService.getInsightStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...insights];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(insight => 
        insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.key_finding.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(i => i.insight_type === typeFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(i => i.category === categoryFilter);
    }

    // Urgency filter
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(i => i.urgency === urgencyFilter);
    }

    // Sort
    switch (sortBy) {
      case 'impact':
        filtered.sort((a, b) => (b.impact_score || 0) - (a.impact_score || 0));
        break;
      case 'urgency':
        const urgencyOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
        filtered.sort((a, b) => 
          (urgencyOrder[a.urgency as keyof typeof urgencyOrder] || 4) - 
          (urgencyOrder[b.urgency as keyof typeof urgencyOrder] || 4)
        );
        break;
      case 'date':
        filtered.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
    }

    setFilteredInsights(filtered);
  };

  const handleStatusUpdate = async (insightId: string, status: Insight['status']) => {
    try {
      await insightsService.updateInsightStatus(insightId, status);
      toast.success(`Insight marked as ${status}`);
      loadInsights();
      loadStats();
    } catch (error) {
      console.error('Error updating insight:', error);
      toast.error('Failed to update insight status');
    }
  };

  const handleBulkDismiss = async () => {
    if (selectedInsights.length === 0) return;

    try {
      await insightsService.dismissInsights(selectedInsights);
      toast.success(`Dismissed ${selectedInsights.length} insights`);
      setSelectedInsights([]);
      loadInsights();
      loadStats();
    } catch (error) {
      console.error('Error dismissing insights:', error);
      toast.error('Failed to dismiss insights');
    }
  };

  const handleExport = async () => {
    try {
      const data = await insightsService.exportInsights('csv');
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insights-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Insights exported successfully');
    } catch (error) {
      console.error('Error exporting insights:', error);
      toast.error('Failed to export insights');
    }
  };

  const toggleSelectInsight = (insightId: string) => {
    setSelectedInsights(prev => 
      prev.includes(insightId) 
        ? prev.filter(id => id !== insightId)
        : [...prev, insightId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedInsights.length === filteredInsights.length) {
      setSelectedInsights([]);
    } else {
      setSelectedInsights(filteredInsights.map(i => i.id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Sparkles className="w-4 h-4" />;
      case 'risk': return <AlertTriangle className="w-4 h-4" />;
      case 'trend': return <TrendingUp className="w-4 h-4" />;
      case 'recommendation': return <Target className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'immediate': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <Badge>New</Badge>;
      case 'reviewed': return <Badge variant="secondary">Reviewed</Badge>;
      case 'accepted': return <Badge variant="default">Accepted</Badge>;
      case 'implemented': return <Badge variant="default" className="bg-green-600">Implemented</Badge>;
      case 'dismissed': return <Badge variant="outline">Dismissed</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Insights Management</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Review and act on AI-generated insights
          </p>
        </div>
        <div className="flex gap-2">
          {selectedInsights.length > 0 && (
            <Button
              variant="outline"
              onClick={handleBulkDismiss}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Dismiss ({selectedInsights.length})
            </Button>
          )}
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Actionable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.actionableInsights}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready to implement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Average Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.averageImpactScore)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all insights
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">By Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.byCategory)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 3)
                  .map(([category, count]) => (
                    <div key={category} className="flex justify-between text-xs">
                      <span className="capitalize">{category}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {(stats.byUrgency.immediate || 0) + (stats.byUrgency.high || 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Immediate + High urgency
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="opportunity">Opportunity</SelectItem>
                <SelectItem value="risk">Risk</SelectItem>
                <SelectItem value="trend">Trend</SelectItem>
                <SelectItem value="anomaly">Anomaly</SelectItem>
                <SelectItem value="recommendation">Recommendation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="strategic">Strategic</SelectItem>
                <SelectItem value="tactical">Tactical</SelectItem>
                <SelectItem value="operational">Operational</SelectItem>
                <SelectItem value="competitive">Competitive</SelectItem>
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="content">Content</SelectItem>
              </SelectContent>
            </Select>

            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
                <SortDesc className="w-4 h-4 ml-2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="impact">Sort by Impact</SelectItem>
                <SelectItem value="urgency">Sort by Urgency</SelectItem>
                <SelectItem value="date">Sort by Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4 mt-4">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={statusFilter === 'new' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('new');
                  loadInsights();
                }}
              >
                New
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'reviewed' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('reviewed');
                  loadInsights();
                }}
              >
                Reviewed
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => {
                  setStatusFilter('all');
                  loadInsights();
                }}
              >
                All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Insights ({filteredInsights.length})
            </CardTitle>
            {filteredInsights.length > 0 && (
              <Checkbox
                checked={selectedInsights.length === filteredInsights.length}
                onCheckedChange={toggleSelectAll}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading insights...</p>
            </div>
          ) : filteredInsights.length > 0 ? (
            <div className="space-y-4">
              {filteredInsights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                    selectedInsights.includes(insight.id) ? 'border-purple-500 bg-purple-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedInsights.includes(insight.id)}
                      onCheckedChange={() => toggleSelectInsight(insight.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onSelectInsight(insight)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded ${getUrgencyColor(insight.urgency)}`}>
                            {getTypeIcon(insight.insight_type)}
                          </div>
                          <Badge variant="outline">{insight.category}</Badge>
                          {getStatusBadge(insight.status)}
                          {insight.urgency && (
                            <Badge className={getUrgencyColor(insight.urgency)}>
                              {insight.urgency}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">
                            {insight.impact_score}
                          </div>
                          <p className="text-xs text-gray-500">Impact</p>
                        </div>
                      </div>

                      <h4 className="font-semibold mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {insight.key_finding}
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          Created {format(new Date(insight.created_at), 'MMM d, yyyy')}
                        </p>
                        
                        {insight.status === 'new' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(insight.id, 'reviewed');
                              }}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(insight.id, 'dismissed');
                              }}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No insights found</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {searchQuery || typeFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Run pattern detection to generate insights'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights Guide */}
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Maximizing Insight Value</AlertTitle>
        <AlertDescription>
          Each insight is prioritized by impact score and urgency. Focus on high-impact, immediate insights first. 
          Click on any insight to view detailed recommendations and implementation steps.
        </AlertDescription>
      </Alert>
    </div>
  );
}