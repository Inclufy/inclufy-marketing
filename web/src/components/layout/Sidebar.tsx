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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">AMOS</h1>
          <p className="text-[10px] text-gray-500 -mt-1">Inclufy GO</p>
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
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          )
        )}
      </nav>

      {/* Sign out */}
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Uitloggen
        </button>
      </div>
    </aside>
  );
}
