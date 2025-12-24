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

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavItem[];
}

const navigation: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    title: "AI Foundation",
    href: "#",
    icon: Sparkles,
    badge: "Phase 1",
    children: [
      { title: "Brand Memory", href: "/brand-memory", icon: Brain },
      { title: "Website Analyzer", href: "/website-analyzer", icon: Globe },
      { title: "Presentation Generator", href: "/presentation-generator", icon: Presentation },
    ],
  },
  {
    title: "AI Monetization",
    href: "#",
    icon: Zap,
    badge: "Phase 2",
    children: [
      { title: "Phase 2 Overview", href: "/phase2", icon: BarChart3 },
      { title: "Email Campaigns", href: "/email-campaigns", icon: Mail },
      { title: "Landing Pages", href: "/landing-pages", icon: Globe },
    ],
  },
  {
    title: "Content Creation",
    href: "#",
    icon: Video,
    children: [
      { title: "Tutorial Creator", href: "/tutorial-creator", icon: Video },
      { title: "Commercial Creator", href: "/commercial-creator", icon: Megaphone },
      { title: "Social Posts", href: "/social-posts", icon: Share2 },
    ],
  },
  {
    title: "Library",
    href: "#",
    icon: Library,
    children: [
      { title: "Content Library", href: "/content-library", icon: Library },
      { title: "Media Library", href: "/media-library", icon: ImageIcon },
      { title: "Brand Kits", href: "/brand-kits", icon: Palette },
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
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => location.pathname === href;

  const activeTitle =
    navigation
      .flatMap((item) => item.children || [item])
      .find((item) => isActive(item.href))?.title || "Dashboard";

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300",
          "luxe-glass border-r border-white/10",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          {sidebarOpen && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-luxe-primary-500 to-luxe-accent-500 flex items-center justify-center">
                <span className="text-white text-sm font-bold">I</span>
              </div>

              <span className="luxe-heading text-xl luxe-text-gradient">Inclufy</span>
              <span className="luxe-badge luxe-badge-premium">Pro</span>
            </Link>
          )}

          {/* Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn("luxe-button luxe-button-glass", !sidebarOpen && "mx-auto")}
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
                        "w-full flex items-center justify-between",
                        "luxe-nav-item",
                        expandedItems.includes(item.title) && "bg-white/10"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {sidebarOpen && (
                          <div className="flex items-center gap-2">
                            <span>{item.title}</span>
                            {item.badge && (
                              <span className="luxe-badge luxe-badge-primary">{item.badge}</span>
                            )}
                          </div>
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
                      <ul className="mt-2 ml-4 space-y-1 border-l border-white/10 pl-4">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              to={child.href}
                              className={cn(
                                "flex items-center gap-3",
                                "luxe-nav-item",
                                isActive(child.href) && "luxe-nav-item-active"
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
                      "flex items-center gap-3",
                      "luxe-nav-item",
                      isActive(item.href) && "luxe-nav-item-active"
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
        <div className="border-t border-white/10 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 px-3",
                  "luxe-button luxe-button-glass",
                  !sidebarOpen && "px-0 justify-center"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
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
      <div className={cn("transition-all duration-300", sidebarOpen ? "pl-64" : "pl-16")}>
        {/* Top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-white/10 bg-background/70 backdrop-blur px-6">
          <div className="flex flex-1 items-center gap-4">
            <h1 className="luxe-heading text-2xl">{activeTitle}</h1>
          </div>

          <div className="flex items-center gap-4">
            <Button className="luxe-button luxe-button-premium">
              <Building className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          {/* optional but recommended: gives instant “premium platform” feel */}
          <div className="luxe-card luxe-card-hover p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
