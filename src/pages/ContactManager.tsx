// src/pages/ContactManager.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Users,
  Upload,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  UserPlus
} from "lucide-react";
import api from "@/lib/api";
import { useLanguage } from '@/contexts/LanguageContext';

interface Contact {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  city: string | null;
  tags: string[];
  source: string;
  created_at: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  total_rows: number;
  errors: string[];
}

export default function ContactManager() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New contact form
  const [newContact, setNewContact] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    city: '',
    country: '',
  });

  // Stats
  const [stats, setStats] = useState({ total: 0, with_email: 0, with_consent: 0 });

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string> = {};
      if (searchQuery) params.search = searchQuery;

      const [contactsRes, statsRes] = await Promise.all([
        api.get('/contacts/', { params }),
        api.get('/contacts/stats/overview'),
      ]);
      setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : []);
      setStats(statsRes.data);
    } catch (err: any) {
      console.error('Failed to fetch contacts:', err);
      setError(err.response?.data?.detail || err.message || (nl ? 'Contacten laden mislukt' : fr ? 'Échec du chargement des contacts' : 'Failed to load contacts'));
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchContacts();
  }, []);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchContacts]);

  // Add contact
  const handleAddContact = async () => {
    if (!newContact.email.trim()) return;

    try {
      setSaving(true);
      await api.post('/contacts/', {
        email: newContact.email,
        first_name: newContact.first_name || null,
        last_name: newContact.last_name || null,
        phone: newContact.phone || null,
        city: newContact.city || null,
        country: newContact.country || null,
      });
      setIsAddDialogOpen(false);
      setNewContact({ email: '', first_name: '', last_name: '', phone: '', city: '', country: '' });
      fetchContacts();
    } catch (err: any) {
      setError(err.response?.data?.detail || (nl ? 'Contact toevoegen mislukt' : fr ? 'Échec de l\'ajout du contact' : 'Failed to add contact'));
    } finally {
      setSaving(false);
    }
  };

  // Delete contact
  const handleDeleteContact = async (id: string) => {
    if (!confirm(nl ? 'Dit contact verwijderen?' : fr ? 'Supprimer ce contact ?' : 'Delete this contact?')) return;

    try {
      await api.delete(`/contacts/${id}`);
      setContacts(prev => prev.filter(c => c.id !== id));
      setStats(prev => ({ ...prev, total: prev.total - 1 }));
    } catch (err: any) {
      setError(err.response?.data?.detail || (nl ? 'Contact verwijderen mislukt' : fr ? 'Échec de la suppression du contact' : 'Failed to delete contact'));
    }
  };

  // CSV Import
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportResult(null);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/contacts/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImportResult(res.data);

      // Refresh contacts list
      fetchContacts();
    } catch (err: any) {
      console.error('CSV import failed:', err);
      setError(err.response?.data?.detail || (nl ? 'CSV-import mislukt' : fr ? 'Échec de l\'import CSV' : 'CSV import failed'));
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
            <Users className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 text-transparent bg-clip-text">
              {nl ? 'Contactbeheer' : fr ? 'Gestionnaire de Contacts' : 'Contact Manager'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {nl ? 'Beheer je contacten en importeer vanuit CSV' : fr ? 'Gérez vos contacts et importez depuis un CSV' : 'Manage your contacts and import from CSV'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchContacts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
          </Button>

          {/* Import CSV Dialog */}
          <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
            setIsImportDialogOpen(open);
            if (!open) setImportResult(null);
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                {nl ? 'CSV Importeren' : fr ? 'Importer CSV' : 'Import CSV'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{nl ? 'Contacten importeren vanuit CSV' : fr ? 'Importer des contacts depuis un CSV' : 'Import Contacts from CSV'}</DialogTitle>
                <DialogDescription>
                  {nl
                    ? 'Upload een CSV-bestand met contactgegevens. Vereiste kolom: email. Ondersteunde kolommen: email, first_name, last_name, phone, city, country.'
                    : fr
                    ? 'Téléchargez un fichier CSV avec les données de contact. Colonne requise : email. Colonnes prises en charge : email, first_name, last_name, phone, city, country.'
                    : 'Upload a CSV file with contact data. Required column: email. Supported columns: email, first_name, last_name, phone, city, country.'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* File Upload Area */}
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {importing ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
                      <p className="text-sm text-gray-600">{nl ? 'Contacten importeren...' : fr ? 'Importation des contacts...' : 'Importing contacts...'}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FileSpreadsheet className="h-10 w-10 text-gray-400 mb-3" />
                      <p className="text-sm font-medium">{nl ? 'Klik om CSV-bestand te uploaden' : fr ? 'Cliquez pour télécharger un fichier CSV' : 'Click to upload CSV file'}</p>
                      <p className="text-xs text-gray-500 mt-1">{nl ? 'of sleep en zet neer' : fr ? 'ou glisser-déposer' : 'or drag and drop'}</p>
                    </div>
                  )}
                </div>

                {/* Import Result */}
                {importResult && (
                  <div className={`rounded-lg p-4 ${importResult.imported > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className={`h-5 w-5 ${importResult.imported > 0 ? 'text-green-600' : 'text-amber-600'}`} />
                      <p className="font-semibold text-sm">{nl ? 'Import Voltooid' : fr ? 'Import Terminé' : 'Import Complete'}</p>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="text-green-700 dark:text-green-300">
                        {importResult.imported} {nl ? 'contacten geïmporteerd' : fr ? 'contacts importés' : 'contacts imported'}
                      </p>
                      {importResult.skipped > 0 && (
                        <p className="text-amber-700 dark:text-amber-300">
                          {importResult.skipped} {nl ? 'rijen overgeslagen' : fr ? 'lignes ignorées' : 'rows skipped'}
                        </p>
                      )}
                      <p className="text-gray-500">
                        {importResult.total_rows} {nl ? 'rijen verwerkt' : fr ? 'lignes traitées' : 'total rows processed'}
                      </p>
                    </div>
                    {importResult.errors.length > 0 && (
                      <div className="mt-2 text-xs text-red-600 space-y-1">
                        {importResult.errors.map((err, i) => (
                          <p key={i}>{err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* CSV Format Help */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2">{nl ? 'CSV-formaat Voorbeeld' : fr ? 'Exemple de Format CSV' : 'CSV Format Example'}</h4>
                  <code className="text-xs block bg-white dark:bg-gray-900 p-2 rounded border overflow-x-auto">
                    email,first_name,last_name,phone,city,country<br />
                    john@example.com,John,Doe,+31612345678,Amsterdam,Netherlands<br />
                    jane@example.com,Jane,Smith,,Rotterdam,Netherlands
                  </code>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Contact Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                <UserPlus className="h-4 w-4 mr-2" />
                {nl ? 'Contact Toevoegen' : fr ? 'Ajouter un Contact' : 'Add Contact'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{nl ? 'Nieuw Contact Toevoegen' : fr ? 'Ajouter un Nouveau Contact' : 'Add New Contact'}</DialogTitle>
                <DialogDescription>{nl ? 'Voeg handmatig een contact toe aan je database.' : fr ? 'Ajoutez manuellement un contact à votre base de données.' : 'Add a contact to your database manually.'}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="email">{nl ? 'E-mail' : fr ? 'E-mail' : 'Email'} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">{nl ? 'Voornaam' : fr ? 'Prénom' : 'First Name'}</Label>
                    <Input
                      id="first_name"
                      value={newContact.first_name}
                      onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">{nl ? 'Achternaam' : fr ? 'Nom de Famille' : 'Last Name'}</Label>
                    <Input
                      id="last_name"
                      value={newContact.last_name}
                      onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">{nl ? 'Telefoon' : fr ? 'Téléphone' : 'Phone'}</Label>
                  <Input
                    id="phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="+31612345678"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">{nl ? 'Stad' : fr ? 'Ville' : 'City'}</Label>
                    <Input
                      id="city"
                      value={newContact.city}
                      onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                      placeholder="Amsterdam"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">{nl ? 'Land' : fr ? 'Pays' : 'Country'}</Label>
                    <Input
                      id="country"
                      value={newContact.country}
                      onChange={(e) => setNewContact({ ...newContact, country: e.target.value })}
                      placeholder={nl ? 'Nederland' : fr ? 'Pays-Bas' : 'Netherlands'}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>{nl ? 'Annuleren' : fr ? 'Annuler' : 'Cancel'}</Button>
                  <Button
                    onClick={handleAddContact}
                    disabled={saving || !newContact.email.trim()}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600"
                  >
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {nl ? 'Contact Toevoegen' : fr ? 'Ajouter un Contact' : 'Add Contact'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 dark:text-red-200 flex-1">{error}</p>
          <Button variant="outline" size="sm" onClick={() => setError(null)}>{nl ? 'Sluiten' : fr ? 'Fermer' : 'Dismiss'}</Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{nl ? 'Totaal Contacten' : fr ? 'Total des Contacts' : 'Total Contacts'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{nl ? 'Met E-mail' : fr ? 'Avec E-mail' : 'With Email'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.with_email}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{nl ? 'Met Toestemming' : fr ? 'Avec Consentement' : 'With Consent'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.with_consent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={nl ? 'Zoek contacten op naam of e-mail...' : fr ? 'Rechercher des contacts par nom ou e-mail...' : 'Search contacts by name or email...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contacts List */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>{nl ? 'Contacten' : fr ? 'Contacts' : 'Contacts'}</CardTitle>
          <CardDescription>
            {contacts.length} {nl ? (contacts.length !== 1 ? 'contacten' : 'contact') : fr ? (contacts.length !== 1 ? 'contacts' : 'contact') : (contacts.length !== 1 ? 'contacts' : 'contact')} {nl ? 'gevonden' : fr ? 'trouvé(s)' : 'found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{nl ? 'Nog geen contacten' : fr ? 'Pas encore de contacts' : 'No contacts yet'}</h3>
              <p className="text-gray-500 mb-6">
                {nl ? 'Voeg handmatig contacten toe of importeer vanuit een CSV-bestand.' : fr ? 'Ajoutez des contacts manuellement ou importez depuis un fichier CSV.' : 'Add contacts manually or import from a CSV file.'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  {nl ? 'CSV Importeren' : fr ? 'Importer CSV' : 'Import CSV'}
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)} className="bg-gradient-to-r from-blue-600 to-cyan-600">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {nl ? 'Contact Toevoegen' : fr ? 'Ajouter un Contact' : 'Add Contact'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{nl ? 'Naam' : fr ? 'Nom' : 'Name'}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{nl ? 'E-mail' : fr ? 'E-mail' : 'Email'}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{nl ? 'Telefoon' : fr ? 'Téléphone' : 'Phone'}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{nl ? 'Locatie' : fr ? 'Localisation' : 'Location'}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{nl ? 'Bron' : fr ? 'Source' : 'Source'}</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">{nl ? 'Labels' : fr ? 'Étiquettes' : 'Tags'}</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm">
                          {contact.first_name || contact.last_name
                            ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                            : '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm">
                          {contact.email && <Mail className="h-3 w-3 text-gray-400" />}
                          {contact.email || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm">
                          {contact.phone && <Phone className="h-3 w-3 text-gray-400" />}
                          {contact.phone || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm">
                          {(contact.city || contact.country) && <MapPin className="h-3 w-3 text-gray-400" />}
                          {[contact.city, contact.country].filter(Boolean).join(', ') || '—'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs">
                          {contact.source || (nl ? 'onbekend' : fr ? 'inconnu' : 'unknown')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1 flex-wrap">
                          {(contact.tags || []).slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContact(contact.id)}
                          className="hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
