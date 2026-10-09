import { z } from "zod";
import {
  ErrorResponseSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  CurrentUserSchema,
  PaginatedEmployeesSchema,
  type ErrorResponse,
  type LoginResponse,
  type CurrentUser,
  type PaginatedEmployees,
  type Employee,
} from "./schemas";
import { getTokenStorage } from "../storage/token-storage";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS === "true";

type Result<T, E = ErrorResponse> =
  | { success: true; data: T }
  | { success: false; error: E };

class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options?: RequestInit,
  schema?: z.ZodSchema<T>
): Promise<Result<T>> {
  if (USE_MOCKS) {
    return mockRequest(endpoint, options, schema);
  }

  try {
    const tokenStorage = getTokenStorage();
    const token = await tokenStorage.getAccessToken();
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options?.headers as Record<string, string>,
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const text = await response.text();

    if (!response.ok) {
      try {
        const error = ErrorResponseSchema.parse(JSON.parse(text));
        return { success: false, error };
      } catch {
        return {
          success: false,
          error: { code: "HTTP_ERROR", message: text || "Request failed" },
        };
      }
    }

    const data = JSON.parse(text);
    if (schema) {
      return { success: true, data: schema.parse(data) };
    }
    return { success: true, data } as Result<T>;
  } catch (e) {
    if (e instanceof Error) {
      return {
        success: false,
        error: { code: "NETWORK_ERROR", message: e.message },
      };
    }
    return {
      success: false,
      error: { code: "UNKNOWN_ERROR", message: "Unknown error" },
    };
  }
}

function mockRequest<T>(
  endpoint: string,
  _options?: RequestInit,
  schema?: z.ZodSchema<T>
): Result<T> {
  if (endpoint === "/auth/login") {
    const response: LoginResponse = {
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      token_type: "bearer",
    };
    return { success: true, data: response as T };
  }

  if (endpoint === "/auth/me") {
    const response: CurrentUser = {
      id: "admin-1",
      email: "admin@example.com",
      first_name: "Admin",
      last_name: "User",
      role: "ADMIN",
      permissions: [
        "EMPLOYEE_READ",
        "EMPLOYEE_CREATE",
        "EMPLOYEE_UPDATE",
        "EMPLOYEE_DELETE",
        "ROLE_ASSIGN",
      ],
    };
    return { success: true, data: response as T };
  }

  if (endpoint === "/employees") {
    const response: PaginatedEmployees = {
      items: Array.from({ length: 12 }, (_, i) => {
        const mod = i % 4;
        return {
          id: `emp-${i + 1}`,
          employee_code: `EMP${String(i + 1).padStart(3, "0")}`,
          first_name: ["John", "Jane", "Bob", "Alice"][mod] as string,
          last_name: ["Doe", "Smith", "Johnson", "Williams"][mod] as string,
          email: `employee${i + 1}@example.com`,
          department: ["Engineering", "HR", "Marketing", "Sales"][mod] as string,
          job_title: ["Engineer", "Manager", "Analyst", "Developer"][mod] as string,
          hire_date: "2024-01-15T00:00:00Z",
          is_active: i % 5 !== 0,
          employment_type: i % 2 === 0 ? "FULL_TIME" : "CONTRACT",
        };
      }),
      total: 12,
      page: 1,
      page_size: 10,
    };
    return { success: true, data: response as T };
  }

  return {
    success: false,
    error: { code: "NOT_FOUND", message: "Mock endpoint not found" },
  };
}

export async function login(
  email: string,
  password: string
): Promise<Result<LoginResponse>> {
  const validated = LoginRequestSchema.parse({ email, password });
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(validated),
  }, LoginResponseSchema);
}

export async function getCurrentUser(): Promise<Result<CurrentUser>> {
  return request("/auth/me", {}, CurrentUserSchema);
}

export async function getEmployees(
  params?: { page?: number; page_size?: number; q?: string }
): Promise<Result<PaginatedEmployees>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", params.page.toString());
  if (params?.page_size) query.set("page_size", params.page_size.toString());
  if (params?.q) query.set("q", params.q);

  const endpoint = `/employees${query.toString() ? `?${query.toString()}` : ""}`;
  return request(endpoint, {}, PaginatedEmployeesSchema);
}

export { ApiError, type Result, type Employee, type CurrentUser };
