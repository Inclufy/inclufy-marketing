// src/pages/CampaignOrchestrator.tsx
import { useState, useEffect, useCallback } from "react";
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
  Play,
  Pause,
  Plus,
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  Target,
  Brain,
  Copy,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import api from "@/lib/api";

interface Campaign {
  id: string;
  name: string;
  type: string;
  description: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  budget_amount: number | null;
  audience_filters: Record<string, any>;
  content: Record<string, any>;
  settings: Record<string, any>;
  created_at: string;
  created_by: string;
}

export default function CampaignOrchestrator() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'email',
    description: '',
    budget_amount: 10000,
    starts_at: new Date().toISOString().split('T')[0],
    ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    content: {
      subject: '',
      body: '',
      cta: 'Learn More'
    },
    settings: {
      ai_optimization: true,
    }
  });

  // Fetch campaigns from API
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/campaigns/');
      const data = Array.isArray(res.data) ? res.data : [];
      setCampaigns(data);
      if (data.length > 0 && !activeCampaignId) {
        setActiveCampaignId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch campaigns:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, [activeCampaignId]);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // Create campaign via API
  const handleCreateCampaign = async () => {
    if (!newCampaign.name.trim()) return;

    try {
      setSaving(true);
      const payload = {
        name: newCampaign.name.trim(),
        type: newCampaign.type,
        description: newCampaign.description || null,
        budget_amount: newCampaign.budget_amount || null,
        starts_at: newCampaign.starts_at || null,
        ends_at: newCampaign.ends_at || null,
        content: newCampaign.content,
        settings: newCampaign.settings,
      };

      const res = await api.post('/campaigns/', payload);
      const created = res.data;

      setCampaigns(prev => [created, ...prev]);
      setActiveCampaignId(created.id);
      setIsCreateDialogOpen(false);

      // Reset form
      setNewCampaign({
        name: '',
        type: 'email',
        description: '',
        budget_amount: 10000,
        starts_at: new Date().toISOString().split('T')[0],
        ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        content: { subject: '', body: '', cta: 'Learn More' },
        settings: { ai_optimization: true },
      });
    } catch (err: any) {
      console.error('Failed to create campaign:', err);
      setError(err.response?.data?.detail || 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  // Update campaign status via API
  const updateCampaignStatus = async (id: string, newStatus: string) => {
    try {
      setSaving(true);
      const res = await api.patch(`/campaigns/${id}`, { status: newStatus });
      setCampaigns(prev => prev.map(c => c.id === id ? res.data : c));
    } catch (err: any) {
      console.error('Failed to update campaign:', err);
      setError(err.response?.data?.detail || 'Failed to update campaign');
    } finally {
      setSaving(false);
    }
  };

  // Delete campaign via API
  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      setSaving(true);
      await api.delete(`/campaigns/${id}`);
      setCampaigns(prev => prev.filter(c => c.id !== id));
      if (activeCampaignId === id) {
        const remaining = campaigns.filter(c => c.id !== id);
        setActiveCampaignId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      console.error('Failed to delete campaign:', err);
      setError(err.response?.data?.detail || 'Failed to delete campaign');
    } finally {
      setSaving(false);
    }
  };

  // Duplicate campaign (create copy via API)
  const duplicateCampaign = async (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;

    try {
      setSaving(true);
      const payload = {
        name: `${campaign.name} (Copy)`,
        type: campaign.type,
        description: campaign.description,
        budget_amount: campaign.budget_amount,
        starts_at: campaign.starts_at,
        ends_at: campaign.ends_at,
        content: campaign.content,
        settings: campaign.settings,
      };

      const res = await api.post('/campaigns/', payload);
      setCampaigns(prev => [res.data, ...prev]);
      setActiveCampaignId(res.data.id);
    } catch (err: any) {
      console.error('Failed to duplicate campaign:', err);
      setError(err.response?.data?.detail || 'Failed to duplicate campaign');
    } finally {
      setSaving(false);
    }
  };

  // Calculated metrics
  const activeCount = campaigns.filter(c => c.status === 'active').length;
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget_amount || 0), 0);
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
              Manage and optimize your marketing campaigns
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCampaigns} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

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
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="multi-channel">Multi-channel</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="push">Push Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="budget">Budget ($)</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={newCampaign.budget_amount}
                      onChange={(e) => setNewCampaign({ ...newCampaign, budget_amount: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCampaign.description}
                    onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                    placeholder="Describe your campaign objective..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="starts_at">Start Date</Label>
                    <Input
                      id="starts_at"
                      type="date"
                      value={newCampaign.starts_at}
                      onChange={(e) => setNewCampaign({ ...newCampaign, starts_at: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ends_at">End Date</Label>
                    <Input
                      id="ends_at"
                      type="date"
                      value={newCampaign.ends_at}
                      onChange={(e) => setNewCampaign({ ...newCampaign, ends_at: e.target.value })}
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
                    checked={newCampaign.settings.ai_optimization}
                    onChange={(e) => setNewCampaign({
                      ...newCampaign,
                      settings: { ...newCampaign.settings, ai_optimization: e.target.checked }
                    })}
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
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={saving || !newCampaign.name.trim()}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Create Campaign
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-200 flex-1">{error}</p>
          <Button variant="outline" size="sm" onClick={() => setError(null)}>Dismiss</Button>
        </div>
      )}

      {/* Campaign Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeCount}</div>
                <p className="text-xs text-gray-500">of {campaigns.length} total</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <>
                <div className="text-2xl font-bold text-purple-600">
                  ${totalBudget > 0 ? (totalBudget / 1000).toFixed(1) + 'K' : '0'}
                </div>
                <p className="text-xs text-gray-500">Allocated budget</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <>
                <div className="text-2xl font-bold text-amber-600">
                  {campaigns.filter(c => c.status === 'draft').length}
                </div>
                <p className="text-xs text-gray-500">Ready to launch</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Campaign Types</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(campaigns.map(c => c.type)).size}
                </div>
                <p className="text-xs text-gray-500">Different types</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading campaigns...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && campaigns.length === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first campaign to start engaging your audience.
            </p>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Campaign List + Details */}
      {!loading && campaigns.length > 0 && (
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
                    <h4 className="font-semibold text-sm truncate mr-2">{campaign.name}</h4>
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
                    <span className="text-gray-600 dark:text-gray-400 capitalize">{campaign.type}</span>
                    {campaign.settings?.ai_optimization && (
                      <Badge variant="outline" className="gap-1 border-purple-300 text-purple-700 dark:text-purple-300">
                        <Brain className="h-3 w-3" />
                        AI
                      </Badge>
                    )}
                  </div>
                  {campaign.budget_amount && campaign.budget_amount > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Budget: ${campaign.budget_amount.toLocaleString()}</p>
                    </div>
                  )}
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
                    <CardDescription className="capitalize">{selectedCampaign.type} Campaign</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateCampaign(selectedCampaign.id)}
                      disabled={saving}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCampaign(selectedCampaign.id)}
                      disabled={saving}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={selectedCampaign.status === 'active' ? 'secondary' : 'default'}
                      size="sm"
                      disabled={saving}
                      onClick={() =>
                        updateCampaignStatus(
                          selectedCampaign.id,
                          selectedCampaign.status === 'active' ? 'paused' : 'active'
                        )
                      }
                      className={selectedCampaign.status !== 'active' ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : ''}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : selectedCampaign.status === 'active' ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          {selectedCampaign.status === 'draft' ? 'Launch' : 'Resume'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Campaign Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-3">Campaign Info</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status</span>
                        <Badge variant={
                          selectedCampaign.status === 'active' ? 'default' :
                          selectedCampaign.status === 'paused' ? 'secondary' :
                          'outline'
                        }>
                          {selectedCampaign.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Type</span>
                        <span className="capitalize">{selectedCampaign.type}</span>
                      </div>
                      {selectedCampaign.starts_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Start Date</span>
                          <span>{new Date(selectedCampaign.starts_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      {selectedCampaign.ends_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">End Date</span>
                          <span>{new Date(selectedCampaign.ends_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Created</span>
                        <span>{new Date(selectedCampaign.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-3">Budget</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Total Budget</span>
                        <span>
                          {selectedCampaign.budget_amount
                            ? `$${selectedCampaign.budget_amount.toLocaleString()}`
                            : 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedCampaign.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Description</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedCampaign.description}
                    </p>
                  </div>
                )}

                {/* Content Preview */}
                {selectedCampaign.content && Object.keys(selectedCampaign.content).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Content</h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                      {selectedCampaign.content.subject && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase">Subject</span>
                          <p className="text-sm">{selectedCampaign.content.subject}</p>
                        </div>
                      )}
                      {selectedCampaign.content.body && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase">Body</span>
                          <p className="text-sm whitespace-pre-wrap">{selectedCampaign.content.body}</p>
                        </div>
                      )}
                      {selectedCampaign.content.cta && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase">CTA</span>
                          <p className="text-sm">{selectedCampaign.content.cta}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Optimization Status */}
                {selectedCampaign.settings?.ai_optimization ? (
                  <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                          <Brain className="h-7 w-7 text-purple-600 dark:text-purple-300" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-purple-900 dark:text-purple-100">AI Optimization Enabled</h4>
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            AI will optimize send times, content, and targeting for this campaign.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-dashed border-2">
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Brain className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <h4 className="font-semibold mb-1">AI Optimization Available</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Enable AI optimization when creating or editing this campaign.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
