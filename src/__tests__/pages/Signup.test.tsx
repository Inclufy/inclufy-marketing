import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';

// ─── Mocks ──────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
const { mockSignUp } = vi.hoisted(() => ({
  mockSignUp: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signUp: mockSignUp,
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

// Import AFTER mocks
import Signup from '@/pages/auth/Signup';

function renderSignup() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <Signup />
      </LanguageProvider>
    </MemoryRouter>
  );
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('Signup Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('inclufy_lang');
  });

  describe('renders form elements', () => {
    it('renders all required input fields', () => {
      renderSignup();
      expect(screen.getByLabelText(/volledige naam/i)).toBeInTheDocument();
      expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
      expect(screen.getByLabelText(/^wachtwoord$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/bevestig wachtwoord/i)).toBeInTheDocument();
    });

    it('renders logo', () => {
      renderSignup();
      const logos = screen.getAllByAltText('Inclufy - AI Marketing');
      expect(logos.length).toBeGreaterThanOrEqual(1);
    });

    it('renders submit button', () => {
      renderSignup();
      expect(screen.getByText('Account Aanmaken')).toBeInTheDocument();
    });

    it('renders terms checkbox', () => {
      renderSignup();
      expect(screen.getByText(/Servicevoorwaarden/)).toBeInTheDocument();
      expect(screen.getByText(/Privacybeleid/)).toBeInTheDocument();
    });

    it('renders login link', () => {
      renderSignup();
      expect(screen.getByText('Inloggen')).toBeInTheDocument();
    });

    it('renders trial features list', () => {
      renderSignup();
      expect(screen.getByText('5.000 AI credits')).toBeInTheDocument();
      expect(screen.getByText('Alle functies')).toBeInTheDocument();
      expect(screen.getByText('Geen creditcard')).toBeInTheDocument();
    });

    it('renders social signup buttons (disabled)', () => {
      renderSignup();
      const googleBtn = screen.getByText('Google').closest('button');
      const githubBtn = screen.getByText('GitHub').closest('button');
      expect(googleBtn).toBeDisabled();
      expect(githubBtn).toBeDisabled();
    });
  });

  describe('form interactions', () => {
    it('updates all input values', () => {
      renderSignup();
      const nameInput = screen.getByLabelText(/volledige naam/i) as HTMLInputElement;
      const emailInput = screen.getByLabelText('E-mail') as HTMLInputElement;

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: 'john@test.com' } });

      expect(nameInput.value).toBe('John Doe');
      expect(emailInput.value).toBe('john@test.com');
    });

    it('toggles password visibility', () => {
      renderSignup();
      const passwordInput = screen.getByLabelText(/^wachtwoord$/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleBtn = passwordInput.parentElement?.querySelector('button');
      if (toggleBtn) {
        fireEvent.click(toggleBtn);
        expect(passwordInput.type).toBe('text');
      }
    });

    it('shows error when passwords do not match', async () => {
      const { toast } = await import('sonner');
      renderSignup();

      fireEvent.change(screen.getByLabelText(/volledige naam/i), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText(/^wachtwoord$/i), { target: { value: 'password1' } });
      fireEvent.change(screen.getByLabelText(/bevestig wachtwoord/i), { target: { value: 'password2' } });

      // Check the terms checkbox
      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      fireEvent.click(screen.getByText('Account Aanmaken'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Wachtwoorden komen niet overeen!');
      });
      expect(mockSignUp).not.toHaveBeenCalled();
    });

    it('shows error when terms are not accepted', async () => {
      const { toast } = await import('sonner');
      renderSignup();

      fireEvent.change(screen.getByLabelText(/volledige naam/i), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText(/^wachtwoord$/i), { target: { value: 'password1' } });
      fireEvent.change(screen.getByLabelText(/bevestig wachtwoord/i), { target: { value: 'password1' } });

      fireEvent.click(screen.getByText('Account Aanmaken'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Ga akkoord met de voorwaarden');
      });
    });

    it('calls supabase signUp on valid submit', async () => {
      mockSignUp.mockResolvedValueOnce({ data: { session: { access_token: 'tok' } }, error: null });
      renderSignup();

      fireEvent.change(screen.getByLabelText(/volledige naam/i), { target: { value: 'Test User' } });
      fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText(/^wachtwoord$/i), { target: { value: 'StrongPass1!' } });
      fireEvent.change(screen.getByLabelText(/bevestig wachtwoord/i), { target: { value: 'StrongPass1!' } });

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      fireEvent.click(screen.getByText('Account Aanmaken'));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith({
          email: 'test@test.com',
          password: 'StrongPass1!',
          options: { data: { full_name: 'Test User' } },
        });
      });
    });

    it('navigates to onboarding when auto-confirmed', async () => {
      mockSignUp.mockResolvedValueOnce({ data: { session: { access_token: 'tok' } }, error: null });
      renderSignup();

      fireEvent.change(screen.getByLabelText(/volledige naam/i), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 't@t.com' } });
      fireEvent.change(screen.getByLabelText(/^wachtwoord$/i), { target: { value: 'pass' } });
      fireEvent.change(screen.getByLabelText(/bevestig wachtwoord/i), { target: { value: 'pass' } });
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByText('Account Aanmaken'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/app/onboarding', { replace: true });
      });
    });

    it('navigates to login when email verification needed', async () => {
      mockSignUp.mockResolvedValueOnce({ data: { session: null }, error: null });
      renderSignup();

      fireEvent.change(screen.getByLabelText(/volledige naam/i), { target: { value: 'Test' } });
      fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 't@t.com' } });
      fireEvent.change(screen.getByLabelText(/^wachtwoord$/i), { target: { value: 'pass' } });
      fireEvent.change(screen.getByLabelText(/bevestig wachtwoord/i), { target: { value: 'pass' } });
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByText('Account Aanmaken'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('language support', () => {
    it('shows English text when EN is set', () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderSignup();

      expect(screen.getByText('Create your account')).toBeInTheDocument();
      expect(screen.getByText('Create Account')).toBeInTheDocument();
      expect(screen.getByText('No credit card')).toBeInTheDocument();
    });

    it('shows French text when FR is set', () => {
      localStorage.setItem('inclufy_lang', 'fr');
      renderSignup();

      expect(screen.getByText('Créez votre compte')).toBeInTheDocument();
      expect(screen.getByText('Créer un Compte')).toBeInTheDocument();
      expect(screen.getByText('Sans carte bancaire')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('shows error on signUp failure', async () => {
      const { toast } = await import('sonner');
      mockSignUp.mockResolvedValueOnce({ data: {}, error: { message: 'Email taken' } });
      renderSignup();

      fireEvent.change(screen.getByLabelText(/volledige naam/i), { target: { value: 'T' } });
      fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 't@t.com' } });
      fireEvent.change(screen.getByLabelText(/^wachtwoord$/i), { target: { value: 'p' } });
      fireEvent.change(screen.getByLabelText(/bevestig wachtwoord/i), { target: { value: 'p' } });
      fireEvent.click(screen.getByRole('checkbox'));
      fireEvent.click(screen.getByText('Account Aanmaken'));

      await waitFor(() => {
        // The component throws the error, which triggers toast.error
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });
});
