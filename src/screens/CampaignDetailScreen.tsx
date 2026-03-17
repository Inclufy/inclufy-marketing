import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useCampaign, useUpdateCampaign, useCampaignMetrics } from '../hooks/useCampaigns';
import type { RootStackParamList } from '../types';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../utils/themedStyles';

type Route = RouteProp<RootStackParamList, 'CampaignDetail'>;

// ─── Status & Type Maps ─────────────────────────────────────────────

const statusLabels: Record<string, string> = {
  active: 'Actief',
  draft: 'Concept',
  completed: 'Voltooid',
  paused: 'Gepauzeerd',
};

const typeIcons: Record<string, string> = {
  email: 'mail-outline',
  sms: 'chatbubble-outline',
  push: 'notifications-outline',
  'multi-channel': 'radio-outline',
};

// ─── Helpers ────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '\u2014';
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatBudget(amount: number | null): string {
  if (amount == null) return '\u20AC 0';
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(n: number | undefined | null): string {
  if (n == null) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function formatPercent(n: number | undefined | null): string {
  if (n == null) return '0%';
  return `${n.toFixed(1)}%`;
}

// ─── Component ──────────────────────────────────────────────────────

export default function CampaignDetailScreen() {
  const route = useRoute<Route>();
  const { campaignId } = route.params as { campaignId: string };

  const { data: campaign } = useCampaign(campaignId);
  const { data: metrics } = useCampaignMetrics(campaignId);
  const updateCampaign = useUpdateCampaign();
  const { colors } = useTheme();

  const styles = useThemedStyles((c) => ({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      padding: spacing.md,
      gap: spacing.md,
      paddingBottom: spacing.xxl,
    },

    // Loading
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: c.background,
    },
    loadingText: {
      fontSize: fontSize.md,
      color: c.textSecondary,
    },

    // Header Card
    headerCard: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      ...subtleShadow,
    },
    headerRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    typeIcon: {
      fontSize: 28,
    },
    headerInfo: {
      flex: 1,
    },
    campaignName: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    dateRange: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
      marginTop: 2,
    },
    statusBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      alignSelf: 'flex-start' as const,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
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
    description: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
      lineHeight: 20,
    },

    // Stats Card
    statsCard: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      gap: spacing.md,
      ...subtleShadow,
    },
    sectionTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.text,
    },
    statsGrid: {
      flexDirection: 'row' as const,
    },
    statItem: {
      flex: 1,
      alignItems: 'center' as const,
    },
    statValue: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    statLabel: {
      fontSize: fontSize.xs,
      color: c.textSecondary,
      marginTop: 2,
    },

    // Chart Card
    chartCard: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      gap: spacing.md,
      ...subtleShadow,
    },
    barsContainer: {
      gap: spacing.sm,
    },
    barRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    barLabel: {
      width: 72,
      fontSize: fontSize.xs,
      color: c.textSecondary,
      fontWeight: fontWeight.medium,
    },
    barTrack: {
      flex: 1,
      height: 20,
      backgroundColor: c.borderLight,
      borderRadius: borderRadius.sm,
      overflow: 'hidden' as const,
    },
    barFill: {
      height: '100%' as const,
      borderRadius: borderRadius.sm,
    },
    barValue: {
      width: 40,
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: c.text,
      textAlign: 'right' as const,
    },
    chartFootnote: {
      fontSize: fontSize.xs,
      color: c.textTertiary,
      textAlign: 'center' as const,
    },

    // Actions Card
    actionsCard: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      gap: spacing.md,
      ...subtleShadow,
    },
    actionsRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    actionBtn: {
      flex: 1,
      alignItems: 'center' as const,
      paddingVertical: spacing.md,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
      gap: spacing.xs,
    },
    actionIcon: {
      fontSize: 22,
    },
    actionLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      color: c.textSecondary,
    },

    // Budget Card
    budgetCard: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      gap: spacing.sm,
      ...subtleShadow,
    },
    budgetRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.lg,
      marginTop: spacing.xs,
    },
    budgetSpent: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.text,
      textAlign: 'center' as const,
    },
    budgetTotal: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.textSecondary,
      textAlign: 'center' as const,
    },
    budgetSubtext: {
      fontSize: fontSize.xs,
      color: c.textTertiary,
      textAlign: 'center' as const,
      marginTop: 2,
    },
    budgetSeparator: {
      width: 1,
      height: 36,
      backgroundColor: c.border,
    },
    budgetTrack: {
      height: 8,
      backgroundColor: c.borderLight,
      borderRadius: borderRadius.full,
      overflow: 'hidden' as const,
      marginTop: spacing.xs,
    },
    budgetFill: {
      height: '100%' as const,
      borderRadius: borderRadius.full,
    },
    budgetPercent: {
      fontSize: fontSize.xs,
      color: c.textTertiary,
      textAlign: 'center' as const,
    },

    // Audience Card
    audienceCard: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      gap: spacing.md,
      ...subtleShadow,
    },
    audienceStats: {
      flexDirection: 'row' as const,
      gap: spacing.lg,
    },
    audienceStatItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    audienceIcon: {
      fontSize: 24,
    },
    audienceValue: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    audienceLabel: {
      fontSize: fontSize.xs,
      color: c.textSecondary,
    },
    filterChips: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.xs,
    },
    filterChip: {
      backgroundColor: c.primaryLight + '15',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: borderRadius.sm,
    },
    filterChipText: {
      fontSize: fontSize.xs,
      color: c.primary,
      fontWeight: fontWeight.medium,
    },
  }));

  if (!campaign) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Campagne laden...</Text>
      </View>
    );
  }

  const statusColors: Record<string, string> = {
    active: colors.success,
    draft: colors.draft,
    completed: colors.textSecondary,
    paused: colors.warning,
  };

  const statusColor = statusColors[campaign.status] || colors.textSecondary;
  const statusLabel = statusLabels[campaign.status] || campaign.status;
  const typeIcon = typeIcons[campaign.type] || 'mail-outline';

  // Metrics with safe defaults
  const sent = metrics?.sent ?? 0;
  const opened = metrics?.opened ?? 0;
  const clicked = metrics?.clicked ?? 0;
  const openRate = sent > 0 ? (opened / sent) * 100 : (metrics?.open_rate ?? 0);
  const clickRate = sent > 0 ? (clicked / sent) * 100 : (metrics?.click_rate ?? 0);
  const budgetSpent = metrics?.budget_spent ?? 0;
  const budgetTotal = campaign.budget_amount ?? 0;
  const budgetPercent = budgetTotal > 0 ? Math.min((budgetSpent / budgetTotal) * 100, 100) : 0;

  // Audience info
  const audienceSize = metrics?.audience_size ?? 0;
  const audienceFilters = campaign.audience_filters || {};
  const segmentCount = Object.keys(audienceFilters).length;

  // ─── Quick Actions ──────────────────────────────────────────────

  const handlePause = () => {
    const nextStatus = campaign.status === 'paused' ? 'active' : 'paused';
    const label = nextStatus === 'paused' ? 'pauzeren' : 'hervatten';
    Alert.alert(
      `Campagne ${label}?`,
      `Weet je zeker dat je "${campaign.name}" wilt ${label}?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: label.charAt(0).toUpperCase() + label.slice(1),
          onPress: () => updateCampaign.mutate({ id: campaign.id, status: nextStatus }),
        },
      ],
    );
  };

  const handleEdit = () => {
    Alert.alert('Bewerken', 'Campagne bewerken wordt binnenkort beschikbaar.', [
      { text: 'OK' },
    ]);
  };

  const handleReport = () => {
    Alert.alert('Rapport', 'Rapport genereren wordt binnenkort beschikbaar.', [
      { text: 'OK' },
    ]);
  };

  // ─── Performance Bars ───────────────────────────────────────────

  const maxBarValue = Math.max(sent, opened, clicked, 1);

  const PerformanceBar = ({
    label,
    value,
    barColor,
  }: {
    label: string;
    value: number;
    barColor: string;
  }) => {
    const width = maxBarValue > 0 ? (value / maxBarValue) * 100 : 0;
    return (
      <View style={styles.barRow}>
        <Text style={styles.barLabel}>{label}</Text>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              { width: `${Math.max(width, 2)}%`, backgroundColor: barColor },
            ]}
          />
        </View>
        <Text style={styles.barValue}>{formatNumber(value)}</Text>
      </View>
    );
  };

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {/* Campaign Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Ionicons name={typeIcon as any} size={28} color={colors.primary} />
          <View style={styles.headerInfo}>
            <Text style={styles.campaignName}>{campaign.name}</Text>
            <Text style={styles.dateRange}>
              {formatDate(campaign.start_date)}
              {campaign.end_date ? ` \u2013 ${formatDate(campaign.end_date)}` : ''}
            </Text>
          </View>
        </View>

        <View
          style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}
        >
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusLabel, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>

        {campaign.description ? (
          <Text style={styles.description} numberOfLines={3}>
            {campaign.description}
          </Text>
        ) : null}
      </View>

      {/* Stats Row */}
      <View style={styles.statsCard}>
        <Text style={styles.sectionTitle}>Statistieken</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(sent)}</Text>
            <Text style={styles.statLabel}>Verzonden</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.info }]}>
              {formatNumber(opened)}
            </Text>
            <Text style={styles.statLabel}>Geopend</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {formatNumber(clicked)}
            </Text>
            <Text style={styles.statLabel}>Geklikt</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {formatPercent(openRate)}
            </Text>
            <Text style={styles.statLabel}>Open Rate</Text>
          </View>
        </View>
      </View>

      {/* Performance Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Prestaties</Text>
        <View style={styles.barsContainer}>
          <PerformanceBar label="Verzonden" value={sent} barColor={colors.primary} />
          <PerformanceBar label="Geopend" value={opened} barColor={colors.info} />
          <PerformanceBar label="Geklikt" value={clicked} barColor={colors.success} />
        </View>
        {clickRate > 0 && (
          <Text style={styles.chartFootnote}>
            Click-through rate: {formatPercent(clickRate)}
          </Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Snelle acties</Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handlePause}
            activeOpacity={0.7}
          >
            <Ionicons
              name={campaign.status === 'paused' ? 'play-outline' : 'pause-outline'}
              size={22}
              color={colors.primary}
            />
            <Text style={styles.actionLabel}>
              {campaign.status === 'paused' ? 'Hervatten' : 'Pauzeren'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleEdit}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
            <Text style={styles.actionLabel}>Bewerken</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleReport}
            activeOpacity={0.7}
          >
            <Ionicons name="bar-chart-outline" size={22} color={colors.primary} />
            <Text style={styles.actionLabel}>Rapport</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Budget Section */}
      <View style={styles.budgetCard}>
        <Text style={styles.sectionTitle}>Budget</Text>

        <View style={styles.budgetRow}>
          <View>
            <Text style={styles.budgetSpent}>{formatBudget(budgetSpent)}</Text>
            <Text style={styles.budgetSubtext}>besteed</Text>
          </View>
          <View style={styles.budgetSeparator} />
          <View>
            <Text style={styles.budgetTotal}>{formatBudget(budgetTotal)}</Text>
            <Text style={styles.budgetSubtext}>totaal</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.budgetTrack}>
          <View
            style={[
              styles.budgetFill,
              {
                width: `${budgetPercent}%`,
                backgroundColor:
                  budgetPercent > 90
                    ? colors.error
                    : budgetPercent > 70
                      ? colors.warning
                      : colors.success,
              },
            ]}
          />
        </View>
        <Text style={styles.budgetPercent}>
          {budgetPercent.toFixed(0)}% van budget gebruikt
        </Text>
      </View>

      {/* Audience Section */}
      <View style={styles.audienceCard}>
        <Text style={styles.sectionTitle}>Doelgroep</Text>

        <View style={styles.audienceStats}>
          <View style={styles.audienceStatItem}>
            <Ionicons name="people-outline" size={24} color={colors.primary} />
            <View>
              <Text style={styles.audienceValue}>
                {formatNumber(audienceSize)}
              </Text>
              <Text style={styles.audienceLabel}>Ontvangers</Text>
            </View>
          </View>

          <View style={styles.audienceStatItem}>
            <Ionicons name="locate-outline" size={24} color={colors.primary} />
            <View>
              <Text style={styles.audienceValue}>{segmentCount}</Text>
              <Text style={styles.audienceLabel}>
                {segmentCount === 1 ? 'Segment' : 'Segmenten'}
              </Text>
            </View>
          </View>
        </View>

        {/* Audience filter chips */}
        {segmentCount > 0 && (
          <View style={styles.filterChips}>
            {Object.entries(audienceFilters).map(([key, value]) => (
              <View key={key} style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  {key}: {String(value)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
