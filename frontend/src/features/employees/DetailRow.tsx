import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';

type DetailRowProps = {
  label: string;
  value: string;
};

export function DetailRow({ label, value }: DetailRowProps) {
  // One accessibility element per row so screen readers announce the label with its value.
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  value: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
