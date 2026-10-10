/* Request bodies matching EmployeeCreate and EmployeeUpdate in backend app/schemas/employee.py. */

type EmployeeDetailsInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department: string;
  job_title: string;
  role_id: number;
};

type FullTimeTerms = {
  employment_type: 'FULL_TIME';
  annual_salary: string;
};

type ContractTerms = {
  employment_type: 'CONTRACT';
  hourly_rate: string;
  contract_end_date: string | null;
};

/** Pay fields, which depend on the employment type. */
export type EmploymentTerms = FullTimeTerms | ContractTerms;

export type EmployeeCreateInput = EmployeeDetailsInput & {
  employee_code: string;
  password: string;
  hire_date: string;
} & EmploymentTerms;

/** Pay fields an update may change; the employment type itself is fixed after creation. */
export type PayUpdate =
  | { annual_salary: string }
  | { hourly_rate: string; contract_end_date: string | null };

/**
 * PATCH body. Employee code, hire date and employment type are fixed after
 * creation, and passwords change only through POST /auth/change-password.
 */
export type EmployeeUpdateInput = EmployeeDetailsInput & {
  is_active: boolean;
} & PayUpdate;
