// src/pages/setup/BrandSetup.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Upload, 
  Palette, 
  Type, 
  Sparkles,
  Check,
  ChevronRight,
  Download,
  Eye,
  Plus,
  X,
  Image,
  FileText,
  Globe
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

interface BrandColor {
  name: string;
  hex: string;
  usage: string;
}

export default function BrandSetup() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('basics');
  const [brandName, setBrandName] = useState('');
  const [tagline, setTagline] = useState('');
  const [mission, setMission] = useState('');
  const [vision, setVision] = useState('');
  const [brandColors, setBrandColors] = useState<BrandColor[]>([
    { name: 'Primary', hex: '#8B5CF6', usage: 'Main brand color' },
    { name: 'Secondary', hex: '#EC4899', usage: 'Accent color' }
  ]);
  const [brandVoice, setBrandVoice] = useState('professional');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleColorAdd = () => {
    setBrandColors([...brandColors, { name: '', hex: '#000000', usage: '' }]);
  };

  const handleColorRemove = (index: number) => {
    setBrandColors(brandColors.filter((_, i) => i !== index));
  };

  const handleColorChange = (index: number, field: keyof BrandColor, value: string) => {
    const updated = [...brandColors];
    updated[index][field] = value;
    setBrandColors(updated);
  };

  const handleSave = () => {
    toast({
      title: "Brand settings saved!",
      description: "Your brand identity has been updated successfully.",
    });
  };

  const handleNext = () => {
    handleSave();
    navigate('/app/setup/audience');
  };

  const completionPercentage = 
    (brandName ? 25 : 0) + 
    (tagline ? 25 : 0) + 
    (brandColors.length >= 2 ? 25 : 0) + 
    (logoFile ? 25 : 0);

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Brand Setup</h1>
            <p className="text-gray-600 mt-2">Define your brand identity to power AI-driven marketing</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {completionPercentage}% Complete
          </Badge>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics">Brand Basics</TabsTrigger>
          <TabsTrigger value="visual">Visual Identity</TabsTrigger>
          <TabsTrigger value="voice">Brand Voice</TabsTrigger>
          <TabsTrigger value="assets">Brand Assets</TabsTrigger>
        </TabsList>

        {/* Brand Basics */}
        <TabsContent value="basics" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Information</CardTitle>
              <CardDescription>Core details about your brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand-name">Brand Name</Label>
                <Input
                  id="brand-name"
                  placeholder="Your company name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  placeholder="Your brand's memorable phrase"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mission">Mission Statement</Label>
                <Textarea
                  id="mission"
                  placeholder="What drives your brand forward"
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vision">Vision Statement</Label>
                <Textarea
                  id="vision"
                  placeholder="Where your brand is heading"
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Industry & Market</CardTitle>
              <CardDescription>Help us understand your business context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Industry</Label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Technology & Software</option>
                  <option>E-commerce & Retail</option>
                  <option>Healthcare & Medical</option>
                  <option>Finance & Banking</option>
                  <option>Education & Training</option>
                  <option>Marketing & Advertising</option>
                  <option>Other</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>Company Size</Label>
                <RadioGroup defaultValue="startup">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="startup" id="startup" />
                    <Label htmlFor="startup">Startup (1-10 employees)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="small" id="small" />
                    <Label htmlFor="small">Small Business (11-50)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">Medium (51-500)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="enterprise" id="enterprise" />
                    <Label htmlFor="enterprise">Enterprise (500+)</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visual Identity */}
        <TabsContent value="visual" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>Upload your brand logo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                {logoFile ? (
                  <div className="space-y-4">
                    <Image className="w-24 h-24 mx-auto text-gray-400" />
                    <p className="font-medium">{logoFile.name}</p>
                    <Button variant="outline" onClick={() => setLogoFile(null)}>
                      Remove Logo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <div>
                      <p className="font-medium">Drop your logo here or click to upload</p>
                      <p className="text-sm text-gray-500">SVG, PNG, JPG (max 5MB)</p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="logo-upload"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    />
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button variant="outline" as="span">Choose File</Button>
                    </Label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Define your color palette</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {brandColors.map((color, index) => (
                <div key={index} className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label>Color Name</Label>
                    <Input
                      placeholder="Primary, Secondary, etc."
                      value={color.name}
                      onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <Label>Hex Code</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={color.hex}
                        onChange={(e) => handleColorChange(index, 'hex', e.target.value)}
                        className="w-12 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        value={color.hex}
                        onChange={(e) => handleColorChange(index, 'hex', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label>Usage</Label>
                    <Input
                      placeholder="Where this color is used"
                      value={color.usage}
                      onChange={(e) => handleColorChange(index, 'usage', e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleColorRemove(index)}
                    disabled={brandColors.length <= 1}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={handleColorAdd} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Color
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Select your brand fonts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary Font (Headings)</Label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Inter</option>
                  <option>Roboto</option>
                  <option>Open Sans</option>
                  <option>Montserrat</option>
                  <option>Playfair Display</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Secondary Font (Body text)</Label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Inter</option>
                  <option>Roboto</option>
                  <option>Open Sans</option>
                  <option>Lato</option>
                  <option>Source Sans Pro</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brand Voice */}
        <TabsContent value="voice" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Personality</CardTitle>
              <CardDescription>How your brand communicates</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={brandVoice} onValueChange={setBrandVoice}>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="professional" id="professional" className="mt-1" />
                    <Label htmlFor="professional" className="space-y-1 cursor-pointer">
                      <p className="font-medium">Professional & Authoritative</p>
                      <p className="text-sm text-gray-600">Expert, trustworthy, and formal communication</p>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="friendly" id="friendly" className="mt-1" />
                    <Label htmlFor="friendly" className="space-y-1 cursor-pointer">
                      <p className="font-medium">Friendly & Approachable</p>
                      <p className="text-sm text-gray-600">Warm, conversational, and relatable tone</p>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="innovative" id="innovative" className="mt-1" />
                    <Label htmlFor="innovative" className="space-y-1 cursor-pointer">
                      <p className="font-medium">Innovative & Bold</p>
                      <p className="text-sm text-gray-600">Forward-thinking, creative, and daring</p>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="playful" id="playful" className="mt-1" />
                    <Label htmlFor="playful" className="space-y-1 cursor-pointer">
                      <p className="font-medium">Playful & Energetic</p>
                      <p className="text-sm text-gray-600">Fun, enthusiastic, and lighthearted</p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tone Attributes</CardTitle>
              <CardDescription>Select attributes that describe your brand voice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Confident', 'Empathetic', 'Inspiring', 'Educational', 'Humorous', 'Sophisticated', 
                  'Direct', 'Supportive', 'Authentic', 'Optimistic', 'Technical', 'Casual'].map((attr) => (
                  <Badge
                    key={attr}
                    variant="outline"
                    className="py-2 px-4 cursor-pointer hover:bg-purple-50 hover:border-purple-600"
                  >
                    {attr}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Writing Guidelines</CardTitle>
              <CardDescription>Specific rules for content creation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Do's</Label>
                <Textarea
                  placeholder="E.g., Use active voice, Be concise, Include data"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Don'ts</Label>
                <Textarea
                  placeholder="E.g., Avoid jargon, Don't use all caps, No aggressive language"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Brand Assets */}
        <TabsContent value="assets" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Guidelines</CardTitle>
              <CardDescription>Upload your brand style guide or guidelines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="font-medium mb-2">Upload Brand Guidelines</p>
                <p className="text-sm text-gray-500 mb-4">PDF, DOC, DOCX (max 10MB)</p>
                <Button variant="outline">Choose File</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media Profiles</CardTitle>
              <CardDescription>Connect your social media presence</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Website URL</Label>
                <div className="flex gap-2">
                  <Globe className="w-5 h-5 text-gray-400 mt-2" />
                  <Input placeholder="https://www.yourwebsite.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input placeholder="https://linkedin.com/company/yourcompany" />
              </div>
              <div className="space-y-2">
                <Label>Twitter/X</Label>
                <Input placeholder="https://twitter.com/yourhandle" />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input placeholder="https://instagram.com/yourhandle" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Assets</CardTitle>
              <CardDescription>Other brand materials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="font-medium text-sm">Product Images</p>
                  <Button variant="outline" size="sm" className="mt-2">Upload</Button>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="font-medium text-sm">Templates</p>
                  <Button variant="outline" size="sm" className="mt-2">Upload</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between mt-8">
        <Button variant="outline">
          Save Draft
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/app/quick-start')}>
            Back
          </Button>
          <Button onClick={handleNext}>
            Save & Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}