import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export interface TokenStorage {
  getAccessToken(): Promise<string | null>;
  setAccessToken(token: string): Promise<void>;
  removeAccessToken(): Promise<void>;
}

class SecureStoreTokenStorage implements TokenStorage {
  private readonly key = "access_token";

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(this.key);
  }

  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(this.key, token);
  }

  async removeAccessToken(): Promise<void> {
    await SecureStore.deleteItemAsync(this.key);
  }
}

class WebTokenStorage implements TokenStorage {
  private readonly key = "access_token";

  async getAccessToken(): Promise<string | null> {
    // web storage is weaker than native - httpOnly cookies are recommended for production
    if (typeof window === "undefined") return null;
    return localStorage.getItem(this.key);
  }

  async setAccessToken(token: string): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.setItem(this.key, token);
  }

  async removeAccessToken(): Promise<void> {
    if (typeof window === "undefined") return;
    localStorage.removeItem(this.key);
  }
}

export function getTokenStorage(): TokenStorage {
  if (Platform.OS === "web") {
    return new WebTokenStorage();
  }
  return new SecureStoreTokenStorage();
}
