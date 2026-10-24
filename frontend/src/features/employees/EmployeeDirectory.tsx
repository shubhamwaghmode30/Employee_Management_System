import { useCallback } from 'react';
import { FlatList, type ListRenderItem, Platform, StyleSheet, View } from 'react-native';

import { hasPermission } from '../../auth/permissions';
import { useSessionUser } from '../../auth/session-user-context';
import { Button } from '../../components/Button';
import { CardHeader } from '../../components/Card';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PageHeader } from '../../components/PageHeader';
import { StatusMessage } from '../../components/StatusMessage';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { colors, elevation, radius, spacing } from '../../theme';
import { EmployeeCard } from './EmployeeCard';
import { useEmployeeDataSource } from './employee-data-source-context';
import { getFullName } from './employee-labels';
import type { EmployeeSummary } from './employee-schemas';
import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeTableHeader } from './EmployeeTableHeader';
import { EmployeeTableRow } from './EmployeeTableRow';
import { PaginationControls } from './PaginationControls';
import { useDepartments } from './use-departments';
import { type DirectoryState, useEmployeeDirectory } from './use-employee-directory';
import { useEmployeeDeletion } from './use-employee-deletion';

type EmployeeDirectoryProps = {
  onCreateEmployee: () => void;
  onViewEmployee: (employee: EmployeeSummary) => void;
  onEditEmployee: (employee: EmployeeSummary) => void;
  onOpenDeletedEmployees: () => void;
};

const noEmployees: readonly EmployeeSummary[] = [];

/**
 * The page is one virtualized list: only rows near the viewport are mounted,
 * so a 100-row page scrolls as smoothly as a 10-row one on low-end phones.
 */
export function EmployeeDirectory({
  onCreateEmployee,
  onViewEmployee,
  onEditEmployee,
  onOpenDeletedEmployees,
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
  const canRestore = hasPermission(user, 'EMPLOYEE_RESTORE');
  const isMobile = breakpoint === 'mobile';
  const { state } = directory;
  const employees = state.status === 'success' ? state.data.items : noEmployees;

  // The backend refuses self-deletion, so the control is not offered on your own row.
  const canDelete = useCallback(
    (employee: EmployeeSummary) => hasDeletePermission && employee.id !== user.id,
    [hasDeletePermission, user.id],
  );
  const hasActions = canEdit || employees.some(canDelete);
  const { requestDeletion } = deletion;

  const renderEmployee: ListRenderItem<EmployeeSummary> = useCallback(
    ({ item }) => {
      const Row = isMobile ? EmployeeCard : EmployeeTableRow;
      return (
        <View style={styles.panelRow}>
          <Row
            employee={item}
            hasActions={hasActions}
            canEdit={canEdit}
            canDelete={canDelete(item)}
            onViewEmployee={onViewEmployee}
            onEditEmployee={onEditEmployee}
            onDeleteEmployee={requestDeletion}
          />
        </View>
      );
    },
    [isMobile, hasActions, canEdit, canDelete, onViewEmployee, onEditEmployee, requestDeletion],
  );

  function handleEmployeeDeleted() {
    // Deleting the only row on the last page would leave an empty page behind.
    const isLastRowOnPage = state.status === 'success' && state.data.items.length === 1;
    if (isLastRowOnPage && directory.page > 1) {
      directory.goToPreviousPage();
    } else {
      directory.reload();
    }
  }

  function renderStatus(currentState: DirectoryState) {
    if (currentState.status === 'loading') {
      return <StatusMessage title="Loading employees…" isLoading />;
    }
    if (currentState.status === 'error') {
      return (
        <StatusMessage
          title="Employees could not be loaded"
          description={currentState.error.message}
          actionLabel="Try again"
          onAction={directory.reload}
        />
      );
    }
    if (currentState.data.items.length > 0) {
      return null;
    }
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

  const listHeader = (
    <View style={styles.header}>
      <PageHeader
        title="Employees"
        subtitle="Search, filter and manage everyone in the organisation"
        actions={
          canCreate || canRestore ? (
            <>
              {canRestore && <Button label="Deleted employees" variant="secondary" onPress={onOpenDeletedEmployees} />}
              {canCreate && <Button label="Add employee" onPress={onCreateEmployee} />}
            </>
          ) : undefined
        }
      />
      <View style={styles.panelTop}>
        <CardHeader
          title="All employees"
          subtitle={
            state.status === 'success'
              ? `${state.data.total} ${directory.hasActiveFilters ? 'matching' : 'total'} records`
              : 'Loading records'
          }
        />
        <EmployeeFilters
          departments={departments}
          searchText={directory.searchText}
          department={directory.department}
          statusFilter={directory.statusFilter}
          onSearchTextChange={directory.changeSearchText}
          onDepartmentChange={directory.changeDepartment}
          onStatusFilterChange={directory.changeStatusFilter}
        />
        {renderStatus(state)}
        {!isMobile && employees.length > 0 && <EmployeeTableHeader hasActions={hasActions} />}
      </View>
    </View>
  );

  const listFooter = (
    <View style={styles.panelBottom}>
      {state.status === 'success' && state.data.items.length > 0 && (
        <PaginationControls
          page={directory.page}
          pageSize={directory.pageSize}
          totalPages={directory.totalPages}
          totalItems={state.data.total}
          onPreviousPage={directory.goToPreviousPage}
          onNextPage={directory.goToNextPage}
          onPageSizeChange={directory.changePageSize}
        />
      )}
    </View>
  );

  return (
    <>
      <FlatList
        role={isMobile ? 'list' : 'table'}
        aria-label="Employees"
        data={employees}
        keyExtractor={(employee) => employee.id}
        renderItem={renderEmployee}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={7}
        // Detaching off-screen rows saves memory on native; on web it can blank rows mid-scroll.
        removeClippedSubviews={Platform.OS !== 'web'}
      />
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
    </>
  );
}

// The panel is drawn in three pieces (top, rows, bottom) because the rows
// scroll inside the list rather than inside one bordered card.
const styles = StyleSheet.create({
  content: {
    width: '100%',
    maxWidth: 1320,
    alignSelf: 'center',
    padding: spacing.lg,
  },
  header: {
    gap: spacing.lg - spacing.xs,
  },
  panelTop: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    boxShadow: elevation.card,
    overflow: 'hidden',
  },
  panelRow: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  panelBottom: {
    minHeight: radius.lg,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
});
