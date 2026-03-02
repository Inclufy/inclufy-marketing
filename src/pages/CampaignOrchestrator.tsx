// src/pages/CampaignOrchestrator.tsx
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Zap, 
  Play, 
  Pause, 
  Plus,
  BarChart3, 
  TrendingUp,
  Users,
  Mail,
  MessageSquare,
  Target,
  Brain,
  Settings,
  Copy,
  Trash2,
  DollarSign,
  Calendar
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: string;
  channels: string[];
  budget: number;
  spent: number;
  status: 'active' | 'paused' | 'draft';
  audience: {
    segment: string;
    size: number;
  };
  content: {
    subject: string;
    body: string;
    cta: string;
  };
  performance: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  aiOptimization: boolean;
  startDate: string;
  endDate: string;
}

export default function CampaignOrchestrator() {
  // Sample campaigns data
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Summer Sale 2024',
      type: 'Email',
      channels: ['email'],
      budget: 15000,
      spent: 8500,
      status: 'active',
      audience: {
        segment: 'All Subscribers',
        size: 25000
      },
      content: {
        subject: 'Summer Sale - Up to 50% Off!',
        body: 'Don\'t miss our biggest sale of the season...',
        cta: 'Shop Now'
      },
      performance: {
        sent: 24500,
        opened: 12250,
        clicked: 3675,
        converted: 245
      },
      aiOptimization: true,
      startDate: '2024-06-01',
      endDate: '2024-08-31'
    },
    {
      id: '2',
      name: 'Product Launch',
      type: 'Multi-channel',
      channels: ['email', 'sms', 'social'],
      budget: 25000,
      spent: 5000,
      status: 'paused',
      audience: {
        segment: 'VIP Customers',
        size: 5000
      },
      content: {
        subject: 'Introducing Our Latest Innovation',
        body: 'Be the first to experience...',
        cta: 'Pre-Order Now'
      },
      performance: {
        sent: 4800,
        opened: 2880,
        clicked: 960,
        converted: 96
      },
      aiOptimization: false,
      startDate: '2024-07-01',
      endDate: '2024-07-31'
    }
  ]);

  const [activeCampaignId, setActiveCampaignId] = useState<string>('1');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'Email',
    channels: ['email'],
    budget: 10000,
    audience: {
      segment: 'All Subscribers',
      size: 5000
    },
    content: {
      subject: '',
      body: '',
      cta: 'Learn More'
    },
    aiOptimization: true,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Helper functions
  const getTotalSpend = () => {
    return campaigns.reduce((total, campaign) => total + campaign.spent, 0);
  };

  const getActiveCount = () => {
    return campaigns.filter(c => c.status === 'active').length;
  };

  const getConversionRate = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign || campaign.performance.sent === 0) return 0;
    return (campaign.performance.converted / campaign.performance.sent) * 100;
  };

  const getROI = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign || campaign.spent === 0) return 0;
    const revenue = campaign.performance.converted * 150; // Assuming $150 AOV
    return ((revenue - campaign.spent) / campaign.spent) * 100;
  };

  const handleCreateCampaign = () => {
    const newId = (campaigns.length + 1).toString();
    const campaign: Campaign = {
      id: newId,
      ...newCampaign,
      status: 'draft',
      spent: 0,
      performance: {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0
      }
    };
    
    setCampaigns([...campaigns, campaign]);
    setIsCreateDialogOpen(false);
    
    // Reset form
    setNewCampaign({
      name: '',
      type: 'Email',
      channels: ['email'],
      budget: 10000,
      audience: {
        segment: 'All Subscribers',
        size: 5000
      },
      content: {
        subject: '',
        body: '',
        cta: 'Learn More'
      },
      aiOptimization: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  const handleDeleteCampaign = (id: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      setCampaigns(campaigns.filter(c => c.id !== id));
      if (activeCampaignId === id && campaigns.length > 1) {
        setActiveCampaignId(campaigns[0].id);
      }
    }
  };

  const pauseCampaign = (id: string) => {
    setCampaigns(campaigns.map(c => 
      c.id === id ? { ...c, status: 'paused' as const } : c
    ));
  };

  const resumeCampaign = (id: string) => {
    setCampaigns(campaigns.map(c => 
      c.id === id ? { ...c, status: 'active' as const } : c
    ));
  };

  const duplicateCampaign = (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    if (campaign) {
      const newId = (campaigns.length + 1).toString();
      const duplicated: Campaign = {
        ...campaign,
        id: newId,
        name: `${campaign.name} (Copy)`,
        status: 'draft',
        spent: 0,
        performance: {
          sent: 0,
          opened: 0,
          clicked: 0,
          converted: 0
        }
      };
      setCampaigns([...campaigns, duplicated]);
    }
  };

  const updateCampaign = (id: string, updates: Partial<Campaign>) => {
    setCampaigns(campaigns.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  // Calculate metrics
  const totalSpend = getTotalSpend();
  const activeCount = getActiveCount();
  const totalRevenue = campaigns.reduce((total, campaign) => {
    return total + (campaign.performance.converted * 150); // Assuming $150 AOV
  }, 0);
  const avgConversionRate = campaigns.length > 0
    ? campaigns.reduce((sum, c) => sum + getConversionRate(c.id), 0) / campaigns.length
    : 0;

  const selectedCampaign = campaigns.find(c => c.id === activeCampaignId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Target className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Campaign Orchestrator
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and optimize your marketing campaigns with AI
            </p>
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Plus className="h-5 w-5 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up your campaign details and launch when ready
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="Summer Sale 2024"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Campaign Type</Label>
                  <Select 
                    value={newCampaign.type}
                    onValueChange={(value) => setNewCampaign({ ...newCampaign, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Multi-channel">Multi-channel</SelectItem>
                      <SelectItem value="Social">Social Media</SelectItem>
                      <SelectItem value="SMS">SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="budget">Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({ ...newCampaign, budget: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="subject">Email Subject Line</Label>
                <Input
                  id="subject"
                  value={newCampaign.content.subject}
                  onChange={(e) => setNewCampaign({ 
                    ...newCampaign, 
                    content: { ...newCampaign.content, subject: e.target.value }
                  })}
                  placeholder="Limited Time: 50% Off Everything"
                />
              </div>
              
              <div>
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={newCampaign.content.body}
                  onChange={(e) => setNewCampaign({ 
                    ...newCampaign, 
                    content: { ...newCampaign.content, body: e.target.value }
                  })}
                  placeholder="Your campaign message..."
                  rows={4}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="ai-optimization"
                  checked={newCampaign.aiOptimization}
                  onChange={(e) => setNewCampaign({ ...newCampaign, aiOptimization: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <Label htmlFor="ai-optimization" className="flex items-center gap-2 cursor-pointer">
                  <Brain className="h-4 w-4 text-purple-600" />
                  Enable AI Optimization
                </Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  Create Campaign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-gray-500">of {campaigns.length} total</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">${(totalSpend / 1000).toFixed(1)}K</div>
            <p className="text-xs text-gray-500">This month</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Revenue Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${(totalRevenue / 1000).toFixed(1)}K</div>
            <p className="text-xs text-green-600">
              {totalSpend > 0 ? `${((totalRevenue / totalSpend - 1) * 100).toFixed(0)}% ROI` : 'N/A'}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg. Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{avgConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-green-600">+0.5% with AI</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Campaign List */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>Click to view and manage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => setActiveCampaignId(campaign.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  activeCampaignId === campaign.id 
                    ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{campaign.name}</h4>
                  <Badge 
                    variant={
                      campaign.status === 'active' ? 'default' : 
                      campaign.status === 'paused' ? 'secondary' : 
                      'outline'
                    }
                  >
                    {campaign.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{campaign.type}</span>
                  {campaign.aiOptimization && (
                    <Badge variant="outline" className="gap-1 border-purple-300 text-purple-700 dark:text-purple-300">
                      <Brain className="h-3 w-3" />
                      AI
                    </Badge>
                  )}
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Budget used</span>
                    <span>{((campaign.spent / campaign.budget) * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={(campaign.spent / campaign.budget) * 100} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Campaign Details */}
        {selectedCampaign && (
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedCampaign.name}</CardTitle>
                  <CardDescription>{selectedCampaign.type} Campaign</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => duplicateCampaign(selectedCampaign.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={selectedCampaign.status === 'active' ? 'secondary' : 'default'}
                    size="sm"
                    onClick={() => 
                      selectedCampaign.status === 'active' 
                        ? pauseCampaign(selectedCampaign.id)
                        : resumeCampaign(selectedCampaign.id)
                    }
                    className={selectedCampaign.status !== 'active' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : ''}
                  >
                    {selectedCampaign.status === 'active' ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Performance Metrics */}
              <div>
                <h3 className="text-sm font-medium mb-4">Performance Metrics</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-2">
                      <Mail className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold">{(selectedCampaign.performance.sent / 1000).toFixed(1)}K</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sent</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-2">
                      <Users className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold">{(selectedCampaign.performance.opened / 1000).toFixed(1)}K</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Opened</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mx-auto mb-2">
                      <Target className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold">{(selectedCampaign.performance.clicked / 1000).toFixed(1)}K</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Clicked</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="h-8 w-8 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold">{selectedCampaign.performance.converted}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Converted</p>
                  </div>
                </div>
              </div>

              {/* ROI Card */}
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-100">Campaign ROI</h4>
                      <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-1">
                        {getROI(selectedCampaign.id).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-700 dark:text-green-300">Revenue</p>
                      <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                        ${((selectedCampaign.performance.converted * 150) / 1000).toFixed(1)}K
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Campaign Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Duration</span>
                      <span>
                        {new Date(selectedCampaign.startDate).toLocaleDateString()} - 
                        {new Date(selectedCampaign.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Audience</span>
                      <span>{selectedCampaign.audience.segment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Audience Size</span>
                      <span>{selectedCampaign.audience.size.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Budget</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Budget</span>
                      <span>${selectedCampaign.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Spent</span>
                      <span>${selectedCampaign.spent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Remaining</span>
                      <span>${(selectedCampaign.budget - selectedCampaign.spent).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Optimization Status */}
              {selectedCampaign.aiOptimization ? (
                <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                        <Brain className="h-7 w-7 text-purple-600 dark:text-purple-300" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-purple-900 dark:text-purple-100">AI Optimization Active</h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          AI is continuously optimizing send times, content, and targeting
                        </p>
                        <div className="mt-2 space-y-1 text-sm text-purple-700 dark:text-purple-300">
                          <p>✓ Smart send time optimization</p>
                          <p>✓ Subject line A/B testing</p>
                          <p>✓ Audience segment refinement</p>
                        </div>
                      </div>
                      <Badge className="bg-purple-600 text-white">+23% Performance</Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed border-2">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Brain className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">Enable AI Optimization</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Let AI optimize this campaign for better performance
                      </p>
                      <Button 
                        onClick={() => updateCampaign(selectedCampaign.id, { aiOptimization: true })}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        Enable AI
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}