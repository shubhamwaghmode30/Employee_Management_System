import type { Employee, EmploymentType } from './employee-schemas';

export const employmentTypeLabels: Record<EmploymentType, string> = {
  FULL_TIME: 'Full time',
  CONTRACT: 'Contract',
};

export function getFullName(employee: Employee): string {
  return `${employee.first_name} ${employee.last_name}`;
}

/** Formats a backend decimal string the way the backend summary labels do ($ and two decimals). */
export function formatMoney(amount: string): string {
  const formatted = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${formatted}`;
}

/** Dates are stored as UTC midnight, so format in UTC to avoid showing the previous day. */
export function formatDate(isoDateTime: string): string {
  return new Date(isoDateTime).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
