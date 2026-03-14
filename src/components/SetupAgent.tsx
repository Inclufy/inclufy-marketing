// src/components/SetupAgent.tsx
// AI Setup Copilot — conversational sidebar that guides users through 6 setup steps

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, X, Sparkles, Loader2, Rocket, ChevronRight, ChevronLeft,
  Globe, Users, Target, Zap, Brain, FileText, Check, Plus, SkipForward, Save,
  PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSetupAgent } from '@/contexts/SetupAgentContext';
import { setupAgentService } from '@/services/setup-agent/setup-agent.service';
import type { SetupStep } from '@/services/setup-agent/types';
import {
  BrandPreviewCard,
  CompetitorPreviewCard,
  StrategyPreviewCard,
  IntegrationPreviewCard,
  PersonaPreviewCard,
  TemplatePreviewCard,
} from './setup-agent/StepPreviewCards';

interface SetupAgentProps {
  isOpen: boolean;
  onClose: () => void;
  onExit: () => void;
}

const STEP_CONFIG: { key: SetupStep; icon: typeof Globe; labelNl: string; labelEn: string }[] = [
  { key: 'website', icon: Globe, labelNl: 'Website & Merk', labelEn: 'Website & Brand' },
  { key: 'competitors', icon: Users, labelNl: 'Concurrenten', labelEn: 'Competitors' },
  { key: 'goals', icon: Target, labelNl: 'Doelen & KPIs', labelEn: 'Goals & KPIs' },
  { key: 'channels', icon: Zap, labelNl: 'Kanalen', labelEn: 'Channels' },
  { key: 'personas', icon: Brain, labelNl: "Persona's & Scoring", labelEn: 'Personas & Scoring' },
  { key: 'templates', icon: FileText, labelNl: 'Content Templates', labelEn: 'Content Templates' },
];

const GOAL_OPTIONS = [
  'Meer leads genereren', 'Omzet verhogen', 'Brand awareness vergroten',
  'Website traffic verhogen', 'Customer retention verbeteren', 'Thought leadership opbouwen',
  'Social media groei', 'Email marketing optimaliseren',
];

const CHANNEL_OPTIONS = [
  'LinkedIn', 'Instagram', 'Facebook', 'Twitter/X', 'TikTok',
  'Email', 'Blog', 'Google Ads', 'YouTube', 'Podcast',
];

export default function SetupAgent({ isOpen, onClose, onExit }: SetupAgentProps) {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    currentStep, completedSteps, stepData, isLoading,
    nextStep, prevStep, skipStep, setStepData, markStepComplete,
    setLoading, setError, exitSetup, error,
  } = useSetupAgent();

  // Local input state
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [competitorNames, setCompetitorNames] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentStep, stepData, isLoading]);

  // Pre-fill from saved data
  useEffect(() => {
    if (stepData.website?.suggested_competitors) {
      setCompetitorNames(stepData.website.suggested_competitors.slice(0, 3));
    }
  }, [stepData.website]);

  const progressPct = Math.round((completedSteps.length / 6) * 100);
  const stepConfig = STEP_CONFIG[currentStep];

  // ─── Step Handlers ──────────────────────────────────────────────
  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl) return;
    setLoading(true);
    setError(null);
    try {
      const result = await setupAgentService.analyzeWebsite(websiteUrl, lang);
      setStepData('website', result);
      await setupAgentService.saveBrandData(result);
      markStepComplete('website');
      toast({ title: nl ? 'Merkidentiteit opgeslagen!' : 'Brand identity saved!' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeCompetitors = async () => {
    if (competitorNames.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await setupAgentService.analyzeCompetitors(
        competitorNames.map(n => ({ name: n })),
        stepData.website?.industry || '',
        stepData.website?.brand_name || '',
        lang,
      );
      setStepData('competitors', result);
      await setupAgentService.saveCompetitors(result.competitors);
      markStepComplete('competitors');
      toast({ title: nl ? 'Concurrentieanalyse opgeslagen!' : 'Competitive analysis saved!' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStrategy = async () => {
    if (selectedGoals.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await setupAgentService.generateStrategy(
        selectedGoals,
        stepData.website?.industry || '',
        stepData.website?.brand_name || '',
        lang,
      );
      setStepData('goals', result);
      await setupAgentService.saveObjectives(result);
      markStepComplete('goals');
      toast({ title: nl ? 'Strategische doelen opgeslagen!' : 'Strategic goals saved!' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestIntegrations = async () => {
    if (selectedChannels.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const result = await setupAgentService.suggestIntegrations(
        selectedChannels,
        stepData.website?.industry || '',
        selectedGoals.join(', '),
        lang,
      );
      setStepData('channels', result);
      await setupAgentService.saveIntegrations(result.integrations);
      markStepComplete('channels');
      toast({ title: nl ? 'Integraties geconfigureerd!' : 'Integrations configured!' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePersonas = async () => {
    setLoading(true);
    setError(null);
    try {
      const personaResult = await setupAgentService.generatePersonas(
        stepData.website?.industry || '',
        stepData.website?.brand_name || '',
        stepData.website?.target_audiences || [],
        selectedGoals,
        lang,
      );
      const scoringResult = await setupAgentService.generateScoringModel(
        stepData.website?.industry || '',
        selectedGoals.join(', '),
        personaResult.personas,
        lang,
      );
      setStepData('personas', { ...personaResult, scoring: scoringResult });
      await setupAgentService.savePersonas(personaResult.personas);
      await setupAgentService.saveScoringModel(scoringResult);
      markStepComplete('personas');
      toast({ title: nl ? "Persona's & scoring model opgeslagen!" : 'Personas & scoring model saved!' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await setupAgentService.suggestTemplates(
        stepData.website?.industry || '',
        selectedChannels,
        selectedGoals.join(', '),
        stepData.website?.tone || 'professional',
        stepData.website?.brand_name || '',
        lang,
      );
      setStepData('templates', result);
      await setupAgentService.saveTemplates(result.templates, stepData.website?.brand_name || '');
      markStepComplete('templates');
      setShowConfetti(true);
      toast({ title: nl ? 'Setup voltooid!' : 'Setup complete!' });
      setTimeout(() => setShowConfetti(false), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render Step Content ────────────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 0: return renderWebsiteStep();
      case 1: return renderCompetitorsStep();
      case 2: return renderGoalsStep();
      case 3: return renderChannelsStep();
      case 4: return renderPersonasStep();
      case 5: return renderTemplatesStep();
      default: return null;
    }
  };

  const renderWebsiteStep = () => (
    <div className="space-y-3">
      <BotMessage>
        {nl
          ? "Welkom! Laten we je platform instellen. Wat is de URL van je website? Ik analyseer je merkidentiteit automatisch."
          : "Welcome! Let's set up your platform. What is your website URL? I'll analyze your brand identity automatically."}
      </BotMessage>
      <div className="flex gap-2">
        <Input
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://www.jouwwebsite.nl"
          className="text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyzeWebsite()}
        />
        <Button size="sm" onClick={handleAnalyzeWebsite} disabled={isLoading || !websiteUrl}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
      {stepData.website && (
        <>
          <BrandPreviewCard data={stepData.website} />
          <BotMessage>
            {nl
              ? `Ik heb "${stepData.website.brand_name}" geanalyseerd en je merkidentiteit opgeslagen. Klopt dit?`
              : `I've analyzed "${stepData.website.brand_name}" and saved your brand identity. Does this look correct?`}
          </BotMessage>
          <ActionButtons
            onConfirm={() => nextStep()}
            onSkip={() => skipStep()}
            confirmLabel={nl ? 'Bevestigen & Doorgaan' : 'Confirm & Continue'}
          />
        </>
      )}
    </div>
  );

  const renderCompetitorsStep = () => (
    <div className="space-y-3">
      <BotMessage>
        {nl
          ? "Wie zijn je belangrijkste concurrenten? Ik heb alvast een paar suggesties op basis van je website."
          : "Who are your main competitors? I've got some suggestions based on your website."}
      </BotMessage>
      {/* Suggested competitors as chips */}
      <div className="flex flex-wrap gap-1.5">
        {(stepData.website?.suggested_competitors || []).map((name: string) => (
          <Badge
            key={name}
            variant={competitorNames.includes(name) ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            onClick={() => {
              setCompetitorNames((prev) =>
                prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
              );
            }}
          >
            {name}
          </Badge>
        ))}
      </div>
      {/* Add custom */}
      <div className="flex gap-2">
        <Input
          value={newCompetitor}
          onChange={(e) => setNewCompetitor(e.target.value)}
          placeholder={nl ? '+ Voeg concurrent toe...' : '+ Add competitor...'}
          className="text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newCompetitor.trim()) {
              setCompetitorNames((prev) => [...prev, newCompetitor.trim()]);
              setNewCompetitor('');
            }
          }}
        />
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (newCompetitor.trim()) {
              setCompetitorNames((prev) => [...prev, newCompetitor.trim()]);
              setNewCompetitor('');
            }
          }}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {competitorNames.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {competitorNames.map((name) => (
            <Badge key={name} className="text-xs gap-1">
              {name}
              <X
                className="w-3 h-3 cursor-pointer"
                onClick={() => setCompetitorNames((prev) => prev.filter(n => n !== name))}
              />
            </Badge>
          ))}
        </div>
      )}
      <Button
        size="sm"
        className="w-full"
        onClick={handleAnalyzeCompetitors}
        disabled={isLoading || competitorNames.length === 0}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
        {nl ? 'Analyseren' : 'Analyze'}
      </Button>
      {stepData.competitors?.competitors?.map((c: any, i: number) => (
        <CompetitorPreviewCard key={i} data={c} />
      ))}
      {completedSteps.includes('competitors') && (
        <ActionButtons onConfirm={nextStep} onSkip={skipStep} confirmLabel={nl ? 'Doorgaan' : 'Continue'} />
      )}
    </div>
  );

  const renderGoalsStep = () => (
    <div className="space-y-3">
      <BotMessage>
        {nl
          ? 'Wat zijn je belangrijkste marketingdoelen? Selecteer er meerdere.'
          : 'What are your main marketing goals? Select multiple.'}
      </BotMessage>
      <div className="flex flex-wrap gap-1.5">
        {GOAL_OPTIONS.map((goal) => (
          <Badge
            key={goal}
            variant={selectedGoals.includes(goal) ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            onClick={() => {
              setSelectedGoals((prev) =>
                prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
              );
            }}
          >
            {goal}
          </Badge>
        ))}
      </div>
      <Button
        size="sm"
        className="w-full"
        onClick={handleGenerateStrategy}
        disabled={isLoading || selectedGoals.length === 0}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
        {nl ? 'Strategie Genereren' : 'Generate Strategy'}
      </Button>
      {stepData.goals?.objectives?.map((o: any, i: number) => (
        <StrategyPreviewCard key={i} data={o} />
      ))}
      {completedSteps.includes('goals') && (
        <ActionButtons onConfirm={nextStep} onSkip={skipStep} confirmLabel={nl ? 'Doorgaan' : 'Continue'} />
      )}
    </div>
  );

  const renderChannelsStep = () => (
    <div className="space-y-3">
      <BotMessage>
        {nl
          ? 'Welke marketingkanalen gebruik je of wil je gaan gebruiken?'
          : 'Which marketing channels do you use or plan to use?'}
      </BotMessage>
      <div className="flex flex-wrap gap-1.5">
        {CHANNEL_OPTIONS.map((ch) => (
          <Badge
            key={ch}
            variant={selectedChannels.includes(ch) ? 'default' : 'outline'}
            className="cursor-pointer text-xs"
            onClick={() => {
              setSelectedChannels((prev) =>
                prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
              );
            }}
          >
            {ch}
          </Badge>
        ))}
      </div>
      <Button
        size="sm"
        className="w-full"
        onClick={handleSuggestIntegrations}
        disabled={isLoading || selectedChannels.length === 0}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
        {nl ? 'Integraties Suggereren' : 'Suggest Integrations'}
      </Button>
      {stepData.channels?.integrations?.map((i: any, idx: number) => (
        <IntegrationPreviewCard key={idx} data={i} />
      ))}
      {completedSteps.includes('channels') && (
        <ActionButtons onConfirm={nextStep} onSkip={skipStep} confirmLabel={nl ? 'Doorgaan' : 'Continue'} />
      )}
    </div>
  );

  const renderPersonasStep = () => (
    <div className="space-y-3">
      <BotMessage>
        {nl
          ? "Op basis van je merk en doelen genereer ik nu persona's en een lead scoring model."
          : "Based on your brand and goals, I'll now generate personas and a lead scoring model."}
      </BotMessage>
      <Button
        size="sm"
        className="w-full"
        onClick={handleGeneratePersonas}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
        {nl ? "Persona's Genereren" : 'Generate Personas'}
      </Button>
      {stepData.personas?.personas?.map((p: any, i: number) => (
        <PersonaPreviewCard key={i} data={p} />
      ))}
      {completedSteps.includes('personas') && (
        <ActionButtons onConfirm={nextStep} onSkip={skipStep} confirmLabel={nl ? 'Doorgaan' : 'Continue'} />
      )}
    </div>
  );

  const renderTemplatesStep = () => (
    <div className="space-y-3">
      <BotMessage>
        {nl
          ? 'Laatste stap! Ik genereer content templates afgestemd op je merk en kanalen.'
          : "Final step! I'll generate content templates tailored to your brand and channels."}
      </BotMessage>
      <Button
        size="sm"
        className="w-full"
        onClick={handleSuggestTemplates}
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
        {nl ? 'Templates Genereren' : 'Generate Templates'}
      </Button>
      {stepData.templates?.templates?.map((t: any, i: number) => (
        <TemplatePreviewCard key={i} data={t} />
      ))}
      {completedSteps.includes('templates') && (
        <div className="space-y-3">
          {showConfetti && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center py-4"
            >
              <PartyPopper className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm font-semibold">
                {nl ? 'Setup voltooid!' : 'Setup complete!'}
              </p>
            </motion.div>
          )}
          <BotMessage>
            {nl
              ? 'Je platform is volledig ingericht! Alle data is opgeslagen en klaar voor gebruik.'
              : 'Your platform is fully set up! All data has been saved and is ready to use.'}
          </BotMessage>
          <Button size="sm" className="w-full" onClick={() => { exitSetup(); onExit(); }}>
            {nl ? 'Setup Sluiten' : 'Close Setup'}
          </Button>
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      exit={{ x: 320 }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed top-0 right-0 z-50 w-[320px] h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-xl"
    >
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            <span className="font-semibold text-sm">AI Setup Copilot</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { onClose(); }} className="text-white hover:bg-white/20 h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/80">
          <span>{nl ? 'Stap' : 'Step'} {currentStep + 1}/6</span>
          <span>•</span>
          <span>{stepConfig?.labelNl || stepConfig?.labelEn}</span>
        </div>
        <Progress value={progressPct} className="h-1.5 mt-2 bg-white/20" />
      </div>

      {/* Step dots */}
      <div className="shrink-0 px-4 py-2 flex items-center justify-center gap-1.5 border-b border-gray-100 dark:border-gray-800">
        {STEP_CONFIG.map((step, i) => {
          const Icon = step.icon;
          const isComplete = completedSteps.includes(step.key);
          const isCurrent = i === currentStep;
          return (
            <button
              key={step.key}
              onClick={() => {
                if (isComplete || i <= currentStep) {
                  useSetupAgent && void 0; // navigate
                }
              }}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                isComplete
                  ? 'bg-green-100 text-green-600'
                  : isCurrent
                  ? 'bg-purple-100 text-purple-600 ring-2 ring-purple-300'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800',
              )}
              title={nl ? step.labelNl : step.labelEn}
            >
              {isComplete ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-2 text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="shrink-0 px-4 py-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="text-xs"
        >
          <ChevronLeft className="w-3 h-3 mr-1" />
          {nl ? 'Terug' : 'Back'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={skipStep}
          disabled={currentStep >= 5}
          className="text-xs text-gray-500"
        >
          <SkipForward className="w-3 h-3 mr-1" />
          {nl ? 'Overslaan' : 'Skip'}
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Helper Components ────────────────────────────────────────────
function BotMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{children}</p>
    </div>
  );
}

function ActionButtons({
  onConfirm,
  onSkip,
  confirmLabel,
}: {
  onConfirm: () => void;
  onSkip: () => void;
  confirmLabel: string;
}) {
  return (
    <div className="flex gap-2">
      <Button size="sm" className="flex-1 text-xs" onClick={onConfirm}>
        <Check className="w-3 h-3 mr-1" />
        {confirmLabel}
      </Button>
      <Button size="sm" variant="outline" className="text-xs" onClick={onSkip}>
        <SkipForward className="w-3 h-3 mr-1" />
        Skip
      </Button>
    </div>
  );
}
