import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Brain, 
  Globe, 
  Presentation,
  Video,
  Megaphone,
  Share2,
  Library,
  Image as ImageIcon,
  Palette,
  Settings,
  User,
  Users,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Building,
  Zap,
  BarChart3,
  Mail,
  Bot,
  GitBranch,
  MessageSquare,
  GraduationCap,
  Target,
  DollarSign,
  Shield,
  TrendingUp,
  Blocks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "AI Foundation",
    href: "#",
    icon: Sparkles,
    children: [
      {
        title: "Brand Memory",
        href: "/brand-memory",
        icon: Brain,
      },
      {
        title: "Website Analyzer",
        href: "/website-analyzer",
        icon: Globe,
      },
      {
        title: "Presentation Generator",
        href: "/presentation-generator",
        icon: Presentation,
      },
    ],
  },
  {
    title: "AI Monetization",
    href: "#",
    icon: Zap,
    children: [
      {
        title: "Phase 2 Overview",
        href: "/phase2",
        icon: BarChart3,
      },
      {
        title: "Email Campaigns",
        href: "/email-campaigns",
        icon: Mail,
      },
      {
        title: "Landing Pages",
        href: "/landing-pages",
        icon: Globe,
      },
    ],
  },
  {
    title: "Autonomy & Scale",
    href: "#",
    icon: Bot,
    children: [
      {
        title: "Journey Builder",
        href: "/journey-builder",
        icon: GitBranch,
      },
      {
        title: "Campaign Orchestrator",
        href: "/campaign-orchestrator",
        icon: Target,
      },
      {
        title: "Conversational AI",
        href: "/conversational-ai",
        icon: MessageSquare,
      },
      {
        title: "AI Training",
        href: "/ai-training",
        icon: GraduationCap,
      },
    ],
  },
  {
    title: "Enterprise",
    href: "#",
    icon: DollarSign,
    children: [
      {
        title: "Revenue Intelligence",
        href: "/revenue-intelligence",
        icon: TrendingUp,
      },
      {
        title: "Enterprise Governance",
        href: "/enterprise-governance",
        icon: Shield,
      },
    ],
  },
  {
    title: "Ecosystem",
    href: "#",
    icon: Blocks,
    children: [
      {
        title: "Partners & Academy",
        href: "/ecosystem",
        icon: Users,
      },
    ],
  },
  {
    title: "Content Creation",
    href: "#",
    icon: Video,
    children: [
      {
        title: "Tutorial Creator",
        href: "/tutorial-creator",
        icon: Video,
      },
      {
        title: "Commercial Creator",
        href: "/commercial-creator",
        icon: Megaphone,
      },
      {
        title: "Social Posts",
        href: "/social-posts",
        icon: Share2,
      },
    ],
  },
  {
    title: "Library",
    href: "#",
    icon: Library,
    children: [
      {
        title: "Content Library",
        href: "/content-library",
        icon: Library,
      },
      {
        title: "Media Library",
        href: "/media-library",
        icon: ImageIcon,
      },
      {
        title: "Brand Kits",
        href: "/brand-kits",
        icon: Palette,
      },
    ],
  },
];

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>(["AI Foundation"]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {sidebarOpen && (
            <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm">I</span>
              </div>
              <span>Inclufy</span>
              <Badge variant="secondary" className="text-xs">Pro</Badge>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(!sidebarOpen && "mx-auto")}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.title}>
                {item.children ? (
                  <>
                    <button
                      onClick={() => toggleExpanded(item.title)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        expandedItems.includes(item.title) && "bg-accent/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {sidebarOpen && (
                          <>
                            <span>{item.title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                      {sidebarOpen && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedItems.includes(item.title) && "rotate-180"
                          )}
                        />
                      )}
                    </button>
                    {expandedItems.includes(item.title) && sidebarOpen && (
                      <ul className="mt-2 ml-4 space-y-1 border-l pl-4">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              to={child.href}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                isActive(child.href)
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                              )}
                            >
                              <child.icon className="h-4 w-4" />
                              <span>{child.title}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {sidebarOpen && <span>{item.title}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-3",
                  !sidebarOpen && "px-0 justify-center"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                {sidebarOpen && (
                  <div className="flex flex-1 flex-col items-start text-left">
                    <span className="text-sm font-medium">
                      {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                    </span>
                    <span className="text-xs text-muted-foreground">Admin</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings/account")}>
                <User className="mr-2 h-4 w-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings/team")}>
                <Users className="mr-2 h-4 w-4" />
                Team Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings/application")}>
                <Settings className="mr-2 h-4 w-4" />
                Application Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarOpen ? "pl-64" : "pl-16"
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
          <div className="flex flex-1 items-center gap-4">
            <h1 className="text-2xl font-semibold">
              {navigation
                .flatMap(item => item.children || [item])
                .find(item => isActive(item.href))?.title || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Building className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}