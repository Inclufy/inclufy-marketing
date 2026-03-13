import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import { supabase } from '../services/supabase';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useTranslation } from '../i18n';
import { useCreateContact } from '../hooks/useContacts';

type NFCMode = 'idle' | 'sharing' | 'receiving' | 'success' | 'error' | 'unsupported';

export default function NFCShareScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [mode, setMode] = useState<NFCMode>('idle');
  const [nfcSupported, setNfcSupported] = useState<boolean | null>(null);
  const [myVCard, setMyVCard] = useState('');
  const createContact = useCreateContact();

  useEffect(() => {
    initNFC();
    loadMyCard();
    return () => { NfcManager.cancelTechnologyRequest().catch(() => {}); };
  }, []);

  const initNFC = async () => {
    try {
      const supported = await NfcManager.isSupported();
      setNfcSupported(supported);
      if (supported) await NfcManager.start();
    } catch {
      setNfcSupported(false);
    }
  };

  const loadMyCard = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const meta = user.user_metadata ?? {};
        const lines = [
          'BEGIN:VCARD', 'VERSION:3.0',
          `FN:${[meta.first_name, meta.last_name].filter(Boolean).join(' ') || 'Inclufy User'}`,
        ];
        if (user.email) lines.push(`EMAIL:${user.email}`);
        if (meta.phone) lines.push(`TEL:${meta.phone}`);
        if (meta.company) lines.push(`ORG:${meta.company}`);
        lines.push('END:VCARD');
        setMyVCard(lines.join('\n'));
      }
    } catch {}
  };

  const handleShare = async () => {
    if (!nfcSupported) { Alert.alert('NFC not supported', 'Your device does not support NFC.'); return; }
    setMode('sharing');
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const bytes = Ndef.encodeMessage([Ndef.textRecord(myVCard)]);
      if (bytes) await NfcManager.ndefHandler.writeNdefMessage(bytes);
      setMode('success');
      setTimeout(() => setMode('idle'), 3000);
    } catch (e: any) {
      if (e.message !== 'cancelled') setMode('error');
      else setMode('idle');
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  };

  const handleReceive = async () => {
    if (!nfcSupported) { Alert.alert('NFC not supported', 'Your device does not support NFC.'); return; }
    setMode('receiving');
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      const records = tag?.ndefMessage ?? [];
      for (const record of records) {
        const text = Ndef.text.decodePayload(record.payload as unknown as Uint8Array);
        if (text?.startsWith('BEGIN:VCARD')) {
          const lines = text.split('\n');
          const get = (prefix: string) => lines.find(l => l.toUpperCase().startsWith(prefix))?.split(':').slice(1).join(':').trim();
          const fn = get('FN:') ?? '';
          const email = get('EMAIL') ?? '';
          const phone = get('TEL') ?? '';
          const org = get('ORG:') ?? '';
          const nameParts = fn.split(' ');
          await createContact.mutateAsync({
            first_name: nameParts[0] || null,
            last_name: nameParts.slice(1).join(' ') || null,
            email: email || null,
            phone: phone || null,
            source: 'nfc',
            tags: ['nfc-tap'],
            attributes: { company: org || undefined, captured_via: 'nfc' },
          });
          setMode('success');
          setTimeout(() => navigation.goBack(), 2500);
          return;
        }
      }
      setMode('error');
    } catch (e: any) {
      if (e.message !== 'cancelled') setMode('error');
      else setMode('idle');
    } finally {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  };

  const cancel = () => {
    NfcManager.cancelTechnologyRequest().catch(() => {});
    setMode('idle');
  };

  // Unsupported
  if (nfcSupported === false) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="nfc-off" size={64} color={colors.textTertiary} />
        <Text style={styles.unsupportedTitle}>{t.nfc?.unsupported ?? 'NFC not supported'}</Text>
        <Text style={styles.unsupportedSub}>{t.nfc?.unsupportedSub ?? 'Your device does not support NFC tap-to-share.'}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>{t.common?.goBack ?? 'Go back'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Animated ring indicator */}
      <View style={styles.nfcZone}>
        <View style={[styles.ring, styles.ring3, mode === 'sharing' || mode === 'receiving' ? styles.ringActive : {}]} />
        <View style={[styles.ring, styles.ring2, mode === 'sharing' || mode === 'receiving' ? styles.ringActive : {}]} />
        <View style={[styles.ring, styles.ring1]} />
        <View style={styles.nfcIconWrap}>
          {mode === 'success' ? (
            <Ionicons name="checkmark-circle" size={52} color={colors.success} />
          ) : mode === 'error' ? (
            <Ionicons name="close-circle" size={52} color={colors.error} />
          ) : (
            <MaterialCommunityIcons
              name="contactless-payment"
              size={52}
              color={mode === 'sharing' || mode === 'receiving' ? colors.primary : colors.textTertiary}
            />
          )}
        </View>
      </View>

      {/* Status text */}
      <Text style={styles.statusTitle}>
        {mode === 'idle' ? (t.nfc?.title ?? 'NFC Contact Exchange') :
         mode === 'sharing' ? (t.nfc?.sharing ?? 'Hold phones together...') :
         mode === 'receiving' ? (t.nfc?.receiving ?? 'Waiting for contact...') :
         mode === 'success' ? (t.nfc?.success ?? 'Contact exchanged!') :
         (t.nfc?.error ?? 'Something went wrong')}
      </Text>
      <Text style={styles.statusSub}>
        {mode === 'idle' ? (t.nfc?.sub ?? 'Share your contact or receive from another device') :
         mode === 'sharing' ? (t.nfc?.sharingSub ?? 'Bring your phones close together \u2014 back to back') :
         mode === 'receiving' ? (t.nfc?.receivingSub ?? 'Bring phones close together to receive') :
         mode === 'success' ? (t.nfc?.successSub ?? 'Contact saved successfully') :
         (t.nfc?.errorSub ?? 'Try again or use QR code instead')}
      </Text>

      {/* Actions */}
      {(mode === 'idle' || mode === 'error') && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
            <MaterialCommunityIcons name="contactless-payment" size={22} color="#fff" />
            <Text style={styles.shareBtnText}>{t.nfc?.shareBtn ?? 'Share my contact'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.receiveBtn} onPress={handleReceive} activeOpacity={0.85}>
            <Ionicons name="download-outline" size={22} color={colors.primary} />
            <Text style={styles.receiveBtnText}>{t.nfc?.receiveBtn ?? 'Receive contact'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {(mode === 'sharing' || mode === 'receiving') && (
        <TouchableOpacity style={styles.cancelBtn} onPress={cancel}>
          <Text style={styles.cancelText}>{t.common?.cancel ?? 'Cancel'}</Text>
        </TouchableOpacity>
      )}

      {mode === 'idle' && (
        <View style={styles.altHint}>
          <Ionicons name="qr-code-outline" size={16} color={colors.textTertiary} />
          <Text style={styles.altHintText}>{t.nfc?.orUseQR ?? 'Or scan a QR code instead'}</Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('QRScan')}>
            <Text style={styles.altHintLink}>{t.nfc?.openQR ?? 'Open scanner'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  nfcZone: { width: 220, height: 220, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ring1: { width: 120, height: 120 },
  ring2: { width: 160, height: 160 },
  ring3: { width: 210, height: 210 },
  ringActive: { borderColor: colors.primaryLight, opacity: 0.5 },
  nfcIconWrap: { justifyContent: 'center', alignItems: 'center' },
  statusTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'center', marginBottom: spacing.xs },
  statusSub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', maxWidth: 280, lineHeight: 20, marginBottom: spacing.xl },
  actions: { width: '100%', gap: spacing.sm },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  shareBtnText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.md },
  receiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  receiveBtnText: { color: colors.primary, fontWeight: fontWeight.bold, fontSize: fontSize.md },
  cancelBtn: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
  cancelText: { color: colors.textSecondary, fontSize: fontSize.md },
  altHint: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.lg, opacity: 0.75 },
  altHintText: { fontSize: fontSize.xs, color: colors.textTertiary },
  altHintLink: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.semibold },
  unsupportedTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, textAlign: 'center' },
  unsupportedSub: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', maxWidth: 280 },
  backBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.full, marginTop: spacing.sm },
  backBtnText: { color: '#fff', fontWeight: fontWeight.semibold },
});
