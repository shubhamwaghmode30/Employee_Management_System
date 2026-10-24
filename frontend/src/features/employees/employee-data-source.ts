import type { ApiError } from '../../api/api-error';
import type { Role } from '../../api/schemas/role';
import type { Result } from '../../types/result';
import type { EmployeeCreateInput, EmployeeUpdateInput } from './employee-inputs';
import type { Employee, PaginatedDeletedEmployees, PaginatedEmployees } from './employee-schemas';
import type { EmployeeStats } from './employee-stats-schema';

/** Query parameters of GET /api/v1/employees, named as the API names them. */
export type EmployeeListParams = {
  page: number;
  page_size: number;
  q?: string;
  department?: string;
  is_active?: boolean;
};

export type PageParams = Pick<EmployeeListParams, 'page' | 'page_size'>;

/**
 * Where employee data comes from. The mock source and the API source both
 * implement this, so screens never know which one they are using.
 */
export type EmployeeDataSource = {
  listEmployees(params: EmployeeListParams): Promise<Result<PaginatedEmployees, ApiError>>;
  getEmployee(id: string): Promise<Result<Employee, ApiError>>;
  createEmployee(input: EmployeeCreateInput): Promise<Result<Employee, ApiError>>;
  updateEmployee(id: string, input: EmployeeUpdateInput): Promise<Result<Employee, ApiError>>;
  deleteEmployee(id: string): Promise<Result<null, ApiError>>;
  listDeletedEmployees(params: PageParams): Promise<Result<PaginatedDeletedEmployees, ApiError>>;
  restoreEmployee(id: string): Promise<Result<Employee, ApiError>>;
  listDepartments(): Promise<Result<string[], ApiError>>;
  getStats(): Promise<Result<EmployeeStats, ApiError>>;
  listRoles(): Promise<Result<Role[], ApiError>>;
  /** True when no other live employee uses the email. Sends only the email, not the form. */
  checkEmailAvailability(email: string, excludingId: string | null): Promise<Result<boolean, ApiError>>;
};
