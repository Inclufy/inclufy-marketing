// src/pages/admin/AdminDashboard.tsx
// Admin Dashboard — overzicht met statistieken, recente gebruikers, activiteit

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Users,
  Building2,
  CreditCard,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  Upload,
  Download,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  total_users: number;
  organizations: number;
  active_subscriptions: number;
  projects: number;
  mrr: number;
  arr: number;
  user_growth: number;
  contacts: number;
  content_items: number;
}

interface RecentUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  organization: string;
  role: string;
}

export default function AdminDashboard() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query Supabase tables directly for admin stats
      const [
        { count: userCount },
        { count: orgCount },
        { count: subsCount },
        { count: campaignCount },
        { count: contactCount },
        { count: contentCount },
        { data: recentProfiles },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('campaigns').select('*', { count: 'exact', head: true }),
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('content_items').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, email, full_name, created_at').order('created_at', { ascending: false }).limit(8),
      ]);

      setStats({
        total_users: userCount || 0,
        organizations: orgCount || 0,
        active_subscriptions: subsCount || 0,
        projects: campaignCount || 0,
        mrr: (subsCount || 0) * 79,
        arr: (subsCount || 0) * 79 * 12,
        user_growth: 0,
        contacts: contactCount || 0,
        content_items: contentCount || 0,
      });

      setRecentUsers((recentProfiles || []).map((p: any) => ({
        id: p.id,
        email: p.email || '',
        full_name: p.full_name || '',
        created_at: p.created_at,
        organization: '',
        role: 'member',
      })));
    } catch (err: any) {
      setError(err.message || (nl ? 'Laden mislukt' : fr ? 'Échec du chargement' : 'Failed to load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-12">
        <Card className="border-red-200">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">{error}</p>
            </div>
            <Button variant="outline" onClick={fetchData}>{nl ? 'Opnieuw' : fr ? 'Réessayer' : 'Retry'}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      label: nl ? 'Totaal Gebruikers' : fr ? 'Total Utilisateurs' : 'Total Users',
      value: stats?.total_users || 0,
      icon: Users,
      color: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600',
    },
    {
      label: nl ? 'Organisaties' : fr ? 'Organisations' : 'Organizations',
      value: stats?.organizations || 0,
      icon: Building2,
      color: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconColor: 'text-emerald-600',
    },
    {
      label: nl ? 'Actieve Abonnementen' : fr ? 'Abonnements Actifs' : 'Active Subscriptions',
      value: stats?.active_subscriptions || 0,
      icon: CreditCard,
      color: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600',
    },
    {
      label: nl ? 'Projecten' : fr ? 'Projets' : 'Projects',
      value: stats?.projects || 0,
      icon: FolderKanban,
      color: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{nl ? 'Systeemoverzicht en statistieken' : fr ? "Vue d'ensemble et statistiques" : 'System overview and statistics'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {nl ? 'Vernieuwen' : fr ? 'Actualiser' : 'Refresh'}
        </Button>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">MRR</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              &euro;{(stats?.mrr || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ARR</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              &euro;{(stats?.arr || 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{nl ? 'Gebruikersgroei' : fr ? 'Croissance Utilisateurs' : 'User Growth'}</p>
            <div className="flex items-center gap-2">
              {(stats?.user_growth || 0) >= 0 ? (
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.user_growth || 0}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{nl ? 'Recente Gebruikers' : fr ? 'Utilisateurs Récents' : 'Recent Users'}</CardTitle>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-gray-500 text-center py-6">{nl ? 'Geen gebruikers gevonden' : fr ? 'Aucun utilisateur trouvé' : 'No users found'}</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                      {(user.full_name || user.email || '?').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.full_name || user.email?.split('@')[0] || (nl ? 'Onbekend' : fr ? 'Inconnu' : 'Unknown')}
                      </p>
                      {user.organization && (
                        <p className="text-xs text-gray-500">{user.organization}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString(nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-US') : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import & Export */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{nl ? 'Importeren & Exporteren' : fr ? 'Importer & Exporter' : 'Import & Export'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1">
              <Upload className="h-4 w-4 mr-2" />
              {nl ? 'Importeren' : fr ? 'Importer' : 'Import'}
            </Button>
            <Button variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {nl ? 'Exporteren' : fr ? 'Exporter' : 'Export'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
