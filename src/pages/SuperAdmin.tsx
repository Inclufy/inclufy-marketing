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
import api from '@/lib/api';

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

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Superadmin',
  owner: 'Eigenaar',
  admin: 'Beheerder',
  member: 'Lid',
  viewer: 'Kijker',
};

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0',
  owner: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  member: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  viewer: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const API_KEY_LABELS: Record<string, string> = {
  openai: 'OpenAI',
  supabase_url: 'Supabase URL',
  supabase_key: 'Supabase Sleutel',
  stripe: 'Stripe',
  email_api: 'E-mail API',
  anthropic: 'Anthropic',
  allowed_origins: 'Toegestane Origins',
};

export default function SuperAdmin() {
  const { toast } = useToast();
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

      // Eerst verificatie met whoami
      const whoamiRes = await api.get('/admin/whoami');
      console.log('[SuperAdmin] whoami:', whoamiRes.data);
      setWhoami(whoamiRes.data);

      const [membersRes, orgRes, configRes, statsRes] = await Promise.all([
        api.get('/admin/members'),
        api.get('/admin/organization'),
        api.get('/admin/config'),
        api.get('/admin/stats'),
      ]);
      setMembers(membersRes.data);
      setOrg(orgRes.data);
      setOrgName(orgRes.data?.name || '');
      setConfig(configRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      console.error('[SuperAdmin] Error:', err.response?.status, err.response?.data);
      const msg = err.response?.data?.detail || err.message || 'Kon admin data niet laden';
      setError(msg);
      if (err.response?.status === 403) {
        setError('Admin toegang vereist. Alleen organisatie-eigenaren en beheerders kunnen deze pagina bekijken.');
      } else if (err.response?.status === 401) {
        setError('Authenticatie verlopen. Log uit en log opnieuw in.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await api.patch(`/admin/members/${memberId}/role`, { role: newRole });
      toast({ title: 'Rol bijgewerkt' });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Rol bijwerken mislukt', description: err.response?.data?.detail, variant: 'destructive' });
    }
  };

  const handleRemoveMember = async (memberId: string, email: string) => {
    if (!confirm(`${email} verwijderen uit de organisatie?`)) return;
    try {
      await api.delete(`/admin/members/${memberId}`);
      toast({ title: 'Lid verwijderd' });
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Lid verwijderen mislukt', description: err.response?.data?.detail, variant: 'destructive' });
    }
  };

  const handleSaveOrgName = async () => {
    try {
      await api.patch('/admin/organization', { name: orgName });
      toast({ title: 'Organisatienaam bijgewerkt' });
      setEditingName(false);
      fetchAll();
    } catch (err: any) {
      toast({ title: 'Bijwerken mislukt', description: err.response?.data?.detail, variant: 'destructive' });
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: 'Vul een e-mailadres in', variant: 'destructive' });
      return;
    }
    try {
      setInviteLoading(true);
      const res = await api.post('/admin/invite', {
        email: inviteEmail.trim(),
        full_name: inviteName.trim() || undefined,
        role: inviteRole,
        password: invitePassword.trim() || undefined,
      });
      setInviteResult({
        email: res.data.email,
        password: res.data.temporary_password || invitePassword,
        role: res.data.role,
      });
      toast({ title: `Gebruiker ${res.data.email} aangemaakt!` });
      // Reset form but keep dialog open to show credentials
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
      fetchAll();
    } catch (err: any) {
      toast({
        title: 'Gebruiker aanmaken mislukt',
        description: err.response?.data?.detail || err.message,
        variant: 'destructive',
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Gekopieerd naar klembord' });
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
            <Button variant="outline" onClick={fetchAll}>Opnieuw</Button>
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
            Admin Paneel
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Beheer je organisatie, teamleden en platformconfiguratie
          </p>
        </div>
        <Button variant="outline" onClick={fetchAll}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Vernieuwen
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
                  Rol: {ROLE_LABELS[whoami.role] || whoami.role} |
                  Gebruikers-ID: {whoami.user_id?.slice(0, 8)}...
                  {whoami.organization_id ? ` | Organisatie: ${whoami.organization_id.slice(0, 8)}...` : ' | Geen organisatie'}
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
            { label: 'Teamleden', value: stats.members, icon: Users, color: 'text-purple-500' },
            { label: 'Campagnes', value: stats.campaigns, icon: BarChart3, color: 'text-blue-500' },
            { label: 'Contacten', value: stats.contacts, icon: Users, color: 'text-emerald-500' },
            { label: 'Content Items', value: stats.content, icon: Settings, color: 'text-amber-500' },
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
              Organisatie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {org && (
              <>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Naam</label>
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
                      <Button size="sm" variant="ghost" onClick={() => setEditingName(true)}>Bewerken</Button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Slug</label>
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{org.slug}</span>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Aangemaakt</label>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {org.created_at ? new Date(org.created_at).toLocaleDateString('nl-NL') : '-'}
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
              API Configuratie
            </CardTitle>
            <CardDescription>Server-side API-sleutels status (sleutels worden nooit naar de browser gestuurd)</CardDescription>
          </CardHeader>
          <CardContent>
            {config && (
              <div className="space-y-3">
                {Object.entries(config).map(([key, val]) => {
                  const label = API_KEY_LABELS[key] || key.replace(/_/g, ' ');
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
                              Actief
                            </Badge>
                            <span className="text-xs text-gray-400 font-mono">{v.masked}</span>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-gray-400 border-gray-200 dark:border-gray-700 text-xs">
                            Niet geconfigureerd
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
                Teamleden
              </CardTitle>
              <CardDescription>{members.length} {members.length === 1 ? 'lid' : 'leden'}</CardDescription>
            </div>
            <Dialog open={inviteOpen} onOpenChange={(open) => { setInviteOpen(open); if (!open) setInviteResult(null); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Gebruiker Toevoegen
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                {inviteResult ? (
                  <>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-emerald-600">
                        <Check className="h-5 w-5" />
                        Gebruiker Aangemaakt!
                      </DialogTitle>
                      <DialogDescription>
                        Deel de inloggegevens met de nieuwe gebruiker
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">E-mail</p>
                            <p className="font-medium">{inviteResult.email}</p>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(inviteResult.email)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Wachtwoord</p>
                            <p className="font-mono text-sm">{inviteResult.password}</p>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(inviteResult.password)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Rol</p>
                          <p className="font-medium">{ROLE_LABELS[inviteResult.role] || inviteResult.role}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          copyToClipboard(`E-mail: ${inviteResult.email}\nWachtwoord: ${inviteResult.password}\nLogin: ${window.location.origin}/login`);
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Kopieer Alle Inloggegevens
                      </Button>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => { setInviteOpen(false); setInviteResult(null); }}>Sluiten</Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle>Nieuwe Gebruiker Toevoegen</DialogTitle>
                      <DialogDescription>
                        Maak een nieuw account aan en voeg toe aan je organisatie
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="invite-email">E-mailadres *</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          placeholder="gebruiker@bedrijf.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="invite-name">Volledige Naam</Label>
                        <Input
                          id="invite-name"
                          type="text"
                          placeholder="Naam van de gebruiker"
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor="invite-role">Rol</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Beheerder</SelectItem>
                            <SelectItem value="member">Lid</SelectItem>
                            <SelectItem value="viewer">Kijker</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="invite-password">Wachtwoord (optioneel)</Label>
                        <Input
                          id="invite-password"
                          type="text"
                          placeholder="Laat leeg voor automatisch wachtwoord"
                          value={invitePassword}
                          onChange={(e) => setInvitePassword(e.target.value)}
                          className="mt-1.5"
                        />
                        <p className="text-xs text-gray-500 mt-1">Als je dit leeg laat wordt er een veilig wachtwoord gegenereerd</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteOpen(false)}>Annuleren</Button>
                      <Button
                        onClick={handleInviteUser}
                        disabled={inviteLoading || !inviteEmail.trim()}
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        {inviteLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                        Gebruiker Aanmaken
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
            <p className="text-gray-500 text-center py-8">Geen leden gevonden.</p>
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
                        <p className="font-medium">{member.full_name || member.email?.split('@')[0] || 'Onbekend'}</p>
                        <Badge variant="outline" className={ROLE_COLORS[member.role] || ROLE_COLORS.member}>
                          {ROLE_LABELS[member.role] || member.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{member.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {member.joined_at && (
                      <span className="text-xs text-gray-400">
                        Lid sinds {new Date(member.joined_at).toLocaleDateString('nl-NL')}
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
                            <SelectItem value="owner">Eigenaar</SelectItem>
                            <SelectItem value="admin">Beheerder</SelectItem>
                            <SelectItem value="member">Lid</SelectItem>
                            <SelectItem value="viewer">Kijker</SelectItem>
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
