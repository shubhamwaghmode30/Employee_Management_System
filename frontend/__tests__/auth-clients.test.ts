import { z } from 'zod';

import type { FetchFunction } from '../src/api/api-client';
import { createAuthClients } from '../src/auth/auth-clients';
import { createTokenStorage, type KeyValueStore } from '../src/storage/token-storage';

const baseUrl = 'http://localhost:8000/api/v1';

function json(status: number, body: object): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function memoryStore(): KeyValueStore & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
    removeItem: async (key) => {
      values.delete(key);
    },
  };
}

/** Accepts only the fresh token, and hands one out for the right refresh token. */
function setup(refreshResponse: Response) {
  const fetchFunction = jest.fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>(async (url, init) => {
    if (url.endsWith('/auth/refresh')) {
      return refreshResponse.clone();
    }
    const authorization = new Headers(init.headers).get('Authorization');
    return authorization === 'Bearer fresh-access'
      ? json(200, { status: 'ok' })
      : json(401, { code: 'UNAUTHORIZED', message: 'Token expired' });
  });
  const store = memoryStore();
  const storage = createTokenStorage(store);
  const onSessionEnded = jest.fn();
  const clients = createAuthClients({ baseUrl, storage, fetchFunction, onSessionEnded });
  clients.setTokens({ accessToken: 'stale-access', refreshToken: 'refresh-priya' });
  return { clients, fetchFunction, store, onSessionEnded };
}

const healthSchema = z.object({ status: z.literal('ok') });

describe('createAuthClients', () => {
  it('refreshes an expired access token once and retries the request', async () => {
    const { clients, fetchFunction, store } = setup(
      json(200, { access_token: 'fresh-access', token_type: 'bearer' }),
    );

    const result = await clients.authenticatedClient.request('/health', { schema: healthSchema });

    expect(result).toEqual({ ok: true, value: { status: 'ok' } });
    expect(fetchFunction).toHaveBeenCalledTimes(3);
    expect(store.values.get('ems.access_token')).toBe('fresh-access');
    expect(store.values.get('ems.refresh_token')).toBe('refresh-priya');
  });

  it('shares one refresh between requests that fail together', async () => {
    const { clients, fetchFunction } = setup(json(200, { access_token: 'fresh-access', token_type: 'bearer' }));

    await Promise.all([
      clients.authenticatedClient.request('/health', { schema: healthSchema }),
      clients.authenticatedClient.request('/health', { schema: healthSchema }),
    ]);

    const refreshCalls = fetchFunction.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
  });

  it('ends the session with a notice when the refresh token is rejected', async () => {
    const { clients, store, onSessionEnded } = setup(json(401, { code: 'UNAUTHORIZED', message: 'Expired' }));
    await store.setItem('ems.access_token', 'stale-access');

    const result = await clients.authenticatedClient.request('/health', { schema: healthSchema });

    expect(result).toMatchObject({ ok: false, error: { kind: 'unauthorized' } });
    expect(onSessionEnded).toHaveBeenCalledWith('Your session has expired. Please sign in again.');
    expect(store.values.size).toBe(0);
  });

  it('never refreshes from the public client', async () => {
    const { clients, fetchFunction } = setup(json(200, { access_token: 'fresh-access', token_type: 'bearer' }));

    const result = await clients.publicClient.request('/health', { schema: healthSchema });

    expect(result).toMatchObject({ ok: false, error: { kind: 'unauthorized' } });
    expect(fetchFunction).toHaveBeenCalledTimes(1);
  });
});
