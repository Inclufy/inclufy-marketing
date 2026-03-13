// src/components/navigation/SideNav.tsx
// Sidebar navigatie component — geïnspireerd op ProjeXtPal
// Alle menu items hebben sub-items voor consistentie

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Crown,
  Building,
  Target,
  Brain,
  Sparkles,
  Rocket,
  Bot,
  BarChart3,
  Users,
  Settings,
  Search,
  Globe,
  Mail,
  Share2,
  FileText,
  Palette,
  GitBranch,
  Activity,
  TrendingUp,
  CreditCard,
  Plug,
  Send,
  Lightbulb,
  CalendarDays,
  Rss,
  Zap,
  Eye,
  User as UserIcon,
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  LineChart,
  BookOpen,
  Image,
  Pen,
  MessageSquare,
  Contact,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SideNavProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function SideNav({ collapsed, onToggle }: SideNavProps) {
  const location = useLocation();
  const { t, lang } = useLanguage();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (key: string) => {
    setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isActive = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + '/');

  const nl = lang === 'nl';
  const fr = lang === 'fr';

  // ─── Navigation structure — alle items met sub-items ─────────
  const mainNavItems = [
    {
      key: 'dashboard',
      label: t('nav.overview'),
      href: '/app/dashboard',
      icon: LayoutDashboard,
    },
    {
      key: 'autonomous',
      label: nl ? 'AI Marketing' : fr ? 'Marketing IA' : 'AI Marketing',
      href: '/app/autonomous',
      icon: Brain,
      badge: 'AI',
    },
    {
      key: 'marketing-budget',
      label: nl ? 'Marketing Budget' : fr ? 'Budget Marketing' : 'Marketing Budget',
      href: '/app/marketing-budget',
      icon: CreditCard,
    },
    {
      key: 'integrations',
      label: nl ? 'Integraties' : fr ? 'Intégrations' : 'Integrations',
      href: '/app/integrations',
      icon: Plug,
      badge: 'NEW',
    },
    {
      key: 'opportunity-feed',
      label: nl ? 'Opportunity Feed' : fr ? 'Flux d\'Opportunités' : 'Opportunity Feed',
      href: '/app/opportunity-feed',
      icon: Rss,
      badge: 'AI',
    },
    {
      key: 'setup',
      label: nl ? 'Configuratie' : 'Configuration',
      icon: Building,
      children: [
        { label: nl ? 'Merk Setup' : fr ? 'Configuration Marque' : 'Brand Setup', href: '/app/setup/brand', icon: Palette },
        { label: nl ? 'Doelgroep' : fr ? 'Public Cible' : 'Target Audience', href: '/app/setup/audience', icon: Users },
        { label: nl ? 'Doelen & KPIs' : fr ? 'Objectifs & KPIs' : 'Goals & KPIs', href: '/app/setup/goals', icon: Target },
        { label: nl ? 'Concurrentie' : fr ? 'Concurrence' : 'Competition', href: '/app/setup/competition', icon: Globe },
      ],
    },
    {
      key: 'intelligence',
      label: t('nav.intelligence'),
      icon: Brain,
      children: [
        { label: nl ? 'Groei Blauwdruk' : fr ? 'Plan de Croissance' : 'Growth Blueprint', href: '/app/growth-blueprint', icon: Sparkles, badge: 'AI' },
        { label: nl ? 'Merkgeheugen' : fr ? 'Mémoire de Marque' : 'Brand Memory', href: '/app/intelligence/brand', icon: Brain, badge: 'AI' },
        { label: nl ? 'Marktinzichten' : fr ? 'Insights Marché' : 'Market Insights', href: '/app/intelligence/market', icon: TrendingUp },
        { label: nl ? 'Concurrentieanalyse' : fr ? 'Analyse Concurrentielle' : 'Competitor Analysis', href: '/app/intelligence/competitors', icon: Users },
        { label: nl ? 'Content Studio' : fr ? 'Studio de Contenu' : 'Content Studio', href: '/app/content-studio', icon: Sparkles, badge: 'NEW' },
        { label: nl ? 'Opportunity Intelligence' : fr ? 'Intelligence des Opportunités' : 'Opportunity Intelligence', href: '/app/opportunity-intelligence', icon: Lightbulb, badge: 'AI' },
        { label: nl ? 'Event Intelligence' : fr ? 'Intelligence Événementielle' : 'Event Intelligence', href: '/app/event-intelligence', icon: CalendarDays },
      ],
    },
    {
      key: 'campaigns',
      label: t('nav.campaigns'),
      icon: Rocket,
      children: [
        { label: nl ? 'Campagne Beheer' : fr ? 'Gestion de Campagnes' : 'Campaign Manager', href: '/app/campaigns', icon: Rocket },
        { label: nl ? 'E-mail Marketing' : fr ? 'Marketing par E-mail' : 'Email Marketing', href: '/app/campaigns/email', icon: Mail },
        { label: nl ? 'Social Media' : fr ? 'Réseaux Sociaux' : 'Social Media', href: '/app/campaigns/social', icon: Share2 },
        { label: nl ? 'Landingspagina\'s' : fr ? "Pages d'Atterrissage" : 'Landing Pages', href: '/app/campaigns/landing', icon: FileText },
      ],
    },
    {
      key: 'content-hub',
      label: fr ? 'Hub de Contenu' : 'Content Hub',
      icon: Sparkles,
      children: [
        { label: nl ? 'Overzicht' : fr ? 'Aperçu' : 'Overview', href: '/app/content-hub', icon: LayoutDashboard },
        { label: nl ? 'AI Schrijver' : fr ? 'Rédacteur IA' : 'AI Writer', href: '/app/content/writer', icon: Pen },
        { label: nl ? 'Afbeeldingen' : fr ? 'Générateur d\'Images' : 'Image Generator', href: '/app/content/images', icon: Image },
        { label: nl ? 'Video Creator' : fr ? 'Créateur Vidéo' : 'Video Creator', href: '/app/content/video', icon: MessageSquare },
        { label: nl ? 'Media Bibliotheek' : fr ? 'Médiathèque' : 'Media Library', href: '/app/media-library', icon: BookOpen },
        { label: nl ? 'Kalender' : fr ? 'Calendrier' : 'Calendar', href: '/app/content/calendar', icon: Calendar },
        { label: nl ? 'Goedkeuring' : fr ? 'Approbation' : 'Approvals', href: '/app/content/approvals', icon: CheckCircle },
        { label: nl ? 'Publicatie Engine' : fr ? 'Moteur de Publication' : 'Publication Engine', href: '/app/publish', icon: Send, badge: 'NEW' },
      ],
    },
    {
      key: 'automation',
      label: t('nav.automation'),
      icon: Bot,
      badge: 'PRO',
      children: [
        { label: 'Workflows', href: '/app/automation/workflows', icon: GitBranch },
        { label: nl ? 'Klantreis' : fr ? 'Parcours Client' : 'Customer Journey', href: '/app/automation/journeys', icon: Activity },
        { label: nl ? 'Multi-Agent Systeem' : fr ? 'Système Multi-Agent' : 'Multi-Agent System', href: '/app/automation/agents', icon: Bot, badge: 'AI' },
        { label: nl ? 'Slimme Triggers' : fr ? 'Déclencheurs Intelligents' : 'Smart Triggers', href: '/app/automation/triggers', icon: Sparkles },
        { label: nl ? 'Campaign Triggering' : fr ? 'Déclenchement de Campagnes' : 'Campaign Triggering', href: '/app/campaign-triggering', icon: Zap, badge: 'AI' },
      ],
    },
    {
      key: 'analytics',
      label: t('nav.analytics'),
      icon: BarChart3,
      children: [
        { label: nl ? 'Overzicht' : fr ? 'Aperçu' : 'Overview', href: '/app/analytics', icon: BarChart3 },
        { label: nl ? 'Rapporten' : fr ? 'Rapports' : 'Reports', href: '/app/reports', icon: LineChart },
        { label: nl ? 'Contacten' : 'Contacts', href: '/app/contacts', icon: Contact },
        { label: nl ? 'Lead Scoring' : fr ? 'Scoring de Leads' : 'Lead Scoring', href: '/app/lead-scoring', icon: Target, badge: 'AI' },
        { label: nl ? 'Attributie' : fr ? 'Attribution' : 'Attribution', href: '/app/attribution', icon: GitBranch },
        { label: nl ? 'Lead Intelligence' : fr ? 'Intelligence des Leads' : 'Lead Intelligence', href: '/app/lead-intelligence', icon: Eye, badge: 'AI' },
      ],
    },
    {
      key: 'networking',
      label: nl ? 'Networking Engine' : fr ? 'Moteur de Networking' : 'Networking Engine',
      href: '/app/networking',
      icon: Users,
      badge: 'NEW',
    },
  ];

  const bottomNavItems = [
    { label: t('nav.profile'), href: '/app/profile', icon: UserIcon },
    { label: t('nav.settings'), href: '/app/settings', icon: Settings },
    { label: t('nav.adminPortal'), href: '/app/tenant-admin', icon: Crown },
  ];

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40 transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      {/* ─── Logo ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <Link to="/app" className="flex items-center min-w-0">
          {collapsed ? (
            <img src="/favicon.svg" alt="Inclufy" className="w-8 h-8 rounded-lg shadow-md shrink-0" />
          ) : (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
              <img src="/logo-inclufy-dark.svg" alt="Inclufy - AI Marketing" className="h-9" />
            </motion.div>
          )}
        </Link>
      </div>

      {/* ─── Collapse toggle ──────────────────────────────── */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-[72px] w-6 h-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-colors shadow-sm z-50"
      >
        {collapsed ? <PanelLeft className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
      </button>

      {/* ─── Main Nav ─────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {mainNavItems.map((item) => {
          if (item.children) {
            const hasActiveChild = item.children.some(c => isActive(c.href));
            const isOpen = openMenus[item.key] ?? hasActiveChild;

            return (
              <div key={item.key}>
                <button
                  onClick={() => toggleMenu(item.key)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors",
                    hasActiveChild
                      ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left truncate">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[9px] px-1.5 py-0 h-4",
                            item.badge === 'PRO' && "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0",
                            item.badge === 'AI' && "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", isOpen && "rotate-180")} />
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {isOpen && !collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-3 pl-3 border-l border-gray-200 dark:border-gray-700 mt-0.5 space-y-px">
                        {item.children.map((child) => (
                          <Link
                            key={child.href + child.label}
                            to={child.href}
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-1.5 text-[13px] rounded-md transition-colors",
                              isActive(child.href)
                                ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 font-medium"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                          >
                            <child.icon className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{child.label}</span>
                            {child.badge && (
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 ml-auto">
                                {child.badge}
                              </Badge>
                            )}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          // Simple link item (Dashboard, AI Marketing, etc.)
          return (
            <Link
              key={item.href}
              to={item.href!}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium rounded-lg transition-colors",
                isActive(item.href!)
                  ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {(item as any).badge && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[9px] px-1.5 py-0 h-4",
                        (item as any).badge === 'AI' && "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0"
                      )}
                    >
                      {(item as any).badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ─── Bottom Section ────────────────────────────────── */}
      <div className="border-t border-gray-200 dark:border-gray-800 px-2 py-2 space-y-0.5 shrink-0">
        {!collapsed && (
          <div className="mb-2 mx-1 p-2.5 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200/50 dark:border-purple-700/30">
            <p className="text-[9px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Current Plan
            </p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">Enterprise</p>
            <Link
              to="/pricing"
              className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 mt-1.5 font-medium"
            >
              <CreditCard className="h-3 w-3" />
              Manage Plan
            </Link>
          </div>
        )}

        {bottomNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-1.5 text-[13px] rounded-lg transition-colors",
              isActive(item.href)
                ? "text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 font-medium"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </div>
    </aside>
  );
}
