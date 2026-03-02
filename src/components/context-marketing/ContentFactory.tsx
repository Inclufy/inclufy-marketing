// src/components/context-marketing/ContentFactory.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Factory,
  Sparkles,
  Play,
  Pause,
  Settings,
  Image,
  FileText,
  Video,
  Mail,
  Globe,
  MessageSquare,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Layers,
  Wand2,
  RefreshCw,
  Download,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Brain,
  Zap,
  Calendar,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { contentFactoryService, AutonomousContent, ContentPipeline, ContentMetrics } from '@/services/context-marketing/content-factory.service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Content type icons
const contentTypeIcons: Record<string, any> = {
  blog: FileText,
  social: MessageSquare,
  email: Mail,
  video: Video,
  image: Image,
  landing: Globe,
  ad: Target
};

export default function ContentFactory() {
  const [loading, setLoading] = useState(true);
  const [isFactoryRunning, setIsFactoryRunning] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  
  // Content metrics
  const [metrics, setMetrics] = useState<ContentMetrics>({
    totalGenerated: 0,
    publishedToday: 0,
    avgPerformance: 0,
    timesSaved: 0,
    activeTypes: 0,
    queueLength: 0
  });

  // Content pipeline
  const [pipeline, setPipeline] = useState<ContentPipeline[]>([]);
  const [generatedContent, setGeneratedContent] = useState<AutonomousContent[]>([]);
  const [contentQueue, setContentQueue] = useState<AutonomousContent[]>([]);

  // Factory settings
  const [factorySettings, setFactorySettings] = useState({
    autoGenerate: true,
    autoPublish: false,
    qualityThreshold: 85,
    maxDailyContent: 50,
    contentTypes: ['blog', 'social', 'email'],
    brandVoiceStrict: true
  });

  useEffect(() => {
    loadFactoryData();
    const interval = setInterval(loadFactoryData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadFactoryData = async () => {
    try {
      setLoading(true);
      
      const [
        factoryMetrics,
        pipelineStatus,
        recentContent,
        queuedContent
      ] = await Promise.all([
        contentFactoryService.getContentMetrics(selectedTimeRange),
        contentFactoryService.getPipelineStatus(),
        contentFactoryService.getGeneratedContent({ status: 'published' }),
        contentFactoryService.getContentQueue()
      ]);

      setMetrics(factoryMetrics);
      setPipeline(pipelineStatus);
      setGeneratedContent(recentContent);
      setContentQueue(queuedContent);
    } catch (error) {
      console.error('Error loading factory data:', error);
      toast.error('Failed to load content factory data');
    } finally {
      setLoading(false);
    }
  };

  const handleFactoryToggle = async () => {
    try {
      if (isFactoryRunning) {
        await contentFactoryService.pauseFactory();
        setIsFactoryRunning(false);
        toast.warning('Content factory paused');
      } else {
        await contentFactoryService.resumeFactory();
        setIsFactoryRunning(true);
        toast.success('Content factory resumed');
      }
    } catch (error) {
      toast.error('Failed to toggle factory state');
    }
  };

  const handleApproveContent = async (contentId: string) => {
    try {
      await contentFactoryService.approveContent(contentId);
      toast.success('Content approved for publishing');
      loadFactoryData();
    } catch (error) {
      toast.error('Failed to approve content');
    }
  };

  const handleRejectContent = async (contentId: string) => {
    try {
      await contentFactoryService.rejectContent(contentId);
      toast.success('Content rejected');
      loadFactoryData();
    } catch (error) {
      toast.error('Failed to reject content');
    }
  };

  const handleEditContent = async (content: AutonomousContent) => {
    // In real implementation, would open an editor
    toast.info('Content editor would open here');
  };

  const getContentIcon = (type: string) => {
    const Icon = contentTypeIcons[type] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (score >= 50) return <Badge className="bg-orange-100 text-orange-800">Average</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generating': return 'text-blue-600';
      case 'review': return 'text-yellow-600';
      case 'approved': return 'text-green-600';
      case 'published': return 'text-purple-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Factory className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
              Content Factory
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Autonomous content generation at scale
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Today</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Label htmlFor="factory-toggle">Factory</Label>
            <Switch
              id="factory-toggle"
              checked={isFactoryRunning}
              onCheckedChange={handleFactoryToggle}
              className="data-[state=checked]:bg-green-600"
            />
            <Badge variant={isFactoryRunning ? "default" : "destructive"}>
              {isFactoryRunning ? 'Running' : 'Paused'}
            </Badge>
          </div>

          <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Factory Status Alert */}
      {isFactoryRunning && (
        <Alert className="border-purple-500">
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Content Factory Active</AlertTitle>
          <AlertDescription>
            AI is autonomously generating content based on detected opportunities and trends.
            {contentQueue.length > 0 && ` ${contentQueue.length} items in review queue.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Generated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalGenerated}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Published Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.publishedToday}</div>
            <p className="text-xs text-gray-500 mt-1">Auto & manual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Avg Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgPerformance}%</div>
            <Progress value={metrics.avgPerformance} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Time Saved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.timesSaved}h</div>
            <p className="text-xs text-gray-500 mt-1">vs manual creation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeTypes}</div>
            <p className="text-xs text-gray-500 mt-1">Content formats</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Review Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.queueLength}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="queue">Review Queue</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Generation Pipeline</CardTitle>
              <CardDescription>
                Real-time view of autonomous content creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pipeline.map((stage, idx) => (
                  <motion.div
                    key={stage.stage}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        stage.status === 'active' ? "bg-green-100 animate-pulse" :
                        stage.status === 'idle' ? "bg-gray-100" : "bg-yellow-100"
                      )}>
                        {stage.stage === 'opportunity_detection' ? <Brain className="w-5 h-5" /> :
                         stage.stage === 'content_generation' ? <Wand2 className="w-5 h-5" /> :
                         stage.stage === 'quality_check' ? <CheckCircle className="w-5 h-5" /> :
                         <Layers className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-medium">{stage.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {stage.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={stage.status === 'active' ? 'default' : 'secondary'}>
                        {stage.status}
                      </Badge>
                      {stage.items_processing > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {stage.items_processing} items
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pipeline Statistics */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold">247</p>
                  <p className="text-sm text-gray-500">Opportunities/day</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">89%</p>
                  <p className="text-sm text-gray-500">Auto-approval rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">3.2x</p>
                  <p className="text-sm text-gray-500">Faster than manual</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Review Queue</CardTitle>
              <CardDescription>
                Content awaiting human approval before publishing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-4">
                  {contentQueue.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No content awaiting review
                      </p>
                    </div>
                  ) : (
                    contentQueue.map((content) => (
                      <motion.div
                        key={content.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              {getContentIcon(content.content_type)}
                            </div>
                            <div>
                              <h4 className="font-medium">{content.title}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {content.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(content.created_at), 'MMM d, h:mm a')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  {content.trigger_type}
                                </span>
                                {content.performance_prediction && (
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    {content.performance_prediction}% predicted
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {getPerformanceBadge(content.quality_score)}
                        </div>

                        <Separator className="my-3" />

                        {/* Content Preview */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 mb-3">
                          <p className="text-sm line-clamp-3">{content.preview}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditContent(content)}>
                              <Edit3 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectContent(content.id)}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveContent(content.id)}
                            >
                              Approve & Publish
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Published Content</CardTitle>
              <CardDescription>
                Recently published autonomous content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedContent.map((content, idx) => (
                  <div
                    key={content.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        {getContentIcon(content.content_type)}
                      </div>
                      <div>
                        <h4 className="font-medium">{content.title}</h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span>{format(new Date(content.published_at!), 'MMM d, h:mm a')}</span>
                          <span className={getStatusColor(content.status)}>
                            {content.status}
                          </span>
                          {content.metrics && (
                            <>
                              <span>{content.metrics.views} views</span>
                              <span>{content.metrics.engagement}% engagement</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Content performance analytics visualization coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Content Factory Settings</DialogTitle>
            <DialogDescription>
              Configure autonomous content generation parameters
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-generate">Auto-generate content</Label>
                <Switch
                  id="auto-generate"
                  checked={factorySettings.autoGenerate}
                  onCheckedChange={(checked) => 
                    setFactorySettings(prev => ({ ...prev, autoGenerate: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-publish">Auto-publish approved content</Label>
                <Switch
                  id="auto-publish"
                  checked={factorySettings.autoPublish}
                  onCheckedChange={(checked) => 
                    setFactorySettings(prev => ({ ...prev, autoPublish: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="brand-voice">Strict brand voice adherence</Label>
                <Switch
                  id="brand-voice"
                  checked={factorySettings.brandVoiceStrict}
                  onCheckedChange={(checked) => 
                    setFactorySettings(prev => ({ ...prev, brandVoiceStrict: checked }))
                  }
                />
              </div>
            </div>

            <Separator />

            <div>
              <Label>Quality threshold for auto-approval</Label>
              <div className="flex items-center gap-4 mt-2">
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={factorySettings.qualityThreshold}
                  onChange={(e) => 
                    setFactorySettings(prev => ({ ...prev, qualityThreshold: parseInt(e.target.value) }))
                  }
                  className="flex-1"
                />
                <span className="w-12 text-right">{factorySettings.qualityThreshold}%</span>
              </div>
            </div>

            <div>
              <Label>Maximum daily content generation</Label>
              <input
                type="number"
                value={factorySettings.maxDailyContent}
                onChange={(e) => 
                  setFactorySettings(prev => ({ ...prev, maxDailyContent: parseInt(e.target.value) }))
                }
                className="w-full mt-2 px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <Label>Active content types</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {['blog', 'social', 'email', 'video', 'ad', 'landing'].map(type => (
                  <label
                    key={type}
                    className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={factorySettings.contentTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFactorySettings(prev => ({
                            ...prev,
                            contentTypes: [...prev.contentTypes, type]
                          }));
                        } else {
                          setFactorySettings(prev => ({
                            ...prev,
                            contentTypes: prev.contentTypes.filter(t => t !== type)
                          }));
                        }
                      }}
                    />
                    {getContentIcon(type)}
                    <span className="capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success('Settings saved');
              setShowSettingsDialog(false);
            }}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}