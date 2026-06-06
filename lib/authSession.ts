/** True when persisted session tokens were revoked or expired on the server. */
export function isInvalidRefreshTokenError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { message?: string; code?: string };
  const message = e.message?.toLowerCase() ?? "";
  return (
    e.code === "refresh_token_not_found" ||
    message.includes("invalid refresh token") ||
    message.includes("refresh token not found")
  );
}
