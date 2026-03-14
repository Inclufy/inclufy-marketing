import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEvents, useDeleteEvent } from '../hooks/useEvents';
import { supabase } from '../services/supabase';
import type { Event, EventStatus, RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { cardShadow, fabShadow } from '../utils/shadows';
import { useTranslation } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const statusColors: Record<EventStatus, string> = {
  upcoming: colors.info,
  active: colors.success,
  completed: colors.textSecondary,
  archived: colors.textTertiary,
};

export default function EventListScreen() {
  const navigation = useNavigation<Nav>();
  const { t, locale } = useTranslation();
  const { data: events = [], isLoading, refetch } = useEvents();
  const deleteEvent = useDeleteEvent();
  const [activeTab, setActiveTab] = useState<EventStatus | 'all'>('all');

  const STATUS_TABS: { key: EventStatus | 'all'; label: string }[] = [
    { key: 'all', label: t.eventList.all },
    { key: 'upcoming', label: t.status.upcoming },
    { key: 'active', label: t.status.active },
    { key: 'completed', label: t.status.completed },
  ];

  const dateLocale = locale === 'nl' ? 'nl-NL' : locale === 'fr' ? 'fr-FR' : 'en-US';

  const filtered = activeTab === 'all'
    ? events
    : events.filter((e) => e.status === activeTab);

  const handleLogout = () => {
    Alert.alert(t.settings.logout, t.eventList.logoutConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.eventList.logout, style: 'destructive', onPress: () => supabase.auth.signOut() },
    ]);
  };

  const handleDelete = (event: Event) => {
    Alert.alert(`"${event.name}" ${t.eventList.deleteConfirm}`, t.eventList.deleteWarning, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.common.delete, style: 'destructive', onPress: () => deleteEvent.mutate(event.id) },
    ]);
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => navigation.navigate('EventDashboard', { eventId: item.id })}
      onLongPress={() => handleDelete(item)}
    >
      <View style={styles.eventHeader}>
        <Text style={styles.eventName} numberOfLines={1}>{item.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '20' }]}>
          <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.eventMeta}>
        <Text style={styles.metaText}>
          <Ionicons name="location-outline" size={12} color={colors.textSecondary} /> {item.location || t.common.noLocation}
        </Text>
        <Text style={styles.metaText}>
          <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} /> {new Date(item.event_date).toLocaleDateString(dateLocale, {
            day: 'numeric', month: 'short', year: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.eventChannels}>
        {item.channels.map((ch) => (
          <View key={ch} style={[styles.channelBadge, { backgroundColor: (colors as any)[ch] + '15' }]}>
            <Text style={[styles.channelText, { color: (colors as any)[ch] }]}>
              {ch === 'x' ? 'X' : ch.charAt(0).toUpperCase() + ch.slice(1)}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t.eventList.title}</Text>
          <Text style={styles.subtitle}>{t.eventList.subtitle}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>{t.eventList.logout}</Text>
        </TouchableOpacity>
      </View>

      {/* Status Tabs */}
      <View style={styles.tabs}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Event List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>{t.eventList.noEvents}</Text>
            <Text style={styles.emptyText}>{t.eventList.noEventsDesc}</Text>
          </View>
        }
      />

      {/* FAB - Create Event */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('EventSetup', {})}
      >
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.primary },
  subtitle: { fontSize: fontSize.sm, color: colors.textSecondary },
  logoutBtn: { padding: spacing.sm },
  logoutText: { color: colors.textSecondary, fontSize: fontSize.sm },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    gap: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderLight,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: fontSize.sm, color: colors.textSecondary },
  tabTextActive: { color: colors.textOnPrimary, fontWeight: fontWeight.semibold },
  list: { padding: spacing.md, gap: spacing.md, paddingBottom: 100 },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    ...cardShadow,
  },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventName: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  eventMeta: { flexDirection: 'row', gap: spacing.md },
  metaText: { fontSize: fontSize.sm, color: colors.textSecondary },
  eventChannels: { flexDirection: 'row', gap: spacing.xs },
  channelBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm },
  channelText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  emptyText: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...fabShadow(colors.primary),
  },
  fabText: { color: colors.textOnPrimary, fontSize: 28, fontWeight: fontWeight.bold, marginTop: -2 },
});
