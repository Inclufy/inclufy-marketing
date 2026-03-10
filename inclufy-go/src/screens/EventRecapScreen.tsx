import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useEvent } from '../hooks/useEvents';
import { useCaptures } from '../hooks/useCaptures';
import { useEventPosts } from '../hooks/useEventPosts';
import { aiService, type EventRecapResponse } from '../services/ai.service';
import { useBrandMemory, toBrandContext } from '../hooks/useBrandMemory';
import type { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { cardShadow } from '../utils/shadows';

type Route = RouteProp<RootStackParamList, 'EventRecap'>;

type OutputFormat = 'blog' | 'newsletter' | 'linkedin_article';

const formatOptions: Array<{ key: OutputFormat; label: string; icon: string }> = [
  { key: 'blog', label: 'Blog Post', icon: '📝' },
  { key: 'newsletter', label: 'Newsletter', icon: '📧' },
  { key: 'linkedin_article', label: 'LinkedIn Artikel', icon: '💼' },
];

export default function EventRecapScreen() {
  const route = useRoute<Route>();
  const { eventId } = route.params;

  const { data: event } = useEvent(eventId);
  const { data: capturesData } = useCaptures(eventId);
  const { data: postsData } = useEventPosts(eventId);
  const { data: brandMemory } = useBrandMemory();

  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>('blog');
  const [recap, setRecap] = useState<EventRecapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateRecap = async () => {
    if (!event) return;

    setLoading(true);
    setError('');

    try {
      if (brandMemory) {
        aiService.setBrandContext(toBrandContext(brandMemory));
      }

      const posts = (postsData?.posts || []).map((p: any) => ({
        channel: p.channel,
        text_content: p.text_content,
        hashtags: p.hashtags || [],
        status: p.status,
      }));

      const publishedCount = posts.filter((p: any) => p.status === 'published').length;

      const result = await aiService.generateEventRecap({
        event_name: event.name,
        event_date: event.event_date,
        location: event.location || '',
        posts,
        captures_count: capturesData?.captures?.length || 0,
        published_count: publishedCount,
        output_format: selectedFormat,
      });

      setRecap(result);
    } catch (e) {
      setError('Kon recap niet genereren. Probeer opnieuw.');
      console.error('Recap error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!recap) return;
    try {
      await Share.share({
        title: recap.title,
        message: `${recap.title}\n\n${recap.social_teaser}\n\n${recap.content}`,
      });
    } catch (e) {
      // Share cancelled
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📝 Event Recap</Text>
        <Text style={styles.headerEvent}>{event?.name}</Text>
        <Text style={styles.headerStats}>
          {capturesData?.captures?.length || 0} captures • {postsData?.posts?.length || 0} posts
        </Text>
      </View>

      {/* Format selector */}
      <View style={styles.formatSelector}>
        {formatOptions.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.formatOption,
              selectedFormat === opt.key && styles.formatOptionActive,
            ]}
            onPress={() => setSelectedFormat(opt.key)}
          >
            <Text style={styles.formatIcon}>{opt.icon}</Text>
            <Text
              style={[
                styles.formatLabel,
                selectedFormat === opt.key && styles.formatLabelActive,
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Generate button */}
      <TouchableOpacity
        style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
        onPress={generateRecap}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <Text style={styles.generateBtnText}>
            🚀 Genereer {formatOptions.find((f) => f.key === selectedFormat)?.label}
          </Text>
        )}
      </TouchableOpacity>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      {/* Recap result */}
      {recap ? (
        <View style={styles.recapResult}>
          {/* Title */}
          <Text style={styles.recapTitle}>{recap.title}</Text>

          {/* Social teaser */}
          <View style={[styles.teaserBox, cardShadow]}>
            <Text style={styles.teaserLabel}>Social Teaser</Text>
            <Text style={styles.teaserText}>{recap.social_teaser}</Text>
          </View>

          {/* Key highlights */}
          {recap.key_highlights?.length > 0 ? (
            <View style={styles.highlightsBox}>
              <Text style={styles.sectionTitle}>⭐ Key Highlights</Text>
              {recap.key_highlights.map((h, i) => (
                <View key={i} style={styles.highlightItem}>
                  <Text style={styles.highlightBullet}>•</Text>
                  <Text style={styles.highlightText}>{h}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Full content */}
          <View style={styles.contentBox}>
            <Text style={styles.sectionTitle}>📄 Volledige Tekst</Text>
            <Text style={styles.recapContent}>{recap.content}</Text>
          </View>

          {/* CTA */}
          {recap.suggested_cta ? (
            <View style={styles.ctaBox}>
              <Text style={styles.ctaLabel}>Suggested CTA:</Text>
              <Text style={styles.ctaText}>{recap.suggested_cta}</Text>
            </View>
          ) : null}

          {/* Share */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>📤 Deel Recap</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerEvent: {
    fontSize: fontSize.lg,
    color: colors.primary,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  headerStats: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Format selector
  formatSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  formatOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 4,
  },
  formatOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  formatIcon: {
    fontSize: 24,
  },
  formatLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  formatLabelActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  // Generate
  generateBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },

  // Recap
  recapResult: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  recapTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  teaserBox: {
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  teaserLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    marginBottom: 4,
  },
  teaserText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontStyle: 'italic',
  },
  highlightsBox: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  highlightItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingLeft: spacing.sm,
  },
  highlightBullet: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  highlightText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
  },
  contentBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  recapContent: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
    marginTop: spacing.sm,
  },
  ctaBox: {
    backgroundColor: colors.accent + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  ctaLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.accent,
    marginBottom: 4,
  },
  ctaText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  shareBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  shareBtnText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
