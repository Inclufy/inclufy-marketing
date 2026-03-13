// src/pages/AIWriter.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sparkles, Loader2, Copy, Save, FileText, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

export default function AIWriter() {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const CONTENT_TYPES = [
    { value: 'blog', label: nl ? 'Blogpost' : fr ? 'Article de blog' : 'Blog Post' },
    { value: 'article', label: nl ? 'Artikel' : fr ? 'Article' : 'Article' },
    { value: 'ad_copy', label: nl ? 'Advertentietekst' : fr ? 'Texte publicitaire' : 'Ad Copy' },
    { value: 'product_description', label: nl ? 'Productbeschrijving' : fr ? 'Description de produit' : 'Product Description' },
    { value: 'press_release', label: nl ? 'Persbericht' : fr ? 'Communiqué de presse' : 'Press Release' },
    { value: 'script', label: nl ? 'Video-/Audioscript' : fr ? 'Script vidéo/audio' : 'Video/Audio Script' },
  ];

  const TONES = [
    { value: 'professional', label: nl ? 'Professioneel' : fr ? 'Professionnel' : 'Professional' },
    { value: 'casual', label: nl ? 'Informeel' : fr ? 'Décontracté' : 'Casual' },
    { value: 'persuasive', label: nl ? 'Overtuigend' : fr ? 'Persuasif' : 'Persuasive' },
    { value: 'informative', label: nl ? 'Informatief' : fr ? 'Informatif' : 'Informative' },
    { value: 'enthusiastic', label: nl ? 'Enthousiast' : fr ? 'Enthousiaste' : 'Enthusiastic' },
    { value: 'authoritative', label: nl ? 'Gezaghebbend' : fr ? 'Autoritaire' : 'Authoritative' },
  ];

  const LENGTHS = [
    { value: 'short', label: nl ? 'Kort (200-300 woorden)' : fr ? 'Court (200-300 mots)' : 'Short (200-300 words)' },
    { value: 'medium', label: nl ? 'Gemiddeld (500-700 woorden)' : fr ? 'Moyen (500-700 mots)' : 'Medium (500-700 words)' },
    { value: 'long', label: nl ? 'Lang (1000-1500 woorden)' : fr ? 'Long (1000-1500 mots)' : 'Long (1000-1500 words)' },
  ];
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState('blog');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    content: string;
    summary: string;
    word_count: number;
  } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    try {
      setGenerating(true);
      setResult(null);
      const { data: fnData, error: fnError } = await supabase.functions.invoke('ai-write', {
        body: { prompt: prompt.trim(), content_type: contentType, tone, length },
      });
      if (fnError) throw fnError;
      const parsed = typeof fnData?.result === 'string'
        ? JSON.parse(fnData.result)
        : fnData?.result || fnData;
      setResult(parsed);
    } catch (err: any) {
      toast({
        title: nl ? 'Genereren mislukt' : fr ? 'Échec de la génération' : 'Generation failed',
        description: err.response?.data?.detail || err.message || (nl ? 'Kon content niet genereren' : fr ? 'Impossible de générer le contenu' : 'Could not generate content'),
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.content);
    toast({ title: nl ? 'Gekopieerd naar klembord' : fr ? 'Copié dans le presse-papiers' : 'Copied to clipboard' });
  };

  const handleSaveToLibrary = async () => {
    if (!result) return;
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      await supabase.from('content_items').insert({
        user_id: user.id,
        title: result.title,
        type: contentType === 'blog' ? 'blog' : 'other',
        content: JSON.stringify({ markdown: result.content, summary: result.summary }),
        metadata: { tone, length, word_count: result.word_count, prompt },
        tags: [contentType, tone],
      });
      toast({ title: nl ? 'Opgeslagen in Contentbibliotheek' : fr ? 'Enregistré dans la bibliothèque de contenu' : 'Saved to Content Library' });
    } catch (err: any) {
      toast({
        title: nl ? 'Opslaan mislukt' : fr ? 'Échec de l\'enregistrement' : 'Save failed',
        description: err.response?.data?.detail || (nl ? 'Kon niet opslaan' : fr ? 'Impossible d\'enregistrer' : 'Could not save'),
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
          {nl ? 'AI Schrijver' : fr ? 'Rédacteur IA' : 'AI Writer'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {nl ? 'Genereer overtuigende marketingcontent met AI' : fr ? 'Générez du contenu marketing percutant avec l\'IA' : 'Generate compelling marketing content with AI'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              {nl ? 'Configureer' : fr ? 'Configurer' : 'Configure'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{nl ? 'Waarover wil je schrijven?' : fr ? 'Sur quoi voulez-vous écrire ?' : 'What do you want to write about?'}</label>
              <Textarea
                placeholder={nl ? 'bijv. De voordelen van AI-gestuurde marketingautomatisering voor kleine bedrijven...' : fr ? 'p. ex. Les avantages de l\'automatisation marketing par IA pour les petites entreprises...' : 'e.g., The benefits of AI-powered marketing automation for small businesses...'}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{nl ? 'Contenttype' : fr ? 'Type de contenu' : 'Content Type'}</label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>
                      {ct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{nl ? 'Toon' : fr ? 'Ton' : 'Tone'}</label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{nl ? 'Lengte' : fr ? 'Longueur' : 'Length'}</label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LENGTHS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
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
                  {nl ? 'Genereren...' : fr ? 'Génération...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {nl ? 'Content genereren' : fr ? 'Générer du contenu' : 'Generate Content'}
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
                <CardTitle>{nl ? 'Gegenereerde content' : fr ? 'Contenu généré' : 'Generated Content'}</CardTitle>
                <CardDescription>
                  {result
                    ? `${result.word_count || '~'} ${nl ? 'woorden' : fr ? 'mots' : 'words'}`
                    : nl ? 'Je AI-gegenereerde content verschijnt hier' : fr ? 'Votre contenu généré par IA apparaîtra ici' : 'Your AI-generated content will appear here'}
                </CardDescription>
              </div>
              {result && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-1" />
                    {nl ? 'Kopiëren' : fr ? 'Copier' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSaveToLibrary} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    {nl ? 'Opslaan' : fr ? 'Enregistrer' : 'Save'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    {nl ? 'Opnieuw genereren' : fr ? 'Régénérer' : 'Regenerate'}
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
                  <p className="text-gray-500">{nl ? 'Je content wordt gegenereerd...' : fr ? 'Génération de votre contenu...' : 'Generating your content...'}</p>
                </div>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold">{result.title}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="capitalize">{contentType.replace('_', ' ')}</Badge>
                    <Badge variant="outline" className="capitalize">{tone}</Badge>
                    {result.word_count && (
                      <Badge variant="secondary">{result.word_count} {nl ? 'woorden' : fr ? 'mots' : 'words'}</Badge>
                    )}
                  </div>
                </div>
                {result.summary && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic border-l-4 border-purple-300 pl-3">
                    {result.summary}
                  </p>
                )}
                <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 min-h-[300px]">
                  {result.content}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-gray-500 mb-1">{nl ? 'Klaar om te creëren' : fr ? 'Prêt à créer' : 'Ready to create'}</p>
                  <p className="text-sm text-gray-400">
                    {nl ? 'Beschrijf wat je wilt schrijven en klik op Genereren' : fr ? 'Décrivez ce que vous voulez écrire et cliquez sur Générer' : 'Describe what you want to write and hit Generate'}
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
