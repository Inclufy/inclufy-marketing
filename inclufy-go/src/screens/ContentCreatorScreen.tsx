import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import api from '../services/api';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';
import { useTranslation } from '../i18n';

type ContentType = 'social' | 'caption' | 'blog' | 'email';
type Platform = 'linkedin' | 'instagram' | 'x' | 'facebook';
type Tone = 'professional' | 'casual' | 'community' | 'inspirerend';

const PLATFORMS: { key: Platform; label: string; color: string }[] = [
  { key: 'linkedin', label: 'LinkedIn', color: colors.linkedin },
  { key: 'instagram', label: 'Instagram', color: colors.instagram },
  { key: 'x', label: 'X', color: colors.x },
  { key: 'facebook', label: 'Facebook', color: colors.facebook },
];

export default function ContentCreatorScreen() {
  const { t } = useTranslation();

  const CONTENT_TYPES: { key: ContentType; label: string; icon: string }[] = [
    { key: 'social', label: t.contentCreator.socialPost, icon: 'phone-portrait-outline' },
    { key: 'caption', label: t.contentCreator.caption, icon: 'document-text-outline' },
    { key: 'blog', label: t.contentCreator.blog, icon: 'book-outline' },
    { key: 'email', label: t.contentCreator.email, icon: 'mail-outline' },
  ];

  const TONES: { key: Tone; label: string }[] = [
    { key: 'professional', label: t.contentCreator.professional },
    { key: 'casual', label: t.contentCreator.casual },
    { key: 'community', label: t.contentCreator.community },
    { key: 'inspirerend', label: t.contentCreator.inspiring },
  ];
  const [contentType, setContentType] = useState<ContentType>('social');
  const [platform, setPlatform] = useState<Platform>('linkedin');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>('professional');
  const [generatedContent, setGeneratedContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      Alert.alert(t.contentCreator.topicRequired, t.contentCreator.topicRequiredMsg);
      return;
    }

    setLoading(true);
    setGeneratedContent('');

    try {
      if (contentType === 'social') {
        const { data } = await api.post('/content/social', {
          topic: trimmedTopic,
          platform,
          tone,
        });
        setGeneratedContent(
          data?.content ?? data?.text ?? data?.post ?? 'Geen content ontvangen.',
        );
      } else {
        const { data } = await api.post('/content/write', {
          topic: trimmedTopic,
          type: contentType,
          tone,
        });
        setGeneratedContent(
          data?.content ?? data?.text ?? 'Geen content ontvangen.',
        );
      }
    } catch {
      Alert.alert(t.common.error, t.contentCreator.generateError);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedContent) return;
    await Clipboard.setStringAsync(generatedContent);
    Alert.alert(t.contentCreator.copied, t.contentCreator.copiedMsg);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.contentCreator.title}</Text>
        <Text style={styles.headerSubtitle}>{t.contentCreator.subtitle}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Content Type Selector */}
        <Text style={styles.sectionLabel}>{t.contentCreator.contentType}</Text>
        <View style={styles.typeRow}>
          {CONTENT_TYPES.map((type) => {
            const isActive = contentType === type.key;
            return (
              <TouchableOpacity
                key={type.key}
                style={[styles.typeCard, isActive && styles.typeCardActive]}
                onPress={() => setContentType(type.key)}
              >
                <Ionicons name={type.icon as any} size={20} color={isActive ? colors.primary : colors.textSecondary} />
                <Text
                  style={[
                    styles.typeLabel,
                    isActive && styles.typeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Platform Selector (social only) */}
        {contentType === 'social' && (
          <>
            <Text style={styles.sectionLabel}>{t.contentCreator.platform}</Text>
            <View style={styles.platformRow}>
              {PLATFORMS.map((p) => {
                const isActive = platform === p.key;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[
                      styles.platformChip,
                      isActive && {
                        backgroundColor: p.color + '18',
                        borderColor: p.color,
                      },
                    ]}
                    onPress={() => setPlatform(p.key)}
                  >
                    <Text
                      style={[
                        styles.platformText,
                        isActive && { color: p.color, fontWeight: fontWeight.semibold },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Topic Input */}
        <Text style={styles.sectionLabel}>{t.contentCreator.topicLabel}</Text>
        <TextInput
          style={styles.topicInput}
          value={topic}
          onChangeText={setTopic}
          placeholder={t.contentCreator.topicPlaceholder}
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={4}
          maxLength={1000}
          textAlignVertical="top"
        />

        {/* Tone Selector */}
        <Text style={styles.sectionLabel}>{t.contentCreator.tone}</Text>
        <View style={styles.toneRow}>
          {TONES.map((tn) => {
            const isActive = tone === tn.key;
            return (
              <TouchableOpacity
                key={tn.key}
                style={[styles.toneChip, isActive && styles.toneChipActive]}
                onPress={() => setTone(tn.key)}
              >
                <Text
                  style={[
                    styles.toneText,
                    isActive && styles.toneTextActive,
                  ]}
                >
                  {tn.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.generateBtnText}>{t.contentCreator.generate}</Text>
          )}
        </TouchableOpacity>

        {/* Generated Content */}
        {generatedContent !== '' && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>{t.contentCreator.generatedContent}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                <View style={styles.copyBtnInner}>
                  <Ionicons name="copy-outline" size={14} color={colors.primary} />
                  <Text style={styles.copyBtnText}> {t.contentCreator.copy}</Text>
                </View>
              </TouchableOpacity>
            </View>
            <Text style={styles.resultContent} selectable>
              {generatedContent}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 120,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  /* Content Type */
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...subtleShadow,
  },
  typeCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  typeIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  typeLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  typeLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  /* Platform */
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  platformChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  platformText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  /* Topic */
  topicInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 100,
  },
  /* Tone */
  toneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  toneChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toneChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  toneText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  toneTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  /* Generate */
  generateBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  /* Result */
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '20',
    ...subtleShadow,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  copyBtn: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '12',
  },
  copyBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyBtnText: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  resultContent: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
});
