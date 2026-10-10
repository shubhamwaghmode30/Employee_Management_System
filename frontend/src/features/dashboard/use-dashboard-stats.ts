import { useEffect, useState } from 'react';

import type { ApiError } from '../../api/api-error';
import type { Result } from '../../types/result';
import type { EmployeeDataSource } from '../employees/employee-data-source';
import type { EmployeeStats } from '../employees/employee-stats-schema';

export type DashboardState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; stats: EmployeeStats };

/** Loads the dashboard summary from GET /employees/stats and can reload it. */
export function useDashboardStats(dataSource: EmployeeDataSource) {
  const [reloadCount, setReloadCount] = useState(0);
  const [settled, setSettled] = useState<{ key: number; result: Result<EmployeeStats, ApiError> } | null>(
    null,
  );

  useEffect(() => {
    let isCurrentRequest = true;
    void dataSource.getStats().then((result) => {
      if (isCurrentRequest) {
        setSettled({ key: reloadCount, result });
      }
    });
    return () => {
      isCurrentRequest = false;
    };
  }, [dataSource, reloadCount]);

  let state: DashboardState = { status: 'loading' };
  if (settled !== null && settled.key === reloadCount) {
    state = settled.result.ok
      ? { status: 'success', stats: settled.result.value }
      : { status: 'error', error: settled.result.error };
  }

  return {
    state,
    reload() {
      setReloadCount((count) => count + 1);
    },
  };
}
