import { useEffect, useState } from 'react';

import type { EmployeeDataSource } from './employee-data-source';

/**
 * Departments currently in use, for filters and form suggestions. A failed
 * load leaves the list empty: both callers still work without suggestions.
 */
export function useDepartments(dataSource: EmployeeDataSource): readonly string[] {
  const [departments, setDepartments] = useState<readonly string[]>([]);

  useEffect(() => {
    let isCurrentRequest = true;
    void dataSource.listDepartments().then((result) => {
      if (isCurrentRequest && result.ok) {
        setDepartments(result.value);
      }
    });
    return () => {
      isCurrentRequest = false;
    };
  }, [dataSource]);

  return departments;
}
