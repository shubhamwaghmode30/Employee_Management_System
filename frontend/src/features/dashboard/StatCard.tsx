import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, elevation, radius, spacing, typography } from '../../theme';

type StatCardProps = {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  tone: { foreground: string; background: string };
};

export function StatCard({ label, value, icon, tone }: StatCardProps) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.card}>
      <View style={[styles.icon, { backgroundColor: tone.background }]}>
        <Ionicons name={icon} size={22} color={tone.foreground} />
      </View>
      <View style={styles.text}>
        <Text style={styles.value}>{value.toLocaleString('en-US')}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const iconSize = 44;

const styles = StyleSheet.create({
  card: {
    flexGrow: 1,
    flexShrink: 1,
    // Two cards per row on phones, four on wide screens.
    flexBasis: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
  },
  icon: {
    width: iconSize,
    height: iconSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  text: {
    flexShrink: 1,
    gap: 2,
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
});
