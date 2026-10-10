import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import type { ApiClient, FetchFunction } from '../api/api-client';
import { getApiBaseUrl } from '../api/api-config';
import type { ApiError } from '../api/api-error';
import { getCurrentUser, logIn } from '../api/auth-api';
import type { CurrentUser } from '../api/schemas/auth';
import { type TokenStorage, tokenStorage } from '../storage/token-storage';
import type { Result } from '../types/result';
import type { SessionUser } from '../types/session-user';
import { createAuthClients } from './auth-clients';

export type AuthState =
  | { status: 'restoring' }
  | { status: 'signed_out'; notice: string | null }
  | { status: 'signed_in'; user: SessionUser };

type AuthContextValue = {
  state: AuthState;
  apiClient: ApiClient;
  signIn(email: string, password: string): Promise<Result<SessionUser, ApiError>>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  storage?: TokenStorage;
  baseUrl?: string;
  fetchFunction?: FetchFunction;
};

export function toSessionUser(currentUser: CurrentUser): SessionUser {
  return {
    id: currentUser.id,
    firstName: currentUser.first_name,
    lastName: currentUser.last_name,
    fullName: `${currentUser.first_name} ${currentUser.last_name}`,
    email: currentUser.email,
    role: currentUser.role,
    permissions: currentUser.permissions,
  };
}

/** Owns the signed-in user and the API client every screen uses. */
export function AuthProvider({ children, storage = tokenStorage, baseUrl, fetchFunction }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({ status: 'restoring' });
  const [clients] = useState(() =>
    createAuthClients({
      baseUrl: baseUrl ?? getApiBaseUrl(),
      storage,
      fetchFunction,
      onSessionEnded: (notice) => setState({ status: 'signed_out', notice }),
    }),
  );

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedTokens = await storage.getTokens();
      if (storedTokens === null) {
        if (isMounted) {
          setState({ status: 'signed_out', notice: null });
        }
        return;
      }
      clients.setTokens(storedTokens);
      const result = await getCurrentUser(clients.authenticatedClient);
      if (!isMounted) {
        return;
      }
      if (result.ok) {
        setState({ status: 'signed_in', user: toSessionUser(result.value) });
      } else {
        await clients.endSession(null);
      }
    }

    void restoreSession();
    return () => {
      isMounted = false;
    };
  }, [clients, storage]);

  async function signIn(email: string, password: string): Promise<Result<SessionUser, ApiError>> {
    const login = await logIn(clients.publicClient, email, password);
    if (!login.ok) {
      return login;
    }
    const tokens = { accessToken: login.value.access_token, refreshToken: login.value.refresh_token };
    clients.setTokens(tokens);
    const currentUser = await getCurrentUser(clients.authenticatedClient);
    if (!currentUser.ok) {
      clients.setTokens(null);
      return currentUser;
    }
    await storage.saveTokens(tokens);
    const user = toSessionUser(currentUser.value);
    setState({ status: 'signed_in', user });
    return { ok: true, value: user };
  }

  const value: AuthContextValue = {
    state,
    apiClient: clients.authenticatedClient,
    signIn,
    signOut: () => clients.endSession(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
}
