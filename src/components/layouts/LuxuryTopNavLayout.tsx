// src/components/layouts/LuxuryTopNavLayout.tsx
// Layout met sidebar navigatie + minimale top bar (ProjeXtPal-stijl)

import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { CopilotProvider, useCopilot } from '@/contexts/CopilotContext';
import SideNav from '@/components/navigation/SideNav';
import AICopilot from '@/components/AICopilot';
import {
  Sun, Moon, Globe, LogOut, Sparkles, Home, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import NotificationCenter from '@/components/NotificationCenter';

function LayoutInner() {
  const [sideNavCollapsed, setSideNavCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const { isOpen: copilotOpen, initialContext, openCopilot, closeCopilot, clearInitialContext } = useCopilot();

  const email = user?.email || 'sami@inclufy.com';
  const initials = (user?.user_metadata?.full_name || email).charAt(0).toUpperCase();

  // Theme toggle
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const toggleLang = () => setLang(lang === 'nl' ? 'en' : lang === 'en' ? 'fr' : 'nl');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const sideW = sideNavCollapsed ? 68 : 260;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ─── Sidebar ──────────────────────────────────────── */}
      <SideNav
        collapsed={sideNavCollapsed}
        onToggle={() => setSideNavCollapsed(prev => !prev)}
      />

      {/* ─── Top Bar ──────────────────────────────────────── */}
      <header
        className="fixed top-0 right-0 z-30 h-14 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 transition-all duration-300"
        style={{ left: sideW }}
      >
        {/* Left: Search */}
        <div className="flex items-center gap-3">
          {searchOpen ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder={t('common.search') + '...'}
                className="pl-10 pr-4 w-72 h-9"
                autoFocus
                onBlur={() => setSearchOpen(false)}
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 rounded">
                ESC
              </kbd>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="h-9 gap-2 text-gray-500"
            >
              <Search className="h-4 w-4" />
              <span className="hidden md:inline text-sm">{t('common.search')}</span>
              <kbd className="hidden md:inline-block px-1.5 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 rounded">
                {'\u2318'}K
              </kbd>
            </Button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* User email */}
          <span className="hidden lg:block text-sm text-gray-500 dark:text-gray-400 mr-2">
            {email}
          </span>

          {/* Home / Landing page */}
          <Link to="/">
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.home')}</span>
            </Button>
          </Link>

          {/* Notifications */}
          <NotificationCenter />

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLang}
            className="h-9 gap-1.5 px-2"
            title={lang === 'nl' ? 'Switch to English' : lang === 'en' ? 'Passer au Français' : 'Wissel naar Nederlands'}
          >
            <span className="text-base leading-none">{lang === 'nl' ? '🇳🇱' : lang === 'en' ? '🇬🇧' : '🇫🇷'}</span>
            {/* <span className="text-xs font-semibold uppercase">{lang}</span> */}
          </Button>

          {/* Theme Toggle */}
          <Button variant="ghost" size="sm" onClick={toggleTheme} className="h-9 w-9 p-0">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {/* Sign Out */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="h-9 w-9 p-0 text-gray-500 hover:text-red-600"
            title={t('nav.signOut')}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ─── Main Content ──────────────────────────────────── */}
      <main
        className={cn(
          "pt-14 transition-all duration-300 min-h-screen",
          copilotOpen ? "mr-[320px]" : ""
        )}
        style={{ marginLeft: sideW }}
      >
        <div className="px-4 py-4 lg:px-6 w-full">
          <Outlet />
        </div>
      </main>

      {/* ─── AI Copilot Sidebar (right) ────────────────────── */}
      <AICopilot
        isOpen={copilotOpen}
        onClose={closeCopilot}
        initialContext={initialContext}
        onContextConsumed={clearInitialContext}
      />

      {/* Copilot Toggle */}
      {!copilotOpen && (
        <button
          onClick={openCopilot}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2 bg-gradient-to-b from-purple-600 to-pink-600 text-white pl-3 pr-2 py-3 rounded-l-xl shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700 transition-all group"
          title="AI Copilot"
        >
          <span
            className="text-xs font-medium hidden sm:block"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            AI Copilot
          </span>
          <Sparkles className="h-5 w-5" />
          <span className="absolute -top-1 -left-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white">
            <span className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-60" />
          </span>
        </button>
      )}
    </div>
  );
}

export default function LuxuryTopNavLayout() {
  return (
    <CopilotProvider>
      <LayoutInner />
    </CopilotProvider>
  );
}
