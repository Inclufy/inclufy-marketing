import { useState } from 'react';
import {
  Zap, Check, ArrowRight, Palette, Users,
  Target, Globe, Rocket, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout, PageHeader } from '@/components/layouts/PageLayout';
import { ProgressCard, StepCard, HelpCard } from '@/components/ui/responsive-cards';
import { useLanguage } from '@/contexts/LanguageContext';

export default function QuickStart() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const setupSteps = [
    {
      id: 'brand',
      title: nl ? 'Stel je merk in' : fr ? 'Configurez votre marque' : 'Set Up Your Brand',
      description: nl ? 'Upload je logo, definieer merkkleuren en stel je merkstem in' : fr ? 'Téléchargez votre logo, définissez les couleurs de marque et votre ton de voix' : 'Upload your logo, define brand colors, and set your brand voice',
      duration: nl ? '10 min' : fr ? '10 min' : '10 mins',
      icon: <Palette className="h-6 w-6" />,
      status: 'completed' as const,
    },
    {
      id: 'audience',
      title: nl ? 'Definieer doelgroep' : fr ? 'Définir le public cible' : 'Define Target Audience',
      description: nl ? 'Maak gedetailleerde persona\'s van je ideale klanten' : fr ? 'Créez des personas détaillés de vos clients idéaux' : 'Create detailed personas of your ideal customers',
      duration: nl ? '15 min' : fr ? '15 min' : '15 mins',
      icon: <Users className="h-6 w-6" />,
      status: 'current' as const,
    },
    {
      id: 'goals',
      title: nl ? 'Stel doelen & KPI\'s in' : fr ? 'Définir les objectifs & KPI' : 'Set Goals & KPIs',
      description: nl ? 'Stel meetbare doelstellingen vast voor je marketinginspanningen' : fr ? 'Établissez des objectifs mesurables pour vos efforts marketing' : 'Establish measurable objectives for your marketing efforts',
      duration: nl ? '10 min' : fr ? '10 min' : '10 mins',
      icon: <Target className="h-6 w-6" />,
      status: 'upcoming' as const,
    },
    {
      id: 'competition',
      title: nl ? 'Analyseer concurrentie' : fr ? 'Analyser la concurrence' : 'Analyze Competition',
      description: nl ? 'Begrijp je marktpositie en het concurrentielandschap' : fr ? 'Comprenez votre position sur le marché et le paysage concurrentiel' : 'Understand your market position and competitive landscape',
      duration: nl ? '20 min' : fr ? '20 min' : '20 mins',
      icon: <Globe className="h-6 w-6" />,
      status: 'upcoming' as const,
    },
    {
      id: 'campaign',
      title: nl ? 'Maak eerste campagne' : fr ? 'Créer la première campagne' : 'Create First Campaign',
      description: nl ? 'Lanceer je eerste AI-aangedreven marketingcampagne' : fr ? 'Lancez votre première campagne marketing propulsée par l\'IA' : 'Launch your first AI-powered marketing campaign',
      duration: nl ? '15 min' : fr ? '15 min' : '15 mins',
      icon: <Rocket className="h-6 w-6" />,
      status: 'upcoming' as const,
    }
  ];

  return (
    <PageLayout maxWidth="default">
      <PageHeader
        title={nl ? "Snelstartgids" : fr ? "Guide de démarrage rapide" : "Quick Start Guide"}
        subtitle={nl ? "Zet je marketingplatform op in 30 minuten" : fr ? "Lancez votre plateforme marketing en 30 minutes" : "Get your marketing platform up and running in 30 minutes"}
        icon={<Zap className="h-8 w-8 text-purple-600" />}
        centered
      />

      <ProgressCard
        title={nl ? "Je voortgang" : fr ? "Votre progression" : "Your Progress"}
        subtitle={nl ? "1 van 5 stappen voltooid" : fr ? "1 étape sur 5 terminée" : "1 of 5 steps completed"}
        progress={1}
        total={5}
        completedText={nl ? "Voltooid" : fr ? "Terminé" : "Complete"}
        estimatedTime={nl ? "Geschatte resterende tijd: 55 minuten" : fr ? "Temps restant estimé : 55 minutes" : "Estimated time remaining: 55 minutes"}
      />

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">{nl ? "Installatiestappen" : fr ? "Étapes de configuration" : "Setup Steps"}</h2>
        {setupSteps.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            onClick={() => window.location.href = `/app/setup/${step.id}`}
          />
        ))}
      </div>

      <HelpCard
        title={nl ? "Hulp nodig?" : fr ? "Besoin d'aide ?" : "Need Help?"}
        description={nl ? "Onze AI-assistent helpt je door elke stap" : fr ? "Notre assistant IA est là pour vous guider à chaque étape" : "Our AI assistant is here to guide you through each step"}
        icon={<Zap className="h-8 w-8 text-purple-600" />}
        action={{
          label: nl ? "Hulp krijgen" : fr ? "Obtenir de l'aide" : "Get Assistance",
          onClick: () => console.log('Open help')
        }}
      />
    </PageLayout>
  );
}