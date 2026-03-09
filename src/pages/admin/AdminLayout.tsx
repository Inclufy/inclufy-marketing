// src/pages/admin/AdminLayout.tsx
// Admin Portal layout met sidebar navigatie (zoals ProjeXtPal)

import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Users,
  Building2,
  Puzzle,
  CreditCard,
  MessageSquareText,
  UserPlus,
  GraduationCap,
  Receipt,
  Settings,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  LogOut,
  Shield,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const userEmail = user?.email || 'admin@inclufy.com';
  const userInitials = userEmail.slice(0, 2).toUpperCase();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
    {
      title: nl ? 'OVERZICHT' : fr ? 'APERCU' : 'OVERVIEW',
      items: [
        { label: 'Dashboard', path: '/app/tenant-admin', icon: LayoutDashboard },
        { label: nl ? 'Activiteit' : fr ? 'Activite' : 'Activity', path: '/app/tenant-admin/activity', icon: Activity },
      ],
    },
    {
      title: nl ? 'BEHEER' : fr ? 'GESTION' : 'MANAGEMENT',
      items: [
        { label: nl ? 'Gebruikers' : fr ? 'Utilisateurs' : 'Users', path: '/app/tenant-admin/users', icon: Users },
        { label: nl ? 'Organisaties' : fr ? 'Organisations' : 'Organizations', path: '/app/tenant-admin/organizations', icon: Building2 },
        { label: nl ? 'Integraties' : fr ? 'Integrations' : 'Integrations', path: '/app/tenant-admin/integrations', icon: Puzzle },
        { label: nl ? 'Abonnementen' : fr ? 'Abonnements' : 'Subscriptions', path: '/app/tenant-admin/subscriptions', icon: CreditCard },
        { label: nl ? 'Demo Verzoeken' : fr ? 'Demandes de demo' : 'Demo Requests', path: '/app/tenant-admin/demo-requests', icon: MessageSquareText },
        { label: nl ? 'Registraties' : fr ? 'Inscriptions' : 'Registrations', path: '/app/tenant-admin/registrations', icon: UserPlus },
        { label: nl ? 'Trainingen' : fr ? 'Formations' : 'Trainings', path: '/app/tenant-admin/trainings', icon: GraduationCap },
        { label: nl ? 'Facturen' : fr ? 'Factures' : 'Invoices', path: '/app/tenant-admin/invoices', icon: Receipt },
      ],
    },
    {
      title: nl ? 'SYSTEEM' : fr ? 'SYSTEME' : 'SYSTEM',
      items: [
        { label: nl ? 'Instellingen' : fr ? 'Parametres' : 'Settings', path: '/app/tenant-admin/settings', icon: Settings },
      ],
    },
  ];

  return (
    <div className={cn("flex min-h-screen bg-gray-50 dark:bg-gray-950")}>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-60"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
          {!sidebarCollapsed && (
            <>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate">Inclufy</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{nl ? 'Admin Portaal' : fr ? 'Portail Admin' : 'Admin Portal'}</p>
              </div>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 flex-shrink-0"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wider">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/app/tenant-admin'}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200",
                        sidebarCollapsed && "justify-center px-2"
                      )
                    }
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{item.badge}</Badge>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-600 dark:text-gray-400 text-sm"
              onClick={() => navigate('/app/dashboard')}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {nl ? 'Terug naar App' : fr ? 'Retour a l\'app' : 'Back to App'}
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        sidebarCollapsed ? "ml-16" : "ml-60"
      )}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={nl ? 'Zoeken...' : fr ? 'Rechercher...' : 'Search...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            {/* Dark mode toggle */}
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Language */}
            <Badge variant="outline" className="text-xs">{lang.toUpperCase()}</Badge>

            {/* User */}
            <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{userEmail}</p>
                <p className="text-[11px] text-gray-500">SuperAdmin</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white text-xs font-bold">
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
