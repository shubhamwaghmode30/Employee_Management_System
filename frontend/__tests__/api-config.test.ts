import { getApiBaseUrl } from '../src/api/api-config';

describe('getApiBaseUrl', () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    }
  });

  it('falls back to the local backend in development when unset', () => {
    delete process.env.EXPO_PUBLIC_API_URL;

    expect(getApiBaseUrl()).toBe('http://localhost:8000/api/v1');
  });

  it('uses the configured URL without a trailing slash', () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.company.com/api/v1/';

    expect(getApiBaseUrl()).toBe('https://api.company.com/api/v1');
  });

  it('rejects a value that is not an http(s) URL', () => {
    process.env.EXPO_PUBLIC_API_URL = 'api.company.com';

    expect(() => getApiBaseUrl()).toThrow('EXPO_PUBLIC_API_URL is not a valid http(s) URL');
  });
});
