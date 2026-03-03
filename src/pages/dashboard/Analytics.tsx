// src/pages/dashboard/Analytics.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, TrendingUp, Users, Mail, FileText, Send,
  MousePointerClick, Eye, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '@/lib/api';

interface AnalyticsData {
  campaigns: {
    total: number;
    by_status: Record<string, number>;
    by_type: Record<string, number>;
    total_budget: number;
    timeline: { month: string; count: number }[];
  };
  contacts: {
    total: number;
    timeline: { month: string; count: number }[];
  };
  emails: {
    sent: number;
    opened: number;
    clicked: number;
    open_rate: number;
    click_rate: number;
  };
  content: {
    total: number;
    by_type: Record<string, number>;
    timeline: { month: string; count: number }[];
  };
  events: {
    total: number;
    by_type: Record<string, number>;
  };
}

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/analytics/overview');
      setData(res.data);
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-6 flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-800 dark:text-red-200">{error}</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                Make sure the backend is running and you are logged in.
              </p>
            </div>
            <Button variant="outline" onClick={fetchData}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const campaignTypeData = Object.entries(data.campaigns.by_type).map(([name, value]) => ({ name, value }));
  const campaignStatusData = Object.entries(data.campaigns.by_status).map(([name, value]) => ({ name, value }));
  const contentTypeData = Object.entries(data.content.by_type).map(([name, value]) => ({ name, value }));

  // Merge timelines for the growth chart
  const growthData = data.campaigns.timeline.map((item, i) => ({
    month: item.month,
    campaigns: item.count,
    contacts: data.contacts.timeline[i]?.count || 0,
    content: data.content.timeline[i]?.count || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Real-time marketing performance metrics
          </p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <Badge variant="outline">{data.campaigns.by_status.active || 0} active</Badge>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Campaigns</h3>
            <p className="text-2xl font-bold mt-1">{data.campaigns.total}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Contacts</h3>
            <p className="text-2xl font-bold mt-1">{data.contacts.total.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Send className="w-6 h-6 text-green-600" />
              </div>
              {data.emails.sent > 0 && (
                <Badge variant="outline" className="text-green-600">{data.emails.open_rate}% open</Badge>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Emails Sent</h3>
            <p className="text-2xl font-bold mt-1">{data.emails.sent.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Content Created</h3>
            <p className="text-2xl font-bold mt-1">{data.content.total}</p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Timeline Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Growth Over Time
          </CardTitle>
          <CardDescription>Campaigns, contacts, and content created per month</CardDescription>
        </CardHeader>
        <CardContent>
          {growthData.some(d => d.campaigns > 0 || d.contacts > 0 || d.content > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="campaigns" fill="#8b5cf6" name="Campaigns" radius={[4, 4, 0, 0]} />
                <Bar dataKey="contacts" fill="#3b82f6" name="Contacts" radius={[4, 4, 0, 0]} />
                <Bar dataKey="content" fill="#10b981" name="Content" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p>Create campaigns, import contacts, or generate content to see growth trends.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Performance */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.emails.sent > 0 ? (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: 'Sent', value: data.emails.sent, fill: '#8b5cf6' },
                    { name: 'Opened', value: data.emails.opened, fill: '#3b82f6' },
                    { name: 'Clicked', value: data.emails.clicked, fill: '#10b981' },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {[
                        { fill: '#8b5cf6' },
                        { fill: '#3b82f6' },
                        { fill: '#10b981' },
                      ].map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                      <Send className="h-4 w-4" />
                      <span className="text-xs font-medium">Sent</span>
                    </div>
                    <p className="text-lg font-bold">{data.emails.sent}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                      <Eye className="h-4 w-4" />
                      <span className="text-xs font-medium">Open Rate</span>
                    </div>
                    <p className="text-lg font-bold">{data.emails.open_rate}%</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                      <MousePointerClick className="h-4 w-4" />
                      <span className="text-xs font-medium">Click Rate</span>
                    </div>
                    <p className="text-lg font-bold">{data.emails.click_rate}%</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>Send emails to see performance metrics here.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Type Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Campaign Breakdown
            </CardTitle>
            <CardDescription>By type and status</CardDescription>
          </CardHeader>
          <CardContent>
            {campaignTypeData.length > 0 ? (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={campaignTypeData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {campaignTypeData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2">
                  {campaignStatusData.map((item, i) => (
                    <Badge key={item.name} variant="outline" className="capitalize">
                      {item.name}: {item.value}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p>Create campaigns to see breakdown charts.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Library Breakdown */}
      {data.content.total > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Content Library
            </CardTitle>
            <CardDescription>{data.content.total} items in your library</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {contentTypeData.map((item, i) => (
                <div key={item.name} className="p-4 border rounded-lg text-center">
                  <p className="text-2xl font-bold" style={{ color: COLORS[i % COLORS.length] }}>
                    {item.value}
                  </p>
                  <p className="text-sm text-gray-500 capitalize mt-1">{item.name.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
