// src/contexts/CopilotContext.tsx
// Context to allow any child component to open the AI Copilot with pre-loaded context

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface CopilotInitialContext {
  systemPrompt: string;
  firstMessage?: string;
}

interface CopilotContextValue {
  isOpen: boolean;
  initialContext: CopilotInitialContext | null;
  setupMode: boolean;
  openCopilot: () => void;
  openCopilotWithContext: (ctx: CopilotInitialContext) => void;
  closeCopilot: () => void;
  clearInitialContext: () => void;
  enterSetupMode: () => void;
  exitSetupMode: () => void;
}

const CopilotCtx = createContext<CopilotContextValue>({
  isOpen: false,
  initialContext: null,
  setupMode: false,
  openCopilot: () => {},
  openCopilotWithContext: () => {},
  closeCopilot: () => {},
  clearInitialContext: () => {},
  enterSetupMode: () => {},
  exitSetupMode: () => {},
});

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialContext, setInitialContext] = useState<CopilotInitialContext | null>(null);
  const [setupMode, setSetupMode] = useState(false);

  const openCopilot = useCallback(() => {
    setInitialContext(null);
    setIsOpen(true);
  }, []);

  const openCopilotWithContext = useCallback((ctx: CopilotInitialContext) => {
    setInitialContext(ctx);
    setIsOpen(true);
  }, []);

  const closeCopilot = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearInitialContext = useCallback(() => {
    setInitialContext(null);
  }, []);

  const enterSetupMode = useCallback(() => {
    setSetupMode(true);
    setIsOpen(true);
  }, []);

  const exitSetupMode = useCallback(() => {
    setSetupMode(false);
  }, []);

  return (
    <CopilotCtx.Provider
      value={{ isOpen, initialContext, setupMode, openCopilot, openCopilotWithContext, closeCopilot, clearInitialContext, enterSetupMode, exitSetupMode }}
    >
      {children}
    </CopilotCtx.Provider>
  );
}

export const useCopilot = () => useContext(CopilotCtx);
