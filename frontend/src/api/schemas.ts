import { z } from "zod";

export const ErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const LoginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.literal("bearer"),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export const CurrentUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.enum(["ADMIN", "HR_MANAGER", "EMPLOYEE"]),
  permissions: z.array(z.string()),
});

export type CurrentUser = z.infer<typeof CurrentUserSchema>;

export const EmployeeSchema = z.object({
  id: z.string(),
  employee_code: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string(),
  department: z.string(),
  job_title: z.string(),
  hire_date: z.string(),
  is_active: z.boolean(),
  employment_type: z.enum(["FULL_TIME", "CONTRACT"]),
});

export type Employee = z.infer<typeof EmployeeSchema>;

export const PaginatedEmployeesSchema = z.object({
  items: z.array(EmployeeSchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number(),
});

export type PaginatedEmployees = z.infer<typeof PaginatedEmployeesSchema>;
