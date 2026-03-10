import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEvent } from '../hooks/useEvents';
import { useCaptures } from '../hooks/useCaptures';
import { aiService, type StoryArcPost } from '../services/ai.service';
import { useBrandMemory, toBrandContext } from '../hooks/useBrandMemory';
import type { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { cardShadow } from '../utils/shadows';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'StoryArc'>;

const phaseIcons: Record<string, string> = {
  arrival: '🚀',
  keynote: '🎤',
  networking: '🤝',
  demo: '💻',
  highlights: '⭐',
  wrapup: '🎉',
  panel: '👥',
  workshop: '🛠️',
};

const channelIcons: Record<string, string> = {
  linkedin: '💼',
  instagram: '📸',
  x: '𝕏',
  facebook: '🌍',
};

const contentTypeIcons: Record<string, string> = {
  photo: '📷',
  video: '🎥',
  audio: '🎤',
  quote: '📝',
};

export default function StoryArcScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { eventId } = route.params;

  const { data: event } = useEvent(eventId);
  const { data: capturesData } = useCaptures(eventId);
  const { data: brandMemory } = useBrandMemory();

  const [arc, setArc] = useState<StoryArcPost[]>([]);
  const [narrative, setNarrative] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event && brandMemory) {
      generateArc();
    }
  }, [event, brandMemory]);

  const generateArc = async () => {
    if (!event) return;

    setLoading(true);
    setError('');

    try {
      if (brandMemory) {
        aiService.setBrandContext(toBrandContext(brandMemory));
      }

      const result = await aiService.generateStoryArc({
        event_name: event.name,
        event_date: event.event_date,
        event_start_time: event.event_start_time || '09:00',
        event_end_time: event.event_end_time || '18:00',
        channels: event.channels || ['linkedin', 'instagram'],
        hashtags: event.hashtags || [],
        goals: event.goals || [],
        captures_so_far: capturesData?.captures?.length || 0,
      });

      setArc(result.arc || []);
      setNarrative(result.narrative_summary || '');
    } catch (e) {
      setError('Kon Story Arc niet genereren. Probeer opnieuw.');
      console.error('Story arc error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>AI plant je dag...</Text>
        <Text style={styles.loadingSubtext}>Story Arc wordt gegenereerd</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Story Arc</Text>
        <Text style={styles.headerEvent}>{event?.name}</Text>
        {narrative ? (
          <Text style={styles.narrative}>{narrative}</Text>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={generateArc}>
            <Text style={styles.retryText}>Opnieuw proberen</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Timeline */}
      <View style={styles.timeline}>
        {arc.map((item, index) => (
          <View key={index} style={styles.timelineItem}>
            {/* Timeline line */}
            <View style={styles.timelineLine}>
              <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
              {index < arc.length - 1 && <View style={styles.timelineConnector} />}
            </View>

            {/* Card */}
            <View style={[styles.arcCard, cardShadow]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTime}>{item.time}</Text>
                <View style={styles.cardBadges}>
                  <Text style={styles.badge}>
                    {channelIcons[item.channel] || '📱'} {item.channel}
                  </Text>
                  <Text style={styles.badge}>
                    {contentTypeIcons[item.content_type] || '📷'} {item.content_type}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardPhase}>
                  {phaseIcons[item.phase] || '📌'} {item.phase}
                </Text>
                <Text style={styles.cardTheme}>{item.theme}</Text>
                <Text style={styles.cardTip}>💡 {item.tip}</Text>
              </View>

              {item.caption_template ? (
                <View style={styles.templateBox}>
                  <Text style={styles.templateLabel}>Template:</Text>
                  <Text style={styles.templateText}>{item.caption_template}</Text>
                </View>
              ) : null}

              {/* Action: Navigate to capture */}
              <TouchableOpacity
                style={styles.captureBtn}
                onPress={() => navigation.navigate('LiveCapture', { eventId })}
              >
                <Text style={styles.captureBtnText}>📸 Vastleggen</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Regenerate */}
      <TouchableOpacity style={styles.regenerateBtn} onPress={generateArc}>
        <Text style={styles.regenerateText}>🔄 Nieuwe Story Arc genereren</Text>
      </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.md,
  },
  loadingSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Header
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
  narrative: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },

  // Error
  errorContainer: {
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.error,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryText: {
    color: colors.textOnPrimary,
    fontWeight: fontWeight.semibold,
  },

  // Timeline
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineLine: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 16,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },

  // Arc card
  arcCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTime: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  badge: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  cardBody: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  cardPhase: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    textTransform: 'capitalize',
  },
  cardTheme: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  cardTip: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Template
  templateBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  templateLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  templateText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  // Capture button
  captureBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '08',
  },
  captureBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },

  // Regenerate
  regenerateBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  regenerateText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});
