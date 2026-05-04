import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import CookieConsent from '@/components/CookieConsent';
import { SalesChatWidget } from '@/components/sales/SalesChatWidget';
import { noFlashScript } from '@/components/theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'Inclufy Marketing',
  description: 'AI-Powered Marketing Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))] antialiased">
        <Providers>{children}</Providers>
        <SalesChatWidget />
        <CookieConsent />
      </body>
    </html>
  );
}
