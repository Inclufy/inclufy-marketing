// src/pages/ContentHub.tsx
// Content creation hub — central starting point for all creation tools

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRecentContent } from '@/hooks/queries/useContentLibrary';
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

const creationTools = (nl: boolean, fr: boolean) => [
  {
    title: nl ? 'AI Schrijver' : fr ? 'Rédacteur IA' : 'AI Writer',
    description: nl
      ? 'Blogs, artikelen en webteksten genereren met AI'
      : fr ? 'Générer des blogs, articles et textes web avec IA'
      : 'Generate blogs, articles and web copy with AI',
    icon: Pen,
    href: '/app/content/writer',
    color: 'from-blue-500 to-indigo-600',
    badge: 'GPT-4',
  },
  {
    title: nl ? 'Social Media Posts' : fr ? 'Publications Sociales' : 'Social Media Posts',
    description: nl
      ? 'Posts voor Instagram, LinkedIn, Twitter en meer'
      : fr ? 'Publications pour Instagram, LinkedIn, Twitter et plus'
      : 'Posts for Instagram, LinkedIn, Twitter and more',
    icon: Share2,
    href: '/app/campaigns/social',
    color: 'from-pink-500 to-rose-600',
    badge: 'AI',
  },
  {
    title: nl ? 'Afbeeldingen' : fr ? 'Générateur d\'Images' : 'Image Generator',
    description: nl
      ? 'Creëer unieke visuals met AI beeldgeneratie'
      : fr ? 'Créez des visuels uniques avec la génération d\'images IA'
      : 'Create unique visuals with AI image generation',
    icon: Image,
    href: '/app/content/images',
    color: 'from-purple-500 to-violet-600',
    badge: 'DALL-E',
  },
  {
    title: nl ? 'Video Creator' : fr ? 'Créateur Vidéo' : 'Video Creator',
    description: nl
      ? 'Commercials en video content produceren'
      : fr ? 'Produire des publicités et du contenu vidéo'
      : 'Produce commercials and video content',
    icon: Video,
    href: '/app/content/video',
    color: 'from-orange-500 to-red-600',
    badge: null,
  },
  {
    title: nl ? 'E-mail Campagnes' : fr ? 'Campagnes E-mail' : 'Email Campaigns',
    description: nl
      ? 'Professionele e-mail campagnes opzetten'
      : fr ? 'Mettre en place des campagnes e-mail professionnelles'
      : 'Set up professional email campaigns',
    icon: Mail,
    href: '/app/campaigns/email',
    color: 'from-emerald-500 to-teal-600',
    badge: null,
  },
  {
    title: nl ? 'Tutorial Creator' : fr ? 'Créateur de Tutoriels' : 'Tutorial Creator',
    description: nl
      ? 'Stap-voor-stap tutorials en handleidingen maken'
      : fr ? 'Créer des tutoriels et guides étape par étape'
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
  const fr = lang === 'fr';

  // React Query for recent content — auto caching + retry
  const { data: recentData, isLoading } = useRecentContent(6);
  const recentContent = (recentData as any)?.items || recentData || [];

  // Derive stats from fetched data
  const stats = {
    total: (recentData as any)?.total || recentContent.length,
    thisWeek: recentContent.filter((i: any) => {
      const d = new Date(i.created_at);
      const now = new Date();
      return now.getTime() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length,
    published: recentContent.filter((i: any) => i.type === 'published').length,
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

  const tools = creationTools(nl, fr);

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
          { label: nl ? 'Totale Content' : fr ? 'Contenu Total' : 'Total Content', value: stats.total, icon: FileText },
          { label: nl ? 'Deze Week' : fr ? 'Cette Semaine' : 'This Week', value: stats.thisWeek, icon: BarChart3 },
          { label: nl ? 'Gepubliceerd' : fr ? 'Publié' : 'Published', value: stats.published, icon: Sparkles },
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
                      {nl ? 'Start' : fr ? 'Commencer' : 'Get started'}
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
            {nl ? 'Bekijk alles' : fr ? 'Voir tout' : 'View all'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : recentContent.length === 0 ? (
          <Card className="border-dashed border-gray-300 dark:border-gray-700">
            <CardContent className="p-8 text-center">
              <Sparkles className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                {nl ? 'Nog geen content gemaakt' : fr ? 'Pas encore de contenu créé' : 'No content created yet'}
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
            {recentContent.map((item: any) => (
              <Card key={item.id} className="border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-[10px]">
                      {typeLabel(item.type)}
                    </Badge>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString(nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-US', {
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
