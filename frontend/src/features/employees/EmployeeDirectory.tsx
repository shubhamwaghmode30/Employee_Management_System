import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { hasPermission } from '../../auth/role-permissions';
import { useSessionUser } from '../../auth/session-user-context';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { colors, spacing, typography } from '../../theme';
import { DirectoryMessage } from './DirectoryMessage';
import { EmployeeCardList } from './EmployeeCardList';
import type { EmployeeDataSource } from './employee-data-source';
import type { Employee } from './employee-schemas';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeTable } from './EmployeeTable';
import { PaginationControls } from './PaginationControls';
import { type DirectoryState, useEmployeeDirectory } from './use-employee-directory';

type EmployeeDirectoryProps = {
  dataSource: EmployeeDataSource;
  onCreateEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (employee: Employee) => void;
};

export function EmployeeDirectory({
  dataSource,
  onCreateEmployee,
  onEditEmployee,
  onDeleteEmployee,
}: EmployeeDirectoryProps) {
  const user = useSessionUser();
  const breakpoint = useBreakpoint();
  const directory = useEmployeeDirectory(dataSource);

  const canCreate = hasPermission(user.role, 'EMPLOYEE_CREATE');
  const canEdit = hasPermission(user.role, 'EMPLOYEE_UPDATE');
  const canDelete = hasPermission(user.role, 'EMPLOYEE_DELETE');

  function renderResults(state: DirectoryState) {
    if (state.status === 'loading') {
      return <DirectoryMessage title="Loading employees…" isLoading />;
    }
    if (state.status === 'error') {
      return (
        <DirectoryMessage
          title="Employees could not be loaded"
          description={state.error.message}
          actionLabel="Try again"
          onAction={directory.retry}
        />
      );
    }
    if (state.data.items.length === 0) {
      return directory.hasActiveFilters ? (
        <DirectoryMessage
          title="No employees match your filters"
          description="Try a different search or clear the filters."
          actionLabel="Clear filters"
          onAction={directory.clearFilters}
        />
      ) : (
        <DirectoryMessage title="No employees yet" description="Employees you add will appear here." />
      );
    }

    const listProps = {
      employees: state.data.items,
      canEdit,
      canDelete,
      onEditEmployee,
      onDeleteEmployee,
    };
    return (
      <>
        {breakpoint === 'mobile' ? <EmployeeCardList {...listProps} /> : <EmployeeTable {...listProps} />}
        <PaginationControls
          page={directory.page}
          totalPages={directory.totalPages}
          totalItems={state.data.total}
          onPreviousPage={directory.goToPreviousPage}
          onNextPage={directory.goToNextPage}
        />
      </>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Employees
        </Text>
        {canCreate && (
          <Pressable
            accessibilityRole="button"
            onPress={onCreateEmployee}
            style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
          >
            <Text style={styles.createLabel}>Add employee</Text>
          </Pressable>
        )}
      </View>
      <EmployeeFilters
        searchText={directory.searchText}
        department={directory.department}
        statusFilter={directory.statusFilter}
        onSearchTextChange={directory.changeSearchText}
        onDepartmentChange={directory.changeDepartment}
        onStatusFilterChange={directory.changeStatusFilter}
      />
      {renderResults(directory.state)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  createButton: {
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.primary,
  },
  createButtonPressed: {
    opacity: 0.85,
  },
  createLabel: {
    color: colors.onPrimary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});
