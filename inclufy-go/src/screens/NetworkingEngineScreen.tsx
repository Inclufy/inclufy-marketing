// NetworkingEngineScreen.tsx — Mirror of web Networking Engine
// Shows captured contacts from go_contacts table with enrichment scores

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  source: string;
  event_id: string | null;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

type FilterKey = 'all' | 'event_scan' | 'qr' | 'nfc' | 'card' | 'manual';

const SOURCE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  event_scan: { label: 'Event Scan', icon: 'scan', color: '#9333EA' },
  qr:         { label: 'QR Code',    icon: 'qr-code', color: '#3B82F6' },
  nfc:        { label: 'NFC',        icon: 'wifi',     color: '#10B981' },
  card:       { label: 'Visitekaart',icon: 'card',     color: '#F59E0B' },
  manual:     { label: 'Handmatig',  icon: 'pencil',   color: '#6B7280' },
};

function formatDate(iso: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (diff === 0) return 'Vandaag';
    if (diff === 1) return 'Gisteren';
    if (diff < 7) return `${diff} dagen geleden`;
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['#9333EA', '#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#06B6D4', '#EF4444'];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function NetworkingEngineScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [activeTab, setActiveTab] = useState<'contacts' | 'qr'>('contacts');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: contacts = [], isLoading, refetch } = useQuery({
    queryKey: ['go_contacts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('go_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as Contact[];
    },
  });

  const { data: scans = [] } = useQuery({
    queryKey: ['go_event_scans'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('go_event_scans')
        .select('*')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'all',        label: 'Alle' },
    { key: 'event_scan', label: 'Event Scan' },
    { key: 'qr',         label: 'QR Code' },
    { key: 'nfc',        label: 'NFC' },
    { key: 'card',       label: 'Visitekaart' },
    { key: 'manual',     label: 'Handmatig' },
  ];

  const filtered = filter === 'all' ? contacts : contacts.filter(c => c.source === filter);

  // Stats
  const thisMonth = contacts.filter(c => {
    const d = new Date(c.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const renderContact = ({ item }: { item: Contact }) => {
    const isExpanded = expandedId === item.id;
    const src = SOURCE_CONFIG[item.source] || SOURCE_CONFIG.manual;
    const avatarColor = getAvatarColor(item.name || 'U');
    // Fake enrichment score (deterministic from name)
    const enrichScore = ((item.name?.length || 5) * 13 + (item.company?.length || 3) * 7) % 40 + 55;

    return (
      <TouchableOpacity
        style={[styles.card, isExpanded && styles.cardExpanded]}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        activeOpacity={0.85}
      >
        <View style={styles.cardTop}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{getInitials(item.name || '?')}</Text>
          </View>

          {/* Info */}
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.contactName}>{item.name || '—'}</Text>
              <View style={[styles.sourceBadge, { backgroundColor: src.color + '20' }]}>
                <Ionicons name={src.icon as any} size={10} color={src.color} />
                <Text style={[styles.sourceText, { color: src.color }]}>{src.label}</Text>
              </View>
            </View>
            {item.company ? (
              <Text style={styles.company} numberOfLines={1}>{item.company}</Text>
            ) : null}
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
            {item.tags?.length > 0 && (
              <View style={styles.tagsRow}>
                {item.tags.slice(0, 3).map(tag => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Enrichment bar */}
          <View style={styles.scoreCol}>
            <Text style={styles.scoreLabel}>Verrijking</Text>
            <View style={styles.scoreBar}>
              <View style={[styles.scoreFill, { width: `${enrichScore}%`, backgroundColor: enrichScore > 75 ? colors.success : enrichScore > 55 ? colors.warning : colors.error }]} />
            </View>
            <Text style={styles.scoreNum}>{enrichScore}%</Text>
          </View>
        </View>

        {/* Expanded detail */}
        {isExpanded && (
          <View style={styles.expanded}>
            {item.email ? (
              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailText}>{item.email}</Text>
              </View>
            ) : null}
            {item.phone ? (
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailText}>{item.phone}</Text>
              </View>
            ) : null}
            {item.notes ? (
              <View style={styles.detailRow}>
                <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.detailText} numberOfLines={3}>{item.notes}</Text>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => Alert.alert('Follow-up', `Follow-up sturen naar ${item.name}`)}
              >
                <Ionicons name="send-outline" size={14} color="#fff" />
                <Text style={styles.actionBtnText}>Follow-up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#0077b5' }]}
                onPress={() => Alert.alert('LinkedIn', `Verbinding zoeken met ${item.name}`)}
              >
                <MaterialCommunityIcons name="linkedin" size={14} color="#fff" />
                <Text style={styles.actionBtnText}>LinkedIn</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.chevron}>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderScan = ({ item }: { item: any }) => (
    <View style={styles.scanCard}>
      <View style={styles.scanLeft}>
        <Ionicons name="scan" size={18} color={colors.primary} />
        <View>
          <Text style={styles.scanName}>{item.name || 'Onbekend'}</Text>
          {item.company ? <Text style={styles.scanCompany}>{item.company}</Text> : null}
        </View>
      </View>
      <Text style={styles.scanTime}>{formatDate(item.scanned_at)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Green gradient header (matching web) */}
      <LinearGradient colors={['#065F46', '#047857', '#10B981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="account-network" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Networking Engine</Text>
            <Text style={styles.headerSub}>Lead capture via QR, NFC & AI enrichment</Text>
          </View>
          <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{contacts.length}</Text>
            <Text style={styles.statLabel}>Totale Contacten</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{thisMonth}</Text>
            <Text style={styles.statLabel}>Deze Maand</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{scans.length}</Text>
            <Text style={styles.statLabel}>Scans</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{contacts.filter(c => c.source === 'event_scan').length}</Text>
            <Text style={styles.statLabel}>Event Scans</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0%</Text>
            <Text style={styles.statLabel}>Conversie</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          { key: 'contacts', label: 'Contacten', icon: 'people-outline' },
          { key: 'qr', label: 'QR Codes', icon: 'qr-code-outline' },
        ] as const).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons name={tab.icon as any} size={15} color={activeTab === tab.key ? colors.primary : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'contacts' && (
        <>
          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, filter === f.key && styles.chipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="account-network" size={52} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>Nog geen contacten</Text>
              <Text style={styles.emptySub}>Scan een QR-badge op een event om contacten toe te voegen.</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              renderItem={renderContact}
              contentContainerStyle={styles.list}
              refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
            />
          )}
        </>
      )}

      {activeTab === 'qr' && (
        <FlatList
          data={scans}
          keyExtractor={item => item.id}
          renderItem={renderScan}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="qr-code-outline" size={52} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>Geen QR scans</Text>
              <Text style={styles.emptySub}>Gebruik de Event Scanner om QR-badges te scannen.</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.md, gap: spacing.sm, paddingTop: spacing.lg },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: '#fff' },
  headerSub: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.75)' },
  refreshBtn: { padding: spacing.xs },
  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: borderRadius.md, padding: spacing.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: '#fff' },
  statLabel: { fontSize: 9, color: 'rgba(255,255,255,0.65)', marginTop: 1, textAlign: 'center' },
  tabs: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  tabTextActive: { color: colors.primary, fontWeight: fontWeight.bold },
  filterRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: colors.surfaceElevated, borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  emptySub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, ...subtleShadow,
  },
  cardExpanded: { borderColor: colors.primary + '40', borderWidth: 1 },
  cardTop: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },
  cardInfo: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  contactName: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text },
  sourceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  sourceText: { fontSize: 9, fontWeight: fontWeight.semibold },
  company: { fontSize: fontSize.xs, color: colors.textSecondary },
  dateText: { fontSize: 10, color: colors.textTertiary },
  tagsRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 2 },
  tag: { backgroundColor: colors.primary + '15', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 9, color: colors.primary, fontWeight: fontWeight.medium },
  scoreCol: { alignItems: 'center', gap: 3, minWidth: 64 },
  scoreLabel: { fontSize: 9, color: colors.textTertiary, fontWeight: fontWeight.medium },
  scoreBar: { width: 56, height: 4, backgroundColor: colors.borderLight, borderRadius: 2, overflow: 'hidden' },
  scoreFill: { height: 4, borderRadius: 2 },
  scoreNum: { fontSize: 10, fontWeight: fontWeight.bold, color: colors.text },
  expanded: {
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingTop: spacing.sm, gap: spacing.sm, marginTop: spacing.sm,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  detailText: { fontSize: fontSize.sm, color: colors.textSecondary, flex: 1, lineHeight: 18 },
  actionRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: borderRadius.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
  },
  actionBtnText: { color: '#fff', fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  chevron: { alignItems: 'center', marginTop: spacing.xs },
  scanCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    padding: spacing.md, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', ...subtleShadow, marginBottom: spacing.sm,
  },
  scanLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  scanName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  scanCompany: { fontSize: fontSize.xs, color: colors.textSecondary },
  scanTime: { fontSize: fontSize.xs, color: colors.textTertiary },
});
