import type { ApiError } from '../../api/api-error';
import type { Result } from '../../types/result';
import type { PaginatedEmployees } from './employee-schemas';

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
};
