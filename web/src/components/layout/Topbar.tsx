'use client';

import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function Topbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-sm px-8">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Zoek events, campaigns, proposals..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700">{user?.email?.split('@')[0] || 'User'}</span>
        </div>
      </div>
    </header>
  );
}
