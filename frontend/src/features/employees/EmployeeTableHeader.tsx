import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { employeeTableStyles } from './employee-table-styles';

type EmployeeTableHeaderProps = {
  hasActions: boolean;
};

export function EmployeeTableHeader({ hasActions }: EmployeeTableHeaderProps) {
  return (
    <View role="row" style={[employeeTableStyles.row, styles.headerRow]}>
      <Text role="columnheader" style={[styles.headerCell, employeeTableStyles.nameColumn]}>Name</Text>
      <Text role="columnheader" style={[styles.headerCell, employeeTableStyles.emailColumn]}>Email</Text>
      <Text role="columnheader" style={[styles.headerCell, employeeTableStyles.column]}>Department</Text>
      <Text role="columnheader" style={[styles.headerCell, employeeTableStyles.column]}>Title</Text>
      <Text role="columnheader" style={[styles.headerCell, employeeTableStyles.typeColumn]}>Type</Text>
      <Text role="columnheader" style={[styles.headerCell, employeeTableStyles.statusColumn]}>Status</Text>
      {hasActions && (
        <Text role="columnheader" style={[styles.headerCell, employeeTableStyles.actionsColumn]}>Actions</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  headerCell: {
    color: colors.textMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
