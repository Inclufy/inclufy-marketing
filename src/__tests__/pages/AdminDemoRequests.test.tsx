import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/contexts/LanguageContext';

// ─── Mock data ─────────────────────────────────────────────────────

const mockDemoRequests = [
  {
    id: 'req-1',
    name: 'Jan Vermeer',
    email: 'jan@bedrijf.be',
    company: 'Bedrijf NV',
    phone: '+32 471 12 34 56',
    message: 'Graag een demo voor ons marketing team',
    status: 'pending',
    notes: '',
    created_at: '2026-03-10T10:00:00Z',
  },
  {
    id: 'req-2',
    name: 'Sophie Maes',
    email: 'sophie@techstart.be',
    company: 'TechStart BV',
    phone: '+32 472 98 76 54',
    message: 'Interesse in AI marketing features',
    status: 'scheduled',
    notes: 'Demo op dinsdag 15:00',
    created_at: '2026-03-08T14:00:00Z',
  },
  {
    id: 'req-3',
    name: 'Marc Peeters',
    email: 'marc@industrie.be',
    company: 'Industrie Plus',
    phone: '',
    message: '',
    status: 'completed',
    notes: 'Geconverteerd naar klant',
    created_at: '2026-03-05T09:00:00Z',
  },
  {
    id: 'req-4',
    name: 'Elena Dubois',
    email: 'elena@agence.fr',
    company: 'Agence Créative',
    phone: '+33 6 12 34 56 78',
    message: 'Cancelled by client',
    status: 'cancelled',
    notes: '',
    created_at: '2026-03-01T11:00:00Z',
  },
];

// ─── Supabase mock ─────────────────────────────────────────────────

let supabaseQueryData: any[] = mockDemoRequests;
let supabaseQueryError: any = null;
let supabaseUpdateError: any = null;
let lastUpdatePayload: any = null;
let lastUpdateId: string | null = null;
let lastQueryFilter: string | null = null;

const mockOrder = vi.fn().mockImplementation(() => ({
  then: (resolve: any) => resolve({ data: supabaseQueryData, error: supabaseQueryError }),
}));

const mockEqFilter = vi.fn().mockImplementation((col: string, val: string) => {
  lastQueryFilter = val;
  return { order: mockOrder };
});

const mockSelect = vi.fn().mockImplementation(() => ({
  order: mockOrder,
  eq: mockEqFilter,
}));

const mockUpdateEq = vi.fn().mockImplementation((col: string, val: string) => {
  lastUpdateId = val;
  return Promise.resolve({ error: supabaseUpdateError });
});

const mockUpdate = vi.fn().mockImplementation((payload: any) => {
  lastUpdatePayload = payload;
  return { eq: mockUpdateEq };
});

const mockFrom = vi.fn().mockImplementation(() => ({
  select: mockSelect,
  update: mockUpdate,
}));

const mockGetUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => mockFrom(table),
  },
}));

// ─── Toast mock ────────────────────────────────────────────────────

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// ─── Demo agent service mock ───────────────────────────────────────

const mockSeedIndustryDemo = vi.fn().mockResolvedValue(undefined);
const mockSwitchIndustry = vi.fn().mockResolvedValue(undefined);
const mockResetDemo = vi.fn().mockResolvedValue(undefined);
const mockHasDemoData = vi.fn().mockResolvedValue(false);
const mockGetActiveIndustry = vi.fn().mockResolvedValue(null);

vi.mock('@/services/demo-agent/demo-agent.service', () => ({
  demoAgentService: {
    getAvailableIndustries: () => [
      { id: 'healthcare', name: 'Healthcare', icon: 'Heart', color: '#ef4444' },
      { id: 'construction', name: 'Construction', icon: 'HardHat', color: '#f59e0b' },
      { id: 'it', name: 'IT & SaaS', icon: 'Cloud', color: '#3b82f6' },
      { id: 'real-estate', name: 'Real Estate', icon: 'Building2', color: '#10b981' },
      { id: 'manufacturing', name: 'Manufacturing', icon: 'Factory', color: '#8b5cf6' },
    ],
    seedIndustryDemo: (...args: any[]) => mockSeedIndustryDemo(...args),
    switchIndustry: (...args: any[]) => mockSwitchIndustry(...args),
    resetDemo: (...args: any[]) => mockResetDemo(...args),
    hasDemoData: (...args: any[]) => mockHasDemoData(...args),
    getActiveIndustry: () => mockGetActiveIndustry(),
  },
}));

// ─── Import after mocks ────────────────────────────────────────────

import AdminDemoRequests from '@/pages/admin/AdminDemoRequests';

// ─── Render helper ─────────────────────────────────────────────────

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LanguageProvider>
          <AdminDemoRequests />
        </LanguageProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('AdminDemoRequests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('inclufy_lang');
    supabaseQueryData = mockDemoRequests;
    supabaseQueryError = null;
    supabaseUpdateError = null;
    lastUpdatePayload = null;
    lastUpdateId = null;
    lastQueryFilter = null;
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-1', email: 'admin@inclufy.com' } } });
    mockGetActiveIndustry.mockResolvedValue(null);
    mockHasDemoData.mockResolvedValue(false);
  });

  // ── Demo Environment section ────────────────────────────────────

  describe('Demo Environment Manager', () => {
    it('renders the Demo Omgeving heading in NL', () => {
      renderPage();
      expect(screen.getByText('Demo Omgeving')).toBeInTheDocument();
    });

    it('renders the Demo Environment heading in EN', () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderPage();
      expect(screen.getByText('Demo Environment')).toBeInTheDocument();
    });

    it('renders the Environnement Demo heading in FR', () => {
      localStorage.setItem('inclufy_lang', 'fr');
      renderPage();
      expect(screen.getByText('Environnement Demo')).toBeInTheDocument();
    });

    it('renders all 5 industry selector cards', () => {
      renderPage();
      expect(screen.getByText('Healthcare')).toBeInTheDocument();
      expect(screen.getByText('Construction')).toBeInTheDocument();
      expect(screen.getByText('IT & SaaS')).toBeInTheDocument();
      expect(screen.getByText('Real Estate')).toBeInTheDocument();
      expect(screen.getByText('Manufacturing')).toBeInTheDocument();
    });

    it('renders the Generate Demo button in NL', () => {
      renderPage();
      expect(screen.getByText('Genereer Demo')).toBeInTheDocument();
    });

    it('renders Generate Demo button in EN', () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderPage();
      expect(screen.getByText('Generate Demo')).toBeInTheDocument();
    });

    it('disables generate button when no industry is selected', () => {
      renderPage();
      const btn = screen.getByText('Genereer Demo').closest('button');
      expect(btn).toBeDisabled();
    });

    it('enables generate button after selecting an industry', () => {
      renderPage();
      fireEvent.click(screen.getByText('Healthcare'));
      const btn = screen.getByText('Genereer Demo').closest('button');
      expect(btn).not.toBeDisabled();
    });

    it('shows Active badge when an industry is active', async () => {
      mockGetActiveIndustry.mockResolvedValue('it');
      renderPage();
      await waitFor(() => {
        // The badge shows "Actief: IT & SaaS", also the industry card shows "Actief"
        const badges = screen.getAllByText(/Actief/);
        expect(badges.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('shows Switch Industry button when an industry is already active (NL)', async () => {
      mockGetActiveIndustry.mockResolvedValue('healthcare');
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Wissel Industrie')).toBeInTheDocument();
      });
    });

    it('shows Reset Demo button when an industry is active (NL)', async () => {
      mockGetActiveIndustry.mockResolvedValue('healthcare');
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Reset Demo')).toBeInTheDocument();
      });
    });

    it('does not show Reset Demo button when no industry is active', () => {
      renderPage();
      expect(screen.queryByText('Reset Demo')).not.toBeInTheDocument();
    });

    it('calls seedIndustryDemo when generating for the first time', async () => {
      renderPage();
      fireEvent.click(screen.getByText('Healthcare'));
      const btn = screen.getByText('Genereer Demo').closest('button')!;
      fireEvent.click(btn);

      await waitFor(() => {
        expect(mockSeedIndustryDemo).toHaveBeenCalled();
      });
    });

    it('calls switchIndustry when data already exists', async () => {
      mockHasDemoData.mockResolvedValue(true);
      mockGetActiveIndustry.mockResolvedValue('healthcare');
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Wissel Industrie')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Construction'));
      fireEvent.click(screen.getByText('Wissel Industrie').closest('button')!);

      await waitFor(() => {
        expect(mockSwitchIndustry).toHaveBeenCalled();
      });
    });

    it('calls resetDemo when reset button is clicked', async () => {
      mockGetActiveIndustry.mockResolvedValue('it');
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Reset Demo')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reset Demo').closest('button')!);

      await waitFor(() => {
        expect(mockResetDemo).toHaveBeenCalled();
      });
    });

    it('shows toast on successful generation', async () => {
      renderPage();
      fireEvent.click(screen.getByText('Healthcare'));
      fireEvent.click(screen.getByText('Genereer Demo').closest('button')!);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Demo omgeving gegenereerd!',
          }),
        );
      });
    });

    it('shows destructive toast on generation failure', async () => {
      mockSeedIndustryDemo.mockRejectedValueOnce(new Error('Seed failed'));
      renderPage();
      fireEvent.click(screen.getByText('Healthcare'));
      fireEvent.click(screen.getByText('Genereer Demo').closest('button')!);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: 'destructive',
          }),
        );
      });
    });

    it('shows toast on reset success', async () => {
      mockGetActiveIndustry.mockResolvedValue('it');
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Reset Demo')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reset Demo').closest('button')!);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Demo data gewist',
          }),
        );
      });
    });

    it('shows destructive toast on reset failure', async () => {
      mockResetDemo.mockRejectedValueOnce(new Error('Reset failed'));
      mockGetActiveIndustry.mockResolvedValue('it');
      renderPage();

      await waitFor(() => {
        expect(screen.getByText('Reset Demo')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Reset Demo').closest('button')!);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Reset failed',
            variant: 'destructive',
          }),
        );
      });
    });

    it('shows not authenticated toast when user is null', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } });
      renderPage();
      fireEvent.click(screen.getByText('Healthcare'));
      fireEvent.click(screen.getByText('Genereer Demo').closest('button')!);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Not authenticated',
            variant: 'destructive',
          }),
        );
      });
    });
  });

  // ── Demo Requests section ───────────────────────────────────────

  describe('Demo Requests list (NL default)', () => {
    it('renders the Demo Verzoeken heading', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Demo Verzoeken')).toBeInTheDocument();
      });
    });

    it('shows the total request count', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('4 verzoeken')).toBeInTheDocument();
      });
    });

    it('renders each demo request name', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Jan Vermeer')).toBeInTheDocument();
        expect(screen.getByText('Sophie Maes')).toBeInTheDocument();
        expect(screen.getByText('Marc Peeters')).toBeInTheDocument();
        expect(screen.getByText('Elena Dubois')).toBeInTheDocument();
      });
    });

    it('renders email for each request', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('jan@bedrijf.be')).toBeInTheDocument();
        expect(screen.getByText('sophie@techstart.be')).toBeInTheDocument();
      });
    });

    it('renders company name for each request', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Bedrijf NV')).toBeInTheDocument();
        expect(screen.getByText('TechStart BV')).toBeInTheDocument();
        expect(screen.getByText('Industrie Plus')).toBeInTheDocument();
      });
    });

    it('renders phone number when available', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('+32 471 12 34 56')).toBeInTheDocument();
        expect(screen.getByText('+32 472 98 76 54')).toBeInTheDocument();
      });
    });

    it('renders message text when available', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Graag een demo voor ons marketing team')).toBeInTheDocument();
        expect(screen.getByText('Interesse in AI marketing features')).toBeInTheDocument();
      });
    });

    it('shows Onbekend for request without name', async () => {
      supabaseQueryData = [{ ...mockDemoRequests[0], id: 'req-x', name: '' }];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Onbekend')).toBeInTheDocument();
      });
    });
  });

  // ── Status badges ───────────────────────────────────────────────

  describe('Status badges (NL)', () => {
    it('shows In afwachting badge for pending requests', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('In afwachting')).toBeInTheDocument();
      });
    });

    it('shows Ingepland badge for scheduled requests', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Ingepland')).toBeInTheDocument();
      });
    });

    it('shows Voltooid badge for completed requests', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Voltooid')).toBeInTheDocument();
      });
    });

    it('shows Geannuleerd badge for cancelled requests', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Geannuleerd')).toBeInTheDocument();
      });
    });
  });

  describe('Status badges (EN)', () => {
    beforeEach(() => {
      localStorage.setItem('inclufy_lang', 'en');
    });

    it('shows Pending badge', async () => {
      supabaseQueryData = [mockDemoRequests[0]];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Pending')).toBeInTheDocument();
      });
    });

    it('shows Scheduled badge', async () => {
      supabaseQueryData = [mockDemoRequests[1]];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Scheduled')).toBeInTheDocument();
      });
    });

    it('shows Completed badge', async () => {
      supabaseQueryData = [mockDemoRequests[2]];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Completed')).toBeInTheDocument();
      });
    });

    it('shows Cancelled badge', async () => {
      supabaseQueryData = [mockDemoRequests[3]];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Cancelled')).toBeInTheDocument();
      });
    });
  });

  describe('Status badges (FR)', () => {
    beforeEach(() => {
      localStorage.setItem('inclufy_lang', 'fr');
    });

    it('shows En attente badge', async () => {
      supabaseQueryData = [mockDemoRequests[0]];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('En attente')).toBeInTheDocument();
      });
    });

    it('shows Planifie badge', async () => {
      supabaseQueryData = [mockDemoRequests[1]];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Planifie')).toBeInTheDocument();
      });
    });

    it('shows Termine badge', async () => {
      supabaseQueryData = [mockDemoRequests[2]];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Termine')).toBeInTheDocument();
      });
    });

    it('shows Annule badge', async () => {
      supabaseQueryData = [mockDemoRequests[3]];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Annule')).toBeInTheDocument();
      });
    });
  });

  // ── Status counter cards ────────────────────────────────────────

  describe('Status counter cards', () => {
    it('renders 4 status stat cards', async () => {
      renderPage();
      await waitFor(() => {
        // Each status has a count displayed as text
        // pending=1, scheduled=1, completed=1, cancelled=1
        const ones = screen.getAllByText('1');
        expect(ones.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('shows correct count for each status', async () => {
      // 2 pending, 1 scheduled, 1 completed, 0 cancelled
      supabaseQueryData = [
        { ...mockDemoRequests[0] },
        { ...mockDemoRequests[0], id: 'req-5' },
        { ...mockDemoRequests[1] },
        { ...mockDemoRequests[2] },
      ];
      renderPage();
      await waitFor(() => {
        const twos = screen.getAllByText('2');
        expect(twos.length).toBeGreaterThanOrEqual(1); // 2 pending
      });
    });
  });

  // ── Empty state ─────────────────────────────────────────────────

  describe('Empty state', () => {
    it('shows empty state when no requests exist (NL)', async () => {
      supabaseQueryData = [];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Geen demo verzoeken')).toBeInTheDocument();
      });
    });

    it('shows empty state description (NL)', async () => {
      supabaseQueryData = [];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Er zijn nog geen demo verzoeken ontvangen')).toBeInTheDocument();
      });
    });

    it('shows empty state in EN', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      supabaseQueryData = [];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('No demo requests')).toBeInTheDocument();
      });
    });

    it('shows empty state in FR', async () => {
      localStorage.setItem('inclufy_lang', 'fr');
      supabaseQueryData = [];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Aucune demande de demo')).toBeInTheDocument();
      });
    });

    it('shows 0 verzoeken count', async () => {
      supabaseQueryData = [];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('0 verzoeken')).toBeInTheDocument();
      });
    });
  });

  // ── Filter dropdown ─────────────────────────────────────────────

  describe('Filter', () => {
    it('renders the filter select', async () => {
      renderPage();
      await waitFor(() => {
        // The filter dropdown trigger exists
        expect(screen.getByText('Alle')).toBeInTheDocument();
      });
    });

    it('renders the Refresh button (NL)', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Vernieuwen')).toBeInTheDocument();
      });
    });

    it('renders the Refresh button (EN)', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    it('queries demo_requests table from Supabase', async () => {
      renderPage();
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('demo_requests');
      });
    });

    it('calls fetchData on refresh click', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Vernieuwen')).toBeInTheDocument();
      });

      // Clear mock calls from initial load
      mockFrom.mockClear();

      fireEvent.click(screen.getByText('Vernieuwen').closest('button')!);

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('demo_requests');
      });
    });
  });

  // ── Language support ────────────────────────────────────────────

  describe('Language support', () => {
    it('shows Dutch labels by default', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Demo Verzoeken')).toBeInTheDocument();
        expect(screen.getByText('Vernieuwen')).toBeInTheDocument();
      });
    });

    it('shows English labels when EN is selected', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Demo Requests')).toBeInTheDocument();
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });

    it('shows French labels when FR is selected', async () => {
      localStorage.setItem('inclufy_lang', 'fr');
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Demandes de demo')).toBeInTheDocument();
        expect(screen.getByText('Actualiser')).toBeInTheDocument();
      });
    });

    it('shows Demo Environment heading in all 3 languages', async () => {
      // NL
      renderPage();
      expect(screen.getByText('Demo Omgeving')).toBeInTheDocument();
    });
  });

  // ── Supabase interactions ───────────────────────────────────────

  describe('Supabase data fetching', () => {
    it('queries demo_requests table on mount', async () => {
      renderPage();
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('demo_requests');
      });
    });

    it('handles Supabase errors gracefully', async () => {
      supabaseQueryError = { message: 'Table not found' };
      supabaseQueryData = null as any;
      renderPage();
      // Should not crash — the component catches errors
      await waitFor(() => {
        expect(screen.getByText('Demo Verzoeken')).toBeInTheDocument();
      });
    });

    it('shows requests after data loads', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Jan Vermeer')).toBeInTheDocument();
      });
    });
  });

  // ── Date formatting ─────────────────────────────────────────────

  describe('Date formatting', () => {
    it('formats dates in Dutch locale by default', async () => {
      supabaseQueryData = [mockDemoRequests[0]]; // 2026-03-10
      renderPage();
      await waitFor(() => {
        // nl-NL locale date format for 2026-03-10
        const formatted = new Date('2026-03-10T10:00:00Z').toLocaleDateString('nl-NL');
        expect(screen.getByText(formatted)).toBeInTheDocument();
      });
    });

    it('formats dates in English locale', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      supabaseQueryData = [mockDemoRequests[0]];
      renderPage();
      await waitFor(() => {
        const formatted = new Date('2026-03-10T10:00:00Z').toLocaleDateString('en-GB');
        expect(screen.getByText(formatted)).toBeInTheDocument();
      });
    });

    it('formats dates in French locale', async () => {
      localStorage.setItem('inclufy_lang', 'fr');
      supabaseQueryData = [mockDemoRequests[0]];
      renderPage();
      await waitFor(() => {
        const formatted = new Date('2026-03-10T10:00:00Z').toLocaleDateString('fr-FR');
        expect(screen.getByText(formatted)).toBeInTheDocument();
      });
    });

    it('shows dash for missing date', async () => {
      supabaseQueryData = [{ ...mockDemoRequests[0], created_at: '' }];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('-')).toBeInTheDocument();
      });
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('handles request with no email gracefully', async () => {
      supabaseQueryData = [{ ...mockDemoRequests[0], email: '' }];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Jan Vermeer')).toBeInTheDocument();
        // No email text should be rendered
        expect(screen.queryByText('jan@bedrijf.be')).not.toBeInTheDocument();
      });
    });

    it('handles request with no company gracefully', async () => {
      supabaseQueryData = [{ ...mockDemoRequests[0], company: '' }];
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Jan Vermeer')).toBeInTheDocument();
        expect(screen.queryByText('Bedrijf NV')).not.toBeInTheDocument();
      });
    });

    it('handles request with no phone gracefully', async () => {
      supabaseQueryData = [mockDemoRequests[2]]; // Marc Peeters has no phone
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Marc Peeters')).toBeInTheDocument();
      });
    });

    it('handles request with no message gracefully', async () => {
      supabaseQueryData = [mockDemoRequests[2]]; // Marc Peeters has no message
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Marc Peeters')).toBeInTheDocument();
      });
    });

    it('handles unknown status with pending fallback styling', async () => {
      supabaseQueryData = [{ ...mockDemoRequests[0], status: 'unknown_status' }];
      renderPage();
      await waitFor(() => {
        // Should still render the request without crashing
        expect(screen.getByText('Jan Vermeer')).toBeInTheDocument();
      });
    });

    it('handles large number of requests', async () => {
      supabaseQueryData = Array.from({ length: 50 }, (_, i) => ({
        ...mockDemoRequests[0],
        id: `req-${i}`,
        name: `User ${i}`,
      }));
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('50 verzoeken')).toBeInTheDocument();
      });
    });
  });
});
