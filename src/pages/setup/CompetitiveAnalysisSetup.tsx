// src/pages/setup/CompetitiveAnalysisSetup.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe,
  Target,
  TrendingUp,
  Shield,
  Zap,
  Award,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  ExternalLink,
  Star,
  Search,
  BarChart3,
  Users,
  DollarSign,
  Package,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface Competitor {
  id: string;
  name: string;
  website: string;
  category: 'direct' | 'indirect' | 'aspirational';
  marketShare?: number;
  strengths: string[];
  weaknesses: string[];
  products: string[];
  pricing: string;
  targetMarket: string;
  uniqueValue: string;
}

export default function CompetitiveAnalysisSetup() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [activeTab, setActiveTab] = useState('competitors');
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [currentCompetitor, setCurrentCompetitor] = useState(0);
  const [marketPosition, setMarketPosition] = useState('challenger');
  const [isLoading, setIsLoading] = useState(true);

  // Load competitors from Supabase on mount
  useEffect(() => {
    async function loadCompetitors() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsLoading(false); return; }

        const { data, error } = await supabase
          .from('competitors')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at');

        if (error) throw error;

        if (data && data.length > 0) {
          const mapped: Competitor[] = data.map((c: any) => ({
            id: c.id,
            name: c.competitor_name || c.name || '',
            website: c.website_url || c.website || '',
            category: (['direct', 'indirect', 'aspirational'].includes(c.company_type) ? c.company_type : 'direct') as 'direct' | 'indirect' | 'aspirational',
            marketShare: c.market_share || undefined,
            strengths: c.strengths || [],
            weaknesses: c.weaknesses || [],
            products: c.key_products || [],
            pricing: c.pricing_strategy || '',
            targetMarket: (c.target_segments || []).join(', '),
            uniqueValue: c.metadata?.description || '',
          }));
          setCompetitors(mapped);
        } else {
          // Fallback: show one empty competitor so the form isn't blank
          setCompetitors([{
            id: '1', name: '', website: '', category: 'direct',
            strengths: [], weaknesses: [], products: [],
            pricing: '', targetMarket: '', uniqueValue: '',
          }]);
        }
      } catch (err) {
        console.error('Failed to load competitors:', err);
        setCompetitors([{
          id: '1', name: '', website: '', category: 'direct',
          strengths: [], weaknesses: [], products: [],
          pricing: '', targetMarket: '', uniqueValue: '',
        }]);
      } finally {
        setIsLoading(false);
      }
    }
    loadCompetitors();
  }, []);

  const handleCompetitorAdd = () => {
    const newCompetitor: Competitor = {
      id: Date.now().toString(),
      name: '',
      website: '',
      category: 'direct',
      strengths: [],
      weaknesses: [],
      products: [],
      pricing: '',
      targetMarket: '',
      uniqueValue: ''
    };
    setCompetitors([...competitors, newCompetitor]);
    setCurrentCompetitor(competitors.length);
  };

  const handleCompetitorUpdate = (field: keyof Competitor, value: any) => {
    const updated = [...competitors];
    updated[currentCompetitor] = {
      ...updated[currentCompetitor],
      [field]: value
    };
    setCompetitors(updated);
  };

  const handleCompetitorDelete = (index: number) => {
    if (competitors.length > 1) {
      setCompetitors(competitors.filter((_, i) => i !== index));
      setCurrentCompetitor(Math.max(0, currentCompetitor - 1));
    }
  };

  const handleSave = () => {
    toast({
      title: nl ? 'Concurrentieanalyse opgeslagen!' : fr ? 'Analyse concurrentielle enregistrée !' : 'Competitive analysis saved!',
      description: nl ? 'Je concurrentielandschap is bijgewerkt.' : fr ? 'Votre paysage concurrentiel a été mis à jour.' : 'Your competitive landscape has been updated.',
    });
  };

  const handleNext = () => {
    handleSave();
    navigate('/app/context-marketing');
  };

  const completionPercentage = competitors.filter(c =>
    c.name && c.website && c.strengths.length > 0 && c.weaknesses.length > 0
  ).length / competitors.length * 100;

  return (
    <div className="w-full py-2">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{nl ? 'Concurrentieanalyse' : fr ? 'Analyse Concurrentielle' : 'Competitive Analysis'}</h1>
            <p className="text-gray-600 mt-2">{nl ? 'Begrijp je concurrentielandschap' : fr ? 'Comprenez votre paysage concurrentiel' : 'Understand your competitive landscape'}</p>
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
          <TabsTrigger value="competitors">{nl ? 'Concurrenten' : fr ? 'Concurrents' : 'Competitors'} ({competitors.length})</TabsTrigger>
          <TabsTrigger value="positioning">{nl ? 'Marktpositionering' : fr ? 'Positionnement de Marché' : 'Market Positioning'}</TabsTrigger>
          <TabsTrigger value="analysis">{nl ? 'SWOT Analyse' : fr ? 'Analyse SWOT' : 'SWOT Analysis'}</TabsTrigger>
          <TabsTrigger value="strategy">{nl ? 'Strategie' : fr ? 'Stratégie' : 'Strategy'}</TabsTrigger>
        </TabsList>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="space-y-6 mt-6">
          {/* Competitor Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              {competitors.map((competitor, index) => (
                <Button
                  key={competitor.id}
                  variant={currentCompetitor === index ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentCompetitor(index)}
                  className="mb-2"
                >
                  {competitor.name || `${nl ? 'Concurrent' : fr ? 'Concurrent' : 'Competitor'} ${index + 1}`}
                  {competitor.category === 'direct' && <Target className="w-3 h-3 ml-2" />}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleCompetitorAdd}>
              <Plus className="w-4 h-4 mr-2" /> {nl ? 'Concurrent Toevoegen' : fr ? 'Ajouter un Concurrent' : 'Add Competitor'}
            </Button>
          </div>

          {/* Current Competitor Editor */}
          {competitors[currentCompetitor] && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{nl ? 'Concurrent Informatie' : fr ? 'Informations sur le Concurrent' : 'Competitor Information'}</CardTitle>
                    <CardDescription>{nl ? 'Basisgegevens over deze concurrent' : fr ? 'Détails de base sur ce concurrent' : 'Basic details about this competitor'}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      competitors[currentCompetitor].category === 'direct' ? 'destructive' :
                      competitors[currentCompetitor].category === 'indirect' ? 'secondary' :
                      'outline'
                    }>
                      {competitors[currentCompetitor].category === 'direct'
                        ? (nl ? 'direct' : fr ? 'direct' : 'direct')
                        : competitors[currentCompetitor].category === 'indirect'
                        ? (nl ? 'indirect' : fr ? 'indirect' : 'indirect')
                        : (nl ? 'aspirationeel' : fr ? 'aspirationnel' : 'aspirational')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCompetitorDelete(currentCompetitor)}
                      disabled={competitors.length <= 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{nl ? 'Bedrijfsnaam' : fr ? 'Nom de l\'Entreprise' : 'Company Name'}</Label>
                      <Input
                        value={competitors[currentCompetitor].name}
                        onChange={(e) => handleCompetitorUpdate('name', e.target.value)}
                        placeholder={nl ? 'bijv. Concurrent B.V.' : fr ? 'ex. Concurrent SA' : 'e.g., Competitor Inc.'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <div className="flex gap-2">
                        <Input
                          value={competitors[currentCompetitor].website}
                          onChange={(e) => handleCompetitorUpdate('website', e.target.value)}
                          placeholder="https://competitor.com"
                        />
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{nl ? 'Type Concurrent' : fr ? 'Type de Concurrent' : 'Competitor Type'}</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'direct', label: nl ? 'Direct' : fr ? 'Direct' : 'Direct', description: nl ? 'Dezelfde producten/diensten' : fr ? 'Mêmes produits/services' : 'Same products/services' },
                        { value: 'indirect', label: nl ? 'Indirect' : fr ? 'Indirect' : 'Indirect', description: nl ? 'Andere oplossing, zelfde probleem' : fr ? 'Solution différente, même problème' : 'Different solution, same problem' },
                        { value: 'aspirational', label: nl ? 'Aspirationeel' : fr ? 'Aspirationnel' : 'Aspirational', description: nl ? 'Waar we willen zijn' : fr ? 'Où nous voulons être' : 'Where we want to be' }
                      ].map(type => (
                        <label
                          key={type.value}
                          className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                            competitors[currentCompetitor].category === type.value
                              ? 'border-purple-600 bg-purple-50'
                              : 'hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="category"
                            value={type.value}
                            checked={competitors[currentCompetitor].category === type.value}
                            onChange={(e) => handleCompetitorUpdate('category', e.target.value)}
                            className="sr-only"
                          />
                          <p className="font-medium">{type.label}</p>
                          <p className="text-xs text-gray-600">{type.description}</p>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{nl ? 'Doelmarkt' : fr ? 'Marché Cible' : 'Target Market'}</Label>
                      <Input
                        value={competitors[currentCompetitor].targetMarket}
                        onChange={(e) => handleCompetitorUpdate('targetMarket', e.target.value)}
                        placeholder={nl ? 'bijv. MKB, Enterprise, Startups' : fr ? 'ex. PME, Enterprise, Startups' : 'e.g., SMBs, Enterprise, Startups'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{nl ? 'Prijsmodel' : fr ? 'Modèle de Tarification' : 'Pricing Model'}</Label>
                      <Input
                        value={competitors[currentCompetitor].pricing}
                        onChange={(e) => handleCompetitorUpdate('pricing', e.target.value)}
                        placeholder={nl ? 'bijv. €99-499/maand' : fr ? 'ex. 99-499€/mois' : 'e.g., $99-499/month'}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      {nl ? 'Sterktes' : fr ? 'Forces' : 'Strengths'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={nl ? 'Lijst hun belangrijkste sterktes (één per regel)...' : fr ? 'Listez leurs forces clés (une par ligne)...' : 'List their key strengths (one per line)...'}
                      rows={6}
                      value={competitors[currentCompetitor].strengths.join('\n')}
                      onChange={(e) => handleCompetitorUpdate('strengths', e.target.value.split('\n').filter(s => s))}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      {nl ? 'Zwaktes' : fr ? 'Faiblesses' : 'Weaknesses'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder={nl ? 'Lijst hun zwaktes of hiaten (één per regel)...' : fr ? 'Listez leurs faiblesses ou lacunes (une par ligne)...' : 'List their weaknesses or gaps (one per line)...'}
                      rows={6}
                      value={competitors[currentCompetitor].weaknesses.join('\n')}
                      onChange={(e) => handleCompetitorUpdate('weaknesses', e.target.value.split('\n').filter(w => w))}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>{nl ? 'Producten & Diensten' : fr ? 'Produits & Services' : 'Products & Services'}</CardTitle>
                  <CardDescription>{nl ? 'Wat ze op de markt aanbieden' : fr ? 'Ce qu\'ils offrent sur le marché' : 'What they offer to the market'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder={nl ? 'Lijst hun belangrijkste producten/diensten (één per regel)...' : fr ? 'Listez leurs principaux produits/services (un par ligne)...' : 'List their main products/services (one per line)...'}
                    rows={4}
                    value={competitors[currentCompetitor].products.join('\n')}
                    onChange={(e) => handleCompetitorUpdate('products', e.target.value.split('\n').filter(p => p))}
                  />
                  <div className="space-y-2">
                    <Label>{nl ? 'Unieke Waardepropositie' : fr ? 'Proposition de Valeur Unique' : 'Unique Value Proposition'}</Label>
                    <Textarea
                      placeholder={nl ? 'Wat maakt hen uniek op de markt...' : fr ? 'Ce qui les rend uniques sur le marché...' : 'What makes them unique in the market...'}
                      rows={2}
                      value={competitors[currentCompetitor].uniqueValue}
                      onChange={(e) => handleCompetitorUpdate('uniqueValue', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Market Positioning */}
        <TabsContent value="positioning" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Jouw Marktpositie' : fr ? 'Votre Position sur le Marché' : 'Your Market Position'}</CardTitle>
              <CardDescription>{nl ? 'Hoe je jezelf positioneert in het concurrentielandschap' : fr ? 'Comment vous vous positionnez dans le paysage concurrentiel' : 'How you position yourself in the competitive landscape'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { value: 'leader', label: nl ? 'Marktleider' : fr ? 'Leader du Marché' : 'Market Leader', icon: Award, description: nl ? 'Dominante speler die standaarden zet' : fr ? 'Acteur dominant qui établit les normes' : 'Dominant player setting standards' },
                  { value: 'challenger', label: nl ? 'Uitdager' : fr ? 'Challenger' : 'Challenger', icon: Target, description: nl ? 'Agressief concurrerend om marktaandeel' : fr ? 'En concurrence agressive pour des parts de marché' : 'Aggressively competing for share' },
                  { value: 'follower', label: nl ? 'Volger' : fr ? 'Suiveur' : 'Follower', icon: Users, description: nl ? 'Volgt gevestigde patronen' : fr ? 'Suit les modèles établis' : 'Following established patterns' },
                  { value: 'nicher', label: nl ? 'Nichespeler' : fr ? 'Spécialiste de Niche' : 'Nicher', icon: Zap, description: nl ? 'Gespecialiseerd in specifiek segment' : fr ? 'Spécialisé dans un segment spécifique' : 'Specialized in specific segment' }
                ].map(position => (
                  <label
                    key={position.value}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      marketPosition === position.value
                        ? 'border-purple-600 bg-purple-50 shadow-md'
                        : 'hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="position"
                      value={position.value}
                      checked={marketPosition === position.value}
                      onChange={(e) => setMarketPosition(e.target.value)}
                      className="sr-only"
                    />
                    <position.icon className="w-8 h-8 mb-2 text-purple-600" />
                    <p className="font-semibold">{position.label}</p>
                    <p className="text-xs text-gray-600 mt-1">{position.description}</p>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Concurrentievoordelen' : fr ? 'Avantages Concurrentiels' : 'Competitive Advantages'}</CardTitle>
              <CardDescription>{nl ? 'Wat jou onderscheidt van concurrenten' : fr ? 'Ce qui vous distingue de la concurrence' : 'What sets you apart from competitors'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { category: nl ? 'Prijs' : fr ? 'Prix' : 'Price', categoryKey: 'price', icon: DollarSign, color: 'bg-green-100 text-green-600' },
                  { category: nl ? 'Functies' : fr ? 'Fonctionnalités' : 'Features', categoryKey: 'features', icon: Package, color: 'bg-blue-100 text-blue-600' },
                  { category: nl ? 'Service' : fr ? 'Service' : 'Service', categoryKey: 'service', icon: Users, color: 'bg-purple-100 text-purple-600' },
                  { category: nl ? 'Technologie' : fr ? 'Technologie' : 'Technology', categoryKey: 'technology', icon: Zap, color: 'bg-yellow-100 text-yellow-600' }
                ].map(advantage => (
                  <div key={advantage.categoryKey} className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${advantage.color}`}>
                      <advantage.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <Label>{advantage.category} {nl ? 'Voordeel' : fr ? 'Avantage' : 'Advantage'}</Label>
                      <Textarea
                        placeholder={nl ? `Hoe je excelleert in ${advantage.category.toLowerCase()}...` : fr ? `Comment vous excellez en ${advantage.category.toLowerCase()}...` : `How you excel in ${advantage.category.toLowerCase()}...`}
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Marktaandeel Schatting' : fr ? 'Estimation de Part de Marché' : 'Market Share Estimation'}</CardTitle>
              <CardDescription>{nl ? 'Geschatte verdeling van marktaandeel' : fr ? 'Distribution approximative des parts de marché' : 'Approximate market share distribution'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{nl ? 'Jouw Bedrijf' : fr ? 'Votre Entreprise' : 'Your Company'}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 h-3 bg-gray-200 rounded-full">
                      <div className="w-1/5 h-full bg-purple-600 rounded-full" />
                    </div>
                    <span className="text-sm font-medium w-12">20%</span>
                  </div>
                </div>
                {competitors.slice(0, 3).map((competitor, index) => (
                  <div key={competitor.id} className="flex items-center justify-between">
                    <span className="text-sm">{competitor.name || `${nl ? 'Concurrent' : fr ? 'Concurrent' : 'Competitor'} ${index + 1}`}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-48 h-3 bg-gray-200 rounded-full">
                        <div
                          className="h-full bg-gray-600 rounded-full"
                          style={{ width: `${competitor.marketShare || 15}%` }}
                        />
                      </div>
                      <span className="text-sm w-12">{competitor.marketShare || 15}%</span>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{nl ? 'Overige' : fr ? 'Autres' : 'Others'}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 h-3 bg-gray-200 rounded-full">
                      <div className="w-1/4 h-full bg-gray-400 rounded-full" />
                    </div>
                    <span className="text-sm w-12">25%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SWOT Analysis */}
        <TabsContent value="analysis" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">{nl ? 'Sterktes' : fr ? 'Forces' : 'Strengths'}</CardTitle>
                <CardDescription>{nl ? 'Interne voordelen' : fr ? 'Avantages internes' : 'Internal advantages'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={nl ? 'Lijst de belangrijkste sterktes van je bedrijf...' : fr ? 'Listez les forces clés de votre entreprise...' : "List your company's key strengths..."}
                  rows={8}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">{nl ? 'Zwaktes' : fr ? 'Faiblesses' : 'Weaknesses'}</CardTitle>
                <CardDescription>{nl ? 'Interne beperkingen' : fr ? 'Limitations internes' : 'Internal limitations'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={nl ? 'Lijst gebieden die verbetering nodig hebben...' : fr ? 'Listez les domaines nécessitant des améliorations...' : 'List areas that need improvement...'}
                  rows={8}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600">{nl ? 'Kansen' : fr ? 'Opportunités' : 'Opportunities'}</CardTitle>
                <CardDescription>{nl ? 'Externe mogelijkheden' : fr ? 'Possibilités externes' : 'External possibilities'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={nl ? 'Lijst marktkansen die je kunt benutten...' : fr ? 'Listez les opportunités de marché que vous pouvez exploiter...' : 'List market opportunities you can leverage...'}
                  rows={8}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-yellow-600">{nl ? 'Bedreigingen' : fr ? 'Menaces' : 'Threats'}</CardTitle>
                <CardDescription>{nl ? 'Externe uitdagingen' : fr ? 'Défis externes' : 'External challenges'}</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={nl ? 'Lijst potentiële bedreigingen voor je bedrijf...' : fr ? 'Listez les menaces potentielles pour votre entreprise...' : 'List potential threats to your business...'}
                  rows={8}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Concurrentiestrategie' : fr ? 'Stratégie Concurrentielle' : 'Competitive Strategy'}</CardTitle>
              <CardDescription>{nl ? 'Hoe je gaat winnen op de markt' : fr ? 'Comment vous allez gagner sur le marché' : "How you'll win in the market"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{nl ? 'Primaire Strategie' : fr ? 'Stratégie Principale' : 'Primary Strategy'}</Label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>{nl ? 'Differentiatie - Unieke functies en waarde' : fr ? 'Différenciation - Fonctionnalités et valeur uniques' : 'Differentiation - Unique features and value'}</option>
                  <option>{nl ? 'Kostenleiderschap - Beste prijs op de markt' : fr ? 'Leadership par les coûts - Meilleur prix du marché' : 'Cost Leadership - Best price in market'}</option>
                  <option>{nl ? 'Focus - Specifieke niche uitzonderlijk bedienen' : fr ? 'Focus - Servir un créneau spécifique exceptionnellement' : 'Focus - Serve specific niche exceptionally'}</option>
                  <option>{nl ? 'Blauwe Oceaan - Nieuwe marktruimte creëren' : fr ? 'Océan Bleu - Créer un nouvel espace de marché' : 'Blue Ocean - Create new market space'}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>{nl ? 'Belangrijkste Onderscheidende Factoren' : fr ? 'Différenciateurs Clés' : 'Key Differentiators'}</Label>
                <Textarea
                  placeholder={nl ? 'Wat maakt je uniek waardevol voor klanten...' : fr ? 'Ce qui vous rend uniquement précieux pour les clients...' : 'What makes you uniquely valuable to customers...'}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>{nl ? 'Concurrentievoordeel (Moat)' : fr ? 'Avantage Concurrentiel (Moat)' : 'Competitive Moat'}</Label>
                <Textarea
                  placeholder={nl ? 'Wat beschermt je tegen concurrentie (netwerkeffecten, overstapkosten, merk, etc.)...' : fr ? 'Ce qui vous protège de la concurrence (effets de réseau, coûts de transfert, marque, etc.)...' : 'What protects you from competition (network effects, switching costs, brand, etc.)...'}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                {nl ? 'AI-Gegenereerde Aanbevelingen' : fr ? 'Recommandations Générées par l\'IA' : 'AI-Generated Recommendations'}
              </CardTitle>
              <CardDescription>{nl ? 'Strategische inzichten op basis van je analyse' : fr ? 'Insights stratégiques basés sur votre analyse' : 'Strategic insights based on your analysis'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    {nl ? 'Groeikans' : fr ? 'Opportunité de Croissance' : 'Growth Opportunity'}
                  </h4>
                  <p className="text-sm">
                    {nl ? 'Op basis van de zwaktes van concurrenten in klantenservice, kan investeren in uitzonderlijke klantenservice een sterke onderscheidende factor zijn.' : fr ? 'En se basant sur les faiblesses des concurrents en matière de support client, investir dans un service client exceptionnel pourrait être un fort différenciateur.' : 'Based on competitor weaknesses in customer support, investing in exceptional customer service could be a strong differentiator.'}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {nl ? 'Positioneringsadvies' : fr ? 'Conseil de Positionnement' : 'Positioning Advice'}
                  </h4>
                  <p className="text-sm">
                    {nl ? 'Als uitdager, focus op wendbaarheid en innovatie. Je kleinere omvang maakt snellere aanpassing aan marktbehoeften mogelijk dan grotere concurrenten.' : fr ? 'En tant que challenger, concentrez-vous sur l\'agilité et l\'innovation. Votre petite taille permet une adaptation plus rapide aux besoins du marché que les concurrents plus grands.' : 'As a challenger, focus on agility and innovation. Your smaller size allows faster adaptation to market needs than larger competitors.'}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {nl ? 'Defensieve Strategie' : fr ? 'Stratégie Défensive' : 'Defensive Strategy'}
                  </h4>
                  <p className="text-sm">
                    {nl ? 'Bouw sterke relaties op met belangrijke klanten om overstapkosten te verhogen en te beschermen tegen het afpakken door concurrenten.' : fr ? 'Construisez des relations solides avec les clients clés pour augmenter les coûts de transfert et vous protéger contre le braconnage des concurrents.' : 'Build strong relationships with key customers to increase switching costs and protect against competitor poaching.'}
                  </p>
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
          <Button variant="outline" onClick={() => navigate('/app/setup/goals')}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            {nl ? 'Terug' : fr ? 'Retour' : 'Back'}
          </Button>
          <Button onClick={handleNext}>
            {nl ? 'Setup Voltooien' : fr ? 'Terminer la Configuration' : 'Complete Setup'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
