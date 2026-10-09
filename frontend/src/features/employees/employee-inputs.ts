/*
 * Request bodies for creating and updating employees, following the backend
 * Employee model. Align with the EmployeeCreate and EmployeeUpdate schemas once
 * the backend schemas are merged.
 */

type EmployeeDetailsInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  department: string;
  job_title: string;
  hire_date: string;
  role_id: number;
};

type FullTimeTerms = {
  employment_type: 'FULL_TIME';
  annual_salary: string | null;
};

type ContractTerms = {
  employment_type: 'CONTRACT';
  hourly_rate: string | null;
  contract_end_date: string | null;
};

/** Pay fields, which depend on the employment type. */
export type EmploymentTerms = FullTimeTerms | ContractTerms;

export type EmployeeCreateInput = EmployeeDetailsInput & {
  employee_code: string;
  password: string;
} & EmploymentTerms;

/** PATCH body. Never carries a password: that has its own change-password path. */
export type EmployeeUpdateInput = EmployeeDetailsInput & {
  is_active: boolean;
} & EmploymentTerms;
