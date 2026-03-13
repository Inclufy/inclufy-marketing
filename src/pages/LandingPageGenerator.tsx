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
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { lang } = useLanguage(); const nl = lang === 'nl'; const fr = lang === 'fr';
  const { loading, generateLandingPage, improveContent, analyzeContent } = useAI();
  const [pageType, setPageType] = useState("product");
  const [product, setProduct] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [uniqueValue, setUniqueValue] = useState("");
  const [goals, setGoals] = useState("");
  const [sections, setSections] = useState<LandingPageSection[]>([]);
  const [selectedSection, setSelectedSection] = useState("hero");

  const pageTypes = [
    { value: "product", label: nl ? "Productlancering" : fr ? "Lancement de produit" : "Product Launch", description: nl ? "Presenteer een nieuw product" : fr ? "Présentez un nouveau produit" : "Showcase a new product" },
    { value: "service", label: nl ? "Dienstaanbod" : fr ? "Offre de services" : "Service Offering", description: nl ? "Promoot je diensten" : fr ? "Promouvez vos services" : "Promote your services" },
    { value: "saas", label: nl ? "SaaS Platform" : fr ? "Plateforme SaaS" : "SaaS Platform", description: nl ? "Software abonnement" : fr ? "Abonnement logiciel" : "Software subscription" },
    { value: "webinar", label: nl ? "Webinar Registratie" : fr ? "Inscription au webinaire" : "Webinar Registration", description: nl ? "Evenement aanmeldingen" : fr ? "Inscriptions aux événements" : "Event sign-ups" },
    { value: "ebook", label: nl ? "Leadmagneet" : fr ? "Aimant à prospects" : "Lead Magnet", description: nl ? "eBook of whitepaper" : fr ? "eBook ou livre blanc" : "eBook or whitepaper" },
    { value: "consultation", label: nl ? "Gratis Consultatie" : fr ? "Consultation gratuite" : "Free Consultation", description: nl ? "Afspraken boeken" : fr ? "Prendre rendez-vous" : "Book appointments" },
  ];

  const sectionTypes = [
    { id: "hero", label: nl ? "Hero Sectie" : fr ? "Section Hero" : "Hero Section", icon: Layout },
    { id: "benefits", label: nl ? "Voordelen" : fr ? "Avantages" : "Benefits", icon: CheckCircle },
    { id: "features", label: nl ? "Functies" : fr ? "Fonctionnalités" : "Features", icon: Zap },
    { id: "social-proof", label: nl ? "Sociaal Bewijs" : fr ? "Preuve sociale" : "Social Proof", icon: Target },
    { id: "cta", label: nl ? "Oproep tot actie" : fr ? "Appel à l'action" : "Call to Action", icon: ArrowRight },
  ];

  const handleGenerate = async () => {
    if (!product || !targetAudience || !uniqueValue) {
      toast.error(nl ? "Vul alle verplichte velden in" : fr ? "Veuillez remplir tous les champs obligatoires" : "Please fill in all required fields");
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

      toast.success(nl ? "Landingspagina tekst gegenereerd!" : fr ? "Texte de page d'atterrissage généré !" : "Landing page copy generated!");
    } catch (error) {
      toast.error(nl ? "Kan landingspagina niet genereren" : fr ? "Échec de la génération de la page d'atterrissage" : "Failed to generate landing page");
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

      toast.success(nl ? "Sectie verbeterd voor hogere conversie!" : fr ? "Section améliorée pour une meilleure conversion !" : "Section improved for higher conversion!");
    } catch (error) {
      toast.error(nl ? "Kan sectie niet verbeteren" : fr ? "Échec de l'amélioration de la section" : "Failed to improve section");
    }
  };

  const analyzeSection = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    try {
      const analysis = await analyzeContent(JSON.stringify(section.content));
      
      toast.success(
        <div>
          <p className="font-semibold">{nl ? "Analyse voltooid!" : fr ? "Analyse terminée !" : "Analysis Complete!"}</p>
          <p className="text-sm">{nl ? "Score" : fr ? "Score" : "Score"}: {analysis.score}/10</p>
          <p className="text-sm">{nl ? "Sterkste punt" : fr ? "Point fort" : "Top strength"}: {analysis.strengths[0]}</p>
        </div>
      );
    } catch (error) {
      toast.error(nl ? "Kan sectie niet analyseren" : fr ? "Échec de l'analyse de la section" : "Failed to analyze section");
    }
  };

  const copySection = (content: any) => {
    navigator.clipboard.writeText(JSON.stringify(content, null, 2));
    toast.success(nl ? "Sectie gekopieerd naar klembord!" : fr ? "Section copiée dans le presse-papiers !" : "Section copied to clipboard!");
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
    toast.success(nl ? "Landingspagina geëxporteerd!" : fr ? "Page d'atterrissage exportée !" : "Landing page exported!");
  };

  const [saving, setSaving] = useState(false);

  const saveToLibrary = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('content_items').insert({
        user_id: user.id,
        title: `Landing Page: ${product}`,
        content_type: "landing_page",
        content: { pageType, product, targetAudience, uniqueValue, goals, sections },
        metadata: { page_type: pageType },
        tags: ["landing-page", pageType],
      });
      if (error) throw error;
      toast.success(nl ? "Opgeslagen in contentbibliotheek!" : fr ? "Enregistré dans la bibliothèque de contenu !" : "Saved to content library!");
    } catch {
      toast.error(nl ? "Kan niet opslaan in bibliotheek" : fr ? "Échec de l'enregistrement dans la bibliothèque" : "Failed to save to library");
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
              <Label>{nl ? "Koptekst" : fr ? "Titre" : "Headline"}</Label>
              <Card>
                <CardContent className="pt-4">
                  <h1 className="text-2xl font-bold">{section.content.headline}</h1>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-2">
              <Label>{nl ? "Subtitel" : fr ? "Sous-titre" : "Subheadline"}</Label>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-lg text-muted-foreground">{section.content.subheadline}</p>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-2">
              <Label>{nl ? "Oproep tot actie" : fr ? "Appel à l'action" : "Call to Action"}</Label>
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
            <Label>{nl ? "Belangrijkste voordelen" : fr ? "Avantages clés" : "Key Benefits"}</Label>
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
            <Label>{nl ? "Functies" : fr ? "Fonctionnalités" : "Features"}</Label>
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
            <Label>{nl ? "Sociaal bewijs elementen" : fr ? "Éléments de preuve sociale" : "Social Proof Elements"}</Label>
            {section.content.testimonials && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{nl ? "Getuigenis" : fr ? "Témoignage" : "Testimonial"}</CardTitle>
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
              <Label>{nl ? "CTA Koptekst" : fr ? "Titre CTA" : "CTA Headline"}</Label>
              <Card>
                <CardContent className="pt-4">
                  <h2 className="text-xl font-bold">{section.content.headline}</h2>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-2">
              <Label>{nl ? "CTA Tekst" : fr ? "Texte CTA" : "CTA Text"}</Label>
              <Card>
                <CardContent className="pt-4">
                  <p>{section.content.description}</p>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-2">
              <Label>{nl ? "Knoptekst" : fr ? "Texte du bouton" : "Button Text"}</Label>
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
        return <div>{nl ? "Onbekend sectietype" : fr ? "Type de section inconnu" : "Unknown section type"}</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-8 w-8 text-primary" />
            {nl ? "Landingspagina Tekst Generator" : fr ? "Générateur de texte de page d'atterrissage" : "Landing Page Copy Generator"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {nl ? "Maak converterende landingspagina teksten op maat van je doelgroep" : fr ? "Créez des textes de page d'atterrissage à fort taux de conversion adaptés à votre audience" : "Create high-converting landing page copy tailored to your audience"}
          </p>
        </div>
        {sections.length > 0 && (
          <div className="flex items-center gap-2">
            <Button onClick={saveToLibrary} variant="outline" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {nl ? "Opslaan in bibliotheek" : fr ? "Enregistrer dans la bibliothèque" : "Save to Library"}
            </Button>
            <Button onClick={exportPage} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {nl ? "Exporteren" : fr ? "Exporter" : "Export"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Setup Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{nl ? "Pagina Configuratie" : fr ? "Configuration de la page" : "Page Configuration"}</CardTitle>
              <CardDescription>
                {nl ? "Definieer je landingspagina doelstellingen" : fr ? "Définissez les objectifs de votre page d'atterrissage" : "Define your landing page objectives"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Page Type */}
              <div className="space-y-2">
                <Label>{nl ? "Paginatype" : fr ? "Type de page" : "Page Type"}</Label>
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
                <Label>{nl ? "Product-/Dienstnaam" : fr ? "Nom du produit/service" : "Product/Service Name"}</Label>
                <Input
                  placeholder={nl ? "bijv. Inclufy Marketing Platform" : fr ? "ex. Plateforme Inclufy Marketing" : "e.g., Inclufy Marketing Platform"}
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label>{nl ? "Doelgroep" : fr ? "Public cible" : "Target Audience"}</Label>
                <Textarea
                  placeholder={nl ? "bijv. Kleine ondernemers die betaalbare marketingautomatisering nodig hebben" : fr ? "ex. Propriétaires de petites entreprises ayant besoin d'automatisation marketing abordable" : "e.g., Small business owners who need affordable marketing automation"}
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Unique Value Prop */}
              <div className="space-y-2">
                <Label>{nl ? "Unieke Waardepropositie" : fr ? "Proposition de valeur unique" : "Unique Value Proposition"}</Label>
                <Textarea
                  placeholder={nl ? "bijv. Het enige marketingplatform dat je merkstem behoudt in alle AI-gegenereerde content" : fr ? "ex. La seule plateforme marketing qui maintient votre voix de marque dans tout le contenu généré par l'IA" : "e.g., The only marketing platform that maintains your brand voice across all AI-generated content"}
                  value={uniqueValue}
                  onChange={(e) => setUniqueValue(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Goals */}
              <div className="space-y-2">
                <Label>{nl ? "Conversiedoelen" : fr ? "Objectifs de conversion" : "Conversion Goals"}</Label>
                <Input
                  placeholder={nl ? "bijv. Aanmelden voor gratis proefperiode" : fr ? "ex. Inscription à l'essai gratuit" : "e.g., Sign up for free trial"}
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
                    {nl ? "Genereren..." : fr ? "Génération..." : "Generating..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {nl ? "Genereer Landingspagina" : fr ? "Générer la page d'atterrissage" : "Generate Landing Page"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Conversion Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{nl ? "Conversietips" : fr ? "Conseils de conversion" : "Conversion Tips"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>{nl ? "Duidelijke waardepropositie boven de vouw" : fr ? "Proposition de valeur claire au-dessus de la ligne de flottaison" : "Clear value proposition above fold"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>{nl ? "Voordelen boven functies" : fr ? "Avantages plutôt que fonctionnalités" : "Benefits over features"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>{nl ? "Sociaal bewijs bouwt vertrouwen" : fr ? "La preuve sociale renforce la confiance" : "Social proof builds trust"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>{nl ? "Enkele, duidelijke CTA" : fr ? "Un seul CTA clair" : "Single, clear CTA"}</span>
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
                  <CardTitle>{nl ? "Paginasecties" : fr ? "Sections de la page" : "Page Sections"}</CardTitle>
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
                          {nl ? "Verbeteren" : fr ? "Améliorer" : "Improve"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => analyzeSection(section.id)}
                          disabled={loading}
                        >
                          <BarChart3 className="mr-2 h-4 w-4" />
                          {nl ? "Analyseren" : fr ? "Analyser" : "Analyze"}
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
                  <h3 className="text-lg font-medium">{nl ? "Nog geen landingspagina" : fr ? "Pas encore de page d'atterrissage" : "No Landing Page Yet"}</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {nl ? "Configureer je landingspagina-instellingen en klik op Genereer om je tekst te maken" : fr ? "Configurez les paramètres de votre page d'atterrissage et cliquez sur Générer pour créer votre texte" : "Configure your landing page settings and click Generate to create your copy"}
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