import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCampaigns, type Campaign } from '../hooks/useCampaigns';
import type { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Filter Tabs ────────────────────────────────────────────────────

type FilterKey = 'all' | 'active' | 'draft' | 'completed';

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'active', label: 'Actief' },
  { key: 'draft', label: 'Concept' },
  { key: 'completed', label: 'Voltooid' },
];

// ─── Status & Type Maps ─────────────────────────────────────────────

const statusColors: Record<string, string> = {
  active: colors.success,
  draft: colors.draft,
  completed: colors.textSecondary,
  paused: colors.warning,
};

const statusLabels: Record<string, string> = {
  active: 'Actief',
  draft: 'Concept',
  completed: 'Voltooid',
  paused: 'Gepauzeerd',
};

const typeIcons: Record<Campaign['type'], string> = {
  email: '\u{1F48C}',
  sms: '\u{1F4AC}',
  push: '\u{1F514}',
  'multi-channel': '\u{1F4E1}',
};

const typeLabels: Record<Campaign['type'], string> = {
  email: 'E-mail',
  sms: 'SMS',
  push: 'Push',
  'multi-channel': 'Multi-channel',
};

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
  });
}

function formatBudget(amount: number | null): string {
  if (amount == null) return '\u2014';
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Component ──────────────────────────────────────────────────────

export default function CampaignListScreen() {
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<FilterKey>('all');

  // Pass status filter to API when not "all"
  const statusParam = activeTab === 'all' ? undefined : activeTab;
  const { data: campaigns = [], isLoading, refetch } = useCampaigns(statusParam);

  // Client-side filter as fallback (API may return all)
  const filtered =
    activeTab === 'all'
      ? campaigns
      : campaigns.filter((c) => c.status === activeTab);

  const handleNewCampaign = () => {
    Alert.alert(
      'Nieuwe Campagne',
      'Campagne aanmaken wordt binnenkort beschikbaar.',
      [{ text: 'OK' }],
    );
  };

  // ─── Card Renderer ──────────────────────────────────────────────

  const renderCampaign = ({ item }: { item: Campaign }) => {
    const statusColor = statusColors[item.status] || colors.textSecondary;
    const statusLabel = statusLabels[item.status] || item.status;
    const typeIcon = typeIcons[item.type] || '\u{1F4E8}';
    const typeLabel = typeLabels[item.type] || item.type;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() =>
          navigation.navigate('CampaignDetail' as any, { campaignId: item.id })
        }
      >
        {/* Top row: name + status */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + '18' },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Type badge */}
        <View style={styles.typeBadge}>
          <Text style={styles.typeIcon}>{typeIcon}</Text>
          <Text style={styles.typeLabel}>{typeLabel}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom row: budget + date range */}
        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Text style={styles.footerIcon}>{'\u{1F4B0}'}</Text>
            <Text style={styles.footerText}>
              {formatBudget(item.budget_amount)}
            </Text>
          </View>
          <View style={styles.footerItem}>
            <Text style={styles.footerIcon}>{'\u{1F4C5}'}</Text>
            <Text style={styles.footerText}>
              {formatDate(item.start_date)}
              {item.end_date ? ` \u2013 ${formatDate(item.end_date)}` : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Campagnes</Text>
        <Text style={styles.subtitle}>Inclufy GO</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabs}>
        {FILTER_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Campaign List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderCampaign}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>{'\u{1F4E3}'}</Text>
            <Text style={styles.emptyTitle}>Geen campagnes gevonden</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'all'
                ? 'Maak je eerste campagne aan om te starten'
                : `Geen campagnes met status "${FILTER_TABS.find((t) => t.key === activeTab)?.label}"`}
            </Text>
          </View>
        }
      />

      {/* FAB - New Campaign */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={handleNewCampaign}
      >
        <Text style={styles.fabPlus}>+</Text>
        <Text style={styles.fabLabel}>Nieuwe Campagne</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    gap: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderLight,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  tabTextActive: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.semibold,
  },

  // List
  list: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 120,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...subtleShadow,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // Type badge
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primaryLight + '15',
  },
  typeIcon: {
    fontSize: 14,
  },
  typeLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerIcon: {
    fontSize: 13,
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 36,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabPlus: {
    color: colors.textOnPrimary,
    fontSize: 22,
    fontWeight: fontWeight.bold,
    marginTop: -1,
  },
  fabLabel: {
    color: colors.textOnPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
