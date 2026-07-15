export type PublicUser = {
  id: string;
  email: string;
  username: string;
  languagePref: string;
  createdAt: number;
};

export type AuthSuccess = {
  user: PublicUser;
  token: string;
};

export type AuthErrorCode = 'email-taken' | 'username-taken' | 'invalid-credentials';

declare global {
  namespace Express {
    interface Request {
      userId?: string | null;
    }
  }
}

export {};
