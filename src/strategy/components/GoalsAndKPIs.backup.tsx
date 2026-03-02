// src/pages/setup/GoalsAndKPIs-Improved.tsx
import { useState } from 'react';
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Plus,
  ChevronRight,
  BarChart3,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// Metric Card with better spacing
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  change, 
  icon: Icon, 
  color = "purple" 
}: any) => {
  const isPositive = change && change > 0;
  
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-200">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900/20`}>
            <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
          </div>
          {change && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-500">{subtitle}</p>
          )}
        </div>
        
        {/* Decorative gradient */}
        <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-${color}-500 to-${color}-600`} />
      </CardContent>
    </Card>
  );
};

export default function GoalsAndKPIs() {
  const [activeGoals, setActiveGoals] = useState([
    { id: 1, name: 'Q4 Revenue Target', progress: 72, status: 'on-track' },
    { id: 2, name: 'Lead Generation', progress: 45, status: 'at-risk' },
    { id: 3, name: 'Customer Retention', progress: 89, status: 'ahead' },
  ]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Goals & KPIs</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-base sm:text-lg">
            Set and track measurable marketing objectives
          </p>
        </div>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Add New Goal
        </Button>
      </div>

      {/* KPI Metrics Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          title="Revenue Goal"
          value="$150K"
          subtitle="85% achieved"
          change={12}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Leads Target"
          value="3,500"
          subtitle="2,841 generated"
          change={-5}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Conversion Rate"
          value="4.2%"
          subtitle="+0.8% vs target"
          change={8}
          icon={TrendingUp}
          color="purple"
        />
        <MetricCard
          title="CAC"
          value="$125"
          subtitle="Target: $100"
          change={-3}
          icon={Activity}
          color="orange"
        />
      </div>

      {/* Active Goals Section */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Active Goals</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>Track your marketing objectives</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {activeGoals.length > 0 ? (
            <div className="space-y-6">
              {activeGoals.map((goal) => (
                <div key={goal.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{goal.name}</h4>
                      <Badge variant={
                        goal.status === 'ahead' ? 'success' :
                        goal.status === 'on-track' ? 'secondary' :
                        'destructive'
                      }>
                        {goal.status.replace('-', ' ')}
                      </Badge>
                    </div>
                    <span className="text-sm font-medium">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4">
                <Target className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Full Goals & KPIs tracking coming soon</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
                Set specific, measurable goals and track your progress in real-time
              </p>
              <Button className="gap-2">
                <Target className="h-4 w-4" />
                Set Your First Goal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Features Coming Soon */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <h4 className="font-medium mb-1">Goal Analytics</h4>
            <p className="text-sm text-gray-500">Coming Soon</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Activity className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <h4 className="font-medium mb-1">Automated Tracking</h4>
            <p className="text-sm text-gray-500">Coming Soon</p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-3 text-gray-400" />
            <h4 className="font-medium mb-1">Predictive Insights</h4>
            <p className="text-sm text-gray-500">Coming Soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}