// src/pages/admin/AdminOrganizations.tsx
// Organisatiebeheer — lijst, aanmaken, bewerken, verwijderen

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  Building2,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Trash2,
  Edit,
  Users,
  Calendar,
  Check,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  member_count: number;
}

export default function AdminOrganizations() {
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const fetchOrgs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      const res = await api.get('/tenant-admin/organizations', { params });
      setOrganizations(res.data || []);
    } catch (err: any) {
      toast({ title: 'Laden mislukt', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      setCreateLoading(true);
      await api.post('/tenant-admin/organizations', {
        name: newName.trim(),
        slug: newSlug.trim() || undefined,
      });
      toast({ title: 'Organisatie aangemaakt!' });
      setCreateOpen(false);
      setNewName('');
      setNewSlug('');
      fetchOrgs();
    } catch (err: any) {
      toast({ title: 'Aanmaken mislukt', description: err.response?.data?.detail, variant: 'destructive' });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdate = async (orgId: string) => {
    try {
      await api.patch(`/tenant-admin/organizations/${orgId}`, { name: editName });
      toast({ title: 'Bijgewerkt!' });
      setEditingId(null);
      fetchOrgs();
    } catch (err: any) {
      toast({ title: 'Bijwerken mislukt', variant: 'destructive' });
    }
  };

  const handleDelete = async (orgId: string, name: string) => {
    if (!confirm(`Weet je zeker dat je "${name}" wilt verwijderen? Alle leden worden losgekoppeld.`)) return;
    try {
      await api.delete(`/tenant-admin/organizations/${orgId}`);
      toast({ title: 'Organisatie verwijderd' });
      fetchOrgs();
    } catch (err: any) {
      toast({ title: 'Verwijderen mislukt', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organisaties</h1>
          <p className="text-sm text-gray-500">{organizations.length} organisaties</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchOrgs}>
            <RefreshCw className="h-4 w-4 mr-2" /> Vernieuwen
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" /> Organisatie Toevoegen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nieuwe Organisatie</DialogTitle>
                <DialogDescription>Maak een nieuwe tenant/organisatie aan</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Organisatienaam *</Label>
                  <Input placeholder="Bedrijfsnaam" value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Slug (optioneel)</Label>
                  <Input placeholder="bedrijfsnaam-slug" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} className="mt-1.5" />
                  <p className="text-xs text-gray-500 mt-1">Wordt automatisch gegenereerd als je dit leeg laat</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuleren</Button>
                <Button onClick={handleCreate} disabled={createLoading || !newName.trim()} className="bg-purple-600 hover:bg-purple-700">
                  {createLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Aanmaken
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Zoek organisaties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrgs()}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchOrgs}>Zoeken</Button>
      </div>

      {/* Organizations Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : organizations.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Building2 className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">Geen organisaties gevonden</p>
            <p className="text-sm">Maak een nieuwe organisatie aan om te beginnen</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <Card key={org.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600"
                      onClick={() => { setEditingId(org.id); setEditName(org.name); }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-600"
                      onClick={() => handleDelete(org.id, org.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {editingId === org.id ? (
                  <div className="flex gap-2 mb-3">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
                    <Button size="sm" className="h-8 w-8 p-0" onClick={() => handleUpdate(org.id)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{org.name}</h3>
                )}

                <p className="text-xs text-gray-400 font-mono mb-3">{org.slug}</p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    <span>{org.member_count} leden</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{org.created_at ? new Date(org.created_at).toLocaleDateString('nl-NL') : '-'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
