import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { SegmentedControl } from '../../components/SegmentedControl';
import { colors, spacing, typography } from '../../theme';
import { type PageSize, pageSizeOptions } from './use-employee-directory';

const pageSizeChoices = pageSizeOptions.map((size) => ({ value: String(size), label: String(size) }));

type PaginationControlsProps = {
  page: number;
  pageSize: PageSize;
  totalPages: number;
  totalItems: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onPageSizeChange: (pageSize: PageSize) => void;
};

export function PaginationControls({
  page,
  pageSize,
  totalPages,
  totalItems,
  onPreviousPage,
  onNextPage,
  onPageSizeChange,
}: PaginationControlsProps) {
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  function handlePageSizeChange(value: string) {
    const nextPageSize = pageSizeOptions.find((size) => String(size) === value);
    if (nextPageSize !== undefined) {
      onPageSizeChange(nextPageSize);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>
        Showing {firstItem}–{lastItem} of {totalItems} {totalItems === 1 ? 'employee' : 'employees'}
      </Text>
      <View style={styles.pageSize}>
        <Text style={styles.page}>Rows per page</Text>
        <SegmentedControl
          label="Rows per page"
          options={pageSizeChoices}
          selectedValue={String(pageSize)}
          onChange={handlePageSizeChange}
        />
      </View>
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
  pageSize: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
