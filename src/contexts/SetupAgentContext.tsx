// src/contexts/SetupAgentContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { setupAgentService } from '@/services/setup-agent/setup-agent.service';
import type { SetupStep, SetupProgress, SETUP_STEPS } from '@/services/setup-agent/types';

interface SetupAgentContextValue {
  isActive: boolean;
  currentStep: number;
  completedSteps: SetupStep[];
  stepData: Record<string, any>;
  isLoading: boolean;
  error: string | null;

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

const SetupAgentCtx = createContext<SetupAgentContextValue>({
  isActive: false,
  currentStep: 0,
  completedSteps: [],
  stepData: {},
  isLoading: false,
  error: null,
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

export function SetupAgentProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<SetupStep[]>([]);
  const [stepData, setStepDataState] = useState<Record<string, any>>({});
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore progress on mount
  useEffect(() => {
    const saved = setupAgentService.getProgress();
    if (saved) {
      setCurrentStep(saved.currentStep);
      setCompletedSteps(saved.completedSteps);
      setStepDataState(saved.stepData);
    }
  }, []);

  // Save progress on changes
  useEffect(() => {
    if (isActive || completedSteps.length > 0) {
      setupAgentService.saveProgress({
        currentStep,
        completedSteps,
        stepData,
        startedAt: setupAgentService.getProgress()?.startedAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });
    }
  }, [currentStep, completedSteps, stepData, isActive]);

  const startSetup = useCallback(() => {
    setIsActive(true);
    // If we have saved progress, resume from there
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
    setupAgentService.clearProgress();
  }, []);

  return (
    <SetupAgentCtx.Provider
      value={{
        isActive,
        currentStep,
        completedSteps,
        stepData,
        isLoading,
        error,
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
