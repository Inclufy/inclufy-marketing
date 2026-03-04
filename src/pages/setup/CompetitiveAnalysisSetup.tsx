// src/pages/setup/CompetitiveAnalysisSetup.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Target,
  TrendingUp,
  Shield,
  Zap,
  Award,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  ExternalLink,
  Star,
  Search,
  BarChart3,
  Users,
  DollarSign,
  Package,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface Competitor {
  id: string;
  name: string;
  website: string;
  category: 'direct' | 'indirect' | 'aspirational';
  marketShare?: number;
  strengths: string[];
  weaknesses: string[];
  products: string[];
  pricing: string;
  targetMarket: string;
  uniqueValue: string;
}

export default function CompetitiveAnalysisSetup() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('competitors');
  const [competitors, setCompetitors] = useState<Competitor[]>([
    {
      id: '1',
      name: 'Example Competitor',
      website: 'https://example.com',
      category: 'direct',
      marketShare: 25,
      strengths: ['Strong brand recognition', 'Large customer base'],
      weaknesses: ['High pricing', 'Limited features'],
      products: ['Product A', 'Product B'],
      pricing: 'Premium ($299/month)',
      targetMarket: 'Enterprise',
      uniqueValue: 'Industry leader with extensive integrations'
    }
  ]);
  const [currentCompetitor, setCurrentCompetitor] = useState(0);
  const [marketPosition, setMarketPosition] = useState('challenger');

  const handleCompetitorAdd = () => {
    const newCompetitor: Competitor = {
      id: Date.now().toString(),
      name: '',
      website: '',
      category: 'direct',
      strengths: [],
      weaknesses: [],
      products: [],
      pricing: '',
      targetMarket: '',
      uniqueValue: ''
    };
    setCompetitors([...competitors, newCompetitor]);
    setCurrentCompetitor(competitors.length);
  };

  const handleCompetitorUpdate = (field: keyof Competitor, value: any) => {
    const updated = [...competitors];
    updated[currentCompetitor] = {
      ...updated[currentCompetitor],
      [field]: value
    };
    setCompetitors(updated);
  };

  const handleCompetitorDelete = (index: number) => {
    if (competitors.length > 1) {
      setCompetitors(competitors.filter((_, i) => i !== index));
      setCurrentCompetitor(Math.max(0, currentCompetitor - 1));
    }
  };

  const handleSave = () => {
    toast({
      title: "Competitive analysis saved!",
      description: "Your competitive landscape has been updated.",
    });
  };

  const handleNext = () => {
    handleSave();
    navigate('/app/context-marketing');
  };

  const completionPercentage = competitors.filter(c => 
    c.name && c.website && c.strengths.length > 0 && c.weaknesses.length > 0
  ).length / competitors.length * 100;

  return (
    <div className="w-full py-2">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Competitive Analysis</h1>
            <p className="text-gray-600 mt-2">Understand your competitive landscape</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {Math.round(completionPercentage)}% Complete
          </Badge>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="competitors">Competitors ({competitors.length})</TabsTrigger>
          <TabsTrigger value="positioning">Market Positioning</TabsTrigger>
          <TabsTrigger value="analysis">SWOT Analysis</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
        </TabsList>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-6 mt-6">
          {/* Competitor Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              {competitors.map((competitor, index) => (
                <Button
                  key={competitor.id}
                  variant={currentCompetitor === index ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentCompetitor(index)}
                  className="mb-2"
                >
                  {competitor.name || `Competitor ${index + 1}`}
                  {competitor.category === 'direct' && <Target className="w-3 h-3 ml-2" />}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleCompetitorAdd}>
              <Plus className="w-4 h-4 mr-2" /> Add Competitor
            </Button>
          </div>

          {/* Current Competitor Editor */}
          {competitors[currentCompetitor] && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Competitor Information</CardTitle>
                    <CardDescription>Basic details about this competitor</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      competitors[currentCompetitor].category === 'direct' ? 'destructive' :
                      competitors[currentCompetitor].category === 'indirect' ? 'secondary' :
                      'outline'
                    }>
                      {competitors[currentCompetitor].category}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCompetitorDelete(currentCompetitor)}
                      disabled={competitors.length <= 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        value={competitors[currentCompetitor].name}
                        onChange={(e) => handleCompetitorUpdate('name', e.target.value)}
                        placeholder="e.g., Competitor Inc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <div className="flex gap-2">
                        <Input
                          value={competitors[currentCompetitor].website}
                          onChange={(e) => handleCompetitorUpdate('website', e.target.value)}
                          placeholder="https://competitor.com"
                        />
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Competitor Type</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'direct', label: 'Direct', description: 'Same products/services' },
                        { value: 'indirect', label: 'Indirect', description: 'Different solution, same problem' },
                        { value: 'aspirational', label: 'Aspirational', description: 'Where we want to be' }
                      ].map(type => (
                        <label
                          key={type.value}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            competitors[currentCompetitor].category === type.value
                              ? 'border-purple-600 bg-purple-50'
                              : 'hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="category"
                            value={type.value}
                            checked={competitors[currentCompetitor].category === type.value}
                            onChange={(e) => handleCompetitorUpdate('category', e.target.value)}
                            className="sr-only"
                          />
                          <p className="font-medium">{type.label}</p>
                          <p className="text-xs text-gray-600">{type.description}</p>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Target Market</Label>
                      <Input
                        value={competitors[currentCompetitor].targetMarket}
                        onChange={(e) => handleCompetitorUpdate('targetMarket', e.target.value)}
                        placeholder="e.g., SMBs, Enterprise, Startups"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pricing Model</Label>
                      <Input
                        value={competitors[currentCompetitor].pricing}
                        onChange={(e) => handleCompetitorUpdate('pricing', e.target.value)}
                        placeholder="e.g., $99-499/month"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="List their key strengths (one per line)..."
                      rows={6}
                      value={competitors[currentCompetitor].strengths.join('\n')}
                      onChange={(e) => handleCompetitorUpdate('strengths', e.target.value.split('\n').filter(s => s))}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      Weaknesses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="List their weaknesses or gaps (one per line)..."
                      rows={6}
                      value={competitors[currentCompetitor].weaknesses.join('\n')}
                      onChange={(e) => handleCompetitorUpdate('weaknesses', e.target.value.split('\n').filter(w => w))}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Products & Services</CardTitle>
                  <CardDescription>What they offer to the market</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="List their main products/services (one per line)..."
                    rows={4}
                    value={competitors[currentCompetitor].products.join('\n')}
                    onChange={(e) => handleCompetitorUpdate('products', e.target.value.split('\n').filter(p => p))}
                  />
                  <div className="space-y-2">
                    <Label>Unique Value Proposition</Label>
                    <Textarea
                      placeholder="What makes them unique in the market..."
                      rows={2}
                      value={competitors[currentCompetitor].uniqueValue}
                      onChange={(e) => handleCompetitorUpdate('uniqueValue', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Market Positioning */}
        <TabsContent value="positioning" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Market Position</CardTitle>
              <CardDescription>How you position yourself in the competitive landscape</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { value: 'leader', label: 'Market Leader', icon: Award, description: 'Dominant player setting standards' },
                  { value: 'challenger', label: 'Challenger', icon: Target, description: 'Aggressively competing for share' },
                  { value: 'follower', label: 'Follower', icon: Users, description: 'Following established patterns' },
                  { value: 'nicher', label: 'Nicher', icon: Zap, description: 'Specialized in specific segment' }
                ].map(position => (
                  <label
                    key={position.value}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      marketPosition === position.value
                        ? 'border-purple-600 bg-purple-50 shadow-md'
                        : 'hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="position"
                      value={position.value}
                      checked={marketPosition === position.value}
                      onChange={(e) => setMarketPosition(e.target.value)}
                      className="sr-only"
                    />
                    <position.icon className="w-8 h-8 mb-2 text-purple-600" />
                    <p className="font-semibold">{position.label}</p>
                    <p className="text-xs text-gray-600 mt-1">{position.description}</p>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Competitive Advantages</CardTitle>
              <CardDescription>What sets you apart from competitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: 'Price', icon: DollarSign, color: 'bg-green-100 text-green-600' },
                  { category: 'Features', icon: Package, color: 'bg-blue-100 text-blue-600' },
                  { category: 'Service', icon: Users, color: 'bg-purple-100 text-purple-600' },
                  { category: 'Technology', icon: Zap, color: 'bg-yellow-100 text-yellow-600' }
                ].map(advantage => (
                  <div key={advantage.category} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${advantage.color}`}>
                      <advantage.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <Label>{advantage.category} Advantage</Label>
                      <Textarea
                        placeholder={`How you excel in ${advantage.category.toLowerCase()}...`}
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Market Share Estimation</CardTitle>
              <CardDescription>Approximate market share distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Your Company</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 h-3 bg-gray-200 rounded-full">
                      <div className="w-1/5 h-full bg-purple-600 rounded-full" />
                    </div>
                    <span className="text-sm font-medium w-12">20%</span>
                  </div>
                </div>
                {competitors.slice(0, 3).map((competitor, index) => (
                  <div key={competitor.id} className="flex items-center justify-between">
                    <span className="text-sm">{competitor.name || `Competitor ${index + 1}`}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-48 h-3 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-gray-600 rounded-full" 
                          style={{ width: `${competitor.marketShare || 15}%` }}
                        />
                      </div>
                      <span className="text-sm w-12">{competitor.marketShare || 15}%</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Others</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 h-3 bg-gray-200 rounded-full">
                      <div className="w-1/4 h-full bg-gray-400 rounded-full" />
                    </div>
                    <span className="text-sm w-12">25%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SWOT Analysis */}
        <TabsContent value="analysis" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Strengths</CardTitle>
                <CardDescription>Internal advantages</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="List your company's key strengths..."
                  rows={8}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Weaknesses</CardTitle>
                <CardDescription>Internal limitations</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="List areas that need improvement..."
                  rows={8}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">Opportunities</CardTitle>
                <CardDescription>External possibilities</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="List market opportunities you can leverage..."
                  rows={8}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600">Threats</CardTitle>
                <CardDescription>External challenges</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="List potential threats to your business..."
                  rows={8}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Strategy</CardTitle>
              <CardDescription>How you'll win in the market</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Strategy</Label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Differentiation - Unique features and value</option>
                  <option>Cost Leadership - Best price in market</option>
                  <option>Focus - Serve specific niche exceptionally</option>
                  <option>Blue Ocean - Create new market space</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Key Differentiators</Label>
                <Textarea
                  placeholder="What makes you uniquely valuable to customers..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Competitive Moat</Label>
                <Textarea
                  placeholder="What protects you from competition (network effects, switching costs, brand, etc.)..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI-Generated Recommendations
              </CardTitle>
              <CardDescription>Strategic insights based on your analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Growth Opportunity
                  </h4>
                  <p className="text-sm">
                    Based on competitor weaknesses in customer support, investing in exceptional
                    customer service could be a strong differentiator.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Positioning Advice
                  </h4>
                  <p className="text-sm">
                    As a challenger, focus on agility and innovation. Your smaller size allows
                    faster adaptation to market needs than larger competitors.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Defensive Strategy
                  </h4>
                  <p className="text-sm">
                    Build strong relationships with key customers to increase switching costs
                    and protect against competitor poaching.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between mt-8">
        <Button variant="outline">
          Save Draft
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/app/setup/goals')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNext}>
            Complete Setup
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}