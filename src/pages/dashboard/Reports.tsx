// src/pages/dashboard/Reports.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/DataState';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Mail,
  Eye,
  MoreVertical,
  Loader2,
  BarChart3,
  Shield
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedReport {
  id: string;
  report_name: string;
  report_type: string;
  generation_status: string;
  generated_at: string | null;
  file_format: string;
  file_size_bytes: number;
  executive_summary: string;
  period_start: string;
  period_end: string;
}

interface ScheduledReport {
  id: string;
  report_name: string;
  schedule_frequency: string;
  schedule_day: number;
  schedule_time: string;
  is_active: boolean;
  next_scheduled_at: string | null;
  last_generated_at: string | null;
}

const REPORT_ICONS: Record<string, { icon: any; color: string; bgColor: string }> = {
  executive_summary: { icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/20' },
  performance_report: { icon: BarChart3, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/20' },
  competitive_analysis: { icon: Shield, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/20' },
  roi_analysis: { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/20' },
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function Reports() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [templateCount, setTemplateCount] = useState(0);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [genRes, schedRes, tplRes] = await Promise.all([
        supabase.from('generated_reports').select('*').eq('user_id', user.id).order('generated_at', { ascending: false }),
        supabase.from('scheduled_reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('report_templates').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      setReports((genRes.data as GeneratedReport[]) || []);
      setScheduledReports((schedRes.data as ScheduledReport[]) || []);
      setTemplateCount(tplRes.count || 0);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const completedReports = reports.filter(r => r.generation_status === 'completed');
  const totalDownloads = completedReports.length; // Each completed report counts as downloadable

  const quickStats = [
    { label: nl ? 'Rapporten Gegenereerd' : fr ? 'Rapports Générés' : 'Reports Generated', value: String(completedReports.length), change: completedReports.length > 0 ? (nl ? `${templateCount} sjablonen beschikbaar` : `${templateCount} templates available`) : (nl ? 'Nog geen rapporten' : 'No reports yet') },
    { label: nl ? 'Geplande Rapporten' : fr ? 'Rapports Planifiés' : 'Scheduled Reports', value: String(scheduledReports.filter(s => s.is_active).length), change: scheduledReports.length > 0 ? (nl ? `${scheduledReports.filter(s => s.is_active).length} actief` : `${scheduledReports.filter(s => s.is_active).length} active`) : (nl ? 'Geen gepland' : 'None scheduled') },
    { label: nl ? 'Totaal Downloads' : fr ? 'Total Téléchargements' : 'Total Downloads', value: String(totalDownloads), change: totalDownloads > 0 ? (nl ? `${completedReports[0]?.file_format?.toUpperCase()} formaat` : `${completedReports[0]?.file_format?.toUpperCase()} format`) : '–' },
    { label: nl ? 'Actieve Abonnementen' : fr ? 'Abonnements Actifs' : 'Active Subscriptions', value: String(scheduledReports.filter(s => s.is_active).length), change: scheduledReports.length > 0 ? (nl ? 'Automatische levering' : 'Auto delivery') : '–' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
            {nl ? 'Rapportencentrum' : fr ? 'Centre de Rapports' : 'Reports Center'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {nl ? 'Genereer, bekijk en download je marketingrapporten' : fr ? 'Générez, consultez et téléchargez vos rapports marketing' : 'Generate, view, and download your marketing reports'}
          </p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <FileText className="w-4 h-4 mr-2" />
          {nl ? 'Rapport Aanmaken' : fr ? 'Créer un Rapport' : 'Create Report'}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="border-0 shadow-md">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Reports */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{nl ? 'Recente Rapporten' : fr ? 'Rapports Récents' : 'Recent Reports'}</CardTitle>
          <Button variant="ghost" size="sm">
            {nl ? 'Alles Bekijken' : fr ? 'Voir Tout' : 'View All'}
          </Button>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <EmptyState
              title={nl ? 'Nog geen rapporten' : fr ? 'Pas encore de rapports' : 'No reports yet'}
              description={nl ? 'Maak uw eerste rapport aan om marketingprestaties bij te houden.' : fr ? 'Créez votre premier rapport pour suivre les performances marketing.' : 'Create your first report to track marketing performance.'}
            />
          ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const iconInfo = REPORT_ICONS[report.report_type] || REPORT_ICONS.executive_summary;
              const Icon = iconInfo.icon;
              return (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${iconInfo.bgColor}`}>
                      <Icon className={`w-5 h-5 ${iconInfo.color}`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{report.report_name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500 capitalize">{report.report_type.replace(/_/g, ' ')}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-500">{report.generated_at ? new Date(report.generated_at).toLocaleDateString('nl-NL') : '–'}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-500">{formatFileSize(report.file_size_bytes)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={report.generation_status === 'completed' ? 'default' : 'secondary'} className={report.generation_status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : ''}>
                      {report.generation_status === 'completed' ? (nl ? 'Gereed' : 'Ready') : report.generation_status}
                    </Badge>
                    <Button variant="ghost" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Scheduled Reports */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {nl ? 'Geplande Rapporten' : fr ? 'Rapports Planifiés' : 'Scheduled Reports'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledReports.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {nl ? 'Nog geen geplande rapporten' : fr ? 'Pas encore de rapports planifiés' : 'No scheduled reports yet'}
            </p>
          ) : (
          <div className="space-y-3">
            {scheduledReports.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.report_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.schedule_frequency === 'monthly' ? (nl ? 'Maandelijks' : 'Monthly') :
                     item.schedule_frequency === 'weekly' ? (nl ? 'Wekelijks' : 'Weekly') :
                     item.schedule_frequency === 'daily' ? (nl ? 'Dagelijks' : 'Daily') : item.schedule_frequency}
                    {' • '}
                    {item.schedule_time}
                    {item.next_scheduled_at && ` • ${nl ? 'Volgende' : 'Next'}: ${new Date(item.next_scheduled_at).toLocaleDateString('nl-NL')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.is_active ? 'default' : 'secondary'} className={item.is_active ? 'bg-green-100 text-green-800' : ''}>
                    {item.is_active ? (nl ? 'Actief' : 'Active') : (nl ? 'Gepauzeerd' : 'Paused')}
                  </Badge>
                  <Button variant="outline" size="sm">
                    {nl ? 'Bewerken' : fr ? 'Modifier' : 'Edit'}
                  </Button>
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
