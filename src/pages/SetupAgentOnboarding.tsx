// src/pages/SetupAgentOnboarding.tsx
// Full-page AI-driven onboarding — replaces the old 10-step form wizard
// Mounts SetupAgent in 'onboarding' mode with providers

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SetupAgentProvider } from '@/contexts/SetupAgentContext';
import SetupAgent from '@/components/SetupAgent';
import { useToast } from '@/components/ui/use-toast';

export default function SetupAgentOnboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleComplete = () => {
    toast({ title: 'Setup voltooid! Welkom bij Inclufy Marketing.' });
    navigate('/app/dashboard', { replace: true });
  };

  return (
    <SetupAgentProvider mode="onboarding">
      <SetupAgent
        isOpen={true}
        onClose={() => {}} // no-op in onboarding mode (can't close)
        onExit={() => {}}
        mode="onboarding"
        onOnboardingComplete={handleComplete}
      />
    </SetupAgentProvider>
  );
}
