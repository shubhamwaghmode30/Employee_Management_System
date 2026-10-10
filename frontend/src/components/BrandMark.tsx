import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

export function BrandMark() {
  return (
    <View style={styles.brand}>
      <View aria-hidden style={styles.logo}>
        <Ionicons name="briefcase" size={18} color={colors.onPrimary} />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        Employee Management System
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  logo: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  title: {
    flex: 1,
    color: colors.onPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
});
