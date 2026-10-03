import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';
import type { SessionUser } from '../types/session-user';
import { NavigationList } from './NavigationList';
import { UserMenu } from './UserMenu';

type SidebarProps = {
  user: SessionUser;
  onLogout: () => void;
};

export function Sidebar({ user, onLogout }: SidebarProps) {
  return (
    <View style={styles.sidebar}>
      <Text accessibilityRole="header" style={styles.brand}>
        Employee Management System
      </Text>
      <View style={styles.navigation}>
        <NavigationList />
      </View>
      <UserMenu user={user} onLogout={onLogout} />
    </View>
  );
}

const sidebarWidth = 260;

const styles = StyleSheet.create({
  sidebar: {
    width: sidebarWidth,
    gap: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  brand: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  navigation: {
    flex: 1,
  },
});
