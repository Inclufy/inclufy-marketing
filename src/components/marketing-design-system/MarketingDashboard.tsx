// src/components/marketing-design-system/MarketingDashboard.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp,
  Users,
  Target,
  Zap,
  Brain,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Activity,
  DollarSign,
  MessageSquare,
  Mail,
  Eye,
  MousePointer,
  ShoppingCart,
  Sparkles
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Sample data for charts
const funnelData = [
  { stage: 'Awareness', value: 10000, percentage: 100 },
  { stage: 'Interest', value: 6000, percentage: 60 },
  { stage: 'Consideration', value: 3000, percentage: 30 },
  { stage: 'Intent', value: 1500, percentage: 15 },
  { stage: 'Evaluation', value: 800, percentage: 8 },
  { stage: 'Purchase', value: 400, percentage: 4 },
];

const performanceData = [
  { month: 'Jan', leads: 400, conversions: 24, revenue: 12000 },
  { month: 'Feb', leads: 450, conversions: 28, revenue: 14500 },
  { month: 'Mar', leads: 520, conversions: 35, revenue: 18200 },
  { month: 'Apr', leads: 580, conversions: 42, revenue: 22400 },
  { month: 'May', leads: 650, conversions: 48, revenue: 26800 },
  { month: 'Jun', leads: 720, conversions: 56, revenue: 31500 },
];

export default function MarketingDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Marketing Command Center</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Real-time insights and AI-powered recommendations
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Activity className="w-4 h-4 mr-2" />
            View Reports
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Insights
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <div className="flex items-center mt-2 text-sm">
              <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">12%</span>
              <span className="text-gray-600 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2%</div>
            <div className="flex items-center mt-2 text-sm">
              <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">0.8%</span>
              <span className="text-gray-600 ml-1">improvement</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$124,580</div>
            <div className="flex items-center mt-2 text-sm">
              <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">23%</span>
              <span className="text-gray-600 ml-1">growth</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">ROI</CardTitle>
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">387%</div>
            <div className="flex items-center mt-2 text-sm">
              <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600">45%</span>
              <span className="text-gray-600 ml-1">increase</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Marketing Funnel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Marketing Funnel Performance</CardTitle>
            <CardDescription>Track customer journey from awareness to purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {funnelData.map((stage, index) => (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <span className="text-sm text-gray-600">{stage.value.toLocaleString()} ({stage.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8">
                    <div 
                      className="h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 relative"
                      style={{ width: `${stage.percentage}%` }}
                    >
                      <div className="absolute inset-0 flex items-center justify-end pr-4">
                        <span className="text-white text-xs font-medium">
                          {index > 0 && `${((stage.value / funnelData[index - 1].value) * 100).toFixed(1)}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
            <CardDescription>Real-time campaign metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">Email Campaign</p>
                    <p className="text-xs text-gray-600">Summer Sale 2024</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-blue-600">
                  <Activity className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">Social Media</p>
                    <p className="text-xs text-gray-600">Brand Awareness</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-purple-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +23%
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <MousePointer className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">PPC Campaign</p>
                    <p className="text-xs text-gray-600">Google Ads</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600">
                  <DollarSign className="w-3 h-3 mr-1" />
                  $2.4k
                </Badge>
              </div>
            </div>

            <Button className="w-full" variant="outline">
              View All Campaigns
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Key metrics over time</CardDescription>
            </div>
            <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <TabsList>
                <TabsTrigger value="7d">7D</TabsTrigger>
                <TabsTrigger value="30d">30D</TabsTrigger>
                <TabsTrigger value="90d">90D</TabsTrigger>
                <TabsTrigger value="1y">1Y</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Leads"
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#ec4899" 
                  strokeWidth={2}
                  name="Conversions"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI-Powered Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-600" />
                <p className="font-medium text-sm">Quick Win</p>
              </div>
              <p className="text-sm text-gray-600">
                Increase email frequency to engaged segments. Predicted +15% revenue.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-600" />
                <p className="font-medium text-sm">Optimization</p>
              </div>
              <p className="text-sm text-gray-600">
                A/B test landing page CTA. Historical data suggests 23% lift potential.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <p className="font-medium text-sm">Growth Opportunity</p>
              </div>
              <p className="text-sm text-gray-600">
                Expand into mobile marketing. 67% of your audience uses mobile primarily.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}