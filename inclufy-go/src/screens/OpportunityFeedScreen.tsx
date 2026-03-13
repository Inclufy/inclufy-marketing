import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';

type FeedItemType = 'lead_signal' | 'trend_alert' | 'event_opportunity' | 'partnership_match' | 'campaign_trigger' | 'competitor_move' | 'content_opportunity' | 'budget_optimization';

interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  description: string;
  urgency: string;
  confidence: number;
  estimated_value: number;
  source: string;
  timestamp: string;
  is_read: boolean;
  is_actioned: boolean;
  suggested_action: { label: string; action_type: string };
  impact_metrics: { reach?: number; leads?: number; revenue?: number; roi?: number };
  tags: string[];
}

const TYPE_CONFIG: Record<FeedItemType, { icon: string; color: string; label: string; lib: 'ion' | 'mci' }> = {
  lead_signal:         { icon: 'person-add',       color: '#8B5CF6', label: 'Lead Signaal',        lib: 'ion' },
  trend_alert:         { icon: 'trending-up',       color: '#EC4899', label: 'Trend Alert',         lib: 'ion' },
  campaign_trigger:    { icon: 'megaphone',          color: '#3B82F6', label: 'Campagne Trigger',    lib: 'ion' },
  event_opportunity:   { icon: 'calendar-star',      color: '#10B981', label: 'Event Kans',          lib: 'mci' },
  competitor_move:     { icon: 'shield-alert',       color: '#F59E0B', label: 'Concurrent',          lib: 'mci' },
  partnership_match:   { icon: 'handshake',          color: '#14B8A6', label: 'Partnership',         lib: 'mci' },
  content_opportunity: { icon: 'create',             color: '#06B6D4', label: 'Content Kans',        lib: 'ion' },
  budget_optimization: { icon: 'cash',               color: '#EF4444', label: 'Budget',              lib: 'ion' },
};

const URGENCY_COLORS: Record<string, string> = {
  immediate: '#EF4444',
  today:     '#F59E0B',
  this_week: '#3B82F6',
  this_month:'#10B981',
};

const URGENCY_LABELS: Record<string, string> = {
  immediate: 'Direct',
  today:     'Vandaag',
  this_week: 'Deze Week',
  this_month:'Deze Maand',
};

function formatTime(iso: string) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const diff = Date.now() - d.getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'Zojuist';
    if (h < 24) return `${h}u geleden`;
    return `${Math.floor(h / 24)}d geleden`;
  } catch { return ''; }
}

function formatValue(val: number) {
  if (!val) return '€0';
  if (val >= 1000) return `€${Math.round(val / 1000)}K`;
  return `€${val}`;
}

export default function OpportunityFeedScreen() {
  const navigation = useNavigation<any>();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<FeedItemType | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['feed_items'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('feed_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as FeedItem[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('feed_items').update({ is_read: true }).eq('id', id).eq('user_id', user!.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed_items'] }),
  });

  const actionItem = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('feed_items').update({ is_actioned: true, is_read: true }).eq('id', id).eq('user_id', user!.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed_items'] }),
  });

  const filtered = filter === 'all' ? items : items.filter(i => i.type === filter);
  const unread = items.filter(i => !i.is_read).length;
  const totalValue = items.reduce((s, i) => s + (i.estimated_value || 0), 0);
  const immediate = items.filter(i => i.urgency === 'immediate').length;

  const FILTERS = [
    { key: 'all', label: 'Alle' },
    { key: 'lead_signal', label: 'Leads' },
    { key: 'event_opportunity', label: 'Events' },
    { key: 'trend_alert', label: 'Trends' },
    { key: 'campaign_trigger', label: 'Campagnes' },
    { key: 'content_opportunity', label: 'Content' },
  ] as { key: FeedItemType | 'all'; label: string }[];

  const renderItem = ({ item }: { item: FeedItem }) => {
    const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.lead_signal;
    const isExpanded = expandedId === item.id;
    const urgencyColor = URGENCY_COLORS[item.urgency] || colors.textSecondary;
    const IconComp = cfg.lib === 'mci' ? MaterialCommunityIcons : Ionicons;

    return (
      <TouchableOpacity
        style={[styles.card, !item.is_read && styles.cardUnread]}
        onPress={() => {
          setExpandedId(isExpanded ? null : item.id);
          if (!item.is_read) markRead.mutate(item.id);
        }}
        activeOpacity={0.85}
      >
        <View style={styles.cardTop}>
          <View style={[styles.typeIcon, { backgroundColor: cfg.color + '18' }]}>
            <IconComp name={cfg.icon as any} size={20} color={cfg.color} />
          </View>
          <View style={styles.cardMeta}>
            <View style={styles.badgeRow}>
              <View style={[styles.urgencyBadge, { backgroundColor: urgencyColor + '20' }]}>
                <Text style={[styles.urgencyText, { color: urgencyColor }]}>
                  {URGENCY_LABELS[item.urgency] || item.urgency}
                </Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: cfg.color + '15' }]}>
                <Text style={[styles.typeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle} numberOfLines={isExpanded ? 4 : 2}>{item.title}</Text>
          </View>
          <View style={styles.rightCol}>
            {formatTime(item.timestamp) ? (
              <Text style={styles.timeAgo}>{formatTime(item.timestamp)}</Text>
            ) : null}
            {(item.estimated_value || 0) > 0 && (
              <Text style={styles.value}>{formatValue(item.estimated_value)}</Text>
            )}
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expanded}>
            <Text style={styles.description}>{item.description}</Text>

            {(item.impact_metrics?.leads || item.impact_metrics?.revenue) ? (
              <View style={styles.impactRow}>
                {item.impact_metrics?.leads ? (
                  <View style={styles.impactBadge}>
                    <Text style={styles.impactText}>👥 {item.impact_metrics.leads} leads</Text>
                  </View>
                ) : null}
                {item.impact_metrics?.revenue ? (
                  <View style={styles.impactBadge}>
                    <Text style={styles.impactText}>💰 €{item.impact_metrics.revenue}</Text>
                  </View>
                ) : null}
                {item.impact_metrics?.roi ? (
                  <View style={styles.impactBadge}>
                    <Text style={styles.impactText}>📈 {item.impact_metrics.roi}% ROI</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {item.suggested_action?.label && !item.is_actioned && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: cfg.color }]}
                onPress={() => actionItem.mutate(item.id)}
              >
                <Text style={styles.actionBtnText}>{item.suggested_action.label}</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </TouchableOpacity>
            )}
            {item.is_actioned && (
              <View style={styles.actionedRow}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.actionedText}>Actie ondernomen</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.chevronRow}>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>AI Opportunity Feed</Text>
            <Text style={styles.headerSub}>Centraal overzicht van alle kansen</Text>
          </View>
          <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statVal}>{items.length}</Text>
            <Text style={styles.statLbl}>Totaal</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: '#EF4444' }]}>{unread}</Text>
            <Text style={styles.statLbl}>Ongelezen</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: '#F59E0B' }]}>{immediate}</Text>
            <Text style={styles.statLbl}>Direct</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statVal, { color: colors.success }]}>{formatValue(totalValue)}</Text>
            <Text style={styles.statLbl}>Potentieel</Text>
          </View>
        </View>
      </View>

      {/* Filter chips */}
      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={f => f.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        )}
      />

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="radio-outline" size={52} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>Geen kansen gevonden</Text>
          <Text style={styles.emptySub}>AMOS monitort continu en voegt nieuwe kansen toe.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface, padding: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.sm,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  headerSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  refreshBtn: { padding: spacing.xs },
  statsRow: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  statLbl: { fontSize: 10, color: colors.textSecondary, marginTop: 1 },
  filterRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F4F4F5', borderWidth: 1.5, borderColor: '#E4E4E7',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  emptySub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, ...subtleShadow,
  },
  cardUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  cardTop: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  typeIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardMeta: { flex: 1, gap: 5 },
  badgeRow: { flexDirection: 'row', gap: 5 },
  urgencyBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  urgencyText: { fontSize: 10, fontWeight: fontWeight.bold },
  typeBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  typeText: { fontSize: 10, fontWeight: fontWeight.semibold },
  cardTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, lineHeight: 18 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  timeAgo: { fontSize: 10, color: colors.textTertiary },
  value: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.success },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  expanded: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, gap: spacing.sm, marginTop: spacing.sm },
  description: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
  impactRow: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  impactBadge: { backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  impactText: { fontSize: 11, color: '#166534' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, alignSelf: 'flex-end',
  },
  actionBtnText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.xs },
  actionedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-end' },
  actionedText: { fontSize: fontSize.xs, color: colors.success },
  chevronRow: { alignItems: 'center', marginTop: spacing.xs },
});
