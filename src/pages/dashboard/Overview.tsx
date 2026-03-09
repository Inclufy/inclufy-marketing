// src/pages/dashboard/Overview.tsx
// Modern dashboard with luxe design inspired by reference designs

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Calendar,
  ChevronRight,
  Download,
  Eye,
  MoreVertical,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { useAnalyticsDashboard } from '@/hooks/queries/useAnalytics';
import { LoadingSkeleton, ErrorState } from '@/components/DataState';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Fallback data (language-independent) ────────────────────────────

const FALLBACK_PERFORMANCE = [
  { month: 'Jan', revenue: 45000, campaigns: 12, engagement: 78 },
  { month: 'Feb', revenue: 52000, campaigns: 15, engagement: 82 },
  { month: 'Mar', revenue: 48000, campaigns: 14, engagement: 75 },
  { month: 'Apr', revenue: 61000, campaigns: 18, engagement: 88 },
  { month: 'May', revenue: 75000, campaigns: 22, engagement: 92 },
  { month: 'Jun', revenue: 88000, campaigns: 24, engagement: 95 },
];

const FALLBACK_TOP_PERFORMERS = [
  { name: 'Sarah Chen', score: 98, campaigns: 24, revenue: '$125K' },
  { name: 'Mike Johnson', score: 92, campaigns: 21, revenue: '$108K' },
  { name: 'Emily Davis', score: 87, campaigns: 18, revenue: '$95K' },
];

export default function DashboardOverview() {
  const [dateRange, setDateRange] = useState('month');
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  // Fetch real dashboard stats
  const { data: dashboardStats, isLoading, isError, refetch } = useAnalyticsDashboard();

  // ─── Translated fallback data ────────────────────────────────────
  const campaignStatusData = [
    { name: nl ? 'Actief' : fr ? 'Actives' : 'Active', value: 12, color: '#7c3aed' },
    { name: nl ? 'Gepland' : fr ? 'Planifiées' : 'Planned', value: 5, color: '#f59e0b' },
    { name: nl ? 'Voltooid' : fr ? 'Terminées' : 'Completed', value: 18, color: '#10b981' },
    { name: nl ? 'Concept' : fr ? 'Brouillon' : 'Draft', value: 3, color: '#94a3b8' },
  ];

  const engagementData = [
    { name: nl ? 'Zeer Actief' : fr ? 'Très Actif' : 'Very Active', value: 28, color: '#10b981' },
    { name: nl ? 'Actief' : fr ? 'Actif' : 'Active', value: 45, color: '#3b82f6' },
    { name: nl ? 'Matig' : fr ? 'Modéré' : 'Moderate', value: 20, color: '#f59e0b' },
    { name: nl ? 'Inactief' : fr ? 'Inactif' : 'Inactive', value: 7, color: '#ef4444' },
  ];

  const recentActivities = [
    {
      id: 1,
      user: 'Sarah Chen',
      action: nl ? 'lanceerde campagne' : fr ? 'a lancé la campagne' : 'launched campaign',
      target: nl ? 'Zomer Uitverkoop 2024' : fr ? 'Soldes d\'Été 2024' : 'Summer Sale 2024',
      time: nl ? '2 uur geleden' : fr ? 'il y a 2 heures' : '2 hours ago',
      type: 'campaign',
    },
    {
      id: 2,
      user: 'Mike Johnson',
      action: nl ? 'genereerde content' : fr ? 'a généré du contenu' : 'generated content',
      target: nl ? '5 social media posts' : fr ? '5 publications réseaux sociaux' : '5 social media posts',
      time: nl ? '3 uur geleden' : fr ? 'il y a 3 heures' : '3 hours ago',
      type: 'ai',
    },
    {
      id: 3,
      user: 'Emily Davis',
      action: nl ? 'maakte klantreis aan' : fr ? 'a créé un parcours client' : 'created customer journey',
      target: 'Onboarding Flow v2',
      time: nl ? '5 uur geleden' : fr ? 'il y a 5 heures' : '5 hours ago',
      type: 'journey',
    },
    {
      id: 4,
      user: 'Alex Rivera',
      action: nl ? 'heeft segment bijgewerkt' : fr ? 'a mis à jour le segment' : 'updated segment',
      target: nl ? 'Hoog-waarde Klanten' : fr ? 'Clients à Haute Valeur' : 'High-Value Customers',
      time: nl ? '1 dag geleden' : fr ? 'il y a 1 jour' : '1 day ago',
      type: 'segment',
    },
  ];

  // Build stats cards from API data or fallback
  const stats = [
    {
      title: nl ? 'Totale Omzet' : fr ? 'Revenu Total' : 'Total Revenue',
      value: dashboardStats?.revenue
        ? `$${(dashboardStats.revenue / 1000).toFixed(1)}K`
        : '$877.9K',
      change: '+23%',
      trend: 'up' as const,
      icon: DollarSign,
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20'
    },
    {
      title: nl ? 'Actieve Campagnes' : fr ? 'Campagnes Actives' : 'Active Campaigns',
      value: dashboardStats?.active_campaigns?.toString() ?? '38',
      change: '+12%',
      trend: 'up' as const,
      icon: Activity,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20'
    },
    {
      title: nl ? 'Totaal Contacten' : fr ? 'Total Contacts' : 'Total Contacts',
      value: dashboardStats?.total_contacts
        ? dashboardStats.total_contacts.toLocaleString()
        : '24,583',
      change: '+18%',
      trend: 'up' as const,
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20'
    },
    {
      title: nl ? 'Gem. Engagement' : fr ? 'Engagement Moyen' : 'Avg. Engagement',
      value: '68.5%',
      change: '-2.3%',
      trend: 'down' as const,
      icon: Target,
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20'
    },
  ];

  const performanceData = FALLBACK_PERFORMANCE;
  const topPerformers = FALLBACK_TOP_PERFORMERS;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  if (isLoading) return <LoadingSkeleton cards={4} />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 text-transparent bg-clip-text">
            {nl ? 'Welkom terug, Sami!' : fr ? 'Bienvenue, Sami !' : 'Welcome back, Sami!'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {nl
              ? <>Je campagnes presteren <span className="text-green-600 font-semibold">23% beter</span> dan vorige maand</>
              : fr
                ? <>Vos campagnes performent <span className="text-green-600 font-semibold">23% mieux</span> que le mois dernier</>
                : <>Your campaigns are performing <span className="text-green-600 font-semibold">23% better</span> than last month</>
            }
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{nl ? 'Vandaag' : fr ? 'Aujourd\'hui' : 'Today'}</SelectItem>
              <SelectItem value="week">{nl ? 'Deze Week' : fr ? 'Cette Semaine' : 'This Week'}</SelectItem>
              <SelectItem value="month">{nl ? 'Deze Maand' : fr ? 'Ce Mois' : 'This Month'}</SelectItem>
              <SelectItem value="quarter">{nl ? 'Dit Kwartaal' : fr ? 'Ce Trimestre' : 'This Quarter'}</SelectItem>
              <SelectItem value="year">{nl ? 'Dit Jaar' : fr ? 'Cette Année' : 'This Year'}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {nl ? 'Exporteren' : fr ? 'Exporter' : 'Export'}
          </Button>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Sparkles className="w-4 h-4 mr-2" />
            {nl ? 'AI Samenvatting' : fr ? 'Résumé IA' : 'AI Summary'}
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`} />
              <CardContent className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge
                    variant={stat.trend === 'up' ? 'success' : 'destructive'}
                    className="flex items-center gap-1"
                  >
                    {stat.trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {stat.change}
                  </Badge>
                </div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</h3>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <Progress value={75} className="mt-3 h-1.5" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full shadow-lg border-0">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{nl ? 'Omzet & Prestaties' : fr ? 'Revenus & Performance' : 'Revenue & Performance'}</CardTitle>
                <p className="text-sm text-gray-500">{nl ? 'Maandoverzicht' : fr ? 'Aperçu Mensuel' : 'Monthly overview'}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>{nl ? 'Details Bekijken' : fr ? 'Voir les Détails' : 'View Details'}</DropdownMenuItem>
                  <DropdownMenuItem>{nl ? 'Data Exporteren' : fr ? 'Exporter les Données' : 'Export Data'}</DropdownMenuItem>
                  <DropdownMenuItem>{nl ? 'Rapport Afdrukken' : fr ? 'Imprimer le Rapport' : 'Print Report'}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#7c3aed"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorEngagement)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Campaign Status */}
        <motion.div variants={itemVariants}>
          <Card className="h-full shadow-lg border-0">
            <CardHeader>
              <CardTitle>{nl ? 'Campagnestatus' : fr ? 'Statut des Campagnes' : 'Campaign Status'}</CardTitle>
              <p className="text-sm text-gray-500">
                {nl ? 'Totaal' : fr ? 'Total' : 'Total'}: {dashboardStats?.total_campaigns ?? 38} {nl ? 'campagnes' : fr ? 'campagnes' : 'campaigns'}
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={campaignStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {campaignStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {campaignStatusData.map((status) => (
                  <div key={status.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-sm">{status.name}</span>
                    <span className="text-sm font-medium ml-auto">{status.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Engagement */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>{nl ? 'Gebruikersbetrokkenheid' : fr ? 'Engagement Utilisateurs' : 'User Engagement'}</CardTitle>
              <p className="text-sm text-gray-500">{nl ? 'Verdeling actieve gebruikers' : fr ? 'Distribution des utilisateurs actifs' : 'Active users distribution'}</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={engagementData}>
                  <RadialBar dataKey="value" cornerRadius={10} fill="#8884d8" />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {engagementData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle>{nl ? 'Recente Activiteit' : fr ? 'Activité Récente' : 'Recent Activity'}</CardTitle>
              <p className="text-sm text-gray-500">{nl ? 'Team acties' : fr ? 'Actions d\'Équipe' : 'Team actions'}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {activity.user.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span>
                      {' '}{activity.action}{' '}
                      <span className="font-medium">{activity.target}</span>
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        {nl ? 'Details Bekijken' : fr ? 'Voir les Détails' : 'View Details'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                {nl ? 'Alle Activiteit Bekijken' : fr ? 'Voir Toute l\'Activité' : 'View All Activity'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performers */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                {nl ? 'Toppresteerders' : fr ? 'Meilleurs Performeurs' : 'Top Performers'}
              </CardTitle>
              <p className="text-sm text-gray-500">{nl ? 'Leiders deze maand' : fr ? 'Leaders du mois' : 'This month\'s leaders'}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={performer.name} className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-white dark:bg-gray-800">
                        {performer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {index === 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-xs">&#x1F451;</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{performer.name}</p>
                    <p className="text-sm text-gray-500">
                      {performer.campaigns} {nl ? 'campagnes' : fr ? 'campagnes' : 'campaigns'} &bull; {performer.revenue}
                    </p>
                  </div>
                  <Badge variant="secondary" className="font-bold">
                    {performer.score}%
                  </Badge>
                </div>
              ))}
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                {nl ? 'Volledig Klassement Bekijken' : fr ? 'Voir le Classement Complet' : 'View Full Leaderboard'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
