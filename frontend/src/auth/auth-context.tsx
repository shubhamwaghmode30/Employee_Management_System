import React, { createContext, useContext, useReducer, useEffect } from "react";
import { login, getCurrentUser, type CurrentUser } from "../api/client";
import { getTokenStorage } from "../storage/token-storage";

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: CurrentUser };

type AuthAction =
  | { type: "SET_LOADING" }
  | { type: "SET_UNAUTHENTICATED" }
  | { type: "SET_AUTHENTICATED"; user: CurrentUser };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { status: "loading" };
    case "SET_UNAUTHENTICATED":
      return { status: "unauthenticated" };
    case "SET_AUTHENTICATED":
      return { status: "authenticated", user: action.user };
    default:
      return state;
  }
}

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, { status: "loading" });
  const tokenStorage = getTokenStorage();

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    const token = await tokenStorage.getAccessToken();
    if (!token) {
      dispatch({ type: "SET_UNAUTHENTICATED" });
      return;
    }

    const result = await getCurrentUser();
    if (result.success) {
      dispatch({ type: "SET_AUTHENTICATED", user: result.data });
    } else {
      await tokenStorage.removeAccessToken();
      dispatch({ type: "SET_UNAUTHENTICATED" });
    }
  }

  async function handleLogin(email: string, password: string) {
    dispatch({ type: "SET_LOADING" });
    const result = await login(email, password);
    if (!result.success) {
      dispatch({ type: "SET_UNAUTHENTICATED" });
      throw new Error(result.error.message);
    }

    await tokenStorage.setAccessToken(result.data.access_token);
    const userResult = await getCurrentUser();
    if (userResult.success) {
      dispatch({ type: "SET_AUTHENTICATED", user: userResult.data });
    } else {
      await tokenStorage.removeAccessToken();
      dispatch({ type: "SET_UNAUTHENTICATED" });
      throw new Error("Failed to fetch user");
    }
  }

  async function handleLogout() {
    await tokenStorage.removeAccessToken();
    dispatch({ type: "SET_UNAUTHENTICATED" });
  }

  return (
    <AuthContext.Provider value={{ state, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function usePermissions() {
  const { state } = useAuth();
  return state.status === "authenticated" ? state.user.permissions : [];
}
