// src/pages/LuxuryDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Activity,
  BarChart3,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Filter,
  Download,
  Sparkles,
  Crown,
  Gem,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from '@/lib/api';

interface DashboardStats {
  campaigns: { total: number; active: number; draft: number };
  contacts: { total: number };
  events?: { total: number };
  revenue?: { total: number };
}

interface CampaignSummary {
  id: string;
  name: string;
  status: string;
  type: string;
  budget_amount: number | null;
  created_at: string;
}

// Luxury metric card with glassmorphism effect
const LuxuryMetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  subtitle,
  loading = false
}: any) => (
  <Card className="group relative overflow-hidden border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
    <div className={cn(
      "absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity",
      color === 'purple' && "bg-gradient-to-br from-purple-600 to-pink-600",
      color === 'blue' && "bg-gradient-to-br from-blue-600 to-cyan-600",
      color === 'green' && "bg-gradient-to-br from-emerald-600 to-green-600",
      color === 'amber' && "bg-gradient-to-br from-amber-600 to-orange-600"
    )} />

    <CardContent className="relative p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-3 rounded-2xl",
          color === 'purple' && "bg-gradient-to-br from-purple-500 to-pink-500",
          color === 'blue' && "bg-gradient-to-br from-blue-500 to-cyan-500",
          color === 'green' && "bg-gradient-to-br from-emerald-500 to-green-500",
          color === 'amber' && "bg-gradient-to-br from-amber-500 to-orange-500"
        )}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {change !== undefined && change !== null && (
          <div className="flex items-center gap-1">
            {change > 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : change < 0 ? (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            ) : null}
            {change !== 0 && (
              <span className={cn(
                "text-sm font-semibold",
                change > 0 ? "text-green-600" : "text-red-600"
              )}>
                {Math.abs(change)}%
              </span>
            )}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        {loading ? (
          <div className="flex items-center gap-2 mt-1">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="text-gray-400">Loading...</span>
          </div>
        ) : (
          <p className="text-3xl font-bold mt-1 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 text-transparent bg-clip-text">
            {value}
          </p>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
    </CardContent>
  </Card>
);

// Performance indicator component
const PerformanceIndicator = ({ label, value, target, color }: any) => {
  const percentage = target > 0 ? (value / target) * 100 : 0;
  const isExceeding = percentage > 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{value.toLocaleString()}</span>
          <span className="text-xs text-gray-500">/ {target.toLocaleString()}</span>
          {isExceeding && <Crown className="h-4 w-4 text-amber-500" />}
        </div>
      </div>
      <div className="relative">
        <Progress
          value={Math.min(percentage, 100)}
          className="h-2"
        />
        {isExceeding && (
          <div className="absolute inset-0 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse"
              style={{ width: `${percentage - 100}%`, marginLeft: 'auto' }}
            />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{percentage.toFixed(1)}% achieved</span>
        {isExceeding && (
          <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
            Exceeding Target
          </Badge>
        )}
      </div>
    </div>
  );
};

export default function LuxuryDashboard() {
  const [dateRange, setDateRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, campaignsRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/campaigns/'),
      ]);
      setStats(dashRes.data);
      setCampaigns(Array.isArray(campaignsRes.data) ? campaignsRes.data : []);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate derived metrics from real data
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget_amount || 0), 0);
  const activeCampaigns = stats?.campaigns.active ?? 0;
  const totalCampaigns = stats?.campaigns.total ?? 0;
  const draftCampaigns = stats?.campaigns.draft ?? 0;
  const totalContacts = stats?.contacts.total ?? 0;

  // Campaign type distribution
  const typeDistribution = campaigns.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent campaigns (last 5)
  const recentCampaigns = campaigns.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Executive Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 text-transparent bg-clip-text">
                  Executive Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {loading ? 'Loading your data...' : (
                    <>
                      {activeCampaigns > 0
                        ? <><span className="text-green-600 font-semibold">{activeCampaigns} active campaigns</span> running</>
                        : 'No active campaigns yet — create one to get started'
                      }
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="h-10" onClick={fetchDashboardData} disabled={loading}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Refresh
                </Button>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-36 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button className="h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Make sure the backend is running at localhost:8000 and you are logged in.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDashboardData}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TabsList className="bg-transparent border-0 p-0 h-auto">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-4"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-4"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Performance
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-4"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger
                value="intelligence"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-4"
              >
                <Gem className="h-4 w-4 mr-2" />
                Intelligence
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Key Metrics - Connected to real data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <LuxuryMetricCard
                title="Total Budget"
                value={totalBudget > 0 ? `$${(totalBudget / 1000).toFixed(1)}K` : '$0'}
                change={null}
                icon={DollarSign}
                color="purple"
                subtitle={`Across ${totalCampaigns} campaign${totalCampaigns !== 1 ? 's' : ''}`}
                loading={loading}
              />
              <LuxuryMetricCard
                title="Active Campaigns"
                value={String(activeCampaigns)}
                change={null}
                icon={Activity}
                color="blue"
                subtitle={`${draftCampaigns} in draft`}
                loading={loading}
              />
              <LuxuryMetricCard
                title="Total Contacts"
                value={totalContacts.toLocaleString()}
                change={null}
                icon={Users}
                color="green"
                subtitle="In your database"
                loading={loading}
              />
              <LuxuryMetricCard
                title="Total Campaigns"
                value={String(totalCampaigns)}
                change={null}
                icon={Target}
                color="amber"
                subtitle={`${activeCampaigns} active, ${draftCampaigns} draft`}
                loading={loading}
              />
            </div>

            {/* Campaign Goals / Progress */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Campaign Progress</CardTitle>
                    <CardDescription>Overview of your marketing campaigns</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : campaigns.length > 0 ? (
                  <>
                    <PerformanceIndicator
                      label="Active Campaigns"
                      value={activeCampaigns}
                      target={totalCampaigns || 1}
                      color="purple"
                    />
                    <PerformanceIndicator
                      label="Contacts Reached"
                      value={totalContacts}
                      target={Math.max(totalContacts, 1000)}
                      color="blue"
                    />
                    <PerformanceIndicator
                      label="Total Budget Allocated"
                      value={totalBudget}
                      target={Math.max(totalBudget * 1.2, 10000)}
                      color="green"
                    />
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No campaigns yet. Create your first campaign to see progress.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Campaigns */}
            {recentCampaigns.length > 0 && (
              <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>Recent Campaigns</CardTitle>
                  <CardDescription>Your latest campaign activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentCampaigns.map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            campaign.status === 'active' && "bg-green-500",
                            campaign.status === 'draft' && "bg-gray-400",
                            campaign.status === 'paused' && "bg-amber-500"
                          )} />
                          <div>
                            <p className="font-medium text-sm">{campaign.name}</p>
                            <p className="text-xs text-gray-500">{campaign.type} &middot; {new Date(campaign.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            campaign.status === 'active' ? 'default' :
                            campaign.status === 'paused' ? 'secondary' :
                            'outline'
                          }>
                            {campaign.status}
                          </Badge>
                          {campaign.budget_amount && (
                            <span className="text-sm text-gray-500">
                              ${campaign.budget_amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Insights */}
            <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>AI-Powered Insights</CardTitle>
                    <CardDescription>Intelligence from your marketing data</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Campaign Status</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {activeCampaigns > 0
                            ? `${activeCampaigns} campaign${activeCampaigns > 1 ? 's are' : ' is'} active. ${draftCampaigns > 0 ? `${draftCampaigns} in draft waiting to launch.` : ''}`
                            : 'No active campaigns. Launch a campaign to start engaging your audience.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Contact Growth</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {totalContacts > 0
                            ? `${totalContacts.toLocaleString()} contacts in your database. Import more to expand your reach.`
                            : 'No contacts yet. Import a CSV or add contacts manually to get started.'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                        <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Budget Utilization</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {totalBudget > 0
                            ? `$${(totalBudget / 1000).toFixed(1)}K total budget allocated across campaigns.`
                            : 'Set campaign budgets to track your marketing spend.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6 mt-0">
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>Campaign performance metrics from events data</CardDescription>
              </CardHeader>
              <CardContent>
                {campaigns.length > 0 ? (
                  <div className="space-y-4">
                    {campaigns.filter(c => c.status === 'active').map((campaign) => (
                      <div key={campaign.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{campaign.name}</h4>
                          <Badge>{campaign.type}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          Budget: ${(campaign.budget_amount || 0).toLocaleString()} &middot; Status: {campaign.status}
                        </p>
                      </div>
                    ))}
                    {campaigns.filter(c => c.status === 'active').length === 0 && (
                      <p className="text-gray-500 text-center py-8">No active campaigns to show performance for.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                    Create campaigns to see performance data here.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-0">
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>Comprehensive data analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {totalCampaigns > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(typeDistribution).map(([type, count]) => (
                      <div key={type} className="p-4 border rounded-lg text-center">
                        <p className="text-2xl font-bold">{count}</p>
                        <p className="text-sm text-gray-500 capitalize">{type}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                    Analytics data will appear once you create campaigns.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-6 mt-0">
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle>Business Intelligence</CardTitle>
                <CardDescription>AI-powered insights and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-semibold mb-1">Summary</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You have {totalCampaigns} campaign{totalCampaigns !== 1 ? 's' : ''} ({activeCampaigns} active),{' '}
                      {totalContacts.toLocaleString()} contact{totalContacts !== 1 ? 's' : ''}, and{' '}
                      ${totalBudget.toLocaleString()} in total budget.
                    </p>
                  </div>
                  {totalCampaigns === 0 && (
                    <div className="p-4 border-2 border-dashed rounded-lg text-center">
                      <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Start creating campaigns and importing contacts to unlock AI-powered recommendations.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
