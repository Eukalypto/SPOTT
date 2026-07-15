import type { AuthErrorCode } from '../types';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;

  constructor(code: AuthErrorCode, status: number) {
    super(code);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
  }
}
