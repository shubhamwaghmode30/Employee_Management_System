import type { ApiError } from '../../api/api-error';
import type { Result } from '../../types/result';
import type { EmployeeCreateInput, EmployeeUpdateInput } from './employee-inputs';
import type { Employee, PaginatedEmployees } from './employee-schemas';

/** Query parameters of GET /api/v1/employees, named as the API names them. */
export type EmployeeListParams = {
  page: number;
  page_size: number;
  q?: string;
  department?: string;
  is_active?: boolean;
};

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
};
