import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Blocks,
  Users,
  GraduationCap,
  Globe,
  Award,
  Building,
  Code,
  BookOpen,
  TrendingUp,
  Star,
  Briefcase,
  DollarSign,
  ChevronRight,
  CheckCircle
} from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

const EcosystemExpansion = () => {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [selectedView, setSelectedView] = useState("partners");

  const partners = [
    {
      name: "Digital Transform Co",
      tier: "platinum",
      clients: 127,
      revenue: "$2.3M",
      rating: 4.9
    },
    {
      name: "MarketingPro Solutions",
      tier: "gold",
      clients: 89,
      revenue: "$1.2M",
      rating: 4.8
    },
    {
      name: "Growth Accelerators",
      tier: "gold",
      clients: 76,
      revenue: "$980K",
      rating: 4.7
    },
    {
      name: "AI Marketing Agency",
      tier: "silver",
      clients: 45,
      revenue: "$560K",
      rating: 4.6
    }
  ];

  const courses = [
    {
      title: "Inclufy Fundamentals",
      level: nl ? "Beginner" : fr ? "D\u00e9butant" : "Beginner",
      enrolled: 3456,
      rating: 4.8,
      duration: nl ? "2 uur" : fr ? "2 heures" : "2 hours"
    },
    {
      title: "Advanced AI Orchestration",
      level: nl ? "Gevorderd" : fr ? "Avanc\u00e9" : "Advanced",
      enrolled: 892,
      rating: 4.9,
      duration: nl ? "4 uur" : fr ? "4 heures" : "4 hours"
    },
    {
      title: "Revenue Intelligence Mastery",
      level: "Expert",
      enrolled: 456,
      rating: 4.9,
      duration: nl ? "6 uur" : fr ? "6 heures" : "6 hours"
    },
    {
      title: "Agency Partner Program",
      level: "Partner",
      enrolled: 234,
      rating: 4.7,
      duration: nl ? "3 uur" : fr ? "3 heures" : "3 hours"
    }
  ];

  const industryAgents = [
    {
      name: nl ? "Retail AI Agent" : fr ? "Agent IA Retail" : "Retail AI Agent",
      industry: nl ? "Retail & E-commerce" : fr ? "Retail & E-commerce" : "Retail & E-commerce",
      deployments: 234,
      accuracy: 92,
      status: "active"
    },
    {
      name: nl ? "Financi\u00eble Diensten Agent" : fr ? "Agent Services Financiers" : "Financial Services Agent",
      industry: nl ? "Bankwezen & Financi\u00ebn" : fr ? "Banque & Finance" : "Banking & Finance",
      deployments: 89,
      accuracy: 94,
      status: "active"
    },
    {
      name: nl ? "Gezondheidszorg Agent" : fr ? "Agent Sant\u00e9" : "Healthcare Agent",
      industry: nl ? "Gezondheidszorg & Farma" : fr ? "Sant\u00e9 & Pharma" : "Healthcare & Pharma",
      deployments: 56,
      accuracy: 96,
      status: "active"
    },
    {
      name: nl ? "B2B Enterprise Agent" : fr ? "Agent B2B Enterprise" : "B2B Enterprise Agent",
      industry: "B2B & SaaS",
      deployments: 0,
      accuracy: 0,
      status: "coming"
    }
  ];

  const tierBenefits = {
    bronze: { color: "orange", revenue: "15%", support: nl ? "Standaard" : fr ? "Standard" : "Standard", training: nl ? "Basis" : fr ? "Basique" : "Basic" },
    silver: { color: "gray", revenue: "20%", support: nl ? "Prioriteit" : fr ? "Prioritaire" : "Priority", training: nl ? "Gevorderd" : fr ? "Avanc\u00e9" : "Advanced" },
    gold: { color: "yellow", revenue: "25%", support: nl ? "Toegewijd" : fr ? "D\u00e9di\u00e9" : "Dedicated", training: "Expert" },
    platinum: { color: "purple", revenue: "30%", support: "White Glove", training: nl ? "Op maat" : fr ? "Sur mesure" : "Custom" }
  };

  const tabLabels: Record<string, string> = {
    partners: nl ? 'Partners' : fr ? 'Partenaires' : 'Partners',
    academy: nl ? 'Academie' : fr ? 'Acad\u00e9mie' : 'Academy',
    agents: 'Agents',
    whitelabel: 'White Label',
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Blocks className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{nl ? 'Ecosysteem & Expansie' : fr ? '\u00c9cosyst\u00e8me & Expansion' : 'Ecosystem & Expansion'}</h1>
            <p className="text-muted-foreground">{nl ? 'Bouw en groei met ons partnernetwerk' : fr ? 'Construisez et d\u00e9veloppez avec notre r\u00e9seau de partenaires' : 'Build and grow with our partner network'}</p>
          </div>
        </div>
        <Button size="lg" className="gap-2">
          <Briefcase className="h-5 w-5" />
          {nl ? 'Word Partner' : fr ? 'Devenir Partenaire' : 'Become a Partner'}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{nl ? 'Partnernetwerk' : fr ? 'R\u00e9seau de Partenaires' : 'Partner Network'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">412</div>
            <p className="text-xs text-green-600">{nl ? '+52 dit kwartaal' : fr ? '+52 ce trimestre' : '+52 this quarter'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{nl ? 'Academie Gebruikers' : fr ? 'Utilisateurs Acad\u00e9mie' : 'Academy Users'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,547</div>
            <p className="text-xs text-muted-foreground">{nl ? '2.156 gecertificeerd' : fr ? '2 156 certifi\u00e9s' : '2,156 certified'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{nl ? 'Branche Agents' : fr ? 'Agents Sectoriels' : 'Industry Agents'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">{nl ? '3 in b\u00e8ta' : fr ? '3 en b\u00eata' : '3 in beta'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{nl ? 'Partner Omzet' : fr ? 'Revenus Partenaires' : 'Partner Revenue'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$5.2M</div>
            <p className="text-xs text-green-600">{nl ? '40% van totale ARR' : fr ? '40% de l\'ARR total' : '40% of total ARR'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2">
        {['partners', 'academy', 'agents', 'whitelabel'].map((view) => (
          <Button
            key={view}
            variant={selectedView === view ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedView(view)}
          >
            {tabLabels[view] || view}
          </Button>
        ))}
      </div>

      {/* Partner Program */}
      {selectedView === 'partners' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Partner Ranglijst' : fr ? 'Classement Partenaires' : 'Partner Leaderboard'}</CardTitle>
              <CardDescription>{nl ? 'Best presterende partners dit kwartaal' : fr ? 'Partenaires les plus performants ce trimestre' : 'Top performing partners this quarter'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {partners.map((partner, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        {index < 3 && <Award className={`h-4 w-4 text-${tierBenefits[partner.tier].color}-600`} />}
                        {partner.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {partner.clients} {nl ? 'klanten' : fr ? 'clients' : 'clients'} • {partner.revenue} {nl ? 'omzet' : fr ? 'revenus' : 'revenue'}
                      </p>
                    </div>
                    <Badge
                      variant={partner.tier === 'platinum' ? 'default' : 'secondary'}
                      className="capitalize"
                    >
                      {partner.tier}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(partner.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">{partner.rating}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Partner Niveaus' : fr ? 'Niveaux Partenaires' : 'Partner Tiers'}</CardTitle>
              <CardDescription>{nl ? 'Voordelen en vereisten' : fr ? 'Avantages et exigences' : 'Benefits and requirements'}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(tierBenefits).map(([tier, benefits]) => (
                <div key={tier} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold capitalize flex items-center gap-2">
                      <Award className={`h-4 w-4 text-${benefits.color}-600`} />
                      {tier} {nl ? 'Niveau' : fr ? 'Niveau' : 'Tier'}
                    </h4>
                    <Badge variant="outline">{benefits.revenue} {nl ? 'omzetaandeel' : fr ? 'partage des revenus' : 'revenue share'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{nl ? 'Ondersteuning' : fr ? 'Support' : 'Support'}: </span>
                      <span>{benefits.support}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Training: </span>
                      <span>{benefits.training}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Academy */}
      {selectedView === 'academy' && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{nl ? 'Populaire Cursussen' : fr ? 'Cours Populaires' : 'Popular Courses'}</CardTitle>
                <CardDescription>{nl ? 'Meest ingeschreven certificeringsprogramma\'s' : fr ? 'Programmes de certification les plus inscrits' : 'Most enrolled certification programs'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {courses.map((course, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-primary" />
                          {course.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {course.enrolled} {nl ? 'ingeschreven' : fr ? 'inscrits' : 'enrolled'} • {course.duration}
                        </p>
                      </div>
                      <Badge variant={course.level === 'Partner' ? 'default' : 'outline'}>
                        {course.level}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(course.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">{course.rating}</span>
                      </div>
                      <Button size="sm" variant="outline">
                        {nl ? 'Inschrijven' : fr ? 'S\'inscrire' : 'Enroll'}
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{nl ? 'Leerpaden' : fr ? 'Parcours d\'apprentissage' : 'Learning Paths'}</CardTitle>
                <CardDescription>{nl ? 'Gestructureerde certificeringsprogramma\'s' : fr ? 'Programmes de certification structur\u00e9s' : 'Structured certification programs'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">{nl ? 'Marketeer Pad' : fr ? 'Parcours Marketeur' : 'Marketer Path'}</h4>
                  <Progress value={65} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">{nl ? '8 cursussen • 24 uur • Gebruiker tot Expert' : fr ? '8 cours • 24 heures • Utilisateur \u00e0 Expert' : '8 courses • 24 hours • User to Expert'}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">{nl ? 'Ontwikkelaar Pad' : fr ? 'Parcours D\u00e9veloppeur' : 'Developer Path'}</h4>
                  <Progress value={30} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">{nl ? '6 cursussen • 18 uur • API tot Apps' : fr ? '6 cours • 18 heures • API aux Apps' : '6 courses • 18 hours • API to Apps'}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">{nl ? 'Bureau Pad' : fr ? 'Parcours Agence' : 'Agency Path'}</h4>
                  <Progress value={45} className="h-2 mb-2" />
                  <p className="text-sm text-muted-foreground">{nl ? '10 cursussen • 30 uur • Partner Succes' : fr ? '10 cours • 30 heures • Succ\u00e8s Partenaire' : '10 courses • 30 hours • Partner Success'}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Industry Agents */}
      {selectedView === 'agents' && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Branche-specifieke AI Agents' : fr ? 'Agents IA Sp\u00e9cifiques au Secteur' : 'Industry-Specific AI Agents'}</CardTitle>
              <CardDescription>{nl ? 'Voorgetrainde modellen voor verticale markten' : fr ? 'Mod\u00e8les pr\u00e9-entra\u00een\u00e9s pour les march\u00e9s verticaux' : 'Pre-trained models for vertical markets'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {industryAgents.map((agent, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <Code className="h-8 w-8 text-primary" />
                      {agent.status === 'active' ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {nl ? 'Actief' : fr ? 'Actif' : 'Active'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{nl ? 'Binnenkort' : fr ? 'Bient\u00f4t' : 'Coming Soon'}</Badge>
                      )}
                    </div>
                    <h4 className="font-semibold mb-1">{agent.name}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{agent.industry}</p>
                    {agent.status === 'active' && (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>{nl ? 'Implementaties' : fr ? 'D\u00e9ploiements' : 'Deployments'}</span>
                          <span className="font-medium">{agent.deployments}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{nl ? 'Nauwkeurigheid' : fr ? 'Pr\u00e9cision' : 'Accuracy'}</span>
                          <span className="font-medium">{agent.accuracy}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'Fine-Tuning Studio' : fr ? 'Studio de Fine-Tuning' : 'Fine-Tuning Studio'}</CardTitle>
              <CardDescription>{nl ? 'Train aangepaste AI-modellen voor jouw branche' : fr ? 'Entra\u00eenez des mod\u00e8les IA personnalis\u00e9s pour votre secteur' : 'Train custom AI models for your industry'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Brain className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{nl ? 'Aangepaste AI Training Beschikbaar' : fr ? 'Formation IA Personnalis\u00e9e Disponible' : 'Custom AI Training Available'}</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  {nl ? 'Train gespecialiseerde modellen met jouw branchedata voor onge\u00ebvenaarde nauwkeurigheid en compliance' : fr ? 'Entra\u00eenez des mod\u00e8les sp\u00e9cialis\u00e9s avec vos donn\u00e9es sectorielles pour une pr\u00e9cision et une conformit\u00e9 in\u00e9gal\u00e9es' : 'Train specialized models with your industry data for unmatched accuracy and compliance'}
                </p>
                <Button>{nl ? 'Start Training' : fr ? 'D\u00e9marrer l\'entra\u00eenement' : 'Start Training'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* White Label */}
      {selectedView === 'whitelabel' && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{nl ? 'White Label Platform' : fr ? 'Plateforme White Label' : 'White Label Platform'}</CardTitle>
              <CardDescription>{nl ? 'Jouw merk, onze technologie' : fr ? 'Votre marque, notre technologie' : 'Your brand, our technology'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center p-6 border rounded-lg">
                  <Globe className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Starter</h4>
                  <p className="text-2xl font-bold mb-2">$999/{nl ? 'mnd' : fr ? 'mois' : 'mo'}</p>
                  <p className="text-sm text-muted-foreground">{nl ? 'Tot 50 gebruikers' : fr ? 'Jusqu\'\u00e0 50 utilisateurs' : 'Up to 50 users'}</p>
                  <ul className="text-sm text-left mt-4 space-y-1">
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {nl ? 'Eigen huisstijl' : fr ? 'Image de marque personnalis\u00e9e' : 'Custom branding'}
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {nl ? 'Eigen domein' : fr ? 'Votre domaine' : 'Your domain'}
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {nl ? 'Basis ondersteuning' : fr ? 'Support basique' : 'Basic support'}
                    </li>
                  </ul>
                </div>
                <div className="text-center p-6 border-2 border-primary rounded-lg">
                  <Building className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Professional</h4>
                  <p className="text-2xl font-bold mb-2">$2,999/{nl ? 'mnd' : fr ? 'mois' : 'mo'}</p>
                  <p className="text-sm text-muted-foreground">{nl ? 'Tot 200 gebruikers' : fr ? 'Jusqu\'\u00e0 200 utilisateurs' : 'Up to 200 users'}</p>
                  <ul className="text-sm text-left mt-4 space-y-1">
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {nl ? 'Alles in Starter' : fr ? 'Tout dans Starter' : 'Everything in Starter'}
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {nl ? 'API toegang' : fr ? 'Acc\u00e8s API' : 'API access'}
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {nl ? 'Prioriteit ondersteuning' : fr ? 'Support prioritaire' : 'Priority support'}
                    </li>
                  </ul>
                </div>
                <div className="text-center p-6 border rounded-lg">
                  <DollarSign className="h-12 w-12 text-primary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Enterprise</h4>
                  <p className="text-2xl font-bold mb-2">{nl ? 'Op maat' : fr ? 'Sur mesure' : 'Custom'}</p>
                  <p className="text-sm text-muted-foreground">{nl ? 'Onbeperkte gebruikers' : fr ? 'Utilisateurs illimit\u00e9s' : 'Unlimited users'}</p>
                  <ul className="text-sm text-left mt-4 space-y-1">
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {nl ? 'Alles in Pro' : fr ? 'Tout dans Pro' : 'Everything in Pro'}
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {nl ? 'Dedicated instantie' : fr ? 'Instance d\u00e9di\u00e9e' : 'Dedicated instance'}
                    </li>
                    <li className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      {nl ? 'SLA garantie' : fr ? 'Garantie SLA' : 'SLA guarantee'}
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{nl ? 'Actieve White Labels' : fr ? 'White Labels Actifs' : 'Active White Labels'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">47</p>
                <p className="text-xs text-muted-foreground">{nl ? 'In 12 landen' : fr ? 'Dans 12 pays' : 'Across 12 countries'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{nl ? 'Gecombineerde MRR' : fr ? 'MRR Combin\u00e9' : 'Combined MRR'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">$423K</p>
                <p className="text-xs text-green-600">+34% {nl ? 'KwK' : fr ? 'T/T' : 'QoQ'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{nl ? 'Totaal Eindgebruikers' : fr ? 'Total Utilisateurs Finaux' : 'Total End Users'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">12.4K</p>
                <p className="text-xs text-muted-foreground">{nl ? '23% maandelijkse groei' : fr ? 'Croissance de 23% par mois' : 'Growing 23% monthly'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcosystemExpansion;
