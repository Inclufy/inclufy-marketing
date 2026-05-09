'use client';

import { useMemo } from 'react';
import { useProposals, useProposalStats } from '@/hooks/useProposals';
import { useEvents, useEventStats } from '@/hooks/useEvents';
import { useCampaigns, useCampaignStats } from '@/hooks/useCampaigns';
import { useAutomationStats } from '@/hooks/useAutomations';
import { formatCurrency, channelIcon } from '@/lib/utils';
import {
  Calendar, Megaphone, FileText, Zap, Activity,
  TrendingUp, BarChart3, PieChart,
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, bgColor }: {
  label: string; value: string | number; icon: any; color: string; bgColor: string;
}) {
  return (
    <div className={`rounded-xl p-5 ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function BarChart({ data, maxValue, colorMap }: { data: [string, number][]; maxValue: number; colorMap: Record<string, string> }) {
  return (
    <div className="space-y-3">
      {data.map(([label, value]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="w-20 text-xs text-gray-500 truncate flex items-center gap-1">
            {channelIcon(label)} {label}
          </span>
          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`, backgroundColor: colorMap[label] || '#6366F1' }}
            />
          </div>
          <span className="w-8 text-right text-xs font-semibold text-gray-700">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { data: proposals } = useProposals();
  const { data: proposalStats } = useProposalStats();
  const { data: events } = useEvents();
  const { data: eventStats } = useEventStats();
  const { data: campaigns } = useCampaigns();
  const { data: campaignStats } = useCampaignStats();
  const { data: autoStats } = useAutomationStats();

  // Campaign performance
  const campPerf = useMemo(() => {
    const c = campaigns || [];
    return {
      total: c.length,
      active: c.filter(x => x.status === 'active').length,
      totalBudget: c.reduce((s, x) => s + (x.budget_amount || 0), 0),
      totalSpent: c.reduce((s, x) => s + (x.spent_amount || 0), 0),
    };
  }, [campaigns]);

  // Content by channel
  const channelBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    (proposals || []).forEach(p => { counts[p.channel] = (counts[p.channel] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [proposals]);

  const maxChannelCount = channelBreakdown.length > 0 ? channelBreakdown[0][1] : 1;

  const CHANNEL_COLORS: Record<string, string> = {
    linkedin: '#0A66C2', instagram: '#E4405F', facebook: '#1877F2', tiktok: '#000000', x: '#1DA1F2',
  };

  // Health score
  const healthScore = useMemo(() => {
    let score = 0;
    if ((eventStats?.total ?? 0) > 0) score += 25;
    if ((campaignStats?.active ?? 0) > 0) score += 25;
    if ((proposalStats?.pending ?? 0) + (proposalStats?.approved ?? 0) > 0) score += 25;
    if ((autoStats?.active ?? 0) > 0) score += 25;
    return score;
  }, [eventStats, campaignStats, proposalStats, autoStats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics & Rapportage</h1>
        <p className="text-gray-500">Inzicht in je marketing prestaties</p>
      </div>

      {/* Health Score Banner */}
      <div className="rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Marketing Health Score</h2>
            <p className="text-brand-100 text-sm mt-1">
              {healthScore === 100 ? 'Alles draait optimaal!' :
               healthScore >= 75 ? 'Bijna volledig operationeel' :
               healthScore >= 50 ? 'Goede start, er zijn nog verbeterpunten' :
               'Begin met events en campaigns aanmaken'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-4xl font-bold">{healthScore}%</div>
            <Activity className="h-8 w-8 text-brand-200" />
          </div>
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/20">
          <div className="h-2 rounded-full bg-white transition-all" style={{ width: `${healthScore}%` }} />
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Events" value={eventStats?.total ?? 0} icon={Calendar} color="text-blue-600" bgColor="bg-blue-50" />
        <StatCard label="Campagnes" value={campPerf.total} icon={Megaphone} color="text-purple-600" bgColor="bg-purple-50" />
        <StatCard label="Content" value={proposalStats?.total ?? 0} icon={FileText} color="text-amber-600" bgColor="bg-amber-50" />
        <StatCard label="Automations" value={autoStats?.active ?? 0} icon={Zap} color="text-green-600" bgColor="bg-green-50" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Campaign Performance */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Campagne Prestaties</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-xl font-bold text-green-600">{campPerf.active}</p>
              <p className="text-xs text-gray-500">Actief</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-900">{formatCurrency(campPerf.totalBudget)}</p>
              <p className="text-xs text-gray-500">Budget</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-amber-600">{formatCurrency(campPerf.totalSpent)}</p>
              <p className="text-xs text-gray-500">Besteed</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-brand-600">{autoStats?.successRate ?? 0}%</p>
              <p className="text-xs text-gray-500">Succes</p>
            </div>
          </div>
        </div>

        {/* Content Pipeline */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Content Pipeline</h3>
          </div>
          <div className="flex justify-around">
            {[
              { label: 'Wachtend', value: proposalStats?.pending ?? 0, color: 'text-amber-600 bg-amber-100' },
              { label: 'Goedgekeurd', value: proposalStats?.approved ?? 0, color: 'text-green-600 bg-green-100' },
              { label: 'Afgewezen', value: proposalStats?.rejected ?? 0, color: 'text-red-600 bg-red-100' },
              { label: 'Gepubliceerd', value: proposalStats?.published ?? 0, color: 'text-indigo-600 bg-indigo-100' },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${item.color}`}>
                  {item.value}
                </div>
                <p className="text-[10px] text-gray-500 mt-2">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Content per Channel */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Content per Kanaal</h3>
          </div>
          {channelBreakdown.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Nog geen content</p>
          ) : (
            <BarChart data={channelBreakdown} maxValue={maxChannelCount} colorMap={CHANNEL_COLORS} />
          )}
        </div>

        {/* Event Overview */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Event Overzicht</h3>
          </div>
          <div className="flex justify-around">
            {[
              { label: 'Aankomend', value: eventStats?.upcoming ?? 0, color: 'text-blue-600' },
              { label: 'Actief', value: eventStats?.active ?? 0, color: 'text-green-600' },
              { label: 'Voltooid', value: eventStats?.completed ?? 0, color: 'text-gray-500' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
