import { useEffect, useState } from 'react';

import type { ApiError } from '../../api/api-error';
import type { EmployeeDataSource } from './employee-data-source';
import type { DeletedEmployee, Employee, PaginatedDeletedEmployees } from './employee-schemas';

export type DeletedEmployeesState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; data: PaginatedDeletedEmployees };

const pageSize = 20;

/** Controller for the deleted-employees page: paging, loading and restoring. */
export function useDeletedEmployees(dataSource: EmployeeDataSource, onRestored: (employee: Employee) => void) {
  const [page, setPage] = useState(1);
  const [reloadCount, setReloadCount] = useState(0);
  const [state, setState] = useState<DeletedEmployeesState>({ status: 'loading' });
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<ApiError | null>(null);

  useEffect(() => {
    let isCurrentRequest = true;
    setState({ status: 'loading' });
    void dataSource.listDeletedEmployees({ page, page_size: pageSize }).then((result) => {
      if (isCurrentRequest) {
        setState(result.ok ? { status: 'success', data: result.value } : { status: 'error', error: result.error });
      }
    });
    return () => {
      isCurrentRequest = false;
    };
  }, [dataSource, page, reloadCount]);

  const totalPages = state.status === 'success' ? Math.max(1, Math.ceil(state.data.total / pageSize)) : 1;

  return {
    state,
    page,
    totalPages,
    restoringId,
    restoreError,
    goToPreviousPage() {
      setPage((currentPage) => Math.max(1, currentPage - 1));
    },
    goToNextPage() {
      setPage((currentPage) => Math.min(totalPages, currentPage + 1));
    },
    reload() {
      setReloadCount((count) => count + 1);
    },
    async restore(employee: DeletedEmployee) {
      setRestoreError(null);
      setRestoringId(employee.id);
      const result = await dataSource.restoreEmployee(employee.id);
      setRestoringId(null);
      if (result.ok) {
        onRestored(result.value);
      } else {
        setRestoreError(result.error);
      }
    },
  };
}
