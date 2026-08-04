import type { LanguageCode } from '@spott/engine';

import { apiRequest } from './client.js';
import type { ApiUser } from './auth-api.js';

export function updateLanguagePref(
  token: string,
  language: LanguageCode,
): Promise<{ user: ApiUser }> {
  return apiRequest<{ user: ApiUser }>('PATCH', '/settings', { language }, token);
}

export function updateAvatar(token: string, avatarId: string): Promise<{ user: ApiUser }> {
  return apiRequest<{ user: ApiUser }>('PATCH', '/settings', { avatarId }, token);
}
