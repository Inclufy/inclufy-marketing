// src/components/dashboard/AIRecommendationsWidget.tsx
// Top 3 AI recommendations widget for the dashboard

import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  Check,
  X,
  ArrowRight,
  Loader2,
  TrendingUp,
  Clock,
} from 'lucide-react';
import type { Recommendation, RecommendationStats } from '@/services/context-marketing/recommendations.service';

interface AIRecommendationsWidgetProps {
  recommendations: Recommendation[];
  stats: RecommendationStats | null;
  onAccept: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
  isLoading: boolean;
}

const priorityConfig = {
  critical: { color: 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  high: { color: 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  medium: { color: 'border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-900/10', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  low: { color: 'border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
};

const typeIcons: Record<string, typeof TrendingUp> = {
  budget: TrendingUp,
  optimization: TrendingUp,
  content: Lightbulb,
  competitive: TrendingUp,
  automation: Clock,
  campaign: TrendingUp,
  strategic: Lightbulb,
};

export default function AIRecommendationsWidget({
  recommendations,
  stats,
  onAccept,
  onDismiss,
  isLoading,
}: AIRecommendationsWidgetProps) {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const navigate = useNavigate();
  const { formatCompact, symbol } = useCurrency();

  const totalImpact = recommendations.reduce(
    (sum, r) => sum + (r.impact_estimate.revenue || 0),
    0
  );

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50/50 to-teal-50/50 dark:from-green-900/10 dark:to-teal-900/10">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50/50 to-teal-50/50 dark:from-green-900/10 dark:to-teal-900/10">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              {nl ? 'AI Aanbevelingen' : fr ? 'Recommandations IA' : 'AI Recommendations'}
            </h3>
          </div>
          {stats && (
            <Badge variant="secondary" className="text-[10px] h-5">
              {stats.total_active}
            </Badge>
          )}
        </div>
        <p className="text-[10px] text-gray-500 mt-1 ml-8">
          {nl ? 'Slimme suggesties om je marketing te verbeteren' : fr ? 'Suggestions intelligentes pour améliorer votre marketing' : 'Smart suggestions to boost your marketing'}
        </p>
      </div>

      <CardContent className="p-4 pt-2 space-y-2">
        {recommendations.length === 0 ? (
          <div className="text-center py-6">
            <Lightbulb className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">
              {nl ? 'Geen aanbevelingen op dit moment' : fr ? 'Aucune recommandation pour le moment' : 'No recommendations right now'}
            </p>
          </div>
        ) : (
          <>
            {recommendations.map((rec) => {
              const config = priorityConfig[rec.priority];
              const TypeIcon = typeIcons[rec.type] || Lightbulb;

              return (
                <div
                  key={rec.id}
                  className={`p-2.5 rounded-lg border-l-4 ${config.color} transition-colors`}
                >
                  <div className="flex items-start gap-2">
                    <TypeIcon className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {rec.title}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-2">{rec.description}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge className={`text-[9px] h-4 px-1.5 border-0 ${config.badge}`}>
                          {rec.confidence_score}%
                        </Badge>
                        {rec.impact_estimate.revenue && (
                          <span className="text-[9px] text-green-600 font-medium">
                            +{formatCompact(rec.impact_estimate.revenue)}
                          </span>
                        )}
                        {rec.impact_estimate.engagement && !rec.impact_estimate.revenue && (
                          <span className="text-[9px] text-blue-600 font-medium">
                            +{rec.impact_estimate.engagement?.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 ml-5">
                    <button
                      onClick={() => onAccept(rec.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      <Check className="w-3 h-3" />
                      {nl ? 'Accepteer' : fr ? 'Accepter' : 'Accept'}
                    </button>
                    <button
                      onClick={() => onDismiss(rec.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Total Impact */}
            {totalImpact > 0 && (
              <div className="flex items-center justify-between p-2 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                <span className="text-[10px] text-gray-500">
                  {nl ? 'Totale potentiële impact' : fr ? 'Impact potentiel total' : 'Total potential impact'}
                </span>
                <span className="text-xs font-bold text-green-600">
                  +{formatCompact(totalImpact)}+
                </span>
              </div>
            )}

            {/* View All CTA */}
            <Button
              variant="ghost"
              className="w-full h-8 text-[10px] text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer"
              onClick={() => navigate('/app/autonomous')}
            >
              {nl ? 'Alle aanbevelingen bekijken' : fr ? 'Voir toutes les recommandations' : 'View all recommendations'}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
