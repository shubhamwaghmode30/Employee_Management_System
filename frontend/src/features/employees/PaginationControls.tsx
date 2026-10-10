import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { colors, spacing, typography } from '../../theme';

type PaginationControlsProps = {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
};

export function PaginationControls({
  page,
  pageSize,
  totalPages,
  totalItems,
  onPreviousPage,
  onNextPage,
}: PaginationControlsProps) {
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>
        Showing {firstItem}–{lastItem} of {totalItems} {totalItems === 1 ? 'employee' : 'employees'}
      </Text>
      <View style={styles.buttons}>
        <Button
          label="Previous"
          accessibilityLabel="Previous page"
          variant="secondary"
          isCompact
          isDisabled={page <= 1}
          onPress={onPreviousPage}
        />
        <Text style={styles.page}>
          Page {page} of {totalPages}
        </Text>
        <Button
          label="Next"
          accessibilityLabel="Next page"
          variant="secondary"
          isCompact
          isDisabled={page >= totalPages}
          onPress={onNextPage}
        />
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
    paddingHorizontal: spacing.lg - spacing.xs,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surfaceMuted,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  page: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
  },
});
