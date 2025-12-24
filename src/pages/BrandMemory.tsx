import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Upload, 
  Plus, 
  Trash2, 
  Save,
  FileText,
  Link,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BookOpen,
  MessageSquare,
  Target,
  Building,
  Download,
  X
} from "lucide-react";
import { toast } from "sonner";

interface BrandDocument {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'url' | 'text';
  status: 'processing' | 'ready' | 'error';
  uploadedAt: Date;
}

interface ToneAttribute {
  attribute: string;
  description: string;
}

const BrandMemory = () => {
  const [brandName, setBrandName] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [toneAttributes, setToneAttributes] = useState<ToneAttribute[]>([
    { attribute: "Professional", description: "Maintains expertise while being approachable" },
    { attribute: "Innovative", description: "Forward-thinking and solution-oriented" },
  ]);
  const [documents, setDocuments] = useState<BrandDocument[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const addToneAttribute = () => {
    setToneAttributes([...toneAttributes, { attribute: "", description: "" }]);
  };

  const updateToneAttribute = (index: number, field: keyof ToneAttribute, value: string) => {
    const updated = [...toneAttributes];
    updated[index] = { ...updated[index], [field]: value };
    setToneAttributes(updated);
  };

  const removeToneAttribute = (index: number) => {
    setToneAttributes(toneAttributes.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newDocs = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.name.endsWith('.pdf') ? 'pdf' as const : 'doc' as const,
      status: 'processing' as const,
      uploadedAt: new Date(),
    }));

    setDocuments([...documents, ...newDocs]);
    
    // Simulate processing
    setTimeout(() => {
      setDocuments(prev => 
        prev.map(doc => 
          newDocs.find(nd => nd.id === doc.id) 
            ? { ...doc, status: 'ready' as const }
            : doc
        )
      );
      toast.success(`${files.length} document(s) processed successfully`);
    }, 2000);
  };

  const startRAGProcessing = () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          toast.success("Brand memory updated successfully!");
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Brand Memory Engine
          </h2>
          <p className="text-muted-foreground mt-2">
            Build your AI's understanding of your brand voice, values, and knowledge base
          </p>
        </div>
        <Button 
          onClick={startRAGProcessing}
          disabled={isProcessing || documents.length === 0}
        >
          {isProcessing ? (
            <>Processing... {processingProgress}%</>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Update Memory
            </>
          )}
        </Button>
      </div>

      {/* Progress Overview */}
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
        <TabsList>
          <TabsTrigger value="brand">Brand Identity</TabsTrigger>
          <TabsTrigger value="tone">Voice & Tone</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>

        {/* Brand Identity Tab */}
        <TabsContent value="brand" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Define your brand's core identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand-name">Brand Name</Label>
                <Input
                  id="brand-name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g., Inclufy Marketing"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-description">Brand Description</Label>
                <Textarea
                  id="brand-description"
                  value={brandDescription}
                  onChange={(e) => setBrandDescription(e.target.value)}
                  placeholder="Describe your brand, its mission, values, and what makes it unique..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Industry & Market</Label>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">Marketing Technology</Badge>
                  <Badge variant="secondary">B2B SaaS</Badge>
                  <Badge variant="secondary">AI Solutions</Badge>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">Marketing Managers</Badge>
                  <Badge variant="secondary">Small Businesses</Badge>
                  <Badge variant="secondary">Agencies</Badge>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Unique Selling Points
              </CardTitle>
              <CardDescription>
                What makes your brand special?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <Input 
                    placeholder="e.g., AI-powered content that maintains brand voice"
                    className="flex-1"
                  />
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <Input 
                    placeholder="e.g., 10x faster than traditional agencies"
                    className="flex-1"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Plus className="h-3 w-3 mr-1" />
                  Add USP
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice & Tone Tab */}
        <TabsContent value="tone" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Brand Voice Attributes
              </CardTitle>
              <CardDescription>
                Define how your brand communicates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {toneAttributes.map((attr, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Attribute (e.g., Professional)"
                        value={attr.attribute}
                        onChange={(e) => updateToneAttribute(index, 'attribute', e.target.value)}
                      />
                      <Input
                        placeholder="Description"
                        value={attr.description}
                        onChange={(e) => updateToneAttribute(index, 'description', e.target.value)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeToneAttribute(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addToneAttribute}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Attribute
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Messaging Guidelines</CardTitle>
              <CardDescription>
                Do's and don'ts for brand communication
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-green-600">Do's</Label>
                  <Textarea
                    placeholder="- Use inclusive language&#10;- Be solution-focused&#10;- Show empathy"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-red-600">Don'ts</Label>
                  <Textarea
                    placeholder="- Avoid jargon&#10;- Don't be pushy&#10;- No negative comparisons"
                    rows={4}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Document Library
              </CardTitle>
              <CardDescription>
                Upload documents to build your brand's knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Upload Documents</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Support for PDF, DOC, DOCX, and TXT files
                  </p>
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

                {/* Document List */}
                {documents.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Uploaded Documents</h4>
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Uploaded {doc.uploadedAt.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.status === 'processing' && (
                            <Badge variant="secondary">Processing...</Badge>
                          )}
                          {doc.status === 'ready' && (
                            <Badge variant="success">Ready</Badge>
                          )}
                          {doc.status === 'error' && (
                            <Badge variant="destructive">Error</Badge>
                          )}
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* URL Input */}
                <Separator />
                <div className="space-y-2">
                  <Label>Add Website URLs</Label>
                  <div className="flex gap-2">
                    <Input placeholder="https://example.com/about" />
                    <Button>
                      <Link className="h-4 w-4 mr-2" />
                      Add URL
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Examples Tab */}
        <TabsContent value="examples" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Examples</CardTitle>
              <CardDescription>
                Provide examples of ideal brand content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Good Example</Label>
                  <Textarea
                    placeholder="Paste an example of content that perfectly represents your brand voice..."
                    rows={4}
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    This helps the AI understand your preferred style
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Poor Example</Label>
                  <Textarea
                    placeholder="Paste an example of what NOT to do..."
                    rows={4}
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    This helps the AI avoid unwanted patterns
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Your Brand Voice</CardTitle>
              <CardDescription>
                See how the AI interprets your brand settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter a topic or prompt to test..."
                  rows={2}
                />
                <Button className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Sample Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrandMemory;