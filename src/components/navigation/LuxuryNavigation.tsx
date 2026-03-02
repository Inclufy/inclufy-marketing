// src/components/navigation/LuxuryNavigation.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Zap,
  Building,
  Target,
  Brain,
  Sparkles,
  Rocket,
  Bot,
  BarChart3,
  Shield,
  Users,
  Settings,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Check,
  Lock,
  TrendingUp,
  Globe,
  Mail,
  Share2,
  FileText,
  Palette,
  GitBranch,
  Layers,
  Bell,
  User,
  LogOut,
  Activity,
  ChevronLeft,
  Moon,
  Sun,
  Hexagon,
  Crown,
  Star,
  Award,
  Gem,
  Command,
  BarChart2,
  PieChart,
  LineChart,
  Calendar,
  Clock,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Enhanced User Progress with more metrics
interface UserProgress {
  currentPhase: number;
  completedPhases: number[];
  setupCompletion: number;
  totalScore: number;
  rank: string;
  achievements: number;
  streak: number;
}

// Luxury navigation item type
interface LuxNavItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  href?: string;
  badge?: string | number;
  badgeType?: 'default' | 'success' | 'warning' | 'error' | 'luxury';
  status?: 'complete' | 'in-progress' | 'locked' | 'premium';
  metric?: {
    value: string;
    trend: number;
  };
  children?: LuxNavItem[];
}

interface LuxNavSection {
  id: string;
  label: string;
  icon?: React.ElementType;
  items: LuxNavItem[];
  premium?: boolean;
}

// Professional color scheme
const luxuryColors = {
  primary: 'from-indigo-600 to-purple-600',
  secondary: 'from-purple-600 to-pink-600',
  accent: 'from-amber-500 to-orange-500',
  success: 'from-emerald-500 to-green-500',
  premium: 'from-yellow-500 to-amber-500'
};

// Navigation structure with luxury design
const luxuryNavStructure: LuxNavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Hexagon,
    items: [
      {
        id: 'executive-dashboard',
        label: 'Executive Dashboard',
        icon: Crown,
        href: '/app/dashboard',
        status: 'complete',
        metric: { value: '+23%', trend: 1 }
      },
      {
        id: 'analytics-hub',
        label: 'Analytics Hub',
        icon: BarChart2,
        href: '/app/analytics',
        status: 'complete',
        metric: { value: '98.5%', trend: 1 }
      },
      {
        id: 'performance-insights',
        label: 'Performance Insights',
        icon: LineChart,
        href: '/app/insights',
        status: 'complete',
        badge: 'AI',
        badgeType: 'luxury'
      }
    ]
  },
  {
    id: 'intelligence',
    label: 'Intelligence Suite',
    icon: Brain,
    items: [
      {
        id: 'brand-intelligence',
        label: 'Brand Intelligence',
        icon: Gem,
        href: '/app/brand-memory',
        status: 'in-progress',
        metric: { value: '87%', trend: 1 }
      },
      {
        id: 'market-dynamics',
        label: 'Market Dynamics',
        icon: Activity,
        href: '/app/market-intelligence',
        status: 'complete',
        badge: 'LIVE',
        badgeType: 'success'
      },
      {
        id: 'competitor-matrix',
        label: 'Competitor Matrix',
        icon: Globe,
        href: '/app/competition',
        status: 'complete'
      }
    ]
  },
  {
    id: 'creation',
    label: 'Creation Studio',
    icon: Sparkles,
    premium: true,
    items: [
      {
        id: 'ai-workshop',
        label: 'AI Workshop',
        icon: Sparkles,
        href: '/app/content-studio',
        status: 'premium',
        badge: 'GPT-4',
        badgeType: 'luxury'
      },
      {
        id: 'campaign-architect',
        label: 'Campaign Architect',
        icon: Rocket,
        href: '/app/campaigns',
        status: 'premium',
        metric: { value: '12 Active', trend: 0 }
      },
      {
        id: 'automation-engine',
        label: 'Automation Engine',
        icon: Bot,
        href: '/app/automation',
        status: 'premium',
        badge: 'β',
        badgeType: 'warning'
      }
    ]
  }
];

// Theme toggle with luxury styling
const LuxuryThemeToggle = ({ className }: { className?: string }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark'; // Default to dark for luxury feel
    }
    return 'dark';
  });

  useEffect(() => {
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
      className={cn(
        "relative h-9 w-20 rounded-full bg-gray-200 dark:bg-gray-800 p-1 transition-all",
        className
      )}
    >
      <motion.div
        className="absolute h-7 w-7 rounded-full bg-white dark:bg-gray-600 shadow-lg"
        animate={{
          x: theme === 'light' ? 0 : 40
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      />
      <div className="relative flex h-full w-full items-center justify-between px-1">
        <Sun className="h-4 w-4 text-amber-500" />
        <Moon className="h-4 w-4 text-slate-400" />
      </div>
    </Button>
  );
};

export default function LuxuryNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  
  const [userProgress, setUserProgress] = useState<UserProgress>({
    currentPhase: 5,
    completedPhases: [1, 2, 3, 4],
    setupCompletion: 87,
    totalScore: 9450,
    rank: 'Diamond',
    achievements: 24,
    streak: 7
  });

  // Calculate metrics
  const overallCompletion = useMemo(() => {
    const total = luxuryNavStructure.flatMap(s => s.items).length;
    const completed = luxuryNavStructure.flatMap(s => s.items).filter(i => i.status === 'complete').length;
    return Math.round((completed / total) * 100);
  }, []);

  // Get active section based on current path
  useEffect(() => {
    const path = location.pathname;
    for (const section of luxuryNavStructure) {
      if (section.items.some(item => path.startsWith(item.href || ''))) {
        setActiveSection(section.id);
        break;
      }
    }
  }, [location.pathname]);

  // Check if route is active
  const isActiveRoute = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Get status styling
  const getStatusStyle = (status?: string) => {
    switch (status) {
      case 'complete':
        return 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'in-progress':
        return 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'premium':
        return 'bg-gradient-to-r from-amber-500/10 to-yellow-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <TooltipProvider>
      <aside className={cn(
        "relative flex flex-col h-screen bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800",
        "transition-all duration-300 shadow-2xl",
        collapsed ? "w-20" : "w-80"
      )}>
        {/* Premium Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 border-b border-gray-200 dark:border-gray-800">
          {/* Logo and Brand */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/app" className="flex items-center gap-3">
              <div className="relative">
                <div className={cn(
                  "rounded-2xl flex items-center justify-center shadow-xl",
                  "bg-gradient-to-tr from-indigo-600 to-purple-600",
                  collapsed ? "w-12 h-12" : "w-14 h-14"
                )}>
                  <Hexagon className={cn("text-white", collapsed ? "w-7 h-7" : "w-8 h-8")} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Star className="w-3 h-3 text-white" />
                </div>
              </div>
              {!collapsed && (
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
                    Inclufy Pro
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                    Marketing Intelligence Platform
                  </p>
                </div>
              )}
            </Link>
            {!collapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(true)}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* User Profile Card */}
          {!collapsed && (
            <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 ring-2 ring-white dark:ring-gray-900 shadow-lg">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                    S
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Sami</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-2 py-0 text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      {userProgress.rank}
                    </Badge>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Level {userProgress.currentPhase}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProgress.totalScore.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">IQ Score</div>
                </div>
              </div>

              {/* Progress Stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {userProgress.achievements}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Awards</div>
                </div>
                <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {overallCompletion}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Complete</div>
                </div>
                <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {userProgress.streak}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Streak</div>
                </div>
              </div>
            </div>
          )}

          {/* Expand button when collapsed */}
          {collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(false)}
              className="w-full h-8 mt-4"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search and Command Bar */}
        {!collapsed && (
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search or type command..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-24 h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded">⌘</kbd>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded">K</kbd>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Plus className="h-4 w-4" />
                {!collapsed && <span className="ml-1">Create</span>}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Filter className="h-4 w-4" />
                {!collapsed && <span className="ml-1">Filter</span>}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Calendar className="h-4 w-4" />
                {!collapsed && <span className="ml-1">Today</span>}
              </Button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        {!collapsed && (
          <div className="px-4 pb-2">
            <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-11 bg-gray-100 dark:bg-gray-900 p-1">
                {luxuryNavStructure.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm"
                  >
                    <section.icon className="h-4 w-4" />
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Navigation Items */}
        <ScrollArea className="flex-1">
          <nav className={cn("p-4 space-y-6", collapsed && "px-3")}>
            {luxuryNavStructure
              .filter(section => !collapsed || section.id === activeSection)
              .map((section) => {
                const SectionIcon = section.icon;
                
                return (
                  <div key={section.id}>
                    {!collapsed && (
                      <div className="flex items-center gap-2 px-3 pb-3">
                        <SectionIcon className="h-4 w-4 text-gray-500" />
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {section.label}
                        </h3>
                        {section.premium && (
                          <Badge variant="outline" className="ml-auto text-xs px-1.5 py-0 border-amber-300 text-amber-700 dark:text-amber-400">
                            PRO
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      {section.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isActive = isActiveRoute(item.href);

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Link
                              to={item.href || '#'}
                              className={cn(
                                "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                "hover:shadow-lg hover:scale-[1.02]",
                                isActive
                                  ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                                  : "hover:bg-white dark:hover:bg-gray-900",
                                collapsed && "justify-center px-3"
                              )}
                            >
                              <div className={cn(
                                "flex items-center justify-center rounded-lg transition-all duration-200",
                                isActive
                                  ? "bg-white/20 p-2.5"
                                  : "bg-gray-100 dark:bg-gray-800 p-2.5 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
                              )}>
                                {ItemIcon && <ItemIcon className={cn(
                                  "h-5 w-5",
                                  isActive ? "text-white" : "text-gray-600 dark:text-gray-400"
                                )} />}
                              </div>

                              {!collapsed && (
                                <>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={cn(
                                        "text-sm font-medium",
                                        isActive ? "text-white" : "text-gray-900 dark:text-gray-100"
                                      )}>
                                        {item.label}
                                      </span>
                                      {item.badge && (
                                        <Badge
                                          variant={item.badgeType === 'luxury' ? 'default' : item.badgeType as any}
                                          className={cn(
                                            "text-xs px-1.5 py-0",
                                            item.badgeType === 'luxury' && "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0"
                                          )}
                                        >
                                          {item.badge}
                                        </Badge>
                                      )}
                                    </div>
                                    {item.metric && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className={cn(
                                          "text-xs",
                                          isActive ? "text-white/80" : "text-gray-500 dark:text-gray-400"
                                        )}>
                                          {item.metric.value}
                                        </span>
                                        {item.metric.trend !== 0 && (
                                          <TrendingUp className={cn(
                                            "h-3 w-3",
                                            item.metric.trend > 0 ? "text-green-500" : "text-red-500 rotate-180"
                                          )} />
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <ChevronRight className={cn(
                                    "h-4 w-4 transition-transform group-hover:translate-x-1",
                                    isActive ? "text-white/60" : "text-gray-400"
                                  )} />
                                </>
                              )}
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </nav>
        </ScrollArea>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gradient-to-t from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <div className={cn(
            "grid gap-2",
            collapsed ? "grid-cols-1" : "grid-cols-4"
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 hover:bg-white dark:hover:bg-gray-800"
                  onClick={() => navigate('/app/notifications')}
                >
                  <div className="relative">
                    <Bell className="h-4 w-4" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 hover:bg-white dark:hover:bg-gray-800"
                  onClick={() => navigate('/app/settings')}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>

            {!collapsed && (
              <>
                <LuxuryThemeToggle className="col-span-2" />
              </>
            )}
          </div>

          {/* Sign Out */}
          {!collapsed && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 mt-3 h-10 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Sign Out</span>
            </Button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}