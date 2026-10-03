import { z } from 'zod';

import {
  type AccessTokenProvider,
  type ApiClient,
  createApiClient,
  type FetchFunction,
  type JsonValue,
} from '../src/api/api-client';
import { healthResponseSchema } from '../src/api/schemas/health-response';

const baseUrl = 'http://localhost:8000/api/v1';
const accessToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJwcml5YS5zaGFybWFAY29tcGFueS5jb20ifQ.signature';

function jsonResponse(status: number, body: JsonValue): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function setup(responseOrError: Response | Error, getAccessToken: AccessTokenProvider = () => null) {
  const fetchFunction = jest.fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>();
  if (responseOrError instanceof Error) {
    fetchFunction.mockRejectedValue(responseOrError);
  } else {
    fetchFunction.mockResolvedValue(responseOrError);
  }
  const client: ApiClient = createApiClient({ baseUrl, getAccessToken, fetchFunction });
  return { client, fetchFunction };
}

describe('createApiClient', () => {
  it('returns the validated body on success', async () => {
    const { client, fetchFunction } = setup(jsonResponse(200, { status: 'ok' }));

    const result = await client.request('/health', { schema: healthResponseSchema });

    expect(result).toEqual({ ok: true, value: { status: 'ok' } });
    expect(fetchFunction).toHaveBeenCalledWith(`${baseUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
  });

  it('adds a Bearer header when an access token is available', async () => {
    const { client, fetchFunction } = setup(jsonResponse(200, { status: 'ok' }), async () => accessToken);

    await client.request('/health', { schema: healthResponseSchema });

    expect(fetchFunction).toHaveBeenCalledWith(`${baseUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
    });
  });

  it('maps 401 to an unauthorized error with the backend code and message', async () => {
    const { client } = setup(
      jsonResponse(401, { code: 'NOT_AUTHENTICATED', message: 'Invalid or expired access token' }),
    );

    const result = await client.request('/auth/me', { schema: healthResponseSchema });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'unauthorized',
        status: 401,
        code: 'NOT_AUTHENTICATED',
        message: 'Invalid or expired access token',
      },
    });
  });

  it('maps 422 to a validation error with the backend code and message', async () => {
    const { client } = setup(
      jsonResponse(422, {
        code: 'VALIDATION_ERROR',
        message: 'email: value is not a valid email address',
      }),
    );

    const result = await client.request('/employees', {
      schema: healthResponseSchema,
      method: 'POST',
      body: { email: 'priya.sharma' },
    });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'validation',
        status: 422,
        code: 'VALIDATION_ERROR',
        message: 'email: value is not a valid email address',
      },
    });
  });

  it('returns a network error when the request cannot be sent', async () => {
    const { client } = setup(new TypeError('Network request failed'));

    const result = await client.request('/health', { schema: healthResponseSchema });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'network',
        message: 'Unable to reach the server. Check your connection and try again.',
      },
    });
  });

  it('returns invalid_response when the body does not match the schema', async () => {
    const { client } = setup(jsonResponse(200, { status: 'degraded' }));

    const result = await client.request('/health', { schema: healthResponseSchema });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'invalid_response', message: 'The server returned an unexpected response.' },
    });
  });

  it('falls back to a status message when the error body is not JSON', async () => {
    const { client } = setup(
      new Response('<html>Bad Gateway</html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      }),
    );

    const result = await client.request('/health', { schema: healthResponseSchema });

    expect(result).toEqual({
      ok: false,
      error: { kind: 'server', status: 502, code: null, message: 'Request failed with status 502.' },
    });
  });

  it('sends a JSON body and builds the query string, skipping undefined values', async () => {
    const { client, fetchFunction } = setup(jsonResponse(200, { status: 'ok' }));

    await client.request('/employees', {
      schema: healthResponseSchema,
      method: 'PATCH',
      query: { page: 2, department: 'Engineering', q: undefined, is_active: true },
      body: { job_title: 'Senior Software Engineer' },
    });

    expect(fetchFunction).toHaveBeenCalledWith(
      `${baseUrl}/employees?page=2&department=Engineering&is_active=true`,
      {
        method: 'PATCH',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_title: 'Senior Software Engineer' }),
      },
    );
  });

  it('treats 204 No Content as a null body', async () => {
    const { client } = setup(new Response(null, { status: 204 }));

    const result = await client.request('/employees/7f3c2a10', {
      schema: z.null(),
      method: 'DELETE',
    });

    expect(result).toEqual({ ok: true, value: null });
  });
});
