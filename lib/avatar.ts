/** Returns a trimmed avatar URL, or null when the user has no profile photo. */
export function resolveAvatarUri(uri?: string | null): string | null {
  const value = uri?.trim();
  return value || null;
}
