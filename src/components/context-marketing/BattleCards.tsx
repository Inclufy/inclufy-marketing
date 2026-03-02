// src/components/context-marketing/BattleCards.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sword,
  Shield,
  Target,
  TrendingUp,
  AlertCircle,
  Download,
  Eye,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  DollarSign,
  Calendar,
  Zap,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { competitiveContextService, Competitor } from '@/services/context-marketing/competitive-context.service';
import { toast } from 'sonner';

interface BattleCardsProps {
  competitors: Competitor[];
  onUpdate: () => void;
}

interface BattleCard {
  competitor: string;
  updated: string;
  summary: {
    type: string;
    market_share?: number;
    employees?: number;
    founded?: number;
  };
  our_advantages: string[];
  their_advantages: string[];
  win_strategies: string[];
  objection_handling: { objection: string; response: string }[];
  key_differentiators: string[];
}

export default function BattleCards({ competitors, onUpdate }: BattleCardsProps) {
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [battleCard, setBattleCard] = useState<BattleCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('advantages');

  const generateBattleCard = async (competitor: Competitor) => {
    try {
      setLoading(true);
      setSelectedCompetitor(competitor);
      
      const card = await competitiveContextService.generateBattleCard(competitor.id);
      setBattleCard(card);
    } catch (error) {
      console.error('Error generating battle card:', error);
      toast.error('Failed to generate battle card');
    } finally {
      setLoading(false);
    }
  };

  const exportBattleCard = () => {
    if (!battleCard) return;
    
    // In a real implementation, this would generate a PDF or document
    toast.info('Export feature coming soon!');
  };

  const getCompetitorTypeIcon = (type: string) => {
    switch (type) {
      case 'direct': return '🎯';
      case 'indirect': return '🔄';
      case 'potential': return '🔮';
      case 'substitute': return '🔀';
      default: return '📊';
    }
  };

  const directCompetitors = competitors.filter(c => c.company_type === 'direct');
  const otherCompetitors = competitors.filter(c => c.company_type !== 'direct');

  if (competitors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sword className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">No competitors to create battle cards</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add competitors first to generate competitive battle cards
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Competitive Battle Cards</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Sales enablement tools to win against competitors
        </p>
      </div>

      {/* Competitor Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Competitor List */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Competitor</CardTitle>
              <CardDescription>
                Choose a competitor to generate battle card
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* Direct Competitors */}
              {directCompetitors.length > 0 && (
                <>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Direct Competitors
                  </p>
                  {directCompetitors.map(competitor => (
                    <motion.button
                      key={competitor.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => generateBattleCard(competitor)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedCompetitor?.id === competitor.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCompetitorTypeIcon(competitor.company_type)}</span>
                          <div>
                            <p className="font-medium">{competitor.competitor_name}</p>
                            {competitor.market_share && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {competitor.market_share}% market share
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          Direct
                        </Badge>
                      </div>
                    </motion.button>
                  ))}
                </>
              )}

              {/* Other Competitors */}
              {otherCompetitors.length > 0 && (
                <>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 mt-4">
                    Other Competitors
                  </p>
                  {otherCompetitors.map(competitor => (
                    <motion.button
                      key={competitor.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => generateBattleCard(competitor)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedCompetitor?.id === competitor.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCompetitorTypeIcon(competitor.company_type)}</span>
                          <div>
                            <p className="font-medium">{competitor.competitor_name}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {competitor.company_type}
                        </Badge>
                      </div>
                    </motion.button>
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Battle Card Display */}
        <div className="lg:col-span-2">
          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Generating battle card...</p>
              </CardContent>
            </Card>
          ) : battleCard ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Sword className="w-5 h-5" />
                        Battle Card: {battleCard.competitor}
                      </CardTitle>
                      <CardDescription>
                        Updated {new Date(battleCard.updated).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button onClick={exportBattleCard} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Company Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {battleCard.summary.market_share && (
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <TrendingUp className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                        <p className="text-2xl font-bold">{battleCard.summary.market_share}%</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Market Share</p>
                      </div>
                    )}
                    {battleCard.summary.employees && (
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Users className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                        <p className="text-2xl font-bold">{battleCard.summary.employees}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Employees</p>
                      </div>
                    )}
                    {battleCard.summary.founded && (
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Calendar className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                        <p className="text-2xl font-bold">{battleCard.summary.founded}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Founded</p>
                      </div>
                    )}
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Building2 className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                      <p className="text-lg font-bold capitalize">{battleCard.summary.type}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Competitor</p>
                    </div>
                  </div>

                  {/* Battle Card Sections */}
                  <div className="space-y-4">
                    {/* Our Advantages */}
                    <Collapsible 
                      open={expandedSection === 'advantages'}
                      onOpenChange={() => setExpandedSection(expandedSection === 'advantages' ? '' : 'advantages')}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <Shield className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold">Our Advantages</h4>
                            <Badge variant="secondary">{battleCard.our_advantages.length}</Badge>
                          </div>
                          {expandedSection === 'advantages' ? <ChevronUp /> : <ChevronDown />}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pt-2">
                        <ul className="space-y-2">
                          {battleCard.our_advantages.map((advantage, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start gap-2"
                            >
                              <Zap className="w-4 h-4 text-green-600 mt-0.5" />
                              <span className="text-sm">{advantage}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Their Advantages */}
                    <Collapsible 
                      open={expandedSection === 'their_advantages'}
                      onOpenChange={() => setExpandedSection(expandedSection === 'their_advantages' ? '' : 'their_advantages')}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <h4 className="font-semibold">Their Advantages</h4>
                            <Badge variant="secondary">{battleCard.their_advantages.length}</Badge>
                          </div>
                          {expandedSection === 'their_advantages' ? <ChevronUp /> : <ChevronDown />}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pt-2">
                        <ul className="space-y-2">
                          {battleCard.their_advantages.map((advantage, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start gap-2"
                            >
                              <X className="w-4 h-4 text-red-600 mt-0.5" />
                              <span className="text-sm">{advantage}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Win Strategies */}
                    <Collapsible 
                      open={expandedSection === 'strategies'}
                      onOpenChange={() => setExpandedSection(expandedSection === 'strategies' ? '' : 'strategies')}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <Target className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold">Winning Strategies</h4>
                            <Badge variant="secondary">{battleCard.win_strategies.length}</Badge>
                          </div>
                          {expandedSection === 'strategies' ? <ChevronUp /> : <ChevronDown />}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pt-2">
                        <ul className="space-y-2">
                          {battleCard.win_strategies.map((strategy, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start gap-2"
                            >
                              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mt-0.5">
                                <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                              </div>
                              <span className="text-sm">{strategy}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Objection Handling */}
                    <Collapsible 
                      open={expandedSection === 'objections'}
                      onOpenChange={() => setExpandedSection(expandedSection === 'objections' ? '' : 'objections')}
                    >
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <Sword className="w-5 h-5 text-purple-600" />
                            <h4 className="font-semibold">Objection Handling</h4>
                            <Badge variant="secondary">{battleCard.objection_handling.length}</Badge>
                          </div>
                          {expandedSection === 'objections' ? <ChevronUp /> : <ChevronDown />}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pt-2 space-y-3">
                        {battleCard.objection_handling.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-3 bg-white dark:bg-gray-800 rounded-lg border"
                          >
                            <p className="font-medium text-sm mb-2">
                              <span className="text-purple-600">Objection:</span> {item.objection}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium text-gray-900 dark:text-gray-100">Response:</span> {item.response}
                            </p>
                          </motion.div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  {/* Key Differentiators */}
                  {battleCard.key_differentiators.length > 0 && (
                    <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-900/20">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <AlertTitle>Key Differentiators</AlertTitle>
                      <AlertDescription>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {battleCard.key_differentiators.map((diff, index) => (
                            <Badge key={index} variant="secondary">
                              {diff}
                            </Badge>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Select a competitor</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose a competitor from the list to generate a battle card
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}