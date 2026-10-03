import type { z } from 'zod';

import type { Result } from '../types/result';
import { type ApiError, getHttpErrorKind } from './api-error';
import { errorResponseSchema } from './schemas/error-response';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type QueryValue = string | number | boolean | undefined;

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type RequestOptions<T> = {
  schema: z.ZodType<T>;
  method?: HttpMethod;
  query?: Record<string, QueryValue>;
  body?: JsonValue;
};

export type AccessTokenProvider = () => string | null | Promise<string | null>;

export type FetchFunction = (input: string, init: RequestInit) => Promise<Response>;

export type ApiClientOptions = {
  baseUrl: string;
  getAccessToken: AccessTokenProvider;
  fetchFunction?: FetchFunction;
};

export type ApiClient = {
  request<T>(path: string, options: RequestOptions<T>): Promise<Result<T, ApiError>>;
};

const networkErrorMessage = 'Unable to reach the server. Check your connection and try again.';
const invalidResponseMessage = 'The server returned an unexpected response.';

export function createApiClient({
  baseUrl,
  getAccessToken,
  fetchFunction = (input, init) => fetch(input, init),
}: ApiClientOptions): ApiClient {
  async function request<T>(
    path: string,
    { schema, method = 'GET', query, body }: RequestOptions<T>,
  ): Promise<Result<T, ApiError>> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const accessToken = await getAccessToken();
    if (accessToken !== null) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    try {
      const response = await fetchFunction(buildUrl(baseUrl, path, query), init);
      if (!response.ok) {
        return { ok: false, error: await readHttpError(response) };
      }

      const parsed = schema.safeParse(response.status === 204 ? null : await response.json());
      if (!parsed.success) {
        return { ok: false, error: { kind: 'invalid_response', message: invalidResponseMessage } };
      }
      return { ok: true, value: parsed.data };
    } catch (error) {
      if (error instanceof TypeError) {
        return { ok: false, error: { kind: 'network', message: networkErrorMessage } };
      }
      if (error instanceof SyntaxError) {
        return { ok: false, error: { kind: 'invalid_response', message: invalidResponseMessage } };
      }
      // Anything else is a programming error, not a request outcome, so let it surface.
      throw error;
    }
  }

  return { request };
}

function buildUrl(baseUrl: string, path: string, query: Record<string, QueryValue> | undefined): string {
  const url = `${baseUrl}${path}`;
  if (query === undefined) {
    return url;
  }

  const searchParams = new URLSearchParams();
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined) {
      searchParams.append(name, String(value));
    }
  }
  const queryString = searchParams.toString();
  return queryString === '' ? url : `${url}?${queryString}`;
}

async function readHttpError(response: Response): Promise<ApiError> {
  const kind = getHttpErrorKind(response.status);
  const fallbackMessage = `Request failed with status ${response.status}.`;

  const isJson = response.headers.get('Content-Type')?.includes('application/json') ?? false;
  if (!isJson) {
    return { kind, status: response.status, code: null, message: fallbackMessage };
  }

  const parsed = errorResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    return { kind, status: response.status, code: null, message: fallbackMessage };
  }
  return { kind, status: response.status, code: parsed.data.code, message: parsed.data.message };
}
