import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useTeamMembers,
  useInviteTeamMember,
  useUpdateTeamMember,
  useRemoveTeamMember,
  type TeamMember,
} from '../hooks/useTeamMembers';
import { useEvent } from '../hooks/useEvents';
import type { RootStackParamList } from '../types';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../theme';
import { subtleShadow } from '../utils/shadows';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'TeamManage'>;

const ROLE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  owner: { label: 'Eigenaar', icon: '\u{1F451}', color: '#D97706' },
  editor: { label: 'Editor', icon: '\u{270F}\u{FE0F}', color: colors.info },
  contributor: { label: 'Bijdrager', icon: '\u{1F4F8}', color: colors.success },
  viewer: { label: 'Kijker', icon: '\u{1F441}', color: colors.textSecondary },
};

const ROLE_OPTIONS = ['editor', 'contributor', 'viewer'];

export default function TeamManageScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { eventId } = route.params;

  const { data: event } = useEvent(eventId);
  const { data: members = [], isLoading } = useTeamMembers(eventId);
  const inviteMember = useInviteTeamMember();
  const updateMember = useUpdateTeamMember();
  const removeMember = useRemoveTeamMember();

  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('contributor');

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      Alert.alert('Ongeldig', 'Voer een geldig e-mailadres in');
      return;
    }

    try {
      await inviteMember.mutateAsync({
        eventId,
        email,
        role: selectedRole,
      });
      setInviteEmail('');
      Alert.alert('Uitgenodigd!', `${email} is uitgenodigd als ${ROLE_LABELS[selectedRole]?.label || selectedRole}`);
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'Uitnodiging mislukt';
      Alert.alert('Fout', detail);
    }
  };

  const handleChangeRole = (member: TeamMember) => {
    const options = ROLE_OPTIONS.filter((r) => r !== member.role);
    Alert.alert(
      'Rol wijzigen',
      `Huidige rol: ${ROLE_LABELS[member.role]?.label || member.role}`,
      [
        ...options.map((role) => ({
          text: ROLE_LABELS[role]?.label || role,
          onPress: () => {
            updateMember.mutate({
              eventId,
              memberId: member.id,
              role,
            });
          },
        })),
        { text: 'Annuleren', style: 'cancel' as const },
      ],
    );
  };

  const handleRemove = (member: TeamMember) => {
    Alert.alert(
      'Teamlid verwijderen?',
      `${member.email || 'Dit teamlid'} wordt verwijderd van het event.`,
      [
        { text: 'Annuleren', style: 'cancel' },
        {
          text: 'Verwijderen',
          style: 'destructive',
          onPress: () => removeMember.mutate({ eventId, memberId: member.id }),
        },
      ],
    );
  };

  const renderMember = ({ item }: { item: TeamMember }) => {
    const roleConfig = ROLE_LABELS[item.role] || ROLE_LABELS.viewer;
    const isPending = item.status === 'pending';
    const isDeclined = item.status === 'declined';

    return (
      <View style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <View style={styles.memberHeader}>
            <Text style={styles.memberIcon}>{roleConfig.icon}</Text>
            <Text style={styles.memberEmail} numberOfLines={1}>
              {item.email || `Gebruiker ${item.user_id.slice(0, 8)}...`}
            </Text>
          </View>

          <View style={styles.memberMeta}>
            <View style={[styles.roleBadge, { backgroundColor: roleConfig.color + '20' }]}>
              <Text style={[styles.roleBadgeText, { color: roleConfig.color }]}>
                {roleConfig.label}
              </Text>
            </View>

            {isPending && (
              <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: colors.warning }]}>
                  Wacht op acceptatie
                </Text>
              </View>
            )}

            {isDeclined && (
              <View style={[styles.statusBadge, { backgroundColor: colors.error + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: colors.error }]}>
                  Afgewezen
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.memberActions}>
          <TouchableOpacity
            style={styles.memberActionBtn}
            onPress={() => handleChangeRole(item)}
          >
            <Text style={styles.memberActionText}>Rol</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.memberActionBtn, styles.removeBtn]}
            onPress={() => handleRemove(item)}
          >
            <Text style={[styles.memberActionText, styles.removeText]}>{'\u2715'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Team beheren</Text>
        <Text style={styles.subtitle}>{event?.name || 'Event'}</Text>
      </View>

      {/* Invite Section */}
      <View style={styles.inviteSection}>
        <Text style={styles.sectionTitle}>Teamlid uitnodigen</Text>

        <View style={styles.inviteRow}>
          <TextInput
            style={styles.emailInput}
            value={inviteEmail}
            onChangeText={setInviteEmail}
            placeholder="naam@bedrijf.nl"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Role selector */}
        <View style={styles.roleSelector}>
          {ROLE_OPTIONS.map((role) => {
            const config = ROLE_LABELS[role];
            const isSelected = selectedRole === role;
            return (
              <TouchableOpacity
                key={role}
                style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                onPress={() => setSelectedRole(role)}
              >
                <Text style={styles.roleOptionIcon}>{config?.icon}</Text>
                <Text
                  style={[
                    styles.roleOptionText,
                    isSelected && { color: colors.primary, fontWeight: fontWeight.semibold },
                  ]}
                >
                  {config?.label || role}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={handleInvite}
          disabled={inviteMember.isPending}
        >
          {inviteMember.isPending ? (
            <ActivityIndicator color={colors.textOnPrimary} size="small" />
          ) : (
            <Text style={styles.inviteBtnText}>Uitnodigen</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Members List */}
      <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.md }]}>
        Teamleden ({members.length})
      </Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          contentContainerStyle={styles.membersList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>{'\u{1F465}'}</Text>
              <Text style={styles.emptyText}>Nog geen teamleden</Text>
              <Text style={styles.emptySubtext}>
                Nodig collega's uit om samen content te maken!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  inviteSection: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...subtleShadow,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  inviteRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  emailInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  roleOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  roleOptionIcon: { fontSize: 14 },
  roleOptionText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
  },
  inviteBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  inviteBtnText: {
    color: colors.textOnPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  membersList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...subtleShadow,
  },
  memberInfo: { flex: 1, gap: 6 },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memberIcon: { fontSize: 18 },
  memberEmail: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  memberMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  roleBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  memberActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  memberActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberActionText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  removeBtn: {
    borderColor: colors.error + '40',
    backgroundColor: colors.error + '08',
  },
  removeText: {
    color: colors.error,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
