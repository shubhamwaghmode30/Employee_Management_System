import { z } from 'zod';

import { employeeSummarySchema } from './employee-schemas';

/** Mirrors EmployeeStats in backend app/schemas/employee_stats.py. */
export const employeeStatsSchema = z.object({
  total: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  inactive: z.number().int().nonnegative(),
  full_time: z.number().int().nonnegative(),
  contract: z.number().int().nonnegative(),
  by_department: z.array(z.object({ department: z.string(), count: z.number().int().nonnegative() })),
  by_role: z.array(
    z.object({ role: z.enum(['ADMIN', 'HR_MANAGER', 'EMPLOYEE']), count: z.number().int().nonnegative() }),
  ),
  recent_hires: z.array(employeeSummarySchema),
});

export type EmployeeStats = z.infer<typeof employeeStatsSchema>;
