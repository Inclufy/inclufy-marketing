import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Share,
  TextInput,
  Image,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
type Language = 'nl' | 'en' | 'fr';
type Tone = 'compact' | 'standard' | 'detailed';

// ─── Constants ───────────────────────────────────────────────────────

const FORMAT_OPTIONS: Array<{ key: OutputFormat; label: string; ionicon: string }> = [
  { key: 'blog',             label: 'Blog',       ionicon: 'create-outline' },
  { key: 'newsletter',       label: 'Newsletter',  ionicon: 'mail-outline' },
  { key: 'linkedin_article', label: 'LinkedIn',    ionicon: 'briefcase-outline' },
];

const LANGUAGES: Array<{ key: Language; flag: string; label: string }> = [
  { key: 'nl', flag: '🇳🇱', label: 'NL' },
  { key: 'en', flag: '🇬🇧', label: 'EN' },
  { key: 'fr', flag: '🇫🇷', label: 'FR' },
];

const TONES: Array<{ key: Tone; label: string; ionicon: string }> = [
  { key: 'compact',  label: 'Compact',   ionicon: 'contract-outline' },
  { key: 'standard', label: 'Standaard', ionicon: 'reorder-three-outline' },
  { key: 'detailed', label: 'Uitgebreid', ionicon: 'expand-outline' },
];

// ─── Component ───────────────────────────────────────────────────────

export default function EventRecapScreen() {
  const route = useRoute<Route>();
  const { eventId } = route.params;

  const { data: event }       = useEvent(eventId);
  const { data: capturesData } = useCaptures(eventId);
  const { data: postsData }   = useEventPosts(eventId);
  const { data: brandMemory } = useBrandMemory();

  // ── Generation settings
  const [selectedFormat, setSelectedFormat] = useState<OutputFormat>('blog');
  const [language, setLanguage]             = useState<Language>('nl');
  const [tone, setTone]                     = useState<Tone>('standard');

  // ── Photo picker (from event captures)
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  // ── Results cache: one recap per language
  const [recaps, setRecaps] = useState<Partial<Record<Language, EventRecapResponse>>>({});
  const recap = recaps[language] ?? null;

  // ── Loading / error states
  const [loading, setLoading]       = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError]           = useState('');

  // ── Edit mode
  const [isEditing, setIsEditing]     = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTeaser, setEditedTeaser]   = useState('');

  // ─── Photo captures (only photo type with thumbnail)
  const captures = Array.isArray(capturesData) ? capturesData : [];
  const photosAvailable = captures.filter(
    (c: any) => c.media_type === 'photo' && c.thumbnail_url,
  );

  const togglePhoto = (url: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url],
    );
  };

  // ─── Generate recap ──────────────────────────────────────────────
  const generateRecap = async (overrideLang?: Language, overrideTone?: Tone) => {
    if (!event) return;

    const genLang = overrideLang ?? language;
    const genTone = overrideTone ?? tone;

    setLoading(true);
    setError('');
    setIsEditing(false);

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
        event_name:     event.name,
        event_date:     event.event_date,
        location:       event.location || '',
        posts,
        captures_count: captures.length,
        published_count: publishedCount,
        output_format:  selectedFormat,
        language:       genLang,
        tone:           genTone,
      });

      setRecaps((prev) => ({ ...prev, [genLang]: result }));
      // If switching language, also update the active language
      if (overrideLang) setLanguage(overrideLang);
      if (overrideTone) setTone(overrideTone);
    } catch (e) {
      setError('Kan recap niet genereren. Controleer je verbinding en probeer opnieuw.');
      console.error('Recap error:', e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Switch language (translate on demand) ───────────────────────
  const switchLanguage = async (lang: Language) => {
    if (lang === language) return;
    if (recaps[lang]) {
      // Already cached
      setLanguage(lang);
      setIsEditing(false);
      return;
    }
    // Need to generate in the new language
    if (!recaps[language] && !loading) {
      // Nothing generated yet — just switch preference
      setLanguage(lang);
      return;
    }
    // Translate: regenerate in target language with same format/tone
    setTranslating(true);
    setIsEditing(false);
    await generateRecap(lang, tone);
    setTranslating(false);
  };

  // ─── Change tone (re-generate) ───────────────────────────────────
  const changeTone = async (newTone: Tone) => {
    if (newTone === tone) return;
    setTone(newTone);
    if (recap) {
      // Re-generate with new tone
      await generateRecap(language, newTone);
    }
  };

  // ─── Edit mode ───────────────────────────────────────────────────
  const startEditing = () => {
    if (!recap) return;
    setEditedContent(recap.content);
    setEditedTeaser(recap.social_teaser);
    setIsEditing(true);
  };

  const saveEdits = () => {
    if (!recap) return;
    setRecaps((prev) => ({
      ...prev,
      [language]: {
        ...recap,
        content:      editedContent,
        social_teaser: editedTeaser,
      },
    }));
    setIsEditing(false);
  };

  const cancelEdits = () => {
    setIsEditing(false);
  };

  // ─── Share ───────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!recap) return;
    const content = isEditing ? editedContent : recap.content;
    const teaser  = isEditing ? editedTeaser  : recap.social_teaser;
    try {
      await Share.share({
        title:   recap.title,
        message: `${recap.title}\n\n${teaser}\n\n${content}`,
      });
    } catch {
      // Share cancelled
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────
  const displayContent = isEditing ? editedContent : recap?.content ?? '';
  const displayTeaser  = isEditing ? editedTeaser  : recap?.social_teaser ?? '';

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <Ionicons name="newspaper-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Event Recap</Text>
            <Text style={styles.headerEvent}>{event?.name}</Text>
          </View>
        </View>
        <Text style={styles.headerStats}>
          {captures.length} captures • {(postsData?.posts || []).length} posts
        </Text>
      </View>

      {/* ── Format selector ────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.formatSelector}>
          {FORMAT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.formatOption, selectedFormat === opt.key && styles.formatOptionActive]}
              onPress={() => setSelectedFormat(opt.key)}
            >
              <Ionicons
                name={opt.ionicon as any}
                size={20}
                color={selectedFormat === opt.key ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.formatLabel, selectedFormat === opt.key && styles.formatLabelActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Language selector ──────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Taal</Text>
        <View style={styles.langRow}>
          {LANGUAGES.map((lang) => {
            const isActive   = language === lang.key;
            const isCached   = !!recaps[lang.key];
            return (
              <TouchableOpacity
                key={lang.key}
                style={[styles.langBtn, isActive && styles.langBtnActive]}
                onPress={() => switchLanguage(lang.key)}
                disabled={translating || loading}
              >
                <Text style={styles.langFlag}>{lang.flag}</Text>
                <Text style={[styles.langLabel, isActive && styles.langLabelActive]}>
                  {lang.label}
                </Text>
                {isCached && !isActive && (
                  <View style={styles.cachedDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Tone selector ──────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Toon</Text>
        <View style={styles.toneRow}>
          {TONES.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.toneBtn, tone === t.key && styles.toneBtnActive]}
              onPress={() => changeTone(t.key)}
              disabled={loading}
            >
              <Ionicons
                name={t.ionicon as any}
                size={16}
                color={tone === t.key ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.toneLabel, tone === t.key && styles.toneLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Photo picker ───────────────────────────────────────── */}
      {photosAvailable.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Foto's toevoegen
            {selectedPhotos.length > 0 && (
              <Text style={styles.sectionLabelCount}> ({selectedPhotos.length} geselecteerd)</Text>
            )}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.photoScroll}
          >
            {photosAvailable.map((cap: any) => {
              const isSelected = selectedPhotos.includes(cap.thumbnail_url);
              return (
                <TouchableOpacity
                  key={cap.id}
                  style={[styles.photoThumb, isSelected && styles.photoThumbSelected]}
                  onPress={() => togglePhoto(cap.thumbnail_url)}
                >
                  <Image source={{ uri: cap.thumbnail_url }} style={styles.photoImg} />
                  {isSelected && (
                    <View style={styles.photoCheckOverlay}>
                      <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Generate button ────────────────────────────────────── */}
      <TouchableOpacity
        style={[styles.generateBtn, (loading || translating) && styles.generateBtnDisabled]}
        onPress={() => generateRecap()}
        disabled={loading || translating}
      >
        {loading ? (
          <ActivityIndicator color={colors.textOnPrimary} />
        ) : (
          <View style={styles.generateBtnInner}>
            <Ionicons name="sparkles-outline" size={18} color={colors.textOnPrimary} />
            <Text style={styles.generateBtnText}>
              {recap ? 'Opnieuw genereren' : `Genereer ${FORMAT_OPTIONS.find((f) => f.key === selectedFormat)?.label}`}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Error */}
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={18} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Translating indicator */}
      {translating && (
        <View style={styles.translatingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.translatingText}>Vertalen...</Text>
        </View>
      )}

      {/* ── Recap result ───────────────────────────────────────── */}
      {recap ? (
        <View style={styles.recapResult}>

          {/* Language + Tone quick-action bar */}
          <View style={styles.recapToolbar}>
            {/* Language tabs */}
            <View style={styles.toolbarLangs}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.key}
                  style={[styles.toolbarLangBtn, language === lang.key && styles.toolbarLangBtnActive]}
                  onPress={() => switchLanguage(lang.key)}
                  disabled={translating || loading}
                >
                  <Text style={styles.toolbarLangFlag}>{lang.flag}</Text>
                  {!!recaps[lang.key] && language !== lang.key && (
                    <View style={styles.cachedDot} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Edit toggle */}
            <TouchableOpacity
              style={[styles.editToggleBtn, isEditing && styles.editToggleBtnActive]}
              onPress={isEditing ? saveEdits : startEditing}
            >
              <Ionicons
                name={isEditing ? 'checkmark-outline' : 'create-outline'}
                size={15}
                color={isEditing ? '#fff' : colors.textSecondary}
              />
              <Text style={[styles.editToggleText, isEditing && styles.editToggleTextActive]}>
                {isEditing ? 'Opslaan' : 'Bewerken'}
              </Text>
            </TouchableOpacity>

            {isEditing && (
              <TouchableOpacity style={styles.cancelEditBtn} onPress={cancelEdits}>
                <Text style={styles.cancelEditText}>Annuleren</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Title */}
          <Text style={styles.recapTitle}>{recap.title}</Text>

          {/* Social teaser */}
          <View style={[styles.teaserBox, cardShadow]}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="megaphone-outline" size={15} color={colors.primary} />
              <Text style={styles.teaserLabel}>Social Teaser</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={styles.editTextInput}
                value={editedTeaser}
                onChangeText={setEditedTeaser}
                multiline
                placeholder="Social teaser..."
                placeholderTextColor={colors.textTertiary}
              />
            ) : (
              <Text style={styles.teaserText}>{displayTeaser}</Text>
            )}
          </View>

          {/* Key highlights */}
          {(recap.key_highlights?.length ?? 0) > 0 && (
            <View style={styles.highlightsBox}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="star-outline" size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>Key Highlights</Text>
              </View>
              {recap.key_highlights.map((h, i) => (
                <View key={i} style={styles.highlightItem}>
                  <View style={styles.highlightBulletDot} />
                  <Text style={styles.highlightText}>{h}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Full content */}
          <View style={styles.contentBox}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.sectionTitle}>Volledige Tekst</Text>
            </View>
            {isEditing ? (
              <TextInput
                style={[styles.editTextInput, styles.editContentInput]}
                value={editedContent}
                onChangeText={setEditedContent}
                multiline
                placeholder="Inhoud bewerken..."
                placeholderTextColor={colors.textTertiary}
              />
            ) : (
              <Text style={styles.recapContent}>{displayContent}</Text>
            )}
          </View>

          {/* CTA */}
          {recap.suggested_cta ? (
            <View style={styles.ctaBox}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="hand-right-outline" size={15} color={colors.accent} />
                <Text style={styles.ctaLabel}>Suggested CTA</Text>
              </View>
              <Text style={styles.ctaText}>{recap.suggested_cta}</Text>
            </View>
          ) : null}

          {/* Selected photos preview */}
          {selectedPhotos.length > 0 && (
            <View style={styles.selectedPhotosBox}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="images-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.sectionTitle}>Bijgevoegde foto's ({selectedPhotos.length})</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedPhotoScroll}>
                {selectedPhotos.map((url) => (
                  <TouchableOpacity key={url} onPress={() => togglePhoto(url)}>
                    <Image source={{ uri: url }} style={styles.selectedPhotoImg} />
                    <View style={styles.removePhotoBtn}>
                      <Ionicons name="close-circle" size={18} color={colors.error} />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Share */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color={colors.primary} />
            <Text style={styles.shareBtnText}>Deel Recap</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  // Header
  header: {
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 4,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: 24,
  },
  headerEvent: {
    fontSize: fontSize.sm,
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  headerStats: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Section
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionLabelCount: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },

  // Format selector
  formatSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  formatOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 5,
  },
  formatOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
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

  // Language buttons
  langRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  langBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  langBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  langFlag: {
    fontSize: 18,
  },
  langLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  langLabelActive: {
    color: colors.primary,
  },
  cachedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },

  // Tone buttons
  toneRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toneBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  toneLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  toneLabelActive: {
    color: colors.primary,
  },

  // Photo picker
  photoScroll: {
    gap: spacing.sm,
    paddingVertical: 4,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  photoThumbSelected: {
    borderColor: colors.primary,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  photoCheckOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(109, 40, 217, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Generate button
  generateBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  generateBtnText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error + '12',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    flex: 1,
  },

  // Translating
  translatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  translatingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Recap result
  recapResult: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },

  // Recap toolbar
  recapToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolbarLangs: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  toolbarLangBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.background,
  },
  toolbarLangBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  toolbarLangFlag: {
    fontSize: 16,
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  editToggleBtnActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  editToggleText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
  },
  editToggleTextActive: {
    color: '#fff',
  },
  cancelEditBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cancelEditText: {
    fontSize: fontSize.xs,
    color: colors.error,
    fontWeight: fontWeight.medium,
  },

  // Recap content
  recapTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    lineHeight: 28,
  },
  teaserBox: {
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    gap: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  teaserLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  teaserText: {
    fontSize: fontSize.md,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  highlightsBox: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  highlightItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingLeft: spacing.sm,
    alignItems: 'flex-start',
  },
  highlightBulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 7,
    flexShrink: 0,
  },
  highlightText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  contentBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: spacing.xs,
  },
  recapContent: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 24,
    marginTop: spacing.xs,
  },

  // Edit inputs
  editTextInput: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
    borderWidth: 1.5,
    borderColor: colors.primary + '60',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    backgroundColor: colors.background,
    marginTop: 4,
  },
  editContentInput: {
    minHeight: 200,
    textAlignVertical: 'top',
  },

  // CTA
  ctaBox: {
    backgroundColor: colors.accent + '12',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: 6,
  },
  ctaLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.accent,
  },
  ctaText: {
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },

  // Selected photos
  selectedPhotosBox: {
    gap: spacing.sm,
  },
  selectedPhotoScroll: {
    flexDirection: 'row',
  },
  selectedPhotoImg: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: spacing.sm - 6,
    backgroundColor: '#fff',
    borderRadius: 10,
  },

  // Share
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  shareBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
