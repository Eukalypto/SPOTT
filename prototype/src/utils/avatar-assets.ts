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

/** Generic placeholder shown for guests or accounts without a chosen avatar. */
export const GENERIC_AVATAR_ICON = `
  <svg viewBox="0 0 24 24" focusable="false">
    <path
      fill="currentColor"
      d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
    />
  </svg>
`;
