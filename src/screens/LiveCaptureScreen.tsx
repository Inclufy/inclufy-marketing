import React, { useState, useCallback, useEffect } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

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
import type { RootStackParamList, MediaType, Channel } from '../types';
import { CAPTURE_TAG_PRESETS } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useTranslation } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'LiveCapture'>;

type CaptureMode = 'photo' | 'video' | 'audio' | 'quote' | 'upload';

export default function LiveCaptureScreen() {
  const { t } = useTranslation();

  const MODE_TABS: { key: CaptureMode; label: string; icon: string }[] = [
    { key: 'photo', label: t.liveCapture.photo, icon: 'camera-outline' },
    { key: 'video', label: t.liveCapture.video, icon: 'videocam-outline' },
    { key: 'audio', label: t.liveCapture.audio, icon: 'mic-outline' },
    { key: 'quote', label: t.liveCapture.quote, icon: 'document-text-outline' },
    { key: 'upload', label: 'Upload', icon: 'image-outline' },
  ];

  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  // params may be undefined when navigated from the tab bar without an event
  const eventId: string = (route.params as any)?.eventId ?? '';

  const { data: event } = useEvent(eventId || undefined);
  const { data: captures = [] } = useCaptures(eventId || undefined);
  const { data: brandMemory } = useBrandMemory();
  const createCapture = useCreateCapture();
  const createPosts = useCreatePosts();

  const [mode, setMode] = useState<CaptureMode>('photo');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [processing, setProcessing] = useState(false);

  // Per-capture channel selection — defaults to the event's channels, user can override
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>([]);

  // Sync with event channels when the event loads (only if user hasn't manually changed them)
  useEffect(() => {
    if (event?.channels?.length) {
      setSelectedChannels(event.channels as Channel[]);
    }
  }, [event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleChannel = (ch: Channel) =>
    setSelectedChannels((prev) =>
      prev.includes(ch) ? (prev.length > 1 ? prev.filter((c) => c !== ch) : prev) : [...prev, ch],
    );

  const CHANNEL_OPTIONS: { key: Channel; label: string; color: string; icon: string }[] = [
    { key: 'linkedin',  label: 'LinkedIn',  color: '#0077B5', icon: 'logo-linkedin'  },
    { key: 'instagram', label: 'Instagram', color: '#E4405F', icon: 'logo-instagram' },
    { key: 'x',         label: 'X',         color: '#e0e0e0', icon: 'logo-twitter'   },
    { key: 'facebook',  label: 'Facebook',  color: '#1877F2', icon: 'logo-facebook'  },
  ];

  // Guard: no eventId → show event selector screen instead of crashing
  if (!eventId) {
    const goBack = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        (navigation as any).navigate('Main');
      }
    };
    const goToEvents = () => {
      // Navigate to Events tab inside Main tab navigator
      try {
        (navigation as any).navigate('Main', { screen: 'EventsTab' });
      } catch {
        navigation.goBack();
      }
    };
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Back button */}
        <TouchableOpacity
          onPress={goBack}
          style={{ position: 'absolute', top: 56, left: 20, zIndex: 10, padding: 8 }}
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>

        {/* Content centred */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surfaceElevated, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
            <Ionicons name="camera-outline" size={40} color={colors.primary} />
          </View>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' }}>
            Selecteer een event
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 10, textAlign: 'center', lineHeight: 22 }}>
            Open een event vanuit de Events-tab en tik op{' '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>"Capture"</Text>
            {' '}om te starten.
          </Text>

          <TouchableOpacity
            onPress={goToEvents}
            style={{ marginTop: 32, backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 28, flexDirection: 'row', alignItems: 'center', gap: 8 }}
          >
            <Ionicons name="calendar-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Naar Events</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goBack}
            style={{ marginTop: 16, paddingHorizontal: 32, paddingVertical: 12 }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Annuleer</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        // 1. Normalise photo orientation (bakes EXIF rotation into pixels so
        //    React Native's Image component displays it upright on all devices)
        let finalUri = mediaUri;
        if (mediaType === 'photo') {
          const result = await ImageManipulator.manipulateAsync(
            mediaUri,
            [], // no explicit transforms — re-encoding normalises the EXIF rotation
            { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
          );
          finalUri = result.uri;
        }

        // 2. Upload media to Supabase Storage — skip for text/quote captures
        let uploadUrl: string | null = null;
        let uploadPath: string | null = null;
        if (mediaType !== 'quote') {
          try {
            const uploaded = await uploadMedia(finalUri, eventId, mediaType as any);
            uploadUrl = uploaded.url;
            uploadPath = uploaded.path;
          } catch (uploadErr: any) {
            if (mediaType === 'audio') {
              // Audio upload is non-fatal — we still have the transcript for AI generation
              console.warn('[processCapture] Audio upload failed (non-fatal):', uploadErr?.message);
            } else {
              throw uploadErr; // Photo / video upload failure IS fatal
            }
          }
        }

        // 3. Create capture record
        // media_url has a NOT NULL DB constraint — use empty string for quote/audio-no-upload
        const capture = await createCapture.mutateAsync({
          event_id: eventId,
          media_type: mediaType,
          media_url: uploadUrl ?? '',
          storage_path: uploadPath,
          thumbnail_url: mediaType === 'photo' ? uploadUrl : null,
          tags: selectedTags,
          note: note.trim(),
          ai_status: 'processing',
          ai_description: null,
          duration_seconds: null,
          transcript: transcript || null,
          captured_at: new Date().toISOString(),
        } as any);

        // 4. Generate AI posts for all channels
        let imageBase64: string | undefined;
        if (mediaType === 'photo') {
          // Use finalUri (orientation-corrected) so the AI also sees the upright image
          try {
            const base64 = await FileSystem.readAsStringAsync(finalUri, {
              encoding: 'base64' as any,
            });
            imageBase64 = base64;
          } catch (readErr) {
            console.warn('[processCapture] Could not read photo as base64:', readErr);
          }
        }

        const brandCtx = toBrandContext(brandMemory);
        if (brandCtx) aiService.setBrandContext(brandCtx);

        // For non-photo captures, use the transcript or note as text context for the AI
        const aiTranscript = transcript || (mediaType !== 'photo' ? note.trim() : undefined);

        let results: Record<string, any> = {};
        try {
          const activeChannels: Channel[] = selectedChannels.length
            ? selectedChannels
            : ((event.channels?.length ? event.channels : ['linkedin', 'instagram']) as Channel[]);

        results = await aiService.generateAllChannelPosts(
            activeChannels,
            imageBase64,
            aiTranscript,
            {
              name: event.name,
              description: event.description,
              hashtags: event.hashtags,
              location: event.location,
            },
            note.trim(),
            selectedTags,
          );
        } catch (aiErr) {
          // AI generation failed (timeout, Edge Function error, etc.)
          // Create placeholder posts so user can still navigate to PostReview and edit manually
          console.warn('[processCapture] AI generation failed, using placeholders:', aiErr);
          const fallbackChannels: Channel[] = selectedChannels.length
            ? selectedChannels
            : ((event.channels?.length ? event.channels : ['linkedin', 'instagram']) as Channel[]);
          for (const channel of fallbackChannels) {
            results[channel] = {
              text: note.trim() || event.name,
              hashtags: event.hashtags || [],
              image_description: '',
              optimal_post_time: '',
            };
          }
        }

        // 5. Save generated posts
        const postRows = Object.entries(results).map(([channel, result]) => ({
          capture_id: capture.id,
          event_id: eventId,
          channel: channel as any,
          text_content: result.text,
          hashtags: result.hashtags,
          branded_image_url: mediaType === 'photo' ? uploadUrl : null,
          image_format: channel === 'instagram' ? 'square' as const : 'landscape' as const,
          status: 'draft' as const,
          published_at: null,
          scheduled_at: null,
          publish_error: null,
          engagement: { likes: 0, comments: 0, shares: 0 },
        }));

        await createPosts.mutateAsync(postRows);

        // 6. Auto-tag the image in the background (non-blocking)
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

        // 6. Navigate to review — pass local URI for instant image display (no network wait)
        setNote('');
        setSelectedTags([]);
        navigation.navigate('PostReview', {
          captureId: capture.id,
          eventId,
          // Use finalUri (orientation-corrected) so PostReview shows the image upright
          localMediaUri: (mediaType === 'photo' || mediaType === 'video') ? finalUri : undefined,
        });
      } catch (error: any) {
        Alert.alert(t.common.error, error.message || t.liveCapture.processingError);
      } finally {
        setProcessing(false);
      }
    },
    [event, eventId, selectedTags, selectedChannels, note, brandMemory, createCapture, createPosts, navigation],
  );

  const handlePhotoCapture = (uri: string) => processCapture(uri, 'photo');

  const handleVideoEnd = (uri: string) => processCapture(uri, 'video');

  const handleAudioComplete = async (uri: string) => {
    setProcessing(true);
    let transcript = '';
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });
      const result = await aiService.transcribeAudio(base64);
      transcript = result.transcript;
    } catch (transcribeErr) {
      // Transcription is best-effort — Edge Function may not support it.
      // Fall back to using the note field as context so AI can still generate posts.
      console.warn('[AudioCapture] transcription failed (non-fatal):', transcribeErr);
    }
    // Always continue — even with empty transcript the note gives the AI context
    await processCapture(uri, 'audio', transcript || note.trim() || undefined);
  };

  const handleUploadFromLibrary = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Geen toegang', 'Geef toegang tot je fotobibliotheek om een afbeelding te uploaden.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      await processCapture(uri, 'photo');
    }
  };

  const handleQuoteSubmit = async (quote: string, speaker: string) => {
    const text = speaker ? `"${quote}" \u2014 ${speaker}` : `"${quote}"`;
    setNote(text);
    // Quote captures have no media file — processCapture skips uploadMedia for 'quote' type
    await processCapture('', 'quote', text);
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

      {/* Camera / Audio / Quote / Upload View — flex:1, fills remaining space */}
      <View style={styles.captureArea}>
        {mode === 'photo' && <CameraCapture mode="photo" onCapture={handlePhotoCapture} />}
        {mode === 'video' && (
          <CameraCapture mode="video" onCapture={() => {}} onVideoEnd={handleVideoEnd} />
        )}
        {mode === 'audio' && <AudioCapture onRecordingComplete={handleAudioComplete} />}
        {mode === 'quote' && <QuoteCapture onSubmit={handleQuoteSubmit} />}
        {mode === 'upload' && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20, padding: 32, backgroundColor: '#000' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(124,58,237,0.2)', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="image-outline" size={40} color={colors.primary} />
            </View>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center' }}>
              Upload afbeelding
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
              Kies een foto uit je bibliotheek. AI analyseert de afbeelding en genereert posts per kanaal.
            </Text>
            <TouchableOpacity
              onPress={handleUploadFromLibrary}
              style={{ backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 28, flexDirection: 'row', alignItems: 'center', gap: 10 }}
            >
              <Ionicons name="folder-open-outline" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Kies uit bibliotheek</Text>
            </TouchableOpacity>
          </View>
        )}
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

      {/* ── Per-capture channel selector ─────────────────────────────────── */}
      {event && (
        <View style={styles.channelBar}>
          <Text style={styles.channelBarLabel}>Kanalen:</Text>
          <View style={styles.channelChips}>
            {CHANNEL_OPTIONS.map((ch) => {
              const active = selectedChannels.includes(ch.key);
              return (
                <TouchableOpacity
                  key={ch.key}
                  onPress={() => toggleChannel(ch.key)}
                  style={[
                    styles.channelChip,
                    active && { backgroundColor: ch.color + '25', borderColor: ch.color },
                  ]}
                >
                  <Ionicons
                    name={ch.icon as any}
                    size={13}
                    color={active ? ch.color : 'rgba(255,255,255,0.35)'}
                  />
                  <Text style={[styles.channelChipText, active && { color: ch.color }]}>
                    {ch.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
  channelBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.07)',
    gap: 8,
  },
  channelBarLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  channelChips: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'transparent',
  },
  channelChipText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: fontWeight.medium,
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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  processingText: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
  },
  processingSubtext: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
