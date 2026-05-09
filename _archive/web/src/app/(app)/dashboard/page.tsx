'use client';

import { useEvents, useEventStats } from '@/hooks/useEvents';
import { useCampaigns, useCampaignStats } from '@/hooks/useCampaigns';
import { useProposalStats } from '@/hooks/useProposals';
import { useAutomationStats } from '@/hooks/useAutomations';
import { formatDate, statusColor, channelIcon } from '@/lib/utils';
import Link from 'next/link';
import {
  Calendar, Megaphone, FileCheck, Zap, TrendingUp,
  ArrowRight, Activity, Clock, CheckCircle2
} from 'lucide-react';
import CounterfactualBanner from '@/components/CounterfactualBanner';

function StatCard({ label, value, icon: Icon, color, href }: {
  label: string; value: string | number; icon: any; color: string; href: string;
}) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-brand-200 transition-all">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 text-gray-300 group-hover:text-brand-500 transition-colors" />
    </Link>
  );
}

export default function DashboardPage() {
  const { data: events } = useEvents();
  const { data: eventStats } = useEventStats();
  const { data: campaigns } = useCampaigns();
  const { data: campaignStats } = useCampaignStats();
  const { data: proposalStats } = useProposalStats();
  const { data: autoStats } = useAutomationStats();

  const upcomingEvents = events?.filter(e => e.status === 'upcoming' || e.status === 'active').slice(0, 5) || [];
  const recentCampaigns = campaigns?.slice(0, 5) || [];

  // Health score (same as mobile)
  const healthScore = (() => {
    let score = 0;
    if ((eventStats?.total ?? 0) > 0) score += 25;
    if ((campaignStats?.active ?? 0) > 0) score += 25;
    if ((proposalStats?.pending ?? 0) + (proposalStats?.approved ?? 0) > 0) score += 25;
    if ((autoStats?.active ?? 0) > 0) score += 25;
    return score;
  })();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welkom bij je Autonomous Marketing Operating System</p>
      </div>

      {/* Counterfactual nudge ("Left on the table") — hides itself when nothing to surface. */}
      <div className="mb-4">
        <CounterfactualBanner />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Events" value={eventStats?.total ?? 0} icon={Calendar} color="bg-blue-500" href="/events" />
        <StatCard label="Actieve Campaigns" value={campaignStats?.active ?? 0} icon={Megaphone} color="bg-green-500" href="/campaigns" />
        <StatCard label="Te beoordelen" value={proposalStats?.pending ?? 0} icon={FileCheck} color="bg-amber-500" href="/proposals" />
        <StatCard label="Automations actief" value={autoStats?.active ?? 0} icon={Zap} color="bg-purple-500" href="/automations" />
      </div>

      {/* Health Banner */}
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

      {/* Two columns */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Upcoming Events */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="font-semibold text-gray-900">Aankomende Events</h3>
            <Link href="/events" className="text-sm text-brand-600 hover:text-brand-700 font-medium">Alle bekijken</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingEvents.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">Geen events gepland</p>
            ) : upcomingEvents.map(event => (
              <div key={event.id} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-900 text-sm">{event.name}</p>
                  <p className="text-xs text-gray-500">{formatDate(event.event_date)} · {event.location}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(event.status)}`}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="font-semibold text-gray-900">Recente Campaigns</h3>
            <Link href="/campaigns" className="text-sm text-brand-600 hover:text-brand-700 font-medium">Alle bekijken</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentCampaigns.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">Geen campaigns</p>
            ) : recentCampaigns.map(c => (
              <Link key={c.id} href={`/campaigns/${c.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                  <Megaphone className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-900 text-sm">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.type} · {c.channels?.map(channelIcon).join(' ')}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(c.status)}`}>
                  {c.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Snelle Acties</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Nieuw Event', href: '/events?create=true', icon: Calendar, color: 'bg-blue-50 text-blue-700' },
            { label: 'Nieuwe Campaign', href: '/campaigns?create=true', icon: Megaphone, color: 'bg-green-50 text-green-700' },
            { label: 'Proposals bekijken', href: '/proposals', icon: FileCheck, color: 'bg-amber-50 text-amber-700' },
            { label: 'Strategy instellen', href: '/strategy', icon: TrendingUp, color: 'bg-purple-50 text-purple-700' },
          ].map(action => (
            <Link
              key={action.label}
              href={action.href}
              className={`flex items-center gap-3 rounded-lg p-3 ${action.color} hover:opacity-80 transition-opacity`}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
