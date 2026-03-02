// src/components/GrowthBlueprintReport.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Building2, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Lightbulb,
  Users,
  Globe,
  BarChart3,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Newspaper,
  Award,
  Calendar,
  DollarSign
} from 'lucide-react';

interface GrowthBlueprintReportProps {
  data: any; // We'll type this properly
}

export function GrowthBlueprintReport({ data }: GrowthBlueprintReportProps) {
  const { blueprint, status_quo, vision, budget_capacity, endgame, recommendations, opportunities, threats } = data;

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'bg-green-100 dark:bg-green-900/20';
    if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      critical: 'Kritiek',
      high: 'Hoog',
      medium: 'Gemiddeld',
      low: 'Laag'
    };
    return labels[priority] || priority;
  };

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER - Overall Score */}
      <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{blueprint.company_name}</h1>
              <p className="text-lg text-muted-foreground">{blueprint.industry}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="w-4 h-4" />
                <span>{blueprint.website_url}</span>
              </div>
            </div>
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(blueprint.overall_score)}`}>
                {blueprint.overall_score}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Marketing Health Index</div>
              <Badge variant="secondary" className="mt-2">
                Groei Realiteit: {blueprint.growth_reality_score}/100
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DIGITAL PRESENCE SCORES */}
      {status_quo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Digitale Aanwezigheid
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Website Kwaliteit', score: status_quo.website_score, icon: Globe },
              { label: 'SEO Prestaties', score: status_quo.seo_score, icon: TrendingUp },
              { label: 'Content Kwaliteit', score: status_quo.content_score, icon: Newspaper },
              { label: 'Social Media', score: status_quo.social_score, icon: Users },
              { label: 'Merk Consistentie', score: status_quo.brand_consistency_score, icon: Award }
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span className={`font-bold ${getScoreColor(item.score)}`}>
                    {item.score}/100
                  </span>
                </div>
                <Progress value={item.score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* COMPANY PROFILE */}
      {status_quo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Bedrijfsprofiel & Status Quo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Market Position */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Marktpositie
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${getScoreBgColor(status_quo.market_position_percentile)}`}>
                  <div className="text-sm text-muted-foreground">Positie in Markt</div>
                  <div className="text-2xl font-bold">#{status_quo.market_position}</div>
                </div>
                <div className={`p-4 rounded-lg ${getScoreBgColor(status_quo.market_position_percentile)}`}>
                  <div className="text-sm text-muted-foreground">Percentiel</div>
                  <div className="text-2xl font-bold">{status_quo.market_position_percentile}e</div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Strengths */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Sterktes
              </h3>
              <ul className="space-y-2">
                {status_quo.strengths?.map((strength: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Star className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* FOUNDERS SECTION */}
{status_quo.founders && status_quo.founders.length > 0 && (
  <>
    <Separator />
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Users className="w-4 h-4 text-purple-600" />
        Oprichters & Team
      </h3>
      <div className="grid gap-4">
        {status_quo.founders.map((founder: any, idx: number) => (
          <div key={idx} className="p-4 rounded-lg border bg-card">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{founder.name}</h4>
                <p className="text-sm text-muted-foreground">{founder.role}</p>
                {founder.bio && (
                  <p className="text-sm mt-2">{founder.bio}</p>
                )}
              </div>
              {founder.linkedin && (
                <a 
                  href={founder.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  LinkedIn →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
      {status_quo.founding_year && (
        <p className="text-sm text-muted-foreground mt-2">
          Opgericht in {status_quo.founding_year}
        </p>
      )}
    </div>
  </>
)}

{/* MEDIA PRESENCE SECTION */}
{status_quo.media_mentions && status_quo.media_mentions.length > 0 && (
  <>
    <Separator />
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Newspaper className="w-4 h-4 text-purple-600" />
        Media Aanwezigheid
      </h3>
      
      {status_quo.media_presence_score && (
        <div className={`p-4 rounded-lg mb-4 ${getScoreBgColor(status_quo.media_presence_score)}`}>
          <div className="flex items-center justify-between">
            <span className="font-medium">Media Zichtbaarheid Score</span>
            <span className={`text-2xl font-bold ${getScoreColor(status_quo.media_presence_score)}`}>
              {status_quo.media_presence_score}/100
            </span>
          </div>
          <Progress value={status_quo.media_presence_score} className="h-2 mt-2" />
        </div>
      )}
      
      <div className="space-y-3">
        {status_quo.media_mentions.map((mention: any, idx: number) => (
          <div key={idx} className="p-3 rounded-lg border bg-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{mention.source}</Badge>
                  {mention.sentiment === 'positive' && (
                    <Badge variant="default" className="bg-green-600">
                      Positief
                    </Badge>
                  )}
                </div>
                <h4 className="font-medium text-sm">{mention.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(mention.date).toLocaleDateString('nl-NL')}
                </p>
              </div>
              {mention.url && (
                <a 
                  href={mention.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline text-xs"
                >
                  Lees meer →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
)}

            <Separator />

            {/* Weaknesses */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
                <XCircle className="w-4 h-4" />
                Zwaktes
              </h3>
              <ul className="space-y-2">
                {status_quo.weaknesses?.map((weakness: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Limitations */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-600">
                <Shield className="w-4 h-4" />
                Huidige Beperkingen
              </h3>
              <ul className="space-y-2">
                {status_quo.current_limitations?.map((limitation: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <span>{limitation}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Growth Accelerators */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-blue-600">
                <Zap className="w-4 h-4" />
                Groei Accelerators
              </h3>
              <ul className="space-y-2">
                {status_quo.growth_accelerators?.map((accelerator: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Zap className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>{accelerator}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VISION & AMBITION */}
      {vision && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Visie & Ambitie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mission */}
            {vision.stated_mission && (
              <div>
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Missie</h3>
                <p className="text-lg italic">&quot;{vision.stated_mission}&quot;</p>
              </div>
            )}

            {/* Vision */}
            {vision.extracted_vision && (
              <div>
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Langetermijn Visie</h3>
                <p className="text-lg">{vision.extracted_vision}</p>
              </div>
            )}

            <Separator />

            {/* Gap Analysis */}
            {vision.gap_analysis && vision.gap_analysis.length > 0 && (
              <div>
                <h3 className="font-semibold mb-4">Gap Analyse: Huidige vs Doel Positie</h3>
                <div className="space-y-4">
                  {vision.gap_analysis.map((gap: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{gap.area}</span>
                        <Badge variant="outline">{gap.gap_percentage}% gap</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Nu: {gap.current}</span>
                        <ArrowRight className="w-4 h-4" />
                        <span className="font-medium">Doel: {gap.target}</span>
                      </div>
                      <Progress value={100 - gap.gap_percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Ambition Scores */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${getScoreBgColor(vision.reality_alignment_score)}`}>
                <div className="text-sm text-muted-foreground mb-1">Realiteitscheck</div>
                <div className="text-2xl font-bold">{vision.reality_alignment_score}/100</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Hoe realistisch je doelen zijn
                </div>
              </div>
              <div className={`p-4 rounded-lg ${getScoreBgColor(100 - vision.ambition_risk_score)}`}>
                <div className="text-sm text-muted-foreground mb-1">Ambitie Risico</div>
                <div className="text-2xl font-bold">{vision.ambition_risk_score}/100</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Risico niveau van ambities
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* RECOMMENDATIONS */}
      {recommendations && recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-purple-600" />
              AI Aanbevelingen ({recommendations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.map((rec: any) => (
                <Card key={rec.id} className="border-l-4" style={{
                  borderLeftColor: rec.priority === 'critical' ? '#ef4444' :
                                   rec.priority === 'high' ? '#f59e0b' :
                                   rec.priority === 'medium' ? '#3b82f6' : '#6b7280'
                }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getPriorityColor(rec.priority)}>
                            {getPriorityLabel(rec.priority)}
                          </Badge>
                          <Badge variant="outline">{rec.category}</Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{rec.title}</h3>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-2xl font-bold text-purple-600">{rec.impact_score}</div>
                        <div className="text-xs text-muted-foreground">Impact</div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-orange-500" />
                        <span>Inspanning: {rec.effort_score}/10</span>
                      </div>
                      {rec.estimated_timeline_days && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span>{rec.estimated_timeline_days} dagen</span>
                        </div>
                      )}
                    </div>

                    {/* Impact vs Effort Visualization */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-muted-foreground mb-1">Impact</div>
                          <Progress value={rec.impact_score * 10} className="h-1.5" />
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Inspanning</div>
                          <Progress value={rec.effort_score * 10} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* OPPORTUNITIES */}
      {opportunities && opportunities.length > 0 && (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <TrendingUp className="w-5 h-5" />
              Kansen ({opportunities.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunities.map((opp: any) => (
                <div key={opp.id} className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="outline" className="mb-2">{opp.type}</Badge>
                      <h3 className="font-semibold">{opp.title}</h3>
                    </div>
                    {opp.potential_value && (
                      <div className="flex items-center gap-1 text-green-600 font-semibold">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">{opp.potential_value}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{opp.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* THREATS */}
      {threats && threats.length > 0 && (
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Bedreigingen & Risico&apos;s ({threats.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {threats.map((threat: any) => (
                <div key={threat.id} className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <Badge variant="destructive" className="mb-2">
                        {threat.severity === 'critical' ? 'Kritiek' :
                         threat.severity === 'high' ? 'Hoog' :
                         threat.severity === 'medium' ? 'Gemiddeld' : 'Laag'}
                      </Badge>
                      <h3 className="font-semibold">{threat.title}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{threat.description}</p>
                  {threat.mitigation_strategy && (
                    <div className="pt-3 border-t border-red-200 dark:border-red-800">
                      <div className="flex items-start gap-2">
                        <Shield className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-red-600 mb-1">Mitigatie Strategie</div>
                          <p className="text-sm">{threat.mitigation_strategy}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SUMMARY CTA */}
      <Card className="bg-gradient-to-br from-purple-600 to-pink-600 text-white border-0">
        <CardContent className="pt-6 text-center">
          <h2 className="text-2xl font-bold mb-2">Volgende Stappen</h2>
          <p className="text-purple-100 mb-4">
            Dit Growth Blueprint geeft je een duidelijk pad naar groei. Begin met de kritieke aanbevelingen 
            om binnen 60-90 dagen eerste resultaten te zien.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Blueprint gegenereerd op {new Date(blueprint.created_at).toLocaleDateString('nl-NL')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
