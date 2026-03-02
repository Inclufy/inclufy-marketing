// components/context-marketing/CompetitiveDashboard.tsx
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  competitiveContextService,
  type Competitor,
  type CompetitiveAnalysis,
} from '@/services/context-marketing/competitive-context.service';
import CompetitorCard from './CompetitorCard';
import PositioningMatrix from './PositioningMatrix';
import FeatureComparison from './FeatureComparison';
import CompetitiveAlerts from './CompetitiveAlerts';

export default function CompetitiveDashboard() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [analysis, setAnalysis] = useState<CompetitiveAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetitiveData();
  }, []);

  const loadCompetitiveData = async () => {
    try {
      const [competitorList, swotAnalysis, positioning] = await Promise.all([
        competitiveContextService.getCompetitors(),
        competitiveContextService.generateSWOT(),
        competitiveContextService.createPositioningMatrix()
      ]);

      setCompetitors(competitorList);
      setAnalysis({ swot: swotAnalysis, positioning });
    } catch (error) {
      console.error('Error loading competitive data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {competitors.map(competitor => (
          <CompetitorCard key={competitor.id} competitor={competitor} />
        ))}
      </div>

      <PositioningMatrix data={analysis?.positioning} />
      <FeatureComparison competitors={competitors} />
      <CompetitiveAlerts />
    </div>
  );
}