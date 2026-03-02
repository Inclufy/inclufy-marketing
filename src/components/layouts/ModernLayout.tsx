// src/pages/Dashboard-Centralized.tsx
import React from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign,
  Activity,
  Calendar,
  ChevronRight,
  Plus,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Metric Card Component
const MetricCard = ({ title, value, change, icon: Icon, color }: any) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "p-3 rounded-lg",
          color === 'green' && "bg-green-100 dark:bg-green-900/20",
          color === 'purple' && "bg-purple-100 dark:bg-purple-900/20",
          color === 'blue' && "bg-blue-100 dark:bg-blue-900/20",
          color === 'orange' && "bg-orange-100 dark:bg-orange-900/20"
        )}>
          <Icon className={cn(
            "h-6 w-6",
            color === 'green' && "text-green-600 dark:text-green-400",
            color === 'purple' && "text-purple-600 dark:text-purple-400",
            color === 'blue' && "text-blue-600 dark:text-blue-400",
            color === 'orange' && "text-orange-600 dark:text-orange-400"
          )} />
        </div>
        <div className={cn(
          "text-sm font-medium px-2 py-1 rounded",
          change > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
        )}>
          {change > 0 ? '+' : ''}{change}%
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });
  
  return (
    // Centralized container with max-width
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, Sami! ✨</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Your campaigns are performing <span className="text-green-600 font-medium">23% better</span> than last month
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              This Month
            </Button>
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              AI Summary
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total Revenue"
            value="$877.9K"
            change={23}
            icon={DollarSign}
            color="green"
          />
          <MetricCard
            title="Active Campaigns"
            value="38"
            change={12}
            icon={Activity}
            color="purple"
          />
          <MetricCard
            title="Total Contacts"
            value="24,583"
            change={18}
            icon={Users}
            color="blue"
          />
          <MetricCard
            title="Avg. Engagement"
            value="68.5%"
            change={-2.3}
            icon={Target}
            color="orange"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart - Takes 2 columns */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenue & Performance</CardTitle>
                  <CardDescription>Monthly overview</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gradient-to-tr from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
                {/* Chart placeholder - replace with actual chart */}
                <p className="text-gray-500">Revenue Chart</p>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Status */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Status</CardTitle>
              <CardDescription>Total: 38 campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center">
                {/* Donut chart placeholder */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full border-8 border-purple-600"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">38</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                    Active
                  </span>
                  <span>12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                    Scheduled
                  </span>
                  <span>5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    Draft
                  </span>
                  <span>3</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Engagement */}
          <Card>
            <CardHeader>
              <CardTitle>User Engagement</CardTitle>
              <CardDescription>Active users distribution</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-3">
                  <Users className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold">24.5K</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active users</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <Button variant="ghost" size="sm">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Sarah Chen</span> launched campaign Summer Sale 2024
                    </p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>MJ</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Mike Johnson</span> generated content 5 social media posts
                    </p>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🏆</span> Top Performers
              </CardTitle>
              <CardDescription>This month's leaders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Sarah Chen</p>
                      <p className="text-xs text-gray-500">24 campaigns • $125K</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">98%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>MJ</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Mike Johnson</p>
                      <p className="text-xs text-gray-500">21 campaigns • $108K</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">92%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>ED</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Emily Davis</p>
                      <p className="text-xs text-gray-500">19 campaigns • $95K</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">87%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}