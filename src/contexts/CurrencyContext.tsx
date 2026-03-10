// src/contexts/CurrencyContext.tsx
// Currency context for configurable currency display across the app

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK';

interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  name: { en: string; nl: string; fr: string };
}

const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  EUR: { code: 'EUR', symbol: '€', locale: 'nl-NL', name: { en: 'Euro', nl: 'Euro', fr: 'Euro' } },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', name: { en: 'US Dollar', nl: 'US Dollar', fr: 'Dollar US' } },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', name: { en: 'British Pound', nl: 'Brits Pond', fr: 'Livre Sterling' } },
  CHF: { code: 'CHF', symbol: 'CHF', locale: 'de-CH', name: { en: 'Swiss Franc', nl: 'Zwitserse Frank', fr: 'Franc Suisse' } },
  SEK: { code: 'SEK', symbol: 'kr', locale: 'sv-SE', name: { en: 'Swedish Krona', nl: 'Zweedse Kroon', fr: 'Couronne Suédoise' } },
  NOK: { code: 'NOK', symbol: 'kr', locale: 'nb-NO', name: { en: 'Norwegian Krone', nl: 'Noorse Kroon', fr: 'Couronne Norvégienne' } },
  DKK: { code: 'DKK', symbol: 'kr', locale: 'da-DK', name: { en: 'Danish Krone', nl: 'Deense Kroon', fr: 'Couronne Danoise' } },
  PLN: { code: 'PLN', symbol: 'zł', locale: 'pl-PL', name: { en: 'Polish Zloty', nl: 'Poolse Zloty', fr: 'Zloty Polonais' } },
  CZK: { code: 'CZK', symbol: 'Kč', locale: 'cs-CZ', name: { en: 'Czech Koruna', nl: 'Tsjechische Kroon', fr: 'Couronne Tchèque' } },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  currencyConfig: CurrencyConfig;
  setCurrency: (code: CurrencyCode) => void;
  formatCurrency: (value: number, options?: FormatOptions) => string;
  formatCompact: (value: number) => string;
  symbol: string;
  availableCurrencies: CurrencyConfig[];
}

interface FormatOptions {
  decimals?: number;
  compact?: boolean;
  showSymbol?: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('inclufy_currency');
    return (saved as CurrencyCode) || 'EUR';
  });

  const currencyConfig = CURRENCIES[currency];

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem('inclufy_currency', code);
  }, []);

  // Full formatting: €1.234,56
  const formatCurrency = useCallback((value: number, options?: FormatOptions) => {
    const { decimals = 2, compact = false, showSymbol = true } = options || {};

    if (compact) {
      const config = CURRENCIES[currency];
      if (Math.abs(value) >= 1_000_000) {
        return `${showSymbol ? config.symbol : ''}${(value / 1_000_000).toFixed(decimals)}M`;
      }
      if (Math.abs(value) >= 1_000) {
        return `${showSymbol ? config.symbol : ''}${(value / 1_000).toFixed(decimals)}K`;
      }
      return `${showSymbol ? config.symbol : ''}${value.toFixed(decimals)}`;
    }

    try {
      const formatted = new Intl.NumberFormat(CURRENCIES[currency].locale, {
        style: showSymbol ? 'currency' : 'decimal',
        currency: currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
      return formatted;
    } catch {
      // Fallback
      const config = CURRENCIES[currency];
      return `${showSymbol ? config.symbol : ''}${value.toFixed(decimals)}`;
    }
  }, [currency]);

  // Compact formatting: €12,5K or €1,2M
  const formatCompact = useCallback((value: number) => {
    const config = CURRENCIES[currency];
    if (Math.abs(value) >= 1_000_000) {
      return `${config.symbol}${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
      return `${config.symbol}${(value / 1_000).toFixed(1)}K`;
    }
    return `${config.symbol}${value.toFixed(2)}`;
  }, [currency]);

  const availableCurrencies = Object.values(CURRENCIES);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyConfig,
        setCurrency,
        formatCurrency,
        formatCompact,
        symbol: currencyConfig.symbol,
        availableCurrencies,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

export { CURRENCIES };
