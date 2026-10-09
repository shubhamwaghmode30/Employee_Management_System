import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { hasPermission } from '../../auth/role-permissions';
import { useSessionUser } from '../../auth/session-user-context';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { StatusMessage } from '../../components/StatusMessage';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { colors, spacing, typography } from '../../theme';
import { EmployeeCardList } from './EmployeeCardList';
import { useEmployeeDataSource } from './employee-data-source-context';
import { getFullName } from './employee-labels';
import type { Employee } from './employee-schemas';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeTable } from './EmployeeTable';
import { PaginationControls } from './PaginationControls';
import { type DirectoryState, useEmployeeDirectory } from './use-employee-directory';
import { useEmployeeDeletion } from './use-employee-deletion';

type EmployeeDirectoryProps = {
  onCreateEmployee: () => void;
  onViewEmployee: (employee: Employee) => void;
  onEditEmployee: (employee: Employee) => void;
};

export function EmployeeDirectory({
  onCreateEmployee,
  onViewEmployee,
  onEditEmployee,
}: EmployeeDirectoryProps) {
  const user = useSessionUser();
  const breakpoint = useBreakpoint();
  const dataSource = useEmployeeDataSource();
  const directory = useEmployeeDirectory(dataSource);
  const deletion = useEmployeeDeletion(dataSource, handleEmployeeDeleted);

  const canCreate = hasPermission(user.role, 'EMPLOYEE_CREATE');
  const canEdit = hasPermission(user.role, 'EMPLOYEE_UPDATE');
  const canDelete = hasPermission(user.role, 'EMPLOYEE_DELETE');

  function handleEmployeeDeleted() {
    // Deleting the only row on the last page would leave an empty page behind.
    const isLastRowOnPage =
      directory.state.status === 'success' && directory.state.data.items.length === 1;
    if (isLastRowOnPage && directory.page > 1) {
      directory.goToPreviousPage();
    } else {
      directory.reload();
    }
  }

  function renderResults(state: DirectoryState) {
    if (state.status === 'loading') {
      return <StatusMessage title="Loading employees…" isLoading />;
    }
    if (state.status === 'error') {
      return (
        <StatusMessage
          title="Employees could not be loaded"
          description={state.error.message}
          actionLabel="Try again"
          onAction={directory.reload}
        />
      );
    }
    if (state.data.items.length === 0) {
      return directory.hasActiveFilters ? (
        <StatusMessage
          title="No employees match your filters"
          description="Try a different search or clear the filters."
          actionLabel="Clear filters"
          onAction={directory.clearFilters}
        />
      ) : (
        <StatusMessage title="No employees yet" description="Employees you add will appear here." />
      );
    }

    const listProps = {
      employees: state.data.items,
      canEdit,
      canDelete,
      onViewEmployee,
      onEditEmployee,
      onDeleteEmployee: deletion.requestDeletion,
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
      <ConfirmDialog
        isOpen={deletion.pendingEmployee !== null}
        title={deletion.pendingEmployee === null ? '' : `Delete ${getFullName(deletion.pendingEmployee)}?`}
        message="They will be removed from the employee directory and can no longer sign in."
        confirmLabel="Delete"
        isConfirming={deletion.isDeleting}
        errorMessage={deletion.error?.message ?? null}
        onConfirm={() => void deletion.confirmDeletion()}
        onCancel={deletion.cancelDeletion}
      />
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
