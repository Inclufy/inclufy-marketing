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
import api from '@/lib/api';

const STYLES = [
  { value: 'professional', label: 'Professional / Corporate' },
  { value: 'creative', label: 'Creative / Artistic' },
  { value: 'minimal', label: 'Minimal / Clean' },
  { value: 'bold', label: 'Bold / Vibrant' },
  { value: 'photographic', label: 'Photographic / Realistic' },
];

const SIZES = [
  { value: '1024x1024', label: 'Square (1024x1024)' },
  { value: '1792x1024', label: 'Landscape (1792x1024)' },
  { value: '1024x1792', label: 'Portrait (1024x1792)' },
];

export default function ImageGenerator() {
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
      const res = await api.post('/content/image', {
        prompt: prompt.trim(),
        style,
        size,
      });
      const data = typeof res.data.result === 'string'
        ? JSON.parse(res.data.result)
        : res.data;
      setImageUrl(data.url || data.image_url || data.result?.url);
    } catch (err: any) {
      // If backend doesn't have image endpoint yet, show placeholder
      const placeholderUrl = `https://placehold.co/${size.replace('x', 'x')}/7c3aed/ffffff?text=${encodeURIComponent(prompt.slice(0, 30))}`;
      setImageUrl(placeholderUrl);
      toast({
        title: 'Using preview placeholder',
        description: 'Image generation API not configured. Showing a placeholder preview.',
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
      await api.post('/content-library/', {
        title: prompt.slice(0, 80),
        content_type: 'image',
        content: { image_url: imageUrl, prompt, style, size },
        metadata: { style, size },
        tags: ['image', style],
      });
      toast({ title: 'Saved to Content Library' });
    } catch (err: any) {
      toast({
        title: 'Save failed',
        description: err.response?.data?.detail || 'Could not save',
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
          Image Generator
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create marketing visuals with AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <Card className="lg:col-span-1 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-purple-600" />
              Configure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Describe the image</label>
              <Textarea
                placeholder="e.g., A modern, clean hero banner for a SaaS marketing platform with purple gradients..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Style</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Size</label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
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
                  Generating...
                </>
              ) : (
                <>
                  <Image className="h-4 w-4 mr-2" />
                  Generate Image
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
                <CardTitle>Generated Image</CardTitle>
                <CardDescription>
                  {imageUrl ? 'Your AI-generated image' : 'Your image will appear here'}
                </CardDescription>
              </div>
              {imageUrl && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSaveToLibrary} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Regenerate
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
                  <p className="text-gray-500">Creating your image...</p>
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
                  <p className="text-gray-500 mb-1">Ready to create</p>
                  <p className="text-sm text-gray-400">
                    Describe the image you need and hit Generate
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
