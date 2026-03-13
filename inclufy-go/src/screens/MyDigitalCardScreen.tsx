import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useTranslation } from '../i18n';

interface UserProfile {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
}

function buildVCard(profile: UserProfile): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${[profile.first_name, profile.last_name].filter(Boolean).join(' ')}`,
    `N:${profile.last_name ?? ''};${profile.first_name ?? ''};;;`,
  ];
  if (profile.email) lines.push(`EMAIL:${profile.email}`);
  if (profile.phone) lines.push(`TEL:${profile.phone}`);
  if (profile.company) lines.push(`ORG:${profile.company}`);
  if (profile.title) lines.push(`TITLE:${profile.title}`);
  if (profile.website) lines.push(`URL:${profile.website}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

export default function MyDigitalCardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const meta = user.user_metadata ?? {};
        setProfile({
          first_name: meta.first_name ?? meta.full_name?.split(' ')[0] ?? '',
          last_name: meta.last_name ?? meta.full_name?.split(' ').slice(1).join(' ') ?? '',
          email: user.email ?? '',
          phone: meta.phone ?? '',
          company: meta.company ?? '',
          title: meta.title ?? '',
          website: meta.website ?? '',
        });
      }
    } catch (e) {
      console.error('Profile load error', e);
    } finally {
      setLoading(false);
    }
  };

  const vcard = buildVCard(profile);
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Your Name';

  const handleShare = async () => {
    try {
      await Share.share({
        message: vcard,
        title: `Contact: ${displayName}`,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not share contact');
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(profile.email ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const actions = [
    {
      id: 'share',
      icon: 'share-social-outline',
      label: t.myCard?.share ?? 'Share',
      color: colors.primary,
      onPress: handleShare,
    },
    {
      id: 'copy',
      icon: copied ? 'checkmark-circle' : 'copy-outline',
      label: copied ? (t.myCard?.copied ?? 'Copied!') : (t.myCard?.copyEmail ?? 'Copy email'),
      color: copied ? colors.success : colors.info,
      onPress: handleCopy,
    },
    {
      id: 'nfc',
      icon: 'radio-outline',
      label: t.myCard?.nfc ?? 'NFC share',
      color: '#0077b5',
      onPress: () => (navigation as any).navigate('NFCShare'),
    },
  ];

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Card Preview */}
      <View style={styles.card}>
        <View style={styles.cardGradientBar} />
        <View style={styles.cardBody}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {((profile.first_name?.[0] ?? '') + (profile.last_name?.[0] ?? '')).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {profile.title ? <Text style={styles.title}>{profile.title}</Text> : null}
          {profile.company ? (
            <View style={styles.companyRow}>
              <Ionicons name="business-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.company}>{profile.company}</Text>
            </View>
          ) : null}
          {profile.email ? (
            <View style={styles.companyRow}>
              <Ionicons name="mail-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.company}>{profile.email}</Text>
            </View>
          ) : null}
          {profile.phone ? (
            <View style={styles.companyRow}>
              <Ionicons name="call-outline" size={13} color={colors.textTertiary} />
              <Text style={styles.company}>{profile.phone}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* QR Code */}
      <View style={styles.qrWrap}>
        <Text style={styles.qrLabel}>{t.myCard?.qrLabel ?? 'Scan to add contact'}</Text>
        <View style={styles.qrBox}>
          <QRCode
            value={vcard || 'BEGIN:VCARD\nVERSION:3.0\nFN:Inclufy User\nEND:VCARD'}
            size={200}
            color={colors.text}
            backgroundColor="#fff"
          />
        </View>
        <Text style={styles.qrHint}>{t.myCard?.qrHint ?? 'Others can scan this with Inclufy GO or any QR app'}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {actions.map((a) => (
          <TouchableOpacity key={a.id} style={styles.actionBtn} onPress={a.onPress} activeOpacity={0.8}>
            <View style={[styles.actionIcon, { backgroundColor: a.color + '20' }]}>
              <Ionicons name={a.icon as any} size={22} color={a.color} />
            </View>
            <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Edit hint */}
      <TouchableOpacity style={styles.editHint} onPress={() => (navigation as any).navigate('Settings')}>
        <Ionicons name="create-outline" size={16} color={colors.textTertiary} />
        <Text style={styles.editHintText}>{t.myCard?.editInSettings ?? 'Edit your info in Settings'}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: spacing.lg,
  },
  cardGradientBar: {
    height: 6,
    backgroundColor: colors.primary,
  },
  cardBody: { padding: spacing.lg, alignItems: 'center' },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 26, fontWeight: fontWeight.bold, color: colors.primary },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: 4 },
  title: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  company: { fontSize: fontSize.sm, color: colors.textSecondary },
  qrWrap: { alignItems: 'center', marginBottom: spacing.lg },
  qrLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.md },
  qrBox: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: spacing.sm,
  },
  qrHint: { fontSize: fontSize.xs, color: colors.textTertiary, textAlign: 'center', maxWidth: 260 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  actionBtn: { alignItems: 'center', gap: spacing.xs },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  actionLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  editHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    opacity: 0.7,
    paddingVertical: spacing.sm,
  },
  editHintText: { fontSize: fontSize.xs, color: colors.textTertiary },
});
