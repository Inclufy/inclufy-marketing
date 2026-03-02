// src/components/context-marketing/ReportsView.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Plus,
  Calendar,
  Download,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  Users,
  BarChart3,
  TrendingUp,
  Shield,
  Target,
  DollarSign,
  Activity,
  Filter,
  Search,
  ChevronRight,
  FileSpreadsheet,
  Presentation,
  FileCode,
  Settings,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  reportingService,
  ReportTemplate,
  GeneratedReport,
  ScheduledReport
} from '@/services/context-marketing/reporting.service';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ReportsViewProps {
  onUpdate: () => void;
}

interface ReportGenerationForm {
  template_id: string;
  period_start: string;
  period_end: string;
  comparison_start?: string;
  comparison_end?: string;
  recipients: string[];
  external_emails: string[];
  format: 'pdf' | 'excel' | 'pptx' | 'html';
}

interface ScheduleForm {
  report_template_id: string;
  report_name: string;
  schedule_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  schedule_day?: number;
  schedule_time: string;
  recipients: string[];
  external_emails: string[];
  output_format: 'pdf' | 'excel' | 'email' | 'dashboard';
}

const defaultGenerationForm: ReportGenerationForm = {
  template_id: '',
  period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  period_end: new Date().toISOString().split('T')[0],
  recipients: [],
  external_emails: [],
  format: 'pdf'
};

const defaultScheduleForm: ScheduleForm = {
  report_template_id: '',
  report_name: '',
  schedule_frequency: 'monthly',
  schedule_time: '09:00',
  recipients: [],
  external_emails: [],
  output_format: 'pdf'
};

export default function ReportsView({ onUpdate }: ReportsViewProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('generated');
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [generationForm, setGenerationForm] = useState<ReportGenerationForm>(defaultGenerationForm);
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>(defaultScheduleForm);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      setLoading(true);
      const [templatesData, reportsData, scheduledData] = await Promise.all([
        reportingService.getReportTemplates(),
        reportingService.getGeneratedReports(),
        reportingService.getScheduledReports()
      ]);
      setTemplates(templatesData);
      setGeneratedReports(reportsData);
      setScheduledReports(scheduledData);
    } catch (error) {
      console.error('Error loading reports data:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      if (!generationForm.template_id) {
        toast.error('Please select a report template');
        return;
      }

      setGeneratingReport(generationForm.template_id);
      
      const report = await reportingService.generateReport(generationForm.template_id, {
        periodStart: new Date(generationForm.period_start),
        periodEnd: new Date(generationForm.period_end),
        comparisonPeriod: generationForm.comparison_start && generationForm.comparison_end
          ? {
              start: new Date(generationForm.comparison_start),
              end: new Date(generationForm.comparison_end)
            }
          : undefined,
        recipients: generationForm.recipients,
        externalRecipients: generationForm.external_emails.filter(e => e),
        format: generationForm.format
      });

      toast.success('Report generation started');
      setShowGenerateDialog(false);
      setGenerationForm(defaultGenerationForm);
      
      // Poll for completion
      const checkStatus = setInterval(async () => {
        const reports = await reportingService.getGeneratedReports();
        const updatedReport = reports.find(r => r.id === report.id);
        if (updatedReport?.generation_status === 'completed') {
          clearInterval(checkStatus);
          setGeneratingReport(null);
          toast.success('Report generated successfully');
          await loadReportsData();
        } else if (updatedReport?.generation_status === 'failed') {
          clearInterval(checkStatus);
          setGeneratingReport(null);
          toast.error('Report generation failed');
          await loadReportsData();
        }
      }, 2000);

      onUpdate();
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
      setGeneratingReport(null);
    }
  };

  const handleScheduleReport = async () => {
    try {
      if (!scheduleForm.report_template_id || !scheduleForm.report_name) {
        toast.error('Please fill in all required fields');
        return;
      }

      await reportingService.createScheduledReport({
        ...scheduleForm,
        schedule_day: scheduleForm.schedule_frequency === 'weekly' 
          ? scheduleForm.schedule_day || 1
          : scheduleForm.schedule_frequency === 'monthly'
          ? scheduleForm.schedule_day || 1
          : undefined,
        recipients: scheduleForm.recipients,
        external_emails: scheduleForm.external_emails.filter(e => e)
      });

      toast.success('Scheduled report created');
      setShowScheduleDialog(false);
      setScheduleForm(defaultScheduleForm);
      await loadReportsData();
      onUpdate();
    } catch (error) {
      console.error('Error scheduling report:', error);
      toast.error('Failed to schedule report');
    }
  };

  const handleRunScheduledReport = async (scheduledReportId: string) => {
    try {
      await reportingService.runScheduledReport(scheduledReportId);
      toast.success('Report generation started');
      await loadReportsData();
    } catch (error) {
      console.error('Error running scheduled report:', error);
      toast.error('Failed to run scheduled report');
    }
  };

  const getReportIcon = (type: string) => {
    switch (type) {
      case 'executive_summary': return <BarChart3 className="w-5 h-5" />;
      case 'performance_report': return <TrendingUp className="w-5 h-5" />;
      case 'competitive_analysis': return <Shield className="w-5 h-5" />;
      case 'campaign_review': return <Target className="w-5 h-5" />;
      case 'roi_analysis': return <DollarSign className="w-5 h-5" />;
      case 'team_productivity': return <Users className="w-5 h-5" />;
      case 'quarterly_review': return <Calendar className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'excel': return <FileSpreadsheet className="w-5 h-5" />;
      case 'pptx': return <Presentation className="w-5 h-5" />;
      case 'html': return <FileCode className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'generating':
        return <Badge className="bg-blue-100 text-blue-800">Generating</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge>Pending</Badge>;
    }
  };

  const filteredReports = generatedReports.filter(report => {
    const matchesSearch = report.report_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || report.report_type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Reports & Analytics</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Generate comprehensive reports and schedule automated delivery
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowScheduleDialog(true)}>
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Report
          </Button>
          <Button onClick={() => setShowGenerateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Report Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Generated Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generatedReports.length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Scheduled Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledReports.filter(r => r.is_active).length}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Last Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {generatedReports[0] 
                ? format(new Date(generatedReports[0].created_at), 'MMM d')
                : 'N/A'
              }
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generated">
            Generated Reports
            {generatedReports.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {generatedReports.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled Reports
            {scheduledReports.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {scheduledReports.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates">
            Templates
            {templates.length > 0 && (
              <Badge className="ml-2" variant="secondary">
                {templates.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Generated Reports Tab */}
        <TabsContent value="generated" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Reports</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      className="pl-9 w-64"
                      placeholder="Search reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="executive_summary">Executive</SelectItem>
                      <SelectItem value="performance_report">Performance</SelectItem>
                      <SelectItem value="competitive_analysis">Competitive</SelectItem>
                      <SelectItem value="roi_analysis">ROI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredReports.length > 0 ? (
                <div className="space-y-3">
                  {filteredReports.map((report, index) => (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded">
                          {getReportIcon(report.report_type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{report.report_name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {format(new Date(report.period_start), 'MMM d')} - {format(new Date(report.period_end), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(report.generation_status)}
                        {report.file_format && getFormatIcon(report.file_format)}
                        {report.generation_status === 'completed' && (
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        {report.generation_status === 'generating' && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">No reports generated yet</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Generate your first report to see it here
                  </p>
                  <Button onClick={() => setShowGenerateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Reports Tab */}
        <TabsContent value="scheduled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>
                Automated reports that run on a regular schedule
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledReports.length > 0 ? (
                <div className="space-y-3">
                  {scheduledReports.map((scheduled, index) => (
                    <motion.div
                      key={scheduled.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{scheduled.report_name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {scheduled.schedule_frequency} at {scheduled.schedule_time}
                          </p>
                          {scheduled.last_generated_at && (
                            <p className="text-xs text-gray-500">
                              Last run: {format(new Date(scheduled.last_generated_at), 'MMM d, h:mm a')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={scheduled.is_active ? "default" : "secondary"}>
                          {scheduled.is_active ? 'Active' : 'Paused'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRunScheduledReport(scheduled.id)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">No scheduled reports</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Schedule reports to run automatically
                  </p>
                  <Button onClick={() => setShowScheduleDialog(true)}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule First Report
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>
                Pre-built templates for common reporting needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded">
                              {getReportIcon(template.template_type)}
                            </div>
                            <div>
                              <CardTitle className="text-base">
                                {template.template_name}
                              </CardTitle>
                              <CardDescription className="text-xs mt-1">
                                {template.description}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Type
                            </span>
                            <Badge variant="outline">
                              {template.template_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Sections
                            </span>
                            <span>{template.sections.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">
                              Used
                            </span>
                            <span>{template.times_used} times</span>
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <Button 
                          className="w-full"
                          size="sm"
                          onClick={() => {
                            setGenerationForm({ 
                              ...generationForm, 
                              template_id: template.id 
                            });
                            setShowGenerateDialog(true);
                          }}
                        >
                          Generate Report
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {templates.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">No templates available</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Report templates will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Report Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Report</DialogTitle>
            <DialogDescription>
              Configure and generate a new report
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="template">Report Template</Label>
              <Select
                value={generationForm.template_id}
                onValueChange={(value) => setGenerationForm({ ...generationForm, template_id: value })}
              >
                <SelectTrigger id="template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.template_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="period-start">Period Start</Label>
                <Input
                  id="period-start"
                  type="date"
                  value={generationForm.period_start}
                  onChange={(e) => setGenerationForm({ ...generationForm, period_start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="period-end">Period End</Label>
                <Input
                  id="period-end"
                  type="date"
                  value={generationForm.period_end}
                  onChange={(e) => setGenerationForm({ ...generationForm, period_end: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Comparison Period (Optional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  placeholder="Comparison start"
                  value={generationForm.comparison_start || ''}
                  onChange={(e) => setGenerationForm({ ...generationForm, comparison_start: e.target.value })}
                />
                <Input
                  type="date"
                  placeholder="Comparison end"
                  value={generationForm.comparison_end || ''}
                  onChange={(e) => setGenerationForm({ ...generationForm, comparison_end: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="format">Output Format</Label>
              <Select
                value={generationForm.format}
                onValueChange={(value: any) => setGenerationForm({ ...generationForm, format: value })}
              >
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="pptx">PowerPoint</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>External Recipients (Optional)</Label>
              <Textarea
                placeholder="Enter email addresses, one per line"
                value={generationForm.external_emails.join('\n')}
                onChange={(e) => setGenerationForm({ 
                  ...generationForm, 
                  external_emails: e.target.value.split('\n').filter(e => e.trim()) 
                })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowGenerateDialog(false);
              setGenerationForm(defaultGenerationForm);
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateReport}
              disabled={!generationForm.template_id || generatingReport !== null}
            >
              {generatingReport ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Report Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule Report</DialogTitle>
            <DialogDescription>
              Set up automated report generation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="schedule-name">Report Name</Label>
              <Input
                id="schedule-name"
                value={scheduleForm.report_name}
                onChange={(e) => setScheduleForm({ ...scheduleForm, report_name: e.target.value })}
                placeholder="e.g., Monthly Executive Summary"
              />
            </div>

            <div>
              <Label htmlFor="schedule-template">Report Template</Label>
              <Select
                value={scheduleForm.report_template_id}
                onValueChange={(value) => setScheduleForm({ ...scheduleForm, report_template_id: value })}
              >
                <SelectTrigger id="schedule-template">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.template_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={scheduleForm.schedule_frequency}
                onValueChange={(value: any) => setScheduleForm({ ...scheduleForm, schedule_frequency: value })}
              >
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleForm.schedule_frequency === 'weekly' && (
              <div>
                <Label htmlFor="day-of-week">Day of Week</Label>
                <Select
                  value={scheduleForm.schedule_day?.toString() || '1'}
                  onValueChange={(value) => setScheduleForm({ ...scheduleForm, schedule_day: parseInt(value) })}
                >
                  <SelectTrigger id="day-of-week">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {scheduleForm.schedule_frequency === 'monthly' && (
              <div>
                <Label htmlFor="day-of-month">Day of Month</Label>
                <Input
                  id="day-of-month"
                  type="number"
                  min="1"
                  max="28"
                  value={scheduleForm.schedule_day || 1}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, schedule_day: parseInt(e.target.value) || 1 })}
                />
              </div>
            )}

            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={scheduleForm.schedule_time}
                onChange={(e) => setScheduleForm({ ...scheduleForm, schedule_time: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="output">Output Format</Label>
              <Select
                value={scheduleForm.output_format}
                onValueChange={(value: any) => setScheduleForm({ ...scheduleForm, output_format: value })}
              >
                <SelectTrigger id="output">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="email">Email Only</SelectItem>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowScheduleDialog(false);
              setScheduleForm(defaultScheduleForm);
            }}>
              Cancel
            </Button>
            <Button onClick={handleScheduleReport}>
              Schedule Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add this function at the end
const Play = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 2l10 6-10 6V2z" />
  </svg>
);