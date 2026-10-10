import { Ionicons } from '@expo/vector-icons';
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
        <Avatar name={user.fullName} />
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
        <Ionicons name="log-out-outline" size={18} color={colors.sidebarText} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.sidebarRaised,
    paddingTop: spacing.md,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
  },
  details: {
    flex: 1,
  },
  name: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  role: {
    color: colors.sidebarText,
    fontSize: typography.fontSize.sm,
  },
  email: {
    color: colors.sidebarMuted,
    fontSize: typography.fontSize.xs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.sidebarRaised,
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutText: {
    color: colors.sidebarText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
