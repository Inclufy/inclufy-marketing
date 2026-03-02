// src/components/context-marketing/PositioningMatrix.tsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Info } from 'lucide-react';
import { competitiveContextService, Competitor } from '@/services/context-marketing/competitive-context.service';
import { toast } from 'sonner';

interface PositioningMatrixProps {
  competitors: Competitor[];
  simplified?: boolean;
}

interface Position {
  competitor_id: string;
  name: string;
  x: number; // 0-100 scale
  y: number; // 0-100 scale
  size: number; // market share or relative size
  type: string;
}

export default function PositioningMatrix({ competitors, simplified = false }: PositioningMatrixProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredCompetitor, setHoveredCompetitor] = useState<string | null>(null);

  useEffect(() => {
    if (competitors.length > 0) {
      generatePositions();
    }
  }, [competitors]);

  const generatePositions = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would call the service to get positioning data
      // For now, we'll generate mock positions based on competitor data
      const newPositions: Position[] = competitors.map(competitor => {
        // Calculate positions based on available data
        const priceScore = getPriceScore(competitor);
        const featureScore = getFeatureScore(competitor);
        
        return {
          competitor_id: competitor.id,
          name: competitor.competitor_name,
          x: priceScore,
          y: featureScore,
          size: competitor.market_share || 10,
          type: competitor.company_type
        };
      });

      // Add our company
      newPositions.push({
        competitor_id: 'our-company',
        name: 'Our Company',
        x: 65, // Positioned as premium with good features
        y: 75,
        size: 20,
        type: 'self'
      });

      setPositions(newPositions);
    } catch (error) {
      console.error('Error generating positions:', error);
      toast.error('Failed to generate positioning matrix');
    } finally {
      setLoading(false);
    }
  };

  const getPriceScore = (competitor: Competitor): number => {
    const strategies: { [key: string]: number } = {
      'premium': 80 + Math.random() * 20,
      'competitive': 40 + Math.random() * 20,
      'budget': 10 + Math.random() * 20,
      'freemium': 20 + Math.random() * 20
    };
    return strategies[competitor.pricing_strategy || 'competitive'] || 50;
  };

  const getFeatureScore = (competitor: Competitor): number => {
    // Base score on strengths count and other factors
    const strengthScore = Math.min(competitor.strengths.length * 10, 40);
    const sizeBonus = competitor.employee_count ? Math.min(competitor.employee_count / 100, 20) : 0;
    const ageBonus = competitor.founding_year 
      ? Math.min((new Date().getFullYear() - competitor.founding_year) / 2, 20) 
      : 0;
    
    return Math.min(30 + strengthScore + sizeBonus + ageBonus + Math.random() * 20, 100);
  };

  const getCompetitorColor = (type: string): string => {
    switch (type) {
      case 'self': return '#8b5cf6'; // Purple for our company
      case 'direct': return '#ef4444'; // Red for direct competitors
      case 'indirect': return '#f59e0b'; // Orange for indirect
      case 'potential': return '#3b82f6'; // Blue for potential
      case 'substitute': return '#10b981'; // Green for substitute
      default: return '#6b7280'; // Gray for unknown
    }
  };

  const getQuadrantLabel = (x: number, y: number): string => {
    if (x > 50 && y > 50) return 'Premium Leaders';
    if (x <= 50 && y > 50) return 'Value Leaders';
    if (x > 50 && y <= 50) return 'Niche Players';
    return 'Budget Options';
  };

  const getQuadrantDescription = (quadrant: string): string => {
    switch (quadrant) {
      case 'Premium Leaders': return 'High features, high price - Market leaders';
      case 'Value Leaders': return 'High features, low price - Disruptors';
      case 'Niche Players': return 'Low features, high price - Specialized';
      case 'Budget Options': return 'Low features, low price - Entry level';
      default: return '';
    }
  };

  if (competitors.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">Add competitors to see positioning matrix</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={simplified ? '' : 'h-full'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Competitive Positioning Matrix</CardTitle>
            {!simplified && (
              <CardDescription>
                Market position based on features vs. price
              </CardDescription>
            )}
          </div>
          {!simplified && (
            <Button size="sm" variant="outline" onClick={generatePositions} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className={simplified ? 'h-64' : 'h-96'} style={{ position: 'relative' }}>
          {/* SVG Chart */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full"
            style={{ transform: 'scaleY(-1)' }}
          >
            {/* Grid lines */}
            <line x1="50" y1="0" x2="50" y2="100" stroke="#e5e7eb" strokeWidth="0.5" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" />
            
            {/* Quadrant backgrounds */}
            <rect x="0" y="0" width="50" height="50" fill="#fef3c7" opacity="0.1" />
            <rect x="50" y="0" width="50" height="50" fill="#fee2e2" opacity="0.1" />
            <rect x="0" y="50" width="50" height="50" fill="#d1fae5" opacity="0.1" />
            <rect x="50" y="50" width="50" height="50" fill="#ddd6fe" opacity="0.1" />
            
            {/* Data points */}
            {positions.map((position, index) => (
              <motion.g
                key={position.competitor_id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={Math.sqrt(position.size) * (simplified ? 1.5 : 2)}
                  fill={getCompetitorColor(position.type)}
                  fillOpacity={0.6}
                  stroke={getCompetitorColor(position.type)}
                  strokeWidth="1"
                  className="cursor-pointer transition-opacity hover:opacity-100"
                  onMouseEnter={() => setHoveredCompetitor(position.competitor_id)}
                  onMouseLeave={() => setHoveredCompetitor(null)}
                />
                {position.type === 'self' && (
                  <text
                    x={position.x}
                    y={position.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={simplified ? "8" : "10"}
                    fontWeight="bold"
                    style={{ transform: 'scaleY(-1)', transformOrigin: `${position.x}px ${position.y}px` }}
                  >
                    You
                  </text>
                )}
              </motion.g>
            ))}
          </svg>

          {/* Axis labels */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 dark:text-gray-400">
            Price Competitiveness →
          </div>
          <div 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-gray-600 dark:text-gray-400"
            style={{ transformOrigin: 'center' }}
          >
            Feature Richness →
          </div>

          {/* Quadrant labels */}
          {!simplified && (
            <>
              <div className="absolute top-2 left-2 text-xs text-gray-600 dark:text-gray-400">
                Budget Options
              </div>
              <div className="absolute top-2 right-2 text-xs text-gray-600 dark:text-gray-400">
                Niche Players
              </div>
              <div className="absolute bottom-2 left-2 text-xs text-gray-600 dark:text-gray-400">
                Value Leaders
              </div>
              <div className="absolute bottom-2 right-2 text-xs text-gray-600 dark:text-gray-400">
                Premium Leaders
              </div>
            </>
          )}

          {/* Hover tooltip */}
          {hoveredCompetitor && !simplified && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 p-2 rounded shadow-lg z-10">
              <p className="text-sm font-medium">
                {positions.find(p => p.competitor_id === hoveredCompetitor)?.name}
              </p>
              {hoveredCompetitor !== 'our-company' && (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Type: {positions.find(p => p.competitor_id === hoveredCompetitor)?.type}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Market Share: {positions.find(p => p.competitor_id === hoveredCompetitor)?.size}%
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
              <span>Our Company</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
              <span>Direct</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
              <span>Indirect</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
              <span>Potential</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }} />
              <span>Substitute</span>
            </div>
          </div>

          {!simplified && (
            <div className="flex items-start gap-1 mt-2">
              <Info className="w-4 h-4 text-gray-400 mt-0.5" />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Circle size represents market share. Position shows price vs. features balance.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}