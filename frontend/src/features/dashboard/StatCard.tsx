import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, elevation, radius, spacing, typography } from '../../theme';

type StatCardProps = {
  label: string;
  value: number;
  caption: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: { accent: string; background: string };
};

/** KPI tile: label, headline value and a one-line caption, keyed by an accent bar. */
export function StatCard({ label, value, caption, icon, tone }: StatCardProps) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}. ${caption}`} style={styles.card}>
      <View aria-hidden style={[styles.accent, { backgroundColor: tone.accent }]} />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          <View style={[styles.icon, { backgroundColor: tone.background }]}>
            <Ionicons name={icon} size={18} color={tone.accent} />
          </View>
        </View>
        <Text style={styles.value}>{value.toLocaleString('en-US')}</Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>
    </View>
  );
}

const iconSize = 32;

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexShrink: 1,
    // Two tiles per row on phones, four on wide screens.
    flexBasis: 160,
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
    overflow: 'hidden',
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  label: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  icon: {
    width: iconSize,
    height: iconSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  caption: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
});
