// src/components/context-marketing/ContentIntelligence.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  TrendingUp,
  Target,
  Calendar,
  Users,
  Sparkles,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Info,
  Play,
  Settings,
  Hash,
  MessageSquare,
  Mail,
  Globe,
  PresentationIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  patternRecognitionService,
  ContentPrediction 
} from '@/services/context-marketing/pattern-recognition.service';
import { toast } from 'sonner';

interface ContentMetrics {
  engagement: number;
  conversion: number;
  reach: number;
  confidence: number;
}

interface OptimizationRule {
  id: string;
  rule_name: string;
  rule_type: string;
  optimization_action: string;
  expected_improvement: number;
  success_rate: number;
  times_applied: number;
  is_active: boolean;
}

export default function ContentIntelligence() {
  const [activeTab, setActiveTab] = useState('predict');
  const [predicting, setPredicting] = useState(false);
  
  // Prediction form state
  const [contentType, setContentType] = useState<ContentPrediction['content_type']>('blog');
  const [contentTopic, setContentTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [contentDraft, setContentDraft] = useState('');
  
  // Prediction results
  const [prediction, setPrediction] = useState<ContentPrediction | null>(null);
  
  // Mock optimization rules (in real implementation, would fetch from API)
  const [optimizationRules] = useState<OptimizationRule[]>([
    {
      id: '1',
      rule_name: 'Optimal Blog Post Length',
      rule_type: 'length',
      optimization_action: 'Keep blog posts between 1,200-1,500 words',
      expected_improvement: 25,
      success_rate: 78,
      times_applied: 156,
      is_active: true
    },
    {
      id: '2',
      rule_name: 'Tuesday Morning Publishing',
      rule_type: 'timing',
      optimization_action: 'Publish content on Tuesday between 9-11 AM',
      expected_improvement: 35,
      success_rate: 82,
      times_applied: 89,
      is_active: true
    },
    {
      id: '3',
      rule_name: 'Conversational Tone for B2B',
      rule_type: 'tone',
      optimization_action: 'Use conversational tone for B2B technical content',
      expected_improvement: 20,
      success_rate: 71,
      times_applied: 234,
      is_active: true
    },
    {
      id: '4',
      rule_name: 'Email Subject Line Length',
      rule_type: 'length',
      optimization_action: 'Keep email subjects under 50 characters',
      expected_improvement: 45,
      success_rate: 89,
      times_applied: 512,
      is_active: true
    }
  ]);

  const handlePrediction = async () => {
    if (!contentTopic) {
      toast.error('Please enter a content topic');
      return;
    }

    try {
      setPredicting(true);
      const result = await patternRecognitionService.predictContentPerformance(
        contentType,
        contentTopic,
        targetAudience
      );
      setPrediction(result);
      toast.success('Content prediction completed');
    } catch (error) {
      console.error('Error predicting content performance:', error);
      toast.error('Failed to predict content performance');
    } finally {
      setPredicting(false);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'blog': return <FileText className="w-5 h-5" />;
      case 'email': return <Mail className="w-5 h-5" />;
      case 'social': return <MessageSquare className="w-5 h-5" />;
      case 'ad': return <Target className="w-5 h-5" />;
      case 'landing_page': return <Globe className="w-5 h-5" />;
      case 'presentation': return <PresentationIcon className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getMetricColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    if (value >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case 'timing': return <Calendar className="w-4 h-4" />;
      case 'length': return <Hash className="w-4 h-4" />;
      case 'tone': return <MessageSquare className="w-4 h-4" />;
      case 'channel': return <Globe className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Content Intelligence</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          AI-powered content optimization and performance prediction
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predict">Performance Prediction</TabsTrigger>
          <TabsTrigger value="optimize">Optimization Rules</TabsTrigger>
          <TabsTrigger value="insights">Content Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="predict" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prediction Form */}
            <Card>
              <CardHeader>
                <CardTitle>Content Performance Predictor</CardTitle>
                <CardDescription>
                  Enter content details to predict engagement and conversion rates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select value={contentType} onValueChange={(value: any) => setContentType(value)}>
                    <SelectTrigger id="content-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blog">Blog Post</SelectItem>
                      <SelectItem value="email">Email Campaign</SelectItem>
                      <SelectItem value="social">Social Media Post</SelectItem>
                      <SelectItem value="ad">Advertisement</SelectItem>
                      <SelectItem value="landing_page">Landing Page</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="whitepaper">Whitepaper</SelectItem>
                      <SelectItem value="case_study">Case Study</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="topic">Content Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., AI in Healthcare, Q4 Product Launch"
                    value={contentTopic}
                    onChange={(e) => setContentTopic(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="audience">Target Audience</Label>
                  <Input
                    id="audience"
                    placeholder="e.g., CTOs, Small Business Owners"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="draft">Content Draft (Optional)</Label>
                  <Textarea
                    id="draft"
                    placeholder="Paste your content draft for more accurate predictions..."
                    value={contentDraft}
                    onChange={(e) => setContentDraft(e.target.value)}
                    rows={5}
                  />
                </div>

                <Button 
                  onClick={handlePrediction}
                  disabled={predicting}
                  className="w-full"
                >
                  {predicting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Predict Performance
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Prediction Results */}
            {prediction && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Prediction Results</CardTitle>
                    <CardDescription>
                      Based on pattern analysis and historical data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-1">Engagement</p>
                        <p className={`text-3xl font-bold ${getMetricColor(prediction.predicted_engagement || 0)}`}>
                          {Math.round(prediction.predicted_engagement || 0)}%
                        </p>
                        <Progress 
                          value={prediction.predicted_engagement} 
                          className="mt-2"
                        />
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-1">Conversion</p>
                        <p className={`text-3xl font-bold ${getMetricColor(prediction.predicted_conversion || 0)}`}>
                          {Math.round(prediction.predicted_conversion || 0)}%
                        </p>
                        <Progress 
                          value={prediction.predicted_conversion} 
                          className="mt-2"
                        />
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-1">Reach</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {(prediction.predicted_reach || 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">estimated views</p>
                      </div>
                    </div>

                    {/* Confidence Scores */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm font-medium mb-2">Confidence Levels</p>
                      <div className="space-y-1 text-sm">
                        {Object.entries(prediction.confidence_scores).map(([metric, score]) => (
                          <div key={metric} className="flex justify-between">
                            <span className="capitalize">{metric}</span>
                            <span className="font-medium">{score}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Positive Factors */}
                    {prediction.positive_factors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <ArrowUp className="w-4 h-4 text-green-600" />
                          Positive Factors
                        </p>
                        <div className="space-y-1">
                          {prediction.positive_factors.map((factor, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-600" />
                              {factor}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Negative Factors */}
                    {prediction.negative_factors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <ArrowDown className="w-4 h-4 text-red-600" />
                          Risk Factors
                        </p>
                        <div className="space-y-1">
                          {prediction.negative_factors.map((factor, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                              {factor}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Optimization Suggestions */}
                    {prediction.optimization_suggestions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          Optimization Suggestions
                        </p>
                        <div className="space-y-2">
                          {prediction.optimization_suggestions.map((suggestion, idx) => (
                            <div key={idx} className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-sm">
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="optimize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Content Optimization Rules</CardTitle>
              <CardDescription>
                AI-learned rules that improve content performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {optimizationRules.map((rule, index) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getRuleTypeIcon(rule.rule_type)}
                          <h4 className="font-medium">{rule.rule_name}</h4>
                          {rule.is_active && (
                            <Badge variant="secondary" className="text-xs">Active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {rule.optimization_action}
                        </p>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Expected Improvement</p>
                            <p className="font-medium text-green-600">
                              +{rule.expected_improvement}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Success Rate</p>
                            <p className="font-medium">{rule.success_rate}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Times Applied</p>
                            <p className="font-medium">{rule.times_applied}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Continuous Learning</AlertTitle>
            <AlertDescription>
              These optimization rules are automatically discovered and refined based on your content performance data. 
              The more content you create and track, the more accurate these rules become.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Content Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Best Performing Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Blog Posts</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      85% avg engagement
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Optimal Publishing Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Tuesday 10 AM</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      +35% engagement
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Audience Segment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold">Enterprise CTOs</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      12% conversion rate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Content Performance Trends</CardTitle>
              <CardDescription>
                Key insights from your content analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Rising Topics
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Badge>AI Implementation</Badge>
                  <Badge>Cost Optimization</Badge>
                  <Badge>Remote Work Solutions</Badge>
                  <Badge>Data Privacy</Badge>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  Content Mix Recommendation
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Educational Content</span>
                    <span className="font-medium">40%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Case Studies</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Product Updates</span>
                    <span className="font-medium">20%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Industry News</span>
                    <span className="font-medium">15%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>AI-Powered Content Strategy</AlertTitle>
            <AlertDescription>
              Our AI analyzes engagement patterns, conversion data, and audience behavior to provide 
              personalized content recommendations. The more you use the system, the more accurate 
              predictions become.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}