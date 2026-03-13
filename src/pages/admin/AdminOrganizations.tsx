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
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  member_count: number;
}

export default function AdminOrganizations() {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
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
      let query = supabase.from('organizations').select('id, name, slug, created_at');
      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }
      const { data, error: fetchError } = await query.order('created_at', { ascending: false });
      if (fetchError) throw fetchError;
      setOrganizations((data || []).map((o: any) => ({
        ...o,
        member_count: 0,
      })));
    } catch (err: any) {
      toast({ title: nl ? 'Laden mislukt' : fr ? 'Echec du chargement' : 'Loading failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      setCreateLoading(true);
      const slug = newSlug.trim() || newName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { error: insertError } = await supabase.from('organizations').insert({ name: newName.trim(), slug });
      if (insertError) throw insertError;
      toast({ title: nl ? 'Organisatie aangemaakt!' : fr ? 'Organisation creee !' : 'Organization created!' });
      setCreateOpen(false);
      setNewName('');
      setNewSlug('');
      fetchOrgs();
    } catch (err: any) {
      toast({ title: nl ? 'Aanmaken mislukt' : fr ? 'Echec de la creation' : 'Creation failed', description: err.response?.data?.detail, variant: 'destructive' });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdate = async (orgId: string) => {
    try {
      const { error: updateError } = await supabase.from('organizations').update({ name: editName }).eq('id', orgId);
      if (updateError) throw updateError;
      toast({ title: nl ? 'Bijgewerkt!' : fr ? 'Mis a jour !' : 'Updated!' });
      setEditingId(null);
      fetchOrgs();
    } catch (err: any) {
      toast({ title: nl ? 'Bijwerken mislukt' : fr ? 'Echec de la mise a jour' : 'Update failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (orgId: string, name: string) => {
    const confirmMsg = nl
      ? `Weet je zeker dat je "${name}" wilt verwijderen? Alle leden worden losgekoppeld.`
      : fr
      ? `Etes-vous sur de vouloir supprimer "${name}" ? Tous les membres seront detaches.`
      : `Are you sure you want to delete "${name}"? All members will be detached.`;
    if (!confirm(confirmMsg)) return;
    try {
      const { error: delError } = await supabase.from('organizations').delete().eq('id', orgId);
      if (delError) throw delError;
      toast({ title: nl ? 'Organisatie verwijderd' : fr ? 'Organisation supprimee' : 'Organization deleted' });
      fetchOrgs();
    } catch (err: any) {
      toast({ title: nl ? 'Verwijderen mislukt' : fr ? 'Echec de la suppression' : 'Deletion failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{nl ? 'Organisaties' : fr ? 'Organisations' : 'Organizations'}</h1>
          <p className="text-sm text-gray-500">{organizations.length} {nl ? 'organisaties' : fr ? 'organisations' : 'organizations'}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchOrgs}>
            <RefreshCw className="h-4 w-4 mr-2" /> {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" /> {nl ? 'Organisatie Toevoegen' : fr ? 'Ajouter une organisation' : 'Add Organization'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{nl ? 'Nieuwe Organisatie' : fr ? 'Nouvelle Organisation' : 'New Organization'}</DialogTitle>
                <DialogDescription>{nl ? 'Maak een nieuwe tenant/organisatie aan' : fr ? 'Creer une nouvelle organisation/tenant' : 'Create a new tenant/organization'}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>{nl ? 'Organisatienaam *' : fr ? 'Nom de l\'organisation *' : 'Organization name *'}</Label>
                  <Input placeholder={nl ? 'Bedrijfsnaam' : fr ? 'Nom de l\'entreprise' : 'Company name'} value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>{nl ? 'Slug (optioneel)' : fr ? 'Slug (optionnel)' : 'Slug (optional)'}</Label>
                  <Input placeholder={nl ? 'bedrijfsnaam-slug' : fr ? 'nom-entreprise-slug' : 'company-name-slug'} value={newSlug} onChange={(e) => setNewSlug(e.target.value)} className="mt-1.5" />
                  <p className="text-xs text-gray-500 mt-1">{nl ? 'Wordt automatisch gegenereerd als je dit leeg laat' : fr ? 'Sera genere automatiquement si laisse vide' : 'Will be auto-generated if left empty'}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>{nl ? 'Annuleren' : fr ? 'Annuler' : 'Cancel'}</Button>
                <Button onClick={handleCreate} disabled={createLoading || !newName.trim()} className="bg-purple-600 hover:bg-purple-700">
                  {createLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  {nl ? 'Aanmaken' : fr ? 'Creer' : 'Create'}
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
            placeholder={nl ? 'Zoek organisaties...' : fr ? 'Rechercher des organisations...' : 'Search organizations...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrgs()}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={fetchOrgs}>{nl ? 'Zoeken' : fr ? 'Rechercher' : 'Search'}</Button>
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
            <p className="text-lg font-medium">{nl ? 'Geen organisaties gevonden' : fr ? 'Aucune organisation trouvee' : 'No organizations found'}</p>
            <p className="text-sm">{nl ? 'Maak een nieuwe organisatie aan om te beginnen' : fr ? 'Creez une nouvelle organisation pour commencer' : 'Create a new organization to get started'}</p>
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
                    <span>{org.member_count} {nl ? 'leden' : fr ? 'membres' : 'members'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{org.created_at ? new Date(org.created_at).toLocaleDateString(nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-GB') : '-'}</span>
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
