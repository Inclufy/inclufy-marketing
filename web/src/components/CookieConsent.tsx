'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'all');
    setVisible(false);
  };

  const handleEssential = () => {
    localStorage.setItem('cookie-consent', 'essential');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 px-4 py-4 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="flex-1 text-sm text-gray-300">
          We gebruiken cookies voor essentiële functionaliteit en om uw ervaring te verbeteren.{' '}
          <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors">
            Meer informatie
          </Link>
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={handleEssential}
            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors border border-gray-600 hover:border-gray-500"
          >
            Alleen noodzakelijk
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
          >
            Accepteren
          </button>
        </div>
      </div>
    </div>
  );
}
