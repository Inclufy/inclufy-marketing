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
import { useLanguage } from '@/contexts/LanguageContext';

interface BrandColor {
  name: string;
  hex: string;
  usage: string;
}

export default function BrandSetup() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
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
      title: nl ? 'Merkinstellingen opgeslagen!' : fr ? 'Paramètres de marque enregistrés !' : 'Brand settings saved!',
      description: nl ? 'Je merkidentiteit is succesvol bijgewerkt.' : fr ? 'Votre identité de marque a été mise à jour avec succès.' : 'Your brand identity has been updated successfully.',
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
    <div className="w-full py-2">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{nl ? 'Merk Instellen' : fr ? 'Configuration de Marque' : 'Brand Setup'}</h1>
            <p className="text-gray-600 mt-2">{nl ? 'Definieer je merkidentiteit voor AI-gestuurde marketing' : fr ? 'Définissez votre identité de marque pour le marketing piloté par l\'IA' : 'Define your brand identity to power AI-driven marketing'}</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {completionPercentage}% {nl ? 'Voltooid' : fr ? 'Terminé' : 'Complete'}
          </Badge>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics">{nl ? 'Merk Basis' : fr ? 'Base de Marque' : 'Brand Basics'}</TabsTrigger>
          <TabsTrigger value="visual">{nl ? 'Visuele Identiteit' : fr ? 'Identité Visuelle' : 'Visual Identity'}</TabsTrigger>
          <TabsTrigger value="voice">{nl ? 'Merkstem' : fr ? 'Voix de Marque' : 'Brand Voice'}</TabsTrigger>
          <TabsTrigger value="assets">{nl ? 'Merkmaterialen' : fr ? 'Actifs de Marque' : 'Brand Assets'}</TabsTrigger>
        </TabsList>

        {/* Brand Basics */}
        <TabsContent value="basics" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Merkinformatie' : fr ? 'Informations sur la Marque' : 'Brand Information'}</CardTitle>
              <CardDescription>{nl ? 'Kerngegevens over je merk' : fr ? 'Détails essentiels sur votre marque' : 'Core details about your brand'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand-name">{nl ? 'Merknaam' : fr ? 'Nom de Marque' : 'Brand Name'}</Label>
                <Input
                  id="brand-name"
                  placeholder={nl ? 'Je bedrijfsnaam' : fr ? 'Le nom de votre entreprise' : 'Your company name'}
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">{nl ? 'Slogan' : fr ? 'Slogan' : 'Tagline'}</Label>
                <Input
                  id="tagline"
                  placeholder={nl ? 'De gedenkwaardige zin van je merk' : fr ? 'La phrase mémorable de votre marque' : "Your brand's memorable phrase"}
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mission">{nl ? 'Missie' : fr ? 'Mission' : 'Mission Statement'}</Label>
                <Textarea
                  id="mission"
                  placeholder={nl ? 'Wat je merk vooruit drijft' : fr ? 'Ce qui fait avancer votre marque' : 'What drives your brand forward'}
                  value={mission}
                  onChange={(e) => setMission(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vision">{nl ? 'Visie' : fr ? 'Vision' : 'Vision Statement'}</Label>
                <Textarea
                  id="vision"
                  placeholder={nl ? 'Waar je merk naartoe gaat' : fr ? 'Où votre marque se dirige' : 'Where your brand is heading'}
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Industrie & Markt' : fr ? 'Industrie & Marché' : 'Industry & Market'}</CardTitle>
              <CardDescription>{nl ? 'Help ons je bedrijfscontext te begrijpen' : fr ? 'Aidez-nous à comprendre votre contexte commercial' : 'Help us understand your business context'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{nl ? 'Industrie' : fr ? 'Industrie' : 'Industry'}</Label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>{nl ? 'Technologie & Software' : fr ? 'Technologie & Logiciel' : 'Technology & Software'}</option>
                  <option>{nl ? 'E-commerce & Retail' : fr ? 'E-commerce & Vente au détail' : 'E-commerce & Retail'}</option>
                  <option>{nl ? 'Gezondheidszorg & Medisch' : fr ? 'Santé & Médical' : 'Healthcare & Medical'}</option>
                  <option>{nl ? 'Financiën & Bankieren' : fr ? 'Finance & Banque' : 'Finance & Banking'}</option>
                  <option>{nl ? 'Onderwijs & Training' : fr ? 'Éducation & Formation' : 'Education & Training'}</option>
                  <option>{nl ? 'Marketing & Reclame' : fr ? 'Marketing & Publicité' : 'Marketing & Advertising'}</option>
                  <option>{nl ? 'Anders' : fr ? 'Autre' : 'Other'}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>{nl ? 'Bedrijfsgrootte' : fr ? 'Taille de l\'Entreprise' : 'Company Size'}</Label>
                <RadioGroup defaultValue="startup">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="startup" id="startup" />
                    <Label htmlFor="startup">{nl ? 'Startup (1-10 medewerkers)' : fr ? 'Startup (1-10 employés)' : 'Startup (1-10 employees)'}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="small" id="small" />
                    <Label htmlFor="small">{nl ? 'Klein Bedrijf (11-50)' : fr ? 'Petite Entreprise (11-50)' : 'Small Business (11-50)'}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">{nl ? 'Middelgroot (51-500)' : fr ? 'Moyen (51-500)' : 'Medium (51-500)'}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="enterprise" id="enterprise" />
                    <Label htmlFor="enterprise">{nl ? 'Enterprise (500+)' : fr ? 'Entreprise (500+)' : 'Enterprise (500+)'}</Label>
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
              <CardTitle>{nl ? 'Logo' : fr ? 'Logo' : 'Logo'}</CardTitle>
              <CardDescription>{nl ? 'Upload je merklogo' : fr ? 'Téléchargez votre logo de marque' : 'Upload your brand logo'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                {logoFile ? (
                  <div className="space-y-4">
                    <Image className="w-24 h-24 mx-auto text-gray-400" />
                    <p className="font-medium">{logoFile.name}</p>
                    <Button variant="outline" onClick={() => setLogoFile(null)}>
                      {nl ? 'Logo Verwijderen' : fr ? 'Supprimer le Logo' : 'Remove Logo'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <div>
                      <p className="font-medium">{nl ? 'Sleep je logo hierheen of klik om te uploaden' : fr ? 'Déposez votre logo ici ou cliquez pour télécharger' : 'Drop your logo here or click to upload'}</p>
                      <p className="text-sm text-gray-500">{nl ? 'SVG, PNG, JPG (max 5MB)' : fr ? 'SVG, PNG, JPG (max 5 Mo)' : 'SVG, PNG, JPG (max 5MB)'}</p>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="logo-upload"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                    />
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button variant="outline" as="span">{nl ? 'Bestand Kiezen' : fr ? 'Choisir un Fichier' : 'Choose File'}</Button>
                    </Label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Merkkleuren' : fr ? 'Couleurs de Marque' : 'Brand Colors'}</CardTitle>
              <CardDescription>{nl ? 'Definieer je kleurenpalet' : fr ? 'Définissez votre palette de couleurs' : 'Define your color palette'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {brandColors.map((color, index) => (
                <div key={index} className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label>{nl ? 'Kleurnaam' : fr ? 'Nom de Couleur' : 'Color Name'}</Label>
                    <Input
                      placeholder={nl ? 'Primair, Secundair, etc.' : fr ? 'Primaire, Secondaire, etc.' : 'Primary, Secondary, etc.'}
                      value={color.name}
                      onChange={(e) => handleColorChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <Label>{nl ? 'Hex Code' : fr ? 'Code Hex' : 'Hex Code'}</Label>
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
                    <Label>{nl ? 'Gebruik' : fr ? 'Utilisation' : 'Usage'}</Label>
                    <Input
                      placeholder={nl ? 'Waar deze kleur wordt gebruikt' : fr ? 'Où cette couleur est utilisée' : 'Where this color is used'}
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
                <Plus className="w-4 h-4 mr-2" /> {nl ? 'Kleur Toevoegen' : fr ? 'Ajouter une Couleur' : 'Add Color'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Typografie' : fr ? 'Typographie' : 'Typography'}</CardTitle>
              <CardDescription>{nl ? 'Selecteer je merklettertypen' : fr ? 'Sélectionnez vos polices de marque' : 'Select your brand fonts'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{nl ? 'Primair Lettertype (Koppen)' : fr ? 'Police Principale (Titres)' : 'Primary Font (Headings)'}</Label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Inter</option>
                  <option>Roboto</option>
                  <option>Open Sans</option>
                  <option>Montserrat</option>
                  <option>Playfair Display</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{nl ? 'Secundair Lettertype (Lopende tekst)' : fr ? 'Police Secondaire (Corps de texte)' : 'Secondary Font (Body text)'}</Label>
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
              <CardTitle>{nl ? 'Merkpersoonlijkheid' : fr ? 'Personnalité de Marque' : 'Brand Personality'}</CardTitle>
              <CardDescription>{nl ? 'Hoe je merk communiceert' : fr ? 'Comment votre marque communique' : 'How your brand communicates'}</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup value={brandVoice} onValueChange={setBrandVoice}>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="professional" id="professional" className="mt-1" />
                    <Label htmlFor="professional" className="space-y-1 cursor-pointer">
                      <p className="font-medium">{nl ? 'Professioneel & Gezaghebbend' : fr ? 'Professionnel & Autoritaire' : 'Professional & Authoritative'}</p>
                      <p className="text-sm text-gray-600">{nl ? 'Deskundige, betrouwbare en formele communicatie' : fr ? 'Communication experte, fiable et formelle' : 'Expert, trustworthy, and formal communication'}</p>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="friendly" id="friendly" className="mt-1" />
                    <Label htmlFor="friendly" className="space-y-1 cursor-pointer">
                      <p className="font-medium">{nl ? 'Vriendelijk & Toegankelijk' : fr ? 'Amical & Accessible' : 'Friendly & Approachable'}</p>
                      <p className="text-sm text-gray-600">{nl ? 'Warme, conversationele en herkenbare toon' : fr ? 'Ton chaleureux, conversationnel et accessible' : 'Warm, conversational, and relatable tone'}</p>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="innovative" id="innovative" className="mt-1" />
                    <Label htmlFor="innovative" className="space-y-1 cursor-pointer">
                      <p className="font-medium">{nl ? 'Innovatief & Gedurfd' : fr ? 'Innovant & Audacieux' : 'Innovative & Bold'}</p>
                      <p className="text-sm text-gray-600">{nl ? 'Vooruitstrevend, creatief en gedurfd' : fr ? 'Avant-gardiste, créatif et audacieux' : 'Forward-thinking, creative, and daring'}</p>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="playful" id="playful" className="mt-1" />
                    <Label htmlFor="playful" className="space-y-1 cursor-pointer">
                      <p className="font-medium">{nl ? 'Speels & Energiek' : fr ? 'Ludique & Énergique' : 'Playful & Energetic'}</p>
                      <p className="text-sm text-gray-600">{nl ? 'Leuk, enthousiast en luchtig' : fr ? 'Amusant, enthousiaste et léger' : 'Fun, enthusiastic, and lighthearted'}</p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Toonkenmerken' : fr ? 'Attributs de Ton' : 'Tone Attributes'}</CardTitle>
              <CardDescription>{nl ? 'Selecteer kenmerken die je merkstem beschrijven' : fr ? 'Sélectionnez les attributs qui décrivent la voix de votre marque' : 'Select attributes that describe your brand voice'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(nl
                  ? ['Zelfverzekerd', 'Empathisch', 'Inspirerend', 'Educatief', 'Humoristisch', 'Verfijnd', 'Direct', 'Ondersteunend', 'Authentiek', 'Optimistisch', 'Technisch', 'Informeel']
                  : fr
                  ? ['Confiant', 'Empathique', 'Inspirant', 'Éducatif', 'Humoristique', 'Sophistiqué', 'Direct', 'Solidaire', 'Authentique', 'Optimiste', 'Technique', 'Décontracté']
                  : ['Confident', 'Empathetic', 'Inspiring', 'Educational', 'Humorous', 'Sophisticated', 'Direct', 'Supportive', 'Authentic', 'Optimistic', 'Technical', 'Casual']
                ).map((attr) => (
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
              <CardTitle>{nl ? 'Schrijfrichtlijnen' : fr ? 'Directives de Rédaction' : 'Writing Guidelines'}</CardTitle>
              <CardDescription>{nl ? 'Specifieke regels voor het maken van content' : fr ? 'Règles spécifiques pour la création de contenu' : 'Specific rules for content creation'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{nl ? 'Wel doen' : fr ? 'À faire' : "Do's"}</Label>
                <Textarea
                  placeholder={nl ? 'Bijv. Gebruik actieve vorm, Wees beknopt, Gebruik data' : fr ? 'Ex. Utilisez la voix active, Soyez concis, Incluez des données' : 'E.g., Use active voice, Be concise, Include data'}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>{nl ? 'Niet doen' : fr ? 'À ne pas faire' : "Don'ts"}</Label>
                <Textarea
                  placeholder={nl ? 'Bijv. Vermijd jargon, Geen hoofdletters, Geen agressief taalgebruik' : fr ? 'Ex. Évitez le jargon, Pas de majuscules, Pas de langage agressif' : 'E.g., Avoid jargon, Don\'t use all caps, No aggressive language'}
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
              <CardTitle>{nl ? 'Merkrichtlijnen' : fr ? 'Directives de Marque' : 'Brand Guidelines'}</CardTitle>
              <CardDescription>{nl ? 'Upload je merkstijlgids of richtlijnen' : fr ? 'Téléchargez votre guide de style de marque' : 'Upload your brand style guide or guidelines'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="font-medium mb-2">{nl ? 'Upload Merkrichtlijnen' : fr ? 'Télécharger les Directives de Marque' : 'Upload Brand Guidelines'}</p>
                <p className="text-sm text-gray-500 mb-4">{nl ? 'PDF, DOC, DOCX (max 10MB)' : fr ? 'PDF, DOC, DOCX (max 10 Mo)' : 'PDF, DOC, DOCX (max 10MB)'}</p>
                <Button variant="outline">{nl ? 'Bestand Kiezen' : fr ? 'Choisir un Fichier' : 'Choose File'}</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Social Media Profielen' : fr ? 'Profils de Réseaux Sociaux' : 'Social Media Profiles'}</CardTitle>
              <CardDescription>{nl ? 'Verbind je social media aanwezigheid' : fr ? 'Connectez votre présence sur les réseaux sociaux' : 'Connect your social media presence'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{nl ? 'Website URL' : fr ? 'URL du Site Web' : 'Website URL'}</Label>
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
              <CardTitle>{nl ? 'Extra Materialen' : fr ? 'Actifs Supplémentaires' : 'Additional Assets'}</CardTitle>
              <CardDescription>{nl ? 'Ander merkmateriaal' : fr ? 'Autres matériels de marque' : 'Other brand materials'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="font-medium text-sm">{nl ? 'Productafbeeldingen' : fr ? 'Images de Produits' : 'Product Images'}</p>
                  <Button variant="outline" size="sm" className="mt-2">{nl ? 'Uploaden' : fr ? 'Télécharger' : 'Upload'}</Button>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="font-medium text-sm">{nl ? 'Sjablonen' : fr ? 'Modèles' : 'Templates'}</p>
                  <Button variant="outline" size="sm" className="mt-2">{nl ? 'Uploaden' : fr ? 'Télécharger' : 'Upload'}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between mt-8">
        <Button variant="outline">
          {nl ? 'Concept Opslaan' : fr ? 'Enregistrer le Brouillon' : 'Save Draft'}
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/app/quick-start')}>
            {nl ? 'Terug' : fr ? 'Retour' : 'Back'}
          </Button>
          <Button onClick={handleNext}>
            {nl ? 'Opslaan & Doorgaan' : fr ? 'Enregistrer & Continuer' : 'Save & Continue'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
