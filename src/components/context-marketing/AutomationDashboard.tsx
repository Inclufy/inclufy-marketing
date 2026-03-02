// src/components/context-marketing/AutomationDashboard.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Plus,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Users,
  Mail,
  MessageSquare,
  Calendar,
  TrendingUp,
  Settings,
  AlertCircle,
  Activity,
  Target,
  Filter,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface AutomationDashboardProps {
  onUpdate?: () => void;
}

// Mock data for demonstration
const mockAutomations = [
  {
    id: '1',
    name: 'Welcome Email Series',
    type: 'email_sequence',
    status: 'active',
    trigger: 'New subscriber',
    actions: 5,
    completions: 234,
    activeContacts: 45,
    lastRun: '2 hours ago',
    successRate: 89
  },
  {
    id: '2',
    name: 'Cart Abandonment Recovery',
    type: 'workflow',
    status: 'active',
    trigger: 'Cart abandoned',
    actions: 3,
    completions: 89,
    activeContacts: 12,
    lastRun: '30 minutes ago',
    successRate: 34
  },
  {
    id: '3',
    name: 'Lead Scoring Automation',
    type: 'scoring',
    status: 'paused',
    trigger: 'Multiple conditions',
    actions: 8,
    completions: 567,
    activeContacts: 0,
    lastRun: '2 days ago',
    successRate: 76
  },
  {
    id: '4',
    name: 'Customer Re-engagement',
    type: 'campaign',
    status: 'active',
    trigger: 'Inactive 30 days',
    actions: 4,
    completions: 145,
    activeContacts: 23,
    lastRun: '1 hour ago',
    successRate: 45
  }
];

const mockStats = {
  totalAutomations: 12,
  activeAutomations: 8,
  totalContacts: 1234,
  completionsToday: 89,
  averageSuccessRate: 72,
  timesSaved: '156 hours'
};

export default function AutomationDashboard({ onUpdate }: AutomationDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [automations, setAutomations] = useState(mockAutomations);
  const [activeTab, setActiveTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const handleToggleAutomation = (id: string) => {
    setAutomations(prev =>
      prev.map(auto =>
        auto.id === id
          ? { ...auto, status: auto.status === 'active' ? 'paused' : 'active' }
          : auto
      )
    );
    toast.success('Automation status updated');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email_sequence': return <Mail className="w-4 h-4" />;
      case 'workflow': return <Activity className="w-4 h-4" />;
      case 'scoring': return <Target className="w-4 h-4" />;
      case 'campaign': return <MessageSquare className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'paused': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredAutomations = automations.filter(auto => {
    if (typeFilter !== 'all' && auto.type !== typeFilter) return false;
    if (statusFilter !== 'all' && auto.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Automation Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Automate your marketing workflows and campaigns
            </p>
          </div>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Automations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalAutomations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {mockStats.activeAutomations} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mockStats.totalContacts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In automations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completions Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockStats.completionsToday}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline" /> +23%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockStats.averageSuccessRate}%
            </div>
            <Progress value={mockStats.averageSuccessRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Time Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {mockStats.timesSaved}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automations.filter(a => a.status === 'active').length}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
              <span className="text-xs text-green-600">Running</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Automations</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="email_sequence">Email Sequence</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                  <SelectItem value="scoring">Lead Scoring</SelectItem>
                  <SelectItem value="campaign">Campaign</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading automations...</p>
            </div>
          ) : filteredAutomations.length > 0 ? (
            <div className="space-y-4">
              {filteredAutomations.map((automation, index) => (
                <motion.div
                  key={automation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${getStatusColor(automation.status)}`}>
                        {getTypeIcon(automation.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{automation.name}</h4>
                          <Badge variant={automation.status === 'active' ? 'default' : 'secondary'}>
                            {automation.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Trigger: {automation.trigger}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {automation.actions} actions
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {automation.activeContacts} active
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {automation.completions} completed
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {automation.lastRun}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <div className="text-2xl font-bold">
                          {automation.successRate}%
                        </div>
                        <p className="text-xs text-gray-500">Success rate</p>
                      </div>
                      <Switch
                        checked={automation.status === 'active'}
                        onCheckedChange={() => handleToggleAutomation(automation.id)}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Activity className="w-4 h-4 mr-2" />
                            View Activity
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="w-4 h-4 mr-2" />
                            View Contacts
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <Progress 
                    value={automation.successRate} 
                    className="mt-4"
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No automations found</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create your first automation to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Pro tip:</strong> Automations save an average of 20 hours per week. 
          Start with email sequences for quick wins, then expand to complex workflows.
        </AlertDescription>
      </Alert>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Templates</CardTitle>
          <CardDescription>Pre-built automation templates to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-1">
              <Mail className="w-5 h-5" />
              <span className="text-xs">Welcome Series</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-1">
              <Target className="w-5 h-5" />
              <span className="text-xs">Lead Nurturing</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-1">
              <Calendar className="w-5 h-5" />
              <span className="text-xs">Event Follow-up</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-1">
              <Users className="w-5 h-5" />
              <span className="text-xs">Re-engagement</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}