// src/components/CampaignReadinessWidget.tsx
// Dashboard widget showing campaign readiness score + checklist with AI fix buttons

import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCopilot } from '@/contexts/CopilotContext';
import { useCampaignReadiness, type ReadinessItem } from '@/hooks/useCampaignReadiness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ArrowRight,
  Loader2,
  Shield,
  ExternalLink,
} from 'lucide-react';

export default function CampaignReadinessWidget() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const navigate = useNavigate();
  const { openCopilotWithContext } = useCopilot();
  const { score, items, missingItems, isLoading } = useCampaignReadiness();

  const getLabel = (item: ReadinessItem) =>
    nl ? item.label.nl : fr ? item.label.fr : item.label.en;

  const getDescription = (item: ReadinessItem) =>
    nl ? item.description.nl : fr ? item.description.fr : item.description.en;

  const getScoreColor = () => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreRingColor = () => {
    if (score >= 70) return '#10b981';
    if (score >= 40) return '#f59e0b';
    return '#ef4444';
  };

  const handleAIFix = (item: ReadinessItem) => {
    if (!item.aiFixable || !item.aiSystemPrompt) return;
    openCopilotWithContext({
      systemPrompt: item.aiSystemPrompt,
      firstMessage: item.aiFirstMessage,
    });
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  // SVG ring parameters
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-900 dark:to-purple-900/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="w-5 h-5 text-purple-600" />
          {nl ? 'Campagne Gereedheid' : fr ? 'Disponibilite Campagne' : 'Campaign Readiness'}
        </CardTitle>
        <p className="text-xs text-gray-500">
          {nl
            ? `${items.filter(i => i.completed).length}/${items.length} stappen voltooid`
            : fr
              ? `${items.filter(i => i.completed).length}/${items.length} etapes terminees`
              : `${items.filter(i => i.completed).length}/${items.length} steps completed`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Ring */}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-700"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={getScoreRingColor()}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-bold ${getScoreColor()}`}>{score}%</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {score >= 70
                ? (nl ? 'Klaar om te starten!' : fr ? 'Pret a demarrer !' : 'Ready to launch!')
                : score >= 40
                  ? (nl ? 'Bijna klaar' : fr ? 'Presque pret' : 'Almost ready')
                  : (nl ? 'Setup nodig' : fr ? 'Configuration requise' : 'Setup needed')}
            </p>
            {missingItems.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {nl
                  ? `${missingItems.length} ontbrekende ${missingItems.length === 1 ? 'stap' : 'stappen'}`
                  : fr
                    ? `${missingItems.length} etape${missingItems.length > 1 ? 's' : ''} manquante${missingItems.length > 1 ? 's' : ''}`
                    : `${missingItems.length} missing step${missingItems.length > 1 ? 's' : ''}`}
              </p>
            )}
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-2.5 p-2 rounded-lg transition-colors ${
                item.completed
                  ? 'bg-green-50 dark:bg-green-900/10'
                  : 'bg-gray-50 dark:bg-gray-800/50'
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${item.completed ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  {getLabel(item)}
                </p>
                {!item.completed && (
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{getDescription(item)}</p>
                )}
              </div>
              {!item.completed && (
                item.aiFixable ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAIFix(item)}
                    className="h-6 px-2 text-[10px] text-purple-600 hover:text-purple-700 hover:bg-purple-50 gap-1 flex-shrink-0"
                  >
                    <Sparkles className="w-3 h-3" />
                    {nl ? 'AI Fix' : 'AI Fix'}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(item.fixRoute)}
                    className="h-6 px-2 text-[10px] text-gray-500 hover:text-gray-700 gap-1 flex-shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {nl ? 'Ga naar' : fr ? 'Aller a' : 'Go to'}
                  </Button>
                )
              )}
            </div>
          ))}
        </div>

        {/* AI Fix All Button */}
        {missingItems.filter(i => i.aiFixable).length > 0 && (
          <Button
            onClick={() => {
              const firstAIFixable = missingItems.find(i => i.aiFixable && i.aiSystemPrompt);
              if (firstAIFixable) handleAIFix(firstAIFixable);
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs h-9"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {nl
              ? 'Laat AI ontbrekende stappen invullen'
              : fr
                ? 'Laisser l\'IA completer les etapes manquantes'
                : 'Let AI complete missing steps'}
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
