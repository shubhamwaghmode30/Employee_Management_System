import { createRoleCatalog } from '../src/auth/role-catalog';
import {
  type EmployeeFormValues,
  emptyEmployeeFormValues,
  formValuesFromEmployee,
  validateCreateForm,
  validateUpdateForm,
} from '../src/features/employees/employee-form-values';
import { employeeSchema } from '../src/features/employees/employee-schemas';
import mockEmployees from '../src/features/employees/mock-employees.json';
import { testRoleCatalog } from '../test-fixtures/role-catalog';

const validFullTime: EmployeeFormValues = {
  ...emptyEmployeeFormValues,
  employeeCode: 'FT0025',
  password: 'Welcome@2026',
  firstName: ' Zara ',
  lastName: 'Ahmed',
  email: 'zara.ahmed@company.com',
  department: 'Marketing',
  jobTitle: 'Brand Manager',
  hireDate: '2026-10-01',
  role: 'EMPLOYEE',
  employmentType: 'FULL_TIME',
  annualSalary: '88000.00',
};

const validContract: EmployeeFormValues = {
  ...validFullTime,
  employeeCode: 'CT0026',
  employmentType: 'CONTRACT',
  annualSalary: '',
  hourlyRate: '45.5',
  contractEndDate: '2027-03-31',
};

describe('validateCreateForm', () => {
  it('turns a valid full-time form into a create request', () => {
    expect(validateCreateForm(validFullTime, testRoleCatalog)).toEqual({
      ok: true,
      value: {
        employee_code: 'FT0025',
        password: 'Welcome@2026',
        first_name: 'Zara',
        last_name: 'Ahmed',
        email: 'zara.ahmed@company.com',
        phone: null,
        department: 'Marketing',
        job_title: 'Brand Manager',
        hire_date: '2026-10-01T00:00:00Z',
        role_id: 3,
        employment_type: 'FULL_TIME',
        annual_salary: '88000.00',
      },
    });
  });

  it('sends only contract pay fields for a contract employee', () => {
    const result = validateCreateForm(
      { ...validContract, annualSalary: 'left over from full time' },
      testRoleCatalog,
    );

    expect(result).toMatchObject({
      ok: true,
      value: {
        employment_type: 'CONTRACT',
        hourly_rate: '45.5',
        contract_end_date: '2027-03-31T00:00:00Z',
      },
    });
    expect(result.ok && 'annual_salary' in result.value).toBe(false);
  });

  it('reports every missing required field', () => {
    const result = validateCreateForm(emptyEmployeeFormValues, testRoleCatalog);

    expect(result).toEqual({
      ok: false,
      error: {
        employeeCode: 'Employee code is required',
        password: 'Password must be at least 8 characters',
        firstName: 'First name is required',
        lastName: 'Last name is required',
        email: 'Email is required',
        department: 'Department is required',
        jobTitle: 'Job title is required',
        hireDate: 'Hire date is required',
        annualSalary: 'Annual salary is required for full-time employees',
      },
    });
  });

  it('requires the hourly rate for a contract employee', () => {
    const result = validateCreateForm({ ...validContract, hourlyRate: '' }, testRoleCatalog);

    expect(!result.ok && result.error.hourlyRate).toBe('Hourly rate is required for contract employees');
  });

  it.each<[string, Partial<EmployeeFormValues>, keyof EmployeeFormValues, string]>([
    ['an invalid email', { email: 'zara.ahmed' }, 'email', 'Enter a valid email address'],
    ['an impossible date', { hireDate: '2026-02-30' }, 'hireDate', 'Hire date must be a date like 2026-10-09'],
    [
      'a salary with three decimals',
      { annualSalary: '88000.123' },
      'annualSalary',
      'Annual salary must be a number with up to 2 decimal places',
    ],
    [
      'letters in the phone number',
      { phone: '+44 call me' },
      'phone',
      'Phone can only contain digits, spaces, +, ( ) and -',
    ],
    [
      'spaces in the employee code',
      { employeeCode: 'FT 0025' },
      'employeeCode',
      'Employee code can only contain letters, digits and -',
    ],
  ])('rejects %s', (_case, override, field, message) => {
    const result = validateCreateForm({ ...validFullTime, ...override }, testRoleCatalog);

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error[field]).toBe(message);
  });

  it('rejects a contract that ends before the hire date', () => {
    const result = validateCreateForm({ ...validContract, contractEndDate: '2026-09-30' }, testRoleCatalog);

    expect(!result.ok && result.error.contractEndDate).toBe(
      'Contract end date cannot be before the hire date',
    );
  });

  it('lower-cases the email the way the backend compares it', () => {
    const result = validateCreateForm({ ...validFullTime, email: ' Zara.Ahmed@Company.com ' }, testRoleCatalog);

    expect(result.ok && result.value.email).toBe('zara.ahmed@company.com');
  });

  it.each([
    ['decades in the past', '1890-05-01'],
    ['years in the future', '2031-01-15'],
  ])('rejects a hire date %s', (_case, hireDate) => {
    const result = validateCreateForm({ ...validFullTime, hireDate }, testRoleCatalog);

    expect(!result.ok && result.error.hireDate).toBe('Hire date must be between 1950 and one year from today');
  });

  it('rejects a password wrapped in spaces', () => {
    const result = validateCreateForm({ ...validFullTime, password: ' Welcome@2026 ' }, testRoleCatalog);

    expect(!result.ok && result.error.password).toBe('Password cannot start or end with a space');
  });

  it('sends the role id the database assigned, not a hard-coded one', () => {
    const catalog = createRoleCatalog([{ id: 42, name: 'EMPLOYEE', description: 'Employee' }]);

    const result = validateCreateForm(validFullTime, catalog);

    expect(result.ok && result.value.role_id).toBe(42);
  });

  it('rejects a role the database does not hold', () => {
    const catalog = createRoleCatalog([{ id: 42, name: 'EMPLOYEE', description: 'Employee' }]);

    const result = validateCreateForm({ ...validFullTime, role: 'HR_MANAGER' }, catalog);

    expect(!result.ok && result.error.role).toBe('This role is not available');
  });
});

describe('validateUpdateForm', () => {
  const priya = employeeSchema.parse(mockEmployees[0]);
  const priyaValues = formValuesFromEmployee(priya, testRoleCatalog);

  it('sends only the fields that changed', () => {
    const result = validateUpdateForm(
      { ...priyaValues, jobTitle: 'Head of People', isActive: false },
      testRoleCatalog,
      priya,
    );

    expect(result).toEqual({ ok: true, value: { job_title: 'Head of People', is_active: false } });
  });

  it('sends nothing when the form is unchanged', () => {
    const result = validateUpdateForm(priyaValues, testRoleCatalog, priya);

    expect(result).toEqual({ ok: true, value: {} });
  });

  it('treats a reformatted salary as unchanged', () => {
    const result = validateUpdateForm({ ...priyaValues, annualSalary: '95000' }, testRoleCatalog, priya);

    expect(result).toEqual({ ok: true, value: {} });
  });

  it('sends a cleared phone as null', () => {
    const result = validateUpdateForm({ ...priyaValues, phone: '' }, testRoleCatalog, priya);

    expect(result).toEqual({ ok: true, value: { phone: null } });
  });

  it('still validates fields that did not change', () => {
    const result = validateUpdateForm({ ...priyaValues, firstName: '' }, testRoleCatalog, priya);

    expect(!result.ok && result.error.firstName).toBe('First name is required');
  });

  it('does not require a password or employee code', () => {
    const result = validateUpdateForm({ ...priyaValues, password: '', employeeCode: '' }, testRoleCatalog, priya);

    expect(result.ok).toBe(true);
  });
});
