import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/contexts/LanguageContext';

// ─── Mock data ─────────────────────────────────────────────────────

const mockProfiles = [
  { id: 'u1', email: 'jan@inclufy.com', full_name: 'Jan De Smedt', created_at: '2026-03-10T10:00:00Z' },
  { id: 'u2', email: 'sophie@bedrijf.be', full_name: 'Sophie Maes', created_at: '2026-03-09T08:00:00Z' },
  { id: 'u3', email: 'marc@tech.be', full_name: '', created_at: '2026-03-08T12:00:00Z' },
];

// ─── Supabase mock ─────────────────────────────────────────────────

let queryResults: Record<string, { count: number | null; data: any[] }> = {};
let shouldError = false;

const mockFrom = vi.fn().mockImplementation((table: string) => {
  const result = queryResults[table] || { count: 0, data: [] };
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  // For count queries (head: true) — resolve with count, reject on error
  Object.defineProperty(chain, 'then', {
    get: () => (resolve: any, reject: any) => {
      if (shouldError) {
        if (reject) reject(new Error('DB error'));
        else throw new Error('DB error');
      } else {
        resolve({ count: result.count, data: result.data, error: null });
      }
    },
  });
  return chain;
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'admin-1' } } }) },
    from: (table: string) => mockFrom(table),
  },
}));

// ─── Import after mocks ────────────────────────────────────────────

import AdminDashboard from '@/pages/admin/AdminDashboard';

// ─── Render helper ─────────────────────────────────────────────────

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LanguageProvider>
          <AdminDashboard />
        </LanguageProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('inclufy_lang');
    shouldError = false;
    queryResults = {
      profiles: { count: 42, data: mockProfiles },
      organizations: { count: 8, data: [] },
      subscriptions: { count: 5, data: [] },
      campaigns: { count: 23, data: [] },
      contacts: { count: 150, data: [] },
      content_items: { count: 67, data: [] },
    };
  });

  // ── Header ────────────────────────────────────────────────────

  describe('Header', () => {
    it('renders Admin Dashboard heading', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });
    });

    it('renders subtitle in NL', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Systeemoverzicht en statistieken')).toBeInTheDocument();
      });
    });

    it('renders subtitle in EN', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('System overview and statistics')).toBeInTheDocument();
      });
    });

    it('renders Refresh button in NL', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Vernieuwen')).toBeInTheDocument();
      });
    });

    it('renders Refresh button in EN', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Refresh')).toBeInTheDocument();
      });
    });
  });

  // ── Stat cards ────────────────────────────────────────────────

  describe('Stat cards (NL)', () => {
    it('renders Totaal Gebruikers card', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Totaal Gebruikers')).toBeInTheDocument();
      });
    });

    it('renders Organisaties card', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Organisaties')).toBeInTheDocument();
      });
    });

    it('renders Actieve Abonnementen card', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Actieve Abonnementen')).toBeInTheDocument();
      });
    });

    it('renders Projecten card', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Projecten')).toBeInTheDocument();
      });
    });
  });

  describe('Stat cards (EN)', () => {
    beforeEach(() => {
      localStorage.setItem('inclufy_lang', 'en');
    });

    it('renders Total Users card', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Total Users')).toBeInTheDocument();
      });
    });

    it('renders Organizations card', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Organizations')).toBeInTheDocument();
      });
    });

    it('renders Active Subscriptions card', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Active Subscriptions')).toBeInTheDocument();
      });
    });

    it('renders Projects card', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Projects')).toBeInTheDocument();
      });
    });
  });

  // ── Financial stats ───────────────────────────────────────────

  describe('Financial stats', () => {
    it('renders MRR card', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('MRR')).toBeInTheDocument();
      });
    });

    it('renders ARR card', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('ARR')).toBeInTheDocument();
      });
    });

    it('renders User Growth card in NL', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Gebruikersgroei')).toBeInTheDocument();
      });
    });

    it('renders User Growth card in EN', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('User Growth')).toBeInTheDocument();
      });
    });
  });

  // ── Recent users ──────────────────────────────────────────────

  describe('Recent Users section', () => {
    it('renders Recent Users heading in NL', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Recente Gebruikers')).toBeInTheDocument();
      });
    });

    it('renders Recent Users heading in EN', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Recent Users')).toBeInTheDocument();
      });
    });

    it('renders user names from profiles', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Jan De Smedt')).toBeInTheDocument();
        expect(screen.getByText('Sophie Maes')).toBeInTheDocument();
      });
    });

    it('falls back to email prefix when full_name is empty', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('marc')).toBeInTheDocument();
      });
    });

    it('shows Geen gebruikers gevonden when empty', async () => {
      queryResults.profiles = { count: 0, data: [] };
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Geen gebruikers gevonden')).toBeInTheDocument();
      });
    });

    it('shows No users found in EN when empty', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      queryResults.profiles = { count: 0, data: [] };
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });

  // ── Import & Export ───────────────────────────────────────────

  describe('Import & Export section', () => {
    it('renders Import & Export heading in NL', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Importeren & Exporteren')).toBeInTheDocument();
      });
    });

    it('renders Import button in NL', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Importeren')).toBeInTheDocument();
      });
    });

    it('renders Export button in NL', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Exporteren')).toBeInTheDocument();
      });
    });

    it('renders Import & Export in EN', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Import & Export')).toBeInTheDocument();
        expect(screen.getByText('Import')).toBeInTheDocument();
        expect(screen.getByText('Export')).toBeInTheDocument();
      });
    });
  });

  // ── Supabase queries ──────────────────────────────────────────

  describe('Supabase queries', () => {
    it('queries profiles table', async () => {
      renderPage();
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('profiles');
      });
    });

    it('queries organizations table', async () => {
      renderPage();
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('organizations');
      });
    });

    it('queries subscriptions table', async () => {
      renderPage();
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('subscriptions');
      });
    });

    it('queries campaigns table', async () => {
      renderPage();
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('campaigns');
      });
    });
  });

  // ── Error state ───────────────────────────────────────────────

  describe('Error state', () => {
    it('shows error message on fetch failure', async () => {
      shouldError = true;
      renderPage();
      await waitFor(() => {
        expect(screen.getByText(/Laden mislukt|DB error|Error/i)).toBeInTheDocument();
      });
    });
  });

  // ── French language ───────────────────────────────────────────

  describe('French language', () => {
    beforeEach(() => {
      localStorage.setItem('inclufy_lang', 'fr');
    });

    it('renders French stat labels', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Total Utilisateurs')).toBeInTheDocument();
        expect(screen.getByText('Organisations')).toBeInTheDocument();
        expect(screen.getByText('Abonnements Actifs')).toBeInTheDocument();
      });
    });

    it('renders French section headings', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Utilisateurs Récents')).toBeInTheDocument();
        expect(screen.getByText('Importer & Exporter')).toBeInTheDocument();
      });
    });
  });
});
