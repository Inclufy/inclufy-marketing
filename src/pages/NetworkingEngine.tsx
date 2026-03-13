// src/pages/NetworkingEngine.tsx
// Networking Engine — Lead capture via QR, NFC, LinkedIn scanning & AI enrichment

import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useNetworkingEngine } from '@/hooks/useNetworkingEngine';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Loader2,
  RefreshCw,
  CalendarDays,
  Handshake,
  Percent,
  QrCode,
  Linkedin,
  CreditCard,
  Nfc,
  BadgeCheck,
  Pencil,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  UserPlus,
  ExternalLink,
  Send,
  CloudUpload,
  Sparkles,
  MessageSquare,
  Eye,
  Mail,
  CheckCircle2,
  Clock,
  Star,
  AlertTriangle,
  TrendingUp,
  Link2,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { CapturedContact, QRCodeConfig, CaptureMethod, ContactStatus } from '@/services/context-marketing/networking-engine.service';

// ─── Helpers ────────────────────────────────────────────────────────

function getCaptureMethodBadge(method: CaptureMethod): { color: string; label: string; icon: React.ReactNode } {
  switch (method) {
    case 'qr_code':
      return { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', label: 'QR Code', icon: <QrCode className="h-3 w-3" /> };
    case 'linkedin_scan':
      return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'LinkedIn', icon: <Linkedin className="h-3 w-3" /> };
    case 'business_card':
      return { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: 'Business Card', icon: <CreditCard className="h-3 w-3" /> };
    case 'nfc':
      return { color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300', label: 'NFC', icon: <Nfc className="h-3 w-3" /> };
    case 'event_badge':
      return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', label: 'Event Badge', icon: <BadgeCheck className="h-3 w-3" /> };
    default:
      return { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300', label: 'Manual', icon: <Pencil className="h-3 w-3" /> };
  }
}

function getStatusBadge(status: ContactStatus): { color: string; label: string; labelNl: string; labelFr: string } {
  switch (status) {
    case 'captured':
      return { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300', label: 'Captured', labelNl: 'Vastgelegd', labelFr: 'Captur\u00e9' };
    case 'enriched':
      return { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Enriched', labelNl: 'Verrijkt', labelFr: 'Enrichi' };
    case 'synced_crm':
      return { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: 'Synced CRM', labelNl: 'CRM Gesync', labelFr: 'CRM Sync' };
    case 'follow_up_sent':
      return { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', label: 'Follow-up Sent', labelNl: 'Follow-up Verstuurd', labelFr: 'Suivi Envoy\u00e9' };
    case 'meeting_booked':
      return { color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', label: 'Meeting Booked', labelNl: 'Meeting Gepland', labelFr: 'R\u00e9union Planifi\u00e9e' };
    case 'converted':
      return { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', label: 'Converted', labelNl: 'Geconverteerd', labelFr: 'Converti' };
    default:
      return { color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300', label: status, labelNl: status, labelFr: status };
  }
}

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-purple-600';
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  if (score >= 30) return 'text-orange-600';
  return 'text-red-600';
}

function getScoreProgressColor(score: number): string {
  if (score >= 85) return 'bg-purple-500';
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}

function formatRelativeTime(iso: string, nl: boolean, fr: boolean): string {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return nl ? 'Zojuist' : fr ? "\u00c0 l'instant" : 'Just now';
  if (diffMins < 60) return nl ? `${diffMins} min geleden` : fr ? `Il y a ${diffMins} min` : `${diffMins}m ago`;
  if (diffHours < 24) return nl ? `${diffHours} uur geleden` : fr ? `Il y a ${diffHours}h` : `${diffHours}h ago`;
  if (diffDays < 7) return nl ? `${diffDays} dagen geleden` : fr ? `Il y a ${diffDays} jours` : `${diffDays}d ago`;
  return d.toLocaleDateString();
}

// ─── Main Component ─────────────────────────────────────────────────

export default function NetworkingEngine() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { formatCurrency, formatCompact } = useCurrency();
  const { toast } = useToast();
  const {
    contacts,
    metrics,
    qrCodes,
    isLoading,
    error,
    enrichContact,
    syncToCRM,
    sendFollowUp,
    generateQRCode,
    refetch,
  } = useNetworkingEngine();

  const [activeTab, setActiveTab] = useState('contacts');
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');

  // ─── Action handlers ──────────────────────────────────────────────

  const handleEnrich = useCallback(async (id: string) => {
    setActionLoading(`enrich-${id}`);
    try {
      await enrichContact(id);
      toast({
        title: nl ? 'Contact verrijkt' : fr ? 'Contact enrichi' : 'Contact enriched',
        description: nl ? 'AI enrichment voltooid' : fr ? 'Enrichissement IA termin\u00e9' : 'AI enrichment completed',
      });
      refetch();
    } catch {
      toast({ title: nl ? 'Fout' : fr ? 'Erreur' : 'Error', description: nl ? 'Verrijking mislukt' : fr ? "\u00c9chec de l'enrichissement" : 'Enrichment failed', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  }, [enrichContact, refetch, toast, nl, fr]);

  const handleSyncCRM = useCallback(async (id: string) => {
    setActionLoading(`sync-${id}`);
    try {
      await syncToCRM(id);
      toast({
        title: nl ? 'CRM gesync' : fr ? 'CRM synchronis\u00e9' : 'CRM synced',
        description: nl ? 'Contact succesvol naar CRM gestuurd' : fr ? 'Contact envoy\u00e9 au CRM' : 'Contact synced to CRM',
      });
      refetch();
    } catch {
      toast({ title: nl ? 'Fout' : fr ? 'Erreur' : 'Error', description: nl ? 'CRM sync mislukt' : fr ? '\u00c9chec de la sync CRM' : 'CRM sync failed', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  }, [syncToCRM, refetch, toast, nl, fr]);

  const handleSendFollowUp = useCallback(async (id: string) => {
    setActionLoading(`follow-${id}`);
    try {
      await sendFollowUp(id);
      toast({
        title: nl ? 'Follow-up verstuurd' : fr ? 'Suivi envoy\u00e9' : 'Follow-up sent',
        description: nl ? 'AI follow-up is verzonden' : fr ? 'Suivi IA envoy\u00e9' : 'AI follow-up sent successfully',
      });
      refetch();
    } catch {
      toast({ title: nl ? 'Fout' : fr ? 'Erreur' : 'Error', description: nl ? 'Follow-up mislukt' : fr ? '\u00c9chec du suivi' : 'Follow-up failed', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  }, [sendFollowUp, refetch, toast, nl, fr]);

  const handleGenerateQR = useCallback(async () => {
    setActionLoading('generate-qr');
    try {
      await generateQRCode('New QR Code');
      toast({
        title: nl ? 'QR Code aangemaakt' : fr ? 'QR Code cr\u00e9\u00e9' : 'QR Code generated',
        description: nl ? 'Nieuwe QR code is klaar' : fr ? 'Le nouveau QR code est pr\u00eat' : 'New QR code is ready',
      });
      refetch();
    } catch {
      toast({ title: nl ? 'Fout' : fr ? 'Erreur' : 'Error', variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  }, [generateQRCode, refetch, toast, nl, fr]);

  // ─── Filtered contacts ────────────────────────────────────────────

  const filteredContacts = useMemo(() => {
    if (statusFilter === 'all') return contacts;
    return contacts.filter(c => c.status === statusFilter);
  }, [contacts, statusFilter]);

  // ─── Loading State ────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm text-muted-foreground">
            {nl ? 'Networking data laden...' : fr ? 'Chargement des donn\u00e9es...' : 'Loading networking data...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="outline" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {nl ? 'Opnieuw proberen' : fr ? 'R\u00e9essayer' : 'Retry'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Stats ────────────────────────────────────────────────────────

  const stats = [
    {
      label: nl ? 'Totale Contacten' : fr ? 'Total Contacts' : 'Total Contacts',
      value: metrics?.total_contacts?.toLocaleString() ?? '\u2014',
      icon: <Users className="h-5 w-5" />,
      color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: nl ? 'Deze Maand' : fr ? 'Ce Mois' : 'This Month',
      value: metrics?.contacts_this_month?.toLocaleString() ?? '\u2014',
      icon: <CalendarDays className="h-5 w-5" />,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: nl ? 'Meetings Gepland' : fr ? 'R\u00e9unions Planifi\u00e9es' : 'Meetings Booked',
      value: metrics?.meetings_booked?.toLocaleString() ?? '\u2014',
      icon: <Handshake className="h-5 w-5" />,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: nl ? 'Antwoordratio' : fr ? 'Taux de R\u00e9ponse' : 'Reply Rate',
      value: metrics ? `${metrics.reply_rate}%` : '\u2014',
      icon: <MessageSquare className="h-5 w-5" />,
      color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: nl ? 'Conversie' : fr ? 'Conversion' : 'Conversion',
      value: metrics ? `${metrics.conversion_rate}%` : '\u2014',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30',
    },
  ];

  // ─── Capture method label map ─────────────────────────────────────

  const captureMethodLabel: Record<CaptureMethod, string> = {
    qr_code: 'QR Code',
    linkedin_scan: 'LinkedIn',
    business_card: nl ? 'Visitekaartje' : fr ? 'Carte de visite' : 'Business Card',
    nfc: 'NFC',
    event_badge: nl ? 'Event Badge' : fr ? "Badge d'\u00e9v\u00e9nement" : 'Event Badge',
    manual: nl ? 'Handmatig' : fr ? 'Manuel' : 'Manual',
  };

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-6 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {nl ? 'Networking Engine' : fr ? 'Moteur de Networking' : 'Networking Engine'}
              </h1>
              <p className="text-sm text-white/70 mt-0.5">
                {nl
                  ? 'Lead capture via QR, NFC, LinkedIn scanning en AI enrichment'
                  : fr
                  ? 'Capture de leads via QR, NFC, LinkedIn et enrichissement IA'
                  : 'Lead capture via QR, NFC, LinkedIn scanning & AI enrichment'}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white/20 hover:bg-white/30 text-white border-white/20"
            onClick={refetch}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* ─── Stats Bar ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${stat.color}`}>
                  {stat.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ─── Tabs ────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="contacts" className="gap-1.5">
            <Users className="h-4 w-4" />
            {nl ? 'Contacten' : fr ? 'Contacts' : 'Contacts'}
          </TabsTrigger>
          <TabsTrigger value="qrcodes" className="gap-1.5">
            <QrCode className="h-4 w-4" />
            {nl ? 'QR Codes' : fr ? 'Codes QR' : 'QR Codes'}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            {nl ? 'Analyse' : fr ? 'Analytiques' : 'Analytics'}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Contacts                                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="contacts" className="mt-6 space-y-4">
          {/* Status filter bar */}
          <div className="flex flex-wrap gap-2">
            {(['all', 'captured', 'enriched', 'synced_crm', 'follow_up_sent', 'meeting_booked', 'converted'] as const).map((s) => {
              const filterLabel = s === 'all'
                ? (nl ? 'Alle' : fr ? 'Tous' : 'All')
                : getStatusBadge(s as ContactStatus).label;
              return (
                <Button
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className="text-xs"
                >
                  {s === 'all' ? filterLabel : (nl ? getStatusBadge(s as ContactStatus).labelNl : fr ? getStatusBadge(s as ContactStatus).labelFr : filterLabel)}
                </Button>
              );
            })}
          </div>

          {/* Contact cards */}
          <div className="space-y-4">
            {filteredContacts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {nl ? 'Geen contacten gevonden' : fr ? 'Aucun contact trouv\u00e9' : 'No contacts found'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredContacts.map((contact) => {
                const methodBadge = getCaptureMethodBadge(contact.capture_method);
                const statusBadge = getStatusBadge(contact.status);
                const isExpanded = expandedContactId === contact.id;

                return (
                  <Card
                    key={contact.id}
                    className="hover:shadow-lg transition-all duration-200 border-l-4"
                    style={{
                      borderLeftColor:
                        contact.status === 'converted' ? '#10b981'
                          : contact.status === 'meeting_booked' ? '#8b5cf6'
                          : contact.status === 'follow_up_sent' ? '#f59e0b'
                          : contact.status === 'synced_crm' ? '#22c55e'
                          : contact.status === 'enriched' ? '#3b82f6'
                          : '#9ca3af',
                    }}
                  >
                    <CardContent className="p-5">
                      {/* Top row */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold">{contact.name}</h3>
                            <Badge className={`${methodBadge.color} text-xs gap-1`}>
                              {methodBadge.icon}
                              {methodBadge.label}
                            </Badge>
                            <Badge className={`${statusBadge.color} text-xs`}>
                              {nl ? statusBadge.labelNl : fr ? statusBadge.labelFr : statusBadge.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {contact.title} {nl ? 'bij' : fr ? 'chez' : 'at'} <span className="font-medium text-foreground">{contact.company}</span>
                          </p>
                          {contact.event_name && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              {contact.event_name} &middot; {formatRelativeTime(contact.captured_at, nl, fr)}
                            </p>
                          )}
                        </div>

                        {/* Enrichment score */}
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">
                              {nl ? 'Verrijking' : fr ? 'Enrichissement' : 'Enrichment'}
                            </p>
                            <div className="w-20">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-bold ${getScoreColor(contact.enrichment.score)}`}>
                                  {contact.enrichment.score}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${getScoreProgressColor(contact.enrichment.score)}`}
                                  style={{ width: `${contact.enrichment.score}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">
                              {nl ? 'Intentie' : fr ? 'Intention' : 'Intent'}
                            </p>
                            <span className={`text-lg font-bold ${getScoreColor(contact.ai_insights.intent_score)}`}>
                              {contact.ai_insights.intent_score}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedContactId(isExpanded ? null : contact.id)}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Tags */}
                      {contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {contact.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border space-y-4">
                          {/* Contact info row */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{contact.email}</span>
                            </div>
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Tel:</span>
                                <span>{contact.phone}</span>
                              </div>
                            )}
                            {contact.linkedin_url && (
                              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                                <Linkedin className="h-4 w-4" />
                                <span className="truncate">{contact.linkedin_url}</span>
                              </div>
                            )}
                          </div>

                          {/* Enrichment details */}
                          {contact.enrichment && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {contact.enrichment.industry && (
                                <div className="bg-muted/50 rounded-lg p-2">
                                  <p className="text-xs text-muted-foreground">{nl ? 'Industrie' : fr ? 'Industrie' : 'Industry'}</p>
                                  <p className="text-sm font-medium">{contact.enrichment.industry}</p>
                                </div>
                              )}
                              {contact.enrichment.company_size && (
                                <div className="bg-muted/50 rounded-lg p-2">
                                  <p className="text-xs text-muted-foreground">{nl ? 'Bedrijfsgrootte' : fr ? "Taille d'entreprise" : 'Company Size'}</p>
                                  <p className="text-sm font-medium">{contact.enrichment.company_size}</p>
                                </div>
                              )}
                              {contact.enrichment.revenue_range && (
                                <div className="bg-muted/50 rounded-lg p-2">
                                  <p className="text-xs text-muted-foreground">{nl ? 'Omzet' : fr ? "Chiffre d'affaires" : 'Revenue'}</p>
                                  <p className="text-sm font-medium">{contact.enrichment.revenue_range}</p>
                                </div>
                              )}
                              {contact.enrichment.location && (
                                <div className="bg-muted/50 rounded-lg p-2">
                                  <p className="text-xs text-muted-foreground">{nl ? 'Locatie' : fr ? 'Localisation' : 'Location'}</p>
                                  <p className="text-sm font-medium">{contact.enrichment.location}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* AI Insights */}
                          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="h-4 w-4 text-emerald-600" />
                              <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                {nl ? 'AI Inzichten' : fr ? 'Insights IA' : 'AI Insights'}
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {nl ? 'Beste kanaal' : fr ? 'Meilleur canal' : 'Best Channel'}
                                </p>
                                <p className="text-sm font-medium">{contact.ai_insights.best_channel}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {nl ? 'Beste timing' : fr ? 'Meilleur moment' : 'Best Time'}
                                </p>
                                <p className="text-sm font-medium">{contact.ai_insights.best_time}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="text-xs text-muted-foreground mb-1">
                                  {nl ? 'Voorgestelde follow-up' : fr ? 'Suivi sugg\u00e9r\u00e9' : 'Suggested Follow-up'}
                                </p>
                                <p className="text-sm">{contact.ai_insights.suggested_follow_up}</p>
                              </div>
                              {contact.ai_insights.mutual_connections > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {nl ? 'Gemeenschappelijke connecties' : fr ? 'Connexions mutuelles' : 'Mutual Connections'}
                                  </p>
                                  <p className="text-sm font-medium">{contact.ai_insights.mutual_connections}</p>
                                </div>
                              )}
                            </div>

                            {/* Talking Points */}
                            {contact.ai_insights.talking_points.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-muted-foreground mb-1.5">
                                  {nl ? 'Gesprekspunten' : fr ? 'Points de discussion' : 'Talking Points'}
                                </p>
                                <ul className="space-y-1">
                                  {contact.ai_insights.talking_points.map((point, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>

                          {/* Follow-up status */}
                          {contact.follow_up && (
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1.5">
                                <Send className={`h-3.5 w-3.5 ${contact.follow_up.sent ? 'text-green-500' : 'text-gray-400'}`} />
                                <span className={contact.follow_up.sent ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                                  {nl ? 'Verzonden' : fr ? 'Envoy\u00e9' : 'Sent'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Eye className={`h-3.5 w-3.5 ${contact.follow_up.opened ? 'text-blue-500' : 'text-gray-400'}`} />
                                <span className={contact.follow_up.opened ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}>
                                  {nl ? 'Geopend' : fr ? 'Ouvert' : 'Opened'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MessageSquare className={`h-3.5 w-3.5 ${contact.follow_up.replied ? 'text-purple-500' : 'text-gray-400'}`} />
                                <span className={contact.follow_up.replied ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}>
                                  {nl ? 'Beantwoord' : fr ? 'R\u00e9pondu' : 'Replied'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {contact.notes && (
                            <div className="bg-muted/30 rounded-lg p-3">
                              <p className="text-xs text-muted-foreground mb-1">{nl ? 'Notities' : fr ? 'Notes' : 'Notes'}</p>
                              <p className="text-sm">{contact.notes}</p>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-2 pt-2">
                            {(contact.status === 'captured') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEnrich(contact.id)}
                                disabled={actionLoading === `enrich-${contact.id}`}
                                className="gap-1.5"
                              >
                                {actionLoading === `enrich-${contact.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                {nl ? 'Verrijken' : fr ? 'Enrichir' : 'Enrich'}
                              </Button>
                            )}
                            {(['captured', 'enriched'] as ContactStatus[]).includes(contact.status) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSyncCRM(contact.id)}
                                disabled={actionLoading === `sync-${contact.id}`}
                                className="gap-1.5"
                              >
                                {actionLoading === `sync-${contact.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudUpload className="h-3.5 w-3.5" />}
                                {nl ? 'Sync CRM' : fr ? 'Sync CRM' : 'Sync CRM'}
                              </Button>
                            )}
                            {(['enriched', 'synced_crm'] as ContactStatus[]).includes(contact.status) && (
                              <Button
                                size="sm"
                                onClick={() => handleSendFollowUp(contact.id)}
                                disabled={actionLoading === `follow-${contact.id}`}
                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                {actionLoading === `follow-${contact.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                {nl ? 'Verstuur Follow-up' : fr ? 'Envoyer Suivi' : 'Send Follow-up'}
                              </Button>
                            )}
                            {contact.linkedin_url && (
                              <Button size="sm" variant="ghost" className="gap-1.5 text-blue-600 dark:text-blue-400">
                                <ExternalLink className="h-3.5 w-3.5" />
                                LinkedIn
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: QR Codes                                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="qrcodes" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {nl ? 'QR Codes' : fr ? 'Codes QR' : 'QR Codes'}
            </h2>
            <Button
              onClick={handleGenerateQR}
              disabled={actionLoading === 'generate-qr'}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {actionLoading === 'generate-qr' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {nl ? 'Nieuwe QR Code' : fr ? 'Nouveau Code QR' : 'Generate New QR'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {qrCodes.map((qr) => (
              <Card key={qr.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                        <QrCode className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{qr.name}</h3>
                        <Badge className={qr.active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs mt-1'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 text-xs mt-1'
                        }>
                          {qr.active
                            ? (nl ? 'Actief' : fr ? 'Actif' : 'Active')
                            : (nl ? 'Inactief' : fr ? 'Inactif' : 'Inactive')
                          }
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 truncate">
                    <Link2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{qr.url}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">{nl ? 'Scans' : fr ? 'Scans' : 'Scans'}</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{qr.scans.toLocaleString()}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <p className="text-xs text-muted-foreground">{nl ? 'Leads' : fr ? 'Leads' : 'Leads'}</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{qr.leads_captured.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(qr.created_at).toLocaleDateString()}
                    </span>
                    {qr.scans > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {((qr.leads_captured / qr.scans) * 100).toFixed(1)}% {nl ? 'conversie' : fr ? 'conversion' : 'conversion'}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB: Analytics                                                 */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          {/* Rate stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{nl ? 'Verrijkingsratio' : fr ? "Taux d'enrichissement" : 'Enrichment Rate'}</p>
                    <p className="text-2xl font-bold">{metrics?.enrichment_rate ?? 0}%</p>
                  </div>
                </div>
                <Progress value={metrics?.enrichment_rate ?? 0} className="h-2" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600">
                    <CloudUpload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{nl ? 'CRM Sync Ratio' : fr ? 'Taux de Sync CRM' : 'CRM Sync Rate'}</p>
                    <p className="text-2xl font-bold">{metrics?.crm_sync_rate ?? 0}%</p>
                  </div>
                </div>
                <Progress value={metrics?.crm_sync_rate ?? 0} className="h-2" />
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                    <Send className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{nl ? 'Follow-up Ratio' : fr ? 'Taux de Suivi' : 'Follow-up Rate'}</p>
                    <p className="text-2xl font-bold">{metrics?.follow_up_sent_rate ?? 0}%</p>
                  </div>
                </div>
                <Progress value={metrics?.follow_up_sent_rate ?? 0} className="h-2" />
              </CardContent>
            </Card>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Capture by Method — Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-emerald-500" />
                  {nl ? 'Capture Methodes' : fr ? 'M\u00e9thodes de Capture' : 'Capture Methods'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.capture_by_method && metrics.capture_by_method.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metrics.capture_by_method.map(m => ({
                          name: captureMethodLabel[m.method] || m.method,
                          value: m.count,
                          color: m.color,
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {metrics.capture_by_method.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                        formatter={(value: number, name: string) => [value, name]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    {nl ? 'Geen data beschikbaar' : fr ? 'Aucune donn\u00e9e disponible' : 'No data available'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Captures — Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-teal-500" />
                  {nl ? 'Wekelijkse Captures' : fr ? 'Captures Hebdomadaires' : 'Weekly Captures'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics?.weekly_captures && metrics.weekly_captures.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics.weekly_captures}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      />
                      <Legend />
                      <Bar
                        dataKey="contacts"
                        name={nl ? 'Contacten' : fr ? 'Contacts' : 'Contacts'}
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="enriched"
                        name={nl ? 'Verrijkt' : fr ? 'Enrichis' : 'Enriched'}
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="converted"
                        name={nl ? 'Geconverteerd' : fr ? 'Convertis' : 'Converted'}
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                    {nl ? 'Geen data beschikbaar' : fr ? 'Aucune donn\u00e9e disponible' : 'No data available'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Capture methods breakdown table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                {nl ? 'Capture Methodes Overzicht' : fr ? 'Aper\u00e7u des M\u00e9thodes' : 'Capture Methods Breakdown'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.capture_by_method?.map((entry) => {
                  const total = metrics.capture_by_method.reduce((s, e) => s + e.count, 0);
                  const pct = total > 0 ? ((entry.count / total) * 100) : 0;
                  const mb = getCaptureMethodBadge(entry.method);
                  return (
                    <div key={entry.method} className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${mb.color}`}>
                        {mb.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{captureMethodLabel[entry.method]}</span>
                          <span className="text-sm font-bold">{entry.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: entry.color }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">{pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
