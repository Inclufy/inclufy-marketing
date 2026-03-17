import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { api } from '../services/api';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';
import type { RootStackParamList } from '../types';
import { useTheme } from '../context/ThemeContext';
import type { RegionData } from '../hooks/useLocation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface DiscoveredEvent {
  id: string;
  name: string;
  type: string;
  description: string;
  location: string;
  city: string;
  date_start: string;
  date_end: string;
  website: string;
  expected_attendees: number;
  target_audience_match: number;
  estimated_roi: number;
  estimated_leads: number;
  networking_value: number;
  cost: { ticket: number; travel: number; accommodation: number; total: number } | null;
  status: string;
  priority_score: number;
  ai_recommendation: string;
  tags: string[];
}

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  conference:  { icon: 'megaphone-outline',   color: '#E8317A' },
  trade_show:  { icon: 'storefront-outline',  color: '#DB2777' },
  networking:  { icon: 'people-outline',      color: '#10B981' },
  meetup:      { icon: 'chatbubbles-outline', color: '#3B82F6' },
  workshop:    { icon: 'construct-outline',   color: '#F59E0B' },
  webinar:     { icon: 'desktop-outline',     color: '#06B6D4' },
  hackathon:   { icon: 'code-slash-outline',  color: '#EF4444' },
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

// ── Scan layers: stad → provincie → landelijk → Benelux → Europa → globaal ──
interface ScanLayer {
  label: string;
  radius_km: number;
  queryBuilder: (region: RegionData) => string;
  seedTag: string;
}

const SCAN_LAYERS: ScanLayer[] = [
  {
    label: 'Stad',
    radius_km: 25,
    queryBuilder: (r) => `B2B marketing event ${r.city} 2026`,
    seedTag: 'city',
  },
  {
    label: 'Provincie',
    radius_km: 75,
    queryBuilder: (r) => `B2B marketing conference ${r.province} ${r.country} 2026`,
    seedTag: 'province',
  },
  {
    label: 'Landelijk',
    radius_km: 200,
    queryBuilder: (r) => `B2B marketing conference trade show ${r.country} 2026`,
    seedTag: 'national',
  },
  {
    label: 'Benelux',
    radius_km: 400,
    queryBuilder: () => `B2B marketing conference Belgium Netherlands Luxembourg 2026`,
    seedTag: 'benelux',
  },
  {
    label: 'Europa',
    radius_km: 1500,
    queryBuilder: () => `B2B marketing summit conference Europe 2026`,
    seedTag: 'europe',
  },
  {
    label: 'Globaal',
    radius_km: 99999,
    queryBuilder: () => `B2B marketing summit conference global 2026`,
    seedTag: 'global',
  },
];

// ── Seed events per layer ─────────────────────────────────────────────
const SEED_EVENTS_BY_LAYER: Record<string, Array<Omit<DiscoveredEvent, 'id'>>> = {
  city: [
    {
      name: 'Startup Almere Pitch Night', type: 'networking',
      description: 'Maandelijkse pitch avond voor startups en scale-ups in Almere. Ideaal voor lokaal netwerken.',
      location: 'Kunstlinie, Almere', city: 'Almere',
      date_start: '2026-04-15', date_end: '2026-04-15',
      website: 'https://startupalmere.nl', expected_attendees: 60,
      target_audience_match: 75, estimated_roi: 120, estimated_leads: 8, networking_value: 82,
      cost: { ticket: 0, travel: 0, accommodation: 0, total: 0 },
      status: 'discovered', priority_score: 72,
      ai_recommendation: 'Lokaal en laagdrempelig. Perfecte kans voor regionale zichtbaarheid.',
      tags: ['networking', 'startup', 'almere', 'lokaal'],
    },
  ],
  province: [
    {
      name: 'ICT Tribe Flevoland Meetup', type: 'meetup',
      description: 'Kwartaalbijeenkomst voor ICT-professionals en digitale marketeers in Flevoland.',
      location: 'De Meerpaal, Dronten', city: 'Dronten',
      date_start: '2026-05-08', date_end: '2026-05-08',
      website: 'https://icttribe.nl', expected_attendees: 45,
      target_audience_match: 70, estimated_roi: 100, estimated_leads: 6, networking_value: 78,
      cost: { ticket: 0, travel: 15, accommodation: 0, total: 15 },
      status: 'discovered', priority_score: 68,
      ai_recommendation: 'Regionaal relevant. Goede kans om ICT-netwerk in de provincie uit te breiden.',
      tags: ['ict', 'meetup', 'flevoland', 'provinciaal'],
    },
    {
      name: 'Innovaly Innovation Day', type: 'conference',
      description: 'Jaarlijks innovatie-event met focus op digitale transformatie en marketing technologie.',
      location: 'Innovaly Hub, Lelystad', city: 'Lelystad',
      date_start: '2026-06-12', date_end: '2026-06-12',
      website: 'https://innovaly.nl', expected_attendees: 120,
      target_audience_match: 82, estimated_roi: 200, estimated_leads: 15, networking_value: 80,
      cost: { ticket: 95, travel: 20, accommodation: 0, total: 115 },
      status: 'discovered', priority_score: 78,
      ai_recommendation: 'Sterke innovatiefocus. Goed platform voor thought leadership in de regio.',
      tags: ['innovatie', 'digitaal', 'lelystad', 'provinciaal'],
    },
  ],
  national: [
    {
      name: 'MarTech Summit Amsterdam 2026', type: 'conference',
      description: 'Het grootste marketing technology congres van Nederland. AI, automation en data-driven marketing.',
      location: 'RAI Amsterdam, Amsterdam', city: 'Amsterdam',
      date_start: '2026-06-03', date_end: '2026-06-04',
      website: 'https://martechsummit.nl', expected_attendees: 1200,
      target_audience_match: 85, estimated_roi: 400, estimated_leads: 60, networking_value: 92,
      cost: { ticket: 450, travel: 120, accommodation: 180, total: 750 },
      status: 'discovered', priority_score: 86,
      ai_recommendation: 'Groot bereik. Ideaal om thought leadership te tonen in MarTech segment.',
      tags: ['martech', 'automation', 'ai', 'amsterdam', 'nationaal'],
    },
    {
      name: 'ROC Digital Skills Conference', type: 'conference',
      description: 'Landelijke conferentie over digitale vaardigheden, marketing en onderwijs. Sterke B2B focus.',
      location: 'Jaarbeurs, Utrecht', city: 'Utrecht',
      date_start: '2026-05-21', date_end: '2026-05-21',
      website: 'https://roc-digitaal.nl', expected_attendees: 400,
      target_audience_match: 78, estimated_roi: 250, estimated_leads: 30, networking_value: 75,
      cost: { ticket: 175, travel: 40, accommodation: 0, total: 215 },
      status: 'discovered', priority_score: 77,
      ai_recommendation: 'Goed voor B2B in onderwijs en digitale training. Sterke doelgroep match.',
      tags: ['onderwijs', 'digitaal', 'utrecht', 'nationaal'],
    },
  ],
  benelux: [
    {
      name: 'Emakina Connect 2026', type: 'conference',
      description: 'Toonaangevend digital marketing congres in Brussel met CMOs en growth leaders.',
      location: 'Tour & Taxis, Brussels', city: 'Brussel',
      date_start: '2026-05-14', date_end: '2026-05-15',
      website: 'https://emakina.com', expected_attendees: 800,
      target_audience_match: 88, estimated_roi: 320, estimated_leads: 45, networking_value: 90,
      cost: { ticket: 395, travel: 80, accommodation: 0, total: 475 },
      status: 'discovered', priority_score: 88,
      ai_recommendation: 'Hoog relevant voor B2B marketing. Sterke networking kansen met CMOs.',
      tags: ['digital', 'marketing', 'brussels', 'b2b', 'benelux'],
    },
    {
      name: 'B2B Marketing Forum Antwerpen', type: 'conference',
      description: 'Jaarlijks forum voor B2B marketeers in de Benelux. Focus op demand generation en ABM.',
      location: 'Antwerp Expo, Antwerpen', city: 'Antwerpen',
      date_start: '2026-04-22', date_end: '2026-04-22',
      website: 'https://b2bforum.be', expected_attendees: 350,
      target_audience_match: 92, estimated_roi: 280, estimated_leads: 35, networking_value: 85,
      cost: { ticket: 295, travel: 40, accommodation: 0, total: 335 },
      status: 'discovered', priority_score: 91,
      ai_recommendation: 'Top prioriteit. 92% match met jouw doelgroep. ABM-focus sluit aan bij jullie aanpak.',
      tags: ['b2b', 'abm', 'demand-gen', 'antwerpen', 'benelux'],
    },
  ],
  europe: [
    {
      name: 'Web Summit 2026', type: 'conference',
      description: 'Europa\'s grootste tech-conferentie in Lissabon. Marketing, AI en startup ecosysteem.',
      location: 'Altice Arena, Lisbon', city: 'Lissabon',
      date_start: '2026-11-02', date_end: '2026-11-05',
      website: 'https://websummit.com', expected_attendees: 70000,
      target_audience_match: 72, estimated_roi: 500, estimated_leads: 80, networking_value: 95,
      cost: { ticket: 850, travel: 250, accommodation: 400, total: 1500 },
      status: 'discovered', priority_score: 82,
      ai_recommendation: 'Massaal bereik. Ideaal voor internationale thought leadership en brand awareness.',
      tags: ['tech', 'startup', 'lisbon', 'europa'],
    },
  ],
  global: [
    {
      name: 'Content Marketing World 2026', type: 'conference',
      description: 'Wereldwijd toonaangevend content marketing event. SEO, storytelling en B2B strategie.',
      location: 'San Diego Convention Center', city: 'San Diego',
      date_start: '2026-10-14', date_end: '2026-10-17',
      website: 'https://contentmarketingworld.com', expected_attendees: 4000,
      target_audience_match: 80, estimated_roi: 600, estimated_leads: 50, networking_value: 85,
      cost: { ticket: 1200, travel: 800, accommodation: 600, total: 2600 },
      status: 'discovered', priority_score: 75,
      ai_recommendation: 'Top content marketing event wereldwijd. Hoge investering maar unieke kansen.',
      tags: ['content', 'seo', 'storytelling', 'globaal'],
    },
  ],
};

// Flatten all seed events (legacy fallback)
const ALL_SEED_EVENTS = Object.values(SEED_EVENTS_BY_LAYER).flat();

export default function EventIntelligenceScreen() {
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const { colors } = useTheme();
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [attendingId, setAttendingId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<string>('all');
  const autoSeeded = useRef(false);

  // ── Load user location from metadata ────────────────────────────────────
  const [userRegion, setUserRegion] = useState<RegionData | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } = {} as any } = await supabase.auth.getUser();
        const meta = user?.user_metadata;
        if (meta?.location_city || meta?.location_country) {
          setUserRegion({
            city: meta.location_city || '',
            province: meta.location_province || '',
            country: meta.location_country || '',
            countryCode: meta.location_country_code || '',
            continent: meta.location_continent || '',
          });
        }
      } catch {}
    })();
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const { data: events = [], isLoading, refetch } = useQuery<DiscoveredEvent[]>({
    queryKey: ['discovered_events'],
    queryFn: async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (!user) return [];
        const { data, error } = await supabase
          .from('discovered_events')
          .select('*')
          .eq('user_id', user.id)
          .order('priority_score', { ascending: false });
        if (error) {
          console.warn('[EventIntelligence] fetch error:', error.message);
          return [];
        }
        return (data ?? []) as DiscoveredEvent[];
      } catch (err: any) {
        console.warn('[EventIntelligence] unexpected fetch error:', err?.message);
        return [];
      }
    },
    retry: 1,
    staleTime: 30_000,
  });

  // ── Hierarchical Scan: stad → provincie → landelijk → Benelux → Europa → globaal
  const handleScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setScanProgress('');

    try {
      const { data: authSeed } = await supabase.auth.getUser();
      const user = authSeed?.user;
      if (!user) {
        Alert.alert('Fout', 'Niet ingelogd. Log opnieuw in en probeer opnieuw.');
        return;
      }

      const region: RegionData = userRegion ?? {
        city: user.user_metadata?.location_city || '',
        province: user.user_metadata?.location_province || '',
        country: user.user_metadata?.location_country || 'Nederland',
        countryCode: user.user_metadata?.location_country_code || 'NL',
        continent: user.user_metadata?.location_continent || 'Europe',
      };

      let totalFound = 0;
      const layerResults: string[] = [];

      // Scan each layer hierarchically
      for (const layer of SCAN_LAYERS) {
        setScanProgress(`🔍 ${layer.label} scannen...`);

        // 1) Try live backend for this layer
        let backendOk = false;
        try {
          const resp = await api.post('/api/events/discover', {
            radius_km: layer.radius_km,
            query: layer.queryBuilder(region),
            limit: 5,
            layer: layer.seedTag,
          });
          const found = resp.data?.discovered ?? 0;
          if (found > 0) {
            totalFound += found;
            layerResults.push(`${layer.label}: ${found}`);
          }
          backendOk = true;
        } catch {
          // Backend unreachable — seed from curated events
        }

        if (!backendOk) {
          // 2) Seed curated events for this layer
          const seeds = SEED_EVENTS_BY_LAYER[layer.seedTag] ?? [];
          for (const ev of seeds) {
            await supabase
              .from('discovered_events')
              .upsert(
                { ...ev, user_id: user.id, scan_layer: layer.seedTag },
                { onConflict: 'user_id,name', ignoreDuplicates: true }
              );
          }
          if (seeds.length > 0) {
            totalFound += seeds.length;
            layerResults.push(`${layer.label}: ${seeds.length}`);
          }
        }
      }

      // Also fetch events from followed organizers
      setScanProgress('⭐ Gevolgde organisatoren...');
      try {
        const { data: orgEvents } = await supabase
          .from('followed_organizers')
          .select('organizer_name')
          .eq('user_id', user.id);

        if (orgEvents && orgEvents.length > 0) {
          for (const org of orgEvents) {
            try {
              await api.post('/api/events/discover', {
                radius_km: 99999,
                query: `${org.organizer_name} event 2026`,
                limit: 3,
                source: 'followed_organizer',
              });
            } catch {}
          }
        }
      } catch {}

      await refetch();
      setScanProgress('');

      if (totalFound > 0) {
        const layerSummary = layerResults.join('\n');
        Alert.alert(
          '✅ Hiërarchisch scannen klaar',
          `${totalFound} events gevonden:\n\n${layerSummary}`
        );
      } else {
        Alert.alert('ℹ️ Geen nieuwe events', 'Probeer later opnieuw of pas je locatie aan in Instellingen.');
      }
    } catch (err: any) {
      console.warn('[EventIntelligence] scan error:', err?.message);
      Alert.alert('Fout', 'Scannen mislukt. Controleer je verbinding en probeer opnieuw.');
    } finally {
      setScanning(false);
      setScanProgress('');
    }
  }, [scanning, refetch, userRegion]);

  // ── Auto-seed on first load when empty ────────────────────────────────────
  useEffect(() => {
    if (!isLoading && events.length === 0 && !autoSeeded.current && !scanning) {
      autoSeeded.current = true;
      const t = setTimeout(() => {
        handleScan().catch(() => {});
      }, 900);
      return () => clearTimeout(t);
    }
  }, [isLoading, events.length]); // intentionally omit handleScan to avoid loop

  // ── Filter events by layer ──────────────────────────────────────────────
  const filteredEvents = activeLayer === 'all'
    ? events
    : events.filter(e => {
        const tags = e.tags ?? [];
        return tags.includes(activeLayer) || (e as any).scan_layer === activeLayer;
      });

  // ── Attend mutation ───────────────────────────────────────────────────────
  const handleAttend = useCallback(async (item: DiscoveredEvent) => {
    if (attendingId) return;
    setAttendingId(item.id);
    try {
      const resp = await api.put(`/api/events/discover/${item.id}/attend`);
      qc.invalidateQueries({ queryKey: ['discovered_events'] });
      if (resp.data?.go_event_id) {
        Alert.alert(
          '🎉 Bijgeschreven!',
          'Event toegevoegd aan jouw agenda. Wil je direct content maken?',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Open Event',
              onPress: () => {
                try {
                  navigation.navigate('EventDashboard', { eventId: resp.data.go_event_id });
                } catch {
                  // navigation error — stay on screen
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('✅ Ingeschreven', 'Je staat ingeschreven voor dit event.');
      }
    } catch {
      Alert.alert('Fout', 'Inschrijving mislukt. Controleer je verbinding.');
    } finally {
      setAttendingId(null);
    }
  }, [attendingId, navigation, qc]);

  // ── Render event card ─────────────────────────────────────────────────────
  const renderEvent = useCallback(({ item }: { item: DiscoveredEvent }) => {
    const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.conference;
    const isExpanded = expandedId === item.id;
    const isRegistered = item.status === 'registered' || item.status === 'attending';
    const score = item.priority_score ?? 0;
    const scoreColor = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#6B7280';
    const isAttending = attendingId === item.id;

    return (
      <TouchableOpacity
        style={{
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.md,
          marginBottom: spacing.sm,
          ...(isExpanded ? { borderColor: colors.primary + '30', borderWidth: 1 } : {}),
          ...subtleShadow,
        }}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.85}
      >
        {/* ── Top row ── */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginBottom: spacing.sm }}>
          <View style={{
            width: 40, height: 40, borderRadius: 10,
            backgroundColor: cfg.color + '18',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text, lineHeight: 18 }}
              numberOfLines={isExpanded ? 3 : 2}
            >
              {item.name ?? '—'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 }}>
              <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>{item.city || item.location || '—'}</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>•</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>{formatDate(item.date_start)}</Text>
            </View>
          </View>

          {/* Score badge */}
          <View style={{
            borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5,
            alignItems: 'center', borderWidth: 1, minWidth: 48,
            backgroundColor: scoreColor + '18', borderColor: scoreColor + '40',
          }}>
            <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: scoreColor, lineHeight: 18 }}>
              {score}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: fontWeight.medium, color: scoreColor }}>/100</Text>
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={{
          flexDirection: 'row', backgroundColor: colors.background,
          borderRadius: borderRadius.sm, padding: spacing.sm, marginBottom: spacing.sm,
        }}>
          {[
            { label: 'ROI', val: `${typeof item.estimated_roi === 'number' ? item.estimated_roi : 0}%` },
            { label: 'Leads', val: String(item.estimated_leads ?? 0) },
            { label: 'Match', val: `${item.target_audience_match ?? 0}%` },
            { label: 'Bezoekers', val: item.expected_attendees ? String(Math.round(item.expected_attendees / 100) * 100) : '—' },
          ].map(({ label, val }) => (
            <View key={label} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text }}>{val}</Text>
              <Text style={{ fontSize: 9, color: colors.textSecondary, marginTop: 1 }}>{label}</Text>
            </View>
          ))}
        </View>

        {/* ── AI recommendation ── */}
        {!!item.ai_recommendation && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginBottom: spacing.xs }}>
            <Ionicons name="sparkles-outline" size={12} color={colors.primary} />
            <Text style={{ fontSize: 11, color: colors.primary, fontStyle: 'italic', flex: 1, lineHeight: 16 }}>
              {item.ai_recommendation}
            </Text>
          </View>
        )}

        {/* ── Expanded section ── */}
        {isExpanded && (
          <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, gap: spacing.sm }}>
            {!!item.description && (
              <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                {item.description}
              </Text>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="card-outline" size={14} color={colors.textSecondary} />
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary }}>
                {`Ticket: €${item.cost?.ticket ?? 0} · Totaal: €${item.cost?.total ?? 0}`}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {!!item.website && (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    borderWidth: 1, borderColor: colors.primary + '60',
                    borderRadius: borderRadius.full, paddingHorizontal: 12, paddingVertical: 7,
                  }}
                  onPress={() => Linking.openURL(item.website).catch(() => {})}
                >
                  <Ionicons name="globe-outline" size={14} color={colors.primary} />
                  <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.medium }}>
                    Website
                  </Text>
                </TouchableOpacity>
              )}

              {isRegistered ? (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: colors.success + '15',
                  borderRadius: borderRadius.full,
                  paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
                }}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={{ color: colors.success, fontWeight: fontWeight.bold, fontSize: fontSize.sm }}>
                    Ingeschreven
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: colors.primary,
                    borderRadius: borderRadius.full,
                    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
                    opacity: isAttending ? 0.7 : 1,
                  }}
                  onPress={() => handleAttend(item)}
                  disabled={!!attendingId}
                >
                  {isAttending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="calendar-outline" size={16} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.sm }}>
                        Bijwonen →
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ── Expand chevron ── */}
        <View style={{ alignItems: 'center', marginTop: spacing.xs }}>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  }, [expandedId, attendingId, colors, handleAttend]);

  const highCount = filteredEvents.filter(e => (e.priority_score ?? 0) >= 75).length;

  const LAYER_CHIPS = [
    { key: 'all', label: 'Alle' },
    { key: 'city', label: '🏙️ Stad' },
    { key: 'province', label: '🗺️ Provincie' },
    { key: 'national', label: '🇳🇱 Landelijk' },
    { key: 'benelux', label: '🇧🇪 Benelux' },
    { key: 'europe', label: '🇪🇺 Europa' },
    { key: 'global', label: '🌍 Globaal' },
  ];

  // ── Header ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingTop: Platform.OS === 'ios' ? spacing.md : spacing.md,
        paddingBottom: spacing.md,
        gap: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          backgroundColor: colors.primary + '15', alignSelf: 'flex-start',
          paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
        }}>
          <MaterialCommunityIcons name="radar" size={16} color={colors.primary} />
          <Text style={{ fontSize: 11, color: colors.primary, fontWeight: fontWeight.semibold }}>
            Live AI Radar
          </Text>
        </View>

        <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text }}>
          Event Intelligence
        </Text>
        <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
          {userRegion?.city
            ? `📍 ${userRegion.city}, ${userRegion.country} — ${highCount > 0 ? `${highCount} high-impact events` : 'Scan voor events'}`
            : highCount > 0
              ? `${highCount} high-impact events gevonden`
              : 'Stel je locatie in via Instellingen voor betere resultaten'}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: colors.primary, borderRadius: borderRadius.full,
              paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
              opacity: scanning ? 0.6 : 1,
            }}
            onPress={handleScan}
            disabled={scanning}
          >
            {scanning
              ? <ActivityIndicator size="small" color="#fff" />
              : <MaterialCommunityIcons name="radar" size={18} color="#fff" />}
            <Text style={{ color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.sm }}>
              {scanning ? 'Scannen...' : 'Scan Hiërarchisch'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              borderWidth: 1.5, borderColor: colors.primary + '60',
              borderRadius: borderRadius.full,
              paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
            }}
            onPress={() => (navigation as any).navigate('FollowedOrganizers')}
          >
            <Ionicons name="star-outline" size={16} color={colors.primary} />
            <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.medium }}>
              Organisatoren
            </Text>
          </TouchableOpacity>
        </View>

        {scanning && scanProgress ? (
          <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontStyle: 'italic', marginTop: 2 }}>
            {scanProgress}
          </Text>
        ) : null}
      </View>

      {/* Layer filter chips */}
      {events.length > 0 && (
        <FlatList
          horizontal
          data={LAYER_CHIPS}
          keyExtractor={c => c.key}
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, maxHeight: 48, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}
          contentContainerStyle={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, gap: spacing.xs, alignItems: 'center' }}
          renderItem={({ item: c }) => (
            <TouchableOpacity
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                backgroundColor: activeLayer === c.key ? colors.primary : colors.background,
                borderWidth: 1.5, borderColor: activeLayer === c.key ? colors.primary : colors.border,
              }}
              onPress={() => setActiveLayer(c.key)}
            >
              <Text style={{
                fontSize: 12, fontWeight: fontWeight.semibold,
                color: activeLayer === c.key ? '#fff' : colors.textSecondary,
              }}>
                {c.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Metrics bar */}
      {events.length > 0 && (
        <View style={{
          flexDirection: 'row', backgroundColor: colors.surface,
          paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          {[
            { val: String(filteredEvents.length), label: 'Gevonden', color: colors.text },
            { val: String(highCount), label: 'High Impact', color: colors.success },
            { val: String(events.filter(e => e.status === 'registered').length), label: 'Ingeschreven', color: colors.primary },
            {
              val: filteredEvents.length > 0
                ? String(Math.round(filteredEvents.reduce((s, e) => s + (e.estimated_leads ?? 0), 0) / filteredEvents.length))
                : '0',
              label: 'Avg Leads', color: colors.text,
            },
          ].map(({ val, label, color }) => (
            <View key={label} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color }}>{val}</Text>
              <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 1 }}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>Events laden...</Text>
        </View>
      ) : events.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, padding: spacing.xl }}>
          <MaterialCommunityIcons name="radar" size={56} color={colors.textSecondary} />
          <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text }}>
            Nog geen events gevonden
          </Text>
          <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
            Tik op "Scan Regio" om events te ontdekken in jouw regio
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: colors.primary, borderRadius: borderRadius.full,
              paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginTop: spacing.sm,
              opacity: scanning ? 0.6 : 1,
            }}
            onPress={handleScan}
            disabled={scanning}
          >
            {scanning
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={{ color: '#fff', fontWeight: fontWeight.bold }}>🔍 Scan Regio</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={item => item.id}
          renderItem={renderEvent}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => { refetch().catch(() => {}); }}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}
