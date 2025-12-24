import { useState } from 'react';
import { Presentation, Globe, Building2, Target, Loader2, Download, ChevronRight, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAI } from '@/hooks/use-ai';
import { Separator } from '@/components/ui/separator';

interface PresentationGeneratorProps {
  onPresentationGenerated?: (presentation: any) => void;
}

export const PresentationGenerator = ({ onPresentationGenerated }: PresentationGeneratorProps) => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [prospectInfo, setProspectInfo] = useState({
    companyName: '',
    industry: '',
    painPoints: '',
    goals: '',
    contactPerson: '',
    budget: ''
  });
  const [generatedPresentation, setGeneratedPresentation] = useState<any>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const { 
    loading, 
    analyzeWebsiteAndGeneratePresentation,
    researchProspect 
  } = useAI({
    onSuccess: (result) => {
      setGeneratedPresentation(result);
      onPresentationGenerated?.(result);
    }
  });

  const handleGeneratePresentation = async () => {
    if (!websiteUrl || !prospectInfo.companyName) return;

    const context = {
      companyName: prospectInfo.companyName,
      industry: prospectInfo.industry,
      painPoints: prospectInfo.painPoints ? prospectInfo.painPoints.split(',').map(p => p.trim()) : [],
      goals: prospectInfo.goals ? prospectInfo.goals.split(',').map(g => g.trim()) : [],
      contactPerson: prospectInfo.contactPerson,
      budget: prospectInfo.budget
    };

    await analyzeWebsiteAndGeneratePresentation(websiteUrl, context);
  };

  const handleQuickResearch = async () => {
    if (!prospectInfo.companyName) return;
    
    const research = await researchProspect(prospectInfo.companyName);
    setProspectInfo({
      ...prospectInfo,
      industry: research.industry,
      painPoints: research.likelyPainPoints.join(', '),
      goals: research.opportunities.join(', ')
    });
  };

  const exportPresentation = () => {
    if (!generatedPresentation) return;
    
    // Create a formatted text version of the presentation
    const content = `${generatedPresentation.presentation.title}\n\n` +
      `Executive Summary:\n${generatedPresentation.presentation.executiveSummary}\n\n` +
      generatedPresentation.presentation.slides.map((slide: any, i: number) => 
        `Slide ${i + 1}: ${slide.title}\n` +
        slide.content.map((point: string) => `• ${point}`).join('\n') +
        `\n\nSpeaker Notes: ${slide.speakerNotes}\n\n`
      ).join('---\n\n');

    // Download as text file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentation-${prospectInfo.companyName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            AI Presentation Generator
          </CardTitle>
          <CardDescription>
            Analyze any website and generate a personalized sales presentation for your prospect
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!generatedPresentation ? (
            <>
              {/* Website URL Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website URL to Analyze
                </Label>
                <Input
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>

              <Separator />

              {/* Prospect Information */}
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Prospect Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name *</Label>
                    <Input
                      placeholder="Acme Corporation"
                      value={prospectInfo.companyName}
                      onChange={(e) => setProspectInfo({...prospectInfo, companyName: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., SaaS, E-commerce"
                        value={prospectInfo.industry}
                        onChange={(e) => setProspectInfo({...prospectInfo, industry: e.target.value})}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleQuickResearch}
                        disabled={!prospectInfo.companyName || loading}
                        title="Research company"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input
                      placeholder="John Doe"
                      value={prospectInfo.contactPerson}
                      onChange={(e) => setProspectInfo({...prospectInfo, contactPerson: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Budget Range</Label>
                    <Input
                      placeholder="$10k-50k"
                      value={prospectInfo.budget}
                      onChange={(e) => setProspectInfo({...prospectInfo, budget: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pain Points (comma-separated)</Label>
                  <Textarea
                    placeholder="Slow processes, High costs, Poor integration..."
                    value={prospectInfo.painPoints}
                    onChange={(e) => setProspectInfo({...prospectInfo, painPoints: e.target.value})}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Goals (comma-separated)</Label>
                  <Textarea
                    placeholder="Increase efficiency, Reduce costs, Scale operations..."
                    value={prospectInfo.goals}
                    onChange={(e) => setProspectInfo({...prospectInfo, goals: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>

              <Button
                onClick={handleGeneratePresentation}
                disabled={loading || !websiteUrl || !prospectInfo.companyName}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing website and generating presentation...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Presentation
                  </>
                )}
              </Button>

              {loading && (
                <div className="space-y-2">
                  <Progress value={33} className="animate-pulse" />
                  <p className="text-sm text-center text-muted-foreground">
                    This may take a moment as we analyze the website...
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Generated Presentation View */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{generatedPresentation.presentation.title}</h2>
                    <p className="text-muted-foreground mt-1">
                      Generated for {prospectInfo.companyName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setGeneratedPresentation(null)}>
                      Generate New
                    </Button>
                    <Button onClick={exportPresentation}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Analysis Summary */}
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Website Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Key Features</p>
                      <div className="flex flex-wrap gap-1">
                        {generatedPresentation.analysis.productFeatures.map((feature: string, i: number) => (
                          <Badge key={i} variant="secondary">{feature}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Unique Selling Points</p>
                      <div className="flex flex-wrap gap-1">
                        {generatedPresentation.analysis.uniqueSellingPoints.map((usp: string, i: number) => (
                          <Badge key={i} variant="default">{usp}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Executive Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Executive Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{generatedPresentation.presentation.executiveSummary}</p>
                  </CardContent>
                </Card>

                {/* Slides */}
                <Tabs value={`slide-${activeSlide}`} onValueChange={(v) => setActiveSlide(parseInt(v.split('-')[1]))}>
                  <TabsList className="w-full justify-start flex-wrap h-auto p-1">
                    {generatedPresentation.presentation.slides.map((_: any, i: number) => (
                      <TabsTrigger key={i} value={`slide-${i}`} className="text-xs">
                        Slide {i + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {generatedPresentation.presentation.slides.map((slide: any, i: number) => (
                    <TabsContent key={i} value={`slide-${i}`} className="mt-4">
                      <Card>
                        <CardHeader>
                          <CardTitle>{slide.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <ul className="space-y-2">
                            {slide.content.map((point: string, j: number) => (
                              <li key={j} className="flex items-start gap-2">
                                <ChevronRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                <span className="text-sm">{point}</span>
                              </li>
                            ))}
                          </ul>
                          
                          {slide.visualSuggestion && (
                            <Card className="bg-primary/5 border-primary/20">
                              <CardContent className="pt-4">
                                <p className="text-sm">
                                  <span className="font-medium">Visual Suggestion:</span> {slide.visualSuggestion}
                                </p>
                              </CardContent>
                            </Card>
                          )}

                          <div className="border-t pt-4">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Speaker Notes:</span> {slide.speakerNotes}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  ))}
                </Tabs>

                {/* Personalized Recommendations */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Personalized Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {generatedPresentation.personalizedRecommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};