import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useLibraryPost,
  useScheduleLibraryPost,
  usePublishLibraryPost,
  useDeleteLibraryPost,
} from '../hooks/useLibraryPosts';
import { useStrategyAlignment } from '../hooks/useStrategyAlignment';
import type { RootStackParamList, LibraryLanguage, Channel, LibraryPost } from '../types';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type R = RouteProp<RootStackParamList, 'LibraryPostDetail'>;

const LANGS: LibraryLanguage[] = ['nl', 'en', 'fr'];

export default function LibraryPostDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { colors } = useTheme();

  const { data: post, isLoading } = useLibraryPost(route.params.postId);
  const scheduleMut = useScheduleLibraryPost();
  const publishMut = usePublishLibraryPost();
  const deleteMut = useDeleteLibraryPost();

  const [language, setLanguage] = useState<LibraryLanguage>('nl');

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }
  if (!post) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Post niet gevonden</Text>
      </SafeAreaView>
    );
  }

  const tr = post.translations[language] ?? post.translations[post.primary_language];
  const availableLangs = LANGS.filter((l) => post.translations[l]);

  function publishNow() {
    Alert.alert(
      'Nu publiceren',
      `Post wordt direct gepubliceerd op: ${post!.channels.join(', ')} (${language.toUpperCase()})`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Publiceren',
          style: 'default',
          onPress: async () => {
            try {
              const r = await publishMut.mutateAsync({ postId: post!.id, language });
              if (r.ok) {
                Alert.alert('Gepubliceerd', 'Post staat live op alle gekozen kanalen.');
              } else {
                const errors = Object.entries(r.results)
                  .filter(([, v]) => v.error)
                  .map(([k, v]) => `${k}: ${v.error}`)
                  .join('\n');
                Alert.alert('Deels mislukt', errors || 'Onbekende fout');
              }
            } catch (e) {
              Alert.alert('Fout', (e as Error).message);
            }
          },
        },
      ],
    );
  }

  async function unschedule() {
    try {
      await scheduleMut.mutateAsync({ postId: post!.id, scheduledFor: null });
    } catch (e) {
      Alert.alert('Fout', (e as Error).message);
    }
  }

  async function scheduleIn(minutes: number) {
    const dt = new Date(Date.now() + minutes * 60_000).toISOString();
    try {
      await scheduleMut.mutateAsync({ postId: post!.id, scheduledFor: dt });
    } catch (e) {
      Alert.alert('Fout', (e as Error).message);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Post verwijderen?',
      'Deze actie kan niet ongedaan worden gemaakt.',
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijder',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMut.mutateAsync(post!.id);
              navigation.goBack();
            } catch (e: any) {
              Alert.alert('Verwijderen mislukt', e.message);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {post.external_id ?? 'Library post'}
        </Text>
        <TouchableOpacity onPress={confirmDelete}>
          <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Image preview */}
        {tr?.image_url ? (
          <Image source={{ uri: tr.image_url }} style={styles.preview} />
        ) : (
          <View style={[styles.preview, styles.previewEmpty]}>
            <MaterialCommunityIcons name="image-off-outline" size={40} color="#CBD5E1" />
          </View>
        )}

        {/* Language switcher */}
        <View style={styles.langRow}>
          {availableLangs.map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.langBtn, language === l && { backgroundColor: colors.primary }]}
              onPress={() => setLanguage(l)}
            >
              <Text style={[styles.langText, language === l && { color: '#fff' }]}>{l.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Caption */}
        <Text style={[styles.caption, { color: colors.text }]}>{tr?.caption || '(geen caption)'}</Text>
        {tr?.hashtags && tr.hashtags.length > 0 && (
          <Text style={[styles.hashtags, { color: colors.primary }]}>{tr.hashtags.join(' ')}</Text>
        )}
        {tr?.cta && (
          <View style={[styles.ctaBox, { backgroundColor: colors.primary }]}>
            <Text style={styles.ctaText}>{tr.cta}</Text>
          </View>
        )}

        {/* Meta info */}
        <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row label="Status" value={post.status} />
          <Row label="Type" value={post.post_type} />
          <Row label="Kanalen" value={post.channels.join(', ')} />
          {post.campaign && <Row label="Campagne" value={post.campaign} />}
          {post.scheduled_for && <Row label="Gepland" value={new Date(post.scheduled_for).toLocaleString('nl-NL')} />}
          {post.published_at && <Row label="Gepubliceerd" value={new Date(post.published_at).toLocaleString('nl-NL')} />}
        </View>

        {/* Strategy alignment banner (soft warnings) */}
        {post.status !== 'published' && <AlignmentBanner post={post} />}

        {/* Actions */}
        {post.status !== 'published' && (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={publishNow}
              disabled={publishMut.isPending}
            >
              {publishMut.isPending ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="rocket-outline" size={18} color="#fff" />
                  <Text style={styles.actionBtnText}>Nu publiceren</Text>
                </>
              )}
            </TouchableOpacity>

            {post.status === 'scheduled' ? (
              <TouchableOpacity style={[styles.actionBtnSecondary, { borderColor: colors.border }]} onPress={unschedule}>
                <Text style={{ color: colors.text }}>Schedule annuleren</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.scheduleRow}>
                <TouchableOpacity style={[styles.scheduleChip, { borderColor: colors.border }]} onPress={() => scheduleIn(60)}>
                  <Text style={{ color: colors.text }}>+1u</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.scheduleChip, { borderColor: colors.border }]} onPress={() => scheduleIn(60 * 24)}>
                  <Text style={{ color: colors.text }}>+1d</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.scheduleChip, { borderColor: colors.border }]} onPress={() => scheduleIn(60 * 24 * 7)}>
                  <Text style={{ color: colors.text }}>+1w</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Publish results */}
        {Object.keys(post.publish_results).length > 0 && (
          <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.metaTitle, { color: colors.text }]}>Publish resultaten</Text>
            {Object.entries(post.publish_results).map(([ch, r]) => (
              <Row
                key={ch}
                label={ch}
                value={r.error ? `❌ ${r.error}` : `✅ ${r.url ?? r.post_id ?? 'OK'}`}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.text }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

function AlignmentBanner({ post }: { post: LibraryPost }) {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const alignment = useStrategyAlignment(post);

  // Color scheme per status
  const palette =
    alignment.status === 'ok'
      ? { bg: '#10B98115', border: '#10B981', icon: '#10B981', text: '#065F46' }
      : alignment.status === 'no_strategy'
      ? { bg: '#94A3B815', border: '#94A3B8', icon: '#475569', text: colors.text }
      : { bg: '#F59E0B15', border: '#F59E0B', icon: '#F59E0B', text: colors.text };

  const iconName =
    alignment.status === 'ok' ? 'checkmark-circle' : alignment.status === 'no_strategy' ? 'information-circle' : 'warning';

  const headline =
    alignment.status === 'ok'
      ? `Aligned met strategie · ${alignment.alignedChannels.length}/${post.channels.length} kanalen`
      : alignment.status === 'no_strategy'
      ? 'Geen actieve strategie'
      : `${alignment.warnings.length} waarschuwing${alignment.warnings.length === 1 ? '' : 'en'}`;

  return (
    <View style={[styles.banner, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <View style={styles.bannerHeader}>
        <Ionicons name={iconName as 'checkmark-circle'} size={20} color={palette.icon} />
        <Text style={[styles.bannerHeadline, { color: palette.text }]}>{headline}</Text>
      </View>

      {alignment.warnings.length > 0 && (
        <View style={styles.bannerWarnings}>
          {alignment.warnings.map((w, i) => (
            <Text key={i} style={[styles.bannerWarning, { color: palette.text }]}>
              • {w.message}
            </Text>
          ))}
        </View>
      )}

      {alignment.status !== 'ok' && (
        <TouchableOpacity
          style={[styles.bannerCta, { borderColor: palette.border }]}
          onPress={() => navigation.navigate('MarketingStrategy')}
        >
          <Text style={[styles.bannerCtaText, { color: palette.icon }]}>
            {alignment.needsSetup ? 'Strategie instellen →' : 'Strategie aanpassen →'}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.bannerHint, { color: colors.textSecondary }]}>
        Dit is een waarschuwing — je kunt nog steeds publiceren.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  title: { flex: 1, fontSize: fontSize.lg, fontWeight: fontWeight.bold as '700' },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },

  preview: { width: '100%', aspectRatio: 1, borderRadius: borderRadius.md, backgroundColor: '#F1F5F9' },
  previewEmpty: { alignItems: 'center', justifyContent: 'center' },

  langRow: { flexDirection: 'row', gap: spacing.sm },
  langBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm, borderWidth: 1, borderColor: '#E2E8F0',
  },
  langText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as '600', color: '#475569' },

  caption: { fontSize: fontSize.md, lineHeight: 22 },
  hashtags: { fontSize: fontSize.sm },
  ctaBox: { padding: spacing.md, borderRadius: borderRadius.full, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: fontWeight.semibold as '600' },

  metaCard: {
    padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, gap: spacing.sm,
  },
  metaTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as '600', marginBottom: 4 },
  row: { flexDirection: 'row', gap: spacing.md },
  rowLabel: { fontSize: fontSize.sm, width: 100 },
  rowValue: { fontSize: fontSize.sm, flex: 1, fontWeight: fontWeight.medium as '500' },

  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.md, borderRadius: borderRadius.full,
  },
  actionBtnText: { color: '#fff', fontWeight: fontWeight.semibold as '600' },
  actionBtnSecondary: {
    paddingVertical: spacing.md, borderRadius: borderRadius.full,
    borderWidth: 1, alignItems: 'center',
  },
  scheduleRow: { flexDirection: 'row', gap: spacing.sm },
  scheduleChip: {
    flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.full,
    borderWidth: 1, alignItems: 'center',
  },

  banner: {
    padding: spacing.md, borderRadius: borderRadius.md,
    borderWidth: 1, gap: spacing.sm,
  },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bannerHeadline: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold as '600', flex: 1 },
  bannerWarnings: { gap: 4, paddingLeft: spacing.lg },
  bannerWarning: { fontSize: fontSize.xs, lineHeight: 16 },
  bannerCta: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1,
    marginTop: 4,
  },
  bannerCtaText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold as '600' },
  bannerHint: { fontSize: 11, fontStyle: 'italic', marginTop: 2 },
});
