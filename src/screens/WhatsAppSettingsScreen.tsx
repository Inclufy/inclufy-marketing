/**
 * WhatsAppSettingsScreen
 *
 * CRUD surface for WhatsApp Business Cloud API configuration:
 *   - WABA connection status
 *   - Approved templates (read-only — approved in Meta dashboard)
 *   - Recipients management (add / opt-out)
 *   - Recent sends audit trail
 *
 * TODO (future sprints):
 *   - Allow editing WABA credentials in-app (currently set via Supabase dashboard)
 *   - Bulk CSV import for recipients
 *   - Template sync: pull templates directly from Meta Graph API
 *   - Per-template variable preview / test send
 *   - Aggregate cost reporting chart
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  SectionList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { spacing, borderRadius, fontSize, fontWeight } from '../theme';
import {
  useWhatsAppConfig,
  useWhatsAppTemplates,
  useWhatsAppRecipients,
  useWhatsAppSends,
  useAddWhatsAppRecipient,
  useOptOutRecipient,
} from '../hooks/useWhatsApp';

// ─── Section header ──────────────────────────────────────────────────
function SectionHeader({ title, colors }: { title: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title.toUpperCase()}</Text>
    </View>
  );
}

// ─── Status badge ────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const color = status === 'active' || status === 'approved'
    ? '#10B981'
    : status === 'pending'
    ? '#F59E0B'
    : '#EF4444';
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{status}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Screen
// ═══════════════════════════════════════════════════════════════════
export default function WhatsAppSettingsScreen() {
  const { colors } = useTheme();

  const { data: config,     isLoading: configLoading }     = useWhatsAppConfig();
  const { data: templates,  isLoading: templatesLoading }  = useWhatsAppTemplates();
  const { data: recipients, isLoading: recipientsLoading } = useWhatsAppRecipients();
  const { data: sends,      isLoading: sendsLoading }      = useWhatsAppSends(50);

  const { mutate: addRecipient,  isPending: addingRecipient }  = useAddWhatsAppRecipient();
  const { mutate: optOut,        isPending: optingOut }         = useOptOutRecipient();

  const [newPhone, setNewPhone]   = useState('');
  const [newName,  setNewName]    = useState('');

  const isLoading = configLoading || templatesLoading || recipientsLoading || sendsLoading;

  // ─── Add recipient ─────────────────────────────────────────────
  function handleAddRecipient() {
    const phone = newPhone.trim();
    if (!phone.startsWith('+') || phone.length < 8) {
      Alert.alert('Ongeldig nummer', 'Voer een geldig E.164 nummer in, bijv. +31612345678');
      return;
    }
    addRecipient(
      { phoneE164: phone, displayName: newName.trim() || undefined, source: 'manual' },
      {
        onSuccess: () => { setNewPhone(''); setNewName(''); },
        onError: (err) => Alert.alert('Fout', err.message),
      },
    );
  }

  // ─── Opt-out recipient ─────────────────────────────────────────
  function handleOptOut(recipientId: string, phone: string) {
    Alert.alert(
      'Afmelden?',
      `${phone} wordt afgemeld en ontvangt geen berichten meer.`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Afmelden',
          style: 'destructive',
          onPress: () => optOut(recipientId, {
            onError: (err) => Alert.alert('Fout', err.message),
          }),
        },
      ],
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 48 }}
    >

      {/* ── WABA Status ── */}
      <SectionHeader title="WhatsApp Business Account" colors={colors} />
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {config ? (
          <>
            <View style={styles.row}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>
                  {config.business_name ?? 'WhatsApp Business'}
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  {config.display_phone_number ?? config.phone_number_id}
                </Text>
              </View>
              <StatusBadge status={config.status} />
            </View>
            <Text style={[styles.caption, { color: colors.textTertiary }]}>
              WABA ID: {config.waba_id}
            </Text>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="logo-whatsapp" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Geen WABA gekoppeld
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Voeg je WhatsApp Business Account toe via de Supabase dashboard
              (tabel whatsapp_config) na het voltooien van de Meta WABA registratie.
            </Text>
            {/* TODO: In-app WABA setup form (meta_app_id + permanent token input) */}
          </View>
        )}
      </View>

      {/* ── Templates ── */}
      <SectionHeader title={`Goedgekeurde templates (${templates?.length ?? 0})`} colors={colors} />
      {(!templates || templates.length === 0) ? (
        <View style={[styles.card, styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="document-text-outline" size={32} color={colors.textTertiary} />
          <Text style={[styles.emptyDesc, { color: colors.textSecondary, textAlign: 'center' }]}>
            Geen goedgekeurde templates. Maak templates aan in het Meta Business Manager dashboard
            en synchroniseer ze handmatig via de Supabase-tabel (whatsapp_templates).
            {/* TODO: Auto-sync via GET https://graph.facebook.com/v20.0/{waba_id}/message_templates */}
          </Text>
        </View>
      ) : (
        templates.map(tpl => (
          <View key={tpl.id} style={[styles.card, styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{tpl.name}</Text>
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                {tpl.category} · {tpl.language}
              </Text>
              {tpl.body_text ? (
                <Text style={[styles.bodyPreview, { color: colors.textTertiary }]} numberOfLines={2}>
                  {tpl.body_text}
                </Text>
              ) : null}
            </View>
            <StatusBadge status={tpl.status} />
          </View>
        ))
      )}

      {/* ── Recipient Management ── */}
      <SectionHeader title={`Ontvangers (${recipients?.length ?? 0} actief)`} colors={colors} />

      {/* Add recipient form */}
      {config ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text, marginBottom: spacing.sm }]}>
            Ontvanger toevoegen
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="+31612345678"
            placeholderTextColor={colors.textTertiary}
            value={newPhone}
            onChangeText={setNewPhone}
            keyboardType="phone-pad"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Naam (optioneel)"
            placeholderTextColor={colors.textTertiary}
            value={newName}
            onChangeText={setNewName}
          />
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary, opacity: addingRecipient ? 0.6 : 1 }]}
            onPress={handleAddRecipient}
            disabled={addingRecipient}
          >
            {addingRecipient
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.buttonText}>Toevoegen</Text>
            }
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Recipients list */}
      {recipients && recipients.length > 0 ? (
        recipients.map(r => (
          <View key={r.id} style={[styles.card, styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {r.display_name ?? r.phone_e164}
              </Text>
              {r.display_name ? (
                <Text style={[styles.caption, { color: colors.textSecondary }]}>{r.phone_e164}</Text>
              ) : null}
              <Text style={[styles.caption, { color: colors.textTertiary }]}>
                Ingeschreven: {new Date(r.opt_in_at).toLocaleDateString('nl-NL')}
                {r.source ? ` · ${r.source}` : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => handleOptOut(r.id, r.phone_e164)}
              disabled={optingOut}
            >
              <Ionicons name="person-remove-outline" size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary, textAlign: 'center' }]}>
            Nog geen ontvangers. Voeg mensen toe die opt-in hebben gegeven.
          </Text>
        </View>
      )}

      {/* ── Recent Sends (audit trail) ── */}
      <SectionHeader title="Recente verzendingen" colors={colors} />
      {sends && sends.length > 0 ? (
        sends.slice(0, 20).map(s => (
          <View key={s.id} style={[styles.card, styles.listItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{s.phone_e164}</Text>
              <Text style={[styles.caption, { color: colors.textSecondary }]}>
                {new Date(s.sent_at).toLocaleString('nl-NL')}
                {s.cost_usd ? ` · $${s.cost_usd.toFixed(4)}` : ''}
              </Text>
              {s.error ? (
                <Text style={[styles.caption, { color: '#EF4444' }]} numberOfLines={1}>{s.error}</Text>
              ) : null}
            </View>
            <StatusBadge status={s.status} />
          </View>
        ))
      ) : (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary, textAlign: 'center' }]}>
            Nog geen verzendingen.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold as any,
    letterSpacing: 0.8,
  },
  card: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.xs,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as any,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: fontSize.xs,
  },
  caption: {
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  bodyPreview: {
    fontSize: fontSize.xs,
    marginTop: 4,
    fontStyle: 'italic',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: fontWeight.semibold as any,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold as any,
  },
  emptyDesc: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  button: {
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  buttonText: {
    color: '#fff',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as any,
  },
  iconButton: {
    padding: spacing.xs,
  },
});
