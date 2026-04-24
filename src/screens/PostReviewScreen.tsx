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
  Linking,
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
import AIConsentModal from '../components/AIConsentModal';
import { useAIConsent } from '../hooks/useAIConsent';
import ViewShot, { captureRef } from 'react-native-view-shot';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'PostReview'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const channelConfig: Record<Channel, { label: string; color: string; icon: string }> = {
  linkedin: { label: 'LinkedIn', color: '#0077B5', icon: 'logo-linkedin' },
  instagram: { label: 'Instagram', color: '#E4405F', icon: 'logo-instagram' },
  x: { label: 'X', color: '#000000', icon: 'logo-twitter' },
  facebook: { label: 'Facebook', color: '#1877F2', icon: 'logo-facebook' },
  tiktok: { label: 'TikTok', color: '#000000', icon: 'logo-tiktok' },
};

export default function PostReviewScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { captureId, eventId, localMediaUri, extraImageUrls } = route.params ?? {} as any;
  const safeEventId = eventId ?? '';
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { hasConsent, showModal: showConsentModal, requestConsent, onAccept: onConsentAccept, onDecline: onConsentDecline } = useAIConsent();

  const { data: posts = [], isLoading } = useCapturePosts(captureId);
  const updatePost = useUpdatePost();
  const publishPost = usePublishPost();
  const batchPublish = useBatchPublish();
  const deletePost = useDeletePost();
  const [flippingImage, setFlippingImage] = useState(false);
  const [rotatingImage, setRotatingImage] = useState(false);

  // ViewShot refs for baking overlay into image before publishing
  const viewShotRefs = useRef<Record<string, ViewShot | null>>({});

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

  const { data: event } = useEvent(safeEventId || undefined);

  const [activeIndex, setActiveIndex] = useState(0);
  const [editingText, setEditingText] = useState<Record<string, string>>({});
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // ── Text style: luxury icons vs plain text ───────────────────────────────
  const [textStyle, setTextStyle] = useState<Record<string, 'luxury' | 'plain'>>({});
  const getTextStyle = (postId: string) => textStyle[postId] ?? 'luxury';

  // Map of luxury icon replacements for common marketing keywords
  const LUXURY_ICONS: Record<string, string> = {
    'event': '🎯', 'marketing': '📣', 'strategy': '🧠', 'growth': '📈',
    'team': '👥', 'innovation': '💡', 'success': '🏆', 'creative': '🎨',
    'connect': '🤝', 'launch': '🚀', 'analytics': '📊', 'brand': '✨',
    'social': '📱', 'content': '📝', 'campaign': '🎪', 'meeting': '💬',
    'workshop': '🔧', 'networking': '🌐', 'design': '🖌️', 'insight': '🔍',
    'goal': '🎯', 'deadline': '⏰', 'milestone': '🏁', 'budget': '💰',
    'presentation': '🎤', 'feedback': '💭', 'collaboration': '🤝', 'training': '📚',
  };

  const addLuxuryIcons = (text: string): string => {
    let result = text;
    // Add bullet-point style icons at line starts
    result = result.replace(/^[-•]\s*/gm, '✦ ');
    // Add sparkle to hashtags
    result = result.replace(/#(\w+)/g, '✨ #$1');
    return result;
  };

  const removeLuxuryIcons = (text: string): string => {
    // Remove common luxury emoji prefixes
    let result = text;
    result = result.replace(/[✦✨🎯📣🧠📈👥💡🏆🎨🤝🚀📊📱📝🎪💬🔧🌐🖌️🔍⏰🏁💰🎤💭📚]\s*/g, '');
    // Restore bullet points
    result = result.replace(/^\s*(?=#)/gm, '');
    return result;
  };

  const toggleTextStyle = (post: EventPost) => {
    const currentStyle = getTextStyle(post.id);
    const newStyle = currentStyle === 'luxury' ? 'plain' : 'luxury';
    setTextStyle((prev) => ({ ...prev, [post.id]: newStyle }));

    const currentText = editingText[post.id] ?? post.text_content ?? '';
    const newText = newStyle === 'luxury' ? addLuxuryIcons(currentText) : removeLuxuryIcons(currentText);
    handleTextChange(post.id, newText);
  };

  // ── Language select ───────────────────────────────────────────────────────
  const [postLang, setPostLang] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState<string | null>(null); // postId

  // ── First comment draft ───────────────────────────────────────────────────
  // Keyed by post.id; seeded from post.first_comment on load
  const [firstCommentDraft, setFirstCommentDraft] = useState<Record<string, string>>({});
  const [firstCommentExpanded, setFirstCommentExpanded] = useState<Record<string, boolean>>({});

  // Max character limits per platform for the first comment
  const FIRST_COMMENT_MAX: Record<string, number> = {
    linkedin: 1250,
    instagram: 2200,
    facebook: 8000,
  };

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
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);
  useEffect(() => {
    // Reset image state every time a new post is opened for preview
    setPreviewFailedUrls(new Set());
    setPreviewImgLoaded(false);
    setPreviewSlideIdx(0);
  }, [previewPost?.id]);

  // ── Brand kit logo fetch ─────────────────────────────────────────────────
  // Try event's brand_kit_id first; if no event, load the user's default brand kit
  const { data: brandKit } = useQuery({
    queryKey: ['brand-kit', (event as any)?.brand_kit_id ?? 'default'],
    queryFn: async () => {
      const bkId = (event as any)?.brand_kit_id;
      if (bkId) {
        const { data } = await supabase
          .from('brand_kits')
          .select('logo_url, name')
          .eq('id', bkId)
          .single();
        return data ?? null;
      }
      // No event — load user's default brand kit
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('brand_kits')
        .select('logo_url, name')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();
      return data ?? null;
    },
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

  // ── Instagram format picker (feed / story / reel) ────────────────────
  const [igFormatDraft, setIgFormatDraft] = useState<Record<string, 'feed' | 'story' | 'reel'>>({});

  // Seed igFormatDraft from DB once posts load
  useEffect(() => {
    if (!posts.length) return;
    setIgFormatDraft((prev) => {
      const next = { ...prev };
      for (const post of posts) {
        if (next[post.id] === undefined) {
          next[post.id] = ((post as any).ig_format as 'feed' | 'story' | 'reel') ?? 'feed';
        }
      }
      return next;
    });
  }, [posts]);

  const handleIgFormatChange = async (post: EventPost, value: 'feed' | 'story' | 'reel') => {
    setIgFormatDraft((prev) => ({ ...prev, [post.id]: value }));
    try {
      await updatePost.mutateAsync({ id: post.id, ...(({ ig_format: value } as any)) });
    } catch {
      // non-critical — revert optimistic update
      setIgFormatDraft((prev) => ({ ...prev, [post.id]: ((post as any).ig_format as 'feed' | 'story' | 'reel') ?? 'feed' }));
    }
  };

  // ── Account selection for publishing ─────────────────────────────────
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [pendingPublishPost, setPendingPublishPost] = useState<EventPost | null>(null);
  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);
  // Track which account was used to publish each post (postId → account info)
  const [publishedAccounts, setPublishedAccounts] = useState<Record<string, { name: string; type: string; imageUrl?: string }>>({});
  // Inline account connect modal (shown when no accounts exist for a channel)
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectPlatform, setConnectPlatform] = useState('');
  const [connectAccountName, setConnectAccountName] = useState('');
  const [connectAccountUrl, setConnectAccountUrl] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [pendingPublishAll, setPendingPublishAll] = useState(false);

  const fetchAccountsForChannel = async (channel: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      // Filter out account types that cannot actually publish via API:
      // - Instagram 'personal' — Meta Graph API requires Business/Creator accounts
      // - any 'manual' — no OAuth token, can't API-publish
      const isPublishable = (acc: any) => {
        if (acc.account_type === 'manual') return false;
        if (channel === 'instagram' && acc.account_type === 'personal') return false;
        return true;
      };
      // Sort: pages/business first, then personal. Used as default preference
      // when the user has multiple accounts connected for a channel.
      const accountPriority = (t: string | null) => {
        if (t === 'page' || t === 'business') return 0;
        if (t === 'personal') return 1;
        return 2;
      };
      const sortByPriority = (a: any, b: any) => accountPriority(a.account_type) - accountPriority(b.account_type);
      // First try with status = 'active'
      const { data: activeData } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', channel)
        .eq('status', 'active');
      const activeFiltered = (activeData || []).filter(isPublishable).sort(sortByPriority);
      if (activeFiltered.length > 0) return activeFiltered;
      // Fallback: no status filter (catches 'connected' and other values)
      const { data: fallbackData } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', channel);
      return (fallbackData || []).filter(isPublishable).sort(sortByPriority);
    } catch { return []; }
  };

  // Seed overlayConfig and firstCommentDraft from DB once posts load
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
    setFirstCommentDraft((prev) => {
      const next = { ...prev };
      for (const post of posts) {
        // Only seed if we don't already have an in-progress draft for this post
        if (!(post.id in next)) {
          next[post.id] = (post as any).first_comment ?? '';
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
  const getPostImages = (post: EventPost, fallbackUrl: string | null | undefined): string[] => {
    const images: string[] = [];
    const primary = fallbackUrl || '';
    if (primary) images.push(primary);
    // Use extra_images from DB, or from navigation params as fallback
    const extra = post.engagement?.extra_images;
    const extraSource = Array.isArray(extra) && extra.length > 0 ? extra : extraImageUrls;
    if (Array.isArray(extraSource)) {
      extraSource.forEach((url: string) => { if (url && !images.includes(url)) images.push(url); });
    }
    return images;
  };

  // Refresh signed URLs for extra images that may have expired
  const [refreshedUrls, setRefreshedUrls] = useState<Record<string, string>>({});

  const refreshSignedUrl = async (originalUrl: string): Promise<string> => {
    if (refreshedUrls[originalUrl]) return refreshedUrls[originalUrl];
    try {
      // Extract storage path from Supabase URL
      const pathMatch = originalUrl.match(/\/media\/(.+?)(\?|$)/);
      if (pathMatch) {
        const { data } = await supabase.storage.from('media').createSignedUrl(pathMatch[1], 3600);
        if (data?.signedUrl) {
          setRefreshedUrls(prev => ({ ...prev, [originalUrl]: data.signedUrl }));
          return data.signedUrl;
        }
      }
    } catch {}
    return originalUrl;
  };

  // Proactively refresh signed URLs for all extra images when posts load
  const refreshedExtraRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!posts.length) return;
    const allExtraUrls: string[] = [];
    for (const post of posts) {
      const extras = post.engagement?.extra_images;
      if (Array.isArray(extras)) {
        for (const url of extras) {
          if (url && !refreshedExtraRef.current.has(url) && !refreshedUrls[url]) {
            allExtraUrls.push(url);
          }
        }
      }
    }
    if (allExtraUrls.length === 0) return;
    // Mark as in-flight to avoid duplicate refreshes
    for (const url of allExtraUrls) refreshedExtraRef.current.add(url);

    // Batch-sign all extra image paths at once
    const storagePaths: { url: string; path: string }[] = [];
    for (const url of allExtraUrls) {
      const pathMatch = url.match(/\/media\/(.+?)(\?|$)/);
      if (pathMatch) storagePaths.push({ url, path: pathMatch[1] });
    }
    if (storagePaths.length === 0) return;

    (async () => {
      try {
        const { data } = await supabase.storage.from('media').createSignedUrls(
          storagePaths.map(p => p.path),
          3600,
        );
        if (data && data.length > 0) {
          const newMap: Record<string, string> = {};
          data.forEach((item, idx) => {
            if (item.signedUrl) {
              newMap[storagePaths[idx].url] = item.signedUrl;
            }
          });
          if (Object.keys(newMap).length > 0) {
            setRefreshedUrls(prev => ({ ...prev, ...newMap }));
            // Clear any of these URLs from failedUrls so images retry
            setFailedUrls(prev => {
              const next = new Set(prev);
              let changed = false;
              for (const origUrl of Object.keys(newMap)) {
                if (next.has(origUrl)) { next.delete(origUrl); changed = true; }
              }
              return changed ? next : prev;
            });
          }
        }
      } catch {
        // Signing failed — thumbnails will attempt individual refresh on error
      }
    })();
  }, [posts]); // eslint-disable-line react-hooks/exhaustive-deps

  // Upload one or more extra images and append them to engagement.extra_images
  const handleAddExtraImage = async (post: EventPost) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Geen toegang', 'Geef toegang tot je fotobibliotheek om afbeeldingen toe te voegen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
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
        const { url } = await uploadMedia(asset.uri, safeEventId, 'photo');
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
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets.length) return;

    setUploadingImage(true);
    try {
      const { url, path } = await uploadMedia(result.assets[0].uri, safeEventId, 'photo');

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
      const { url, path } = await uploadMedia(result.uri, safeEventId, 'photo');
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

  // ── Rotate image 90° ─────────────────────────────────────────────────────
  const handleRotateImage = async (post: EventPost, imageUrl: string) => {
    if (rotatingImage) return;
    setRotatingImage(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        imageUrl,
        [{ rotate: 90 }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG },
      );
      const { url, path } = await uploadMedia(result.uri, safeEventId, 'photo');
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
      Alert.alert('Fout', 'Afbeelding draaien mislukt.');
    } finally {
      setRotatingImage(false);
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
    if (!hasConsent) {
      requestConsent(() => { handleSelectLang(post, lang) });
      return;
    }
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
    if (!hasConsent) {
      requestConsent(() => { handleRegenerate(post) });
      return;
    }
    setRegenerating(post.id);
    try {
      const result = await aiService.generateEventPost({
        platform: post.channel as any,
        event_context: {
          name: event?.name || 'Content',
          description: event?.description || '',
          hashtags: event?.hashtags || [],
          location: event?.location || '',
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

  const handleConnectAccount = async () => {
    if (!connectAccountName.trim()) {
      Alert.alert('Vul een accountnaam in');
      return;
    }
    setConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Niet ingelogd');
      const accountId = connectAccountUrl.trim() || connectAccountName.trim();
      // Check if account already exists, then update or insert accordingly
      const { data: existingAccount } = await supabase
        .from('social_accounts')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform', connectPlatform)
        .eq('platform_account_id', accountId)
        .maybeSingle();

      if (existingAccount) {
        // Update existing account
        const { error: updateErr } = await supabase
          .from('social_accounts')
          .update({
            account_name: connectAccountName.trim(),
            account_type: 'manual',
            status: 'active',
          })
          .eq('id', existingAccount.id);
        if (updateErr) {
          console.error('[connect] Update failed:', updateErr);
          throw new Error(updateErr.message || 'Kon niet verbinden');
        }
      } else {
        // Insert new account
        const { error: insertErr } = await supabase
          .from('social_accounts')
          .insert({
            user_id: user.id,
            platform: connectPlatform,
            account_name: connectAccountName.trim(),
            platform_account_id: accountId,
            account_type: 'manual',
            status: 'active',
          });
        if (insertErr) {
          console.error('[connect] Insert failed:', insertErr);
          throw new Error(insertErr.message || 'Kon niet verbinden');
        }
      }
      Alert.alert('✅ Verbonden', `${connectAccountName} is gekoppeld aan ${channelConfig[connectPlatform as Channel]?.label || connectPlatform}.`);
      setShowConnectModal(false);
      setConnectAccountName('');
      setConnectAccountUrl('');
      // Retry publish with the new account
      if (pendingPublishAll) {
        setPendingPublishAll(false);
        // Re-run Publiceer Alles to check remaining channels
        setTimeout(() => handlePublishAll(), 500);
      } else if (pendingPublishPost) {
        const accounts = await fetchAccountsForChannel(pendingPublishPost.channel);
        const acc = accounts[0];
        if (acc) doPublish(pendingPublishPost, acc.id, acc);
      }
    } catch (err: any) {
      Alert.alert('Fout', err?.message ?? 'Verbinding mislukt');
    } finally {
      setConnecting(false);
    }
  };

  // ── Bake overlay into image before publishing ─────────────────────────
  // Captures the ViewShot (image + overlay) as a new image, uploads it,
  // and updates the post's branded_image_url with the baked version.
  const bakeOverlayIntoImage = async (post: EventPost): Promise<string | null> => {
    const config = overlayConfig[post.id];
    if (!config || (!config.text && !config.showLogo)) {
      // No overlay configured — use existing image
      return post.branded_image_url || null;
    }

    // Wait for ViewShot ref to be available. On duplicated or freshly-
    // inserted posts, the ViewShot may not be mounted yet at the moment
    // the user taps publish — a silent null here meant the post published
    // without the overlay. Retry up to 1s (10×100ms) before giving up.
    let viewShotRef = viewShotRefs.current[post.id];
    if (!viewShotRef) {
      for (let attempt = 0; attempt < 10 && !viewShotRef; attempt++) {
        await new Promise((r) => setTimeout(r, 100));
        viewShotRef = viewShotRefs.current[post.id];
      }
    }
    if (!viewShotRef) {
      console.error('[bakeOverlay] ViewShot ref still null after retry for post', post.id);
      // Fail loudly instead of silently publishing without overlay.
      throw new Error('Overlay kon niet worden verwerkt: preview is nog niet geladen. Scroll naar de post en probeer opnieuw.');
    }

    try {
      // Capture the ViewShot as a local URI
      const uri = await captureRef(viewShotRef as any, {
        format: 'jpg',
        quality: 0.9,
      });

      if (!uri) {
        console.error('[bakeOverlay] captureRef returned empty URI for post', post.id);
        throw new Error('Overlay-snapshot mislukt. Probeer opnieuw.');
      }

      // Upload the baked image to Supabase Storage
      const { url } = await uploadMedia(uri, safeEventId, 'photo');

      // Update the post's branded_image_url with the baked version
      await updatePost.mutateAsync({ id: post.id, branded_image_url: url });

      console.log('[bakeOverlay] Success — baked overlay into image for post', post.id);
      return url;
    } catch (err: any) {
      console.error('[bakeOverlay] Failed:', err.message);
      // Re-throw so doPublish knows the overlay failed and can surface it to the user
      // instead of silently publishing without overlay.
      throw err;
    }
  };

  // Per-category account preference. Driven by captureCategory stored in
  // post.engagement.category at post-creation time (LiveCaptureScreen).
  // Returns 'page' | 'personal' | 'any' indicating which account type to auto-pick.
  const preferredAccountTypeForPost = (post: EventPost): 'page' | 'personal' | 'any' => {
    const cat = (post.engagement as any)?.category;
    if (cat === 'product' || cat === 'organisation' || cat === 'organization') return 'page';
    if (cat === 'inspiration' || cat === 'inspiratie') return 'personal';
    // events, quick, behind_scenes, content, or undefined → no strong preference
    return 'any';
  };

  const handlePublish = async (post: EventPost) => {
    // Check if user has accounts for this channel
    const accounts = await fetchAccountsForChannel(post.channel);
    if (accounts.length === 0) {
      // No accounts — offer to connect one
      setPendingPublishPost(post);
      setPendingPublishAll(false);
      setConnectPlatform(post.channel);
      setShowConnectModal(true);
      return;
    }
    if (accounts.length === 1) {
      // Single account — publish directly
      const acc = accounts[0];
      doPublish(post, acc?.id, acc);
      return;
    }
    // Multiple accounts — try to apply per-category preference first
    const pref = preferredAccountTypeForPost(post);
    if (pref === 'page') {
      const pageAcc = accounts.find((a: any) => a.account_type === 'page' || a.account_type === 'business');
      if (pageAcc) { doPublish(post, pageAcc.id, pageAcc); return; }
    } else if (pref === 'personal') {
      const personalAcc = accounts.find((a: any) => a.account_type === 'personal');
      if (personalAcc) { doPublish(post, personalAcc.id, personalAcc); return; }
    }
    // No strong preference, or preferred type not found — show picker
    setPendingPublishPost(post);
    setAvailableAccounts(accounts);
    setShowAccountPicker(true);
  };

  const doPublish = async (post: EventPost, accountId?: string, account?: any) => {
    const accountLabel = account?.account_name || account?.platform_account_id;
    const confirmMsg = accountLabel
      ? `Publiceren op ${channelConfig[post.channel]?.label} als "${accountLabel}"?`
      : `${t.postReview.publishOn} ${channelConfig[post.channel]?.label}?`;
    Alert.alert(
      confirmMsg,
      t.postReview.publishConfirm,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.postReview.publishButton,
          onPress: async () => {
            try {
              // Bake overlay into image before publishing (if configured)
              await bakeOverlayIntoImage(post);

              // Save any pending text changes first
              if (editingText[post.id]) {
                await updatePost.mutateAsync({ id: post.id, text_content: editingText[post.id] });
              }
              // Save account info in engagement for display
              if (account) {
                const eng = { ...(post.engagement ?? { likes: 0, comments: 0, shares: 0 }) };
                (eng as any).published_account = {
                  id: account.id,
                  name: account.account_name || account.platform_account_id,
                  type: account.account_type,
                  image_url: account.profile_image_url,
                };
                await updatePost.mutateAsync({ id: post.id, engagement: eng });
                setPublishedAccounts((prev) => ({
                  ...prev,
                  [post.id]: {
                    name: account.account_name || account.platform_account_id,
                    type: account.account_type,
                    imageUrl: account.profile_image_url,
                  },
                }));
              }
              const pubResult = await publishPost.mutateAsync(post.id);
              if ((pubResult as any)?.manual) {
                Alert.alert(
                  '📋 Klaar om te posten',
                  `Post is opgeslagen als gepubliceerd. Kopieer de tekst en plak deze handmatig op ${channelConfig[post.channel]?.label}.\n\nVoor automatisch publiceren: koppel je account via OAuth in Instellingen.`,
                );
              } else {
                // Feature B: build live URL button for LinkedIn / Facebook when postId is returned
                const publishedPostId: string | null | undefined = (pubResult as any)?.postId ?? null;
                const liveUrl = (() => {
                  if (!publishedPostId) return null;
                  const ch = post.channel?.toLowerCase();
                  if (ch === 'linkedin') return `https://www.linkedin.com/feed/update/urn:li:activity:${publishedPostId}/`;
                  if (ch === 'facebook') return `https://www.facebook.com/${publishedPostId}`;
                  return null;
                })();
                const platformLabel = channelConfig[post.channel]?.label ?? post.channel;
                // Build success message, appending first-comment status if relevant
                const firstCommentStatus: string | undefined = (pubResult as any)?.firstComment;
                let successMsg = `Post is gepubliceerd op ${platformLabel}${accountLabel ? ` als "${accountLabel}"` : ''}.`;
                if (firstCommentStatus === 'posted') {
                  successMsg += '\n\n\uD83D\uDCAC Eerste reactie geplaatst.';
                } else if (firstCommentStatus === 'failed') {
                  successMsg += '\n\n\u26A0\uFE0F Eerste reactie mislukt \u2014 plaats handmatig.';
                }
                if (liveUrl) {
                  Alert.alert('✅ Gepubliceerd', successMsg, [
                    { text: 'OK', style: 'cancel' },
                    {
                      text: `Bekijk op ${platformLabel}`,
                      onPress: () => Linking.openURL(liveUrl),
                    },
                  ]);
                } else {
                  Alert.alert('✅ Gepubliceerd', successMsg);
                }
              }
            } catch (err: any) {
              if (err?.message === 'SOCIAL_NOT_CONNECTED') {
                Alert.alert(
                  '⚠️ Geen sociale media verbinding',
                  `Post is opgeslagen als "Goedgekeurd" maar nog niet gepubliceerd op ${channelConfig[post.channel]?.label}.\n\nVerbind je social media accounts via Instellingen → Social Media om automatisch te publiceren.`,
                  [{ text: 'OK' }]
                );
              } else if (err?.message?.includes('reconnect') || err?.message?.includes('verlopen')) {
                Alert.alert(
                  '🔑 Token verlopen',
                  `Je ${channelConfig[post.channel]?.label} verbinding is verlopen.\n\nGa naar Instellingen → Social Media en koppel je account opnieuw.`,
                  [{ text: 'OK' }]
                );
              } else if (err?.message?.includes('afbeelding') || err?.message?.includes('image')) {
                Alert.alert(
                  '📸 Afbeelding vereist',
                  `Instagram vereist een afbeelding bij elke post.\n\nVoeg een foto toe en probeer opnieuw.`,
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  t.common.error,
                  err?.message || t.postReview.publishError,
                );
              }
            }
          },
        },
      ],
    );
  };

  const handlePublishAll = async () => {
    const draftPosts = posts.filter((p) => p.status === 'draft' || p.status === 'approved');
    if (draftPosts.length === 0) {
      Alert.alert(t.postReview.noDrafts);
      return;
    }

    // Check if any channel has no accounts — offer to connect first
    const channelsWithoutAccounts: string[] = [];
    for (const post of draftPosts) {
      const accounts = await fetchAccountsForChannel(post.channel);
      if (accounts.length === 0 && !channelsWithoutAccounts.includes(post.channel)) {
        channelsWithoutAccounts.push(post.channel);
      }
    }
    if (channelsWithoutAccounts.length > 0) {
      // Show connect modal for the first missing channel
      setPendingPublishPost(draftPosts[0]);
      setPendingPublishAll(true);
      setConnectPlatform(channelsWithoutAccounts[0]);
      setShowConnectModal(true);
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
            // Feature A: iterate every post individually; one failure must not abort the rest.
            const succeeded: EventPost[] = [];
            const failed: Array<{ post: EventPost; error: string }> = [];

            for (const post of draftPosts) {
              try {
                // Bake overlay (throws on hard failure; non-critical path already returns null)
                await bakeOverlayIntoImage(post);
                // Save any pending text edit before publishing
                if (editingText[post.id]) {
                  await updatePost.mutateAsync({ id: post.id, text_content: editingText[post.id] });
                }
                await publishPost.mutateAsync(post.id);
                succeeded.push(post);
              } catch (err: any) {
                // Fetch the publish_error from DB for a richer message (may be null, use err.message fallback)
                let errMsg: string = err?.message || 'Onbekende fout';
                try {
                  const { data: dbPost } = await supabase
                    .from('go_posts')
                    .select('publish_error')
                    .eq('id', post.id)
                    .single();
                  if (dbPost?.publish_error) errMsg = dbPost.publish_error;
                } catch { /* ignore — use errMsg already set */ }
                failed.push({ post, error: errMsg });
              }
            }

            const total = draftPosts.length;
            const nOk = succeeded.length;
            const nFail = failed.length;

            if (nFail === 0) {
              // All succeeded
              Alert.alert(t.postReview.publishAllSuccess);
            } else if (nOk === 0) {
              // All failed — fall back to existing connect-modal flow for the first post
              const firstFailed = failed[0].post;
              const accounts = await fetchAccountsForChannel(firstFailed.channel);
              if (accounts.length === 0) {
                setPendingPublishPost(firstFailed);
                setPendingPublishAll(true);
                setConnectPlatform(firstFailed.channel);
                setShowConnectModal(true);
              } else {
                Alert.alert(
                  t.common.error,
                  `${nOk}/${total} gepubliceerd. ${nFail} mislukt.`,
                  [
                    { text: 'OK', style: 'cancel' },
                    {
                      text: 'Bekijk fouten',
                      onPress: () => {
                        const details = failed
                          .map((f) => `• ${channelConfig[f.post.channel]?.label ?? f.post.channel}: ${f.error}`)
                          .join('\n');
                        Alert.alert('Mislukte posts', details);
                      },
                    },
                  ],
                );
              }
            } else {
              // Partial success
              Alert.alert(
                `${nOk}/${total} gepubliceerd. ${nFail} mislukt.`,
                undefined,
                [
                  { text: 'OK', style: 'cancel' },
                  {
                    text: 'Bekijk fouten',
                    onPress: () => {
                      const details = failed
                        .map((f) => `• ${channelConfig[f.post.channel]?.label ?? f.post.channel}: ${f.error}`)
                        .join('\n');
                      Alert.alert('Mislukte posts', details);
                    },
                  },
                ],
              );
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
          const postImages = isVideo || isAudio ? [] : getPostImages(post, fallbackImageUrl).map(
            url => refreshedUrls[url] || url // Use refreshed signed URL if available
          );
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
                  <ViewShot
                    ref={(ref: ViewShot | null) => { viewShotRefs.current[post.id] = ref; }}
                    options={{ format: 'jpg', quality: 0.9 }}
                  >
                  <TouchableOpacity
                    style={styles.postImageWrapper}
                    activeOpacity={0.92}
                    onPress={() => setZoomImageUrl(imageUrl)}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.postImage}
                      resizeMode="cover"
                      onError={async () => {
                        // Try refreshing signed URL before marking as failed
                        if (imageUrl.includes('supabase') && !refreshedUrls[imageUrl]) {
                          const freshUrl = await refreshSignedUrl(imageUrl);
                          if (freshUrl !== imageUrl) return; // Will re-render with fresh URL
                        }
                        setFailedUrls((prev) => new Set([...prev, imageUrl]));
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
                  </TouchableOpacity>
                  </ViewShot>
                  {/* Zoom-hint intentionally rendered OUTSIDE the ViewShot so it
                      is NOT baked into the published image. */}
                  <View style={[styles.zoomHint, { position: 'absolute', right: 8, bottom: 8 }]} pointerEvents="none">
                    <Ionicons name="expand-outline" size={14} color="#fff" />
                  </View>

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
                          onError={async () => {
                            // Try refreshing the signed URL before marking as failed
                            if (thumbUrl.includes('supabase') && !refreshedUrls[thumbUrl]) {
                              const freshUrl = await refreshSignedUrl(thumbUrl);
                              if (freshUrl !== thumbUrl) return; // Will re-render with fresh URL
                            }
                            setFailedUrls((prev) => new Set([...prev, thumbUrl]));
                          }}
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
              {/* Overlay & flip available for all capture types with images */}
              {(
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

                  {/* Rotate + Flip image */}
                  {imageUrl ? (
                    <>
                      <TouchableOpacity
                        onPress={() => handleRotateImage(post, imageUrl)}
                        disabled={rotatingImage}
                        style={{
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
                          borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md,
                          paddingVertical: 9, paddingHorizontal: 14,
                          backgroundColor: colors.surface,
                        }}
                      >
                        {rotatingImage
                          ? <ActivityIndicator size="small" color={colors.primary} />
                          : <>
                              <Ionicons name="refresh-outline" size={15} color={colors.textSecondary} />
                              <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium }}>Draaien</Text>
                            </>}
                      </TouchableOpacity>
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
                    </>
                  ) : null}
                </View>
              )}

              {/* Status badge + account info */}
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
                {/* Show which account was used */}
                {(() => {
                  const acc = publishedAccounts[post.id] || (post.engagement as any)?.published_account;
                  if (!acc) return null;
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                      <Text style={{ color: colors.textTertiary, fontSize: fontSize.xs }}>·</Text>
                      {(acc.imageUrl || (acc as any).image_url) ? (
                        <Image source={{ uri: acc.imageUrl || (acc as any).image_url }} style={{ width: 14, height: 14, borderRadius: 7 }} />
                      ) : (
                        <Ionicons name="person-circle-outline" size={14} color={colors.textTertiary} />
                      )}
                      <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: fontWeight.medium }}>
                        {acc.name}
                      </Text>
                      <Text style={{ color: colors.textTertiary, fontSize: 9 }}>
                        {acc.type === 'page' ? '🏢' : acc.type === 'business' ? '💼' : '👤'}
                      </Text>
                    </View>
                  );
                })()}
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
                const isLuxury = getTextStyle(post.id) === 'luxury';
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
                    {/* Luxury icons toggle */}
                    <TouchableOpacity
                      onPress={() => toggleTextStyle(post)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                        paddingHorizontal: 10, paddingVertical: 5,
                        borderRadius: borderRadius.full,
                        backgroundColor: isLuxury ? (config?.color || colors.primary) + '18' : colors.surface,
                        borderWidth: 1,
                        borderColor: isLuxury ? (config?.color || colors.primary) : colors.border,
                      }}
                    >
                      <Ionicons
                        name={isLuxury ? 'sparkles' : 'text-outline'}
                        size={13}
                        color={isLuxury ? (config?.color || colors.primary) : colors.textSecondary}
                      />
                      <Text style={{
                        fontSize: 11,
                        fontWeight: isLuxury ? fontWeight.bold : fontWeight.medium,
                        color: isLuxury ? (config?.color || colors.primary) : colors.textSecondary,
                      }}>
                        {isLuxury ? '✨ Luxe' : 'Plat'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}

              {/* ── Instagram format picker (feed / story / reel) ────── */}
              {post.channel === 'instagram' && (() => {
                const igFmt = igFormatDraft[post.id] ?? 'feed';
                const IG_FORMATS: Array<{ value: 'feed' | 'story' | 'reel'; label: string; icon: string }> = [
                  { value: 'feed', label: 'Feed', icon: 'grid-outline' },
                  { value: 'story', label: 'Story', icon: 'phone-portrait-outline' },
                  { value: 'reel', label: 'Reel', icon: 'film-outline' },
                ];
                const hint = igFmt === 'story'
                  ? 'Story: geen caption, alleen afbeelding of video'
                  : igFmt === 'reel'
                  ? 'Reel: alleen video (15-90s)'
                  : null;
                return (
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="logo-instagram" size={14} color={config?.color || '#E4405F'} />
                      <Text style={{ fontSize: 11, color: colors.textSecondary, fontWeight: fontWeight.medium }}>
                        Formaat
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {IG_FORMATS.map(({ value, label, icon }) => {
                        const isActive = igFmt === value;
                        return (
                          <TouchableOpacity
                            key={value}
                            onPress={() => handleIgFormatChange(post, value)}
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              paddingVertical: 7,
                              borderRadius: borderRadius.md,
                              borderWidth: 1.5,
                              borderColor: isActive ? (config?.color || '#E4405F') : colors.border,
                              backgroundColor: isActive ? (config?.color || '#E4405F') + '18' : 'transparent',
                            }}
                          >
                            <Ionicons
                              name={icon as any}
                              size={13}
                              color={isActive ? (config?.color || '#E4405F') : colors.textSecondary}
                            />
                            <Text style={{
                              fontSize: 11,
                              fontWeight: isActive ? fontWeight.bold : fontWeight.medium,
                              color: isActive ? (config?.color || '#E4405F') : colors.textSecondary,
                            }}>
                              {label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {hint && (
                      <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 5,
                        backgroundColor: (config?.color || '#E4405F') + '12',
                        borderRadius: borderRadius.sm,
                        paddingHorizontal: 10, paddingVertical: 6,
                      }}>
                        <Ionicons name="information-circle-outline" size={13} color={config?.color || '#E4405F'} />
                        <Text style={{ fontSize: 11, color: config?.color || '#E4405F', fontWeight: fontWeight.medium }}>
                          {hint}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}

              {/* Hashtags — strip any leading # already present before adding one */}
              {(post.hashtags?.length ?? 0) > 0 && (
                <Text style={styles.hashtags}>
                  {(post.hashtags || []).map((h) => `#${h.replace(/^#+/, '')}`).join(' ')}
                </Text>
              )}

              {/* ── Eerste reactie (first comment) ───────────────────── */}
              {(() => {
                const isExpanded = !!firstCommentExpanded[post.id];
                const draft = firstCommentDraft[post.id] ?? '';
                const maxLen = FIRST_COMMENT_MAX[post.channel] ?? 1250;
                const charCount = draft.length;
                const isOverLimit = charCount > maxLen;
                const hasComment = draft.trim().length > 0;
                return (
                  <View>
                    {/* Toggle button */}
                    <TouchableOpacity
                      onPress={() =>
                        setFirstCommentExpanded((prev) => ({ ...prev, [post.id]: !isExpanded }))
                      }
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingVertical: 8,
                        paddingHorizontal: 2,
                      }}
                    >
                      <Ionicons
                        name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                        size={14}
                        color={hasComment ? colors.success : colors.textSecondary}
                      />
                      <Text style={{
                        fontSize: fontSize.sm,
                        color: hasComment ? colors.success : colors.textSecondary,
                        fontWeight: hasComment ? fontWeight.semibold : fontWeight.medium,
                      }}>
                        {`\uD83D\uDCAC Eerste reactie toevoegen (optioneel)`}
                      </Text>
                      {hasComment && !isExpanded && (
                        <View style={{
                          width: 8, height: 8, borderRadius: 4,
                          backgroundColor: colors.success, marginLeft: 2,
                        }} />
                      )}
                    </TouchableOpacity>

                    {/* Expanded editor */}
                    {isExpanded && (
                      <View style={{
                        borderWidth: 1,
                        borderColor: isOverLimit ? colors.error : colors.border,
                        borderRadius: borderRadius.md,
                        backgroundColor: colors.surface,
                        padding: spacing.md,
                        gap: 6,
                      }}>
                        <TextInput
                          style={{
                            fontSize: fontSize.sm,
                            color: colors.text,
                            minHeight: 80,
                            textAlignVertical: 'top',
                          }}
                          value={draft}
                          onChangeText={(val) =>
                            setFirstCommentDraft((prev) => ({ ...prev, [post.id]: val }))
                          }
                          onBlur={async () => {
                            const value = (firstCommentDraft[post.id] ?? '').trim();
                            // Save to DB (accepts null to clear the field)
                            try {
                              await updatePost.mutateAsync({
                                id: post.id,
                                first_comment: value || null,
                              } as any);
                            } catch {
                              // Non-fatal — draft stays in local state
                            }
                          }}
                          multiline
                          placeholder="Bijv. hashtags of een CTA die je uit de hoofdtekst wilt houden…"
                          placeholderTextColor={colors.textTertiary}
                        />
                        {/* Character counter */}
                        <Text style={{
                          fontSize: 11,
                          color: isOverLimit ? colors.error : colors.textTertiary,
                          alignSelf: 'flex-end',
                        }}>
                          {charCount}/{maxLen}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}

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
                    if (!hasConsent) {
                      requestConsent(() => {});
                      return;
                    }
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

              {/* ── Content Creator with image ─────────────────────── */}
              <TouchableOpacity
                style={[styles.translateBtn, { borderColor: '#8B5CF6' + '80', backgroundColor: '#8B5CF680' + '10' }]}
                onPress={() => {
                  const allImages = getPostImages(post, imageUrl);
                  navigation.navigate('ContentCreator' as any, {
                    imageUri: imageUrl || undefined,
                    imageUrls: allImages.length > 0 ? allImages : undefined,
                  });
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <Ionicons name="brush-outline" size={14} color="#8B5CF6" />
                  <Text style={[styles.translateBtnText, { color: '#8B5CF6' }]}>Content Creator</Text>
                </View>
              </TouchableOpacity>

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
            const rawText = editingText[p.id] ?? p.text_content;
            // Guard against null hashtags (DB may return null for older rows)
            const tags = (p.hashtags || []).map((h: string) => `#${h.replace(/^#+/, '')}`).join(' ');
            // Strip hashtags from text if they're already rendered separately below
            const text = tags
              ? rawText.replace(/(?:\s*#\w+)+\s*$/, '').trim()
              : rawText;

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

            // Overlay elements to layer on top of the image in mock cards.
            // IMPORTANT: sizes/positions/fonts MUST match the ViewShot-wrapped
            // feed render (lines ~1381-1417). That ViewShot IS what gets baked
            // into the published image via bakeOverlayIntoImage(). If these
            // diverge, the modal preview shows something different from what
            // actually gets posted to LinkedIn/FB/IG.
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
                  {/* Top text — matches ViewShot style */}
                  {ov.text && ov.textPosition === 'top' && (
                    <View style={{
                      position: 'absolute', top: 0, left: 0, right: 0,
                      backgroundColor: 'rgba(0,0,0,0.52)',
                      paddingHorizontal: 10, paddingVertical: 7,
                    }}>
                      <Text style={{ color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.semibold }} numberOfLines={2}>
                        {ov.text}
                      </Text>
                    </View>
                  )}
                  {/* Logo — matches ViewShot: 32x32, borderRadius 6 */}
                  {ov.showLogo && (
                    <View style={{ position: 'absolute', flexDirection: 'row', gap: 4, ...posStyle }}>
                      {logos.length > 0 ? logos.map((lu, li) => (
                        <Image key={li} source={{ uri: lu }}
                          style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.4)' }}
                          resizeMode="contain"
                        />
                      )) : (
                        <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, padding: 6 }}>
                          <Ionicons name="business-outline" size={16} color="#fff" />
                        </View>
                      )}
                    </View>
                  )}
                  {/* Bottom text — matches ViewShot style */}
                  {ov.text && ov.textPosition === 'bottom' && (
                    <View style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      backgroundColor: 'rgba(0,0,0,0.52)',
                      paddingHorizontal: 10, paddingVertical: 7,
                    }}>
                      <Text style={{ color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.semibold }} numberOfLines={2}>
                        {ov.text}
                      </Text>
                    </View>
                  )}
                </>
              );
            };

            // Shared image renderer with swipeable carousel for multi-image
            const PreviewImage = ({ height, borderRadius: br }: { height: number; borderRadius?: number }) => {
              // Deduplicated preview images (already computed above)
              const imgs = previewImages.length > 0 ? previewImages : [];
              const hasMultiple = imgs.length > 1;

              if (imgs.length === 0) {
                return (
                  <View style={{ width: '100%', height, borderRadius: br ?? 0, overflow: 'hidden', backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="image-outline" size={44} color="#555" />
                    <Text style={{ fontSize: 12, color: '#555' }}>Geen afbeelding</Text>
                  </View>
                );
              }

              return (
                <View style={{ width: '100%', height, borderRadius: br ?? 0, overflow: 'hidden' }}>
                  {hasMultiple ? (
                    <>
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onMomentumScrollEnd={(e) => {
                          const idx = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                          setPreviewSlideIdx(idx);
                        }}
                        style={{ width: '100%', height }}
                      >
                        {imgs.map((url, i) => (
                          <Image
                            key={`${url}-${i}`}
                            source={{ uri: url }}
                            style={{ width: Dimensions.get('window').width - 32, height }}
                            resizeMode="cover"
                            onError={() => setPreviewFailedUrls(prev => new Set([...prev, url]))}
                          />
                        ))}
                      </ScrollView>
                      {/* Slide indicator dots */}
                      <View style={{
                        position: 'absolute', bottom: 8, left: 0, right: 0,
                        flexDirection: 'row', justifyContent: 'center', gap: 5,
                      }}>
                        {imgs.map((_, i) => (
                          <View key={i} style={{
                            width: previewSlideIdx === i ? 18 : 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: previewSlideIdx === i ? '#fff' : 'rgba(255,255,255,0.5)',
                          }} />
                        ))}
                      </View>
                      {/* Image counter badge */}
                      <View style={{
                        position: 'absolute', top: 8, left: 8,
                        backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10,
                        paddingHorizontal: 8, paddingVertical: 3,
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                      }}>
                        <Ionicons name="images-outline" size={11} color="#fff" />
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>
                          {previewSlideIdx + 1}/{imgs.length}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Image
                      source={{ uri: imgs[0] }}
                      style={{ width: '100%', height }}
                      resizeMode="cover"
                      onLoad={() => setPreviewImgLoaded(true)}
                      onError={() => { if (imgs[0]) setPreviewFailedUrls(prev => new Set([...prev, imgs[0]])); }}
                    />
                  )}
                  <PreviewOverlay />
                </View>
              );
            };

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
            {/* Apply to all channels */}
            {posts.length > 1 && (
              <TouchableOpacity
                onPress={async () => {
                  if (!editingOverlay) return;
                  // Apply overlay to all posts
                  for (const p of posts) {
                    setOverlayConfig((prev) => ({ ...prev, [p.id]: { ...overlayDraft } }));
                    try {
                      await updatePost.mutateAsync({
                        id: p.id,
                        engagement: {
                          ...(p.engagement ?? { likes: 0, comments: 0, shares: 0 }),
                          overlay_config: { ...overlayDraft },
                        } as any,
                      });
                    } catch { /* non-critical */ }
                  }
                  setEditingOverlay(null);
                  Alert.alert('✅', `Overlay toegepast op alle ${posts.length} kanalen`);
                }}
                style={{
                  marginTop: 8,
                  paddingVertical: 11,
                  borderRadius: borderRadius.md,
                  borderWidth: 1.5,
                  borderColor: colors.secondary,
                  backgroundColor: (colors as any).secondary + '10',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: colors.secondary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm }}>
                  Toepassen op alle kanalen ({posts.length})
                </Text>
              </TouchableOpacity>
            )}
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

      {/* ── Account Picker Modal ── */}
      <Modal visible={showAccountPicker} transparent animationType="slide" onRequestClose={() => setShowAccountPicker(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setShowAccountPicker(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md }} />
              <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold as any, color: colors.text, marginBottom: 4 }}>
                Kies account
              </Text>
              <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md }}>
                Selecteer het account waarop je wilt publiceren
              </Text>
              {availableAccounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => {
                    setShowAccountPicker(false);
                    if (pendingPublishPost) doPublish(pendingPublishPost, acc.id, acc);
                  }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    backgroundColor: colors.background, borderRadius: borderRadius.md, padding: spacing.md,
                    marginBottom: 8, borderWidth: 1, borderColor: colors.border,
                  }}
                >
                  {acc.profile_image_url ? (
                    <Image source={{ uri: acc.profile_image_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                  ) : (
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="person" size={20} color={colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontSize: fontSize.md, fontWeight: fontWeight.semibold as any }}>
                      {acc.account_name || acc.platform_account_id}
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: fontSize.xs }}>
                      {acc.account_type === 'page' ? '🏢 Bedrijfspagina' : acc.account_type === 'business' ? '💼 Zakelijk' : '👤 Persoonlijk'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowAccountPicker(false)} style={{ alignItems: 'center', paddingVertical: spacing.sm, marginTop: 4 }}>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>Annuleren</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Connect Account Modal (shown when no accounts for channel) ── */}
      <Modal visible={showConnectModal} transparent animationType="slide" onRequestClose={() => setShowConnectModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setShowConnectModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 40 : 20 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Ionicons name={channelConfig[connectPlatform as Channel]?.icon as any || 'link-outline'} size={22} color={channelConfig[connectPlatform as Channel]?.color || colors.primary} />
                <Text style={{ fontSize: fontSize.lg, fontWeight: fontWeight.bold as any, color: colors.text }}>
                  {channelConfig[connectPlatform as Channel]?.label || connectPlatform} koppelen
                </Text>
              </View>
              <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.md }}>
                Je hebt nog geen {channelConfig[connectPlatform as Channel]?.label} account gekoppeld. Voeg er een toe om direct te publiceren.
              </Text>
              <Text style={{ fontSize: fontSize.xs, color: colors.textTertiary, marginBottom: 6 }}>ACCOUNTNAAM *</Text>
              <TextInput
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: fontSize.md, color: colors.text, marginBottom: spacing.sm }}
                placeholder={`Bijv. "Inclufy" of "@inclufy"`}
                placeholderTextColor={colors.textTertiary}
                value={connectAccountName}
                onChangeText={setConnectAccountName}
                autoFocus
              />
              <Text style={{ fontSize: fontSize.xs, color: colors.textTertiary, marginBottom: 6 }}>PROFIEL URL (optioneel)</Text>
              <TextInput
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.sm, fontSize: fontSize.md, color: colors.text, marginBottom: spacing.md }}
                placeholder="https://..."
                placeholderTextColor={colors.textTertiary}
                value={connectAccountUrl}
                onChangeText={setConnectAccountUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
              <TouchableOpacity
                onPress={handleConnectAccount}
                disabled={connecting || !connectAccountName.trim()}
                style={{
                  backgroundColor: channelConfig[connectPlatform as Channel]?.color || colors.primary,
                  borderRadius: borderRadius.md, paddingVertical: 14, alignItems: 'center',
                  opacity: connecting || !connectAccountName.trim() ? 0.6 : 1,
                }}
              >
                {connecting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontSize: fontSize.md, fontWeight: fontWeight.semibold }}>
                    Koppelen & publiceren
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowConnectModal(false)} style={{ alignItems: 'center', paddingVertical: spacing.sm, marginTop: 4 }}>
                <Text style={{ color: colors.textSecondary, fontSize: fontSize.sm }}>Later</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <AIConsentModal visible={showConsentModal} onAccept={onConsentAccept} onDecline={onConsentDecline} />
    </View>
  );
}
