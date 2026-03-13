import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAI } from "@/hooks/use-ai";
import { supabase } from '@/integrations/supabase/client';
import {
  Mail,
  Sparkles,
  Copy,
  Download,
  Settings,
  Eye,
  Loader2,
  TestTube,
  BarChart3,
  Target,
  Users,
  Zap,
  RefreshCw,
  CheckCircle,
  Send,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

interface EmailVariant {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  body: string;
  cta: string;
  tone: string;
}

const EmailCampaignGenerator = () => {
  const { loading, generateEmailCampaign, analyzeContent } = useAI();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [campaignType, setCampaignType] = useState("promotional");
  const [targetAudience, setTargetAudience] = useState("");
  const [product, setProduct] = useState("");
  const [goal, setGoal] = useState("");
  const [enableAB, setEnableAB] = useState(false);
  const [variants, setVariants] = useState<EmailVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailProvider, setEmailProvider] = useState<{ configured: boolean; provider: string | null }>({ configured: false, provider: null });

  useEffect(() => {
    // Email provider config — check user's integration_configs for email providers
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('integration_configs')
          .select('platform, status')
          .eq('user_id', user.id)
          .in('platform', ['sendgrid', 'mailchimp'])
          .eq('status', 'connected')
          .limit(1);
        if (data && data.length > 0) {
          setEmailProvider({ configured: true, provider: data[0].platform });
        }
      } catch {
        // Default to unconfigured — no error shown
      }
    })();
  }, []);

  const campaignTypes = [
    { value: "promotional", label: nl ? "Promotioneel" : fr ? "Promotionnel" : "Promotional", icon: Target },
    { value: "newsletter", label: nl ? "Nieuwsbrief" : fr ? "Bulletin" : "Newsletter", icon: Mail },
    { value: "welcome", label: nl ? "Welkomstserie" : fr ? "Série de bienvenue" : "Welcome Series", icon: Users },
    { value: "abandoned", label: nl ? "Verlaten winkelwagen" : fr ? "Panier abandonné" : "Abandoned Cart", icon: RefreshCw },
    { value: "reengagement", label: nl ? "Heractivering" : fr ? "Réengagement" : "Re-engagement", icon: Zap },
  ];

  const handleGenerate = async () => {
    if (!product || !targetAudience || !goal) {
      toast.error(nl ? "Vul alle verplichte velden in" : fr ? "Veuillez remplir tous les champs obligatoires" : "Please fill in all required fields");
      return;
    }

    try {
      const result = await generateEmailCampaign({
        type: campaignType,
        product,
        audience: targetAudience,
        goal,
        variants: enableAB ? 2 : 1
      });

      if (enableAB && result.variants) {
        setVariants(result.variants);
        setSelectedVariant(result.variants[0].id);
      } else {
        setVariants([{
          id: "single",
          name: nl ? "Hoofdversie" : fr ? "Version principale" : "Main Version",
          subject: result.subject,
          preheader: result.preheader,
          body: result.body,
          cta: result.cta,
          tone: result.tone || "professional"
        }]);
        setSelectedVariant("single");
      }

      toast.success(
        nl
          ? `E-mailcampagne gegenereerd${enableAB ? ' met A/B-varianten!' : '!'}`
          : fr
            ? `Campagne e-mail générée${enableAB ? ' avec variantes A/B !' : ' !'}`
            : `Email campaign generated${enableAB ? ' with A/B variants!' : '!'}`
      );
    } catch (error) {
      toast.error(nl ? "Kan e-mailcampagne niet genereren" : fr ? "Échec de la génération de la campagne e-mail" : "Failed to generate email campaign");
    }
  };

  const analyzeVariant = async (variant: EmailVariant) => {
    try {
      const analysis = await analyzeContent(
        `Subject: ${variant.subject}\n\nPreheader: ${variant.preheader}\n\nBody: ${variant.body}\n\nCTA: ${variant.cta}`
      );

      toast.success(
        <div>
          <p className="font-semibold">{nl ? "Analyse voltooid!" : fr ? "Analyse terminée !" : "Analysis Complete!"}</p>
          <p className="text-sm">{nl ? "Score" : fr ? "Score" : "Score"}: {analysis.score}/10</p>
          <p className="text-sm">{nl ? "Sterke punten" : fr ? "Points forts" : "Strengths"}: {analysis.strengths[0]}</p>
        </div>
      );
    } catch (error) {
      toast.error(nl ? "Kan variant niet analyseren" : fr ? "Échec de l'analyse de la variante" : "Failed to analyze variant");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(nl ? "Gekopieerd naar klembord!" : fr ? "Copié dans le presse-papiers !" : "Copied to clipboard!");
  };

  const exportCampaign = () => {
    const data = {
      campaign: {
        type: campaignType,
        audience: targetAudience,
        product,
        goal,
        variants: variants
      },
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-campaign-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(nl ? "Campagne geëxporteerd!" : fr ? "Campagne exportée !" : "Campaign exported!");
  };

  const saveCampaignAndSend = async () => {
    const variant = variants.find(v => v.id === selectedVariant);
    if (!variant) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save as a campaign in Supabase
      const { data: campaign, error: insertErr } = await supabase.from('campaigns').insert({
        user_id: user.id,
        name: `Email: ${variant.subject}`,
        type: 'email',
        description: `${campaignType} email for ${product}`,
        status: 'active',
        content: { subject: variant.subject, preheader: variant.preheader, body: variant.body, cta: variant.cta },
        settings: { ab_testing: enableAB, audience: targetAudience, goal },
      }).select().single();

      if (insertErr) throw insertErr;

      // Send via edge function
      await supabase.functions.invoke('email-send-campaign', {
        body: {
          campaign_id: campaign.id,
          subject: variant.subject,
          html_body: `<div>${variant.body.replace(/\n/g, "<br/>")}</div>`,
          text_body: variant.body,
        },
      });

      toast.success(nl ? "Campagne opgeslagen en e-mails verzonden naar alle contacten!" : fr ? "Campagne enregistrée et e-mails envoyés à tous les contacts !" : "Campaign saved and emails sent to all contacts!");
    } catch (err: any) {
      toast.error(err?.message || (nl ? "Kan campagne niet verzenden" : fr ? "Échec de l'envoi de la campagne" : "Failed to send campaign"));
    } finally {
      setSending(false);
    }
  };

  const saveCampaignDraft = async () => {
    const variant = variants.find(v => v.id === selectedVariant);
    if (!variant) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: insertErr } = await supabase.from('campaigns').insert({
        user_id: user.id,
        name: `Email: ${variant.subject}`,
        type: 'email',
        description: `${campaignType} email for ${product}`,
        status: 'draft',
        content: { subject: variant.subject, preheader: variant.preheader, body: variant.body, cta: variant.cta },
        settings: { ab_testing: enableAB, audience: targetAudience, goal },
      });
      if (insertErr) throw insertErr;
      toast.success(nl ? "Campagne opgeslagen als concept!" : fr ? "Campagne enregistrée comme brouillon !" : "Campaign saved as draft!");
    } catch (err: any) {
      toast.error(err?.message || (nl ? "Kan campagne niet opslaan" : fr ? "Échec de l'enregistrement de la campagne" : "Failed to save campaign"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            {nl ? "E-mailcampagne Generator" : fr ? "Générateur de campagne e-mail" : "Email Campaign Generator"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {nl ? "Maak goed converterende e-mailcampagnes met optionele A/B-tests" : fr ? "Créez des campagnes e-mail à fort taux de conversion avec tests A/B optionnels" : "Create high-converting email campaigns with optional A/B testing"}
          </p>
        </div>
        {variants.length > 0 && (
          <div className="flex items-center gap-2">
            <Button onClick={saveCampaignDraft} variant="outline" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {nl ? "Concept opslaan" : fr ? "Enregistrer le brouillon" : "Save Draft"}
            </Button>
            <Button onClick={exportCampaign} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              {nl ? "Exporteren" : fr ? "Exporter" : "Export"}
            </Button>
            {emailProvider.configured && (
              <Button onClick={saveCampaignAndSend} disabled={sending} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {sending
                  ? (nl ? "Verzenden..." : fr ? "Envoi en cours..." : "Sending...")
                  : (nl ? "Verzenden naar contacten" : fr ? "Envoyer aux contacts" : "Send to Contacts")
                }
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Setup Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{nl ? "Campagne-instellingen" : fr ? "Configuration de la campagne" : "Campaign Setup"}</CardTitle>
              <CardDescription>
                {nl ? "Definieer de parameters van je e-mailcampagne" : fr ? "Définissez les paramètres de votre campagne e-mail" : "Define your email campaign parameters"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Campaign Type */}
              <div className="space-y-2">
                <Label>{nl ? "Campagnetype" : fr ? "Type de campagne" : "Campaign Type"}</Label>
                <Select value={campaignType} onValueChange={setCampaignType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {campaignTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product/Service */}
              <div className="space-y-2">
                <Label>{nl ? "Product/Dienst" : fr ? "Produit/Service" : "Product/Service"}</Label>
                <Input
                  placeholder={nl ? "bijv. AI-marketingplatform" : fr ? "ex. Plateforme de marketing IA" : "e.g., AI Marketing Platform"}
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label>{nl ? "Doelgroep" : fr ? "Public cible" : "Target Audience"}</Label>
                <Textarea
                  placeholder={nl ? "bijv. Marketingmanagers bij B2B SaaS-bedrijven" : fr ? "ex. Responsables marketing dans les entreprises B2B SaaS" : "e.g., Marketing managers at B2B SaaS companies"}
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Campaign Goal */}
              <div className="space-y-2">
                <Label>{nl ? "Campagnedoel" : fr ? "Objectif de la campagne" : "Campaign Goal"}</Label>
                <Textarea
                  placeholder={nl ? "bijv. Aanmeldingen voor gratis proefperiode stimuleren" : fr ? "ex. Générer des inscriptions à l'essai gratuit" : "e.g., Drive sign-ups for free trial"}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={2}
                />
              </div>

              <Separator />

              {/* A/B Testing */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <TestTube className="h-4 w-4" />
                    {nl ? "A/B-testen" : fr ? "Tests A/B" : "A/B Testing"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nl ? "Genereer twee varianten om te testen" : fr ? "Générez deux variantes à tester" : "Generate two variants to test"}
                  </p>
                </div>
                <Switch
                  checked={enableAB}
                  onCheckedChange={setEnableAB}
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
                    {nl ? "Genereren..." : fr ? "Génération en cours..." : "Generating..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {nl ? "Campagne genereren" : fr ? "Générer la campagne" : "Generate Campaign"}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{nl ? "Best practices" : fr ? "Bonnes pratiques" : "Best Practices"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>{nl ? "Houd onderwerpregels onder de 50 tekens" : fr ? "Gardez les lignes d'objet sous 50 caractères" : "Keep subject lines under 50 characters"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>{nl ? "Gebruik personalisatietokens" : fr ? "Utilisez des jetons de personnalisation" : "Use personalization tokens"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>{nl ? "Eén duidelijke CTA per e-mail" : fr ? "Un seul CTA clair par e-mail" : "One clear CTA per email"}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>{nl ? "Mobiel geoptimaliseerd ontwerp" : fr ? "Design optimisé pour mobile" : "Mobile-optimized design"}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          {variants.length > 0 ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{nl ? "E-mailvoorbeeld" : fr ? "Aperçu de l'e-mail" : "Email Preview"}</CardTitle>
                  <div className="flex items-center gap-2">
                    {enableAB && variants.length > 1 && (
                      <Tabs value={selectedVariant} onValueChange={setSelectedVariant}>
                        <TabsList>
                          {variants.map((variant, index) => (
                            <TabsTrigger key={variant.id} value={variant.id}>
                              {nl ? "Variant" : fr ? "Variante" : "Variant"} {String.fromCharCode(65 + index)}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </Tabs>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className={`space-y-4 ${selectedVariant !== variant.id ? 'hidden' : ''}`}
                  >
                    {/* Subject Line */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{nl ? "Onderwerpregel" : fr ? "Ligne d'objet" : "Subject Line"}</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{variant.tone}</Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(variant.subject)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="font-medium">{variant.subject}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Preheader */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{nl ? "Preheadertekst" : fr ? "Texte de pré-en-tête" : "Preheader Text"}</Label>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(variant.preheader)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-sm text-muted-foreground">{variant.preheader}</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Email Body */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>{nl ? "E-mailtekst" : fr ? "Corps de l'e-mail" : "Email Body"}</Label>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(variant.body)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Card className="bg-white">
                        <CardContent className="pt-6">
                          <div className="prose max-w-none">
                            <div dangerouslySetInnerHTML={{
                              __html: variant.body.replace(/\n/g, '<br/>')
                            }} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* CTA Button */}
                    <div className="space-y-2">
                      <Label>{nl ? "Call-to-action" : fr ? "Appel à l'action" : "Call-to-Action"}</Label>
                      <Card>
                        <CardContent className="pt-4">
                          <Button className="w-full sm:w-auto">
                            {variant.cta}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Analyze Button */}
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => analyzeVariant(variant)}
                        disabled={loading}
                      >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        {nl ? "Prestaties analyseren" : fr ? "Analyser les performances" : "Analyze Performance"}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent>
                <div className="text-center space-y-4 py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto" />
                  <h3 className="text-lg font-medium">{nl ? "Nog geen campagne" : fr ? "Pas encore de campagne" : "No Campaign Yet"}</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {nl ? "Configureer je campagne-instellingen en klik op Genereren om je e-mail te maken" : fr ? "Configurez les paramètres de votre campagne et cliquez sur Générer pour créer votre e-mail" : "Configure your campaign settings and click Generate to create your email"}
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

export default EmailCampaignGenerator;