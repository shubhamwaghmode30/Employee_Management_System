import { type ApiClient, createApiClient, type FetchFunction } from '../api/api-client';
import { refreshAccessToken } from '../api/auth-api';
import type { StoredTokens, TokenStorage } from '../storage/token-storage';

const sessionExpiredNotice = 'Your session has expired. Please sign in again.';

type AuthClientsOptions = {
  baseUrl: string;
  storage: TokenStorage;
  fetchFunction: FetchFunction | undefined;
  onSessionEnded: (notice: string | null) => void;
};

export type AuthClients = {
  /** For login and refresh only, so a failed refresh can never trigger another refresh. */
  publicClient: ApiClient;
  /** Sends the access token and renews it once when the server answers 401. */
  authenticatedClient: ApiClient;
  setTokens(tokens: StoredTokens | null): void;
  endSession(notice: string | null): Promise<void>;
};

/** Holds the session tokens and builds the API clients that read them. */
export function createAuthClients({
  baseUrl,
  storage,
  fetchFunction,
  onSessionEnded,
}: AuthClientsOptions): AuthClients {
  let tokens: StoredTokens | null = null;
  let refreshInFlight: Promise<boolean> | null = null;
  const fetchOption = fetchFunction === undefined ? {} : { fetchFunction };

  const publicClient = createApiClient({ baseUrl, getAccessToken: () => null, ...fetchOption });

  async function endSession(notice: string | null) {
    tokens = null;
    await storage.clearTokens();
    onSessionEnded(notice);
  }

  async function renewAccessToken(): Promise<boolean> {
    if (tokens === null) {
      return false;
    }
    const { refreshToken } = tokens;
    const result = await refreshAccessToken(publicClient, refreshToken);
    if (!result.ok) {
      await endSession(sessionExpiredNotice);
      return false;
    }
    tokens = { accessToken: result.value, refreshToken };
    await storage.saveTokens(tokens);
    return true;
  }

  const authenticatedClient = createApiClient({
    baseUrl,
    getAccessToken: () => tokens?.accessToken ?? null,
    // Requests that fail together share one refresh instead of racing.
    onUnauthorized() {
      refreshInFlight ??= renewAccessToken().finally(() => {
        refreshInFlight = null;
      });
      return refreshInFlight;
    },
    ...fetchOption,
  });

  return {
    publicClient,
    authenticatedClient,
    setTokens(nextTokens) {
      tokens = nextTokens;
    },
    endSession,
  };
}
