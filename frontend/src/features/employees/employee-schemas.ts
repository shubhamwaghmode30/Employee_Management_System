import { z } from 'zod';

/*
 * Mirrors backend app/models/employee.py (minus password_hash and deleted_at,
 * which the API never exposes). Decimals arrive as strings because Pydantic
 * serialises Decimal to JSON strings. Align with EmployeeRead and
 * PaginatedEmployees once the backend schemas are merged.
 */

const isoDateTime = z.iso.datetime({ offset: true });

const employeeBaseSchema = z.object({
  id: z.string(),
  employee_code: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.email(),
  phone: z.string().nullable(),
  department: z.string(),
  job_title: z.string(),
  hire_date: isoDateTime,
  is_active: z.boolean(),
  role_id: z.number().int(),
  created_at: isoDateTime,
  updated_at: isoDateTime,
});

const fullTimeEmployeeSchema = employeeBaseSchema.extend({
  employment_type: z.literal('FULL_TIME'),
  annual_salary: z.string().nullable(),
});

const contractEmployeeSchema = employeeBaseSchema.extend({
  employment_type: z.literal('CONTRACT'),
  hourly_rate: z.string().nullable(),
  contract_end_date: isoDateTime.nullable(),
});

export const employeeSchema = z.discriminatedUnion('employment_type', [
  fullTimeEmployeeSchema,
  contractEmployeeSchema,
]);

export const paginatedEmployeesSchema = z.object({
  items: z.array(employeeSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

export type Employee = z.infer<typeof employeeSchema>;
export type EmploymentType = Employee['employment_type'];
export type PaginatedEmployees = z.infer<typeof paginatedEmployeesSchema>;
