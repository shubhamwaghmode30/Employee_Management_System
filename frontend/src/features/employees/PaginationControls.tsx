import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
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
  return (
    <View style={styles.container}>
      <Text style={styles.summary}>
        Page {page} of {totalPages} · {totalItems} {totalItems === 1 ? 'employee' : 'employees'}
      </Text>
      <View style={styles.buttons}>
        <Button
          label="Previous"
          accessibilityLabel="Previous page"
          icon="chevron-back"
          variant="secondary"
          isCompact
          isDisabled={page <= 1}
          onPress={onPreviousPage}
        />
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
  },
  summary: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
