import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';
import type { RoleName } from '../types/role-name';
import type { SessionUser } from '../types/session-user';

const roleLabels: Record<RoleName, string> = {
  ADMIN: 'Admin',
  HR_MANAGER: 'HR Manager',
  EMPLOYEE: 'Employee',
};

type UserMenuProps = {
  user: SessionUser;
  onLogout: () => void;
};

export function UserMenu({ user, onLogout }: UserMenuProps) {
  return (
    <View style={styles.container}>
      <View style={styles.identity}>
        <View style={styles.avatar} aria-hidden>
          <Text style={styles.avatarText}>{getInitials(user.fullName)}</Text>
        </View>
        <View style={styles.details}>
          <Text style={styles.name} numberOfLines={1}>
            {user.fullName}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {roleLabels[user.role]}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {user.email}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onLogout}
        style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
      >
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

function getInitials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter((part) => part !== '')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

const avatarSize = 40;

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
  },
  avatar: {
    width: avatarSize,
    height: avatarSize,
    borderRadius: avatarSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  avatarText: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  details: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  logoutButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    paddingVertical: spacing.sm,
  },
  logoutButtonPressed: {
    backgroundColor: colors.background,
  },
  logoutText: {
    color: colors.danger,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
});
