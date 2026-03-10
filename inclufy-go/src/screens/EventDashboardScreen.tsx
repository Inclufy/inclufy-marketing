import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEvent, useUpdateEvent } from '../hooks/useEvents';
import { useCaptures } from '../hooks/useCaptures';
import { useEventPosts } from '../hooks/useEventPosts';
import type { RootStackParamList, EventCapture, EventPost, EventStatus } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow, fabShadow } from '../utils/shadows';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EventDashboard'>;

const statusColors: Record<EventStatus, string> = {
  upcoming: colors.info,
  active: colors.success,
  completed: colors.textSecondary,
  archived: colors.textTertiary,
};

export default function EventDashboardScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { eventId } = route.params;

  const { data: event } = useEvent(eventId);
  const { data: captures = [] } = useCaptures(eventId);
  const { data: posts = [] } = useEventPosts(eventId);
  const updateEvent = useUpdateEvent();

  const publishedCount = posts.filter((p) => p.status === 'published').length;
  const scheduledCount = posts.filter((p) => p.status === 'scheduled').length;
  const draftCount = posts.filter((p) => p.status === 'draft').length;

  const toggleStatus = () => {
    if (!event) return;
    const nextStatus: Record<EventStatus, EventStatus> = {
      upcoming: 'active',
      active: 'completed',
      completed: 'archived',
      archived: 'upcoming',
    };
    updateEvent.mutate({ id: event.id, status: nextStatus[event.status] });
  };

  const getPostsForCapture = (captureId: string): EventPost[] =>
    posts.filter((p) => p.capture_id === captureId);

  const renderCapture = ({ item }: { item: EventCapture }) => {
    const capturePosts = getPostsForCapture(item.id);
    return (
      <TouchableOpacity
        style={styles.captureCard}
        onPress={() => navigation.navigate('PostReview', { captureId: item.id, eventId })}
      >
        <View style={styles.captureRow}>
          {/* Thumbnail */}
          {item.media_type === 'photo' && item.thumbnail_url ? (
            <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Text style={{ fontSize: 24 }}>
                {item.media_type === 'video' ? '\u{1F3A5}' : item.media_type === 'audio' ? '\u{1F3A4}' : '\u{1F4DD}'}
              </Text>
            </View>
          )}

          {/* Info */}
          <View style={styles.captureInfo}>
            <Text style={styles.captureTime}>
              {new Date(item.captured_at).toLocaleTimeString('nl-NL', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {item.tags.length > 0 && (
              <Text style={styles.captureTags} numberOfLines={1}>
                {item.tags.join(', ')}
              </Text>
            )}
            {/* AI-detected tags */}
            {(item as any).ai_tags?.length > 0 && (
              <Text style={styles.aiTags} numberOfLines={1}>
                {'\u{1F916}'} {(item as any).ai_tags.slice(0, 3).map((t: any) => t.label).join(' \u2022 ')}
              </Text>
            )}
            {item.note ? (
              <Text style={styles.captureNote} numberOfLines={1}>{item.note}</Text>
            ) : null}
          </View>

          {/* Post status icons */}
          <View style={styles.postStatuses}>
            {capturePosts.map((p) => (
              <View key={p.id} style={styles.postStatusDot}>
                <Text style={{ fontSize: 10 }}>
                  {p.channel === 'linkedin' ? 'LI' : p.channel === 'instagram' ? 'IG' : p.channel === 'x' ? 'X' : 'FB'}
                </Text>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        p.status === 'published' ? colors.success
                        : p.status === 'scheduled' ? colors.info
                        : p.status === 'failed' ? colors.error
                        : colors.draft,
                    },
                  ]}
                />
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!event) return null;

  return (
    <View style={styles.container}>
      {/* Event Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.eventName}>{event.name}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('EventSetup', { eventId })}>
            <Text style={styles.editBtn}>Bewerk</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {'\u{1F4CD}'} {event.location || 'Geen locatie'}
          </Text>
          <Text style={styles.metaText}>
            {'\u{1F4C5}'} {new Date(event.event_date).toLocaleDateString('nl-NL')}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.statusBadge, { backgroundColor: statusColors[event.status] + '20' }]}
          onPress={toggleStatus}
        >
          <Text style={[styles.statusText, { color: statusColors[event.status] }]}>
            {event.status} {'\u2192'} tap to change
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{captures.length}</Text>
          <Text style={styles.statLabel}>Captures</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{posts.length}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{publishedCount}</Text>
          <Text style={styles.statLabel}>Published</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.info }]}>{scheduledCount}</Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.draft }]}>{draftCount}</Text>
          <Text style={styles.statLabel}>Drafts</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate('StoryArc', { eventId })}
        >
          <Text style={styles.quickActionIcon}>{'\u{1F4C5}'}</Text>
          <Text style={styles.quickActionLabel}>Story Arc</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate('EventRecap', { eventId })}
        >
          <Text style={styles.quickActionIcon}>{'\u{1F4DD}'}</Text>
          <Text style={styles.quickActionLabel}>Recap</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate('TeamManage', { eventId })}
        >
          <Text style={styles.quickActionIcon}>{'\u{1F465}'}</Text>
          <Text style={styles.quickActionLabel}>Team</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate('LiveCapture', { eventId })}
        >
          <Text style={styles.quickActionIcon}>{'\u{1F4F8}'}</Text>
          <Text style={styles.quickActionLabel}>Capture</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <Text style={styles.sectionTitle}>Timeline</Text>
      <FlatList
        data={captures}
        keyExtractor={(item) => item.id}
        renderItem={renderCapture}
        contentContainerStyle={styles.timeline}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nog geen captures</Text>
            <Text style={styles.emptySubtext}>Start met content maken!</Text>
          </View>
        }
      />

      {/* Start Capture FAB */}
      <TouchableOpacity
        style={styles.captureFab}
        onPress={() => navigation.navigate('LiveCapture', { eventId })}
      >
        <Text style={styles.captureFabText}>{'\u{1F4F8}'} Start Capture</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, flex: 1 },
  editBtn: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  metaRow: { flexDirection: 'row', gap: spacing.md },
  metaText: { fontSize: fontSize.sm, color: colors.textSecondary },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  stats: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  statLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: 0,
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  quickActionIcon: { fontSize: 20 },
  quickActionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  timeline: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  captureCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...subtleShadow,
  },
  captureRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.sm,
  },
  thumbnailPlaceholder: {
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInfo: { flex: 1, gap: 2 },
  captureTime: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  captureTags: { fontSize: fontSize.xs, color: colors.primary },
  aiTags: { fontSize: fontSize.xs, color: colors.info, fontStyle: 'italic' },
  captureNote: { fontSize: fontSize.xs, color: colors.textSecondary },
  postStatuses: { gap: 4 },
  postStatusDot: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empty: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary },
  emptySubtext: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: spacing.xs },
  captureFab: {
    position: 'absolute',
    bottom: 30,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    ...fabShadow(colors.primary),
  },
  captureFabText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});
