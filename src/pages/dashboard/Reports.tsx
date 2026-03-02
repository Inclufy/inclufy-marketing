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

export default function Reports() {
  const reports = [
    {
      id: 1,
      title: 'Monthly Marketing Performance',
      type: 'Performance Report',
      status: 'Ready',
      date: 'Dec 20, 2024',
      size: '2.4 MB',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      id: 2,
      title: 'Campaign ROI Analysis Q4',
      type: 'Financial Report',
      status: 'Ready',
      date: 'Dec 18, 2024',
      size: '1.8 MB',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      id: 3,
      title: 'Email Marketing Summary',
      type: 'Campaign Report',
      status: 'Processing',
      date: 'Dec 15, 2024',
      size: '3.1 MB',
      icon: Mail,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    },
    {
      id: 4,
      title: 'Audience Insights Report',
      type: 'Analytics Report',
      status: 'Ready',
      date: 'Dec 10, 2024',
      size: '1.2 MB',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    },
  ];

  const quickStats = [
    { label: 'Reports Generated', value: '156', change: '+12 this month' },
    { label: 'Scheduled Reports', value: '24', change: '8 upcoming' },
    { label: 'Total Downloads', value: '1,234', change: '+345 this month' },
    { label: 'Active Subscriptions', value: '18', change: '6 team members' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
            Reports Center
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Generate, view, and download your marketing reports
          </p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
          <FileText className="w-4 h-4 mr-2" />
          Create Report
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
          <CardTitle>Recent Reports</CardTitle>
          <Button variant="ghost" size="sm">
            View All
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
                  <Badge variant={report.status === 'Ready' ? 'success' : 'secondary'}>
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
            Scheduled Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Weekly Performance Summary', schedule: 'Every Monday, 9:00 AM' },
              { name: 'Monthly ROI Report', schedule: 'First day of month, 8:00 AM' },
              { name: 'Campaign Analytics', schedule: 'Every Friday, 5:00 PM' },
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.schedule}</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}