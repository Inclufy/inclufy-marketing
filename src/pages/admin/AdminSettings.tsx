// src/pages/admin/AdminSettings.tsx
// Systeeminstellingen met tabs: General, Security, Email, Features, Billing, API Keys

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Shield,
  Mail,
  Sparkles,
  CreditCard,
  Key,
  Save,
  Loader2,
  RefreshCw,
  Server,
  Wrench,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface SystemSettings {
  general: {
    site_name: string;
    default_language: string;
    max_upload_size_mb: number;
    support_email: string;
    maintenance_mode: boolean;
  };
  security: {
    require_2fa: boolean;
    session_timeout_minutes: number;
    max_login_attempts: number;
    password_min_length: number;
    allowed_domains: string;
  };
  email: {
    smtp_host: string;
    smtp_port: string;
    smtp_from: string;
    email_provider: string;
  };
  features: {
    ai_copilot_enabled: boolean;
    trial_days: number;
    max_campaigns_free: number;
    max_contacts_free: number;
    allow_registrations: boolean;
    demo_mode: boolean;
  };
  billing: {
    currency: string;
    tax_rate: number;
    stripe_configured: boolean;
  };
}

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'features', label: 'Features', icon: Sparkles },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'api-keys', label: 'API Keys', icon: Key },
];

export default function AdminSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [apiConfig, setApiConfig] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local editable copies
  const [general, setGeneral] = useState({ site_name: '', default_language: 'nl', max_upload_size_mb: 10, support_email: '' });
  const [security, setSecurity] = useState({ session_timeout_minutes: 60, max_login_attempts: 5, password_min_length: 8 });
  const [email, setEmail] = useState({ smtp_host: '', smtp_port: '587', smtp_from: '', email_provider: 'resend' });
  const [features, setFeatures] = useState({ trial_days: 14, max_campaigns_free: 3, max_contacts_free: 500 });
  const [billing, setBilling] = useState({ currency: 'EUR', tax_rate: 21 });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, configRes] = await Promise.all([
        api.get('/tenant-admin/settings'),
        api.get('/admin/config'),
      ]);
      const s = settingsRes.data;
      setSettings(s);
      setApiConfig(configRes.data);

      if (s.general) setGeneral(s.general);
      if (s.security) setSecurity({ session_timeout_minutes: s.security.session_timeout_minutes, max_login_attempts: s.security.max_login_attempts, password_min_length: s.security.password_min_length });
      if (s.email) setEmail(s.email);
      if (s.features) setFeatures({ trial_days: s.features.trial_days, max_campaigns_free: s.features.max_campaigns_free, max_contacts_free: s.features.max_contacts_free });
      if (s.billing) setBilling({ currency: s.billing.currency, tax_rate: s.billing.tax_rate });
    } catch {
      toast({ title: 'Instellingen laden mislukt', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      await Promise.all([
        api.patch('/tenant-admin/settings', { category: 'general', settings: general }),
        api.patch('/tenant-admin/settings', { category: 'security', settings: security }),
        api.patch('/tenant-admin/settings', { category: 'email', settings: email }),
        api.patch('/tenant-admin/settings', { category: 'features', settings: features }),
        api.patch('/tenant-admin/settings', { category: 'billing', settings: billing }),
      ]);
      toast({ title: 'Instellingen opgeslagen!' });
    } catch {
      toast({ title: 'Opslaan mislukt', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const API_KEY_LABELS: Record<string, string> = {
    openai: 'OpenAI',
    supabase_url: 'Supabase URL',
    supabase_key: 'Supabase Sleutel',
    stripe: 'Stripe',
    email_api: 'E-mail API',
    anthropic: 'Anthropic',
    allowed_origins: 'Toegestane Origins',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-gray-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
            <p className="text-sm text-gray-500">Configure general settings for the platform</p>
          </div>
        </div>
        <Button onClick={handleSaveAll} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save All
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" /> General Settings</CardTitle>
            <CardDescription>Configure general settings for the platform</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Default Language</Label>
              <p className="text-xs text-gray-500 mb-1.5">Default platform language</p>
              <Input value={general.default_language} onChange={(e) => setGeneral({ ...general, default_language: e.target.value })} />
            </div>
            <div>
              <Label>Max Upload Size Mb</Label>
              <p className="text-xs text-gray-500 mb-1.5">Maximum file upload size in MB</p>
              <Input type="number" value={general.max_upload_size_mb} onChange={(e) => setGeneral({ ...general, max_upload_size_mb: parseInt(e.target.value) || 10 })} />
            </div>
            <div>
              <Label>Site Name</Label>
              <p className="text-xs text-gray-500 mb-1.5">Platform name</p>
              <Input value={general.site_name} onChange={(e) => setGeneral({ ...general, site_name: e.target.value })} />
            </div>
            <div>
              <Label>Support Email</Label>
              <p className="text-xs text-gray-500 mb-1.5">Support contact email</p>
              <Input type="email" value={general.support_email} onChange={(e) => setGeneral({ ...general, support_email: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security Settings</CardTitle>
            <CardDescription>Security and authentication configuration</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Session Timeout (minuten)</Label>
              <Input type="number" value={security.session_timeout_minutes} onChange={(e) => setSecurity({ ...security, session_timeout_minutes: parseInt(e.target.value) || 60 })} className="mt-1.5" />
            </div>
            <div>
              <Label>Max Login Attempts</Label>
              <Input type="number" value={security.max_login_attempts} onChange={(e) => setSecurity({ ...security, max_login_attempts: parseInt(e.target.value) || 5 })} className="mt-1.5" />
            </div>
            <div>
              <Label>Min. Wachtwoord Lengte</Label>
              <Input type="number" value={security.password_min_length} onChange={(e) => setSecurity({ ...security, password_min_length: parseInt(e.target.value) || 8 })} className="mt-1.5" />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'email' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" /> Email Configuration</CardTitle>
            <CardDescription>Email service settings</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Email Provider</Label>
              <Select value={email.email_provider} onValueChange={(v) => setEmail({ ...email, email_provider: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="resend">Resend</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                  <SelectItem value="mailgun">Mailgun</SelectItem>
                  <SelectItem value="smtp">SMTP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>SMTP From</Label>
              <Input value={email.smtp_from} onChange={(e) => setEmail({ ...email, smtp_from: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>SMTP Host</Label>
              <Input value={email.smtp_host} onChange={(e) => setEmail({ ...email, smtp_host: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>SMTP Port</Label>
              <Input value={email.smtp_port} onChange={(e) => setEmail({ ...email, smtp_port: e.target.value })} className="mt-1.5" />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'features' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Feature Flags</CardTitle>
            <CardDescription>Enable or disable platform features</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Trial Periode (dagen)</Label>
              <Input type="number" value={features.trial_days} onChange={(e) => setFeatures({ ...features, trial_days: parseInt(e.target.value) || 14 })} className="mt-1.5" />
            </div>
            <div>
              <Label>Max Campagnes (gratis)</Label>
              <Input type="number" value={features.max_campaigns_free} onChange={(e) => setFeatures({ ...features, max_campaigns_free: parseInt(e.target.value) || 3 })} className="mt-1.5" />
            </div>
            <div>
              <Label>Max Contacten (gratis)</Label>
              <Input type="number" value={features.max_contacts_free} onChange={(e) => setFeatures({ ...features, max_contacts_free: parseInt(e.target.value) || 500 })} className="mt-1.5" />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'billing' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Billing Settings</CardTitle>
            <CardDescription>Payment and billing configuration</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Valuta</Label>
              <Select value={billing.currency} onValueChange={(v) => setBilling({ ...billing, currency: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="USD">USD - Dollar</SelectItem>
                  <SelectItem value="GBP">GBP - Pond</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>BTW Tarief (%)</Label>
              <Input type="number" value={billing.tax_rate} onChange={(e) => setBilling({ ...billing, tax_rate: parseInt(e.target.value) || 21 })} className="mt-1.5" />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'maintenance' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5" /> Maintenance</CardTitle>
            <CardDescription>System maintenance and health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-sm text-gray-500">Disable access for non-admin users</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-0">Uitgeschakeld</Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <div>
                <p className="font-medium">Database Status</p>
                <p className="text-sm text-gray-500">Supabase connection</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1"><CheckCircle className="h-3 w-3" /> Connected</Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <div>
                <p className="font-medium">API Server</p>
                <p className="text-sm text-gray-500">FastAPI backend</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1"><CheckCircle className="h-3 w-3" /> Online</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'api-keys' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> API Keys</CardTitle>
            <CardDescription>Server-side API key status (keys are never sent to the browser)</CardDescription>
          </CardHeader>
          <CardContent>
            {apiConfig ? (
              <div className="space-y-3">
                {Object.entries(apiConfig).map(([key, val]) => {
                  const label = API_KEY_LABELS[key] || key.replace(/_/g, ' ');
                  if (typeof val === 'string') {
                    return (
                      <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <span className="text-sm font-medium">{label}</span>
                        <span className="text-xs text-gray-500 font-mono">{val}</span>
                      </div>
                    );
                  }
                  const v = val as { configured: boolean; masked: string };
                  return (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <span className="text-sm font-medium">{label}</span>
                      <div className="flex items-center gap-2">
                        {v.configured ? (
                          <>
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs gap-1">
                              <CheckCircle className="h-3 w-3" /> Actief
                            </Badge>
                            <span className="text-xs text-gray-400 font-mono">{v.masked}</span>
                          </>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 border-0 text-xs gap-1">
                            <XCircle className="h-3 w-3" /> Niet geconfigureerd
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">Kon API configuratie niet laden</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
