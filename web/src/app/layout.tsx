import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import CookieConsent from '@/components/CookieConsent';

export const metadata: Metadata = {
  title: 'Inclufy Marketing',
  description: 'AI-Powered Marketing Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Providers>{children}</Providers>
        <CookieConsent />
      </body>
    </html>
  );
}
