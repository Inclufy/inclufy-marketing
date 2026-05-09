'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronUp,
  Clipboard,
  MessageSquare,
  Settings,
  User as UserIcon,
  Wrench,
} from 'lucide-react';

import {
  useAgentRun,
  useAgentRunMessages,
  useApproveRun,
  type AgentKind,
  type AgentRunMessage,
  type AgentRunStatus,
} from '@/hooks/useAgentRun';

const STATUS_PILL: Record<AgentRunStatus, string> = {
  queued: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  running: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200',
  awaiting_approval: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200',
  completed: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
  failed: 'bg-red-100 text-red-700 ring-1 ring-red-200',
  cancelled: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  blocked: 'bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200',
};

const STATUS_LABEL: Record<AgentRunStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  awaiting_approval: 'Awaiting approval',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
  blocked: 'Blocked',
};

const AGENT_GRADIENT: Record<AgentKind, string> = {
  content: 'from-blue-700 to-blue-500',
  social: 'from-pink-700 to-pink-500',
  ads: 'from-orange-700 to-orange-500',
  analytics: 'from-emerald-700 to-emerald-500',
  lead: 'from-amber-700 to-amber-500',
  orchestrator: 'from-purple-700 to-purple-500',
};

function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString();
}

function fmtRelative(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return fmtTime(iso);
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}

function fmtDuration(start: string | null, end: string | null): string {
  if (!start) return '—';
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const ms = e - s;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function MessageAvatar({ role }: { role: AgentRunMessage['role'] }) {
  const cfg =
    role === 'tool'
      ? { Icon: Wrench, color: 'text-blue-600 bg-blue-50' }
      : role === 'agent'
        ? { Icon: Bot, color: 'text-purple-600 bg-purple-50' }
        : role === 'user'
          ? { Icon: UserIcon, color: 'text-amber-600 bg-amber-50' }
          : role === 'assistant'
            ? { Icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50' }
            : { Icon: Settings, color: 'text-slate-600 bg-slate-50' };
  const Icon = cfg.Icon;
  return (
    <div
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${cfg.color}`}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

function roleColor(role: AgentRunMessage['role']): string {
  return role === 'tool'
    ? 'text-blue-600'
    : role === 'agent'
      ? 'text-purple-600'
      : role === 'user'
        ? 'text-amber-600'
        : role === 'assistant'
          ? 'text-emerald-600'
          : 'text-slate-600';
}

function CopyButton({ value, label }: { value: string; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).then(
          () => toast.success(label ? `${label} copied` : 'Copied'),
          () => toast.error('Copy failed')
        );
      }}
      className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
    >
      <Clipboard className="h-3 w-3" /> Copy
    </button>
  );
}

function JsonBlock({
  title,
  data,
  defaultOpen = false,
  countLabel,
}: {
  title: string;
  data: unknown;
  defaultOpen?: boolean;
  countLabel?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const json = useMemo(() => safeStringify(data), [data]);
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-gray-800"
        >
          {open ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
          {title}
          {countLabel ? (
            <span className="text-xs font-normal text-gray-500">
              {countLabel}
            </span>
          ) : null}
        </button>
        <CopyButton value={json} label={title} />
      </div>
      {open ? (
        <div className="border-t border-gray-100 p-3">
          <pre className="text-xs font-mono bg-slate-50 p-3 rounded overflow-auto max-h-96 text-slate-800">
            {json}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export default function AgentRunDetailPage() {
  const params = useParams<{ kind: string; runId: string }>();
  const router = useRouter();
  const kind = params?.kind ?? '';
  const runId = params?.runId ?? '';

  const { data: run, isLoading, error } = useAgentRun(runId);
  const { data: messages = [] } = useAgentRunMessages(runId);
  const approve = useApproveRun();

  const gradient = useMemo(() => {
    const k = run?.agent?.kind;
    if (k && k in AGENT_GRADIENT) return AGENT_GRADIENT[k];
    return 'from-slate-700 to-slate-500';
  }, [run?.agent?.kind]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="space-y-4">
        <Link
          href={`/agents/${kind}`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error instanceof Error ? error.message : 'Run not found.'}
        </div>
      </div>
    );
  }

  const totalTokens = run.prompt_tokens + run.completion_tokens;
  const statusClass = STATUS_PILL[run.status];
  const statusLabel = STATUS_LABEL[run.status];

  const handleApprove = async () => {
    try {
      await approve.mutateAsync({ run_id: run.id });
      toast.success('Approved');

      // Bridge to BoostFlow when this is an Ads boost approval. Pure
      // client-side router.push — mirrors the mobile prefill bridge.
      const isAdsBoost =
        run.agent?.kind === 'ads' &&
        (run.goal === 'dispatch_ads_agent' ||
          (run.input as Record<string, unknown>)?.action === 'boost_post');
      const targetPost =
        run.related_post_id ??
        ((run.input as Record<string, unknown>)?.post_id as
          | string
          | undefined) ??
        null;

      if (isAdsBoost && targetPost) {
        const draft =
          ((run.output as Record<string, unknown>)?.draft as
            | Record<string, unknown>
            | undefined) ?? {};
        const pacing =
          (draft.recommended_pacing as Record<string, unknown> | undefined) ??
          {};
        const dailyEur = Number(pacing.daily_cap_eur ?? 0);
        const days = Number(pacing.days ?? 0);
        const budgetCents =
          dailyEur > 0 && days > 0
            ? Math.round(dailyEur * days * 100)
            : undefined;
        const qs = new URLSearchParams();
        if (typeof budgetCents === 'number')
          qs.set('budget_cents', String(budgetCents));
        if (days > 0) qs.set('days', String(days));
        qs.set('runId', run.id);
        router.push(`/posts/${targetPost}/boost?${qs.toString()}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Approval failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div
        className={`sticky top-0 z-10 -mx-4 -mt-4 rounded-b-2xl bg-gradient-to-br ${gradient} px-4 py-5 text-white shadow-sm sm:mx-0 sm:mt-0 sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between">
          <Link
            href={`/agents/${kind}`}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-white/90 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>
        <h1 className="mt-3 text-xl font-bold leading-snug line-clamp-2">
          {run.goal || '(no goal)'}
        </h1>
        <p className="mt-1 text-sm text-white/85">
          {run.agent?.name ?? '—'} · {run.trigger}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
            {fmtDuration(run.started_at, run.finished_at)}
          </span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
            {totalTokens.toLocaleString()} tok
          </span>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
            ${run.cost_usd.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Approval CTA */}
      {run.status === 'awaiting_approval' ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm text-amber-900">
            This run will spend money or publish something and needs your
            approval.
          </p>
          <button
            type="button"
            onClick={handleApprove}
            disabled={approve.isPending}
            className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {approve.isPending ? 'Approving…' : 'Approve'}
          </button>
        </div>
      ) : null}

      {/* Error box */}
      {run.error_message ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {run.error_message}
        </div>
      ) : null}

      {/* Live receipts */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">Live receipts</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <ReceiptCell label="Started" value={fmtRelative(run.started_at)} />
          <ReceiptCell label="Finished" value={fmtRelative(run.finished_at)} />
          <ReceiptCell
            label="Prompt tokens"
            value={run.prompt_tokens.toLocaleString()}
          />
          <ReceiptCell
            label="Output tokens"
            value={run.completion_tokens.toLocaleString()}
          />
          <ReceiptCell label="Cost" value={`$${run.cost_usd.toFixed(4)}`} />
          <ReceiptCell label="Trigger" value={run.trigger} />
        </div>

        <div className="space-y-2">
          <JsonBlock title="Input" data={run.input} defaultOpen={false} />
          <JsonBlock
            title="Tool calls"
            data={run.tool_calls}
            defaultOpen={false}
            countLabel={`(${run.tool_calls.length})`}
          />
          <JsonBlock title="Output" data={run.output} defaultOpen={true} />
        </div>
      </section>

      {/* Agent conversation */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-900">Agent conversation</h2>
        {messages.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm italic text-gray-500">
            No messages recorded for this run.
          </div>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => {
              const label =
                m.from_agent && m.to_agent
                  ? `${m.from_agent} → ${m.to_agent}`
                  : m.role;
              const hasPayload =
                m.payload && Object.keys(m.payload).length > 0;
              return (
                <li
                  key={m.id}
                  className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white p-3"
                >
                  <MessageAvatar role={m.role} />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-wide ${roleColor(
                        m.role
                      )}`}
                    >
                      {label.toString().toUpperCase()}
                    </p>
                    {m.content ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                        {m.content}
                      </p>
                    ) : null}
                    {hasPayload ? (
                      <pre className="mt-2 text-xs font-mono bg-slate-50 p-3 rounded overflow-auto max-h-96 text-slate-800">
                        {safeStringify(m.payload)}
                      </pre>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Related deep-links */}
      {run.related_post_id ||
      run.related_campaign_id ||
      run.related_event_id ? (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">Related</h2>
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2 text-sm">
            {run.related_post_id ? (
              <div>
                <Link
                  href={`/posts/${run.related_post_id}`}
                  className="text-brand-600 hover:underline"
                >
                  Post: {run.related_post_id}
                </Link>
              </div>
            ) : null}
            {run.related_campaign_id ? (
              <div>
                <Link
                  href={`/campaigns/${run.related_campaign_id}`}
                  className="text-brand-600 hover:underline"
                >
                  Campaign: {run.related_campaign_id}
                </Link>
              </div>
            ) : null}
            {run.related_event_id ? (
              <div>
                <Link
                  href={`/events/${run.related_event_id}`}
                  className="text-brand-600 hover:underline"
                >
                  Event: {run.related_event_id}
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ReceiptCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-gray-900 truncate">{value}</p>
    </div>
  );
}
