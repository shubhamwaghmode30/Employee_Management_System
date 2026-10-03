import { z } from 'zod';

const developmentApiUrl = 'http://localhost:8000/api/v1';

const apiUrlSchema = z.url({ protocol: /^https?$/ });

/**
 * Reads EXPO_PUBLIC_API_URL, which Expo inlines at build time.
 *
 * Development builds fall back to the local backend; release builds must set it
 * so they never silently call localhost on a user's device.
 */
export function getApiBaseUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL;
  if (configuredUrl === undefined || configuredUrl === '') {
    if (__DEV__) {
      return developmentApiUrl;
    }
    throw new Error('EXPO_PUBLIC_API_URL must be set for release builds');
  }

  const parsed = apiUrlSchema.safeParse(configuredUrl);
  if (!parsed.success) {
    throw new Error(`EXPO_PUBLIC_API_URL is not a valid http(s) URL: ${configuredUrl}`);
  }
  return parsed.data.replace(/\/+$/, '');
}
