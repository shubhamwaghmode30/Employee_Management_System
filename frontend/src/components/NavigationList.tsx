import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';
import { type NavigationItem, navigationItems } from './navigation-items';

type NavigationListProps = {
  onNavigate?: () => void;
};

export function NavigationList({ onNavigate }: NavigationListProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleNavigate(item: NavigationItem) {
    router.navigate(item.path);
    onNavigate?.();
  }

  return (
    <View role="navigation" aria-label="Main navigation" style={styles.list}>
      {navigationItems.map((item) => {
        const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
        return (
          <Pressable
            key={item.path}
            accessibilityRole="link"
            accessibilityState={{ selected: isActive }}
            onPress={() => handleNavigate(item)}
            style={({ pressed }) => [
              styles.item,
              isActive && styles.itemActive,
              pressed && styles.itemPressed,
            ]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.xs,
  },
  item: {
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
  },
  itemActive: {
    backgroundColor: colors.primarySubtle,
  },
  itemPressed: {
    opacity: 0.7,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});
