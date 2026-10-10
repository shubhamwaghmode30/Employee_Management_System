import { Ionicons } from '@expo/vector-icons';
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
            <Ionicons name={item.icon} size={20} color={isActive ? colors.onPrimary : colors.sidebarMuted} />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
  },
  itemActive: {
    backgroundColor: colors.primary,
  },
  itemPressed: {
    backgroundColor: colors.sidebarRaised,
  },
  label: {
    color: colors.sidebarText,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  labelActive: {
    color: colors.onPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
});
