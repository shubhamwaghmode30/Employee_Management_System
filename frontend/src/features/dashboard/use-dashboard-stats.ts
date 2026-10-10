import { useEffect, useState } from 'react';

import type { ApiError } from '../../api/api-error';
import type { Result } from '../../types/result';
import type { EmployeeDataSource, EmployeeListParams } from '../employees/employee-data-source';

export type DepartmentHeadcount = {
  department: string;
  count: number;
};

export type DashboardStats = {
  total: number;
  active: number;
  inactive: number;
  departments: readonly DepartmentHeadcount[];
};

export type DashboardState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; stats: DashboardStats };

/** Counting requests only need the total, so ask for the smallest page. */
async function countEmployees(
  dataSource: EmployeeDataSource,
  filters: Omit<EmployeeListParams, 'page' | 'page_size'>,
): Promise<Result<number, ApiError>> {
  const result = await dataSource.listEmployees({ page: 1, page_size: 1, ...filters });
  return result.ok ? { ok: true, value: result.value.total } : result;
}

async function loadStats(dataSource: EmployeeDataSource): Promise<Result<DashboardStats, ApiError>> {
  const [total, active, inactive, departmentNames] = await Promise.all([
    countEmployees(dataSource, {}),
    countEmployees(dataSource, { is_active: true }),
    countEmployees(dataSource, { is_active: false }),
    dataSource.listDepartments(),
  ]);
  if (!total.ok) {
    return total;
  }
  if (!active.ok) {
    return active;
  }
  if (!inactive.ok) {
    return inactive;
  }
  if (!departmentNames.ok) {
    return departmentNames;
  }

  const departmentCounts = await Promise.all(
    departmentNames.value.map(async (department) => ({
      department,
      result: await countEmployees(dataSource, { department }),
    })),
  );
  const departments: DepartmentHeadcount[] = [];
  for (const { department, result } of departmentCounts) {
    if (!result.ok) {
      return result;
    }
    departments.push({ department, count: result.value });
  }
  departments.sort((first, second) => second.count - first.count);

  return {
    ok: true,
    value: { total: total.value, active: active.value, inactive: inactive.value, departments },
  };
}

/** Headcount figures for the dashboard, built from the employee list endpoint. */
export function useDashboardStats(dataSource: EmployeeDataSource) {
  const [reloadCount, setReloadCount] = useState(0);
  const [settled, setSettled] = useState<{ key: number; result: Result<DashboardStats, ApiError> } | null>(
    null,
  );

  useEffect(() => {
    let isCurrentRequest = true;
    void loadStats(dataSource).then((result) => {
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
