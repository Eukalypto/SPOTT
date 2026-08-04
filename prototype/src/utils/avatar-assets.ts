const avatarModules = import.meta.glob('../assets/avatars/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function fileNameToAvatarId(path: string): string {
  const fileName = path.split('/').pop() ?? '';
  return fileName.replace(/\.png$/i, '');
}

const AVATAR_URLS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(avatarModules).map(([path, url]) => [fileNameToAvatarId(path), url]),
);

/** Avatar ids in a stable, display-friendly order for the picker grid. */
export const AVATAR_IDS: readonly string[] = Object.keys(AVATAR_URLS).sort((a, b) =>
  a.localeCompare(b),
);

export function getAvatarUrl(avatarId: string | null | undefined): string | undefined {
  if (!avatarId) {
    return undefined;
  }
  return AVATAR_URLS[avatarId];
}

export function isKnownAvatarId(avatarId: string): boolean {
  return avatarId in AVATAR_URLS;
}
