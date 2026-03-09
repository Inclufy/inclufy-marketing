// src/pages/JourneyDashboard.tsx
// Journey dashboard — list all journeys with management features

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useJourneys, useActivateJourney, usePauseJourney } from '@/hooks/queries/useJourneys';
import { LoadingSpinner, ErrorState, EmptyState } from '@/components/DataState';
import { useToast } from '@/components/ui/use-toast';
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Pencil,
  Users,
  CalendarDays,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────

interface JourneyItem {
  id: string;
  name: string;
  description: string | null;
  status: string;
  enrollment_count: number;
  created_at: string;
}

// ─── Seed data when API returns empty ───────────────────────────────

const SEED_JOURNEYS: JourneyItem[] = [
  { id: 'j1', name: 'Welcome Email Series', status: 'active', description: 'Onboard new subscribers with a 5-email welcome sequence', enrollment_count: 142, created_at: new Date(Date.now() - 14 * 86400000).toISOString() },
  { id: 'j2', name: 'Cart Abandonment Recovery', status: 'active', description: 'Re-engage customers who left items in their cart', enrollment_count: 89, created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'j3', name: 'Product Launch Campaign', status: 'draft', description: 'Multi-channel launch sequence for new products', enrollment_count: 0, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'j4', name: 'Customer Re-engagement', status: 'paused', description: 'Win back inactive customers with personalized offers', enrollment_count: 56, created_at: new Date(Date.now() - 21 * 86400000).toISOString() },
];

// ─── Status helpers ─────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { variant: 'success' | 'warning' | 'secondary' | 'outline'; label: Record<string, string> }> = {
  active: {
    variant: 'success',
    label: { nl: 'Actief', fr: 'Actif', en: 'Active' },
  },
  paused: {
    variant: 'warning',
    label: { nl: 'Gepauzeerd', fr: 'En Pause', en: 'Paused' },
  },
  draft: {
    variant: 'secondary',
    label: { nl: 'Concept', fr: 'Brouillon', en: 'Draft' },
  },
  archived: {
    variant: 'outline',
    label: { nl: 'Gearchiveerd', fr: 'Archivé', en: 'Archived' },
  },
};

// ─── Component ──────────────────────────────────────────────────────

export default function JourneyDashboard() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';
  const langKey = nl ? 'nl' : fr ? 'fr' : 'en';
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('all');

  // Fetch journeys from API
  const { data: journeyData, isLoading, isError, refetch } = useJourneys();
  const activateJourney = useActivateJourney();
  const pauseJourney = usePauseJourney();

  const apiJourneys: JourneyItem[] = (journeyData || []).map((j) => ({
    id: j.id,
    name: j.name,
    description: j.description,
    status: j.status || 'draft',
    enrollment_count: j.enrollment_count ?? 0,
    created_at: j.created_at,
  }));

  const journeys = apiJourneys.length > 0 ? apiJourneys : SEED_JOURNEYS;

  // Filter by status
  const activeJourneys = journeys.filter(j => j.status === 'active');
  const pausedJourneys = journeys.filter(j => j.status === 'paused');
  const draftJourneys = journeys.filter(j => j.status === 'draft');

  const filteredJourneys =
    activeTab === 'active' ? activeJourneys
    : activeTab === 'paused' ? pausedJourneys
    : activeTab === 'draft' ? draftJourneys
    : journeys;

  // Actions
  const handleActivate = async (id: string) => {
    try {
      await activateJourney.mutateAsync(id);
      toast({
        title: nl ? 'Journey geactiveerd' : fr ? 'Parcours activé' : 'Journey activated',
        description: nl
          ? 'De journey is nu actief en ontvangt contacten.'
          : fr ? 'Le parcours est maintenant actif et reçoit des contacts.'
          : 'The journey is now active and enrolling contacts.',
      });
    } catch {
      toast({
        title: nl ? 'Fout' : fr ? 'Erreur' : 'Error',
        description: nl ? 'Kon journey niet activeren' : fr ? 'Impossible d\'activer le parcours' : 'Could not activate journey',
        variant: 'destructive',
      });
    }
  };

  const handlePause = async (id: string) => {
    try {
      await pauseJourney.mutateAsync(id);
      toast({
        title: nl ? 'Journey gepauzeerd' : fr ? 'Parcours en pause' : 'Journey paused',
        description: nl
          ? 'De journey is gepauzeerd. Geen nieuwe contacten worden ingeschreven.'
          : fr ? 'Le parcours est en pause. Aucun nouveau contact ne sera inscrit.'
          : 'The journey is paused. No new contacts will be enrolled.',
      });
    } catch {
      toast({
        title: nl ? 'Fout' : fr ? 'Erreur' : 'Error',
        description: nl ? 'Kon journey niet pauzeren' : fr ? 'Impossible de mettre en pause le parcours' : 'Could not pause journey',
        variant: 'destructive',
      });
    }
  };

  const renderJourneyCard = (journey: JourneyItem) => {
    const config = STATUS_CONFIG[journey.status] || STATUS_CONFIG.draft;

    return (
      <Card key={journey.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{journey.name}</h4>
                <Badge variant={config.variant} className="text-[10px] shrink-0">
                  {config.label[langKey]}
                </Badge>
              </div>
              {journey.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {journey.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {journey.enrollment_count} {nl ? 'ingeschreven' : fr ? 'inscrits' : 'enrolled'}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  {new Date(journey.created_at).toLocaleDateString(
                    nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-US',
                    { day: 'numeric', month: 'short', year: 'numeric' }
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 ml-2 shrink-0">
              {/* Activate button — shown for draft and paused */}
              {(journey.status === 'draft' || journey.status === 'paused') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => handleActivate(journey.id)}
                  disabled={activateJourney.isPending}
                  title={nl ? 'Activeren' : fr ? 'Activer' : 'Activate'}
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}

              {/* Pause button — shown for active */}
              {journey.status === 'active' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                  onClick={() => handlePause(journey.id)}
                  disabled={pauseJourney.isPending}
                  title={nl ? 'Pauzeren' : fr ? 'Mettre en Pause' : 'Pause'}
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}

              {/* Edit button — always shown */}
              <Button
                variant="ghost"
                size="sm"
                asChild
                title={nl ? 'Bewerken' : fr ? 'Modifier' : 'Edit'}
              >
                <Link to={`/app/journey-builder?id=${journey.id}`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Workflow className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">
              {nl ? 'Journey Builder' : fr ? 'Constructeur de Parcours' : 'Journey Builder'}
            </h1>
            <p className="text-muted-foreground">
              {nl
                ? 'Beheer en automatiseer klantreizen'
                : fr ? 'Gérez et automatisez les parcours clients'
                : 'Manage and automate customer journeys'}
            </p>
          </div>
        </div>

        <Button asChild>
          <Link to="/app/journey-builder">
            <Plus className="h-4 w-4 mr-2" />
            {nl ? 'Nieuwe Journey' : fr ? 'Nouveau Parcours' : 'Create New Journey'}
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: nl ? 'Totaal' : fr ? 'Total' : 'Total Journeys',
            value: journeys.length,
            color: 'text-primary',
          },
          {
            label: nl ? 'Actief' : fr ? 'Actifs' : 'Active',
            value: activeJourneys.length,
            color: 'text-green-600',
          },
          {
            label: nl ? 'Gepauzeerd' : fr ? 'En Pause' : 'Paused',
            value: pausedJourneys.length,
            color: 'text-yellow-600',
          },
          {
            label: nl ? 'Concept' : fr ? 'Brouillon' : 'Draft',
            value: draftJourneys.length,
            color: 'text-gray-500',
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            {nl ? 'Alle' : fr ? 'Tous' : 'All'} ({journeys.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-1.5">
            {nl ? 'Actief' : fr ? 'Actifs' : 'Active'}
            {activeJourneys.length > 0 && (
              <Badge variant="success" className="ml-1 text-[10px] px-1.5 h-4">
                {activeJourneys.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="paused">
            {nl ? 'Gepauzeerd' : fr ? 'En Pause' : 'Paused'} ({pausedJourneys.length})
          </TabsTrigger>
          <TabsTrigger value="draft">
            {nl ? 'Concept' : fr ? 'Brouillon' : 'Draft'} ({draftJourneys.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {filteredJourneys.length === 0 ? (
            <EmptyState
              title={
                activeTab === 'active'
                  ? (nl ? 'Geen actieve journeys' : fr ? 'Aucun parcours actif' : 'No active journeys')
                  : activeTab === 'paused'
                  ? (nl ? 'Geen gepauzeerde journeys' : fr ? 'Aucun parcours en pause' : 'No paused journeys')
                  : activeTab === 'draft'
                  ? (nl ? 'Geen concept journeys' : fr ? 'Aucun brouillon de parcours' : 'No draft journeys')
                  : (nl ? 'Geen journeys gevonden' : fr ? 'Aucun parcours trouvé' : 'No journeys found')
              }
              description={
                nl ? 'Maak een nieuwe journey om te beginnen.'
                : fr ? 'Créez un nouveau parcours pour commencer.'
                : 'Create a new journey to get started.'
              }
              action={{
                label: nl ? 'Nieuwe Journey' : fr ? 'Nouveau Parcours' : 'Create Journey',
                onClick: () => { window.location.href = '/app/journey-builder'; },
              }}
            />
          ) : (
            filteredJourneys.map(journey => renderJourneyCard(journey))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
