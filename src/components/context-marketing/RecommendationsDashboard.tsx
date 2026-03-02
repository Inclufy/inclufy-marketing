// src/components/context-marketing/RecommendationsDashboard.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Play,
  ChevronRight,
  Filter,
  BarChart3,
  Users,
  Calendar,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { recommendationsService, Recommendation, RecommendationStats } from '@/services/context-marketing/recommendations.service';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface RecommendationsDashboardProps {
  onImplement?: (recommendation: Recommendation) => void;
}

export default function RecommendationsDashboard({ onImplement }: RecommendationsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    loadRecommendations();
    loadStats();
  }, [statusFilter, typeFilter, priorityFilter]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const filters = {
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter
      };
      const data = await recommendationsService.getRecommendations(filters);
      setRecommendations(data);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await recommendationsService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleImplement = async (recommendation: Recommendation) => {
    try {
      await recommendationsService.markAsImplemented(recommendation.id);
      toast.success('Recommendation marked as implemented');
      loadRecommendations();
      loadStats();
      if (onImplement) {
        onImplement(recommendation);
      }
    } catch (error) {
      console.error('Error implementing recommendation:', error);
      toast.error('Failed to update recommendation');
    }
  };

  const handleDismiss = async (id: string, reason?: string) => {
    try {
      await recommendationsService.dismiss(id, reason);
      toast.success('Recommendation dismissed');
      loadRecommendations();
      loadStats();
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
      toast.error('Failed to dismiss recommendation');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'high': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <TrendingUp className="w-4 h-4" />;
      case 'campaign': return <Target className="w-4 h-4" />;
      case 'content': return <BarChart3 className="w-4 h-4" />;
      case 'budget': return <DollarSign className="w-4 h-4" />;
      case 'competitive': return <Users className="w-4 h-4" />;
      case 'automation': return <Zap className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getImpactBadge = (impact: any) => {
    if (impact.revenue) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          +${impact.revenue.toLocaleString()} Revenue
        </Badge>
      );
    }
    if (impact.time_saved) {
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {impact.time_saved}h Saved
        </Badge>
      );
    }
    if (impact.engagement) {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          +{impact.engagement}% Engagement
        </Badge>
      );
    }
    return null;
  };

  const quickWins = recommendations.filter(r => 
    r.implementation_effort === 'low' && r.confidence_score >= 80
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              AI Recommendations
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Data-driven suggestions to optimize your marketing
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_active}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Recommendations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {quickWins.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                High impact, low effort
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.success_rate)}%
              </div>
              <Progress value={stats.success_rate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Avg Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats.average_confidence)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                AI confidence score
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                ${stats.total_impact_value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Estimated value
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filter Recommendations</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="optimization">Optimization</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="competitive">Competitive</SelectItem>
                  <SelectItem value="automation">Automation</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Recommendations List */}
      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading recommendations...</p>
              </div>
            </CardContent>
          </Card>
        ) : recommendations.length > 0 ? (
          recommendations.map((recommendation, index) => (
            <motion.div
              key={recommendation.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getPriorityColor(recommendation.priority)}`}>
                        {getTypeIcon(recommendation.type)}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{recommendation.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {recommendation.description}
                        </CardDescription>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline">
                            {recommendation.type}
                          </Badge>
                          <Badge className={getPriorityColor(recommendation.priority)}>
                            {recommendation.priority}
                          </Badge>
                          {getImpactBadge(recommendation.impact_estimate)}
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="w-3 h-3" />
                            {recommendation.implementation_effort === 'low' ? '< 1 day' :
                             recommendation.implementation_effort === 'medium' ? '1-5 days' : '> 5 days'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">
                        {recommendation.confidence_score}%
                      </div>
                      <p className="text-xs text-gray-500">Confidence</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Rationale</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {recommendation.rationale}
                      </p>
                    </div>

                    {recommendation.action_items && recommendation.action_items.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Next Steps</p>
                        <ul className="space-y-1">
                          {recommendation.action_items.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <ChevronRight className="w-4 h-4 text-gray-400 mt-0.5" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleImplement(recommendation)}
                          disabled={recommendation.status !== 'pending'}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Implement
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDismiss(recommendation.id)}
                          disabled={recommendation.status !== 'pending'}
                        >
                          Dismiss
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Generated {format(new Date(recommendation.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No recommendations found</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {statusFilter === 'all' 
                  ? 'AI is analyzing your data to generate recommendations'
                  : 'Try adjusting your filters'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Wins Section */}
      {quickWins.length > 0 && statusFilter === 'pending' && (
        <Card className="border-green-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              Quick Wins
            </CardTitle>
            <CardDescription>
              High-impact recommendations that can be implemented quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {quickWins.slice(0, 4).map((rec) => (
                <div key={rec.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(rec.type)}
                    <span className="text-sm font-medium">{rec.title}</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleImplement(rec)}>
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}