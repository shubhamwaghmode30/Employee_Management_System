import { z } from 'zod';

import { getRoleName, roleIdsByName, roleNames } from '../../auth/roles';
import type { Result } from '../../types/result';
import type { RoleName } from '../../types/role-name';
import type { EmployeeCreateInput, EmployeeUpdateInput, EmploymentTerms } from './employee-inputs';
import type { Employee, EmploymentType } from './employee-schemas';

/** Everything the create and edit forms hold, as the user typed it. */
export type EmployeeFormValues = {
  employeeCode: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  jobTitle: string;
  hireDate: string;
  role: RoleName;
  employmentType: EmploymentType;
  annualSalary: string;
  hourlyRate: string;
  contractEndDate: string;
  isActive: boolean;
};

export type EmployeeFormField = keyof EmployeeFormValues;

export type FieldErrors = { [Field in EmployeeFormField]?: string | undefined };

export const emptyEmployeeFormValues: EmployeeFormValues = {
  employeeCode: '',
  password: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  jobTitle: '',
  hireDate: '',
  role: 'EMPLOYEE',
  employmentType: 'FULL_TIME',
  annualSalary: '',
  hourlyRate: '',
  contractEndDate: '',
  isActive: true,
};

export function formValuesFromEmployee(employee: Employee): EmployeeFormValues {
  return {
    ...emptyEmployeeFormValues,
    employeeCode: employee.employee_code,
    firstName: employee.first_name,
    lastName: employee.last_name,
    email: employee.email,
    phone: employee.phone ?? '',
    department: employee.department,
    jobTitle: employee.job_title,
    hireDate: employee.hire_date.slice(0, 10),
    // Least privilege if the backend ever returns a role this app does not know.
    role: getRoleName(employee.role_id) ?? 'EMPLOYEE',
    employmentType: employee.employment_type,
    annualSalary: employee.employment_type === 'FULL_TIME' ? (employee.annual_salary ?? '') : '',
    hourlyRate: employee.employment_type === 'CONTRACT' ? (employee.hourly_rate ?? '') : '',
    contractEndDate:
      employee.employment_type === 'CONTRACT' ? (employee.contract_end_date?.slice(0, 10) ?? '') : '',
    isActive: employee.is_active,
  };
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function isCalendarDate(text: string): boolean {
  const parsed = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(text);
}

function requiredText(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(maxLength, `${label} must be at most ${maxLength} characters`);
}

function optionalDate(label: string) {
  return z
    .string()
    .trim()
    .refine((text) => text === '' || (datePattern.test(text) && isCalendarDate(text)), {
      message: `${label} must be a date like 2026-10-09`,
    });
}

// Numeric(10, 2) on the backend: up to 8 digits before the point and 2 after.
function optionalMoney(label: string) {
  return z
    .string()
    .trim()
    .regex(/^(\d{1,8}(\.\d{1,2})?)?$/, `${label} must be a number with up to 2 decimal places`);
}

const detailsSchema = z
  .object({
    firstName: requiredText('First name', 100),
    lastName: requiredText('Last name', 100),
    email: requiredText('Email', 255).pipe(z.email('Enter a valid email address')),
    phone: z
      .string()
      .trim()
      .max(20, 'Phone must be at most 20 characters')
      .regex(/^[+\d\s()-]*$/, 'Phone can only contain digits, spaces, +, ( ) and -'),
    department: requiredText('Department', 100),
    jobTitle: requiredText('Job title', 100),
    hireDate: optionalDate('Hire date').refine((text) => text !== '', { message: 'Hire date is required' }),
    role: z.enum(roleNames),
    employmentType: z.enum(['FULL_TIME', 'CONTRACT']),
    annualSalary: optionalMoney('Annual salary'),
    hourlyRate: optionalMoney('Hourly rate'),
    contractEndDate: optionalDate('Contract end date'),
    isActive: z.boolean(),
  })
  .refine(
    ({ employmentType, hireDate, contractEndDate }) =>
      employmentType !== 'CONTRACT' || contractEndDate === '' || contractEndDate >= hireDate,
    { message: 'Contract end date cannot be before the hire date', path: ['contractEndDate'] },
  );

const accountSchema = z.object({
  employeeCode: requiredText('Employee code', 20).regex(
    /^[A-Za-z0-9-]+$/,
    'Employee code can only contain letters, digits and -',
  ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

type ParsedDetails = z.infer<typeof detailsSchema>;

export function validateCreateForm(values: EmployeeFormValues): Result<EmployeeCreateInput, FieldErrors> {
  const relevantValues = clearHiddenPayFields(values);
  const details = detailsSchema.safeParse(relevantValues);
  const account = accountSchema.safeParse(relevantValues);
  if (!details.success || !account.success) {
    return { ok: false, error: { ...toFieldErrors(details.error), ...toFieldErrors(account.error) } };
  }
  return {
    ok: true,
    value: {
      employee_code: account.data.employeeCode,
      password: account.data.password,
      ...toDetailsInput(details.data),
      ...toTermsInput(details.data),
    },
  };
}

export function validateUpdateForm(values: EmployeeFormValues): Result<EmployeeUpdateInput, FieldErrors> {
  const details = detailsSchema.safeParse(clearHiddenPayFields(values));
  if (!details.success) {
    return { ok: false, error: toFieldErrors(details.error) };
  }
  return {
    ok: true,
    value: {
      ...toDetailsInput(details.data),
      is_active: details.data.isActive,
      ...toTermsInput(details.data),
    },
  };
}

/** Pay fields of the other employment type are hidden, so they must not block saving. */
function clearHiddenPayFields(values: EmployeeFormValues): EmployeeFormValues {
  return values.employmentType === 'FULL_TIME'
    ? { ...values, hourlyRate: '', contractEndDate: '' }
    : { ...values, annualSalary: '' };
}

function toDetailsInput(details: ParsedDetails) {
  return {
    first_name: details.firstName,
    last_name: details.lastName,
    email: details.email,
    phone: details.phone === '' ? null : details.phone,
    department: details.department,
    job_title: details.jobTitle,
    hire_date: `${details.hireDate}T00:00:00Z`,
    role_id: roleIdsByName[details.role],
  };
}

function toTermsInput(details: ParsedDetails): EmploymentTerms {
  if (details.employmentType === 'FULL_TIME') {
    return {
      employment_type: 'FULL_TIME',
      annual_salary: details.annualSalary === '' ? null : details.annualSalary,
    };
  }
  return {
    employment_type: 'CONTRACT',
    hourly_rate: details.hourlyRate === '' ? null : details.hourlyRate,
    contract_end_date: details.contractEndDate === '' ? null : `${details.contractEndDate}T00:00:00Z`,
  };
}

function isFormField(key: PropertyKey): key is EmployeeFormField {
  return typeof key === 'string' && Object.hasOwn(emptyEmployeeFormValues, key);
}

function toFieldErrors(error: z.ZodError | undefined): FieldErrors {
  const fieldErrors: FieldErrors = {};
  for (const issue of error?.issues ?? []) {
    const field = issue.path[0];
    if (field !== undefined && isFormField(field) && fieldErrors[field] === undefined) {
      fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
}
