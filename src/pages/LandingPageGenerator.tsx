import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAI } from "@/hooks/use-ai";
import { api } from "@/lib/api";
import { 
  Globe, 
  Sparkles, 
  Copy, 
  Download, 
  Eye,
  Loader2,
  Layout,
  Type,
  Image as ImageIcon,
  Target,
  Zap,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Save
} from "lucide-react";
import { toast } from "sonner";

interface LandingPageSection {
  id: string;
  type: string;
  content: any;
}

const LandingPageGenerator = () => {
  const { loading, generateLandingPage, improveContent, analyzeContent } = useAI();
  const [pageType, setPageType] = useState("product");
  const [product, setProduct] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [uniqueValue, setUniqueValue] = useState("");
  const [goals, setGoals] = useState("");
  const [sections, setSections] = useState<LandingPageSection[]>([]);
  const [selectedSection, setSelectedSection] = useState("hero");

  const pageTypes = [
    { value: "product", label: "Product Launch", description: "Showcase a new product" },
    { value: "service", label: "Service Offering", description: "Promote your services" },
    { value: "saas", label: "SaaS Platform", description: "Software subscription" },
    { value: "webinar", label: "Webinar Registration", description: "Event sign-ups" },
    { value: "ebook", label: "Lead Magnet", description: "eBook or whitepaper" },
    { value: "consultation", label: "Free Consultation", description: "Book appointments" },
  ];

  const sectionTypes = [
    { id: "hero", label: "Hero Section", icon: Layout },
    { id: "benefits", label: "Benefits", icon: CheckCircle },
    { id: "features", label: "Features", icon: Zap },
    { id: "social-proof", label: "Social Proof", icon: Target },
    { id: "cta", label: "Call to Action", icon: ArrowRight },
  ];

  const handleGenerate = async () => {
    if (!product || !targetAudience || !uniqueValue) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const result = await generateLandingPage({
        type: pageType,
        product,
        audience: targetAudience,
        uniqueValue,
        goals
      });

      setSections([
        { id: "hero", type: "hero", content: result.hero },
        { id: "benefits", type: "benefits", content: result.benefits },
        { id: "features", type: "features", content: result.features },
        { id: "social-proof", type: "social-proof", content: result.socialProof },
        { id: "cta", type: "cta", content: result.cta }
      ]);

      toast.success("Landing page copy generated!");
    } catch (error) {
      toast.error("Failed to generate landing page");
    }
  };

  const improveSection = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    try {
      const improved = await improveContent(
        JSON.stringify(section.content),
        "conversion"
      );

      setSections(sections.map(s => 
        s.id === sectionId 
          ? { ...s, content: improved }
          : s
      ));

      toast.success("Section improved for higher conversion!");
    } catch (error) {
      toast.error("Failed to improve section");
    }
  };

  const analyzeSection = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    try {
      const analysis = await analyzeContent(JSON.stringify(section.content));
      
      toast.success(
        <div>
          <p className="font-semibold">Analysis Complete!</p>
          <p className="text-sm">Score: {analysis.score}/10</p>
          <p className="text-sm">Top strength: {analysis.strengths[0]}</p>
        </div>
      );
    } catch (error) {
      toast.error("Failed to analyze section");
    }
  };

  const copySection = (content: any) => {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    toast.success("Section copied to clipboard!");
  };

  const exportPage = () => {
    const data = {
      pageType,
      product,
      targetAudience,
      uniqueValue,
      goals,
      sections,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `landing-page-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Landing page exported!");
  };

  const [saving, setSaving] = useState(false);

  const saveToLibrary = async () => {
    setSaving(true);
    try {
      await api.post("/content-library/", {
        title: `Landing Page: ${product}`,
        content_type: "landing_page",
        content: { pageType, product, targetAudience, uniqueValue, goals, sections },
        metadata: { page_type: pageType },
        tags: ["landing-page", pageType],
      });
      toast.success("Saved to content library!");
    } catch {
      toast.error("Failed to save to library");
    } finally {
      setSaving(false);
    }
  };

  const renderSectionContent = (section: LandingPageSection) => {
    switch (section.type) {
      case "hero":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Card>
                <CardContent className="pt-4">
                  <h1 className="text-2xl font-bold">{section.content.headline}</h1>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-lg text-muted-foreground">{section.content.subheadline}</p>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-2">
              <Label>Call to Action</Label>
              <Card>
                <CardContent className="pt-4">
                  <Button size="lg">{section.content.cta}</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "benefits":
        return (
          <div className="space-y-4">
            <Label>Key Benefits</Label>
            <div className="grid gap-3">
              {section.content.items?.map((benefit: any, index: number) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold">{benefit.title}</h3>
                        <p className="text-sm text-muted-foreground">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "features":
        return (
          <div className="space-y-4">
            <Label>Features</Label>
            <div className="grid gap-3">
              {section.content.items?.map((feature: any, index: number) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{feature.name}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "social-proof":
        return (
          <div className="space-y-4">
            <Label>Social Proof Elements</Label>
            {section.content.testimonials && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Testimonial</CardTitle>
                </CardHeader>
                <CardContent>
                  <blockquote className="italic">
                    "{section.content.testimonials[0]?.quote}"
                  </blockquote>
                  <p className="text-sm text-muted-foreground mt-2">
                    — {section.content.testimonials[0]?.author}
                  </p>
                </CardContent>
              </Card>
            )}
            {section.content.stats && (
              <div className="grid grid-cols-3 gap-3">
                {section.content.stats.map((stat: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-primary">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case "cta":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>CTA Headline</Label>
              <Card>
                <CardContent className="pt-4">
                  <h2 className="text-xl font-bold">{section.content.headline}</h2>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-2">
              <Label>CTA Text</Label>
              <Card>
                <CardContent className="pt-4">
                  <p>{section.content.description}</p>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Card>
                <CardContent className="pt-4">
                  <Button size="lg" className="w-full">
                    {section.content.buttonText}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return <div>Unknown section type</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            Landing Page Copy Generator
          </h2>
          <p className="text-muted-foreground mt-2">
            Create high-converting landing page copy tailored to your audience
          </p>
        </div>
        {sections.length > 0 && (
          <div className="flex items-center gap-2">
            <Button onClick={saveToLibrary} variant="outline" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save to Library
            </Button>
            <Button onClick={exportPage} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Setup Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Configuration</CardTitle>
              <CardDescription>
                Define your landing page objectives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Page Type */}
              <div className="space-y-2">
                <Label>Page Type</Label>
                <Select value={pageType} onValueChange={setPageType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {type.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product/Service */}
              <div className="space-y-2">
                <Label>Product/Service Name</Label>
                <Input
                  placeholder="e.g., Inclufy Marketing Platform"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Textarea
                  placeholder="e.g., Small business owners who need affordable marketing automation"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Unique Value Prop */}
              <div className="space-y-2">
                <Label>Unique Value Proposition</Label>
                <Textarea
                  placeholder="e.g., The only marketing platform that maintains your brand voice across all AI-generated content"
                  value={uniqueValue}
                  onChange={(e) => setUniqueValue(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Goals */}
              <div className="space-y-2">
                <Label>Conversion Goals</Label>
                <Input
                  placeholder="e.g., Sign up for free trial"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Landing Page
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Conversion Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversion Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Clear value proposition above fold</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Benefits over features</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Social proof builds trust</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Single, clear CTA</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          {sections.length > 0 ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Page Sections</CardTitle>
                  <Tabs value={selectedSection} onValueChange={setSelectedSection}>
                    <TabsList className="grid grid-cols-5 w-[400px]">
                      {sectionTypes.map((section) => (
                        <TabsTrigger key={section.id} value={section.id}>
                          <section.icon className="h-4 w-4" />
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`space-y-4 ${selectedSection !== section.id ? 'hidden' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">
                        {sectionTypes.find(t => t.id === section.id)?.label}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => improveSection(section.id)}
                          disabled={loading}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Improve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => analyzeSection(section.id)}
                          disabled={loading}
                        >
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Analyze
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copySection(section.content)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {renderSectionContent(section)}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent>
                <div className="text-center space-y-4 py-12">
                  <Globe className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">No Landing Page Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Configure your landing page settings and click Generate to create your copy
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPageGenerator;