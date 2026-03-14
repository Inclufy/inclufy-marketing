// src/contexts/SetupAgentContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { setupAgentService } from '@/services/setup-agent/setup-agent.service';
import type {
  SetupStep,
  OnboardingStep,
  OnboardingData,
  ProductInfo,
  AudienceDetailed,
} from '@/services/setup-agent/types';
import { ONBOARDING_STEPS } from '@/services/setup-agent/types';

export type SetupMode = 'sidebar' | 'onboarding';

interface SetupAgentContextValue {
  // Mode
  mode: SetupMode;

  // Sidebar mode state
  isActive: boolean;
  currentStep: number;
  completedSteps: SetupStep[];
  stepData: Record<string, any>;
  isLoading: boolean;
  error: string | null;

  // Onboarding mode state
  onboardingStep: number;
  onboardingData: OnboardingData;
  updateOnboardingData: (patch: Partial<OnboardingData>) => void;
  setOnboardingStep: (step: number) => void;
  nextOnboardingStep: () => void;
  prevOnboardingStep: () => void;

  // Shared actions
  startSetup: () => void;
  exitSetup: () => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipStep: () => void;
  setStepData: (step: SetupStep, data: any) => void;
  markStepComplete: (step: SetupStep) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetSetup: () => void;
}

const INITIAL_ONBOARDING_DATA: OnboardingData = {
  companyName: '',
  website: '',
  country: 'Nederland',
  language: 'nl',
  analysis: null,
  scanScores: null,
  products: [],
  audiences: [],
  brandValues: [],
  mission: '',
  messagingDos: '',
  messagingDonts: '',
  tone: '',
  marketingGoals: [],
  competitors: [],
  selectedChannels: [],
  strategyResult: null,
  personaResult: null,
  scoringResult: null,
  integrationResult: null,
  templateResult: null,
  socialAccounts: [],
};

const SetupAgentCtx = createContext<SetupAgentContextValue>({
  mode: 'sidebar',
  isActive: false,
  currentStep: 0,
  completedSteps: [],
  stepData: {},
  isLoading: false,
  error: null,
  onboardingStep: 0,
  onboardingData: INITIAL_ONBOARDING_DATA,
  updateOnboardingData: () => {},
  setOnboardingStep: () => {},
  nextOnboardingStep: () => {},
  prevOnboardingStep: () => {},
  startSetup: () => {},
  exitSetup: () => {},
  goToStep: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipStep: () => {},
  setStepData: () => {},
  markStepComplete: () => {},
  setLoading: () => {},
  setError: () => {},
  resetSetup: () => {},
});

const STEPS: SetupStep[] = ['website', 'competitors', 'goals', 'channels', 'personas', 'templates'];

export function SetupAgentProvider({
  children,
  mode = 'sidebar',
}: {
  children: React.ReactNode;
  mode?: SetupMode;
}) {
  // Sidebar mode state
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<SetupStep[]>([]);
  const [stepData, setStepDataState] = useState<Record<string, any>>({});
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding mode state
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);

  // Restore progress on mount (sidebar only)
  useEffect(() => {
    if (mode === 'sidebar') {
      const saved = setupAgentService.getProgress();
      if (saved) {
        setCurrentStep(saved.currentStep);
        setCompletedSteps(saved.completedSteps);
        setStepDataState(saved.stepData);
      }
    }
  }, [mode]);

  // Save progress on changes (sidebar only)
  useEffect(() => {
    if (mode === 'sidebar' && (isActive || completedSteps.length > 0)) {
      setupAgentService.saveProgress({
        currentStep,
        completedSteps,
        stepData,
        startedAt: setupAgentService.getProgress()?.startedAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });
    }
  }, [currentStep, completedSteps, stepData, isActive, mode]);

  // ─── Onboarding actions ─────────────────────────────────────────
  const updateOnboardingData = useCallback((patch: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...patch }));
  }, []);

  const nextOnboardingStep = useCallback(() => {
    setOnboardingStep((prev) => Math.min(prev + 1, ONBOARDING_STEPS.length - 1));
    setError(null);
  }, []);

  const prevOnboardingStep = useCallback(() => {
    setOnboardingStep((prev) => Math.max(prev - 1, 0));
    setError(null);
  }, []);

  // ─── Sidebar actions ────────────────────────────────────────────
  const startSetup = useCallback(() => {
    setIsActive(true);
    const saved = setupAgentService.getProgress();
    if (saved && saved.completedSteps.length > 0) {
      setCurrentStep(saved.currentStep);
      setCompletedSteps(saved.completedSteps);
      setStepDataState(saved.stepData);
    }
  }, []);

  const exitSetup = useCallback(() => {
    setIsActive(false);
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < STEPS.length) {
      setCurrentStep(step);
      setError(null);
    }
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    setError(null);
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setError(null);
  }, []);

  const skipStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    setError(null);
  }, []);

  const setStepData = useCallback((step: SetupStep, data: any) => {
    setStepDataState((prev) => ({ ...prev, [step]: data }));
  }, []);

  const markStepComplete = useCallback((step: SetupStep) => {
    setCompletedSteps((prev) => prev.includes(step) ? prev : [...prev, step]);
  }, []);

  const resetSetup = useCallback(() => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setStepDataState({});
    setError(null);
    setOnboardingStep(0);
    setOnboardingData(INITIAL_ONBOARDING_DATA);
    setupAgentService.clearProgress();
  }, []);

  return (
    <SetupAgentCtx.Provider
      value={{
        mode,
        isActive,
        currentStep,
        completedSteps,
        stepData,
        isLoading,
        error,
        onboardingStep,
        onboardingData,
        updateOnboardingData,
        setOnboardingStep,
        nextOnboardingStep,
        prevOnboardingStep,
        startSetup,
        exitSetup,
        goToStep,
        nextStep,
        prevStep,
        skipStep,
        setStepData,
        markStepComplete,
        setLoading,
        setError,
        resetSetup,
      }}
    >
      {children}
    </SetupAgentCtx.Provider>
  );
}

export const useSetupAgent = () => useContext(SetupAgentCtx);
