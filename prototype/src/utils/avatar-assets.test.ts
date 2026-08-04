import { describe, expect, it } from 'vitest';

import { AVATAR_IDS, getAvatarUrl, isKnownAvatarId } from './avatar-assets.js';

describe('avatar assets', () => {
  it('resolves all 46 avatar ids with unique urls', () => {
    expect(AVATAR_IDS.length).toBe(46);
    expect(new Set(AVATAR_IDS).size).toBe(46);
    expect(AVATAR_IDS).toContain('Bob');
    expect(AVATAR_IDS).toContain('Spott-avatars');
  });

  it('resolves a url for a known avatar and undefined for unknown/empty', () => {
    expect(getAvatarUrl('Bob')).toBeTruthy();
    expect(getAvatarUrl('NotARealAvatar')).toBeUndefined();
    expect(getAvatarUrl(null)).toBeUndefined();
    expect(getAvatarUrl(undefined)).toBeUndefined();
  });

  it('reports known vs unknown avatar ids', () => {
    expect(isKnownAvatarId('Bob')).toBe(true);
    expect(isKnownAvatarId('NotARealAvatar')).toBe(false);
  });
});
