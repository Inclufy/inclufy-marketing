import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useEvent } from '../hooks/useEvents';
import { useCaptures } from '../hooks/useCaptures';
import { aiService, type StoryArcPost } from '../services/ai.service';
import { useBrandMemory, toBrandContext } from '../hooks/useBrandMemory';
import type { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { cardShadow } from '../utils/shadows';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'StoryArc'>;

// Map phases/channels to Ionicons names
const phaseIcons: Record<string, string> = {
  arrival: 'walk-outline',
  keynote: 'mic-outline',
  networking: 'people-outline',
  demo: 'laptop-outline',
  highlights: 'star-outline',
  wrapup: 'checkmark-circle-outline',
  panel: 'chatbubbles-outline',
  workshop: 'construct-outline',
};

const channelIcons: Record<string, string> = {
  linkedin: 'briefcase-outline',
  instagram: 'camera-outline',
  x: 'logo-twitter',
  facebook: 'logo-facebook',
  tiktok: 'musical-notes-outline',
};

const contentTypeIcons: Record<string, string> = {
  photo: 'camera-outline',
  video: 'videocam-outline',
  audio: 'mic-outline',
  quote: 'chatbox-ellipses-outline',
  reel: 'play-circle-outline',
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
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="git-branch-outline" size={22} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Story Arc</Text>
            <Text style={styles.headerEvent}>{event?.name}</Text>
          </View>
        </View>
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
                  <View style={styles.badgeRow}>
                    <Ionicons name={(channelIcons[item.channel] || 'phone-portrait-outline') as any} size={12} color={colors.textSecondary} />
                    <Text style={styles.badgeText}>{item.channel}</Text>
                  </View>
                  <View style={styles.badgeRow}>
                    <Ionicons name={(contentTypeIcons[item.content_type] || 'camera-outline') as any} size={12} color={colors.textSecondary} />
                    <Text style={styles.badgeText}>{item.content_type}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.phaseRow}>
                  <Ionicons name={(phaseIcons[item.phase] || 'ellipse-outline') as any} size={14} color={colors.primary} />
                  <Text style={styles.cardPhase}>{item.phase}</Text>
                </View>
                <Text style={styles.cardTheme}>{item.theme}</Text>
                <View style={styles.tipRow}>
                  <Ionicons name="bulb-outline" size={13} color={colors.textSecondary} />
                  <Text style={styles.cardTip}>{item.tip}</Text>
                </View>
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
                <Ionicons name="camera-outline" size={15} color={colors.primary} />
                <Text style={styles.captureBtnText}>Vastleggen</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Regenerate */}
      <TouchableOpacity style={styles.regenerateBtn} onPress={generateArc}>
        <Ionicons name="refresh-outline" size={16} color={colors.primary} />
        <Text style={styles.regenerateText}>Nieuwe Story Arc genereren</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  headerEvent: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  narrative: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
    lineHeight: 22,
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.borderLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  cardBody: {
    gap: 6,
    marginBottom: spacing.sm,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
    fontWeight: fontWeight.medium,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 2,
  },
  cardTip: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  regenerateText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
});
