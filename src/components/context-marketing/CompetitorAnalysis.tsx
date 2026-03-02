// src/components/context-marketing/CompetitorAnalysis.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  RefreshCw,
  FileText,
  Download,
  BarChart3,
  PieChart,
  Shield,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { competitiveContextService, Competitor, CompetitiveAnalysis } from '@/services/context-marketing/competitive-context.service';
import { toast } from 'sonner';

interface CompetitorAnalysisProps {
  competitors: Competitor[];
  onUpdate: () => void;
}

interface SWOTData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface WinLossData {
  overall_competitiveness: number;
  key_battlegrounds: any[];
  competitive_gaps: any[];
  recommendations: string[];
}

export default function CompetitorAnalysis({ competitors, onUpdate }: CompetitorAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [swotAnalysis, setSwotAnalysis] = useState<CompetitiveAnalysis | null>(null);
  const [winLossData, setWinLossData] = useState<WinLossData | null>(null);
  const [activeTab, setActiveTab] = useState('swot');

  useEffect(() => {
    if (competitors.length > 0) {
      loadAnalysis();
    }
  }, [competitors]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      
      const [swot, winLoss] = await Promise.all([
        competitiveContextService.generateSWOT(),
        competitiveContextService.getWinLossAnalysis()
      ]);

      setSwotAnalysis(swot);
      setWinLossData(winLoss);
    } catch (error) {
      console.error('Error loading analysis:', error);
      toast.error('Failed to load competitive analysis');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    toast.info('Report generation coming soon!');
  };

  const getCompetitivenessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getCompetitivenessLabel = (score: number) => {
    if (score >= 80) return 'Market Leader';
    if (score >= 60) return 'Strong Position';
    if (score >= 40) return 'Competitive';
    return 'Needs Improvement';
  };

  // Aggregate SWOT data from all competitors
  const aggregateSWOT = (): SWOTData => {
    const swot: SWOTData = {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: []
    };

    // Our strengths = competitors' weaknesses (opportunities for us)
    // Our weaknesses = areas where multiple competitors are strong
    // Opportunities = market gaps
    // Threats = competitors' strengths

    const strengthFrequency = new Map<string, number>();
    const weaknessFrequency = new Map<string, number>();

    competitors.forEach(comp => {
      comp.strengths.forEach(s => {
        strengthFrequency.set(s, (strengthFrequency.get(s) || 0) + 1);
      });
      comp.weaknesses.forEach(w => {
        weaknessFrequency.set(w, (weaknessFrequency.get(w) || 0) + 1);
      });
    });

    // Common weaknesses among competitors = our opportunities
    weaknessFrequency.forEach((count, weakness) => {
      if (count >= 2) {
        swot.opportunities.push(`Multiple competitors weak in: ${weakness}`);
      }
    });

    // Common strengths among competitors = threats to us
    strengthFrequency.forEach((count, strength) => {
      if (count >= 2) {
        swot.threats.push(`Strong competition in: ${strength}`);
      }
    });

    // Direct competitor analysis
    const directCompetitors = competitors.filter(c => c.company_type === 'direct');
    if (directCompetitors.length > 3) {
      swot.threats.push(`High competitive intensity with ${directCompetitors.length} direct competitors`);
    }

    // Market share analysis
    const totalMarketShare = competitors.reduce((sum, c) => sum + (c.market_share || 0), 0);
    if (totalMarketShare < 60) {
      swot.opportunities.push('Fragmented market with room for growth');
    }

    // Add some generic insights
    swot.strengths.push('Comprehensive competitive intelligence');
    swot.strengths.push('Real-time market monitoring');
    swot.weaknesses.push('Limited historical competitive data');

    return swot;
  };

  const swotData = aggregateSWOT();

  if (competitors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">No competitors to analyze</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add competitors first to generate competitive analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Competitive Analysis</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Strategic insights from {competitors.length} tracked competitors
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAnalysis} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Analysis
          </Button>
          <Button onClick={generateReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overall Competitiveness Score */}
      {winLossData && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Competitive Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-4xl font-bold ${getCompetitivenessColor(winLossData.overall_competitiveness)}`}>
                  {winLossData.overall_competitiveness}%
                </div>
                <Badge variant="secondary" className="mt-2">
                  {getCompetitivenessLabel(winLossData.overall_competitiveness)}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Based on feature comparison across
                </p>
                <p className="text-2xl font-semibold">{competitors.length} competitors</p>
              </div>
            </div>
            <Progress 
              value={winLossData.overall_competitiveness} 
              className="mt-4" 
            />
          </CardContent>
        </Card>
      )}

      {/* Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="swot">SWOT Analysis</TabsTrigger>
          <TabsTrigger value="battlegrounds">Key Battlegrounds</TabsTrigger>
          <TabsTrigger value="gaps">Competitive Gaps</TabsTrigger>
          <TabsTrigger value="insights">Strategic Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="swot" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="w-5 h-5" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {swotData.strengths.map((strength, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-1.5" />
                        <span className="text-sm">{strength}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Weaknesses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <TrendingDown className="w-5 h-5" />
                    Weaknesses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {swotData.weaknesses.map((weakness, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5" />
                        <span className="text-sm">{weakness}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Opportunities */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Target className="w-5 h-5" />
                    Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {swotData.opportunities.map((opportunity, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5" />
                        <span className="text-sm">{opportunity}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Threats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="w-5 h-5" />
                    Threats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {swotData.threats.map((threat, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5" />
                        <span className="text-sm">{threat}</span>
                      </motion.li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="battlegrounds" className="space-y-4">
          {winLossData && winLossData.key_battlegrounds.length > 0 ? (
            <div className="grid gap-4">
              {winLossData.key_battlegrounds.map((battleground, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{battleground.feature}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Importance: {battleground.importance}/5
                          </Badge>
                          <Badge 
                            variant={
                              battleground.status === 'winning' ? 'default' : 
                              battleground.status === 'competitive' ? 'secondary' : 
                              'destructive'
                            }
                          >
                            {battleground.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Our Score</span>
                          <span className="font-semibold">{battleground.our_score}/10</span>
                        </div>
                        <Progress value={battleground.our_score * 10} />
                        
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span>Competitor Average</span>
                          <span className="font-semibold">{battleground.competitor_average.toFixed(1)}/10</span>
                        </div>
                        <Progress 
                          value={battleground.competitor_average * 10} 
                          className="bg-gray-200"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Add feature comparisons to identify key battlegrounds
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          {winLossData && winLossData.competitive_gaps.length > 0 ? (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Competitive Gaps Identified</AlertTitle>
                <AlertDescription>
                  Areas where competitors have significant advantages
                </AlertDescription>
              </Alert>

              {winLossData.competitive_gaps.map((gap, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{gap.feature}</h4>
                        <Badge variant="destructive">
                          Gap: {gap.gap} points
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {gap.leader} leads in this area
                      </p>
                      <Progress 
                        value={100 - (gap.gap * 10)} 
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">No significant gaps identified</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You're competitive across all tracked features
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Insights & Recommendations</CardTitle>
              <CardDescription>
                AI-generated insights based on competitive analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Market Insights */}
                {swotAnalysis?.insights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  >
                    <PieChart className="w-5 h-5 text-blue-600 mt-0.5" />
                    <span className="text-sm">{insight}</span>
                  </motion.div>
                ))}

                {/* Recommendations */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Recommended Actions</h4>
                  {winLossData?.recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-2 mb-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mt-0.5">
                        <span className="text-xs font-semibold text-green-600">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-sm">{rec}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}