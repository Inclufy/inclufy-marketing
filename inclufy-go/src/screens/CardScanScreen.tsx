import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { useTranslation } from '../i18n';
import { useCreateContact } from '../hooks/useContacts';
import api from '../services/api';

interface ParsedContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  title: string;
}

export default function CardScanScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [parsed, setParsed] = useState<ParsedContact>({
    firstName: '', lastName: '', email: '', phone: '', company: '', title: '',
  });
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const createContact = useCreateContact();

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
        skipProcessing: false,
      });
      setProcessing(true);
      // Send to AI backend for OCR
      try {
        const response = await api.post('/contacts/ocr-card', {
          image_base64: photo.base64,
        });
        const data = response.data;
        setParsed({
          firstName: data.first_name ?? '',
          lastName: data.last_name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          company: data.company ?? '',
          title: data.title ?? '',
        });
      } catch {
        // Fallback: show empty form for manual entry
        setParsed({ firstName: '', lastName: '', email: '', phone: '', company: '', title: '' });
      }
      setShowModal(true);
    } catch (e) {
      Alert.alert('Error', 'Could not capture photo');
    } finally {
      setCapturing(false);
      setProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!parsed.firstName && !parsed.email) {
      Alert.alert('Required', 'Please add at least a name or email.');
      return;
    }
    setSaving(true);
    try {
      await createContact.mutateAsync({
        first_name: parsed.firstName || null,
        last_name: parsed.lastName || null,
        email: parsed.email || null,
        phone: parsed.phone || null,
        source: 'business_card',
        tags: ['card-scan'],
        attributes: {
          company: parsed.company || undefined,
          title: parsed.title || undefined,
          captured_via: 'card_scan',
        },
      });
      setShowModal(false);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save contact.');
    } finally {
      setSaving(false);
    }
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={48} color={colors.textTertiary} />
        <Text style={styles.permText}>{t.cardScan?.needCamera ?? 'Camera permission required'}</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>{t.cardScan?.grantPerm ?? 'Grant permission'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {processing ? (
        <View style={styles.processingOverlay}>
          <ActivityIndicator color="#fff" size="large" />
          <Text style={styles.processingText}>{t.cardScan?.processing ?? 'AI is reading the card...'}</Text>
        </View>
      ) : (
        <>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

          {/* Overlay */}
          <View style={styles.overlay}>
            {/* Top hint */}
            <View style={styles.topHint}>
              <Text style={styles.hintText}>
                {t.cardScan?.hint ?? 'Position business card in frame — AI will extract the details'}
              </Text>
            </View>

            {/* Card Frame Guide */}
            <View style={styles.frameArea}>
              <View style={styles.cardFrame}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <Text style={styles.frameLabel}>{t.cardScan?.frameLabel ?? 'Business Card'}</Text>
              </View>
            </View>

            {/* Capture Button */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.captureBtn}
                onPress={handleCapture}
                disabled={capturing}
                activeOpacity={0.8}
              >
                {capturing ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <View style={styles.captureInner} />
                )}
              </TouchableOpacity>
              <Text style={styles.captureHint}>{t.cardScan?.captureBtn ?? 'Tap to capture'}</Text>
            </View>
          </View>
        </>
      )}

      {/* Contact Confirm Modal */}
      <Modal visible={showModal} animationType="slide" transparent presentationStyle="overFullScreen">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons name="sparkles" size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.modalTitle}>{t.cardScan?.aiExtracted ?? 'AI extracted'}</Text>
                <Text style={styles.modalSub}>{t.cardScan?.reviewDetails ?? 'Review and edit if needed'}</Text>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <EditRow label={t.leadCapture?.firstName ?? 'First name'} value={parsed.firstName} onChangeText={(v) => setParsed(p => ({ ...p, firstName: v }))} />
              <EditRow label={t.leadCapture?.lastName ?? 'Last name'} value={parsed.lastName} onChangeText={(v) => setParsed(p => ({ ...p, lastName: v }))} />
              <EditRow label={t.leadCapture?.email ?? 'Email'} value={parsed.email} onChangeText={(v) => setParsed(p => ({ ...p, email: v }))} keyboardType="email-address" />
              <EditRow label={t.leadCapture?.phone ?? 'Phone'} value={parsed.phone} onChangeText={(v) => setParsed(p => ({ ...p, phone: v }))} keyboardType="phone-pad" />
              <EditRow label={t.leadCapture?.company ?? 'Company'} value={parsed.company} onChangeText={(v) => setParsed(p => ({ ...p, company: v }))} />
              <EditRow label="Title" value={parsed.title} onChangeText={(v) => setParsed(p => ({ ...p, title: v }))} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.rescanBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.rescanText}>{t.cardScan?.rescan ?? 'Retake'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>{t.cardScan?.saveContact ?? 'Save Contact'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function EditRow({
  label, value, onChangeText, keyboardType = 'default',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any;
}) {
  return (
    <View style={editStyles.row}>
      <Text style={editStyles.label}>{label}</Text>
      <TextInput
        style={editStyles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  );
}

const editStyles = StyleSheet.create({
  row: { marginBottom: spacing.sm },
  label: { fontSize: fontSize.xs, color: colors.textTertiary, fontWeight: fontWeight.medium, marginBottom: 4 },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

const CORNER = 18;
const BORDER = 2.5;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md, padding: spacing.xl },
  processingOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  processingText: { color: '#fff', fontSize: fontSize.md, opacity: 0.9 },
  overlay: { flex: 1 },
  topHint: { paddingTop: 80, paddingHorizontal: spacing.xl, alignItems: 'center' },
  hintText: { color: '#fff', fontSize: fontSize.sm, textAlign: 'center', opacity: 0.9 },
  frameArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardFrame: {
    width: 300,
    height: 185,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff' },
  cornerTL: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER, borderBottomRightRadius: 4 },
  frameLabel: { color: 'rgba(255,255,255,0.5)', fontSize: fontSize.xs, letterSpacing: 2, textTransform: 'uppercase' },
  bottomBar: { paddingBottom: 60, alignItems: 'center', gap: spacing.sm },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  captureHint: { color: 'rgba(255,255,255,0.7)', fontSize: fontSize.xs },
  permText: { color: colors.textSecondary, fontSize: fontSize.md, textAlign: 'center' },
  permBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  permBtnText: { color: '#fff', fontWeight: fontWeight.semibold },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  modalIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  modalSub: { fontSize: fontSize.xs, color: colors.textSecondary },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  rescanBtn: { flex: 1, paddingVertical: spacing.md, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  rescanText: { color: colors.textSecondary, fontWeight: fontWeight.semibold },
  saveBtn: { flex: 2, paddingVertical: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: fontWeight.bold, fontSize: fontSize.sm },
});
