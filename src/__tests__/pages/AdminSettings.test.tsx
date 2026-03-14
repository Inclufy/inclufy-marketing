import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/contexts/LanguageContext';

// ─── Mock data ─────────────────────────────────────────────────────

const mockSettings = {
  id: 'settings-1',
  general: { site_name: 'Inclufy', default_language: 'nl', max_upload_size_mb: 10, support_email: 'support@inclufy.com', maintenance_mode: false },
  security: { require_2fa: false, session_timeout_minutes: 60, max_login_attempts: 5, password_min_length: 8, allowed_domains: '' },
  email: { smtp_host: 'smtp.resend.com', smtp_port: '587', smtp_from: 'noreply@inclufy.com', email_provider: 'resend' },
  features: { ai_copilot_enabled: true, trial_days: 14, max_campaigns_free: 3, max_contacts_free: 500, allow_registrations: true, demo_mode: false },
  billing: { currency: 'EUR', tax_rate: 21, stripe_configured: true },
};

// ─── Supabase mock ─────────────────────────────────────────────────

let settingsData: any = mockSettings;
let fetchError: any = null;
let upsertError: any = null;

const mockUpsert = vi.fn().mockImplementation(() => Promise.resolve({ error: upsertError }));

const mockFrom = vi.fn().mockImplementation(() => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: settingsData, error: fetchError }),
    upsert: mockUpsert,
  };
  return chain;
});

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: () => Promise.resolve({ data: { user: { id: 'admin-1' } } }) },
    from: (table: string) => mockFrom(table),
  },
}));

const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// ─── Import after mocks ────────────────────────────────────────────

import AdminSettings from '@/pages/admin/AdminSettings';

// ─── Render helper ─────────────────────────────────────────────────

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LanguageProvider>
          <AdminSettings />
        </LanguageProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('AdminSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('inclufy_lang');
    settingsData = mockSettings;
    fetchError = null;
    upsertError = null;
  });

  // ── Header ────────────────────────────────────────────────────

  describe('Header', () => {
    it('renders Systeeminstellingen heading in NL', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Systeeminstellingen')).toBeInTheDocument();
      });
    });

    it('renders System Settings heading in EN', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('System Settings')).toBeInTheDocument();
      });
    });

    it('renders Paramètres Système heading in FR', async () => {
      localStorage.setItem('inclufy_lang', 'fr');
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Paramètres Système')).toBeInTheDocument();
      });
    });

    it('renders Save All button in NL', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Alles Opslaan')).toBeInTheDocument();
      });
    });

    it('renders Save All button in EN', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Save All')).toBeInTheDocument();
      });
    });
  });

  // ── Tabs ──────────────────────────────────────────────────────

  describe('Tabs (NL)', () => {
    it('renders Algemeen tab', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Algemeen')).toBeInTheDocument();
      });
    });

    it('renders Beveiliging tab', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Beveiliging')).toBeInTheDocument();
      });
    });

    it('renders E-mail tab', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('E-mail')).toBeInTheDocument();
      });
    });

    it('renders Functies tab', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Functies')).toBeInTheDocument();
      });
    });

    it('renders Facturering tab', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Facturering')).toBeInTheDocument();
      });
    });

    it('renders Onderhoud tab', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Onderhoud')).toBeInTheDocument();
      });
    });

    it('renders API Sleutels tab', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('API Sleutels')).toBeInTheDocument();
      });
    });
  });

  describe('Tabs (EN)', () => {
    beforeEach(() => { localStorage.setItem('inclufy_lang', 'en'); });

    it('renders all EN tab labels', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('General')).toBeInTheDocument();
        expect(screen.getByText('Security')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Features')).toBeInTheDocument();
        expect(screen.getByText('Billing')).toBeInTheDocument();
        expect(screen.getByText('Maintenance')).toBeInTheDocument();
        expect(screen.getByText('API Keys')).toBeInTheDocument();
      });
    });
  });

  // ── General tab content ───────────────────────────────────────

  describe('General tab (NL)', () => {
    it('renders Algemene Instellingen card title', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Algemene Instellingen')).toBeInTheDocument();
      });
    });

    it('renders Standaardtaal label', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Standaardtaal')).toBeInTheDocument();
      });
    });

    it('renders Max Upload (MB) label', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Max Upload (MB)')).toBeInTheDocument();
      });
    });

    it('renders Sitenaam label', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Sitenaam')).toBeInTheDocument();
      });
    });

    it('renders Support E-mail label', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Support E-mail')).toBeInTheDocument();
      });
    });
  });

  // ── Tab switching ─────────────────────────────────────────────

  describe('Tab switching', () => {
    it('switches to Security tab and shows content', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Beveiliging')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Beveiliging'));
      await waitFor(() => {
        expect(screen.getByText('Beveiligingsinstellingen')).toBeInTheDocument();
        expect(screen.getByText('Sessie Timeout (minuten)')).toBeInTheDocument();
        expect(screen.getByText('Max Inlogpogingen')).toBeInTheDocument();
      });
    });

    it('switches to Email tab and shows content', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('E-mail')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('E-mail'));
      await waitFor(() => {
        expect(screen.getByText('E-mailconfiguratie')).toBeInTheDocument();
        expect(screen.getByText('SMTP Host')).toBeInTheDocument();
        expect(screen.getByText('SMTP Port')).toBeInTheDocument();
      });
    });

    it('switches to Features tab and shows content', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Functies')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Functies'));
      await waitFor(() => {
        expect(screen.getByText('Functie Instellingen')).toBeInTheDocument();
        expect(screen.getByText('Proefperiode (dagen)')).toBeInTheDocument();
      });
    });

    it('switches to Billing tab and shows content', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Facturering')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Facturering'));
      await waitFor(() => {
        expect(screen.getByText('Facturatie-instellingen')).toBeInTheDocument();
        expect(screen.getByText('Valuta')).toBeInTheDocument();
        expect(screen.getByText('BTW Tarief (%)')).toBeInTheDocument();
      });
    });

    it('switches to Maintenance tab and shows content', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Onderhoud')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Onderhoud'));
      await waitFor(() => {
        expect(screen.getByText('Onderhoudsmodus')).toBeInTheDocument();
        expect(screen.getByText('Database Status')).toBeInTheDocument();
        expect(screen.getByText('API Server')).toBeInTheDocument();
      });
    });

    it('switches to API Keys tab', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('API Sleutels')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('API Sleutels'));
      await waitFor(() => {
        // The API keys heading should appear
        const headings = screen.getAllByText('API Sleutels');
        expect(headings.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  // ── Maintenance tab details ───────────────────────────────────

  describe('Maintenance tab', () => {
    it('shows Uitgeschakeld badge for maintenance mode', async () => {
      renderPage();
      // Wait for settings to load before clicking the tab
      await waitFor(() => {
        expect(screen.getByText('Onderhoud')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Onderhoud'));
      await waitFor(() => {
        expect(screen.getByText('Uitgeschakeld')).toBeInTheDocument();
      });
    });

    it('shows Verbonden badge for database status', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Onderhoud')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Onderhoud'));
      await waitFor(() => {
        expect(screen.getByText(/Verbonden/)).toBeInTheDocument();
      });
    });

    it('shows Online badge for API Server', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Onderhoud')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Onderhoud'));
      await waitFor(() => {
        expect(screen.getByText('Online')).toBeInTheDocument();
      });
    });
  });

  // ── Save functionality ────────────────────────────────────────

  describe('Save functionality', () => {
    it('calls upsert on admin_settings when saving', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Alles Opslaan')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Alles Opslaan').closest('button')!);
      await waitFor(() => {
        expect(mockUpsert).toHaveBeenCalled();
      });
    });

    it('shows success toast on save', async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Alles Opslaan')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Alles Opslaan').closest('button')!);
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Instellingen opgeslagen!' }),
        );
      });
    });

    it('shows destructive toast on save failure', async () => {
      upsertError = { message: 'Upsert failed' };
      renderPage();
      await waitFor(() => {
        expect(screen.getByText('Alles Opslaan')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Alles Opslaan').closest('button')!);
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Opslaan mislukt', variant: 'destructive' }),
        );
      });
    });
  });

  // ── Supabase ──────────────────────────────────────────────────

  describe('Supabase', () => {
    it('queries admin_settings table on mount', async () => {
      renderPage();
      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('admin_settings');
      });
    });

    it('shows destructive toast on fetch error', async () => {
      fetchError = { message: 'Table not found' };
      renderPage();
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ variant: 'destructive' }),
        );
      });
    });
  });
});
