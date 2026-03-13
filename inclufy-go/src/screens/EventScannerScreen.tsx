import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../services/supabase';
import type { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';

// ─── Types ───────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EventScanner'>;

interface ScannedContact {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  scanned_at: string;
  raw: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Parse QR code data into a contact object.
 *  Supports: vCard (BEGIN:VCARD), JSON, plain email, plain text */
function parseQRContact(raw: string): Partial<ScannedContact> {
  const trimmed = raw.trim();

  // Try JSON
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed);
      return {
        name: obj.name || obj.full_name || obj.displayName || '',
        email: obj.email || obj.mail || '',
        company: obj.company || obj.organization || obj.org || '',
        phone: obj.phone || obj.tel || obj.mobile || '',
      };
    } catch { /* fall through */ }
  }

  // Try vCard
  if (trimmed.toUpperCase().includes('BEGIN:VCARD')) {
    const lines = trimmed.split(/\r?\n/);
    const get = (key: string): string => {
      const line = lines.find((l) => l.toUpperCase().startsWith(key.toUpperCase() + ':'));
      return line ? line.substring(key.length + 1).trim() : '';
    };
    const getFN = (): string => {
      const fn = get('FN');
      if (fn) return fn;
      const n = get('N');
      if (n) {
        const parts = n.split(';');
        return [parts[1], parts[0]].filter(Boolean).join(' ');
      }
      return '';
    };
    const getEmail = (): string => {
      const line = lines.find((l) => l.toUpperCase().includes('EMAIL'));
      return line ? line.split(':').slice(1).join(':').trim() : '';
    };
    const getTel = (): string => {
      const line = lines.find((l) => l.toUpperCase().includes('TEL'));
      return line ? line.split(':').slice(1).join(':').trim() : '';
    };
    const getOrg = (): string => {
      const line = lines.find((l) => l.toUpperCase().startsWith('ORG:'));
      return line ? line.substring(4).trim() : '';
    };

    return {
      name: getFN(),
      email: getEmail(),
      company: getOrg(),
      phone: getTel(),
    };
  }

  // Try plain email
  const emailMatch = trimmed.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    return { email: emailMatch[0], name: '' };
  }

  // Plain text: use as name
  return { name: trimmed };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function EventScannerScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { eventId } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scannedList, setScannedList] = useState<ScannedContact[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editContact, setEditContact] = useState<Partial<ScannedContact>>({});
  const [manualMode, setManualMode] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    loadExistingScans();
  }, []);

  const loadExistingScans = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('go_event_scans')
      .select('*')
      .eq('event_id', eventId)
      .order('scanned_at', { ascending: false })
      .limit(20);
    if (data) setScannedList(data as any);
  };

  const handleBarcodeScanned = useCallback(
    ({ data }: BarcodeScanningResult) => {
      if (!scanning) return;
      setScanning(false);
      const parsed = parseQRContact(data);
      setEditContact({ ...parsed, raw: data });
      setModalVisible(true);
    },
    [scanning],
  );

  const saveContact = async () => {
    if (!editContact.name && !editContact.email) {
      Alert.alert('Vereist', 'Vul minstens een naam of e-mail in.');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('go_event_scans')
        .insert({
          event_id: eventId,
          user_id: user.id,
          name: editContact.name || '',
          email: editContact.email || '',
          company: editContact.company || '',
          phone: editContact.phone || '',
          raw_data: editContact.raw || '',
          scanned_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Also create a contact in go_contacts if email provided
      if (editContact.email) {
        await supabase.from('go_contacts').upsert({
          user_id: user.id,
          name: editContact.name || editContact.email,
          email: editContact.email,
          company: editContact.company || '',
          phone: editContact.phone || '',
          source: 'event_scan',
          event_id: eventId,
        }, { onConflict: 'user_id,email' });
      }

      setScannedList((prev) => [data as any, ...prev]);
      setModalVisible(false);
      setEditContact({});
    } catch (err: any) {
      Alert.alert('Fout', err.message || 'Kon contact niet opslaan');
    } finally {
      setSaving(false);
      // Resume scanning after 1.5s
      setTimeout(() => setScanning(true), 1500);
    }
  };

  const dismissModal = () => {
    setModalVisible(false);
    setEditContact({});
    setTimeout(() => setScanning(true), 500);
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={48} color={colors.primary} />
        <Text style={styles.permissionTitle}>Camera toegang nodig</Text>
        <Text style={styles.permissionSub}>
          Om QR-badges van deelnemers te scannen heeft de app cameratoegang nodig.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Geef toegang</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera viewfinder */}
      <View style={styles.cameraContainer}>
        {!manualMode && (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            enableTorch={flash}
            onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'pdf417', 'code128', 'datamatrix'] }}
          />
        )}

        {manualMode && (
          <View style={styles.manualOverlay}>
            <Ionicons name="person-add-outline" size={48} color="rgba(255,255,255,0.4)" />
            <Text style={styles.manualOverlayText}>Handmatige invoer</Text>
          </View>
        )}

        {/* Scan frame */}
        {!manualMode && (
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        )}

        {/* Camera controls row */}
        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={[styles.cameraCtrlBtn, flash && styles.cameraCtrlBtnActive]}
            onPress={() => setFlash(!flash)}
          >
            <Ionicons name={flash ? 'flash' : 'flash-outline'} size={20} color="#fff" />
          </TouchableOpacity>

          <View style={styles.scanHintPill}>
            <Ionicons name="qr-code-outline" size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.scanHintText}>
              {scanning ? 'Scan QR-badge' : 'Verwerken...'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.cameraCtrlBtn, manualMode && styles.cameraCtrlBtnActive]}
            onPress={() => {
              setManualMode(!manualMode);
              if (!manualMode) {
                setEditContact({});
                setModalVisible(true);
              }
            }}
          >
            <Ionicons name="create-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scanned list */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Gescand vandaag ({scannedList.length})
          </Text>
          {scannedList.length > 0 && (
            <TouchableOpacity onPress={loadExistingScans}>
              <Ionicons name="refresh" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {scannedList.length === 0 ? (
            <View style={styles.emptyList}>
              <Ionicons name="scan-outline" size={32} color={colors.textTertiary} />
              <Text style={styles.emptyListText}>Nog geen scans</Text>
              <Text style={styles.emptyListSub}>Richt de camera op een QR-badge</Text>
            </View>
          ) : (
            scannedList.map((c) => (
              <View key={c.id} style={styles.contactRow}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarText}>
                    {(c.name || c.email || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{c.name || c.email || 'Onbekend'}</Text>
                  {c.email ? (
                    <Text style={styles.contactMeta}>{c.email}</Text>
                  ) : null}
                  {c.company ? (
                    <Text style={styles.contactMeta}>{c.company}</Text>
                  ) : null}
                </View>
                <Text style={styles.contactTime}>
                  {new Date(c.scanned_at).toLocaleTimeString('nl-NL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

      {/* Contact detail / edit modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={dismissModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>
              {editContact.name || editContact.email
                ? 'Contact bevestigen'
                : 'Nieuw contact'}
            </Text>

            {/* Parsed preview / edit fields */}
            <View style={styles.modalFields}>
              <View style={styles.fieldRow}>
                <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.fieldInput}
                  value={editContact.name || ''}
                  onChangeText={(v) => setEditContact((p) => ({ ...p, name: v }))}
                  placeholder="Naam"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={styles.fieldRow}>
                <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.fieldInput}
                  value={editContact.email || ''}
                  onChangeText={(v) => setEditContact((p) => ({ ...p, email: v }))}
                  placeholder="E-mail"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.fieldRow}>
                <Ionicons name="business-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.fieldInput}
                  value={editContact.company || ''}
                  onChangeText={(v) => setEditContact((p) => ({ ...p, company: v }))}
                  placeholder="Bedrijf"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={styles.fieldRow}>
                <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.fieldInput}
                  value={editContact.phone || ''}
                  onChangeText={(v) => setEditContact((p) => ({ ...p, phone: v }))}
                  placeholder="Telefoon"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={dismissModal}>
                <Text style={styles.modalCancelText}>Annuleer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={saveContact}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.modalSaveText}>Opslaan</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  // Permission
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md,
  },
  permissionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  permissionSub: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  permissionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
  },
  permissionBtnText: { color: '#fff', fontWeight: fontWeight.semibold },

  // Camera
  cameraContainer: {
    height: '48%' as any,
    position: 'relative',
    backgroundColor: '#111',
  },
  manualOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  manualOverlayText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: fontSize.md,
  },
  scanFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 200,
    height: 200,
    marginTop: -100,
    marginLeft: -100,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.primary,
    borderWidth: 3,
  },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderRadius: 4 },
  cameraControls: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cameraCtrlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCtrlBtnActive: {
    backgroundColor: colors.primary,
  },
  scanHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  scanHintText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },

  // List
  listContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  listTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  emptyListText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  emptyListSub: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  contactAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactAvatarText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  contactInfo: { flex: 1 },
  contactName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  contactMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 1,
  },
  contactTime: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    paddingTop: spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalFields: { gap: spacing.sm },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  fieldInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    padding: 0,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: fontWeight.semibold,
  },
  modalSaveBtn: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: fontWeight.bold,
    fontSize: fontSize.md,
  },
});
