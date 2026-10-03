import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function PaginationControls({
  page,
  totalPages,
  totalItems,
  onPreviousPage,
  onNextPage,
}: PaginationControlsProps) {
  const canGoBack = page > 1;
  const canGoForward = page < totalPages;

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>
        Page {page} of {totalPages} · {totalItems} {totalItems === 1 ? 'employee' : 'employees'}
      </Text>
      <View style={styles.buttons}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          accessibilityState={{ disabled: !canGoBack }}
          disabled={!canGoBack}
          onPress={onPreviousPage}
          style={[styles.button, !canGoBack && styles.buttonDisabled]}
        >
          <Text style={styles.buttonLabel}>Previous</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next page"
          accessibilityState={{ disabled: !canGoForward }}
          disabled={!canGoForward}
          onPress={onNextPage}
          style={[styles.button, !canGoForward && styles.buttonDisabled]}
        >
          <Text style={styles.buttonLabel}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
