import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  Brain,
  LayoutDashboard,
  Target,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  Menu,
  X,
  Sparkles,
  Globe,
  Zap,
  FileText,
  MessageSquare,
  TrendingUp,
  Package,
  Briefcase,
  Shield,
  BookOpen,
  DollarSign,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Navigation structure with 3 levels
const navigationStructure = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/app/dashboard',
    subItems: [
      {
        id: 'overview',
        label: 'Overview',
        path: '/app/dashboard',
        level3: [
          { id: 'performance', label: 'Performance', path: '/app/dashboard/performance' },
          { id: 'engagement', label: 'Engagement', path: '/app/dashboard/engagement' },
          { id: 'conversion', label: 'Conversion', path: '/app/dashboard/conversion' }
        ]
      },
      {
        id: 'analytics',
        label: 'Analytics',
        path: '/app/analytics',
        level3: [
          { id: 'traffic', label: 'Traffic Sources', path: '/app/analytics/traffic' },
          { id: 'behavior', label: 'User Behavior', path: '/app/analytics/behavior' },
          { id: 'attribution', label: 'Attribution', path: '/app/analytics/attribution' }
        ]
      },
      {
        id: 'reports',
        label: 'Reports',
        path: '/app/reports',
        level3: [
          { id: 'scheduled', label: 'Scheduled', path: '/app/reports/scheduled' },
          { id: 'custom', label: 'Custom', path: '/app/reports/custom' },
          { id: 'templates', label: 'Templates', path: '/app/reports/templates' }
        ]
      }
    ]
  },
  {
  name: 'Growth Blueprint',
  icon: Sparkles,
  href: '/app/growth-blueprint',
  badge: 'AI',
},
  {
    id: 'marketing-hub',
    label: 'Marketing Hub',
    icon: Target,
    path: '/app/context-marketing',
    subItems: [
      {
        id: 'brand-memory',
        label: 'Brand Memory',
        path: '/app/brand-memory',
        level3: [
          { id: 'identity', label: 'Brand Identity', path: '/app/brand-memory/identity' },
          { id: 'voice', label: 'Voice & Tone', path: '/app/brand-memory/voice' },
          { id: 'guidelines', label: 'Guidelines', path: '/app/brand-memory/guidelines' }
        ]
      },
      {
        id: 'campaigns',
        label: 'Campaigns',
        path: '/app/campaigns',
        level3: [
          { id: 'email', label: 'Email', path: '/app/campaigns/email' },
          { id: 'social', label: 'Social Media', path: '/app/campaigns/social' },
          { id: 'landing', label: 'Landing Pages', path: '/app/campaigns/landing' }
        ]
      },
      {
        id: 'content-studio',
        label: 'Content Studio',
        path: '/app/content-studio',
        level3: [
          { id: 'writer', label: 'AI Writer', path: '/app/content/writer' },
          { id: 'images', label: 'Image Gen', path: '/app/content/images' },
          { id: 'video', label: 'Video Creator', path: '/app/content/video' }
        ]
      }
    ]
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: Zap,
    path: '/app/automation',
    subItems: [
      {
        id: 'workflows',
        label: 'Workflows',
        path: '/app/automation/workflows',
        level3: [
          { id: 'templates', label: 'Templates', path: '/app/automation/workflows/templates' },
          { id: 'builder', label: 'Builder', path: '/app/automation/workflows/builder' },
          { id: 'active', label: 'Active', path: '/app/automation/workflows/active' }
        ]
      },
      {
        id: 'journeys',
        label: 'Customer Journeys',
        path: '/app/automation/journeys',
        level3: [
          { id: 'map', label: 'Journey Map', path: '/app/automation/journeys/map' },
          { id: 'touchpoints', label: 'Touchpoints', path: '/app/automation/journeys/touchpoints' },
          { id: 'optimization', label: 'Optimization', path: '/app/automation/journeys/optimization' }
        ]
      },
      {
        id: 'ai-agents',
        label: 'AI Agents',
        path: '/app/automation/agents',
        level3: [
          { id: 'chatbots', label: 'Chatbots', path: '/app/automation/agents/chatbots' },
          { id: 'assistants', label: 'Assistants', path: '/app/automation/agents/assistants' },
          { id: 'training', label: 'Training', path: '/app/automation/agents/training' }
        ]
      }
    ]
  }
];

// Theme toggle component
const ThemeToggle = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
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

// Sidebar navigation component
const Sidebar = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-50",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <h2 className="font-bold text-gray-900 dark:text-white">Inclufy</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Marketing AI</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 p-0"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="h-[calc(100vh-140px)]">
          <nav className="p-2">
            {navigationStructure.map((item) => (
              <div key={item.id} className="mb-1">
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    isActive(item.path) && "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-sm font-medium">
                        {item.label}
                      </span>
                      {item.subItems && (
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            expandedItems.includes(item.id) && "rotate-180"
                          )}
                        />
                      )}
                    </>
                  )}
                </button>

                {/* Level 2 items */}
                {!collapsed && item.subItems && expandedItems.includes(item.id) && (
                  <div className="ml-8 mt-1 space-y-0.5">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.id}
                        to={subItem.path}
                        className={cn(
                          "block px-3 py-2 text-sm rounded-lg transition-colors",
                          "hover:bg-gray-100 dark:hover:bg-gray-800",
                          isActive(subItem.path) && "bg-gray-100 dark:bg-gray-800 text-purple-600 dark:text-purple-400"
                        )}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-around">
            <ThemeToggle />
            {!collapsed && (
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Level 3 tabs component
const Level3Tabs = ({ items, currentPath }) => {
  const navigate = useNavigate();
  const activeTab = items.find(item => currentPath.includes(item.path))?.id || items[0]?.id;

  return (
    <Tabs value={activeTab} onValueChange={(value) => {
      const item = items.find(i => i.id === value);
      if (item) navigate(item.path);
    }}>
      <TabsList className="h-9 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {items.map((item) => (
          <TabsTrigger key={item.id} value={item.id} className="text-sm">
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

// Main layout component
export default function EnhancedNavigationLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Get current navigation context
  const getCurrentLevel3Items = () => {
    for (const l1 of navigationStructure) {
      for (const l2 of l1.subItems || []) {
        if (location.pathname.startsWith(l2.path) && l2.level3) {
          return l2.level3;
        }
      }
    }
    return null;
  };

  const level3Items = getCurrentLevel3Items();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        collapsed ? "md:ml-16" : "md:ml-64"
      )}>
        {/* Top bar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setCollapsed(!collapsed)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {/* Level 3 tabs if available */}
              {level3Items && (
                <Level3Tabs items={level3Items} currentPath={location.pathname} />
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-2">
                  <Globe className="h-4 w-4" />
                  Preview
                </Button>
                <Button size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700">
                  <Sparkles className="h-4 w-4" />
                  Create
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}