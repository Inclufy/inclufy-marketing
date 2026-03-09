// src/pages/setup/TargetAudience.tsx
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
import { Slider } from '@/components/ui/slider';
import {
  Users,
  User,
  Target,
  Brain,
  TrendingUp,
  ShoppingBag,
  Heart,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Briefcase,
  Globe,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface Persona {
  id: string;
  name: string;
  age: string;
  gender: string;
  occupation: string;
  income: string;
  location: string;
  goals: string[];
  painPoints: string[];
  interests: string[];
  buyingBehavior: string;
  avatar?: string;
}

export default function TargetAudience() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [activeTab, setActiveTab] = useState('overview');
  const [personas, setPersonas] = useState<Persona[]>([
    {
      id: '1',
      name: 'Marketing Manager Mike',
      age: '35-45',
      gender: 'Male',
      occupation: 'Marketing Manager',
      income: '$80k-120k',
      location: 'Urban areas',
      goals: ['Increase ROI', 'Automate workflows', 'Better reporting'],
      painPoints: ['Time constraints', 'Multiple tools', 'Limited budget'],
      interests: ['Technology', 'Data analytics', 'Professional development'],
      buyingBehavior: 'Research-driven, seeks ROI proof'
    }
  ]);
  const [currentPersona, setCurrentPersona] = useState(0);

  const handlePersonaAdd = () => {
    const newPersona: Persona = {
      id: Date.now().toString(),
      name: nl ? 'Nieuw Persona' : fr ? 'Nouveau Persona' : 'New Persona',
      age: '',
      gender: '',
      occupation: '',
      income: '',
      location: '',
      goals: [],
      painPoints: [],
      interests: [],
      buyingBehavior: ''
    };
    setPersonas([...personas, newPersona]);
    setCurrentPersona(personas.length);
  };

  const handlePersonaUpdate = (field: keyof Persona, value: any) => {
    const updated = [...personas];
    updated[currentPersona] = {
      ...updated[currentPersona],
      [field]: value
    };
    setPersonas(updated);
  };

  const handlePersonaDelete = (index: number) => {
    if (personas.length > 1) {
      setPersonas(personas.filter((_, i) => i !== index));
      setCurrentPersona(Math.max(0, currentPersona - 1));
    }
  };

  const handleSave = () => {
    toast({
      title: nl ? 'Doelgroep opgeslagen!' : fr ? 'Public cible enregistré !' : 'Target audience saved!',
      description: nl ? 'Je doelgroepprofielen zijn succesvol bijgewerkt.' : fr ? 'Vos profils d\'audience ont été mis à jour avec succès.' : 'Your audience profiles have been updated successfully.',
    });
  };

  const handleNext = () => {
    handleSave();
    navigate('/app/setup/goals');
  };

  const completionPercentage = personas.filter(p =>
    p.name && p.age && p.occupation && p.goals.length > 0
  ).length / personas.length * 100;

  return (
    <div className="w-full py-2">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{nl ? 'Doelgroep' : fr ? 'Public Cible' : 'Target Audience'}</h1>
            <p className="text-gray-600 mt-2">{nl ? 'Definieer je ideale klantpersona\'s' : fr ? 'Définissez vos personas clients idéaux' : 'Define your ideal customer personas'}</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {Math.round(completionPercentage)}% {nl ? 'Voltooid' : fr ? 'Terminé' : 'Complete'}
          </Badge>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{nl ? 'Marktoverzicht' : fr ? 'Aperçu du Marché' : 'Market Overview'}</TabsTrigger>
          <TabsTrigger value="personas">{nl ? 'Persona\'s' : fr ? 'Personas' : 'Personas'} ({personas.length})</TabsTrigger>
          <TabsTrigger value="journey">{nl ? 'Klantreis' : fr ? 'Parcours Client' : 'Customer Journey'}</TabsTrigger>
          <TabsTrigger value="insights">{nl ? 'AI Inzichten' : fr ? 'Insights IA' : 'AI Insights'}</TabsTrigger>
        </TabsList>

        {/* Market Overview */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Marktdefinitie' : fr ? 'Définition du Marché' : 'Market Definition'}</CardTitle>
              <CardDescription>{nl ? 'Definieer de kenmerken van je doelmarkt' : fr ? 'Définissez les caractéristiques de votre marché cible' : 'Define your target market characteristics'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{nl ? 'Marktgrootte' : fr ? 'Taille du Marché' : 'Market Size'}</Label>
                  <RadioGroup defaultValue="medium">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="niche" id="niche" />
                      <Label htmlFor="niche">{nl ? 'Niche (< 10K klanten)' : fr ? 'Niche (< 10K clients)' : 'Niche (< 10K customers)'}</Label>
                      </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="small" id="small" />
                      <Label htmlFor="small">{nl ? 'Klein (10K - 100K)' : fr ? 'Petit (10K - 100K)' : 'Small (10K - 100K)'}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium">{nl ? 'Middelgroot (100K - 1M)' : fr ? 'Moyen (100K - 1M)' : 'Medium (100K - 1M)'}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="large" id="large" />
                      <Label htmlFor="large">{nl ? 'Groot (1M+)' : fr ? 'Grand (1M+)' : 'Large (1M+)'}</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>{nl ? 'Geografische Focus' : fr ? 'Focus Géographique' : 'Geographic Focus'}</Label>
                  <div className="space-y-2">
                    {(nl
                      ? ['Lokaal', 'Nationaal', 'Internationaal', 'Wereldwijd']
                      : fr
                      ? ['Local', 'National', 'International', 'Mondial']
                      : ['Local', 'National', 'International', 'Global']
                    ).map(geo => (
                      <label key={geo} className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm">{geo}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Industriesegmenten' : fr ? 'Segments Industriels' : 'Industry Segments'}</CardTitle>
              <CardDescription>{nl ? 'Selecteer je doelindustrieën' : fr ? 'Sélectionnez vos industries cibles' : 'Select your target industries'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(nl
                  ? ['Technologie', 'Gezondheidszorg', 'Financiën', 'Onderwijs', 'Retail', 'Productie', 'Vastgoed', 'Horeca', 'Non-profit', 'Overheid', 'Media', 'Anders']
                  : fr
                  ? ['Technologie', 'Santé', 'Finance', 'Éducation', 'Commerce', 'Fabrication', 'Immobilier', 'Hôtellerie', 'Non-profit', 'Gouvernement', 'Médias', 'Autre']
                  : ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail', 'Manufacturing', 'Real Estate', 'Hospitality', 'Non-profit', 'Government', 'Media', 'Other']
                ).map(industry => (
                  <Badge
                    key={industry}
                    variant="outline"
                    className="py-2 px-4 cursor-pointer hover:bg-purple-50 hover:border-purple-600 justify-center"
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">B2B</p>
                    <p className="text-sm text-gray-600">{nl ? 'Zakelijke klanten' : fr ? 'Clients professionnels' : 'Business customers'}</p>
                  </div>
                  <input type="radio" name="market-type" className="ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">B2C</p>
                    <p className="text-sm text-gray-600">{nl ? 'Individuele consumenten' : fr ? 'Consommateurs individuels' : 'Individual consumers'}</p>
                  </div>
                  <input type="radio" name="market-type" className="ml-auto" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{nl ? 'Beide' : fr ? 'Les Deux' : 'Both'}</p>
                    <p className="text-sm text-gray-600">{nl ? 'Gemengd publiek' : fr ? 'Audience mixte' : 'Mixed audience'}</p>
                  </div>
                  <input type="radio" name="market-type" className="ml-auto" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Personas */}
        <TabsContent value="personas" className="space-y-6 mt-6">
          {/* Persona Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              {personas.map((persona, index) => (
                <Button
                  key={persona.id}
                  variant={currentPersona === index ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPersona(index)}
                >
                  {persona.name.split(' ')[0]}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handlePersonaAdd}>
              <Plus className="w-4 h-4 mr-2" /> {nl ? 'Persona Toevoegen' : fr ? 'Ajouter un Persona' : 'Add Persona'}
            </Button>
          </div>

          {/* Current Persona Editor */}
          {personas[currentPersona] && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{nl ? 'Basisinformatie' : fr ? 'Informations de Base' : 'Basic Information'}</CardTitle>
                    <CardDescription>{nl ? 'Kerndemografie en kenmerken' : fr ? 'Données démographiques et caractéristiques principales' : 'Core demographics and characteristics'}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePersonaDelete(currentPersona)}
                    disabled={personas.length <= 1}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{nl ? 'Persona Naam' : fr ? 'Nom du Persona' : 'Persona Name'}</Label>
                      <Input
                        value={personas[currentPersona].name}
                        onChange={(e) => handlePersonaUpdate('name', e.target.value)}
                        placeholder={nl ? 'bijv. Enterprise Emma' : fr ? 'ex. Enterprise Emma' : 'e.g., Enterprise Emma'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{nl ? 'Leeftijdsgroep' : fr ? 'Tranche d\'Âge' : 'Age Range'}</Label>
                      <Input
                        value={personas[currentPersona].age}
                        onChange={(e) => handlePersonaUpdate('age', e.target.value)}
                        placeholder={nl ? 'bijv. 25-35' : fr ? 'ex. 25-35' : 'e.g., 25-35'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{nl ? 'Beroep' : fr ? 'Profession' : 'Occupation'}</Label>
                      <Input
                        value={personas[currentPersona].occupation}
                        onChange={(e) => handlePersonaUpdate('occupation', e.target.value)}
                        placeholder={nl ? 'bijv. Marketing Directeur' : fr ? 'ex. Directeur Marketing' : 'e.g., Marketing Director'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{nl ? 'Inkomensbereik' : fr ? 'Fourchette de Revenus' : 'Income Range'}</Label>
                      <Input
                        value={personas[currentPersona].income}
                        onChange={(e) => handlePersonaUpdate('income', e.target.value)}
                        placeholder={nl ? 'bijv. €60k-100k' : fr ? 'ex. 60k-100k€' : 'e.g., $60k-100k'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{nl ? 'Doelen & Motivaties' : fr ? 'Objectifs & Motivations' : 'Goals & Motivations'}</CardTitle>
                  <CardDescription>{nl ? 'Wat deze persona drijft' : fr ? 'Ce qui motive ce persona' : 'What drives this persona'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>{nl ? 'Primaire Doelen' : fr ? 'Objectifs Principaux' : 'Primary Goals'}</Label>
                      <Textarea
                        placeholder={nl ? 'Lijst de belangrijkste doelen en doelstellingen...' : fr ? 'Listez les principaux objectifs...' : 'List the main goals and objectives...'}
                        rows={3}
                        value={personas[currentPersona].goals.join('\n')}
                        onChange={(e) => handlePersonaUpdate('goals', e.target.value.split('\n').filter(g => g))}
                      />
                    </div>
                    <div>
                      <Label>{nl ? 'Belangrijkste Motivaties' : fr ? 'Motivations Clés' : 'Key Motivations'}</Label>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {[
                          { icon: TrendingUp, label: nl ? 'Groei' : fr ? 'Croissance' : 'Growth', color: 'text-green-600' },
                          { icon: DollarSign, label: nl ? 'Besparingen' : fr ? 'Économies' : 'Savings', color: 'text-blue-600' },
                          { icon: Heart, label: nl ? 'Erkenning' : fr ? 'Reconnaissance' : 'Recognition', color: 'text-red-600' },
                          { icon: Brain, label: nl ? 'Innovatie' : fr ? 'Innovation' : 'Innovation', color: 'text-purple-600' }
                        ].map(motivation => (
                          <div key={motivation.label} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <motivation.icon className={`w-5 h-5 ${motivation.color}`} />
                            <span className="text-sm">{motivation.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{nl ? 'Pijnpunten & Uitdagingen' : fr ? 'Points de Douleur & Défis' : 'Pain Points & Challenges'}</CardTitle>
                  <CardDescription>{nl ? 'Problemen waarmee deze persona te maken heeft' : fr ? 'Problèmes auxquels ce persona est confronté' : 'Problems this persona faces'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder={nl ? 'Lijst de belangrijkste uitdagingen en frustraties...' : fr ? 'Listez leurs principaux défis et frustrations...' : 'List their main challenges and frustrations...'}
                    rows={4}
                    value={personas[currentPersona].painPoints.join('\n')}
                    onChange={(e) => handlePersonaUpdate('painPoints', e.target.value.split('\n').filter(p => p))}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{nl ? 'Gedragsinzichten' : fr ? 'Insights Comportementaux' : 'Behavioral Insights'}</CardTitle>
                  <CardDescription>{nl ? 'Hoe ze beslissingen nemen' : fr ? 'Comment ils prennent des décisions' : 'How they make decisions'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{nl ? 'Koopgedrag' : fr ? 'Comportement d\'Achat' : 'Buying Behavior'}</Label>
                    <Textarea
                      placeholder={nl ? 'Beschrijf hun aankoopgewoonten en besluitvormingsproces...' : fr ? 'Décrivez leurs habitudes d\'achat et leur processus de décision...' : 'Describe their purchasing habits and decision-making process...'}
                      rows={3}
                      value={personas[currentPersona].buyingBehavior}
                      onChange={(e) => handlePersonaUpdate('buyingBehavior', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{nl ? 'Voorkeurskanalen' : fr ? 'Canaux Préférés' : 'Preferred Channels'}</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(nl
                        ? ['E-mail', 'Social Media', 'Zoekmachines', 'Direct Sales', 'Webinars', 'Content', 'Evenementen', 'Verwijzingen']
                        : fr
                        ? ['E-mail', 'Réseaux Sociaux', 'Recherche', 'Ventes Directes', 'Webinaires', 'Contenu', 'Événements', 'Références']
                        : ['Email', 'Social Media', 'Search', 'Direct Sales', 'Webinars', 'Content', 'Events', 'Referrals']
                      ).map(channel => (
                        <Badge
                          key={channel}
                          variant="outline"
                          className="py-2 justify-center cursor-pointer hover:bg-purple-50"
                        >
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Customer Journey */}
        <TabsContent value="journey" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Klantreisfasen' : fr ? 'Étapes du Parcours Client' : 'Customer Journey Stages'}</CardTitle>
              <CardDescription>{nl ? 'Breng de typische klantreis in kaart' : fr ? 'Cartographiez le parcours client typique' : 'Map the typical customer journey'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {[
                  { stage: nl ? 'Bewustwording' : fr ? 'Sensibilisation' : 'Awareness', stageKey: 'awareness', icon: AlertCircle, color: 'bg-blue-100 text-blue-600' },
                  { stage: nl ? 'Overweging' : fr ? 'Considération' : 'Consideration', stageKey: 'consideration', icon: Brain, color: 'bg-purple-100 text-purple-600' },
                  { stage: nl ? 'Beslissing' : fr ? 'Décision' : 'Decision', stageKey: 'decision', icon: Target, color: 'bg-green-100 text-green-600' },
                  { stage: nl ? 'Aankoop' : fr ? 'Achat' : 'Purchase', stageKey: 'purchase', icon: ShoppingBag, color: 'bg-yellow-100 text-yellow-600' },
                  { stage: nl ? 'Retentie' : fr ? 'Rétention' : 'Retention', stageKey: 'retention', icon: Heart, color: 'bg-red-100 text-red-600' }
                ].map((item, index) => (
                  <div key={item.stageKey} className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{item.stage}</h4>
                      <Textarea
                        placeholder={nl ? `Beschrijf wat er gebeurt tijdens de ${item.stage.toLowerCase()} fase...` : fr ? `Décrivez ce qui se passe pendant l'étape de ${item.stage.toLowerCase()}...` : `Describe what happens during the ${item.stage.toLowerCase()} stage...`}
                        rows={2}
                      />
                    </div>
                    {index < 4 && (
                      <div className="flex items-center justify-center h-full">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Contactpunten' : fr ? 'Points de Contact' : 'Touchpoints'}</CardTitle>
              <CardDescription>{nl ? 'Waar en hoe klanten met je merk interacteren' : fr ? 'Où et comment les clients interagissent avec votre marque' : 'Where and how customers interact with your brand'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {(nl
                  ? ['Website', 'E-mail', 'Social Media', 'Telefoon', 'Live Chat', 'Persoonlijk', 'Mobiele App', 'Online Advertenties', 'Content/Blog', 'Evenementen', 'Partners', 'Support']
                  : fr
                  ? ['Site Web', 'E-mail', 'Réseaux Sociaux', 'Téléphone', 'Chat en Direct', 'En Personne', 'Application Mobile', 'Publicités en Ligne', 'Contenu/Blog', 'Événements', 'Partenaires', 'Support']
                  : ['Website', 'Email', 'Social Media', 'Phone', 'Live Chat', 'In-Person', 'Mobile App', 'Online Ads', 'Content/Blog', 'Events', 'Partners', 'Support']
                ).map(touchpoint => (
                  <label key={touchpoint} className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{touchpoint}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Insights */}
        <TabsContent value="insights" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                {nl ? 'AI-Gegenereerde Inzichten' : fr ? 'Insights Générés par l\'IA' : 'AI-Generated Insights'}
              </CardTitle>
              <CardDescription>{nl ? 'Gebaseerd op je doelgroepgegevens' : fr ? 'Basé sur les données de votre audience' : 'Based on your audience data'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-2">{nl ? 'Belangrijke Kans' : fr ? 'Opportunité Clé' : 'Key Opportunity'}</h4>
                  <p className="text-sm text-gray-700">
                    {nl ? 'Je doelgroep toont hoge betrokkenheid bij educatieve content. Overweeg een uitgebreide kennisbank te maken om thought leadership te vestigen.' : fr ? 'Votre public cible montre un fort engagement avec le contenu éducatif. Envisagez de créer une bibliothèque de ressources complète pour établir un leadership éclairé.' : 'Your target audience shows high engagement with educational content. Consider creating a comprehensive resource library to establish thought leadership.'}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">{nl ? 'Communicatietip' : fr ? 'Conseil de Communication' : 'Communication Tip'}</h4>
                  <p className="text-sm text-gray-700">
                    {nl ? 'Op basis van je persona\'s, focus op ROI-gerichte boodschappen met concrete voorbeelden en case studies in plaats van functielijsten.' : fr ? 'Basé sur vos personas, concentrez-vous sur des messages axés sur le ROI avec des exemples concrets et des études de cas plutôt que des listes de fonctionnalités.' : 'Based on your personas, focus on ROI-driven messaging with concrete examples and case studies rather than feature lists.'}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2">{nl ? 'Kanaalaanbeveling' : fr ? 'Recommandation de Canal' : 'Channel Recommendation'}</h4>
                  <p className="text-sm text-gray-700">
                    {nl ? 'LinkedIn en e-mailmarketing lijken je meest effectieve kanalen te zijn om besluitvormers in je doelmarkt te bereiken.' : fr ? 'LinkedIn et le marketing par e-mail semblent être vos canaux les plus efficaces pour atteindre les décideurs de votre marché cible.' : 'LinkedIn and email marketing appear to be your most effective channels for reaching decision-makers in your target market.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Doelgroep Overlap Analyse' : fr ? 'Analyse de Chevauchement d\'Audience' : 'Audience Overlap Analysis'}</CardTitle>
              <CardDescription>{nl ? 'Gemeenschappelijke kenmerken van je persona\'s' : fr ? 'Traits communs de vos personas' : 'Common traits across your personas'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{nl ? 'Waardeert Kwaliteit Boven Prijs' : fr ? 'Privilégie la Qualité au Prix' : 'Value Quality Over Price'}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full">
                      <div className="w-4/5 h-full bg-purple-600 rounded-full" />
                    </div>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{nl ? 'Technisch Onderlegd' : fr ? 'Maîtrise Technologique' : 'Tech-Savvy'}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full">
                      <div className="w-3/4 h-full bg-purple-600 rounded-full" />
                    </div>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">{nl ? 'Tijdsdruk' : fr ? 'Contrainte de Temps' : 'Time-Constrained'}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full">
                      <div className="w-[90%] h-full bg-purple-600 rounded-full" />
                    </div>
                    <span className="text-sm font-medium">90%</span>
                  </div>
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
          <Button variant="outline" onClick={() => navigate('/app/setup/brand')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
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
