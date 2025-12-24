import { useState } from 'react';
import { Sparkles, Loader2, Wand2, Brain, Lightbulb, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAI } from '@/hooks/use-ai';

interface AIAssistantProps {
  onContentGenerated?: (content: any) => void;
  contentType?: 'tutorial' | 'commercial' | 'social';
  currentContent?: string;
}

export const AIAssistant = ({ 
  onContentGenerated, 
  contentType = 'tutorial',
  currentContent = ''
}: AIAssistantProps) => {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<'twitter' | 'linkedin' | 'instagram'>('twitter');
  const [style, setStyle] = useState('professional');
  const [duration, setDuration] = useState<'30s' | '60s' | '90s'>('30s');
  const [activeTab, setActiveTab] = useState('generate');

  const { 
    loading, 
    generateTutorial, 
    generateCommercial, 
    generateSocialPost,
    improveContent,
    generateIdeas,
    analyzeContent
  } = useAI({
    onSuccess: (result) => {
      onContentGenerated?.(result);
    }
  });

  const handleGenerateTutorial = async () => {
    if (!topic.trim()) return;
    const result = await generateTutorial(topic);
    onContentGenerated?.(result);
  };

  const handleGenerateCommercial = async () => {
    if (!topic.trim()) return;
    const result = await generateCommercial(topic, duration, style);
    onContentGenerated?.(result);
  };

  const handleGenerateSocial = async () => {
    if (!topic.trim()) return;
    const result = await generateSocialPost(topic, platform, style);
    onContentGenerated?.(result);
  };

  const handleImproveContent = async (goal: 'clarity' | 'engagement' | 'seo' | 'conversion') => {
    if (!currentContent.trim()) return;
    const result = await improveContent(currentContent, goal);
    onContentGenerated?.({ improvedContent: result });
  };

  const handleGenerateIdeas = async () => {
    if (!topic.trim()) return;
    const result = await generateIdeas(topic, 5);
    onContentGenerated?.({ ideas: result });
  };

  const handleAnalyzeContent = async () => {
    if (!currentContent.trim()) return;
    const result = await analyzeContent(currentContent);
    onContentGenerated?.({ analysis: result });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Content Assistant
        </CardTitle>
        <CardDescription>
          Generate, improve, and analyze your marketing content with AI
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="improve" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Improve
            </TabsTrigger>
            <TabsTrigger value="analyze" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Analyze
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4 mt-4">
            {contentType === 'tutorial' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">What tutorial would you like to create?</label>
                  <Textarea
                    placeholder="E.g., How to set up Google Analytics for beginners"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button 
                  onClick={handleGenerateTutorial} 
                  disabled={loading || !topic.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Tutorial
                </Button>
              </div>
            )}

            {contentType === 'commercial' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Product or Service</label>
                  <Textarea
                    placeholder="E.g., Eco-friendly water bottles"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Duration</label>
                    <Select value={duration} onValueChange={(v) => setDuration(v as any)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30s">30 seconds</SelectItem>
                        <SelectItem value="60s">60 seconds</SelectItem>
                        <SelectItem value="90s">90 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tone</label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="humorous">Humorous</SelectItem>
                        <SelectItem value="inspirational">Inspirational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={handleGenerateCommercial} 
                  disabled={loading || !topic.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Commercial Script
                </Button>
              </div>
            )}

            {contentType === 'social' && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">What's your post about?</label>
                  <Textarea
                    placeholder="E.g., Announcing our new product launch"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Platform</label>
                    <Select value={platform} onValueChange={(v) => setPlatform(v as any)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twitter">Twitter/X</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Style</label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="engaging">Engaging</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button 
                  onClick={handleGenerateSocial} 
                  disabled={loading || !topic.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Social Post
                </Button>
              </div>
            )}

            <div className="border-t pt-4">
              <Button 
                variant="outline" 
                onClick={handleGenerateIdeas}
                disabled={loading || !topic.trim()}
                className="w-full"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Generate Content Ideas
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="improve" className="space-y-4 mt-4">
            {currentContent ? (
              <>
                <div className="text-sm text-muted-foreground">
                  Improve your current content for:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleImproveContent('clarity')}
                    disabled={loading}
                  >
                    🎯 Clarity
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleImproveContent('engagement')}
                    disabled={loading}
                  >
                    ✨ Engagement
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleImproveContent('seo')}
                    disabled={loading}
                  >
                    📈 SEO
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleImproveContent('conversion')}
                    disabled={loading}
                  >
                    💰 Conversion
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Create some content first, then come back to improve it!
              </div>
            )}
          </TabsContent>

          <TabsContent value="analyze" className="space-y-4 mt-4">
            {currentContent ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Get AI insights about your content
                </div>
                <Button
                  onClick={handleAnalyzeContent}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Analyze Content
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Create some content first, then analyze it for insights!
              </div>
            )}
          </TabsContent>
        </Tabs>

        {loading && (
          <div className="mt-4">
            <Progress value={33} className="animate-pulse" />
            <p className="text-sm text-center mt-2 text-muted-foreground">
              AI is thinking...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
