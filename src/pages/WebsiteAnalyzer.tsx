import { useState } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  Search,
  Loader2,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  BarChart3,
  Building,
  Sparkles,
  Download,
} from "lucide-react";
import { toast } from "sonner";

/** -----------------------------
 * Types
 * ------------------------------ */

interface AnalysisResult {
  url: string;
  status: "analyzing" | "completed" | "error";
  data?: {
    productFeatures: string[];
    uniqueSellingPoints: string[];
    targetAudience: string;
    competitors: string[];
    pricing: string;
    messaging: {
      headline: string;
      subheadline: string;
      valueProps: string[];
    };
    opportunities: string[];
  };
  timestamp: Date;
}

interface CompetitorComparison {
  feature: string;
  us: boolean;
  competitor1: boolean;
  competitor2: boolean;
  competitor3: boolean;
}

/**
 * From basic analysis to comprehensive market intelligence
 * NOTE: Keep interfaces OUTSIDE the component and OUTSIDE JSX.
 * If these types already exist elsewhere, feel free to import them and remove these placeholders.
 */
type Trend = { name: string; description?: string };
type Regulation = { name: string; region?: string; summary?: string };
type PrivacyLaw = { name: string; region?: string };
type Certification = { name: string; issuer?: string };
type ReportingRequirement = { name: string; frequency?: string };
type KPI = { name: string; unit?: string; target?: string };
type Metric = { name: string; unit?: string; benchmark?: string };
type Practice = { name: string; description?: string };
type Indicator = { name: string; level?: string };

interface EnhancedMarketContext {
  industry: {
    classification: {
      sector: string;
      subsector: string;
      naics_code: string;
      sic_code: string;
    };
    dynamics: {
      market_size: number;
      growth_rate: number;
      maturity: "emerging" | "growing" | "mature" | "declining";
      key_trends: Trend[];
    };
  };

  regulations: {
    compliance_requirements: Regulation[];
    data_privacy_laws: PrivacyLaw[];
    industry_certifications: Certification[];
    reporting_obligations: ReportingRequirement[];
  };

  benchmarks: {
    operational_kpis: KPI[];
    financial_metrics: Metric[];
    best_practices: Practice[];
    maturity_indicators: Indicator[];
  };
}

/** -----------------------------
 * Component
 * ------------------------------ */

const WebsiteAnalyzer = () => {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisResult[]>([]);
  const [competitorUrls, setCompetitorUrls] = useState<string[]>([""]);

  const mockAnalysisData: AnalysisResult = {
    url: "",
    status: "completed",
    data: {
      productFeatures: [
        "AI-powered content generation",
        "Brand voice consistency",
        "Multi-channel publishing",
        "Real-time analytics",
        "Team collaboration tools",
      ],
      uniqueSellingPoints: [
        "10x faster than traditional agencies",
        "Maintains brand voice across all content",
        "No-code workflow automation",
        "Enterprise-grade security",
      ],
      targetAudience:
        "Marketing managers at mid-size B2B companies (50-500 employees) who need to scale content production while maintaining quality and brand consistency",
      competitors: ["contentful.com", "jasper.ai", "copy.ai"],
      pricing: "Subscription-based, starting at $299/month for small teams",
      messaging: {
        headline: "Scale Your Marketing with AI That Understands Your Brand",
        subheadline: "Create consistent, on-brand content 10x faster",
        valueProps: [
          "Save 20+ hours per week on content creation",
          "Maintain perfect brand consistency",
          "Scale without hiring more writers",
        ],
      },
      opportunities: [
        "Emphasize ROI and time savings more prominently",
        "Add more social proof and case studies",
        "Create comparison pages vs competitors",
        "Strengthen mobile experience",
      ],
    },
    timestamp: new Date(),
  };

  const startAnalysis = () => {
    if (!url) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate analysis progress
    const interval = setInterval(() => {
      setAnalysisProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);

          // Set mock data
          const result = { ...mockAnalysisData, url };
          setCurrentAnalysis(result);
          setRecentAnalyses([result, ...recentAnalyses]);
          toast.success(nl ? "Website-analyse voltooid!" : fr ? "Analyse du site web termin\u00e9e !" : "Website analysis completed!");

          return 100;
        }
        return prev + 20;
      });
    }, 800);
  };

  const addCompetitorField = () => {
    setCompetitorUrls([...competitorUrls, ""]);
  };

  const updateCompetitorUrl = (index: number, value: string) => {
    const updated = [...competitorUrls];
    updated[index] = value;
    setCompetitorUrls(updated);
  };

  const exportAnalysis = () => {
    if (!currentAnalysis?.data) return;

    const content = JSON.stringify(currentAnalysis.data, null, 2);
    const blob = new Blob([content], { type: "application/json" });
    const fileUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = `website-analysis-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(fileUrl);
    toast.success(nl ? "Analyse ge\u00ebxporteerd!" : fr ? "Analyse export\u00e9e !" : "Analysis exported!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            {nl ? 'Website Analyzer' : fr ? 'Analyseur de site web' : 'Website Analyzer'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {nl ? 'Haal strategische inzichten uit elke website om uw marketing te versterken' : fr ? 'Extrayez des insights strat\u00e9giques de n\'importe quel site web pour renforcer votre marketing' : 'Extract strategic insights from any website to power your marketing'}
          </p>
        </div>
        {currentAnalysis && (
          <Button onClick={exportAnalysis} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {nl ? 'Analyse Exporteren' : fr ? 'Exporter l\'analyse' : 'Export Analysis'}
          </Button>
        )}
      </div>

      {/* URL Input */}
      <Card>
        <CardHeader>
          <CardTitle>{nl ? 'Website Analyseren' : fr ? 'Analyser le site web' : 'Analyze Website'}</CardTitle>
          <CardDescription>
            {nl ? 'Voer een URL in om productkenmerken, berichten en concurrentie-inzichten te extraheren' : fr ? 'Entrez une URL pour extraire les fonctionnalit\u00e9s produit, la messagerie et les insights concurrentiels' : 'Enter a URL to extract product features, messaging, and competitive insights'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isAnalyzing}
                className="flex-1"
              />
              <Button onClick={startAnalysis} disabled={!url || isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {nl ? 'Analyseren...' : fr ? 'Analyse en cours...' : 'Analyzing...'}
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    {nl ? 'Analyseren' : fr ? 'Analyser' : 'Analyze'}
                  </>
                )}
              </Button>
            </div>

            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{nl ? 'Websitegegevens ophalen...' : fr ? 'Extraction des donn\u00e9es du site web...' : 'Extracting website data...'}</span>
                  <span>{analysisProgress}%</span>
                </div>
                <Progress value={analysisProgress} />
                <div className="text-xs text-muted-foreground space-y-1">
                  {analysisProgress < 20 && <p>{nl ? '• Website-inhoud ophalen...' : fr ? '• R\u00e9cup\u00e9ration du contenu du site web...' : '• Fetching website content...'}</p>}
                  {analysisProgress >= 20 && analysisProgress < 40 && <p>{nl ? '• Paginastructuur analyseren...' : fr ? '• Analyse de la structure de la page...' : '• Analyzing page structure...'}</p>}
                  {analysisProgress >= 40 && analysisProgress < 60 && <p>{nl ? '• Productkenmerken extraheren...' : fr ? '• Extraction des fonctionnalit\u00e9s produit...' : '• Extracting product features...'}</p>}
                  {analysisProgress >= 60 && analysisProgress < 80 && <p>{nl ? '• USP\'s en berichten identificeren...' : fr ? '• Identification des USP et de la messagerie...' : '• Identifying USPs and messaging...'}</p>}
                  {analysisProgress >= 80 && <p>{nl ? '• Inzichten genereren...' : fr ? '• G\u00e9n\u00e9ration des insights...' : '• Generating insights...'}</p>}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {currentAnalysis?.data && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">{nl ? 'Overzicht' : fr ? 'Aper\u00e7u' : 'Overview'}</TabsTrigger>
            <TabsTrigger value="features">{nl ? 'Kenmerken & USP\'s' : fr ? 'Fonctionnalit\u00e9s & USP' : 'Features & USPs'}</TabsTrigger>
            <TabsTrigger value="audience">{nl ? 'Doelgroep & Berichten' : fr ? 'Audience & Messagerie' : 'Audience & Messaging'}</TabsTrigger>
            <TabsTrigger value="competitors">{nl ? 'Concurrentieanalyse' : fr ? 'Analyse concurrentielle' : 'Competitor Analysis'}</TabsTrigger>
            <TabsTrigger value="opportunities">{nl ? 'Kansen' : fr ? 'Opportunit\u00e9s' : 'Opportunities'}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{nl ? 'Productkenmerken' : fr ? 'Fonctionnalit\u00e9s produit' : 'Product Features'}</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentAnalysis.data.productFeatures.length}</div>
                  <p className="text-xs text-muted-foreground">{nl ? 'Kernmogelijkheden ge\u00efdentificeerd' : fr ? 'Capacit\u00e9s cl\u00e9s identifi\u00e9es' : 'Core capabilities identified'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{nl ? 'USP\'s Gevonden' : fr ? 'USP trouv\u00e9s' : 'USPs Found'}</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentAnalysis.data.uniqueSellingPoints.length}</div>
                  <p className="text-xs text-muted-foreground">{nl ? 'Unieke onderscheidende factoren' : fr ? 'Diff\u00e9renciateurs uniques' : 'Unique differentiators'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{nl ? 'Concurrenten' : fr ? 'Concurrents' : 'Competitors'}</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentAnalysis.data.competitors.length}</div>
                  <p className="text-xs text-muted-foreground">{nl ? 'Vergelijkbare bedrijven gevonden' : fr ? 'Entreprises similaires trouv\u00e9es' : 'Similar companies found'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{nl ? 'Kansen' : fr ? 'Opportunit\u00e9s' : 'Opportunities'}</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentAnalysis.data.opportunities.length}</div>
                  <p className="text-xs text-muted-foreground">{nl ? 'Verbeterpunten' : fr ? 'Domaines d\'am\u00e9lioration' : 'Areas for improvement'}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>{nl ? 'Kernboodschappen' : fr ? 'Messages cl\u00e9s' : 'Key Messaging'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">{nl ? 'Koptekst' : fr ? 'Titre' : 'Headline'}</Label>
                  <p className="text-lg font-semibold">{currentAnalysis.data.messaging.headline}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{nl ? 'Subtitel' : fr ? 'Sous-titre' : 'Subheadline'}</Label>
                  <p className="text-base">{currentAnalysis.data.messaging.subheadline}</p>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs text-muted-foreground">{nl ? 'Doelgroep' : fr ? 'Public cible' : 'Target Audience'}</Label>
                  <p className="text-sm">{currentAnalysis.data.targetAudience}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    {nl ? 'Productkenmerken' : fr ? 'Fonctionnalit\u00e9s produit' : 'Product Features'}
                  </CardTitle>
                  <CardDescription>{nl ? 'Kernmogelijkheden ge\u00ebxtraheerd van de website' : fr ? 'Capacit\u00e9s cl\u00e9s extraites du site web' : 'Core capabilities extracted from the website'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentAnalysis.data.productFeatures.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {nl ? 'Unieke Verkoopargumenten' : fr ? 'Arguments de vente uniques' : 'Unique Selling Points'}
                  </CardTitle>
                  <CardDescription>{nl ? 'Wat dit product onderscheidt' : fr ? 'Ce qui distingue ce produit' : 'What makes this product stand out'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentAnalysis.data.uniqueSellingPoints.map((usp, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">{usp}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Audience & Messaging Tab */}
          <TabsContent value="audience">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {nl ? 'Doelgroep- & Berichtenanalyse' : fr ? 'Analyse de l\'audience & de la messagerie' : 'Audience & Messaging Analysis'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>{nl ? 'Doelgroepprofiel' : fr ? 'Profil du public cible' : 'Target Audience Profile'}</Label>
                  <Card className="mt-2">
                    <CardContent className="pt-4">
                      <p className="text-sm">{currentAnalysis.data.targetAudience}</p>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div>
                  <Label>{nl ? 'Waardeproposities' : fr ? 'Propositions de valeur' : 'Value Propositions'}</Label>
                  <div className="mt-2 space-y-2">
                    {currentAnalysis.data.messaging.valueProps.map((prop, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4 flex items-center gap-3">
                          <Badge variant="secondary">{index + 1}</Badge>
                          <p className="text-sm">{prop}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>{nl ? 'Prijsstrategie' : fr ? 'Strat\u00e9gie tarifaire' : 'Pricing Strategy'}</Label>
                  <Card className="mt-2">
                    <CardContent className="pt-4 flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <p className="text-sm">{currentAnalysis.data.pricing}</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Competitor Analysis Tab */}
          <TabsContent value="competitors">
            <Card>
              <CardHeader>
                <CardTitle>{nl ? 'Concurrentielandschap' : fr ? 'Paysage concurrentiel' : 'Competitor Landscape'}</CardTitle>
                <CardDescription>
                  {nl ? 'Analyseer meerdere concurrenten om positioneringskansen te vinden' : fr ? 'Analysez plusieurs concurrents pour trouver des opportunit\u00e9s de positionnement' : 'Analyze multiple competitors to find positioning opportunities'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{nl ? 'Ge\u00efdentificeerde Concurrenten' : fr ? 'Concurrents identifi\u00e9s' : 'Identified Competitors'}</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {currentAnalysis.data.competitors.map((competitor, index) => (
                      <Badge key={index} variant="secondary">
                        {competitor}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>{nl ? 'Concurrenten toevoegen voor vergelijking' : fr ? 'Ajouter des concurrents pour comparaison' : 'Add Competitors for Comparison'}</Label>
                  <div className="mt-2 space-y-2">
                    {competitorUrls.map((compUrl, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="https://competitor.com"
                          value={compUrl}
                          onChange={(e) => updateCompetitorUrl(index, e.target.value)}
                        />
                        {index === competitorUrls.length - 1 && (
                          <Button onClick={addCompetitorField} variant="outline">
                            {nl ? 'Nog een toevoegen' : fr ? 'Ajouter un autre' : 'Add Another'}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button className="mt-2 w-full">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    {nl ? 'Vergelijkingsrapport Genereren' : fr ? 'G\u00e9n\u00e9rer un rapport comparatif' : 'Generate Comparison Report'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Opportunities Tab */}
          <TabsContent value="opportunities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {nl ? 'Strategische Kansen' : fr ? 'Opportunit\u00e9s strat\u00e9giques' : 'Strategic Opportunities'}
                </CardTitle>
                <CardDescription>{nl ? 'Aanbevelingen op basis van de analyse' : fr ? 'Recommandations bas\u00e9es sur l\'analyse' : 'Recommendations based on the analysis'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentAnalysis.data.opportunities.map((opportunity, index) => (
                    <Card key={index} className="border-l-4 border-l-primary">
                      <CardContent className="pt-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{opportunity}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && !isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle>{nl ? 'Recente Analyses' : fr ? 'Analyses r\u00e9centes' : 'Recent Analyses'}</CardTitle>
            <CardDescription>{nl ? 'Snelle toegang tot uw eerdere website-analyses' : fr ? 'Acc\u00e8s rapide \u00e0 vos analyses de sites web pr\u00e9c\u00e9dentes' : 'Quick access to your previous website analyses'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentAnalyses.slice(0, 5).map((analysis, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => setCurrentAnalysis(analysis)}
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{analysis.url}</p>
                      <p className="text-xs text-muted-foreground">{analysis.timestamp.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Use "default" if your Badge doesn't have a "success" variant */}
                  <Badge variant={analysis.status === "completed" ? "default" : "secondary"}>
                    {analysis.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WebsiteAnalyzer;
