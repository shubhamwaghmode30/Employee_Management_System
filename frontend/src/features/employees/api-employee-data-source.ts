import { z } from 'zod';

import type { ApiClient } from '../../api/api-client';
import type { EmployeeDataSource } from './employee-data-source';
import { employeeSchema, paginatedEmployeesSchema } from './employee-schemas';

/** Reads and writes employees through /api/v1/employees. */
export function createApiEmployeeDataSource(apiClient: ApiClient): EmployeeDataSource {
  return {
    listEmployees(params) {
      return apiClient.request('/employees', { schema: paginatedEmployeesSchema, query: params });
    },
    getEmployee(id) {
      return apiClient.request(`/employees/${encodeURIComponent(id)}`, { schema: employeeSchema });
    },
    createEmployee(input) {
      return apiClient.request('/employees', { schema: employeeSchema, method: 'POST', body: input });
    },
    updateEmployee(id, input) {
      return apiClient.request(`/employees/${encodeURIComponent(id)}`, {
        schema: employeeSchema,
        method: 'PATCH',
        body: input,
      });
    },
    deleteEmployee(id) {
      return apiClient.request(`/employees/${encodeURIComponent(id)}`, {
        schema: z.null(),
        method: 'DELETE',
      });
    },
  };
}
