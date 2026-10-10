import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../theme';
import type { SessionUser } from '../types/session-user';
import { Avatar } from './Avatar';

type TopBarProps = {
  user: SessionUser;
  onOpenNavigation: () => void;
};

export function TopBar({ user, onOpenNavigation }: TopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + spacing.sm }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open navigation menu"
        hitSlop={spacing.sm}
        onPress={onOpenNavigation}
        style={({ pressed }) => [styles.menuButton, pressed && styles.menuButtonPressed]}
      >
        <Ionicons name="menu" size={24} color={colors.textPrimary} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>
        Employee Management System
      </Text>
      <Avatar name={user.fullName} size={32} />
    </View>
  );
}

const menuButtonSize = 40;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuButton: {
    width: menuButtonSize,
    height: menuButtonSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  menuButtonPressed: {
    backgroundColor: colors.background,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
});
