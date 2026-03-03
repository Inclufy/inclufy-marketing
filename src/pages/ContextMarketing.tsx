// src/pages/ContextMarketing.tsx
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Target, Rocket, Zap, BarChart3, Bot, Brain,
  Sparkles, Users, Mail, MessageSquare, FileText, Image, Pen,
  Globe, Building, ArrowRight, Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const sections = [
  {
    title: 'Marketing Foundation',
    icon: Building,
    color: 'from-purple-600 to-indigo-600',
    items: [
      { label: 'Brand Memory', desc: 'Define brand voice & knowledge', href: '/app/brand-memory', icon: Brain },
      { label: 'Target Audience', desc: 'Customer personas & segments', href: '/app/setup/audience', icon: Users },
      { label: 'Competitive Analysis', desc: 'Market positioning', href: '/app/setup/competition', icon: Target },
      { label: 'Goals & KPIs', desc: 'Set measurable objectives', href: '/app/setup/goals', icon: Activity },
    ],
  },
  {
    title: 'Content Creation',
    icon: Sparkles,
    color: 'from-pink-600 to-rose-600',
    items: [
      { label: 'AI Writer', desc: 'Generate blogs, articles, ad copy', href: '/app/content/writer', icon: Pen },
      { label: 'Email Campaigns', desc: 'Create & send email campaigns', href: '/app/campaigns/email', icon: Mail },
      { label: 'Social Media', desc: 'Generate social media posts', href: '/app/campaigns/social', icon: MessageSquare },
      { label: 'Landing Pages', desc: 'Build AI-powered landing pages', href: '/app/campaigns/landing', icon: Globe },
      { label: 'Image Generator', desc: 'Create marketing visuals', href: '/app/content/images', icon: Image },
      { label: 'Content Library', desc: 'Browse saved content', href: '/app/content-library', icon: FileText },
    ],
  },
  {
    title: 'Campaign Management',
    icon: Rocket,
    color: 'from-blue-600 to-cyan-600',
    items: [
      { label: 'Campaign Orchestrator', desc: 'Plan & manage campaigns', href: '/app/campaigns', icon: Rocket },
      { label: 'Contact Manager', desc: 'Manage contacts & lists', href: '/app/contacts', icon: Users },
    ],
  },
  {
    title: 'Automation',
    icon: Zap,
    color: 'from-amber-600 to-orange-600',
    items: [
      { label: 'Workflow Builder', desc: 'Automate marketing workflows', href: '/app/automation/workflows', icon: Zap },
      { label: 'Customer Journeys', desc: 'Design customer paths', href: '/app/automation/journeys', icon: Target },
      { label: 'AI Agents', desc: 'Conversational AI assistants', href: '/app/automation/agents', icon: Bot },
    ],
  },
  {
    title: 'Analytics & Intelligence',
    icon: BarChart3,
    color: 'from-emerald-600 to-green-600',
    items: [
      { label: 'Analytics Dashboard', desc: 'Track performance metrics', href: '/app/analytics', icon: BarChart3 },
      { label: 'Growth Blueprint', desc: 'Company analysis & insights', href: '/app/growth-blueprint', icon: Target },
      { label: 'Market Intelligence', desc: 'Market trends & data', href: '/app/intelligence/market', icon: Globe },
    ],
  },
];

export default function ContextMarketing() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                Marketing Hub
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Your complete AI-powered marketing toolkit
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${section.color}`}>
                <section.icon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold">{section.title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.items.map((item) => (
                <Link to={item.href} key={item.label}>
                  <Card className="h-full cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 border-gray-200 dark:border-gray-800">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                          <item.icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{item.label}</h3>
                          <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
