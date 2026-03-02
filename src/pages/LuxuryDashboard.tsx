// src/pages/LuxuryDashboard.tsx
import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  Zap,
  Award,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Filter,
  Download,
  Sparkles,
  Crown,
  Gem
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

// Luxury metric card with glassmorphism effect
const LuxuryMetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color,
  subtitle,
  sparkline = true 
}: any) => (
  <Card className="group relative overflow-hidden border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
    {/* Gradient background */}
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
        <div className="flex items-center gap-1">
          {change > 0 ? (
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          )}
          <span className={cn(
            "text-sm font-semibold",
            change > 0 ? "text-green-600" : "text-red-600"
          )}>
            {Math.abs(change)}%
          </span>
        </div>
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold mt-1 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 text-transparent bg-clip-text">
          {value}
        </p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
      
      {sparkline && (
        <div className="mt-4 h-12 flex items-end gap-1">
          {[40, 60, 45, 70, 55, 80, 65, 75, 85, 90].map((height, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 rounded-sm transition-all",
                color === 'purple' && "bg-purple-200 dark:bg-purple-800",
                color === 'blue' && "bg-blue-200 dark:bg-blue-800",
                color === 'green' && "bg-green-200 dark:bg-green-800",
                color === 'amber' && "bg-amber-200 dark:bg-amber-800"
              )}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

// Performance indicator component
const PerformanceIndicator = ({ label, value, target, color }: any) => {
  const percentage = (value / target) * 100;
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
                  Welcome back, Sami. Your performance is <span className="text-green-600 font-semibold">23% above target</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
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

      {/* Main Content with Proper Tabs Structure - EVERYTHING WRAPPED IN TABS */}
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
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <LuxuryMetricCard
                title="Total Revenue"
                value="$1.2M"
                change={23}
                icon={DollarSign}
                color="purple"
                subtitle="$287K above target"
              />
              <LuxuryMetricCard
                title="Active Campaigns"
                value="47"
                change={12}
                icon={Activity}
                color="blue"
                subtitle="12 launching this week"
              />
              <LuxuryMetricCard
                title="Conversion Rate"
                value="4.8%"
                change={8}
                icon={Target}
                color="green"
                subtitle="Industry avg: 3.2%"
              />
              <LuxuryMetricCard
                title="Customer LTV"
                value="$3,450"
                change={-3}
                icon={Users}
                color="amber"
                subtitle="Per customer"
              />
            </div>

            {/* Performance Goals */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Q4 Performance Goals</CardTitle>
                    <CardDescription>Track your progress towards quarterly targets</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <PerformanceIndicator
                  label="Revenue Target"
                  value={1200000}
                  target={980000}
                  color="purple"
                />
                <PerformanceIndicator
                  label="New Customers"
                  value={2847}
                  target={3000}
                  color="blue"
                />
                <PerformanceIndicator
                  label="Campaign ROI"
                  value={385}
                  target={300}
                  color="green"
                />
                <PerformanceIndicator
                  label="Brand Reach"
                  value={125000}
                  target={100000}
                  color="amber"
                />
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>AI-Powered Insights</CardTitle>
                    <CardDescription>Real-time intelligence from your marketing data</CardDescription>
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
                        <h4 className="font-semibold text-sm">Opportunity Detected</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Email campaigns show 47% higher engagement on Tuesdays. Consider rescheduling.
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
                        <h4 className="font-semibold text-sm">Growth Trend</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Mobile conversions up 23% this month. Mobile-first strategy paying off.
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
                        <h4 className="font-semibold text-sm">Achievement Unlocked</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          You're in the top 5% of marketers this quarter. Keep it up!
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
                <CardDescription>Deep dive into your marketing performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">Performance analytics content will be displayed here...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-0">
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle>Advanced Analytics</CardTitle>
                <CardDescription>Comprehensive data analysis and reporting</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">Advanced analytics content will be displayed here...</p>
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
                <p className="text-gray-600 dark:text-gray-400">Business intelligence content will be displayed here...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}