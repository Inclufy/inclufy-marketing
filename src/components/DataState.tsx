// src/components/DataState.tsx
// Reusable loading, error, and empty state components

import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Loading Skeleton ────────────────────────────────────────────────

interface LoadingSkeletonProps {
  cards?: number;
  className?: string;
}

export function LoadingSkeleton({ cards = 4, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-3">
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-8 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-[200px] bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Inline Loading ──────────────────────────────────────────────────

export function LoadingSpinner({ className = '' }: { className?: string }) {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">
          {nl ? 'Laden...' : fr ? 'Chargement...' : 'Loading...'}
        </p>
      </div>
    </div>
  );
}

// ─── Error State ─────────────────────────────────────────────────────

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className = '' }: ErrorStateProps) {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">
            {nl ? 'Er ging iets mis' : fr ? 'Quelque chose a mal tourné' : 'Something went wrong'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {message || (nl
              ? 'De data kon niet worden geladen. Probeer het opnieuw.'
              : fr
              ? 'Les données n\'ont pas pu être chargées. Réessayez.'
              : 'Data could not be loaded. Please try again.')}
          </p>
        </div>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            {nl ? 'Opnieuw proberen' : fr ? 'Réessayer' : 'Try again'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">
            {title || (nl ? 'Nog geen data' : fr ? 'Pas encore de données' : 'No data yet')}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {description || (nl
              ? 'Begin met het aanmaken van content om hier resultaten te zien.'
              : fr
              ? 'Commencez à créer du contenu pour voir les résultats ici.'
              : 'Start creating content to see results here.')}
          </p>
        </div>
        {action && (
          <Button onClick={action.onClick} size="sm">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
