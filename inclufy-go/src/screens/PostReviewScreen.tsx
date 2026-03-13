import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCapturePosts, useUpdatePost, usePublishPost, useBatchPublish } from '../hooks/useEventPosts';
import { aiService } from '../services/ai.service';
import type { RootStackParamList, EventPost, Channel } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useTranslation } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PostReview'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const channelConfig: Record<Channel, { label: string; color: string; icon: string }> = {
  linkedin: { label: 'LinkedIn', color: colors.linkedin, icon: 'logo-linkedin' },
  instagram: { label: 'Instagram', color: colors.instagram, icon: 'logo-instagram' },
  x: { label: 'X', color: colors.x, icon: 'logo-twitter' },
  facebook: { label: 'Facebook', color: colors.facebook, icon: 'logo-facebook' },
};

export default function PostReviewScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { captureId, eventId } = route.params;

  const { data: posts = [], isLoading } = useCapturePosts(captureId);
  const updatePost = useUpdatePost();
  const publishPost = usePublishPost();
  const batchPublish = useBatchPublish();

  const [activeIndex, setActiveIndex] = useState(0);
  const [editingText, setEditingText] = useState<Record<string, string>>({});
  const scrollRef = useRef<ScrollView>(null);

  const activePost = posts[activeIndex];

  const getEditedText = (post: EventPost) => editingText[post.id] ?? post.text_content;

  const handleTextChange = (postId: string, text: string) => {
    setEditingText((prev) => ({ ...prev, [postId]: text }));
  };

  const handleSaveText = async (post: EventPost) => {
    const newText = editingText[post.id];
    if (!newText || newText === post.text_content) return;

    try {
      await updatePost.mutateAsync({ id: post.id, text_content: newText });
      Alert.alert(t.postReview.saved);
    } catch {
      Alert.alert(t.common.error, t.postReview.saveError);
    }
  };

  const handlePublish = async (post: EventPost) => {
    Alert.alert(
      `${t.postReview.publishOn} ${channelConfig[post.channel]?.label}?`,
      t.postReview.publishConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.postReview.publishButton,
          onPress: async () => {
            try {
              // Save any pending text changes first
              if (editingText[post.id]) {
                await updatePost.mutateAsync({ id: post.id, text_content: editingText[post.id] });
              }
              await publishPost.mutateAsync(post.id);
              Alert.alert(t.postReview.publishSuccess);
            } catch {
              Alert.alert(t.common.error, t.postReview.publishError);
            }
          },
        },
      ],
    );
  };

  const handlePublishAll = () => {
    const draftPosts = posts.filter((p) => p.status === 'draft');
    if (draftPosts.length === 0) {
      Alert.alert(t.postReview.noDrafts);
      return;
    }

    Alert.alert(
      `${t.postReview.publishAll} ${draftPosts.length} posts?`,
      t.postReview.publishAllConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.postReview.publishAll,
          onPress: async () => {
            try {
              await batchPublish.mutateAsync(draftPosts.map((p) => p.id));
              Alert.alert(t.postReview.publishAllSuccess);
            } catch {
              Alert.alert(t.common.error, t.postReview.publishAllError);
            }
          },
        },
      ],
    );
  };

  const scrollToIndex = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    setActiveIndex(index);
  };

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.loading}>
        <Text style={styles.emptyText}>{t.postReview.noPostsFound}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Channel Tabs */}
      <View style={styles.channelTabs}>
        {posts.map((post, index) => {
          const config = channelConfig[post.channel];
          const isActive = index === activeIndex;
          return (
            <TouchableOpacity
              key={post.id}
              style={[
                styles.channelTab,
                isActive && { borderBottomColor: config?.color || colors.primary },
              ]}
              onPress={() => scrollToIndex(index)}
            >
              <Ionicons name={config?.icon as any} size={18} color={config?.color || colors.textSecondary} />
              <Text
                style={[
                  styles.channelLabel,
                  isActive && { color: config?.color, fontWeight: fontWeight.semibold },
                ]}
              >
                {config?.label || post.channel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Horizontal Pager */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
      >
        {posts.map((post) => {
          const config = channelConfig[post.channel];
          return (
            <ScrollView
              key={post.id}
              style={{ width: SCREEN_WIDTH }}
              contentContainerStyle={styles.postContent}
            >
              {/* Image preview */}
              {post.branded_image_url && (
                <Image
                  source={{ uri: post.branded_image_url }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              )}

              {/* Status badge */}
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: (colors as any)[post.status] + '20' },
                  ]}
                >
                  <Text style={[styles.statusText, { color: (colors as any)[post.status] }]}>
                    {post.status}
                  </Text>
                </View>
                <Text style={styles.channelBadge}>
                  {config?.label || post.channel}
                </Text>
              </View>

              {/* Editable text */}
              <TextInput
                style={styles.textEdit}
                value={getEditedText(post)}
                onChangeText={(text) => handleTextChange(post.id, text)}
                onBlur={() => handleSaveText(post)}
                multiline
                placeholder={t.postReview.postTextPlaceholder}
                placeholderTextColor={colors.textTertiary}
              />

              {/* Hashtags */}
              {post.hashtags.length > 0 && (
                <Text style={styles.hashtags}>{post.hashtags.map((h) => `#${h}`).join(' ')}</Text>
              )}

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: config?.color || colors.primary }]}
                  onPress={() => handlePublish(post)}
                  disabled={post.status === 'published'}
                >
                  <Text style={styles.actionBtnText}>
                    {post.status === 'published' ? t.status.published : `${t.postReview.publishOn} ${config?.label}`}
                  </Text>
                </TouchableOpacity>

                {/* Translate button */}
                <TouchableOpacity
                  style={styles.translateBtn}
                  onPress={async () => {
                    try {
                      const result = await aiService.translateContent({
                        text: getEditedText(post),
                        source_language: 'nl',
                        target_languages: ['en', 'de', 'fr'],
                        platform: post.channel,
                      });
                      const langs = Object.entries(result.translations || {});
                      const msg = langs.map(([lang, tr]) =>
                        `${lang.toUpperCase()}:\n${tr.text}`
                      ).join('\n\n');
                      Alert.alert(t.postReview.translations, msg || t.postReview.noTranslations);
                    } catch {
                      Alert.alert(t.common.error, t.postReview.translationError);
                    }
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="globe-outline" size={14} color={colors.primary} />
                    <Text style={styles.translateBtnText}>{t.postReview.translate}</Text>
                  </View>
                </TouchableOpacity>

                {/* Audience Targeting button */}
                <TouchableOpacity
                  style={styles.audienceBtn}
                  onPress={async () => {
                    try {
                      const result = await aiService.suggestAudience({
                        text_content: getEditedText(post),
                        channel: post.channel,
                        hashtags: post.hashtags,
                      });
                      const msg = [
                        `${t.postReview.primary}: ${result.primary}`,
                        `${t.postReview.secondary}: ${result.secondary}`,
                        `\n${result.reasoning}`,
                        `\n${t.postReview.demographics}: ${result.demographics}`,
                        `${t.postReview.optimalTime}: ${result.optimal_time}`,
                        result.engagement_tips?.length
                          ? `\n${t.postReview.tips}:\n${result.engagement_tips.map((tip) => `  - ${tip}`).join('\n')}`
                          : '',
                      ].filter(Boolean).join('\n');
                      Alert.alert(t.postReview.audienceAnalysis, msg);
                    } catch {
                      Alert.alert(t.common.error, t.postReview.audienceError);
                    }
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="locate-outline" size={14} color={colors.info} />
                    <Text style={styles.audienceBtnText}>{t.postReview.audienceAnalysis}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          );
        })}
      </ScrollView>

      {/* Bottom: Publish All */}
      <TouchableOpacity
        style={styles.publishAllBtn}
        onPress={handlePublishAll}
        disabled={batchPublish.isPending}
      >
        {batchPublish.isPending ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="rocket-outline" size={18} color={colors.textOnPrimary} />
            <Text style={styles.publishAllText}>
              {t.postReview.publishAllButton} ({posts.filter((p) => p.status === 'draft').length} {t.postReview.channels})
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.md },
  channelTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  channelTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  channelIcon: { fontSize: 18 },
  channelLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  postContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 100,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.borderLight,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  channelBadge: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  textEdit: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  hashtags: {
    fontSize: fontSize.sm,
    color: colors.primary,
  },
  actions: {
    gap: spacing.sm,
  },
  actionBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  translateBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.info,
    backgroundColor: colors.info + '08',
  },
  translateBtnText: {
    color: colors.info,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  audienceBtn: {
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.success,
    backgroundColor: colors.success + '08',
  },
  audienceBtnText: {
    color: colors.success,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  publishAllBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingBottom: 34,
    alignItems: 'center',
  },
  publishAllText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});
