import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDashboardStats } from '../hooks/useAnalytics';
import { useCampaigns } from '../hooks/useCampaigns';
import type { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';

// ─── Types ──────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface AIAlert {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: 'budget' | 'engagement' | 'leads';
  color: string;
}

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  color: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_AI_ALERTS: AIAlert[] = [
  {
    id: '1',
    icon: '\u{1F4B0}',
    title: 'Budget optimalisatie',
    description:
      'Verplaats \u20AC1.200 budget van Facebook naar Google Ads. Verwachte ROI: +18%',
    type: 'budget',
    color: colors.warning,
  },
  {
    id: '2',
    icon: '\u{1F4C8}',
    title: 'Engagement piek',
    description: 'Je Instagram engagement is 40% hoger dan vorige week!',
    type: 'engagement',
    color: colors.success,
  },
  {
    id: '3',
    icon: '\u{1F465}',
    title: 'Nieuwe leads',
    description: '3 nieuwe leads via LinkedIn campagne',
    type: 'leads',
    color: colors.info,
  },
];

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Campagne', icon: '\u{1F680}', route: 'CampaignList', color: colors.primary },
  { label: 'Content', icon: '\u{270D}\uFE0F', route: 'ContentCreator', color: colors.secondary },
  { label: 'Lead', icon: '\u{1F465}', route: 'LeadCapture', color: colors.success },
  { label: 'Budget', icon: '\u{1F4B3}', route: 'BudgetMonitor', color: colors.warning },
];

// ─── Status Helpers ─────────────────────────────────────────────────────────

const statusLabel: Record<string, string> = {
  draft: 'Concept',
  active: 'Actief',
  paused: 'Gepauzeerd',
  completed: 'Voltooid',
  scheduled: 'Gepland',
};

const statusColor: Record<string, string> = {
  draft: colors.draft,
  active: colors.success,
  paused: colors.warning,
  completed: colors.textSecondary,
  scheduled: colors.info,
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: campaigns = [], isLoading: campaignsLoading, refetch: refetchCampaigns } = useCampaigns();

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const visibleAlerts = MOCK_AI_ALERTS.filter((a) => !dismissedAlerts.has(a.id));

  const recentCampaigns = campaigns.slice(0, 3);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchCampaigns()]);
    setRefreshing(false);
  }, [refetchStats, refetchCampaigns]);

  const dismissAlert = (id: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(id));
  };

  const acceptAlert = (alert: AIAlert) => {
    // Will connect to AI action engine later
    dismissAlert(alert.id);
  };

  // ─── Helpers ──────────────────────────────────────────────────────────

  const formatNumber = (n: number | undefined): string => {
    if (n === undefined || n === null) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
  };

  const formatCurrency = (n: number | undefined): string => {
    if (n === undefined || n === null) return '\u20AC0';
    if (n >= 1_000_000) return `\u20AC${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `\u20AC${(n / 1_000).toFixed(1)}K`;
    return `\u20AC${n}`;
  };

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ── Welcome Header ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welkom terug!</Text>
            <Text style={styles.headerSubtitle}>
              Hier is je marketing overzicht
            </Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>IM</Text>
          </View>
        </View>

        {/* ── Quick Stats ────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardHalf]}>
            <Text style={styles.statValue}>
              {statsLoading ? '-' : formatNumber(stats?.active_campaigns)}
            </Text>
            <Text style={styles.statLabel}>Actieve Campagnes</Text>
            <View style={[styles.statIndicator, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.statIndicatorText, { color: colors.primary }]}>
                {'\u{1F680}'} Live
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardHalf]}>
            <Text style={styles.statValue}>
              {statsLoading ? '-' : formatNumber(stats?.total_contacts)}
            </Text>
            <Text style={styles.statLabel}>Totaal Contacten</Text>
            <View style={[styles.statIndicator, { backgroundColor: colors.info + '20' }]}>
              <Text style={[styles.statIndicatorText, { color: colors.info }]}>
                {'\u{1F465}'} Database
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardHalf]}>
            <Text style={styles.statValue}>24.8%</Text>
            <Text style={styles.statLabel}>Open Rate</Text>
            <View style={[styles.statIndicator, { backgroundColor: colors.success + '20' }]}>
              <Text style={[styles.statIndicatorText, { color: colors.success }]}>
                {'\u{2191}'} +3.2%
              </Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardHalf]}>
            <Text style={styles.statValue}>
              {statsLoading ? '-' : formatCurrency(stats?.total_revenue)}
            </Text>
            <Text style={styles.statLabel}>Omzet</Text>
            <View style={[styles.statIndicator, { backgroundColor: colors.success + '20' }]}>
              <Text style={[styles.statIndicatorText, { color: colors.success }]}>
                {'\u{2191}'} +12%
              </Text>
            </View>
          </View>
        </View>

        {/* ── AI Alerts ──────────────────────────────────────────────── */}
        {visibleAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{'\u{1F916}'} AI Aanbevelingen</Text>
              <Text style={styles.sectionBadge}>{visibleAlerts.length}</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.alertsScroll}
              decelerationRate="fast"
              snapToInterval={280 + spacing.sm}
            >
              {visibleAlerts.map((alert) => (
                <View key={alert.id} style={styles.alertCard}>
                  <View style={[styles.alertAccent, { backgroundColor: alert.color }]} />

                  <View style={styles.alertContent}>
                    <View style={styles.alertHeader}>
                      <Text style={styles.alertIcon}>{alert.icon}</Text>
                      <Text style={styles.alertTitle} numberOfLines={1}>
                        {alert.title}
                      </Text>
                    </View>

                    <Text style={styles.alertDescription} numberOfLines={3}>
                      {alert.description}
                    </Text>

                    <View style={styles.alertActions}>
                      <TouchableOpacity
                        style={[styles.alertBtn, styles.alertBtnAccept]}
                        onPress={() => acceptAlert(alert)}
                      >
                        <Text style={styles.alertBtnAcceptText}>Accepteer</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.alertBtn, styles.alertBtnDismiss]}
                        onPress={() => dismissAlert(alert.id)}
                      >
                        <Text style={styles.alertBtnDismissText}>Negeer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Quick Actions ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Snelle acties</Text>

          <View style={styles.actionsRow}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.route}
                style={styles.actionBtn}
                onPress={() => navigation.navigate(action.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: action.color + '15' }]}>
                  <Text style={styles.actionIcon}>{action.icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Recent Activity ────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recente campagnes</Text>
            {campaigns.length > 3 && (
              <TouchableOpacity onPress={() => navigation.navigate('CampaignList' as any)}>
                <Text style={styles.seeAllText}>Bekijk alles</Text>
              </TouchableOpacity>
            )}
          </View>

          {campaignsLoading ? (
            <View style={styles.loadingPlaceholder}>
              <Text style={styles.loadingText}>Laden...</Text>
            </View>
          ) : recentCampaigns.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>{'\u{1F4CB}'}</Text>
              <Text style={styles.emptyTitle}>Nog geen campagnes</Text>
              <Text style={styles.emptyDescription}>
                Start je eerste campagne om hier resultaten te zien
              </Text>
            </View>
          ) : (
            <View style={styles.campaignList}>
              {recentCampaigns.map((campaign, index) => {
                const status = campaign.status || 'draft';
                const badgeColor = statusColor[status] || colors.textSecondary;

                return (
                  <TouchableOpacity
                    key={campaign.id}
                    style={[
                      styles.campaignCard,
                      index < recentCampaigns.length - 1 && styles.campaignCardBorder,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.campaignInfo}>
                      <Text style={styles.campaignName} numberOfLines={1}>
                        {campaign.name}
                      </Text>
                      <Text style={styles.campaignMeta}>
                        {campaign.type}{' '}
                        {campaign.start_date
                          ? `\u{2022} ${new Date(campaign.start_date).toLocaleDateString('nl-NL', {
                              day: 'numeric',
                              month: 'short',
                            })}`
                          : ''}
                      </Text>
                    </View>

                    <View style={[styles.campaignBadge, { backgroundColor: badgeColor + '15' }]}>
                      <View style={[styles.campaignBadgeDot, { backgroundColor: badgeColor }]} />
                      <Text style={[styles.campaignBadgeText, { color: badgeColor }]}>
                        {statusLabel[status] || status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...subtleShadow,
  },
  statCardHalf: {
    width: '48.5%' as any,
    flexGrow: 1,
  },
  statValue: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
  },
  statIndicatorText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Sections
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    paddingHorizontal: spacing.lg,
  },
  sectionBadge: {
    backgroundColor: colors.primary,
    color: colors.textOnPrimary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    textAlign: 'center',
    lineHeight: 22,
    overflow: 'hidden',
    paddingHorizontal: 6,
  },
  seeAllText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },

  // AI Alerts
  alertsScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  alertCard: {
    width: 280,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...subtleShadow,
  },
  alertAccent: {
    height: 4,
    width: '100%',
  },
  alertContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  alertIcon: {
    fontSize: 20,
  },
  alertTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    flex: 1,
  },
  alertDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  alertActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  alertBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  alertBtnAccept: {
    backgroundColor: colors.primary,
  },
  alertBtnAcceptText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  alertBtnDismiss: {
    backgroundColor: colors.borderLight,
  },
  alertBtnDismissText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },

  // Recent Campaigns
  campaignList: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...subtleShadow,
  },
  campaignCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  campaignCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  campaignInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  campaignName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  campaignMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  campaignBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  campaignBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  campaignBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // Empty / Loading
  loadingPlaceholder: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...subtleShadow,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
