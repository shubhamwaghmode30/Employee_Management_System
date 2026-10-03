import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '../theme';

type TopBarProps = {
  onOpenNavigation: () => void;
};

export function TopBar({ onOpenNavigation }: TopBarProps) {
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
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
        <View style={styles.menuLine} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>
        Employee Management System
      </Text>
    </View>
  );
}

const menuButtonSize = 40;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
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
    gap: spacing.xs,
    borderRadius: spacing.sm,
  },
  menuButtonPressed: {
    backgroundColor: colors.background,
  },
  menuLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.textPrimary,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
});
