'use client';

import Link from 'next/link';
import { useAgents, type AgentKind, type AgentStatus } from '@/hooks/useAgents';
import { Bot, Share2, Megaphone, BarChart3, Users, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const KIND_ICON: Record<AgentKind, LucideIcon> = {
  content: Bot,
  social: Share2,
  ads: Megaphone,
  analytics: BarChart3,
  lead: Users,
};

const KIND_ACCENT: Record<AgentKind, string> = {
  content: 'bg-blue-50 text-blue-600',
  social: 'bg-pink-50 text-pink-600',
  ads: 'bg-orange-50 text-orange-600',
  analytics: 'bg-emerald-50 text-emerald-600',
  lead: 'bg-amber-50 text-amber-600',
};

const STATUS_PILL: Record<AgentStatus, string> = {
  active: 'bg-green-100 text-green-700',
  beta: 'bg-blue-100 text-blue-700',
  coming: 'bg-gray-100 text-gray-600',
  paused: 'bg-amber-100 text-amber-700',
  disabled: 'bg-red-100 text-red-700',
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  active: 'Actief',
  beta: 'Beta',
  coming: 'Binnenkort',
  paused: 'Gepauzeerd',
  disabled: 'Uitgeschakeld',
};

export default function AgentsPage() {
  const { data: agents, isLoading } = useAgents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Multi-Agent System</h1>
        <p className="text-gray-500 mt-1 max-w-2xl">
          5 AI agents that collaborate on your marketing goals — with you in the approval seat.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
        </div>
      ) : !agents || agents.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <Bot className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Geen agents geregistreerd voor deze organisatie</p>
          <p className="text-sm text-gray-400 mt-1">
            Voer de seed-migratie uit om de 5 standaard agents te installeren.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const kind = agent.kind as AgentKind;
            const Icon = KIND_ICON[kind] ?? Bot;
            const accent = KIND_ACCENT[kind] ?? 'bg-gray-50 text-gray-600';
            const status = (agent.status as AgentStatus) ?? 'coming';
            const pill = STATUS_PILL[status] ?? STATUS_PILL.coming;
            const label = STATUS_LABEL[status] ?? status;
            return (
              <Link
                key={agent.id}
                href={`/agents/${kind}`}
                className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-brand-200 transition-all flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${pill}`}>
                    {label}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-3">{agent.description}</p>
                </div>
                {agent.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {agent.capabilities.slice(0, 4).map((cap) => (
                      <span
                        key={cap}
                        className="rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600"
                      >
                        {cap}
                      </span>
                    ))}
                    {agent.capabilities.length > 4 && (
                      <span className="rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-[11px] text-gray-500">
                        +{agent.capabilities.length - 4}
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm font-medium text-brand-600 group-hover:text-brand-700">
                    Open
                  </span>
                  <ArrowRight className="h-4 w-4 text-brand-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 pt-2">
        Voice command + AgentRunDetail run history beschikbaar in de AMOS-app op iOS en Android
      </p>
    </div>
  );
}
