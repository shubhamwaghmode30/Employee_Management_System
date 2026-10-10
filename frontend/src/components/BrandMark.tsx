import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

export function BrandMark() {
  return (
    <View style={styles.brand}>
      <View aria-hidden style={styles.logo}>
        <Ionicons name="briefcase" size={18} color={colors.onPrimary} />
      </View>
      <View style={styles.text}>
        <Text accessibilityRole="header" style={styles.title} numberOfLines={2}>
          Employee Management System
        </Text>
        <Text style={styles.subtitle}>HR workspace</Text>
      </View>
    </View>
  );
}

const logoSize = 36;

const styles = StyleSheet.create({
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: {
    width: logoSize,
    height: logoSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  text: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
});
