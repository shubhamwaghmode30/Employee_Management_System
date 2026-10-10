import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

export function BrandMark() {
  return (
    <View style={styles.brand}>
      <View aria-hidden style={styles.logo}>
        <Text style={styles.logoText}>EMS</Text>
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
  logoText: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
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
