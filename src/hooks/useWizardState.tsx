// src/hooks/useWizardState.ts
// ──────────────────────────────────────────────────────────────────────────
// Shared state for the CaptureWizard (5-step capture → publish flow).
//
// State sections:
//   - capture: { sourceType, mediaUri, mediaType, eventId? }
//   - edit:    { overlayText, overlayLogo, watermarkPosition, watermarkSize, brandedImageUrl }
//   - channels: { selectedAccountIds: Set<string>, applyToAll: boolean }
//   - perChannel: { textVariants: Record<channel, string>, sizeVariants: Record<channel, {w,h}> }
//   - confirm: { isPublishing, results: Record<channel, 'pending'|'ok'|'error'> }
//
// React Context exposes a single useWizardState() hook for all 5 step components.
// Step navigation (next/prev/goto/exit) is also here so the wrapper stays thin.
// ──────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

export type WizardStep = 1 | 2 | 3 | 4 | 5;

export type SourceType = 'camera' | 'library' | 'video' | 'ai' | 'event';

export interface WizardSelectedAccount {
  id: string;
  platform: string;
  accountName: string;
  accountType?: string;
  profileImageUrl?: string;
}

export interface WizardCapture {
  sourceType: SourceType | null;
  mediaUri: string | null;       // local URI or remote URL
  mediaType: 'photo' | 'video' | null;
  eventId?: string | null;
  postId?: string | null;        // created server-side after step 1 → step 2
}

export type LogoCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface WizardEdit {
  overlayText: string;
  overlayTextPosition: 'top' | 'bottom';
  /** @deprecated kept for back-compat — use showBrandLogo / showEventLogo */
  showLogo: boolean;
  /** @deprecated use per-logo toggles + positions */
  logoType: 'brand' | 'event' | 'both';
  /** @deprecated use brandLogoPosition / eventLogoPosition */
  logoPosition: LogoCorner;
  /** 307+: independent toggles + corners per logo so brand + event can co-exist */
  showBrandLogo: boolean;
  brandLogoPosition: LogoCorner;
  showEventLogo: boolean;
  eventLogoPosition: LogoCorner;
  /** 309+: pick a specific brand kit (null = default kit) */
  selectedBrandKitId: string | null;
  /** 309+: one-off custom logo URL uploaded for this post (overrides brand kit logo) */
  customLogoUri: string | null;
  /** Set by Step2 after bakeOverlayIntoImage succeeds — propagates to Step5 preview. */
  brandedImageUrl: string | null;
  /** Optimistic preview URI (local, pre-upload). Step5 falls back to this if brandedImageUrl is null. */
  livePreviewUri: string | null;
}

export interface WizardChannels {
  selectedAccountIds: Set<string>;
  availableAccounts: WizardSelectedAccount[];
  applyToAll: boolean;
}

export interface WizardPerChannel {
  textVariants: Record<string, string>;
  /** future: per-channel image sizing (1080×1080 vs 1200×627 etc.) */
}

export type PublishStatus = 'pending' | 'in_flight' | 'ok' | 'error';
export interface WizardConfirm {
  isPublishing: boolean;
  results: Record<string, PublishStatus>;
  errors: Record<string, string>;
}

export interface WizardState {
  step: WizardStep;
  capture: WizardCapture;
  edit: WizardEdit;
  channels: WizardChannels;
  perChannel: WizardPerChannel;
  confirm: WizardConfirm;
}

const defaultState: WizardState = {
  step: 1,
  capture: { sourceType: null, mediaUri: null, mediaType: null },
  edit: {
    overlayText: '',
    overlayTextPosition: 'bottom',
    showLogo: false,
    logoType: 'brand',
    logoPosition: 'bottom-right',
    showBrandLogo: false,
    brandLogoPosition: 'top-left',
    showEventLogo: false,
    eventLogoPosition: 'bottom-right',
    selectedBrandKitId: null,
    customLogoUri: null,
    brandedImageUrl: null,
    livePreviewUri: null,
  },
  channels: {
    selectedAccountIds: new Set(),
    availableAccounts: [],
    applyToAll: true,
  },
  perChannel: { textVariants: {} },
  confirm: { isPublishing: false, results: {}, errors: {} },
};

interface WizardCtx extends WizardState {
  setStep: (s: WizardStep) => void;
  next: () => void;
  prev: () => void;
  exit: () => void;
  setCapture: (patch: Partial<WizardCapture>) => void;
  setEdit: (patch: Partial<WizardEdit>) => void;
  setChannels: (patch: Partial<WizardChannels>) => void;
  setPerChannel: (patch: Partial<WizardPerChannel>) => void;
  setConfirm: (patch: Partial<WizardConfirm>) => void;
  toggleAccount: (id: string) => void;
  reset: () => void;
}

const Ctx = createContext<WizardCtx | null>(null);

export function WizardProvider({
  children,
  onExit,
}: React.PropsWithChildren<{ onExit: () => void }>) {
  const [state, setState] = useState<WizardState>(defaultState);

  const setStep    = useCallback((s: WizardStep) => setState(p => ({ ...p, step: s })), []);
  const next       = useCallback(() => setState(p => p.step < 5 ? { ...p, step: (p.step + 1) as WizardStep } : p), []);
  const prev       = useCallback(() => setState(p => p.step > 1 ? { ...p, step: (p.step - 1) as WizardStep } : p), []);
  const reset      = useCallback(() => setState(defaultState), []);
  const setCapture = useCallback((patch: Partial<WizardCapture>) =>
    setState(p => ({ ...p, capture: { ...p.capture, ...patch } })), []);
  const setEdit    = useCallback((patch: Partial<WizardEdit>) =>
    setState(p => ({ ...p, edit: { ...p.edit, ...patch } })), []);
  const setChannels = useCallback((patch: Partial<WizardChannels>) =>
    setState(p => ({ ...p, channels: { ...p.channels, ...patch } })), []);
  const setPerChannel = useCallback((patch: Partial<WizardPerChannel>) =>
    setState(p => ({ ...p, perChannel: { ...p.perChannel, ...patch } })), []);
  const setConfirm = useCallback((patch: Partial<WizardConfirm>) =>
    setState(p => ({ ...p, confirm: { ...p.confirm, ...patch } })), []);
  const toggleAccount = useCallback((id: string) =>
    setState(p => {
      const s = new Set(p.channels.selectedAccountIds);
      if (s.has(id)) s.delete(id); else s.add(id);
      return { ...p, channels: { ...p.channels, selectedAccountIds: s, applyToAll: false } };
    }), []);

  const value = useMemo<WizardCtx>(() => ({
    ...state,
    setStep, next, prev,
    exit: () => { reset(); onExit(); },
    setCapture, setEdit, setChannels, setPerChannel, setConfirm,
    toggleAccount, reset,
  }), [state, setStep, next, prev, setCapture, setEdit, setChannels, setPerChannel, setConfirm, toggleAccount, reset, onExit]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWizardState(): WizardCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWizardState must be called inside <WizardProvider>');
  return ctx;
}
