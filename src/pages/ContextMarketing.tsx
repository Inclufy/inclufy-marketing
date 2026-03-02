// src/pages/ContextMarketing.tsx
import { useState } from 'react';
import { 
  LayoutDashboard,
  Target,
  Search,
  Rocket,
  Zap,
  BarChart3,
  Bot,
  Brain,
  Sparkles,
  Settings,
  HelpCircle,
  ChevronRight,
  Menu,
  X,
  Users,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Activity,
  Building,
  Globe,
  Award,
  FileText,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Placeholder components - replace these imports with actual components when ready
const CompetitiveAnalysisMarketing = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold">Competitive Analysis</h1>
    <Card>
      <CardHeader>
        <CardTitle>Market Position Analysis</CardTitle>
        <CardDescription>Understand your competitive landscape</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Competitive analysis component coming soon...</p>
      </CardContent>
    </Card>
  </div>
);

const GoalsAndKPIs = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold">Goals & KPIs</h1>
    <Card>
      <CardHeader>
        <CardTitle>Set Your Marketing Goals</CardTitle>
        <CardDescription>Track measurable objectives and key performance indicators</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Goals & KPIs component coming soon...</p>
      </CardContent>
    </Card>
  </div>
);

const MarketingDashboard = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold">Marketing Dashboard</h1>
    <Card>
      <CardHeader>
        <CardTitle>Marketing Overview</CardTitle>
        <CardDescription>Your marketing performance at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Marketing dashboard component coming soon...</p>
      </CardContent>
    </Card>
  </div>
);
// Default placeholder for undefined components
const PlaceholderComponent = ({ title = "Coming Soon" }) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold">{title}</h1>
    <Card>
      <CardContent className="py-12 text-center">
        <p className="text-gray-600">This feature is being developed...</p>
      </CardContent>
    </Card>
  </div>
);

// Define all placeholder components BEFORE using them in menuStructure
const BusinessContextSetup = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold">Business Context Setup</h1>
    <Card>
      <CardHeader>
        <CardTitle>Define Your Business Foundation</CardTitle>
        <CardDescription>Set up your company's mission, vision, and values</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Business context setup interface coming soon...</p>
      </CardContent>
    </Card>
  </div>
);

const TargetAudienceBuilder = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold">Target Audience Builder</h1>
    <Card>
      <CardHeader>
        <CardTitle>Create Customer Personas</CardTitle>
        <CardDescription>Define your ideal customers with AI assistance</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Audience builder coming soon...</p>
      </CardContent>
    </Card>
  </div>
);

// Create placeholder components for all missing ones
const CampaignPlanner = () => <PlaceholderComponent title="Campaign Planner" />;
const ContentCalendar = () => <PlaceholderComponent title="Content Calendar" />;
const EmailMarketing = () => <PlaceholderComponent title="Email Marketing" />;
const SocialMediaHub = () => <PlaceholderComponent title="Social Media Hub" />;
const ContentStudio = () => <PlaceholderComponent title="Content Studio" />;
const WorkflowBuilder = () => <PlaceholderComponent title="Workflow Builder" />;
const CustomerJourneys = () => <PlaceholderComponent title="Customer Journeys" />;
const SmartTriggers = () => <PlaceholderComponent title="Smart Triggers" />;
const PerformanceDashboard = () => <PlaceholderComponent title="Performance Dashboard" />;
const AttributionAnalysis = () => <PlaceholderComponent title="Attribution Analysis" />;
const CustomReports = () => <PlaceholderComponent title="Custom Reports" />;
const AIAssistant = () => <PlaceholderComponent title="AI Marketing Assistant" />;
const PredictiveAnalytics = () => <PlaceholderComponent title="Predictive Analytics" />;
const SmartOptimization = () => <PlaceholderComponent title="Smart Optimization" />;

// Marketing-focused menu structure
const menuStructure = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    component: MarketingDashboard,
  },
  
  { separator: true },
  
  {
    id: 'foundation',
    label: 'Marketing Foundation',
    icon: Building,
    badge: '3/5',
    badgeVariant: 'outline' as const,
    subtabs: [
      {
        id: 'business-context',
        label: 'Business Context',
        component: BusinessContextSetup,
        description: 'Mission, vision, values',
      },
      {
        id: 'target-audience',
        label: 'Target Audience',
        component: TargetAudienceBuilder,
        description: 'Customer personas & segments',
      },
      {
        id: 'competitors',
        label: 'Competitive Analysis',
        component: CompetitiveAnalysisMarketing,
        description: 'Market positioning',
      },
    ],
  },
  
  {
    id: 'strategy',
    label: 'Strategy & Planning',
    icon: Target,
    badge: 12,
    subtabs: [
      {
        id: 'goals',
        label: 'Goals & KPIs',
        component: GoalsAndKPIs,
        description: 'Set measurable objectives',
      },
      {
        id: 'campaigns',
        label: 'Campaign Planning',
        component: CampaignPlanner,
        description: 'Plan your marketing campaigns',
      },
      {
        id: 'content-calendar',
        label: 'Content Calendar',
        component: ContentCalendar,
        description: 'Schedule your content',
      },
    ],
  },
  
  {
    id: 'execution',
    label: 'Campaign Execution',
    icon: Rocket,
    badge: 'Active',
    badgeVariant: 'default' as const,
    subtabs: [
      {
        id: 'email',
        label: 'Email Marketing',
        component: EmailMarketing,
        description: 'Create & send campaigns',
      },
      {
        id: 'social',
        label: 'Social Media',
        component: SocialMediaHub,
        description: 'Manage social presence',
      },
      {
        id: 'content',
        label: 'Content Creation',
        component: ContentStudio,
        description: 'AI-powered content',
      },
    ],
  },
  
  {
    id: 'automation',
    label: 'Marketing Automation',
    icon: Zap,
    badge: 23,
    subtabs: [
      {
        id: 'workflows',
        label: 'Workflow Builder',
        component: WorkflowBuilder,
        description: 'Automate repetitive tasks',
      },
      {
        id: 'journeys',
        label: 'Customer Journeys',
        component: CustomerJourneys,
        description: 'Design customer paths',
      },
      {
        id: 'triggers',
        label: 'Smart Triggers',
        component: SmartTriggers,
        description: 'Event-based automation',
      },
    ],
  },
  
  {
    id: 'analytics',
    label: 'Analytics & Insights',
    icon: BarChart3,
    subtabs: [
      {
        id: 'performance',
        label: 'Performance Dashboard',
        component: PerformanceDashboard,
        description: 'Track key metrics',
      },
      {
        id: 'attribution',
        label: 'Attribution Analysis',
        component: AttributionAnalysis,
        description: 'Understand what works',
      },
      {
        id: 'reports',
        label: 'Custom Reports',
        component: CustomReports,
        description: 'Build your own reports',
      },
    ],
  },
  
  { separator: true },
  
  {
    id: 'ai-tools',
    label: 'AI Marketing Suite',
    icon: Bot,
    badge: 'NEW',
    badgeVariant: 'default' as const,
    subtabs: [
      {
        id: 'ai-assistant',
        label: 'Marketing Assistant',
        component: AIAssistant,
        description: 'Your AI marketing partner',
      },
      {
        id: 'predictive',
        label: 'Predictive Analytics',
        component: PredictiveAnalytics,
        description: 'Forecast trends & outcomes',
      },
      {
        id: 'optimization',
        label: 'Smart Optimization',
        component: SmartOptimization,
        description: 'AI-powered improvements',
      },
    ],
  },
];

export default function ContextMarketing() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSubtab, setActiveSubtab] = useState<string | null>(null);
  const [expandedTabs, setExpandedTabs] = useState<string[]>(['foundation']);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get current component
  const getCurrentComponent = () => {
    const tab = menuStructure.find(t => t.id === activeTab);
    if (!tab || tab.separator) return null;

    if (tab.component) {
      return <tab.component />;
    }

    if (tab.subtabs && activeSubtab) {
      const subtab = tab.subtabs.find(st => st.id === activeSubtab);
      if (subtab?.component) {
        return <subtab.component />;
      }
    }

    // Default to first subtab
    if (tab.subtabs && tab.subtabs.length > 0) {
      const firstSubtab = tab.subtabs[0];
      if (firstSubtab.component) {
        return <firstSubtab.component />;
      }
    }

    return <PlaceholderComponent />;
  };

  const toggleTabExpansion = (tabId: string) => {
    setExpandedTabs(prev => 
      prev.includes(tabId) 
        ? prev.filter(id => id !== tabId)
        : [...prev, tabId]
    );
  };

  const handleTabClick = (tab: any) => {
    if (tab.separator) return;
    
    setActiveTab(tab.id);
    if (tab.subtabs && tab.subtabs.length > 0) {
      setActiveSubtab(tab.subtabs[0].id);
      toggleTabExpansion(tab.id);
    } else {
      setActiveSubtab(null);
    }
    setMobileMenuOpen(false);
  };

  const handleSubtabClick = (tabId: string, subtabId: string) => {
    setActiveTab(tabId);
    setActiveSubtab(subtabId);
    setMobileMenuOpen(false);
  };

  // Calculate completion percentage
  const completionPercentage = 35; // This would be calculated based on actual setup completion

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Context Marketing
              </h1>
              <Badge variant="outline" className="hidden sm:inline-flex">
                <Activity className="w-3 h-3 mr-1" />
                {completionPercentage}% Complete
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                <Lightbulb className="w-4 h-4 mr-2" />
                Tips
              </Button>
              <Button variant="outline" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
              
              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="pb-4">
            <Progress value={completionPercentage} className="h-1" />
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className={cn(
          "w-72 bg-white dark:bg-gray-800 border-r h-[calc(100vh-5rem)] overflow-hidden",
          "hidden lg:block",
          mobileMenuOpen && "block fixed inset-0 z-50 top-20 lg:relative"
        )}>
          <ScrollArea className="h-full px-3 py-4">
            <nav className="space-y-1">
              {menuStructure.map((tab) => {
                if (tab.separator) {
                  return <Separator key={`sep-${Math.random()}`} className="my-2" />;
                }

                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const isExpanded = expandedTabs.includes(tab.id);

                return (
                  <div key={tab.id}>
                    <button
                      onClick={() => handleTabClick(tab)}
                      className={cn(
                        "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-200"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      )}
                    >
                      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                      <span className="flex-1 text-left">{tab.label}</span>
                      {tab.badge && (
                        <Badge 
                          variant={tab.badgeVariant || 'secondary'} 
                          className="ml-2"
                        >
                          {tab.badge}
                        </Badge>
                      )}
                      {tab.subtabs && (
                        <ChevronRight className={cn(
                          "w-4 h-4 ml-2 transition-transform",
                          isExpanded && "rotate-90"
                        )} />
                      )}
                    </button>

                    {/* Subtabs */}
                    {tab.subtabs && isExpanded && (
                      <div className="ml-8 mt-1 space-y-1">
                        {tab.subtabs.map((subtab) => {
                          const isSubActive = activeTab === tab.id && activeSubtab === subtab.id;
                          
                          return (
                            <button
                              key={subtab.id}
                              onClick={() => handleSubtabClick(tab.id, subtab.id)}
                              className={cn(
                                "w-full flex flex-col items-start px-3 py-2 text-sm rounded-md transition-colors",
                                isSubActive
                                  ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                              )}
                            >
                              <span className="font-medium">{subtab.label}</span>
                              {subtab.description && (
                                <span className="text-xs text-gray-500 mt-0.5">{subtab.description}</span>
                              )}
                              {subtab.badge && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {subtab.badge}
                                </Badge>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Help Card */}
            <Card className="mt-6 mx-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <p className="font-medium text-sm">Pro Tip</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Complete your business context to unlock AI-powered insights and recommendations.
                </p>
                <Button size="sm" className="w-full mt-3" variant="outline">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {getCurrentComponent()}
          </div>
        </main>
      </div>
    </div>
  );
}