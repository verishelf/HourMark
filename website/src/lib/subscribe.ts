const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidSubscribeEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.length <= 320 && EMAIL_PATTERN.test(normalized);
}

export function normalizeSubscribeEmail(email: string): string {
  return email.trim().toLowerCase();
}
