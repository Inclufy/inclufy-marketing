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
import api from '@/lib/api';

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

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Superadmin',
  owner: 'Eigenaar',
  admin: 'Beheerder',
  member: 'Lid',
  viewer: 'Kijker',
  geen: 'Geen rol',
};

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
      const params: any = { page, per_page: perPage };
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/tenant-admin/users', { params });
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
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
      const res = await api.post('/tenant-admin/users', {
        email: newEmail.trim(),
        full_name: newName.trim() || undefined,
        role: newRole,
        password: newPassword.trim() || undefined,
      });
      setCreateResult({
        email: res.data.email,
        password: res.data.temporary_password || newPassword,
        role: res.data.role,
      });
      toast({ title: `Gebruiker ${res.data.email} aangemaakt!` });
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      toast({
        title: 'Aanmaken mislukt',
        description: err.response?.data?.detail || err.message,
        variant: 'destructive',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Weet je zeker dat je ${email} wilt verwijderen?`)) return;
    try {
      await api.delete(`/tenant-admin/users/${userId}`);
      toast({ title: 'Gebruiker verwijderd' });
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Verwijderen mislukt', description: err.response?.data?.detail, variant: 'destructive' });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/tenant-admin/users/${userId}`, { role: newRole });
      toast({ title: 'Rol bijgewerkt' });
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Bijwerken mislukt', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Gekopieerd!' });
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gebruikers</h1>
          <p className="text-sm text-gray-500">{total} gebruikers totaal</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Vernieuwen
          </Button>
          <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setCreateResult(null); }}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Gebruiker Toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              {createResult ? (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-emerald-600 flex items-center gap-2">
                      <Check className="h-5 w-5" /> Gebruiker Aangemaakt!
                    </DialogTitle>
                    <DialogDescription>Deel deze inloggegevens met de gebruiker</DialogDescription>
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
                          <p className="text-xs text-gray-500">Wachtwoord</p>
                          <p className="font-mono text-sm">{createResult.password}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createResult.password)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Rol</p>
                        <p className="font-medium">{ROLE_LABELS[createResult.role] || createResult.role}</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => copyToClipboard(`E-mail: ${createResult.email}\nWachtwoord: ${createResult.password}\nLogin: ${window.location.origin}/login`)}>
                      <Copy className="h-4 w-4 mr-2" /> Kopieer Alle Gegevens
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => { setCreateOpen(false); setCreateResult(null); }}>Sluiten</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Nieuwe Gebruiker</DialogTitle>
                    <DialogDescription>Maak een account aan voor een nieuwe gebruiker</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>E-mailadres *</Label>
                      <Input type="email" placeholder="gebruiker@bedrijf.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Volledige Naam</Label>
                      <Input placeholder="Naam" value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label>Rol</Label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Eigenaar</SelectItem>
                          <SelectItem value="admin">Beheerder</SelectItem>
                          <SelectItem value="member">Lid</SelectItem>
                          <SelectItem value="viewer">Kijker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Wachtwoord (optioneel)</Label>
                      <Input placeholder="Automatisch genereren" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1.5" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuleren</Button>
                    <Button onClick={handleCreateUser} disabled={createLoading || !newEmail.trim()} className="bg-purple-600 hover:bg-purple-700">
                      {createLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
                      Aanmaken
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
            placeholder="Zoek op naam of e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>Zoeken</Button>
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
            <p className="text-center py-12 text-gray-500">Geen gebruikers gevonden</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Gebruiker</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Organisatie</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Rol</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Aangemeld</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">Acties</th>
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
                              <SelectItem value="owner">Eigenaar</SelectItem>
                              <SelectItem value="admin">Beheerder</SelectItem>
                              <SelectItem value="member">Lid</SelectItem>
                              <SelectItem value="viewer">Kijker</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('nl-NL') : '-'}
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
                Pagina {page} van {totalPages} ({total} gebruikers)
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
