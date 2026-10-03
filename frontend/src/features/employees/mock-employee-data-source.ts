import { z } from 'zod';

import type { EmployeeDataSource, EmployeeListParams } from './employee-data-source';
import { type Employee, employeeSchema } from './employee-schemas';
import mockEmployees from './mock-employees.json';

type MockEmployeeDataSourceOptions = {
  latencyMs?: number;
};

/**
 * Serves mock-employees.json with the same filtering, pagination and response
 * shape as GET /api/v1/employees. The JSON is validated with the same schema
 * the API response will be, so swapping in the API source changes no screens.
 */
export function createMockEmployeeDataSource({
  latencyMs = 0,
}: MockEmployeeDataSourceOptions = {}): EmployeeDataSource {
  const parsedEmployees = z.array(employeeSchema).safeParse(mockEmployees);

  return {
    async listEmployees(params) {
      if (latencyMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, latencyMs));
      }
      if (!parsedEmployees.success) {
        return {
          ok: false,
          error: { kind: 'invalid_response', message: 'Mock employee data does not match the schema.' },
        };
      }

      const matchingEmployees = parsedEmployees.data.filter((employee) =>
        matchesParams(employee, params),
      );
      const start = (params.page - 1) * params.page_size;
      return {
        ok: true,
        value: {
          items: matchingEmployees.slice(start, start + params.page_size),
          total: matchingEmployees.length,
          page: params.page,
          page_size: params.page_size,
        },
      };
    },
  };
}

function matchesParams(employee: Employee, { q, department, is_active }: EmployeeListParams): boolean {
  if (department !== undefined && employee.department !== department) {
    return false;
  }
  if (is_active !== undefined && employee.is_active !== is_active) {
    return false;
  }
  if (q === undefined) {
    return true;
  }
  const searchTerm = q.toLowerCase();
  return [
    `${employee.first_name} ${employee.last_name}`,
    employee.email,
    employee.employee_code,
  ].some((value) => value.toLowerCase().includes(searchTerm));
}
