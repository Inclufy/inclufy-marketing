import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useTranslation } from '../i18n';

type OpportunityType = 'trending' | 'event' | 'budget' | 'lead' | 'content' | 'channel';

interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action: string;
  route?: string;
  timeAgo: string;
}

const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: '1',
    type: 'trending',
    title: 'AI Marketing trending on LinkedIn',
    description: 'Posts about AI marketing automation have 3x more engagement this week. Post now to ride the wave.',
    impact: 'high',
    action: 'Create post',
    route: 'ContentCreator',
    timeAgo: '2h ago',
  },
  {
    id: '2',
    type: 'event',
    title: 'Marketing Summit near you',
    description: 'B2B Marketing Summit in 5 days. High lead potential (score: 87). 3 competitors attending.',
    impact: 'high',
    action: 'View event',
    route: 'EventSetup',
    timeAgo: '4h ago',
  },
  {
    id: '3',
    type: 'budget',
    title: 'Budget optimization available',
    description: 'Email campaigns showing 2.3x better ROI than social ads this month. Reallocate 20% for +\u20ac840 projected revenue.',
    impact: 'high',
    action: 'View budget',
    route: 'BudgetMonitor',
    timeAgo: '6h ago',
  },
  {
    id: '4',
    type: 'lead',
    title: '3 leads went cold \u2014 act now',
    description: "Leads captured at the Tech Expo haven't been contacted in 5 days. Strike while hot.",
    impact: 'medium',
    action: 'View leads',
    route: 'LeadCapture',
    timeAgo: '1d ago',
  },
  {
    id: '5',
    type: 'content',
    title: 'Best time to post: Today 18:00',
    description: 'Your audience is most active between 17:00\u201319:00 on Thursdays. Schedule a post for peak engagement.',
    impact: 'medium',
    action: 'Create content',
    route: 'ContentCreator',
    timeAgo: '1d ago',
  },
  {
    id: '6',
    type: 'channel',
    title: 'LinkedIn outperforming Instagram 4x',
    description: 'Your LinkedIn content generates 4x more qualified leads than Instagram. Consider shifting resources.',
    impact: 'medium',
    action: 'See analytics',
    timeAgo: '2d ago',
  },
];

const TYPE_CONFIG: Record<OpportunityType, { icon: string; color: string; bg: string; lib: string }> = {
  trending: { icon: 'trending-up', color: '#9333EA', bg: '#F3E8FF', lib: 'Ionicons' },
  event: { icon: 'calendar-star', color: '#DB2777', bg: '#FCE7F3', lib: 'MaterialCommunityIcons' },
  budget: { icon: 'cash-outline', color: '#D97706', bg: '#FEF3C7', lib: 'Ionicons' },
  lead: { icon: 'people-outline', color: '#10b981', bg: '#D1FAE5', lib: 'Ionicons' },
  content: { icon: 'create-outline', color: '#3b82f6', bg: '#EFF6FF', lib: 'Ionicons' },
  channel: { icon: 'bar-chart-outline', color: '#0077b5', bg: '#E0F2FE', lib: 'Ionicons' },
};

const IMPACT_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#10b981',
};

const IMPACT_LABELS: Record<string, string> = {
  high: 'High impact',
  medium: 'Medium',
  low: 'Low',
};

function ImpactDot({ level }: { level: 'high' | 'medium' | 'low' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{
        width: 7, height: 7, borderRadius: 4,
        backgroundColor: IMPACT_COLORS[level],
      }} />
      <Text style={{ fontSize: 11, color: IMPACT_COLORS[level], fontWeight: '600' }}>
        {IMPACT_LABELS[level]}
      </Text>
    </View>
  );
}

export default function OpportunityRadarScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<OpportunityType | 'all'>('all');

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const handleDismiss = (id: string) => {
    setDismissed(prev => [...prev, id]);
  };

  const handleAction = (opp: Opportunity) => {
    if (opp.route) {
      navigation.navigate(opp.route as any);
    } else {
      Alert.alert(opp.title, 'Feature coming soon!');
    }
  };

  const FILTERS: Array<{ key: OpportunityType | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'trending', label: 'Trending' },
    { key: 'event', label: 'Events' },
    { key: 'budget', label: 'Budget' },
    { key: 'lead', label: 'Leads' },
    { key: 'content', label: 'Content' },
  ];

  const visible = MOCK_OPPORTUNITIES.filter(o =>
    !dismissed.includes(o.id) &&
    (filter === 'all' || o.type === filter)
  );

  const highCount = visible.filter(o => o.impact === 'high').length;

  return (
    <View style={styles.container}>
      {/* Header stats */}
      <View style={styles.header}>
        <View style={styles.radarBadge}>
          <MaterialCommunityIcons name="radar" size={18} color={colors.primary} />
          <Text style={styles.radarBadgeText}>{t.radar?.live ?? 'Live AI Radar'}</Text>
        </View>
        <Text style={styles.headerTitle}>{t.radar?.title ?? 'Opportunity Radar'}</Text>
        <Text style={styles.headerSub}>
          {highCount > 0
            ? `${highCount} ${t.radar?.highImpact ?? 'high-impact opportunities'}`
            : t.radar?.noHighImpact ?? 'All opportunities reviewed'}
        </Text>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {visible.length === 0 && (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="radar" size={52} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>{t.radar?.allClear ?? 'All clear!'}</Text>
            <Text style={styles.emptySub}>{t.radar?.allClearSub ?? 'No opportunities right now. Pull to refresh.'}</Text>
          </View>
        )}

        {visible.map(opp => {
          const cfg = TYPE_CONFIG[opp.type];
          const IconComp = cfg.lib === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
          return (
            <View key={opp.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={[styles.typeIcon, { backgroundColor: cfg.bg }]}>
                  <IconComp name={cfg.icon as any} size={20} color={cfg.color} />
                </View>
                <View style={styles.cardMeta}>
                  <ImpactDot level={opp.impact} />
                  <Text style={styles.timeAgo}>{opp.timeAgo}</Text>
                </View>
              </View>

              <Text style={styles.cardTitle}>{opp.title}</Text>
              <Text style={styles.cardDesc}>{opp.description}</Text>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.dismissBtn} onPress={() => handleDismiss(opp.id)}>
                  <Ionicons name="close" size={14} color={colors.textTertiary} />
                  <Text style={styles.dismissText}>{t.radar?.dismiss ?? 'Dismiss'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: cfg.color }]}
                  onPress={() => handleAction(opp)}
                >
                  <Text style={styles.actionBtnText}>{opp.action}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  radarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3E8FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.xs,
  },
  radarBadgeText: { fontSize: 11, color: colors.primary, fontWeight: fontWeight.semibold },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  headerSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  filterRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F4F4F5',
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: '#3f3f46' },
  chipTextActive: { color: '#fff' },
  list: { padding: spacing.md, gap: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  typeIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardMeta: { alignItems: 'flex-end', gap: 4 },
  timeAgo: { fontSize: 10, color: colors.textTertiary },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text, marginBottom: 6 },
  cardDesc: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dismissBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 2 },
  dismissText: { fontSize: fontSize.xs, color: colors.textTertiary },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  actionBtnText: { color: '#fff', fontWeight: fontWeight.semibold, fontSize: fontSize.xs },
  empty: { alignItems: 'center', paddingTop: 60, gap: spacing.sm },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  emptySub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center' },
});
