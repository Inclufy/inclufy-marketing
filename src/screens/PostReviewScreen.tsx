import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useCapturePosts, useUpdatePost, usePublishPost, useBatchPublish, useDeletePost } from '../hooks/useEventPosts';
import { uploadMedia } from '../hooks/useCaptures';
import * as ImageManipulator from 'expo-image-manipulator';
import { useEvent } from '../hooks/useEvents';
import { aiService } from '../services/ai.service';
import { supabase } from '../services/supabase';
import type { RootStackParamList, EventPost, Channel } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useTranslation } from '../i18n';
import { useTheme } from '../context/ThemeContext';
import { useThemedStyles } from '../utils/themedStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PostReview'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const channelConfig: Record<Channel, { label: string; color: string; icon: string }> = {
  linkedin: { label: 'LinkedIn', color: '#0077B5', icon: 'logo-linkedin' },
  instagram: { label: 'Instagram', color: '#E4405F', icon: 'logo-instagram' },
  x: { label: 'X', color: '#000000', icon: 'logo-twitter' },
  facebook: { label: 'Facebook', color: '#1877F2', icon: 'logo-facebook' },
};

export default function PostReviewScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { captureId, eventId, localMediaUri } = route.params;
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useCapturePosts(captureId);
  const updatePost = useUpdatePost();
  const publishPost = usePublishPost();
  const batchPublish = useBatchPublish();
  const deletePost = useDeletePost();
  const [flippingImage, setFlippingImage] = useState(false);

  // Fetch raw capture data to get storage_path for signed URL
  const { data: capture, isFetching: captureFetching } = useQuery({
    queryKey: ['capture', captureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('go_captures')
        .select('id, storage_path, media_type, media_url')
        .eq('id', captureId)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!captureId,
    staleTime: 60_000,
  });

  const hasCapture = capture !== undefined; // undefined = still loading
  const storagePath = (capture as any)?.storage_path as string | null | undefined;
  const mediaType  = (capture as any)?.media_type  as string | null | undefined;
  const mediaUrl   = (capture as any)?.media_url   as string | null | undefined;
  const hasMedia   = !!(storagePath || mediaUrl);

  // Get a usable image URL — signed URL works for both public and private Supabase buckets
  const { data: captureImageUrl, isFetching: urlFetching } = useQuery({
    queryKey: ['capture-image-url', captureId, storagePath],
    queryFn: async () => {
      // Only photos and videos have a preview ('image' is accepted as alias for 'photo')
      if (mediaType && !['photo', 'video', 'image'].includes(mediaType)) return null;

      // 1) Signed URL from storage_path — works for BOTH public and private buckets
      if (storagePath) {
        const { data: signData } = await supabase.storage
          .from('media')
          .createSignedUrl(storagePath, 3600);
        if (signData?.signedUrl) return signData.signedUrl;
      }

      // 2) Fall back to direct media_url (works when bucket is public)
      return mediaUrl ?? null;
    },
    enabled: hasCapture && hasMedia,
    staleTime: 50 * 60 * 1000, // 50 min — before signed-URL expiry
    retry: 2,
  });

  // Show loading spinner while: capture query is in-flight, OR signed-URL is being created
  const imageIsLoading = captureFetching || (hasMedia && urlFetching);

  // When captureImageUrl refreshes to a new URL, clear it from failedUrls so the Image retries
  const prevCaptureUrlRef = React.useRef<string | null | undefined>(undefined);
  React.useEffect(() => {
    if (captureImageUrl && captureImageUrl !== prevCaptureUrlRef.current) {
      prevCaptureUrlRef.current = captureImageUrl;
      setFailedUrls((prev) => {
        if (!prev.has(captureImageUrl)) return prev;
        const next = new Set(prev);
        next.delete(captureImageUrl);
        return next;
      });
    }
  }, [captureImageUrl]);

  const { data: event } = useEvent(eventId);

  const [activeIndex, setActiveIndex] = useState(0);
  const [editingText, setEditingText] = useState<Record<string, string>>({});
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // ── Language select ───────────────────────────────────────────────────────
  const [postLang, setPostLang] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState<string | null>(null); // postId

  // ── Schedule ─────────────────────────────────────────────────────────────
  const [schedulingPost, setSchedulingPost] = useState<EventPost | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [scheduling, setScheduling] = useState(false);

  // ── Preview ──────────────────────────────────────────────────────────────
  const [previewPost, setPreviewPost] = useState<EventPost | null>(null);
  // Isolated image-load state for the preview modal — does NOT share failedUrls
  // from the main cards so a transient network error never permanently hides the image
  // Track failed URLs individually so we can fall back to the next candidate automatically
  const [previewFailedUrls, setPreviewFailedUrls] = useState<Set<string>>(new Set());
  const [previewImgLoaded, setPreviewImgLoaded] = useState(false);
  useEffect(() => {
    // Reset image state every time a new post is opened for preview
    setPreviewFailedUrls(new Set());
    setPreviewImgLoaded(false);
  }, [previewPost?.id]);

  // ── Brand kit logo fetch ─────────────────────────────────────────────────
  const { data: brandKit } = useQuery({
    queryKey: ['brand-kit', (event as any)?.brand_kit_id],
    queryFn: async () => {
      const bkId = (event as any)?.brand_kit_id;
      if (!bkId) return null;
      const { data } = await supabase
        .from('brand_kits')
        .select('logo_url, name')
        .eq('id', bkId)
        .single();
      return data ?? null;
    },
    enabled: !!(event as any)?.brand_kit_id,
    staleTime: 10 * 60_000,
  });
  const brandLogoUrl: string | null = (brandKit as any)?.logo_url ?? null;
  const eventLogoUrl: string | null = (event as any)?.cover_image_url ?? null;

  // ── Image Overlay Editor ──────────────────────────────────────────────────
  // Stores per-post overlay config: text label + logo position + logo type
  // Initialized from engagement.overlay_config (persisted) when posts load
  const [overlayConfig, setOverlayConfig] = useState<Record<string, {
    text: string;
    textPosition: 'top' | 'bottom';
    showLogo: boolean;
    logoType: 'brand' | 'event' | 'both';
    logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  }>>({});
  const [editingOverlay, setEditingOverlay] = useState<string | null>(null); // postId being edited
  const [overlayDraft, setOverlayDraft] = useState<{
    text: string;
    textPosition: 'top' | 'bottom';
    showLogo: boolean;
    logoType: 'brand' | 'event' | 'both';
    logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  }>({ text: '', textPosition: 'bottom', showLogo: false, logoType: 'brand', logoPosition: 'bottom-right' });

  // Seed overlayConfig from DB (engagement.overlay_config) once posts load
  useEffect(() => {
    if (!posts.length) return;
    setOverlayConfig((prev) => {
      const next = { ...prev };
      for (const post of posts) {
        if (!next[post.id]) {
          const saved = (post.engagement as any)?.overlay_config;
          if (saved?.text || saved?.showLogo) next[post.id] = saved;
        }
      }
      return next;
    });
  }, [posts]);

  const openOverlayEditor = (post: EventPost) => {
    const existing = overlayConfig[post.id] ?? {
      text: '', textPosition: 'bottom' as const, showLogo: false, logoType: 'brand' as const, logoPosition: 'bottom-right' as const,
    };
    setOverlayDraft({ ...existing });
    setEditingOverlay(post.id);
  };

  const saveOverlay = async (postId: string) => {
    // Update local state immediately for instant UI feedback
    setOverlayConfig((prev) => ({ ...prev, [postId]: { ...overlayDraft } }));
    setEditingOverlay(null);
    // Persist to DB inside engagement JSONB so it survives navigation
    const post = posts.find((p) => p.id === postId);
    if (post) {
      try {
        await updatePost.mutateAsync({
          id: postId,
          engagement: {
            ...(post.engagement ?? { likes: 0, comments: 0, shares: 0 }),
            overlay_config: { ...overlayDraft },
          } as any,
        });
      } catch {
        // Non-critical — overlay is still shown locally even if DB save fails
      }
    }
  };

  const clearOverlay = async (postId: string) => {
    setOverlayConfig((prev) => {
      const next = { ...prev };
      delete next[postId];
      return next;
    });
    setEditingOverlay(null);
    // Remove from DB too
    const post = posts.find((p) => p.id === postId);
    if (post) {
      try {
        const eng = { ...(post.engagement ?? { likes: 0, comments: 0, shares: 0 }) };
        delete (eng as any).overlay_config;
        await updatePost.mutateAsync({ id: postId, engagement: eng });
      } catch { /* non-critical */ }
    }
  };

  // ── Regenerate ───────────────────────────────────────────────────────────
  const [regenerating, setRegenerating] = useState<string | null>(null); // postId

  // ── Multi-image strip ─────────────────────────────────────────────────────
  // Tracks which image index is currently displayed for each post
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});

  // Returns all image URLs for a post: fallbackUrl (freshness-aware) first, then extras.
  // fallbackUrl is already computed to skip expired/failed branded_image_url and use
  // captureImageUrl (fresh signed URL) when needed — so we trust it over the raw DB value.
  const getPostImages = (post: EventPost, fallbackUrl: string | null | undefined): string[] => {
    const images: string[] = [];
    // fallbackUrl encapsulates: localMediaUri → valid branded_image_url → captureImageUrl
    const primary = fallbackUrl || '';
    if (primary) images.push(primary);
    const extra = post.engagement?.extra_images;
    if (Array.isArray(extra)) {
      extra.forEach((url: string) => { if (url && !images.includes(url)) images.push(url); });
    }
    return images;
  };

  // Upload one or more extra images and append them to engagement.extra_images
  const handleAddExtraImage = async (post: EventPost) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Geen toegang', 'Geef toegang tot je fotobibliotheek om afbeeldingen toe te voegen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets.length) return;

    setUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (const asset of result.assets) {
        const { url } = await uploadMedia(asset.uri, eventId, 'photo');
        uploadedUrls.push(url);
      }
      const currentExtra: string[] = post.engagement?.extra_images ?? [];
      const newExtra = [...currentExtra, ...uploadedUrls];
      await updatePost.mutateAsync({
        id: post.id,
        engagement: { ...(post.engagement ?? { likes: 0, comments: 0, shares: 0 }), extra_images: newExtra },
      });
      // Jump to the first newly added image
      const existingCount = (post.branded_image_url ? 1 : 0) + currentExtra.length;
      setActiveImageIndex((prev) => ({ ...prev, [post.id]: existingCount }));
    } catch {
      Alert.alert('Fout', 'Uploaden mislukt. Controleer je internetverbinding en probeer opnieuw.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Allow the user to attach/replace the post image by picking from the photo library.
  // Updates ALL posts for this capture (all channels share the same source photo).
  const handleAddImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Geen toegang', 'Geef toegang tot je fotobibliotheek om een afbeelding toe te voegen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets.length) return;

    setUploadingImage(true);
    try {
      const { url, path } = await uploadMedia(result.assets[0].uri, eventId, 'photo');

      // Update capture row with new media info so signed URLs work on reload
      await supabase
        .from('go_captures')
        .update({ media_url: url, storage_path: path, media_type: 'photo', thumbnail_url: url })
        .eq('id', captureId);

      // Stamp all posts for this capture with the new branded image URL
      await Promise.all(
        posts.map((p) => updatePost.mutateAsync({ id: p.id, branded_image_url: url }))
      );

      // Invalidate queries so the new URL is picked up immediately
      queryClient.invalidateQueries({ queryKey: ['capture', captureId] });
      queryClient.invalidateQueries({ queryKey: ['capture-image-url', captureId] });
    } catch {
      Alert.alert('Fout', 'Uploaden mislukt. Controleer je internetverbinding en probeer opnieuw.');
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Delete post ──────────────────────────────────────────────────────────
  const handleDeletePost = (post: EventPost) => {
    Alert.alert(
      'Post verwijderen?',
      `Verwijder de ${channelConfig[post.channel]?.label ?? post.channel} post. Dit kan niet ongedaan worden gemaakt.`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost.mutateAsync(post.id);
              // If this was the only/last post, go back
              if (posts.length <= 1) navigation.goBack();
            } catch {
              Alert.alert('Fout', 'Kon post niet verwijderen.');
            }
          },
        },
      ],
    );
  };

  // ── Flip image ────────────────────────────────────────────────────────────
  const handleFlipImage = async (post: EventPost, imageUrl: string) => {
    if (flippingImage) return;
    setFlippingImage(true);
    try {
      // Flip horizontally using expo-image-manipulator
      const result = await ImageManipulator.manipulateAsync(
        imageUrl,
        [{ flip: ImageManipulator.FlipType.Horizontal }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );
      const { url, path } = await uploadMedia(result.uri, eventId, 'photo');
      // Update capture + all posts for this capture with the flipped image
      await supabase
        .from('go_captures')
        .update({ media_url: url, storage_path: path, thumbnail_url: url })
        .eq('id', captureId);
      await Promise.all(
        posts.map((p) => updatePost.mutateAsync({ id: p.id, branded_image_url: url })),
      );
      queryClient.invalidateQueries({ queryKey: ['capture', captureId] });
      queryClient.invalidateQueries({ queryKey: ['capture-image-url', captureId] });
    } catch {
      Alert.alert('Fout', 'Afbeelding omdraaien mislukt.');
    } finally {
      setFlippingImage(false);
    }
  };

  // ── Translate to language ─────────────────────────────────────────────────
  const LANG_OPTIONS = [
    { code: 'nl', label: 'NL', flag: '🇳🇱' },
    { code: 'en', label: 'EN', flag: '🇬🇧' },
    { code: 'de', label: 'DE', flag: '🇩🇪' },
    { code: 'fr', label: 'FR', flag: '🇫🇷' },
    { code: 'es', label: 'ES', flag: '🇪🇸' },
  ];

  const handleSelectLang = async (post: EventPost, lang: string) => {
    if (postLang[post.id] === lang) return; // already this lang
    setTranslating(post.id);
    try {
      const currentText = editingText[post.id] ?? post.text_content;
      const result = await aiService.translateContent({
        text: currentText,
        source_language: postLang[post.id] || 'nl',
        target_languages: [lang],
        platform: post.channel,
      });
      const translated = result.translations?.[lang];
      if (translated?.text) {
        setEditingText((prev) => ({ ...prev, [post.id]: translated.text }));
        // Auto-save translated text
        await updatePost.mutateAsync({ id: post.id, text_content: translated.text });
      }
      setPostLang((prev) => ({ ...prev, [post.id]: lang }));
    } catch {
      Alert.alert(t.common.error, 'Vertaling mislukt. Controleer je verbinding.');
    } finally {
      setTranslating(null);
    }
  };

  // ── Regenerate post ────────────────────────────────────────────────────
  const handleRegenerate = async (post: EventPost) => {
    if (!event) return;
    setRegenerating(post.id);
    try {
      const result = await aiService.generateEventPost({
        platform: post.channel as any,
        event_context: {
          name: event.name,
          description: event.description,
          hashtags: event.hashtags,
          location: event.location,
        },
        capture_note: post.text_content?.slice(0, 100) || '',
        capture_tags: [],
      });
      if (result.text) {
        setEditingText((prev) => ({ ...prev, [post.id]: result.text }));
        await updatePost.mutateAsync({ id: post.id, text_content: result.text });
      }
    } catch {
      Alert.alert(t.common.error, 'Regeneratie mislukt. Controleer je verbinding.');
    } finally {
      setRegenerating(null);
    }
  };

  // ── Schedule confirm ──────────────────────────────────────────────────────
  const handleScheduleConfirm = async () => {
    if (!schedulingPost || !scheduleDate.trim()) return;
    setScheduling(true);
    try {
      const timeStr = scheduleTime.trim() || '09:00';
      const scheduled_at = `${scheduleDate.trim()}T${timeStr}:00`;
      // Save any pending text first
      if (editingText[schedulingPost.id]) {
        await updatePost.mutateAsync({ id: schedulingPost.id, text_content: editingText[schedulingPost.id] });
      }
      await updatePost.mutateAsync({ id: schedulingPost.id, status: 'scheduled', scheduled_at } as any);
      setSchedulingPost(null);
      setScheduleDate('');
      setScheduleTime('09:00');
      Alert.alert('✅ Ingepland', `Post ingepland voor ${scheduleDate} om ${timeStr}.`);
    } catch {
      Alert.alert(t.common.error, 'Inplannen mislukt. Controleer de datum (JJJJ-MM-DD).');
    } finally {
      setScheduling(false);
    }
  };

  const styles = useThemedStyles((c) => ({
    container: { flex: 1, backgroundColor: c.background },
    loading: { flex: 1, justifyContent: 'center' as const, alignItems: 'center' as const },
    emptyText: { color: c.textSecondary, fontSize: fontSize.md },
    channelTabs: {
      flexDirection: 'row' as const,
      backgroundColor: c.surface,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    channelTab: {
      flex: 1,
      alignItems: 'center' as const,
      paddingVertical: spacing.sm,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent' as const,
    },
    channelLabel: {
      fontSize: fontSize.xs,
      color: c.textSecondary,
      marginTop: 2,
    },
    postContent: {
      padding: spacing.md,
      gap: spacing.md,
      paddingBottom: 100,
    },
    postImage: {
      width: '100%' as const,
      height: 250,
      borderRadius: borderRadius.lg,
      backgroundColor: c.surfaceElevated,
    },
    postImageWrapper: {
      position: 'relative' as const,
    },
    zoomHint: {
      position: 'absolute' as const,
      bottom: 8,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.45)',
      borderRadius: borderRadius.full,
      padding: 5,
    },
    imagePlaceholder: {
      width: '100%' as const,
      height: 250,
      borderRadius: borderRadius.lg,
      backgroundColor: c.surfaceElevated,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    imagePlaceholderText: {
      fontSize: fontSize.sm,
      color: c.textTertiary,
      marginTop: spacing.xs,
    },
    addImageBtn: {
      marginTop: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: borderRadius.full,
      borderWidth: 1.5,
      borderColor: c.primary,
    },
    addImageBtnText: {
      fontSize: fontSize.sm,
      color: c.primary,
      fontWeight: fontWeight.semibold,
    },
    statusRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
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
      color: c.textTertiary,
    },
    textEdit: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      fontSize: fontSize.md,
      color: c.text,
      minHeight: 120,
      textAlignVertical: 'top' as const,
    },
    hashtags: {
      fontSize: fontSize.sm,
      color: c.primary,
    },
    actions: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      alignItems: 'center' as const,
    },
    actionBtn: {
      flex: 1,
      borderRadius: borderRadius.md,
      paddingVertical: 14,
      alignItems: 'center' as const,
    },
    actionBtnText: {
      color: c.textOnPrimary,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
    actionBtnDisabledText: {
      color: c.textOnPrimary,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      opacity: 0.7,
    },
    translateBtn: {
      borderRadius: borderRadius.md,
      paddingVertical: 12,
      alignItems: 'center' as const,
      borderWidth: 1.5,
      borderColor: c.info,
      backgroundColor: c.info + '10',
    },
    translateBtnText: {
      color: c.info,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    audienceBtn: {
      borderRadius: borderRadius.md,
      paddingVertical: 12,
      alignItems: 'center' as const,
      borderWidth: 1.5,
      borderColor: c.success,
      backgroundColor: c.success + '10',
    },
    audienceBtnText: {
      color: c.success,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
    },
    publishAllBtn: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: c.primary,
      paddingVertical: 18,
      paddingBottom: 34,
      alignItems: 'center' as const,
    },
    publishAllText: {
      color: c.textOnPrimary,
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
    },
  }));

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
              Alert.alert('✅ Gepubliceerd', `Post is gepubliceerd op ${channelConfig[post.channel]?.label}.`);
            } catch (err: any) {
              if (err?.message === 'SOCIAL_NOT_CONNECTED') {
                Alert.alert(
                  '⚠️ Geen sociale media verbinding',
                  `Post is opgeslagen als "Goedgekeurd" maar nog niet gepubliceerd op ${channelConfig[post.channel]?.label}.\n\nVerbind je social media accounts via Instellingen → Social Media om automatisch te publiceren.`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(t.common.error, t.postReview.publishError);
              }
            }
          },
        },
      ],
    );
  };

  const handlePublishAll = () => {
    const draftPosts = posts.filter((p) => p.status === 'draft' || p.status === 'approved');
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
              const result = await batchPublish.mutateAsync(draftPosts.map((p) => p.id));
              if ((result as any)?.anyQueued && !(result as any)?.anyPublished) {
                Alert.alert(
                  '⚠️ Opgeslagen als goedgekeurd',
                  'Posts zijn opgeslagen als "Goedgekeurd". Verbind je social media accounts via Instellingen → Social Media om automatisch te publiceren.'
                );
              } else {
                Alert.alert(t.postReview.publishAllSuccess);
              }
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
          const isVideo = mediaType === 'video';
          const isAudio = mediaType === 'audio';

          // For photos: try localMediaUri → branded_image_url → captureImageUrl
          // For video/audio: no image to show — render a dedicated media card instead
          const brandedOk = post.branded_image_url && !failedUrls.has(post.branded_image_url);
          const fallbackImageUrl = isVideo || isAudio
            ? null
            : (localMediaUri ||
               (brandedOk ? post.branded_image_url : null) ||
               captureImageUrl ||
               null);

          // Multi-image: build ordered list and pick the active one
          const postImages = isVideo || isAudio ? [] : getPostImages(post, fallbackImageUrl);
          const currentImgIdx = activeImageIndex[post.id] ?? 0;
          const safeIdx = Math.min(currentImgIdx, Math.max(0, postImages.length - 1));
          const imageUrl = postImages[safeIdx] ?? null;
          const imageFailed = imageUrl ? failedUrls.has(imageUrl) : false;

          return (
            <ScrollView
              key={post.id}
              style={{ width: SCREEN_WIDTH }}
              contentContainerStyle={styles.postContent}
            >
              {/* Media preview */}
              {isVideo ? (
                // Video capture — show a branded video card (no inline player needed)
                <View style={[styles.imagePlaceholder, { backgroundColor: '#0a0a0a' }]}>
                  <View style={{
                    width: 64, height: 64, borderRadius: 32,
                    backgroundColor: 'rgba(124,58,237,0.2)',
                    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
                  }}>
                    <Ionicons name="videocam" size={32} color={colors.primary} />
                  </View>
                  <Text style={[styles.imagePlaceholderText, { color: '#fff', fontWeight: fontWeight.semibold, fontSize: fontSize.md }]}>
                    Video opname
                  </Text>
                  <Text style={[styles.imagePlaceholderText, { color: 'rgba(255,255,255,0.5)' }]}>
                    Voeg een afbeelding toe als thumbnail
                  </Text>
                  <TouchableOpacity style={styles.addImageBtn} onPress={() => handleAddExtraImage(post)} disabled={uploadingImage}>
                    {uploadingImage
                      ? <ActivityIndicator size="small" color={colors.primary} />
                      : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="image-outline" size={15} color={colors.primary} />
                          <Text style={styles.addImageBtnText}>Thumbnail toevoegen</Text>
                        </View>}
                  </TouchableOpacity>
                </View>
              ) : isAudio ? (
                // Audio capture — show a branded audio card
                <View style={[styles.imagePlaceholder, { backgroundColor: '#0a0a0a' }]}>
                  <View style={{
                    width: 64, height: 64, borderRadius: 32,
                    backgroundColor: 'rgba(124,58,237,0.2)',
                    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
                  }}>
                    <Ionicons name="mic" size={32} color={colors.primary} />
                  </View>
                  <Text style={[styles.imagePlaceholderText, { color: '#fff', fontWeight: fontWeight.semibold, fontSize: fontSize.md }]}>
                    Audio opname
                  </Text>
                  <Text style={[styles.imagePlaceholderText, { color: 'rgba(255,255,255,0.5)' }]}>
                    Voeg optioneel een afbeelding toe
                  </Text>
                  <TouchableOpacity style={styles.addImageBtn} onPress={() => handleAddExtraImage(post)} disabled={uploadingImage}>
                    {uploadingImage
                      ? <ActivityIndicator size="small" color={colors.primary} />
                      : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="image-outline" size={15} color={colors.primary} />
                          <Text style={styles.addImageBtnText}>Afbeelding toevoegen</Text>
                        </View>}
                  </TouchableOpacity>
                </View>
              ) : imageUrl && !imageFailed ? (
                <>
                  <TouchableOpacity
                    style={styles.postImageWrapper}
                    activeOpacity={0.92}
                    onPress={() => setZoomImageUrl(imageUrl)}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.postImage}
                      resizeMode="cover"
                      onError={() => {
                        setFailedUrls((prev) => new Set([...prev, imageUrl]));
                        // If the captureImageUrl itself failed, invalidate to get a fresh signed URL
                        if (imageUrl === captureImageUrl) {
                          queryClient.invalidateQueries({ queryKey: ['capture-image-url', captureId, storagePath] });
                        }
                      }}
                    />
                    {/* Image count badge */}
                    {postImages.length > 1 && (
                      <View style={{
                        position: 'absolute', top: 8, left: 8,
                        backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10,
                        paddingHorizontal: 8, paddingVertical: 3,
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                      }}>
                        <Ionicons name="images-outline" size={11} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
                          {safeIdx + 1}/{postImages.length}
                        </Text>
                      </View>
                    )}
                    {/* ── Overlay rendering ── */}
                    {overlayConfig[post.id] && (
                      <>
                        {overlayConfig[post.id].text && overlayConfig[post.id].textPosition === 'top' && (
                          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.52)', paddingHorizontal: 10, paddingVertical: 7, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg }}>
                            <Text style={{ color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.semibold }} numberOfLines={2}>{overlayConfig[post.id].text}</Text>
                          </View>
                        )}
                        {overlayConfig[post.id].showLogo && (() => {
                          const lp = overlayConfig[post.id].logoPosition;
                          const lt = overlayConfig[post.id].logoType ?? 'brand';
                          const posStyle = lp === 'top-left' ? { top: 8, left: 8 } :
                                           lp === 'top-right' ? { top: 8, right: 8 } :
                                           lp === 'bottom-left' ? { bottom: 28, left: 8 } :
                                           { bottom: 28, right: 8 };
                          const logos: string[] = [];
                          if ((lt === 'brand' || lt === 'both') && brandLogoUrl) logos.push(brandLogoUrl);
                          if ((lt === 'event' || lt === 'both') && eventLogoUrl) logos.push(eventLogoUrl);
                          return (
                            <View style={{ position: 'absolute', ...posStyle, flexDirection: 'row', gap: 4 }}>
                              {logos.length > 0 ? logos.map((lurl, li) => (
                                <Image key={li} source={{ uri: lurl }} style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.4)' }} resizeMode="contain" />
                              )) : (
                                <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: 6 }}>
                                  <Ionicons name="business-outline" size={16} color="#fff" />
                                </View>
                              )}
                            </View>
                          );
                        })()}
                        {overlayConfig[post.id].text && overlayConfig[post.id].textPosition === 'bottom' && (
                          <View style={{ position: 'absolute', bottom: 22, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.52)', paddingHorizontal: 10, paddingVertical: 7 }}>
                            <Text style={{ color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.semibold }} numberOfLines={2}>{overlayConfig[post.id].text}</Text>
                          </View>
                        )}
                      </>
                    )}
                    <View style={styles.zoomHint}>
                      <Ionicons name="expand-outline" size={14} color="#fff" />
                    </View>
                  </TouchableOpacity>

                  {/* ── Thumbnail strip ────────────────────────────────── */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingHorizontal: 2 }}
                  >
                    {postImages.map((thumbUrl, i) => (
                      <TouchableOpacity
                        key={`${thumbUrl}-${i}`}
                        onPress={() => setActiveImageIndex((prev) => ({ ...prev, [post.id]: i }))}
                        activeOpacity={0.8}
                      >
                        <Image
                          source={{ uri: thumbUrl }}
                          style={{
                            width: 58, height: 58,
                            borderRadius: 8,
                            borderWidth: i === safeIdx ? 2.5 : 1,
                            borderColor: i === safeIdx ? (config?.color || colors.primary) : colors.border,
                            opacity: failedUrls.has(thumbUrl) ? 0.3 : 1,
                          }}
                          resizeMode="cover"
                        />
                        {i === safeIdx && (
                          <View style={{
                            position: 'absolute', bottom: 3, right: 3,
                            backgroundColor: config?.color || colors.primary,
                            borderRadius: 6, width: 12, height: 12,
                            justifyContent: 'center', alignItems: 'center',
                          }}>
                            <Ionicons name="checkmark" size={8} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                    {/* Add more images button */}
                    <TouchableOpacity
                      onPress={() => handleAddExtraImage(post)}
                      disabled={uploadingImage}
                      style={{
                        width: 58, height: 58, borderRadius: 8,
                        borderWidth: 1.5, borderColor: colors.primary + '60',
                        borderStyle: 'dashed',
                        justifyContent: 'center', alignItems: 'center',
                        backgroundColor: colors.primary + '08',
                      }}
                    >
                      {uploadingImage
                        ? <ActivityIndicator size="small" color={colors.primary} />
                        : <Ionicons name="add" size={22} color={colors.primary} />}
                    </TouchableOpacity>
                  </ScrollView>
                </>
              ) : imageIsLoading ? (
                <View style={styles.imagePlaceholder}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.imagePlaceholderText}>Afbeelding laden...</Text>
                </View>
              ) : (
                // No image yet — let user attach from the library
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color={colors.textTertiary} />
                  <Text style={styles.imagePlaceholderText}>Geen afbeelding beschikbaar</Text>
                  <TouchableOpacity
                    style={styles.addImageBtn}
                    onPress={() => handleAddExtraImage(post)}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="cloud-upload-outline" size={15} color={colors.primary} />
                        <Text style={styles.addImageBtnText}>Voeg afbeelding toe</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* ── Image toolbar: overlay editor + flip (photo only) ── */}
              {!mediaType || ['photo', 'image'].includes(mediaType) ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {/* Overlay editor */}
                  <TouchableOpacity
                    onPress={() => openOverlayEditor(post)}
                    style={{
                      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                      borderWidth: 1.5, borderColor: colors.primary + '70', borderRadius: borderRadius.md,
                      paddingVertical: 9, backgroundColor: colors.primary + '08',
                    }}
                  >
                    <Ionicons name="create-outline" size={15} color={colors.primary} />
                    <Text style={{ fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold }}>
                      {overlayConfig[post.id]?.text || overlayConfig[post.id]?.showLogo
                        ? 'Overlay aanpassen'
                        : 'Tekst / logo toevoegen'}
                    </Text>
                    {(overlayConfig[post.id]?.text || overlayConfig[post.id]?.showLogo) && (
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success }} />
                    )}
                  </TouchableOpacity>

                  {/* Flip image */}
                  {imageUrl ? (
                    <TouchableOpacity
                      onPress={() => handleFlipImage(post, imageUrl)}
                      disabled={flippingImage}
                      style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
                        borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md,
                        paddingVertical: 9, paddingHorizontal: 14,
                        backgroundColor: colors.surface,
                      }}
                    >
                      {flippingImage
                        ? <ActivityIndicator size="small" color={colors.primary} />
                        : <>
                            <Ionicons name="swap-horizontal-outline" size={15} color={colors.textSecondary} />
                            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium }}>Spiegelen</Text>
                          </>}
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

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

              {/* ── Language select ─────────────────────────────────── */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Ionicons name="globe-outline" size={14} color={colors.textTertiary} />
                {LANG_OPTIONS.map((lang) => {
                  const isActive = (postLang[post.id] || 'nl') === lang.code;
                  const isLoading = translating === post.id && isActive;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => handleSelectLang(post, lang.code)}
                      disabled={translating === post.id}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: isActive ? config?.color || colors.primary : colors.border,
                        backgroundColor: isActive ? (config?.color || colors.primary) + '18' : 'transparent',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      {isLoading
                        ? <ActivityIndicator size={10} color={config?.color || colors.primary} />
                        : <Text style={{ fontSize: 11 }}>{lang.flag}</Text>}
                      <Text style={{
                        fontSize: 11,
                        fontWeight: isActive ? fontWeight.bold : fontWeight.medium,
                        color: isActive ? config?.color || colors.primary : colors.textSecondary,
                      }}>{lang.label}</Text>
                    </TouchableOpacity>
                  );
                })}
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

              {/* ── Tagging toolbar ──────────────────────────────────── */}
              {(() => {
                const isLinkedIn = post.channel === 'linkedin';
                const isInstagram = post.channel === 'instagram';
                const tagItems = [
                  ...(isLinkedIn || isInstagram ? [
                    { icon: 'person-outline' as const, label: 'Persoon', insert: '@' },
                  ] : []),
                  ...(isLinkedIn ? [
                    { icon: 'business-outline' as const, label: 'Bedrijf', insert: '@' },
                  ] : []),
                  { icon: 'location-outline' as const, label: 'Locatie', insert: '📍 ' },
                  { icon: 'at-outline' as const, label: 'Hashtag', insert: '#' },
                ];
                return (
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 4, marginTop: 2 }}>
                    {tagItems.map(({ icon, label, insert }) => (
                      <TouchableOpacity
                        key={label}
                        onPress={() => {
                          const current = editingText[post.id] ?? post.text_content ?? '';
                          const needsSpace = current.length > 0 && !current.endsWith(' ') && !current.endsWith('\n');
                          handleTextChange(post.id, current + (needsSpace ? ' ' : '') + insert);
                        }}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 4,
                          paddingHorizontal: 10, paddingVertical: 5,
                          borderRadius: borderRadius.full,
                          backgroundColor: colors.surface,
                          borderWidth: 1,
                          borderColor: colors.border,
                        }}
                      >
                        <Ionicons name={icon} size={13} color={config?.color || colors.primary} />
                        <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: fontWeight.medium }}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })()}

              {/* Hashtags — strip any leading # already present before adding one */}
              {(post.hashtags?.length ?? 0) > 0 && (
                <Text style={styles.hashtags}>
                  {(post.hashtags || []).map((h) => `#${h.replace(/^#+/, '')}`).join(' ')}
                </Text>
              )}

              {/* ── 2-column utility buttons ────────────────────────── */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* Preview */}
                <TouchableOpacity
                  style={[styles.translateBtn, { flex: 1 }]}
                  onPress={() => setPreviewPost(post)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Ionicons name="eye-outline" size={14} color={colors.info} />
                    <Text style={styles.translateBtnText}>Preview</Text>
                  </View>
                </TouchableOpacity>

                {/* Regenerate */}
                <TouchableOpacity
                  style={[styles.translateBtn, { flex: 1, borderColor: colors.primary + '80', backgroundColor: colors.primary + '10' }]}
                  onPress={() => handleRegenerate(post)}
                  disabled={regenerating === post.id}
                >
                  {regenerating === post.id
                    ? <ActivityIndicator size="small" color={colors.primary} />
                    : <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <Ionicons name="refresh-outline" size={14} color={colors.primary} />
                        <Text style={[styles.translateBtnText, { color: colors.primary }]}>Regenereer</Text>
                      </View>}
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {/* Schedule */}
                <TouchableOpacity
                  style={[styles.translateBtn, { flex: 1, borderColor: colors.info + '80', backgroundColor: colors.info + '10' }]}
                  onPress={() => {
                    setSchedulingPost(post);
                    // Pre-fill today's date in DD-MM-YYYY format
                    const today = new Date();
                    setScheduleDate(
                      `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`
                    );
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Ionicons name="calendar-outline" size={14} color={colors.info} />
                    <Text style={[styles.translateBtnText, { color: colors.info }]}>
                      {post.status === 'scheduled' ? '📅 Ingepland' : 'Inplannen'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Audience */}
                <TouchableOpacity
                  style={[styles.audienceBtn, { flex: 1 }]}
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <Ionicons name="locate-outline" size={14} color={colors.success} />
                    <Text style={styles.audienceBtnText}>Doelgroep</Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* ── Publish + Delete ─────────────────────────────────── */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: config?.color || colors.primary }]}
                  onPress={() => handlePublish(post)}
                  disabled={post.status === 'published' || publishPost.isPending}
                >
                  {publishPost.isPending ? (
                    <ActivityIndicator color={colors.textOnPrimary} />
                  ) : (
                    <Text style={post.status === 'published' ? styles.actionBtnDisabledText : styles.actionBtnText}>
                      {post.status === 'published' ? t.status.published : `${t.postReview.publishOn} ${config?.label}`}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Delete post */}
                <TouchableOpacity
                  onPress={() => handleDeletePost(post)}
                  disabled={deletePost.isPending}
                  style={{
                    width: 44, height: 44, borderRadius: borderRadius.md,
                    borderWidth: 1.5, borderColor: colors.error + '60',
                    justifyContent: 'center', alignItems: 'center',
                    backgroundColor: colors.error + '08',
                  }}
                >
                  {deletePost.isPending
                    ? <ActivityIndicator size="small" color={colors.error} />
                    : <Ionicons name="trash-outline" size={18} color={colors.error} />}
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

      {/* ── Schedule modal ────────────────────────────────────────────────── */}
      <Modal
        visible={!!schedulingPost}
        transparent
        animationType="slide"
        onRequestClose={() => setSchedulingPost(null)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setSchedulingPost(null)}
        >
          <View style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            paddingBottom: Platform.OS === 'ios' ? 40 : 24,
            gap: 16,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text }}>
                📅 Post inplannen
              </Text>
              <TouchableOpacity onPress={() => setSchedulingPost(null)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>
              {schedulingPost ? `${channelConfig[schedulingPost.channel]?.label} post` : ''}
            </Text>

            {/* Date — EU format DD-MM-YYYY */}
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: 6 }}>
                Datum (DD-MM-JJJJ)
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: fontSize.md,
                  color: colors.text,
                  letterSpacing: 1,
                }}
                value={scheduleDate}
                onChangeText={setScheduleDate}
                placeholder="15-03-2026"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
            </View>

            {/* Time */}
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: 6 }}>
                Tijd (UU:MM)
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: fontSize.md,
                  color: colors.text,
                  letterSpacing: 1,
                }}
                value={scheduleTime}
                onChangeText={setScheduleTime}
                placeholder="09:00"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>

            {/* Quick time presets */}
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {['08:00', '09:00', '12:00', '17:00', '19:00', '21:00'].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setScheduleTime(t)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: scheduleTime === t ? colors.primary : colors.border,
                    backgroundColor: scheduleTime === t ? colors.primary + '15' : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: fontSize.xs, color: scheduleTime === t ? colors.primary : colors.textSecondary, fontWeight: fontWeight.medium }}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                borderRadius: borderRadius.md,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: scheduling ? 0.7 : 1,
              }}
              onPress={handleScheduleConfirm}
              disabled={scheduling}
            >
              {scheduling
                ? <ActivityIndicator color={colors.textOnPrimary} />
                : <Text style={{ color: colors.textOnPrimary, fontWeight: fontWeight.bold, fontSize: fontSize.md }}>
                    Bevestig inplannen
                  </Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Per-channel preview modal ─────────────────────────────────────── */}
      <Modal
        visible={!!previewPost}
        transparent
        animationType="slide"
        onRequestClose={() => setPreviewPost(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: Platform.OS === 'ios' ? 54 : 24, right: 16, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 8 }}
            onPress={() => setPreviewPost(null)}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>

          {previewPost && (() => {
            const p = previewPost;
            const cfg = channelConfig[p.channel];
            const text = editingText[p.id] ?? p.text_content;
            // Guard against null hashtags (DB may return null for older rows)
            const tags = (p.hashtags || []).map((h: string) => `#${h.replace(/^#+/, '')}`).join(' ');

            // Build an ordered candidate list for the preview image.
            // Priority: local file → branded_image_url (processed output, most reliable)
            //           → signed captureImageUrl (storage fallback)
            // For video/audio captures the signed URL points to a media file, not an image —
            // we guard against that below when choosing what to render.
            const isPreviewVideo = mediaType === 'video';
            const isPreviewAudio = mediaType === 'audio';
            const extraImages: string[] = Array.isArray((p.engagement as any)?.extra_images)
              ? (p.engagement as any).extra_images.filter(Boolean)
              : [];
            // Only collect image candidates when the capture is a photo (not video/audio)
            const imageCandidates: string[] = isPreviewVideo || isPreviewAudio
              ? []
              : [
                  localMediaUri,
                  p.branded_image_url,
                  captureImageUrl,
                  ...extraImages,
                ].filter((u): u is string => !!u);
            // Deduplicate while preserving order
            const previewImages: string[] = [...new Set(imageCandidates)];

            const previewIdx = activeImageIndex[p.id] ?? 0;
            const safePreviewIdx = Math.min(previewIdx, Math.max(0, previewImages.length - 1));
            // Pick the first non-failed URL at or after the active index
            const imgUrl: string | null =
              previewImages.slice(safePreviewIdx).find(u => !previewFailedUrls.has(u))
              ?? previewImages.find(u => !previewFailedUrls.has(u))
              ?? null;
            // Image is renderable if we have a URL that hasn't already failed
            const previewImgOk = !!imgUrl && !previewFailedUrls.has(imgUrl);

            // Overlay elements to layer on top of the image in mock cards
            const ov = overlayConfig[p.id];
            const PreviewOverlay = () => {
              if (!ov) return null;
              const lp = ov.logoPosition ?? 'bottom-right';
              const lt = ov.logoType ?? 'brand';
              const logos: string[] = [];
              if ((lt === 'brand' || lt === 'both') && brandLogoUrl) logos.push(brandLogoUrl);
              if ((lt === 'event' || lt === 'both') && eventLogoUrl) logos.push(eventLogoUrl);
              const posStyle = lp === 'top-left'    ? { top: 8, left: 8 }    :
                               lp === 'top-right'   ? { top: 8, right: 8 }   :
                               lp === 'bottom-left' ? { bottom: 8, left: 8 } :
                                                      { bottom: 8, right: 8 };
              return (
                <>
                  {/* Top text */}
                  {ov.text && ov.textPosition === 'top' && (
                    <View style={{
                      position: 'absolute', top: 0, left: 0, right: 0,
                      backgroundColor: 'rgba(0,0,0,0.55)',
                      paddingHorizontal: 10, paddingVertical: 6,
                    }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }} numberOfLines={2}>
                        {ov.text}
                      </Text>
                    </View>
                  )}
                  {/* Logo */}
                  {ov.showLogo && (
                    <View style={{ position: 'absolute', flexDirection: 'row', gap: 4, ...posStyle }}>
                      {logos.length > 0 ? logos.map((lu, li) => (
                        <Image key={li} source={{ uri: lu }}
                          style={{ width: 28, height: 28, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.35)' }}
                          resizeMode="contain"
                        />
                      )) : (
                        <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 7, padding: 5 }}>
                          <Ionicons name="business-outline" size={14} color="#fff" />
                        </View>
                      )}
                    </View>
                  )}
                  {/* Bottom text */}
                  {ov.text && ov.textPosition === 'bottom' && (
                    <View style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      backgroundColor: 'rgba(0,0,0,0.55)',
                      paddingHorizontal: 10, paddingVertical: 6,
                    }}>
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }} numberOfLines={2}>
                        {ov.text}
                      </Text>
                    </View>
                  )}
                </>
              );
            };

            // Shared image renderer with overlay baked in
            const PreviewImage = ({ height, borderRadius: br }: { height: number; borderRadius?: number }) => (
              <View style={{ width: '100%', height, borderRadius: br ?? 0, overflow: 'hidden' }}>
                {previewImgOk && imgUrl ? (
                  <Image
                    source={{ uri: imgUrl }}
                    style={{ width: '100%', height }}
                    resizeMode="cover"
                    onLoad={() => setPreviewImgLoaded(true)}
                    onError={() => { if (imgUrl) setPreviewFailedUrls(prev => new Set([...prev, imgUrl])); }}
                  />
                ) : (
                  <View style={{ width: '100%', height, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="image-outline" size={44} color="#555" />
                    <Text style={{ fontSize: 12, color: '#555' }}>Geen afbeelding</Text>
                  </View>
                )}
                <PreviewOverlay />
              </View>
            );

            const MockCard = () => {
              if (p.channel === 'linkedin') {
                return (
                  <View style={{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', margin: 16, marginTop: 80 }}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', padding: 12, gap: 10, alignItems: 'flex-start' }}>
                      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#0077B5', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>C</Text>
                      </View>
                      <View>
                        <Text style={{ fontWeight: 'bold', fontSize: 14, color: '#000' }}>Company Page</Text>
                        <Text style={{ fontSize: 11, color: '#666' }}>1,234 volgers • Nu</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                          <Ionicons name="earth-outline" size={11} color="#666" />
                          <Text style={{ fontSize: 10, color: '#666' }}>Zichtbaar voor iedereen</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={{ paddingHorizontal: 12, fontSize: 13, color: '#000', lineHeight: 20 }}>{text}</Text>
                    {tags ? <Text style={{ paddingHorizontal: 12, paddingTop: 4, fontSize: 12, color: '#0077B5' }}>{tags}</Text> : null}
                    {imgUrl ? <View style={{ marginTop: 8 }}><PreviewImage height={220} /></View> : null}
                    <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#e0e0e0', marginTop: 8, gap: 16 }}>
                      {['👍 Vind ik leuk', '💬 Reageren', '↗️ Delen'].map((a) => (
                        <Text key={a} style={{ fontSize: 12, color: '#666' }}>{a}</Text>
                      ))}
                    </View>
                  </View>
                );
              }

              if (p.channel === 'instagram') {
                return (
                  <View style={{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', margin: 16, marginTop: 80 }}>
                    <View style={{ flexDirection: 'row', padding: 10, alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E4405F', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#f09433' }}>
                          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>C</Text>
                        </View>
                        <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#000' }}>company.page</Text>
                      </View>
                      <Ionicons name="ellipsis-horizontal" size={20} color="#000" />
                    </View>
                    <PreviewImage height={SCREEN_WIDTH - 32} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
                      <View style={{ flexDirection: 'row', gap: 14 }}>
                        <Ionicons name="heart-outline" size={22} color="#000" />
                        <Ionicons name="chatbubble-outline" size={22} color="#000" />
                        <Ionicons name="paper-plane-outline" size={22} color="#000" />
                      </View>
                      <Ionicons name="bookmark-outline" size={22} color="#000" />
                    </View>
                    <Text style={{ paddingHorizontal: 10, fontSize: 12, fontWeight: 'bold', color: '#000' }}>1.234 vind-ik-leuks</Text>
                    <Text style={{ paddingHorizontal: 10, paddingTop: 2, fontSize: 12, color: '#000' }}><Text style={{ fontWeight: 'bold' }}>company.page</Text> {text}</Text>
                    {tags ? <Text style={{ paddingHorizontal: 10, paddingTop: 2, paddingBottom: 8, fontSize: 11, color: '#0095f6' }}>{tags}</Text> : null}
                  </View>
                );
              }

              if (p.channel === 'x') {
                return (
                  <View style={{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', margin: 16, marginTop: 80, padding: 14 }}>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>C</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <View>
                            <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#000' }}>Company</Text>
                            <Text style={{ fontSize: 12, color: '#666' }}>@companypage · Nu</Text>
                          </View>
                          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>𝕏</Text>
                        </View>
                        <Text style={{ fontSize: 13, color: '#000', marginTop: 6, lineHeight: 18 }}>{text} {tags}</Text>
                        {imgUrl ? <View style={{ marginTop: 8 }}><PreviewImage height={180} borderRadius={12} /></View> : null}
                        <View style={{ flexDirection: 'row', marginTop: 10, gap: 20 }}>
                          {['💬 0', '🔁 0', '♡ 0', '📤'].map((a) => (
                            <Text key={a} style={{ fontSize: 12, color: '#666' }}>{a}</Text>
                          ))}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              }

              // Facebook
              return (
                <View style={{ backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', margin: 16, marginTop: 80 }}>
                  <View style={{ flexDirection: 'row', padding: 12, gap: 10, alignItems: 'flex-start' }}>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1877F2', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>C</Text>
                    </View>
                    <View>
                      <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#000' }}>Company Page</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ fontSize: 11, color: '#666' }}>Nu ·</Text>
                        <Ionicons name="earth-outline" size={11} color="#666" />
                      </View>
                    </View>
                  </View>
                  <Text style={{ paddingHorizontal: 12, fontSize: 13, color: '#000', lineHeight: 20 }}>{text}</Text>
                  {tags ? <Text style={{ paddingHorizontal: 12, paddingTop: 4, fontSize: 12, color: '#1877F2' }}>{tags}</Text> : null}
                  {imgUrl
                    ? previewImgOk
                      ? <Image
                          source={{ uri: imgUrl }}
                          style={{ width: '100%', height: 220, marginTop: 8 }}
                          resizeMode="cover"
                          onLoad={() => setPreviewImgLoaded(true)}
                          onError={() => { if (imgUrl) setPreviewFailedUrls(prev => new Set([...prev, imgUrl])); }}
                        />
                      : <View style={{ width: '100%', height: 220, marginTop: 8, backgroundColor: '#e8e8e8', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="image-outline" size={40} color="#aaa" />
                          <Text style={{ fontSize: 11, color: '#aaa' }}>Afbeelding niet beschikbaar</Text>
                        </View>
                    : null}
                  <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#e0e0e0', marginTop: 8, gap: 16 }}>
                    {['👍 Vind ik leuk', '💬 Reageren', '↗️ Delen'].map((a) => (
                      <Text key={a} style={{ fontSize: 12, color: '#666' }}>{a}</Text>
                    ))}
                  </View>
                </View>
              );
            };

            // Show a spinner while the signed URL is still being fetched AND we have no image
            // to display yet. Skip spinner entirely for video/audio (no image expected).
            if (!isPreviewVideo && !isPreviewAudio && imageIsLoading && previewImages.length === 0) {
              return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Afbeelding laden...</Text>
                </View>
              );
            }

            return (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
                {/* Channel header */}
                <View style={{ alignItems: 'center', marginTop: Platform.OS === 'ios' ? 100 : 70 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: cfg.color, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 }}>
                    <Ionicons name={cfg.icon as any} size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.sm }}>{cfg.label} Preview</Text>
                  </View>
                </View>
                <MockCard />
              </ScrollView>
            );
          })()}
        </View>
      </Modal>

      {/* ── Image Overlay Editor Modal ──────────────────────────────────────── */}
      <Modal
        visible={!!editingOverlay}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingOverlay(null)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setEditingOverlay(null)}
        >
          {/* Wrap sheet in TouchableOpacity so taps on labels/text are absorbed
               and do NOT bubble up to the backdrop (which would close the modal) */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {/* absorb touch — keep sheet open */}}
            style={{
              position: 'absolute',
              bottom: 0, left: 0, right: 0,
              backgroundColor: colors.surface,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: Platform.OS === 'ios' ? 44 : 24,
              gap: 16,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text }}>
                Tekst / Logo overlay
              </Text>
              <TouchableOpacity onPress={() => setEditingOverlay(null)}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Overlay text input */}
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: 6 }}>
                Overlay tekst (optioneel)
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  fontSize: fontSize.md,
                  color: colors.text,
                }}
                value={overlayDraft.text}
                onChangeText={(v) => setOverlayDraft((d) => ({ ...d, text: v }))}
                placeholder="Bijv. eventnaam, quote, CTA..."
                placeholderTextColor={colors.textTertiary}
                maxLength={80}
              />
            </View>

            {/* Text position */}
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: 8 }}>
                Positie tekst
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {(['top', 'bottom'] as const).map((pos) => (
                  <TouchableOpacity
                    key={pos}
                    onPress={() => setOverlayDraft((d) => ({ ...d, textPosition: pos }))}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: borderRadius.md,
                      borderWidth: 1.5,
                      borderColor: overlayDraft.textPosition === pos ? colors.primary : colors.border,
                      backgroundColor: overlayDraft.textPosition === pos ? colors.primary + '15' : 'transparent',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name={pos === 'top' ? 'arrow-up-outline' : 'arrow-down-outline'}
                      size={16}
                      color={overlayDraft.textPosition === pos ? colors.primary : colors.textSecondary}
                    />
                    <Text style={{ fontSize: fontSize.xs, marginTop: 3, color: overlayDraft.textPosition === pos ? colors.primary : colors.textSecondary, fontWeight: fontWeight.medium }}>
                      {pos === 'top' ? 'Bovenaan' : 'Onderaan'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Logo type selector */}
            <View>
              <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: 8 }}>
                Logo op afbeelding
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {([
                  { key: 'none', label: 'Geen', icon: 'close-circle-outline' as const },
                  { key: 'brand', label: 'Brand logo', icon: 'briefcase-outline' as const },
                  { key: 'event', label: 'Event foto', icon: 'calendar-outline' as const },
                  { key: 'both', label: 'Beide', icon: 'layers-outline' as const },
                ] as const).map((opt) => {
                  const active = overlayDraft.showLogo ? overlayDraft.logoType === opt.key : opt.key === 'none';
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      onPress={() => setOverlayDraft((d) => ({ ...d, showLogo: opt.key !== 'none', logoType: opt.key === 'none' ? d.logoType : opt.key }))}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 5,
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                        borderWidth: 1.5,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + '15' : 'transparent',
                      }}
                    >
                      <Ionicons name={opt.icon} size={14} color={active ? colors.primary : colors.textSecondary} />
                      <Text style={{ fontSize: fontSize.xs, color: active ? colors.primary : colors.textSecondary, fontWeight: active ? fontWeight.semibold : fontWeight.normal }}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {overlayDraft.showLogo && !brandLogoUrl && !eventLogoUrl && (
                <Text style={{ fontSize: 11, color: colors.warning, marginTop: 6 }}>
                  ⚠️ Geen logo gevonden. Voeg een logo toe aan je Brand Kit of Event.
                </Text>
              )}
            </View>

            {/* Logo corner picker (only when logo is enabled) */}
            {overlayDraft.showLogo && (
            <View>
              <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: 8 }}>Positie logo</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => {
                  const labels: Record<string, string> = {
                    'top-left': 'Links boven', 'top-right': 'Rechts boven',
                    'bottom-left': 'Links onder', 'bottom-right': 'Rechts onder',
                  };
                  const icons: Record<string, any> = {
                    'top-left': 'arrow-back-outline', 'top-right': 'arrow-forward-outline',
                    'bottom-left': 'return-down-back-outline', 'bottom-right': 'return-down-forward-outline',
                  };
                  const active = overlayDraft.logoPosition === corner;
                  return (
                    <TouchableOpacity
                      key={corner}
                      onPress={() => setOverlayDraft((d) => ({ ...d, logoPosition: corner }))}
                      style={{
                        width: '47%', paddingVertical: 9, borderRadius: borderRadius.md,
                        borderWidth: 1.5,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + '15' : 'transparent',
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}
                    >
                      <Ionicons name={icons[corner]} size={14} color={active ? colors.primary : colors.textSecondary} />
                      <Text style={{ fontSize: fontSize.xs, color: active ? colors.primary : colors.textSecondary, fontWeight: active ? fontWeight.semibold : fontWeight.normal }}>
                        {labels[corner]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            )}

            {/* Preview strip */}
            {(overlayDraft.text || overlayDraft.showLogo) && (
              <View style={{ borderRadius: borderRadius.md, overflow: 'hidden', height: 70, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
                {overlayDraft.text && overlayDraft.textPosition === 'top' && (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{overlayDraft.text}</Text>
                  </View>
                )}
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>Voorbeeld overlay</Text>
                {overlayDraft.showLogo && (
                  <View style={{
                    position: 'absolute',
                    ...(overlayDraft.logoPosition === 'top-left' ? { top: 6, left: 8 } :
                        overlayDraft.logoPosition === 'top-right' ? { top: 6, right: 8 } :
                        overlayDraft.logoPosition === 'bottom-left' ? { bottom: 6, left: 8 } :
                        { bottom: 6, right: 8 }),
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: 6,
                    padding: 4,
                  }}>
                    <Ionicons name="business-outline" size={14} color="#fff" />
                  </View>
                )}
                {overlayDraft.text && overlayDraft.textPosition === 'bottom' && (
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{overlayDraft.text}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {editingOverlay && overlayConfig[editingOverlay] && (
                <TouchableOpacity
                  onPress={() => editingOverlay && clearOverlay(editingOverlay)}
                  style={{
                    flex: 1,
                    paddingVertical: 13,
                    borderRadius: borderRadius.md,
                    borderWidth: 1.5,
                    borderColor: colors.error,
                    backgroundColor: (colors as any).error + '10',
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: colors.error, fontWeight: fontWeight.semibold, fontSize: fontSize.sm }}>
                    Overlay wissen
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => editingOverlay && saveOverlay(editingOverlay)}
                style={{
                  flex: 2,
                  paddingVertical: 13,
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.textOnPrimary, fontWeight: fontWeight.bold, fontSize: fontSize.md }}>
                  Overlay toepassen
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Full-screen zoom modal — pinch to zoom, tap X to close */}
      <Modal
        visible={!!zoomImageUrl}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setZoomImageUrl(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.96)' }}>
          <StatusBar hidden />
          {/* Close button */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: Platform.OS === 'ios' ? 54 : 24,
              right: 18,
              zIndex: 20,
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 20,
              padding: 8,
            }}
            onPress={() => setZoomImageUrl(null)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Pinch-zoom via native ScrollView maximumZoomScale */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            maximumZoomScale={5}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            centerContent
            bouncesZoom
          >
            <Image
              source={{ uri: zoomImageUrl ?? undefined }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH, borderRadius: 0 }}
              resizeMode="contain"
            />
          </ScrollView>

          {/* Zoom hint label */}
          <Text style={{
            position: 'absolute',
            bottom: 30,
            alignSelf: 'center',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 12,
          }}>
            Knijp om in te zoomen · Tik × om te sluiten
          </Text>
        </View>
      </Modal>
    </View>
  );
}
