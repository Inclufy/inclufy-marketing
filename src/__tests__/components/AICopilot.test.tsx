import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Framer motion mock ────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, ...rest } = props;
      return <aside {...rest}>{children}</aside>;
    },
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ─── Supabase mock ─────────────────────────────────────────────────

let fnResponseData: any = { response: 'Dit is een AI antwoord.' };
let fnResponseError: any = null;

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockImplementation(() =>
        Promise.resolve({ data: fnResponseData, error: fnResponseError })
      ),
    },
  },
}));

// ─── Import after mocks ────────────────────────────────────────────

import AICopilot from '@/components/AICopilot';

// ─── JSDOM polyfills ──────────────────────────────────────────────

// scrollIntoView is not implemented in JSDOM
Element.prototype.scrollIntoView = vi.fn();

// ─── Tests ─────────────────────────────────────────────────────────

describe('AICopilot', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    initialContext: null,
    onContextConsumed: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fnResponseData = { response: 'Dit is een AI antwoord.' };
    fnResponseError = null;
  });

  // ── Rendering ─────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders AI Copilot heading', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('AI Copilot')).toBeInTheDocument();
    });

    it('renders Online status badge', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('Online')).toBeInTheDocument();
    });

    it('renders welcome message', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('Hallo! Ik ben uw AI Copilot')).toBeInTheDocument();
    });

    it('renders welcome description', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('Ik help u met marketing strategie, content & inzichten')).toBeInTheDocument();
    });

    it('renders input placeholder', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByPlaceholderText('Stel een vraag...')).toBeInTheDocument();
    });

    it('renders powered by text', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText(/Inclufy AI Copilot/)).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(<AICopilot {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('AI Copilot')).not.toBeInTheDocument();
    });
  });

  // ── Suggestions ───────────────────────────────────────────────

  describe('Suggestions', () => {
    it('renders Suggesties label', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('Suggesties')).toBeInTheDocument();
    });

    it('renders Campagne analyse suggestion', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('Campagne analyse')).toBeInTheDocument();
    });

    it('renders Content calendar suggestion', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('Content calendar')).toBeInTheDocument();
    });

    it('renders Groei tips suggestion', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('Groei tips')).toBeInTheDocument();
    });

    it('renders suggestion descriptions', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('Bekijk de prestaties van je actieve campagnes')).toBeInTheDocument();
      expect(screen.getByText('Plan je content voor de komende week')).toBeInTheDocument();
      expect(screen.getByText('Ontdek kansen om je bereik te vergroten')).toBeInTheDocument();
    });
  });

  // ── Quick actions ─────────────────────────────────────────────

  describe('Quick Actions', () => {
    it('renders Snelle Acties label', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('Snelle Acties')).toBeInTheDocument();
    });

    it('renders Campagne idee quick action', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('Campagne idee')).toBeInTheDocument();
    });

    it('renders E-mail schrijven quick action', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('E-mail schrijven')).toBeInTheDocument();
    });

    it('renders SEO tips quick action', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('SEO tips')).toBeInTheDocument();
    });

    it('renders Social post quick action', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('Social post')).toBeInTheDocument();
    });
  });

  // ── Input interaction ─────────────────────────────────────────

  describe('Input interaction', () => {
    it('updates input value on typing', () => {
      render(<AICopilot {...defaultProps} />);
      const input = screen.getByPlaceholderText('Stel een vraag...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Hoe kan ik meer leads krijgen?' } });
      expect(input.value).toBe('Hoe kan ik meer leads krijgen?');
    });

    it('disables send button when input is empty', () => {
      render(<AICopilot {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      const sendBtn = buttons.find(b => b.className.includes('from-purple-600'));
      expect(sendBtn).toBeDisabled();
    });

    it('enables send button when input has text', () => {
      render(<AICopilot {...defaultProps} />);
      const input = screen.getByPlaceholderText('Stel een vraag...');
      fireEvent.change(input, { target: { value: 'Test vraag' } });
      const buttons = screen.getAllByRole('button');
      const sendBtn = buttons.find(b => b.className.includes('from-purple-600'));
      expect(sendBtn).not.toBeDisabled();
    });
  });

  // ── Close button ──────────────────────────────────────────────

  describe('Close button', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<AICopilot {...defaultProps} onClose={onClose} />);
      const closeBtn = screen.getByTitle('Sluiten');
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // ── Message sending ───────────────────────────────────────────

  describe('Message sending', () => {
    it('clears input after sending message', async () => {
      render(<AICopilot {...defaultProps} />);
      const input = screen.getByPlaceholderText('Stel een vraag...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Test bericht' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('displays user message in chat', async () => {
      render(<AICopilot {...defaultProps} />);
      const input = screen.getByPlaceholderText('Stel een vraag...');
      fireEvent.change(input, { target: { value: 'Hallo AI' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByText('Hallo AI')).toBeInTheDocument();
      });
    });

    it('shows thinking indicator while loading', async () => {
      // Make the function invoke slow
      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.functions.invoke as any).mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({ data: fnResponseData, error: null }), 1000))
      );
      render(<AICopilot {...defaultProps} />);
      const input = screen.getByPlaceholderText('Stel een vraag...');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByText('Aan het nadenken...')).toBeInTheDocument();
      });
    });

    it('hides welcome state after first message', async () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.getByText('Hallo! Ik ben uw AI Copilot')).toBeInTheDocument();
      const input = screen.getByPlaceholderText('Stel een vraag...');
      fireEvent.change(input, { target: { value: 'Hallo' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.queryByText('Hallo! Ik ben uw AI Copilot')).not.toBeInTheDocument();
      });
    });
  });

  // ── Clear chat ────────────────────────────────────────────────

  describe('Clear chat', () => {
    it('does not show clear button when no messages', () => {
      render(<AICopilot {...defaultProps} />);
      expect(screen.queryByTitle('Chat wissen')).not.toBeInTheDocument();
    });

    it('shows clear button after sending a message', async () => {
      render(<AICopilot {...defaultProps} />);
      const input = screen.getByPlaceholderText('Stel een vraag...');
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByTitle('Chat wissen')).toBeInTheDocument();
      });
    });

    it('clears messages when clear button is clicked', async () => {
      render(<AICopilot {...defaultProps} />);
      const input = screen.getByPlaceholderText('Stel een vraag...');
      fireEvent.change(input, { target: { value: 'Hallo' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByText('Hallo')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTitle('Chat wissen'));
      await waitFor(() => {
        // Welcome state should reappear
        expect(screen.getByText('Hallo! Ik ben uw AI Copilot')).toBeInTheDocument();
      });
    });
  });

  // ── Error handling ────────────────────────────────────────────

  describe('Error handling', () => {
    it('shows fallback response on API error', async () => {
      fnResponseError = { message: 'API unavailable' };
      render(<AICopilot {...defaultProps} />);
      const input = screen.getByPlaceholderText('Stel een vraag...');
      fireEvent.change(input, { target: { value: 'Test error' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByText(/AI is tijdelijk niet beschikbaar/)).toBeInTheDocument();
      });
    });

    it('shows campaign fallback for campaign-related questions', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.functions.invoke as any).mockImplementationOnce(() => Promise.reject(new Error('fail')));
      render(<AICopilot {...defaultProps} />);
      const input = screen.getByPlaceholderText('Stel een vraag...');
      fireEvent.change(input, { target: { value: 'Geef me campagne ideeën' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByText(/campagne-ideeën/i)).toBeInTheDocument();
      });
    });

    it('shows email fallback for email-related questions', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.functions.invoke as any).mockImplementationOnce(() => Promise.reject(new Error('fail')));
      render(<AICopilot {...defaultProps} />);
      const input = screen.getByPlaceholderText('Stel een vraag...');
      fireEvent.change(input, { target: { value: 'Help me met email marketing' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByText(/marketing e-mail/i)).toBeInTheDocument();
      });
    });

    it('shows SEO fallback for SEO-related questions', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.functions.invoke as any).mockImplementationOnce(() => Promise.reject(new Error('fail')));
      render(<AICopilot {...defaultProps} />);
      const input = screen.getByPlaceholderText('Stel een vraag...');
      fireEvent.change(input, { target: { value: 'Hoe verbeter ik mijn SEO?' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByText(/SEO tips/i)).toBeInTheDocument();
      });
    });

    it('shows generic fallback for unrecognized questions', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      (supabase.functions.invoke as any).mockImplementationOnce(() => Promise.reject(new Error('fail')));
      render(<AICopilot {...defaultProps} />);
      const input = screen.getByPlaceholderText('Stel een vraag...');
      fireEvent.change(input, { target: { value: 'Willekeurige vraag' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      await waitFor(() => {
        expect(screen.getByText(/Bedankt voor je vraag/)).toBeInTheDocument();
      });
    });
  });

  // ── Initial context ───────────────────────────────────────────

  describe('Initial context', () => {
    it('calls onContextConsumed when context is provided', async () => {
      const onContextConsumed = vi.fn();
      render(
        <AICopilot
          isOpen={true}
          onClose={vi.fn()}
          initialContext={{ systemPrompt: 'Custom prompt', firstMessage: 'Auto message' }}
          onContextConsumed={onContextConsumed}
        />
      );
      await waitFor(() => {
        expect(onContextConsumed).toHaveBeenCalledTimes(1);
      });
    });
  });
});

// ─── CopilotContext tests ──────────────────────────────────────────

import { renderHook, act } from '@testing-library/react';
import { CopilotProvider, useCopilot } from '@/contexts/CopilotContext';

describe('CopilotContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CopilotProvider>{children}</CopilotProvider>
  );

  it('starts with isOpen = false', () => {
    const { result } = renderHook(() => useCopilot(), { wrapper });
    expect(result.current.isOpen).toBe(false);
  });

  it('starts with setupMode = false', () => {
    const { result } = renderHook(() => useCopilot(), { wrapper });
    expect(result.current.setupMode).toBe(false);
  });

  it('starts with initialContext = null', () => {
    const { result } = renderHook(() => useCopilot(), { wrapper });
    expect(result.current.initialContext).toBeNull();
  });

  it('openCopilot sets isOpen to true', () => {
    const { result } = renderHook(() => useCopilot(), { wrapper });
    act(() => result.current.openCopilot());
    expect(result.current.isOpen).toBe(true);
  });

  it('closeCopilot sets isOpen to false', () => {
    const { result } = renderHook(() => useCopilot(), { wrapper });
    act(() => result.current.openCopilot());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.closeCopilot());
    expect(result.current.isOpen).toBe(false);
  });

  it('openCopilotWithContext sets context and opens', () => {
    const { result } = renderHook(() => useCopilot(), { wrapper });
    const ctx = { systemPrompt: 'Test prompt', firstMessage: 'Hello' };
    act(() => result.current.openCopilotWithContext(ctx));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.initialContext).toEqual(ctx);
  });

  it('clearInitialContext resets context to null', () => {
    const { result } = renderHook(() => useCopilot(), { wrapper });
    act(() => result.current.openCopilotWithContext({ systemPrompt: 'Test' }));
    expect(result.current.initialContext).not.toBeNull();
    act(() => result.current.clearInitialContext());
    expect(result.current.initialContext).toBeNull();
  });

  it('enterSetupMode sets setupMode and opens copilot', () => {
    const { result } = renderHook(() => useCopilot(), { wrapper });
    act(() => result.current.enterSetupMode());
    expect(result.current.setupMode).toBe(true);
    expect(result.current.isOpen).toBe(true);
  });

  it('exitSetupMode sets setupMode to false', () => {
    const { result } = renderHook(() => useCopilot(), { wrapper });
    act(() => result.current.enterSetupMode());
    expect(result.current.setupMode).toBe(true);
    act(() => result.current.exitSetupMode());
    expect(result.current.setupMode).toBe(false);
  });

  it('openCopilot clears initialContext', () => {
    const { result } = renderHook(() => useCopilot(), { wrapper });
    act(() => result.current.openCopilotWithContext({ systemPrompt: 'Prompt' }));
    expect(result.current.initialContext).not.toBeNull();
    act(() => result.current.openCopilot());
    expect(result.current.initialContext).toBeNull();
  });
});
