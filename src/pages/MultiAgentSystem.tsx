// src/pages/MultiAgentSystem.tsx
// Multi-Agent System dashboard — monitor, coordinate, and manage AI agent swarm

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useMultiAgent } from '@/hooks/useMultiAgent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Bot,
  Share2,
  Mail,
  Target,
  BarChart3,
  Loader2,
  Pause,
  Play,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Zap,
  Activity,
  Cpu,
  MessageSquare,
  ListTodo,
  TrendingUp,
  PieChart as PieChartIcon,
  RefreshCw,
  Brain,
  Sparkles,
  CircleDot,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from 'recharts';
import type { AIAgent, AgentMessage, AgentTask, AgentType } from '@/services/context-marketing/multi-agent.service';

// ─── Constants ─────────────────────────────────────────────────────

const AGENT_COLORS: Record<AgentType, string> = {
  social: '#ec4899',
  email: '#f59e0b',
  ads: '#3b82f6',
  analytics: '#22c55e',
  orchestrator: '#8b5cf6',
};

const AGENT_BG_GRADIENTS: Record<AgentType, string> = {
  social: 'from-pink-500/10 to-pink-600/5',
  email: 'from-amber-500/10 to-amber-600/5',
  ads: 'from-blue-500/10 to-blue-600/5',
  analytics: 'from-green-500/10 to-green-600/5',
  orchestrator: 'from-violet-500/10 to-violet-600/5',
};

const AGENT_BORDER: Record<AgentType, string> = {
  social: 'border-pink-500/20 hover:border-pink-500/40',
  email: 'border-amber-500/20 hover:border-amber-500/40',
  ads: 'border-blue-500/20 hover:border-blue-500/40',
  analytics: 'border-green-500/20 hover:border-green-500/40',
  orchestrator: 'border-violet-500/20 hover:border-violet-500/40',
};

// ─── Helper: Agent Icon ────────────────────────────────────────────

function AgentIcon({ type, className = 'h-5 w-5' }: { type: AgentType; className?: string }) {
  const color = AGENT_COLORS[type];
  switch (type) {
    case 'social': return <Share2 className={className} style={{ color }} />;
    case 'email': return <Mail className={className} style={{ color }} />;
    case 'ads': return <Target className={className} style={{ color }} />;
    case 'analytics': return <BarChart3 className={className} style={{ color }} />;
    case 'orchestrator': return <Bot className={className} style={{ color }} />;
  }
}

// ─── Helper: Status Badge ──────────────────────────────────────────

function StatusBadge({ status }: { status: AIAgent['status'] }) {
  const config: Record<typeof status, { label: string; className: string; pulse: boolean }> = {
    active: { label: 'Active', className: 'bg-green-500/15 text-green-600 border-green-500/30', pulse: true },
    busy: { label: 'Busy', className: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30', pulse: true },
    idle: { label: 'Idle', className: 'bg-gray-500/15 text-gray-500 border-gray-500/30', pulse: false },
    paused: { label: 'Paused', className: 'bg-orange-500/15 text-orange-600 border-orange-500/30', pulse: false },
    error: { label: 'Error', className: 'bg-red-500/15 text-red-600 border-red-500/30', pulse: false },
    learning: { label: 'Learning', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30', pulse: true },
  };
  const c = config[status];
  return (
    <Badge variant="outline" className={`${c.className} text-xs font-medium`}>
      {c.pulse && (
        <span className="relative mr-1.5 flex h-2 w-2">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
            status === 'active' ? 'bg-green-400' : status === 'busy' ? 'bg-yellow-400' : 'bg-blue-400'
          }`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${
            status === 'active' ? 'bg-green-500' : status === 'busy' ? 'bg-yellow-500' : 'bg-blue-500'
          }`} />
        </span>
      )}
      {c.label}
    </Badge>
  );
}

// ─── Helper: Priority Badge ────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-600 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
    medium: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    low: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
  };
  return (
    <Badge variant="outline" className={`${styles[priority] || styles.low} text-[10px] uppercase tracking-wider`}>
      {priority}
    </Badge>
  );
}

// ─── Helper: Message Type Badge ────────────────────────────────────

function MessageTypeBadge({ type }: { type: AgentMessage['message_type'] }) {
  const styles: Record<typeof type, string> = {
    request: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    response: 'bg-green-500/15 text-green-600 border-green-500/30',
    alert: 'bg-red-500/15 text-red-600 border-red-500/30',
    handoff: 'bg-purple-500/15 text-purple-600 border-purple-500/30',
    conflict: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
    resolution: 'bg-teal-500/15 text-teal-600 border-teal-500/30',
  };
  return (
    <Badge variant="outline" className={`${styles[type]} text-[10px] uppercase tracking-wider`}>
      {type}
    </Badge>
  );
}

// ─── Helper: Task Status Badge ─────────────────────────────────────

function TaskStatusBadge({ status }: { status: AgentTask['status'] }) {
  const styles: Record<typeof status, string> = {
    queued: 'bg-gray-500/15 text-gray-500 border-gray-500/30',
    in_progress: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    completed: 'bg-green-500/15 text-green-600 border-green-500/30',
    failed: 'bg-red-500/15 text-red-600 border-red-500/30',
    blocked: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
  };
  const labels: Record<typeof status, string> = {
    queued: 'Queued',
    in_progress: 'In Progress',
    completed: 'Completed',
    failed: 'Failed',
    blocked: 'Blocked',
  };
  return (
    <Badge variant="outline" className={`${styles[status]} text-[10px] uppercase tracking-wider`}>
      {labels[status]}
    </Badge>
  );
}

// ─── Helper: Agent Name Resolver ───────────────────────────────────

function agentLabel(type: AgentType | 'all'): string {
  const labels: Record<string, string> = {
    social: 'Social Agent',
    email: 'Email Agent',
    ads: 'Ads Agent',
    analytics: 'Analytics Agent',
    orchestrator: 'Orchestrator',
    all: 'All Agents',
  };
  return labels[type] || type;
}

// ─── Helper: Sparkline ─────────────────────────────────────────────

function Sparkline({ data, color }: { data: Array<{ date: string; score: number }>; color: string }) {
  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="score"
            stroke={color}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Helper: format time ago ───────────────────────────────────────

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function MultiAgentSystem() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { formatCompact } = useCurrency();
  const {
    agents,
    messages,
    taskQueue,
    orchestratorState,
    isLoading,
    error,
    pauseAgent,
    resumeAgent,
    refetch,
  } = useMultiAgent();

  const [activeTab, setActiveTab] = useState('communication');
  const [taskSort, setTaskSort] = useState<'created_at' | 'priority' | 'status'>('created_at');

  // ── Sorted tasks ──────────────────────────────────────────────
  const sortedTasks = useMemo(() => {
    const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const statusOrder: Record<string, number> = { in_progress: 0, queued: 1, blocked: 2, completed: 3, failed: 4 };
    return [...taskQueue].sort((a, b) => {
      if (taskSort === 'priority') return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
      if (taskSort === 'status') return (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [taskQueue, taskSort]);

  // ── Performance chart data ────────────────────────────────────
  const performanceBarData = useMemo(() =>
    agents.map(a => ({
      name: a.name.replace(' Agent', ''),
      success_rate: a.success_rate,
      efficiency: a.efficiency_score,
      fill: AGENT_COLORS[a.type],
    })),
  [agents]);

  // ── Resource allocation pie data ──────────────────────────────
  const resourcePieData = useMemo(() => {
    if (!orchestratorState?.resource_allocation) return [];
    return (Object.entries(orchestratorState.resource_allocation) as [AgentType, number][]).map(
      ([type, value]) => ({
        name: agentLabel(type),
        value,
        color: AGENT_COLORS[type],
      })
    );
  }, [orchestratorState]);

  // ── Radar data for agent capabilities ─────────────────────────
  const radarData = useMemo(() => {
    const metrics = ['Success Rate', 'Efficiency', 'Learning', 'Uptime', 'Decisions'];
    return metrics.map(m => {
      const entry: Record<string, any> = { metric: m };
      agents.forEach(a => {
        const key = a.name.replace(' Agent', '');
        switch (m) {
          case 'Success Rate': entry[key] = a.success_rate; break;
          case 'Efficiency': entry[key] = a.efficiency_score; break;
          case 'Learning': entry[key] = a.learning_progress; break;
          case 'Uptime': entry[key] = Math.min(100, (a.uptime_hours / 2200) * 100); break;
          case 'Decisions': entry[key] = Math.min(100, (a.decisions_made / 50000) * 100); break;
        }
      });
      return entry;
    });
  }, [agents]);

  // ─── LOADING STATE ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-violet-600 relative" />
          </div>
          <p className="text-muted-foreground text-sm font-medium animate-pulse">
            {nl ? 'Multi-Agent Systeem laden...' : fr ? 'Chargement du systeme multi-agent...' : 'Loading Multi-Agent System...'}
          </p>
        </div>
      </div>
    );
  }

  // ─── ERROR STATE ──────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Card className="border-red-500/20 bg-red-500/5 max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 font-medium mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {nl ? 'Opnieuw proberen' : fr ? 'Reessayer' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const orch = orchestratorState;

  return (
    <div className="space-y-6 p-1">
      {/* ═══ HEADER ═══════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-xl bg-violet-500/20 blur-lg animate-pulse" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <Bot className="h-6 w-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              {nl ? 'Multi-Agent Systeem' : fr ? 'Systeme Multi-Agent' : 'Multi-Agent System'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {nl ? 'AI-agenten die autonoom samenwerken' : fr ? 'Agents IA collaborant de maniere autonome' : 'AI agents collaborating autonomously'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {orch && (
            <Badge
              variant="outline"
              className="bg-green-500/10 text-green-600 border-green-500/30 px-3 py-1.5 text-xs font-semibold"
            >
              <span className="relative mr-2 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              {nl ? 'Orchestrator Online' : fr ? 'Orchestrateur en ligne' : 'Orchestrator Online'} — {orch.uptime_percentage}%
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* ═══ ORCHESTRATOR CONTROL BAR ═════════════════════════════ */}
      {orch && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Active Agents */}
          <Card className="border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <Activity className="h-4 w-4 text-violet-500" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {nl ? 'Actieve Agents' : fr ? 'Agents actifs' : 'Active Agents'}
                </span>
              </div>
              <p className="text-2xl font-bold text-violet-600">{orch.active_agents}<span className="text-sm font-normal text-muted-foreground">/{agents.length}</span></p>
            </CardContent>
          </Card>

          {/* Tasks Today */}
          <Card className="border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <ListTodo className="h-4 w-4 text-blue-500" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {nl ? 'Taken Vandaag' : fr ? 'Taches aujourd\'hui' : 'Tasks Today'}
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{orch.total_tasks_today}</p>
            </CardContent>
          </Card>

          {/* Conflicts Resolved */}
          <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                  <ShieldCheck className="h-4 w-4 text-orange-500" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {nl ? 'Conflicten Opgelost' : fr ? 'Conflits resolus' : 'Conflicts Resolved'}
                </span>
              </div>
              <p className="text-2xl font-bold text-orange-600">{orch.conflicts_resolved}</p>
            </CardContent>
          </Card>

          {/* Coordination Score */}
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                  <Zap className="h-4 w-4 text-green-500" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {nl ? 'Coordinatie Score' : fr ? 'Score coordination' : 'Coordination Score'}
                </span>
              </div>
              <p className="text-2xl font-bold text-green-600">{orch.coordination_score}%</p>
            </CardContent>
          </Card>

          {/* System Load */}
          <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent col-span-2 sm:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                  <Cpu className="h-4 w-4 text-cyan-500" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {nl ? 'Systeembelasting' : fr ? 'Charge systeme' : 'System Load'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-cyan-600">{orch.system_load}%</span>
                <Progress
                  value={orch.system_load}
                  className="h-2 flex-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══ AGENT CARDS GRID ═════════════════════════════════════ */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet-500" />
          {nl ? 'AI Agents' : fr ? 'Agents IA' : 'AI Agents'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map(agent => (
            <Card
              key={agent.id}
              className={`bg-gradient-to-br ${AGENT_BG_GRADIENTS[agent.type]} border ${AGENT_BORDER[agent.type]} transition-all duration-300 hover:shadow-lg`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${AGENT_COLORS[agent.type]}22, ${AGENT_COLORS[agent.type]}11)`,
                        border: `1px solid ${AGENT_COLORS[agent.type]}33`,
                      }}
                    >
                      <AgentIcon type={agent.type} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{agent.name}</CardTitle>
                      <p className="text-[11px] text-muted-foreground">{agent.model_version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={agent.status} />
                    {agent.tasks_in_queue > 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                        {agent.tasks_in_queue} {nl ? 'in wachtrij' : fr ? 'en file' : 'queued'}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Current Task */}
                <div className="rounded-lg bg-background/50 px-3 py-2 border border-border/50">
                  <p className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-wider font-medium">
                    {nl ? 'Huidige taak' : fr ? 'Tache en cours' : 'Current Task'}
                  </p>
                  <p className="text-xs italic text-foreground/80 line-clamp-2">
                    {agent.current_task || (nl ? 'Inactief' : fr ? 'Inactif' : 'Idle')}
                  </p>
                </div>

                {/* Performance Sparkline */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {nl ? '7-dagen trend' : fr ? 'Tendance 7 jours' : '7-day trend'}
                  </span>
                  <Sparkline data={agent.performance_trend} color={AGENT_COLORS[agent.type]} />
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-background/40 px-2 py-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {nl ? 'Slagingspercentage' : fr ? 'Taux de reussite' : 'Success Rate'}
                    </p>
                    <p className="text-sm font-bold" style={{ color: AGENT_COLORS[agent.type] }}>
                      {agent.success_rate}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-background/40 px-2 py-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {nl ? 'Efficientie' : fr ? 'Efficacite' : 'Efficiency'}
                    </p>
                    <p className="text-sm font-bold" style={{ color: AGENT_COLORS[agent.type] }}>
                      {agent.efficiency_score}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-background/40 px-2 py-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {nl ? 'Taken vandaag' : fr ? 'Taches aujourd\'hui' : 'Tasks Today'}
                    </p>
                    <p className="text-sm font-bold">{agent.tasks_completed_today}</p>
                  </div>
                  <div className="rounded-lg bg-background/40 px-2 py-1.5 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {nl ? 'Omzet Impact' : fr ? 'Impact revenus' : 'Revenue Impact'}
                    </p>
                    <p className="text-sm font-bold text-emerald-600">
                      {agent.revenue_impact > 0 ? formatCompact(agent.revenue_impact) : '—'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1">
                  {agent.status === 'paused' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs gap-1.5 border-green-500/30 text-green-600 hover:bg-green-500/10"
                      onClick={() => resumeAgent(agent.type)}
                    >
                      <Play className="h-3.5 w-3.5" />
                      {nl ? 'Hervatten' : fr ? 'Reprendre' : 'Resume'}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs gap-1.5 border-orange-500/30 text-orange-600 hover:bg-orange-500/10"
                      onClick={() => pauseAgent(agent.type)}
                      disabled={agent.status === 'error'}
                    >
                      <Pause className="h-3.5 w-3.5" />
                      {nl ? 'Pauzeren' : fr ? 'Pause' : 'Pause'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ═══ TABS ═════════════════════════════════════════════════ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-11">
          <TabsTrigger value="communication" className="gap-2 text-xs sm:text-sm">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">{nl ? 'Communicatie' : fr ? 'Communication' : 'Communication'}</span>
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2 text-xs sm:text-sm">
            <ListTodo className="h-4 w-4" />
            <span className="hidden sm:inline">{nl ? 'Taken' : fr ? 'Taches' : 'Tasks'}</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">{nl ? 'Prestaties' : fr ? 'Performance' : 'Performance'}</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2 text-xs sm:text-sm">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{nl ? 'Resources' : fr ? 'Ressources' : 'Resources'}</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── COMMUNICATION TAB ──────────────────────────────── */}
        <TabsContent value="communication" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-violet-500" />
                {nl ? 'Inter-Agent Communicatie' : fr ? 'Communication inter-agents' : 'Inter-Agent Communication'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`rounded-lg border p-3 transition-colors hover:bg-muted/30 ${
                      msg.resolved ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {/* From agent */}
                      <div className="flex items-center gap-1.5">
                        {msg.from_agent !== 'all' && <AgentIcon type={msg.from_agent as AgentType} className="h-4 w-4" />}
                        <span className="text-xs font-semibold">{agentLabel(msg.from_agent as AgentType)}</span>
                      </div>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      {/* To agent */}
                      <div className="flex items-center gap-1.5">
                        {msg.to_agent !== 'all' && <AgentIcon type={msg.to_agent as AgentType} className="h-4 w-4" />}
                        <span className="text-xs font-semibold">{agentLabel(msg.to_agent as AgentType | 'all')}</span>
                      </div>
                      <MessageTypeBadge type={msg.message_type} />
                      <PriorityBadge priority={msg.priority} />
                      {msg.resolved && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeAgo(msg.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{msg.content}</p>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    {nl ? 'Geen berichten' : fr ? 'Aucun message' : 'No messages'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TASKS TAB ──────────────────────────────────────── */}
        <TabsContent value="tasks" className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-blue-500" />
                  {nl ? 'Taken Overzicht' : fr ? 'Apercu des taches' : 'Task Overview'}
                  <Badge variant="secondary" className="ml-2 text-xs">{taskQueue.length}</Badge>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {nl ? 'Sorteer op:' : fr ? 'Trier par:' : 'Sort by:'}
                  </span>
                  {(['created_at', 'priority', 'status'] as const).map(s => (
                    <Button
                      key={s}
                      variant={taskSort === s ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 text-xs px-2"
                      onClick={() => setTaskSort(s)}
                    >
                      {s === 'created_at' ? (nl ? 'Tijd' : fr ? 'Temps' : 'Time') :
                       s === 'priority' ? (nl ? 'Prioriteit' : fr ? 'Priorite' : 'Priority') :
                       nl ? 'Status' : fr ? 'Statut' : 'Status'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {sortedTasks.map(task => (
                  <div
                    key={task.id}
                    className="rounded-lg border p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                        style={{
                          background: `${AGENT_COLORS[task.agent_type]}15`,
                          border: `1px solid ${AGENT_COLORS[task.agent_type]}30`,
                        }}
                      >
                        <AgentIcon type={task.agent_type} className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold">{task.title}</h4>
                          <TaskStatusBadge status={task.status} />
                          <PriorityBadge priority={task.priority} />
                        </div>
                        <p className="text-xs text-muted-foreground mb-1.5">{task.description}</p>
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {nl ? 'Aangemaakt' : fr ? 'Cree' : 'Created'}: {timeAgo(task.created_at)}
                          </span>
                          {task.started_at && (
                            <span className="flex items-center gap-1">
                              <Play className="h-3 w-3" />
                              {nl ? 'Gestart' : fr ? 'Demarre' : 'Started'}: {timeAgo(task.started_at)}
                            </span>
                          )}
                          {task.completed_at && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              {nl ? 'Voltooid' : fr ? 'Termine' : 'Completed'}: {timeAgo(task.completed_at)}
                            </span>
                          )}
                        </div>
                        {task.result && (
                          <div className="mt-2 rounded-md bg-green-500/5 border border-green-500/20 px-3 py-2">
                            <p className="text-xs text-green-700 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3 inline mr-1.5" />
                              {task.result}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {sortedTasks.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    {nl ? 'Geen taken' : fr ? 'Aucune tache' : 'No tasks'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── PERFORMANCE TAB ────────────────────────────────── */}
        <TabsContent value="performance" className="space-y-4">
          {/* Bar Chart: Success Rate Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  {nl ? 'Slagingspercentage per Agent' : fr ? 'Taux de reussite par agent' : 'Success Rate by Agent'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceBarData} barGap={8}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="success_rate" name={nl ? 'Slagingspercentage' : fr ? 'Taux de reussite' : 'Success Rate'} radius={[6, 6, 0, 0]}>
                        {performanceBarData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} fillOpacity={0.8} />
                        ))}
                      </Bar>
                      <Bar dataKey="efficiency" name={nl ? 'Efficientie' : fr ? 'Efficacite' : 'Efficiency'} radius={[6, 6, 0, 0]}>
                        {performanceBarData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} fillOpacity={0.4} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Radar Chart: Capabilities */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-5 w-5 text-violet-500" />
                  {nl ? 'Agent Capaciteiten' : fr ? 'Capacites des agents' : 'Agent Capabilities'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                      {agents.filter(a => a.type !== 'orchestrator').map(agent => (
                        <Radar
                          key={agent.id}
                          name={agent.name.replace(' Agent', '')}
                          dataKey={agent.name.replace(' Agent', '')}
                          stroke={AGENT_COLORS[agent.type]}
                          fill={AGENT_COLORS[agent.type]}
                          fillOpacity={0.1}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resource Allocation Pie + Area Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-amber-500" />
                  {nl ? 'Resourceverdeling' : fr ? 'Allocation des ressources' : 'Resource Allocation'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resourcePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name.replace(' Agent', '')}: ${value}%`}
                        labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                      >
                        {resourcePieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} fillOpacity={0.8} stroke={entry.color} strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [`${value}%`, nl ? 'Toewijzing' : fr ? 'Allocation' : 'Allocation']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Combined performance area chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  {nl ? 'Prestatietrend (7 dagen)' : fr ? 'Tendance performance (7 jours)' : 'Performance Trend (7 days)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={agents[0]?.performance_trend.map((pt, i) => {
                        const entry: Record<string, any> = { date: pt.date.slice(5) };
                        agents.forEach(a => {
                          entry[a.name.replace(' Agent', '')] = a.performance_trend[i]?.score ?? 0;
                        });
                        return entry;
                      }) || []}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis domain={[80, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                      />
                      {agents.map(agent => (
                        <Area
                          key={agent.id}
                          type="monotone"
                          dataKey={agent.name.replace(' Agent', '')}
                          stroke={AGENT_COLORS[agent.type]}
                          fill={AGENT_COLORS[agent.type]}
                          fillOpacity={0.08}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Agent Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {agents.map(agent => (
              <Card key={agent.id} className={`border ${AGENT_BORDER[agent.type]}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AgentIcon type={agent.type} className="h-4 w-4" />
                    <span className="text-sm font-semibold">{agent.name.replace(' Agent', '')}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{nl ? 'Beslissingen' : fr ? 'Decisions' : 'Decisions'}</span>
                      <span className="font-semibold">{agent.decisions_made.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{nl ? 'Uptime (uren)' : fr ? 'Disponibilite (h)' : 'Uptime (hrs)'}</span>
                      <span className="font-semibold">{agent.uptime_hours.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{nl ? 'Leervoortgang' : fr ? 'Progres apprentissage' : 'Learning Progress'}</span>
                      <span className="font-semibold">{agent.learning_progress}%</span>
                    </div>
                    <Progress
                      value={agent.learning_progress}
                      className="h-1.5"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ─── RESOURCES TAB ──────────────────────────────────── */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Full Resource Allocation Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-violet-500" />
                  {nl ? 'Resourceverdeling per Agent Type' : fr ? 'Allocation par type d\'agent' : 'Resource Allocation by Agent Type'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resourcePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={120}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, value, cx, x, y }) => (
                          <text
                            x={x}
                            y={y}
                            fill="hsl(var(--foreground))"
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            fontSize={12}
                            fontWeight={600}
                          >
                            {`${name.replace(' Agent', '')}: ${value}%`}
                          </text>
                        )}
                        labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                      >
                        {resourcePieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} fillOpacity={0.8} stroke={entry.color} strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                        formatter={(value: number) => [`${value}%`, nl ? 'Toewijzing' : fr ? 'Allocation' : 'Allocation']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Resource Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-500" />
                  {nl ? 'Resource Details' : fr ? 'Details des ressources' : 'Resource Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {resourcePieData.map(item => {
                  const agent = agents.find(a => agentLabel(a.type) === item.name);
                  return (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ background: item.color }} />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold" style={{ color: item.color }}>
                          {item.value}%
                        </span>
                      </div>
                      <Progress value={item.value} className="h-2" />
                      {agent && (
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground pl-5">
                          <span>{nl ? 'Taken' : fr ? 'Taches' : 'Tasks'}: {agent.tasks_completed_today}</span>
                          <span>{nl ? 'Wachtrij' : fr ? 'File' : 'Queue'}: {agent.tasks_in_queue}</span>
                          <span>{nl ? 'Efficientie' : fr ? 'Efficacite' : 'Efficiency'}: {agent.efficiency_score}%</span>
                          <span>{nl ? 'Impact' : fr ? 'Impact' : 'Impact'}: {agent.revenue_impact > 0 ? formatCompact(agent.revenue_impact) : '—'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* System totals */}
                {orch && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-cyan-500" />
                      {nl ? 'Systeemtotalen' : fr ? 'Totaux du systeme' : 'System Totals'}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-muted/30 p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          {nl ? 'Totale Taken' : fr ? 'Total taches' : 'Total Tasks'}
                        </p>
                        <p className="text-xl font-bold">{orch.total_tasks_today}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          {nl ? 'Coordinatie' : fr ? 'Coordination' : 'Coordination'}
                        </p>
                        <p className="text-xl font-bold text-green-600">{orch.coordination_score}%</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          {nl ? 'Systeembelasting' : fr ? 'Charge' : 'Load'}
                        </p>
                        <p className="text-xl font-bold text-cyan-600">{orch.system_load}%</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-3 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          {nl ? 'Uptime' : fr ? 'Disponibilite' : 'Uptime'}
                        </p>
                        <p className="text-xl font-bold text-violet-600">{orch.uptime_percentage}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
