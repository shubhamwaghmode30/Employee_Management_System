import { useCallback, useState } from 'react';

import type { ApiError } from '../../api/api-error';
import type { EmployeeDataSource } from './employee-data-source';
import type { EmployeeSummary } from './employee-schemas';

/** Controller for confirming and running an employee soft delete. */
export function useEmployeeDeletion(
  dataSource: EmployeeDataSource,
  onDeleted: (employee: EmployeeSummary) => void,
) {
  const [pendingEmployee, setPendingEmployee] = useState<EmployeeSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  // Stable, so memoised list rows that receive it do not re-render on every change.
  const requestDeletion = useCallback((employee: EmployeeSummary) => {
    setError(null);
    setPendingEmployee(employee);
  }, []);

  return {
    pendingEmployee,
    isDeleting,
    error,
    requestDeletion,
    cancelDeletion() {
      setPendingEmployee(null);
      setError(null);
    },
    async confirmDeletion() {
      if (pendingEmployee === null) {
        return;
      }
      setIsDeleting(true);
      const result = await dataSource.deleteEmployee(pendingEmployee.id);
      setIsDeleting(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPendingEmployee(null);
      onDeleted(pendingEmployee);
    },
  };
}
