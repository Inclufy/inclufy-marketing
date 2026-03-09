import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Palette,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Loader2,
  Star,
  Check,
  Download,
  FileUp,
  Copy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

interface BrandKit {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  font_family: string;
  tagline: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

const fontOptions = [
  { value: "system-ui", label: "System Default" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "'Roboto', sans-serif", label: "Roboto" },
  { value: "'Montserrat', sans-serif", label: "Montserrat" },
  { value: "'Open Sans', sans-serif", label: "Open Sans" },
  { value: "'Poppins', sans-serif", label: "Poppins" },
];

const BrandKits = () => {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BrandKit | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#db2777");
  const [secondaryColor, setSecondaryColor] = useState("#7c3aed");
  const [fontFamily, setFontFamily] = useState("system-ui");
  const [tagline, setTagline] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const fetchBrandKits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('brand_kits')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setBrandKits(data || []);
    } catch (error) {
      console.error("Error fetching brand kits:", error);
      toast.error(nl ? "Kon merkpakketten niet laden" : fr ? "Impossible de charger les kits de marque" : "Could not load brand kits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrandKits();
  }, []);

  const resetForm = () => {
    setName("");
    setPrimaryColor("#db2777");
    setSecondaryColor("#7c3aed");
    setFontFamily("system-ui");
    setTagline("");
    setLogoFile(null);
    setLogoPreview(null);
    setEditing(null);
  };

  const openEditDialog = (kit: BrandKit) => {
    setEditing(kit);
    setName(kit.name);
    setPrimaryColor(kit.primary_color);
    setSecondaryColor(kit.secondary_color);
    setFontFamily(kit.font_family);
    setTagline(kit.tagline || "");
    setLogoPreview(kit.logo_url);
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(nl ? "Vul een naam in" : fr ? "Veuillez entrer un nom" : "Please enter a name");
      return;
    }

    setSaving(true);
    try {
      let logoUrl = editing?.logo_url || null;

      // Upload logo if new file selected
      if (logoFile) {
        // Convert to base64 for storage (simple approach without storage bucket)
        const reader = new FileReader();
        logoUrl = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(logoFile);
        });
      }

      const kitData = {
        name: name.trim(),
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        font_family: fontFamily,
        tagline: tagline.trim() || null,
        logo_url: logoUrl,
      };

      if (editing) {
        const { error } = await supabase
          .from('brand_kits')
          .update(kitData)
          .eq('id', editing.id);

        if (error) throw error;
        toast.success(nl ? "Merkpakket bijgewerkt" : fr ? "Kit de marque mis \u00e0 jour" : "Brand kit updated");
      } else {
        const { error } = await supabase
          .from('brand_kits')
          .insert(kitData);

        if (error) throw error;
        toast.success(nl ? "Merkpakket aangemaakt" : fr ? "Kit de marque cr\u00e9\u00e9" : "Brand kit created");
      }

      setDialogOpen(false);
      resetForm();
      fetchBrandKits();
    } catch (error) {
      console.error("Error saving brand kit:", error);
      toast.error(nl ? "Kon merkpakket niet opslaan" : fr ? "Impossible d\u2019enregistrer le kit de marque" : "Could not save brand kit");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from('brand_kits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBrandKits(brandKits.filter(k => k.id !== id));
      toast.success(nl ? "Merkpakket verwijderd" : fr ? "Kit de marque supprim\u00e9" : "Brand kit deleted");
    } catch (error) {
      console.error("Error deleting brand kit:", error);
      toast.error(nl ? "Kon merkpakket niet verwijderen" : fr ? "Impossible de supprimer le kit de marque" : "Could not delete brand kit");
    } finally {
      setDeleting(null);
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      // First, unset all defaults
      await supabase
        .from('brand_kits')
        .update({ is_default: false })
        .neq('id', id);

      // Then set the new default
      const { error } = await supabase
        .from('brand_kits')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      toast.success(nl ? "Standaard merkpakket ingesteld" : fr ? "Kit de marque par d\u00e9faut d\u00e9fini" : "Default brand kit set");
      fetchBrandKits();
    } catch (error) {
      console.error("Error setting default:", error);
      toast.error(nl ? "Kon standaard niet instellen" : fr ? "Impossible de d\u00e9finir par d\u00e9faut" : "Could not set default");
    }
  };

  // Export a single brand kit
  const exportBrandKit = (kit: BrandKit) => {
    const exportData = {
      name: kit.name,
      primary_color: kit.primary_color,
      secondary_color: kit.secondary_color,
      font_family: kit.font_family,
      tagline: kit.tagline,
      logo_url: kit.logo_url,
      exported_at: new Date().toISOString(),
      version: "1.0"
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brand-kit-${kit.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(nl ? `Merkpakket "${kit.name}" ge\u00ebxporteerd` : fr ? `Kit de marque \u00ab ${kit.name} \u00bb export\u00e9` : `Brand kit "${kit.name}" exported`);
  };

  // Export all brand kits
  const exportAllBrandKits = () => {
    const exportData = {
      brand_kits: brandKits.map(kit => ({
        name: kit.name,
        primary_color: kit.primary_color,
        secondary_color: kit.secondary_color,
        font_family: kit.font_family,
        tagline: kit.tagline,
        logo_url: kit.logo_url,
        is_default: kit.is_default,
      })),
      exported_at: new Date().toISOString(),
      version: "1.0"
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brand-kits-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(nl ? `${brandKits.length} merkpakket(ten) ge\u00ebxporteerd` : fr ? `${brandKits.length} kit(s) de marque export\u00e9(s)` : `${brandKits.length} brand kit(s) exported`);
  };

  // Import brand kits from file
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      let kitsToImport: Array<{
        name: string;
        primary_color: string;
        secondary_color: string;
        font_family?: string;
        tagline?: string;
        logo_url?: string;
        is_default?: boolean;
      }> = [];

      // Handle both single kit and multiple kits export format
      if (data.brand_kits && Array.isArray(data.brand_kits)) {
        kitsToImport = data.brand_kits;
      } else if (data.name && data.primary_color) {
        kitsToImport = [data];
      } else {
        throw new Error(nl ? "Ongeldig bestandsformaat" : fr ? "Format de fichier invalide" : "Invalid file format");
      }

      let imported = 0;
      let skipped = 0;

      for (const kit of kitsToImport) {
        // Check if name already exists
        const exists = brandKits.some(
          existing => existing.name.toLowerCase() === kit.name.toLowerCase()
        );

        if (exists) {
          skipped++;
          continue;
        }

        const { error } = await supabase
          .from('brand_kits')
          .insert({
            name: kit.name,
            primary_color: kit.primary_color || '#db2777',
            secondary_color: kit.secondary_color || '#7c3aed',
            font_family: kit.font_family || 'system-ui',
            tagline: kit.tagline || null,
            logo_url: kit.logo_url || null,
            is_default: false, // Never import as default
          });

        if (!error) {
          imported++;
        }
      }

      if (imported > 0) {
        toast.success(
          nl
            ? `${imported} merkpakket(ten) ge\u00efmporteerd${skipped > 0 ? `, ${skipped} overgeslagen (al aanwezig)` : ''}`
            : fr
              ? `${imported} kit(s) de marque import\u00e9(s)${skipped > 0 ? `, ${skipped} ignor\u00e9(s) (d\u00e9j\u00e0 pr\u00e9sent(s))` : ''}`
              : `${imported} brand kit(s) imported${skipped > 0 ? `, ${skipped} skipped (already exist)` : ''}`
        );
        fetchBrandKits();
      } else if (skipped > 0) {
        toast.warning(nl ? `Alle ${skipped} merkpakket(ten) bestaan al` : fr ? `Les ${skipped} kit(s) de marque existent d\u00e9j\u00e0` : `All ${skipped} brand kit(s) already exist`);
      } else {
        toast.error(nl ? "Geen merkpakketten gevonden in bestand" : fr ? "Aucun kit de marque trouv\u00e9 dans le fichier" : "No brand kits found in file");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error(nl ? "Kon bestand niet importeren. Controleer het formaat." : fr ? "Impossible d\u2019importer le fichier. V\u00e9rifiez le format." : "Could not import file. Check the format.");
    } finally {
      setImporting(false);
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full">
      <main className="space-y-6">
        <div className="w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Palette className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{nl ? 'Merkpakketten' : fr ? 'Kits de Marque' : 'Brand Kits'}</h1>
                <p className="text-sm text-muted-foreground">
                  {nl ? 'Beheer je merken met kleuren, logo\'s en fonts' : fr ? 'G\u00e9rez vos marques avec couleurs, logos et polices' : 'Manage your brands with colors, logos and fonts'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Import */}
              <Button
                variant="outline"
                onClick={() => importInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FileUp className="w-4 h-4 mr-2" />
                )}
                {nl ? 'Importeren' : fr ? 'Importer' : 'Import'}
              </Button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />

              {/* Export All */}
              {brandKits.length > 0 && (
                <Button variant="outline" onClick={exportAllBrandKits}>
                  <Download className="w-4 h-4 mr-2" />
                  {nl ? 'Alles Exporteren' : fr ? 'Tout Exporter' : 'Export All'}
                </Button>
              )}

              {/* New Brand Kit */}
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    {nl ? 'Nieuw Merkpakket' : fr ? 'Nouveau Kit de Marque' : 'New Brand Kit'}
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editing
                      ? (nl ? 'Merkpakket Bewerken' : fr ? 'Modifier le Kit de Marque' : 'Edit Brand Kit')
                      : (nl ? 'Nieuw Merkpakket' : fr ? 'Nouveau Kit de Marque' : 'New Brand Kit')}
                  </DialogTitle>
                  <DialogDescription>
                    {nl ? 'Configureer je merk met kleuren, logo en lettertype' : fr ? 'Configurez votre marque avec couleurs, logo et police' : 'Configure your brand with colors, logo and font'}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{nl ? 'Naam' : fr ? 'Nom' : 'Name'} *</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={nl ? 'Bijv. Inclufy Solutions' : fr ? 'Ex. Inclufy Solutions' : 'E.g. Inclufy Solutions'}
                    />
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{nl ? 'Primaire Kleur' : fr ? 'Couleur Primaire' : 'Primary Color'}</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-12 h-10 rounded border border-border cursor-pointer"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          placeholder="#db2777"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{nl ? 'Secundaire Kleur' : fr ? 'Couleur Secondaire' : 'Secondary Color'}</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-12 h-10 rounded border border-border cursor-pointer"
                        />
                        <Input
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          placeholder="#7c3aed"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview gradient */}
                  <div
                    className="h-16 rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                    }}
                  />

                  {/* Font */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{nl ? 'Lettertype' : fr ? 'Police' : 'Font'}</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm"
                    >
                      {fontOptions.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tagline */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{nl ? 'Tagline' : fr ? 'Slogan' : 'Tagline'}</label>
                    <Input
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder={nl ? 'Bijv. Your inclusive partner' : fr ? 'Ex. Your inclusive partner' : 'E.g. Your inclusive partner'}
                    />
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo</label>
                    <div className="flex items-center gap-4">
                      {logoPreview ? (
                        <div className="relative w-16 h-16 rounded-lg border border-border overflow-hidden bg-muted">
                          <img
                            src={logoPreview}
                            alt={nl ? 'Logo voorbeeld' : fr ? 'Aper\u00e7u du logo' : 'Logo preview'}
                            className="w-full h-full object-contain"
                          />
                          <button
                            onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                        >
                          <Upload className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {nl ? 'Logo Uploaden' : fr ? 'T\u00e9l\u00e9charger le Logo' : 'Upload Logo'}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    {nl ? 'Annuleren' : fr ? 'Annuler' : 'Cancel'}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-primary to-purple-600"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {nl ? 'Opslaan...' : fr ? 'Enregistrement...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {nl ? 'Opslaan' : fr ? 'Enregistrer' : 'Save'}
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Brand Kits Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : brandKits.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Palette className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {nl ? 'Geen merkpakketten gevonden' : fr ? 'Aucun kit de marque trouv\u00e9' : 'No brand kits found'}
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {nl ? 'Maak je eerste merkpakket aan om te beginnen' : fr ? 'Cr\u00e9ez votre premier kit de marque pour commencer' : 'Create your first brand kit to get started'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {brandKits.map((kit) => (
                <Card key={kit.id} className="overflow-hidden group">
                  {/* Gradient header */}
                  <div
                    className="h-24 relative"
                    style={{
                      background: `linear-gradient(135deg, ${kit.primary_color}, ${kit.secondary_color})`
                    }}
                  >
                    {kit.is_default && (
                      <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                        <Star className="w-3 h-3 text-white fill-white" />
                        <span className="text-xs text-white font-medium">{nl ? 'Standaard' : fr ? 'Par D\u00e9faut' : 'Default'}</span>
                      </div>
                    )}
                    {kit.logo_url && (
                      <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                        <div className="w-16 h-16 rounded-xl bg-background shadow-lg border border-border overflow-hidden">
                          <img
                            src={kit.logo_url}
                            alt={kit.name}
                            className="w-full h-full object-contain p-2"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <CardContent className={`pt-${kit.logo_url ? '10' : '4'} pb-4`}>
                    <div className={kit.logo_url ? 'mt-6' : ''}>
                      <h3 className="text-lg font-semibold text-foreground">{kit.name}</h3>
                      {kit.tagline && (
                        <p className="text-sm text-muted-foreground mt-1">{kit.tagline}</p>
                      )}

                      {/* Color swatches */}
                      <div className="flex items-center gap-2 mt-3">
                        <div
                          className="w-6 h-6 rounded-full border border-border"
                          style={{ backgroundColor: kit.primary_color }}
                          title={kit.primary_color}
                        />
                        <div
                          className="w-6 h-6 rounded-full border border-border"
                          style={{ backgroundColor: kit.secondary_color }}
                          title={kit.secondary_color}
                        />
                        <span className="text-xs text-muted-foreground ml-2">
                          {fontOptions.find(f => f.value === kit.font_family)?.label || 'System'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(kit)}
                          className="flex-1"
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          {nl ? 'Bewerken' : fr ? 'Modifier' : 'Edit'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => exportBrandKit(kit)}
                          className="text-muted-foreground hover:text-primary"
                          title={nl ? 'Exporteren' : fr ? 'Exporter' : 'Export'}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {!kit.is_default && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAsDefault(kit.id)}
                              className="text-muted-foreground hover:text-yellow-500"
                              title={nl ? 'Standaard maken' : fr ? 'D\u00e9finir par d\u00e9faut' : 'Set as default'}
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(kit.id)}
                              disabled={deleting === kit.id}
                              className="text-muted-foreground hover:text-red-500"
                              title={nl ? 'Verwijderen' : fr ? 'Supprimer' : 'Delete'}
                            >
                              {deleting === kit.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BrandKits;
