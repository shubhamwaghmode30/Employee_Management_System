import { z } from 'zod';

import type { RoleCatalog } from '../../auth/role-catalog';
import { roleNames } from '../../auth/roles';
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

export function formValuesFromEmployee(employee: Employee, roleCatalog: RoleCatalog): EmployeeFormValues {
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
    role: roleCatalog.getRoleName(employee.role_id) ?? 'EMPLOYEE',
    employmentType: employee.employment_type,
    annualSalary: employee.employment_type === 'FULL_TIME' ? (employee.annual_salary ?? '') : '',
    hourlyRate: employee.employment_type === 'CONTRACT' ? (employee.hourly_rate ?? '') : '',
    contractEndDate:
      employee.employment_type === 'CONTRACT' ? (employee.contract_end_date?.slice(0, 10) ?? '') : '',
    isActive: employee.is_active,
  };
}

/**
 * Column sizes from backend app/models/employee.py. Inputs stop at these
 * lengths, so a request the database would reject is never sent.
 */
export const fieldMaxLengths = {
  employeeCode: 20,
  password: 128,
  firstName: 100,
  lastName: 100,
  email: 255,
  phone: 20,
  department: 100,
  jobTitle: 100,
  money: 11,
  date: 10,
} as const;

/** Hires are planned ahead, but a hire date years away is almost always a typo. */
const maxDaysAheadForHireDate = 366;

function isWithinHiringWindow(text: string, today: Date): boolean {
  const latest = new Date(today.getTime() + maxDaysAheadForHireDate * 24 * 60 * 60 * 1000);
  return text >= '1950-01-01' && text <= latest.toISOString().slice(0, 10);
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
// Empty is allowed here so the hidden pay field of the other type never blocks
// saving; the shown one is required by the refinements below.
function money(label: string) {
  return z
    .string()
    .trim()
    .regex(/^(\d{1,8}(\.\d{1,2})?)?$/, `${label} must be a number with up to 2 decimal places`);
}

const detailsSchema = z
  .object({
    firstName: requiredText('First name', fieldMaxLengths.firstName),
    lastName: requiredText('Last name', fieldMaxLengths.lastName),
    // Lower-cased so the payload matches how the backend compares addresses.
    email: requiredText('Email', fieldMaxLengths.email)
      .pipe(z.email('Enter a valid email address'))
      .transform((email) => email.toLowerCase()),
    phone: z
      .string()
      .trim()
      .max(fieldMaxLengths.phone, `Phone must be at most ${fieldMaxLengths.phone} characters`)
      .regex(/^[+\d\s()-]*$/, 'Phone can only contain digits, spaces, +, ( ) and -'),
    department: requiredText('Department', fieldMaxLengths.department),
    jobTitle: requiredText('Job title', fieldMaxLengths.jobTitle),
    hireDate: optionalDate('Hire date').refine((text) => text !== '', { message: 'Hire date is required' }),
    role: z.enum(roleNames),
    employmentType: z.enum(['FULL_TIME', 'CONTRACT']),
    annualSalary: money('Annual salary'),
    hourlyRate: money('Hourly rate'),
    contractEndDate: optionalDate('Contract end date'),
    isActive: z.boolean(),
  })
  .refine(({ employmentType, annualSalary }) => employmentType !== 'FULL_TIME' || annualSalary !== '', {
    message: 'Annual salary is required for full-time employees',
    path: ['annualSalary'],
  })
  .refine(({ employmentType, hourlyRate }) => employmentType !== 'CONTRACT' || hourlyRate !== '', {
    message: 'Hourly rate is required for contract employees',
    path: ['hourlyRate'],
  })
  .refine(
    ({ employmentType, hireDate, contractEndDate }) =>
      employmentType !== 'CONTRACT' || contractEndDate === '' || contractEndDate >= hireDate,
    { message: 'Contract end date cannot be before the hire date', path: ['contractEndDate'] },
  );

// Only checked when creating: the hire date of an existing record cannot be edited.
const hiringWindowSchema = z.object({
  hireDate: z
    .string()
    .trim()
    .refine((text) => !datePattern.test(text) || !isCalendarDate(text) || isWithinHiringWindow(text, new Date()), {
      message: 'Hire date must be between 1950 and one year from today',
    }),
});

const accountSchema = z.object({
  employeeCode: requiredText('Employee code', fieldMaxLengths.employeeCode).regex(
    /^[A-Za-z0-9-]+$/,
    'Employee code can only contain letters, digits and -',
  ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(fieldMaxLengths.password, `Password must be at most ${fieldMaxLengths.password} characters`)
    .refine((password) => password.trim() === password, {
      message: 'Password cannot start or end with a space',
    }),
});

type ParsedDetails = z.infer<typeof detailsSchema>;

export function validateCreateForm(
  values: EmployeeFormValues,
  roleCatalog: RoleCatalog,
): Result<EmployeeCreateInput, FieldErrors> {
  const relevantValues = clearHiddenPayFields(values);
  const details = detailsSchema.safeParse(relevantValues);
  const account = accountSchema.safeParse(relevantValues);
  const hiringWindow = hiringWindowSchema.safeParse(relevantValues);
  const roleId = roleCatalog.getRoleId(values.role);
  if (!details.success || !account.success || !hiringWindow.success || roleId === null) {
    return {
      ok: false,
      error: {
        ...roleError(roleId),
        ...toFieldErrors(hiringWindow.error),
        ...toFieldErrors(details.error),
        ...toFieldErrors(account.error),
      },
    };
  }
  return {
    ok: true,
    value: {
      employee_code: account.data.employeeCode,
      password: account.data.password,
      hire_date: `${details.data.hireDate}T00:00:00Z`,
      ...toDetailsInput(details.data, roleId),
      ...toTermsInput(details.data),
    },
  };
}

/**
 * Validates the whole form, then returns only the fields that differ from the
 * stored employee, so a PATCH never resends values that did not change.
 */
export function validateUpdateForm(
  values: EmployeeFormValues,
  roleCatalog: RoleCatalog,
  original: Employee,
): Result<EmployeeUpdateInput, FieldErrors> {
  const details = detailsSchema.safeParse(clearHiddenPayFields(values));
  const roleId = roleCatalog.getRoleId(values.role);
  if (!details.success || roleId === null) {
    return { ok: false, error: { ...roleError(roleId), ...toFieldErrors(details.error) } };
  }
  return { ok: true, value: changedFields(details.data, roleId, original) };
}

function changedFields(details: ParsedDetails, roleId: number, original: Employee): EmployeeUpdateInput {
  const next = toDetailsInput(details, roleId);
  const changes: EmployeeUpdateInput = {
    ...(next.first_name !== original.first_name && { first_name: next.first_name }),
    ...(next.last_name !== original.last_name && { last_name: next.last_name }),
    ...(next.email !== original.email.toLowerCase() && { email: next.email }),
    ...(next.phone !== original.phone && { phone: next.phone }),
    ...(next.department !== original.department && { department: next.department }),
    ...(next.job_title !== original.job_title && { job_title: next.job_title }),
    ...(next.role_id !== original.role_id && { role_id: next.role_id }),
    ...(details.isActive !== original.is_active && { is_active: details.isActive }),
  };
  if (original.employment_type === 'FULL_TIME') {
    return {
      ...changes,
      ...(!isSameAmount(details.annualSalary, original.annual_salary) && { annual_salary: details.annualSalary }),
    };
  }
  const contractEndDate = toContractEndDate(details);
  return {
    ...changes,
    ...(!isSameAmount(details.hourlyRate, original.hourly_rate) && { hourly_rate: details.hourlyRate }),
    ...(contractEndDate?.slice(0, 10) !== original.contract_end_date?.slice(0, 10) && {
      contract_end_date: contractEndDate,
    }),
  };
}

/** "95000" and "95000.00" are the same salary, so neither counts as a change. */
function isSameAmount(typed: string, stored: string | null): boolean {
  return stored !== null && Number(typed) === Number(stored);
}

export function hasChanges(input: EmployeeUpdateInput): boolean {
  return Object.keys(input).length > 0;
}

/** Pay fields of the other employment type are hidden, so they must not block saving. */
function clearHiddenPayFields(values: EmployeeFormValues): EmployeeFormValues {
  return values.employmentType === 'FULL_TIME'
    ? { ...values, hourlyRate: '', contractEndDate: '' }
    : { ...values, annualSalary: '' };
}

/** A role the database does not hold cannot be sent, even if the form offers it. */
function roleError(roleId: number | null): FieldErrors {
  return roleId === null ? { role: 'This role is not available' } : {};
}

function toDetailsInput(details: ParsedDetails, roleId: number) {
  return {
    first_name: details.firstName,
    last_name: details.lastName,
    email: details.email,
    phone: details.phone === '' ? null : details.phone,
    department: details.department,
    job_title: details.jobTitle,
    role_id: roleId,
  };
}

function toContractEndDate(details: ParsedDetails): string | null {
  return details.contractEndDate === '' ? null : `${details.contractEndDate}T00:00:00Z`;
}

function toTermsInput(details: ParsedDetails): EmploymentTerms {
  if (details.employmentType === 'FULL_TIME') {
    return { employment_type: 'FULL_TIME', annual_salary: details.annualSalary };
  }
  return {
    employment_type: 'CONTRACT',
    hourly_rate: details.hourlyRate,
    contract_end_date: toContractEndDate(details),
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
