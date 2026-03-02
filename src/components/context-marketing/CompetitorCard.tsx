import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp } from 'lucide-react';

interface CompetitorCardProps {
  competitor: {
    id: string;
    competitor_name: string;
    company_type: string;
    market_share?: number;
    website_url?: string;
    strengths?: any[];
    weaknesses?: any[];
  };
}

export default function CompetitorCard({ competitor }: CompetitorCardProps) {
  const typeColors: Record<string, string> = {
    direct: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    indirect: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    potential: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    substitute: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          {competitor.competitor_name}
        </CardTitle>
        <Badge className={typeColors[competitor.company_type] || ''} variant="secondary">
          {competitor.company_type}
        </Badge>
      </CardHeader>
      <CardContent>
        {competitor.market_share !== undefined && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>{competitor.market_share}% market share</span>
          </div>
        )}
        {competitor.website_url && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {competitor.website_url}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
