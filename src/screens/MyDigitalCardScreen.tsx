// TODO: migrate to Phosphor — unmapped icons: MaterialCommunityIcons name=<dynamic: a.icon as any> | MaterialCommunityIcons name=<dynamic: editMode ? (hasChanges ? 'content-save' : 'check') : 'pencil'> | MaterialCommunityIcons name=<dynamic: icon as any> | MaterialCommunityIcons name=<dynamic: isShared(item.key) ? 'toggle-switch' : 'toggle-switch-off-outline'> | MaterialCommunityIcons name=<dynamic: item.icon as any> | MaterialCommunityIcons name=<dynamic: sp.icon>
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../services/supabase';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';
import { useTranslation } from '../i18n';
import { useTheme } from '../context/ThemeContext';

import { Buildings, XCircle } from 'phosphor-react-native';
// ─── Types ──────────────────────────────────────────────────────────
interface UserProfile {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  whatsapp?: string;
  tiktok?: string;
}

interface QRFields {
  share_email?: boolean;
  share_phone?: boolean;
  share_company?: boolean;
  share_title?: boolean;
  share_website?: boolean;
  share_linkedin?: boolean;
  share_instagram?: boolean;
  share_twitter?: boolean;
  share_facebook?: boolean;
  share_whatsapp?: boolean;
  share_tiktok?: boolean;
}

// ─── Social Platform Config ─────────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin' as const, color: '#0A66C2', placeholder: 'https://linkedin.com/in/jouwprofiel', prefix: 'https://linkedin.com/in/' },
  { key: 'instagram', label: 'Instagram', icon: 'instagram' as const, color: '#E1306C', placeholder: '@jouwhandle', prefix: '@' },
  { key: 'facebook', label: 'Facebook', icon: 'facebook' as const, color: '#1877F2', placeholder: 'https://facebook.com/jouwpagina', prefix: 'https://facebook.com/' },
  { key: 'twitter', label: 'X / Twitter', icon: 'twitter' as const, color: '#000000', placeholder: '@jouwhandle', prefix: '@' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' as const, color: '#25D366', placeholder: '+31 6 12345678', prefix: '+' },
  { key: 'tiktok', label: 'TikTok', icon: 'music-note' as const, color: '#000000', placeholder: '@jouwhandle', prefix: '@' },
];

// ─── vCard Builder ──────────────────────────────────────────────────
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
  if (profile.linkedin) lines.push(`URL;type=LinkedIn:${profile.linkedin.startsWith('http') ? profile.linkedin : `https://linkedin.com/in/${profile.linkedin}`}`);
  if (profile.instagram) lines.push(`URL;type=Instagram:https://instagram.com/${profile.instagram.replace('@', '')}`);
  if (profile.twitter) lines.push(`URL;type=Twitter:https://x.com/${profile.twitter.replace('@', '')}`);
  if (profile.facebook) lines.push(`URL;type=Facebook:${profile.facebook.startsWith('http') ? profile.facebook : `https://facebook.com/${profile.facebook}`}`);
  if (profile.whatsapp) lines.push(`TEL;type=WhatsApp:${profile.whatsapp}`);
  if (profile.tiktok) lines.push(`URL;type=TikTok:https://tiktok.com/@${profile.tiktok.replace('@', '')}`);
  lines.push('END:VCARD');
  return lines.join('\n');
}

// ─── Component ──────────────────────────────────────────────────────
export default function MyDigitalCardScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();

  const [profile, setProfile] = useState<UserProfile>({});
  const [qrFields, setQrFields] = useState<QRFields>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // ─── Load Profile ───────────────────────────────────────────────
  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } = {} as any } = await supabase.auth.getUser();
      if (!user) return;

      const { data: dbProfile } = await supabase
        .from('profiles')
        .select('full_name, email, phone, company, title, website, linkedin, instagram, twitter, facebook, whatsapp, tiktok, qr_fields')
        .eq('id', user.id)
        .maybeSingle();

      if (dbProfile?.full_name) {
        const nameParts = (dbProfile.full_name || '').split(' ');
        const qf = dbProfile.qr_fields ?? {};
        setQrFields(qf);
        setProfile({
          first_name: nameParts[0] ?? '',
          last_name: nameParts.slice(1).join(' ') ?? '',
          email: dbProfile.email ?? user.email ?? '',
          phone: dbProfile.phone ?? '',
          company: dbProfile.company ?? '',
          title: dbProfile.title ?? '',
          website: dbProfile.website ?? '',
          linkedin: dbProfile.linkedin ?? '',
          instagram: dbProfile.instagram ?? '',
          twitter: dbProfile.twitter ?? '',
          facebook: dbProfile.facebook ?? '',
          whatsapp: dbProfile.whatsapp ?? '',
          tiktok: (dbProfile as any).tiktok ?? '',
        });
      } else {
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
        setEditMode(true); // Auto-open edit for new users
      }
    } catch (e) {
      console.error('Profile load error', e);
    } finally {
      setLoading(false);
    }
  };

  // ─── Save Profile ───────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } = {} as any } = await supabase.auth.getUser();
      if (!user) return;

      const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
      await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        email: profile.email,
        phone: profile.phone,
        company: profile.company,
        title: profile.title,
        website: profile.website,
        linkedin: profile.linkedin,
        instagram: profile.instagram,
        twitter: profile.twitter,
        facebook: profile.facebook,
        whatsapp: profile.whatsapp,
        tiktok: profile.tiktok,
        qr_fields: qrFields,
        updated_at: new Date().toISOString(),
      });

      setEditMode(false);
      setHasChanges(false);
      Alert.alert('✅ Opgeslagen', 'Je profiel is bijgewerkt.');
    } catch (e: any) {
      Alert.alert('Fout', e?.message ?? 'Opslaan mislukt.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────
  const updateField = (key: string, value: string) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleQrField = (key: string) => {
    const fieldKey = `share_${key}` as keyof QRFields;
    setQrFields(prev => ({ ...prev, [fieldKey]: prev[fieldKey] === false ? true : false }));
    setHasChanges(true);
  };

  const isShared = (key: string): boolean => {
    const fieldKey = `share_${key}` as keyof QRFields;
    return qrFields[fieldKey] !== false;
  };

  const vcard = buildVCard(profile);
  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Je naam';

  const handleShare = async () => {
    try { await Share.share({ message: vcard, title: `Contact: ${displayName}` }); } catch {}
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(profile.email ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Render Field ───────────────────────────────────────────────
  const renderField = (icon: string, label: string, key: string, placeholder: string, keyboard?: any) => {
    const value = (profile as any)[key] ?? '';
    if (!editMode && !value) return null;
    return (
      <View key={key} style={{ marginBottom: spacing.sm }}>
        <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4, fontWeight: fontWeight.medium }}>{label}</Text>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: editMode ? colors.surface : 'transparent',
          borderRadius: borderRadius.md,
          borderWidth: editMode ? 1 : 0,
          borderColor: colors.border,
          paddingHorizontal: editMode ? spacing.sm : 0,
          paddingVertical: editMode ? 8 : 2,
        }}>
          <MaterialCommunityIcons name={icon as any} size={18} color={colors.textSecondary} />
          {editMode ? (
            <TextInput
              style={{ flex: 1, fontSize: fontSize.sm, color: colors.text }}
              value={value}
              onChangeText={(v) => updateField(key, v)}
              placeholder={placeholder}
              placeholderTextColor={colors.textTertiary}
              keyboardType={keyboard ?? 'default'}
              autoCapitalize="none"
            />
          ) : (
            <Text style={{ fontSize: fontSize.sm, color: colors.text }}>{value}</Text>
          )}
        </View>
      </View>
    );
  };

  // ─── Loading ────────────────────────────────────────────────────
  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* ── Card Preview ────────────────────────────────────────── */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: borderRadius.xl,
          overflow: 'hidden', marginBottom: spacing.lg, ...subtleShadow,
        }}>
          <View style={{ height: 6, backgroundColor: colors.primary }} />
          <View style={{ padding: spacing.lg, alignItems: 'center' }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: colors.primary + '18',
              justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
            }}>
              <Text style={{ fontSize: 26, fontWeight: fontWeight.bold, color: colors.primary }}>
                {((profile.first_name?.[0] ?? '') + (profile.last_name?.[0] ?? '')).toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={{ fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: 4 }}>{displayName}</Text>
            {profile.title ? <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 2 }}>{profile.title}</Text> : null}
            {profile.company ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <Buildings size={13} color={colors.textTertiary} weight="duotone" />
                <Text style={{ fontSize: fontSize.sm, color: colors.textSecondary }}>{profile.company}</Text>
              </View>
            ) : null}

            {/* Social Media Badges */}
            {!editMode && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
                {SOCIAL_PLATFORMS.map(sp => {
                  const val = (profile as any)[sp.key];
                  if (!val) return null;
                  return (
                    <TouchableOpacity
                      key={sp.key}
                      style={{
                        width: 36, height: 36, borderRadius: 12,
                        backgroundColor: sp.color + '18',
                        justifyContent: 'center', alignItems: 'center',
                      }}
                      onPress={() => {
                        const url = sp.key === 'whatsapp'
                          ? `https://wa.me/${val.replace(/[^0-9+]/g, '')}`
                          : sp.key === 'instagram' ? `https://instagram.com/${val.replace('@', '')}`
                          : sp.key === 'twitter' ? `https://x.com/${val.replace('@', '')}`
                          : sp.key === 'tiktok' ? `https://tiktok.com/@${val.replace('@', '')}`
                          : val.startsWith('http') ? val : `https://${val}`;
                        Linking.openURL(url).catch(() => {});
                      }}
                    >
                      <MaterialCommunityIcons name={sp.icon} size={18} color={sp.color} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* ── Edit / View Toggle ──────────────────────────────────── */}
        <TouchableOpacity
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: spacing.sm, marginBottom: spacing.md,
            backgroundColor: editMode ? colors.primary + '10' : colors.surface,
            borderRadius: borderRadius.lg, borderWidth: 1,
            borderColor: editMode ? colors.primary : colors.border,
          }}
          onPress={() => {
            if (editMode && hasChanges) {
              saveProfile();
            } else {
              setEditMode(!editMode);
            }
          }}
        >
          <MaterialCommunityIcons
            name={editMode ? (hasChanges ? 'content-save' : 'check') : 'pencil'}
            size={18}
            color={editMode ? colors.primary : colors.text}
          />
          <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: editMode ? colors.primary : colors.text }}>
            {editMode ? (hasChanges ? 'Opslaan' : 'Klaar') : 'Profiel bewerken'}
          </Text>
          {saving && <ActivityIndicator size="small" color={colors.primary} />}
        </TouchableOpacity>

        {/* ── Contact Info Section ─────────────────────────────────── */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: borderRadius.lg,
          padding: spacing.md, marginBottom: spacing.md,
          borderWidth: 1, borderColor: colors.border, ...subtleShadow,
        }}>
          <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm }}>
            Contactgegevens
          </Text>

          {editMode && (
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Voornaam</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surface, borderRadius: borderRadius.md,
                    borderWidth: 1, borderColor: colors.border,
                    paddingHorizontal: spacing.sm, paddingVertical: 8,
                    fontSize: fontSize.sm, color: colors.text,
                  }}
                  value={profile.first_name ?? ''}
                  onChangeText={v => updateField('first_name', v)}
                  placeholder="Jan"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Achternaam</Text>
                <TextInput
                  style={{
                    backgroundColor: colors.surface, borderRadius: borderRadius.md,
                    borderWidth: 1, borderColor: colors.border,
                    paddingHorizontal: spacing.sm, paddingVertical: 8,
                    fontSize: fontSize.sm, color: colors.text,
                  }}
                  value={profile.last_name ?? ''}
                  onChangeText={v => updateField('last_name', v)}
                  placeholder="Jansen"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
          )}

          {renderField('email-outline', 'E-mail', 'email', 'jan@bedrijf.nl', 'email-address')}
          {renderField('phone-outline', 'Telefoon', 'phone', '+31 6 12345678', 'phone-pad')}
          {renderField('office-building-outline', 'Bedrijf', 'company', 'Inclufy B.V.')}
          {renderField('badge-account-horizontal-outline', 'Functie', 'title', 'Marketing Manager')}
          {renderField('web', 'Website', 'website', 'www.inclufy.com', 'url')}
        </View>

        {/* ── Social Media Section ─────────────────────────────────── */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: borderRadius.lg,
          padding: spacing.md, marginBottom: spacing.md,
          borderWidth: 1, borderColor: colors.border, ...subtleShadow,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text }}>
              Social Media
            </Text>
            {!editMode && (
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                {SOCIAL_PLATFORMS.filter(sp => (profile as any)[sp.key]).length} verbonden
              </Text>
            )}
          </View>

          {SOCIAL_PLATFORMS.map(sp => {
            const value = (profile as any)[sp.key] ?? '';
            if (!editMode && !value) return null;
            return (
              <View key={sp.key} style={{ marginBottom: spacing.sm }}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                  backgroundColor: editMode ? colors.background : 'transparent',
                  borderRadius: borderRadius.md,
                  borderWidth: editMode ? 1 : 0,
                  borderColor: value ? sp.color + '40' : colors.border,
                  paddingHorizontal: editMode ? spacing.sm : 0,
                  paddingVertical: editMode ? 10 : 4,
                }}>
                  <View style={{
                    width: 32, height: 32, borderRadius: 10,
                    backgroundColor: sp.color + '15',
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    <MaterialCommunityIcons name={sp.icon} size={18} color={sp.color} />
                  </View>

                  {editMode ? (
                    <TextInput
                      style={{ flex: 1, fontSize: fontSize.sm, color: colors.text }}
                      value={value}
                      onChangeText={v => updateField(sp.key, v)}
                      placeholder={sp.placeholder}
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType={sp.key === 'whatsapp' ? 'phone-pad' : 'url'}
                    />
                  ) : (
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 1 }}>{sp.label}</Text>
                      <Text style={{ fontSize: fontSize.sm, color: colors.text }}>{value}</Text>
                    </View>
                  )}

                  {editMode && value ? (
                    <TouchableOpacity onPress={() => updateField(sp.key, '')}>
                      <XCircle size={18} color={colors.textTertiary} weight="fill" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}

          {editMode && (
            <Text style={{ fontSize: 10, color: colors.textSecondary, fontStyle: 'italic', marginTop: 4 }}>
              Tip: Vul je social media in om ze te tonen op je QR visitekaartje en te gebruiken bij het publiceren van content.
            </Text>
          )}
        </View>

        {/* ── QR Code Visibility Toggles ───────────────────────────── */}
        {editMode && (
          <View style={{
            backgroundColor: colors.surface, borderRadius: borderRadius.lg,
            padding: spacing.md, marginBottom: spacing.md,
            borderWidth: 1, borderColor: colors.border, ...subtleShadow,
          }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.sm }}>
              Delen via QR-code
            </Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: spacing.sm }}>
              Kies welke info zichtbaar is wanneer iemand je QR-code scant
            </Text>
            {[
              { key: 'email', label: 'E-mail', icon: 'email-outline' },
              { key: 'phone', label: 'Telefoon', icon: 'phone-outline' },
              { key: 'company', label: 'Bedrijf', icon: 'office-building-outline' },
              { key: 'website', label: 'Website', icon: 'web' },
              { key: 'linkedin', label: 'LinkedIn', icon: 'linkedin' },
              { key: 'instagram', label: 'Instagram', icon: 'instagram' },
              { key: 'facebook', label: 'Facebook', icon: 'facebook' },
              { key: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
            ].map(item => (
              <TouchableOpacity
                key={item.key}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: 10,
                  borderBottomWidth: 1, borderBottomColor: colors.border + '40',
                }}
                onPress={() => toggleQrField(item.key)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <MaterialCommunityIcons name={item.icon as any} size={18} color={colors.textSecondary} />
                  <Text style={{ fontSize: fontSize.sm, color: colors.text }}>{item.label}</Text>
                </View>
                <MaterialCommunityIcons
                  name={isShared(item.key) ? 'toggle-switch' : 'toggle-switch-off-outline'}
                  size={36}
                  color={isShared(item.key) ? colors.primary : colors.textTertiary}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── QR Code ─────────────────────────────────────────────── */}
        {!editMode && (
          <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
            <Text style={{ fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.md }}>
              Scan om contact toe te voegen
            </Text>
            <View style={{
              backgroundColor: '#fff', padding: spacing.lg, borderRadius: borderRadius.xl,
              ...subtleShadow, marginBottom: spacing.sm,
            }}>
              <QRCode
                value={vcard || 'BEGIN:VCARD\nVERSION:3.0\nFN:Inclufy User\nEND:VCARD'}
                size={200}
                color={colors.text}
                backgroundColor="#fff"
              />
            </View>
            <Text style={{ fontSize: fontSize.xs, color: colors.textTertiary, textAlign: 'center', maxWidth: 260 }}>
              Scan met AMOS by Inclufy of een andere QR-app
            </Text>
          </View>
        )}

        {/* ── Action Buttons ──────────────────────────────────────── */}
        {!editMode && (
          <View style={{
            flexDirection: 'row', justifyContent: 'space-around',
            backgroundColor: colors.surface, borderRadius: borderRadius.xl,
            padding: spacing.md, marginBottom: spacing.md, ...subtleShadow,
          }}>
            {[
              { id: 'share', icon: 'share-variant', label: 'Delen', color: colors.primary, onPress: handleShare },
              { id: 'copy', icon: copied ? 'check-circle' : 'content-copy', label: copied ? 'Gekopieerd!' : 'Kopieer email', color: copied ? '#10B981' : '#3B82F6', onPress: handleCopy },
              { id: 'nfc', icon: 'nfc-variant', label: 'NFC delen', color: '#0077B5', onPress: () => (navigation as any).navigate('NFCShare') },
            ].map(a => (
              <TouchableOpacity key={a.id} style={{ alignItems: 'center', gap: spacing.xs }} onPress={a.onPress} activeOpacity={0.8}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: a.color + '18', justifyContent: 'center', alignItems: 'center' }}>
                  <MaterialCommunityIcons name={a.icon as any} size={22} color={a.color} />
                </View>
                <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: a.color }}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
