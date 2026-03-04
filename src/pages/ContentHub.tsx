// src/pages/ContentHub.tsx
// Content creation hub — central starting point for all creation tools

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import {
  Pen,
  Share2,
  Image,
  Video,
  Mail,
  BookOpen,
  ArrowRight,
  Clock,
  Sparkles,
  FileText,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ContentItem {
  id: string;
  title: string;
  type: string;
  created_at: string;
}

const creationTools = (nl: boolean) => [
  {
    title: nl ? 'AI Schrijver' : 'AI Writer',
    description: nl
      ? 'Blogs, artikelen en webteksten genereren met AI'
      : 'Generate blogs, articles and web copy with AI',
    icon: Pen,
    href: '/app/content/writer',
    color: 'from-blue-500 to-indigo-600',
    badge: 'GPT-4',
  },
  {
    title: nl ? 'Social Media Posts' : 'Social Media Posts',
    description: nl
      ? 'Posts voor Instagram, LinkedIn, Twitter en meer'
      : 'Posts for Instagram, LinkedIn, Twitter and more',
    icon: Share2,
    href: '/app/campaigns/social',
    color: 'from-pink-500 to-rose-600',
    badge: 'AI',
  },
  {
    title: nl ? 'Afbeeldingen' : 'Image Generator',
    description: nl
      ? 'Creëer unieke visuals met AI beeldgeneratie'
      : 'Create unique visuals with AI image generation',
    icon: Image,
    href: '/app/content/images',
    color: 'from-purple-500 to-violet-600',
    badge: 'DALL-E',
  },
  {
    title: nl ? 'Video Creator' : 'Video Creator',
    description: nl
      ? 'Commercials en video content produceren'
      : 'Produce commercials and video content',
    icon: Video,
    href: '/app/content/video',
    color: 'from-orange-500 to-red-600',
    badge: null,
  },
  {
    title: nl ? 'E-mail Campagnes' : 'Email Campaigns',
    description: nl
      ? 'Professionele e-mail campagnes opzetten'
      : 'Set up professional email campaigns',
    icon: Mail,
    href: '/app/campaigns/email',
    color: 'from-emerald-500 to-teal-600',
    badge: null,
  },
  {
    title: nl ? 'Tutorial Creator' : 'Tutorial Creator',
    description: nl
      ? 'Stap-voor-stap tutorials en handleidingen maken'
      : 'Create step-by-step tutorials and guides',
    icon: BookOpen,
    href: '/app/tutorial-creator',
    color: 'from-amber-500 to-yellow-600',
    badge: null,
  },
];

export default function ContentHub() {
  const { t, lang } = useLanguage();
  const nl = lang === 'nl';
  const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, published: 0 });

  useEffect(() => {
    loadRecentContent();
  }, []);

  const loadRecentContent = async () => {
    try {
      const res = await api.get('/content-library/?limit=6');
      setRecentContent(res.data?.items || []);

      // Simple stats from the response
      const items = res.data?.items || [];
      setStats({
        total: res.data?.total || items.length,
        thisWeek: items.filter((i: ContentItem) => {
          const d = new Date(i.created_at);
          const now = new Date();
          return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
        }).length,
        published: items.filter((i: ContentItem) => i.type === 'published').length,
      });
    } catch {
      // API not available, use empty state
    } finally {
      setLoading(false);
    }
  };

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      blog: 'Blog',
      social: 'Social',
      email: 'Email',
      article: nl ? 'Artikel' : 'Article',
      landing: 'Landing Page',
      video: 'Video',
    };
    return labels[type] || type;
  };

  const tools = creationTools(nl);

  return (
    <div className="w-full px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('contentHub.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('contentHub.subtitle')}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: nl ? 'Totale Content' : 'Total Content', value: stats.total, icon: FileText },
          { label: nl ? 'Deze Week' : 'This Week', value: stats.thisWeek, icon: BarChart3 },
          { label: nl ? 'Gepubliceerd' : 'Published', value: stats.published, icon: Sparkles },
        ].map((stat) => (
          <Card key={stat.label} className="border-gray-200 dark:border-gray-800">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Creation Tools Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('contentHub.createNew')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={tool.href}>
                <Card className="group cursor-pointer border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-lg transition-all duration-200">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-sm`}>
                        <tool.icon className="w-5 h-5 text-white" />
                      </div>
                      {tool.badge && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                          {tool.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                      {tool.description}
                    </p>
                    <span className="text-sm text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {nl ? 'Start' : 'Get started'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Content */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('contentHub.recent')}
          </h2>
          <Link
            to="/app/content-library"
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            {nl ? 'Bekijk alles' : 'View all'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : recentContent.length === 0 ? (
          <Card className="border-dashed border-gray-300 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <Sparkles className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {nl ? 'Nog geen content gemaakt' : 'No content created yet'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {nl
                  ? 'Gebruik een van de tools hierboven om je eerste content te maken'
                  : 'Use one of the tools above to create your first content'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentContent.map((item) => (
              <Card key={item.id} className="border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-[10px]">
                      {typeLabel(item.type)}
                    </Badge>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString(nl ? 'nl-NL' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                    {item.title}
                  </h4>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
