import { useState } from 'react';

import type { ApiError } from '../../api/api-error';
import type { EmployeeDataSource } from './employee-data-source';
import type { Employee } from './employee-schemas';

/** Controller for confirming and running an employee soft delete. */
export function useEmployeeDeletion(
  dataSource: EmployeeDataSource,
  onDeleted: (employee: Employee) => void,
) {
  const [pendingEmployee, setPendingEmployee] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  return {
    pendingEmployee,
    isDeleting,
    error,
    requestDeletion(employee: Employee) {
      setError(null);
      setPendingEmployee(employee);
    },
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
