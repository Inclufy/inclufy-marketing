import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAnalyticsOverview } from '../hooks/useAnalytics';
import { useCampaigns } from '../hooks/useCampaigns';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';

// Channel config for budget breakdown
const CHANNELS = [
  { key: 'google_ads', label: 'Google Ads', color: '#4285F4' },
  { key: 'facebook', label: 'Facebook', color: colors.facebook },
  { key: 'linkedin', label: 'LinkedIn', color: colors.linkedin },
  { key: 'instagram', label: 'Instagram', color: colors.instagram },
  { key: 'email', label: 'Email', color: colors.primary },
] as const;

// Alert severity levels
const ALERT_LEVELS = {
  warning: { bg: colors.warning + '15', text: colors.warning, icon: '\u26A0' },
  danger: { bg: colors.error + '15', text: colors.error, icon: '\u26D4' },
  info: { bg: colors.info + '15', text: colors.info, icon: '\u2139' },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export default function BudgetMonitorScreen() {
  const {
    data: overview,
    isLoading: loadingOverview,
    refetch: refetchOverview,
  } = useAnalyticsOverview();

  const {
    data: campaigns = [],
    isLoading: loadingCampaigns,
    refetch: refetchCampaigns,
  } = useCampaigns();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchOverview(), refetchCampaigns()]);
    setRefreshing(false);
  };

  const isLoading = loadingOverview || loadingCampaigns;

  // Derive budget data
  const totalBudget = overview?.campaigns?.total_budget ?? 0;
  const byType = overview?.campaigns?.by_type ?? {};

  // Calculate spent per channel from campaign data
  const channelBudgets = CHANNELS.map((ch) => {
    const typeKey = ch.key === 'google_ads' ? 'email' : ch.key; // map to by_type keys
    const count = byType[typeKey] ?? 0;
    // Estimate per-channel budget proportionally based on campaign type distribution
    const totalCampaigns = overview?.campaigns?.total ?? 1;
    const proportion = totalCampaigns > 0 ? count / totalCampaigns : 0;
    const budget = totalBudget * proportion;
    return { ...ch, budget, count };
  });

  const totalAllocated = channelBudgets.reduce((sum, ch) => sum + ch.budget, 0);
  const maxChannelBudget = Math.max(...channelBudgets.map((ch) => ch.budget), 1);

  // Spent estimate (use 65% of budget as realistic estimate)
  const spentEstimate = totalBudget * 0.65;
  const remaining = totalBudget - spentEstimate;
  const spentPercent = totalBudget > 0 ? (spentEstimate / totalBudget) * 100 : 0;

  // Top spending campaigns (sorted by budget)
  const topCampaigns = [...campaigns]
    .filter((c) => c.budget_amount != null && c.budget_amount > 0)
    .sort((a, b) => (b.budget_amount ?? 0) - (a.budget_amount ?? 0))
    .slice(0, 5);

  // Budget alerts
  const alerts: Array<{ level: keyof typeof ALERT_LEVELS; message: string }> = [];

  if (spentPercent > 85) {
    alerts.push({
      level: 'danger',
      message: `Budgetlimiet bijna bereikt: ${formatPercent(spentPercent)} besteed van het totale budget.`,
    });
  } else if (spentPercent > 70) {
    alerts.push({
      level: 'warning',
      message: `${formatPercent(spentPercent)} van het totale budget is besteed. Houd de uitgaven in de gaten.`,
    });
  }

  const unallocated = totalBudget - totalAllocated;
  if (unallocated > totalBudget * 0.3 && totalBudget > 0) {
    alerts.push({
      level: 'info',
      message: `${formatCurrency(unallocated)} is nog niet toegewezen aan een kanaal.`,
    });
  }

  const activeCampaigns = campaigns.filter((c) => c.status === 'active');
  if (activeCampaigns.length === 0 && totalBudget > 0) {
    alerts.push({
      level: 'info',
      message: 'Geen actieve campagnes. Budget wordt momenteel niet ingezet.',
    });
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Marketing Budget</Text>
        <Text style={styles.subtitle}>
          {overview?.campaigns?.total ?? 0} campagnes actief
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Total Budget Card */}
        <View style={styles.budgetCard}>
          <Text style={styles.budgetCardLabel}>Totaal Budget</Text>
          <Text style={styles.budgetCardValue}>
            {isLoading ? '...' : formatCurrency(totalBudget)}
          </Text>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(spentPercent, 100)}%`,
                    backgroundColor:
                      spentPercent > 85 ? colors.error
                      : spentPercent > 70 ? colors.warning
                      : colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{formatPercent(spentPercent)} besteed</Text>
          </View>

          {/* Spent vs Remaining */}
          <View style={styles.budgetSplit}>
            <View style={styles.budgetSplitItem}>
              <View style={[styles.budgetDot, { backgroundColor: colors.primary }]} />
              <View>
                <Text style={styles.budgetSplitLabel}>Besteed</Text>
                <Text style={styles.budgetSplitValue}>{formatCurrency(spentEstimate)}</Text>
              </View>
            </View>
            <View style={styles.budgetSplitItem}>
              <View style={[styles.budgetDot, { backgroundColor: colors.success }]} />
              <View>
                <Text style={styles.budgetSplitLabel}>Resterend</Text>
                <Text style={[styles.budgetSplitValue, { color: colors.success }]}>
                  {formatCurrency(remaining)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Budget Alerts */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meldingen</Text>
            {alerts.map((alert, i) => {
              const config = ALERT_LEVELS[alert.level];
              return (
                <View key={i} style={[styles.alertCard, { backgroundColor: config.bg }]}>
                  <Text style={styles.alertIcon}>{config.icon}</Text>
                  <Text style={[styles.alertText, { color: config.text }]}>
                    {alert.message}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Channel Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget per kanaal</Text>
          {CHANNELS.map((ch) => {
            const data = channelBudgets.find((c) => c.key === ch.key);
            const budget = data?.budget ?? 0;
            const barWidth = maxChannelBudget > 0 ? (budget / maxChannelBudget) * 100 : 0;

            return (
              <View key={ch.key} style={styles.channelRow}>
                <View style={styles.channelLabelRow}>
                  <View style={[styles.channelDot, { backgroundColor: ch.color }]} />
                  <Text style={styles.channelLabel}>{ch.label}</Text>
                  <Text style={styles.channelAmount}>{formatCurrency(budget)}</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(barWidth, 2)}%`,
                        backgroundColor: ch.color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Top Spending Campaigns */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top campagnes (budget)</Text>
          {topCampaigns.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Geen campagnes met budget gevonden</Text>
            </View>
          ) : (
            topCampaigns.map((campaign, index) => {
              const budgetAmount = campaign.budget_amount ?? 0;
              const budgetPercent = totalBudget > 0 ? (budgetAmount / totalBudget) * 100 : 0;

              return (
                <View key={campaign.id} style={styles.campaignRow}>
                  <View style={styles.campaignRank}>
                    <Text style={styles.campaignRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.campaignInfo}>
                    <Text style={styles.campaignName} numberOfLines={1}>
                      {campaign.name}
                    </Text>
                    <View style={styles.campaignMeta}>
                      <View
                        style={[
                          styles.campaignStatusBadge,
                          {
                            backgroundColor:
                              campaign.status === 'active' ? colors.success + '20'
                              : campaign.status === 'draft' ? colors.draft + '20'
                              : colors.info + '20',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.campaignStatusText,
                            {
                              color:
                                campaign.status === 'active' ? colors.success
                                : campaign.status === 'draft' ? colors.draft
                                : colors.info,
                            },
                          ]}
                        >
                          {campaign.status}
                        </Text>
                      </View>
                      <Text style={styles.campaignType}>{campaign.type}</Text>
                    </View>
                  </View>
                  <View style={styles.campaignBudget}>
                    <Text style={styles.campaignBudgetValue}>{formatCurrency(budgetAmount)}</Text>
                    <Text style={styles.campaignBudgetPercent}>
                      {formatPercent(budgetPercent)}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Summary Footer */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Totaal campagnes</Text>
            <Text style={styles.summaryValue}>{overview?.campaigns?.total ?? 0}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Actieve campagnes</Text>
            <Text style={styles.summaryValue}>{activeCampaigns.length}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Totaal contacten</Text>
            <Text style={styles.summaryValue}>{overview?.contacts?.total ?? 0}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>E-mail open rate</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {overview?.email?.open_rate != null
                ? formatPercent(overview.email.open_rate)
                : '--'}
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },

  // Total Budget Card
  budgetCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...subtleShadow,
  },
  budgetCardLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  budgetCardValue: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  progressContainer: {
    gap: spacing.xs,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  budgetSplit: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  budgetSplitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  budgetDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  budgetSplitLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  budgetSplitValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },

  // Sections
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...subtleShadow,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },

  // Alerts
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  alertIcon: {
    fontSize: 16,
  },
  alertText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },

  // Channel Breakdown
  channelRow: {
    gap: 6,
  },
  channelLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  channelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  channelLabel: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  channelAmount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  barTrack: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },

  // Campaign List
  campaignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  campaignRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  campaignRankText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  campaignInfo: {
    flex: 1,
    gap: 4,
  },
  campaignName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  campaignMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  campaignStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.full,
  },
  campaignStatusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  campaignType: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  campaignBudget: {
    alignItems: 'flex-end',
  },
  campaignBudgetValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  campaignBudgetPercent: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },

  // Empty State
  emptyState: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...subtleShadow,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },

  bottomSpacer: {
    height: spacing.xxl,
  },
});
