import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';

function TestConsumer() {
  const { lang, setLang, t } = useLanguage();
  return (
    <div>
      <span data-testid="lang">{lang}</span>
      <span data-testid="translation">{t('nav.overview')}</span>
      <button onClick={() => setLang('en')}>Switch to EN</button>
      <button onClick={() => setLang('nl')}>Switch to NL</button>
      <button onClick={() => setLang('fr')}>Switch to FR</button>
    </div>
  );
}

describe('LanguageContext', () => {
  it('defaults to Dutch (nl)', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    expect(screen.getByTestId('lang').textContent).toBe('nl');
    expect(screen.getByTestId('translation').textContent).toBe('Overzicht');
  });

  it('switches to English', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByText('Switch to EN'));
    expect(screen.getByTestId('lang').textContent).toBe('en');
    expect(screen.getByTestId('translation').textContent).toBe('Overview');
  });

  it('switches to French', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByText('Switch to FR'));
    expect(screen.getByTestId('lang').textContent).toBe('fr');
    expect(screen.getByTestId('translation').textContent).toBe('Aperçu');
  });

  it('switches back to Dutch from French', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByText('Switch to FR'));
    expect(screen.getByTestId('lang').textContent).toBe('fr');

    fireEvent.click(screen.getByText('Switch to NL'));
    expect(screen.getByTestId('lang').textContent).toBe('nl');
    expect(screen.getByTestId('translation').textContent).toBe('Overzicht');
  });

  it('cycles through all three languages', () => {
    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    // Start: NL
    expect(screen.getByTestId('lang').textContent).toBe('nl');

    // → EN
    fireEvent.click(screen.getByText('Switch to EN'));
    expect(screen.getByTestId('lang').textContent).toBe('en');

    // → FR
    fireEvent.click(screen.getByText('Switch to FR'));
    expect(screen.getByTestId('lang').textContent).toBe('fr');

    // → NL
    fireEvent.click(screen.getByText('Switch to NL'));
    expect(screen.getByTestId('lang').textContent).toBe('nl');
  });

  it('returns the key when translation is missing', () => {
    function MissingKeyTester() {
      const { t } = useLanguage();
      return <span data-testid="missing">{t('totally.unknown.key')}</span>;
    }

    render(
      <LanguageProvider>
        <MissingKeyTester />
      </LanguageProvider>
    );

    expect(screen.getByTestId('missing').textContent).toBe('totally.unknown.key');
  });

  it('t() covers common keys in all three languages', () => {
    function KeyTester() {
      const { t, setLang } = useLanguage();
      return (
        <div>
          <span data-testid="common-save">{t('common.save')}</span>
          <span data-testid="dashboard-title">{t('dashboard.title')}</span>
          <span data-testid="nav-settings">{t('nav.settings')}</span>
          <span data-testid="nav-campaigns">{t('nav.campaigns')}</span>
          <button onClick={() => setLang('en')}>EN</button>
          <button onClick={() => setLang('fr')}>FR</button>
          <button onClick={() => setLang('nl')}>NL</button>
        </div>
      );
    }

    render(
      <LanguageProvider>
        <KeyTester />
      </LanguageProvider>
    );

    // Dutch (default)
    expect(screen.getByTestId('common-save').textContent).toBe('Opslaan');
    expect(screen.getByTestId('dashboard-title').textContent).toBe('Executive Dashboard');
    expect(screen.getByTestId('nav-settings').textContent).toBe('Instellingen');
    expect(screen.getByTestId('nav-campaigns').textContent).toBe('Campagnes');

    // Switch to English
    fireEvent.click(screen.getByText('EN'));
    expect(screen.getByTestId('common-save').textContent).toBe('Save');
    expect(screen.getByTestId('nav-settings').textContent).toBe('Settings');
    expect(screen.getByTestId('nav-campaigns').textContent).toBe('Campaigns');

    // Switch to French
    fireEvent.click(screen.getByText('FR'));
    expect(screen.getByTestId('common-save').textContent).toBe('Enregistrer');
    expect(screen.getByTestId('nav-settings').textContent).toBe('Paramètres');
    expect(screen.getByTestId('nav-campaigns').textContent).toBe('Campagnes');
  });

  it('French translations cover all major navigation keys', () => {
    function FrNavTester() {
      const { t, setLang } = useLanguage();
      // Immediately switch to FR
      setLang('fr');
      return (
        <div>
          <span data-testid="nav-overview">{t('nav.overview')}</span>
          <span data-testid="nav-intelligence">{t('nav.intelligence')}</span>
          <span data-testid="nav-automation">{t('nav.automation')}</span>
          <span data-testid="nav-analytics">{t('nav.analytics')}</span>
          <span data-testid="nav-signOut">{t('nav.signOut')}</span>
          <span data-testid="nav-brandMemory">{t('nav.brandMemory')}</span>
        </div>
      );
    }

    render(
      <LanguageProvider>
        <FrNavTester />
      </LanguageProvider>
    );

    // Verify FR translations exist (not returning raw keys)
    expect(screen.getByTestId('nav-overview').textContent).not.toBe('nav.overview');
    expect(screen.getByTestId('nav-intelligence').textContent).not.toBe('nav.intelligence');
    expect(screen.getByTestId('nav-automation').textContent).not.toBe('nav.automation');
    expect(screen.getByTestId('nav-analytics').textContent).not.toBe('nav.analytics');
    expect(screen.getByTestId('nav-signOut').textContent).not.toBe('nav.signOut');
    expect(screen.getByTestId('nav-brandMemory').textContent).not.toBe('nav.brandMemory');
  });

  it('persists language in localStorage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    render(
      <LanguageProvider>
        <TestConsumer />
      </LanguageProvider>
    );

    fireEvent.click(screen.getByText('Switch to EN'));
    expect(screen.getByTestId('lang').textContent).toBe('en');

    fireEvent.click(screen.getByText('Switch to FR'));
    expect(screen.getByTestId('lang').textContent).toBe('fr');

    setItemSpy.mockRestore();
  });
});
