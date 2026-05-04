'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Calendar, CalendarDays, Megaphone, FileCheck, Zap,
  Target, Settings, Package, Users, Contact, Building2, Palette,
  TrendingUp, Wallet, Bot, Bell, BarChart3, MessageSquare, LogOut,
  GraduationCap, Library, UserCircle, Plug, Newspaper,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Events', href: '/events', icon: Calendar },
  { label: 'Calendar', href: '/calendar', icon: CalendarDays },
  { label: 'Campaigns', href: '/campaigns', icon: Megaphone },
  { label: 'Posts', href: '/posts', icon: Newspaper },
  { label: 'Content Proposals', href: '/proposals', icon: FileCheck },
  { label: 'Content Library', href: '/library', icon: Library },
  { label: 'Automations', href: '/automations', icon: Zap },
  { label: 'Strategy', href: '/strategy', icon: Target },
  { label: "Persona's", href: '/personas', icon: UserCircle },
  { label: 'Budget', href: '/budget', icon: Wallet },
  { divider: true },
  { label: 'Copilot', href: '/copilot', icon: MessageSquare },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Contacts', href: '/contacts', icon: Contact },
  { divider: true },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Team', href: '/team', icon: Users },
  { label: 'Organization', href: '/organization', icon: Building2 },
  { label: 'Brand Kit', href: '/brand-kit', icon: Palette },
  { label: 'Integraties', href: '/integrations', icon: Plug },
  { divider: true },
  { label: 'Academy', href: '/academy', icon: GraduationCap },
  { divider: true },
  { label: 'Settings', href: '/settings', icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-[hsl(var(--border))] px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-[hsl(var(--foreground))]">AMOS</h1>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] -mt-1">Inclufy GO</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navItems.map((item, i) =>
          'divider' in item ? (
            <div key={i} className="my-3 border-t border-gray-100" />
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                pathname.startsWith(item.href)
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          )
        )}
      </nav>

      {/* Theme + Sign out */}
      <div className="border-t border-[hsl(var(--border))] p-3 space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Thema</span>
          <ThemeToggle />
        </div>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Uitloggen
        </button>
      </div>
    </aside>
  );
}
