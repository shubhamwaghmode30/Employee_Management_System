import type { ApiClient } from '../../api/api-client';
import type { EmployeeDataSource } from './employee-data-source';
import { paginatedEmployeesSchema } from './employee-schemas';

/** Reads employees from GET /api/v1/employees. */
export function createApiEmployeeDataSource(apiClient: ApiClient): EmployeeDataSource {
  return {
    listEmployees(params) {
      return apiClient.request('/employees', { schema: paginatedEmployeesSchema, query: params });
    },
  };
}
