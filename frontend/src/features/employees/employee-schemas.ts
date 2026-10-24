import { z } from 'zod';

/*
 * Mirrors EmployeeRead, EmployeeSummary and PaginatedEmployees in backend
 * app/schemas/employee.py. Decimals arrive as strings because Pydantic
 * serialises Decimal to JSON strings.
 */

const utcOffsetPattern = /(Z|[+-]\d{2}:?\d{2})$/;

// SQLite drops the UTC offset on the way back. The backend stores UTC, so an
// offset-less value is marked as UTC instead of being read as local time.
const isoDateTime = z.iso
  .datetime({ offset: true, local: true })
  .transform((value) => (utcOffsetPattern.test(value) ? value : `${value}Z`));

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

/** A directory row: list endpoints leave out contact, pay and audit fields. */
export const employeeSummarySchema = z.object({
  id: z.string(),
  employee_code: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.email(),
  department: z.string(),
  job_title: z.string(),
  hire_date: isoDateTime,
  is_active: z.boolean(),
  role_id: z.number().int(),
  employment_type: z.enum(['FULL_TIME', 'CONTRACT']),
});

export const paginatedEmployeesSchema = z.object({
  items: z.array(employeeSummarySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

/** Mirrors DeletedEmployeeSummary and PaginatedDeletedEmployees. */
export const deletedEmployeeSchema = employeeSummarySchema.extend({
  deleted_at: isoDateTime,
  deleted_by_id: z.string().nullable(),
});

export const paginatedDeletedEmployeesSchema = z.object({
  items: z.array(deletedEmployeeSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  page_size: z.number().int().positive(),
});

export type Employee = z.infer<typeof employeeSchema>;
export type DeletedEmployee = z.infer<typeof deletedEmployeeSchema>;
export type PaginatedDeletedEmployees = z.infer<typeof paginatedDeletedEmployeesSchema>;
export type EmploymentType = Employee['employment_type'];
export type EmployeeSummary = z.infer<typeof employeeSummarySchema>;
export type PaginatedEmployees = z.infer<typeof paginatedEmployeesSchema>;
