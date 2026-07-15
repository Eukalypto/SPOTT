import { apiRequest } from './client.js';

export type ApiUser = {
  id: string;
  email: string;
  username: string;
  languagePref: string;
  createdAt: number;
};

export type AuthResponse = {
  user: ApiUser;
  token: string;
};

export function signUp(
  email: string,
  username: string,
  password: string,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('POST', '/auth/signup', {
    email,
    username,
    password,
  });
}

export function logIn(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('POST', '/auth/login', { email, password });
}

export function getMe(token: string): Promise<{ user: ApiUser }> {
  return apiRequest<{ user: ApiUser }>('GET', '/auth/me', undefined, token);
}

export function logout(token: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('POST', '/auth/logout', undefined, token);
}
