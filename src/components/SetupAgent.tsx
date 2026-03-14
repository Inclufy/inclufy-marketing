// src/components/SetupAgent.tsx
// AI Setup Copilot — supports two modes:
// - 'sidebar': 320px right panel, 6 setup steps (in-app reconfiguration)
// - 'onboarding': full-page, 4 conversational phases (post-signup onboarding)

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, X, Sparkles, Loader2, Rocket, ChevronRight, ChevronLeft,
  Globe, Users, Target, Zap, Brain, FileText, Check, Plus, SkipForward, Save,
  PartyPopper, ArrowRight, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSetupAgent } from '@/contexts/SetupAgentContext';
import { setupAgentService } from '@/services/setup-agent/setup-agent.service';
import type { SetupStep, OnboardingData, ProductInfo, AudienceDetailed } from '@/services/setup-agent/types';
import { ONBOARDING_STEPS } from '@/services/setup-agent/types';
import {
  BrandPreviewCard,
  ExtendedBrandPreviewCard,
  ProductPreviewCard,
  AudiencePreviewCard,
  CompetitorPreviewCard,
  StrategyPreviewCard,
  IntegrationPreviewCard,
  PersonaPreviewCard,
  TemplatePreviewCard,
  OnboardingSummaryCard,
} from './setup-agent/StepPreviewCards';
import OnboardingLayout from './setup-agent/OnboardingLayout';

interface SetupAgentProps {
  isOpen: boolean;
  onClose: () => void;
  onExit: () => void;
  mode?: 'sidebar' | 'onboarding';
  onOnboardingComplete?: () => void;
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

const COUNTRY_OPTIONS = [
  'Nederland', 'Belgi\u00eb', 'Duitsland', 'Frankrijk', 'Verenigd Koninkrijk',
  'Verenigde Staten', 'Spanje', 'Itali\u00eb', 'Anders',
];

export default function SetupAgent({ isOpen, onClose, onExit, mode = 'sidebar', onOnboardingComplete }: SetupAgentProps) {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    // Sidebar state
    currentStep, completedSteps, stepData, isLoading,
    nextStep, prevStep, skipStep, setStepData, markStepComplete,
    setLoading, setError, exitSetup, error,
    // Onboarding state
    onboardingStep, onboardingData, updateOnboardingData,
    setOnboardingStep, nextOnboardingStep, prevOnboardingStep,
  } = useSetupAgent();

  // ─── Local input state (sidebar) ──────────────────────────────
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [competitorNames, setCompetitorNames] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // ─── Local input state (onboarding) ───────────────────────────
  const [obWebsite, setObWebsite] = useState('');
  const [obCompanyName, setObCompanyName] = useState('');
  const [obCountry, setObCountry] = useState('Nederland');
  const [obAnalyzing, setObAnalyzing] = useState(false);
  const [obSaving, setObSaving] = useState(false);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentStep, stepData, isLoading, onboardingStep, onboardingData]);

  // Pre-fill from saved data (sidebar)
  useEffect(() => {
    if (stepData.website?.suggested_competitors) {
      setCompetitorNames(stepData.website.suggested_competitors.slice(0, 3));
    }
  }, [stepData.website]);

  // ═══════════════════════════════════════════════════════════════
  // ONBOARDING MODE
  // ═══════════════════════════════════════════════════════════════
  if (mode === 'onboarding') {
    return (
      <OnboardingLayout currentStep={onboardingStep}>
        <AnimatePresence mode="wait">
          <motion.div
            key={onboardingStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {onboardingStep === 0 && renderOnboardingBasics()}
            {onboardingStep === 1 && renderOnboardingRefine()}
            {onboardingStep === 2 && renderOnboardingStrategy()}
            {onboardingStep === 3 && renderOnboardingSummary()}
          </motion.div>
        </AnimatePresence>

        {error && (
          <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </OnboardingLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SIDEBAR MODE (unchanged from original)
  // ═══════════════════════════════════════════════════════════════

  const progressPct = Math.round((completedSteps.length / 6) * 100);
  const stepConfig = STEP_CONFIG[currentStep];

  // ─── Step Handlers (sidebar) ──────────────────────────────────
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

  // ─── Render Sidebar Step ──────────────────────────────────────
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

  // ═══════════════════════════════════════════════════════════════
  // ONBOARDING PHASE RENDERERS
  // ═══════════════════════════════════════════════════════════════

  // Phase 1: Basics — company name, website URL, country
  function renderOnboardingBasics() {
    const handleDeepAnalyze = async () => {
      if (!obCompanyName.trim()) {
        setError(nl ? 'Vul je bedrijfsnaam in.' : 'Please enter your company name.');
        return;
      }
      setObAnalyzing(true);
      setError(null);
      updateOnboardingData({
        companyName: obCompanyName.trim(),
        website: obWebsite.trim(),
        country: obCountry,
        language: lang,
      });

      try {
        if (obWebsite.trim()) {
          // Run deep analysis + scan scores in parallel
          const [analysis, scanScores] = await Promise.all([
            setupAgentService.analyzeWebsiteDeep(obWebsite.trim(), lang),
            setupAgentService.fetchScanScores(obWebsite.trim()),
          ]);

          // Merge AI-extracted brand name with user input (prefer user)
          const finalAnalysis = {
            ...analysis,
            brand_name: obCompanyName.trim() || analysis.brand_name,
          };

          updateOnboardingData({
            analysis: finalAnalysis,
            scanScores,
            // Pre-fill refinement fields from analysis
            products: analysis.products?.length ? analysis.products : [],
            audiences: analysis.audiences_detailed?.length ? analysis.audiences_detailed : [],
            brandValues: analysis.brand_values || [],
            mission: analysis.mission || '',
            messagingDos: analysis.messaging_dos || '',
            messagingDonts: analysis.messaging_donts || '',
            tone: analysis.tone || 'professional',
            competitors: (analysis.suggested_competitors || []).map(n => ({ name: n })),
            socialAccounts: analysis.social_urls
              ? Object.entries(analysis.social_urls)
                  .filter(([, url]) => url)
                  .map(([platform, url]) => ({ platform, url }))
              : [],
          });
        } else {
          // No website — just set company name, user will fill in manually in refine step
          updateOnboardingData({
            analysis: null,
            scanScores: null,
          });
        }
        nextOnboardingStep();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setObAnalyzing(false);
      }
    };

    return (
      <div className="space-y-8">
        <div className="text-center space-y-3">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {nl ? 'Welkom bij Inclufy Marketing' : 'Welcome to Inclufy Marketing'}
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            {nl
              ? 'Vertel me over je bedrijf en ik configureer je hele marketing platform automatisch met AI.'
              : "Tell me about your business and I'll configure your entire marketing platform automatically with AI."}
          </p>
        </div>

        <div className="max-w-lg mx-auto space-y-4">
          {/* Company Name */}
          <div>
            <label className="text-sm font-medium text-white/80 mb-1.5 block">
              {nl ? 'Bedrijfsnaam' : 'Company Name'} *
            </label>
            <Input
              value={obCompanyName}
              onChange={(e) => setObCompanyName(e.target.value)}
              placeholder={nl ? 'Jouw bedrijfsnaam' : 'Your company name'}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12"
            />
          </div>

          {/* Website URL */}
          <div>
            <label className="text-sm font-medium text-white/80 mb-1.5 block">
              {nl ? 'Website URL' : 'Website URL'}
              <span className="text-white/40 ml-1 text-xs">{nl ? '(sterk aanbevolen)' : '(strongly recommended)'}</span>
            </label>
            <Input
              value={obWebsite}
              onChange={(e) => setObWebsite(e.target.value)}
              placeholder="https://www.jouwwebsite.nl"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12"
            />
            <p className="text-[11px] text-white/40 mt-1">
              {nl
                ? 'Met een URL extraheer ik automatisch je merk, producten, doelgroep en meer.'
                : "With a URL I'll automatically extract your brand, products, audience and more."}
            </p>
          </div>

          {/* Country */}
          <div>
            <label className="text-sm font-medium text-white/80 mb-1.5 block">
              {nl ? 'Land' : 'Country'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COUNTRY_OPTIONS.map((c) => (
                <Badge
                  key={c}
                  variant={obCountry === c ? 'default' : 'outline'}
                  className={cn(
                    'cursor-pointer text-xs transition-all',
                    obCountry === c
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'text-white/60 border-white/20 hover:border-white/40',
                  )}
                  onClick={() => setObCountry(c)}
                >
                  {c}
                </Badge>
              ))}
            </div>
          </div>

          {/* Submit */}
          <Button
            onClick={handleDeepAnalyze}
            disabled={obAnalyzing || !obCompanyName.trim()}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-base font-semibold"
          >
            {obAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {nl ? 'AI analyseert je bedrijf...' : 'AI is analyzing your business...'}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {nl ? 'Start AI Analyse' : 'Start AI Analysis'}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Phase 2: Refine — show AI results, let user edit what's missing
  function renderOnboardingRefine() {
    const a = onboardingData.analysis;
    const hasProducts = (onboardingData.products?.length || 0) > 0;
    const hasAudiences = (onboardingData.audiences?.length || 0) > 0;

    const addProduct = () => {
      updateOnboardingData({
        products: [...(onboardingData.products || []), { name: '', description: '', usp: '', features: '' }],
      });
    };

    const updateProduct = (idx: number, patch: Partial<ProductInfo>) => {
      const products = [...(onboardingData.products || [])];
      products[idx] = { ...products[idx], ...patch };
      updateOnboardingData({ products });
    };

    const addAudience = () => {
      updateOnboardingData({
        audiences: [...(onboardingData.audiences || []), {
          audienceType: 'B2B', idealCustomer: '', customerSector: '',
          companySize: '', ageGroup: '', occupation: '', painPoints: '',
        }],
      });
    };

    const updateAudience = (idx: number, patch: Partial<AudienceDetailed>) => {
      const audiences = [...(onboardingData.audiences || [])];
      audiences[idx] = { ...audiences[idx], ...patch };
      updateOnboardingData({ audiences });
    };

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">
            {a ? (nl ? 'Brand Profile' : 'Brand Profile') : (nl ? 'Vul je bedrijfsgegevens aan' : 'Complete your business details')}
          </h2>
          <p className="text-white/60 text-sm">
            {a
              ? (nl ? 'Controleer de AI-analyse en pas aan waar nodig.' : 'Review the AI analysis and adjust where needed.')
              : (nl ? 'Vul de onderstaande velden handmatig in.' : 'Fill in the fields below manually.')}
          </p>
        </div>

        {/* Extended brand card */}
        {a && <ExtendedBrandPreviewCard data={a} scanScores={onboardingData.scanScores} />}

        {/* Products */}
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Star className="w-4 h-4 text-blue-400" />
              {nl ? 'Producten / Diensten' : 'Products / Services'}
            </h3>
            <Button size="sm" variant="ghost" onClick={addProduct} className="text-white/60 hover:text-white text-xs">
              <Plus className="w-3 h-3 mr-1" /> {nl ? 'Toevoegen' : 'Add'}
            </Button>
          </div>
          {hasProducts ? (
            <div className="grid gap-3 md:grid-cols-2">
              {onboardingData.products.map((p, i) => (
                <div key={i} className="space-y-2">
                  <ProductPreviewCard data={p} />
                  {/* Inline edit fields */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <Input
                      value={p.name}
                      onChange={(e) => updateProduct(i, { name: e.target.value })}
                      placeholder={nl ? 'Naam' : 'Name'}
                      className="text-xs bg-white/5 border-white/10 text-white h-8"
                    />
                    <Input
                      value={p.usp}
                      onChange={(e) => updateProduct(i, { usp: e.target.value })}
                      placeholder="USP"
                      className="text-xs bg-white/5 border-white/10 text-white h-8"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/40">
              {nl ? 'Geen producten gevonden. Voeg ze handmatig toe.' : 'No products found. Add them manually.'}
            </p>
          )}
        </div>

        {/* Audiences */}
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              {nl ? 'Doelgroepen' : 'Target Audiences'}
            </h3>
            <Button size="sm" variant="ghost" onClick={addAudience} className="text-white/60 hover:text-white text-xs">
              <Plus className="w-3 h-3 mr-1" /> {nl ? 'Toevoegen' : 'Add'}
            </Button>
          </div>
          {hasAudiences ? (
            <div className="grid gap-3 md:grid-cols-2">
              {onboardingData.audiences.map((a, i) => (
                <div key={i} className="space-y-2">
                  <AudiencePreviewCard data={a} />
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="flex gap-1">
                      {(['B2B', 'B2C', 'Both'] as const).map(t => (
                        <Badge
                          key={t}
                          variant={a.audienceType === t ? 'default' : 'outline'}
                          className="cursor-pointer text-[10px]"
                          onClick={() => updateAudience(i, { audienceType: t })}
                        >
                          {t}
                        </Badge>
                      ))}
                    </div>
                    <Input
                      value={a.occupation}
                      onChange={(e) => updateAudience(i, { occupation: e.target.value })}
                      placeholder={nl ? 'Functie' : 'Role'}
                      className="text-xs bg-white/5 border-white/10 text-white h-8"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/40">
              {nl ? 'Geen doelgroep gevonden. Voeg er een toe.' : 'No audience found. Add one.'}
            </p>
          )}
        </div>

        {/* Messaging */}
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white">
            {nl ? 'Toon & Messaging (optioneel)' : 'Tone & Messaging (optional)'}
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/60 mb-1 block">{nl ? 'Wel doen' : 'Dos'}</label>
              <Textarea
                value={onboardingData.messagingDos}
                onChange={(e) => updateOnboardingData({ messagingDos: e.target.value })}
                placeholder={nl ? 'Bijv. empathisch, data-driven, actiegericht' : 'e.g. empathetic, data-driven, action-oriented'}
                className="text-xs bg-white/5 border-white/10 text-white min-h-[60px]"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1 block">{nl ? 'Niet doen' : "Don'ts"}</label>
              <Textarea
                value={onboardingData.messagingDonts}
                onChange={(e) => updateOnboardingData({ messagingDonts: e.target.value })}
                placeholder={nl ? 'Bijv. geen jargon, niet te formeel' : 'e.g. no jargon, not too formal'}
                className="text-xs bg-white/5 border-white/10 text-white min-h-[60px]"
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={prevOnboardingStep} className="text-white/60 hover:text-white">
            <ChevronLeft className="w-4 h-4 mr-1" /> {nl ? 'Terug' : 'Back'}
          </Button>
          <Button
            onClick={nextOnboardingStep}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            {nl ? 'Doorgaan naar Strategie' : 'Continue to Strategy'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Phase 3: Strategy — goals, competitors, personas, templates
  function renderOnboardingStrategy() {
    const obGoals = onboardingData.marketingGoals || [];
    const obChannels = onboardingData.selectedChannels || [];

    const toggleGoal = (goal: string) => {
      const current = [...obGoals];
      updateOnboardingData({
        marketingGoals: current.includes(goal) ? current.filter(g => g !== goal) : [...current, goal],
      });
    };

    const toggleChannel = (ch: string) => {
      const current = [...obChannels];
      updateOnboardingData({
        selectedChannels: current.includes(ch) ? current.filter(c => c !== ch) : [...current, ch],
      });
    };

    const handleGenerateAll = async () => {
      if (obGoals.length === 0) {
        setError(nl ? 'Selecteer minimaal 1 doel.' : 'Select at least 1 goal.');
        return;
      }
      setLoading(true);
      setError(null);
      const brandName = onboardingData.companyName;
      const industry = onboardingData.analysis?.industry || '';
      const audiences = onboardingData.analysis?.target_audiences || [];
      const tone = onboardingData.tone || 'professional';

      try {
        // 1. Strategy
        const strategyResult = await setupAgentService.generateStrategy(obGoals, industry, brandName, lang);
        updateOnboardingData({ strategyResult });
        await setupAgentService.saveObjectives(strategyResult);

        // 2. Competitors (if any)
        const comps = onboardingData.competitors.filter(c => c.name?.trim());
        if (comps.length > 0) {
          const compResult = await setupAgentService.analyzeCompetitors(comps, industry, brandName, lang);
          await setupAgentService.saveCompetitors(compResult.competitors);
        }

        // 3. Personas + scoring
        const personaResult = await setupAgentService.generatePersonas(industry, brandName, audiences, obGoals, lang);
        const scoringResult = await setupAgentService.generateScoringModel(industry, obGoals.join(', '), personaResult.personas, lang);
        updateOnboardingData({ personaResult, scoringResult });
        await setupAgentService.savePersonas(personaResult.personas);
        await setupAgentService.saveScoringModel(scoringResult);

        // 4. Integrations (if channels selected)
        if (obChannels.length > 0) {
          const integrationResult = await setupAgentService.suggestIntegrations(obChannels, industry, obGoals.join(', '), lang);
          updateOnboardingData({ integrationResult });
          await setupAgentService.saveIntegrations(integrationResult.integrations);
        }

        // 5. Templates
        const templateResult = await setupAgentService.suggestTemplates(industry, obChannels.length ? obChannels : ['Email', 'Blog', 'LinkedIn'], obGoals.join(', '), tone, brandName, lang);
        updateOnboardingData({ templateResult });
        await setupAgentService.saveTemplates(templateResult.templates, brandName);

        nextOnboardingStep();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">
            {nl ? 'Marketing Strategie' : 'Marketing Strategy'}
          </h2>
          <p className="text-white/60 text-sm">
            {nl
              ? 'Selecteer je doelen en kanalen. AI genereert je volledige strategie, personas en templates.'
              : "Select your goals and channels. AI will generate your complete strategy, personas and templates."}
          </p>
        </div>

        {/* Goals */}
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-orange-400" />
            {nl ? 'Marketing Doelen' : 'Marketing Goals'} *
          </h3>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((goal) => (
              <Badge
                key={goal}
                variant={obGoals.includes(goal) ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer text-xs transition-all py-1.5 px-3',
                  obGoals.includes(goal)
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'text-white/60 border-white/20 hover:border-white/40',
                )}
                onClick={() => toggleGoal(goal)}
              >
                {goal}
              </Badge>
            ))}
          </div>
        </div>

        {/* Channels */}
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            {nl ? 'Kanalen (optioneel)' : 'Channels (optional)'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map((ch) => (
              <Badge
                key={ch}
                variant={obChannels.includes(ch) ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer text-xs transition-all py-1.5 px-3',
                  obChannels.includes(ch)
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'text-white/60 border-white/20 hover:border-white/40',
                )}
                onClick={() => toggleChannel(ch)}
              >
                {ch}
              </Badge>
            ))}
          </div>
        </div>

        {/* Competitors */}
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-red-400" />
            {nl ? 'Concurrenten' : 'Competitors'}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {(onboardingData.competitors || []).map((c, i) => (
              <Badge key={i} className="text-xs gap-1 bg-white/10 text-white">
                {c.name}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => {
                    const updated = [...onboardingData.competitors];
                    updated.splice(i, 1);
                    updateOnboardingData({ competitors: updated });
                  }}
                />
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              placeholder={nl ? '+ Voeg concurrent toe...' : '+ Add competitor...'}
              className="text-xs bg-white/5 border-white/10 text-white h-9"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCompetitor.trim()) {
                  updateOnboardingData({
                    competitors: [...(onboardingData.competitors || []), { name: newCompetitor.trim() }],
                  });
                  setNewCompetitor('');
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              className="border-white/20 text-white/60 hover:text-white"
              onClick={() => {
                if (newCompetitor.trim()) {
                  updateOnboardingData({
                    competitors: [...(onboardingData.competitors || []), { name: newCompetitor.trim() }],
                  });
                  setNewCompetitor('');
                }
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={prevOnboardingStep} className="text-white/60 hover:text-white">
            <ChevronLeft className="w-4 h-4 mr-1" /> {nl ? 'Terug' : 'Back'}
          </Button>
          <Button
            onClick={handleGenerateAll}
            disabled={isLoading || obGoals.length === 0}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                {nl ? 'AI genereert strategie...' : 'AI is generating strategy...'}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {nl ? 'Genereer Alles' : 'Generate Everything'}
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Phase 4: Summary — overview + save + redirect
  function renderOnboardingSummary() {
    const a = onboardingData.analysis;

    const handleFinalize = async () => {
      setObSaving(true);
      setError(null);
      try {
        // Save everything to auth + brand_memory + brand_kits
        await setupAgentService.saveOnboardingComplete(onboardingData);

        // Also save brand data if we have analysis
        if (a) {
          await setupAgentService.saveBrandData(a);
        }

        setShowConfetti(true);
        toast({ title: nl ? 'Setup voltooid! Welkom bij Inclufy Marketing.' : 'Setup complete! Welcome to Inclufy Marketing.' });
        setTimeout(() => {
          setShowConfetti(false);
          onOnboardingComplete?.();
        }, 2000);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setObSaving(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          {showConfetti ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="space-y-3">
              <PartyPopper className="w-16 h-16 text-yellow-500 mx-auto" />
              <h2 className="text-2xl font-bold text-white">
                {nl ? 'Setup Voltooid!' : 'Setup Complete!'}
              </h2>
              <p className="text-white/60">{nl ? 'Je wordt doorgestuurd naar je dashboard...' : 'Redirecting to your dashboard...'}</p>
            </motion.div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white">
                {nl ? 'Samenvatting' : 'Summary'}
              </h2>
              <p className="text-white/60 text-sm">
                {nl
                  ? 'Alles ziet er goed uit! Klik op de knop om je platform te activeren.'
                  : 'Everything looks good! Click the button to activate your platform.'}
              </p>
            </>
          )}
        </div>

        {!showConfetti && (
          <>
            <OnboardingSummaryCard
              brandName={onboardingData.companyName}
              industry={a?.industry || ''}
              primaryColor={a?.primary_color || '#7c3aed'}
              secondaryColor={a?.secondary_color || '#ec4899'}
              productsCount={onboardingData.products?.length || 0}
              audiencesCount={onboardingData.audiences?.length || 0}
              competitorsCount={onboardingData.competitors?.length || 0}
              personasCount={onboardingData.personaResult?.personas?.length || 0}
              objectivesCount={onboardingData.strategyResult?.objectives?.length || 0}
              templatesCount={onboardingData.templateResult?.templates?.length || 0}
              integrationsCount={onboardingData.integrationResult?.integrations?.length || 0}
            />

            {/* Strategy objectives preview */}
            {onboardingData.strategyResult?.objectives && (
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-semibold text-white">{nl ? 'Strategische Doelen' : 'Strategic Objectives'}</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {onboardingData.strategyResult.objectives.slice(0, 4).map((o, i) => (
                    <StrategyPreviewCard key={i} data={o} />
                  ))}
                </div>
              </div>
            )}

            {/* Personas preview */}
            {onboardingData.personaResult?.personas && (
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <h3 className="text-sm font-semibold text-white">{nl ? "Persona's" : 'Personas'}</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {onboardingData.personaResult.personas.map((p, i) => (
                    <PersonaPreviewCard key={i} data={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={prevOnboardingStep} className="text-white/60 hover:text-white">
                <ChevronLeft className="w-4 h-4 mr-1" /> {nl ? 'Terug' : 'Back'}
              </Button>
              <Button
                onClick={handleFinalize}
                disabled={obSaving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 h-12 text-base font-semibold"
              >
                {obSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {nl ? 'Opslaan...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5 mr-2" />
                    {nl ? 'Start AI Marketing' : 'Start AI Marketing'}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SIDEBAR RENDER
  // ═══════════════════════════════════════════════════════════════

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
          <span>&middot;</span>
          <span>{stepConfig ? (nl ? stepConfig.labelNl : stepConfig.labelEn) : ''}</span>
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
              onClick={() => {}}
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
