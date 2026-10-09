import {
  type EmployeeFormValues,
  emptyEmployeeFormValues,
  formValuesFromEmployee,
  validateCreateForm,
  validateUpdateForm,
} from '../src/features/employees/employee-form-values';
import { employeeSchema } from '../src/features/employees/employee-schemas';
import mockEmployees from '../src/features/employees/mock-employees.json';

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
    expect(validateCreateForm(validFullTime)).toEqual({
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
    const result = validateCreateForm({ ...validContract, annualSalary: 'left over from full time' });

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
    const result = validateCreateForm(emptyEmployeeFormValues);

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
      },
    });
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
    const result = validateCreateForm({ ...validFullTime, ...override });

    expect(result.ok).toBe(false);
    expect(!result.ok && result.error[field]).toBe(message);
  });

  it('rejects a contract that ends before the hire date', () => {
    const result = validateCreateForm({ ...validContract, contractEndDate: '2026-09-30' });

    expect(!result.ok && result.error.contractEndDate).toBe(
      'Contract end date cannot be before the hire date',
    );
  });
});

describe('validateUpdateForm', () => {
  it('round-trips an existing employee without sending a password', () => {
    const priya = employeeSchema.parse(mockEmployees[0]);

    const result = validateUpdateForm({ ...formValuesFromEmployee(priya), isActive: false });

    expect(result).toEqual({
      ok: true,
      value: {
        first_name: 'Priya',
        last_name: 'Sharma',
        email: 'priya.sharma@company.com',
        phone: '+91 98765 43210',
        department: 'Human Resources',
        job_title: 'HR Manager',
        hire_date: '2019-04-15T00:00:00Z',
        role_id: 2,
        is_active: false,
        employment_type: 'FULL_TIME',
        annual_salary: '95000.00',
      },
    });
  });

  it('does not require a password or employee code', () => {
    const result = validateUpdateForm({ ...validFullTime, password: '', employeeCode: '' });

    expect(result.ok).toBe(true);
  });
});
