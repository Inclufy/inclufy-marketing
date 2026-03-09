import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from '@/contexts/LanguageContext';

// ─── Mocks ──────────────────────────────────────────────────────────

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn().mockResolvedValue({ data: [] }) },
  default: { get: vi.fn().mockResolvedValue({ data: [] }) },
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, custom, whileInView,
        viewport, whileHover, whileTap, layout, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

// Import AFTER mocks
import ContentHub from '@/pages/ContentHub';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function renderContentHub() {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LanguageProvider>
          <ContentHub />
        </LanguageProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('ContentHub', () => {
  beforeEach(() => {
    localStorage.removeItem('inclufy_lang');
  });

  describe('renders creation tools (NL)', () => {
    it('renders AI Writer tool', () => {
      renderContentHub();
      expect(screen.getByText('AI Schrijver')).toBeInTheDocument();
    });

    it('renders Social Media Posts tool', () => {
      renderContentHub();
      expect(screen.getByText('Social Media Posts')).toBeInTheDocument();
    });

    it('renders Image Generator tool', () => {
      renderContentHub();
      expect(screen.getByText('Afbeeldingen')).toBeInTheDocument();
    });

    it('renders Video Creator tool', () => {
      renderContentHub();
      expect(screen.getByText('Video Creator')).toBeInTheDocument();
    });

    it('renders Email Campaigns tool', () => {
      renderContentHub();
      expect(screen.getByText('E-mail Campagnes')).toBeInTheDocument();
    });

    it('renders Tutorial Creator tool', () => {
      renderContentHub();
      expect(screen.getByText('Tutorial Creator')).toBeInTheDocument();
    });
  });

  describe('tool descriptions (NL)', () => {
    it('shows AI Writer description', () => {
      renderContentHub();
      expect(screen.getByText(/Blogs, artikelen en webteksten genereren/)).toBeInTheDocument();
    });

    it('shows Social Media description', () => {
      renderContentHub();
      expect(screen.getByText(/Posts voor Instagram, LinkedIn/)).toBeInTheDocument();
    });

    it('shows Image Generator description', () => {
      renderContentHub();
      expect(screen.getByText(/Creëer unieke visuals/)).toBeInTheDocument();
    });
  });

  describe('tool badges', () => {
    it('renders GPT-4 badge on AI Writer', () => {
      renderContentHub();
      expect(screen.getByText('GPT-4')).toBeInTheDocument();
    });

    it('renders AI badge on Social Media', () => {
      renderContentHub();
      expect(screen.getByText('AI')).toBeInTheDocument();
    });

    it('renders DALL-E badge on Image Generator', () => {
      renderContentHub();
      expect(screen.getByText('DALL-E')).toBeInTheDocument();
    });
  });

  describe('tool links', () => {
    it('links AI Writer to /app/content/writer', () => {
      renderContentHub();
      const writerLink = screen.getByText('AI Schrijver').closest('a');
      expect(writerLink?.getAttribute('href')).toBe('/app/content/writer');
    });

    it('links Email Campaigns to /app/campaigns/email', () => {
      renderContentHub();
      const emailLink = screen.getByText('E-mail Campagnes').closest('a');
      expect(emailLink?.getAttribute('href')).toBe('/app/campaigns/email');
    });

    it('links Social Media to /app/campaigns/social', () => {
      renderContentHub();
      const socialLink = screen.getByText('Social Media Posts').closest('a');
      expect(socialLink?.getAttribute('href')).toBe('/app/campaigns/social');
    });
  });

  describe('language support', () => {
    it('shows English tool names when EN is selected', async () => {
      localStorage.setItem('inclufy_lang', 'en');
      renderContentHub();

      expect(screen.getByText('AI Writer')).toBeInTheDocument();
      expect(screen.getByText('Image Generator')).toBeInTheDocument();
      expect(screen.getByText('Email Campaigns')).toBeInTheDocument();
    });

    it('shows French tool names when FR is selected', async () => {
      localStorage.setItem('inclufy_lang', 'fr');
      renderContentHub();

      expect(screen.getByText('Rédacteur IA')).toBeInTheDocument();
      expect(screen.getByText("Générateur d'Images")).toBeInTheDocument();
      expect(screen.getByText('Campagnes E-mail')).toBeInTheDocument();
    });
  });
});
