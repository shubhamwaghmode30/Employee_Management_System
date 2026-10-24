import { z } from 'zod';

import type { ApiClient } from '../../api/api-client';
import { roleSchema } from '../../api/schemas/role';
import type { EmployeeDataSource } from './employee-data-source';
import { employeeSchema, paginatedDeletedEmployeesSchema, paginatedEmployeesSchema } from './employee-schemas';
import { employeeStatsSchema } from './employee-stats-schema';

/** Mirrors EmailAvailabilityResponse, unwrapped to the one value callers need. */
const emailAvailabilitySchema = z.object({ is_available: z.boolean() }).transform((body) => body.is_available);

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
    listDeletedEmployees(params) {
      return apiClient.request('/employees/deleted', { schema: paginatedDeletedEmployeesSchema, query: params });
    },
    restoreEmployee(id) {
      return apiClient.request(`/employees/${encodeURIComponent(id)}/restore`, {
        schema: employeeSchema,
        method: 'POST',
      });
    },
    listDepartments() {
      return apiClient.request('/employees/departments', { schema: z.array(z.string()) });
    },
    getStats() {
      return apiClient.request('/employees/stats', { schema: employeeStatsSchema });
    },
    listRoles() {
      return apiClient.request('/roles', { schema: z.array(roleSchema) });
    },
    checkEmailAvailability(email, excludingId) {
      // POST keeps the address out of URLs and server access logs.
      return apiClient.request('/employees/email-availability', {
        schema: emailAvailabilitySchema,
        method: 'POST',
        body: { email, excluding_id: excludingId },
      });
    },
  };
}
