import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import nl, { type Translations } from './locales/nl';
import en from './locales/en';
import fr from './locales/fr';

// ─── Locale Types ────────────────────────────────────────────────────────────

export type Locale = 'nl' | 'en' | 'fr';

export const LOCALE_LABELS: Record<Locale, string> = {
  nl: 'Nederlands',
  en: 'English',
  fr: 'Fran\u00E7ais',
};

const locales: Record<Locale, Translations> = { nl, en, fr };

const STORAGE_KEY = 'inclufy_go_locale';

// ─── Context ─────────────────────────────────────────────────────────────────

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translations;
}

export const I18nContext = createContext<I18nContextType>({
  locale: 'nl',
  setLocale: () => {},
  t: nl,
});

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTranslation() {
  return useContext(I18nContext);
}

// ─── Provider (used in App.tsx) ──────────────────────────────────────────────

export function useI18nProvider() {
  const [locale, setLocaleState] = useState<Locale>('nl');

  // Load saved locale on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved && (saved === 'nl' || saved === 'en' || saved === 'fr')) {
        setLocaleState(saved as Locale);
      }
    }).catch(() => {});
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    AsyncStorage.setItem(STORAGE_KEY, newLocale).catch(() => {});
  }, []);

  const t = locales[locale];

  return { locale, setLocale, t };
}

export type { Translations };
