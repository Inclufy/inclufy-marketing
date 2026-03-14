import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/contexts/LanguageContext';

// ─── Mock data ─────────────────────────────────────────────────────

const mockUsers = [
  { id: 'u1', email: 'sami@inclufy.com', full_name: 'Sami Loukile', created_at: '2026-01-01T00:00:00Z', role: 'superadmin' },
  { id: 'u2', email: 'jan@bedrijf.be', full_name: 'Jan Vermeer', created_at: '2026-02-15T00:00:00Z', role: 'owner' },
  { id: 'u3', email: 'sophie@tech.be', full_name: 'Sophie Maes', created_at: '2026-03-01T00:00:00Z', role: 'admin' },
  { id: 'u4', email: 'marc@startup.be', full_name: '', created_at: '2026-03-10T00:00:00Z', role: 'member' },
  { id: 'u5', email: 'elena@agence.fr', full_name: 'Elena Dubois', created_at: '2026-03-12T00:00:00Z', role: 'viewer' },
];

// ─── Supabase mock ─────────────────────────────────────────────────

let queryData: any[] = mockUsers;
let queryCount: number = mockUsers.length;
let queryError: any = null;

const mockFrom = vi.fn().mockImplementation(() => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  Object.defineProperty(chain, 'then', {
    get: () => (resolve: any) => resolve({ data: queryData, count: queryCount, error: queryError }),
  });
  return chain;
});

const mockFunctionsInvoke = vi.fn().mockResolvedValue({ data: { data: { email: 'new@test.com' }, temporary_password: 'TempPass1!' }, error: null });

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'admin-1' } } }) },
    from: (table: string) => mockFrom(table),
    functions: { invoke: (...args: any[]) => mockFunctionsInvoke(...args) },
  },
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// ─── Import after mocks ────────────────────────────────────────────

import AdminUsers from '@/pages/admin/AdminUsers';

// ─── Render helper ─────────────────────────────────────────────────

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LanguageProvider>
          <AdminUsers />
        </LanguageProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('inclufy_lang');
    queryData = mockUsers;
    queryCount = mockUsers.length;
    queryError = null;
  });

  // ── Header ────────────────────────────────────────────────────

  describe('Header (NL)', () => {
    it('renders Gebruikers heading', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Gebruikers')).toBeInTheDocument();
      });
    });

    it('shows total user count', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('5 gebruikers totaal')).toBeInTheDocument();
      });
    });

    it('renders Vernieuwen button', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Vernieuwen')).toBeInTheDocument();
      });
    });

    it('renders Gebruiker Toevoegen button', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Gebruiker Toevoegen')).toBeInTheDocument();
      });
    });
  });

  describe('Header (EN)', () => {
    beforeEach(() => { localStorage.setItem('inclufy_lang', 'en'); });

    it('renders Users heading', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Users')).toBeInTheDocument();
      });
    });

    it('shows total user count in EN', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('5 users total')).toBeInTheDocument();
      });
    });

    it('renders Add User button', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Add User')).toBeInTheDocument();
      });
    });
  });

  describe('Header (FR)', () => {
    beforeEach(() => { localStorage.setItem('inclufy_lang', 'fr'); });

    it('renders Utilisateurs heading', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Utilisateurs')).toBeInTheDocument();
      });
    });

    it('renders Ajouter un Utilisateur button', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Ajouter un Utilisateur')).toBeInTheDocument();
      });
    });
  });

  // ── Search ────────────────────────────────────────────────────

  describe('Search', () => {
    it('renders search input in NL', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Zoek op naam of e-mail...')).toBeInTheDocument();
      });
    });

    it('renders search input in EN', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderPage();
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search by name or email...')).toBeInTheDocument();
      });
    });

    it('renders Zoeken button', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Zoeken')).toBeInTheDocument();
      });
    });

    it('re-queries on search click', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Zoeken')).toBeInTheDocument();
      });
      mockFrom.mockClear();
      fireEvent.click(screen.getByText('Zoeken'));
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('profiles');
      });
    });
  });

  // ── Users table ───────────────────────────────────────────────

  describe('Users table (NL)', () => {
    it('renders table headers', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Gebruiker')).toBeInTheDocument();
        expect(screen.getByText('Organisatie')).toBeInTheDocument();
        expect(screen.getByText('Rol')).toBeInTheDocument();
        expect(screen.getByText('Aangemeld')).toBeInTheDocument();
        expect(screen.getByText('Acties')).toBeInTheDocument();
      });
    });

    it('renders each user name', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Sami Loukile')).toBeInTheDocument();
        expect(screen.getByText('Jan Vermeer')).toBeInTheDocument();
        expect(screen.getByText('Sophie Maes')).toBeInTheDocument();
        expect(screen.getByText('Elena Dubois')).toBeInTheDocument();
      });
    });

    it('falls back to email prefix for empty full_name', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('marc')).toBeInTheDocument();
      });
    });

    it('renders user emails', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('sami@inclufy.com')).toBeInTheDocument();
        expect(screen.getByText('jan@bedrijf.be')).toBeInTheDocument();
      });
    });

    it('shows Superadmin badge for superadmin users', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Superadmin')).toBeInTheDocument();
      });
    });

    it('renders role badges for non-superadmin users', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Eigenaar')).toBeInTheDocument();
        expect(screen.getByText('Beheerder')).toBeInTheDocument();
        expect(screen.getByText('Lid')).toBeInTheDocument();
        expect(screen.getByText('Kijker')).toBeInTheDocument();
      });
    });
  });

  describe('Users table (EN)', () => {
    beforeEach(() => { localStorage.setItem('inclufy_lang', 'en'); });

    it('renders English table headers', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('User')).toBeInTheDocument();
        expect(screen.getByText('Organization')).toBeInTheDocument();
        expect(screen.getByText('Role')).toBeInTheDocument();
        expect(screen.getByText('Joined')).toBeInTheDocument();
      });
    });

    it('renders English role labels', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Owner')).toBeInTheDocument();
        expect(screen.getByText('Admin')).toBeInTheDocument();
        expect(screen.getByText('Member')).toBeInTheDocument();
        expect(screen.getByText('Viewer')).toBeInTheDocument();
      });
    });
  });

  // ── Empty & error states ──────────────────────────────────────

  describe('Empty state', () => {
    it('shows Geen gebruikers gevonden when no users', async () => {
      queryData = [];
      queryCount = 0;
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Geen gebruikers gevonden')).toBeInTheDocument();
      });
    });

    it('shows No users found in EN', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      queryData = [];
      queryCount = 0;
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });

  describe('Error state', () => {
    it('shows error message on fetch failure', async () => {
      queryError = { message: 'Permission denied' };
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Permission denied')).toBeInTheDocument();
      });
    });
  });

  // ── Supabase interaction ──────────────────────────────────────

  describe('Supabase', () => {
    it('queries profiles table on mount', async () => {
      renderPage();
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('profiles');
      });
    });

    it('re-queries on refresh click', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Vernieuwen')).toBeInTheDocument();
      });
      mockFrom.mockClear();
      fireEvent.click(screen.getByText('Vernieuwen').closest('button')!);
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('profiles');
      });
    });
  });
});
