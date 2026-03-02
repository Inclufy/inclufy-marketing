// src/components/strategy/BusinessContextDashboard.tsx
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building,
  Target,
  Users,
  Globe,
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Brain,
  Rocket,
  Award,
  BarChart3,
  MessageSquare,
  Zap
} from 'lucide-react';

export default function BusinessContextDashboard() {
  const [activeStep, setActiveStep] = useState(1);
  
  // Marketing process steps
  const marketingSteps = [
    { id: 1, title: 'Foundation', icon: Building, status: 'active' },
    { id: 2, title: 'Discovery', icon: Target, status: 'upcoming' },
    { id: 3, title: 'Strategy', icon: Brain, status: 'upcoming' },
    { id: 4, title: 'Execution', icon: Rocket, status: 'upcoming' },
    { id: 5, title: 'Optimization', icon: TrendingUp, status: 'upcoming' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Marketing Focus */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Business Context Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Build your AI-powered marketing foundation with data-driven insights
          </p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <Sparkles className="w-4 h-4 mr-2" />
          Generate AI Insights
        </Button>
      </div>

      {/* Marketing Process Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Marketing Journey</CardTitle>
          <CardDescription>Follow our proven methodology to build a successful marketing strategy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            {marketingSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex flex-col items-center ${index < marketingSteps.length - 1 ? 'flex-1' : ''}`}>
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all
                    ${step.status === 'active' ? 'bg-purple-600 text-white shadow-lg' : 
                      step.status === 'completed' ? 'bg-green-600 text-white' : 
                      'bg-gray-200 dark:bg-gray-700 text-gray-500'}
                  `}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    step.status === 'active' ? 'text-purple-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < marketingSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    index < activeStep - 1 ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={20} className="h-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">20% Complete - Let's build your foundation!</p>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="setup" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="competitors">Market Analysis</TabsTrigger>
          <TabsTrigger value="goals">Goals & KPIs</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company DNA Card */}
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-600" />
                  Company DNA
                </CardTitle>
                <CardDescription>Define what makes your company unique</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mission">Mission Statement</Label>
                  <Textarea 
                    id="mission" 
                    placeholder="Why does your company exist? What problem do you solve?"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="vision">Vision Statement</Label>
                  <Textarea 
                    id="vision" 
                    placeholder="Where do you see your company in 5 years?"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="values">Core Values</Label>
                  <Textarea 
                    id="values" 
                    placeholder="What principles guide your decisions?"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Target Market Card */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Target Market
                </CardTitle>
                <CardDescription>Who are your ideal customers?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="demographics">Demographics</Label>
                  <Input 
                    id="demographics" 
                    placeholder="Age, gender, income, location..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="psychographics">Psychographics</Label>
                  <Textarea 
                    id="psychographics" 
                    placeholder="Interests, values, lifestyle, pain points..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="behavior">Buying Behavior</Label>
                  <Textarea 
                    id="behavior" 
                    placeholder="How do they make purchase decisions?"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardHeader>
              <CardTitle>Ready to accelerate?</CardTitle>
              <CardDescription>Use AI to analyze your market and generate insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start">
                  <Globe className="w-4 h-4 mr-2" />
                  Analyze Website
                </Button>
                <Button variant="outline" className="justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Research Competitors
                </Button>
                <Button variant="outline" className="justify-start">
                  <Brain className="w-4 h-4 mr-2" />
                  Generate Personas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Alert>
            <Sparkles className="w-4 h-4" />
            <AlertDescription>
              Complete your company setup to unlock personalized AI insights and recommendations
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Insight Cards */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Market Opportunity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">$2.4M</div>
                <p className="text-xs text-gray-600 mt-1">Potential revenue in your segment</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Competitive Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">Top 15%</div>
                <p className="text-xs text-gray-600 mt-1">In your industry category</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Growth Potential</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">287%</div>
                <p className="text-xs text-gray-600 mt-1">Projected 3-year growth</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Market Analysis Tab */}
        <TabsContent value="competitors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Landscape</CardTitle>
              <CardDescription>Understanding your market position</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>Complete your business context to unlock competitive analysis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Goal Cards */}
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Revenue Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input placeholder="Annual revenue target" type="number" />
                <p className="text-sm text-gray-600 mt-2">Set your north star metric</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Customer Acquisition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input placeholder="New customers per month" type="number" />
                <p className="text-sm text-gray-600 mt-2">Define growth targets</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input placeholder="Target conversion %" type="number" />
                <p className="text-sm text-gray-600 mt-2">Optimize your funnel</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Next Steps */}
      <Card className="border-2 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-purple-600" />
            Your Next Marketing Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <Circle className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium">Complete your company profile</p>
                <p className="text-sm text-gray-600">Unlock AI-powered insights and recommendations</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <Circle className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium">Define your target audience</p>
                <p className="text-sm text-gray-600">Create detailed customer personas with AI</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
              <Circle className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="font-medium">Analyze your competition</p>
                <p className="text-sm text-gray-600">Discover opportunities and differentiation</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}