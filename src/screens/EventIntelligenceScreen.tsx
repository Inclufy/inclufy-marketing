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

const SEED_EVENTS = [
  {
    name: 'Emakina Connect 2026', type: 'conference',
    description: 'Leading digital marketing summit in Brussels bringing together CMOs and growth leaders.',
    location: 'Tour & Taxis, Brussels', city: 'Brussel',
    date_start: '2026-05-14', date_end: '2026-05-15',
    website: 'https://emakina.com', expected_attendees: 800,
    target_audience_match: 88, estimated_roi: 320, estimated_leads: 45, networking_value: 90,
    cost: { ticket: 395, travel: 80, accommodation: 0, total: 475 },
    status: 'discovered', priority_score: 88,
    ai_recommendation: 'Hoog relevant voor B2B marketing. Sterke networking kansen met CMOs.',
    tags: ['digital', 'marketing', 'brussels', 'b2b'],
  },
  {
    name: 'B2B Marketing Forum Antwerpen', type: 'conference',
    description: 'Annual forum for B2B marketers in the Benelux region, focusing on demand generation and ABM.',
    location: 'Antwerp Expo, Antwerpen', city: 'Antwerpen',
    date_start: '2026-04-22', date_end: '2026-04-22',
    website: 'https://b2bforum.be', expected_attendees: 350,
    target_audience_match: 92, estimated_roi: 280, estimated_leads: 35, networking_value: 85,
    cost: { ticket: 295, travel: 40, accommodation: 0, total: 335 },
    status: 'discovered', priority_score: 91,
    ai_recommendation: 'Top prioriteit. 92% match met jouw doelgroep. ABM-focus sluit aan bij jullie aanpak.',
    tags: ['b2b', 'abm', 'demand-gen', 'antwerpen'],
  },
  {
    name: 'MarTech Summit Amsterdam 2026', type: 'conference',
    description: 'The biggest marketing technology summit in the Netherlands. AI, automation and data.',
    location: 'RAI Amsterdam, Amsterdam', city: 'Amsterdam',
    date_start: '2026-06-03', date_end: '2026-06-04',
    website: 'https://martechsummit.nl', expected_attendees: 1200,
    target_audience_match: 85, estimated_roi: 400, estimated_leads: 60, networking_value: 92,
    cost: { ticket: 450, travel: 120, accommodation: 180, total: 750 },
    status: 'discovered', priority_score: 86,
    ai_recommendation: 'Groot bereik. Ideaal om thought leadership te tonen in MarTech segment.',
    tags: ['martech', 'automation', 'ai', 'amsterdam'],
  },
  {
    name: 'Networking Night Gent – Digital Leaders', type: 'networking',
    description: 'Monthly networking evening for digital marketing leaders in Ghent and surroundings.',
    location: 'Overpoort, Gent', city: 'Gent',
    date_start: '2026-04-09', date_end: '2026-04-09',
    website: 'https://digitalleaders.be', expected_attendees: 80,
    target_audience_match: 78, estimated_roi: 150, estimated_leads: 12, networking_value: 88,
    cost: { ticket: 0, travel: 30, accommodation: 0, total: 30 },
    status: 'discovered', priority_score: 74,
    ai_recommendation: 'Laagdrempelig en lokaal. Goede kans om regionale contacten op te bouwen.',
    tags: ['networking', 'gent', 'digital'],
  },
  {
    name: 'Content Marketing World — Benelux Edition', type: 'conference',
    description: 'Content strategy, SEO, video and storytelling for B2B companies.',
    location: 'Brussels Expo, Brussel', city: 'Brussel',
    date_start: '2026-07-01', date_end: '2026-07-02',
    website: 'https://contentmarketingworld.be', expected_attendees: 600,
    target_audience_match: 80, estimated_roi: 260, estimated_leads: 30, networking_value: 75,
    cost: { ticket: 350, travel: 60, accommodation: 0, total: 410 },
    status: 'discovered', priority_score: 79,
    ai_recommendation: 'Relevant voor content-gedreven groei. Goede spreker line-up verwacht.',
    tags: ['content', 'seo', 'storytelling', 'benelux'],
  },
];

export default function EventIntelligenceScreen() {
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const { colors } = useTheme();
  const [scanning, setScanning] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [attendingId, setAttendingId] = useState<string | null>(null);
  const autoSeeded = useRef(false);

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

  // ── Seed / Scan ───────────────────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    try {
      // 1) Try live backend
      let backendOk = false;
      try {
        const resp = await api.post('/api/events/discover', {
          radius_km: 200,
          query: 'B2B marketing conference trade show networking Belgium Netherlands 2026',
          limit: 8,
        });
        await refetch();
        Alert.alert('✅ Scannen klaar', `${resp.data?.discovered ?? 0} events gevonden in jouw regio.`);
        backendOk = true;
      } catch {
        // Backend unreachable — fall through to local seed
      }
      if (backendOk) return;

      // 2) Seed curated Benelux events directly
      const { data: authSeed } = await supabase.auth.getUser();
      const user = authSeed?.user;
      if (!user) {
        Alert.alert('Fout', 'Niet ingelogd. Log opnieuw in en probeer opnieuw.');
        return;
      }
      for (const ev of SEED_EVENTS) {
        await supabase
          .from('discovered_events')
          .upsert({ ...ev, user_id: user.id }, { onConflict: 'user_id,name', ignoreDuplicates: true });
      }
      await refetch();
      Alert.alert('✅ Events geladen', `${SEED_EVENTS.length} Benelux B2B events toegevoegd aan jouw radar.`);
    } catch (err: any) {
      console.warn('[EventIntelligence] scan error:', err?.message);
      Alert.alert('Fout', 'Scannen mislukt. Controleer je verbinding en probeer opnieuw.');
    } finally {
      setScanning(false);
    }
  }, [scanning, refetch]);

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
            { label: 'ROI', val: `€${item.estimated_roi ?? 0}%` },
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

  const highCount = events.filter(e => (e.priority_score ?? 0) >= 75).length;

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
          {highCount > 0
            ? `${highCount} high-impact events in jouw regio`
            : 'Scan voor nieuwe events in jouw regio'}
        </Text>

        <TouchableOpacity
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: colors.primary, borderRadius: borderRadius.full,
            paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
            alignSelf: 'flex-start', marginTop: spacing.xs,
            opacity: scanning ? 0.6 : 1,
          }}
          onPress={handleScan}
          disabled={scanning}
        >
          {scanning
            ? <ActivityIndicator size="small" color="#fff" />
            : <MaterialCommunityIcons name="radar" size={18} color="#fff" />}
          <Text style={{ color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.sm }}>
            {scanning ? 'Scannen...' : 'Scan Regio'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Metrics bar */}
      {events.length > 0 && (
        <View style={{
          flexDirection: 'row', backgroundColor: colors.surface,
          paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border,
        }}>
          {[
            { val: String(events.length), label: 'Gevonden', color: colors.text },
            { val: String(highCount), label: 'High Impact', color: colors.success },
            { val: String(events.filter(e => e.status === 'registered').length), label: 'Ingeschreven', color: colors.primary },
            {
              val: events.length > 0
                ? String(Math.round(events.reduce((s, e) => s + (e.estimated_leads ?? 0), 0) / events.length))
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
          data={events}
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
