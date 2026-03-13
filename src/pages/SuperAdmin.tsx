// src/pages/SuperAdmin.tsx
// Organisatie admin paneel — leden, API configuratie, statistieken

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Shield,
  Key,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Building,
  Check,
  X,
  Settings,
  User,
  Crown,
  UserPlus,
  Copy,
  Mail,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface Member {
  id: string;
  user_id: string;
  role: string;
  email: string;
  full_name: string;
  joined_at: string;
}

interface WhoAmI {
  email: string;
  role: string;
  organization_id: string | null;
  is_superadmin: boolean;
  user_id: string;
}

interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

interface ApiConfig {
  [key: string]: { configured: boolean; masked: string } | string;
}

interface PlatformStats {
  campaigns: number;
  contacts: number;
  members: number;
  content: number;
}

const ROLE_LABELS: Record<string, Record<string, string>> = {
  superadmin: { nl: 'Superadmin', fr: 'Superadmin', en: 'Superadmin' },
  owner: { nl: 'Eigenaar', fr: 'Propri\u00e9taire', en: 'Owner' },
  admin: { nl: 'Beheerder', fr: 'Administrateur', en: 'Admin' },
  member: { nl: 'Lid', fr: 'Membre', en: 'Member' },
  viewer: { nl: 'Kijker', fr: 'Observateur', en: 'Viewer' },
};

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0',
  owner: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  member: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  viewer: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const API_KEY_LABELS: Record<string, Record<string, string>> = {
  openai: { nl: 'OpenAI', fr: 'OpenAI', en: 'OpenAI' },
  supabase_url: { nl: 'Supabase URL', fr: 'Supabase URL', en: 'Supabase URL' },
  supabase_key: { nl: 'Supabase Sleutel', fr: 'Cl\u00e9 Supabase', en: 'Supabase Key' },
  stripe: { nl: 'Stripe', fr: 'Stripe', en: 'Stripe' },
  email_api: { nl: 'E-mail API', fr: 'API E-mail', en: 'Email API' },
  anthropic: { nl: 'Anthropic', fr: 'Anthropic', en: 'Anthropic' },
  allowed_origins: { nl: 'Toegestane Origins', fr: 'Origines autoris\u00e9es', en: 'Allowed Origins' },
};

export default function SuperAdmin() {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [whoami, setWhoami] = useState<WhoAmI | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [org, setOrg] = useState<OrgInfo | null>(null);
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [orgName, setOrgName] = useState('');

  // Invite user state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteResult, setInviteResult] = useState<{ email: string; password: string; role: string } | null>(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user via supabase auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError(nl ? 'Authenticatie verlopen. Log uit en log opnieuw in.' : fr ? 'Authentification expir\u00e9e. D\u00e9connectez-vous et reconnectez-vous.' : 'Authentication expired. Log out and log in again.');
        return;
      }

      // Get user profile for role info
      const { data: profile } = await supabase.from('profiles').select('role, organization_id').eq('id', user.id).maybeSingle();
      const whoamiData: WhoAmI = {
        email: user.email || '',
        role: profile?.role || 'member',
        organization_id: profile?.organization_id || null,
        is_superadmin: profile?.role === 'superadmin',
        user_id: user.id,
      };
      console.log('[SuperAdmin] whoami:', whoamiData);
      setWhoami(whoamiData);

      // Fetch members, org, config, stats in parallel
      const [membersResult, orgResult, configResult, campaignsCount, contactsCount, contentCount] = await Promise.all([
        supabase.from('organization_members').select('*, profiles(email, full_name)').order('created_at'),
        supabase.from('organizations').select('*').limit(1).maybeSingle(),
        supabase.from('admin_settings').select('*').maybeSingle(),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }),
        supabase.from('contacts').select('id', { count: 'exact', head: true }),
        supabase.from('content_items').select('id', { count: 'exact', head: true }),
      ]);

      // Map members
      const membersData: Member[] = (membersResult.data || []).map((m: any) => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        email: m.profiles?.email || '',
        full_name: m.profiles?.full_name || '',
        joined_at: m.created_at,
      }));
      setMembers(membersData);

      // Organization
      const orgData = orgResult.data;
      setOrg(orgData as any);
      setOrgName(orgData?.name || '');

      // Config
      setConfig(configResult.data as any);

      // Stats
      setStats({
        campaigns: campaignsCount.count || 0,
        contacts: contactsCount.count || 0,
        members: membersData.length,
        content: contentCount.count || 0,
      });
    } catch (err: any) {
      console.error('[SuperAdmin] Error:', err);
      const msg = err.message || (nl ? 'Kon admin data niet laden' : fr ? 'Impossible de charger les donn\u00e9es admin' : 'Could not load admin data');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const { error: updateError } = await supabase.from('organization_members').update({ role: newRole }).eq('id', memberId);
      if (updateError) throw updateError;
      toast({ title: nl ? 'Rol bijgewerkt' : fr ? 'R\u00f4le mis \u00e0 jour' : 'Role updated' });
      fetchAll();
    } catch (err: any) {
      toast({ title: nl ? 'Rol bijwerken mislukt' : fr ? 'Mise \u00e0 jour du r\u00f4le \u00e9chou\u00e9e' : 'Failed to update role', description: err.message, variant: 'destructive' });
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!confirm(nl ? `${email} verwijderen uit de organisatie?` : fr ? `Supprimer ${email} de l'organisation ?` : `Remove ${email} from the organization?`)) return;
    try {
      const { error: deleteError } = await supabase.from('organization_members').delete().eq('id', memberId);
      if (deleteError) throw deleteError;
      toast({ title: nl ? 'Lid verwijderd' : fr ? 'Membre supprim\u00e9' : 'Member removed' });
      fetchAll();
    } catch (err: any) {
      toast({ title: nl ? 'Lid verwijderen mislukt' : fr ? 'Suppression du membre \u00e9chou\u00e9e' : 'Failed to remove member', description: err.message, variant: 'destructive' });
    }
  };

  const handleSaveOrgName = async () => {
    try {
      if (!org?.id) throw new Error('No organization found');
      const { error: updateError } = await supabase.from('organizations').update({ name: orgName }).eq('id', org.id);
      if (updateError) throw updateError;
      toast({ title: nl ? 'Organisatienaam bijgewerkt' : fr ? 'Nom de l\'organisation mis \u00e0 jour' : 'Organization name updated' });
      setEditingName(false);
      fetchAll();
    } catch (err: any) {
      toast({ title: nl ? 'Bijwerken mislukt' : fr ? 'Mise \u00e0 jour \u00e9chou\u00e9e' : 'Update failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: nl ? 'Vul een e-mailadres in' : fr ? 'Entrez une adresse e-mail' : 'Enter an email address', variant: 'destructive' });
      return;
    }
    try {
      setInviteLoading(true);
      const { data: invokeData, error: invokeError } = await supabase.functions.invoke('admin-invite', {
        body: {
          email: inviteEmail.trim(),
          full_name: inviteName.trim() || undefined,
          role: inviteRole,
          password: invitePassword.trim() || undefined,
        },
      });
      if (invokeError) throw invokeError;
      const res = invokeData;
      setInviteResult({
        email: res.email,
        password: res.temporary_password || invitePassword,
        role: res.role,
      });
      toast({ title: nl ? `Gebruiker ${res.email} aangemaakt!` : fr ? `Utilisateur ${res.email} cr\u00e9\u00e9 !` : `User ${res.email} created!` });
      // Reset form but keep dialog open to show credentials
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
      fetchAll();
    } catch (err: any) {
      toast({
        title: nl ? 'Gebruiker aanmaken mislukt' : fr ? 'Cr\u00e9ation de l\'utilisateur \u00e9chou\u00e9e' : 'Failed to create user',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: nl ? 'Gekopieerd naar klembord' : fr ? 'Copi\u00e9 dans le presse-papiers' : 'Copied to clipboard' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-6">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
            <Button variant="outline" onClick={fetchAll}>{nl ? 'Opnieuw' : fr ? 'R\u00e9essayer' : 'Retry'}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
            {nl ? 'Admin Paneel' : fr ? 'Panneau d\'Administration' : 'Admin Panel'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {nl ? 'Beheer je organisatie, teamleden en platformconfiguratie' : fr ? 'G\u00e9rez votre organisation, les membres de l\'\u00e9quipe et la configuration de la plateforme' : 'Manage your organization, team members and platform configuration'}
          </p>
        </div>
        <Button variant="outline" onClick={fetchAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
        </Button>
      </div>

      {/* Current User Info */}
      {whoami && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-lg font-bold">
                {whoami.email.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="text-lg font-semibold">{whoami.email}</p>
                  {whoami.is_superadmin && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1">
                      <Crown className="h-3 w-3" />
                      Superadmin
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {nl ? 'Rol' : fr ? 'R\u00f4le' : 'Role'}: {ROLE_LABELS[whoami.role]?.[lang] || whoami.role} |
                  {nl ? ' Gebruikers-ID' : fr ? ' ID utilisateur' : ' User ID'}: {whoami.user_id?.slice(0, 8)}...
                  {whoami.organization_id ? ` | ${nl ? 'Organisatie' : fr ? 'Organisation' : 'Organization'}: ${whoami.organization_id.slice(0, 8)}...` : ` | ${nl ? 'Geen organisatie' : fr ? 'Aucune organisation' : 'No organization'}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Statistieken */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: nl ? 'Teamleden' : fr ? 'Membres' : 'Team Members', value: stats.members, icon: Users, color: 'text-purple-500' },
            { label: nl ? 'Campagnes' : fr ? 'Campagnes' : 'Campaigns', value: stats.campaigns, icon: BarChart3, color: 'text-blue-500' },
            { label: nl ? 'Contacten' : fr ? 'Contacts' : 'Contacts', value: stats.contacts, icon: Users, color: 'text-emerald-500' },
            { label: nl ? 'Content Items' : fr ? '\u00c9l\u00e9ments de contenu' : 'Content Items', value: stats.content, icon: Settings, color: 'text-amber-500' },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                  <span className="text-sm text-gray-500">{s.label}</span>
                </div>
                <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organisatie Instellingen */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-600" />
              {nl ? 'Organisatie' : fr ? 'Organisation' : 'Organization'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {org && (
              <>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">{nl ? 'Naam' : fr ? 'Nom' : 'Name'}</label>
                  {editingName ? (
                    <div className="flex gap-2">
                      <Input
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        className="h-9"
                      />
                      <Button size="sm" onClick={handleSaveOrgName}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingName(false); setOrgName(org.name); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{org.name}</span>
                      <Button size="sm" variant="ghost" onClick={() => setEditingName(true)}>{nl ? 'Bewerken' : fr ? 'Modifier' : 'Edit'}</Button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">{nl ? 'Slug' : fr ? 'Slug' : 'Slug'}</label>
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{org.slug}</span>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">{nl ? 'Aangemaakt' : fr ? 'Cr\u00e9\u00e9 le' : 'Created'}</label>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {org.created_at ? new Date(org.created_at).toLocaleDateString(nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-US') : '-'}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* API Configuratie */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-600" />
              {nl ? 'API Configuratie' : fr ? 'Configuration API' : 'API Configuration'}
            </CardTitle>
            <CardDescription>{nl ? 'Server-side API-sleutels status (sleutels worden nooit naar de browser gestuurd)' : fr ? 'Statut des cl\u00e9s API c\u00f4t\u00e9 serveur (les cl\u00e9s ne sont jamais envoy\u00e9es au navigateur)' : 'Server-side API keys status (keys are never sent to the browser)'}</CardDescription>
          </CardHeader>
          <CardContent>
            {config && (
              <div className="space-y-3">
                {Object.entries(config).map(([key, val]) => {
                  const label = API_KEY_LABELS[key]?.[lang] || key.replace(/_/g, ' ');
                  if (typeof val === 'string') {
                    return (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <span className="text-sm font-medium">{label}</span>
                        <span className="text-xs text-gray-500 font-mono">{val}</span>
                      </div>
                    );
                  }
                  const v = val as { configured: boolean; masked: string };
                  return (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <span className="text-sm font-medium">{label}</span>
                      <div className="flex items-center gap-2">
                        {v.configured ? (
                          <>
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 text-xs">
                              {nl ? 'Actief' : fr ? 'Actif' : 'Active'}
                            </Badge>
                            <span className="text-xs text-gray-400 font-mono">{v.masked}</span>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 border-gray-200 dark:border-gray-700 text-xs">
                            {nl ? 'Niet geconfigureerd' : fr ? 'Non configur\u00e9' : 'Not configured'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Teamleden */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                {nl ? 'Teamleden' : fr ? 'Membres de l\'\u00e9quipe' : 'Team Members'}
              </CardTitle>
              <CardDescription>{members.length} {members.length === 1 ? (nl ? 'lid' : fr ? 'membre' : 'member') : (nl ? 'leden' : fr ? 'membres' : 'members')}</CardDescription>
            </div>
            <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) setInviteResult(null); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {nl ? 'Gebruiker Toevoegen' : fr ? 'Ajouter un utilisateur' : 'Add User'}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                {inviteResult ? (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-emerald-600">
                        <Check className="h-5 w-5" />
                        {nl ? 'Gebruiker Aangemaakt!' : fr ? 'Utilisateur Cr\u00e9\u00e9 !' : 'User Created!'}
                      </DialogTitle>
                      <DialogDescription>
                        {nl ? 'Deel de inloggegevens met de nieuwe gebruiker' : fr ? 'Partagez les identifiants avec le nouvel utilisateur' : 'Share the login credentials with the new user'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">{nl ? 'E-mail' : fr ? 'E-mail' : 'Email'}</p>
                            <p className="font-medium">{inviteResult.email}</p>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(inviteResult.email)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">{nl ? 'Wachtwoord' : fr ? 'Mot de passe' : 'Password'}</p>
                            <p className="font-mono text-sm">{inviteResult.password}</p>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(inviteResult.password)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">{nl ? 'Rol' : fr ? 'R\u00f4le' : 'Role'}</p>
                          <p className="font-medium">{ROLE_LABELS[inviteResult.role]?.[lang] || inviteResult.role}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          copyToClipboard(`${nl ? 'E-mail' : fr ? 'E-mail' : 'Email'}: ${inviteResult.email}\n${nl ? 'Wachtwoord' : fr ? 'Mot de passe' : 'Password'}: ${inviteResult.password}\nLogin: ${window.location.origin}/login`);
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        {nl ? 'Kopieer Alle Inloggegevens' : fr ? 'Copier tous les identifiants' : 'Copy All Credentials'}
                      </Button>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => { setInviteOpen(false); setInviteResult(null); }}>{nl ? 'Sluiten' : fr ? 'Fermer' : 'Close'}</Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle>{nl ? 'Nieuwe Gebruiker Toevoegen' : fr ? 'Ajouter un Nouvel Utilisateur' : 'Add New User'}</DialogTitle>
                      <DialogDescription>
                        {nl ? 'Maak een nieuw account aan en voeg toe aan je organisatie' : fr ? 'Cr\u00e9ez un nouveau compte et ajoutez-le \u00e0 votre organisation' : 'Create a new account and add to your organization'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="invite-email">{nl ? 'E-mailadres' : fr ? 'Adresse e-mail' : 'Email address'} *</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder={nl ? 'gebruiker@bedrijf.com' : fr ? 'utilisateur@entreprise.com' : 'user@company.com'}
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="invite-name">{nl ? 'Volledige Naam' : fr ? 'Nom complet' : 'Full Name'}</Label>
                        <Input
                          id="invite-name"
                          type="text"
                          placeholder={nl ? 'Naam van de gebruiker' : fr ? 'Nom de l\'utilisateur' : 'User\'s name'}
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="invite-role">{nl ? 'Rol' : fr ? 'R\u00f4le' : 'Role'}</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">{nl ? 'Beheerder' : fr ? 'Administrateur' : 'Admin'}</SelectItem>
                            <SelectItem value="member">{nl ? 'Lid' : fr ? 'Membre' : 'Member'}</SelectItem>
                            <SelectItem value="viewer">{nl ? 'Kijker' : fr ? 'Observateur' : 'Viewer'}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="invite-password">{nl ? 'Wachtwoord (optioneel)' : fr ? 'Mot de passe (optionnel)' : 'Password (optional)'}</Label>
                        <Input
                          id="invite-password"
                          type="text"
                          placeholder={nl ? 'Laat leeg voor automatisch wachtwoord' : fr ? 'Laissez vide pour un mot de passe automatique' : 'Leave empty for auto-generated password'}
                          value={invitePassword}
                          onChange={(e) => setInvitePassword(e.target.value)}
                          className="mt-1.5"
                        />
                        <p className="text-xs text-gray-500 mt-1">{nl ? 'Als je dit leeg laat wordt er een veilig wachtwoord gegenereerd' : fr ? 'Si vous laissez ce champ vide, un mot de passe s\u00e9curis\u00e9 sera g\u00e9n\u00e9r\u00e9' : 'If left empty, a secure password will be generated'}</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteOpen(false)}>{nl ? 'Annuleren' : fr ? 'Annuler' : 'Cancel'}</Button>
                      <Button
                        onClick={handleInviteUser}
                        disabled={inviteLoading || !inviteEmail.trim()}
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        {inviteLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                        {nl ? 'Gebruiker Aanmaken' : fr ? 'Cr\u00e9er l\'utilisateur' : 'Create User'}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{nl ? 'Geen leden gevonden.' : fr ? 'Aucun membre trouv\u00e9.' : 'No members found.'}</p>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-sm font-semibold">
                      {(member.full_name || member.email || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{member.full_name || member.email?.split('@')[0] || (nl ? 'Onbekend' : fr ? 'Inconnu' : 'Unknown')}</p>
                        <Badge variant="outline" className={ROLE_COLORS[member.role] || ROLE_COLORS.member}>
                          {ROLE_LABELS[member.role]?.[lang] || member.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {member.joined_at && (
                      <span className="text-xs text-gray-400">
                        {nl ? 'Lid sinds' : fr ? 'Membre depuis' : 'Member since'} {new Date(member.joined_at).toLocaleDateString(nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-US')}
                      </span>
                    )}

                    {member.role !== 'superadmin' && (
                      <>
                        <Select
                          value={member.role}
                          onValueChange={(val) => handleRoleChange(member.id, val)}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">{nl ? 'Eigenaar' : fr ? 'Propri\u00e9taire' : 'Owner'}</SelectItem>
                            <SelectItem value="admin">{nl ? 'Beheerder' : fr ? 'Administrateur' : 'Admin'}</SelectItem>
                            <SelectItem value="member">{nl ? 'Lid' : fr ? 'Membre' : 'Member'}</SelectItem>
                            <SelectItem value="viewer">{nl ? 'Kijker' : fr ? 'Observateur' : 'Viewer'}</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleRemoveMember(member.id, member.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
