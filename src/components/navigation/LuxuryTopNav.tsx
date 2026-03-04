// src/components/navigation/LuxuryTopNav.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Building,
  Target,
  Brain,
  Sparkles,
  Rocket,
  Bot,
  BarChart3,
  Users,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  Crown,
  Hexagon,
  Activity,
  Globe,
  Mail,
  Share2,
  FileText,
  Palette,
  GitBranch,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  HelpCircle,
  TrendingUp,
  Command
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

// Navigation structure with dropdowns
const navigationItems = [
  {
    label: 'Overzicht',
    href: '/app/dashboard',
    icon: Crown,
  },
  {
    label: 'Instellingen',
    icon: Building,
    children: [
      { label: 'Merk Setup', href: '/app/setup/brand', icon: Palette, progress: 100 },
      { label: 'Doelgroep', href: '/app/setup/audience', icon: Users, progress: 75 },
      { label: 'Doelen & KPI\'s', href: '/app/setup/goals', icon: Target, progress: 50 },
      { label: 'Concurrentie', href: '/app/setup/competition', icon: Globe, progress: 25 },
    ]
  },
  {
    label: 'Intelligentie',
    icon: Brain,
    children: [
      {
        label: 'Groei Blauwdruk',
        href: '/app/growth-blueprint',
        icon: Sparkles,
        badge: 'AI',
        description: 'Complete bedrijfsanalyse in 60 seconden'
      },
      {
        label: 'Marketing Scanner',
        href: '/app/intelligence/scanner',
        icon: Search,
        badge: 'NIEUW',
        description: 'AI-gestuurde merk- & marktanalyse'
      },
      {
        label: 'Merkgeheugen',
        href: '/app/intelligence/brand',
        icon: Brain,
        badge: 'AI'
      },
      {
        label: 'Marktinzichten',
        href: '/app/intelligence/market',
        icon: TrendingUp
      },
      {
        label: 'Concurrentieanalyse',
        href: '/app/intelligence/competitors',
        icon: Users
      },
      {
        label: 'Content Studio',
        href: '/app/content-studio',
        icon: Sparkles,
        badge: 'NIEUW'
      }
    ]
  },
  {
    label: 'Campagnes',
    icon: Rocket,
    children: [
      { label: 'Campagne Beheer', href: '/app/campaigns', icon: Rocket, badge: '7' },
      { label: 'E-mail Marketing', href: '/app/campaigns/email', icon: Mail },
      { label: 'Social Media', href: '/app/campaigns/social', icon: Share2 },
      { label: 'Landingspagina\'s', href: '/app/campaigns/landing', icon: FileText },
    ]
  },
  {
    label: 'Automatisering',
    icon: Bot,
    badge: 'PRO',
    children: [
      { label: 'Workflows', href: '/app/automation/workflows', icon: GitBranch, badge: '23' },
      { label: 'Klantreis', href: '/app/automation/journeys', icon: Activity },
      { label: 'AI Agents', href: '/app/automation/agents', icon: Bot, badge: 'BETA' },
      { label: 'Slimme Triggers', href: '/app/automation/triggers', icon: Sparkles },
    ]
  },
  {
    label: 'Analyse',
    href: '/app/analytics',
    icon: BarChart3,
  },
];

// Theme toggle component
const ThemeToggle = ({ className }: { className?: string }) => {
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

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className={cn("h-9 w-9 p-0", className)}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
    </Button>
  );
};

// Dropdown menu component
const NavigationDropdown = ({ item, isActive }: { item: any; isActive: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  const hasActiveChild = item.children?.some((child: any) => 
    location.pathname === child.href || location.pathname.startsWith(child.href + '/')
  );

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={cn(
          "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-lg",
          isActive || hasActiveChild
            ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20"
            : "text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
      >
        <item.icon className="h-4 w-4" />
        <span>{item.label}</span>
        {item.badge && (
          <Badge 
            variant={item.badge === 'PRO' ? 'default' : 'secondary'}
            className={cn(
              "ml-1.5 text-xs px-1.5 py-0",
              item.badge === 'PRO' && "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
            )}
          >
            {item.badge}
          </Badge>
        )}
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 mt-1 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 py-2 z-50"
          >
            {item.children.map((child: any) => {
              const isChildActive = location.pathname === child.href || 
                                  location.pathname.startsWith(child.href + '/');
              
              return (
                <Link
                  key={child.href}
                  to={child.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors group",
                    isChildActive
                      ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isChildActive
                      ? "bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                  )}>
                    <child.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{child.label}</span>
                      {child.badge && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-1.5 py-0"
                        >
                          {child.badge}
                        </Badge>
                      )}
                    </div>
                    {child.progress !== undefined && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                            style={{ width: `${child.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{child.progress}%</span>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function LuxuryTopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/app" className="flex items-center gap-3">
              <div className="relative">
                <img src="/favicon.svg" alt="Inclufy Marketing" className="w-10 h-10 rounded-xl shadow-lg" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
                  Inclufy Marketing
                </h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                
                if (item.children) {
                  return <NavigationDropdown key={item.label} item={item} isActive={isActive} />;
                }
                
                return (
                  <Link
                    key={item.href}
                    to={item.href!}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all rounded-lg",
                      isActive
                        ? "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20"
                        : "text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className="ml-1.5 text-xs px-1.5 py-0"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:block">
              {searchOpen ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Zoeken..."
                    className="pl-10 pr-4 w-64 h-9"
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
                  className="h-9 gap-2"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden lg:inline text-sm text-gray-500">Zoeken</span>
                  <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 rounded">
                    ⌘K
                  </kbd>
                </Button>
              )}
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-3 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm">
                      S
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium">Sami</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pro Plan</p>
                  </div>
                  <ChevronDown className="h-3 w-3 hidden lg:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">Sami</p>
                    <p className="text-xs text-gray-500">sami@inclufy.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/app/profile" className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Profiel
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Instellingen
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/tenant-admin" className="cursor-pointer">
                    <Crown className="mr-2 h-4 w-4" />
                    Admin Portal
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/admin" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Org Admin
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/help" className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Helpcentrum
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Uitloggen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden h-9 w-9 p-0"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="lg:hidden overflow-hidden border-t border-gray-200 dark:border-gray-800"
          >
            <div className="px-4 py-4 space-y-1">
              {navigationItems.map((item) => {
                if (item.children) {
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {item.label}
                      </div>
                      {item.children.map((child: any) => (
                        <Link
                          key={child.href}
                          to={child.href}
                          className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <child.icon className="h-4 w-4" />
                          <span>{child.label}</span>
                        </Link>
                      ))}
                    </div>
                  );
                }
                
                return (
                  <Link
                    key={item.href}
                    to={item.href!}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}