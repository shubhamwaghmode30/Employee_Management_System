import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type StoredTokens = {
  accessToken: string;
  refreshToken: string;
};

export type TokenStorage = {
  getTokens(): Promise<StoredTokens | null>;
  saveTokens(tokens: StoredTokens): Promise<void>;
  clearTokens(): Promise<void>;
};

const accessTokenKey = 'ems.access_token';
const refreshTokenKey = 'ems.refresh_token';

export type KeyValueStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const secureStore: KeyValueStore = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  removeItem: (key) => SecureStore.deleteItemAsync(key),
};

// The browser has no secure keychain. localStorage is readable by any script on
// the page, so production web builds should move to httpOnly cookies.
const browserStore: KeyValueStore = {
  async getItem(key) {
    return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
  },
  async setItem(key, value) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  },
  async removeItem(key) {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  },
};

export function createTokenStorage(store: KeyValueStore): TokenStorage {
  return {
    async getTokens() {
      const [accessToken, refreshToken] = await Promise.all([
        store.getItem(accessTokenKey),
        store.getItem(refreshTokenKey),
      ]);
      if (accessToken === null || refreshToken === null) {
        return null;
      }
      return { accessToken, refreshToken };
    },
    async saveTokens({ accessToken, refreshToken }) {
      await Promise.all([
        store.setItem(accessTokenKey, accessToken),
        store.setItem(refreshTokenKey, refreshToken),
      ]);
    },
    async clearTokens() {
      await Promise.all([store.removeItem(accessTokenKey), store.removeItem(refreshTokenKey)]);
    },
  };
}

/** Keychain or keystore on devices, localStorage on web. */
export const tokenStorage = createTokenStorage(Platform.OS === 'web' ? browserStore : secureStore);
