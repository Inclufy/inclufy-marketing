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
import { api } from "@/lib/api";
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
    api.get("/email/provider").then(r => setEmailProvider(r.data)).catch(() => {});
  }, []);

  const campaignTypes = [
    { value: "promotional", label: "Promotional", icon: Target },
    { value: "newsletter", label: "Newsletter", icon: Mail },
    { value: "welcome", label: "Welcome Series", icon: Users },
    { value: "abandoned", label: "Abandoned Cart", icon: RefreshCw },
    { value: "reengagement", label: "Re-engagement", icon: Zap },
  ];

  const handleGenerate = async () => {
    if (!product || !targetAudience || !goal) {
      toast.error("Please fill in all required fields");
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
          name: "Main Version",
          subject: result.subject,
          preheader: result.preheader,
          body: result.body,
          cta: result.cta,
          tone: result.tone || "professional"
        }]);
        setSelectedVariant("single");
      }

      toast.success(`Email campaign generated${enableAB ? ' with A/B variants!' : '!'}`);
    } catch (error) {
      toast.error("Failed to generate email campaign");
    }
  };

  const analyzeVariant = async (variant: EmailVariant) => {
    try {
      const analysis = await analyzeContent(
        `Subject: ${variant.subject}\n\nPreheader: ${variant.preheader}\n\nBody: ${variant.body}\n\nCTA: ${variant.cta}`
      );
      
      toast.success(
        <div>
          <p className="font-semibold">Analysis Complete!</p>
          <p className="text-sm">Score: {analysis.score}/10</p>
          <p className="text-sm">Strengths: {analysis.strengths[0]}</p>
        </div>
      );
    } catch (error) {
      toast.error("Failed to analyze variant");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
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
    toast.success("Campaign exported!");
  };

  const saveCampaignAndSend = async () => {
    const variant = variants.find(v => v.id === selectedVariant);
    if (!variant) return;

    setSending(true);
    try {
      // First save as a campaign
      const campaignRes = await api.post("/campaigns/", {
        name: `Email: ${variant.subject}`,
        type: "email",
        description: `${campaignType} email for ${product}`,
        status: "draft",
        content: { subject: variant.subject, preheader: variant.preheader, body: variant.body, cta: variant.cta },
        settings: { ab_testing: enableAB, audience: targetAudience, goal },
      });

      const campaignId = campaignRes.data?.id;

      // Then send the campaign
      await api.post("/email/send-campaign", {
        campaign_id: campaignId,
        subject: variant.subject,
        html_body: `<div>${variant.body.replace(/\n/g, "<br/>")}</div>`,
        text_body: variant.body,
      });

      toast.success("Campaign saved and emails sent to all contacts!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to send campaign");
    } finally {
      setSending(false);
    }
  };

  const saveCampaignDraft = async () => {
    const variant = variants.find(v => v.id === selectedVariant);
    if (!variant) return;

    setSaving(true);
    try {
      await api.post("/campaigns/", {
        name: `Email: ${variant.subject}`,
        type: "email",
        description: `${campaignType} email for ${product}`,
        status: "draft",
        content: { subject: variant.subject, preheader: variant.preheader, body: variant.body, cta: variant.cta },
        settings: { ab_testing: enableAB, audience: targetAudience, goal },
      });
      toast.success("Campaign saved as draft!");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to save campaign");
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
            Email Campaign Generator
          </h2>
          <p className="text-muted-foreground mt-2">
            Create high-converting email campaigns with optional A/B testing
          </p>
        </div>
        {variants.length > 0 && (
          <div className="flex items-center gap-2">
            <Button onClick={saveCampaignDraft} variant="outline" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Draft
            </Button>
            <Button onClick={exportCampaign} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            {emailProvider.configured && (
              <Button onClick={saveCampaignAndSend} disabled={sending} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {sending ? "Sending..." : "Send to Contacts"}
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
              <CardTitle>Campaign Setup</CardTitle>
              <CardDescription>
                Define your email campaign parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Campaign Type */}
              <div className="space-y-2">
                <Label>Campaign Type</Label>
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
                <Label>Product/Service</Label>
                <Input
                  placeholder="e.g., AI Marketing Platform"
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Textarea
                  placeholder="e.g., Marketing managers at B2B SaaS companies"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Campaign Goal */}
              <div className="space-y-2">
                <Label>Campaign Goal</Label>
                <Textarea
                  placeholder="e.g., Drive sign-ups for free trial"
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
                    A/B Testing
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Generate two variants to test
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
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Campaign
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Keep subject lines under 50 characters</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Use personalization tokens</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>One clear CTA per email</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Mobile-optimized design</span>
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
                  <CardTitle>Email Preview</CardTitle>
                  <div className="flex items-center gap-2">
                    {enableAB && variants.length > 1 && (
                      <Tabs value={selectedVariant} onValueChange={setSelectedVariant}>
                        <TabsList>
                          {variants.map((variant, index) => (
                            <TabsTrigger key={variant.id} value={variant.id}>
                              Variant {String.fromCharCode(65 + index)}
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
                        <Label>Subject Line</Label>
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
                        <Label>Preheader Text</Label>
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
                        <Label>Email Body</Label>
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
                      <Label>Call-to-Action</Label>
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
                        Analyze Performance
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
                  <h3 className="text-lg font-medium">No Campaign Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Configure your campaign settings and click Generate to create your email
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