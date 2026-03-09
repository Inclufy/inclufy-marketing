import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';

// ─── Mocks ──────────────────────────────────────────────────────────

const mockSignIn = vi.fn();
const mockSignInWithGoogle = vi.fn();
const mockSignInWithGitHub = vi.fn();
const mockVerifyMfa = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signIn: mockSignIn,
    signInWithGoogle: mockSignInWithGoogle,
    signInWithGitHub: mockSignInWithGitHub,
    verifyMfa: mockVerifyMfa,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null, pathname: '/login' }),
  };
});

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { user_metadata: { onboarding_completed: true } } } }),
      mfa: { listFactors: vi.fn().mockResolvedValue({ data: { totp: [] } }) },
      signOut: vi.fn().mockResolvedValue({}),
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
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Import AFTER mocks
import Login from '@/pages/auth/Login';

function renderLogin() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <Login />
      </LanguageProvider>
    </MemoryRouter>
  );
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.removeItem('inclufy_lang');
  });

  describe('renders form elements', () => {
    it('renders email and password inputs', () => {
      renderLogin();
      expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
      expect(screen.getByLabelText(/wachtwoord/i)).toBeInTheDocument();
    });

    it('renders logo', () => {
      renderLogin();
      const logos = screen.getAllByAltText('Inclufy - AI Marketing');
      expect(logos.length).toBeGreaterThanOrEqual(1);
    });

    it('renders submit button', () => {
      renderLogin();
      expect(screen.getByText('Inloggen')).toBeInTheDocument();
    });

    it('renders social login buttons', () => {
      renderLogin();
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
    });

    it('renders signup link', () => {
      renderLogin();
      expect(screen.getByText('Gratis aanmelden')).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      renderLogin();
      expect(screen.getByText('Wachtwoord vergeten?')).toBeInTheDocument();
    });

    it('renders remember me checkbox', () => {
      renderLogin();
      expect(screen.getByText('Onthoud mij')).toBeInTheDocument();
    });
  });

  describe('form interactions', () => {
    it('updates email input value', () => {
      renderLogin();
      const emailInput = screen.getByLabelText('E-mail') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      expect(emailInput.value).toBe('test@example.com');
    });

    it('updates password input value', () => {
      renderLogin();
      const passwordInput = screen.getByLabelText(/wachtwoord/i) as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'secret123' } });
      expect(passwordInput.value).toBe('secret123');
    });

    it('toggles password visibility', () => {
      renderLogin();
      const passwordInput = screen.getByLabelText(/wachtwoord/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      // Find the eye toggle button (it's the button inside the password field)
      const toggleButtons = screen.getAllByRole('button');
      const eyeButton = toggleButtons.find(
        (btn) => btn.className.includes('absolute') && btn.className.includes('right-3')
      );
      if (eyeButton) {
        fireEvent.click(eyeButton);
        expect(passwordInput.type).toBe('text');
      }
    });

    it('calls signIn on form submit', async () => {
      mockSignIn.mockResolvedValueOnce({ mfaRequired: false });
      renderLogin();

      const emailInput = screen.getByLabelText('E-mail');
      const passwordInput = screen.getByLabelText(/wachtwoord/i);

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      const submitBtn = screen.getByText('Inloggen');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('navigates to dashboard on successful login', async () => {
      mockSignIn.mockResolvedValueOnce({ mfaRequired: false });
      renderLogin();

      fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/wachtwoord/i), { target: { value: 'pass' } });
      fireEvent.click(screen.getByText('Inloggen'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });

    it('calls signInWithGoogle when Google button is clicked', () => {
      renderLogin();
      fireEvent.click(screen.getByText('Google'));
      expect(mockSignInWithGoogle).toHaveBeenCalled();
    });

    it('calls signInWithGitHub when GitHub button is clicked', () => {
      renderLogin();
      fireEvent.click(screen.getByText('GitHub'));
      expect(mockSignInWithGitHub).toHaveBeenCalled();
    });
  });

  describe('language support', () => {
    it('shows English text when EN is set', () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderLogin();

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByText('Sign in')).toBeInTheDocument();
      expect(screen.getByText('Forgot password?')).toBeInTheDocument();
    });

    it('shows French text when FR is set', () => {
      localStorage.setItem('inclufy_lang', 'fr');
      renderLogin();

      expect(screen.getByText('Bon retour')).toBeInTheDocument();
      expect(screen.getByText('Se connecter')).toBeInTheDocument();
      expect(screen.getByText('Mot de passe oublié ?')).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('shows error toast on failed login', async () => {
      const { toast } = await import('sonner');
      mockSignIn.mockRejectedValueOnce(new Error('Invalid credentials'));
      renderLogin();

      fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'bad@email.com' } });
      fireEvent.change(screen.getByLabelText(/wachtwoord/i), { target: { value: 'wrong' } });
      fireEvent.click(screen.getByText('Inloggen'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
      });
    });
  });
});
