// src/components/intelligence/CompetitiveAnalysisMarketing.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Globe,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Shield,
  Award,
  AlertCircle,
  Plus,
  Search,
  ExternalLink,
  BarChart3,
  Target,
  Lightbulb,
  CheckCircle,
  XCircle,
  MinusCircle,
  Brain,
  Sparkles,
  Eye,
  ArrowRight,
  Download
} from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Sample competitor data
const competitors = [
  {
    id: 1,
    name: 'CompetitorX',
    website: 'competitorx.com',
    marketShare: 28,
    strengths: ['Brand Recognition', 'Customer Base', 'Funding'],
    weaknesses: ['High Pricing', 'Limited Features', 'Poor UX'],
    rating: 4.2,
    customers: '50K+',
    founded: '2015',
    funding: '$45M',
    status: 'leader'
  },
  {
    id: 2,
    name: 'MarketLeader Pro',
    website: 'marketleader.io',
    marketShare: 35,
    strengths: ['Feature Set', 'Enterprise Focus', 'Support'],
    weaknesses: ['Complex Setup', 'Expensive', 'Legacy Tech'],
    rating: 4.5,
    customers: '100K+',
    founded: '2010',
    funding: '$120M',
    status: 'leader'
  },
  {
    id: 3,
    name: 'QuickStart Marketing',
    website: 'quickstart.co',
    marketShare: 15,
    strengths: ['Easy to Use', 'Affordable', 'Modern UI'],
    weaknesses: ['Limited Scale', 'Few Integrations', 'New Player'],
    rating: 4.0,
    customers: '20K+',
    founded: '2020',
    funding: '$12M',
    status: 'challenger'
  }
];

// Competitive positioning data for radar chart
const positioningData = [
  { feature: 'Price', you: 85, competitor1: 40, competitor2: 30, competitor3: 90 },
  { feature: 'Features', you: 90, competitor1: 75, competitor2: 95, competitor3: 60 },
  { feature: 'Ease of Use', you: 95, competitor1: 60, competitor2: 50, competitor3: 85 },
  { feature: 'Support', you: 80, competitor1: 85, competitor2: 90, competitor3: 70 },
  { feature: 'Performance', you: 85, competitor1: 80, competitor2: 85, competitor3: 75 },
  { feature: 'Innovation', you: 95, competitor1: 70, competitor2: 65, competitor3: 80 },
];

// Market share data
const marketShareData = [
  { name: 'MarketLeader Pro', share: 35, color: '#8b5cf6' },
  { name: 'CompetitorX', share: 28, color: '#ec4899' },
  { name: 'QuickStart', share: 15, color: '#3b82f6' },
  { name: 'Others', share: 15, color: '#94a3b8' },
  { name: 'You', share: 7, color: '#10b981' },
];

// Battle cards data
const battleCards = [
  {
    competitor: 'CompetitorX',
    winRate: 72,
    keyDifferentiators: [
      { feature: 'Pricing', us: 'Flexible, transparent', them: 'Complex, hidden fees' },
      { feature: 'Setup Time', us: '< 1 hour', them: '2-3 days' },
      { feature: 'AI Features', us: 'Advanced AI suite', them: 'Basic automation' }
    ],
    targetCustomer: 'SMB frustrated with complexity',
    talkingPoints: [
      'Save 40% on marketing software costs',
      'Get started in minutes, not days',
      'AI that actually works for you'
    ]
  }
];

export default function CompetitiveAnalysisMarketing() {
  const [selectedCompetitor, setSelectedCompetitor] = useState(competitors[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBattleCard, setShowBattleCard] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'leader': return 'destructive';
      case 'challenger': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Competitive Analysis</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Understand your market position and identify opportunities
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Globe className="w-4 h-4 mr-2" />
            Import Competitor
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Analysis
          </Button>
        </div>
      </div>

      {/* Key Insights Alert */}
      <Alert>
        <Brain className="w-4 h-4" />
        <AlertDescription>
          <strong>AI Insight:</strong> You have a 73% feature advantage over CompetitorX in the SMB segment. 
          Focus on ease-of-use messaging to capture their frustrated customers.
        </AlertDescription>
      </Alert>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Market Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#5</div>
            <p className="text-xs text-gray-600">Moving up 2 spots</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">68%</div>
            <p className="text-xs text-gray-600">vs competitors</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Opportunity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">$2.4M</div>
            <p className="text-xs text-gray-600">Addressable market</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-xs text-gray-600">New entrants</p>
          </CardContent>
        </Card>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market Share Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Market Share Analysis</CardTitle>
            <CardDescription>Current market distribution and your position</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marketShareData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="share" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                    {marketShareData.map((entry, index) => (
                      <Bar key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Your Position:</span> #5 with 7% market share
              </div>
              <Badge variant="outline" className="text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                Growing 2.3% MoM
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Market Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Market Opportunity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Total Market Size</span>
                <span className="text-sm text-gray-600">$2.4B</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">YoY Growth</span>
                <span className="text-sm text-gray-600">18%</span>
              </div>
              <Progress value={18} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Market Saturation</span>
                <span className="text-sm text-gray-600">42%</span>
              </div>
              <Progress value={42} className="h-2" />
            </div>
            <Separator className="my-4" />
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600">Opportunity Score</p>
              <div className="text-2xl font-bold text-green-600">87/100</div>
              <p className="text-xs text-gray-600">High growth potential in SMB segment</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Deep Dive */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="positioning">Positioning</TabsTrigger>
          <TabsTrigger value="battlecards">Battle Cards</TabsTrigger>
          <TabsTrigger value="swot">SWOT</TabsTrigger>
          <TabsTrigger value="strategies">Win Strategies</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Competitor List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Competitors</CardTitle>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search competitors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {competitors.map((competitor) => (
                  <button
                    key={competitor.id}
                    onClick={() => setSelectedCompetitor(competitor)}
                    className={`w-full p-3 rounded-lg border transition-all ${
                      selectedCompetitor.id === competitor.id
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="font-medium">{competitor.name}</p>
                        <p className="text-sm text-gray-600">{competitor.customers} customers</p>
                      </div>
                      <Badge variant={getStatusColor(competitor.status)}>
                        {competitor.status}
                      </Badge>
                    </div>
                  </button>
                ))}
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Competitor
                </Button>
              </CardContent>
            </Card>

            {/* Competitor Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedCompetitor.name}</CardTitle>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit Website
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-600">Founded</p>
                    <p className="text-lg font-semibold">{selectedCompetitor.founded}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Customers</p>
                    <p className="text-lg font-semibold">{selectedCompetitor.customers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Funding</p>
                    <p className="text-lg font-semibold">{selectedCompetitor.funding}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Market Share</p>
                    <p className="text-lg font-semibold">{selectedCompetitor.marketShare}%</p>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Strengths
                    </h4>
                    <ul className="space-y-2">
                      {selectedCompetitor.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-green-600 rounded-full" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Weaknesses
                    </h4>
                    <ul className="space-y-2">
                      {selectedCompetitor.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Positioning Tab */}
        <TabsContent value="positioning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Positioning</CardTitle>
              <CardDescription>How you compare across key dimensions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={positioningData}>
                    <PolarGrid strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="feature" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="You" dataKey="you" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Radar name="CompetitorX" dataKey="competitor1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                    <Radar name="MarketLeader Pro" dataKey="competitor2" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Your Advantages</p>
                        <p className="text-sm text-gray-600">Ease of Use, Innovation</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Areas to Improve</p>
                        <p className="text-sm text-gray-600">Support, Features</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Quick Win</p>
                        <p className="text-sm text-gray-600">Target SMB segment</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Battle Cards Tab */}
        <TabsContent value="battlecards" className="space-y-4">
          {battleCards.map((card, index) => (
            <Card key={index} className="border-2 border-purple-200 dark:border-purple-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    Battle Card: {card.competitor}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-green-600">
                      {card.winRate}% Win Rate
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Differentiators */}
                <div>
                  <h4 className="font-medium mb-3">Key Differentiators</h4>
                  <div className="space-y-2">
                    {card.keyDifferentiators.map((diff, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{diff.feature}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-green-600 font-medium">Us</p>
                          <p className="text-sm">{diff.us}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-600 font-medium">Them</p>
                          <p className="text-sm">{diff.them}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Customer */}
                <div>
                  <h4 className="font-medium mb-2">Target Customer Profile</h4>
                  <p className="text-sm text-gray-600 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Target className="w-4 h-4 inline mr-2 text-blue-600" />
                    {card.targetCustomer}
                  </p>
                </div>

                {/* Talking Points */}
                <div>
                  <h4 className="font-medium mb-3">Sales Talking Points</h4>
                  <ul className="space-y-2">
                    {card.talkingPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                        <span className="text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Call Script */}
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Sample Call Script
                  </h4>
                  <p className="text-sm text-gray-600 italic">
                    "I noticed you're using {card.competitor}. Many of our customers switched because they were frustrated with {card.keyDifferentiators[0].them}. 
                    With Inclufy, you can {card.talkingPoints[0].toLowerCase()}. Would you like to see how?"
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* SWOT Analysis Tab */}
        <TabsContent value="swot" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="bg-green-50 dark:bg-green-900/20">
                <CardTitle className="text-green-700 dark:text-green-400">Strengths</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Superior user experience and modern interface</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">AI-powered features competitors lack</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Competitive pricing for SMB market</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    <span className="text-sm">Fast implementation and onboarding</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="bg-red-50 dark:bg-red-900/20">
                <CardTitle className="text-red-700 dark:text-red-400">Weaknesses</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <span className="text-sm">Limited brand recognition</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <span className="text-sm">Smaller customer base than leaders</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <span className="text-sm">Fewer enterprise features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <span className="text-sm">Limited third-party integrations</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                <CardTitle className="text-blue-700 dark:text-blue-400">Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                    <span className="text-sm">Growing SMB market segment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                    <span className="text-sm">Competitors have poor user satisfaction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                    <span className="text-sm">AI adoption in marketing growing rapidly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                    <span className="text-sm">Partnership opportunities emerging</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 dark:border-yellow-800">
              <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20">
                <CardTitle className="text-yellow-700 dark:text-yellow-400">Threats</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <span className="text-sm">Well-funded competitors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <span className="text-sm">Market consolidation risk</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <span className="text-sm">Technology disruption potential</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <span className="text-sm">Economic downturn impact</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Win Strategies Tab */}
        <TabsContent value="strategies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Win Strategies</CardTitle>
              <CardDescription>Data-driven approaches to win against each competitor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Strategy Cards */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Against CompetitorX</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Target their frustrated SMB customers with ease-of-use messaging
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Lower price point</Badge>
                      <Badge variant="outline">Better UX</Badge>
                      <Badge variant="outline">Faster setup</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Against MarketLeader Pro</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Focus on modern, AI-powered features they lack
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">AI advantage</Badge>
                      <Badge variant="outline">Modern tech</Badge>
                      <Badge variant="outline">No legacy burden</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">Market Expansion Strategy</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Capture underserved vertical markets before competitors notice
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">E-commerce focus</Badge>
                      <Badge variant="outline">SaaS verticals</Badge>
                      <Badge variant="outline">Local business</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Launch "Switch from CompetitorX" campaign</p>
                    <p className="text-xs text-gray-600">Estimated impact: +15% leads</p>
                  </div>
                  <Button size="sm">
                    Start
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Create comparison landing pages</p>
                    <p className="text-xs text-gray-600">Estimated impact: +8% conversions</p>
                  </div>
                  <Button size="sm">
                    Start
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">Target competitor keywords in SEO</p>
                    <p className="text-xs text-gray-600">Estimated impact: +20% organic traffic</p>
                  </div>
                  <Button size="sm">
                    Start
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}