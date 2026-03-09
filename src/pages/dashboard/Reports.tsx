// src/pages/dashboard/Reports.tsx
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
  MoreVertical
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Reports() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const reports: { id: number; title: string; type: string; status: string; date: string; size: string; icon: any; color: string; bgColor: string }[] = [];

  const quickStats = [
    { label: nl ? 'Rapporten Gegenereerd' : fr ? 'Rapports Générés' : 'Reports Generated', value: '0', change: nl ? 'Nog geen rapporten' : fr ? 'Pas encore de rapports' : 'No reports yet' },
    { label: nl ? 'Geplande Rapporten' : fr ? 'Rapports Planifiés' : 'Scheduled Reports', value: '0', change: nl ? 'Geen gepland' : fr ? 'Aucun planifié' : 'None scheduled' },
    { label: nl ? 'Totaal Downloads' : fr ? 'Total Téléchargements' : 'Total Downloads', value: '0', change: nl ? '–' : fr ? '–' : '–' },
    { label: nl ? 'Actieve Abonnementen' : fr ? 'Abonnements Actifs' : 'Active Subscriptions', value: '0', change: nl ? '–' : fr ? "6 membres d'équipe" : '6 team members' },
  ];

  const scheduledReports: { name: string; schedule: string }[] = [];

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
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${report.bgColor}`}>
                    <report.icon className={`w-5 h-5 ${report.color}`} />
                  </div>
                  <div>
                    <h4 className="font-medium">{report.title}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-500">{report.type}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-500">{report.date}</span>
                      <span className="text-sm text-gray-400">•</span>
                      <span className="text-sm text-gray-500">{report.size}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={report.status === (nl ? 'Gereed' : fr ? 'Prêt' : 'Ready') ? 'success' : 'secondary'}>
                    {report.status}
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
            ))}
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
            {scheduledReports.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.schedule}</p>
                </div>
                <Button variant="outline" size="sm">
                  {nl ? 'Bewerken' : fr ? 'Modifier' : 'Edit'}
                </Button>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
