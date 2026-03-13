import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDashboardStats } from '../hooks/useAnalytics';
import { useCampaigns } from '../hooks/useCampaigns';
import { useUnreadNotificationCount } from '../hooks/useNotifications';
import type { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';
import { useTranslation } from '../i18n';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface AIAlert {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  type: 'budget' | 'engagement' | 'leads';
  color: string;
}

interface QuickAction {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  color: string;
}

// ─── Status Helpers ─────────────────────────────────────────────────────────

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
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();
  const { data: campaigns = [], isLoading: campaignsLoading, refetch: refetchCampaigns } = useCampaigns();
  const unreadNotifCount = useUnreadNotificationCount();

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Real AI alerts from Supabase feed_items (replaces mock data)
  const { data: feedAlerts = [], refetch: refetchFeed } = useQuery({
    queryKey: ['home_feed_alerts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('feed_items')
        .select('id, type, title, description, urgency, estimated_value, is_read')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5);
      return (data || []).map((item: any) => ({
        id: item.id,
        icon: item.type === 'budget' ? 'cash-outline' : item.type === 'lead' ? 'people-outline' : 'trending-up-outline',
        title: item.title,
        description: item.description,
        type: item.type,
        color: item.urgency === 'immediate' ? colors.error : item.urgency === 'high' ? colors.warning : colors.info,
      } as AIAlert));
    },
  });

  const QUICK_ACTIONS: QuickAction[] = [
    { label: 'Campagnes', icon: 'megaphone-outline', route: 'CampaignsTab', color: colors.primary },
    { label: 'Content', icon: 'create-outline', route: 'ContentCreator', color: colors.secondary },
    { label: 'QR Scan', icon: 'qr-code-outline', route: 'QRScan', color: colors.success },
    { label: 'Events', icon: 'radar', route: 'EventIntelligence', color: colors.warning },
  ];

  const statusLabel: Record<string, string> = {
    draft: t.status.draft,
    active: t.status.active,
    paused: t.status.paused,
    completed: t.status.completed,
    scheduled: t.status.scheduled,
  };

  const visibleAlerts = feedAlerts.filter((a) => !dismissedAlerts.has(a.id));

  const recentCampaigns = campaigns.slice(0, 3);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchCampaigns(), refetchFeed()]);
    setRefreshing(false);
  }, [refetchStats, refetchCampaigns, refetchFeed]);

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
            <Text style={styles.greeting}>{t.home.greeting}</Text>
            <Text style={styles.headerSubtitle}>
              {t.home.subtitle}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Notifications' as any)}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {unreadNotifCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadNotifCount > 9 ? '9+' : String(unreadNotifCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate('Settings' as any)}
            >
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Quick Stats ────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardHalf]}>
            <Text style={styles.statValue}>
              {statsLoading ? '-' : formatNumber(stats?.active_campaigns)}
            </Text>
            <Text style={styles.statLabel}>{t.home.activeCampaigns}</Text>
            <View style={[styles.statIndicator, { backgroundColor: colors.primary + '20' }]}>
              <View style={styles.statIndicatorRow}>
                <Ionicons name="rocket-outline" size={12} color={colors.primary} />
                <Text style={[styles.statIndicatorText, { color: colors.primary }]}> {t.home.live}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardHalf]}>
            <Text style={styles.statValue}>
              {statsLoading ? '-' : formatNumber(stats?.total_contacts)}
            </Text>
            <Text style={styles.statLabel}>{t.home.totalContacts}</Text>
            <View style={[styles.statIndicator, { backgroundColor: colors.info + '20' }]}>
              <View style={styles.statIndicatorRow}>
                <Ionicons name="people-outline" size={12} color={colors.info} />
                <Text style={[styles.statIndicatorText, { color: colors.info }]}> {t.home.database}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardHalf]}>
            <Text style={styles.statValue}>24.8%</Text>
            <Text style={styles.statLabel}>{t.home.openRate}</Text>
            <View style={[styles.statIndicator, { backgroundColor: colors.success + '20' }]}>
              <View style={styles.statIndicatorRow}>
                <Ionicons name="arrow-up" size={12} color={colors.success} />
                <Text style={[styles.statIndicatorText, { color: colors.success }]}> +3.2%</Text>
              </View>
            </View>
          </View>

          <View style={[styles.statCard, styles.statCardHalf]}>
            <Text style={styles.statValue}>
              {statsLoading ? '-' : formatCurrency(stats?.total_revenue)}
            </Text>
            <Text style={styles.statLabel}>{t.home.revenue}</Text>
            <View style={[styles.statIndicator, { backgroundColor: colors.success + '20' }]}>
              <View style={styles.statIndicatorRow}>
                <Ionicons name="arrow-up" size={12} color={colors.success} />
                <Text style={[styles.statIndicatorText, { color: colors.success }]}> +12%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── AI Alerts ──────────────────────────────────────────────── */}
        {visibleAlerts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="sparkles" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}> {t.home.aiRecommendations}</Text>
              </View>
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
                      <Ionicons name={alert.icon} size={20} color={alert.color} />
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
                        <Text style={styles.alertBtnAcceptText}>{t.common.accept}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.alertBtn, styles.alertBtnDismiss]}
                        onPress={() => dismissAlert(alert.id)}
                      >
                        <Text style={styles.alertBtnDismissText}>{t.common.dismiss}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Opportunity Radar Banner ───────────────────────────────── */}
        <TouchableOpacity
          style={styles.radarBanner}
          onPress={() => navigation.navigate('OpportunityFeed' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.radarBannerLeft}>
            <View style={styles.radarPulse}>
              <Ionicons name="radio-outline" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.radarBannerTitle}>{t.home.radarTitle}</Text>
              <Text style={styles.radarBannerSub}>{t.home.radarSub}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* ── Marketing Automation Banner ────────────────────────────── */}
        <TouchableOpacity
          style={styles.automationBanner}
          onPress={() => navigation.navigate('AutonomousHub' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.radarBannerLeft}>
            <View style={styles.automationPulse}>
              <Ionicons name="rocket-outline" size={22} color="#9333EA" />
            </View>
            <View>
              <Text style={styles.radarBannerTitle}>{t.home.automationTitle}</Text>
              <Text style={styles.radarBannerSub}>{t.home.automationSub}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9333EA" />
        </TouchableOpacity>

        {/* ── Quick Actions ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.home.quickActions}</Text>

          <View style={styles.actionsRow}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.route}
                style={styles.actionBtn}
                onPress={() => navigation.navigate(action.route as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: action.color + '15' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Recent Activity ────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.home.recentCampaigns}</Text>
            {campaigns.length > 3 && (
              <TouchableOpacity onPress={() => navigation.navigate('CampaignsTab' as any)}>
                <Text style={styles.seeAllText}>{t.home.viewAll}</Text>
              </TouchableOpacity>
            )}
          </View>

          {campaignsLoading ? (
            <View style={styles.loadingPlaceholder}>
              <Text style={styles.loadingText}>{t.common.loading}</Text>
            </View>
          ) : recentCampaigns.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={36} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>{t.home.noCampaigns}</Text>
              <Text style={styles.emptyDescription}>
                {t.home.noCampaignsDesc}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800' as any,
    letterSpacing: -0.2,
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
  statIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  radarBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary + '30',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  radarBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  radarPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  automationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#9333EA30',
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  automationPulse: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarBannerTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  radarBannerSub: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
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
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
