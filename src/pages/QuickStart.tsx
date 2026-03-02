import { useState } from 'react';
import { 
  Zap, Check, ArrowRight, Palette, Users, 
  Target, Globe, Rocket, Clock 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageLayout, PageHeader } from '@/components/layouts/PageLayout';
import { ProgressCard, StepCard, HelpCard } from '@/components/ui/responsive-cards';

export default function QuickStart() {
  const setupSteps = [
    {
      id: 'brand',
      title: 'Set Up Your Brand',
      description: 'Upload your logo, define brand colors, and set your brand voice',
      duration: '10 mins',
      icon: <Palette className="h-6 w-6" />,
      status: 'completed' as const,
    },
    {
      id: 'audience',
      title: 'Define Target Audience',
      description: 'Create detailed personas of your ideal customers',
      duration: '15 mins',
      icon: <Users className="h-6 w-6" />,
      status: 'current' as const,
    },
    {
      id: 'goals',
      title: 'Set Goals & KPIs',
      description: 'Establish measurable objectives for your marketing efforts',
      duration: '10 mins',
      icon: <Target className="h-6 w-6" />,
      status: 'upcoming' as const,
    },
    {
      id: 'competition',
      title: 'Analyze Competition',
      description: 'Understand your market position and competitive landscape',
      duration: '20 mins',
      icon: <Globe className="h-6 w-6" />,
      status: 'upcoming' as const,
    },
    {
      id: 'campaign',
      title: 'Create First Campaign',
      description: 'Launch your first AI-powered marketing campaign',
      duration: '15 mins',
      icon: <Rocket className="h-6 w-6" />,
      status: 'upcoming' as const,
    }
  ];

  return (
    <PageLayout maxWidth="default">
      <PageHeader
        title="Quick Start Guide"
        subtitle="Get your marketing platform up and running in 30 minutes"
        icon={<Zap className="h-8 w-8 text-purple-600" />}
        centered
      />

      <ProgressCard
        title="Your Progress"
        subtitle="1 of 5 steps completed"
        progress={1}
        total={5}
        completedText="Complete"
        estimatedTime="Estimated time remaining: 55 minutes"
      />

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Setup Steps</h2>
        {setupSteps.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            onClick={() => window.location.href = `/app/setup/${step.id}`}
          />
        ))}
      </div>

      <HelpCard
        title="Need Help?"
        description="Our AI assistant is here to guide you through each step"
        icon={<Zap className="h-8 w-8 text-purple-600" />}
        action={{
          label: "Get Assistance",
          onClick: () => console.log('Open help')
        }}
      />
    </PageLayout>
  );
}