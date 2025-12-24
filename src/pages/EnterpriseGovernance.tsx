import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield,
  Link2,
  Database,
  Users,
  Building2,
  Lock,
  Key,
  Settings,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  FileText,
  BarChart3,
  Zap,
  Globe,
  Cloud,
  GitBranch,
  Activity,
  Eye,
  Download,
  Upload,
  Calendar,
  DollarSign,
  MessageSquare,
  ChevronRight,
  Filter,
  Search
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  category: 'crm' | 'ads' | 'finance' | 'analytics' | 'communication';
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  logo: string;
  lastSync?: Date;
  dataPoints?: number;
  config: {
    syncFrequency: string;
    dataFlow: 'bidirectional' | 'import' | 'export';
    fields: string[];
  };
}

interface Brand {
  id: string;
  name: string;
  logo?: string;
  users: number;
  campaigns: number;
  settings: {
    timezone: string;
    currency: string;
    language: string;
  };
}

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  resource: string;
  details: string;
  ip: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface Permission {
  id: string;
  resource: string;
  actions: string[];
  description: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  users: number;
  isSystem: boolean;
}

const EnterpriseGovernance = () => {
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample Integrations
  const integrations: Integration[] = [
    {
      id: '1',
      name: 'Salesforce',
      category: 'crm',
      status: 'connected',
      logo: '/logos/salesforce.svg',
      lastSync: new Date(Date.now() - 5 * 60 * 1000),
      dataPoints: 45678,
      config: {
        syncFrequency: 'real-time',
        dataFlow: 'bidirectional',
        fields: ['contacts', 'accounts', 'opportunities', 'campaigns']
      }
    },
    {
      id: '2',
      name: 'Google Ads',
      category: 'ads',
      status: 'connected',
      logo: '/logos/google-ads.svg',
      lastSync: new Date(Date.now() - 30 * 60 * 1000),
      dataPoints: 23456,
      config: {
        syncFrequency: 'hourly',
        dataFlow: 'bidirectional',
        fields: ['campaigns', 'ad_groups', 'keywords', 'conversions']
      }
    },
    {
      id: '3',
      name: 'Stripe',
      category: 'finance',
      status: 'connected',
      logo: '/logos/stripe.svg',
      lastSync: new Date(Date.now() - 15 * 60 * 1000),
      dataPoints: 12345,
      config: {
        syncFrequency: 'real-time',
        dataFlow: 'import',
        fields: ['customers', 'subscriptions', 'invoices', 'revenue']
      }
    },
    {
      id: '4',
      name: 'HubSpot',
      category: 'crm',
      status: 'error',
      logo: '/logos/hubspot.svg',
      lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000),
      config: {
        syncFrequency: '15min',
        dataFlow: 'bidirectional',
        fields: ['contacts', 'companies', 'deals']
      }
    }
  ];

  // Sample Brands
  const brands: Brand[] = [
    {
      id: '1',
      name: 'Inclufy Marketing',
      logo: '/logos/inclufy.svg',
      users: 45,
      campaigns: 127,
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        language: 'en'
      }
    },
    {
      id: '2',
      name: 'Inclufy Academy',
      logo: '/logos/inclufy-academy.svg',
      users: 23,
      campaigns: 56,
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        language: 'en'
      }
    },
    {
      id: '3',
      name: 'Inclufy Europe',
      logo: '/logos/inclufy-eu.svg',
      users: 18,
      campaigns: 34,
      settings: {
        timezone: 'Europe/London',
        currency: 'EUR',
        language: 'en'
      }
    }
  ];

  // Sample Roles
  const roles: Role[] = [
    {
      id: '1',
      name: 'Administrator',
      description: 'Full system access',
      permissions: ['*'],
      users: 3,
      isSystem: true
    },
    {
      id: '2',
      name: 'Marketing Manager',
      description: 'Manage campaigns and content',
      permissions: ['campaigns:*', 'content:*', 'analytics:read'],
      users: 12,
      isSystem: false
    },
    {
      id: '3',
      name: 'Content Creator',
      description: 'Create and edit content',
      permissions: ['content:create', 'content:edit', 'analytics:read'],
      users: 23,
      isSystem: false
    },
    {
      id: '4',
      name: 'Analyst',
      description: 'View reports and analytics',
      permissions: ['analytics:*', 'campaigns:read'],
      users: 8,
      isSystem: false
    }
  ];

  // Sample Audit Log
  const auditLog: AuditLogEntry[] = [
    {
      id: '1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      user: 'john@inclufy.com',
      action: 'integration.connect',
      resource: 'Salesforce',
      details: 'Connected Salesforce integration with full sync',
      ip: '192.168.1.100',
      riskLevel: 'low'
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      user: 'sarah@inclufy.com',
      action: 'user.permission.modify',
      resource: 'mike@inclufy.com',
      details: 'Granted Administrator role',
      ip: '10.0.0.42',
      riskLevel: 'high'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      user: 'system',
      action: 'data.export',
      resource: 'Customer Database',
      details: 'Scheduled export completed: 45,678 records',
      ip: 'system',
      riskLevel: 'medium'
    }
  ];

  const IntegrationIcon = ({ category }: { category: string }) => {
    switch (category) {
      case 'crm': return <Users className="h-5 w-5" />;
      case 'ads': return <BarChart3 className="h-5 w-5" />;
      case 'finance': return <DollarSign className="h-5 w-5" />;
      case 'analytics': return <Activity className="h-5 w-5" />;
      case 'communication': return <MessageSquare className="h-5 w-5" />;
      default: return <Database className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Enterprise Governance
          </h2>
          <p className="text-muted-foreground mt-2">
            Integrations, compliance, and multi-brand management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map(brand => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">98%</div>
            <p className="text-xs text-muted-foreground">SOC2, GDPR, CCPA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Integrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">3 need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Data Synced</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3M</div>
            <p className="text-xs text-muted-foreground">Records/day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Brands</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
            <p className="text-xs text-muted-foreground">86 total users</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-[700px]">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="brands">Multi-Brand</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            {/* Integration Categories */}
            <div className="grid gap-4 md:grid-cols-5">
              {[
                { category: 'CRM', count: 4, icon: Users },
                { category: 'Advertising', count: 6, icon: BarChart3 },
                { category: 'Finance', count: 3, icon: DollarSign },
                { category: 'Analytics', count: 5, icon: Activity },
                { category: 'Communication', count: 6, icon: MessageSquare }
              ].map((cat) => (
                <Card key={cat.category} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{cat.category}</p>
                        <p className="text-2xl font-bold">{cat.count}</p>
                      </div>
                      <cat.icon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Connected Integrations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Connected Integrations</CardTitle>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Integration
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <IntegrationIcon category={integration.category} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{integration.name}</h4>
                            <Badge variant={
                              integration.status === 'connected' ? 'success' :
                              integration.status === 'error' ? 'destructive' :
                              integration.status === 'syncing' ? 'warning' :
                              'secondary'
                            }>
                              {integration.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>Sync: {integration.config.syncFrequency}</span>
                            {integration.lastSync && (
                              <span>Last sync: {formatRelativeTime(integration.lastSync)}</span>
                            )}
                            {integration.dataPoints && (
                              <span>{integration.dataPoints.toLocaleString()} records</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">Configure</Button>
                        <Button size="sm" variant="ghost">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Integration Health */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>HubSpot integration needs attention:</strong> Authentication expired. 
                <Button variant="link" className="px-1">Reconnect now</Button>
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>

        {/* Access Control Tab */}
        <TabsContent value="access">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Roles */}
            <Card>
              <CardHeader>
                <CardTitle>Roles & Permissions</CardTitle>
                <CardDescription>
                  Define what users can do in your workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{role.name}</h4>
                          {role.isSystem && <Badge variant="secondary">System</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {role.users} users • {role.permissions.length} permissions
                        </p>
                      </div>
                      <Button size="sm" variant="outline" disabled={role.isSystem}>
                        Edit
                      </Button>
                    </div>
                  ))}
                  <Button className="w-full" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Custom Role
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SSO & Authentication */}
            <Card>
              <CardHeader>
                <CardTitle>Authentication & SSO</CardTitle>
                <CardDescription>
                  Secure access management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* SSO Providers */}
                <div className="space-y-3">
                  {[
                    { name: 'Okta', status: 'connected', users: 45 },
                    { name: 'Google Workspace', status: 'connected', users: 23 },
                    { name: 'Microsoft Azure AD', status: 'disconnected', users: 0 }
                  ].map((provider) => (
                    <div key={provider.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{provider.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {provider.users > 0 ? `${provider.users} users` : 'Not configured'}
                          </p>
                        </div>
                      </div>
                      <Switch checked={provider.status === 'connected'} />
                    </div>
                  ))}
                </div>

                {/* Security Policies */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Security Policies</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Require 2FA for all users</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Session timeout after inactivity</Label>
                      <Select defaultValue="30">
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Password complexity requirements</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Multi-Brand Tab */}
        <TabsContent value="brands">
          <div className="space-y-6">
            {/* Brand Overview */}
            <div className="grid gap-4 md:grid-cols-3">
              {brands.map((brand) => (
                <Card key={brand.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{brand.name}</CardTitle>
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Users</span>
                        <span className="font-medium">{brand.users}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Campaigns</span>
                        <span className="font-medium">{brand.campaigns}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Region</span>
                        <span className="font-medium">{brand.settings.timezone.split('/')[0]}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline" size="sm">
                      Manage Brand
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Brand Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Global Brand Settings</CardTitle>
                <CardDescription>
                  Configure settings that apply across all brands
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Brand Isolation</Label>
                    <Select defaultValue="strict">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strict">Strict (No data sharing)</SelectItem>
                        <SelectItem value="flexible">Flexible (Share templates)</SelectItem>
                        <SelectItem value="unified">Unified (Full sharing)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>User Access Model</Label>
                    <Select defaultValue="single">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single brand per user</SelectItem>
                        <SelectItem value="multi">Multi-brand access</SelectItem>
                        <SelectItem value="admin">Admin-controlled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Cross-brand Analytics</p>
                      <p className="text-sm text-muted-foreground">
                        Allow global admins to see aggregated data
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Shared Asset Library</p>
                      <p className="text-sm text-muted-foreground">
                        Share templates and assets across brands
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance">
          <div className="space-y-6">
            {/* Compliance Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { standard: 'SOC 2 Type II', status: 'certified', expiry: '2026-03-15' },
                { standard: 'GDPR', status: 'compliant', expiry: 'Ongoing' },
                { standard: 'CCPA', status: 'compliant', expiry: 'Ongoing' },
                { standard: 'ISO 27001', status: 'in-progress', expiry: '2025-12-01' }
              ].map((cert) => (
                <Card key={cert.standard}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <Shield className={`h-8 w-8 ${
                        cert.status === 'certified' ? 'text-green-600' :
                        cert.status === 'compliant' ? 'text-blue-600' :
                        'text-yellow-600'
                      }`} />
                      <Badge variant={
                        cert.status === 'certified' ? 'success' :
                        cert.status === 'compliant' ? 'default' :
                        'warning'
                      }>
                        {cert.status}
                      </Badge>
                    </div>
                    <h4 className="font-medium">{cert.standard}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cert.expiry.includes('-') ? `Expires: ${cert.expiry}` : cert.expiry}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Data Privacy Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Data Privacy & Retention</CardTitle>
                <CardDescription>
                  Configure how customer data is handled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Default Data Retention</Label>
                    <Select defaultValue="24">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="24">24 months</SelectItem>
                        <SelectItem value="36">36 months</SelectItem>
                        <SelectItem value="custom">Custom per data type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Data Residency</Label>
                    <Select defaultValue="us">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="eu">European Union</SelectItem>
                        <SelectItem value="multi">Multi-region</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium">Privacy Features</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Right to be Forgotten</p>
                        <p className="text-sm text-muted-foreground">
                          Allow users to request data deletion
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Data Portability</p>
                        <p className="text-sm text-muted-foreground">
                          Export user data in machine-readable format
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Consent Management</p>
                        <p className="text-sm text-muted-foreground">
                          Track and manage user consent preferences
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Audit Log</CardTitle>
                  <CardDescription>
                    Track all system activities and changes
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[200px]"
                  />
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {auditLog.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${
                          entry.riskLevel === 'high' ? 'bg-red-600' :
                          entry.riskLevel === 'medium' ? 'bg-yellow-600' :
                          'bg-green-600'
                        }`} />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{entry.action}</span>
                            <span className="text-sm text-muted-foreground">on</span>
                            <span className="font-medium text-sm">{entry.resource}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{entry.user}</span>
                            <span>{formatRelativeTime(entry.timestamp)}</span>
                            <span>{entry.ip}</span>
                          </div>
                          <p className="text-sm">{entry.details}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper function
function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

// Add missing import
import { Plus } from "lucide-react";

export default EnterpriseGovernance;