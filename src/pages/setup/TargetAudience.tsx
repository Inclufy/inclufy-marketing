// src/pages/setup/TargetAudience.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { 
  Users, 
  User, 
  Target,
  Brain,
  TrendingUp,
  ShoppingBag,
  Heart,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Briefcase,
  Globe,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface Persona {
  id: string;
  name: string;
  age: string;
  gender: string;
  occupation: string;
  income: string;
  location: string;
  goals: string[];
  painPoints: string[];
  interests: string[];
  buyingBehavior: string;
  avatar?: string;
}

export default function TargetAudience() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [personas, setPersonas] = useState<Persona[]>([
    {
      id: '1',
      name: 'Marketing Manager Mike',
      age: '35-45',
      gender: 'Male',
      occupation: 'Marketing Manager',
      income: '$80k-120k',
      location: 'Urban areas',
      goals: ['Increase ROI', 'Automate workflows', 'Better reporting'],
      painPoints: ['Time constraints', 'Multiple tools', 'Limited budget'],
      interests: ['Technology', 'Data analytics', 'Professional development'],
      buyingBehavior: 'Research-driven, seeks ROI proof'
    }
  ]);
  const [currentPersona, setCurrentPersona] = useState(0);

  const handlePersonaAdd = () => {
    const newPersona: Persona = {
      id: Date.now().toString(),
      name: 'New Persona',
      age: '',
      gender: '',
      occupation: '',
      income: '',
      location: '',
      goals: [],
      painPoints: [],
      interests: [],
      buyingBehavior: ''
    };
    setPersonas([...personas, newPersona]);
    setCurrentPersona(personas.length);
  };

  const handlePersonaUpdate = (field: keyof Persona, value: any) => {
    const updated = [...personas];
    updated[currentPersona] = {
      ...updated[currentPersona],
      [field]: value
    };
    setPersonas(updated);
  };

  const handlePersonaDelete = (index: number) => {
    if (personas.length > 1) {
      setPersonas(personas.filter((_, i) => i !== index));
      setCurrentPersona(Math.max(0, currentPersona - 1));
    }
  };

  const handleSave = () => {
    toast({
      title: "Target audience saved!",
      description: "Your audience profiles have been updated successfully.",
    });
  };

  const handleNext = () => {
    handleSave();
    navigate('/app/setup/goals');
  };

  const completionPercentage = personas.filter(p => 
    p.name && p.age && p.occupation && p.goals.length > 0
  ).length / personas.length * 100;

  return (
    <div className="w-full py-2">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Target Audience</h1>
            <p className="text-gray-600 mt-2">Define your ideal customer personas</p>
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
          <TabsTrigger value="overview">Market Overview</TabsTrigger>
          <TabsTrigger value="personas">Personas ({personas.length})</TabsTrigger>
          <TabsTrigger value="journey">Customer Journey</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Market Overview */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Definition</CardTitle>
              <CardDescription>Define your target market characteristics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Market Size</Label>
                  <RadioGroup defaultValue="medium">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="niche" id="niche" />
                      <Label htmlFor="niche">Niche (&lt; 10K customers)</Label>
                      </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="small" id="small" />
                      <Label htmlFor="small">Small (10K - 100K)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium">Medium (100K - 1M)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="large" id="large" />
                      <Label htmlFor="large">Large (1M+)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Geographic Focus</Label>
                  <div className="space-y-2">
                    {['Local', 'National', 'International', 'Global'].map(geo => (
                      <label key={geo} className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">{geo}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Industry Segments</CardTitle>
              <CardDescription>Select your target industries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing',
                  'Real Estate', 'Hospitality', 'Non-profit', 'Government', 'Media', 'Other'
                ].map(industry => (
                  <Badge
                    key={industry}
                    variant="outline"
                    className="py-2 px-4 cursor-pointer hover:bg-purple-50 hover:border-purple-600 justify-center"
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">B2B</p>
                    <p className="text-sm text-gray-600">Business customers</p>
                  </div>
                  <input type="radio" name="market-type" className="ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">B2C</p>
                    <p className="text-sm text-gray-600">Individual consumers</p>
                  </div>
                  <input type="radio" name="market-type" className="ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">Both</p>
                    <p className="text-sm text-gray-600">Mixed audience</p>
                  </div>
                  <input type="radio" name="market-type" className="ml-auto" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Personas */}
        <TabsContent value="personas" className="space-y-6 mt-6">
          {/* Persona Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {personas.map((persona, index) => (
                <Button
                  key={persona.id}
                  variant={currentPersona === index ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPersona(index)}
                >
                  {persona.name.split(' ')[0]}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handlePersonaAdd}>
              <Plus className="w-4 h-4 mr-2" /> Add Persona
            </Button>
          </div>

          {/* Current Persona Editor */}
          {personas[currentPersona] && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Core demographics and characteristics</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePersonaDelete(currentPersona)}
                    disabled={personas.length <= 1}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Persona Name</Label>
                      <Input
                        value={personas[currentPersona].name}
                        onChange={(e) => handlePersonaUpdate('name', e.target.value)}
                        placeholder="e.g., Enterprise Emma"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Age Range</Label>
                      <Input
                        value={personas[currentPersona].age}
                        onChange={(e) => handlePersonaUpdate('age', e.target.value)}
                        placeholder="e.g., 25-35"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Occupation</Label>
                      <Input
                        value={personas[currentPersona].occupation}
                        onChange={(e) => handlePersonaUpdate('occupation', e.target.value)}
                        placeholder="e.g., Marketing Director"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Income Range</Label>
                      <Input
                        value={personas[currentPersona].income}
                        onChange={(e) => handlePersonaUpdate('income', e.target.value)}
                        placeholder="e.g., $60k-100k"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Goals & Motivations</CardTitle>
                  <CardDescription>What drives this persona</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Primary Goals</Label>
                      <Textarea
                        placeholder="List the main goals and objectives..."
                        rows={3}
                        value={personas[currentPersona].goals.join('\n')}
                        onChange={(e) => handlePersonaUpdate('goals', e.target.value.split('\n').filter(g => g))}
                      />
                    </div>
                    <div>
                      <Label>Key Motivations</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {[
                          { icon: TrendingUp, label: 'Growth', color: 'text-green-600' },
                          { icon: DollarSign, label: 'Savings', color: 'text-blue-600' },
                          { icon: Heart, label: 'Recognition', color: 'text-red-600' },
                          { icon: Brain, label: 'Innovation', color: 'text-purple-600' }
                        ].map(motivation => (
                          <div key={motivation.label} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <motivation.icon className={`w-5 h-5 ${motivation.color}`} />
                            <span className="text-sm">{motivation.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pain Points & Challenges</CardTitle>
                  <CardDescription>Problems this persona faces</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="List their main challenges and frustrations..."
                    rows={4}
                    value={personas[currentPersona].painPoints.join('\n')}
                    onChange={(e) => handlePersonaUpdate('painPoints', e.target.value.split('\n').filter(p => p))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Behavioral Insights</CardTitle>
                  <CardDescription>How they make decisions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Buying Behavior</Label>
                    <Textarea
                      placeholder="Describe their purchasing habits and decision-making process..."
                      rows={3}
                      value={personas[currentPersona].buyingBehavior}
                      onChange={(e) => handlePersonaUpdate('buyingBehavior', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Preferred Channels</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['Email', 'Social Media', 'Search', 'Direct Sales', 'Webinars', 'Content', 'Events', 'Referrals'].map(channel => (
                        <Badge
                          key={channel}
                          variant="outline"
                          className="py-2 justify-center cursor-pointer hover:bg-purple-50"
                        >
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Customer Journey */}
        <TabsContent value="journey" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Journey Stages</CardTitle>
              <CardDescription>Map the typical customer journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { stage: 'Awareness', icon: AlertCircle, color: 'bg-blue-100 text-blue-600' },
                  { stage: 'Consideration', icon: Brain, color: 'bg-purple-100 text-purple-600' },
                  { stage: 'Decision', icon: Target, color: 'bg-green-100 text-green-600' },
                  { stage: 'Purchase', icon: ShoppingBag, color: 'bg-yellow-100 text-yellow-600' },
                  { stage: 'Retention', icon: Heart, color: 'bg-red-100 text-red-600' }
                ].map((item, index) => (
                  <div key={item.stage} className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{item.stage}</h4>
                      <Textarea
                        placeholder={`Describe what happens during the ${item.stage.toLowerCase()} stage...`}
                        rows={2}
                      />
                    </div>
                    {index < 4 && (
                      <div className="flex items-center justify-center h-full">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Touchpoints</CardTitle>
              <CardDescription>Where and how customers interact with your brand</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  'Website', 'Email', 'Social Media', 'Phone', 'Live Chat', 'In-Person',
                  'Mobile App', 'Online Ads', 'Content/Blog', 'Events', 'Partners', 'Support'
                ].map(touchpoint => (
                  <label key={touchpoint} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{touchpoint}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                AI-Generated Insights
              </CardTitle>
              <CardDescription>Based on your audience data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Key Opportunity</h4>
                  <p className="text-sm text-gray-700">
                    Your target audience shows high engagement with educational content. Consider creating
                    a comprehensive resource library to establish thought leadership.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Communication Tip</h4>
                  <p className="text-sm text-gray-700">
                    Based on your personas, focus on ROI-driven messaging with concrete examples
                    and case studies rather than feature lists.
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Channel Recommendation</h4>
                  <p className="text-sm text-gray-700">
                    LinkedIn and email marketing appear to be your most effective channels for
                    reaching decision-makers in your target market.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audience Overlap Analysis</CardTitle>
              <CardDescription>Common traits across your personas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Value Quality Over Price</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full">
                      <div className="w-4/5 h-full bg-purple-600 rounded-full" />
                    </div>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tech-Savvy</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full">
                      <div className="w-3/4 h-full bg-purple-600 rounded-full" />
                    </div>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Time-Constrained</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full">
                      <div className="w-[90%] h-full bg-purple-600 rounded-full" />
                    </div>
                    <span className="text-sm font-medium">90%</span>
                  </div>
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
          <Button variant="outline" onClick={() => navigate('/app/setup/brand')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleNext}>
            Save & Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}