// src/pages/IntegrationHub.tsx
// Integration Hub — manage all platform connections, data flows, and health monitoring

import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIntegrationHub } from '@/hooks/useIntegrationHub';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Plug,
  Loader2,
  RefreshCw,
  Facebook,
  Linkedin,
  Search,
  Mail,
  Building,
  Zap,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Activity,
  Database,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Shield,
  Info,
} from 'lucide-react';
import type { IntegrationConfig, DataFlowEvent } from '@/services/context-marketing/integration-hub.service';
import type { IntegrationPlatform, IntegrationStatus, IntegrationCategory } from '@/services/context-marketing/integration-hub.service';

/* ------------------------------------------------------------------ */
/*  Platform icon mapping                                              */
/* ------------------------------------------------------------------ */

const platformIcons: Record<IntegrationPlatform, React.ReactNode> = {
  meta: <Facebook className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  google_ads: <Search className="w-5 h-5" />,
  sendgrid: <Mail className="w-5 h-5" />,
  hubspot: <Building className="w-5 h-5" />,
  mailchimp: <Mail className="w-5 h-5" />,
  zapier: <Zap className="w-5 h-5" />,
  slack: <MessageSquare className="w-5 h-5" />,
};

const platformColors: Record<IntegrationPlatform, string> = {
  meta: 'bg-blue-500',
  linkedin: 'bg-sky-600',
  google_ads: 'bg-amber-500',
  sendgrid: 'bg-blue-400',
  hubspot: 'bg-orange-500',
  mailchimp: 'bg-yellow-500',
  zapier: 'bg-orange-400',
  slack: 'bg-purple-500',
};

/* ------------------------------------------------------------------ */
/*  Status badge styling                                               */
/* ------------------------------------------------------------------ */

const statusStyles: Record<IntegrationStatus, string> = {
  connected: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  disconnected: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const statusLabels = (status: IntegrationStatus, nl: boolean, fr: boolean): string => {
  const map: Record<IntegrationStatus, { en: string; nl: string; fr: string }> = {
    connected: { en: 'Connected', nl: 'Verbonden', fr: 'Connecte' },
    disconnected: { en: 'Disconnected', nl: 'Niet verbonden', fr: 'Deconnecte' },
    error: { en: 'Error', nl: 'Fout', fr: 'Erreur' },
    pending: { en: 'Pending', nl: 'In afwachting', fr: 'En attente' },
    expired: { en: 'Expired', nl: 'Verlopen', fr: 'Expire' },
  };
  return nl ? map[status].nl : fr ? map[status].fr : map[status].en;
};

/* ------------------------------------------------------------------ */
/*  Category tabs                                                      */
/* ------------------------------------------------------------------ */

type TabCategory = 'all' | IntegrationCategory;

const tabConfig: { value: TabCategory; en: string; nl: string; fr: string }[] = [
  { value: 'all', en: 'All', nl: 'Alles', fr: 'Tout' },
  { value: 'advertising', en: 'Advertising', nl: 'Advertenties', fr: 'Publicite' },
  { value: 'social', en: 'Social', nl: 'Sociaal', fr: 'Social' },
  { value: 'email', en: 'Email', nl: 'E-mail', fr: 'E-mail' },
  { value: 'crm', en: 'CRM', nl: 'CRM', fr: 'CRM' },
  { value: 'communication', en: 'Communication', nl: 'Communicatie', fr: 'Communication' },
  { value: 'automation', en: 'Automation', nl: 'Automatisering', fr: 'Automatisation' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatRelativeTime(iso: string | undefined, nl: boolean, fr: boolean): string {
  if (!iso) return nl ? 'Nooit' : fr ? 'Jamais' : 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return nl ? 'Zojuist' : fr ? "A l'instant" : 'Just now';
  if (mins < 60) return `${mins}m ${nl ? 'geleden' : fr ? 'il y a' : 'ago'}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${nl ? 'geleden' : fr ? 'il y a' : 'ago'}`;
  const days = Math.floor(hours / 24);
  return `${days}d ${nl ? 'geleden' : fr ? 'il y a' : 'ago'}`;
}

function formatDataVolume(mb: number): string {
  if (mb >= 1000) return `${(mb / 1000).toFixed(1)} GB`;
  return `${mb.toFixed(1)} MB`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  icon,
  label,
  value,
  sublabel,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sublabel?: string;
  colorClass: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center transition-transform hover:scale-[1.02]">
      <div className={`inline-flex items-center justify-center p-2 rounded-lg ${colorClass} mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-white/70 mt-0.5">{label}</p>
      {sublabel && <p className="text-[10px] text-white/50 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function IntegrationCard({
  integration,
  nl,
  fr,
  onConnect,
  onDisconnect,
  onRefresh,
}: {
  integration: IntegrationConfig;
  nl: boolean;
  fr: boolean;
  onConnect: (platform: IntegrationPlatform) => void;
  onDisconnect: (id: string) => void;
  onRefresh: (id: string) => void;
}) {
  const isActive = integration.status === 'connected';
  const hasError = integration.status === 'error';

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-purple-900/10 border border-gray-200 dark:border-gray-800">
      <CardContent className="p-0">
        {/* Card header strip */}
        <div className={`h-1.5 ${isActive ? 'bg-gradient-to-r from-green-400 to-emerald-500' : hasError ? 'bg-gradient-to-r from-red-400 to-red-500' : 'bg-gray-200 dark:bg-gray-700'}`} />

        <div className="p-5">
          {/* Top row: platform + status */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl text-white ${platformColors[integration.platform]} shadow-sm`}>
                {platformIcons[integration.platform]}
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight">{integration.display_name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{integration.description}</p>
              </div>
            </div>
            <Badge className={`text-[10px] font-medium px-2 py-0.5 ${statusStyles[integration.status]}`}>
              {statusLabels(integration.status, nl, fr)}
            </Badge>
          </div>

          {/* Account info */}
          {integration.account_name && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3 pl-1">
              <Shield className="w-3 h-3" />
              <span>{integration.account_name}</span>
              {integration.account_id && (
                <span className="text-gray-400 dark:text-gray-500">({integration.account_id})</span>
              )}
            </div>
          )}

          {/* Last sync */}
          {integration.last_sync && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3 pl-1">
              <Clock className="w-3 h-3" />
              <span>
                {nl ? 'Laatste sync' : fr ? 'Derniere sync' : 'Last sync'}:{' '}
                {formatRelativeTime(integration.last_sync, nl, fr)}
              </span>
              {integration.data_flowing && (
                <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  {nl ? 'Actief' : fr ? 'Actif' : 'Live'}
                </span>
              )}
            </div>
          )}

          {/* Health score bar */}
          {isActive && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                  {nl ? 'Gezondheid' : fr ? 'Sante' : 'Health'}
                </span>
                <span className={`text-xs font-bold ${
                  integration.health_score >= 90 ? 'text-green-600 dark:text-green-400' :
                  integration.health_score >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {integration.health_score}%
                </span>
              </div>
              <Progress
                value={integration.health_score}
                className="h-1.5"
              />
            </div>
          )}

          {/* Sync stats */}
          {isActive && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {formatNumber(integration.sync_stats.last_24h_syncs)}
                </p>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">
                  {nl ? 'Syncs 24u' : fr ? 'Syncs 24h' : '24h Syncs'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {formatNumber(integration.sync_stats.records_synced)}
                </p>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">
                  {nl ? 'Records' : fr ? 'Enregistrements' : 'Records'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-2 text-center">
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {formatDataVolume(integration.sync_stats.data_volume_mb)}
                </p>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">
                  {nl ? 'Data' : fr ? 'Donnees' : 'Data'}
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {integration.error_message && (
            <div className="flex items-start gap-2 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg mb-4 text-xs text-red-700 dark:text-red-400">
              <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{integration.error_message}</span>
            </div>
          )}

          {/* Features */}
          {isActive && integration.features.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {integration.features.slice(0, 4).map((f, i) => (
                <Badge key={i} variant="secondary" className="text-[9px] px-1.5 py-0">
                  {f}
                </Badge>
              ))}
              {integration.features.length > 4 && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  +{integration.features.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            {isActive ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => onRefresh(integration.id)}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={() => onDisconnect(integration.id)}
                >
                  {nl ? 'Verbreken' : fr ? 'Deconnecter' : 'Disconnect'}
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                className="flex-1 text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                onClick={() => onConnect(integration.platform)}
              >
                <Plug className="w-3.5 h-3.5 mr-1.5" />
                {nl ? 'Verbinden' : fr ? 'Connecter' : 'Connect'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataFlowTimeline({
  events,
  integrations,
  nl,
  fr,
}: {
  events: DataFlowEvent[];
  integrations: IntegrationConfig[];
  nl: boolean;
  fr: boolean;
}) {
  const integrationMap = useMemo(() => {
    const map = new Map<string, IntegrationConfig>();
    integrations.forEach((i) => map.set(i.id, i));
    return map;
  }, [integrations]);

  const flowStatusStyle: Record<string, string> = {
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          <CardTitle className="text-lg">
            {nl ? 'Data Flow Tijdlijn' : fr ? 'Chronologie des Flux de Donnees' : 'Data Flow Timeline'}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto pr-1 space-y-2">
          {events.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {nl ? 'Geen recente data flows' : fr ? 'Aucun flux de donnees recent' : 'No recent data flows'}
            </p>
          ) : (
            events.map((event) => {
              const integration = integrationMap.get(event.integration_id);
              const isInbound = event.direction === 'inbound';
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  {/* Direction icon */}
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    isInbound
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                  }`}>
                    {isInbound ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>

                  {/* Platform icon */}
                  <div className={`p-1.5 rounded-lg text-white flex-shrink-0 ${platformColors[event.platform]}`}>
                    {platformIcons[event.platform]}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {event.data_type}
                      </p>
                      <Badge className={`text-[9px] px-1.5 py-0 ${flowStatusStyle[event.status]}`}>
                        {event.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {integration?.display_name ?? event.platform}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {isInbound
                          ? (nl ? 'Inkomend' : fr ? 'Entrant' : 'Inbound')
                          : (nl ? 'Uitgaand' : fr ? 'Sortant' : 'Outbound')}
                      </span>
                    </div>
                  </div>

                  {/* Record count */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {formatNumber(event.record_count)}
                    </p>
                    <p className="text-[9px] text-gray-500 dark:text-gray-400">
                      {nl ? 'records' : fr ? 'enregistrements' : 'records'}
                    </p>
                  </div>

                  {/* Timestamp & duration */}
                  <div className="text-right flex-shrink-0 min-w-[70px]">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {formatRelativeTime(event.timestamp, nl, fr)}
                    </p>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500">
                      {event.duration_ms < 1000 ? `${event.duration_ms}ms` : `${(event.duration_ms / 1000).toFixed(1)}s`}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function IssuesPanel({
  issues,
  nl,
  fr,
}: {
  issues: Array<{ integration_id: string; platform: IntegrationPlatform; severity: 'critical' | 'warning' | 'info'; message: string }>;
  nl: boolean;
  fr: boolean;
}) {
  if (issues.length === 0) return null;

  const severityStyles: Record<string, string> = {
    critical: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
    warning: 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10',
    info: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
  };

  const severityIcons: Record<string, React.ReactNode> = {
    critical: <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <CardTitle className="text-lg">
            {nl ? 'Aandachtspunten' : fr ? "Points d'Attention" : 'Issues & Warnings'}
          </CardTitle>
          <Badge variant="destructive" className="text-[10px] ml-auto">
            {issues.length} {nl ? 'items' : fr ? 'elements' : 'items'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {issues.map((issue, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border-l-4 ${severityStyles[issue.severity]} transition-all hover:shadow-sm`}
          >
            <div className="flex items-start gap-3">
              {severityIcons[issue.severity]}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`p-1 rounded text-white ${platformColors[issue.platform]}`}>
                    {React.cloneElement(platformIcons[issue.platform] as React.ReactElement, { className: 'w-3 h-3' })}
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {issue.platform.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                  <Badge variant={issue.severity === 'critical' ? 'destructive' : 'secondary'} className="text-[9px]">
                    {issue.severity}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{issue.message}</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function IntegrationHub() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const {
    integrations,
    healthReport,
    dataFlow,
    isLoading,
    error,
    connect,
    disconnect,
    refreshSync,
    refetch,
  } = useIntegrationHub();

  const [activeTab, setActiveTab] = useState<TabCategory>('all');

  /* Filter integrations by category */
  const filteredIntegrations = useMemo(() => {
    if (activeTab === 'all') return integrations;
    return integrations.filter((i) => i.category === activeTab);
  }, [integrations, activeTab]);

  /* Loading state */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {nl ? 'Integraties laden...' : fr ? 'Chargement des integrations...' : 'Loading integrations...'}
          </p>
        </div>
      </div>
    );
  }

  /* Error state */
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {nl ? 'Opnieuw proberen' : fr ? 'Reessayer' : 'Retry'}
          </Button>
        </div>
      </div>
    );
  }

  const connectedCount = healthReport?.connected_count ?? integrations.filter((i) => i.status === 'connected').length;
  const totalAvailable = healthReport?.total_available ?? integrations.length;
  const overallScore = healthReport?.overall_score ?? 0;
  const syncedToday = healthReport?.total_synced_today ?? 0;
  const activeFlows = integrations.filter((i) => i.data_flowing).length;

  return (
    <div className="w-full">
      {/* ============================================================ */}
      {/*  Gradient Header                                              */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="py-8 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Plug className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">
                    {nl ? 'Integratie Hub' : fr ? "Hub d'Integration" : 'Integration Hub'}
                  </h1>
                  <Badge
                    className={`text-xs font-semibold px-2.5 py-1 ${
                      overallScore >= 90
                        ? 'bg-green-500/20 text-green-100 border border-green-400/30'
                        : overallScore >= 70
                        ? 'bg-yellow-500/20 text-yellow-100 border border-yellow-400/30'
                        : 'bg-red-500/20 text-red-100 border border-red-400/30'
                    }`}
                  >
                    {nl ? 'Gezondheid' : fr ? 'Sante' : 'Health'}: {overallScore}%
                  </Badge>
                </div>
                <p className="text-white/70 mt-1">
                  {nl
                    ? 'Beheer al je platform-verbindingen, datastromen en synchronisatie'
                    : fr
                    ? 'Gerez toutes vos connexions de plateforme, flux de donnees et synchronisation'
                    : 'Manage all your platform connections, data flows, and synchronization'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              className="border-white/30 text-white hover:bg-white/20"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Stat cards in header */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <StatCard
              icon={<Wifi className="w-4 h-4 text-white" />}
              label={nl ? 'Verbonden Integraties' : fr ? 'Integrations Connectees' : 'Connected Integrations'}
              value={`${connectedCount}/${totalAvailable}`}
              colorClass="bg-white/20"
            />
            <StatCard
              icon={<Database className="w-4 h-4 text-white" />}
              label={nl ? 'Data Gesynchroniseerd Vandaag' : fr ? "Donnees Synchronisees Aujourd'hui" : 'Data Synced Today'}
              value={formatNumber(syncedToday)}
              sublabel={healthReport ? formatDataVolume(healthReport.total_data_volume_mb) : undefined}
              colorClass="bg-white/20"
            />
            <StatCard
              icon={<CheckCircle2 className="w-4 h-4 text-white" />}
              label={nl ? 'Gezondheidsscore' : fr ? 'Score de Sante' : 'Health Score'}
              value={`${overallScore}%`}
              colorClass="bg-white/20"
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4 text-white" />}
              label={nl ? 'Actieve Data Flows' : fr ? 'Flux de Donnees Actifs' : 'Active Data Flows'}
              value={activeFlows}
              colorClass="bg-white/20"
            />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Content Area                                                 */}
      {/* ============================================================ */}
      <div className="px-6 py-6 space-y-6">
        {/* Tabs for category filtering */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabCategory)} className="w-full">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1">
            <TabsList className="bg-transparent border-0 p-0 h-auto w-full flex flex-wrap gap-1">
              {tabConfig.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-lg px-4 py-2 text-xs font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  {nl ? tab.nl : fr ? tab.fr : tab.en}
                  {tab.value !== 'all' && (
                    <span className="ml-1.5 text-[10px] opacity-70">
                      ({integrations.filter((i) => tab.value === 'all' || i.category === tab.value).length})
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Integration cards grid — one TabsContent per tab */}
          {tabConfig.map((tab) => (
            <TabsContent key={tab.value} value={tab.value} className="mt-4">
              {filteredIntegrations.length === 0 ? (
                <div className="text-center py-12">
                  <Plug className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {nl
                      ? 'Geen integraties gevonden in deze categorie'
                      : fr
                      ? 'Aucune integration trouvee dans cette categorie'
                      : 'No integrations found in this category'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredIntegrations.map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      nl={nl}
                      fr={fr}
                      onConnect={connect}
                      onDisconnect={disconnect}
                      onRefresh={refreshSync}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Data Flow Timeline */}
        <DataFlowTimeline
          events={dataFlow}
          integrations={integrations}
          nl={nl}
          fr={fr}
        />

        {/* Issues & Warnings */}
        {healthReport?.issues && (
          <IssuesPanel
            issues={healthReport.issues}
            nl={nl}
            fr={fr}
          />
        )}
      </div>
    </div>
  );
}
