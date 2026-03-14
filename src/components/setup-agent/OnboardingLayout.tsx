// src/components/setup-agent/OnboardingLayout.tsx
// Full-page layout shell for AI-driven onboarding (replaces old form wizard)

import React from 'react';
import { Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { ONBOARDING_STEPS } from '@/services/setup-agent/types';
import type { OnboardingStep } from '@/services/setup-agent/types';

const STEP_LABELS: Record<OnboardingStep, { nl: string; en: string }> = {
  basics: { nl: 'Bedrijfsgegevens', en: 'Company Details' },
  refine: { nl: 'Verfijnen', en: 'Refine' },
  strategy: { nl: 'Strategie', en: 'Strategy' },
  summary: { nl: 'Samenvatting', en: 'Summary' },
};

interface OnboardingLayoutProps {
  currentStep: number;
  children: React.ReactNode;
}

export default function OnboardingLayout({ currentStep, children }: OnboardingLayoutProps) {
  const { lang, setLang } = useLanguage();
  const nl = lang === 'nl';
  const progressPct = Math.round(((currentStep + 1) / ONBOARDING_STEPS.length) * 100);
  const stepKey = ONBOARDING_STEPS[currentStep] || 'basics';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950 flex flex-col">
      {/* Top bar */}
      <header className="shrink-0 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">Inclufy Marketing</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Step indicator */}
          <div className="hidden sm:flex items-center gap-2">
            {ONBOARDING_STEPS.map((step, i) => (
              <div
                key={step}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  i === currentStep
                    ? 'bg-purple-600 text-white'
                    : i < currentStep
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-white/20">
                  {i < currentStep ? '\u2713' : i + 1}
                </span>
                <span className="hidden md:inline">{nl ? STEP_LABELS[step].nl : STEP_LABELS[step].en}</span>
              </div>
            ))}
          </div>

          {/* Language toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === 'nl' ? 'en' : 'nl')}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <Globe className="w-4 h-4 mr-1" />
            <span className="text-xs uppercase">{lang}</span>
          </Button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-6">
        <Progress value={progressPct} className="h-1 bg-white/10" />
      </div>

      {/* Content area */}
      <main className="flex-1 flex items-start justify-center px-4 py-8 overflow-y-auto">
        <div className="w-full max-w-4xl">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 text-center py-3 text-white/30 text-xs">
        AI-Powered Setup &middot; {nl ? 'Stap' : 'Step'} {currentStep + 1}/{ONBOARDING_STEPS.length}
      </footer>
    </div>
  );
}
