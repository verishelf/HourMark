/** True when Supabase is down, timed out, or returned a non-API response. */
export function shouldFallbackToMock(error: unknown): boolean {
  const message = getErrorMessage(error);
  if (!message) return false;

  return (
    message.includes("<!DOCTYPE") ||
    message.includes("522") ||
    message.includes("Failed to fetch") ||
    message.includes("Network request failed") ||
    message.includes("fetch failed") ||
    message.includes("does not exist") ||
    message.includes("PGRST") ||
    message.includes("JWT")
  );
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "";
}

export function toUserFacingError(error: unknown, fallback: string): string {
  const message = getErrorMessage(error);
  if (!message || message.includes("<!DOCTYPE")) {
    return fallback;
  }
  return message.length > 120 ? fallback : message;
}
