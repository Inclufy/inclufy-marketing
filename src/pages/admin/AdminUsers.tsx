// src/pages/admin/AdminUsers.tsx
// Gebruikersbeheer — lijst, aanmaken, bewerken, verwijderen

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  UserPlus,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Edit,
  Copy,
  Check,
  Crown,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  role: string;
  organization_name: string;
  organization_id: string;
  is_superadmin: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  member: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  viewer: 'bg-gray-50 text-gray-500 dark:bg-gray-800/50 dark:text-gray-400',
  geen: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
};

export default function AdminUsers() {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  // ─── Role labels per language ──────────────────────────────────────
  const ROLE_LABELS: Record<string, string> = {
    superadmin: 'Superadmin',
    owner: nl ? 'Eigenaar' : fr ? 'Propri\u00e9taire' : 'Owner',
    admin: nl ? 'Beheerder' : fr ? 'Administrateur' : 'Admin',
    member: nl ? 'Lid' : fr ? 'Membre' : 'Member',
    viewer: nl ? 'Kijker' : fr ? 'Lecteur' : 'Viewer',
    geen: nl ? 'Geen rol' : fr ? 'Aucun r\u00f4le' : 'No role',
  };

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('member');
  const [newPassword, setNewPassword] = useState('');
  const [createResult, setCreateResult] = useState<{ email: string; password: string; role: string } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      let query = supabase.from('profiles').select('id, email, full_name, created_at, role', { count: 'exact' });
      if (search.trim()) {
        query = query.or(`email.ilike.%${search.trim()}%,full_name.ilike.%${search.trim()}%`);
      }
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      const { data, count, error: fetchError } = await query.order('created_at', { ascending: false }).range(from, to);
      if (fetchError) throw fetchError;
      setUsers((data || []).map((p: any) => ({
        id: p.id,
        email: p.email || '',
        full_name: p.full_name || '',
        created_at: p.created_at,
        role: p.role || 'member',
        organization_name: '',
        organization_id: '',
        is_superadmin: p.role === 'superadmin',
      })));
      setTotal(count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleCreateUser = async () => {
    if (!newEmail.trim()) return;
    try {
      setCreateLoading(true);
      // Use Supabase edge function for user creation (requires admin privileges)
      const { data: res, error: fnError } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: newEmail.trim(),
          full_name: newName.trim() || undefined,
          role: newRole,
          password: newPassword.trim() || undefined,
        },
      });
      if (fnError) throw fnError;
      const tempPassword = newPassword.trim() || res?.temporary_password || 'Temp123!';
      setCreateResult({
        email: newEmail.trim(),
        password: tempPassword,
        role: newRole,
      });
      toast({
        title: nl
          ? `Gebruiker ${res.data.email} aangemaakt!`
          : fr
            ? `Utilisateur ${res.data.email} cr\u00e9\u00e9 !`
            : `User ${res.data.email} created!`,
      });
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      toast({
        title: nl ? 'Aanmaken mislukt' : fr ? '\u00c9chec de la cr\u00e9ation' : 'Creation failed',
        description: err.response?.data?.detail || err.message,
        variant: 'destructive',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    const confirmMsg = nl
      ? `Weet je zeker dat je ${email} wilt verwijderen?`
      : fr
        ? `\u00cates-vous s\u00fbr de vouloir supprimer ${email} ?`
        : `Are you sure you want to delete ${email}?`;
    if (!confirm(confirmMsg)) return;
    try {
      const { error: delError } = await supabase.functions.invoke('admin-delete-user', { body: { user_id: userId } });
      if (delError) throw delError;
      toast({ title: nl ? 'Gebruiker verwijderd' : fr ? 'Utilisateur supprim\u00e9' : 'User deleted' });
      fetchUsers();
    } catch (err: any) {
      toast({
        title: nl ? 'Verwijderen mislukt' : fr ? '\u00c9chec de la suppression' : 'Deletion failed',
        description: err.response?.data?.detail,
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error: roleError } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (roleError) throw roleError;
      toast({ title: nl ? 'Rol bijgewerkt' : fr ? 'R\u00f4le mis \u00e0 jour' : 'Role updated' });
      fetchUsers();
    } catch (err: any) {
      toast({
        title: nl ? 'Bijwerken mislukt' : fr ? '\u00c9chec de la mise \u00e0 jour' : 'Update failed',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: nl ? 'Gekopieerd!' : fr ? 'Copi\u00e9 !' : 'Copied!' });
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {nl ? 'Gebruikers' : fr ? 'Utilisateurs' : 'Users'}
          </h1>
          <p className="text-sm text-gray-500">
            {nl
              ? `${total} gebruikers totaal`
              : fr
                ? `${total} utilisateurs au total`
                : `${total} users total`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
          </Button>
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setCreateResult(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <UserPlus className="h-4 w-4 mr-2" />
                {nl ? 'Gebruiker Toevoegen' : fr ? 'Ajouter un Utilisateur' : 'Add User'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              {createResult ? (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-emerald-600 flex items-center gap-2">
                      <Check className="h-5 w-5" /> {nl ? 'Gebruiker Aangemaakt!' : fr ? 'Utilisateur Cr\u00e9\u00e9 !' : 'User Created!'}
                    </DialogTitle>
                    <DialogDescription>
                      {nl
                        ? 'Deel deze inloggegevens met de gebruiker'
                        : fr
                          ? 'Partagez ces identifiants avec l\u2019utilisateur'
                          : 'Share these login credentials with the user'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">E-mail</p>
                          <p className="font-medium">{createResult.email}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createResult.email)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">
                            {nl ? 'Wachtwoord' : fr ? 'Mot de passe' : 'Password'}
                          </p>
                          <p className="font-mono text-sm">{createResult.password}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createResult.password)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">
                          {nl ? 'Rol' : fr ? 'R\u00f4le' : 'Role'}
                        </p>
                        <p className="font-medium">{ROLE_LABELS[createResult.role] || createResult.role}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => copyToClipboard(
                      nl
                        ? `E-mail: ${createResult.email}\nWachtwoord: ${createResult.password}\nLogin: ${window.location.origin}/login`
                        : fr
                          ? `E-mail : ${createResult.email}\nMot de passe : ${createResult.password}\nConnexion : ${window.location.origin}/login`
                          : `Email: ${createResult.email}\nPassword: ${createResult.password}\nLogin: ${window.location.origin}/login`
                    )}>
                      <Copy className="h-4 w-4 mr-2" /> {nl ? 'Kopieer Alle Gegevens' : fr ? 'Copier Toutes les Donn\u00e9es' : 'Copy All Details'}
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => { setCreateOpen(false); setCreateResult(null); }}>
                      {nl ? 'Sluiten' : fr ? 'Fermer' : 'Close'}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>
                      {nl ? 'Nieuwe Gebruiker' : fr ? 'Nouvel Utilisateur' : 'New User'}
                    </DialogTitle>
                    <DialogDescription>
                      {nl
                        ? 'Maak een account aan voor een nieuwe gebruiker'
                        : fr
                          ? 'Cr\u00e9ez un compte pour un nouvel utilisateur'
                          : 'Create an account for a new user'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>{nl ? 'E-mailadres *' : fr ? 'Adresse e-mail *' : 'Email Address *'}</Label>
                      <Input
                        type="email"
                        placeholder={nl ? 'gebruiker@bedrijf.com' : fr ? 'utilisateur@entreprise.com' : 'user@company.com'}
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>{nl ? 'Volledige Naam' : fr ? 'Nom Complet' : 'Full Name'}</Label>
                      <Input
                        placeholder={nl ? 'Naam' : fr ? 'Nom' : 'Name'}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>{nl ? 'Rol' : fr ? 'R\u00f4le' : 'Role'}</Label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">{ROLE_LABELS.owner}</SelectItem>
                          <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                          <SelectItem value="member">{ROLE_LABELS.member}</SelectItem>
                          <SelectItem value="viewer">{ROLE_LABELS.viewer}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>
                        {nl ? 'Wachtwoord (optioneel)' : fr ? 'Mot de passe (optionnel)' : 'Password (optional)'}
                      </Label>
                      <Input
                        placeholder={nl ? 'Automatisch genereren' : fr ? 'G\u00e9n\u00e9rer automatiquement' : 'Auto-generate'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>
                      {nl ? 'Annuleren' : fr ? 'Annuler' : 'Cancel'}
                    </Button>
                    <Button onClick={handleCreateUser} disabled={createLoading || !newEmail.trim()} className="bg-purple-600 hover:bg-purple-700">
                      {createLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                      {nl ? 'Aanmaken' : fr ? 'Cr\u00e9er' : 'Create'}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={nl ? 'Zoek op naam of e-mail...' : fr ? 'Rechercher par nom ou e-mail...' : 'Search by name or email...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>
          {nl ? 'Zoeken' : fr ? 'Rechercher' : 'Search'}
        </Button>
      </div>

      {/* Users Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500 gap-2">
              <AlertCircle className="h-5 w-5" /> {error}
            </div>
          ) : users.length === 0 ? (
            <p className="text-center py-12 text-gray-500">
              {nl ? 'Geen gebruikers gevonden' : fr ? 'Aucun utilisateur trouv\u00e9' : 'No users found'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      {nl ? 'Gebruiker' : fr ? 'Utilisateur' : 'User'}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      {nl ? 'Organisatie' : fr ? 'Organisation' : 'Organization'}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      {nl ? 'Rol' : fr ? 'R\u00f4le' : 'Role'}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      {nl ? 'Aangemeld' : fr ? 'Inscrit' : 'Joined'}
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      {nl ? 'Acties' : 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                            {(user.full_name || user.email || '?').slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.full_name || user.email?.split('@')[0]}
                              </p>
                              {user.is_superadmin && (
                                <Crown className="h-3.5 w-3.5 text-amber-500" />
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {user.organization_name || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {user.is_superadmin ? (
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Superadmin</Badge>
                        ) : (
                          <Select value={user.role} onValueChange={(val) => handleRoleChange(user.id, val)}>
                            <SelectTrigger className="w-28 h-7 text-xs border-0 bg-transparent">
                              <Badge className={`${ROLE_COLORS[user.role] || ROLE_COLORS.member} border-0 text-xs`}>
                                {ROLE_LABELS[user.role] || user.role}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">{ROLE_LABELS.owner}</SelectItem>
                              <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
                              <SelectItem value="member">{ROLE_LABELS.member}</SelectItem>
                              <SelectItem value="viewer">{ROLE_LABELS.viewer}</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString(nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-US') : '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!user.is_superadmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500">
                {nl
                  ? `Pagina ${page} van ${totalPages} (${total} gebruikers)`
                  : fr
                    ? `Page ${page} sur ${totalPages} (${total} utilisateurs)`
                    : `Page ${page} of ${totalPages} (${total} users)`}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
