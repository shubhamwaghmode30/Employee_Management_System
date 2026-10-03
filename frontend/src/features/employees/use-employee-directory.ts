import { useEffect, useMemo, useState } from 'react';

import type { ApiError } from '../../api/api-error';
import { useDebouncedValue } from '../../hooks/use-debounced-value';
import type { Result } from '../../types/result';
import type { EmployeeDataSource, EmployeeListParams } from './employee-data-source';
import type { PaginatedEmployees } from './employee-schemas';

export type StatusFilter = 'all' | 'active' | 'inactive';

export type DirectoryState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; data: PaginatedEmployees };

type SettledRequest = {
  requestKey: string;
  result: Result<PaginatedEmployees, ApiError>;
};

const searchDebounceMs = 300;
const defaultPageSize = 10;

/** Controller for the employee directory: filters, paging and request state. */
export function useEmployeeDirectory(dataSource: EmployeeDataSource, pageSize = defaultPageSize) {
  const [searchText, setSearchText] = useState('');
  const [department, setDepartment] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [settledRequest, setSettledRequest] = useState<SettledRequest | null>(null);

  const debouncedSearch = useDebouncedValue(searchText.trim(), searchDebounceMs);

  const params = useMemo(() => {
    const listParams: EmployeeListParams = { page, page_size: pageSize };
    if (debouncedSearch !== '') {
      listParams.q = debouncedSearch;
    }
    if (department !== null) {
      listParams.department = department;
    }
    if (statusFilter !== 'all') {
      listParams.is_active = statusFilter === 'active';
    }
    return listParams;
  }, [page, pageSize, debouncedSearch, department, statusFilter]);

  // Loading is derived: the screen is loading until a result arrives for the current request.
  const requestKey = `${JSON.stringify(params)}#${retryCount}`;

  useEffect(() => {
    let isCurrentRequest = true;
    void dataSource.listEmployees(params).then((result) => {
      if (isCurrentRequest) {
        setSettledRequest({ requestKey, result });
      }
    });
    return () => {
      isCurrentRequest = false;
    };
  }, [dataSource, params, requestKey]);

  const state: DirectoryState = toDirectoryState(settledRequest, requestKey);
  const totalPages =
    state.status === 'success' ? Math.max(1, Math.ceil(state.data.total / state.data.page_size)) : 1;
  const hasActiveFilters = searchText !== '' || department !== null || statusFilter !== 'all';

  return {
    state,
    searchText,
    department,
    statusFilter,
    page,
    totalPages,
    hasActiveFilters,
    changeSearchText(text: string) {
      setSearchText(text);
      setPage(1);
    },
    changeDepartment(nextDepartment: string | null) {
      setDepartment(nextDepartment);
      setPage(1);
    },
    changeStatusFilter(nextStatusFilter: StatusFilter) {
      setStatusFilter(nextStatusFilter);
      setPage(1);
    },
    goToPreviousPage() {
      setPage((currentPage) => Math.max(1, currentPage - 1));
    },
    goToNextPage() {
      setPage((currentPage) => Math.min(totalPages, currentPage + 1));
    },
    clearFilters() {
      setSearchText('');
      setDepartment(null);
      setStatusFilter('all');
      setPage(1);
    },
    retry() {
      setRetryCount((count) => count + 1);
    },
  };
}

function toDirectoryState(settledRequest: SettledRequest | null, requestKey: string): DirectoryState {
  if (settledRequest === null || settledRequest.requestKey !== requestKey) {
    return { status: 'loading' };
  }
  const { result } = settledRequest;
  return result.ok ? { status: 'success', data: result.value } : { status: 'error', error: result.error };
}
