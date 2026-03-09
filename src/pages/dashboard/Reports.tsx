// src/pages/dashboard/Reports.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  const reports = [
    {
      id: 1,
      title: nl ? 'Maandelijkse Marketingprestaties' : fr ? 'Performance Marketing Mensuelle' : 'Monthly Marketing Performance',
      type: nl ? 'Prestatierapport' : fr ? 'Rapport de Performance' : 'Performance Report',
      status: nl ? 'Gereed' : fr ? 'Prêt' : 'Ready',
      date: 'Dec 20, 2024',
      size: '2.4 MB',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      id: 2,
      title: nl ? 'Campagne ROI-analyse Q4' : fr ? 'Analyse ROI des Campagnes Q4' : 'Campaign ROI Analysis Q4',
      type: nl ? 'Financieel Rapport' : fr ? 'Rapport Financier' : 'Financial Report',
      status: nl ? 'Gereed' : fr ? 'Prêt' : 'Ready',
      date: 'Dec 18, 2024',
      size: '1.8 MB',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      id: 3,
      title: nl ? 'E-mailmarketing Samenvatting' : fr ? 'Résumé du Marketing par E-mail' : 'Email Marketing Summary',
      type: nl ? 'Campagnerapport' : fr ? 'Rapport de Campagne' : 'Campaign Report',
      status: nl ? 'Verwerken' : fr ? 'En cours' : 'Processing',
      date: 'Dec 15, 2024',
      size: '3.1 MB',
      icon: Mail,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      id: 4,
      title: nl ? 'Doelgroep Inzichten Rapport' : fr ? "Rapport d'Aperçu de l'Audience" : 'Audience Insights Report',
      type: nl ? 'Analyserapport' : fr ? "Rapport d'Analyse" : 'Analytics Report',
      status: nl ? 'Gereed' : fr ? 'Prêt' : 'Ready',
      date: 'Dec 10, 2024',
      size: '1.2 MB',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
  ];

  const quickStats = [
    { label: nl ? 'Rapporten Gegenereerd' : fr ? 'Rapports Générés' : 'Reports Generated', value: '156', change: nl ? '+12 deze maand' : fr ? '+12 ce mois' : '+12 this month' },
    { label: nl ? 'Geplande Rapporten' : fr ? 'Rapports Planifiés' : 'Scheduled Reports', value: '24', change: nl ? '8 aankomend' : fr ? '8 à venir' : '8 upcoming' },
    { label: nl ? 'Totaal Downloads' : fr ? 'Total Téléchargements' : 'Total Downloads', value: '1,234', change: nl ? '+345 deze maand' : fr ? '+345 ce mois' : '+345 this month' },
    { label: nl ? 'Actieve Abonnementen' : fr ? 'Abonnements Actifs' : 'Active Subscriptions', value: '18', change: nl ? '6 teamleden' : fr ? "6 membres d'équipe" : '6 team members' },
  ];

  const scheduledReports = [
    { name: nl ? 'Wekelijkse Prestatie Samenvatting' : fr ? 'Résumé Hebdomadaire des Performances' : 'Weekly Performance Summary', schedule: nl ? 'Elke maandag, 9:00' : fr ? 'Chaque lundi, 9h00' : 'Every Monday, 9:00 AM' },
    { name: nl ? 'Maandelijks ROI Rapport' : fr ? 'Rapport ROI Mensuel' : 'Monthly ROI Report', schedule: nl ? 'Eerste dag van de maand, 8:00' : fr ? 'Premier jour du mois, 8h00' : 'First day of month, 8:00 AM' },
    { name: nl ? 'Campagne Analyse' : fr ? 'Analyse des Campagnes' : 'Campaign Analytics', schedule: nl ? 'Elke vrijdag, 17:00' : fr ? 'Chaque vendredi, 17h00' : 'Every Friday, 5:00 PM' },
  ];

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
        </CardContent>
      </Card>
    </div>
  );
}
