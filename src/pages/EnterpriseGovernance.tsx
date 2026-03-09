import { useState } from "react";
import { EmptyState } from '@/components/DataState';
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
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Integrations (none connected yet)
  const integrations: Integration[] = [];

  // Brands (none configured yet)
  const brands: Brand[] = [];

  // Roles (default Administrator only)
  const roles: Role[] = [
    {
      id: '1',
      name: nl ? 'Beheerder' : fr ? 'Administrateur' : 'Administrator',
      description: nl ? 'Volledige systeemtoegang' : fr ? 'Acc\u00e8s complet au syst\u00e8me' : 'Full system access',
      permissions: ['*'],
      users: 1,
      isSystem: true
    }
  ];

  // Audit Log (no entries yet)
  const auditLog: AuditLogEntry[] = [];

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
            {nl ? 'Enterprise Governance' : fr ? 'Gouvernance d\'Entreprise' : 'Enterprise Governance'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {nl ? 'Integraties, compliance en multi-merk beheer' : fr ? 'Int\u00e9grations, conformit\u00e9 et gestion multi-marques' : 'Integrations, compliance, and multi-brand management'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{nl ? 'Alle Merken' : fr ? 'Toutes les Marques' : 'All Brands'}</SelectItem>
              {brands.map(brand => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            {nl ? 'Instellingen' : fr ? 'Param\u00e8tres' : 'Settings'}
          </Button>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{nl ? 'Compliance Score' : fr ? 'Score de Conformit\u00e9' : 'Compliance Score'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">–</div>
            <p className="text-xs text-muted-foreground">{nl ? 'Niet geconfigureerd' : fr ? 'Non configuré' : 'Not configured'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{nl ? 'Actieve Integraties' : fr ? 'Int\u00e9grations Actives' : 'Active Integrations'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">{nl ? 'Geen verbonden' : fr ? 'Aucune connect\u00e9e' : 'None connected'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{nl ? 'Gesynchroniseerde Data' : fr ? 'Donn\u00e9es Synchronis\u00e9es' : 'Data Synced'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">{nl ? 'Records/dag' : fr ? 'Enregistrements/jour' : 'Records/day'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{nl ? 'Actieve Merken' : fr ? 'Marques Actives' : 'Active Brands'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brands.length}</div>
            <p className="text-xs text-muted-foreground">{nl ? '0 totaal gebruikers' : fr ? '0 utilisateurs au total' : '0 total users'}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-[700px]">
          <TabsTrigger value="integrations">{nl ? 'Integraties' : fr ? 'Int\u00e9grations' : 'Integrations'}</TabsTrigger>
          <TabsTrigger value="access">{nl ? 'Toegangsbeheer' : fr ? 'Contr\u00f4le d\'Acc\u00e8s' : 'Access Control'}</TabsTrigger>
          <TabsTrigger value="brands">{nl ? 'Multi-Merk' : fr ? 'Multi-Marques' : 'Multi-Brand'}</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="audit">{nl ? 'Auditlog' : fr ? 'Journal d\'Audit' : 'Audit Log'}</TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            {/* Integration Categories */}
            <div className="grid gap-4 md:grid-cols-5">
              {[
                { category: 'CRM', count: 0, icon: Users },
                { category: nl ? 'Advertenties' : fr ? 'Publicit\u00e9' : 'Advertising', count: 0, icon: BarChart3 },
                { category: nl ? 'Financieel' : fr ? 'Finance' : 'Finance', count: 0, icon: DollarSign },
                { category: nl ? 'Analyses' : fr ? 'Analytique' : 'Analytics', count: 0, icon: Activity },
                { category: nl ? 'Communicatie' : fr ? 'Communication' : 'Communication', count: 0, icon: MessageSquare }
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
                  <CardTitle>{nl ? 'Verbonden Integraties' : fr ? 'Int\u00e9grations Connect\u00e9es' : 'Connected Integrations'}</CardTitle>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {nl ? 'Integratie Toevoegen' : fr ? 'Ajouter une Int\u00e9gration' : 'Add Integration'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {integrations.length === 0 ? (
                  <EmptyState
                    title={nl ? 'Nog geen integraties' : fr ? 'Pas encore d\'int\u00e9grations' : 'No integrations yet'}
                    description={nl ? 'Verbind uw eerste integratie om data te synchroniseren.' : fr ? 'Connectez votre premi\u00e8re int\u00e9gration pour synchroniser les donn\u00e9es.' : 'Connect your first integration to sync data.'}
                  />
                ) : (
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
                              {integration.status === 'connected' ? (nl ? 'verbonden' : fr ? 'connect\u00e9' : 'connected') :
                               integration.status === 'error' ? (nl ? 'fout' : fr ? 'erreur' : 'error') :
                               integration.status === 'syncing' ? (nl ? 'synchroniseren' : fr ? 'synchronisation' : 'syncing') :
                               (nl ? 'niet verbonden' : fr ? 'd\u00e9connect\u00e9' : 'disconnected')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{nl ? 'Sync' : fr ? 'Sync' : 'Sync'}: {integration.config.syncFrequency}</span>
                            {integration.lastSync && (
                              <span>{nl ? 'Laatste sync' : fr ? 'Derni\u00e8re sync' : 'Last sync'}: {formatRelativeTime(integration.lastSync, lang)}</span>
                            )}
                            {integration.dataPoints && (
                              <span>{integration.dataPoints.toLocaleString()} records</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">{nl ? 'Configureren' : fr ? 'Configurer' : 'Configure'}</Button>
                        <Button size="sm" variant="ghost">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Access Control Tab */}
        <TabsContent value="access">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Roles */}
            <Card>
              <CardHeader>
                <CardTitle>{nl ? 'Rollen & Rechten' : fr ? 'R\u00f4les & Permissions' : 'Roles & Permissions'}</CardTitle>
                <CardDescription>
                  {nl ? 'Definieer wat gebruikers kunnen doen in je werkruimte' : fr ? 'D\u00e9finissez ce que les utilisateurs peuvent faire dans votre espace de travail' : 'Define what users can do in your workspace'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{role.name}</h4>
                          {role.isSystem && <Badge variant="secondary">{nl ? 'Systeem' : fr ? 'Syst\u00e8me' : 'System'}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {role.users} {nl ? 'gebruikers' : fr ? 'utilisateurs' : 'users'} • {role.permissions.length} {nl ? 'rechten' : fr ? 'permissions' : 'permissions'}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" disabled={role.isSystem}>
                        {nl ? 'Bewerken' : fr ? 'Modifier' : 'Edit'}
                      </Button>
                    </div>
                  ))}
                  <Button className="w-full" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    {nl ? 'Aangepaste Rol Aanmaken' : fr ? 'Cr\u00e9er un R\u00f4le Personnalis\u00e9' : 'Create Custom Role'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SSO & Authentication */}
            <Card>
              <CardHeader>
                <CardTitle>{nl ? 'Authenticatie & SSO' : fr ? 'Authentification & SSO' : 'Authentication & SSO'}</CardTitle>
                <CardDescription>
                  {nl ? 'Veilig toegangsbeheer' : fr ? 'Gestion s\u00e9curis\u00e9e des acc\u00e8s' : 'Secure access management'}
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
                            {provider.users > 0 ? `${provider.users} ${nl ? 'gebruikers' : fr ? 'utilisateurs' : 'users'}` : (nl ? 'Niet geconfigureerd' : fr ? 'Non configur\u00e9' : 'Not configured')}
                          </p>
                        </div>
                      </div>
                      <Switch checked={provider.status === 'connected'} />
                    </div>
                  ))}
                </div>

                {/* Security Policies */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">{nl ? 'Beveiligingsbeleid' : fr ? 'Politiques de S\u00e9curit\u00e9' : 'Security Policies'}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>{nl ? '2FA vereisen voor alle gebruikers' : fr ? 'Exiger la 2FA pour tous les utilisateurs' : 'Require 2FA for all users'}</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{nl ? 'Sessietime-out na inactiviteit' : fr ? 'Expiration de session apr\u00e8s inactivit\u00e9' : 'Session timeout after inactivity'}</Label>
                      <Select defaultValue="30">
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="60">{nl ? '1 uur' : fr ? '1 heure' : '1 hour'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>{nl ? 'Wachtwoord complexiteitsvereisten' : fr ? 'Exigences de complexit\u00e9 du mot de passe' : 'Password complexity requirements'}</Label>
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
            {brands.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <EmptyState
                    title={nl ? 'Nog geen merken' : fr ? 'Pas encore de marques' : 'No brands yet'}
                    description={nl ? 'Configureer uw eerste merk om multi-merk beheer te starten.' : fr ? 'Configurez votre premi\u00e8re marque pour d\u00e9marrer la gestion multi-marques.' : 'Configure your first brand to start multi-brand management.'}
                  />
                </CardContent>
              </Card>
            ) : (
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
                        <span className="text-muted-foreground">{nl ? 'Gebruikers' : fr ? 'Utilisateurs' : 'Users'}</span>
                        <span className="font-medium">{brand.users}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{nl ? 'Campagnes' : fr ? 'Campagnes' : 'Campaigns'}</span>
                        <span className="font-medium">{brand.campaigns}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{nl ? 'Regio' : fr ? 'R\u00e9gion' : 'Region'}</span>
                        <span className="font-medium">{brand.settings.timezone.split('/')[0]}</span>
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline" size="sm">
                      {nl ? 'Merk Beheren' : fr ? 'G\u00e9rer la Marque' : 'Manage Brand'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}

            {/* Brand Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{nl ? 'Globale Merkinstellingen' : fr ? 'Param\u00e8tres Globaux de Marque' : 'Global Brand Settings'}</CardTitle>
                <CardDescription>
                  {nl ? 'Configureer instellingen die gelden voor alle merken' : fr ? 'Configurez les param\u00e8tres qui s\'appliquent \u00e0 toutes les marques' : 'Configure settings that apply across all brands'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{nl ? 'Merkisolatie' : fr ? 'Isolation de Marque' : 'Brand Isolation'}</Label>
                    <Select defaultValue="strict">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strict">{nl ? 'Strikt (Geen datadeling)' : fr ? 'Strict (Pas de partage de donn\u00e9es)' : 'Strict (No data sharing)'}</SelectItem>
                        <SelectItem value="flexible">{nl ? 'Flexibel (Templates delen)' : fr ? 'Flexible (Partager les mod\u00e8les)' : 'Flexible (Share templates)'}</SelectItem>
                        <SelectItem value="unified">{nl ? 'Gecombineerd (Volledige deling)' : fr ? 'Unifi\u00e9 (Partage complet)' : 'Unified (Full sharing)'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{nl ? 'Gebruikerstoegangsmodel' : fr ? 'Mod\u00e8le d\'Acc\u00e8s Utilisateur' : 'User Access Model'}</Label>
                    <Select defaultValue="single">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">{nl ? 'E\u00e9n merk per gebruiker' : fr ? 'Une marque par utilisateur' : 'Single brand per user'}</SelectItem>
                        <SelectItem value="multi">{nl ? 'Multi-merk toegang' : fr ? 'Acc\u00e8s multi-marques' : 'Multi-brand access'}</SelectItem>
                        <SelectItem value="admin">{nl ? 'Admin-gestuurd' : fr ? 'Contr\u00f4l\u00e9 par l\'admin' : 'Admin-controlled'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{nl ? 'Cross-merk Analyses' : fr ? 'Analytique Inter-marques' : 'Cross-brand Analytics'}</p>
                      <p className="text-sm text-muted-foreground">
                        {nl ? 'Sta globale beheerders toe om geaggregeerde data te zien' : fr ? 'Permettre aux administrateurs globaux de voir les donn\u00e9es agr\u00e9g\u00e9es' : 'Allow global admins to see aggregated data'}
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{nl ? 'Gedeelde Mediabibliotheek' : fr ? 'Biblioth\u00e8que de Ressources Partag\u00e9e' : 'Shared Asset Library'}</p>
                      <p className="text-sm text-muted-foreground">
                        {nl ? 'Deel templates en media tussen merken' : fr ? 'Partager les mod\u00e8les et ressources entre les marques' : 'Share templates and assets across brands'}
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
                { standard: 'SOC 2 Type II', status: 'not-configured', expiry: nl ? 'Niet geconfigureerd' : fr ? 'Non configur\u00e9' : 'Not configured' },
                { standard: 'GDPR', status: 'not-configured', expiry: nl ? 'Niet geconfigureerd' : fr ? 'Non configur\u00e9' : 'Not configured' },
                { standard: 'CCPA', status: 'not-configured', expiry: nl ? 'Niet geconfigureerd' : fr ? 'Non configur\u00e9' : 'Not configured' },
                { standard: 'ISO 27001', status: 'not-configured', expiry: nl ? 'Niet geconfigureerd' : fr ? 'Non configur\u00e9' : 'Not configured' }
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
                        {cert.status === 'certified' ? (nl ? 'gecertificeerd' : fr ? 'certifi\u00e9' : 'certified') :
                         cert.status === 'compliant' ? (nl ? 'conform' : fr ? 'conforme' : 'compliant') :
                         (nl ? 'in uitvoering' : fr ? 'en cours' : 'in-progress')}
                      </Badge>
                    </div>
                    <h4 className="font-medium">{cert.standard}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cert.expiry.includes('-') ? `${nl ? 'Verloopt' : fr ? 'Expire' : 'Expires'}: ${cert.expiry}` : cert.expiry}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Data Privacy Controls */}
            <Card>
              <CardHeader>
                <CardTitle>{nl ? 'Data Privacy & Bewaring' : fr ? 'Confidentialit\u00e9 & R\u00e9tention des Donn\u00e9es' : 'Data Privacy & Retention'}</CardTitle>
                <CardDescription>
                  {nl ? 'Configureer hoe klantdata wordt behandeld' : fr ? 'Configurez la gestion des donn\u00e9es clients' : 'Configure how customer data is handled'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{nl ? 'Standaard Databewaring' : fr ? 'R\u00e9tention des Donn\u00e9es par D\u00e9faut' : 'Default Data Retention'}</Label>
                    <Select defaultValue="24">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">{nl ? '12 maanden' : fr ? '12 mois' : '12 months'}</SelectItem>
                        <SelectItem value="24">{nl ? '24 maanden' : fr ? '24 mois' : '24 months'}</SelectItem>
                        <SelectItem value="36">{nl ? '36 maanden' : fr ? '36 mois' : '36 months'}</SelectItem>
                        <SelectItem value="custom">{nl ? 'Aangepast per datatype' : fr ? 'Personnalis\u00e9 par type de donn\u00e9es' : 'Custom per data type'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{nl ? 'Data Locatie' : fr ? 'R\u00e9sidence des Donn\u00e9es' : 'Data Residency'}</Label>
                    <Select defaultValue="us">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">{nl ? 'Verenigde Staten' : fr ? '\u00c9tats-Unis' : 'United States'}</SelectItem>
                        <SelectItem value="eu">{nl ? 'Europese Unie' : fr ? 'Union Europ\u00e9enne' : 'European Union'}</SelectItem>
                        <SelectItem value="multi">{nl ? 'Multi-regio' : fr ? 'Multi-r\u00e9gion' : 'Multi-region'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-medium">{nl ? 'Privacy Functies' : fr ? 'Fonctionnalit\u00e9s de Confidentialit\u00e9' : 'Privacy Features'}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{nl ? 'Recht op Vergetelheid' : fr ? 'Droit \u00e0 l\'Oubli' : 'Right to be Forgotten'}</p>
                        <p className="text-sm text-muted-foreground">
                          {nl ? 'Sta gebruikers toe om dataverwijdering aan te vragen' : fr ? 'Permettre aux utilisateurs de demander la suppression de leurs donn\u00e9es' : 'Allow users to request data deletion'}
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{nl ? 'Dataportabiliteit' : fr ? 'Portabilit\u00e9 des Donn\u00e9es' : 'Data Portability'}</p>
                        <p className="text-sm text-muted-foreground">
                          {nl ? 'Exporteer gebruikersdata in machineleesbaar formaat' : fr ? 'Exporter les donn\u00e9es utilisateur dans un format lisible par machine' : 'Export user data in machine-readable format'}
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{nl ? 'Toestemmingsbeheer' : fr ? 'Gestion du Consentement' : 'Consent Management'}</p>
                        <p className="text-sm text-muted-foreground">
                          {nl ? 'Volg en beheer toestemmingsvoorkeuren van gebruikers' : fr ? 'Suivre et g\u00e9rer les pr\u00e9f\u00e9rences de consentement des utilisateurs' : 'Track and manage user consent preferences'}
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
                  <CardTitle>{nl ? 'Systeem Auditlog' : fr ? 'Journal d\'Audit Syst\u00e8me' : 'System Audit Log'}</CardTitle>
                  <CardDescription>
                    {nl ? 'Volg alle systeemactiviteiten en wijzigingen' : fr ? 'Suivez toutes les activit\u00e9s et modifications du syst\u00e8me' : 'Track all system activities and changes'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={nl ? 'Zoek in logs...' : fr ? 'Rechercher dans les logs...' : 'Search logs...'}
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
                    {nl ? 'Exporteren' : fr ? 'Exporter' : 'Export'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {auditLog.length === 0 ? (
                <EmptyState
                  title={nl ? 'Nog geen logboekitems' : fr ? 'Pas encore d\'entr\u00e9es de journal' : 'No audit log entries yet'}
                  description={nl ? 'Systeemactiviteiten verschijnen hier zodra er acties worden uitgevoerd.' : fr ? 'Les activit\u00e9s du syst\u00e8me apparaîtront ici d\u00e8s que des actions seront effectu\u00e9es.' : 'System activities will appear here as actions are performed.'}
                />
              ) : (
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
                            <span className="text-sm text-muted-foreground">{nl ? 'op' : fr ? 'sur' : 'on'}</span>
                            <span className="font-medium text-sm">{entry.resource}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{entry.user}</span>
                            <span>{formatRelativeTime(entry.timestamp, lang)}</span>
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper function
function formatRelativeTime(date: Date, lang: string): string {
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return nl ? 'zojuist' : fr ? '\u00e0 l\'instant' : 'just now';
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return nl ? `${mins} minuten geleden` : fr ? `il y a ${mins} minutes` : `${mins} minutes ago`;
  }
  if (seconds < 86400) {
    const hrs = Math.floor(seconds / 3600);
    return nl ? `${hrs} uur geleden` : fr ? `il y a ${hrs} heures` : `${hrs} hours ago`;
  }
  const days = Math.floor(seconds / 86400);
  return nl ? `${days} dagen geleden` : fr ? `il y a ${days} jours` : `${days} days ago`;
}

// Add missing import
import { Plus } from "lucide-react";

export default EnterpriseGovernance;
