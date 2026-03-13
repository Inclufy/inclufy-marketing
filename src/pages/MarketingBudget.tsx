// src/pages/MarketingBudget.tsx
// Marketing Budget page with Inclufy Finance integration

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Target,
  DollarSign,
  Zap,
  Brain,
  RefreshCw,
  Plus,
  Settings,
  Link2,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Loader2,
  Euro,
} from 'lucide-react';
// Budget data comes from local state (Inclufy Finance integration placeholder)

const CHART_COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

// Mock budget data (will be replaced with API calls when Inclufy Finance is connected)
interface BudgetAllocation {
  id: string;
  channel: string;
  allocated: number;
  spent: number;
  remaining: number;
  roi: number;
  status: 'on_track' | 'over_budget' | 'under_budget';
}

interface MonthlyBudget {
  month: string;
  planned: number;
  actual: number;
  forecast: number;
}

interface FinanceIntegration {
  connected: boolean;
  lastSync: string | null;
  source: string;
}

function getMockBudgetData(formatCurrency: (v: number) => string): {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  averageROI: number;
  allocations: BudgetAllocation[];
  monthlyTrend: MonthlyBudget[];
} {
  return {
    totalBudget: 125000,
    totalSpent: 78450,
    totalRemaining: 46550,
    averageROI: 342,
    allocations: [
      { id: '1', channel: 'Social Media', allocated: 35000, spent: 22500, remaining: 12500, roi: 420, status: 'on_track' },
      { id: '2', channel: 'Email Marketing', allocated: 15000, spent: 8200, remaining: 6800, roi: 580, status: 'under_budget' },
      { id: '3', channel: 'Google Ads', allocated: 30000, spent: 28500, remaining: 1500, roi: 310, status: 'over_budget' },
      { id: '4', channel: 'Content Creation', allocated: 20000, spent: 12000, remaining: 8000, roi: 250, status: 'on_track' },
      { id: '5', channel: 'SEO', allocated: 10000, spent: 4250, remaining: 5750, roi: 480, status: 'under_budget' },
      { id: '6', channel: 'Events & Webinars', allocated: 15000, spent: 3000, remaining: 12000, roi: 180, status: 'under_budget' },
    ],
    monthlyTrend: [
      { month: 'Jan', planned: 10000, actual: 9500, forecast: 0 },
      { month: 'Feb', planned: 10000, actual: 11200, forecast: 0 },
      { month: 'Mar', planned: 12000, actual: 10800, forecast: 0 },
      { month: 'Apr', planned: 12000, actual: 12500, forecast: 0 },
      { month: 'May', planned: 11000, actual: 13200, forecast: 0 },
      { month: 'Jun', planned: 11000, actual: 11250, forecast: 0 },
      { month: 'Jul', planned: 10000, actual: 10000, forecast: 0 },
      { month: 'Aug', planned: 10000, actual: 0, forecast: 9800 },
      { month: 'Sep', planned: 11000, actual: 0, forecast: 10500 },
      { month: 'Oct', planned: 12000, actual: 0, forecast: 11800 },
      { month: 'Nov', planned: 13000, actual: 0, forecast: 12500 },
      { month: 'Dec', planned: 13000, actual: 0, forecast: 13000 },
    ],
  };
}

export default function MarketingBudget() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const { formatCurrency, formatCompact, symbol, currency, setCurrency, availableCurrencies } = useCurrency();
  const [activeTab, setActiveTab] = useState('overview');
  const [financeIntegration, setFinanceIntegration] = useState<FinanceIntegration>({
    connected: false,
    lastSync: null,
    source: 'inclufy-finance',
  });
  const [loading, setLoading] = useState(false);

  const budgetData = getMockBudgetData(formatCurrency);

  const spentPercentage = (budgetData.totalSpent / budgetData.totalBudget) * 100;

  const handleConnectFinance = () => {
    setLoading(true);
    // Simulate connection to Inclufy Finance
    setTimeout(() => {
      setFinanceIntegration({
        connected: true,
        lastSync: new Date().toISOString(),
        source: 'inclufy-finance',
      });
      setLoading(false);
    }, 2000);
  };

  const handleSync = () => {
    setLoading(true);
    setTimeout(() => {
      setFinanceIntegration(prev => ({
        ...prev,
        lastSync: new Date().toISOString(),
      }));
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 text-transparent bg-clip-text">
                    {nl ? 'Marketing Budget' : fr ? 'Budget Marketing' : 'Marketing Budget'}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {nl ? 'Beheer en optimaliseer je marketinguitgaven' : fr ? 'Gérez et optimisez vos dépenses marketing' : 'Manage and optimize your marketing spend'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Currency Selector */}
              <Select value={currency} onValueChange={(val) => setCurrency(val as any)}>
                <SelectTrigger className="w-24 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Finance Integration Button */}
              {financeIntegration.connected ? (
                <Button variant="outline" className="h-10" onClick={handleSync} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {nl ? 'Sync Finance' : fr ? 'Sync Finance' : 'Sync Finance'}
                </Button>
              ) : (
                <Button
                  className="h-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  onClick={handleConnectFinance}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4 mr-2" />
                  )}
                  {nl ? 'Koppel Inclufy Finance' : fr ? 'Connecter Inclufy Finance' : 'Connect Inclufy Finance'}
                </Button>
              )}
            </div>
          </div>

          {/* Finance Integration Status */}
          {financeIntegration.connected && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                {nl ? 'Verbonden met Inclufy Finance' : fr ? 'Connecté à Inclufy Finance' : 'Connected to Inclufy Finance'}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-500">
                &middot; {nl ? 'Laatste sync' : fr ? 'Dernière sync' : 'Last sync'}: {financeIntegration.lastSync ? new Date(financeIntegration.lastSync).toLocaleString() : '-'}
              </span>
              <ExternalLink className="h-3.5 w-3.5 text-emerald-500 ml-auto cursor-pointer hover:text-emerald-700" />
            </div>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
          <TabsList className="bg-transparent border-0 p-0 h-auto">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent px-6 py-4">
              <PieChartIcon className="h-4 w-4 mr-2" />
              {nl ? 'Overzicht' : fr ? 'Aperçu' : 'Overview'}
            </TabsTrigger>
            <TabsTrigger value="channels" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent px-6 py-4">
              <BarChart3 className="h-4 w-4 mr-2" />
              {nl ? 'Kanalen' : fr ? 'Canaux' : 'Channels'}
            </TabsTrigger>
            <TabsTrigger value="forecast" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent px-6 py-4">
              <TrendingUp className="h-4 w-4 mr-2" />
              {nl ? 'Forecast' : fr ? 'Prévisions' : 'Forecast'}
            </TabsTrigger>
            <TabsTrigger value="optimization" className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-600 data-[state=active]:bg-transparent px-6 py-4">
              <Brain className="h-4 w-4 mr-2" />
              {nl ? 'AI Optimalisatie' : fr ? 'Optimisation IA' : 'AI Optimization'}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="w-full py-8 space-y-6">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Budget Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
                      <Wallet className="h-5 w-5 text-white" />
                    </div>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                      {nl ? 'Jaarlijks' : fr ? 'Annuel' : 'Annual'}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{nl ? 'Totaal Budget' : fr ? 'Budget Total' : 'Total Budget'}</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(budgetData.totalBudget)}</p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-600">{spentPercentage.toFixed(2)}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{nl ? 'Besteed' : fr ? 'Dépensé' : 'Spent'}</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(budgetData.totalSpent)}</p>
                  <Progress value={spentPercentage} className="h-1.5 mt-2" />
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{nl ? 'Resterend' : fr ? 'Restant' : 'Remaining'}</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(budgetData.totalRemaining)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{nl ? 'beschikbaar voor allocatie' : fr ? 'disponible pour allocation' : 'available for allocation'}</p>
                </CardContent>
              </Card>

              <Card className="border-gray-200 dark:border-gray-800">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs font-semibold text-green-600">+18.50%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{nl ? 'Gemiddelde ROI' : fr ? 'ROI Moyen' : 'Average ROI'}</p>
                  <p className="text-2xl font-bold mt-1">{budgetData.averageROI.toFixed(2)}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Budget Distribution + Monthly Trend */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="text-base">{nl ? 'Budget Verdeling' : fr ? 'Répartition du Budget' : 'Budget Distribution'}</CardTitle>
                  <CardDescription className="text-xs">{nl ? 'Per marketingkanaal' : fr ? 'Par canal marketing' : 'By marketing channel'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={budgetData.allocations.map(a => ({ name: a.channel, value: a.allocated }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {budgetData.allocations.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Monthly Trend */}
              <Card className="border-gray-200 dark:border-gray-800">
                <CardHeader>
                  <CardTitle className="text-base">{nl ? 'Maandelijkse Trend' : fr ? 'Tendance Mensuelle' : 'Monthly Trend'}</CardTitle>
                  <CardDescription className="text-xs">{nl ? 'Gepland vs. werkelijk vs. forecast' : fr ? 'Planifié vs. réel vs. prévisions' : 'Planned vs. actual vs. forecast'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={budgetData.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${symbol}${(value / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Area type="monotone" dataKey="planned" stroke="#8b5cf6" fill="#8b5cf680" name={nl ? 'Gepland' : fr ? 'Planifié' : 'Planned'} />
                      <Area type="monotone" dataKey="actual" stroke="#10b981" fill="#10b98180" name={nl ? 'Werkelijk' : fr ? 'Réel' : 'Actual'} />
                      <Area type="monotone" dataKey="forecast" stroke="#f59e0b" fill="#f59e0b40" strokeDasharray="5 5" name={nl ? 'Forecast' : fr ? 'Prévisions' : 'Forecast'} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Channel Budget Table */}
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{nl ? 'Budget per Kanaal' : fr ? 'Budget par Canal' : 'Budget by Channel'}</CardTitle>
                    <CardDescription className="text-xs">{nl ? 'Gedetailleerd overzicht van je marketing allocaties' : fr ? 'Aperçu détaillé de vos allocations marketing' : 'Detailed overview of your marketing allocations'}</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    {nl ? 'Kanaal toevoegen' : fr ? 'Ajouter canal' : 'Add Channel'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {budgetData.allocations.map((allocation, i) => {
                    const spentPct = (allocation.spent / allocation.allocated) * 100;
                    return (
                      <div key={allocation.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                            />
                            <span className="font-medium text-sm">{allocation.channel}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                allocation.status === 'on_track' ? 'border-green-200 text-green-600 bg-green-50' :
                                allocation.status === 'over_budget' ? 'border-red-200 text-red-600 bg-red-50' :
                                'border-blue-200 text-blue-600 bg-blue-50'
                              }`}
                            >
                              {allocation.status === 'on_track'
                                ? (nl ? 'Op schema' : fr ? 'En bonne voie' : 'On Track')
                                : allocation.status === 'over_budget'
                                  ? (nl ? 'Over budget' : fr ? 'Dépassement' : 'Over Budget')
                                  : (nl ? 'Onder budget' : fr ? 'Sous budget' : 'Under Budget')}
                            </Badge>
                            <span className="text-xs text-green-600 font-semibold">ROI {allocation.roi.toFixed(2)}%</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-3">
                          <div>
                            <p className="text-[10px] text-gray-500">{nl ? 'Toegewezen' : fr ? 'Alloué' : 'Allocated'}</p>
                            <p className="text-sm font-semibold">{formatCurrency(allocation.allocated)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500">{nl ? 'Besteed' : fr ? 'Dépensé' : 'Spent'}</p>
                            <p className="text-sm font-semibold">{formatCurrency(allocation.spent)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500">{nl ? 'Resterend' : fr ? 'Restant' : 'Remaining'}</p>
                            <p className="text-sm font-semibold">{formatCurrency(allocation.remaining)}</p>
                          </div>
                        </div>
                        <Progress value={Math.min(spentPct, 100)} className="h-1.5 mt-3" />
                        <p className="text-[10px] text-gray-400 mt-1">{spentPct.toFixed(2)}% {nl ? 'besteed' : fr ? 'dépensé' : 'spent'}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-6 mt-0">
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-base">{nl ? 'Kanaal Performance' : fr ? 'Performance des Canaux' : 'Channel Performance'}</CardTitle>
                <CardDescription className="text-xs">{nl ? 'ROI en bestedingen per kanaal' : fr ? 'ROI et dépenses par canal' : 'ROI and spending per channel'}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={budgetData.allocations.map(a => ({
                    name: a.channel,
                    allocated: a.allocated,
                    spent: a.spent,
                    roi: a.roi,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" tickFormatter={(v) => `${symbol}${(v / 1000).toFixed(0)}K`} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(value: number, name: string) =>
                      name === 'roi' ? `${value.toFixed(2)}%` : formatCurrency(value)
                    } />
                    <Legend />
                    <Bar yAxisId="left" dataKey="allocated" fill="#8b5cf680" name={nl ? 'Toegewezen' : fr ? 'Alloué' : 'Allocated'} radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="spent" fill="#10b981" name={nl ? 'Besteed' : fr ? 'Dépensé' : 'Spent'} radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="right" dataKey="roi" fill="#f59e0b80" name="ROI %" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="space-y-6 mt-0">
            <Card className="border-gray-200 dark:border-gray-800">
              <CardHeader>
                <CardTitle className="text-base">{nl ? 'Budget Forecast' : fr ? 'Prévisions Budgétaires' : 'Budget Forecast'}</CardTitle>
                <CardDescription className="text-xs">{nl ? 'AI-voorspelling van je marketinguitgaven' : fr ? 'Prévision IA de vos dépenses marketing' : 'AI prediction of your marketing spend'}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={budgetData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${symbol}${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Area type="monotone" dataKey="planned" stroke="#8b5cf6" fill="#8b5cf640" name={nl ? 'Gepland' : fr ? 'Planifié' : 'Planned'} />
                    <Area type="monotone" dataKey="actual" stroke="#10b981" fill="#10b98140" name={nl ? 'Werkelijk' : fr ? 'Réel' : 'Actual'} />
                    <Area type="monotone" dataKey="forecast" stroke="#f59e0b" fill="#f59e0b20" strokeDasharray="5 5" name={nl ? 'AI Forecast' : fr ? 'Prévisions IA' : 'AI Forecast'} />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Forecast Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <p className="text-xs text-gray-500">{nl ? 'Voorspeld Q3-Q4' : fr ? 'Prévu Q3-Q4' : 'Predicted Q3-Q4'}</p>
                    <p className="text-xl font-bold text-purple-600">{formatCurrency(57600)}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{nl ? 'op basis van huidige trends' : fr ? 'basé sur les tendances actuelles' : 'based on current trends'}</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <p className="text-xs text-gray-500">{nl ? 'Verwachte besparingen' : fr ? 'Économies prévues' : 'Expected Savings'}</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(8400)}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{nl ? 'door AI-optimalisatie' : fr ? 'grâce à l\'optimisation IA' : 'through AI optimization'}</p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                    <p className="text-xs text-gray-500">{nl ? 'Risico Waarschuwing' : fr ? 'Alerte Risque' : 'Risk Alert'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <p className="text-sm font-medium text-amber-700">{nl ? 'Google Ads dreigt budget te overschrijden' : fr ? 'Google Ads risque de dépasser le budget' : 'Google Ads at risk of overspending'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Optimization Tab */}
          <TabsContent value="optimization" className="space-y-6 mt-0">
            <Card className="border-gray-200 dark:border-gray-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>{nl ? 'AI Budget Optimalisatie' : fr ? 'Optimisation Budgétaire IA' : 'AI Budget Optimization'}</CardTitle>
                    <CardDescription>{nl ? 'Intelligente suggesties om je ROI te maximaliseren' : fr ? 'Suggestions intelligentes pour maximiser votre ROI' : 'Smart suggestions to maximize your ROI'}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* AI Recommendations */}
                {[
                  {
                    title: nl ? 'Verhoog Email Marketing Budget' : fr ? 'Augmenter le budget Email Marketing' : 'Increase Email Marketing Budget',
                    desc: nl ? 'Email Marketing heeft de hoogste ROI (580%). Verhoog budget met 20% voor maximaal rendement.' : fr ? 'L\'Email Marketing a le ROI le plus élevé (580%). Augmentez le budget de 20% pour un rendement maximal.' : 'Email Marketing has the highest ROI (580%). Increase budget by 20% for maximum return.',
                    impact: 12500,
                    confidence: 94,
                    priority: 'high' as const,
                  },
                  {
                    title: nl ? 'Optimaliseer Google Ads Bestedingen' : fr ? 'Optimiser les dépenses Google Ads' : 'Optimize Google Ads Spending',
                    desc: nl ? 'Google Ads is bijna over budget met lagere ROI. Herbalanceer naar Social Media.' : fr ? 'Google Ads est presque en dépassement avec un ROI inférieur. Rééquilibrez vers les médias sociaux.' : 'Google Ads is nearly over budget with lower ROI. Rebalance to Social Media.',
                    impact: 8200,
                    confidence: 87,
                    priority: 'critical' as const,
                  },
                  {
                    title: nl ? 'Investeer in SEO Content' : fr ? 'Investir dans le contenu SEO' : 'Invest in SEO Content',
                    desc: nl ? 'SEO levert 480% ROI met slechts 42.5% van het budget besteed. Meer investering levert exponentieel rendement.' : fr ? 'Le SEO offre 480% de ROI avec seulement 42,5% du budget dépensé. Un investissement supplémentaire offre un rendement exponentiel.' : 'SEO delivers 480% ROI with only 42.5% budget spent. More investment yields exponential returns.',
                    impact: 15000,
                    confidence: 91,
                    priority: 'medium' as const,
                  },
                ].map((rec, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border-l-4 bg-white dark:bg-gray-900 ${
                      rec.priority === 'critical' ? 'border-l-red-500' :
                      rec.priority === 'high' ? 'border-l-orange-500' :
                      'border-l-yellow-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{rec.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{rec.desc}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-[10px]">{rec.confidence}% {nl ? 'betrouwbaarheid' : fr ? 'confiance' : 'confidence'}</Badge>
                          <span className="text-xs text-green-600 font-semibold">+{formatCurrency(rec.impact)} {nl ? 'potentieel' : fr ? 'potentiel' : 'potential'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          {nl ? 'Toepassen' : fr ? 'Appliquer' : 'Apply'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Inclufy Finance CTA */}
                {!financeIntegration.connected && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3">
                      <Link2 className="h-5 w-5 text-emerald-600" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-emerald-800 dark:text-emerald-300">
                          {nl ? 'Koppel met Inclufy Finance voor diepere inzichten' : fr ? 'Connectez-vous à Inclufy Finance pour des insights plus profonds' : 'Connect to Inclufy Finance for deeper insights'}
                        </h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {nl ? 'Synchroniseer je financiële data voor automatische budget tracking en AI-gestuurde optimalisatie' : fr ? 'Synchronisez vos données financières pour un suivi budgétaire automatique et une optimisation par IA' : 'Sync your financial data for automatic budget tracking and AI-driven optimization'}
                        </p>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                        onClick={handleConnectFinance}
                      >
                        <Link2 className="h-4 w-4 mr-2" />
                        {nl ? 'Verbinden' : fr ? 'Connecter' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
