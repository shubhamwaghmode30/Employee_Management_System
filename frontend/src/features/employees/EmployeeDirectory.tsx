import { ScrollView, StyleSheet } from 'react-native';

import { hasPermission } from '../../auth/permissions';
import { useSessionUser } from '../../auth/session-user-context';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { StatusMessage } from '../../components/StatusMessage';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { spacing } from '../../theme';
import { EmployeeCardList } from './EmployeeCardList';
import { useEmployeeDataSource } from './employee-data-source-context';
import { getFullName } from './employee-labels';
import type { Employee } from './employee-schemas';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeTable } from './EmployeeTable';
import { PaginationControls } from './PaginationControls';
import { useDepartments } from './use-departments';
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
  const departments = useDepartments(dataSource);
  const deletion = useEmployeeDeletion(dataSource, handleEmployeeDeleted);

  const canCreate = hasPermission(user, 'EMPLOYEE_CREATE');
  const canEdit = hasPermission(user, 'EMPLOYEE_UPDATE');
  const hasDeletePermission = hasPermission(user, 'EMPLOYEE_DELETE');

  // The backend refuses self-deletion, so the control is not offered on your own row.
  function canDelete(employee: Employee): boolean {
    return hasDeletePermission && employee.id !== user.id;
  }

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
          pageSize={directory.pageSize}
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
      <PageHeader
        title="Employees"
        subtitle="Search, filter and manage everyone in the organisation"
        actions={
          canCreate ? <Button label="Add employee" onPress={onCreateEmployee} /> : undefined
        }
      />
      <Card
        title="All employees"
        subtitle={
          directory.state.status === 'success'
            ? `${directory.state.data.total} ${directory.hasActiveFilters ? 'matching' : 'total'} records`
            : 'Loading records'
        }
        isFlush
      >
        <EmployeeFilters
          departments={departments}
          searchText={directory.searchText}
          department={directory.department}
          statusFilter={directory.statusFilter}
          onSearchTextChange={directory.changeSearchText}
          onDepartmentChange={directory.changeDepartment}
          onStatusFilterChange={directory.changeStatusFilter}
        />
        {renderResults(directory.state)}
      </Card>
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
    width: '100%',
    maxWidth: 1320,
    alignSelf: 'center',
    gap: spacing.lg - spacing.xs,
    padding: spacing.lg,
  },
});
