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
import { useLanguage } from '@/contexts/LanguageContext';
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

const TAB_DEFS = [
  { id: 'general', icon: Settings },
  { id: 'security', icon: Shield },
  { id: 'email', icon: Mail },
  { id: 'features', icon: Sparkles },
  { id: 'billing', icon: CreditCard },
  { id: 'maintenance', icon: Wrench },
  { id: 'api-keys', icon: Key },
] as const;

export default function AdminSettings() {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

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

  // ─── Translated tab labels ─────────────────────────────────────────
  const TAB_LABELS: Record<string, string> = {
    general: nl ? 'Algemeen' : fr ? 'Général' : 'General',
    security: nl ? 'Beveiliging' : fr ? 'Sécurité' : 'Security',
    email: nl ? 'E-mail' : fr ? 'E-mail' : 'Email',
    features: nl ? 'Functies' : fr ? 'Fonctionnalités' : 'Features',
    billing: nl ? 'Facturering' : fr ? 'Facturation' : 'Billing',
    maintenance: nl ? 'Onderhoud' : fr ? 'Maintenance' : 'Maintenance',
    'api-keys': nl ? 'API Sleutels' : fr ? 'Clés API' : 'API Keys',
  };

  const TABS = TAB_DEFS.map((t) => ({ ...t, label: TAB_LABELS[t.id] }));

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
      toast({
        title: nl ? 'Instellingen laden mislukt' : fr ? 'Échec du chargement des paramètres' : 'Failed to load settings',
        variant: 'destructive',
      });
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
      toast({ title: nl ? 'Instellingen opgeslagen!' : fr ? 'Paramètres enregistrés !' : 'Settings saved!' });
    } catch {
      toast({
        title: nl ? 'Opslaan mislukt' : fr ? "Échec de l'enregistrement" : 'Save failed',
        variant: 'destructive',
      });
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
    supabase_key: nl ? 'Supabase Sleutel' : fr ? 'Clé Supabase' : 'Supabase Key',
    stripe: 'Stripe',
    email_api: 'E-mail API',
    anthropic: 'Anthropic',
    allowed_origins: nl ? 'Toegestane Origins' : fr ? 'Origines Autorisées' : 'Allowed Origins',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-gray-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {nl ? 'Systeeminstellingen' : fr ? 'Paramètres Système' : 'System Settings'}
            </h1>
            <p className="text-sm text-gray-500">
              {nl
                ? 'Configureer algemene instellingen voor het platform'
                : fr
                  ? 'Configurer les paramètres généraux de la plateforme'
                  : 'Configure general settings for the platform'}
            </p>
          </div>
        </div>
        <Button onClick={handleSaveAll} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {nl ? 'Alles Opslaan' : fr ? 'Tout Enregistrer' : 'Save All'}
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
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {nl ? 'Algemene Instellingen' : fr ? 'Paramètres Généraux' : 'General Settings'}
            </CardTitle>
            <CardDescription>
              {nl
                ? 'Configureer algemene instellingen voor het platform'
                : fr
                  ? 'Configurer les paramètres généraux de la plateforme'
                  : 'Configure general settings for the platform'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>{nl ? 'Standaardtaal' : fr ? 'Langue par Défaut' : 'Default Language'}</Label>
              <p className="text-xs text-gray-500 mb-1.5">
                {nl ? 'Standaard platformtaal' : fr ? 'Langue par défaut de la plateforme' : 'Default platform language'}
              </p>
              <Input value={general.default_language} onChange={(e) => setGeneral({ ...general, default_language: e.target.value })} />
            </div>
            <div>
              <Label>{nl ? 'Max Upload (MB)' : fr ? 'Taille Max Upload (Mo)' : 'Max Upload Size (MB)'}</Label>
              <p className="text-xs text-gray-500 mb-1.5">
                {nl ? 'Maximale bestandsgrootte in MB' : fr ? 'Taille maximale de téléchargement en Mo' : 'Maximum file upload size in MB'}
              </p>
              <Input type="number" value={general.max_upload_size_mb} onChange={(e) => setGeneral({ ...general, max_upload_size_mb: parseInt(e.target.value) || 10 })} />
            </div>
            <div>
              <Label>{nl ? 'Sitenaam' : fr ? 'Nom du Site' : 'Site Name'}</Label>
              <p className="text-xs text-gray-500 mb-1.5">
                {nl ? 'Naam van het platform' : fr ? 'Nom de la plateforme' : 'Platform name'}
              </p>
              <Input value={general.site_name} onChange={(e) => setGeneral({ ...general, site_name: e.target.value })} />
            </div>
            <div>
              <Label>{nl ? 'Support E-mail' : fr ? 'E-mail Support' : 'Support Email'}</Label>
              <p className="text-xs text-gray-500 mb-1.5">
                {nl ? 'E-mailadres voor ondersteuning' : fr ? 'Adresse e-mail de support' : 'Support contact email'}
              </p>
              <Input type="email" value={general.support_email} onChange={(e) => setGeneral({ ...general, support_email: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {nl ? 'Beveiligingsinstellingen' : fr ? 'Paramètres de Sécurité' : 'Security Settings'}
            </CardTitle>
            <CardDescription>
              {nl
                ? 'Beveiliging en authenticatie configuratie'
                : fr
                  ? "Configuration de sécurité et d'authentification"
                  : 'Security and authentication configuration'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>{nl ? 'Sessie Timeout (minuten)' : fr ? 'Délai de Session (minutes)' : 'Session Timeout (minutes)'}</Label>
              <Input type="number" value={security.session_timeout_minutes} onChange={(e) => setSecurity({ ...security, session_timeout_minutes: parseInt(e.target.value) || 60 })} className="mt-1.5" />
            </div>
            <div>
              <Label>{nl ? 'Max Inlogpogingen' : fr ? 'Tentatives Max de Connexion' : 'Max Login Attempts'}</Label>
              <Input type="number" value={security.max_login_attempts} onChange={(e) => setSecurity({ ...security, max_login_attempts: parseInt(e.target.value) || 5 })} className="mt-1.5" />
            </div>
            <div>
              <Label>{nl ? 'Min. Wachtwoordlengte' : fr ? 'Longueur Min. Mot de Passe' : 'Min. Password Length'}</Label>
              <Input type="number" value={security.password_min_length} onChange={(e) => setSecurity({ ...security, password_min_length: parseInt(e.target.value) || 8 })} className="mt-1.5" />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'email' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {nl ? 'E-mailconfiguratie' : fr ? 'Configuration E-mail' : 'Email Configuration'}
            </CardTitle>
            <CardDescription>
              {nl ? 'Instellingen voor de e-mailservice' : fr ? "Paramètres du service d'e-mail" : 'Email service settings'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>{nl ? 'E-mailprovider' : fr ? 'Fournisseur E-mail' : 'Email Provider'}</Label>
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
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {nl ? 'Functie Instellingen' : fr ? 'Options de Fonctionnalités' : 'Feature Flags'}
            </CardTitle>
            <CardDescription>
              {nl
                ? 'Platformfuncties in- of uitschakelen'
                : fr
                  ? 'Activer ou désactiver les fonctionnalités de la plateforme'
                  : 'Enable or disable platform features'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>{nl ? 'Proefperiode (dagen)' : fr ? "Période d'Essai (jours)" : 'Trial Period (days)'}</Label>
              <Input type="number" value={features.trial_days} onChange={(e) => setFeatures({ ...features, trial_days: parseInt(e.target.value) || 14 })} className="mt-1.5" />
            </div>
            <div>
              <Label>{nl ? 'Max Campagnes (gratis)' : fr ? 'Max Campagnes (gratuit)' : 'Max Campaigns (free)'}</Label>
              <Input type="number" value={features.max_campaigns_free} onChange={(e) => setFeatures({ ...features, max_campaigns_free: parseInt(e.target.value) || 3 })} className="mt-1.5" />
            </div>
            <div>
              <Label>{nl ? 'Max Contacten (gratis)' : fr ? 'Max Contacts (gratuit)' : 'Max Contacts (free)'}</Label>
              <Input type="number" value={features.max_contacts_free} onChange={(e) => setFeatures({ ...features, max_contacts_free: parseInt(e.target.value) || 500 })} className="mt-1.5" />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'billing' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {nl ? 'Facturatie-instellingen' : fr ? 'Paramètres de Facturation' : 'Billing Settings'}
            </CardTitle>
            <CardDescription>
              {nl
                ? 'Betalings- en factureringsconfiguratie'
                : fr
                  ? 'Configuration des paiements et de la facturation'
                  : 'Payment and billing configuration'}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>{nl ? 'Valuta' : fr ? 'Devise' : 'Currency'}</Label>
              <Select value={billing.currency} onValueChange={(v) => setBilling({ ...billing, currency: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="USD">USD - Dollar</SelectItem>
                  <SelectItem value="GBP">{nl ? 'GBP - Pond' : fr ? 'GBP - Livre' : 'GBP - Pound'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{nl ? 'BTW Tarief (%)' : fr ? 'Taux TVA (%)' : 'Tax Rate (%)'}</Label>
              <Input type="number" value={billing.tax_rate} onChange={(e) => setBilling({ ...billing, tax_rate: parseInt(e.target.value) || 21 })} className="mt-1.5" />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'maintenance' && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {nl ? 'Onderhoud' : fr ? 'Maintenance' : 'Maintenance'}
            </CardTitle>
            <CardDescription>
              {nl
                ? 'Systeemonderhoud en status'
                : fr
                  ? 'Maintenance système et état de santé'
                  : 'System maintenance and health'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <div>
                <p className="font-medium">
                  {nl ? 'Onderhoudsmodus' : fr ? 'Mode Maintenance' : 'Maintenance Mode'}
                </p>
                <p className="text-sm text-gray-500">
                  {nl
                    ? 'Toegang uitschakelen voor niet-admin gebruikers'
                    : fr
                      ? "Désactiver l'accès pour les utilisateurs non-admin"
                      : 'Disable access for non-admin users'}
                </p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-0">
                {nl ? 'Uitgeschakeld' : fr ? 'Désactivé' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800">
              <div>
                <p className="font-medium">Database Status</p>
                <p className="text-sm text-gray-500">Supabase connection</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-0 gap-1">
                <CheckCircle className="h-3 w-3" /> {nl ? 'Verbonden' : fr ? 'Connecté' : 'Connected'}
              </Badge>
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
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {nl ? 'API Sleutels' : fr ? 'Clés API' : 'API Keys'}
            </CardTitle>
            <CardDescription>
              {nl
                ? 'Server-side API sleutelstatus (sleutels worden nooit naar de browser gestuurd)'
                : fr
                  ? "État des clés API côté serveur (les clés ne sont jamais envoyées au navigateur)"
                  : 'Server-side API key status (keys are never sent to the browser)'}
            </CardDescription>
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
                              <CheckCircle className="h-3 w-3" /> {nl ? 'Actief' : fr ? 'Actif' : 'Active'}
                            </Badge>
                            <span className="text-xs text-gray-400 font-mono">{v.masked}</span>
                          </>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 border-0 text-xs gap-1">
                            <XCircle className="h-3 w-3" /> {nl ? 'Niet geconfigureerd' : fr ? 'Non configuré' : 'Not configured'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">
                {nl
                  ? 'Kon API configuratie niet laden'
                  : fr
                    ? "Impossible de charger la configuration de l'API"
                    : 'Could not load API configuration'}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
