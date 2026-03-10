// src/components/dashboard/SmartActionsBar.tsx
// Quick-action bar with 4 AI-powered marketing actions

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCopilot } from '@/contexts/CopilotContext';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Wand2,
  TrendingUp,
  PenTool,
  BarChart3,
  Zap,
  Wallet,
  ArrowRight,
} from 'lucide-react';

const actions = [
  {
    id: 'generate',
    icon: Wand2,
    color: 'from-purple-500 to-pink-500',
    ringColor: 'ring-purple-200 dark:ring-purple-800',
    bgHover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20',
    bgActive: 'active:bg-purple-100 dark:active:bg-purple-900/40',
    label: { en: 'Generate Campaign', nl: 'Campagne Genereren', fr: 'Générer Campagne' },
    subtitle: { en: 'AI-powered creation', nl: 'AI-gestuurd aanmaken', fr: 'Création par IA' },
    type: 'copilot' as const,
    copilotPrompt: {
      systemPrompt: 'You are a campaign creation assistant. Help the user create a complete marketing campaign with target audience, messaging, channels, and scheduling. Be specific and actionable.',
      firstMessage: 'I need help creating a new marketing campaign. Analyze my brand and audience data and suggest a complete campaign strategy.',
    },
    fallbackRoute: '/app/campaign-architect',
  },
  {
    id: 'budget',
    icon: Wallet,
    color: 'from-emerald-500 to-teal-500',
    ringColor: 'ring-emerald-200 dark:ring-emerald-800',
    bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
    bgActive: 'active:bg-emerald-100 dark:active:bg-emerald-900/40',
    label: { en: 'Marketing Budget', nl: 'Marketing Budget', fr: 'Budget Marketing' },
    subtitle: { en: 'Budget & allocations', nl: 'Budget & allocaties', fr: 'Budget & allocations' },
    type: 'navigate' as const,
    route: '/app/marketing-budget',
  },
  {
    id: 'content',
    icon: PenTool,
    color: 'from-blue-500 to-indigo-500',
    ringColor: 'ring-blue-200 dark:ring-blue-800',
    bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
    bgActive: 'active:bg-blue-100 dark:active:bg-blue-900/40',
    label: { en: 'Create Content', nl: 'Content Maken', fr: 'Créer Contenu' },
    subtitle: { en: 'AI writer & design', nl: 'AI schrijver & design', fr: 'Rédacteur & design IA' },
    type: 'navigate' as const,
    route: '/app/content/writer',
  },
  {
    id: 'analyze',
    icon: BarChart3,
    color: 'from-amber-500 to-orange-500',
    ringColor: 'ring-amber-200 dark:ring-amber-800',
    bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20',
    bgActive: 'active:bg-amber-100 dark:active:bg-amber-900/40',
    label: { en: 'Analyze Performance', nl: 'Prestaties Analyseren', fr: 'Analyser Performance' },
    subtitle: { en: 'AI insights', nl: 'AI-inzichten', fr: 'Insights IA' },
    type: 'navigate' as const,
    route: '/app/analytics',
  },
];

export default function SmartActionsBar() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const navigate = useNavigate();
  const { openCopilotWithContext } = useCopilot();
  const { toast } = useToast();
  const [clickedId, setClickedId] = useState<string | null>(null);

  const getLabel = (item: typeof actions[0]) =>
    nl ? item.label.nl : fr ? item.label.fr : item.label.en;

  const getSubtitle = (item: typeof actions[0]) =>
    nl ? item.subtitle.nl : fr ? item.subtitle.fr : item.subtitle.en;

  const handleAction = (action: typeof actions[0]) => {
    setClickedId(action.id);
    setTimeout(() => setClickedId(null), 300);

    if (action.type === 'copilot' && action.copilotPrompt) {
      try {
        openCopilotWithContext(action.copilotPrompt);
        toast({
          title: nl ? 'AI Assistent geopend' : fr ? 'Assistant IA ouvert' : 'AI Assistant opened',
          description: nl ? 'De AI copilot is klaar om je te helpen' : fr ? "Le copilot IA est prêt à vous aider" : 'The AI copilot is ready to help you',
        });
      } catch {
        // Fallback: navigate to relevant page
        if ('fallbackRoute' in action && action.fallbackRoute) {
          navigate(action.fallbackRoute);
        }
      }
    } else if (action.type === 'navigate' && action.route) {
      navigate(action.route);
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50/50 via-white to-pink-50/50 dark:from-purple-900/10 dark:via-gray-900 dark:to-pink-900/10">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {nl ? 'Slimme Acties' : fr ? 'Actions Intelligentes' : 'Smart Actions'}
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              className={`relative flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 ${action.bgHover} ${action.bgActive} transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.98] text-left group cursor-pointer focus:outline-none focus:ring-2 ${action.ringColor} ${clickedId === action.id ? 'ring-2 scale-[0.98]' : ''}`}
            >
              <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
                <action.icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {getLabel(action)}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  {getSubtitle(action)}
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 dark:group-hover:text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
