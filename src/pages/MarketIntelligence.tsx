// src/pages/MarketIntelligence.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain,
  TrendingUp,
  Globe,
  BarChart3,
  Users,
  Search,
  AlertCircle,
  Sparkles,
  Target,
  Activity,
  Clock,
  Filter,
  Download,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Newspaper,
  MessageSquare,
  Hash,
  Shield
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface TrendData {
  topic: string;
  growth: number;
  volume: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
}

interface CompetitorUpdate {
  company: string;
  type: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  date: string;
}

interface MarketInsight {
  title: string;
  description: string;
  source: string;
  relevance: number;
  category: string;
  date: string;
}

export default function MarketIntelligence() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const trends: TrendData[] = [
    { topic: 'AI Marketing Automation', growth: 125, volume: 45000, sentiment: 'positive', category: 'Technology' },
    { topic: 'Privacy-First Marketing', growth: 89, volume: 28000, sentiment: 'positive', category: 'Compliance' },
    { topic: 'Short-Form Video Content', growth: 67, volume: 92000, sentiment: 'neutral', category: 'Content' },
    { topic: 'Voice Search Optimization', growth: 45, volume: 15000, sentiment: 'positive', category: 'SEO' },
    { topic: 'Sustainable Marketing', growth: -12, volume: 8000, sentiment: 'negative', category: 'Branding' }
  ];

  const competitorUpdates: CompetitorUpdate[] = [
    {
      company: 'Competitor A',
      type: 'Product Launch',
      description: 'Launched AI-powered email personalization tool',
      impact: 'high',
      date: '2 days ago'
    },
    {
      company: 'Competitor B',
      type: 'Pricing Change',
      description: 'Reduced enterprise pricing by 20%',
      impact: 'medium',
      date: '5 days ago'
    },
    {
      company: 'Competitor C',
      type: 'Partnership',
      description: 'Announced integration with Salesforce',
      impact: 'high',
      date: '1 week ago'
    }
  ];

  const marketInsights: MarketInsight[] = [
    {
      title: 'AI Adoption in Marketing Reaches Tipping Point',
      description: '73% of marketers now use AI tools daily, up from 42% last year',
      source: 'Marketing Week',
      relevance: 95,
      category: 'Technology',
      date: '1 day ago'
    },
    {
      title: 'Email Marketing ROI Hits Record High',
      description: 'Average ROI of $42 for every $1 spent on email marketing',
      source: 'DMA Report',
      relevance: 88,
      category: 'Performance',
      date: '3 days ago'
    },
    {
      title: 'B2B Buyers Prefer Self-Service',
      description: '75% of B2B buyers prefer to research independently before sales contact',
      source: 'Gartner',
      relevance: 82,
      category: 'Sales',
      date: '1 week ago'
    }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
    toast({
      title: "Market intelligence updated",
      description: "Latest market data has been fetched.",
    });
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Market Intelligence</h1>
              <p className="text-gray-600">Real-time market insights and competitive intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search trends, companies, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-32"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Market Growth</p>
                    <p className="text-2xl font-bold">+23.5%</p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <ChevronUp className="w-3 h-3" />
                      5.2% vs last month
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Competitor Moves</p>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-xs text-gray-600 mt-1">This week</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Trending Topics</p>
                    <p className="text-2xl font-bold">47</p>
                    <p className="text-xs text-gray-600 mt-1">Being tracked</p>
                  </div>
                  <Hash className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Alert Status</p>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-orange-600 mt-1">Require attention</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trending Now */}
          <Card>
            <CardHeader>
              <CardTitle>Trending in Your Industry</CardTitle>
              <CardDescription>Top growing topics and conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trends.slice(0, 3).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                      <div>
                        <p className="font-medium">{trend.topic}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {trend.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {trend.volume.toLocaleString()} mentions
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center gap-1 ${
                        trend.growth > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trend.growth > 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span className="font-medium">{Math.abs(trend.growth)}%</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Competitor Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Competitor Activity</CardTitle>
              <CardDescription>Latest moves from your competition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {competitorUpdates.map((update, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      update.impact === 'high' ? 'bg-red-500' :
                      update.impact === 'medium' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{update.company}</span>
                        <Badge variant="secondary" className="text-xs">
                          {update.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{update.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{update.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Market Trends Tab */}
        <TabsContent value="trends" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
                <CardDescription>Topics experiencing rapid growth</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trends.filter(t => t.growth > 0).map((trend, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{trend.topic}</span>
                        <span className="text-green-600 font-medium">+{trend.growth}%</span>
                      </div>
                      <Progress value={trend.growth} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{trend.volume.toLocaleString()} mentions</span>
                        <Badge 
                          variant={trend.sentiment === 'positive' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {trend.sentiment}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Industry Sentiment</CardTitle>
                <CardDescription>Overall market sentiment analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-700">78%</p>
                        <p className="text-sm text-green-600">Positive</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Positive Mentions</span>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Neutral Mentions</span>
                      <span className="text-sm font-medium">17%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Negative Mentions</span>
                      <span className="text-sm font-medium">5%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Category Analysis</CardTitle>
              <CardDescription>Performance by market category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Technology', 'Content', 'Strategy'].map(category => (
                  <div key={category} className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3">{category}</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Growth Rate</span>
                        <span className="font-medium text-green-600">+45%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Volume</span>
                        <span className="font-medium">28.5K</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Engagement</span>
                        <span className="font-medium">High</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitor Monitoring</CardTitle>
              <CardDescription>Track competitor activities and strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Competitor A', 'Competitor B', 'Competitor C'].map(company => (
                  <div key={company} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{company}</h4>
                      <Badge>Active</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Recent Activity</p>
                        <p className="font-medium">12 updates</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Market Share</p>
                        <p className="font-medium">23.5%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Growth</p>
                        <p className="font-medium text-green-600">+15%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Threat Level</p>
                        <p className="font-medium text-orange-600">Medium</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Competitive Advantages</CardTitle>
              <CardDescription>How you compare to the competition</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { feature: 'AI Capabilities', you: 85, competitors: 65 },
                  { feature: 'Price Competitiveness', you: 70, competitors: 75 },
                  { feature: 'Customer Satisfaction', you: 90, competitors: 80 },
                  { feature: 'Market Presence', you: 60, competitors: 85 }
                ].map(comparison => (
                  <div key={comparison.feature} className="space-y-2">
                    <p className="text-sm font-medium">{comparison.feature}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>You</span>
                          <span>{comparison.you}%</span>
                        </div>
                        <Progress value={comparison.you} className="h-2 bg-purple-100">
                          <div className="h-full bg-purple-600 rounded-full" style={{ width: `${comparison.you}%` }} />
                        </Progress>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Avg Competitor</span>
                          <span>{comparison.competitors}%</span>
                        </div>
                        <Progress value={comparison.competitors} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI-Generated Market Insights
              </CardTitle>
              <CardDescription>Strategic insights based on market analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketInsights.map((insight, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <Badge variant="outline" className="text-xs">
                            {insight.category}
                          </Badge>
                          <span className="text-xs text-gray-500">{insight.source}</span>
                          <span className="text-xs text-gray-500">{insight.date}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-600">Relevance</p>
                        <p className="text-2xl font-bold text-purple-600">{insight.relevance}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Opportunity Radar</CardTitle>
                <CardDescription>Emerging opportunities in your market</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">High Priority</span>
                    </div>
                    <p className="text-sm text-green-800">
                      Video content demand increasing 200% - consider video marketing features
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">Market Gap</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      Limited competition in AI-powered local marketing solutions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Monitor</CardTitle>
                <CardDescription>Potential threats to monitor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-red-900">High Risk</span>
                    </div>
                    <p className="text-sm text-red-800">
                      Major competitor launching similar AI features next month
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-yellow-600" />
                      <span className="font-medium text-yellow-900">Watch</span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      Privacy regulations may impact data collection practices
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Important market changes requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900">Competitive Threat</h4>
                    <p className="text-sm text-red-800 mt-1">
                      Competitor A announced 40% price reduction on enterprise plans
                    </p>
                    <p className="text-xs text-red-600 mt-2">2 hours ago</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-600">
                    View Details
                  </Button>
                </div>

                <div className="flex items-start gap-3 p-4 border-l-4 border-orange-500 bg-orange-50 rounded-r-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-orange-900">Market Shift</h4>
                    <p className="text-sm text-orange-800 mt-1">
                      AI marketing adoption accelerating faster than projected
                    </p>
                    <p className="text-xs text-orange-600 mt-2">5 hours ago</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-orange-600">
                    View Details
                  </Button>
                </div>

                <div className="flex items-start gap-3 p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                  <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900">Customer Trend</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Increasing demand for privacy-focused marketing solutions
                    </p>
                    <p className="text-xs text-blue-600 mt-2">1 day ago</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-blue-600">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Settings</CardTitle>
              <CardDescription>Configure your market intelligence alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { type: 'Competitor Updates', icon: Users, enabled: true },
                  { type: 'Market Trends', icon: TrendingUp, enabled: true },
                  { type: 'Technology Changes', icon: Sparkles, enabled: false },
                  { type: 'Regulatory Updates', icon: Shield, enabled: true },
                  { type: 'Customer Sentiment', icon: MessageSquare, enabled: false }
                ].map(alert => (
                  <div key={alert.type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <alert.icon className="w-5 h-5 text-gray-600" />
                      <span className="font-medium">{alert.type}</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        defaultChecked={alert.enabled}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}