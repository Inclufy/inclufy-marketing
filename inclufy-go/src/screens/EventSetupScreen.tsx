import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEvent, useCreateEvent, useUpdateEvent } from '../hooks/useEvents';
import { useBrandKits } from '../hooks/useBrandMemory';
import type { RootStackParamList, Channel, EventInsert } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { CAPTURE_TAG_PRESETS } from '../types';
import { useTranslation } from '../i18n';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EventSetup'>;

const CHANNELS: { key: Channel; label: string; color: string }[] = [
  { key: 'linkedin', label: 'LinkedIn', color: colors.linkedin },
  { key: 'instagram', label: 'Instagram', color: colors.instagram },
  { key: 'x', label: 'X / Twitter', color: colors.x },
  { key: 'facebook', label: 'Facebook', color: colors.facebook },
];

export default function EventSetupScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const eventId = route.params?.eventId;
  const isEditing = !!eventId;

  const { data: existingEvent } = useEvent(eventId);
  const { data: brandKits = [] } = useBrandKits();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>(['linkedin', 'instagram']);
  const [hashtags, setHashtags] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedBrandKit, setSelectedBrandKit] = useState<string | null>(null);

  // Pre-fill when editing
  useEffect(() => {
    if (existingEvent) {
      setName(existingEvent.name);
      setDescription(existingEvent.description);
      setLocation(existingEvent.location);
      setEventDate(existingEvent.event_date);
      setSelectedChannels(existingEvent.channels);
      setHashtags(existingEvent.hashtags.join(', '));
      setSelectedTags(existingEvent.default_tags);
      setSelectedBrandKit(existingEvent.brand_kit_id);
    }
  }, [existingEvent]);

  const toggleChannel = (ch: Channel) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t.eventSetup.fillEventName);
      return;
    }
    if (!eventDate.trim()) {
      Alert.alert(t.eventSetup.fillDate);
      return;
    }
    if (selectedChannels.length === 0) {
      Alert.alert(t.eventSetup.selectChannel);
      return;
    }

    const input: EventInsert = {
      name: name.trim(),
      description: description.trim(),
      location: location.trim(),
      event_date: eventDate.trim(),
      event_start_time: null,
      event_end_time: null,
      channels: selectedChannels,
      hashtags: hashtags.split(',').map((h) => h.trim()).filter(Boolean),
      default_tags: selectedTags,
      goals: [],
      brand_kit_id: selectedBrandKit,
      status: 'upcoming',
      cover_image_url: null,
      settings: {},
    };

    try {
      if (isEditing && eventId) {
        await updateEvent.mutateAsync({ id: eventId, ...input });
      } else {
        await createEvent.mutateAsync(input);
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(t.common.error, error.message || t.eventSetup.saveError);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Event Name */}
      <Text style={styles.label}>{t.eventSetup.eventName}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder={t.eventSetup.eventNamePlaceholder}
        placeholderTextColor={colors.textTertiary}
      />

      {/* Date */}
      <Text style={styles.label}>{t.eventSetup.date}</Text>
      <TextInput
        style={styles.input}
        value={eventDate}
        onChangeText={setEventDate}
        placeholder="2026-03-15"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Location */}
      <Text style={styles.label}>{t.eventSetup.location}</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder={t.eventSetup.locationPlaceholder}
        placeholderTextColor={colors.textTertiary}
      />

      {/* Description */}
      <Text style={styles.label}>{t.eventSetup.description}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        placeholder={t.eventSetup.descriptionPlaceholder}
        placeholderTextColor={colors.textTertiary}
        multiline
        numberOfLines={3}
      />

      {/* Channels */}
      <Text style={styles.label}>{t.eventSetup.channels}</Text>
      <View style={styles.chipRow}>
        {CHANNELS.map((ch) => {
          const selected = selectedChannels.includes(ch.key);
          return (
            <TouchableOpacity
              key={ch.key}
              style={[
                styles.chip,
                selected && { backgroundColor: ch.color + '20', borderColor: ch.color },
              ]}
              onPress={() => toggleChannel(ch.key)}
            >
              <Text style={[styles.chipText, selected && { color: ch.color }]}>{ch.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hashtags */}
      <Text style={styles.label}>{t.eventSetup.hashtags}</Text>
      <TextInput
        style={styles.input}
        value={hashtags}
        onChangeText={setHashtags}
        placeholder="#TechSummit, #AIMarketing, #Inclufy"
        placeholderTextColor={colors.textTertiary}
      />

      {/* Default Tags */}
      <Text style={styles.label}>{t.eventSetup.defaultTags}</Text>
      <View style={styles.chipRow}>
        {CAPTURE_TAG_PRESETS.map((tag) => {
          const selected = selectedTags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{tag}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Brand Kit */}
      {brandKits.length > 0 && (
        <>
          <Text style={styles.label}>{t.eventSetup.brandKit}</Text>
          <View style={styles.chipRow}>
            {brandKits.map((kit: any) => {
              const selected = selectedBrandKit === kit.id;
              return (
                <TouchableOpacity
                  key={kit.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setSelectedBrandKit(selected ? null : kit.id)}
                >
                  <View
                    style={[styles.colorDot, { backgroundColor: kit.primary_color }]}
                  />
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {kit.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, (createEvent.isPending || updateEvent.isPending) && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={createEvent.isPending || updateEvent.isPending}
      >
        <Text style={styles.saveButtonText}>
          {isEditing ? t.eventSetup.updateEvent : t.eventSetup.createEvent}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 60 },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.md,
    color: colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.medium,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
});
