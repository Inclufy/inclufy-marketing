import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';

// ─── Mocks ──────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', user_metadata: {} },
    session: { access_token: 'test-token' },
    loading: false,
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: vi.fn().mockResolvedValue({ data: { id: 'bm-1' }, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: vi.fn().mockResolvedValue({ data: {}, error: null }),
          }),
        }),
      }),
    }),
  },
}));

vi.mock('@/services/brand/brand-memory.service', () => ({
  brandMemoryService: {
    upsertActive: vi.fn().mockResolvedValue({}),
    getOrCreateActive: vi.fn().mockResolvedValue({ id: 'bm-1', version: 1 }),
  },
}));

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn().mockRejectedValue(new Error('not available')) },
  api: { get: vi.fn().mockRejectedValue(new Error('not available')) },
}));

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, custom, whileInView,
        viewport, whileHover, whileTap, layout, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, custom, whileInView,
        viewport, whileHover, whileTap, layout, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
    h1: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <h1 {...rest}>{children}</h1>;
    },
    p: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <p {...rest}>{children}</p>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Import AFTER mocks
import Onboarding from '@/pages/Onboarding';

function renderOnboarding() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <Onboarding />
      </LanguageProvider>
    </MemoryRouter>
  );
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('Onboarding Wizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('inclufy_lang');
  });

  describe('Step 1: Company Information', () => {
    it('renders step 1 heading', () => {
      renderOnboarding();
      expect(screen.getByText(/Vertel ons over je bedrijf/i)).toBeInTheDocument();
    });

    it('renders company name input with required marker', () => {
      renderOnboarding();
      expect(screen.getByText(/bedrijfsnaam/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Inclufy Marketing/)).toBeInTheDocument();
    });

    it('renders website URL input', () => {
      renderOnboarding();
      expect(screen.getByPlaceholderText(/jouwbedrijf/)).toBeInTheDocument();
    });

    it('renders tagline input', () => {
      renderOnboarding();
      expect(screen.getByText(/tagline/i)).toBeInTheDocument();
    });

    it('renders industry selector', () => {
      renderOnboarding();
      expect(screen.getByText(/branche/i)).toBeInTheDocument();
      expect(screen.getByText('E-commerce')).toBeInTheDocument();
      expect(screen.getByText('SaaS / Technology')).toBeInTheDocument();
    });

    it('updates company name when typed', () => {
      renderOnboarding();
      const input = screen.getByPlaceholderText(/Inclufy Marketing/) as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'Test BV' } });
      expect(input.value).toBe('Test BV');
    });

    it('renders country selector', () => {
      renderOnboarding();
      expect(screen.getByText('Nederland')).toBeInTheDocument();
      expect(screen.getByText('België')).toBeInTheDocument();
    });
  });

  describe('Step navigation', () => {
    it('renders step indicator with 9 steps', () => {
      renderOnboarding();
      expect(screen.getByText(/Stap 1/i)).toBeInTheDocument();
      expect(screen.getByText(/van 9/i) || screen.getByText(/9/)).toBeTruthy();
    });

    it('renders next button', () => {
      renderOnboarding();
      const nextBtns = screen.getAllByRole('button').filter(
        (btn) => btn.textContent?.includes('Volgende') || btn.textContent?.includes('Next')
      );
      expect(nextBtns.length).toBeGreaterThanOrEqual(1);
    });

    it('navigates to step 2 when next is clicked', () => {
      renderOnboarding();
      // Fill required field
      const input = screen.getByPlaceholderText(/Inclufy Marketing/);
      fireEvent.change(input, { target: { value: 'Test' } });

      // Click next
      const nextBtn = screen.getAllByRole('button').find(
        (btn) => btn.textContent?.includes('Volgende') || btn.textContent?.includes('→')
      );
      if (nextBtn) fireEvent.click(nextBtn);

      // Step 2 should show scan-related content
      expect(screen.getByText(/Stap 2/i) || screen.getByText(/Scan/i)).toBeTruthy();
    });
  });

  describe('Step indicator labels', () => {
    it('shows Dutch step labels by default', () => {
      renderOnboarding();
      expect(screen.getByText('Bedrijf')).toBeInTheDocument();
    });

    it('shows English step labels when EN is selected', () => {
      renderOnboarding();
      const enBtn = screen.getAllByRole('button').find((btn) => btn.textContent === '🇬🇧');
      if (enBtn) fireEvent.click(enBtn);

      expect(screen.getByText('Company')).toBeInTheDocument();
    });

    it('shows French step labels when FR is selected', () => {
      renderOnboarding();
      const frBtn = screen.getAllByRole('button').find((btn) => btn.textContent === '🇫🇷');
      if (frBtn) fireEvent.click(frBtn);

      expect(screen.getByText('Entreprise')).toBeInTheDocument();
    });
  });

  describe('Language switcher', () => {
    it('renders 3 language flags', () => {
      renderOnboarding();
      const flags = screen.getAllByRole('button').filter(
        (btn) => btn.textContent === '🇳🇱' || btn.textContent === '🇬🇧' || btn.textContent === '🇫🇷'
      );
      expect(flags.length).toBe(3);
    });

    it('switches step 1 heading to English', () => {
      renderOnboarding();
      const enBtn = screen.getAllByRole('button').find((btn) => btn.textContent === '🇬🇧');
      if (enBtn) fireEvent.click(enBtn);

      expect(screen.getByText(/Tell us about your business/i)).toBeInTheDocument();
    });

    it('switches step 1 heading to French', () => {
      renderOnboarding();
      const frBtn = screen.getAllByRole('button').find((btn) => btn.textContent === '🇫🇷');
      if (frBtn) fireEvent.click(frBtn);

      expect(screen.getByText(/Parlez-nous de votre entreprise/i)).toBeInTheDocument();
    });
  });

  describe('UI structure', () => {
    it('renders logo', () => {
      renderOnboarding();
      const logo = screen.getByAltText('Inclufy');
      expect(logo).toBeInTheDocument();
    });

    it('renders the step progress bar', () => {
      const { container } = renderOnboarding();
      // Each step has a circle indicator
      const stepIndicators = container.querySelectorAll('.rounded-full');
      expect(stepIndicators.length).toBeGreaterThanOrEqual(9);
    });
  });
});
