import { useState, useEffect } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
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

const CampaignOrchestrator = () => {
  const { 
    campaigns, 
    activeCampaignId, 
    setActiveCampaign, 
    addCampaign,
    updateCampaign,
    deleteCampaign,
    pauseCampaign,
    resumeCampaign,
    duplicateCampaign,
    getTotalSpend,
    getActiveCount,
    getConversionRate,
    getROI
  } = useCampaignStore();

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

  const selectedCampaign = campaigns.find(c => c.id === activeCampaignId);

  const handleCreateCampaign = () => {
    addCampaign({
      ...newCampaign,
      status: 'draft',
      spent: 0,
      performance: {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0
      }
    });
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
      deleteCampaign(id);
    }
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Campaign Orchestrator</h1>
            <p className="text-muted-foreground">Manage and optimize your marketing campaigns with AI</p>
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
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
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={newCampaign.budget}
                    onChange={(e) => setNewCampaign({ ...newCampaign, budget: parseInt(e.target.value) })}
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
                  className="h-4 w-4"
                />
                <Label htmlFor="ai-optimization" className="flex items-center gap-2 cursor-pointer">
                  <Brain className="h-4 w-4" />
                  Enable AI Optimization
                </Label>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign}>
                  Create Campaign
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">of {campaigns.length} total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalSpend / 1000).toFixed(1)}K</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(1)}K</div>
            <p className="text-xs text-green-600">
              {totalSpend > 0 ? `${((totalRevenue / totalSpend - 1) * 100).toFixed(0)}% ROI` : 'N/A'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Conversion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-green-600">+0.5% with AI</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Campaign List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>Click to view and manage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                onClick={() => setActiveCampaign(campaign.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  activeCampaignId === campaign.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{campaign.name}</h4>
                  <Badge 
                    variant={
                      campaign.status === 'active' ? 'default' : 
                      campaign.status === 'paused' ? 'warning' : 
                      'secondary'
                    }
                  >
                    {campaign.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{campaign.type}</span>
                  {campaign.aiOptimization && (
                    <Badge variant="outline" className="gap-1">
                      <Brain className="h-3 w-3" />
                      AI
                    </Badge>
                  )}
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
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
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedCampaign.name}</CardTitle>
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
                    <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{(selectedCampaign.performance.sent / 1000).toFixed(1)}K</p>
                    <p className="text-sm text-muted-foreground">Sent</p>
                  </div>
                  <div className="text-center">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{(selectedCampaign.performance.opened / 1000).toFixed(1)}K</p>
                    <p className="text-sm text-muted-foreground">Opened</p>
                  </div>
                  <div className="text-center">
                    <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{(selectedCampaign.performance.clicked / 1000).toFixed(1)}K</p>
                    <p className="text-sm text-muted-foreground">Clicked</p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{selectedCampaign.performance.converted}</p>
                    <p className="text-sm text-muted-foreground">Converted</p>
                  </div>
                </div>
              </div>

              {/* ROI Card */}
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-900">Campaign ROI</h4>
                      <p className="text-3xl font-bold text-green-700 mt-1">
                        {getROI(selectedCampaign.id).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-700">Revenue</p>
                      <p className="text-2xl font-bold text-green-800">
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
                      <span className="text-muted-foreground">Duration</span>
                      <span>
                        {new Date(selectedCampaign.startDate).toLocaleDateString()} - 
                        {new Date(selectedCampaign.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Audience</span>
                      <span>{selectedCampaign.audience.segment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Audience Size</span>
                      <span>{selectedCampaign.audience.size.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Budget</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Budget</span>
                      <span>${selectedCampaign.budget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Spent</span>
                      <span>${selectedCampaign.spent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Remaining</span>
                      <span>${(selectedCampaign.budget - selectedCampaign.spent).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Optimization Status */}
              {selectedCampaign.aiOptimization ? (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Brain className="h-10 w-10 text-primary" />
                      <div className="flex-1">
                        <h4 className="font-semibold">AI Optimization Active</h4>
                        <p className="text-sm text-muted-foreground">
                          AI is continuously optimizing send times, content, and targeting
                        </p>
                        <div className="mt-2 space-y-1 text-sm">
                          <p>✓ Smart send time optimization</p>
                          <p>✓ Subject line A/B testing</p>
                          <p>✓ Audience segment refinement</p>
                        </div>
                      </div>
                      <Badge variant="default">+23% Performance</Badge>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Brain className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">Enable AI Optimization</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Let AI optimize this campaign for better performance
                      </p>
                      <Button onClick={() => updateCampaign(selectedCampaign.id, { aiOptimization: true })}>
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
};

export default CampaignOrchestrator;