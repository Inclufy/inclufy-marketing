import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Target,
  Settings,
  BarChart3,
  TrendingUp,
  Award,
  Activity,
  Eye,
  MousePointer,
  DollarSign,
  ChevronRight,
  Brain,
  Zap,
  Globe,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Modern color palette matching the design
const theme = {
  primary: '#8B5CF6', // Purple
  secondary: '#F3F4F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: {
    primary: '#1F2937',
    secondary: '#6B7280',
    muted: '#9CA3AF'
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',
    tertiary: '#F3F4F6'
  }
};

// Metric Card Component
const MetricCard = ({ icon: Icon, label, value, change, color = theme.primary }) => (
  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold">{value}</p>
          {change && (
            <div className={`text-sm font-medium flex items-center gap-1 ${
              change > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change > 0 ? '+' : ''}{change}%
            </div>
          )}
        </div>
        <div 
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// Progress Item Component
const ProgressItem = ({ label, value, max, percentage, color }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-sm text-gray-500">
        {value} <span className="text-gray-400">({percentage}%)</span>
      </div>
    </div>
    <Progress value={percentage} className="h-2" />
  </div>
);

// Top Performer Component
const TopPerformer = ({ rank, name, subtitle, score, completion }) => (
  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
    <div className="flex items-center gap-4">
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
        style={{ 
          backgroundColor: rank === 1 ? '#FFD700' : '#E5E7EB',
          color: rank === 1 ? '#1F2937' : '#6B7280'
        }}
      >
        {rank}
      </div>
      <div>
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-lg font-bold">{score}%</p>
      <p className="text-xs text-gray-500">{completion} completion</p>
    </div>
  </div>
);

export default function ModernMarketingDashboard() {
  const [activeLevel1Tab, setActiveLevel1Tab] = useState('overview');
  const [activeLevel2Tab, setActiveLevel2Tab] = useState('performance');
  const [activeLevel3Tab, setActiveLevel3Tab] = useState('traffic');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: theme.primary }}
              >
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Marketing Intelligence Hub</h1>
                <p className="text-sm text-gray-500">AI-Powered Marketing Automation</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2">
                <Eye className="w-4 h-4" />
                View Library
              </Button>
              <Button className="gap-2" style={{ backgroundColor: theme.primary }}>
                <Sparkles className="w-4 w-4" />
                Generate Campaign
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Level 1 Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <Tabs value={activeLevel1Tab} onValueChange={setActiveLevel1Tab}>
          <TabsList className="h-12 bg-transparent border-0 p-0 w-full justify-start">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none h-12 px-6"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="campaigns" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none h-12 px-6"
            >
              <Target className="w-4 h-4 mr-2" />
              Campaigns
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none h-12 px-6"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="automation" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none h-12 px-6"
            >
              <Zap className="w-4 h-4 mr-2" />
              Automation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="m-0">
            {/* Level 2 Tabs for Overview */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 pt-4">
              <Tabs value={activeLevel2Tab} onValueChange={setActiveLevel2Tab}>
                <TabsList className="h-10 bg-white border border-gray-200">
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="conversion">Conversion</TabsTrigger>
                  <TabsTrigger value="revenue">Revenue</TabsTrigger>
                </TabsList>

                <TabsContent value="performance" className="mt-6 space-y-6">
                  {/* Level 3 Tabs */}
                  <Tabs value={activeLevel3Tab} onValueChange={setActiveLevel3Tab}>
                    <TabsList className="h-9 bg-transparent border-0 p-0">
                      <TabsTrigger 
                        value="traffic" 
                        className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Traffic Sources
                      </TabsTrigger>
                      <TabsTrigger 
                        value="channels" 
                        className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Channel Performance
                      </TabsTrigger>
                      <TabsTrigger 
                        value="content" 
                        className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        Content Analytics
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="traffic" className="mt-6 pb-6">
                      {/* Metrics Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <MetricCard
                          icon={Users}
                          label="Total Visitors"
                          value="45.2K"
                          change={12}
                          color={theme.primary}
                        />
                        <MetricCard
                          icon={Activity}
                          label="Active Sessions"
                          value="1,234"
                          change={-5}
                          color={theme.success}
                        />
                        <MetricCard
                          icon={MousePointer}
                          label="Click Rate"
                          value="3.4%"
                          change={8}
                          color={theme.warning}
                        />
                        <MetricCard
                          icon={DollarSign}
                          label="Revenue"
                          value="$125K"
                          change={23}
                          color={theme.danger}
                        />
                      </div>

                      {/* Content Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Traffic Sources */}
                        <Card className="border-0 shadow-sm">
                          <CardHeader>
                            <CardTitle className="text-lg">Traffic Sources</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <ProgressItem
                              label="Organic Search"
                              value="18.5K"
                              percentage={41}
                              color={theme.primary}
                            />
                            <ProgressItem
                              label="Direct"
                              value="12.3K"
                              percentage={27}
                              color={theme.success}
                            />
                            <ProgressItem
                              label="Social Media"
                              value="8.7K"
                              percentage={19}
                              color={theme.warning}
                            />
                            <ProgressItem
                              label="Referral"
                              value="5.7K"
                              percentage={13}
                              color={theme.danger}
                            />
                          </CardContent>
                        </Card>

                        {/* Top Performers */}
                        <Card className="border-0 shadow-sm">
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">Top Campaigns 🏆</CardTitle>
                            <Button variant="ghost" size="sm" className="text-sm">
                              View All
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <TopPerformer
                              rank={1}
                              name="Summer Sale 2024"
                              subtitle="Email Campaign"
                              score={94}
                              completion="100%"
                            />
                            <TopPerformer
                              rank={2}
                              name="Product Launch"
                              subtitle="Multi-channel"
                              score={87}
                              completion="95%"
                            />
                            <TopPerformer
                              rank={3}
                              name="Holiday Special"
                              subtitle="Social Media"
                              score={82}
                              completion="88%"
                            />
                          </CardContent>
                        </Card>
                      </div>

                      {/* Engagement Chart Placeholder */}
                      <Card className="border-0 shadow-sm mt-6">
                        <CardHeader>
                          <CardTitle className="text-lg">Engagement Over Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                            <p className="text-gray-400">Chart Component Here</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="channels" className="mt-6">
                      <div className="text-center py-12">
                        <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Channel performance analytics</p>
                      </div>
                    </TabsContent>

                    <TabsContent value="content" className="mt-6">
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Content performance metrics</p>
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="engagement" className="mt-6">
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Engagement metrics and analytics</p>
                  </div>
                </TabsContent>

                <TabsContent value="conversion" className="mt-6">
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Conversion funnel analysis</p>
                  </div>
                </TabsContent>

                <TabsContent value="revenue" className="mt-6">
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Revenue attribution and ROI</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          <TabsContent value="campaigns" className="m-0">
            <div className="p-6">
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Campaign management interface</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="m-0">
            <div className="p-6">
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Advanced analytics dashboard</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="automation" className="m-0">
            <div className="p-6">
              <div className="text-center py-12">
                <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Marketing automation workflows</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}