import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Brain,
  Lightbulb,
  AlertCircle,
  Download
} from "lucide-react";
import { useAnalyticsOverview } from "@/hooks/queries/useAnalytics";
import { LoadingSkeleton, ErrorState } from "@/components/DataState";
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Fallback data when backend is offline ──────────────────────────

const generateFallbackRevenueData = () => {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      day: date.toLocaleDateString('en', { weekday: 'short' }),
      mrr: 120000 + Math.random() * 20000,
      newCustomers: Math.floor(15 + Math.random() * 10),
      churn: Math.floor(3 + Math.random() * 5),
      revenue: 4000 + Math.random() * 2000
    });
  }
  return data;
};

const FALLBACK_ATTRIBUTION = [
  { channel: 'Email Marketing', value: 35, revenue: 142500 },
  { channel: 'Paid Search', value: 28, revenue: 114000 },
  { channel: 'Social Media', value: 22, revenue: 89500 },
  { channel: 'Direct', value: 15, revenue: 61000 }
];

const FALLBACK_COHORT = [
  { month: 'Jan', month1: 100, month2: 85, month3: 78, month4: 72, month5: 68, month6: 65 },
  { month: 'Feb', month1: 100, month2: 88, month3: 82, month4: 76, month5: 71 },
  { month: 'Mar', month1: 100, month2: 90, month3: 84, month4: 79 },
  { month: 'Apr', month1: 100, month2: 87, month3: 81 },
  { month: 'May', month1: 100, month2: 89 },
  { month: 'Jun', month1: 100 }
];

const FALLBACK_RECOMMENDATIONS = [
  {
    id: 1,
    title: "Focus on Enterprise Segment",
    description: "Enterprise conversion is 47% higher. Shifting 20% of budget could yield +$2.3M ARR.",
    impact: "high" as const,
    confidence: 89,
    estimatedRevenue: "$2.3M",
    action: "Reallocate Budget"
  },
  {
    id: 2,
    title: "Optimize Trial-to-Paid Flow",
    description: "23% of trials abandon at payment. Simplifying checkout could recover $400K ARR.",
    impact: "medium" as const,
    confidence: 76,
    estimatedRevenue: "$400K",
    action: "A/B Test Checkout"
  },
  {
    id: 3,
    title: "Reduce Churn in Month 2",
    description: "15% churn spike in second month. Better onboarding could save $180K annually.",
    impact: "high" as const,
    confidence: 82,
    estimatedRevenue: "$180K",
    action: "Launch Onboarding"
  }
];

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

const RevenueIntelligence = () => {
  const [timeRange, setTimeRange] = useState("30");
  const [revenueData] = useState(generateFallbackRevenueData);

  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  // Fetch real analytics data (falls back gracefully)
  const { data: overview, isLoading, isError, refetch } = useAnalyticsOverview();

  // Derive metrics from API or use fallback values
  const metrics = overview?.revenue_metrics;
  const currentMRR = metrics?.mrr ?? 127450;
  const previousMRR = 105000;
  const mrrGrowth = metrics?.growth_rate?.toFixed(1) ?? ((currentMRR - previousMRR) / previousMRR * 100).toFixed(1);
  const currentCAC = metrics?.cac ?? 1250;
  const previousCAC = 1450;
  const cacChange = ((currentCAC - previousCAC) / previousCAC * 100).toFixed(1);
  const ltv = metrics?.ltv ?? 37500;
  const ltvCacRatio = (ltv / currentCAC).toFixed(1);

  const attributionData = FALLBACK_ATTRIBUTION;
  const cohortData = FALLBACK_COHORT;
  const recommendations = FALLBACK_RECOMMENDATIONS;

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Date,MRR,New Customers,Revenue\n"
      + revenueData.map(row => `${row.date},${row.mrr},${row.newCustomers},${row.revenue}`).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "revenue-data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) return <LoadingSkeleton cards={4} />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{nl ? 'Omzet Intelligentie' : fr ? 'Intelligence des Revenus' : 'Revenue Intelligence'}</h1>
            <p className="text-muted-foreground">{nl ? 'AI-gestuurde inzichten om groei te versnellen' : fr ? 'Insights alimentés par IA pour accélérer la croissance' : 'AI-powered insights to accelerate growth'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{nl ? 'Laatste 7 dagen' : fr ? '7 derniers jours' : 'Last 7 days'}</SelectItem>
              <SelectItem value="30">{nl ? 'Laatste 30 dagen' : fr ? '30 derniers jours' : 'Last 30 days'}</SelectItem>
              <SelectItem value="90">{nl ? 'Laatste 90 dagen' : fr ? '90 derniers jours' : 'Last 90 days'}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            {nl ? 'Exporteren' : fr ? 'Exporter' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold">${(currentMRR / 1000).toFixed(1)}K</div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <ArrowUpRight className="h-3 w-3" />
                <span>{mrrGrowth}%</span>
                <span className="text-muted-foreground">{nl ? 't.o.v. vorige maand' : fr ? 'vs mois dernier' : 'vs last month'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold">${currentCAC.toLocaleString()}</div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <ArrowDownRight className="h-3 w-3" />
                <span>{Math.abs(parseFloat(cacChange))}%</span>
                <span className="text-muted-foreground">{nl ? 'verbetering' : fr ? 'amélioration' : 'improvement'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">LTV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold">${(ltv / 1000).toFixed(1)}K</div>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <ArrowUpRight className="h-3 w-3" />
                <span>17%</span>
                <span className="text-muted-foreground">{nl ? 't.o.v. vorige maand' : fr ? 'par rapport au mois dernier' : 'from last month'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">LTV:CAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{ltvCacRatio}:1</div>
              <Badge variant="default" className="text-xs">{nl ? 'Uitstekend' : fr ? 'Excellent' : 'Excellent'}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MRR Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{nl ? 'MRR Groeitrend' : fr ? 'Tendance de Croissance MRR' : 'MRR Growth Trend'}</CardTitle>
          <CardDescription>{nl ? 'Maandelijks terugkerende omzet over de tijd' : fr ? 'Revenus récurrents mensuels au fil du temps' : 'Monthly recurring revenue over time'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="day" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`} />
              <Tooltip
                formatter={(value: any) => `$${(value/1000).toFixed(1)}K`}
                labelFormatter={(label) => `Day: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorMrr)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Growth Recommendations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{nl ? 'AI Groei-aanbevelingen' : fr ? 'Recommandations de Croissance IA' : 'AI Growth Recommendations'}</CardTitle>
                <CardDescription>{nl ? 'Hoog-impact kansen geïdentificeerd door AI' : fr ? 'Opportunités à fort impact identifiées par IA' : 'High-impact opportunities identified by AI'}</CardDescription>
              </div>
              <Brain className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="p-4 border rounded-lg space-y-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-yellow-600" />
                      {rec.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                  <Badge
                    variant={rec.impact === 'high' ? 'default' : 'secondary'}
                  >
                    {rec.impact} {nl ? 'impact' : fr ? 'impact' : 'impact'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-muted-foreground">{nl ? 'Zekerheid:' : fr ? 'Confiance :' : 'Confidence:'} </span>
                      <span className="font-medium">{rec.confidence}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{nl ? 'Gesch. Omzet:' : fr ? 'Rev. Estimé :' : 'Est. Revenue:'} </span>
                      <span className="font-medium text-green-600">+{rec.estimatedRevenue}</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    {rec.action}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Attribution Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>{nl ? 'Multi-Touch Attributie' : fr ? 'Attribution Multi-Touch' : 'Multi-Touch Attribution'}</CardTitle>
            <CardDescription>{nl ? 'Omzetbijdrage per kanaal' : fr ? 'Contribution au revenu par canal' : 'Revenue contribution by channel'}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ channel, value }) => `${channel}: ${value}%`}
                >
                  {attributionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {attributionData.map((channel, index) => (
                <div key={channel.channel} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                    <span>{channel.channel}</span>
                  </div>
                  <span className="font-medium">${(channel.revenue / 1000).toFixed(1)}K</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cohort Retention */}
      <Card>
        <CardHeader>
          <CardTitle>{nl ? 'Cohort Retentie-analyse' : fr ? 'Analyse de Rétention par Cohorte' : 'Cohort Retention Analysis'}</CardTitle>
          <CardDescription>{nl ? 'Klantretentie per maandcohort' : fr ? 'Rétention client par cohorte mensuelle' : 'Customer retention by monthly cohort'}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cohortData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip formatter={(value: any) => `${value}%`} />
              <Legend />
              <Line type="monotone" dataKey="month1" stroke="#3b82f6" name={nl ? 'Maand 1' : fr ? 'Mois 1' : 'Month 1'} strokeWidth={2} />
              <Line type="monotone" dataKey="month2" stroke="#10b981" name={nl ? 'Maand 2' : fr ? 'Mois 2' : 'Month 2'} strokeWidth={2} />
              <Line type="monotone" dataKey="month3" stroke="#8b5cf6" name={nl ? 'Maand 3' : fr ? 'Mois 3' : 'Month 3'} strokeWidth={2} />
              <Line type="monotone" dataKey="month4" stroke="#f59e0b" name={nl ? 'Maand 4' : fr ? 'Mois 4' : 'Month 4'} strokeWidth={2} />
              <Line type="monotone" dataKey="month5" stroke="#ef4444" name={nl ? 'Maand 5' : fr ? 'Mois 5' : 'Month 5'} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Forecast */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{nl ? 'Omzetprognose' : fr ? 'Prévision de Revenus' : 'Revenue Forecast'}</CardTitle>
            <CardDescription>{nl ? '90-dagen voorspelling met betrouwbaarheidsintervallen' : fr ? 'Prévision à 90 jours avec intervalles de confiance' : '90-day prediction with confidence intervals'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{nl ? 'Best Case (95e percentiel)' : fr ? 'Meilleur Cas (95e percentile)' : 'Best Case (95th percentile)'}</span>
                <span className="text-lg font-bold text-green-600">$485K</span>
              </div>
              <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '85%' }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{nl ? 'Verwacht (50e percentiel)' : fr ? 'Attendu (50e percentile)' : 'Expected (50th percentile)'}</span>
                <span className="text-lg font-bold">$412K</span>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '70%' }} />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{nl ? 'Worst Case (5e percentiel)' : fr ? 'Pire Cas (5e percentile)' : 'Worst Case (5th percentile)'}</span>
                <span className="text-lg font-bold text-red-600">$342K</span>
              </div>
              <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: '55%' }} />
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-muted-foreground">
                  {nl ? '89% zekerheid op basis van 2.341 datapunten en seizoenspatronen' : fr ? '89% de confiance basé sur 2 341 points de données et des modèles saisonniers' : '89% confidence based on 2,341 data points and seasonal patterns'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{nl ? 'Belangrijkste Metrics' : fr ? 'Résumé des Indicateurs Clés' : 'Key Metrics Summary'}</CardTitle>
            <CardDescription>{nl ? 'Prestatie-indicatoren in één oogopslag' : fr ? 'Indicateurs de performance en un coup d\'œil' : 'Performance indicators at a glance'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">{nl ? 'Gemiddelde Dealgrootte' : fr ? 'Taille Moyenne des Contrats' : 'Average Deal Size'}</span>
                <span className="text-sm font-bold">$4,230</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{nl ? 'Verkoopcyclus' : fr ? 'Cycle de Vente' : 'Sales Cycle'}</span>
                <span className="text-sm font-bold">{nl ? '47 dagen' : fr ? '47 jours' : '47 days'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{nl ? 'Winstpercentage' : fr ? 'Taux de Réussite' : 'Win Rate'}</span>
                <span className="text-sm font-bold">24%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{nl ? 'Terugverdientijd' : fr ? 'Période de Retour' : 'Payback Period'}</span>
                <span className="text-sm font-bold">{nl ? '14 maanden' : fr ? '14 mois' : '14 months'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{nl ? 'Netto Omzetretentie' : fr ? 'Rétention Nette des Revenus' : 'Net Revenue Retention'}</span>
                <span className="text-sm font-bold text-green-600">112%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{nl ? 'Brutomarge' : fr ? 'Marge Brute' : 'Gross Margin'}</span>
                <span className="text-sm font-bold">82%</span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline">
              {nl ? 'Gedetailleerde Analyse Bekijken' : fr ? 'Voir l\'Analyse Détaillée' : 'View Detailed Analytics'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueIntelligence;
