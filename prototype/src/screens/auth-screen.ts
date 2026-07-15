import { logIn, signUp, type AuthResponse } from '../api/auth-api.js';
import type { ApiError } from '../api/client.js';
import { t, type TranslationKey, type UiLocale } from '../i18n/index.js';
import { escapeHtml } from '../utils/html.js';

export type AuthMode = 'login' | 'signup';

export interface AuthScreenOptions {
  locale: UiLocale;
  onAuthenticated: (result: AuthResponse) => void;
  onContinueAsGuest: () => void;
  onBack: () => void;
}

function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'error' in error &&
    typeof (error as ApiError).error === 'string'
  );
}

export function authErrorMessageKey(error: unknown): TranslationKey {
  if (isApiError(error)) {
    switch (error.error) {
      case 'email-taken':
        return 'authErrorEmailTaken';
      case 'username-taken':
        return 'authErrorUsernameTaken';
      case 'invalid-credentials':
        return 'authErrorInvalidCredentials';
      default:
        break;
    }
  }

  if (error instanceof TypeError) {
    return 'authErrorNetwork';
  }

  return 'authErrorUnknown';
}

function buildAuthFormHtml(mode: AuthMode, locale: UiLocale, errorMessage: string): string {
  const errorHtml =
    errorMessage.length > 0
      ? `<p class="auth-form__error" role="alert">${escapeHtml(errorMessage)}</p>`
      : `<p class="auth-form__error" role="alert" hidden></p>`;

  const usernameField =
    mode === 'signup'
      ? `
        <label class="auth-form__field">
          <span class="auth-form__label">${escapeHtml(t('authUsername', locale))}</span>
          <input
            class="auth-form__input"
            type="text"
            name="username"
            autocomplete="username"
            required
            maxlength="40"
          />
        </label>
      `
      : '';

  return `
    <form class="auth-form" data-auth-form="${mode}" novalidate>
      <label class="auth-form__field">
        <span class="auth-form__label">${escapeHtml(t('authEmail', locale))}</span>
        <input
          class="auth-form__input"
          type="email"
          name="email"
          autocomplete="email"
          required
        />
      </label>
      ${usernameField}
      <label class="auth-form__field">
        <span class="auth-form__label">${escapeHtml(t('authPassword', locale))}</span>
        <input
          class="auth-form__input"
          type="password"
          name="password"
          autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}"
          required
          minlength="8"
        />
      </label>
      ${errorHtml}
      <button type="submit" class="primary-button auth-form__submit">
        ${escapeHtml(t(mode === 'login' ? 'authSubmitLogin' : 'authSubmitSignUp', locale))}
      </button>
    </form>
  `;
}

export function buildAuthScreenHtml(
  options: AuthScreenOptions,
  mode: AuthMode = 'login',
  errorMessage = '',
): string {
  const loginSelected = mode === 'login' ? ' auth-tabs__tab--active' : '';
  const signupSelected = mode === 'signup' ? ' auth-tabs__tab--active' : '';

  return `
    <section class="screen screen--auth screen-centered" aria-labelledby="auth-title">
      <div class="screen-centered__stack">
        <header class="screen-header">
          <button type="button" class="text-button screen-header__back" data-action="back">
            ${escapeHtml(t('backToHome', options.locale))}
          </button>
          <h2 id="auth-title" class="screen-header__title">${escapeHtml(t('authTitle', options.locale))}</h2>
        </header>

        <div class="settings-panel auth-panel">
          <div class="auth-tabs" role="tablist" aria-label="${escapeHtml(t('authTitle', options.locale))}">
            <button
              type="button"
              class="auth-tabs__tab${loginSelected}"
              role="tab"
              aria-selected="${mode === 'login' ? 'true' : 'false'}"
              data-action="tab-login"
            >
              ${escapeHtml(t('authTabLogin', options.locale))}
            </button>
            <button
              type="button"
              class="auth-tabs__tab${signupSelected}"
              role="tab"
              aria-selected="${mode === 'signup' ? 'true' : 'false'}"
              data-action="tab-signup"
            >
              ${escapeHtml(t('authTabSignUp', options.locale))}
            </button>
          </div>

          <div data-auth-form-host>
            ${buildAuthFormHtml(mode, options.locale, errorMessage)}
          </div>

          <button type="button" class="text-button auth-panel__guest" data-action="guest">
            ${escapeHtml(t('authContinueAsGuest', options.locale))}
          </button>
        </div>
      </div>
    </section>
  `;
}

export function renderAuthScreen(container: HTMLElement, options: AuthScreenOptions): void {
  let mode: AuthMode = 'login';
  let errorMessage = '';
  let submitting = false;

  const paint = (): void => {
    container.innerHTML = buildAuthScreenHtml(options, mode, errorMessage);
    bind();
  };

  const setError = (message: string): void => {
    errorMessage = message;
    const errorEl = container.querySelector<HTMLElement>('.auth-form__error');
    if (!errorEl) {
      paint();
      return;
    }
    if (message.length === 0) {
      errorEl.hidden = true;
      errorEl.textContent = '';
      return;
    }
    errorEl.hidden = false;
    errorEl.textContent = message;
  };

  const bind = (): void => {
    container.querySelector<HTMLButtonElement>('[data-action="back"]')?.addEventListener(
      'click',
      options.onBack,
    );
    container.querySelector<HTMLButtonElement>('[data-action="guest"]')?.addEventListener(
      'click',
      options.onContinueAsGuest,
    );
    container.querySelector<HTMLButtonElement>('[data-action="tab-login"]')?.addEventListener(
      'click',
      () => {
        if (mode === 'login' || submitting) {
          return;
        }
        mode = 'login';
        errorMessage = '';
        paint();
      },
    );
    container.querySelector<HTMLButtonElement>('[data-action="tab-signup"]')?.addEventListener(
      'click',
      () => {
        if (mode === 'signup' || submitting) {
          return;
        }
        mode = 'signup';
        errorMessage = '';
        paint();
      },
    );

    const form = container.querySelector<HTMLFormElement>('[data-auth-form]');
    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      void handleSubmit(form);
    });
  };

  const handleSubmit = async (form: HTMLFormElement): Promise<void> => {
    if (submitting) {
      return;
    }

    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const username = String(formData.get('username') ?? '').trim();

    if (!email || password.length < 8 || (mode === 'signup' && !username)) {
      setError(t('authErrorUnknown', options.locale));
      return;
    }

    submitting = true;
    const submitButton = form.querySelector<HTMLButtonElement>('.auth-form__submit');
    if (submitButton) {
      submitButton.disabled = true;
    }
    setError('');

    try {
      const result =
        mode === 'login'
          ? await logIn(email, password)
          : await signUp(email, username, password);
      options.onAuthenticated(result);
    } catch (error) {
      setError(t(authErrorMessageKey(error), options.locale));
      submitting = false;
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  };

  paint();
}
