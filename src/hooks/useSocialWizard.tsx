/**
 * useSocialWizard — state machine voor de Social Media Wizard
 *
 * Stappen:
 *   goal       → welke kanalen wil gebruiker?
 *   status     → status check per geselecteerd platform
 *   connect    → per-platform connect/disconnect
 *   verify     → toon ontdekte accounts na connect
 *   brandVoice → optionele AI-analyse van merkstem
 *   firstPost  → CTA naar LiveCapture
 *
 * Functies:
 *   - currentStep tracking
 *   - selected platforms (multi-select uit goal step)
 *   - per-platform connection status
 *   - AI calls (recommend, scope-explain, prerequisite, troubleshoot)
 *   - brandVoice profile state
 *   - error handling
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

export type WizardStep =
  | 'goal'
  | 'status'
  | 'connect'
  | 'verify'
  | 'brandVoice'
  | 'firstPost'
  | 'done';

export type PlatformKey =
  | 'facebook'
  | 'instagram'
  | 'linkedin'
  | 'tiktok'
  | 'snapchat'
  | 'pinterest'
  | 'threads'
  | 'whatsapp';

export type ConnectionStatus =
  | 'pending'      // initial / not started
  | 'connecting'   // OAuth in progress
  | 'connected'    // OAuth complete + verified
  | 'failed'       // OAuth or verification failed
  | 'skipped'      // user chose to skip
  | 'unsupported'; // platform not yet supported (snapchat)

export type BrandVoiceProfile = {
  id: string;
  tone: string;
  avg_post_length: number;
  common_hashtags: string[];
  post_structure: string;
  emoji_usage: string;
  voice_descriptors: string[];
  primary_language: string;
  posts_analyzed: number;
};

const ALL_STEPS: WizardStep[] = ['goal', 'status', 'connect', 'verify', 'brandVoice', 'firstPost', 'done'];

const STEP_PROGRESS: Record<WizardStep, number> = {
  goal: 0,
  status: 1,
  connect: 2,
  verify: 3,
  brandVoice: 4,
  firstPost: 5,
  done: 6,
};

// ─── Hook ───────────────────────────────────────────────────────────
export function useSocialWizard(initialStep: WizardStep = 'goal') {
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformKey[]>([]);
  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, ConnectionStatus>>({});
  const [brandVoiceProfile, setBrandVoiceProfile] = useState<BrandVoiceProfile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recommendedPlatforms, setRecommendedPlatforms] = useState<PlatformKey[]>([]);

  // Live social_accounts data
  const { data: socialAccounts = [], refetch: refetchAccounts } = useQuery({
    queryKey: ['wizard-social-accounts'],
    queryFn: async () => {
      const { data } = await supabase
        .from('social_accounts')
        .select('id, platform, account_name, platform_account_id, account_type, status, profile_image_url');
      return (data || []) as Array<{
        id: string;
        platform: string;
        account_name: string | null;
        platform_account_id: string | null;
        account_type: string;
        status: string;
        profile_image_url: string | null;
      }>;
    },
    staleTime: 5_000,
  });

  // ─── Step transitions ────────────────────────────────────────────
  const goNext = useCallback(() => {
    setStep((s) => {
      const idx = ALL_STEPS.indexOf(s);
      return idx < ALL_STEPS.length - 1 ? ALL_STEPS[idx + 1] : s;
    });
  }, []);

  const goBack = useCallback(() => {
    setStep((s) => {
      const idx = ALL_STEPS.indexOf(s);
      return idx > 0 ? ALL_STEPS[idx - 1] : s;
    });
  }, []);

  const goTo = useCallback((target: WizardStep) => setStep(target), []);

  // ─── Platform selection ──────────────────────────────────────────
  const togglePlatform = useCallback((p: PlatformKey) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }, []);

  // ─── Connection status updates ───────────────────────────────────
  const setPlatformStatus = useCallback((p: PlatformKey, status: ConnectionStatus) => {
    setConnectionStatuses((prev) => ({ ...prev, [p]: status }));
  }, []);

  // ─── AI: onboarding recommend ────────────────────────────────────
  const fetchRecommendations = useCallback(async (industry: string, audience: string, language = 'nl') => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-connection-helper', {
        body: { mode: 'onboarding-recommend', industry, audience, language },
      });
      if (error) throw error;
      const rec = (data?.recommended ?? []) as PlatformKey[];
      setRecommendedPlatforms(rec);
      // Auto-select recommended platforms
      setSelectedPlatforms(rec);
      return { recommended: rec, reason: data?.reason ?? '' };
    } catch (err) {
      console.warn('[wizard] onboarding-recommend failed:', err);
      // Fallback: select all supported
      const fallback: PlatformKey[] = ['linkedin', 'instagram', 'facebook'];
      setRecommendedPlatforms(fallback);
      setSelectedPlatforms(fallback);
      return { recommended: fallback, reason: '' };
    }
  }, []);

  // ─── AI: scope-explain ───────────────────────────────────────────
  const fetchScopeExplain = useCallback(async (platform: PlatformKey, scope: string, language = 'nl'): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-connection-helper', {
        body: { mode: 'scope-explain', platform, scope, language },
      });
      if (error) throw error;
      return data?.explanation ?? '';
    } catch (err) {
      console.warn('[wizard] scope-explain failed:', err);
      return 'Uitleg tijdelijk niet beschikbaar.';
    }
  }, []);

  // ─── AI: prerequisite-explain ────────────────────────────────────
  const fetchPrerequisiteExplain = useCallback(async (platform: PlatformKey, language = 'nl'): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-connection-helper', {
        body: { mode: 'prerequisite-explain', platform, language },
      });
      if (error) throw error;
      return data?.explanation ?? '';
    } catch (err) {
      console.warn('[wizard] prerequisite-explain failed:', err);
      return '';
    }
  }, []);

  // ─── AI: error-troubleshoot ──────────────────────────────────────
  const fetchErrorTroubleshoot = useCallback(async (platform: PlatformKey, errMsg: string, language = 'nl'): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-connection-helper', {
        body: { mode: 'error-troubleshoot', platform, errorMessage: errMsg, language },
      });
      if (error) throw error;
      return data?.explanation ?? '';
    } catch (err) {
      console.warn('[wizard] error-troubleshoot failed:', err);
      return errMsg; // fallback to raw error
    }
  }, []);

  // ─── AI: brand voice analyze ─────────────────────────────────────
  const analyzeBrandVoice = useCallback(async (socialAccountId: string): Promise<BrandVoiceProfile | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-brand-voice-analyzer', {
        body: { social_account_id: socialAccountId },
      });
      if (error) throw error;
      const profile = data?.profile as BrandVoiceProfile;
      if (profile) setBrandVoiceProfile(profile);
      return profile ?? null;
    } catch (err) {
      console.warn('[wizard] brand-voice-analyze failed:', err);
      setErrorMessage((err as Error).message);
      return null;
    }
  }, []);

  // ─── Reset ────────────────────────────────────────────────────────
  const reset = useCallback(() => {
    setStep('goal');
    setSelectedPlatforms([]);
    setConnectionStatuses({});
    setBrandVoiceProfile(null);
    setErrorMessage(null);
    setRecommendedPlatforms([]);
  }, []);

  // ─── Derived state ────────────────────────────────────────────────
  const progressPercent = useMemo(() => {
    return Math.round((STEP_PROGRESS[step] / (ALL_STEPS.length - 1)) * 100);
  }, [step]);

  const stepNumber = STEP_PROGRESS[step];

  const allConnectsAttempted = useMemo(() => {
    if (selectedPlatforms.length === 0) return false;
    return selectedPlatforms.every((p) =>
      ['connected', 'failed', 'skipped'].includes(connectionStatuses[p] ?? 'pending'),
    );
  }, [selectedPlatforms, connectionStatuses]);

  return {
    // state
    step,
    selectedPlatforms,
    connectionStatuses,
    brandVoiceProfile,
    errorMessage,
    recommendedPlatforms,
    socialAccounts,
    progressPercent,
    stepNumber,
    allConnectsAttempted,

    // actions
    goNext,
    goBack,
    goTo,
    togglePlatform,
    setPlatformStatus,
    setErrorMessage,
    refetchAccounts,
    reset,

    // AI
    fetchRecommendations,
    fetchScopeExplain,
    fetchPrerequisiteExplain,
    fetchErrorTroubleshoot,
    analyzeBrandVoice,
  };
}
