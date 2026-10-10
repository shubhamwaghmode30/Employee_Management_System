import { StyleSheet, Text, View } from 'react-native';

import { colors, elevation, radius, spacing, typography } from '../../theme';

type StatCardProps = {
  label: string;
  value: number;
  caption: string;
};

/** KPI tile: label, headline value and a one-line caption. */
export function StatCard({ label, value, caption }: StatCardProps) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}. ${caption}`} style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value.toLocaleString('en-US')}</Text>
      <Text style={styles.caption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexShrink: 1,
    // Two tiles per row on phones, four on wide screens.
    flexBasis: 160,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderTopWidth: 3,
    borderTopColor: colors.primary,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  caption: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
  },
});
