import type { Employee, EmploymentType } from './employee-schemas';

export const employmentTypeLabels: Record<EmploymentType, string> = {
  FULL_TIME: 'Full time',
  CONTRACT: 'Contract',
};

export function getFullName(employee: Employee): string {
  return `${employee.first_name} ${employee.last_name}`;
}
