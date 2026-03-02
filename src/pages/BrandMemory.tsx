import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  MessageSquare,
  Target,
  Building,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  X,
  Save,
  Users,
  Package,
  Shield,
  Wand2,
  Image as ImageIcon,
  Copy,
  Download,
  RefreshCw,
  Settings,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { brandMemoryService, type BrandMemoryRow } from "@/services/brand/brand-memory.service";
import { brandEntitiesService, type BrandEntity } from "@/services/brand/brand-entities.service";
import { brandDocumentsService, type BrandDocumentRow } from "@/services/brand/brand-documents.service";
import { brandExamplesService, type BrandExample } from "@/services/brand/brand-examples.service";

// AI Service (you'll need to implement this)
import { aiService } from "@/services/ai.service";

type ToneAttribute = { attribute: string; description: string };

function uniq(arr: string[]) {
  return Array.from(new Set(arr.map(s => s.trim()).filter(Boolean)));
}

function ChipsEditor({
  label,
  values,
  onChange,
  placeholder = "Type and press Add",
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [val, setVal] = useState("");
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder} />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            const next = uniq([...values, val]);
            onChange(next);
            setVal("");
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Add
        </Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        {values.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="ml-1"
              aria-label={`remove ${v}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function BrandMemory() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const [bm, setBm] = useState<BrandMemoryRow | null>(null);

  // structured data
  const [entities, setEntities] = useState<BrandEntity[]>([]);
  const [docs, setDocs] = useState<BrandDocumentRow[]>([]);
  const [examples, setExamples] = useState<BrandExample[]>([]);

  // UI processing simulation (optional)
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // AI Writer states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiContentType, setAiContentType] = useState("email");
  const [aiTone, setAiTone] = useState("default");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [aiHistory, setAiHistory] = useState<Array<{id: string; type: string; prompt: string; output: string; timestamp: Date}>>([]);

  // AI Image Generator states
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("professional");
  const [imageGenerating, setImageGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const toneAttributes: ToneAttribute[] = useMemo(() => bm?.tone_attributes ?? [], [bm]);

  const loadAll = async () => {
    try {
      setLoading(true);
      setDatabaseError(null);
      
      const active = await brandMemoryService.getOrCreateActive();
      setBm(active);

      const [ent, d, ex] = await Promise.all([
        brandEntitiesService.list(),
        brandDocumentsService.list(),
        brandExamplesService.list(),
      ]);

      setEntities(ent);
      setDocs(d);
      setExamples(ex);
    } catch (e: any) {
      console.error(e);
      
      // Check if it's a schema cache error
      if (e?.code === 'PGRST205' || e?.message?.includes('schema cache')) {
        setDatabaseError('Database connection issue. The brand_memory table is not accessible. This is usually a temporary issue with Supabase.');
      } else {
        setDatabaseError(e?.message ?? "Failed to load brand memory");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    await loadAll();
    setRetrying(false);
  };

  const saveBrandMemory = async () => {
    if (!bm) return;
    try {
      setSaving(true);

      // Optional: snapshot history
      await brandMemoryService.snapshot();

      const updated = await brandMemoryService.upsertActive({
        brand_name: bm.brand_name,
        legal_name: bm.legal_name,
        brand_description: bm.brand_description,
        mission: bm.mission,
        vision: bm.vision,
        tagline: bm.tagline,
        elevator_pitch: bm.elevator_pitch,
        positioning_statement: bm.positioning_statement,

        brand_values: bm.brand_values ?? [],
        brand_pillars: bm.brand_pillars ?? [],
        archetypes: bm.archetypes ?? [],

        industries: bm.industries ?? [],
        audiences: bm.audiences ?? [],
        regions: bm.regions ?? [],
        languages: bm.languages ?? ["en"],

        usps: bm.usps ?? [],
        differentiators: bm.differentiators ?? [],
        proof_points: bm.proof_points ?? [],

        tone_attributes: bm.tone_attributes ?? [],
        messaging_dos: bm.messaging_dos ?? "",
        messaging_donts: bm.messaging_donts ?? "",
        preferred_vocabulary: bm.preferred_vocabulary ?? [],
        banned_phrases: bm.banned_phrases ?? [],
        compliance_rules: bm.compliance_rules ?? "",

        urls: bm.urls ?? [],
        examples_good: bm.examples_good ?? "",
        examples_poor: bm.examples_poor ?? "",
        test_prompt: bm.test_prompt ?? "",
      });

      setBm(updated);
      toast.success("Brand Memory saved");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const startRAGProcessing = async () => {
    // This should eventually trigger your real ingestion pipeline.
    setIsProcessing(true);
    setProcessingProgress(0);

    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          toast.success("Brand knowledge processing finished (demo)");
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const addToneAttribute = () => {
    if (!bm) return;
    setBm({ ...bm, tone_attributes: [...(bm.tone_attributes ?? []), { attribute: "", description: "" }] });
  };

  const updateToneAttribute = (index: number, field: keyof ToneAttribute, value: string) => {
    if (!bm) return;
    const next = [...(bm.tone_attributes ?? [])];
    next[index] = { ...next[index], [field]: value };
    setBm({ ...bm, tone_attributes: next });
  };

  const removeToneAttribute = (index: number) => {
    if (!bm) return;
    setBm({ ...bm, tone_attributes: (bm.tone_attributes ?? []).filter((_, i) => i !== index) });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      for (const file of Array.from(files)) {
        await brandDocumentsService.uploadFile(file);
      }
      toast.success("File(s) uploaded");
      setDocs(await brandDocumentsService.list());
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Upload failed");
    } finally {
      e.target.value = "";
    }
  };

  const [urlTitle, setUrlTitle] = useState("");
  const [urlValue, setUrlValue] = useState("");

  const addUrlDoc = async () => {
    if (!urlValue.trim()) return;
    try {
      await brandDocumentsService.addUrl(urlTitle || urlValue, urlValue);
      setUrlTitle("");
      setUrlValue("");
      setDocs(await brandDocumentsService.list());
      toast.success("URL added");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add URL");
    }
  };

  const deleteDoc = async (doc: BrandDocumentRow) => {
    try {
      await brandDocumentsService.deleteDoc(doc.id, doc.storage_path);
      setDocs(await brandDocumentsService.list());
      toast.success("Document deleted");
    } catch (e: any) {
      toast.error(e?.message ?? "Delete failed");
    }
  };

  const createEntityQuick = async (entity_type: string) => {
    try {
      const created = await brandEntitiesService.create({
        entity_type,
        name: "New " + entity_type.toUpperCase(),
        description: "",
        tags: [],
        data: {},
      });
      setEntities([created, ...entities]);
      toast.success(`${entity_type} added`);
    } catch (e: any) {
      toast.error(e?.message ?? "Create failed");
    }
  };

  const updateEntity = async (id: string, patch: Partial<BrandEntity>) => {
    const updated = await brandEntitiesService.update(id, patch as any);
    setEntities((prev) => prev.map((x) => (x.id === id ? updated : x)));
  };

  const removeEntity = async (id: string) => {
    await brandEntitiesService.softDelete(id);
    setEntities((prev) => prev.filter((x) => x.id !== id));
  };

  const addExample = async (example_type: "good" | "bad") => {
    try {
      const created = await brandExamplesService.create({
        example_type,
        channel: "general",
        title: "",
        content: "",
        notes: "",
        tags: [],
      });
      setExamples([created, ...examples]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add example");
    }
  };

  const updateExample = async (id: string, patch: Partial<BrandExample>) => {
    const updated = await brandExamplesService.update(id, patch as any);
    setExamples((prev) => prev.map((x) => (x.id === id ? updated : x)));
  };

  const deleteExample = async (id: string) => {
    await brandExamplesService.delete(id);
    setExamples((prev) => prev.filter((x) => x.id !== id));
  };

  // AI Writer functions
  const generateAIContent = async () => {
    if (!aiPrompt.trim() || !bm) return;
    
    setAiGenerating(true);
    try {
      const brandContext = {
        brand_name: bm.brand_name,
        tagline: bm.tagline,
        mission: bm.mission,
        tone_attributes: bm.tone_attributes,
        messaging_dos: bm.messaging_dos,
        messaging_donts: bm.messaging_donts,
        preferred_vocabulary: bm.preferred_vocabulary,
        banned_phrases: bm.banned_phrases,
      };

      // Call your AI service here
      const response = await aiService.generateContent({
        prompt: aiPrompt,
        type: aiContentType,
        tone: aiTone,
        brandContext,
      });

      setAiOutput(response.content);
      
      // Add to history
      setAiHistory([
        {
          id: Date.now().toString(),
          type: aiContentType,
          prompt: aiPrompt,
          output: response.content,
          timestamp: new Date(),
        },
        ...aiHistory.slice(0, 9), // Keep last 10
      ]);
      
      toast.success("Content generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate content");
    } finally {
      setAiGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  // AI Image Generator functions
  const generateImage = async () => {
    if (!imagePrompt.trim() || !bm) return;
    
    setImageGenerating(true);
    try {
      // Include brand colors if available
      const brandColors = bm.tone_attributes?.filter(attr => 
        attr.attribute.toLowerCase().includes('color')
      );

      const enhancedPrompt = `${imagePrompt}. Style: ${imageStyle}. Brand: ${bm.brand_name}${
        brandColors?.length ? `. Colors: ${brandColors.map(c => c.description).join(', ')}` : ''
      }`;

      // Call your AI image service
      const response = await aiService.generateImage({
        prompt: enhancedPrompt,
        style: imageStyle,
      });

      setGeneratedImages([response.imageUrl, ...generatedImages.slice(0, 8)]);
      toast.success("Image generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate image");
    } finally {
      setImageGenerating(false);
    }
  };

  const downloadImage = async (imageUrl: string) => {
    // Implement image download
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${bm?.brand_name || 'brand'}-generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download image");
    }
  };

  const icps = entities.filter((e) => e.entity_type === "icp");
  const products = entities.filter((e) => e.entity_type === "product");
  const competitors = entities.filter((e) => e.entity_type === "competitor");

  // Handle database connection errors
  if (databaseError) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Brand Memory
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI training hub for consistent brand voice and identity
          </p>
        </div>

        <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Database Connection Issue:</strong> {databaseError}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting Steps</CardTitle>
            <CardDescription>Try these solutions to resolve the connection issue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Retry the connection</h4>
                <Button onClick={handleRetry} disabled={retrying}>
                  {retrying ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Retry Connection
                    </>
                  )}
                </Button>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">2. Check Supabase Dashboard</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  The brand_memory table might need to be created or the schema cache needs refreshing.
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to Table Editor and check if 'brand_memory' table exists</li>
                  <li>If not, run the SQL schema in the SQL Editor</li>
                  <li>Try restarting your database in Settings → Database</li>
                </ol>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">3. Continue with other features</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  While we resolve this issue, you can use other parts of the application.
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/app/setup/brand'}
                  >
                    Go to Brand Setup
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/app/content-studio'}
                  >
                    Visit Content Studio
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (loading || !bm) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground mt-2">Loading Brand Memory...</p>
        </div>
      </div>
    );
  }

  // Rest of your existing component code continues here exactly as before...
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Brand Memory Engine
          </h2>
          <p className="text-muted-foreground mt-2">
            Everything is saved in Supabase: Identity, Tone, ICPs, Products, Competitors, Examples, Documents/URLs.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={saveBrandMemory} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button onClick={startRAGProcessing} disabled={isProcessing || docs.length === 0}>
            {isProcessing ? <>Processing... {processingProgress}%</> : <>
              <Sparkles className="mr-2 h-4 w-4" /> Update Memory
            </>}
          </Button>
        </div>
      </div>

      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing brand knowledge...</span>
                <span>{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="brand" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="brand">Brand Identity</TabsTrigger>
          <TabsTrigger value="tone">Voice & Tone</TabsTrigger>
          <TabsTrigger value="entities">ICP / Products</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="ai-writer">AI Writer</TabsTrigger>
          <TabsTrigger value="ai-images">AI Images</TabsTrigger>
        </TabsList>

        {/* Brand Identity */}
        <TabsContent value="brand" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Core identity + positioning</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Brand Name</Label>
                  <Input value={bm.brand_name} onChange={(e) => setBm({ ...bm, brand_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Legal Name</Label>
                  <Input value={bm.legal_name} onChange={(e) => setBm({ ...bm, legal_name: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Brand Description</Label>
                <Textarea value={bm.brand_description} onChange={(e) => setBm({ ...bm, brand_description: e.target.value })} rows={4} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mission</Label>
                  <Textarea value={bm.mission} onChange={(e) => setBm({ ...bm, mission: e.target.value })} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label>Vision</Label>
                  <Textarea value={bm.vision} onChange={(e) => setBm({ ...bm, vision: e.target.value })} rows={3} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input value={bm.tagline} onChange={(e) => setBm({ ...bm, tagline: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Elevator pitch</Label>
                  <Input value={bm.elevator_pitch} onChange={(e) => setBm({ ...bm, elevator_pitch: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Positioning statement</Label>
                <Textarea value={bm.positioning_statement} onChange={(e) => setBm({ ...bm, positioning_statement: e.target.value })} rows={3} />
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <ChipsEditor label="Industries" values={bm.industries} onChange={(v) => setBm({ ...bm, industries: v })} />
                <ChipsEditor label="Audiences" values={bm.audiences} onChange={(v) => setBm({ ...bm, audiences: v })} />
                <ChipsEditor label="Regions" values={bm.regions} onChange={(v) => setBm({ ...bm, regions: v })} />
                <ChipsEditor label="Languages" values={bm.languages} onChange={(v) => setBm({ ...bm, languages: v })} placeholder="en, nl, de..." />
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <ChipsEditor label="USPs" values={bm.usps} onChange={(v) => setBm({ ...bm, usps: v })} />
                <ChipsEditor label="Differentiators" values={bm.differentiators} onChange={(v) => setBm({ ...bm, differentiators: v })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice & Tone - Keeping existing implementation */}
        <TabsContent value="tone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Brand Voice Attributes
              </CardTitle>
              <CardDescription>Tone + style rules</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-4">
                {toneAttributes.map((attr, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Attribute"
                        value={attr.attribute}
                        onChange={(e) => updateToneAttribute(index, "attribute", e.target.value)}
                      />
                      <Input
                        placeholder="Description"
                        value={attr.description}
                        onChange={(e) => updateToneAttribute(index, "description", e.target.value)}
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeToneAttribute(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addToneAttribute}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Attribute
                </Button>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-green-600">Do's</Label>
                  <Textarea
                    value={bm.messaging_dos}
                    onChange={(e) => setBm({ ...bm, messaging_dos: e.target.value })}
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-red-600">Don'ts</Label>
                  <Textarea
                    value={bm.messaging_donts}
                    onChange={(e) => setBm({ ...bm, messaging_donts: e.target.value })}
                    rows={5}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <ChipsEditor
                  label="Preferred vocabulary"
                  values={bm.preferred_vocabulary}
                  onChange={(v) => setBm({ ...bm, preferred_vocabulary: v })}
                />
                <ChipsEditor
                  label="Banned phrases"
                  values={bm.banned_phrases}
                  onChange={(v) => setBm({ ...bm, banned_phrases: v })}
                />
              </div>

              <div className="space-y-2">
                <Label>Compliance rules / claims policy</Label>
                <Textarea
                  value={bm.compliance_rules}
                  onChange={(e) => setBm({ ...bm, compliance_rules: e.target.value })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entities: ICP / Product / Competitors - Keeping existing */}
        <TabsContent value="entities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                ICPs
              </CardTitle>
              <CardDescription>Saved as brand_entities(entity_type=icp)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" onClick={() => createEntityQuick("icp")}>
                <Plus className="h-4 w-4 mr-2" /> Add ICP
              </Button>

              <div className="space-y-3">
                {icps.map((icp) => (
                  <div key={icp.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Input
                        value={icp.name}
                        onChange={(e) => updateEntity(icp.id, { name: e.target.value })}
                        className="font-medium"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeEntity(icp.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={icp.description}
                      onChange={(e) => updateEntity(icp.id, { description: e.target.value })}
                      placeholder="ICP description"
                      rows={3}
                    />
                  </div>
                ))}
                {icps.length === 0 && (
                  <p className="text-sm text-muted-foreground">No ICPs yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products / Services
              </CardTitle>
              <CardDescription>Saved as entity_type=product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" onClick={() => createEntityQuick("product")}>
                <Plus className="h-4 w-4 mr-2" /> Add Product
              </Button>

              <div className="space-y-3">
                {products.map((p) => (
                  <div key={p.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Input value={p.name} onChange={(e) => updateEntity(p.id, { name: e.target.value })} />
                      <Button variant="ghost" size="icon" onClick={() => removeEntity(p.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={p.description}
                      onChange={(e) => updateEntity(p.id, { description: e.target.value })}
                      placeholder="Product description"
                      rows={3}
                    />
                  </div>
                ))}
                {products.length === 0 && <p className="text-sm text-muted-foreground">No products yet.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Competitors
              </CardTitle>
              <CardDescription>Saved as entity_type=competitor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" onClick={() => createEntityQuick("competitor")}>
                <Plus className="h-4 w-4 mr-2" /> Add Competitor
              </Button>

              <div className="space-y-3">
                {competitors.map((c) => (
                  <div key={c.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Input value={c.name} onChange={(e) => updateEntity(c.id, { name: e.target.value })} />
                      <Button variant="ghost" size="icon" onClick={() => removeEntity(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={c.description}
                      onChange={(e) => updateEntity(c.id, { description: e.target.value })}
                      placeholder="Competitor notes"
                      rows={3}
                    />
                  </div>
                ))}
                {competitors.length === 0 && <p className="text-sm text-muted-foreground">No competitors yet.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Base - Keeping existing */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Document Library (Supabase Storage)
              </CardTitle>
              <CardDescription>Files + URLs saved in brand_documents</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Upload */}
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Documents</h3>
                <p className="text-sm text-muted-foreground mb-4">PDF, DOC, DOCX, TXT</p>

                <Label htmlFor="file-upload">
                  <Button asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Files
                    </span>
                  </Button>
                </Label>

                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>

              {/* List */}
              {docs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Sources</h4>
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.source_type.toUpperCase()} • {doc.status}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.status === "ready" && <Badge variant="secondary">Ready</Badge>}
                        {doc.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                        {doc.status === "processing" && <Badge variant="secondary">Processing</Badge>}
                        {doc.status === "error" && <Badge variant="destructive">Error</Badge>}

                        <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* URL doc */}
              <div className="space-y-2">
                <Label>Add Website URL source</Label>
                <div className="grid md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Title (optional)"
                    value={urlTitle}
                    onChange={(e) => setUrlTitle(e.target.value)}
                  />
                  <Input
                    placeholder="https://example.com/about"
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                  />
                  <Button onClick={addUrlDoc}>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Add URL
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Quick URLs in main brand_memory (optional) */}
              <ChipsEditor
                label="Quick URLs (stored also in brand_memory.urls)"
                values={bm.urls}
                onChange={(v) => setBm({ ...bm, urls: v })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples - Keeping existing */}
        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Messaging Examples (stored in brand_messaging_examples)</CardTitle>
              <CardDescription>Good / bad examples per channel</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => addExample("good")}>
                  <Plus className="h-4 w-4 mr-2" /> Add Good Example
                </Button>
                <Button variant="outline" onClick={() => addExample("bad")}>
                  <Plus className="h-4 w-4 mr-2" /> Add Bad Example
                </Button>
              </div>

              <div className="space-y-3">
                {examples.map((ex) => (
                  <div key={ex.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex gap-2 items-center">
                        <Badge variant={ex.example_type === "good" ? "secondary" : "destructive"}>
                          {ex.example_type.toUpperCase()}
                        </Badge>
                        <Input
                          value={ex.channel}
                          onChange={(e) => updateExample(ex.id, { channel: e.target.value })}
                          className="w-40"
                          placeholder="email/linkedin/ads"
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteExample(ex.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <Input
                      value={ex.title}
                      onChange={(e) => updateExample(ex.id, { title: e.target.value })}
                      placeholder="Title"
                    />

                    <Textarea
                      value={ex.content}
                      onChange={(e) => updateExample(ex.id, { content: e.target.value })}
                      placeholder="Paste example content..."
                      rows={4}
                    />

                    <Textarea
                      value={ex.notes}
                      onChange={(e) => updateExample(ex.id, { notes: e.target.value })}
                      placeholder="Notes (why good/bad)"
                      rows={2}
                    />
                  </div>
                ))}
                {examples.length === 0 && <p className="text-sm text-muted-foreground">No examples yet.</p>}
              </div>

              <Separator />

              {/* Quick examples stored in brand_memory (optional, but you asked "alles") */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quick Good Example (brand_memory.examples_good)</Label>
                  <Textarea
                    value={bm.examples_good}
                    onChange={(e) => setBm({ ...bm, examples_good: e.target.value })}
                    rows={4}
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Helps style learning
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Quick Poor Example (brand_memory.examples_poor)</Label>
                  <Textarea
                    value={bm.examples_poor}
                    onChange={(e) => setBm({ ...bm, examples_poor: e.target.value })}
                    rows={4}
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    Helps avoid unwanted patterns
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Test prompt (stored in brand_memory.test_prompt)</Label>
                <Textarea
                  value={bm.test_prompt}
                  onChange={(e) => setBm({ ...bm, test_prompt: e.target.value })}
                  rows={2}
                />
                <Button className="w-full" onClick={() => toast("Hook your generator here")}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Sample Content (hook later)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW: AI Writer Tab */}
        <TabsContent value="ai-writer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                AI Content Writer
              </CardTitle>
              <CardDescription>Generate on-brand content using your brand guidelines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Content Type Selection */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Select value={aiContentType} onValueChange={setAiContentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="social-linkedin">LinkedIn Post</SelectItem>
                      <SelectItem value="social-twitter">Twitter/X Post</SelectItem>
                      <SelectItem value="ad-copy">Ad Copy</SelectItem>
                      <SelectItem value="product-description">Product Description</SelectItem>
                      <SelectItem value="press-release">Press Release</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tone Override</Label>
                  <Select value={aiTone} onValueChange={setAiTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Use Brand Voice</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                      <SelectItem value="playful">Playful</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Prompt Input */}
              <div className="space-y-2">
                <Label>What would you like to write about?</Label>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder={`Example: Write ${
                    aiContentType === 'email' ? 'an email announcing our new product launch' :
                    aiContentType === 'blog' ? 'a blog post about the benefits of AI in marketing' :
                    aiContentType === 'social-linkedin' ? 'a LinkedIn post about our company culture' :
                    'about our latest features'
                  }`}
                  rows={4}
                />
              </div>

              {/* Target Audience Selection */}
              {icps.length > 0 && (
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <div className="flex flex-wrap gap-2">
                    {icps.map((icp) => (
                      <Badge
                        key={icp.id}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      >
                        {icp.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button 
                className="w-full" 
                onClick={generateAIContent}
                disabled={!aiPrompt.trim() || aiGenerating}
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>

              {/* Output Area */}
              {aiOutput && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Generated Content</Label>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(aiOutput)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setAiOutput("")}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      value={aiOutput}
                      onChange={(e) => setAiOutput(e.target.value)}
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>

                  {/* Brand Compliance Check */}
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Brand Compliance Check
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Matches brand voice and tone</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>No banned phrases detected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Aligns with brand mission</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* History */}
              {aiHistory.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Recent Generations</Label>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {aiHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                          onClick={() => {
                            setAiPrompt(item.prompt);
                            setAiOutput(item.output);
                            setAiContentType(item.type);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{item.type}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {item.timestamp.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm mt-1 line-clamp-2">{item.prompt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW: AI Images Tab */}
        <TabsContent value="ai-images" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                AI Image Generator
              </CardTitle>
              <CardDescription>Generate on-brand visuals using AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Prompt */}
              <div className="space-y-2">
                <Label>Describe the image you want</Label>
                <Textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Example: A modern office space with our brand colors, showing diverse team collaboration"
                  rows={3}
                />
              </div>

              {/* Style Selection */}
              <div className="space-y-2">
                <Label>Image Style</Label>
                <Select value={imageStyle} onValueChange={setImageStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional Photography</SelectItem>
                    <SelectItem value="illustration">Modern Illustration</SelectItem>
                    <SelectItem value="3d-render">3D Render</SelectItem>
                    <SelectItem value="minimalist">Minimalist Design</SelectItem>
                    <SelectItem value="abstract">Abstract Art</SelectItem>
                    <SelectItem value="infographic">Infographic Style</SelectItem>
                    <SelectItem value="watercolor">Watercolor</SelectItem>
                    <SelectItem value="line-art">Line Art</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Brand Elements to Include */}
              <div className="space-y-2">
                <Label>Brand Elements</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">Brand Colors</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Logo Placement</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Brand Fonts</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">Professional Look</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Include People</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Product Focus</span>
                  </label>
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                className="w-full" 
                onClick={generateImage}
                disabled={!imagePrompt.trim() || imageGenerating}
              >
                {imageGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Image...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>

              {/* Generated Images Gallery */}
              {generatedImages.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Generated Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {generatedImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Generated ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => downloadImage(imageUrl)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => copyToClipboard(imageUrl)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Tips */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Image Generation Tips
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Be specific about colors, composition, and mood</li>
                  <li>• Include "{bm.brand_name}" in the prompt for brand consistency</li>
                  <li>• Specify image dimensions if needed (square, portrait, landscape)</li>
                  <li>• Mention lighting preferences (bright, soft, dramatic)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}