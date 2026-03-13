import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useTranslation } from '../i18n';
import { useContacts } from '../hooks/useContacts';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const INVITE_MESSAGE =
  "Hi! I'd like to connect with you on Inclufy GO. Scan my digital card or download the app: https://inclufy.com/connect";

const CAPTURE_MODES = [
  {
    id: 'qr',
    icon: 'qr-code',
    iconLib: 'Ionicons',
    color: '#9333EA',
    bg: '#F3E8FF',
    route: 'QRScan' as const,
  },
  {
    id: 'card',
    icon: 'card-account-details-outline',
    iconLib: 'MaterialCommunityIcons',
    color: '#DB2777',
    bg: '#FCE7F3',
    route: 'CardScan' as const,
  },
  {
    id: 'nfc',
    icon: 'contactless-payment',
    iconLib: 'MaterialCommunityIcons',
    color: '#0077b5',
    bg: '#E0F2FE',
    route: 'NFCShare' as const,
  },
  {
    id: 'manual',
    icon: 'person-add-outline',
    iconLib: 'Ionicons',
    color: '#10b981',
    bg: '#D1FAE5',
    route: 'LeadCapture' as const,
  },
] as const;

export default function SmartLeadScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { data: contacts = [] } = useContacts();

  const recentContacts = contacts.slice(0, 5);

  const handleCapture = (route: string) => {
    navigation.navigate(route as any);
  };

  const handleSendInvite = async () => {
    try {
      await Share.share({
        message: INVITE_MESSAGE,
        url: 'https://inclufy.com/connect',
        title: 'Connect on Inclufy GO',
      });
    } catch (err: any) {
      Alert.alert('Could not share', err?.message ?? 'Something went wrong.');
    }
  };

  const handleWhatsApp = async () => {
    const encoded = encodeURIComponent(INVITE_MESSAGE);
    const url = `whatsapp://send?text=${encoded}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      // Fall back to web WhatsApp
      await Linking.openURL(`https://wa.me/?text=${encoded}`);
    }
  };

  const modeLabels: Record<string, { title: string; subtitle: string }> = {
    qr: { title: t.smartLead?.qrScan ?? 'Scan QR', subtitle: t.smartLead?.qrScanSub ?? 'Scan someone\'s QR code instantly' },
    card: { title: t.smartLead?.cardScan ?? 'Scan Business Card', subtitle: t.smartLead?.cardScanSub ?? 'AI reads card details automatically' },
    nfc: { title: t.smartLead?.nfc ?? 'NFC Tap', subtitle: t.smartLead?.nfcSub ?? 'Tap phones to exchange instantly' },
    manual: { title: t.smartLead?.manual ?? 'Manual Entry', subtitle: t.smartLead?.manualSub ?? 'Type contact details' },
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* My Digital Card Banner */}
      <TouchableOpacity
        style={styles.myCardBanner}
        onPress={() => navigation.navigate('MyDigitalCard')}
        activeOpacity={0.85}
      >
        <View style={styles.myCardLeft}>
          <View style={styles.myCardIconWrap}>
            <MaterialCommunityIcons name="card-account-details" size={22} color="#fff" />
          </View>
          <View>
            <Text style={styles.myCardTitle}>{t.smartLead?.myCard ?? 'My Digital Card'}</Text>
            <Text style={styles.myCardSub}>{t.smartLead?.myCardSub ?? 'Share your contact & QR code'}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
      </TouchableOpacity>

      {/* Send Invitation Row */}
      <View style={styles.inviteRow}>
        <TouchableOpacity style={styles.inviteBtn} onPress={handleSendInvite} activeOpacity={0.8}>
          <Ionicons name="mail-outline" size={18} color="#DB2777" />
          <Text style={[styles.inviteBtnText, { color: '#DB2777' }]}>
            {t.smartLead?.sendInvite ?? 'Send Invite'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.inviteBtn} onPress={handleWhatsApp} activeOpacity={0.8}>
          <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          <Text style={[styles.inviteBtnText, { color: '#25D366' }]}>
            {t.smartLead?.whatsapp ?? 'WhatsApp'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Section: Capture Modes */}
        <Text style={styles.sectionLabel}>{t.smartLead?.captureMode ?? 'Choose capture method'}</Text>

        <View style={styles.grid}>
          {CAPTURE_MODES.map((mode) => {
            const label = modeLabels[mode.id];
            const IconComp = mode.iconLib === 'Ionicons' ? Ionicons : MaterialCommunityIcons;
            return (
              <TouchableOpacity
                key={mode.id}
                style={[styles.card, { borderColor: mode.bg }]}
                onPress={() => handleCapture(mode.route)}
                activeOpacity={0.8}
              >
                <View style={[styles.cardIcon, { backgroundColor: mode.bg }]}>
                  <IconComp name={mode.icon as any} size={28} color={mode.color} />
                </View>
                <Text style={styles.cardTitle}>{label.title}</Text>
                <Text style={styles.cardSub}>{label.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Section: Recent Contacts */}
        {recentContacts.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>
              {t.smartLead?.recent ?? 'Recent contacts'}
            </Text>
            {recentContacts.map((c) => (
              <View key={c.id} style={styles.contactRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {((c.first_name?.[0] ?? '') + (c.last_name?.[0] ?? '')).toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    {[c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || 'Unknown'}
                  </Text>
                  {c.attributes?.company ? (
                    <Text style={styles.contactSub}>{String(c.attributes.company)}</Text>
                  ) : c.email ? (
                    <Text style={styles.contactSub}>{c.email}</Text>
                  ) : null}
                </View>
                <View style={[styles.sourceBadge, { backgroundColor: '#F3E8FF' }]}>
                  <Text style={[styles.sourceText, { color: colors.primary }]}>
                    {c.source ?? 'lead'}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  myCardBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  myCardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  myCardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  myCardTitle: { color: '#fff', fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  myCardSub: { color: 'rgba(255,255,255,0.75)', fontSize: fontSize.xs, marginTop: 2 },

  // Invite row
  inviteRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  inviteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border ?? '#E5E7EB',
    backgroundColor: colors.surface,
  },
  inviteBtnText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  scroll: { padding: spacing.md },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: 4 },
  cardSub: { fontSize: fontSize.xs, color: colors.textSecondary, lineHeight: 16 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  contactInfo: { flex: 1 },
  contactName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text },
  contactSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  sourceBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  sourceText: { fontSize: 10, fontWeight: fontWeight.semibold, textTransform: 'capitalize' },
});
