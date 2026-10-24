import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../theme';

/** Row and column widths shared by the table header and each virtualized row, so they line up. */
export const employeeTableStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg - spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nameColumn: {
    flex: 1.6,
  },
  emailColumn: {
    flex: 1.8,
  },
  column: {
    flex: 1.2,
  },
  typeColumn: {
    flex: 0.8,
  },
  statusColumn: {
    flex: 0.8,
  },
  actionsColumn: {
    flex: 0.7,
  },
});
