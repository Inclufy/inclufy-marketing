// src/pages/AutonomousMarketing.tsx
// Dedicated full-page autonomous marketing hub

import React, { lazy, Suspense, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAutonomousMarketing } from '@/hooks/useAutonomousMarketing';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Shield,
  DollarSign,
  Lightbulb,
  Bot,
  FlaskConical,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Beaker,
  CheckCircle2,
  Clock,
  Target,
  Sparkles,
} from 'lucide-react';
import autonomousService from '@/services/context-marketing/autonomous.service';
import type { DiscoveredAudience, AutoOptimization, ContentSchedule, PredictiveAlert } from '@/services/context-marketing/autonomous.service';

const MissionControl = lazy(() => import('@/components/context-marketing/MissionControl'));
const RevenueEngine = lazy(() => import('@/components/context-marketing/RevenueEngine'));
const AutomationDashboard = lazy(() => import('@/components/context-marketing/AutomationDashboard'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center py-16">
    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
  </div>
);

// AI Lab sub-component
function AILab() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { formatCompact } = useCurrency();
  const [audiences, setAudiences] = useState<DiscoveredAudience[]>([]);
  const [optimizations, setOptimizations] = useState<AutoOptimization[]>([]);
  const [schedules, setSchedules] = useState<ContentSchedule[]>([]);
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const loadSection = async (section: string) => {
    setLoading(prev => ({ ...prev, [section]: true }));
    try {
      switch (section) {
        case 'audiences':
          setAudiences(await autonomousService.discoverAudiences());
          break;
        case 'optimizations':
          setOptimizations(await autonomousService.getAutoOptimizations());
          break;
        case 'schedules':
          setSchedules(await autonomousService.autoScheduleContent());
          break;
        case 'alerts':
          setAlerts(await autonomousService.getPredictiveAlerts());
          break;
      }
    } catch (err) {
      console.error(`Failed to load ${section}:`, err);
    } finally {
      setLoading(prev => ({ ...prev, [section]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Predictive Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <CardTitle>{nl ? 'Voorspellende Alerts' : fr ? 'Alertes Prédictives' : 'Predictive Alerts'}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadSection('alerts')} disabled={loading.alerts}>
              {loading.alerts ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="ml-2">{nl ? 'Laden' : fr ? 'Charger' : 'Load'}</span>
            </Button>
          </div>
          <CardDescription>{nl ? 'Proactieve meldingen bij negatieve trends' : fr ? 'Notifications proactives pour les tendances negatives' : 'Proactive notifications for negative trends'}</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">{nl ? 'Klik op "Laden" om alerts te ontdekken' : fr ? 'Cliquez sur "Charger" pour decouvrir les alertes' : 'Click "Load" to discover alerts'}</p>
          ) : (
            <div className="space-y-3">
              {alerts.map(alert => (
                <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
                  alert.severity === 'critical' ? 'border-l-red-500 bg-red-50 dark:bg-red-900/10' :
                  alert.severity === 'warning' ? 'border-l-amber-500 bg-amber-50 dark:bg-amber-900/10' :
                  'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10'
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.description}</p>
                    </div>
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-gray-500">{nl ? 'Huidig' : fr ? 'Actuel' : 'Current'}: {alert.currentValue}</span>
                    <span className="text-xs text-gray-500">{nl ? 'Voorspeld' : fr ? 'Predit' : 'Predicted'}: {alert.predictedValue}</span>
                    <span className="text-xs text-gray-500">{alert.timeframe}</span>
                  </div>
                  <p className="text-xs text-purple-600 mt-2 font-medium">{nl ? 'Suggestie' : fr ? 'Suggestion' : 'Suggestion'}: {alert.suggestedAction}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Audience Discovery */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-500" />
              <CardTitle>{nl ? 'Slimme Doelgroep Ontdekking' : fr ? 'Decouverte d\'Audience Intelligente' : 'Smart Audience Discovery'}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadSection('audiences')} disabled={loading.audiences}>
              {loading.audiences ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span className="ml-2">{nl ? 'Ontdek' : fr ? 'Decouvrir' : 'Discover'}</span>
            </Button>
          </div>
          <CardDescription>{nl ? 'AI ontdekt nieuwe waardevolle doelgroepsegmenten' : fr ? 'L\'IA decouvre de nouveaux segments d\'audience' : 'AI discovers new valuable audience segments'}</CardDescription>
        </CardHeader>
        <CardContent>
          {audiences.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">{nl ? 'Klik op "Ontdek" om nieuwe segmenten te vinden' : fr ? 'Cliquez sur "Decouvrir" pour trouver de nouveaux segments' : 'Click "Discover" to find new segments'}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {audiences.map(aud => (
                <div key={aud.id} className="p-4 rounded-xl border bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-900/10 dark:to-pink-900/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold">{aud.name}</h4>
                    <Badge variant="outline" className="text-[10px]">{aud.matchScore}% match</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{aud.size.toLocaleString()} {nl ? 'contacten' : fr ? 'contacts' : 'contacts'}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {aud.characteristics.slice(0, 3).map((c, i) => (
                      <Badge key={i} variant="secondary" className="text-[9px]">{c}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-green-600 font-semibold">{nl ? 'Geschatte waarde' : fr ? 'Valeur estimee' : 'Est. value'}: {formatCompact(aud.estimatedValue)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Optimization (A/B Testing) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <CardTitle>{nl ? 'Auto-Optimalisatie' : fr ? 'Auto-Optimisation' : 'Auto-Optimization'}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadSection('optimizations')} disabled={loading.optimizations}>
              {loading.optimizations ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="ml-2">{nl ? 'Laden' : fr ? 'Charger' : 'Load'}</span>
            </Button>
          </div>
          <CardDescription>{nl ? 'Continue A/B tests met automatische winnaar selectie' : fr ? 'Tests A/B continus avec selection automatique du gagnant' : 'Continuous A/B tests with automatic winner selection'}</CardDescription>
        </CardHeader>
        <CardContent>
          {optimizations.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">{nl ? 'Klik op "Laden" om optimalisaties te bekijken' : fr ? 'Cliquez sur "Charger" pour voir les optimisations' : 'Click "Load" to view optimizations'}</p>
          ) : (
            <div className="space-y-4">
              {optimizations.map(opt => (
                <div key={opt.id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold">{opt.testName}</h4>
                    <Badge variant={opt.status === 'winner_found' ? 'default' : 'secondary'} className="text-[10px]">
                      {opt.status === 'winner_found' ? (nl ? 'Winnaar gevonden' : fr ? 'Gagnant trouve' : 'Winner found') :
                       opt.status === 'running' ? (nl ? 'Actief' : fr ? 'En cours' : 'Running') :
                       (nl ? 'Onvoldoende data' : fr ? 'Donnees insuffisantes' : 'Insufficient data')}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {opt.variants.map(v => (
                      <div key={v.id} className={`flex items-center justify-between p-2 rounded-md ${v.isWinner ? 'bg-green-50 dark:bg-green-900/10 border border-green-200' : 'bg-gray-50 dark:bg-gray-800'}`}>
                        <div className="flex items-center gap-2">
                          {v.isWinner && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                          <span className="text-sm">{v.name}</span>
                        </div>
                        <span className={`text-sm font-bold ${v.isWinner ? 'text-green-600' : 'text-gray-600'}`}>{v.performance}%</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] text-gray-500">{opt.autoAction}</span>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                      <span>{nl ? 'Betrouwbaarheid' : fr ? 'Fiabilite' : 'Confidence'}</span>
                      <span>{opt.confidenceLevel}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${opt.confidenceLevel >= 95 ? 'bg-green-500' : opt.confidenceLevel >= 80 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${opt.confidenceLevel}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Auto-Scheduling */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-500" />
              <CardTitle>{nl ? 'Content Auto-Planning' : fr ? 'Planification Auto du Contenu' : 'Content Auto-Scheduling'}</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={() => loadSection('schedules')} disabled={loading.schedules}>
              {loading.schedules ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              <span className="ml-2">{nl ? 'Plannen' : fr ? 'Planifier' : 'Schedule'}</span>
            </Button>
          </div>
          <CardDescription>{nl ? 'AI berekent optimale posttijden voor maximale engagement' : fr ? 'L\'IA calcule les heures optimales pour un engagement maximal' : 'AI calculates optimal posting times for maximum engagement'}</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">{nl ? 'Klik op "Plannen" om content te schedulen' : fr ? 'Cliquez sur "Planifier" pour programmer le contenu' : 'Click "Schedule" to auto-schedule content'}</p>
          ) : (
            <div className="space-y-3">
              {schedules.map(s => (
                <div key={s.contentId} className="flex items-center gap-4 p-3 rounded-lg border bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-900/10 dark:to-cyan-900/10">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(s.scheduledTime).toLocaleString()} &middot; {s.channel}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.reason}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-teal-600">{s.predictedEngagement}%</p>
                    <p className="text-[9px] text-gray-500">{nl ? 'Verwacht' : fr ? 'Predit' : 'Predicted'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AutonomousMarketing() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { formatCompact } = useCurrency();
  const autonomous = useAutonomousMarketing();
  const [activeTab, setActiveTab] = useState('mission');

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white">
        <div className="py-8 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Brain className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {nl ? 'Autonoom Marketing Hub' : fr ? 'Hub Marketing Autonome' : 'Autonomous Marketing Hub'}
                </h1>
                <p className="text-white/70 mt-1">
                  {nl ? 'Je AI marketing brein — beheert campagnes, content en strategie 24/7' : fr ? 'Votre cerveau marketing IA — gere campagnes, contenu et strategie 24/7' : 'Your AI marketing brain — managing campaigns, content, and strategy 24/7'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={autonomous.togglePause}
                className="border-white/30 text-white hover:bg-white/20"
              >
                {autonomous.isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                {autonomous.isPaused
                  ? (nl ? 'Hervatten' : fr ? 'Reprendre' : 'Resume')
                  : (nl ? 'Pauzeren' : fr ? 'Mettre en pause' : 'Pause')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={autonomous.refetch}
                className="border-white/30 text-white hover:bg-white/20"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{autonomous.systemHealth?.overall_score ?? '—'}%</p>
              <p className="text-xs text-white/70">{nl ? 'Systeemgezondheid' : fr ? 'Sante du Systeme' : 'System Health'}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{autonomous.pendingCount}</p>
              <p className="text-xs text-white/70">{nl ? 'Wachtende Beslissingen' : fr ? 'Decisions en Attente' : 'Pending Decisions'}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{autonomous.activeCampaigns.length}</p>
              <p className="text-xs text-white/70">{nl ? 'AI Campagnes' : fr ? 'Campagnes IA' : 'AI Campaigns'}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{autonomous.metrics?.successRate?.toFixed(0) ?? '—'}%</p>
              <p className="text-xs text-white/70">{nl ? 'Slagingspercentage' : fr ? 'Taux de Reussite' : 'Success Rate'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <TabsList className="bg-transparent border-0 p-0 h-auto">
            <TabsTrigger value="mission" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-4">
              <Shield className="h-4 w-4 mr-2" />
              {nl ? 'Mission Control' : fr ? 'Mission Control' : 'Mission Control'}
            </TabsTrigger>
            <TabsTrigger value="revenue" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-4">
              <DollarSign className="h-4 w-4 mr-2" />
              {nl ? 'Revenue Engine' : fr ? 'Moteur de Revenus' : 'Revenue Engine'}
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-4">
              <Lightbulb className="h-4 w-4 mr-2" />
              {nl ? 'Aanbevelingen' : fr ? 'Recommandations' : 'Recommendations'}
            </TabsTrigger>
            <TabsTrigger value="automations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-4">
              <Bot className="h-4 w-4 mr-2" />
              {nl ? 'Automations' : fr ? 'Automatisations' : 'Automations'}
            </TabsTrigger>
            <TabsTrigger value="lab" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-4">
              <FlaskConical className="h-4 w-4 mr-2" />
              {nl ? 'AI Lab' : fr ? 'Labo IA' : 'AI Lab'}
              <Badge className="ml-2 text-[9px] h-4 bg-gradient-to-r from-purple-500 to-pink-500 border-0">NEW</Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="py-8 px-6">
          <TabsContent value="mission" className="mt-0">
            <Suspense fallback={<LoadingFallback />}>
              <MissionControl />
            </Suspense>
          </TabsContent>

          <TabsContent value="revenue" className="mt-0">
            <Suspense fallback={<LoadingFallback />}>
              <RevenueEngine />
            </Suspense>
          </TabsContent>

          <TabsContent value="recommendations" className="mt-0">
            <Suspense fallback={<LoadingFallback />}>
              {/* Full recommendations page would go here - for now reuse existing pattern */}
              <Card>
                <CardHeader>
                  <CardTitle>{nl ? 'Alle AI Aanbevelingen' : fr ? 'Toutes les Recommandations IA' : 'All AI Recommendations'}</CardTitle>
                  <CardDescription>{nl ? 'Bekijk en beheer alle AI-gegenereerde aanbevelingen' : fr ? 'Consultez et gerez toutes les recommandations IA' : 'View and manage all AI-generated recommendations'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {autonomous.isLoading ? (
                    <LoadingFallback />
                  ) : autonomous.topRecommendations.length === 0 ? (
                    <div className="text-center py-8">
                      <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">{nl ? 'Geen aanbevelingen beschikbaar' : fr ? 'Aucune recommandation disponible' : 'No recommendations available'}</p>
                    </div>
                  ) : (
                    autonomous.topRecommendations.map(rec => (
                      <div key={rec.id} className="p-4 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={rec.priority === 'critical' ? 'destructive' : rec.priority === 'high' ? 'default' : 'secondary'} className="text-[10px]">
                                {rec.priority}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">{rec.type}</Badge>
                            </div>
                            <h4 className="text-sm font-bold">{rec.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">{rec.description}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{rec.rationale}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-500">{nl ? 'Vertrouwen' : fr ? 'Confiance' : 'Confidence'}: {rec.confidence_score}%</span>
                              {rec.impact_estimate.revenue && <span className="text-xs text-green-600 font-medium">+{formatCompact(rec.impact_estimate.revenue)}</span>}
                              <span className="text-xs text-gray-500">{nl ? 'Inspanning' : fr ? 'Effort' : 'Effort'}: {rec.implementation_effort}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => autonomous.acceptRecommendation(rec.id)}>
                              {nl ? 'Accepteer' : fr ? 'Accepter' : 'Accept'}
                            </Button>
                            <Button size="sm" variant="ghost" className="text-gray-500" onClick={() => autonomous.dismissRecommendation(rec.id)}>
                              {nl ? 'Afwijzen' : fr ? 'Rejeter' : 'Dismiss'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </Suspense>
          </TabsContent>

          <TabsContent value="automations" className="mt-0">
            <Suspense fallback={<LoadingFallback />}>
              <AutomationDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="lab" className="mt-0">
            <AILab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
