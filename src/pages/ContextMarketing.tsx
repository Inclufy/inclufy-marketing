// src/pages/ContextMarketing.tsx
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard, Target, Rocket, Zap, BarChart3, Bot, Brain,
  Sparkles, Users, Mail, MessageSquare, FileText, Image, Pen,
  Globe, Building, ArrowRight, Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ContextMarketing() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const sections = [
    {
      title: nl ? 'Marketing Fundament' : fr ? 'Fondation marketing' : 'Marketing Foundation',
      icon: Building,
      color: 'from-purple-600 to-indigo-600',
      items: [
        { label: nl ? 'Merkgeheugen' : fr ? 'M\u00e9moire de marque' : 'Brand Memory', desc: nl ? 'Definieer merkstem & kennis' : fr ? 'D\u00e9finir la voix & les connaissances de marque' : 'Define brand voice & knowledge', href: '/app/brand-memory', icon: Brain },
        { label: nl ? 'Doelgroep' : fr ? 'Public cible' : 'Target Audience', desc: nl ? 'Klantpersona\'s & segmenten' : fr ? 'Personas clients & segments' : 'Customer personas & segments', href: '/app/setup/audience', icon: Users },
        { label: nl ? 'Concurrentieanalyse' : fr ? 'Analyse concurrentielle' : 'Competitive Analysis', desc: nl ? 'Marktpositionering' : fr ? 'Positionnement sur le march\u00e9' : 'Market positioning', href: '/app/setup/competition', icon: Target },
        { label: nl ? 'Doelen & KPI\'s' : fr ? 'Objectifs & KPI' : 'Goals & KPIs', desc: nl ? 'Stel meetbare doelstellingen' : fr ? 'D\u00e9finir des objectifs mesurables' : 'Set measurable objectives', href: '/app/setup/goals', icon: Activity },
      ],
    },
    {
      title: nl ? 'Contentcreatie' : fr ? 'Cr\u00e9ation de contenu' : 'Content Creation',
      icon: Sparkles,
      color: 'from-pink-600 to-rose-600',
      items: [
        { label: nl ? 'AI Schrijver' : fr ? 'R\u00e9dacteur IA' : 'AI Writer', desc: nl ? 'Genereer blogs, artikelen, advertentieteksten' : fr ? 'G\u00e9n\u00e9rer des blogs, articles, textes publicitaires' : 'Generate blogs, articles, ad copy', href: '/app/content/writer', icon: Pen },
        { label: nl ? 'E-mailcampagnes' : fr ? 'Campagnes e-mail' : 'Email Campaigns', desc: nl ? 'Maak & verstuur e-mailcampagnes' : fr ? 'Cr\u00e9er & envoyer des campagnes e-mail' : 'Create & send email campaigns', href: '/app/campaigns/email', icon: Mail },
        { label: nl ? 'Social Media' : fr ? 'R\u00e9seaux sociaux' : 'Social Media', desc: nl ? 'Genereer social media berichten' : fr ? 'G\u00e9n\u00e9rer des publications sur les r\u00e9seaux sociaux' : 'Generate social media posts', href: '/app/campaigns/social', icon: MessageSquare },
        { label: nl ? 'Landingspagina\'s' : fr ? 'Pages d\'atterrissage' : 'Landing Pages', desc: nl ? 'Bouw AI-gestuurde landingspagina\'s' : fr ? 'Cr\u00e9er des pages d\'atterrissage aliment\u00e9es par l\'IA' : 'Build AI-powered landing pages', href: '/app/campaigns/landing', icon: Globe },
        { label: nl ? 'Afbeeldingsgenerator' : fr ? 'G\u00e9n\u00e9rateur d\'images' : 'Image Generator', desc: nl ? 'Maak marketingvisuals' : fr ? 'Cr\u00e9er des visuels marketing' : 'Create marketing visuals', href: '/app/content/images', icon: Image },
        { label: nl ? 'Contentbibliotheek' : fr ? 'Biblioth\u00e8que de contenu' : 'Content Library', desc: nl ? 'Bekijk opgeslagen content' : fr ? 'Parcourir le contenu enregistr\u00e9' : 'Browse saved content', href: '/app/content-library', icon: FileText },
      ],
    },
    {
      title: nl ? 'Campagnebeheer' : fr ? 'Gestion des campagnes' : 'Campaign Management',
      icon: Rocket,
      color: 'from-blue-600 to-cyan-600',
      items: [
        { label: nl ? 'Campagne Orchestrator' : fr ? 'Orchestrateur de campagnes' : 'Campaign Orchestrator', desc: nl ? 'Plan & beheer campagnes' : fr ? 'Planifier & g\u00e9rer les campagnes' : 'Plan & manage campaigns', href: '/app/campaigns', icon: Rocket },
        { label: nl ? 'Contactbeheer' : fr ? 'Gestionnaire de contacts' : 'Contact Manager', desc: nl ? 'Beheer contacten & lijsten' : fr ? 'G\u00e9rer les contacts & listes' : 'Manage contacts & lists', href: '/app/contacts', icon: Users },
      ],
    },
    {
      title: nl ? 'Automatisering' : fr ? 'Automatisation' : 'Automation',
      icon: Zap,
      color: 'from-amber-600 to-orange-600',
      items: [
        { label: nl ? 'Workflow Builder' : fr ? 'Constructeur de workflows' : 'Workflow Builder', desc: nl ? 'Automatiseer marketingworkflows' : fr ? 'Automatiser les workflows marketing' : 'Automate marketing workflows', href: '/app/automation/workflows', icon: Zap },
        { label: nl ? 'Klantenreizen' : fr ? 'Parcours clients' : 'Customer Journeys', desc: nl ? 'Ontwerp klantpaden' : fr ? 'Concevoir les parcours clients' : 'Design customer paths', href: '/app/automation/journeys', icon: Target },
        { label: nl ? 'AI Agenten' : fr ? 'Agents IA' : 'AI Agents', desc: nl ? 'Conversationele AI-assistenten' : fr ? 'Assistants IA conversationnels' : 'Conversational AI assistants', href: '/app/automation/agents', icon: Bot },
      ],
    },
    {
      title: nl ? 'Analyse & Intelligentie' : fr ? 'Analytique & Intelligence' : 'Analytics & Intelligence',
      icon: BarChart3,
      color: 'from-emerald-600 to-green-600',
      items: [
        { label: nl ? 'Analyse Dashboard' : fr ? 'Tableau de bord analytique' : 'Analytics Dashboard', desc: nl ? 'Volg prestatiemetrieken' : fr ? 'Suivre les m\u00e9triques de performance' : 'Track performance metrics', href: '/app/analytics', icon: BarChart3 },
        { label: nl ? 'Groei Blauwdruk' : fr ? 'Plan de croissance' : 'Growth Blueprint', desc: nl ? 'Bedrijfsanalyse & inzichten' : fr ? 'Analyse d\'entreprise & insights' : 'Company analysis & insights', href: '/app/growth-blueprint', icon: Target },
        { label: nl ? 'Marktintelligentie' : fr ? 'Intelligence de march\u00e9' : 'Market Intelligence', desc: nl ? 'Markttrends & data' : fr ? 'Tendances du march\u00e9 & donn\u00e9es' : 'Market trends & data', href: '/app/intelligence/market', icon: Globe },
      ],
    },
  ];
  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="w-full py-2">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                {nl ? 'Marketing Hub' : fr ? 'Hub Marketing' : 'Marketing Hub'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {nl ? 'Uw complete AI-gestuurde marketingtoolkit' : fr ? 'Votre bo\u00eete \u00e0 outils marketing compl\u00e8te aliment\u00e9e par l\'IA' : 'Your complete AI-powered marketing toolkit'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full py-2 space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${section.color}`}>
                <section.icon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">{section.title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item) => (
                <Link to={item.href} key={item.label}>
                  <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-gray-200 dark:border-gray-800">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                          <item.icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{item.label}</h3>
                          <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
