// src/pages/LuxuryDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Activity,
  BarChart3,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Filter,
  Download,
  Sparkles,
  Crown,
  Gem,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

const CHART_COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

interface DashboardStats {
  campaigns: { total: number; active: number; draft: number };
  contacts: { total: number };
  events?: { total: number };
  revenue?: { total: number };
}

interface CampaignSummary {
  id: string;
  name: string;
  status: string;
  type: string;
  budget_amount: number | null;
  created_at: string;
}

// Luxury metric card with glassmorphism effect
const LuxuryMetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  subtitle,
  loading = false,
  loadingText = 'Loading...'
}: any) => (
  <Card className="group relative overflow-hidden border-gray-200 dark:border-gray-800 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
    <div className={cn(
      "absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity",
      color === 'purple' && "bg-gradient-to-br from-purple-600 to-pink-600",
      color === 'blue' && "bg-gradient-to-br from-blue-600 to-cyan-600",
      color === 'green' && "bg-gradient-to-br from-emerald-600 to-green-600",
      color === 'amber' && "bg-gradient-to-br from-amber-600 to-orange-600"
    )} />

    <CardContent className="relative p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-3 rounded-2xl",
          color === 'purple' && "bg-gradient-to-br from-purple-500 to-pink-500",
          color === 'blue' && "bg-gradient-to-br from-blue-500 to-cyan-500",
          color === 'green' && "bg-gradient-to-br from-emerald-500 to-green-500",
          color === 'amber' && "bg-gradient-to-br from-amber-500 to-orange-500"
        )}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        {change !== undefined && change !== null && (
          <div className="flex items-center gap-1">
            {change > 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : change < 0 ? (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            ) : null}
            {change !== 0 && (
              <span className={cn(
                "text-sm font-semibold",
                change > 0 ? "text-green-600" : "text-red-600"
              )}>
                {Math.abs(change)}%
              </span>
            )}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        {loading ? (
          <div className="flex items-center gap-2 mt-1">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="text-gray-400">{loadingText}</span>
          </div>
        ) : (
          <p className="text-3xl font-bold mt-1 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 text-transparent bg-clip-text">
            {value}
          </p>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
      </div>
    </CardContent>
  </Card>
);

// Performance indicator component
const PerformanceIndicator = ({ label, value, target, color }: any) => {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const percentage = target > 0 ? (value / target) * 100 : 0;
  const isExceeding = percentage > 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{value.toLocaleString()}</span>
          <span className="text-xs text-gray-500">/ {target.toLocaleString()}</span>
          {isExceeding && <Crown className="h-4 w-4 text-amber-500" />}
        </div>
      </div>
      <div className="relative">
        <Progress
          value={Math.min(percentage, 100)}
          className="h-2"
        />
        {isExceeding && (
          <div className="absolute inset-0 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 animate-pulse"
              style={{ width: `${percentage - 100}%`, marginLeft: 'auto' }}
            />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{percentage.toFixed(1)}% {nl ? 'behaald' : fr ? 'atteint' : 'achieved'}</span>
        {isExceeding && (
          <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
            {nl ? 'Doel Overschreden' : fr ? 'Objectif Dépassé' : 'Exceeding Target'}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default function LuxuryDashboard() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [dateRange, setDateRange] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [dashRes, campaignsRes, overviewRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/campaigns/'),
        api.get('/analytics/overview').catch(() => ({ data: null })),
      ]);
      setStats(dashRes.data);
      setCampaigns(Array.isArray(campaignsRes.data) ? campaignsRes.data : []);
      setOverview(overviewRes.data);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate derived metrics from real data
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget_amount || 0), 0);
  const activeCampaigns = stats?.campaigns.active ?? 0;
  const totalCampaigns = stats?.campaigns.total ?? 0;
  const draftCampaigns = stats?.campaigns.draft ?? 0;
  const totalContacts = stats?.contacts.total ?? 0;

  // Campaign type distribution
  const typeDistribution = campaigns.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Recent campaigns (last 5)
  const recentCampaigns = campaigns.slice(0, 5);

  return (
    <div className="w-full">
      {/* Executive Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="w-full">
          <div className="py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 text-transparent bg-clip-text">
                  {nl ? 'Executive Dashboard' : fr ? 'Tableau de Bord Exécutif' : 'Executive Dashboard'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {loading ? (nl ? 'Data laden...' : fr ? 'Chargement des données...' : 'Loading your data...') : (
                    <>
                      {activeCampaigns > 0
                        ? <><span className="text-green-600 font-semibold">{activeCampaigns} {nl ? 'actieve campagnes' : fr ? 'campagnes actives' : 'active campaigns'}</span> {nl ? 'actief' : fr ? 'en cours' : 'running'}</>
                        : (nl ? 'Nog geen actieve campagnes — maak er een om te beginnen' : fr ? 'Pas encore de campagnes actives — créez-en une pour commencer' : 'No active campaigns yet — create one to get started')
                      }
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="h-10" onClick={fetchDashboardData} disabled={loading}>
                  <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
                </Button>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-36 h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">{nl ? 'Vandaag' : fr ? "Aujourd'hui" : 'Today'}</SelectItem>
                    <SelectItem value="week">{nl ? 'Deze Week' : fr ? 'Cette Semaine' : 'This Week'}</SelectItem>
                    <SelectItem value="month">{nl ? 'Deze Maand' : fr ? 'Ce Mois' : 'This Month'}</SelectItem>
                    <SelectItem value="quarter">{nl ? 'Dit Kwartaal' : fr ? 'Ce Trimestre' : 'This Quarter'}</SelectItem>
                    <SelectItem value="year">{nl ? 'Dit Jaar' : fr ? 'Cette Année' : 'This Year'}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  {nl ? 'Filter' : fr ? 'Filtrer' : 'Filter'}
                </Button>
                <Button
                  className="h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  onClick={async () => {
                    try {
                      const res = await api.get('/export/analytics/pdf', { responseType: 'blob' });
                      const url = window.URL.createObjectURL(new Blob([res.data]));
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Analytics_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error('Export failed:', err);
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {nl ? 'Rapport Exporteren' : fr ? 'Exporter le Rapport' : 'Export Report'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="w-full pt-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {nl ? 'Zorg dat de backend draait op localhost:8000 en je bent ingelogd.' : fr ? 'Assurez-vous que le backend tourne sur localhost:8000 et que vous êtes connecté.' : 'Make sure the backend is running at localhost:8000 and you are logged in.'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchDashboardData}>
              {nl ? 'Opnieuw' : fr ? 'Réessayer' : 'Retry'}
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <div className="w-full">
            <TabsList className="bg-transparent border-0 p-0 h-auto">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-4"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {nl ? 'Overzicht' : fr ? 'Aperçu' : 'Overview'}
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-4"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {nl ? 'Prestaties' : fr ? 'Performance' : 'Performance'}
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-4"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {nl ? 'Analyses' : fr ? 'Analytique' : 'Analytics'}
              </TabsTrigger>
              <TabsTrigger
                value="intelligence"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:bg-transparent px-6 py-4"
              >
                <Gem className="h-4 w-4 mr-2" />
                {nl ? 'Intelligentie' : fr ? 'Intelligence' : 'Intelligence'}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="w-full py-8">
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Key Metrics - Connected to real data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <LuxuryMetricCard
                title={nl ? 'Totaal Budget' : fr ? 'Budget Total' : 'Total Budget'}
                value={totalBudget > 0 ? `$${(totalBudget / 1000).toFixed(1)}K` : '$0'}
                change={null}
                icon={DollarSign}
                color="purple"
                subtitle={nl ? `Over ${totalCampaigns} campagne${totalCampaigns !== 1 ? 's' : ''}` : fr ? `Sur ${totalCampaigns} campagne${totalCampaigns !== 1 ? 's' : ''}` : `Across ${totalCampaigns} campaign${totalCampaigns !== 1 ? 's' : ''}`}
                loading={loading}
                loadingText={nl ? 'Laden...' : fr ? 'Chargement...' : 'Loading...'}
              />
              <LuxuryMetricCard
                title={nl ? 'Actieve Campagnes' : fr ? 'Campagnes Actives' : 'Active Campaigns'}
                value={String(activeCampaigns)}
                change={null}
                icon={Activity}
                color="blue"
                subtitle={nl ? `${draftCampaigns} in concept` : fr ? `${draftCampaigns} en brouillon` : `${draftCampaigns} in draft`}
                loading={loading}
                loadingText={nl ? 'Laden...' : fr ? 'Chargement...' : 'Loading...'}
              />
              <LuxuryMetricCard
                title={nl ? 'Totaal Contacten' : fr ? 'Total Contacts' : 'Total Contacts'}
                value={totalContacts.toLocaleString()}
                change={null}
                icon={Users}
                color="green"
                subtitle={nl ? 'In je database' : fr ? 'Dans votre base de données' : 'In your database'}
                loading={loading}
                loadingText={nl ? 'Laden...' : fr ? 'Chargement...' : 'Loading...'}
              />
              <LuxuryMetricCard
                title={nl ? 'Totaal Campagnes' : fr ? 'Total Campagnes' : 'Total Campaigns'}
                value={String(totalCampaigns)}
                change={null}
                icon={Target}
                color="amber"
                subtitle={nl ? `${activeCampaigns} actief, ${draftCampaigns} concept` : fr ? `${activeCampaigns} actives, ${draftCampaigns} brouillon` : `${activeCampaigns} active, ${draftCampaigns} draft`}
                loading={loading}
                loadingText={nl ? 'Laden...' : fr ? 'Chargement...' : 'Loading...'}
              />
            </div>

            {/* Campaign Goals / Progress */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{nl ? 'Campagnevoortgang' : fr ? 'Progrès des Campagnes' : 'Campaign Progress'}</CardTitle>
                    <CardDescription>{nl ? 'Overzicht van je marketingcampagnes' : fr ? 'Aperçu de vos campagnes marketing' : 'Overview of your marketing campaigns'}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : campaigns.length > 0 ? (
                  <>
                    <PerformanceIndicator
                      label={nl ? 'Actieve Campagnes' : fr ? 'Campagnes Actives' : 'Active Campaigns'}
                      value={activeCampaigns}
                      target={totalCampaigns || 1}
                      color="purple"
                    />
                    <PerformanceIndicator
                      label={nl ? 'Contacten Bereikt' : fr ? 'Contacts Atteints' : 'Contacts Reached'}
                      value={totalContacts}
                      target={Math.max(totalContacts, 1000)}
                      color="blue"
                    />
                    <PerformanceIndicator
                      label={nl ? 'Totaal Budget Toegewezen' : fr ? 'Budget Total Alloué' : 'Total Budget Allocated'}
                      value={totalBudget}
                      target={Math.max(totalBudget * 1.2, 10000)}
                      color="green"
                    />
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{nl ? 'Nog geen campagnes. Maak je eerste campagne om voortgang te zien.' : fr ? 'Pas encore de campagnes. Créez votre première campagne pour voir les progrès.' : 'No campaigns yet. Create your first campaign to see progress.'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Campaigns */}
            {recentCampaigns.length > 0 && (
              <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>{nl ? 'Recente Campagnes' : fr ? 'Campagnes Récentes' : 'Recent Campaigns'}</CardTitle>
                  <CardDescription>{nl ? 'Je laatste campagne-activiteit' : fr ? 'Votre dernière activité de campagne' : 'Your latest campaign activity'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentCampaigns.map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            campaign.status === 'active' && "bg-green-500",
                            campaign.status === 'draft' && "bg-gray-400",
                            campaign.status === 'paused' && "bg-amber-500"
                          )} />
                          <div>
                            <p className="font-medium text-sm">{campaign.name}</p>
                            <p className="text-xs text-gray-500">{campaign.type} &middot; {new Date(campaign.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            campaign.status === 'active' ? 'default' :
                            campaign.status === 'paused' ? 'secondary' :
                            'outline'
                          }>
                            {campaign.status}
                          </Badge>
                          {campaign.budget_amount && (
                            <span className="text-sm text-gray-500">
                              ${campaign.budget_amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Insights */}
            <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>{nl ? 'AI-Gestuurde Inzichten' : fr ? 'Insights Alimentés par IA' : 'AI-Powered Insights'}</CardTitle>
                    <CardDescription>{nl ? 'Intelligentie uit je marketingdata' : fr ? 'Intelligence issue de vos données marketing' : 'Intelligence from your marketing data'}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{nl ? 'Campagnestatus' : fr ? 'Statut des Campagnes' : 'Campaign Status'}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {activeCampaigns > 0
                            ? (nl ? `${activeCampaigns} campagne${activeCampaigns > 1 ? 's zijn' : ' is'} actief. ${draftCampaigns > 0 ? `${draftCampaigns} in concept.` : ''}` : fr ? `${activeCampaigns} campagne${activeCampaigns > 1 ? 's sont' : ' est'} active${activeCampaigns > 1 ? 's' : ''}. ${draftCampaigns > 0 ? `${draftCampaigns} en brouillon.` : ''}` : `${activeCampaigns} campaign${activeCampaigns > 1 ? 's are' : ' is'} active. ${draftCampaigns > 0 ? `${draftCampaigns} in draft waiting to launch.` : ''}`)
                            : (nl ? 'Geen actieve campagnes. Start een campagne om je publiek te bereiken.' : fr ? 'Pas de campagnes actives. Lancez une campagne pour engager votre audience.' : 'No active campaigns. Launch a campaign to start engaging your audience.')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{nl ? 'Contactgroei' : fr ? 'Croissance des Contacts' : 'Contact Growth'}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {totalContacts > 0
                            ? (nl ? `${totalContacts.toLocaleString()} contacten in je database. Importeer meer om je bereik te vergroten.` : fr ? `${totalContacts.toLocaleString()} contacts dans votre base de données. Importez-en plus pour élargir votre portée.` : `${totalContacts.toLocaleString()} contacts in your database. Import more to expand your reach.`)
                            : (nl ? 'Nog geen contacten. Importeer een CSV of voeg contacten handmatig toe.' : fr ? 'Pas encore de contacts. Importez un CSV ou ajoutez des contacts manuellement.' : 'No contacts yet. Import a CSV or add contacts manually to get started.')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                        <Award className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{nl ? 'Budgetbenutting' : fr ? 'Utilisation du Budget' : 'Budget Utilization'}</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {totalBudget > 0
                            ? (nl ? `$${(totalBudget / 1000).toFixed(1)}K totaal budget toegewezen aan campagnes.` : fr ? `$${(totalBudget / 1000).toFixed(1)}K de budget total alloué aux campagnes.` : `$${(totalBudget / 1000).toFixed(1)}K total budget allocated across campaigns.`)
                            : (nl ? 'Stel campagnebudgetten in om je marketinguitgaven bij te houden.' : fr ? 'Définissez des budgets de campagne pour suivre vos dépenses marketing.' : 'Set campaign budgets to track your marketing spend.')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6 mt-0">
            {/* Email Performance */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle>{nl ? 'E-mail Prestaties' : fr ? 'Performance des E-mails' : 'Email Performance'}</CardTitle>
                <CardDescription>{nl ? 'Aflevering, opens en clicks van je e-mailcampagnes' : fr ? 'Livraison, ouvertures et clics de vos campagnes e-mail' : 'Delivery, opens, and clicks from your email campaigns'}</CardDescription>
              </CardHeader>
              <CardContent>
                {overview?.emails?.sent > 0 ? (
                  <div className="space-y-6">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={[
                        { name: nl ? 'Verzonden' : fr ? 'Envoyés' : 'Sent', value: overview.emails.sent },
                        { name: nl ? 'Geopend' : fr ? 'Ouverts' : 'Opened', value: overview.emails.opened },
                        { name: nl ? 'Geklikt' : fr ? 'Cliqués' : 'Clicked', value: overview.emails.clicked },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          <Cell fill="#8b5cf6" />
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                        <p className="text-2xl font-bold text-purple-600">{overview.emails.sent}</p>
                        <p className="text-xs text-gray-500 mt-1">{nl ? 'E-mails Verzonden' : fr ? 'E-mails Envoyés' : 'Emails Sent'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <p className="text-2xl font-bold text-blue-600">{overview.emails.open_rate}%</p>
                        <p className="text-xs text-gray-500 mt-1">{nl ? 'Open Rate' : fr ? "Taux d'Ouverture" : 'Open Rate'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                        <p className="text-2xl font-bold text-green-600">{overview.emails.click_rate}%</p>
                        <p className="text-xs text-gray-500 mt-1">{nl ? 'Klikpercentage' : fr ? 'Taux de Clic' : 'Click Rate'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{nl ? 'Verstuur e-mails om prestatiestatistieken te zien.' : fr ? 'Envoyez des e-mails pour voir les métriques de performance.' : 'Send emails to see performance metrics.'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Campaigns List */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle>{nl ? 'Actieve Campagnes' : fr ? 'Campagnes Actives' : 'Active Campaigns'}</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.filter(c => c.status === 'active').length > 0 ? (
                  <div className="space-y-3">
                    {campaigns.filter(c => c.status === 'active').map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <div>
                            <p className="font-medium text-sm">{campaign.name}</p>
                            <p className="text-xs text-gray-500">{campaign.type}</p>
                          </div>
                        </div>
                        {campaign.budget_amount && (
                          <span className="text-sm font-medium">${campaign.budget_amount.toLocaleString()}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">{nl ? 'Geen actieve campagnes.' : fr ? 'Pas de campagnes actives.' : 'No active campaigns.'}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6 mt-0">
            {/* Growth Timeline */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle>{nl ? 'Groeioverzicht' : fr ? 'Chronologie de Croissance' : 'Growth Timeline'}</CardTitle>
                <CardDescription>{nl ? 'Campagnes, contacten en content over de laatste 6 maanden' : fr ? 'Campagnes, contacts et contenu des 6 derniers mois' : 'Campaigns, contacts, and content over the last 6 months'}</CardDescription>
              </CardHeader>
              <CardContent>
                {overview?.campaigns?.timeline?.some((d: any) => d.count > 0) ||
                 overview?.contacts?.timeline?.some((d: any) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={(overview?.campaigns?.timeline || []).map((item: any, i: number) => ({
                      month: item.month,
                      campaigns: item.count,
                      contacts: overview?.contacts?.timeline?.[i]?.count || 0,
                      content: overview?.content?.timeline?.[i]?.count || 0,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="campaigns" fill="#8b5cf6" name={nl ? 'Campagnes' : fr ? 'Campagnes' : 'Campaigns'} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="contacts" fill="#3b82f6" name={nl ? 'Contacten' : fr ? 'Contacts' : 'Contacts'} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="content" fill="#10b981" name={nl ? 'Content' : fr ? 'Contenu' : 'Content'} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">{nl ? 'Data verschijnt hier zodra je campagnes en content aanmaakt.' : fr ? 'Les données apparaîtront ici lorsque vous créerez des campagnes et du contenu.' : 'Data will appear here as you create campaigns and content.'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Campaign Type Pie */}
              <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>{nl ? 'Campagnetypes' : fr ? 'Types de Campagnes' : 'Campaign Types'}</CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.keys(typeDistribution).length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={Object.entries(typeDistribution).map(([name, value]) => ({ name, value }))}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name} (${value})`}
                        >
                          {Object.keys(typeDistribution).map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-gray-500">
                      <p>{nl ? 'Nog geen campagnes.' : fr ? 'Pas encore de campagnes.' : 'No campaigns yet.'}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Content Breakdown */}
              <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle>{nl ? 'Contentbibliotheek' : fr ? 'Bibliothèque de Contenu' : 'Content Library'}</CardTitle>
                  <CardDescription>{overview?.content?.total || 0} items</CardDescription>
                </CardHeader>
                <CardContent>
                  {overview?.content?.total > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(overview.content.by_type || {}).map(([type, count], i) => (
                        <div key={type} className="p-3 rounded-lg border text-center">
                          <p className="text-xl font-bold" style={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>
                            {count as number}
                          </p>
                          <p className="text-xs text-gray-500 capitalize mt-1">{type.replace('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-gray-500">
                      <p>{nl ? 'Nog geen content opgeslagen.' : fr ? 'Aucun contenu enregistré.' : 'No content saved yet.'}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-6 mt-0">
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle>{nl ? 'Bedrijfsintelligentie' : fr ? 'Intelligence d\'Affaires' : 'Business Intelligence'}</CardTitle>
                <CardDescription>{nl ? 'AI-gestuurde inzichten en aanbevelingen' : fr ? 'Insights et recommandations alimentés par IA' : 'AI-powered insights and recommendations'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-semibold mb-1">{nl ? 'Samenvatting' : fr ? 'Résumé' : 'Summary'}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {nl
                        ? `Je hebt ${totalCampaigns} campagne${totalCampaigns !== 1 ? 's' : ''} (${activeCampaigns} actief), ${totalContacts.toLocaleString()} contact${totalContacts !== 1 ? 'en' : ''} en $${totalBudget.toLocaleString()} totaal budget.`
                        : fr
                        ? `Vous avez ${totalCampaigns} campagne${totalCampaigns !== 1 ? 's' : ''} (${activeCampaigns} active${activeCampaigns !== 1 ? 's' : ''}), ${totalContacts.toLocaleString()} contact${totalContacts !== 1 ? 's' : ''} et $${totalBudget.toLocaleString()} de budget total.`
                        : <>You have {totalCampaigns} campaign{totalCampaigns !== 1 ? 's' : ''} ({activeCampaigns} active),{' '}{totalContacts.toLocaleString()} contact{totalContacts !== 1 ? 's' : ''}, and{' '}${totalBudget.toLocaleString()} in total budget.</>
                      }
                    </p>
                  </div>
                  {totalCampaigns === 0 && (
                    <div className="p-4 border-2 border-dashed rounded-lg text-center">
                      <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        {nl ? 'Begin met het aanmaken van campagnes en het importeren van contacten om AI-gestuurde aanbevelingen te ontgrendelen.' : fr ? 'Commencez à créer des campagnes et à importer des contacts pour débloquer les recommandations IA.' : 'Start creating campaigns and importing contacts to unlock AI-powered recommendations.'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
