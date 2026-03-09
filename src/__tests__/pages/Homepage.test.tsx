import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...stripMotionProps(props)}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...stripMotionProps(props)}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...stripMotionProps(props)}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...stripMotionProps(props)}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Strip motion-specific props to avoid React warnings
function stripMotionProps(props: Record<string, any>) {
  const {
    initial, animate, exit, variants, custom, whileInView, viewport,
    whileHover, whileTap, layout, transition, ...rest
  } = props;
  return rest;
}

// Import AFTER mocks
import Homepage from '@/pages/Homepage';

function renderHomepage() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <Homepage />
      </LanguageProvider>
    </MemoryRouter>
  );
}

describe('Homepage', () => {
  beforeEach(() => {
    // Clear localStorage to reset language between tests
    localStorage.removeItem('inclufy_lang');
  });

  describe('renders core sections', () => {
    it('renders the navigation bar with logo', () => {
      renderHomepage();
      const logos = screen.getAllByAltText('Inclufy - AI Marketing');
      expect(logos.length).toBeGreaterThanOrEqual(1); // nav + footer both have logo
    });

    it('renders the language switcher with 3 flags', () => {
      renderHomepage();
      const flags = screen.getAllByRole('button').filter(
        (btn) => btn.textContent === '🇳🇱' || btn.textContent === '🇬🇧' || btn.textContent === '🇫🇷'
      );
      expect(flags.length).toBe(3);
    });

    it('renders hero heading in English by default when set to EN', () => {
      renderHomepage();
      // Switch to EN
      const enButton = screen.getAllByRole('button').find((btn) => btn.textContent === '🇬🇧');
      if (enButton) fireEvent.click(enButton);

      expect(screen.getByText(/The Future of/i)).toBeInTheDocument();
      expect(screen.getByText(/is Here/i)).toBeInTheDocument();
    });

    it('renders signup and login links', () => {
      renderHomepage();
      // Switch to EN for predictable text
      const enButton = screen.getAllByRole('button').find((btn) => btn.textContent === '🇬🇧');
      if (enButton) fireEvent.click(enButton);

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getAllByText('Get Started').length).toBeGreaterThanOrEqual(1);
    });

    it('renders stats section', () => {
      renderHomepage();
      expect(screen.getByText('10x')).toBeInTheDocument();
      expect(screen.getByText('80%')).toBeInTheDocument();
      expect(screen.getByText('3.2x')).toBeInTheDocument();
      expect(screen.getByText('24/7')).toBeInTheDocument();
    });

    it('renders feature cards', () => {
      renderHomepage();
      expect(screen.getByText('Brand Memory AI')).toBeInTheDocument();
    });

    it('renders testimonial names', () => {
      renderHomepage();
      expect(screen.getByText('Amara Osei')).toBeInTheDocument();
      expect(screen.getByText('Daniel Reeves')).toBeInTheDocument();
      expect(screen.getByText('Leila Nakamura')).toBeInTheDocument();
    });

    it('renders the footer', () => {
      renderHomepage();
      expect(screen.getByText(/Inclufy Marketing/i)).toBeInTheDocument();
    });
  });

  describe('Dutch translations', () => {
    it('shows Dutch content when NL is selected', () => {
      renderHomepage();
      // NL is default — click NL button to ensure
      const nlButton = screen.getAllByRole('button').find((btn) => btn.textContent === '🇳🇱');
      if (nlButton) fireEvent.click(nlButton);

      expect(screen.getByText(/De Toekomst van/i)).toBeInTheDocument();
      expect(screen.getByText(/is Hier/i)).toBeInTheDocument();
      expect(screen.getByText('Inloggen')).toBeInTheDocument();
      expect(screen.getAllByText('Aan de slag').length).toBeGreaterThanOrEqual(1);
    });

    it('shows Dutch nav links', () => {
      renderHomepage();
      // Nav links appear in both nav and footer, so use getAllByText
      expect(screen.getAllByText('Functies').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Hoe het werkt').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Ervaringen').length).toBeGreaterThanOrEqual(1);
    });

    it('shows Dutch stats labels', () => {
      renderHomepage();
      expect(screen.getByText('Snellere Content')).toBeInTheDocument();
      expect(screen.getByText('Minder Handwerk')).toBeInTheDocument();
      expect(screen.getByText('Gemiddelde ROI')).toBeInTheDocument();
      expect(screen.getByText('AI Automatisering')).toBeInTheDocument();
    });

    it('shows Dutch feature section heading', () => {
      renderHomepage();
      expect(screen.getByText('Platform Mogelijkheden')).toBeInTheDocument();
      expect(screen.getByText(/Alles Wat Je Nodig Hebt/i)).toBeInTheDocument();
    });

    it('shows Dutch how-it-works section', () => {
      renderHomepage();
      expect(screen.getByText('Hoe Het Werkt')).toBeInTheDocument();
      expect(screen.getByText('Stel je merk in')).toBeInTheDocument();
      expect(screen.getByText('Genereer & Orkestreer')).toBeInTheDocument();
      expect(screen.getByText('Meet & Optimaliseer')).toBeInTheDocument();
    });

    it('shows Dutch footer content', () => {
      renderHomepage();
      expect(screen.getByText('Bedrijf')).toBeInTheDocument();
      expect(screen.getByText('Juridisch')).toBeInTheDocument();
      expect(screen.getByText('Over ons')).toBeInTheDocument();
      expect(screen.getByText('Privacybeleid')).toBeInTheDocument();
    });
  });

  describe('French translations', () => {
    it('switches to French and shows FR hero', () => {
      renderHomepage();
      const frButton = screen.getAllByRole('button').find((btn) => btn.textContent === '🇫🇷');
      if (frButton) fireEvent.click(frButton);

      expect(screen.getByText(/L'Avenir du/i)).toBeInTheDocument();
      expect(screen.getByText(/est Là/i)).toBeInTheDocument();
    });

    it('shows French nav links', () => {
      renderHomepage();
      const frButton = screen.getAllByRole('button').find((btn) => btn.textContent === '🇫🇷');
      if (frButton) fireEvent.click(frButton);

      // Nav links appear in both nav and footer
      expect(screen.getAllByText('Fonctionnalités').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Comment ça marche').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Témoignages').length).toBeGreaterThanOrEqual(1);
    });

    it('shows French stats labels', () => {
      renderHomepage();
      const frButton = screen.getAllByRole('button').find((btn) => btn.textContent === '🇫🇷');
      if (frButton) fireEvent.click(frButton);

      expect(screen.getByText('Contenu Plus Rapide')).toBeInTheDocument();
      expect(screen.getByText('Moins de Travail Manuel')).toBeInTheDocument();
      expect(screen.getByText('ROI Moyen')).toBeInTheDocument();
      expect(screen.getByText('Automatisation IA')).toBeInTheDocument();
    });

    it('shows French feature section heading', () => {
      renderHomepage();
      const frButton = screen.getAllByRole('button').find((btn) => btn.textContent === '🇫🇷');
      if (frButton) fireEvent.click(frButton);

      expect(screen.getByText('Capacités de la Plateforme')).toBeInTheDocument();
      expect(screen.getByText(/Tout Ce Dont Vous Avez Besoin/i)).toBeInTheDocument();
    });

    it('shows French how-it-works section', () => {
      renderHomepage();
      const frButton = screen.getAllByRole('button').find((btn) => btn.textContent === '🇫🇷');
      if (frButton) fireEvent.click(frButton);

      expect(screen.getByText('Comment Ça Marche')).toBeInTheDocument();
      expect(screen.getByText('Configurez votre marque')).toBeInTheDocument();
      expect(screen.getByText('Générez & Orchestrez')).toBeInTheDocument();
      expect(screen.getByText('Mesurez & Optimisez')).toBeInTheDocument();
    });

    it('shows French footer content', () => {
      renderHomepage();
      const frButton = screen.getAllByRole('button').find((btn) => btn.textContent === '🇫🇷');
      if (frButton) fireEvent.click(frButton);

      expect(screen.getByText('Entreprise')).toBeInTheDocument();
      expect(screen.getByText('Juridique')).toBeInTheDocument();
      expect(screen.getByText('À Propos')).toBeInTheDocument();
    });

    it('shows French buttons', () => {
      renderHomepage();
      const frButton = screen.getAllByRole('button').find((btn) => btn.textContent === '🇫🇷');
      if (frButton) fireEvent.click(frButton);

      expect(screen.getByText('Connexion')).toBeInTheDocument();
      expect(screen.getAllByText('Commencer').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('language switching interaction', () => {
    it('switches NL → FR → EN → NL maintaining correct content', () => {
      const { container } = renderHomepage();

      // Helper to check hero heading text (split across child elements)
      const getH1Text = () => container.querySelector('h1')?.textContent ?? '';

      // Start: NL
      expect(getH1Text()).toContain('De Toekomst van');

      // → FR
      const frButton = screen.getAllByRole('button').find((btn) => btn.textContent === '🇫🇷');
      if (frButton) fireEvent.click(frButton);
      expect(getH1Text()).toContain("L'Avenir du");

      // → EN
      const enButton = screen.getAllByRole('button').find((btn) => btn.textContent === '🇬🇧');
      if (enButton) fireEvent.click(enButton);
      expect(getH1Text()).toContain('The Future of');

      // → NL
      const nlButton = screen.getAllByRole('button').find((btn) => btn.textContent === '🇳🇱');
      if (nlButton) fireEvent.click(nlButton);
      expect(getH1Text()).toContain('De Toekomst van');
    });
  });
});
