// src/components/context-marketing/ContentStudio.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Sparkles,
  Copy,
  Download,
  Eye,
  Edit3,
  Settings,
  Globe,
  Mail,
  MessageSquare,
  Video,
  Image,
  Calendar,
  Hash,
  TrendingUp,
  Wand2,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Save,
  Send
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { contentGenerationService, GeneratedContent, ContentTemplate, BrandVoice } from '@/services/context-marketing/content-generation.service';
import { toast } from 'sonner';

interface ContentStudioProps {
  onPublish?: (content: GeneratedContent) => void;
}

export default function ContentStudio({ onPublish }: ContentStudioProps) {
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState('email');
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [brandVoices, setBrandVoices] = useState<BrandVoice[]>([]);
  const [selectedBrandVoice, setSelectedBrandVoice] = useState<string>('');
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [showBrandVoiceDialog, setShowBrandVoiceDialog] = useState(false);
  
  // Content generation settings
  const [settings, setSettings] = useState({
    tone: 'professional',
    length: 'medium',
    includeEmojis: false,
    includeCTA: true,
    optimizeFor: 'engagement'
  });

  useEffect(() => {
    loadBrandVoices();
    loadTemplates();
  }, []);

  const loadBrandVoices = async () => {
    try {
      const voices = await contentGenerationService.getBrandVoices();
      setBrandVoices(voices);
      const defaultVoice = voices.find(v => v.is_default);
      if (defaultVoice) {
        setSelectedBrandVoice(defaultVoice.id);
      }
    } catch (error) {
      console.error('Error loading brand voices:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const templatesData = await contentGenerationService.getTemplates();
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a content prompt');
      return;
    }

    setLoading(true);
    try {
      const content = await contentGenerationService.generateContent({
        type: contentType,
        prompt,
        brand_voice_id: selectedBrandVoice,
        settings
      });
      setGeneratedContent(content);
      setEditedContent(content.content);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const variations = await contentGenerationService.generateVariations(generatedContent!.id, 1);
      if (variations.length > 0) {
        setGeneratedContent(variations[0]);
        setEditedContent(variations[0].content);
        toast.success('New variation generated!');
      }
    } catch (error) {
      console.error('Error generating variation:', error);
      toast.error('Failed to generate variation');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) return;

    try {
      const updated = await contentGenerationService.updateContent(generatedContent.id, {
        content: editedContent
      });
      setGeneratedContent(updated);
      setEditMode(false);
      toast.success('Content saved!');
    } catch (error) {
      console.error('Error saving content:', error);
      toast.error('Failed to save content');
    }
  };

  const handlePublish = async () => {
    if (!generatedContent) return;

    try {
      await contentGenerationService.publishContent(generatedContent.id);
      toast.success('Content published successfully!');
      if (onPublish) {
        onPublish(generatedContent);
      }
    } catch (error) {
      console.error('Error publishing content:', error);
      toast.error('Failed to publish content');
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="w-5 h-5" />;
      case 'social': return <MessageSquare className="w-5 h-5" />;
      case 'blog': return <FileText className="w-5 h-5" />;
      case 'ad': return <Globe className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'landing': return <Globe className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const contentTypeOptions = [
    { value: 'email', label: 'Email Campaign', icon: Mail },
    { value: 'social', label: 'Social Media Post', icon: MessageSquare },
    { value: 'blog', label: 'Blog Article', icon: FileText },
    { value: 'ad', label: 'Ad Copy', icon: Globe },
    { value: 'video', label: 'Video Script', icon: Video },
    { value: 'landing', label: 'Landing Page', icon: Globe }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Wand2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Content Studio
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered content creation with your brand voice
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setShowBrandVoiceDialog(true)}>
          <Settings className="w-4 h-4 mr-2" />
          Brand Voice
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generation Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Content</CardTitle>
            <CardDescription>Create new content with AI assistance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Content Type Selection */}
            <div>
              <Label>Content Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {contentTypeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setContentType(option.value)}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                      contentType === option.value
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <option.icon className={`w-5 h-5 ${
                      contentType === option.value ? 'text-purple-600' : 'text-gray-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      contentType === option.value ? 'text-purple-600' : ''
                    }`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Brand Voice Selection */}
            <div>
              <Label htmlFor="brand-voice">Brand Voice</Label>
              <Select value={selectedBrandVoice} onValueChange={setSelectedBrandVoice}>
                <SelectTrigger id="brand-voice" className="mt-2">
                  <SelectValue placeholder="Select a brand voice" />
                </SelectTrigger>
                <SelectContent>
                  {brandVoices.map(voice => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name} {voice.is_default && <Badge className="ml-2">Default</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prompt Input */}
            <div>
              <Label htmlFor="prompt">Content Brief</Label>
              <Textarea
                id="prompt"
                placeholder={`Describe what you want to create. For example:\n"Write an email announcing our summer sale with 25% off all products"`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-2 min-h-[120px]"
              />
            </div>

            {/* Advanced Settings */}
            <div className="space-y-3 pt-4 border-t">
              <Label>Advanced Settings</Label>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="tone" className="text-sm">Tone</Label>
                <Select value={settings.tone} onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, tone: value }))
                }>
                  <SelectTrigger id="tone" className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="playful">Playful</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="length" className="text-sm">Length</Label>
                <Select value={settings.length} onValueChange={(value) => 
                  setSettings(prev => ({ ...prev, length: value }))
                }>
                  <SelectTrigger id="length" className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="long">Long</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="emojis" className="text-sm">Include Emojis</Label>
                <Switch
                  id="emojis"
                  checked={settings.includeEmojis}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, includeEmojis: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="cta" className="text-sm">Include CTA</Label>
                <Switch
                  id="cta"
                  checked={settings.includeCTA}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, includeCTA: checked }))
                  }
                />
              </div>
            </div>

            <Button 
              onClick={handleGenerate} 
              className="w-full" 
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview/Edit Panel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Content</CardTitle>
                <CardDescription>Review and edit your AI-generated content</CardDescription>
              </div>
              {generatedContent && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={loading}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generatedContent ? (
              <div className="space-y-4">
                {/* Performance Prediction */}
                {generatedContent.performance_prediction && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Performance Prediction</span>
                      <Badge>{generatedContent.performance_prediction.confidence}% confidence</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-purple-600">
                          {generatedContent.performance_prediction.engagement_rate}%
                        </p>
                        <p className="text-xs text-gray-600">Engagement Rate</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {generatedContent.performance_prediction.click_rate}%
                        </p>
                        <p className="text-xs text-gray-600">Click Rate</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">
                          {generatedContent.performance_prediction.conversion_rate}%
                        </p>
                        <p className="text-xs text-gray-600">Conversion Rate</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Preview/Edit */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Content</Label>
                    <Badge variant="outline">
                      {getContentTypeIcon(generatedContent.content_type)}
                      {generatedContent.content_type}
                    </Badge>
                  </div>
                  {editMode ? (
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                    />
                  ) : (
                    <div className="prose dark:prose-invert max-w-none p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div dangerouslySetInnerHTML={{ __html: generatedContent.content }} />
                    </div>
                  )}
                </div>

                {/* Metadata */}
                {generatedContent.metadata && (
                  <div className="space-y-2 pt-4 border-t">
                    {generatedContent.metadata.keywords && (
                      <div>
                        <Label className="text-xs">Keywords</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {generatedContent.metadata.keywords.map((keyword: string, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              <Hash className="w-3 h-3 mr-1" />
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {editMode && (
                      <Button onClick={handleSave} size="sm">
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                    )}
                    <Button onClick={handlePublish} size="sm">
                      <Send className="w-4 h-4 mr-1" />
                      Publish
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Wand2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  Generate content to see it here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle>Content Templates</CardTitle>
          <CardDescription>Start with pre-built templates for common use cases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.slice(0, 6).map(template => (
              <button
                key={template.id}
                onClick={() => {
                  setContentType(template.content_type);
                  setPrompt(template.prompt_template);
                }}
                className="p-4 border rounded-lg hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  {getContentTypeIcon(template.content_type)}
                  <div className="flex-1">
                    <h4 className="font-medium">{template.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {template.category}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Used {template.use_count} times
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Brand Voice Dialog */}
      <Dialog open={showBrandVoiceDialog} onOpenChange={setShowBrandVoiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Brand Voice Settings</DialogTitle>
            <DialogDescription>
              Configure how AI should represent your brand
            </DialogDescription>
          </DialogHeader>
          {/* Brand voice configuration would go here */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBrandVoiceDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowBrandVoiceDialog(false)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}