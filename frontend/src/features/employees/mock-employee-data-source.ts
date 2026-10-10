import { z } from 'zod';

import type { ApiError } from '../../api/api-error';
import { roleIdsByName, roleNames } from '../../auth/roles';
import type { Result } from '../../types/result';
import type { EmployeeDataSource, EmployeeListParams } from './employee-data-source';
import type { EmployeeCreateInput, EmployeeUpdateInput } from './employee-inputs';
import { type Employee, employeeSchema } from './employee-schemas';
import type { EmployeeStats } from './employee-stats-schema';
import mockEmployees from './mock-employees.json';

type MockEmployeeDataSourceOptions = {
  latencyMs?: number;
};

const invalidMockDataError: ApiError = {
  kind: 'invalid_response',
  message: 'Mock employee data does not match the schema.',
};

/**
 * Serves mock-employees.json as an in-memory store with the same filtering,
 * pagination, uniqueness rules and response shapes as /api/v1/employees. The
 * JSON is validated with the same schema the API response will be, so swapping
 * in the API source changes no screens. Changes last until the app reloads.
 */
export function createMockEmployeeDataSource({
  latencyMs = 0,
}: MockEmployeeDataSourceOptions = {}): EmployeeDataSource {
  const parsedEmployees = z.array(employeeSchema).safeParse(mockEmployees);
  const employees: Employee[] = parsedEmployees.success ? [...parsedEmployees.data] : [];
  let createdCount = 0;

  async function respond<T>(produce: () => Result<T, ApiError>): Promise<Result<T, ApiError>> {
    if (latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, latencyMs));
    }
    return parsedEmployees.success ? produce() : { ok: false, error: invalidMockDataError };
  }

  function findConflict(email: string, employeeCode: string, excludedId: string | null): ApiError | null {
    const others = employees.filter((employee) => employee.id !== excludedId);
    if (others.some((employee) => employee.email.toLowerCase() === email.toLowerCase())) {
      return {
        kind: 'conflict',
        status: 409,
        code: 'DUPLICATE_EMAIL',
        message: `Employee with email '${email}' already exists`,
      };
    }
    if (others.some((employee) => employee.employee_code === employeeCode)) {
      return {
        kind: 'conflict',
        status: 409,
        code: 'DUPLICATE_EMPLOYEE_CODE',
        message: `Employee with code '${employeeCode}' already exists`,
      };
    }
    return null;
  }

  return {
    listEmployees(params) {
      return respond(() => {
        // Same order as EmployeeRepository.search, so pages line up with the API.
        const matchingEmployees = employees
          .filter((employee) => matchesParams(employee, params))
          .sort(
            (first, second) =>
              first.last_name.localeCompare(second.last_name) ||
              first.first_name.localeCompare(second.first_name),
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
      });
    },

    getEmployee(id) {
      return respond(() => {
        const employee = employees.find((candidate) => candidate.id === id);
        return employee === undefined ? { ok: false, error: notFoundError(id) } : { ok: true, value: employee };
      });
    },

    createEmployee(input) {
      return respond(() => {
        const conflict = findConflict(input.email, input.employee_code, null);
        if (conflict !== null) {
          return { ok: false, error: conflict };
        }
        createdCount += 1;
        const now = new Date().toISOString();
        const employee = toEmployee(input, {
          id: `mock-${Date.now().toString(36)}-${createdCount}`,
          employee_code: input.employee_code,
          is_active: true,
          created_at: now,
          updated_at: now,
        });
        employees.push(employee);
        return { ok: true, value: employee };
      });
    },

    updateEmployee(id, input) {
      return respond(() => {
        const index = employees.findIndex((candidate) => candidate.id === id);
        const existing = employees[index];
        if (existing === undefined) {
          return { ok: false, error: notFoundError(id) };
        }
        const conflict = findConflict(input.email, existing.employee_code, id);
        if (conflict !== null) {
          return { ok: false, error: conflict };
        }
        const employee = applyUpdate(existing, input);
        if (employee === null) {
          return { ok: false, error: payMismatchError };
        }
        employees[index] = employee;
        return { ok: true, value: employee };
      });
    },

    deleteEmployee(id) {
      return respond(() => {
        const index = employees.findIndex((candidate) => candidate.id === id);
        if (index === -1) {
          return { ok: false, error: notFoundError(id) };
        }
        employees.splice(index, 1);
        return { ok: true, value: null };
      });
    },

    listDepartments() {
      return respond(() => ({
        ok: true,
        value: [...new Set(employees.map((employee) => employee.department))].sort(),
      }));
    },

    getStats() {
      return respond(() => ({ ok: true, value: summarise(employees) }));
    },
  };
}

/** Same figures and ordering as EmployeeService.get_stats. */
function summarise(employees: readonly Employee[]): EmployeeStats {
  const departmentCounts = new Map<string, number>();
  for (const employee of employees) {
    departmentCounts.set(employee.department, (departmentCounts.get(employee.department) ?? 0) + 1);
  }
  const active = employees.filter((employee) => employee.is_active).length;
  const fullTime = employees.filter((employee) => employee.employment_type === 'FULL_TIME').length;
  return {
    total: employees.length,
    active,
    inactive: employees.length - active,
    full_time: fullTime,
    contract: employees.length - fullTime,
    by_department: [...departmentCounts.entries()]
      .map(([department, count]) => ({ department, count }))
      .sort((first, second) => second.count - first.count || first.department.localeCompare(second.department)),
    by_role: roleNames
      .map((role) => ({
        role,
        count: employees.filter((employee) => employee.role_id === roleIdsByName[role]).length,
      }))
      .filter((entry) => entry.count > 0),
    recent_hires: [...employees].sort((first, second) => second.hire_date.localeCompare(first.hire_date)).slice(0, 5),
  };
}

type ServerManagedFields = Pick<Employee, 'id' | 'employee_code' | 'is_active' | 'created_at' | 'updated_at'>;

const payMismatchError: ApiError = {
  kind: 'validation',
  status: 422,
  code: 'INVALID_EMPLOYEE_DATA',
  message: 'Pay fields do not match the employment type',
};

function toEmployee(input: EmployeeCreateInput, fields: ServerManagedFields): Employee {
  const base = {
    ...fields,
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    phone: input.phone,
    department: input.department,
    job_title: input.job_title,
    hire_date: input.hire_date,
    role_id: input.role_id,
  };
  if (input.employment_type === 'FULL_TIME') {
    return { ...base, employment_type: 'FULL_TIME', annual_salary: input.annual_salary };
  }
  return {
    ...base,
    employment_type: 'CONTRACT',
    hourly_rate: input.hourly_rate,
    contract_end_date: input.contract_end_date,
  };
}

/** Applies a PATCH body the way EmployeeService.update_employee does, or null on a pay mismatch. */
function applyUpdate(existing: Employee, input: EmployeeUpdateInput): Employee | null {
  const details = {
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    phone: input.phone,
    department: input.department,
    job_title: input.job_title,
    role_id: input.role_id,
    is_active: input.is_active,
    updated_at: new Date().toISOString(),
  };
  if (existing.employment_type === 'FULL_TIME') {
    return 'annual_salary' in input
      ? { ...existing, ...details, annual_salary: input.annual_salary }
      : null;
  }
  return 'hourly_rate' in input
    ? {
        ...existing,
        ...details,
        hourly_rate: input.hourly_rate,
        contract_end_date: input.contract_end_date,
      }
    : null;
}

function notFoundError(id: string): ApiError {
  return {
    kind: 'not_found',
    status: 404,
    code: 'EMPLOYEE_NOT_FOUND',
    message: `Employee with identifier '${id}' not found`,
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
  // Same fields as EmployeeRepository.search: each matched on its own, case-insensitively.
  const searchTerm = q.toLowerCase();
  return [employee.first_name, employee.last_name, employee.email, employee.employee_code].some(
    (value) => value.toLowerCase().includes(searchTerm),
  );
}
