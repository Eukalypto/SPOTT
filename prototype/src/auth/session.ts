import type { AppState } from '../types.js';

export const AUTH_TOKEN_STORAGE_KEY = 'spott.authToken';

export interface TokenStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

function getDefaultStorage(): TokenStorage | null {
  try {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage;
  } catch {
    return null;
  }
}

export function saveToken(
  token: string,
  storage: TokenStorage | null = getDefaultStorage(),
): void {
  if (!storage || token.length === 0) {
    return;
  }
  storage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearToken(storage: TokenStorage | null = getDefaultStorage()): void {
  if (!storage) {
    return;
  }

  if (storage.removeItem) {
    storage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return;
  }

  storage.setItem(AUTH_TOKEN_STORAGE_KEY, '');
}

export function getToken(storage: TokenStorage | null = getDefaultStorage()): string | null {
  if (!storage) {
    return null;
  }

  const token = storage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token === null || token.length === 0) {
    return null;
  }
  return token;
}

export function isAuthenticated(appState: AppState): boolean {
  return appState.auth.status === 'authenticated' && appState.auth.token !== null;
}
