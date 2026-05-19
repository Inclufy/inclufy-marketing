// src/components/wizard/Step1Capture.tsx
// Step 1: pick a media source. 4 main sources + recent-events shortcut.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as PhImage, VideoCamera, Sparkle, CalendarCheck, ArrowRight } from 'phosphor-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight, brandGradient } from '../../theme';
import { useWizardState, type SourceType } from '../../hooks/useWizardState';
import { useEvents } from '../../hooks/useEvents';

const SOURCES: Array<{
  key: SourceType;
  label: string;
  desc: string;
  Icon: React.ComponentType<any>;
  color: string;
}> = [
  { key: 'camera',  label: 'Camera',      desc: 'Maak nu een foto',         Icon: Camera,      color: '#E8317A' },
  { key: 'library', label: 'Galerij',     desc: 'Kies uit je foto\'s',      Icon: PhImage,     color: '#3B82F6' },
  { key: 'video',   label: 'Video',       desc: 'Film of upload',           Icon: VideoCamera, color: '#8B5CF6' },
  { key: 'ai',      label: 'AI-generate', desc: 'Beschrijf wat je wil',     Icon: Sparkle,     color: '#F59E0B' },
];

export default function Step1Capture() {
  const { colors } = useTheme();
  const wiz = useWizardState();
  const { data: events = [] } = useEvents();
  const [loading, setLoading] = useState<SourceType | null>(null);

  const recentEvents = events.slice(0, 4);

  async function pickFrom(source: SourceType) {
    setLoading(source);
    try {
      let result: ImagePicker.ImagePickerResult | null = null;

      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Geen toegang', 'Geef de app toegang tot je camera via Instellingen.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.9,
        });
      } else if (source === 'library') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Geen toegang', 'Geef de app toegang tot je galerij via Instellingen.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.9,
        });
      } else if (source === 'video') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Geen toegang', 'Geef de app toegang tot je galerij via Instellingen.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          quality: 0.9,
        });
      } else if (source === 'ai') {
        Alert.alert('AI-generate', 'Komt binnenkort. Gebruik voor nu Camera of Galerij.');
        return;
      }

      if (!result || result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      wiz.setCapture({
        sourceType: source,
        mediaUri: asset.uri,
        mediaType: source === 'video' ? 'video' : 'photo',
      });
      // CRITICAL: clear any previously-baked URL when the source image
      // changes — otherwise Step5 ships the OLD baked overlay on the
      // NEW capture (regression of the overlay-bug the wizard exists
      // to fix). Caught by static QA agent.
      wiz.setEdit({ livePreviewUri: asset.uri, brandedImageUrl: null });
      wiz.next();
    } finally {
      setLoading(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Text style={{ fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text }}>
        Kies je bron
      </Text>
      <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm }}>
        Waar komt je content vandaan?
      </Text>

      {/* 2×2 source grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {SOURCES.map((s) => {
          const isLoading = loading === s.key;
          return (
            <TouchableOpacity
              key={s.key}
              onPress={() => pickFrom(s.key)}
              activeOpacity={0.8}
              disabled={loading !== null}
              style={{
                width: '48%',
                aspectRatio: 1,
                borderRadius: borderRadius.lg,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                justifyContent: 'space-between',
                opacity: loading !== null && !isLoading ? 0.4 : 1,
              }}
            >
              <View
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: s.color + '18',
                  justifyContent: 'center', alignItems: 'center',
                }}
              >
                {isLoading ? <ActivityIndicator color={s.color} /> : <s.Icon size={24} color={s.color} weight="duotone" />}
              </View>
              <View>
                <Text style={{ fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text }}>
                  {s.label}
                </Text>
                <Text style={{ fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 }}>
                  {s.desc}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Recent events shortcut */}
      {recentEvents.length > 0 && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md }}>
            <CalendarCheck size={16} color={colors.primary} weight="bold" />
            <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text }}>
              Of pak van je laatste event
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {recentEvents.map((e: any) => (
              <TouchableOpacity
                key={e.id}
                onPress={() => {
                  // Event source has no local media yet — user picks an event
                  // and Step2 surfaces "this event has no captures yet" or
                  // jumps to existing captures. Reset all previous state.
                  wiz.setCapture({ sourceType: 'event', eventId: e.id, mediaUri: null });
                  wiz.setEdit({ livePreviewUri: null, brandedImageUrl: null });
                  wiz.next();
                }}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: 10,
                  borderRadius: borderRadius.full,
                  backgroundColor: colors.primary + '12',
                  borderWidth: 1,
                  borderColor: colors.primary + '30',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.semibold }}>
                  {e.name ?? 'Event'}
                </Text>
                <ArrowRight size={12} color={colors.primary} weight="bold" />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
