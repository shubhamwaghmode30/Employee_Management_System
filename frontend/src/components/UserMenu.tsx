import { Pressable, StyleSheet, Text, View } from 'react-native';

import { roleLabels } from '../auth/roles';
import { colors, radius, spacing, typography } from '../theme';
import type { SessionUser } from '../types/session-user';
import { Avatar } from './Avatar';

type UserMenuProps = {
  user: SessionUser;
  onLogout: () => void;
};

export function UserMenu({ user, onLogout }: UserMenuProps) {
  return (
    <View style={styles.container}>
      <View style={styles.identity}>
        <Avatar name={user.fullName} size={36} />
        <View style={styles.details}>
          <Text style={styles.name} numberOfLines={1}>
            {user.fullName}
          </Text>
          <Text style={styles.role} numberOfLines={1}>
            {roleLabels[user.role]}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log out"
        onPress={onLogout}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
      >
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm + spacing.xs,
    margin: spacing.sm + spacing.xs,
    padding: spacing.sm + spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  details: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  role: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  email: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: spacing.xs + 2,
    backgroundColor: colors.surface,
  },
  logoutButtonPressed: {
    backgroundColor: colors.surfaceHover,
  },
  logoutText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
