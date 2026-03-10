// src/components/dashboard/AutonomousCommandCenter.tsx
// Compact autonomous marketing command center widget for the dashboard

import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Zap,
  TrendingUp,
  Check,
  X,
  ArrowRight,
  Rocket,
  Shield,
  Loader2,
} from 'lucide-react';
import type { SystemHealth, AutonomousDecision, CampaignStatus, AutonomousMetrics } from '@/services/context-marketing/autonomous.service';

interface AutonomousCommandCenterProps {
  systemHealth: SystemHealth | null;
  isPaused: boolean;
  autonomyLevel: string;
  pendingDecisions: AutonomousDecision[];
  activeCampaigns: CampaignStatus[];
  metrics: AutonomousMetrics | null;
  campaignPerformance: {
    total_campaigns: number;
    avg_roi: number;
    total_revenue: number;
    vs_manual_performance: number;
  } | null;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onTogglePause: () => Promise<void>;
  isLoading: boolean;
}

export default function AutonomousCommandCenter({
  systemHealth,
  isPaused,
  pendingDecisions,
  activeCampaigns,
  metrics,
  campaignPerformance,
  onApprove,
  onReject,
  isLoading,
}: AutonomousCommandCenterProps) {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const navigate = useNavigate();
  const { formatCompact, symbol } = useCurrency();

  const healthScore = systemHealth?.overall_score ?? 0;
  const healthColor = healthScore >= 90 ? 'text-green-600' : healthScore >= 70 ? 'text-amber-500' : 'text-red-500';
  const statusDotColor = isPaused ? 'bg-amber-500' : 'bg-green-500';

  // Mini ring for health score
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;
  const ringColor = healthScore >= 90 ? '#10b981' : healthScore >= 70 ? '#f59e0b' : '#ef4444';

  if (isLoading) {
    return (
      <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200 dark:border-purple-800 shadow-lg overflow-hidden">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">
                {nl ? 'Autonoom Marketing Commandocentrum' : fr ? 'Centre de Commande Marketing Autonome' : 'Autonomous Marketing Command Center'}
              </h3>
              <p className="text-white/70 text-xs">
                {nl ? 'AI beheert je marketing 24/7' : fr ? "L'IA gère votre marketing 24/7" : 'AI is managing your marketing 24/7'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-white/30 text-white text-[10px] bg-white/10">
            <div className={`w-2 h-2 rounded-full ${statusDotColor} mr-1.5 animate-pulse`} />
            {isPaused
              ? (nl ? 'Gepauzeerd' : fr ? 'En pause' : 'Paused')
              : (nl ? 'Actief' : fr ? 'Actif' : 'Active')}
          </Badge>
        </div>
      </div>

      <CardContent className="p-4 space-y-4">
        {/* Health + Stats Row */}
        <div className="flex items-center gap-4">
          {/* Mini health ring */}
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r={radius} fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="4" />
              <circle cx="25" cy="25" r={radius} fill="none" stroke={ringColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xs font-bold ${healthColor}`}>{healthScore}%</span>
            </div>
          </div>

          {/* 3 mini stats */}
          <div className="flex-1 grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <Zap className="w-3 h-3 text-purple-600" />
                <span className="text-lg font-bold text-purple-600">{metrics?.decisionsPerHour ?? 0}</span>
              </div>
              <p className="text-[9px] text-gray-500 mt-0.5">
                {nl ? 'Beslissingen/uur' : fr ? 'Décisions/heure' : 'Decisions/hr'}
              </p>
            </div>
            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-lg font-bold text-green-600">{metrics?.successRate?.toFixed(0) ?? 0}%</span>
              </div>
              <p className="text-[9px] text-gray-500 mt-0.5">
                {nl ? 'Slagingspercentage' : fr ? 'Taux de réussite' : 'Success Rate'}
              </p>
            </div>
            <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="flex items-center justify-center gap-1">
                <span className="w-3 h-3 text-emerald-600 text-[10px] font-bold">{symbol}</span>
                <span className="text-lg font-bold text-emerald-600">
                  {metrics?.revenueImpact ? formatCompact(metrics.revenueImpact).replace(symbol, '') : '0'}
                </span>
              </div>
              <p className="text-[9px] text-gray-500 mt-0.5">
                {nl ? 'Omzetimpact' : fr ? 'Impact revenus' : 'Revenue Impact'}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Decisions */}
        {pendingDecisions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {nl ? 'Wachtende Beslissingen' : fr ? 'Décisions en attente' : 'Pending Decisions'}
              </h4>
              <Badge variant="secondary" className="text-[10px] h-5">{pendingDecisions.length}</Badge>
            </div>
            <div className="space-y-2">
              {pendingDecisions.slice(0, 3).map((decision) => (
                <div
                  key={decision.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-left ${
                    decision.priority === 'critical'
                      ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10'
                      : 'border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{decision.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="outline"
                        className={`text-[9px] h-4 px-1.5 ${
                          decision.priority === 'critical' ? 'border-red-300 text-red-600' :
                          decision.priority === 'high' ? 'border-orange-300 text-orange-600' :
                          'border-gray-300 text-gray-600'
                        }`}
                      >
                        {decision.priority}
                      </Badge>
                      <span className="text-[9px] text-gray-500">{decision.estimated_impact}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onApprove(decision.id)}
                      className="p-1.5 rounded-md bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 transition-colors cursor-pointer"
                    >
                      <Check className="w-3 h-3 text-green-600" />
                    </button>
                    <button
                      onClick={() => onReject(decision.id)}
                      className="p-1.5 rounded-md bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Campaigns Summary */}
        {activeCampaigns.length > 0 && (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 rounded-xl">
            <Rocket className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white">
                {activeCampaigns.length} {nl ? 'AI-campagnes actief' : fr ? 'campagnes IA actives' : 'AI campaigns running'}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {nl ? 'Gem. ROI' : fr ? 'ROI moy.' : 'Avg ROI'}: {campaignPerformance?.avg_roi?.toFixed(2) ?? '0.00'}% &middot;{' '}
                {campaignPerformance?.vs_manual_performance?.toFixed(2) ?? '0.00'}% {nl ? 'beter dan handmatig' : fr ? 'mieux que manuel' : 'better than manual'}
              </p>
            </div>
          </div>
        )}

        {/* CTA */}
        <Button
          variant="outline"
          className="w-full h-9 text-xs border-purple-200 text-purple-600 hover:bg-purple-50 dark:border-purple-800 dark:hover:bg-purple-900/20 cursor-pointer"
          onClick={() => navigate('/app/autonomous')}
        >
          <Shield className="w-3.5 h-3.5 mr-1.5" />
          {nl ? 'Open Mission Control' : fr ? 'Ouvrir Mission Control' : 'Open Mission Control'}
          <ArrowRight className="w-3.5 h-3.5 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}
