import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';
import { useTranslation } from '../i18n';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useRespondToInvite,
  type AppNotification,
} from '../hooks/useNotifications';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Notification type config ─────────────────────────────────────

type NotifConfig = { icon: string; color: string };

const TYPE_CONFIG: Record<string, NotifConfig> = {
  team_invite:    { icon: 'people',        color: '#7c3aed' },
  ai_suggestion:  { icon: 'sparkles',      color: colors.primary },
  post_published: { icon: 'checkmark-circle', color: colors.success },
  event_update:   { icon: 'calendar',      color: colors.info },
  system:         { icon: 'notifications', color: colors.textSecondary },
};

const ROLE_LABELS: Record<string, string> = {
  editor:      'Editor',
  contributor: 'Bijdrager',
  viewer:      'Kijker',
  owner:       'Eigenaar',
};

// ─── Helpers ─────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Zojuist';
  if (mins < 60) return `${mins}m geleden`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}u geleden`;
  const days = Math.floor(hours / 24);
  return `${days}d geleden`;
}

// ─── Team Invite Card ─────────────────────────────────────────────

function TeamInviteCard({
  notification,
  onAccept,
  onDecline,
  onDismiss,
  responding,
}: {
  notification: AppNotification;
  onAccept: () => void;
  onDecline: () => void;
  onDismiss: () => void;
  responding: boolean;
}) {
  const { data } = notification;
  const role = ROLE_LABELS[data.role || ''] || data.role || 'Bijdrager';

  return (
    <View style={[styles.inviteCard, !notification.read && styles.cardUnread]}>
      {/* Accent bar */}
      <View style={[styles.accentBar, { backgroundColor: '#7c3aed' }]} />

      <View style={styles.cardContent}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: '#f3e8ff' }]}>
            <Ionicons name="people" size={18} color="#7c3aed" />
          </View>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, styles.cardTitleUnread]} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={styles.cardTime}>{timeAgo(notification.created_at)}</Text>
          </View>
        </View>

        {/* Event info */}
        <View style={styles.inviteEventBox}>
          <Ionicons name="calendar-outline" size={13} color="#7c3aed" />
          <Text style={styles.inviteEventName} numberOfLines={1}>{data.event_name}</Text>
        </View>

        {/* Invited by + role */}
        <Text style={styles.cardBody}>
          <Text style={{ fontWeight: fontWeight.semibold, color: colors.text }}>
            {data.invited_by}
          </Text>{' '}
          nodigt je uit als{' '}
          <Text style={{ fontWeight: fontWeight.semibold, color: '#7c3aed' }}>
            {role}
          </Text>
        </Text>

        {/* Action buttons */}
        {!notification.read && (
          <View style={styles.inviteActions}>
            {responding ? (
              <ActivityIndicator size="small" color="#7c3aed" />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={onAccept}
                >
                  <Ionicons name="checkmark" size={14} color="#fff" />
                  <Text style={styles.acceptBtnText}>Accepteren</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.declineBtn}
                  onPress={onDecline}
                >
                  <Text style={styles.declineBtnText}>Weigeren</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Already responded */}
        {notification.read && (
          <Text style={styles.respondedText}>✓ Beantwoord</Text>
        )}
      </View>
    </View>
  );
}

// ─── Generic Notification Card ────────────────────────────────────

function NotifCard({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;

  return (
    <TouchableOpacity
      style={[styles.card, !notification.read && styles.cardUnread]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.accentBar, { backgroundColor: cfg.color }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: cfg.color + '18' }]}>
            <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
          </View>
          <View style={styles.cardTitleRow}>
            <Text
              style={[styles.cardTitle, !notification.read && styles.cardTitleUnread]}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            <Text style={styles.cardTime}>{timeAgo(notification.created_at)}</Text>
          </View>
        </View>
        {notification.body ? (
          <Text style={styles.cardBody}>{notification.body}</Text>
        ) : null}
        {!notification.read && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();

  const { data: notifications = [], isLoading, refetch } = useNotifications();
  const markRead       = useMarkNotificationRead();
  const markAllRead    = useMarkAllNotificationsRead();
  const respondInvite  = useRespondToInvite();

  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [refreshing,   setRefreshing]   = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const invites  = notifications.filter((n) => n.type === 'team_invite' && !n.read);
  const rest     = notifications.filter((n) => !(n.type === 'team_invite' && !n.read));

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAccept = async (notification: AppNotification) => {
    const { member_id, event_id } = notification.data;
    if (!member_id || !event_id) return;
    setRespondingId(notification.id);
    try {
      await respondInvite.mutateAsync({
        notificationId: notification.id,
        memberId: member_id as string,
        eventId:  event_id as string,
        action:   'accept',
      });
      Alert.alert('Geaccepteerd! 🎉', `Je bent nu lid van het event team.`);
    } catch (err: any) {
      Alert.alert('Fout', err.message || 'Kon de uitnodiging niet accepteren');
    } finally {
      setRespondingId(null);
    }
  };

  const handleDecline = async (notification: AppNotification) => {
    const { member_id, event_id, event_name } = notification.data;
    if (!member_id || !event_id) return;
    Alert.alert(
      'Uitnodiging weigeren',
      `Wil je de uitnodiging voor ${event_name} weigeren?`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Weigeren',
          style: 'destructive',
          onPress: async () => {
            setRespondingId(notification.id);
            try {
              await respondInvite.mutateAsync({
                notificationId: notification.id,
                memberId: member_id as string,
                eventId:  event_id as string,
                action:   'decline',
              });
            } catch (err: any) {
              Alert.alert('Fout', err.message || 'Kon de uitnodiging niet weigeren');
            } finally {
              setRespondingId(null);
            }
          },
        },
      ],
    );
  };

  const handleGenericPress = (notification: AppNotification) => {
    markRead.mutate(notification.id);
    // Navigate if there's a route in data
    if (notification.data.route) {
      navigation.navigate(notification.data.route as any);
    }
  };

  // ── Combined list for FlatList
  type ListItem =
    | { kind: 'header'; label: string; key: string }
    | { kind: 'invite'; notification: AppNotification; key: string }
    | { kind: 'notif';  notification: AppNotification; key: string }
    | { kind: 'empty';  key: string };

  const listItems: ListItem[] = [];

  if (invites.length > 0) {
    listItems.push({ kind: 'header', label: `Uitnodigingen (${invites.length})`, key: 'h-invites' });
    invites.forEach((n) => listItems.push({ kind: 'invite', notification: n, key: n.id }));
  }

  if (rest.length > 0) {
    if (invites.length > 0) {
      listItems.push({ kind: 'header', label: 'Meldingen', key: 'h-rest' });
    }
    rest.forEach((n) => listItems.push({ kind: 'notif', notification: n, key: n.id }));
  }

  if (listItems.length === 0 && !isLoading) {
    listItems.push({ kind: 'empty', key: 'empty' });
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t.notifications.title}</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadPill}>
              <View style={styles.unreadDotSmall} />
              <Text style={styles.unreadPillText}>
                {unreadCount} ongelezen
              </Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            style={styles.markAllBtn}
          >
            {markAllRead.isPending
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={styles.markAllText}>Alles gelezen</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      {isLoading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Meldingen laden...</Text>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => {
            if (item.kind === 'header') {
              return (
                <Text style={styles.sectionHeader}>{item.label}</Text>
              );
            }

            if (item.kind === 'invite') {
              const n = item.notification;
              return (
                <TeamInviteCard
                  notification={n}
                  responding={respondingId === n.id}
                  onAccept={() => handleAccept(n)}
                  onDecline={() => handleDecline(n)}
                  onDismiss={() => markRead.mutate(n.id)}
                />
              );
            }

            if (item.kind === 'notif') {
              return (
                <NotifCard
                  notification={item.notification}
                  onPress={() => handleGenericPress(item.notification)}
                />
              );
            }

            // Empty state
            return (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="notifications-off-outline" size={36} color={colors.textTertiary} />
                </View>
                <Text style={styles.emptyTitle}>{t.notifications.noNotifications}</Text>
                <Text style={styles.emptySub}>{t.notifications.allCaughtUp}</Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
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
  unreadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  unreadDotSmall: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  unreadPillText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  markAllText: {
    fontSize: fontSize.xs,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // List
  list: {
    padding: spacing.md,
    paddingBottom: 100,
  },

  // Section header
  sectionHeader: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
  },

  // Cards (base)
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...subtleShadow,
  },
  inviteCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...subtleShadow,
  },
  cardUnread: {
    backgroundColor: '#faf5ff',
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  cardContent: {
    flex: 1,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  cardTitleRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  cardTitleUnread: {
    fontWeight: fontWeight.semibold,
  },
  cardTime: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginLeft: spacing.xs,
  },
  cardBody: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.sm,
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

  // Team invite specific
  inviteEventBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f3e8ff',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  inviteEventName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#7c3aed',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 4,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#7c3aed',
    borderRadius: borderRadius.md,
    paddingVertical: 10,
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  declineBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  declineBtnText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  respondedText: {
    fontSize: fontSize.xs,
    color: colors.success,
    fontWeight: fontWeight.medium,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.sm,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F4F4F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  emptySub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
