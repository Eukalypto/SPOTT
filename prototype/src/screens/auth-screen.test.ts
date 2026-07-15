import { describe, expect, it } from 'vitest';

import { t } from '../i18n/index.js';
import { authErrorMessageKey, buildAuthScreenHtml } from './auth-screen.js';

describe('buildAuthScreenHtml', () => {
  it('renders login tab by default with guest continue', () => {
    const html = buildAuthScreenHtml({
      locale: 'en',
      onAuthenticated: () => {},
      onContinueAsGuest: () => {},
      onBack: () => {},
    });

    expect(html).toContain(t('authTitle', 'en'));
    expect(html).toContain(t('authTabLogin', 'en'));
    expect(html).toContain(t('authTabSignUp', 'en'));
    expect(html).toContain(t('authSubmitLogin', 'en'));
    expect(html).toContain(t('authContinueAsGuest', 'en'));
    expect(html).toContain('data-auth-form="login"');
    expect(html).not.toContain('name="username"');
  });

  it('renders signup fields when mode is signup', () => {
    const html = buildAuthScreenHtml(
      {
        locale: 'en',
        onAuthenticated: () => {},
        onContinueAsGuest: () => {},
        onBack: () => {},
      },
      'signup',
    );

    expect(html).toContain('data-auth-form="signup"');
    expect(html).toContain('name="username"');
    expect(html).toContain(t('authSubmitSignUp', 'en'));
  });
});

describe('authErrorMessageKey', () => {
  it('maps API error codes to translation keys', () => {
    expect(authErrorMessageKey({ status: 409, error: 'email-taken' })).toBe(
      'authErrorEmailTaken',
    );
    expect(authErrorMessageKey({ status: 409, error: 'username-taken' })).toBe(
      'authErrorUsernameTaken',
    );
    expect(authErrorMessageKey({ status: 401, error: 'invalid-credentials' })).toBe(
      'authErrorInvalidCredentials',
    );
  });

  it('maps network failures and unknown errors', () => {
    expect(authErrorMessageKey(new TypeError('Failed to fetch'))).toBe('authErrorNetwork');
    expect(authErrorMessageKey({ status: 500, error: 'boom' })).toBe('authErrorUnknown');
  });
});
