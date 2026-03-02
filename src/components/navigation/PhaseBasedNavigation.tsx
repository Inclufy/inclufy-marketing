// src/components/navigation/PhaseBasedNavigation.tsx
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
  HelpCircle,
  Search,
  Plus,
  BookOpen,
  ChevronRight,
  ChevronDown,
  Check,
  Lock,
  TrendingUp,
  Star,
  AlertCircle,
  Command,
  ArrowRight,
  Lightbulb,
  GraduationCap,
  Trophy,
  Briefcase,
  Globe,
  Mail,
  Share2,
  Video,
  FileText,
  Palette,
  GitBranch,
  TestTube,
  Layers,
  Key,
  Bell,
  User,
  LogOut,
  Gauge,
  Navigation,
  Image,
  Workflow,
  Map,
  Activity,
  Home,
  ChevronLeft,
  Menu,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// User progress type
interface UserProgress {
  currentPhase: number;
  completedPhases: number[];
  setupCompletion: number;
  unlockedFeatures: string[];
}

// Navigation item types
interface NavItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  href?: string;
  phase?: number;
  progress?: number;
  status?: 'complete' | 'in-progress' | 'locked' | 'available';
  badge?: string | number;
  badgeType?: 'default' | 'success' | 'warning' | 'error' | 'info';
  shortcut?: string;
  description?: string;
  children?: NavItem[];
  quickActions?: QuickAction[];
}

interface QuickAction {
  label: string;
  icon: React.ElementType;
  action: () => void;
  shortcut?: string;
}

interface NavSection {
  id: string;
  label: string;
  icon?: React.ElementType;
  collapsible?: boolean;
  items: NavItem[];
  minPhase?: number;
}

// Quick actions
const quickActions: QuickAction[] = [
  {
    label: 'New Campaign',
    icon: Plus,
    action: () => console.log('New campaign'),
    shortcut: '⌘N'
  },
  {
    label: 'Quick Content',
    icon: Zap,
    action: () => console.log('Quick content'),
    shortcut: '⌘K'
  },
  {
    label: 'View Analytics',
    icon: BarChart3,
    action: () => console.log('Analytics'),
    shortcut: '⌘A'
  }
];

// Phase definitions
const phases = {
  1: { name: 'Foundation', icon: Building, color: 'blue' },
  2: { name: 'Intelligence', icon: Brain, color: 'purple' },
  3: { name: 'Creation', icon: Sparkles, color: 'pink' },
  4: { name: 'Execution', icon: Rocket, color: 'green' },
  5: { name: 'Automation', icon: Bot, color: 'orange' },
  6: { name: 'Optimization', icon: TrendingUp, color: 'cyan' },
  7: { name: 'Scale', icon: Layers, color: 'indigo' },
  8: { name: 'Enterprise', icon: Shield, color: 'gray' }
};

// Navigation structure - keeping your existing structure
const navigationStructure: NavSection[] = [
  {
    id: 'core',
    label: 'Core',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/app/dashboard',
        phase: 0,
        status: 'available'
      },
      {
        id: 'analytics-overview',
        label: 'Analytics',
        icon: BarChart3,
        href: '/app/analytics',
        phase: 0,
        status: 'available'
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: FileText,
        href: '/app/reports',
        phase: 0,
        status: 'available'
      },
      {
        id: 'quick-start',
        label: 'Quick Start Guide',
        icon: Zap,
        href: '/app/quick-start',
        phase: 0,
        status: 'available',
        badge: 'Start Here',
        badgeType: 'success'
      }
    ]
  },
  {
    id: 'setup',
    label: 'Setup & Foundation',
    icon: Building,
    collapsible: true,
    minPhase: 1,
    items: [
      {
        id: 'brand-setup',
        label: 'Brand Setup',
        icon: Palette,
        href: '/app/setup/brand',
        phase: 1,
        progress: 100,
        status: 'complete',
        description: 'Logo, colors, voice'
      },
      {
        id: 'target-audience',
        label: 'Target Audience',
        icon: Users,
        href: '/app/setup/audience',
        phase: 1,
        progress: 75,
        status: 'in-progress',
        description: 'Define your ideal customers'
      },
      {
        id: 'goals-kpis',
        label: 'Goals & KPIs',
        icon: Target,
        href: '/app/setup/goals',
        phase: 1,
        progress: 50,
        status: 'in-progress',
        description: 'Set measurable objectives'
      },
      {
        id: 'competition',
        label: 'Competitive Analysis',
        icon: Globe,
        href: '/app/setup/competition',
        phase: 1,
        progress: 25,
        status: 'available',
        description: 'Know your market'
      }
    ]
  },
  {
    id: 'marketing-hub',
    label: 'Marketing Hub',
    icon: Rocket,
    minPhase: 2,
    items: [
      {
        id: 'context-marketing',
        label: 'Context Marketing',
        icon: Brain,
        href: '/app/context-marketing',
        phase: 2,
        status: 'in-progress',
        badge: 'NEW',
        badgeType: 'info',
        progress: 35
      },
      {
        id: 'brand-memory',
        label: 'Brand Memory',
        icon: Brain,
        href: '/app/brand-memory',
        phase: 2,
        status: 'available'
      },
      {
        id: 'market-intelligence',
        label: 'Market Intelligence',
        icon: Activity,
        href: '/app/market-intelligence',
        phase: 2,
        status: 'available'
      },
      {
        id: 'content-studio',
        label: 'Content Studio',
        icon: Sparkles,
        href: '/app/content-studio',
        phase: 3,
        status: 'available',
        badge: 12,
        children: [
          {
            id: 'ai-writer',
            label: 'AI Writer',
            href: '/app/content/writer',
            phase: 3,
            status: 'available'
          },
          {
            id: 'image-generator',
            label: 'Image Generator',
            href: '/app/content/images',
            phase: 3,
            status: 'available'
          },
          {
            id: 'video-creator',
            label: 'Video Creator',
            href: '/app/content/video',
            phase: 3,
            status: 'available',
            badge: 'Beta',
            badgeType: 'warning'
          }
        ]
      }
    ]
  },
  {
    id: 'campaigns',
    label: 'Campaigns',
    icon: Target,
    minPhase: 4,
    items: [
      {
        id: 'campaigns-overview',
        label: 'Campaign Manager',
        icon: Rocket,
        href: '/app/campaigns',
        phase: 4,
        status: 'available',
        badge: 7
      },
      {
        id: 'email-campaigns',
        label: 'Email Marketing',
        icon: Mail,
        href: '/app/campaigns/email',
        phase: 4,
        status: 'available'
      },
      {
        id: 'social-campaigns',
        label: 'Social Media',
        icon: Share2,
        href: '/app/campaigns/social',
        phase: 4,
        status: 'available'
      },
      {
        id: 'landing-pages',
        label: 'Landing Pages',
        icon: FileText,
        href: '/app/campaigns/landing',
        phase: 4,
        status: 'available'
      }
    ]
  },
  {
    id: 'automation',
    label: 'Automation & AI',
    icon: Bot,
    minPhase: 5,
    items: [
      {
        id: 'workflows',
        label: 'Workflows',
        icon: GitBranch,
        href: '/app/automation/workflows',
        phase: 5,
        status: 'available',
        badge: 23,
        badgeType: 'warning'
      },
      {
        id: 'customer-journeys',
        label: 'Customer Journeys',
        icon: Navigation,
        href: '/app/automation/journeys',
        phase: 5,
        status: 'available'
      },
      {
        id: 'ai-agents',
        label: 'AI Agents',
        icon: Bot,
        href: '/app/automation/agents',
        phase: 5,
        status: 'available'
      },
      {
        id: 'smart-triggers',
        label: 'Smart Triggers',
        icon: Zap,
        href: '/app/automation/triggers',
        phase: 5,
        status: 'available'
      }
    ]
  }
];

// Theme toggle component
const ThemeToggle = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
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
      className="w-9 h-9 p-0"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <Sun className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};

// Component
export default function PhaseBasedNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    currentPhase: 5,
    completedPhases: [1, 2, 3, 4],
    setupCompletion: 62,
    unlockedFeatures: ['brand-setup', 'target-audience', 'goals-kpis', 'context-marketing', 'content-creation']
  });
  
  const [expandedSections, setExpandedSections] = useState<string[]>(['setup', 'marketing-hub']);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showProgressDetails, setShowProgressDetails] = useState(false);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    const totalPhases = 8;
    const completedWeight = userProgress.completedPhases.length * 100;
    const currentPhaseProgress = userProgress.setupCompletion * 0.5;
    return Math.round((completedWeight + currentPhaseProgress) / totalPhases);
  }, [userProgress]);

  // Filter navigation based on search and user progress
  const filteredNavigation = useMemo(() => {
    return navigationStructure
      .filter(section => {
        if (section.minPhase && section.minPhase > userProgress.currentPhase) {
          return false;
        }
        
        if (searchQuery) {
          const sectionMatches = section.label.toLowerCase().includes(searchQuery.toLowerCase());
          const itemMatches = section.items.some(item => 
            item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.children?.some(child => child.label.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          return sectionMatches || itemMatches;
        }
        
        return true;
      })
      .map(section => ({
        ...section,
        items: section.items.filter(item => {
          if (searchQuery) {
            return item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.children?.some(child => child.label.toLowerCase().includes(searchQuery.toLowerCase()));
          }
          return true;
        })
      }));
  }, [searchQuery, userProgress]);

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  // Check if route is active
  const isActiveRoute = (href?: string) => {
    if (!href) return false;
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // Get item status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'complete': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'in-progress': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      case 'available': return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
      case 'locked': return 'text-gray-400 bg-gray-100 dark:bg-gray-900';
      default: return '';
    }
  };

  // Get status icon
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'complete': return <Check className="w-4 h-4" />;
      case 'in-progress': return <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />;
      case 'locked': return <Lock className="w-4 h-4" />;
      default: return null;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(!showCommandPalette);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setCollapsed(!collapsed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette, collapsed]);

  return (
    <TooltipProvider>
      <aside className={cn(
        "relative flex flex-col w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300",
        collapsed && "w-16"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
            <Link to="/app" className={cn("flex items-center gap-3", collapsed && "w-10 h-10 justify-center")}>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                {userProgress.currentPhase > 1 && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
              {!collapsed && (
                <div className="flex-1">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                    Inclufy
                  </h1>
                  <p className="text-xs text-gray-500">Phase {userProgress.currentPhase} - {phases[userProgress.currentPhase].name}</p>
                </div>
              )}
            </Link>
            {!collapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(true)}
                className="w-8 h-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Expand button when collapsed */}
          {collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed(false)}
              className="w-full h-8 mt-2 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          {/* Progress Overview */}
          {!collapsed && (
            <Popover open={showProgressDetails} onOpenChange={setShowProgressDetails}>
              <PopoverTrigger asChild>
                <button className="w-full p-3 mt-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm font-bold">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-2">
                    {userProgress.completedPhases.length} of 8 phases complete
                  </p>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Phase Progress</h4>
                  {Object.entries(phases).map(([phase, info]) => {
                    const phaseNum = parseInt(phase);
                    const isComplete = userProgress.completedPhases.includes(phaseNum);
                    const isCurrent = userProgress.currentPhase === phaseNum;
                    const Icon = info.icon;
                    
                    return (
                      <div key={phase} className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          isComplete ? "bg-green-100 text-green-600" :
                          isCurrent ? "bg-blue-100 text-blue-600" :
                          "bg-gray-100 text-gray-400"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{info.name}</p>
                          {isCurrent && <Progress value={userProgress.setupCompletion} className="h-1 mt-1" />}
                        </div>
                        <div>
                          {isComplete && <Check className="w-4 h-4 text-green-600" />}
                          {isCurrent && <span className="text-xs font-medium">{userProgress.setupCompletion}%</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Search & Quick Actions */}
        {!collapsed && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-20 bg-gray-50 dark:bg-gray-800"
              />
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 rounded">
                ⌘K
              </kbd>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              {quickActions.map((action) => (
                <Tooltip key={action.label}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-1"
                      onClick={action.action}
                    >
                      <action.icon className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{action.label}</p>
                    {action.shortcut && <p className="text-xs opacity-60">{action.shortcut}</p>}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className={cn("p-4 space-y-6", collapsed && "p-2")}>
            {filteredNavigation.map((section) => {
              const isExpanded = expandedSections.includes(section.id);
              const SectionIcon = section.icon;

              return (
                <div key={section.id}>
                  {/* Section Header */}
                  {section.label !== 'Core' && !collapsed && (
                    <button
                      onClick={() => section.collapsible && toggleSection(section.id)}
                      className={cn(
                        "flex items-center justify-between w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2",
                        section.collapsible && "cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {SectionIcon && <SectionIcon className="w-3.5 h-3.5" />}
                        <span>{section.label}</span>
                      </div>
                      {section.collapsible && (
                        <ChevronDown className={cn(
                          "w-3 h-3 transition-transform",
                          !isExpanded && "-rotate-90"
                        )} />
                      )}
                    </button>
                  )}

                  {/* Section Items */}
                  <AnimatePresence>
                    {(!section.collapsible || isExpanded) && (
                      <motion.div
                        initial={section.collapsible ? { height: 0, opacity: 0 } : false}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={section.collapsible ? { height: 0, opacity: 0 } : false}
                        className="space-y-1"
                      >
                        {section.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isActive = isActiveRoute(item.href);
                          const hasActiveChild = item.children?.some(child => isActiveRoute(child.href));

                          return (
                            <div key={item.id}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    to={item.href || '#'}
                                    className={cn(
                                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group",
                                      isActive || hasActiveChild
                                        ? "bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                                        : item.status === 'locked'
                                        ? "opacity-50 cursor-not-allowed"
                                        : "hover:bg-gray-50 dark:hover:bg-gray-800",
                                      collapsed && "justify-center px-2"
                                    )}
                                    onClick={(e) => {
                                      if (item.status === 'locked') {
                                        e.preventDefault();
                                      }
                                    }}
                                  >
                                    {/* Icon */}
                                    <div className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                      getStatusColor(item.status)
                                    )}>
                                      {item.status === 'locked' ? (
                                        <Lock className="w-4 h-4" />
                                      ) : ItemIcon ? (
                                        <ItemIcon className="w-4 h-4" />
                                      ) : (
                                        getStatusIcon(item.status)
                                      )}
                                    </div>

                                    {/* Label & Description */}
                                    {!collapsed && (
                                      <>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="truncate">{item.label}</span>
                                            {item.progress !== undefined && item.progress < 100 && (
                                              <span className="text-xs text-gray-500">{item.progress}%</span>
                                            )}
                                          </div>
                                          {item.description && (
                                            <p className="text-xs text-gray-500 truncate">{item.description}</p>
                                          )}
                                        </div>

                                        {/* Badge */}
                                        {item.badge && (
                                          <Badge
                                            variant={item.badgeType as any || 'secondary'}
                                            className="ml-auto"
                                          >
                                            {item.badge}
                                          </Badge>
                                        )}

                                        {/* Chevron for expandable items */}
                                        {item.children && (
                                          <ChevronRight className="w-4 h-4 text-gray-400" />
                                        )}
                                      </>
                                    )}
                                  </Link>
                                </TooltipTrigger>
                                {collapsed && (
                                  <TooltipContent side="right">
                                    <p>{item.label}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>

                              {/* Child Items */}
                              {!collapsed && item.children && (isActive || hasActiveChild) && (
                                <div className="mt-1 ml-11 space-y-0.5">
                                  {item.children.map((child) => (
                                    <Link
                                      key={child.id}
                                      to={child.href}
                                      className={cn(
                                        "block px-3 py-1.5 text-sm rounded-md transition-colors",
                                        isActiveRoute(child.href)
                                          ? "bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-300"
                                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
                                      )}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span>{child.label}</span>
                                        {child.badge && (
                                          <Badge variant="outline" className="scale-90">
                                            {child.badge}
                                          </Badge>
                                        )}
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-800">
          {/* Help & Resources */}
          <div className={cn("p-4 space-y-2", collapsed && "p-2")}>
            <div className={cn(
              "flex items-center gap-2",
              collapsed ? "flex-col" : "flex-row justify-between"
            )}>
              <ThemeToggle />
              
              {!collapsed && (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/app/help">
                          <Lightbulb className="w-4 h-4 mr-2" />
                          Help
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Learning Center</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/app/settings">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Link>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Settings</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCollapsed(true)}
                        className="w-8 h-8 p-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Collapse sidebar</p>
                      <p className="text-xs opacity-60">⌘\</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>

          {/* User Menu */}
          <div className={cn("p-4 pt-0", collapsed && "p-2")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn(
                  "w-full justify-start gap-3 p-3",
                  collapsed && "justify-center p-2"
                )}>
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      S
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">Sami</p>
                      <p className="text-xs text-gray-500">Phase {userProgress.currentPhase} Explorer</p>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align={collapsed ? "center" : "end"} forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">sami@inclufy.com</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      Pro Plan • 2,450 AI Credits
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/app/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/achievements">
                    <Trophy className="mr-2 h-4 w-4" />
                    Achievements
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/app/notifications">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                    <Badge variant="destructive" className="ml-auto scale-90">3</Badge>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                  <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}