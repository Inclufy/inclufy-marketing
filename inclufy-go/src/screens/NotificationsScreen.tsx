import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';
import { useTranslation } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface Notification {
  id: string;
  type: 'ai_suggestion' | 'campaign_alert' | 'lead_alert' | 'performance' | 'system';
  title: string;
  message: string;
  action?: string;
  timestamp: string;
  read: boolean;
}

const ICON_MAP: Record<string, string> = {
  ai_suggestion: 'sparkles',
  campaign_alert: 'megaphone',
  lead_alert: 'people',
  performance: 'trending-up',
  system: 'notifications',
};

const COLOR_MAP: Record<string, string> = {
  ai_suggestion: colors.primary,
  campaign_alert: colors.warning,
  lead_alert: colors.success,
  performance: colors.info,
  system: colors.textSecondary,
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  // Mock notifications - will be replaced by real push notifications / backend
  const MOCK_NOTIFICATIONS: Notification[] = [
    {
      id: '1',
      type: 'ai_suggestion',
      title: 'Budget Optimalisatie',
      message: 'Verplaats \u20AC1.200 budget van Facebook naar Google Ads. Verwachte ROI: +18%.',
      action: 'accept',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      read: false,
    },
    {
      id: '2',
      type: 'performance',
      title: 'Engagement Piek',
      message: 'Je Instagram engagement is 40% hoger dan vorige week! Overweeg meer content te plaatsen.',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      read: false,
    },
    {
      id: '3',
      type: 'lead_alert',
      title: 'Nieuwe Leads',
      message: '3 nieuwe leads binnengekomen via je LinkedIn campagne "Tech Summit 2026".',
      timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      read: false,
    },
    {
      id: '4',
      type: 'campaign_alert',
      title: 'Budget Waarschuwing',
      message: 'Campagne "Ramadan Promo" heeft 85% van het budget verbruikt met nog 5 dagen te gaan.',
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      read: true,
    },
    {
      id: '5',
      type: 'ai_suggestion',
      title: 'Content Suggestie',
      message: 'Op basis van trending topics: maak een post over "AI in Marketing" voor LinkedIn. Verwachte bereik: +25%.',
      action: 'create',
      timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      read: true,
    },
    {
      id: '6',
      type: 'performance',
      title: 'Email Open Rate',
      message: 'Je nieuwsbrief "Weekly Update #12" heeft een open rate van 38% - 12% boven gemiddeld!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      read: true,
    },
    {
      id: '7',
      type: 'system',
      title: 'Nieuwe Feature',
      message: 'AI Content Creator is nu beschikbaar! Genereer automatisch social posts, captions en meer.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      read: true,
    },
  ];

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t.notifications.justNow;
    if (mins < 60) return `${mins}${t.notifications.minutesAgo}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}${t.notifications.hoursAgo}`;
    const days = Math.floor(hours / 24);
    return `${days}${t.notifications.daysAgo}`;
  }

  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleAction = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.action === 'accept') {
      Alert.alert(
        t.notifications.aiRecommendation,
        notification.message,
        [
          { text: t.common.dismiss, style: 'cancel' },
          {
            text: t.common.accept,
            onPress: () => Alert.alert(t.notifications.accepted, t.notifications.acceptedMsg),
          },
        ],
      );
    } else if (notification.action === 'create') {
      navigation.navigate('ContentCreator');
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = ICON_MAP[item.type] || 'notifications';
    const accentColor = COLOR_MAP[item.type] || colors.textSecondary;

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.notifUnread]}
        onPress={() => handleAction(item)}
        activeOpacity={0.7}
      >
        {/* Accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <View style={[styles.iconCircle, { backgroundColor: accentColor + '15' }]}>
              <Ionicons name={icon as any} size={18} color={accentColor} />
            </View>
            <View style={styles.notifTitleRow}>
              <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
                {item.title}
              </Text>
              <Text style={styles.notifTime}>{timeAgo(item.timestamp)}</Text>
            </View>
          </View>

          <Text style={styles.notifMessage}>{item.message}</Text>

          {item.action && !item.read && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: accentColor }]}
                onPress={() => handleAction(item)}
              >
                <Text style={styles.actionBtnText}>
                  {item.action === 'accept' ? t.common.accept : t.notifications.createContent}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => markAsRead(item.id)}
              >
                <Text style={styles.dismissBtnText}>{t.common.dismiss}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!item.read && !item.action && (
            <View style={styles.unreadDot} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t.notifications.title}</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>
              {unreadCount} {t.notifications.unread}
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllRead}>{t.notifications.markAllRead}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notification List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>{t.notifications.noNotifications}</Text>
            <Text style={styles.emptySubtext}>
              {t.notifications.allCaughtUp}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingTop: 60,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.primary,
    marginTop: 2,
  },
  markAllRead: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...subtleShadow,
  },
  notifUnread: {
    backgroundColor: '#faf5ff', // very light purple
  },
  accentBar: {
    width: 4,
  },
  notifContent: {
    flex: 1,
    padding: spacing.md,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifIcon: {
    fontSize: 18,
  },
  notifTitleRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  notifTitleUnread: {
    fontWeight: fontWeight.semibold,
  },
  notifTime: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
  notifMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  dismissBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dismissBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 2,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
