'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import * as Switch from '@radix-ui/react-switch';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bot,
  Share2,
  Megaphone,
  BarChart3,
  Users,
  Play,
  Save,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  useAgent,
  useAgentRuns,
  useUpdateAgentConfig,
  useDispatchAgent,
  useOrganizationId,
  type AgentKind,
  type AgentStatus,
  type AgentRunStatus,
} from '@/hooks/useAgents';

const KIND_ICON: Record<AgentKind, LucideIcon> = {
  content: Bot,
  social: Share2,
  ads: Megaphone,
  analytics: BarChart3,
  lead: Users,
};

const KIND_GRADIENT: Record<AgentKind, string> = {
  content: 'from-blue-700 to-blue-500',
  social: 'from-pink-700 to-pink-500',
  ads: 'from-orange-700 to-orange-500',
  analytics: 'from-emerald-700 to-emerald-500',
  lead: 'from-amber-700 to-amber-500',
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

const RUN_STATUS_PILL: Record<AgentRunStatus, string> = {
  queued: 'bg-slate-100 text-slate-700',
  running: 'bg-blue-100 text-blue-700',
  awaiting_approval: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
  blocked: 'bg-zinc-200 text-zinc-700',
};

const RUN_STATUS_LABEL: Record<AgentRunStatus, string> = {
  queued: 'In wachtrij',
  running: 'Bezig',
  awaiting_approval: 'Wacht op goedkeuring',
  completed: 'Voltooid',
  failed: 'Mislukt',
  cancelled: 'Geannuleerd',
  blocked: 'Geblokkeerd',
};

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((now - then) / 1000);
  if (Number.isNaN(diffSec)) return '';
  const abs = Math.abs(diffSec);
  if (abs < 60) return diffSec < 0 ? 'in a few seconds' : 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return `${Math.abs(diffMin)} minute${Math.abs(diffMin) === 1 ? '' : 's'} ago`;
  const diffH = Math.round(diffSec / 3600);
  if (Math.abs(diffH) < 24) return `${Math.abs(diffH)} hour${Math.abs(diffH) === 1 ? '' : 's'} ago`;
  const diffD = Math.round(diffSec / 86400);
  if (Math.abs(diffD) < 30) return `${Math.abs(diffD)} day${Math.abs(diffD) === 1 ? '' : 's'} ago`;
  const diffMo = Math.round(diffD / 30);
  if (Math.abs(diffMo) < 12) return `${Math.abs(diffMo)} month${Math.abs(diffMo) === 1 ? '' : 's'} ago`;
  const diffY = Math.round(diffD / 365);
  return `${Math.abs(diffY)} year${Math.abs(diffY) === 1 ? '' : 's'} ago`;
}

export default function AgentDetailPage() {
  const params = useParams<{ kind: string }>();
  const kind = (params?.kind ?? '') as string;
  const { data: agent, isLoading } = useAgent(kind);
  const { data: runs, isLoading: runsLoading } = useAgentRuns(agent?.id ?? '', 20);
  const { data: orgId } = useOrganizationId();
  const updateConfig = useUpdateAgentConfig();
  const dispatchAgent = useDispatchAgent();

  const [paused, setPaused] = useState(false);
  const [tokenCap, setTokenCap] = useState('');
  const [spendCap, setSpendCap] = useState('');

  useEffect(() => {
    if (!agent) return;
    const cfg = agent.config ?? {};
    setPaused(Boolean(cfg.paused));
    setTokenCap(cfg.daily_token_cap != null ? String(cfg.daily_token_cap) : '');
    setSpendCap(cfg.daily_spend_cap_eur != null ? String(cfg.daily_spend_cap_eur) : '');
  }, [agent]);

  const agentKind = (agent?.kind as AgentKind) ?? (kind as AgentKind);
  const Icon = KIND_ICON[agentKind] ?? Bot;
  const gradient = KIND_GRADIENT[agentKind] ?? 'from-gray-700 to-gray-500';
  const status = (agent?.status as AgentStatus) ?? 'coming';

  const handleSave = async () => {
    if (!agent) return;
    const tokenNum = tokenCap.trim() === '' ? null : Number(tokenCap);
    const spendNum = spendCap.trim() === '' ? null : Number(spendCap);
    if (tokenNum != null && (!Number.isFinite(tokenNum) || tokenNum < 0)) {
      toast.error('Token cap moet een positief getal zijn');
      return;
    }
    if (spendNum != null && (!Number.isFinite(spendNum) || spendNum < 0)) {
      toast.error('Budget cap moet een positief getal zijn');
      return;
    }
    try {
      await updateConfig.mutateAsync({
        agentId: agent.id,
        kind: agent.kind,
        paused,
        daily_token_cap: tokenNum,
        daily_spend_cap_eur: spendNum,
        baseConfig: agent.config,
      });
      toast.success('Instellingen opgeslagen');
    } catch (e: any) {
      toast.error(e?.message ?? 'Opslaan mislukt');
    }
  };

  const handleDispatch = async () => {
    if (!agent) return;
    if (agent.status === 'coming' || agent.status === 'disabled') {
      toast.error(`Agent ${agent.name} is not yet available (status: ${agent.status})`);
      return;
    }
    if (!orgId) {
      toast.error('Geen organisatie gevonden');
      return;
    }
    try {
      await dispatchAgent.mutateAsync({
        organization_id: orgId,
        goal: `${agent.name} smoke test`,
        agent_kind: agent.kind,
      });
      toast.success('Testrun gestart');
    } catch (e: any) {
      toast.error(e?.message ?? 'Dispatch mislukt');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="space-y-6">
        <Link href="/agents" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4" /> Terug
        </Link>
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
          <Bot className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-gray-500">Geen agent gevonden voor &quot;{kind}&quot;</p>
          <p className="text-sm text-gray-400 mt-1">
            Voer de seed-migratie uit om de 5 standaard agents te installeren.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/agents"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" /> Terug naar agents
      </Link>

      {/* Header card */}
      <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg`}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{agent.name}</h1>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_PILL[status]}`}>
                {STATUS_LABEL[status]}
              </span>
            </div>
            <p className="mt-1 text-sm text-white/85">{agent.description}</p>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      {agent.capabilities.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-900">Capabilities</h2>
          <div className="flex flex-wrap gap-2">
            {agent.capabilities.map((cap) => (
              <span
                key={cap}
                className="rounded-full bg-white border border-gray-200 px-3 py-1 text-xs text-gray-700"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Limits & Kill Switch */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Beperkingen & noodknop</h2>
          <p className="text-sm text-gray-500">
            Pauzeer deze agent of stel dagelijkse limieten in. Geblokkeerde dispatches verschijnen als &quot;blocked&quot;.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-100">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Pauzeer deze agent</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Geblokkeerde dispatches verschijnen als &quot;blocked&quot; in de runs lijst.
              </p>
            </div>
            <Switch.Root
              checked={paused}
              onCheckedChange={setPaused}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-gray-200 transition-colors data-[state=checked]:bg-brand-600 outline-none"
            >
              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
            </Switch.Root>
          </div>

          <div className="flex items-center justify-between gap-4 py-2 border-b border-gray-100">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Dagelijkse token limiet</p>
              <p className="text-xs text-gray-500 mt-0.5">Leeg = onbeperkt</p>
            </div>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="—"
              value={tokenCap}
              onChange={(e) => setTokenCap(e.target.value)}
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm text-right focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center justify-between gap-4 py-2">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Dagelijkse budget cap (EUR)</p>
              <p className="text-xs text-gray-500 mt-0.5">Geldt voor Ads Agent acties.</p>
            </div>
            <input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              placeholder="—"
              value={spendCap}
              onChange={(e) => setSpendCap(e.target.value)}
              className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm text-right focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleSave}
              disabled={updateConfig.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {updateConfig.isPending ? 'Opslaan…' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Recent runs */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Recente runs</h2>
            <p className="text-sm text-gray-500">Laatste 20 runs voor deze agent.</p>
          </div>
        </div>
        {runsLoading ? (
          <div className="flex justify-center py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          </div>
        ) : !runs || runs.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-2">Nog geen runs voor deze agent.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {runs.map((r) => {
              const rs = (r.status as AgentRunStatus) ?? 'queued';
              return (
                <li key={r.id}>
                  <Link
                    href={`/agents/${agent.kind}/runs/${r.id}`}
                    className="flex items-center justify-between gap-4 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {r.goal || '(geen doel)'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{relativeTime(r.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${RUN_STATUS_PILL[rs] ?? RUN_STATUS_PILL.queued}`}>
                        {RUN_STATUS_LABEL[rs] ?? rs}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Start test run */}
      <div>
        <button
          onClick={handleDispatch}
          disabled={dispatchAgent.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          <Play className="h-4 w-4" />
          {dispatchAgent.isPending ? 'Starten…' : 'Start test run'}
        </button>
      </div>
    </div>
  );
}
