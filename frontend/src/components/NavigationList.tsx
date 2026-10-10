import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
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
      <Text style={styles.sectionLabel}>MAIN MENU</Text>
      {navigationItems.map((item) => {
        const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
        return (
          <Pressable
            key={item.path}
            accessibilityRole="link"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => handleNavigate(item)}
            style={({ pressed }) => [styles.item, isActive && styles.itemActive, pressed && styles.itemPressed]}
          >
            <View aria-hidden style={[styles.marker, isActive && styles.markerActive]} />
            <Text style={[styles.label, isActive && styles.labelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 2,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingTop: spacing.md,
  },
  sectionLabel: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingRight: spacing.md,
    paddingVertical: spacing.sm + 2,
    overflow: 'hidden',
  },
  itemActive: {
    backgroundColor: colors.primarySubtle,
  },
  itemPressed: {
    backgroundColor: colors.surfaceHover,
  },
  marker: {
    width: 3,
    alignSelf: 'stretch',
    marginRight: spacing.xs,
  },
  markerActive: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
});
