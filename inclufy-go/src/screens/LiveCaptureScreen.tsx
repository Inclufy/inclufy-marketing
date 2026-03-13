import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as FileSystem from 'expo-file-system/legacy';

import CameraCapture from '../components/CameraCapture';
import AudioCapture from '../components/AudioCapture';
import QuoteCapture from '../components/QuoteCapture';
import TagSelector from '../components/TagSelector';

import { useEvent } from '../hooks/useEvents';
import { useCaptures, useCreateCapture, uploadMedia } from '../hooks/useCaptures';
import { useCreatePosts } from '../hooks/useEventPosts';
import { useBrandMemory, toBrandContext } from '../hooks/useBrandMemory';
import { aiService } from '../services/ai.service';
import { supabase } from '../services/supabase';

import { Ionicons } from '@expo/vector-icons';
import type { RootStackParamList, MediaType } from '../types';
import { CAPTURE_TAG_PRESETS } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useTranslation } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'LiveCapture'>;

type CaptureMode = 'photo' | 'video' | 'audio' | 'quote';

export default function LiveCaptureScreen() {
  const { t } = useTranslation();

  const MODE_TABS: { key: CaptureMode; label: string; icon: string }[] = [
    { key: 'photo', label: t.liveCapture.photo, icon: 'camera-outline' },
    { key: 'video', label: t.liveCapture.video, icon: 'videocam-outline' },
    { key: 'audio', label: t.liveCapture.audio, icon: 'mic-outline' },
    { key: 'quote', label: t.liveCapture.quote, icon: 'document-text-outline' },
  ];

  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { eventId } = route.params;

  const { data: event } = useEvent(eventId);
  const { data: captures = [] } = useCaptures(eventId);
  const { data: brandMemory } = useBrandMemory();
  const createCapture = useCreateCapture();
  const createPosts = useCreatePosts();

  const [mode, setMode] = useState<CaptureMode>('photo');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const tags = event?.default_tags?.length
    ? event.default_tags
    : CAPTURE_TAG_PRESETS.map(String);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const processCapture = useCallback(
    async (mediaUri: string, mediaType: MediaType, transcript?: string) => {
      if (!event) return;
      setProcessing(true);

      try {
        // 1. Upload media to Supabase Storage
        const { url, path } = await uploadMedia(mediaUri, eventId, mediaType as any);

        // 2. Create capture record
        const capture = await createCapture.mutateAsync({
          event_id: eventId,
          media_type: mediaType,
          media_url: url,
          storage_path: path,
          thumbnail_url: mediaType === 'photo' ? url : null,
          tags: selectedTags,
          note: note.trim(),
          ai_status: 'processing',
          ai_description: null,
          duration_seconds: null,
          transcript: transcript || null,
          captured_at: new Date().toISOString(),
        });

        // 3. Generate AI posts for all channels
        let imageBase64: string | undefined;
        if (mediaType === 'photo') {
          const base64 = await FileSystem.readAsStringAsync(mediaUri, {
            encoding: 'base64' as any,
          });
          imageBase64 = base64;
        }

        const brandCtx = toBrandContext(brandMemory);
        if (brandCtx) aiService.setBrandContext(brandCtx);

        const results = await aiService.generateAllChannelPosts(
          event.channels,
          imageBase64,
          transcript,
          {
            name: event.name,
            description: event.description,
            hashtags: event.hashtags,
            location: event.location,
          },
          note.trim(),
          selectedTags,
        );

        // 4. Save generated posts
        const postRows = Object.entries(results).map(([channel, result]) => ({
          capture_id: capture.id,
          event_id: eventId,
          channel: channel as any,
          text_content: result.text,
          hashtags: result.hashtags,
          branded_image_url: mediaType === 'photo' ? url : null,
          image_format: channel === 'instagram' ? 'square' as const : 'landscape' as const,
          status: 'draft' as const,
          published_at: null,
          scheduled_at: null,
          publish_error: null,
          engagement: { likes: 0, comments: 0, shares: 0 },
        }));

        await createPosts.mutateAsync(postRows);

        // 5. Auto-tag the image in the background (non-blocking)
        if (imageBase64) {
          aiService.autoTagImage({
            image_base64: imageBase64,
            existing_tags: selectedTags,
          }).then((tagResult) => {
            // Store AI tags on the capture record
            supabase
              .from('go_captures')
              .update({
                ai_tags: tagResult.tags,
                ai_description: tagResult.scene_description,
                ai_status: 'completed',
              })
              .eq('id', capture.id)
              .then(() => {
                console.log('Auto-tags saved for capture', capture.id);
              });
          }).catch((err) => {
            console.warn('Auto-tagging failed (non-critical):', err);
            // Still mark as completed since posts were generated
            supabase
              .from('go_captures')
              .update({ ai_status: 'completed' })
              .eq('id', capture.id)
              .then(() => {});
          });
        } else {
          // Non-photo captures: just mark as completed
          supabase
            .from('go_captures')
            .update({ ai_status: 'completed' })
            .eq('id', capture.id)
            .then(() => {});
        }

        // 6. Navigate to review
        setNote('');
        setSelectedTags([]);
        navigation.navigate('PostReview', { captureId: capture.id, eventId });
      } catch (error: any) {
        Alert.alert(t.common.error, error.message || t.liveCapture.processingError);
      } finally {
        setProcessing(false);
      }
    },
    [event, eventId, selectedTags, note, brandMemory, createCapture, createPosts, navigation],
  );

  const handlePhotoCapture = (uri: string) => processCapture(uri, 'photo');

  const handleVideoEnd = (uri: string) => processCapture(uri, 'video');

  const handleAudioComplete = async (uri: string) => {
    // First transcribe, then process
    try {
      setProcessing(true);
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });
      const { transcript } = await aiService.transcribeAudio(base64);
      await processCapture(uri, 'audio', transcript);
    } catch (error: any) {
      setProcessing(false);
      console.error('[AudioCapture] transcription error:', error);
      Alert.alert(t.common.error, error?.message || t.liveCapture.audioTranscriptionFailed);
    }
  };

  const handleQuoteSubmit = async (quote: string, speaker: string) => {
    const text = speaker ? `"${quote}" \u2014 ${speaker}` : `"${quote}"`;
    // For quotes, we store the text as the note and create a text-based capture
    setNote(text);
    // Create a minimal file placeholder since we need a media_url
    const tempUri = `${FileSystem.cacheDirectory}quote_${Date.now()}.txt`;
    await FileSystem.writeAsStringAsync(tempUri, text);
    await processCapture(tempUri, 'quote', text);
  };

  if (processing) {
    return (
      <View style={styles.processingOverlay}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.processingText}>{t.liveCapture.aiGenerating}</Text>
        <Text style={styles.processingSubtext}>
          {t.liveCapture.aiGeneratingSubtext}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header overlay */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'\u2039'} {t.common.back}</Text>
        </TouchableOpacity>
        <Text style={styles.eventName} numberOfLines={1}>{event?.name || 'Event'}</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Camera / Audio / Quote View — flex:1, fills remaining space */}
      <View style={styles.captureArea}>
        {mode === 'photo' && <CameraCapture mode="photo" onCapture={handlePhotoCapture} />}
        {mode === 'video' && (
          <CameraCapture mode="video" onCapture={() => {}} onVideoEnd={handleVideoEnd} />
        )}
        {mode === 'audio' && <AudioCapture onRecordingComplete={handleAudioComplete} />}
        {mode === 'quote' && <QuoteCapture onSubmit={handleQuoteSubmit} />}
      </View>

      {/* Bottom controls — NOT absolute, sits between camera and mode tabs */}
      {(mode === 'photo' || mode === 'video') && (
        <View style={styles.bottomControls}>
          {/* Tags */}
          <TagSelector tags={tags} selected={selectedTags} onToggle={toggleTag} />

          {/* Note */}
          <TextInput
            style={styles.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder={t.liveCapture.notePlaceholder}
            placeholderTextColor="rgba(255,255,255,0.4)"
            returnKeyType="done"
          />
        </View>
      )}

      {/* Mode Tabs */}
      <View style={styles.modeTabs}>
        {MODE_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.modeTab, mode === tab.key && styles.modeTabActive]}
            onPress={() => setMode(tab.key)}
          >
            <Ionicons name={tab.icon as any} size={20} color={mode === tab.key ? colors.textOnPrimary : colors.textSecondary} />
            <Text
              style={[styles.modeLabel, mode === tab.key && styles.modeLabelActive]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent captures strip */}
      {captures.length > 0 && (
        <ScrollView
          horizontal
          style={styles.recentStrip}
          contentContainerStyle={styles.recentStripContent}
          showsHorizontalScrollIndicator={false}
        >
          {captures.slice(0, 10).map((cap) => (
            <TouchableOpacity
              key={cap.id}
              onPress={() =>
                navigation.navigate('PostReview', { captureId: cap.id, eventId })
              }
            >
              {cap.media_type === 'photo' && cap.thumbnail_url ? (
                <Image source={{ uri: cap.thumbnail_url }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                  <Ionicons
                    name={cap.media_type === 'video' ? 'videocam-outline' : cap.media_type === 'audio' ? 'mic-outline' : 'document-text-outline'}
                    size={16}
                    color={colors.textSecondary}
                  />
                </View>
              )}
              {cap.ai_status === 'completed' && (
                <View style={styles.thumbnailBadge}>
                  <Ionicons name="checkmark" size={8} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backBtn: { padding: spacing.xs },
  backText: { color: '#fff', fontSize: fontSize.md },
  eventName: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    flex: 1,
    textAlign: 'center',
  },
  captureArea: { flex: 1 },
  bottomControls: {
    backgroundColor: '#111',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    color: '#fff',
    fontSize: fontSize.sm,
  },
  modeTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modeTab: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  modeTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  modeIcon: { fontSize: 20 },
  modeLabel: { fontSize: fontSize.xs, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  modeLabelActive: { color: colors.primary, fontWeight: fontWeight.semibold },
  recentStrip: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    maxHeight: 70,
  },
  recentStripContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.sm,
  },
  thumbnailPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  processingText: {
    color: '#fff',
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  processingSubtext: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
