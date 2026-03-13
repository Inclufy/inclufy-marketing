// src/pages/ImageGenerator.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Image, Loader2, Download, Copy, Save, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const STYLES_DATA = [
  { value: 'professional', en: 'Professional / Corporate', nl: 'Professioneel / Zakelijk', fr: 'Professionnel / Entreprise' },
  { value: 'creative', en: 'Creative / Artistic', nl: 'Creatief / Artistiek', fr: 'Créatif / Artistique' },
  { value: 'minimal', en: 'Minimal / Clean', nl: 'Minimaal / Strak', fr: 'Minimal / Épuré' },
  { value: 'bold', en: 'Bold / Vibrant', nl: 'Vet / Levendig', fr: 'Audacieux / Vibrant' },
  { value: 'photographic', en: 'Photographic / Realistic', nl: 'Fotografisch / Realistisch', fr: 'Photographique / Réaliste' },
];

const SIZES_DATA = [
  { value: '1024x1024', en: 'Square (1024x1024)', nl: 'Vierkant (1024x1024)', fr: 'Carré (1024x1024)' },
  { value: '1792x1024', en: 'Landscape (1792x1024)', nl: 'Liggend (1792x1024)', fr: 'Paysage (1792x1024)' },
  { value: '1024x1792', en: 'Portrait (1024x1792)', nl: 'Staand (1024x1792)', fr: 'Portrait (1024x1792)' },
];

export default function ImageGenerator() {
  const { lang } = useLanguage(); const nl = lang === 'nl'; const fr = lang === 'fr';
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('professional');
  const [size, setSize] = useState('1024x1024');
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    try {
      setGenerating(true);
      setImageUrl(null);
      const { data: fnData, error: fnError } = await supabase.functions.invoke('ai-image', {
        body: { prompt: prompt.trim(), style, size },
      });
      if (fnError) throw fnError;
      setImageUrl(fnData?.url || fnData?.image_url || fnData?.result?.url);
    } catch (err: any) {
      // If backend doesn't have image endpoint yet, show placeholder
      const placeholderUrl = `https://placehold.co/${size.replace('x', 'x')}/7c3aed/ffffff?text=${encodeURIComponent(prompt.slice(0, 30))}`;
      setImageUrl(placeholderUrl);
      toast({
        title: nl ? 'Voorbeeldweergave wordt gebruikt' : fr ? 'Utilisation de l\'aperçu fictif' : 'Using preview placeholder',
        description: nl ? 'Afbeeldingsgeneratie API niet geconfigureerd. Voorbeeldweergave wordt getoond.' : fr ? 'API de génération d\'images non configurée. Affichage d\'un aperçu fictif.' : 'Image generation API not configured. Showing a placeholder preview.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `ai-image-${Date.now()}.png`;
    a.target = '_blank';
    a.click();
  };

  const handleSaveToLibrary = async () => {
    if (!imageUrl) return;
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await supabase.from('content_items').insert({
        user_id: user.id,
        title: prompt.slice(0, 80),
        type: 'image',
        content: JSON.stringify({ image_url: imageUrl, prompt, style, size }),
        metadata: { style, size },
        tags: ['image', style],
      });
      toast({ title: nl ? 'Opgeslagen in contentbibliotheek' : fr ? 'Enregistré dans la bibliothèque de contenu' : 'Saved to Content Library' });
    } catch (err: any) {
      toast({
        title: nl ? 'Opslaan mislukt' : fr ? 'Échec de l\'enregistrement' : 'Save failed',
        description: err.response?.data?.detail || (nl ? 'Kan niet opslaan' : fr ? 'Impossible d\'enregistrer' : 'Could not save'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
          {nl ? "Afbeelding Generator" : fr ? "Générateur d'images" : "Image Generator"}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {nl ? "Maak marketingvisuals met AI" : fr ? "Créez des visuels marketing avec l'IA" : "Create marketing visuals with AI"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-purple-600" />
              {nl ? "Configureren" : fr ? "Configurer" : "Configure"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{nl ? "Beschrijf de afbeelding" : fr ? "Décrivez l'image" : "Describe the image"}</label>
              <Textarea
                placeholder={nl ? "bijv. Een moderne, strakke hero banner voor een SaaS marketingplatform met paarse gradiënten..." : fr ? "ex. Une bannière hero moderne et épurée pour une plateforme marketing SaaS avec des dégradés violets..." : "e.g., A modern, clean hero banner for a SaaS marketing platform with purple gradients..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{nl ? "Stijl" : fr ? "Style" : "Style"}</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLES_DATA.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{nl ? s.nl : fr ? s.fr : s.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{nl ? "Formaat" : fr ? "Taille" : "Size"}</label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZES_DATA.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{nl ? s.nl : fr ? s.fr : s.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {nl ? "Genereren..." : fr ? "Génération..." : "Generating..."}
                </>
              ) : (
                <>
                  <Image className="h-4 w-4 mr-2" />
                  {nl ? "Genereer afbeelding" : fr ? "Générer l'image" : "Generate Image"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card className="lg:col-span-2 border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{nl ? "Gegenereerde afbeelding" : fr ? "Image générée" : "Generated Image"}</CardTitle>
                <CardDescription>
                  {imageUrl ? (nl ? 'Je AI-gegenereerde afbeelding' : fr ? 'Votre image générée par l\'IA' : 'Your AI-generated image') : (nl ? 'Je afbeelding verschijnt hier' : fr ? 'Votre image apparaîtra ici' : 'Your image will appear here')}
                </CardDescription>
              </div>
              {imageUrl && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    {nl ? "Downloaden" : fr ? "Télécharger" : "Download"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSaveToLibrary} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    {nl ? "Opslaan" : fr ? "Enregistrer" : "Save"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    {nl ? "Opnieuw genereren" : fr ? "Régénérer" : "Regenerate"}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generating ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
                  <p className="text-gray-500">{nl ? "Je afbeelding wordt gemaakt..." : fr ? "Création de votre image..." : "Creating your image..."}</p>
                </div>
              </div>
            ) : imageUrl ? (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden border bg-gray-50 dark:bg-gray-900">
                  <img
                    src={imageUrl}
                    alt={prompt}
                    className="w-full h-auto object-contain max-h-[600px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{style}</Badge>
                  <Badge variant="secondary">{size}</Badge>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mx-auto mb-4">
                    <Image className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-gray-500 mb-1">{nl ? "Klaar om te maken" : fr ? "Prêt à créer" : "Ready to create"}</p>
                  <p className="text-sm text-gray-400">
                    {nl ? "Beschrijf de afbeelding die je nodig hebt en klik op Genereer" : fr ? "Décrivez l'image dont vous avez besoin et cliquez sur Générer" : "Describe the image you need and hit Generate"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
