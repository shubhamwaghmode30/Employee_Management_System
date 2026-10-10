import { useEffect, useState } from 'react';

import type { ApiError } from '../../api/api-error';
import type { Result } from '../../types/result';
import type { EmployeeDataSource } from './employee-data-source';
import type { Employee } from './employee-schemas';

export type EmployeeDetailsState =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'success'; employee: Employee };

type SettledRequest = {
  requestKey: string;
  result: Result<Employee, ApiError>;
};

/** Controller that loads one employee and can reload it. */
export function useEmployeeDetails(dataSource: EmployeeDataSource, employeeId: string) {
  const [reloadCount, setReloadCount] = useState(0);
  const [settledRequest, setSettledRequest] = useState<SettledRequest | null>(null);
  const requestKey = `${employeeId}#${reloadCount}`;

  useEffect(() => {
    let isCurrentRequest = true;
    void dataSource.getEmployee(employeeId).then((result) => {
      if (isCurrentRequest) {
        setSettledRequest({ requestKey, result });
      }
    });
    return () => {
      isCurrentRequest = false;
    };
  }, [dataSource, employeeId, requestKey]);

  let state: EmployeeDetailsState = { status: 'loading' };
  if (settledRequest !== null && settledRequest.requestKey === requestKey) {
    const { result } = settledRequest;
    state = result.ok ? { status: 'success', employee: result.value } : { status: 'error', error: result.error };
  }

  return {
    state,
    reload() {
      setReloadCount((count) => count + 1);
    },
  };
}
