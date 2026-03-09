// src/pages/intelligence/MarketInsights.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  BarChart3,
  LineChart,
  PieChart,
  Activity,
  Target,
  Users,
  Globe,
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

export default function MarketInsights() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  return (
    <div className="w-full py-2">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            {nl ? 'Marktinzichten' : fr ? 'Apercu du marche' : 'Market Insights'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {nl ? 'Realtime marktinformatie en trendanalyse aangedreven door AI' : fr ? 'Intelligence de marche en temps reel et analyse des tendances par IA' : 'Real-time market intelligence and trend analysis powered by AI'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            {nl ? 'Filters' : fr ? 'Filtres' : 'Filters'}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {nl ? 'Exporteren' : fr ? 'Exporter' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {nl ? 'Marktgroei' : fr ? 'Croissance du marche' : 'Market Growth'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23.5%</div>
            <p className="text-xs text-muted-foreground">{nl ? '+5,2% t.o.v. vorige maand' : fr ? '+5,2% par rapport au mois dernier' : '+5.2% from last month'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              {nl ? 'Marktomvang' : fr ? 'Taille du marche' : 'Market Size'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€2.4B</div>
            <p className="text-xs text-muted-foreground">{nl ? 'Nederlandse AI-markt' : fr ? 'Marche IA neerlandais' : 'Netherlands AI Market'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              {nl ? 'Kansen' : fr ? 'Opportunites' : 'Opportunities'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">{nl ? 'Nieuw deze week' : fr ? 'Nouveau cette semaine' : 'New this week'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {nl ? 'Concurrenten' : fr ? 'Concurrents' : 'Competitors'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">134</div>
            <p className="text-xs text-muted-foreground">{nl ? 'Actief in de markt' : fr ? 'Actifs sur le marche' : 'Active in market'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trending Topics */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{nl ? 'Trending Onderwerpen' : fr ? 'Sujets tendances' : 'Trending Topics'}</CardTitle>
            <CardDescription>{nl ? 'Populaire onderwerpen in jouw markt deze week' : fr ? 'Sujets populaires dans votre marche cette semaine' : 'Hot topics in your market this week'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { topic: "AI-Powered Marketing Automation", growth: "+127%", posts: 2340 },
                { topic: "GDPR Compliance for AI", growth: "+89%", posts: 1876 },
                { topic: "Dutch Language Models", growth: "+76%", posts: 1543 },
                { topic: "No-Code AI Tools", growth: "+62%", posts: 987 },
              ].map((item) => (
                <div key={item.topic} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.topic}</p>
                    <p className="text-sm text-muted-foreground">{item.posts.toLocaleString()} {nl ? 'berichten' : fr ? 'publications' : 'posts'}</p>
                  </div>
                  <Badge variant="secondary" className="text-green-600">
                    {item.growth}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Segments */}
        <Card>
          <CardHeader>
            <CardTitle>{nl ? 'Marktsegmenten' : fr ? 'Segments de marche' : 'Market Segments'}</CardTitle>
            <CardDescription>{nl ? 'Omvang per branche' : fr ? 'Taille par secteur' : 'Size by industry vertical'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { segment: "E-commerce", percentage: 34 },
                { segment: "SaaS", percentage: 28 },
                { segment: "Financial Services", percentage: 18 },
                { segment: "Healthcare", percentage: 12 },
                { segment: "Manufacturing", percentage: 8 },
              ].map((item) => (
                <div key={item.segment} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.segment}</span>
                    <span className="font-medium">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <Card className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{nl ? 'Geavanceerde Marktanalyse Binnenkort Beschikbaar' : fr ? 'Analyses de marche avancees bientot disponibles' : 'Advanced Market Analytics Coming Soon'}</h3>
              <p className="text-sm text-muted-foreground">
                {nl ? 'Diepere inzichten met voorspellende analyses, sentimentanalyse en concurrentiemonitoring.' : fr ? 'Des analyses plus profondes avec analyses predictives, analyse de sentiment et suivi des concurrents.' : 'Get deeper insights with predictive analytics, sentiment analysis, and competitor movement tracking.'}
              </p>
            </div>
            <Badge>{nl ? 'Verwacht Q2 2024' : fr ? 'Prevu Q2 2024' : 'Coming Q2 2024'}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}