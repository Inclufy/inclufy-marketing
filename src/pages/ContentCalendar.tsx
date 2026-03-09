// src/pages/ContentCalendar.tsx
// Content calendar — month view with scheduled posts and campaigns

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCampaigns } from '@/hooks/queries/useCampaigns';
import { useContentLibrary } from '@/hooks/queries/useContentLibrary';
import { LoadingSkeleton, ErrorState } from '@/components/DataState';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Instagram,
  Linkedin,
  Mail,
  FileText,
  Clock,
  Filter,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Types ──────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'social' | 'email' | 'blog' | 'campaign';
  platform?: string;
  status: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  linkedin: Linkedin,
  email: Mail,
  blog: FileText,
};

const TYPE_COLORS: Record<string, string> = {
  social: 'bg-pink-500',
  email: 'bg-emerald-500',
  blog: 'bg-blue-500',
  campaign: 'bg-purple-500',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ─── Component ──────────────────────────────────────────────────────

export default function ContentCalendar() {
  const { lang } = useLanguage();
  const nl = lang === 'nl';
  const fr = lang === 'fr';

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [platformFilter, setPlatformFilter] = useState('all');

  // Fetch real data
  const { data: campaigns, isLoading: loadingCampaigns, isError, refetch } = useCampaigns();
  const { data: content, isLoading: loadingContent } = useContentLibrary({ limit: 50 });

  const isLoading = loadingCampaigns && loadingContent;

  // Build events from API data
  const apiEvents: CalendarEvent[] = [
    ...(campaigns || [])
      .filter(c => c.starts_at)
      .map(c => ({
        id: c.id,
        title: c.name,
        date: c.starts_at!,
        type: 'campaign' as const,
        status: c.status,
      })),
    ...((content as any)?.items || content || [])
      .filter((c: any) => c.created_at)
      .map((c: any) => ({
        id: c.id,
        title: c.title,
        date: c.created_at,
        type: (c.type || 'blog') as CalendarEvent['type'],
        platform: c.type,
        status: c.status || 'draft',
      })),
  ];

  const events = apiEvents;

  // Filter events for current month
  const monthEvents = events.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).filter(e => platformFilter === 'all' || e.platform === platformFilter || e.type === platformFilter);

  // Group events by day
  const eventsByDay: Record<number, CalendarEvent[]> = {};
  monthEvents.forEach(e => {
    const day = new Date(e.date).getDate();
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(e);
  });

  // Calendar grid
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const monthName = new Date(currentYear, currentMonth).toLocaleString(
    nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-US',
    { month: 'long', year: 'numeric' }
  );
  const dayNames = nl
    ? ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']
    : fr ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Shift firstDay from Sunday-start to Monday-start
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  };

  const selectedDayEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];

  if (isLoading) return <LoadingSkeleton cards={4} />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">
              {nl ? 'Content Kalender' : fr ? 'Calendrier de Contenu' : 'Content Calendar'}
            </h1>
            <p className="text-muted-foreground">
              {nl ? 'Plan en beheer je content' : fr ? 'Planifiez et gérez votre contenu' : 'Plan and manage your content'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{nl ? 'Alle' : fr ? 'Tous' : 'All'}</SelectItem>
              <SelectItem value="social">Social</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="blog">Blog</SelectItem>
              <SelectItem value="campaign">{nl ? 'Campagnes' : fr ? 'Campagnes' : 'Campaigns'}</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {nl ? 'Nieuw Item' : fr ? 'Nouvel Élément' : 'New Item'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMonth}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="text-xl capitalize">{monthName}</CardTitle>
              <Button variant="ghost" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 border rounded-lg bg-muted/20" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                const dayEvents = eventsByDay[day] || [];
                const isSelected = selectedDay === day;

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`h-24 border rounded-lg p-1.5 cursor-pointer transition-colors hover:border-primary/50 ${
                      isSelected ? 'border-primary bg-primary/5' : ''
                    } ${isToday ? 'border-primary/30 bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${isToday ? 'text-primary font-bold' : ''}`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(e => (
                        <div key={e.id} className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[e.type]}`} />
                          <span className="text-[10px] text-muted-foreground truncate">
                            {e.title}
                          </span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] text-muted-foreground">
                          +{dayEvents.length - 3} {nl ? 'meer' : fr ? 'plus' : 'more'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar — selected day details + upcoming */}
        <div className="space-y-6">
          {/* Selected day */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {selectedDay
                  ? new Date(currentYear, currentMonth, selectedDay).toLocaleDateString(
                      nl ? 'nl-NL' : fr ? 'fr-FR' : 'en-US',
                      { weekday: 'long', day: 'numeric', month: 'long' }
                    )
                  : nl ? 'Selecteer een dag' : fr ? 'Sélectionnez un jour' : 'Select a day'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {nl ? 'Geen items gepland' : fr ? 'Aucun élément planifié' : 'No items scheduled'}
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map(e => {
                    const Icon = PLATFORM_ICONS[e.platform || e.type] || FileText;
                    return (
                      <div key={e.id} className="p-3 border rounded-lg space-y-2">
                        <div className="flex items-start gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{e.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px]">
                                {{ social: nl ? 'Social' : fr ? 'Social' : 'Social', email: 'Email', blog: 'Blog', campaign: nl ? 'Campagne' : fr ? 'Campagne' : 'Campaign' }[e.type] || e.type}
                              </Badge>
                              <Badge
                                variant={e.status === 'scheduled' ? 'default' : e.status === 'approved' ? 'success' : 'secondary'}
                                className="text-[10px]"
                              >
                                {{ scheduled: nl ? 'Gepland' : fr ? 'Planifié' : 'Scheduled', draft: nl ? 'Concept' : fr ? 'Brouillon' : 'Draft', approved: nl ? 'Goedgekeurd' : fr ? 'Approuvé' : 'Approved' }[e.status] || e.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming this month */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {nl ? 'Binnenkort' : fr ? 'À venir' : 'Upcoming'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {monthEvents
                  .filter(e => new Date(e.date).getDate() >= today.getDate())
                  .slice(0, 5)
                  .map(e => (
                    <div key={e.id} className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${TYPE_COLORS[e.type]}`} />
                      <span className="font-medium text-xs">
                        {new Date(e.date).getDate()}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {e.title}
                      </span>
                    </div>
                  ))}
                {monthEvents.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    {nl ? 'Geen items' : fr ? 'Aucun élément' : 'No items'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {Object.entries(TYPE_COLORS).map(([type, color]) => {
                  const typeLabels: Record<string, string> = {
                    social: 'Social',
                    email: 'Email',
                    blog: 'Blog',
                    campaign: nl ? 'Campagne' : fr ? 'Campagne' : 'Campaign',
                  };
                  return (
                    <div key={type} className="flex items-center gap-2 text-xs">
                      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
                      <span>{typeLabels[type] || type}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
